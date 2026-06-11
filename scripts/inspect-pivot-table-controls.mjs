#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SUPPORTED_SOURCE_TYPES = new Map([
  [1, "Data list"],
  [16, "Document library"],
  [32, "Form report"],
  [64, "Data report"],
]);
const NUMERIC_FIELD_TYPES = new Set(["input_number", "currency", "percent", "rate", "calculated-column", "Decimal", "Int", "Bigint", "Number"]);
const DATE_FIELD_TYPES = new Set(["datepicker", "time", "Datetime", "Datetime", "Date", "Time"]);
const COUNT_AGGREGATIONS = new Set(["COUNT", "COUNT_DISTINCT"]);
const NUMERIC_AGGREGATIONS = new Set(["SUM", "AVG", "MIN", "MAX"]);
const DATE_GROUPINGS = new Set(["DAY", "MONTH", "QUARTER", "YEAR"]);
const SYSTEM_FIELDS = new Set(["ListDataID", "Created", "Modified", "CreatedBy", "ModifiedBy"]);
const ID_KEYS = new Set(["id", "idx", "key", "i", "AppID", "ListID", "ListSetID", "TenantID", "FieldID", "LayoutID", "RefId"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-pivot-table-controls.mjs <input.yap|decoded.json> [--page Dashboard] [--out report.json] [--out-dir normalized-dir]",
    "",
    "Decodes a Yeeflow .yap read-only and inventories Dashboard Pivot Table Data Analytics controls.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, page: "Dashboard", out: null, outDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--page") args.page = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeInput(inputPath) {
  const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return { wrapper: parsed, resource, data: parseJson(resource.Data), inputType: "wrapped-yap" };
  }
  if (typeof parsed.Data === "string") return { wrapper: null, resource: parsed, data: parseJson(parsed.Data), inputType: "resource-json" };
  return { wrapper: null, resource: null, data: parsed, inputType: "decoded-json" };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function tryParseJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function buildSourceIndex(data) {
  const byId = new Map();
  for (const item of [data && data.Item, ...asArray(data && data.Childs)].filter(Boolean)) {
    const model = item.ListModel || {};
    const listId = safeString(model.ListID || item.ListID);
    if (!listId) continue;
    const fields = new Map();
    for (const field of asArray(item.Defs)) {
      for (const key of [field.FieldName, field.InternalName, field.FieldID]) {
        if (safeString(key)) fields.set(safeString(key), field);
      }
    }
    byId.set(listId, {
      placeholder: `<source:${byId.size + 1}>`,
      title: safeString(model.Title || item.Title),
      type: Number(model.Type),
      sourceClass: SUPPORTED_SOURCE_TYPES.get(Number(model.Type)) || `Type ${safeString(model.Type) || "unknown"}`,
      fields,
    });
  }
  return byId;
}

function extractTargetPages(data, pageName) {
  const pages = [];
  for (const [layoutIndex, layout] of asArray(data && data.Item && data.Item.Layouts).entries()) {
    if (Number(layout.Type) !== 103 || safeString(layout.Title) !== pageName) continue;
    const layoutResource = asArray(layout.LayoutInResources)[0] || {};
    const page = tryParseJson(layoutResource.Resource);
    if (!isObject(page)) continue;
    pages.push({ layoutIndex, layout, layoutResource, page });
  }
  return pages;
}

function findPivotControls(page) {
  const controls = [];
  walk(page, (node, pointer) => {
    if (isObject(node) && safeString(node.type) === "pivot-table") {
      controls.push({ control: node, pointer });
    }
  });
  return controls;
}

function fieldSummary(item, fields) {
  if (!isObject(item)) return null;
  const fieldName = safeString(item.fieldName);
  const field = fields && fields.get(fieldName);
  return {
    field: fieldName || null,
    label: safeString(item.label) || (field && safeString(field.DisplayName)) || null,
    controlType: safeString(item.type) || null,
    fieldType: safeString(item.fieldType || (field && field.Type)) || null,
    aggregation: safeString(item.func) || null,
    idShape: safeString(item.id).replace(fieldName, "<field>") || null,
    resolved: Boolean(!fieldName || field || SYSTEM_FIELDS.has(fieldName)),
  };
}

function collectFilterVariableRefs(value) {
  const refs = [];
  walk(value, (node, pointer) => {
    if (!isObject(node)) return;
    const id = safeString(node.id);
    const name = safeString(node.name);
    if (id.startsWith("__filter_") || name.startsWith("filter_")) {
      refs.push({ pointer, idShape: id ? id.replace(/^__filter_/, "__filter_<filterVar>") : null, name: name || id.replace(/^__filter_/, "") });
    }
  });
  return refs;
}

function validatePivot({ pivot, ext, source, pageFilterVars, controlIndex, findings }) {
  const pathContext = { control: `<pivot:${controlIndex + 1}>`, path: pivot.pointer };
  if (!ext) {
    findings.push({ severity: "error", code: "PIVOT_TABLE_EXT_MISSING", message: "Pivot Table control must have a matching page.exts entry whose i equals the control id.", ...pathContext });
    return;
  }
  if (safeString(ext.key) !== "PivotTable") {
    findings.push({ severity: "warning", code: "PIVOT_TABLE_EXT_KEY_UNKNOWN", message: "Pivot Table ext key should be PivotTable in the export-proven schema.", ...pathContext, key: safeString(ext.key) });
  }
  if (!source) {
    findings.push({ severity: "error", code: "PIVOT_TABLE_DATA_SOURCE_UNRESOLVED", message: "Pivot Table data source ListID must resolve to a package data source.", ...pathContext });
    return;
  }
  if (!SUPPORTED_SOURCE_TYPES.has(source.type)) {
    findings.push({ severity: "warning", code: "PIVOT_TABLE_SOURCE_TYPE_UNPROVEN", message: "Pivot Table source type is not in the product-supported analytics source set.", ...pathContext, sourceClass: source.sourceClass });
  }

  const settings = ext.attr && ext.attr.settings || {};
  const fields = source.fields || new Map();
  for (const axis of ["rows", "columns", "values"]) {
    asArray(settings[axis]).forEach((item, index) => {
      if (!isObject(item)) {
        findings.push({ severity: "warning", code: "PIVOT_TABLE_AXIS_ITEM_UNKNOWN", message: "Pivot Table axis item has an unknown schema variant.", ...pathContext, axis, index });
        return;
      }
      const fieldName = safeString(item.fieldName);
      if (fieldName && !fields.has(fieldName) && !SYSTEM_FIELDS.has(fieldName)) {
        findings.push({ severity: "error", code: `PIVOT_TABLE_${axis.toUpperCase()}_FIELD_UNRESOLVED`, message: "Pivot Table axis field must resolve to the selected data source fields.", ...pathContext, axis, index, field: fieldName });
      }
      const func = safeString(item.func);
      const fieldType = safeString(item.fieldType || (fields.get(fieldName) && fields.get(fieldName).Type));
      if (axis === "values" && func && !COUNT_AGGREGATIONS.has(func) && !NUMERIC_AGGREGATIONS.has(func)) {
        findings.push({ severity: "warning", code: "PIVOT_TABLE_VALUE_AGGREGATION_UNKNOWN", message: "Pivot Table value aggregation is not export-proven.", ...pathContext, aggregation: func });
      }
      if (axis === "values" && NUMERIC_AGGREGATIONS.has(func) && fieldType && !NUMERIC_FIELD_TYPES.has(fieldType)) {
        findings.push({ severity: "warning", code: "PIVOT_TABLE_VALUE_AGGREGATION_FIELD_TYPE_UNPROVEN", message: "Numeric Pivot Table aggregations should target numeric/currency fields where detectable.", ...pathContext, aggregation: func, fieldType });
      }
      if ((axis === "rows" || axis === "columns") && DATE_GROUPINGS.has(func) && fieldType && !DATE_FIELD_TYPES.has(fieldType)) {
        findings.push({ severity: "error", code: "PIVOT_TABLE_DATE_GROUPING_FIELD_TYPE_INVALID", message: "Pivot Table date grouping must target a date/time field where detectable.", ...pathContext, axis, index, grouping: func, fieldType });
      }
      if (func && axis !== "values" && !DATE_GROUPINGS.has(func)) {
        findings.push({ severity: "warning", code: "PIVOT_TABLE_AXIS_GROUPING_UNKNOWN", message: "Pivot Table row/column grouping is not export-proven.", ...pathContext, axis, index, grouping: func });
      }
    });
  }

  asArray(settings.Conditions).forEach((condition, index) => {
    const left = safeString(condition && condition.left);
    if (left && !fields.has(left) && !SYSTEM_FIELDS.has(left)) {
      findings.push({ severity: "error", code: "PIVOT_TABLE_FILTER_FIELD_UNRESOLVED", message: "Pivot Table filter condition left field must resolve to the selected source fields.", ...pathContext, condition: index, field: left });
    }
    for (const ref of collectFilterVariableRefs(condition)) {
      if (ref.name && !pageFilterVars.has(ref.name)) {
        findings.push({ severity: "error", code: "PIVOT_TABLE_FILTER_VARIABLE_UNRESOLVED", message: "Pivot Table filter variable must resolve to page.filterVars.", ...pathContext, condition: index, filterVar: ref.name });
      }
    }
  });
}

function summarizePivot({ pivot, ext, source, index }) {
  const settings = ext && ext.attr && ext.attr.settings || {};
  const fields = source && source.fields || new Map();
  return {
    control: `<pivot:${index + 1}>`,
    controlType: "pivot-table",
    extKey: safeString(ext && ext.key) || null,
    extCategory: safeString(ext && ext.category) || null,
    location: pivot.pointer.replace(/\d+/g, "<n>"),
    dataSource: source ? { placeholder: source.placeholder, sourceClass: source.sourceClass, exportType: source.type } : null,
    rows: asArray(settings.rows).map((item) => fieldSummary(item, fields)).filter(Boolean),
    columns: asArray(settings.columns).map((item) => fieldSummary(item, fields)).filter(Boolean),
    values: asArray(settings.values).map((item) => fieldSummary(item, fields)).filter(Boolean),
    filters: asArray(settings.Conditions).map((condition) => ({
      left: safeString(condition && condition.left) || null,
      operator: safeString(condition && condition.op) || null,
      filterVariables: collectFilterVariableRefs(condition).map((ref) => ref.name),
      hasStaticRightValue: asArray(condition && condition.right).some((item) => !isObject(item) || !safeString(item.id).startsWith("__filter_")),
    })),
    styleSections: Object.keys(pivot.control.attrs || {}).filter((key) => !["rows", "columns", "values"].includes(key)),
    layoutColumns: pivot.control.attrs && pivot.control.attrs.columns ? Object.keys(pivot.control.attrs.columns) : [],
    layoutRows: pivot.control.attrs && pivot.control.attrs.rows ? Object.keys(pivot.control.attrs.rows) : [],
    showSorter: pivot.control.attrs && pivot.control.attrs.showsorter,
    showGrandTotal: pivot.control.attrs && pivot.control.attrs.values ? pivot.control.attrs.values.showtotal !== false : true,
    proofLevel: "export-proven",
  };
}

function redactValue(value) {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!isObject(value)) {
    if (typeof value === "string") {
      if (LARGE_INTEGER_RE.test(value) || /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)) return "<id>";
      return value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "<email>").replace(/https?:\/\/[^\s"')]+/gi, "<url>");
    }
    return value;
  }
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (ID_KEYS.has(key) || /id$/i.test(key)) out[key] = "<id>";
    else if (key === "Title" || key === "title") out[key] = "<title>";
    else out[key] = redactValue(child);
  }
  return out;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeNormalizedRefs(outDir, report) {
  const first = report.pivotTables[0];
  const countPivot = report.pivotTables.find((item) => item.values.some((value) => value.aggregation === "COUNT"));
  const sumPivot = report.pivotTables.find((item) => item.values.some((value) => value.aggregation === "SUM"));
  const monthPivot = report.pivotTables.find((item) => item.columns.some((column) => column.aggregation === "MONTH"));
  const quarterPivot = report.pivotTables.find((item) => item.columns.some((column) => column.aggregation === "QUARTER"));
  const yearPivot = report.pivotTables.find((item) => item.columns.some((column) => column.aggregation === "YEAR"));
  const filteredPivot = report.pivotTables.find((item) => item.filters.length);

  const refs = {
    "pivot-table-control-resource.normalized.json": first,
    "pivot-table-data-source.normalized.json": first && first.dataSource,
    "pivot-table-rows.normalized.json": first && { rows: first.rows },
    "pivot-table-columns.normalized.json": first && { columns: first.columns },
    "pivot-table-values-count.normalized.json": countPivot && { values: countPivot.values },
    "pivot-table-values-sum.normalized.json": sumPivot && { values: sumPivot.values },
    "pivot-table-date-group-month.normalized.json": monthPivot && { columns: monthPivot.columns },
    "pivot-table-date-group-quarter.normalized.json": quarterPivot && { columns: quarterPivot.columns },
    "pivot-table-date-group-year.normalized.json": yearPivot && { columns: yearPivot.columns },
    "pivot-table-filter-condition.normalized.json": filteredPivot && { filters: filteredPivot.filters },
    "pivot-table-style-header.normalized.json": first && { styleSection: "header", proofLevel: "export-proven" },
    "pivot-table-style-content.normalized.json": first && { styleSection: "body", proofLevel: "export-proven" },
    "pivot-table-style-grand-total.normalized.json": first && { styleSection: "grandtotal", proofLevel: "export-proven" },
    "pivot-table-data-source-data-list.normalized.json": report.pivotTables.find((item) => item.dataSource && item.dataSource.sourceClass === "Data list")?.dataSource,
  };

  for (const [name, value] of Object.entries(refs)) {
    if (!value) continue;
    writeJson(path.join(outDir, name), { proof: "export-proven from CRM sample Dashboard; private identifiers and values redacted", normalized: redactValue(value) });
  }
  writeJson(path.join(outDir, "pivot-table-inventory.normalized.json"), {
    proof: "export-proven from CRM sample Dashboard; private identifiers and values redacted",
    pivotTables: report.pivotTables.map(redactValue),
  });
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const sourceIndex = buildSourceIndex(decoded.data);
  const pages = extractTargetPages(decoded.data, args.page);
  const findings = [];
  if (!pages.length) {
    findings.push({ severity: "error", code: "TARGET_DASHBOARD_PAGE_NOT_FOUND", message: `Dashboard page '${args.page}' was not found.` });
  }

  const pivotTables = [];
  const dataSourceTypes = new Map();
  const aggregationCounts = new Map();
  const dateGroupingCounts = new Map();
  const filterVariableRefs = new Set();
  const styleSections = new Set();

  for (const pageEntry of pages) {
    const pageFilterVars = new Set(asArray(pageEntry.page.filterVars).map((item) => safeString(item.id)).filter(Boolean));
    const controls = findPivotControls(pageEntry.page);
    const extByControlId = new Map(asArray(pageEntry.page.exts).filter((ext) => safeString(ext.key) === "PivotTable" || safeString(ext.category) === "___Pivot___").map((ext) => [safeString(ext.i), ext]));
    controls.forEach((pivot, index) => {
      const ext = extByControlId.get(safeString(pivot.control.id));
      const source = sourceIndex.get(safeString(ext && ext.attr && ext.attr.ListID));
      validatePivot({ pivot, ext, source, pageFilterVars, controlIndex: index, findings });
      const summary = summarizePivot({ pivot, ext, source, index });
      pivotTables.push(summary);
      if (summary.dataSource) dataSourceTypes.set(summary.dataSource.sourceClass, (dataSourceTypes.get(summary.dataSource.sourceClass) || 0) + 1);
      for (const value of summary.values) if (value.aggregation) aggregationCounts.set(value.aggregation, (aggregationCounts.get(value.aggregation) || 0) + 1);
      for (const axis of [...summary.rows, ...summary.columns]) if (DATE_GROUPINGS.has(axis.aggregation)) dateGroupingCounts.set(axis.aggregation, (dateGroupingCounts.get(axis.aggregation) || 0) + 1);
      for (const filter of summary.filters) for (const name of filter.filterVariables) filterVariableRefs.add(name);
      for (const section of summary.styleSections) styleSections.add(section);
    });
  }

  const report = {
    input: path.resolve(args.input),
    inputType: decoded.inputType,
    targetPage: args.page,
    summary: {
      pagesMatched: pages.length,
      pivotTableCount: pivotTables.length,
      dataSourceTypes: Object.fromEntries(dataSourceTypes),
      aggregations: Object.fromEntries(aggregationCounts),
      dateGroupings: Object.fromEntries(dateGroupingCounts),
      filterVariableReferences: [...filterVariableRefs],
      styleSections: [...styleSections].sort(),
    },
    pivotTables,
    findings,
    proofBoundary: {
      dashboardUsage: "export-proven",
      runtimeBehavior: "not runtime-proven",
      dataListFormAvailability: "product/user-understanding-backed unless separately export-proven",
      approvalAndPublicFormNonAvailability: "product/user-understanding-backed",
    },
  };

  if (args.outDir) writeNormalizedRefs(args.outDir, report);
  if (args.out) writeJson(args.out, report);
  console.log(JSON.stringify(report, null, 2));
  const hasErrors = findings.some((finding) => finding.severity === "error");
  process.exit(hasErrors ? 1 : 0);
}

main();
