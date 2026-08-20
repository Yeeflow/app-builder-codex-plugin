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
function fieldName(item) { return text(item?.FieldName ?? item?.field ?? item?.Field); }

function validateDefaultView(defaultView, fields, pointer, findings) {
  const layoutId = text(defaultView?.LayoutID);
  if (!layoutId) {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_ID_REQUIRED", "The default Type 0 data view must have a LayoutID.", `${pointer}.LayoutID`));
  }
  if (!text(defaultView?.Title)) {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_TITLE_REQUIRED", "The default Type 0 data view must have a meaningful view title.", `${pointer}.Title`));
  }
  const ext1 = parse(defaultView?.Ext1);
  if (ext1?.Url !== "default") {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_URL_REQUIRED", "The default Type 0 data view must set Ext1.Url to default.", `${pointer}.Ext1`));
  }
  const view = parse(defaultView?.LayoutView);
  if (!view || typeof view !== "object" || Array.isArray(view)) {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_LAYOUTVIEW_REQUIRED", "The default Type 0 data view must have parseable LayoutView settings.", `${pointer}.LayoutView`));
    return;
  }
  const columns = asArray(view.layout);
  const queries = asArray(view.query);
  if (!columns.length) {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_COLUMNS_REQUIRED", "The default Type 0 data view must define visible display columns.", `${pointer}.LayoutView.layout`));
  }
  if (!queries.length) {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_QUERY_REQUIRED", "The default Type 0 data view must define query fields for its visible columns.", `${pointer}.LayoutView.query`));
  }
  const resolvedFields = new Set(fields.map((field) => fieldName(field)).filter(Boolean));
  const queryFields = new Set(queries.map(fieldName).filter(Boolean));
  for (const [index, column] of columns.entries()) {
    const name = fieldName(column);
    if (!name || !resolvedFields.has(name)) {
      findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_COLUMN_UNRESOLVED", "Every default-view display column must resolve to a field on the same Data List.", `${pointer}.LayoutView.layout[${index}]`));
      continue;
    }
    if (!queryFields.has(name)) {
      findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_QUERY_COVERAGE_REQUIRED", `Default-view query fields must include visible column ${name}.`, `${pointer}.LayoutView.query`));
    }
  }
  if (columns.length && fieldName(columns[0]) !== "Title") {
    findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_TITLE_FIRST", "The native Title field must be the first default-view display column.", `${pointer}.LayoutView.layout[0]`));
  }
}

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
    const defaultViews = layouts.filter((layout) => Number(layout?.Type) === 0 && layout?.IsDefault === true);
    if (defaultViews.length !== 1) {
      findings.push(error("DATA_LIST_COMPLETION_DEFAULT_VIEW_REQUIRED", `A completed ${resourceLabel} requires one default Type 0 data view.`, `${pointer}.Layouts`));
    } else {
      validateDefaultView(defaultViews[0], asArray(child?.Defs ?? child?.Fields), `${pointer}.Layouts[${layouts.indexOf(defaultViews[0])}]`, findings);
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
