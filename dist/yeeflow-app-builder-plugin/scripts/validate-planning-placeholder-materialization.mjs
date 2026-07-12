#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";
import { cleanPlanningLabel, isPlanningPlaceholder } from "./lib/planning-placeholder-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validatePlanningPlaceholderMaterialization(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validatePlanningPlaceholderMaterialization(options = {}) {
  const packagePath = path.resolve(options.package || "");
  const findings = [];
  let decoded = null;
  if (!fs.existsSync(packagePath)) {
    findings.push(finding("PLANNING_PLACEHOLDER_PACKAGE_MISSING", "Generated-final package or decoded JSON file is missing.", { packagePath }));
  } else {
    try {
      decoded = readPackageOrDecoded(packagePath);
    } catch (error) {
      findings.push(finding("PLANNING_PLACEHOLDER_PACKAGE_DECODE_FAILED", `Could not decode generated-final package: ${error.message}`, { packagePath }));
    }
  }

  if (decoded) {
    for (const identity of collectResourceIdentities(decoded)) {
      if (!isPlanningPlaceholder(identity.value)) continue;
      findings.push(finding(
        "PLANNING_PLACEHOLDER_MATERIALIZED_AS_RESOURCE",
        "Planning placeholder text must not be emitted as a generated resource, page, report, workflow, navigation group, or navigation item.",
        identity,
      ));
    }
  }

  return {
    status: findings.length ? "fail" : "pass",
    package: packagePath,
    plan: options.plan ? path.resolve(options.plan) : null,
    errors: findings.length,
    findings,
  };
}

function collectResourceIdentities(decoded) {
  const identities = [];
  addIdentity(identities, "application", "$.ListSet.Title", decoded?.ListSet?.Title);
  asArray(decoded?.Pages).forEach((page, index) => addIdentity(identities, "dashboard-page", `$.Pages[${index}].Title`, page?.Title || page?.Name));
  asArray(decoded?.Childs).forEach((child, index) => addIdentity(identities, "child-resource", `$.Childs[${index}].List.Title`, child?.List?.Title || child?.Title));
  asArray(decoded?.Forms).forEach((form, index) => addIdentity(identities, "workflow", `$.Forms[${index}].Name`, form?.Name || form?.Title));
  for (const collectionName of ["FormReports", "FormNewReports", "DataReports", "OtherModules"]) {
    asArray(decoded?.[collectionName]).forEach((resource, index) => addIdentity(identities, collectionName, `$.${collectionName}[${index}].Name`, resource?.Name || resource?.Title));
  }
  const navigation = parseJsonMaybe(decoded?.ListSet?.LayoutView);
  asArray(navigation?.sort).forEach((group, groupIndex) => {
    addIdentity(identities, "navigation-group", `$.ListSet.LayoutView.sort[${groupIndex}].Title`, group?.Title);
    asArray(group?.list).forEach((item, itemIndex) => {
      addIdentity(identities, "navigation-item", `$.ListSet.LayoutView.sort[${groupIndex}].list[${itemIndex}].Title`, item?.Title);
      addIdentity(identities, "navigation-target", `$.ListSet.LayoutView.sort[${groupIndex}].list[${itemIndex}].Target`, item?.Target);
    });
  });
  return identities;
}

function addIdentity(identities, resourceKind, pathName, value) {
  const cleanValue = cleanPlanningLabel(value);
  if (!cleanValue) return;
  identities.push({ resourceKind, path: pathName, value: cleanValue });
}

function readPackageOrDecoded(file) {
  if (file.toLowerCase().endsWith(".yapk")) return readDecodedYapk(file).decoded;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function finding(code, message, context = {}) {
  return { level: "error", code, message, ...context };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--package") args.package = argv[++index];
    else if (token === "--plan") args.plan = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log("Usage: node scripts/validate-planning-placeholder-materialization.mjs --package <app.yapk|decoded.json> [--plan <yeeflow-app-plan.md>]");
}

function isMainModule() {
  return process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

