#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { asArray, isObject } from "./lib/yapk-decode-utils.mjs";

const REQUIRED_UNCHANGED_GROUPS = [
  "Childs",
  "Forms",
  "FormNewReports",
  "DataReports",
  "Groups",
  "Tags",
  "Metadatas",
  "Agents",
  "Connections",
  "Knowledges",
  "Themes",
  "Components",
  "PortalInfo",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.evidence) usage(args.help ? 0 : 1);
  const report = inspectDashboardUpgradeRuntimeProof(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectDashboardUpgradeRuntimeProof({ evidence } = {}) {
  const findings = [];
  let data;
  try {
    data = readJson(evidence);
  } catch (error) {
    return buildReport(evidence, [finding("error", "DASH_RUNTIME_PROOF_READ_FAILED", error.message)]);
  }

  validateUpgradeStatus(data, findings);
  validateScopeDiff(data, findings);
  validateRuntimePages(data, findings);
  validateSearchProof(data, findings);

  return buildReport(evidence, findings, {
    packageId: data.packageId || data.package?.packageId || null,
    versionManagementStatus: versionStatus(data),
    dashboardPagesChecked: runtimePages(data).length,
  });
}

function validateUpgradeStatus(data, findings) {
  const apiStatuses = [
    data.upgradeCheck?.apiStatus,
    data.upgradeApply?.apiStatus,
    data.upgradeCheckApiStatus,
    data.upgradeApplyApiStatus,
  ].filter((value) => value !== undefined && value !== null);
  if (apiStatuses.some((value) => Number(value) === 0) && versionStatus(data) !== "Succeed") {
    findings.push(finding("error", "DASH_UPGRADE_API_STATUS_SUBMITTED_ONLY", "upgrade-check/upgrade-apply apiStatus 0 is submitted/accepted only. Final success requires Version Management status Succeed for the exact PackageId.", {
      packageId: data.packageId || data.package?.packageId || null,
      versionStatus: versionStatus(data) || null,
    }));
  }
  if (versionStatus(data) === "Failed" && !String(data.versionManagement?.errorLogText || data.errorLogText || "").trim()) {
    findings.push(finding("error", "DASH_UPGRADE_VERSION_ERROR_LOG_MISSING", "Failed Version Management rows must capture sanitized View error log text."));
  }
}

function validateScopeDiff(data, findings) {
  const scope = data.scopeDiffProof || data.scopeDiff || data.nonDashboardPreservation || {};
  const unchanged = new Set(asArray(scope.unchangedResourceGroups || scope.nonDashboardUnchanged || data.scope?.nonDashboardUnchanged).map(String));
  if (scope.status && scope.status !== "pass") {
    findings.push(finding("error", "DASH_FULL_UPGRADE_SCOPE_DIFF_NOT_PASSING", "Dashboard upgrade scope diff proof must pass before runtime success can be claimed.", { status: scope.status }));
  }
  for (const group of REQUIRED_UNCHANGED_GROUPS) {
    if (!unchanged.has(group)) {
      findings.push(finding("error", "DASH_FULL_UPGRADE_NON_DASHBOARD_UNCHANGED_PROOF_MISSING", "Dashboard-only upgrades must be full upgrade packages and prove non-Dashboard resource groups were preserved unchanged.", { group }));
    }
  }
  if (data.sparsePackage === true || data.packageShape === "dashboard-only-sparse") {
    findings.push(finding("error", "DASH_FULL_UPGRADE_SPARSE_PACKAGE_FORBIDDEN", "Dashboard-only sparse upgrade packages are forbidden because they can drop Data Lists, Forms, reports, and metadata. Build a full upgrade package and prove non-Dashboard resources unchanged."));
  }
}

function validateRuntimePages(data, findings) {
  const pages = runtimePages(data);
  if (!pages.length) {
    findings.push(finding("error", "DASH_RUNTIME_PAGES_MISSING", "Dashboard runtime proof must include per-page runtime evidence."));
    return;
  }
  for (const [index, page] of pages.entries()) {
    const name = page.name || page.title || page.dashboard || `Dashboard ${index + 1}`;
    const rowCount = Number(page.rowCount ?? page.businessRowCount ?? page.collectionRowCount ?? 0);
    if (!(page.businessRowsVisible === true || rowCount > 0)) {
      findings.push(finding("error", "DASH_RUNTIME_BUSINESS_ROWS_MISSING", "Each Dashboard runtime proof must show business data rows after initial load.", { page: name, rowCount }));
    }
    if (page.noDataVisible === true || page.noDataStateVisible === true || page.noData === true) {
      findings.push(finding("error", "DASH_RUNTIME_NO_DATA_VISIBLE", "Dashboard runtime proof must not show a No data state after initial load when seed/business data exists.", { page: name }));
    }
    if (page.objectObjectPlaceholderFound === true || page.objectObjectVisible === true || page.containsObjectObject === true) {
      findings.push(finding("error", "DASH_RUNTIME_OBJECT_OBJECT_VISIBLE", "Dashboard runtime proof must not show [object Object] placeholder text.", { page: name }));
    }
    if (page.collectionBoundToRealDataList === false || page.collectionSource === "placeholder" || page.collectionSource === "none") {
      findings.push(finding("error", "DASH_RUNTIME_COLLECTION_REAL_LIST_BINDING_MISSING", "Dashboard Collection runtime proof must show binding to a real Data List.", { page: name, collectionSource: page.collectionSource || null }));
    }
  }
}

function validateSearchProof(data, findings) {
  const proof = data.searchFilterProof || data.runtimeProof?.searchFilterProof;
  if (!proof) {
    findings.push(finding("warning", "DASH_RUNTIME_SEARCH_FILTER_PROOF_MISSING", "Dashboard runtime proof should include at least one Search filter before/after proof when search filters are generated."));
    return;
  }
  if (proof.status !== "pass") {
    findings.push(finding("error", "DASH_RUNTIME_SEARCH_FILTER_PROOF_NOT_PASSING", "Search filter runtime proof must pass before reporting Dashboard runtime success.", { status: proof.status || null }));
  }
  if (proof.targetRecordVisibleAfter === false || proof.unrelatedRowsRemoved === false) {
    findings.push(finding("error", "DASH_RUNTIME_SEARCH_FILTER_NO_EFFECT", "Search filter proof must show the target row remains visible and unrelated rows are removed.", {
      targetRecordVisibleAfter: proof.targetRecordVisibleAfter,
      unrelatedRowsRemoved: proof.unrelatedRowsRemoved,
    }));
  }
}

function runtimePages(data) {
  return asArray(data.runtimeProof?.pages || data.runtimePages || data.pages);
}

function versionStatus(data) {
  return String(data.versionManagement?.status || data.versionManagementStatus || data.validation?.versionManagement || "").trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function buildReport(evidence, findings, summary = {}) {
  return {
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
    evidence,
    summary,
    proofBoundary: "Local package gates and API submission are not runtime proof. Dashboard upgrade success requires full-package non-Dashboard unchanged proof, Version Management Succeed for the exact PackageId, and browser/runtime evidence showing business rows, no No data state, no [object Object], real Collection binding, and Search filter behavior when generated.",
    findings,
  };
}

function finding(level, code, message, detail = {}) {
  return { level, code, message, ...detail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--evidence") args.evidence = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-dashboard-upgrade-runtime-proof.mjs --evidence <runtime-proof.json>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
