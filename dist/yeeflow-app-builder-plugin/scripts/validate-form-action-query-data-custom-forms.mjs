#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";
import { extractFormActionQueryDataPlanRows } from "./validate-form-action-query-data-plan.mjs";

const require = createRequire(import.meta.url);
const {
  QUERY_DATA_MODES,
  classifyFormActionQueryDataStep,
  decodeDataListFieldTarget,
} = require("./lib/form-action-query-data-utils.cjs");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.package) usage(1);
  const decoded = decodePackage(args.package);
  const report = validateCustomFormQueryData(decoded, {
    strictGenerated: args.strictGenerated,
    planMarkdown: args.plan ? fs.readFileSync(args.plan, "utf8") : "",
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

export function validateCustomFormQueryData(decoded, options = {}) {
  const findings = [];
  const forms = collectCustomForms(decoded);
  let queryStepCount = 0;
  const actualSteps = [];
  for (const form of forms) {
    const fieldByName = new Map(form.fields.map((field) => [String(field.FieldName || ""), field]));
    const tempIds = new Set((form.formdef.tempVars || []).map((item) => String(item.id || "")));
    const subListFields = collectSubListFields(form.formdef);
    const boundActionIds = collectBoundActionIds(form.formdef);
    for (const action of form.formdef.actions || []) {
      const querySteps = (action.steps || []).filter((step) => step?.type === "querydata");
      if (!querySteps.length) continue;
      if (!action.id || !boundActionIds.has(String(action.id))) {
        error(findings, "FORM_ACTION_QUERYDATA_ACTION_UNBOUND", "Query Data action must be bound to a form event or control_event_rule.", form, action);
      }
      for (const step of querySteps) {
        queryStepCount += 1;
        actualSteps.push({ list: form.listName, form: form.formName, action: action.name || action.id, step: step.name || "", mode: classifyFormActionQueryDataStep(step), pageSize: step.attrs?.querydata_pagesize ?? 100, pageNumber: step.attrs?.querydata_pageindex ?? 1 });
        validateStep({ step, action, form, fieldByName, tempIds, subListFields, findings, strictGenerated: options.strictGenerated === true });
      }
    }
  }
  validatePlanConformance(options.planMarkdown, actualSteps, findings);
  const errors = findings.filter((item) => item.level === "error").length;
  return {
    ok: errors === 0,
    status: errors === 0 ? "pass" : "fail",
    customFormCount: forms.length,
    queryStepCount,
    errors,
    warnings: findings.filter((item) => item.level === "warning").length,
    findings,
    proofBoundary: "Structural generated-package validation only; runtime query execution and persistence require separate proof.",
  };
}

function validatePlanConformance(markdown, actualSteps, findings) {
  if (!String(markdown || "").trim()) return;
  const planned = extractFormActionQueryDataPlanRows(markdown).filter((row) => /data\s*list|document\s*library/i.test(planValue(row, "Host Surface / Page", "Host Form")));
  for (const row of planned) {
    const expected = {
      list: planValue(row, "Host Resource", "Host Data List"),
      form: planValue(row, "Host Form", "Custom Form"),
      action: planValue(row, "Action Name"),
      step: planValue(row, "Step Name"),
      mode: planValue(row, "Query Mode"),
      pageSize: numericPlanValue(row, "Page Size", 100),
      pageNumber: numericPlanValue(row, "Page Number", 1),
    };
    const matched = actualSteps.some((actual) =>
      same(actual.list, expected.list)
      && same(actual.form, expected.form)
      && same(actual.action, expected.action)
      && same(actual.step, expected.step)
      && actual.mode === expected.mode
      && actual.pageSize === expected.pageSize
      && actual.pageNumber === expected.pageNumber);
    if (!matched) findings.push({
      level: "error",
      code: "FORM_ACTION_QUERYDATA_PLAN_STEP_NOT_MATERIALIZED",
      message: "Planned Data List Form Query Data step was not materialized with the same host, action, step, and mode.",
      context: expected,
    });
  }
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

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function same(left, right) {
  return normalize(left) === normalize(right);
}

function validateStep({ step, action, form, fieldByName, tempIds, subListFields, findings, strictGenerated }) {
  const attrs = step.attrs || {};
  const mode = classifyFormActionQueryDataStep(step);
  const context = { form: form.formName, list: form.listName, action: action.name || action.id, step: step.name || null, mode };
  if (strictGenerated && !String(step.name || "").trim()) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_STEP_NAME_REQUIRED", message: "Generated Query Data steps require a concise business name.", context });
  }
  for (const key of ["AppID", "ListSetID", "ListID", "ListType"]) {
    if (attrs.querydata_list?.[key] === undefined || attrs.querydata_list?.[key] === null || attrs.querydata_list?.[key] === "") {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SOURCE_INCOMPLETE", message: `Query Data source is missing ${key}.`, context });
    }
  }
  if (attrs.querydata_filter !== undefined || (attrs.querydata_filters !== undefined && !Array.isArray(attrs.querydata_filters))) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_SHAPE_INVALID", message: "Use plural querydata_filters[] for Query Data criteria.", context });
  }
  if (attrs.querydata_sorts !== undefined && !Array.isArray(attrs.querydata_sorts)) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SORT_SHAPE_INVALID", message: "querydata_sorts must be an array.", context });
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
  for (const filter of attrs.querydata_filters || []) validateFilter(filter, fieldByName, findings, context);

  const fieldMap = attrs.querydata_fieldmap && typeof attrs.querydata_fieldmap === "object" && !Array.isArray(attrs.querydata_fieldmap)
    ? attrs.querydata_fieldmap
    : {};
  for (const target of Object.values(fieldMap)) {
    const text = String(target || "");
    if (text.startsWith("__temp_")) {
      const tempId = text.slice("__temp_".length);
      if (!tempIds.has(tempId)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_TEMP_TARGET_MISSING", message: `Temp target is not declared: ${tempId}`, context });
      continue;
    }
    const listField = decodeDataListFieldTarget(text);
    if (listField) {
      if (!fieldByName.has(listField)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_LIST_FIELD_TARGET_MISSING", message: `Current-record target field does not exist: ${listField}`, context });
      if (form.role === "view") findings.push({ level: "warning", code: "FORM_ACTION_QUERYDATA_VIEW_FORM_FIELD_WRITE", message: "A View Item form writes current-record fields; prefer New/Edit unless the form has an explicit save workflow.", context });
      continue;
    }
    if (![QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST].includes(mode)) {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DATALIST_TARGET_ENCODING_INVALID", message: `Data List Form target must use __temp_ or ____customListFields_: ${text}`, context });
    }
  }

  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_LIST_SUBLIST) {
    const target = String(attrs.querydata_listname || "");
    const field = fieldByName.get(target);
    if (!field || String(field.Type || "").toLowerCase() !== "list") {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SUBLIST_TARGET_INVALID", message: `Current-record Sub list target is missing or is not Type=list: ${target}`, context });
    }
    const rowFields = subListFields.get(target) || new Set();
    for (const targetField of Object.values(fieldMap)) {
      if (!rowFields.has(String(targetField))) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_SUBLIST_ROW_FIELD_MISSING", message: `Sub list row target does not exist: ${targetField}`, context });
    }
    if (form.role === "view") findings.push({ level: "warning", code: "FORM_ACTION_QUERYDATA_VIEW_FORM_SUBLIST_WORKING_COPY", message: "Query-to-Sub-list on a View Item form is export-proven but New/Edit is preferred for editable working-copy scenarios.", context });
  }
  if (mode === QUERY_DATA_MODES.MULTIPLE_TO_SUBLIST || attrs.querydata_listname_parent === "__variables_") {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_APPROVAL_TARGET_ON_DATALIST_FORM", message: "Data List Forms must not use Approval workflow-variable result targets.", context });
  }
  if (attrs.querydata_totalcount) {
    if (attrs.querydata_totalparent !== "__temp_") {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_DATALIST_COUNT_PARENT_INVALID", message: "Current export proof requires Data List Form result counts to use __temp_.", context });
    } else if (!tempIds.has(String(attrs.querydata_totalcount))) {
      findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_COUNT_TEMP_TARGET_MISSING", message: `Count temp variable is not declared: ${attrs.querydata_totalcount}`, context });
    }
  }
  if (["single_missing_mapping", "single_mixed_targets", "multiple_missing_output", "multiple_unknown_result_target", "unknown"].includes(mode)) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_MODE_INVALID", message: `Unsupported or incomplete Data List Form Query Data mode: ${mode}`, context });
  }
}

function validateFilter(filter, fieldByName, findings, context) {
  if (!filter || !filter.left || filter.op === undefined || filter.right === undefined || (filter.right === null && String(filter.op) !== "11")) {
    findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_INCOMPLETE", message: "Each filter requires left/op/right; export-proven op 11 may use right=null for current-user membership.", context });
    return;
  }
  if (Array.isArray(filter.right)) {
    if (filter.showCus !== false) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_EXPRESSION_MODE_INVALID", message: "Expression-token filter operands require showCus=false.", context });
    for (const token of filter.right) {
      if (token?.exprType !== "list_field") continue;
      const prop = String(token.prop || token.id || "");
      if (prop !== "ListDataID" && !fieldByName.has(prop)) findings.push({ level: "error", code: "FORM_ACTION_QUERYDATA_FILTER_HOST_FIELD_MISSING", message: `Filter expression references a missing host field: ${prop}`, context });
    }
  }
}

function collectCustomForms(decoded) {
  const out = [];
  for (const child of decoded.Childs || []) {
    const fields = child.Fields || [];
    const layoutView = parseJson(child.List?.LayoutView) || {};
    for (const layout of child.Layouts || []) {
      if (Number(layout.Type) !== 1) continue;
      for (const resource of layout.LayoutInResources || []) {
        const formdef = parseJson(resource.Resource);
        if (!formdef) continue;
        out.push({
          listName: child.List?.Title || "",
          formName: layout.Title || formdef.title || "",
          layoutId: String(layout.LayoutID || resource.ID || ""),
          role: layoutRole(layoutView, layout.LayoutID || resource.ID),
          fields,
          formdef,
        });
      }
    }
  }
  return out;
}

function layoutRole(layoutView, layoutId) {
  const id = String(layoutId || "");
  for (const role of ["add", "edit", "view"]) if (String(layoutView?.[role] || "") === id) return role;
  return "custom";
}

function collectBoundActionIds(formdef) {
  const ids = new Set(Object.values(formdef.formAction || {}).map(String));
  visit(formdef.children, (node) => {
    if (node?.attrs?.control_event_rule) ids.add(String(node.attrs.control_event_rule));
  });
  return ids;
}

function collectSubListFields(formdef) {
  const out = new Map();
  visit(formdef.children, (node) => {
    if (node?.type !== "list" || !node.binding) return;
    out.set(String(node.binding), new Set((node.attrs?.["list-variables"] || node.attrs?.["list-fields"] || []).map((item) => String(item.id || item.name || ""))));
  });
  return out;
}

function visit(value, callback) {
  if (Array.isArray(value)) return value.forEach((item) => visit(item, callback));
  if (!value || typeof value !== "object") return;
  callback(value);
  for (const child of Object.values(value)) visit(child, callback);
}

function decodePackage(filePath) {
  const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "")));
  return JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64"))));
}

function parseJson(value) {
  if (value && typeof value === "object") return value;
  try { return JSON.parse(String(value || "")); } catch { return null; }
}

function error(findings, code, message, form, action) {
  findings.push({ level: "error", code, message, context: { list: form.listName, form: form.formName, action: action.name || action.id } });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--package") out.package = argv[++i];
    else if (argv[i] === "--plan") out.plan = argv[++i];
    else if (argv[i] === "--strict-generated") out.strictGenerated = true;
    else if (argv[i] === "--help" || argv[i] === "-h") usage(0);
    else usage(1);
  }
  return out;
}

function usage(code) {
  console.error("Usage: node scripts/validate-form-action-query-data-custom-forms.mjs --package <app.yapk> [--plan <app-plan.md>] [--strict-generated]");
  process.exit(code);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
