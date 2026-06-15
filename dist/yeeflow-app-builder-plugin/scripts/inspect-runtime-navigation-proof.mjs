#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CORE_PROOF_SECTIONS = [
  "appChromeFidelity",
  "primaryNavigationFidelity",
  "contentStructureFidelity",
  "dynamicKpiProofBoundary",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.contract || !args.runtimeEvidence) usage(args.help ? 0 : 1);
  const report = inspectRuntimeNavigationProof(args);
  const rendered = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, rendered);
  else process.stdout.write(rendered);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function inspectRuntimeNavigationProof({
  contract,
  runtimeEvidence,
  out,
  format = "json",
  strict = false,
} = {}) {
  const findings = [];
  let normalizedContract;
  let normalizedEvidence;

  if (!contract) {
    addFinding(findings, "error", "PRIMARY_NAV_CONTRACT_MISSING", "Contract path is required.");
  } else {
    try {
      normalizedContract = normalizeContract(readJson(contract));
    } catch (error) {
      addFinding(findings, "error", "PRIMARY_NAV_CONTRACT_MISSING", `Could not read primary navigation contract JSON: ${error.message}`);
    }
  }

  if (!runtimeEvidence) {
    addFinding(findings, "error", "RUNTIME_NAVIGATION_EVIDENCE_MISSING", "Runtime evidence path is required.");
  } else {
    try {
      normalizedEvidence = normalizeEvidence(readJson(runtimeEvidence));
    } catch (error) {
      addFinding(findings, "error", "RUNTIME_NAVIGATION_EVIDENCE_MISSING", `Could not read runtime evidence JSON: ${error.message}`);
    }
  }

  if (normalizedContract) validateContract(normalizedContract, findings);
  if (normalizedEvidence) validateEvidenceMetadata(normalizedEvidence, findings);
  if (normalizedContract && normalizedEvidence) validateNavigationMatch(normalizedContract, normalizedEvidence, findings);

  const status = statusFromFindings(findings);
  return {
    status,
    summary: summarize(status, findings, strict),
    contractPath: safePath(contract),
    runtimeEvidencePath: safePath(runtimeEvidence),
    strict,
    navigationResult: {
      expectedPrimaryNavigation: normalizedContract?.primaryNavigationLabels || [],
      actualPrimaryNavigation: normalizedEvidence?.visiblePrimaryNavigationLabels || [],
      hiddenSupportResources: normalizedContract?.hiddenSupportResources || [],
      visibleSupportResources: normalizedEvidence?.visibleSupportResources || [],
      navEvidenceMode: normalizedEvidence?.navEvidenceMode || null,
      screenshotCaptured: Boolean(normalizedEvidence?.screenshotCaptured),
      browserRefreshBeforeScreenshot: Boolean(normalizedEvidence?.browserRefreshBeforeScreenshot),
    },
    artifactSummary: {
      screenshotPath: normalizedEvidence?.screenshotPath || null,
      screenshotStatus: normalizedEvidence?.screenshotStatus || null,
      hasSigningOrUpgradeProof: Boolean(normalizedEvidence?.hasSigningOrUpgradeProof),
      hasRuntimeNavigationEvidence: Boolean(normalizedEvidence?.hasRuntimeNavigationEvidence),
      fidelityReportSections: normalizedEvidence?.fidelityReportSections || [],
    },
    findings,
    proofBoundary: [
      "This validator checks declared UI contract navigation expectations against structured redacted runtime evidence.",
      "It does not inspect or operate Chrome, parse screenshot pixels, parse raw YAPK packages, or call Yeeflow APIs.",
      "Screenshots are treated as metadata paths/status only; explicit browser refresh before capture must be declared.",
      "Signing, verifysign, upgrade-check, upgrade-apply, install success, and API success are not visual proof.",
      "Primary navigation fidelity passing does not prove app chrome fidelity, content structure fidelity, or dynamic KPI proof.",
    ],
    nextActions: nextActions(findings),
    output: out ? safePath(out) : null,
    format,
  };
}

