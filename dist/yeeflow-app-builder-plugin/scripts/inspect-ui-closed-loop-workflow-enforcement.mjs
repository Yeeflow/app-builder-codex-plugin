#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CORE_STRUCTURE_CODES = new Set([
  "PAGE_MISSING",
  "SECTION_MISSING",
  "KPI_CARD_COUNT_MISMATCH",
  "TABLE_SECTION_MISSING",
  "TABLE_COLUMN_MISSING",
  "PAGE_LOOKS_LIKE_PLAIN_SCAFFOLD",
  "PLACEHOLDER_TEXT_VISIBLE",
  "RAW_VARIABLE_TEXT_VISIBLE",
]);

const DEFAULT_ARTIFACT_PATHS = {
  uiContractMarkdown: "docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md",
  uiContractJson: "docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json",
  scopeManifest: "docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json",
  runtimeEvidence: "dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json",
  structureFindings: "dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json",
  workflowFindings: "dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json",
};

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.workflow) usage(args.help ? 0 : 1);
  const report = inspectUiClosedLoopWorkflowEnforcement(args);
  const output = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, output);
  else process.stdout.write(output);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function inspectUiClosedLoopWorkflowEnforcement({
  workflow: workflowPath,
  strict = false,
  out,
  format = "json",
} = {}) {
  const findings = [];
  let workflow = {};

  if (!workflowPath) {
    addFinding(findings, "error", "WORKFLOW_REPORT_MISSING", "Workflow/report metadata path is required.");
  } else {
    try {
      workflow = normalizeWorkflow(readWorkflow(workflowPath));
    } catch (error) {
      addFinding(findings, "error", "WORKFLOW_REPORT_READ_FAILED", `Could not read workflow/report metadata: ${error.message}`);
    }
  }

  if (!findings.some((finding) => finding.severity === "error")) {
    enforceContract(workflow, findings);
    enforceScope(workflow, findings);
    enforceRuntimeEvidence(workflow, findings);
    enforceStructureComparison(workflow, findings);
    enforceDynamicKpi(workflow, findings);
    enforceFinalReport(workflow, findings);
    enforceLowRiskSchemaOnly(workflow, findings);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    summary: summarize(status, findings, strict),
    workflowPath: safePath(workflowPath),
    strict,
    findings,
    artifactSummary: artifactSummary(workflow),
    proofBoundary: [
      "Phase 3B validates workflow/report metadata only; it does not parse or mutate package payloads, call Yeeflow APIs, sign, install, upgrade, capture runtime evidence, or generate packages.",
      "High-quality UI and design-fidelity claims require the closed-loop artifact chain: UI contract, contract validation, scope manifest when upgrading, scope validation, runtime evidence, structure comparison findings, and final report paths.",
      "Package validation, signing, install, upgrade-check, and upgrade-apply success are not visual proof.",
      "Structural design/runtime comparison is not dynamic KPI proof.",
      "Dynamic KPI proof requires before/after source mutation evidence and refreshed/recalculated runtime evidence.",
    ],
    nextActions: nextActions(findings),
    defaultArtifactPaths: DEFAULT_ARTIFACT_PATHS,
    output: out ? safePath(out) : null,
    format,
  };
}

function enforceContract(workflow, findings) {
  if (!workflow.uiRelevant) return;
  if ((workflow.designPresent || workflow.highQualityClaimed) && !workflow.artifacts.uiContractPath) {
    addFinding(findings, "error", "UI_CONTRACT_MISSING", "Design/mockup or high-quality UI work requires a UI implementation contract path.");
  }
  if (workflow.uiQualityRelevant && !workflow.validations.uiContract.status) {
    addFinding(findings, "error", "UI_CONTRACT_VALIDATION_MISSING", "UI contract validation result is required before high-quality UI/design-fidelity claims.");
  }
  if (isFailed(workflow.validations.uiContract.status)) {
    addFinding(findings, "error", "UI_CONTRACT_VALIDATION_FAILED", "UI contract validation failed.");
  }
  if (workflow.validations.uiContract.unresolvedRequiredSections) {
    addFinding(findings, "error", "UI_CONTRACT_UNRESOLVED_REQUIRED_SECTIONS", "UI contract has unresolved required sections.");
  }
}

