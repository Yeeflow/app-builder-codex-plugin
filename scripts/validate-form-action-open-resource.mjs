#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";
import { extractFormActionOpenResourcePlanRows } from "./validate-form-action-open-resource-plan.mjs";

const require = createRequire(import.meta.url);
const { validateFormActionOpenResourceStep } = require("./lib/form-action-open-resource-utils.cjs");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.package) usage(1);
  const report = validatePackage(args.package, args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validatePackage(packagePath, options = {}) {
  try {
    const decoded = decodePackage(packagePath);
    const findings = [];
    const planRows = options.plan ? extractFormActionOpenResourcePlanRows(fs.readFileSync(options.plan, "utf8")) : null;
    const matched = new Set();
    let stepCount = 0;
    for (const entry of collectActions(decoded)) for (const step of entry.action.steps || []) {
      if (!new Set(["listitem", "openform", "opendashboard"]).has(step?.type)) continue;
      const rows = planRows === null ? [] : planRows.filter((row) => matches(row, entry, step));
      if (planRows !== null && !rows.length && options.strictGenerated) findings.push({ severity: "error", code: "FORM_ACTION_OPEN_RESOURCE_UNPLANNED_STEP", message: "Generated open-resource steps must have a matching App Plan row.", host: entry.host, page: entry.page, action: entry.action.name, step: step.name });
      rows.forEach((row) => matched.add(row));
      stepCount += 1;
      for (const finding of validateFormActionOpenResourceStep(step, { hostSurface: entry.surface, strictGenerated: options.strictGenerated })) findings.push({ severity: "error", ...finding, host: entry.host, page: entry.page, action: entry.action.name, step: step.name });
      validateTarget(decoded, entry, step, findings, options);
    }
    for (const row of planRows || []) if (!matched.has(row)) findings.push({ severity: "error", code: "FORM_ACTION_OPEN_RESOURCE_PLANNED_STEP_NOT_MATERIALIZED", message: "A planned open-resource step was not found in the generated package.", host: planValue(row, "Host Resource"), page: planValue(row, "Host Form / Page"), step: planValue(row, "Step Name") });
    return { status: findings.some((item) => item.severity === "error") ? "fail" : "pass", openResourceStepCount: stepCount, findings };
  } catch (error) { return { status: "fail", openResourceStepCount: 0, findings: [{ severity: "error", code: "FORM_ACTION_OPEN_RESOURCE_VALIDATION_FAILED", message: error.message }] }; }
}

function validateTarget(decoded, entry, step, findings, options = {}) {
  const attrs = step.attrs || {};
  if (step.type === "listitem" && attrs.data?.list?.ListID) {
    const target = (decoded.Childs || []).find((child) => String(child.List?.ListID) === String(attrs.data.list.ListID));
    if (!target || ![1, 16].includes(Number(target.List?.Type))) add("FORM_ACTION_OPEN_ITEM_TARGET_UNRESOLVED", "Target ListID must resolve to a Data List or Document Library.");
    if (attrs.layout && target) {
      const layout = (target.Layouts || []).find((item) => String(item.LayoutID) === String(attrs.layout) && Number(item.Type) === 1);
      if (!layout) add("FORM_ACTION_OPEN_ITEM_LAYOUT_UNRESOLVED", "Selected custom form layout must belong to the target resource.");
      else {
        const purposes = inferCustomFormPurposes(target, layout);
        const operation = String(attrs.op_type || "add");
        if (purposes.size && !purposes.has(operation)) add("FORM_ACTION_OPEN_ITEM_LAYOUT_OPERATION_MISMATCH", `Selected custom form ${layout.Title || layout.LayoutID} is not compatible with ${operation}.`);
        else if (!purposes.size && options.strictGenerated) add("FORM_ACTION_OPEN_ITEM_LAYOUT_PURPOSE_UNRESOLVED", "Generated selected custom forms must declare an export-proven Add/Edit/View purpose.");
      }
    }
  }
  if (step.type === "openform") {
    const target = (decoded.Forms || []).find((form) => String(form.Key) === String(attrs.data?.form?.ProcKey));
    if (!target || Number(target.WorkflowType) !== 2) add("FORM_ACTION_OPEN_APPROVAL_TARGET_UNRESOLVED", "ProcKey must resolve to an Approval Form.");
    if (target && attrs.setVars?.Rules) {
      const def = decodeDefResource(target.DefResource);
      const variableRecords = [def.variables, def.vars].flatMap((group) => Array.isArray(group) ? group : Object.values(group || {}).flat()).filter((item) => item && typeof item === "object");
      const variables = new Map();
      for (const variable of variableRecords) for (const key of [variable.id, variable.idx, variable.name].filter(Boolean)) variables.set(String(key), variable);
      for (const rule of attrs.setVars.Rules) {
        const variableId = String(rule.id || rule.idx || rule.source || "");
        const variable = variables.get(variableId);
        if (!variable) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_UNRESOLVED", `Default variable ${variableId} is not declared on the target Approval Form.`);
        else if (options.strictGenerated) {
          const declaredType = normalizeValueType(variable.type);
          const ruleType = normalizeValueType(rule.type);
          const sourceType = inferExpressionType(rule.rule);
          if (declaredType && ruleType && declaredType !== ruleType) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_TYPE_MISMATCH", `Default variable ${variableId} declares ${variable.type} but the Set Variables rule uses ${rule.type}.`);
          if (declaredType && sourceType && !compatibleValueTypes(declaredType, sourceType)) add("FORM_ACTION_OPEN_APPROVAL_VARIABLE_VALUE_TYPE_MISMATCH", `Default variable ${variableId} expects ${variable.type} but its expression resolves as ${sourceType}.`);
        }
      }
    }
  }
  if (step.type === "opendashboard") {
    const target = (decoded.Pages || []).find((page) => String(page.LayoutID) === String(attrs.data?.page?.PageID) && Number(page.Type) === 103);
    if (!target) add("FORM_ACTION_OPEN_DASHBOARD_TARGET_UNRESOLVED", "PageID must resolve to a Type 103 Dashboard.");
  }
  if (entry.surface === "dashboard") validateDashboardTokens(entry.formdef, step, findings);
  function add(code, message) { findings.push({ severity: "error", code, message, host: entry.host, page: entry.page, step: step.name }); }
}

function inferCustomFormPurposes(target, layout) {
  const purposes = new Set();
  const routes = parseJsonMaybe(target?.List?.LayoutView, {});
  for (const operation of ["add", "edit", "view"]) if (String(routes?.[operation] || "") === String(layout.LayoutID || "")) purposes.add(operation);
  const resource = parseJsonMaybe(layout?.LayoutInResources?.[0]?.Resource, {});
  const template = String(resource?.dataListFormLayoutTemplateId || resource?.generatedCustomFormPurpose || "").toLowerCase();
  if (/view|workbench|detail/.test(template)) purposes.add("view");
  if (/new.?edit|new_and_edit/.test(template)) { purposes.add("add"); purposes.add("edit"); }
  return purposes;
}

function normalizeValueType(value) {
  const text = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (["text", "string", "input", "textarea", "radio", "dict"].includes(text)) return "text";
  if (["number", "decimal", "integer", "percent", "currency"].includes(text)) return "number";
  if (["bool", "boolean", "bit", "switch"].includes(text)) return "boolean";
  if (["date", "datetime", "datepicker"].includes(text)) return "date";
  if (["user", "identity", "identitypicker"].includes(text)) return "user";
  if (["department", "organization", "org"].includes(text)) return "department";
  if (["lookup", "listitem"].includes(text)) return "lookup";
  if (["file", "attachment", "attachments"].includes(text)) return "file";
  if (["list", "sublist", "array"].includes(text)) return "list";
  return text;
}

function inferExpressionType(tokens) {
  if (!Array.isArray(tokens) || !tokens.length) return "";
  for (const token of tokens) {
    if (token?.valueType) return normalizeValueType(token.valueType);
    if (token?.type === "str") return "text";
    if (["num", "number"].includes(token?.type)) return "number";
    if (["bool", "boolean"].includes(token?.type)) return "boolean";
    if (["date", "datetime"].includes(token?.type)) return "date";
    if (token?.type === "func" && token?.func === "currentUser") return "user";
  }
  return "";
}

function compatibleValueTypes(target, source) { return target === source || (target === "text" && source === "lookup"); }
function parseJsonMaybe(value, fallback) { if (value && typeof value === "object") return value; try { return JSON.parse(String(value || "")); } catch { return fallback; } }

function validateDashboardTokens(formdef, step, findings) {
  const declared = new Set((formdef.tempVars || []).flatMap((item) => [item.id, item.name, `__temp_${item.name}`]).filter(Boolean).map(String));
  visit(step.attrs, (item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    if (item.exprType === "variable" && item.id && !declared.has(String(item.id)) && !declared.has(String(item.id).replace(/^__temp_/, ""))) findings.push({ severity: "error", code: "FORM_ACTION_OPEN_DASHBOARD_VARIABLE_NOT_TEMP", message: `Dashboard expression ${item.id} must resolve to a declared temp variable.` });
  });
}

function collectActions(decoded) {
  const out = [];
  for (const form of decoded.Forms || []) {
    const def = decodeDefResource(form.DefResource);
    for (const page of def.pageurls || []) for (const action of page.formdef?.actions || []) out.push({ surface: approvalSurface(page), host: form.Name || "", page: page.name || page.title || "", formdef: page.formdef, action });
  }
  for (const child of decoded.Childs || []) for (const layout of child.Layouts || []) if (Number(layout.Type) === 1) for (const resource of layout.LayoutInResources || []) {
    let formdef; try { formdef = JSON.parse(resource.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: customFormSurface(child, layout), host: child.List?.Title || "", page: layout.Title || "", formdef, action });
  }
  for (const page of decoded.Pages || []) for (const resource of page.LayoutInResources || []) { let formdef; try { formdef = JSON.parse(resource.Resource); } catch { continue; } for (const action of formdef.actions || []) out.push({ surface: "dashboard", host: page.Title || "", page: page.Title || "", formdef, action }); }
  for (const child of decoded.Childs || []) for (const publicForm of child.PublicForms || []) { let formdef; try { formdef = JSON.parse(publicForm.Resource); } catch { continue; } for (const action of formdef.actions || []) out.push({ surface: "public_form", host: child.List?.Title || "", page: publicForm.Name || "", formdef, action }); }
  return out;
}

function matches(row, entry, step) { return norm(planValue(row, "Host Resource")) === norm(entry.host) && norm(planValue(row, "Host Form / Page")) === norm(entry.page) && norm(planValue(row, "Action Name")) === norm(entry.action.name) && norm(planValue(row, "Step Name")) === norm(step.name); }
function planValue(row, name) { const key = Object.keys(row || {}).find((item) => norm(item) === norm(name)); return String(key ? row[key] : "").trim(); }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function approvalSurface(page) { const name = String(page.name || page.title || "").toLowerCase(); return /task/.test(name) ? "approval_task" : /print/.test(name) ? "approval_print" : "approval_submission"; }
function customFormSurface(child, layout) { const prefix = Number(child.List?.Type) === 16 ? "document_library" : "data_list"; const name = String(layout.Title || "").toLowerCase(); return /\bnew\b/.test(name) ? `${prefix}_new` : /\bedit\b/.test(name) ? `${prefix}_edit` : `${prefix}_view`; }
function decodePackage(file) { const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))); return JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64")))); }
function decodeDefResource(value) { const raw = Buffer.from(String(value || ""), "base64"); const prefix = Buffer.from("::brotli::"); return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString())); }
function visit(value, callback) { if (Array.isArray(value)) return value.forEach((item) => visit(item, callback)); if (!value || typeof value !== "object") return; callback(value); Object.values(value).forEach((item) => visit(item, callback)); }
function parseArgs(argv) { const out = {}; for (let i = 0; i < argv.length; i += 1) { if (argv[i] === "--package") out.package = argv[++i]; else if (argv[i] === "--plan") out.plan = argv[++i]; else if (argv[i] === "--strict-generated") out.strictGenerated = true; } return out; }
function usage(code) { console.error("Usage: node scripts/validate-form-action-open-resource.mjs --package <app.yapk> [--plan <app-plan.md>] [--strict-generated]"); process.exit(code); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
