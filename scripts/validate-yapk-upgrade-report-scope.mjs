#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { asArray, isObject, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.previousPackage || !args.newPackage || !args.scope) usage(args.help ? 0 : 1);
  const report = validateYapkUpgradeReportScope(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateYapkUpgradeReportScope({ previousPackage, newPackage, scope, reportProof } = {}) {
  const findings = [];
  let previous;
  let next;
  let scopeManifest;
  let proof = null;
  try {
    previous = readPackageLike(previousPackage);
    next = readPackageLike(newPackage);
    scopeManifest = readJson(scope);
    if (reportProof) proof = readJson(reportProof);
  } catch (error) {
    return buildReport(previousPackage, newPackage, scope, reportProof, [finding("error", "UPGRADE_REPORT_SCOPE_INPUT_READ_FAILED", error.message)]);
  }

  const upgradeType = String(scopeManifest.upgradeType || scopeManifest.scopeType || scopeManifest.type || "").toLowerCase();
  const reportsInScope = asArray(scopeManifest.allowedResourceTypes || scopeManifest.allowedChangeTypes).map((item) => String(item).toLowerCase()).includes("report")
    || asArray(scopeManifest.allowedChanges).map((item) => String(item).toLowerCase()).some((item) => item.includes("report"));
  const previousReports = collectReports(previous.decoded);
  const nextReports = collectReports(next.decoded);

  if (["field-only", "list-only"].includes(upgradeType) && !reportsInScope) {
    for (const report of nextReports) {
      findings.push(finding("error", "UPGRADE_REPORT_OUT_OF_SCOPE", "Field-only/list-only upgrades must omit FormNewReports and DataReports unless reports are explicitly declared in scope.", { reportType: report.type, title: report.title || null }));
    }
  }

  if (nextReports.length && reportsInScope) {
    const proofByKey = new Map(asArray(proof?.reports).map((item) => [reportKey(item), item]));
    const previousKeys = new Set(previousReports.map(reportKey));
    for (const reportItem of nextReports) {
      const key = reportKey(reportItem);
      const reportProofItem = proofByKey.get(key);
      if (!reportProofItem) {
        findings.push(finding("error", "UPGRADE_REPORT_PROOF_MISSING", "Reports intentionally included in an upgrade require proof for new/update-safe/duplicate classification.", { report: key }));
      } else if (reportProofItem.updateSafe !== true && reportProofItem.isNew !== true) {
        findings.push(finding("error", "UPGRADE_REPORT_NOT_UPDATE_SAFE", "Included report is not proven new or update-safe.", { report: key, classification: reportProofItem.classification || null }));
      }
      if (previousKeys.has(key) && reportProofItem?.updateSafe !== true) {
        findings.push(finding("error", "UPGRADE_DUPLICATE_EXISTING_REPORT", "Duplicate existing reports must fail before live upgrade unless update-safe proof is provided.", { report: key }));
      }
    }
  }

  return buildReport(previousPackage, newPackage, scope, reportProof, findings, {
    previousReportCount: previousReports.length,
    newPackageReportCount: nextReports.length,
    reportsInScope,
  });
}

function collectReports(decoded) {
  const out = [];
  for (const [type, items] of [["FormNewReports", decoded?.FormNewReports], ["DataReports", decoded?.DataReports]]) {
    asArray(items).forEach((item, index) => out.push({ type, index, title: String(item?.Title || item?.Name || item?.ReportName || ""), id: String(item?.ID || item?.ReportID || item?.LayoutID || "") }));
  }
  return out;
}

function reportKey(item) {
  return `${item.type || item.reportType || "report"}:${item.id || item.reportId || item.title || item.name || item.Title || ""}`;
}

function readPackageLike(file) {
  const parsed = readJson(file);
  if (isObject(parsed) && typeof parsed.Resource === "string") {
    return readDecodedYapk(file);
  }
  return { wrapper: null, decoded: parsed };
}

function readJson(file) {
  return JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
}

function buildReport(previousPackage, newPackage, scope, reportProof, findings, summary = {}) {
  return {
    status: findings.some((item) => item.level === "error") ? "fail" : "pass",
    previousPackage: safePath(previousPackage),
    newPackage: safePath(newPackage),
    scope: safePath(scope),
    reportProof: safePath(reportProof),
    summary,
    proofBoundary: "Report scope validation prevents duplicate or out-of-scope report resources before upgrade signing/apply. It does not prove Version Management final status.",
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
    else if (token === "--previous-package") args.previousPackage = argv[++i];
    else if (token === "--new-package" || token === "--package") args.newPackage = argv[++i];
    else if (token === "--scope") args.scope = argv[++i];
    else if (token === "--report-proof") args.reportProof = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/validate-yapk-upgrade-report-scope.mjs --previous-package <previous.json|yapk> --new-package <new.json|yapk> --scope <upgrade-scope.json> [--report-proof <report-proof.json>]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