function enforceScope(workflow, findings) {
  if (!workflow.upgradeRelevant) return;
  if (!workflow.artifacts.scopeManifestPath) {
    addFinding(findings, "error", "SCOPE_MANIFEST_MISSING", "UI upgrades and one-page-at-a-time workflows require a scope manifest path.");
  }
  if (!workflow.validations.scope.status) {
    addFinding(findings, "error", "SCOPE_VALIDATION_MISSING", "Scope validation result is required for UI upgrades.");
  }
  if (isFailed(workflow.validations.scope.status) || workflow.validations.scope.driftCodes.length) {
    addFinding(findings, "error", "SCOPE_VALIDATION_FAILED", "Scope validation failed or reported unrelated drift.", {
      driftCodes: workflow.validations.scope.driftCodes,
    });
  }
}

function enforceRuntimeEvidence(workflow, findings) {
  if (workflow.runtimeQualityClaimed && !workflow.artifacts.runtimeEvidencePath) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_MISSING", "Runtime UI quality claims require redacted runtime evidence.");
  }
  if (workflow.runtimeQualityClaimed && !workflow.validations.runtimeEvidence.status) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_VALIDATION_MISSING", "Runtime evidence validation result is required for runtime UI quality claims.");
  }
  if (isFailed(workflow.validations.runtimeEvidence.status)) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_VALIDATION_FAILED", "Runtime evidence validation failed.");
  }
  if (workflow.installSuccessPresent && !workflow.artifacts.runtimeEvidencePath && workflow.finalReportClaimsVisualSuccess) {
    addFinding(findings, "error", "INSTALL_SUCCESS_NOT_VISUAL_PROOF", "Install/signing/upgrade success is present but runtime evidence is absent while visual success is claimed.");
  }
  if (workflow.installSuccessUsedAsVisualProof) {
    addFinding(findings, "error", "INSTALL_SUCCESS_NOT_VISUAL_PROOF", "Install, signing, upgrade-check, or upgrade-apply success is being used as visual proof.");
  }
  if (workflow.validations.runtimeEvidence.weak && !workflow.strictQuality) {
    addFinding(findings, "warning", "WEAK_RUNTIME_EVIDENCE", "Runtime evidence exists but is hand-written or weak; treat it as review-required evidence.");
  }
  if (workflow.validations.runtimeEvidence.weak && workflow.strictQuality) {
    addFinding(findings, "error", "RUNTIME_EVIDENCE_VALIDATION_FAILED", "Strict-quality workflow cannot rely on weak hand-written runtime evidence.");
  }
}

function enforceStructureComparison(workflow, findings) {
  if (workflow.designFidelityClaimed && !workflow.artifacts.structureFindingsPath) {
    addFinding(findings, "error", "STRUCTURE_COMPARISON_MISSING", "Design fidelity claims require design/runtime structure comparison findings.");
    addFinding(findings, "error", "DESIGN_FIDELITY_CLAIM_UNPROVEN", "Design fidelity is unproven without structure comparison findings.");
  }
  if (isFailed(workflow.validations.structureComparison.status)) {
    addFinding(findings, "error", "STRUCTURE_COMPARISON_FAILED", "Design/runtime structure comparison failed.");
  }
  if (isWarning(workflow.validations.structureComparison.status) && workflow.strictQuality) {
    addFinding(findings, "error", "STRUCTURE_COMPARISON_WARNING_STRICT", "Strict-quality workflow cannot proceed with structure comparison warnings.");
  } else if (isWarning(workflow.validations.structureComparison.status)) {
    addFinding(findings, "warning", "STRUCTURE_COMPARISON_WARNING", "Structure comparison warning exists and should be reported or waived.");
  }

  const coreIssues = workflow.validations.structureComparison.findings
    .filter((finding) => CORE_STRUCTURE_CODES.has(finding.code) && !finding.resolved && !finding.waived);
  if (coreIssues.length) {
    addFinding(findings, "error", "STRUCTURE_COMPARISON_FAILED", "Structure comparison contains unresolved core UI issues.", {
      codes: [...new Set(coreIssues.map((finding) => finding.code))],
    });
  }
  if (workflow.designImageReviewRequired && workflow.artifacts.uiContractPath && workflow.artifacts.runtimeEvidencePath) {
    addFinding(findings, "warning", "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED", "Design image parsing is review-required; contract and runtime evidence exist, but human visual review remains required.");
  }
}

