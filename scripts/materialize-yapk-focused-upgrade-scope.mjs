#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, encodeYapkResourceOfficial, isObject, quoteLargeJsonIntegers, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

export function materializeFocusedUpgradeScope({ previousPackage, candidatePackage, scope, out } = {}) {
  const previous = readPackageLike(previousPackage);
  const candidate = readPackageLike(candidatePackage);
  const scopeManifest = readJson(scope);
  const reportsInScope = scopeIncludesReports(scopeManifest);
  const decoded = structuredClone(candidate.decoded);
  const omitted = [];

  if (!reportsInScope) {
    const previousByIdentity = new Map(asArray(previous.decoded?.FormNewReports).map((report) => [reportIdentity(report), report]));
    decoded.FormNewReports = asArray(decoded.FormNewReports).filter((report) => {
      const previousReport = previousByIdentity.get(reportIdentity(report));
      if (!previousReport || stableJson(previousReport) !== stableJson(report)) return true;
      omitted.push({ id: reportId(report), title: reportTitle(report) });
      return false;
    });
    if (omitted.length) decoded.ListSet = omitReportNavigation(decoded.ListSet, omitted);
  }

  const outputPath = path.resolve(out);
  const output = candidate.wrapper
    ? { ...candidate.wrapper, Resource: encodeYapkResourceOfficial(decoded), Sign: "" }
    : decoded;
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  return {
    status: "pass",
    output: outputPath,
    reportsInScope,
    omittedUnchangedFormReports: omitted,
    proofBoundary: "This materialization omits byte-equivalent installed Form reports from a non-Report upgrade payload and matching navigation payload items. It does not prove live upgrade success or installed report preservation.",
  };
}

function omitReportNavigation(listSet, omitted) {
  if (!isObject(listSet) || typeof listSet.LayoutView !== "string") return listSet;
  let layout;
  try { layout = JSON.parse(listSet.LayoutView); } catch { return listSet; }
  const ids = new Set(omitted.map((item) => item.id).filter(Boolean));
  const titles = new Set(omitted.map((item) => item.title.toLowerCase()).filter(Boolean));
  const clean = (value) => {
    if (Array.isArray(value)) return value.filter((item) => !isOmittedNavigationItem(item, ids, titles)).map(clean);
    if (!isObject(value)) return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clean(child)]));
  };
  return { ...listSet, LayoutView: JSON.stringify(clean(layout)) };
}

function isOmittedNavigationItem(item, ids, titles) {
  if (!isObject(item)) return false;
  const id = String(item.ListID || item.ID || item.LayoutID || "");
  if (id && ids.has(id)) return true;
  const title = String(item.Title || item.Name || "").trim().toLowerCase();
  return Boolean(title && titles.has(title) && [32, 105, "32", "105"].includes(item.Type));
}

function scopeIncludesReports(scopeManifest) {
  return asArray(scopeManifest.allowedResourceTypes || scopeManifest.allowedChangeTypes).map((item) => String(item).toLowerCase()).includes("report")
    || asArray(scopeManifest.allowedChanges).map((item) => String(item).toLowerCase()).some((item) => item.includes("report"));
}

function reportIdentity(report) { return String(reportId(report) || reportTitle(report)).trim().toLowerCase(); }
function reportId(report) { return String(report?.ID || report?.ReportID || report?.LayoutID || ""); }
function reportTitle(report) { return String(report?.Title || report?.Name || report?.ReportName || ""); }
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function readPackageLike(file) {
  const parsed = readJson(file);
  return isObject(parsed) && typeof parsed.Resource === "string" ? readDecodedYapk(file) : { wrapper: null, decoded: parsed };
}
function readJson(file) { return JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))); }
function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--previous-package") args.previousPackage = argv[++index];
    else if (token === "--candidate-package" || token === "--new-package") args.candidatePackage = argv[++index];
    else if (token === "--scope") args.scope = argv[++index];
    else if (token === "--out") args.out = argv[++index];
    else if (token === "--help" || token === "-h") args.help = true;
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}
function usage(exitCode) {
  console.error("Usage: node scripts/materialize-yapk-focused-upgrade-scope.mjs --previous-package <installed.yapk|decoded.json> --candidate-package <candidate.yapk|decoded.json> --scope <scope.json> --out <focused-upgrade.yapk|json>");
  process.exit(exitCode);
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.previousPackage || !args.candidatePackage || !args.scope || !args.out) usage(args.help ? 0 : 1);
  console.log(JSON.stringify(materializeFocusedUpgradeScope(args), null, 2));
}