function validateContract(contract, findings) {
  if (!contract.primaryNavigationLabels.length) {
    addFinding(findings, "error", "PRIMARY_NAV_CONTRACT_MISSING", "Contract must define exact approved primary navigation labels in order.");
  }
  if (contract.primaryNavigationLabels.some((label) => !label)) {
    addFinding(findings, "error", "PRIMARY_NAV_LABEL_MISSING", "Contract primary navigation includes a blank label.");
  }
  if (contract.supportResources.length && !contract.hiddenSupportResources.length) {
    addFinding(findings, "error", "HIDDEN_SUPPORT_RESOURCE_EXPECTATION_MISSING", "Contract declares support resources but does not declare hidden/non-primary support-resource expectations.");
  }
}

function validateEvidenceMetadata(evidence, findings) {
  if (evidence.hasSigningOrUpgradeProof && !evidence.hasRuntimeNavigationEvidence && !evidence.screenshotCaptured) {
    addFinding(findings, "error", "SIGN_UPGRADE_SUCCESS_NOT_VISUAL_PROOF", "Signing/verifysign/upgrade-check/upgrade-apply success is not runtime navigation or visual proof.");
  }
  if (evidence.installSuccessOnly) {
    addFinding(findings, "error", "INSTALL_SUCCESS_NOT_VISUAL_PROOF", "Install/API success alone is not runtime UI proof.");
  }
  if (!evidence.browserRefreshBeforeScreenshot) {
    addFinding(findings, "error", "BROWSER_REFRESH_REQUIRED_BEFORE_RUNTIME_SCREENSHOT", "Runtime screenshot proof must declare an explicit browser refresh before capture.");
  }
  if (!evidence.screenshotCaptured) {
    addFinding(findings, "error", "RUNTIME_SCREENSHOT_EVIDENCE_MISSING", "Runtime proof must include screenshot capture metadata/path/status.");
  }
  if (evidence.broadBodyTextOnly) {
    addFinding(findings, "error", "BROAD_BODY_TEXT_NAV_SCAN_UNRELIABLE", "Broad body-text-only scans are not reliable primary navigation proof.");
  }
  if (!evidence.navScopedOrExactLine) {
    addFinding(findings, "error", "NAV_SCOPED_EVIDENCE_REQUIRED", "Runtime navigation proof must be nav-scoped or exact-line based.");
  }
  const missingSections = CORE_PROOF_SECTIONS.filter((section) => !evidence.fidelityReportSections.includes(section));
  if (missingSections.length) {
    addFinding(findings, "error", "FIDELITY_REPORT_SECTIONS_MISSING", "Runtime proof must separately report app chrome, primary navigation, content structure, and dynamic KPI proof boundaries.", {
      missingSections,
    });
  }
  if (evidence.contentStructureFidelityStatus === "pass" && evidence.primaryNavigationFidelityOnly) {
    addFinding(findings, "warning", "FIDELITY_REPORT_SECTIONS_MISSING", "Navigation proof is present, but content structure fidelity must remain separate and cannot pass merely because navigation matched.");
  }
}

function validateNavigationMatch(contract, evidence, findings) {
  const expected = contract.primaryNavigationLabels;
  const actual = evidence.visiblePrimaryNavigationLabels;

  if (!actual.length) {
    addFinding(findings, "error", "VISIBLE_NAV_MENU_MISMATCH", "Runtime evidence does not include visible primary navigation labels.");
    return;
  }

  for (const label of expected) {
    if (!actual.includes(label)) {
      addFinding(findings, "error", "PRIMARY_NAV_LABEL_MISSING", `Expected primary navigation item is missing: ${label}`, { label });
    }
  }

  const expectedSet = new Set(expected);
  for (const label of actual) {
    if (!expectedSet.has(label)) {
      addFinding(findings, "error", "EXTRA_PRIMARY_NAV_ITEM_VISIBLE", `Unexpected primary navigation item is visible: ${label}`, { label });
    }
  }

  if (expected.length === actual.length && expected.some((label, index) => actual[index] !== label)) {
    addFinding(findings, "error", "PRIMARY_NAV_ORDER_MISMATCH", "Runtime visible primary navigation order does not match the approved contract.", {
      expected,
      actual,
    });
  }

  if (expected.length !== actual.length || expected.some((label, index) => actual[index] !== label)) {
    addFinding(findings, "error", "VISIBLE_NAV_MENU_MISMATCH", "Runtime visible primary navigation does not exactly match the approved labels/order.", {
      expected,
      actual,
    });
  }

  const hiddenSupportSet = new Set(contract.hiddenSupportResources);
  const visibleSupportResources = [
    ...new Set([
      ...evidence.visibleSupportResources,
      ...actual.filter((label) => hiddenSupportSet.has(label)),
    ]),
  ];
  for (const label of visibleSupportResources) {
    addFinding(findings, "error", "SUPPORT_RESOURCE_VISIBLE_IN_PRIMARY_NAV", `Hidden/non-primary support resource is visible in primary navigation: ${label}`, { label });
  }
}

