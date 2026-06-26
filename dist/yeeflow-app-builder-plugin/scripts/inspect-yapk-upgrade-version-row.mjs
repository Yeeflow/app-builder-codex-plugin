#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { asArray, isObject, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.evidence) usage(args.help ? 0 : 1);
  const report = inspectYapkUpgradeVersionRow(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectYapkUpgradeVersionRow({ evidence, packageId } = {}) {
  const findings = [];
  let data;
  try {
    data = readJson(evidence);
  } catch (error) {
    return buildReport(evidence, packageId, [finding("error", "UPGRADE_VERSION_ROW_EVIDENCE_READ_FAILED", error.message)]);
  }
  const expectedPackageId = packageId || data.packageId || data.submittedPackageId || data.wrapper?.PackageId;
  if (!expectedPackageId) findings.push(finding("error", "UPGRADE_VERSION_ROW_PACKAGEID_MISSING", "Version Management proof must identify the submitted PackageId."));
  if (Number(data.apiStatus) === 0 && !asArray(data.rows).length) {
    findings.push(finding("error", "UPGRADE_API_ACCEPTANCE_NOT_FINAL_SUCCESS", "upgrade-check-yapk/upgrade-apply-yapk API status 0 is submitted/accepted only and is not final upgrade success."));
  }
  const rows = asArray(data.rows).filter((row) => String(row.PackageId || row.packageId || row.id || "") === String(expectedPackageId || ""));
  if (expectedPackageId && rows.length === 0) findings.push(finding("error", "UPGRADE_VERSION_ROW_MISSING", "Submitted PackageId row was not found in Version Management evidence.", { packageId: String(expectedPackageId) }));
  if (rows.length > 1) findings.push(finding("error", "UPGRADE_VERSION_ROW_AMBIGUOUS", "Submitted PackageId matched multiple Version Management rows.", { packageId: String(expectedPackageId), matches: rows.length }));
  const row = rows[0];
  if (row) {
    const status = String(row.Status || row.status || "").trim();
    if (status !== "Succeed") {
      const code = status === "Failed" ? "UPGRADE_VERSION_ROW_FAILED" : "UPGRADE_VERSION_ROW_NOT_SUCCEEDED";
      findings.push(finding("error", code, "Final Version Management row status must be Succeed before reporting upgrade success.", { packageId: String(expectedPackageId), status: status || null }));
      const errorText = sanitize(row.errorLogText || row.error || row.errorLog || data.errorLogText || "");
      if (status === "Failed" && !errorText) {
        findings.push(finding("error", "UPGRADE_ERROR_LOG_MISSING", "Failed Version Management rows must capture sanitized View error log text.", { packageId: String(expectedPackageId) }));
      }
    }
  }
  if (row && String(row.Status || row.status || "") === "Succeed") {
    validateRuntimeProof(data.runtimeProof, findings, {
      expectedApprovalWorkflow: data.expectedApprovalWorkflow || data.expectedApprovalWorkflowSummary || data.expectedDefBlobSummary,
    });
  }
  const proofArtifact = data.screenshot || data.screenshotPath || data.domProofPath || data.structuredDomProofPath;
  if (!proofArtifact) findings.push(finding("warning", "UPGRADE_VERSION_ROW_PROOF_ARTIFACT_MISSING", "Version Management proof should save screenshot or structured DOM evidence."));

  return buildReport(evidence, expectedPackageId, findings, {
    matchedRows: rows.length,
    versionStatus: row ? String(row.Status || row.status || "") : null,
  });
}

function validateRuntimeProof(runtimeProof, findings, options = {}) {
  if (!isObject(runtimeProof)) {
    findings.push(finding("error", "UPGRADE_RUNTIME_PROOF_MISSING", "Final Succeed row must be followed by separate browser/runtime proof for the affected surface."));
    return;
  }
  if (runtimeProof.status !== "pass") findings.push(finding("error", "UPGRADE_RUNTIME_PROOF_NOT_PASSING", "Runtime proof must pass before reporting upgrade success.", { status: runtimeProof.status || null }));
  if (!runtimeProof.surface) findings.push(finding("error", "UPGRADE_RUNTIME_PROOF_SURFACE_MISSING", "Runtime proof must identify the affected runtime surface."));
  if (runtimeProof.expectedLabel && !asArray(runtimeProof.visibleLabels).map(String).includes(String(runtimeProof.expectedLabel))) {
    findings.push(finding("error", "UPGRADE_RUNTIME_FIELD_LABEL_MISSING", "Runtime proof must show the intended field label on the affected surface.", { expectedLabel: runtimeProof.expectedLabel }));
  }
  if (options.expectedApprovalWorkflow || runtimeProof.approvalWorkflowProof) {
    validateApprovalWorkflowRuntimeProof(runtimeProof, options.expectedApprovalWorkflow || {}, findings);
  }
  if (!runtimeProof.screenshot && !runtimeProof.domProof) findings.push(finding("warning", "UPGRADE_RUNTIME_PROOF_ARTIFACT_MISSING", "Runtime proof should save screenshot or structured DOM evidence."));
}

function validateApprovalWorkflowRuntimeProof(runtimeProof, expected, findings) {
  const proof = isObject(runtimeProof.approvalWorkflowProof) ? runtimeProof.approvalWorkflowProof : runtimeProof;
  const live = proof.liveDefBlobSummary || proof.liveDesignerSummary || proof.defBlobSummary;
  if (!isObject(live)) {
    findings.push(finding("error", "UPGRADE_APPROVAL_DEF_BLOB_PROOF_MISSING", "Approval workflow upgrades require live Designer/DefBlob summary after Version Management Succeed; a Succeed row alone does not prove the workflow was overwritten."));
    return;
  }
  if (proof.designerOpened !== true && proof.workflowDesignerOpened !== true) {
    findings.push(finding("error", "UPGRADE_APPROVAL_DESIGNER_OPEN_PROOF_MISSING", "Approval workflow runtime proof must show that the workflow Designer opened after upgrade."));
  }
  if (proof.publishSucceeded !== true && proof.workflowPublished !== true) {
    findings.push(finding("error", "UPGRADE_APPROVAL_PUBLISH_PROOF_MISSING", "Approval workflow runtime proof must show that the upgraded workflow can publish."));
  }
  const comparisons = [
    ["taskName", "UPGRADE_APPROVAL_TASK_NAME_STALE"],
    ["taskId", "UPGRADE_APPROVAL_TASK_ID_STALE"],
    ["assigneeExpressionHash", "UPGRADE_APPROVAL_ASSIGNEE_STALE"],
    ["approvedConditionHash", "UPGRADE_APPROVAL_APPROVED_CONDITION_STALE"],
    ["rejectedConditionHash", "UPGRADE_APPROVAL_REJECTED_CONDITION_STALE"],
  ];
  for (const [key, code] of comparisons) {
    if (expected[key] === undefined || expected[key] === null || expected[key] === "") continue;
    if (String(live[key] || "") !== String(expected[key])) {
      findings.push(finding("error", code, `Live Approval workflow ${key} does not match the upgraded package summary.`, {
        expected: String(expected[key]),
        actual: live[key] === undefined || live[key] === null ? null : String(live[key]),
      }));
    }
  }
}

function sanitize(text) {
  return String(text || "").replace(/(token|secret|password|authorization)[^\n\r]*/gi, "$1=[redacted]").trim();
}

function readJson(file) {
  return JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
}

function buildReport(evidence, packageId, findings, summary = {}) {
  return {
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
    evidence: safePath(evidence),
    packageId: packageId || null,
    summary,
    proofBoundary: "API status 0 is only submitted/accepted. Final success requires Version Management row status Succeed and separate browser/runtime proof.",
    findings,
  };
}

function finding(level, code, message, detail = {}) {
  return { level, code, message, ...detail };
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--evidence") args.evidence = argv[++i];
    else if (token === "--package-id") args.packageId = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-yapk-upgrade-version-row.mjs --evidence <version-management-proof.json> [--package-id <PackageId>]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