function enforceDynamicKpi(workflow, findings) {
  if (!workflow.dynamicKpiClaimed) return;
  if (!workflow.artifacts.dynamicKpiMutationEvidencePath || !workflow.validations.dynamicKpiMutation.status) {
    addFinding(findings, "error", "DYNAMIC_KPI_MUTATION_EVIDENCE_MISSING", "Dynamic KPI proof requires before/after mutation evidence path and validation result.");
  }
  if (isFailed(workflow.validations.dynamicKpiMutation.status)) {
    addFinding(findings, "error", "DYNAMIC_KPI_MUTATION_EVIDENCE_MISSING", "Dynamic KPI mutation evidence validation failed.");
  }
  if (workflow.structureComparisonUsedAsDynamicProof) {
    addFinding(findings, "error", "STRUCTURE_COMPARISON_NOT_DYNAMIC_KPI_PROOF", "Structure comparison is being used as dynamic KPI proof.");
  }
  if (workflow.staticKpiMislabeledDynamic) {
    addFinding(findings, "error", "STATIC_KPI_MISLABELED_DYNAMIC", "Static or fallback KPI display is mislabeled as dynamic KPI proof.");
  }
}

function enforceFinalReport(workflow, findings) {
  if (!workflow.uiQualityRelevant) return;
  const missing = [];
  if (!hasFinalPath(workflow, "uiContractPath")) missing.push("uiContractPath");
  if (workflow.upgradeRelevant && !hasFinalPath(workflow, "scopeManifestPath")) missing.push("scopeManifestPath");
  if (workflow.upgradeRelevant && !hasFinalPath(workflow, "scopeValidationResultPath")) missing.push("scopeValidationResultPath");
  if (!hasFinalPath(workflow, "runtimeEvidencePath")) missing.push("runtimeEvidencePath");
  if (!hasFinalPath(workflow, "structureFindingsPath")) missing.push("structureFindingsPath");
  if (workflow.dynamicKpiClaimed && !hasFinalPath(workflow, "dynamicKpiMutationEvidencePath")) missing.push("dynamicKpiMutationEvidencePath");
  for (const key of missing) {
    addFinding(findings, "error", "FINAL_REPORT_ARTIFACT_PATH_MISSING", `Final report is missing required artifact path: ${key}.`, { artifact: key });
  }

  if (workflow.hasUnresolvedFindings && !workflow.finalReport.unresolvedFindingsReported) {
    addFinding(findings, "error", "UNRESOLVED_FINDINGS_NOT_REPORTED", "Final report must include unresolved findings summary.");
  }
  if (workflow.hasWarnings && !workflow.finalReport.warningWaiverSummary) {
    addFinding(findings, "error", "WARNING_WAIVER_MISSING", "Final report must include warning waiver or warning disposition summary.");
  }
}

function enforceLowRiskSchemaOnly(workflow, findings) {
  if (!workflow.uiRelevant && workflow.basicSchemaOnly) {
    addFinding(findings, "warning", "BASIC_SCHEMA_ONLY_NO_UI_CLAIM", "Schema-only report has no UI/design-quality claim; closed-loop UI artifacts are not required.");
  }
}

function readWorkflow(workflowPath) {
  const raw = fs.readFileSync(workflowPath, "utf8");
  if (/\.md$/i.test(workflowPath)) return parseMarkdownWorkflow(raw);
  try {
    return JSON.parse(raw);
  } catch (error) {
    if (/^\s*#|^\s*[-*]\s+/m.test(raw)) return parseMarkdownWorkflow(raw);
    throw error;
  }
}

function parseMarkdownWorkflow(raw) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1]);

  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?([A-Za-z][A-Za-z0-9_. -]+):\s*(.*?)\s*$/);
    if (!match) continue;
    const key = match[1].trim().replace(/\s+/g, "");
    setPath(data, key, parseScalar(match[2]));
  }
  return data;
}

function setPath(target, dottedKey, value) {
  const parts = dottedKey.split(".");
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current[parts[index]] ||= {};
    current = current[parts[index]];
  }
  current[parts.at(-1)] = value;
}

function parseScalar(value) {
  const trimmed = String(value || "").trim();
  if (/^(true|yes)$/i.test(trimmed)) return true;
  if (/^(false|no)$/i.test(trimmed)) return false;
  if (/^null$/i.test(trimmed)) return null;
  if (trimmed.includes(",") && !trimmed.includes("/")) return trimmed.split(",").map((item) => parseScalar(item));
  return trimmed;
}