function normalizeContract(data) {
  const primaryNavigationLabels = normalizeLabels(firstArray([
    data?.primaryNavigation?.labels,
    data?.primaryNavigation?.visibleLabels,
    data?.primaryNavigation?.approvedLabels,
    data?.primaryNavigation?.items,
    data?.approvedPrimaryNavigation,
    data?.visiblePrimaryNavigation,
    data?.navigation?.primaryNavigation,
    data?.navigation?.primary?.labels,
  ]));
  const supportResources = normalizeLabels(firstArray([
    data?.supportResources,
    data?.resources?.support,
    data?.implementationOnlyResources,
  ]));
  const hiddenSupportResources = normalizeLabels(firstArray([
    data?.hiddenSupportResources,
    data?.nonPrimarySupportResources,
    data?.supportResources?.hidden,
    data?.supportResourceExpectations?.hidden,
    data?.supportResourceExpectations?.nonPrimary,
    data?.navigation?.hiddenSupportResources,
  ]));
  return {
    primaryNavigationLabels,
    supportResources,
    hiddenSupportResources,
  };
}

function normalizeEvidence(data) {
  const screenshot = data?.screenshot || data?.runtimeScreenshot || data?.screenshotEvidence || {};
  const navigationEvidence = data?.navigationEvidence || data?.runtimeNavigationEvidence || {};
  const fidelityReport = data?.fidelityReport || data?.runtimeProofReport || {};
  const visiblePrimaryNavigationLabels = normalizeLabels(firstArray([
    data?.visiblePrimaryNavigation,
    data?.primaryNavigation?.visibleLabels,
    data?.primaryNavigation?.items,
    navigationEvidence?.visiblePrimaryNavigation,
    navigationEvidence?.visibleLabels,
    navigationEvidence?.items,
    navigationEvidence?.exactLines,
  ]));
  const visibleSupportResources = normalizeLabels(firstArray([
    data?.visibleSupportResources,
    data?.supportResourcesVisible,
    navigationEvidence?.visibleSupportResources,
    navigationEvidence?.supportResourcesVisible,
  ]));
  const navEvidenceMode = String(navigationEvidence?.mode || navigationEvidence?.type || navigationEvidence?.method || data?.navigationEvidenceMode || "");
  const navScope = String(navigationEvidence?.scope || data?.navigationEvidenceScope || "");
  const hasExactLines = Array.isArray(navigationEvidence?.exactLines) && navigationEvidence.exactLines.length > 0;
  const navScopedOrExactLine = Boolean(
    navigationEvidence?.navScoped
      || navigationEvidence?.exactLineBased
      || hasExactLines
      || /nav|navigation|primary-navigation/i.test(navScope)
      || /exact[- ]?line|nav[- ]?scoped/i.test(navEvidenceMode),
  );
  const broadBodyTextOnly = Boolean(
    navigationEvidence?.broadBodyTextOnly
      || data?.broadBodyTextNavigationScanOnly
      || /body[- ]?text|document body|page body/i.test(navEvidenceMode),
  );
  const screenshotCaptured = Boolean(
    data?.runtimeScreenshotCaptured
      || screenshot?.captured
      || screenshot?.path
      || screenshot?.status === "captured"
      || screenshot?.status === "success",
  );
  const browserRefreshBeforeScreenshot = Boolean(
    data?.browserRefreshBeforeScreenshot
      || data?.browserRefreshedBeforeScreenshot
      || screenshot?.browserRefreshBeforeCapture
      || screenshot?.browserRefreshedBeforeCapture
      || screenshot?.refreshedBeforeCapture,
  );
  const fidelityReportSections = CORE_PROOF_SECTIONS.filter((section) => Object.hasOwn(fidelityReport, section));
  const signingOrUpgrade = data?.signing || data?.verifysign || data?.upgradeCheck || data?.upgradeApply || data?.install || data?.apiAcceptance || {};
  const hasSigningOrUpgradeProof = Boolean(
    data?.signingSuccess
      || data?.verifysignSuccess
      || data?.upgradeCheckSuccess
      || data?.upgradeApplySuccess
      || data?.installSuccess
      || Object.keys(signingOrUpgrade).length,
  );
  const hasRuntimeNavigationEvidence = visiblePrimaryNavigationLabels.length > 0 && navScopedOrExactLine;
  return {
    visiblePrimaryNavigationLabels,
    visibleSupportResources,
    browserRefreshBeforeScreenshot,
    screenshotCaptured,
    screenshotPath: safePath(screenshot?.path || screenshot?.redactedPath),
    screenshotStatus: screenshot?.status || null,
    navScopedOrExactLine,
    broadBodyTextOnly,
    navEvidenceMode: navEvidenceMode || (navScopedOrExactLine ? "nav-scoped-or-exact-line" : null),
    hasSigningOrUpgradeProof,
    installSuccessOnly: Boolean((data?.installSuccess || data?.apiSuccess || data?.upgradeApplySuccess) && !screenshotCaptured && !hasRuntimeNavigationEvidence),
    hasRuntimeNavigationEvidence,
    fidelityReportSections,
    contentStructureFidelityStatus: fidelityReport?.contentStructureFidelity?.status || fidelityReport?.contentStructureFidelity || null,
    primaryNavigationFidelityOnly: Boolean(fidelityReport?.primaryNavigationFidelity && !fidelityReport?.contentStructureFidelity),
  };
}

