#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  addFinding,
  allControlsFromPages,
  asArray,
  collectFieldMaps,
  collectPages,
  isObject,
  isSummaryControl,
  looksNumericField,
  normalizePackage,
  readPackageLike,
  safePath,
  scalar,
  statusFromFindings,
} from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.package) usage(args.help ? 0 : 1);
  const report = inspectDashboardSummaryControlContract(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectDashboardSummaryControlContract({ package: packagePath } = {}) {
  const findings = [];
  let pkg;
  try {
    pkg = normalizePackage(readPackageLike(packagePath).decoded);
  } catch (error) {
    addFinding(findings, "error", "SUMMARY_PACKAGE_READ_FAILED", `Could not read package for Summary/KPI inspection: ${error.message}`);
    return buildReport(packagePath, findings);
  }
  const fieldMaps = collectFieldMaps(pkg);
  const pages = collectPages(pkg);
  const summaries = allControlsFromPages(pages).filter((item) => isSummaryControl(item.control));
  const tempVars = new Set();

  for (const item of summaries) {
    validateHiddenHost(item, findings);
    validateSummary(item, pkg, fieldMaps, findings);
    const saveVar = item.control.attrs?.save_var;
    if (isObject(saveVar) && saveVar.name) {
      const name = scalar(saveVar.name);
      if (tempVars.has(`${item.page.layoutId}:${name}`)) {
        addFinding(findings, "error", "SUMMARY_TEMP_VAR_DUPLICATE", "Summary temp variable names must be unique per page/metric.", { page: item.page.title, variable: name });
      }
      tempVars.add(`${item.page.layoutId}:${name}`);
    }
    const controlId = scalar(item.control.id || item.control.ID || item.control.controlId);
    if (controlId && !item.page.reportIds.includes(controlId)) {
      addFinding(findings, "error", "SUMMARY_REPORTIDS_MISSING", "Page ReportIds must include each Summary control ID.", { page: item.page.title, summaryId: controlId });
    }
  }

  if (summaries.length === 0) {
    addFinding(findings, "warning", "SUMMARY_CONTROLS_NOT_FOUND", "No Summary controls were found; run this gate only for dashboards that declare Summary/KPI generation.");
  }

  return buildReport(packagePath, findings, { summaryControlCount: summaries.length });
}

function validateHiddenHost(item, findings) {
  const host = [...item.ancestors].reverse().find((ancestor) => ancestor?.attrs?.common?.hide || ancestor?.attrs?.display?.rule);
  if (!host) {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_MISSING", "Summary controls must be placed in a dedicated hidden host container.", { page: item.page.title, pointer: item.pointer });
    return;
  }
  const attrs = host.attrs || {};
  const hide = attrs.common?.hide;
  if (!Array.isArray(hide) || hide.length < 4 || hide[1] !== true || hide[2] !== true || hide[3] !== true) {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_HIDE_INVALID", "Hidden Summary host must use attrs.common.hide = [null, true, true, true].", { page: item.page.title });
  }
  const direction = attrs.style?.direction;
  if (!Array.isArray(direction) || direction[1] !== "row") {
    addFinding(findings, "error", "SUMMARY_HIDDEN_HOST_DIRECTION_INVALID", "Hidden Summary host must use attrs.style.direction = [null, \"row\"].", { page: item.page.title });
  }
  if (attrs.display && attrs.display.rule !== "1 == 0") {
    addFinding(findings, "warning", "SUMMARY_HIDDEN_HOST_DISPLAY_RULE_UNUSUAL", "Hidden Summary host display rule should preserve the learned non-rendering rule when used.", { page: item.page.title });
  }
}

function validateSummary(item, pkg, fieldMaps, findings) {
  const attrs = item.control.attrs || {};
  const data = attrs.data || {};
  const listId = scalar(data.list?.ListID || data.source?.ListID || data.ListID || attrs.list?.ListID);
  const fieldName = scalar(data.field?.FieldName || data.field?.fieldName || data.field || attrs.field?.FieldName || attrs.field);
  const func = scalar(data.func || attrs.func || data.summaryFunc || attrs.summaryFunc || "count").toLowerCase();

  if (!resolvesCurrentApp(data, pkg)) {
    addFinding(findings, "error", "SUMMARY_APPLICATION_RELATION_INVALID", "Summary Application metadata must resolve to the current app.", { page: item.page.title, pointer: item.pointer });
  }
  if (!listId || !fieldMaps.has(listId)) {
    addFinding(findings, "error", "SUMMARY_DATA_SOURCE_INVALID", "Summary data source must resolve to a real target list.", { page: item.page.title, listId: listId || null });
    return;
  }
  if (!fieldName) {
    addFinding(findings, "error", "SUMMARY_FIELD_BLANK", "Summary Field must not be blank.", { page: item.page.title, listId });
    return;
  }
  const field = fieldMaps.get(listId).fields.get(fieldName);
  if (!field) {
    addFinding(findings, "error", "SUMMARY_FIELD_METADATA_MISSING", "Summary field must resolve to actual target-list field metadata.", { page: item.page.title, listId, field: fieldName });
    return;
  }
  for (const [key, value] of [["attrs.data.field", data.field], ["attrs.field", attrs.field], ["fieldObject", attrs.fieldObject], ["fieldInfo", attrs.fieldInfo]]) {
    if (!isObject(value)) addFinding(findings, "error", "SUMMARY_FIELD_METADATA_INCOMPLETE", `${key} must be populated with designer-shaped field metadata.`, { page: item.page.title, field: fieldName });
  }
  if (func === "count" && !hasCountShape(data, attrs)) {
    addFinding(findings, "error", "SUMMARY_COUNT_FIELD_SHAPE_INVALID", "Count summaries must use a valid count field shape, including ListDataID where required.", { page: item.page.title });
  }
  if (["sum", "avg", "average"].includes(func) && !looksNumericField(field)) {
    addFinding(findings, "error", "SUMMARY_NUMERIC_FIELD_REQUIRED", "Sum/average Summary controls must use numeric fields only.", { page: item.page.title, field: fieldName, func });
  }
  if (!filtersValid(attrs, fieldMaps.get(listId).fields)) {
    addFinding(findings, "error", "SUMMARY_FILTER_SHAPE_INVALID", "Summary filters must use designer-compatible condition/filter shapes that reference real fields.", { page: item.page.title });
  }
  if (!isObject(attrs.save_var) || attrs.save_var.type !== "expr" || attrs.save_var.exprType !== "variable" || !attrs.save_var.id || !attrs.save_var.name) {
    addFinding(findings, "error", "SUMMARY_SAVE_VAR_EXPRESSION_OBJECT_REQUIRED", "Summary save_var must use designer-exported expression-object shape, not a plain string.", { page: item.page.title });
  }
}

function resolvesCurrentApp(data, pkg) {
  const rootId = scalar(pkg.root.ListID || pkg.root.ListSetID || pkg.root.ID);
  const app = data.app || data.application || data.Application || {};
  const appId = scalar(app.ListID || app.ListSetID || app.ID || app.id || data.AppID || data.ListSetID);
  return !appId || !rootId || appId === rootId || appId === "41";
}

function hasCountShape(data, attrs) {
  const candidates = [data.field, attrs.field, attrs.fieldObject, attrs.fieldInfo].filter(isObject);
  return candidates.some((field) => scalar(field.FieldName || field.fieldName) === "ListDataID" || scalar(field.ListDataID));
}

function filtersValid(attrs, fieldMap) {
  const filters = asArray(attrs.data?.filter || attrs.data?.filters || attrs.filter || attrs.filters || attrs.exts?.[0]?.attr?.settings?.Conditions);
  if (!filters.length) return attrs.allowAllRecords === true || attrs.kpiScope === "all-records";
  return filters.every((filter) => {
    const fieldName = scalar(filter.Field || filter.FieldName || filter.field || filter.fieldName || filter.name);
    return fieldName && fieldMap.has(fieldName) && ("Value" in filter || "value" in filter || "Values" in filter || "operator" in filter || "op" in filter);
  });
}

function buildReport(packagePath, findings, summary = {}) {
  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    summary,
    proofStates: ["designer-configured Summary control", "validator-valid Summary contract", "runtime-proven visible dynamic KPI rendering"],
    proofBoundary: "This validates designer-shaped Summary configuration. It does not prove visible dynamic KPI rendering; runtime evidence is a separate gate.",
    findings,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-dashboard-summary-control-contract.mjs --package <decoded.json|app.yapk>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