function normalizeWorkflow(input = {}) {
  const request = input.request || input.workflow || {};
  const claims = input.claims || {};
  const artifacts = input.artifacts || input.artifactPaths || {};
  const validations = input.validations || input.validationResults || {};
  const finalReport = input.finalReport || input.report || {};
  const signing = input.signingInstallUpgrade || input.signingInstallUpgradeResult || input.packageRuntimeActions || {};

  const requestType = stringValue(input.requestType, request.type, request.requestType, input.changeScope);
  const designPresent = boolValue(input.designMockupPresent, input.designPresent, request.designMockupPresent, request.designPresent, request.designImagePresent, claims.designMockupPresent);
  const highQualityClaimed = boolValue(input.highQualityUiClaimed, input.highQualityUIClaimed, claims.highQualityUi, claims.highQualityUI, claims.highQualityUiClaimed, request.highQualityUi);
  const designFidelityClaimed = boolValue(input.designFidelityClaimed, claims.designFidelity, claims.designFidelityClaimed);
  const runtimeQualityClaimed = boolValue(input.runtimeUiQualityClaimed, claims.runtimeUiQuality, claims.runtimeUiQualityClaimed, claims.visualSuccess, finalReport.claimsVisualSuccess);
  const dynamicKpiClaimed = boolValue(input.dynamicKpiProofClaimed, claims.dynamicKpiProof, claims.dynamicKpiProofClaimed);
  const strictQuality = boolValue(input.strictQuality, input.strictQualityMode, claims.strictQuality, request.strictQuality);
  const uiUpgrade = boolValue(input.uiUpgrade, request.uiUpgrade, request.pageScopedUiUpgrade, request.dashboardUiUpgrade) || /upgrade|redesign|one-page/i.test(requestType);
  const onePageAtATime = boolValue(input.onePageAtATime, request.onePageAtATime) || /one-page|single-page/i.test(requestType);
  const existingAppUpgrade = boolValue(input.existingAppUpgrade, request.existingAppUpgrade);
  const basicSchemaOnly = boolValue(input.basicSchemaOnly, request.basicSchemaOnly, claims.basicSchemaOnly);

  const structure = normalizeValidation(validations.structureComparison || validations.designRuntimeStructure || input.structureComparison);
  structure.findings = asArray(structure.findings || input.structureFindings || []).map(normalizeFinding);
  const runtimeEvidence = normalizeValidation(validations.runtimeEvidence || input.runtimeEvidenceValidation);
  runtimeEvidence.weak = boolValue(runtimeEvidence.weak, runtimeEvidence.handWritten, runtimeEvidence.handwritten, runtimeEvidence.trustedCapture === false);
  const scope = normalizeValidation(validations.scope || validations.scopeValidation || input.scopeValidation);
  scope.driftCodes = asArray(scope.driftCodes || scope.unrelatedDriftCodes || scope.findings || [])
    .map((value) => typeof value === "string" ? value : value?.code)
    .filter(Boolean);

  const normalized = {
    requestType,
    designPresent,
    highQualityClaimed,
    designFidelityClaimed,
    runtimeQualityClaimed,
    dynamicKpiClaimed,
    strictQuality,
    uiUpgrade,
    onePageAtATime,
    existingAppUpgrade,
    basicSchemaOnly,
    uiRelevant: designPresent || highQualityClaimed || designFidelityClaimed || runtimeQualityClaimed || dynamicKpiClaimed || /dashboard|ui|design|runtime-proof|marketing event/i.test(requestType),
    uiQualityRelevant: highQualityClaimed || designFidelityClaimed || runtimeQualityClaimed || dynamicKpiClaimed,
    upgradeRelevant: uiUpgrade || onePageAtATime || existingAppUpgrade,
    artifacts: {
      uiContractPath: stringValue(artifacts.uiContractPath, artifacts.uiContract, artifacts.contractPath),
      scopeManifestPath: stringValue(artifacts.scopeManifestPath, artifacts.scopeManifest, artifacts.scopePath),
      scopeValidationResultPath: stringValue(artifacts.scopeValidationResultPath, artifacts.scopeValidationPath),
      runtimeEvidencePath: stringValue(artifacts.runtimeEvidencePath, artifacts.runtimeEvidence),
      structureFindingsPath: stringValue(artifacts.structureFindingsPath, artifacts.designRuntimeStructureFindingsPath, artifacts.structureComparisonFindings),
      dynamicKpiMutationEvidencePath: stringValue(artifacts.dynamicKpiMutationEvidencePath, artifacts.kpiMutationEvidencePath),
      workflowFindingsPath: stringValue(artifacts.workflowFindingsPath, artifacts.closedLoopWorkflowFindingsPath),
    },
    validations: {
      uiContract: {
        ...normalizeValidation(validations.uiContract || validations.uiContractValidation || input.uiContractValidation),
        unresolvedRequiredSections: boolValue(validations.uiContract?.unresolvedRequiredSections, validations.uiContractValidation?.unresolvedRequiredSections, input.uiContractUnresolvedRequiredSections),
      },
      scope,
      packageValidation: normalizeValidation(validations.package || validations.packageValidation),
      runtimeEvidence,
      structureComparison: structure,
      dynamicKpiMutation: normalizeValidation(validations.dynamicKpiMutation || validations.dynamicKpiMutationEvidence || input.dynamicKpiMutationEvidence),
    },
    finalReport: {
      artifactPaths: finalReport.artifactPaths || artifacts.finalReportArtifactPaths || {},
      unresolvedFindingsReported: boolValue(finalReport.unresolvedFindingsReported, input.unresolvedFindingsReported),
      warningWaiverSummary: boolValue(finalReport.warningWaiverSummary, finalReport.waivedWarningsSummary, input.warningWaiverSummary) || String(finalReport.warningWaiverSummary || "").trim().length > 0,
      claimsVisualSuccess: boolValue(finalReport.claimsVisualSuccess, claims.visualSuccess),
    },
    installSuccessPresent: hasSuccess(signing.install) || hasSuccess(signing.upgrade) || hasSuccess(signing.signing) || hasSuccess(signing.upgradeCheck) || hasSuccess(signing.upgradeApply) || hasSuccess(validations.install) || hasSuccess(validations.upgrade),
    installSuccessUsedAsVisualProof: boolValue(input.installSuccessUsedAsVisualProof, claims.installSuccessUsedAsVisualProof, finalReport.installSuccessUsedAsVisualProof),
    structureComparisonUsedAsDynamicProof: boolValue(input.structureComparisonUsedAsDynamicProof, claims.structureComparisonUsedAsDynamicProof, validations.dynamicKpiMutation?.structureComparisonUsedAsProof),
    staticKpiMislabeledDynamic: boolValue(input.staticKpiMislabeledDynamic, claims.staticKpiMislabeledDynamic, validations.dynamicKpiMutation?.staticFallbackMislabeledDynamic),
    designImageReviewRequired: boolValue(input.designImageReviewRequired, claims.designImageReviewRequired, structure.findings.some((finding) => finding.code === "DESIGN_IMAGE_PARSE_REVIEW_REQUIRED")),
  };
  normalized.finalReportClaimsVisualSuccess = normalized.finalReport.claimsVisualSuccess || normalized.runtimeQualityClaimed || normalized.highQualityClaimed || normalized.designFidelityClaimed;
  normalized.hasUnresolvedFindings = boolValue(input.hasUnresolvedFindings, finalReport.hasUnresolvedFindings)
    || asArray(input.unresolvedFindings).length > 0
    || structure.findings.some((finding) => !finding.resolved && !finding.waived && finding.severity !== "info");
  normalized.hasWarnings = boolValue(input.hasWarnings, finalReport.hasWarnings)
    || asArray(input.waivedWarnings).length > 0
    || structure.findings.some((finding) => finding.severity === "warning" && !finding.resolved);
  return normalized;
}

