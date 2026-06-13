#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, normalizePackage, readJsonFile, readPackageLike, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package || !args.lineage) usage(args.help ? 0 : 1);
  const report = inspectYapkUpgradeAppIdentity(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectYapkUpgradeAppIdentity({ package: packagePath, lineage: lineagePath, changeScope = "declared" } = {}) {
  const findings = [];
  let pkg;
  let lineage;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "UPGRADE_IDENTITY_PACKAGE_READ_FAILED", `Could not read YAPK package: ${error.message}`);
    return buildReport(packagePath, lineagePath, findings);
  }
  try {
    lineage = readJsonFile(lineagePath);
  } catch (error) {
    addFinding(findings, "error", "UPGRADE_IDENTITY_LINEAGE_READ_FAILED", `Could not read package lineage metadata: ${error.message}`);
    return buildReport(packagePath, lineagePath, findings);
  }

  const expectedListSetId = scalar(lineage.installedListSetID || lineage.installedListSetId || lineage.previousListSetID || lineage.previousListSetId);
  const actualListSetId = scalar(pkg.root.ListID || pkg.root.ListSetID || pkg.root.ID);
  if (!expectedListSetId) addFinding(findings, "error", "UPGRADE_LINEAGE_LISTSETID_MISSING", "Package lineage must include installed/previous ListSetID.");
  else if (actualListSetId && actualListSetId !== expectedListSetId) {
    addFinding(findings, "error", "UPGRADE_LISTSETID_DRIFT", "Generated ListSetID differs from installed/previous app ListSetID.", {
      expectedListSetID: expectedListSetId,
      actualListSetID: actualListSetId,
    });
  }

  if (lineage.requestedOperation === "update" && lineage.packageClassification === "fresh-install") {
    addFinding(findings, "error", "UPGRADE_CLASSIFIED_AS_FRESH_INSTALL", "Package is classified as fresh install when the user requested an update.");
  }
  if (!lineage.packageLineageId && !lineage.previousPackage && !lineage.previousPackageId) {
    addFinding(findings, "error", "UPGRADE_PACKAGE_LINEAGE_MISSING", "Upgrade package lineage is missing.");
  }
  if (lineage.existingAppIdentityStable === false) {
    addFinding(findings, "error", "UPGRADE_APP_IDENTITY_DRIFT", "Existing app identity drifted during upgrade generation.");
  }
  if (Array.isArray(lineage.existingResourceIdChanges) && lineage.existingResourceIdChanges.length) {
    addFinding(findings, "error", "UPGRADE_EXISTING_RESOURCE_IDS_REALLOCATED", "Existing resource IDs must not be reallocated during UI upgrades.", { changedCount: lineage.existingResourceIdChanges.length });
  }
  if (Array.isArray(lineage.outOfScopeResourceChanges) && lineage.outOfScopeResourceChanges.length) {
    addFinding(findings, "error", "UPGRADE_OUT_OF_SCOPE_RESOURCE_MUTATION", "Existing pages/resources changed outside declared change scope.", { changedCount: lineage.outOfScopeResourceChanges.length, changeScope });
  }
  if (lineage.replaceIdsRebuiltFromFinalPackage !== true) {
    addFinding(findings, "error", "UPGRADE_REPLACEIDS_NOT_FINAL_REBUILT", "Resource.ReplaceIds must be rebuilt from final package contents after all mutations.");
  }
  if (lineage.replaceIdsFinalCoverage === false) {
    addFinding(findings, "error", "UPGRADE_REPLACEIDS_FINAL_COVERAGE_FAILED", "Resource.ReplaceIds final coverage remains enforced for UI upgrades.");
  }

  return buildReport(packagePath, lineagePath, findings, {
    expectedListSetID: expectedListSetId || null,
    actualListSetID: actualListSetId || null,
    requestedOperation: lineage.requestedOperation || null,
    packageClassification: lineage.packageClassification || null,
  });
}

function buildReport(packagePath, lineagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    lineage: safePath(lineagePath),
    summary,
    proofBoundary: "This gate validates upgrade app identity and ListSetID lineage. It complements semantic YAPK upgrade ID stability and does not prove runtime UI correctness.",
    findings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--lineage") args.lineage = argv[++i];
    else if (arg === "--change-scope") args.changeScope = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-yapk-upgrade-app-identity.mjs --package <decoded.json|app.yapk> --lineage <lineage.json> [--change-scope <scope>]");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
