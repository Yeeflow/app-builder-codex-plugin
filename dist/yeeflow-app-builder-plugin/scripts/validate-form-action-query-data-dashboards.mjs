#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";
import { extractFormActionQueryDataPlanRows } from "./validate-form-action-query-data-plan.mjs";

const require = createRequire(import.meta.url);
const { QUERY_DATA_MODES, classifyFormActionQueryDataStep } = require("./lib/form-action-query-data-utils.cjs");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.package) usage(1);
  const decoded = decodePackage(args.package);
  const report = validateDashboardQueryData(decoded, {
    strictGenerated: args.strictGenerated,
    planMarkdown: args.plan ? fs.readFileSync(args.plan, "utf8") : "",
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

export function validateDashboardQueryData(decoded, options = {}) {
  const findings = [];
  const dashboards = collectDashboards(decoded);
  const actualSteps = [];
  let queryStepCount = 0;
  for (const dashboard of dashboards) {
    const tempIds = new Set((dashboard.formdef.tempVars || []).map((item) => String(item.id || "")));
    const boundActionIds = collectBoundActionIds(dashboard.formdef);
    for (const action of dashboard.formdef.actions || []) {
      const querySteps = (action.steps || []).filter((step) => step?.type === "querydata");
      if (!querySteps.length) continue;
      if (!action.id || !boundActionIds.has(String(action.id))) {
        error(findings, "FORM_ACTION_QUERYDATA_DASHBOARD_ACTION_UNBOUND", "Dashboard Query Data action must be bound to a page or control event.", dashboard, action);
      }
      const producedTemps = new Set();
      for (const [stepIndex, step] of querySteps.entries()) {
        queryStepCount += 1;
        const mode = classifyFormActionQueryDataStep(step);
        actualSteps.push({ page: dashboard.pageName, action: action.name || action.id, step: step.name || "", mode, pageSize: step.attrs?.querydata_pagesize ?? 100, pageNumber: step.attrs?.querydata_pageindex ?? 1 });
        validateStep({ step, stepIndex, action, dashboard, tempIds, producedTemps, findings, strictGenerated: options.strictGenerated === true });
        for (const id of outputTempIds(step)) producedTemps.add(id);
      }
    }
    validateCountVisibility(dashboard, findings);
    validateTempCollectionConsumers(dashboard, findings);
  }
  validatePlanConformance(options.planMarkdown, actualSteps, findings);
  const errors = findings.filter((item) => item.level === "error").length;
  return {
    ok: errors === 0,
    status: errors === 0 ? "pass" : "fail",
    dashboardCount: dashboards.length,
    queryStepCount,
    errors,
    warnings: findings.filter((item) => item.level === "warning").length,
    findings,
    paginationContract: { defaultPageSize: 100, maxPageSize: 1000, defaultPageNumber: 1 },
    proofBoundary: "Structural Dashboard Form Action validation only; runtime query results and Custom Code rendering require separate proof.",
  };
}

function validateStep({ step, stepIndex, action, dashboard, tempIds, producedTemps, findings, strictGenerated }) {
  const attrs = step.attrs || {};
  const mode = classifyFormActionQueryDataStep(step);
  const context = { page: dashboard.pageName, action: action.name || action.id, step: step.name || null, stepIndex, mode };
  if (strictGenerated && !String(step.name || "").trim()) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_STEP_NAME_REQUIRED", message: "Generated Dashboard Query Data steps require a concise business name.", context });
  }
  for (const key of ["AppID", "ListSetID", "ListID", "ListType"]) {
    if (attrs.querydata_list?.[key] === undefined || attrs.querydata_list?.[key] === null || attrs.querydata_list?.[key] === "") {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SOURCE_INCOMPLETE", message: `Query Data source is missing ${key}.`, context });
    }
  }
  if (![QUERY_DATA_MODES.SINGLE_TO_TEMP_VARIABLES, QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION, QUERY_DATA_MODES.MULTIPLE_COUNT_ONLY].includes(mode)) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DASHBOARD_MODE_INVALID", message: `Dashboard Query Data may write only temp variables/temp collections: ${mode}`, context });
  }
  const pageSize = attrs.querydata_pagesize ?? 100;
  if (!Number.isInteger(Number(pageSize)) || Number(pageSize) < 1 || Number(pageSize) > 1000) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_PAGE_SIZE_INVALID", message: "Query Data Page Size must be an integer from 1 to 1000; omitted means 100.", context: { ...context, pageSize } });
  }
  const pageNumber = attrs.querydata_pageindex ?? 1;
  if (!Number.isInteger(Number(pageNumber)) || Number(pageNumber) < 1) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_PAGE_NUMBER_INVALID", message: "Query Data Page Number uses querydata_pageindex and must be a positive integer; omitted means 1.", context: { ...context, pageNumber } });
  }
  if (attrs.querydata_pagenumber !== undefined || attrs.querydata_page !== undefined) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_PAGE_NUMBER_PROPERTY_INVALID", message: "Use export-proven querydata_pageindex for Page Number.", context });
  }
  const fieldMap = isObject(attrs.querydata_fieldmap) ? attrs.querydata_fieldmap : {};
  for (const target of Object.values(fieldMap)) validateTempTarget(target, tempIds, findings, context);
  if (attrs.querydata_listname) {
    if (attrs.querydata_listname_parent !== "__temp_") findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DASHBOARD_RESULT_PARENT_INVALID", message: "Dashboard record results must use __temp_.", context });
    if (!tempIds.has(String(attrs.querydata_listname))) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_TEMP_TARGET_MISSING", message: `Dashboard temp collection is not declared: ${attrs.querydata_listname}`, context });
  }
  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_TEMP_COLLECTION && (!Array.isArray(attrs.querydata_fields) || attrs.querydata_fields.length === 0)) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SELECTED_FIELDS_MISSING", message: "Dashboard temp JSON results require explicit querydata_fields[].", context });
  }
  if (attrs.querydata_totalcount) {
    if (attrs.querydata_totalparent !== "__temp_") findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DASHBOARD_COUNT_PARENT_INVALID", message: "Dashboard result counts must use __temp_.", context });
    if (!tempIds.has(String(attrs.querydata_totalcount))) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_COUNT_TEMP_TARGET_MISSING", message: `Dashboard count temp variable is not declared: ${attrs.querydata_totalcount}`, context });
  }
  for (const filter of attrs.querydata_filters || []) {
    if (!filter || !filter.left || filter.op === undefined || filter.right === undefined || (filter.right === null && String(filter.op) !== "11")) {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_INCOMPLETE", message: "Each filter requires left/op/right; export-proven op 11 may use right=null for current-user membership.", context });
      continue;
    }
    if (Array.isArray(filter.right) && filter.showCus !== false) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_EXPRESSION_MODE_INVALID", message: "Expression-token filters require showCus=false.", context });
    for (const tempId of referencedTempIds(filter.right)) {
      if (!tempIds.has(tempId)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_TEMP_MISSING", message: `Filter references undeclared temp variable: ${tempId}`, context });
      if (!producedTemps.has(tempId)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_CHAIN_INPUT_NOT_PRODUCED", message: `Chained Query Data input must be produced by an earlier step: ${tempId}`, context });
      if (!hasNotEmptyGuard(step.condition, tempId)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_CHAIN_GUARD_MISSING", message: `Chained query must guard ${tempId} with isNullOrEmpty(...) == false.`, context });
    }
  }
}

function validateTempTarget(target, tempIds, findings, context) {
  const text = String(target || "");
  if (!text.startsWith("__temp_")) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DASHBOARD_TARGET_NOT_TEMP", message: `Dashboard field target must use __temp_: ${text}`, context });
    return;
  }
  const id = text.slice("__temp_".length);
  if (!tempIds.has(id)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_TEMP_TARGET_MISSING", message: `Dashboard temp target is not declared: ${id}`, context });
}

function outputTempIds(step) {
  const attrs = step.attrs || {};
  const out = [];
  for (const target of Object.values(isObject(attrs.querydata_fieldmap) ? attrs.querydata_fieldmap : {})) {
    const text = String(target || "");
    if (text.startsWith("__temp_")) out.push(text.slice("__temp_".length));
  }
  if (attrs.querydata_listname_parent === "__temp_" && attrs.querydata_listname) out.push(String(attrs.querydata_listname));
  if (attrs.querydata_totalparent === "__temp_" && attrs.querydata_totalcount) out.push(String(attrs.querydata_totalcount));
  return out;
}

function referencedTempIds(value) {
  const out = new Set();
  visit(value, (node) => {
    if (node?.exprType !== "variable") return;
    const id = String(node.id || "");
    if (id.startsWith("__temp_")) out.add(id.slice("__temp_".length));
  });
  return out;
}

function hasNotEmptyGuard(condition, tempId) {
  if (!Array.isArray(condition)) return false;
  const serialized = JSON.stringify(condition);
  return serialized.includes('"func":"isNullOrEmpty"')
    && serialized.includes(`"id":"__temp_${tempId}"`)
    && serialized.includes('"value":false');
}

function validateCountVisibility(dashboard, findings) {
  const countIds = new Set();
  for (const action of dashboard.formdef.actions || []) for (const step of action.steps || []) {
    if (step?.type === "querydata" && step.attrs?.querydata_totalparent === "__temp_" && step.attrs?.querydata_totalcount) countIds.add(String(step.attrs.querydata_totalcount));
  }
  if (!countIds.size) return;
  const serializedChildren = JSON.stringify(dashboard.formdef.children || []);
  for (const id of countIds) {
    if (!serializedChildren.includes(`__temp_${id}`)) findings.push({ level: "warning", code: "FORM_ACTION_QUERYDATA_COUNT_TEMP_UNUSED", message: `Dashboard count temp variable is produced but not used by visible content or dynamic display: ${id}`, context: { page: dashboard.pageName } });
  }
}

function validateTempCollectionConsumers(dashboard, findings) {
  const tempCollectionIds = new Set();
  for (const action of dashboard.formdef.actions || []) for (const step of action.steps || []) {
    if (step?.type === "querydata" && step.attrs?.querydata_listname_parent === "__temp_" && step.attrs?.querydata_listname) {
      tempCollectionIds.add(String(step.attrs.querydata_listname));
    }
  }
  if (!tempCollectionIds.size) return;
  const forbiddenTypes = new Set(["collection", "data-table", "data_table", "datatable"]);
  visit(dashboard.formdef.children, (node) => {
    if (!forbiddenTypes.has(String(node?.type || "").toLowerCase())) return;
    const serialized = JSON.stringify(node);
    for (const id of tempCollectionIds) {
      if (serialized.includes(`__temp_${id}`)) findings.push({
        level: "error",
        code: "FORM_ACTION_QUERYDATA_TEMP_COLLECTION_DIRECT_DATA_CONTROL_BINDING",
        message: "Collection and Data Table controls cannot read a Query Data temp JSON object directly; use a normal data source or an explicitly planned Custom Code renderer.",
        context: { page: dashboard.pageName, tempId: id, controlType: node.type },
      });
    }
  });
}

function validatePlanConformance(markdown, actualSteps, findings) {
  if (!String(markdown || "").trim()) return;
  const planned = extractFormActionQueryDataPlanRows(markdown).filter((row) => /dashboard/i.test(planValue(row, "Host Surface / Page", "Host Form")));
  for (const row of planned) {
    const expected = {
      page: planValue(row, "Host Resource", "Host Form"),
      action: planValue(row, "Action Name"),
      step: planValue(row, "Step Name"),
      mode: planValue(row, "Query Mode"),
      pageSize: numericPlanValue(row, "Page Size", 100),
      pageNumber: numericPlanValue(row, "Page Number", 1),
    };
    const matched = actualSteps.some((actual) => same(actual.page, expected.page) && same(actual.action, expected.action) && same(actual.step, expected.step) && actual.mode === expected.mode && actual.pageSize === expected.pageSize && actual.pageNumber === expected.pageNumber);
    if (!matched) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DASHBOARD_PLAN_STEP_NOT_MATERIALIZED", message: "Planned Dashboard Query Data step was not materialized with the same page, action, step, mode, and pagination.", context: expected });
  }
}

function collectDashboards(decoded) {
  const out = [];
  for (const page of decoded.Pages || []) for (const resource of page.LayoutInResources || []) {
    const formdef = parseJson(resource.Resource);
    if (formdef) out.push({ pageName: page.Title || formdef.title || "", formdef });
  }
  return out;
}

function collectBoundActionIds(formdef) {
  const ids = new Set(Object.values(formdef.formAction || {}).map(String));
  visit(formdef.children, (node) => { if (node?.attrs?.control_event_rule) ids.add(String(node.attrs.control_event_rule)); });
  return ids;
}

function planValue(row, ...names) {
  for (const name of names) {
    const key = Object.keys(row || {}).find((candidate) => normalize(candidate) === normalize(name));
    if (key) return String(row[key] || "").trim();
  }
  return "";
}

function numericPlanValue(row, name, fallback) {
  const value = planValue(row, name);
  return /^(?:|none|n\/a|default)$/i.test(value) ? fallback : Number(value);
}

function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function same(left, right) { return normalize(left) === normalize(right); }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function parseJson(value) { try { return typeof value === "string" ? JSON.parse(value) : null; } catch { return null; } }
function visit(value, callback) { if (Array.isArray(value)) return value.forEach((item) => visit(item, callback)); if (!value || typeof value !== "object") return; callback(value); for (const child of Object.values(value)) visit(child, callback); }
function error(findings, code, message, dashboard, action) { findings.push({ level: "error", code, message, context: { page: dashboard.pageName, action: action.name || action.id } }); }
function decodePackage(packagePath) { const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, ""))); return JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64")))); }
function parseArgs(argv) { const out = {}; for (let index = 0; index < argv.length; index += 1) { if (argv[index] === "--package") out.package = argv[++index]; else if (argv[index] === "--plan") out.plan = argv[++index]; else if (argv[index] === "--strict-generated") out.strictGenerated = true; else usage(argv[index] === "--help" ? 0 : 1); } return out; }
function usage(exitCode) { console.error("Usage: node scripts/validate-form-action-query-data-dashboards.mjs --package <app.yapk> [--plan <app-plan.md>] [--strict-generated]"); process.exit(exitCode); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