function normalizeValidation(value = {}) {
  if (typeof value === "string") return { status: value };
  if (typeof value === "boolean") return { status: value ? "pass" : "fail" };
  return { ...value, status: stringValue(value.status, value.result, value.verdict) };
}

function normalizeFinding(value) {
  if (typeof value === "string") return { code: value, severity: "error", resolved: false };
  return {
    code: value?.code || "UNKNOWN_FINDING",
    severity: value?.severity || value?.level || (value?.status === "warning" ? "warning" : "error"),
    resolved: boolValue(value?.resolved),
    waived: boolValue(value?.waived),
  };
}

function addFinding(findings, severity, code, message, details = undefined) {
  findings.push({ severity, code, message, ...(details ? { details } : {}) });
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "fail";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  if (status === "pass") return "Closed-loop UI workflow metadata supports the claimed proof boundary.";
  if (status === "warning") return `Closed-loop UI workflow metadata has ${warnings} warning(s).${strict ? " Strict mode treats warnings as blocking." : ""}`;
  return `Closed-loop UI workflow metadata failed with ${errors} error(s) and ${warnings} warning(s).`;
}

function artifactSummary(workflow = {}) {
  return {
    provided: workflow.artifacts || {},
    finalReportArtifactPaths: workflow.finalReport?.artifactPaths || {},
    recommendedDefaults: DEFAULT_ARTIFACT_PATHS,
  };
}

