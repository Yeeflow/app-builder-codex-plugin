#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value) { return value === null || value === undefined ? "" : String(value).trim(); }
function parse(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}
function error(code, message, path) { return { severity: "error", code, message, path }; }

function usage(exitCode = 1) {
  console.log("Usage: node scripts/validate-data-list-completion-contract.mjs <app.yapk|decoded.json>");
  process.exit(exitCode);
}

function readInput(file) {
  return file.toLowerCase().endsWith(".yapk")
    ? readDecodedYapk(file).decoded
    : JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

export function validateDataListCompletionContract(decoded) {
  const findings = [];
  const children = asArray(decoded?.Childs || decoded?.Data?.Childs);
  children.forEach((child, index) => {
    const list = child?.List || child?.ListModel || {};
    const resourceType = Number(list?.Type);
    if (![1, 16].includes(resourceType)) return;
    const resourceLabel = resourceType === 16 ? "Document Library" : "Data List";
    const pointer = `$.Childs[${index}]`;
    const layouts = asArray(child?.Layouts);
    const defaultView = layouts.find((layout) => Number(layout?.Type) === 0 && layout?.IsDefault === true);
    if (!defaultView) {
      findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_REQUIRED", `A completed ${resourceLabel} requires one default Type 0 data view.`, `${pointer}.Layouts`));
    }
    const formLayouts = layouts.filter((layout) => Number(layout?.Type) === 1);
    const formIds = new Set(formLayouts.map((layout) => text(layout?.LayoutID)).filter(Boolean));
    const settings = parse(list?.LayoutView);
    if (!settings || typeof settings !== "object") {
      findings.push(error("DATA_LIST_COMPLETION_LAYOUTVIEW_REQUIRED", `A completed ${resourceLabel} requires parseable ListModel.LayoutView routing.`, `${pointer}.List.LayoutView`));
      return;
    }
    for (const route of ["add", "edit", "view"]) {
      const layoutId = text(settings?.[route]);
      if (!layoutId || layoutId === "default" || !formIds.has(layoutId)) {
        findings.push(error(
          `DATA_LIST_COMPLETION_${route.toUpperCase()}_FORM_REQUIRED`,
          `A completed ${resourceLabel} requires LayoutView.${route} to resolve to a same-resource Type 1 custom form.`,
          `${pointer}.List.LayoutView.${route}`,
        ));
      }
    }
  });
  return { status: findings.length ? "fail" : "pass", findings };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];
  if (!input || process.argv.includes("--help") || process.argv.includes("-h")) usage(input ? 0 : 1);
  const report = validateDataListCompletionContract(readInput(path.resolve(input)));
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "pass") process.exitCode = 1;
}