function normalizeLabels(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return String(item?.label || item?.name || item?.title || item?.text || "").trim();
    })
    .filter(Boolean);
}

function firstArray(values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function addFinding(findings, severity, code, message, details = {}) {
  findings.push({ severity, code, message, ...details });
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "fail";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  if (status === "pass") return "Runtime primary navigation proof matches the approved contract and preserves proof boundaries.";
  if (status === "warning") return strict
    ? `Runtime navigation proof has ${warnings} warning finding(s); strict mode treats warnings as nonzero.`
    : `Runtime navigation proof has ${warnings} warning finding(s).`;
  return `Runtime navigation proof failed with ${errors} error finding(s) and ${warnings} warning finding(s).`;
}

function nextActions(findings) {
  if (!findings.length) return ["Keep runtime navigation proof artifacts with the final UI-quality report."];
  return [...new Set(findings.map((finding) => {
    if (finding.code.includes("CONTRACT")) return "Update the UI contract with exact approved primary navigation labels/order and hidden support-resource expectations.";
    if (finding.code.includes("REFRESH") || finding.code.includes("SCREENSHOT")) return "Capture runtime proof again with an explicit browser refresh before screenshot capture and redacted screenshot metadata.";
    if (finding.code.includes("NAV") || finding.code.includes("SUPPORT_RESOURCE")) return "Recapture nav-scoped or exact-line runtime navigation evidence and hide support resources from primary navigation.";
    if (finding.code.includes("VISUAL_PROOF")) return "Do not use signing/install/upgrade success as UI proof; provide redacted runtime evidence.";
    return "Resolve the runtime navigation proof finding before claiming design/runtime navigation fidelity.";
  }))];
}

function renderMarkdown(report) {
  const lines = [
    `# Runtime Navigation Proof: ${report.status}`,
    "",
    report.summary,
    "",
    "## Findings",
  ];
  if (!report.findings.length) lines.push("- None");
  for (const finding of report.findings) lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
  lines.push("", "## Proof Boundary");
  for (const item of report.proofBoundary) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { format: "json", strict: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--contract") args.contract = argv[++index];
    else if (arg === "--runtime-evidence") args.runtimeEvidence = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--strict") args.strict = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!["json", "markdown"].includes(args.format)) throw new Error(`Unsupported --format: ${args.format}`);
  return args;
}

function usage(exitCode) {
  const script = path.basename(process.argv[1] || "inspect-runtime-navigation-proof.mjs");
  process.stdout.write(`Usage: node scripts/${script} --contract <contract.json> --runtime-evidence <runtime-evidence.json> [--format json|markdown] [--out findings.json] [--strict]\n`);
  process.exit(exitCode);
}

function safePath(filePath) {
  if (!filePath) return null;
  return path.normalize(String(filePath));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
}