function nextActions(findings) {
  if (!findings.length) return ["Keep final reports linked to the exact closed-loop artifacts used for the UI claim."];
  const actions = [];
  if (hasCode(findings, "UI_CONTRACT_MISSING")) actions.push("Generate and validate a UI implementation contract before generation or UI-quality claims.");
  if (hasCode(findings, "SCOPE_MANIFEST_MISSING")) actions.push("Create a page/scope manifest and run scope validation before UI upgrade mutation.");
  if (hasCode(findings, "RUNTIME_EVIDENCE_MISSING")) actions.push("Capture redacted runtime evidence and run runtime evidence validators before visual-quality claims.");
  if (hasCode(findings, "STRUCTURE_COMPARISON_MISSING")) actions.push("Run design/runtime structure comparison and attach the findings path before claiming design fidelity.");
  if (hasCode(findings, "DYNAMIC_KPI_MUTATION_EVIDENCE_MISSING")) actions.push("Capture before/after KPI mutation evidence before claiming dynamic KPI proof.");
  if (hasCode(findings, "FINAL_REPORT_ARTIFACT_PATH_MISSING")) actions.push("Update the final report with all required contract/scope/evidence/findings artifact paths.");
  if (!actions.length) actions.push("Review and resolve or explicitly waive warning findings before final handoff.");
  return actions;
}

function hasFinalPath(workflow, key) {
  return Boolean(stringValue(workflow.finalReport.artifactPaths?.[key]));
}

function hasCode(findings, code) {
  return findings.some((finding) => finding.code === code);
}

function boolValue(...values) {
  for (const value of values) {
    if (value === true || value === false) return value;
    if (typeof value === "string") {
      if (/^(true|yes|pass|passed|success)$/i.test(value.trim())) return true;
      if (/^(false|no|fail|failed)$/i.test(value.trim())) return false;
    }
  }
  return false;
}

function stringValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function isFailed(status) {
  return /^(fail|failed|error|blocking)$/i.test(String(status || ""));
}

function isWarning(status) {
  return /^(warning|warn|pass_with_warnings)$/i.test(String(status || ""));
}

function hasSuccess(value) {
  if (!value) return false;
  if (typeof value === "string") return /success|pass|passed/i.test(value);
  return /success|pass|passed/i.test(String(value.status || value.result || value.verdict || ""));
}

function safePath(value) {
  if (!value) return value;
  const text = String(value);
  if (/https?:\/\//i.test(text)) return "[redacted-url]";
  return text.replace(/([A-Za-z0-9]{6})[A-Za-z0-9_-]{10,}([A-Za-z0-9]{4})/g, "$1...$2");
}

function renderMarkdown(report) {
  const lines = [
    `# UI Closed-Loop Workflow Enforcement`,
    ``,
    `Status: ${report.status}`,
    ``,
    report.summary,
    ``,
    `## Findings`,
  ];
  if (!report.findings.length) lines.push("- none");
  for (const finding of report.findings) lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
  lines.push(``, `## Next Actions`);
  for (const action of report.nextActions) lines.push(`- ${action}`);
  return `${lines.join("\n")}\n`;
}

function usage(exitCode = 1) {
  const text = "Usage: node scripts/inspect-ui-closed-loop-workflow-enforcement.mjs --workflow <workflow-report.json|md> [--strict] [--out <findings.json>] [--format json|markdown]";
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { format: "json", strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--workflow") args.workflow = argv[++index];
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
  }
  return args;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
