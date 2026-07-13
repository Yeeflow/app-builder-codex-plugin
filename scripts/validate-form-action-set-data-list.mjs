#!/usr/bin/env node

import fs from "node:fs";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { decodeBrotliTextTolerant, quoteLargeJsonIntegers } from "./lib/yapk-decode-utils.mjs";
import { extractFormActionSetDataListPlanRows } from "./validate-form-action-set-data-list-plan.mjs";

const require = createRequire(import.meta.url);
const { validateFormActionSetDataListStep } = require("./lib/form-action-set-data-list-utils.cjs");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.package) usage(1);
  const report = validatePackage(args.package, { strictGenerated: args.strictGenerated, plan: args.plan });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validatePackage(packagePath, options = {}) {
  try {
    const decoded = decodePackage(packagePath);
    const findings = [];
    let stepCount = 0;
    const plannedRows = options.plan ? extractFormActionSetDataListPlanRows(fs.readFileSync(options.plan, "utf8")) : null;
    const matchedPlanRows = new Set();
    for (const entry of collectActions(decoded)) for (const [index, step] of (entry.action.steps || []).entries()) {
      if (step?.type !== "setdatalist") continue;
      const matchingRows = plannedRows === null ? [] : plannedRows.filter((row) => plannedStepMatches(row, entry, step));
      if (plannedRows !== null && matchingRows.length === 0) continue;
      for (const row of matchingRows) matchedPlanRows.add(row);
      stepCount += 1;
      const selectedTarget = resolveSelectedTarget(decoded, step);
      for (const finding of validateFormActionSetDataListStep(step, {
        hostSurface: entry.surface,
        strictGenerated: options.strictGenerated,
        targetResourceType: selectedTarget?.List?.Type,
      })) findings.push({
        severity: "error",
        ...finding,
        surface: entry.surface,
        host: entry.host,
        page: entry.page,
        action: entry.action.name || entry.action.title || null,
        step: step.name || step.title || null,
        stepIndex: index,
      });
      validateReferences(decoded, entry, step, findings);
    }
    for (const [index, row] of (plannedRows || []).entries()) if (!matchedPlanRows.has(row)) findings.push({
      severity: "error",
      code: "FORM_ACTION_SET_DATA_LIST_PLANNED_STEP_NOT_MATERIALIZED",
      message: "A planned Form Action Set Data List step was not found in the generated package.",
      planRow: index + 1,
      host: planValue(row, "Host Resource"),
      page: planValue(row, "Host Form / Page"),
      action: planValue(row, "Action Name"),
      step: planValue(row, "Step Name"),
    });
    return { status: findings.some((item) => item.severity === "error") ? "fail" : "pass", setDataListStepCount: stepCount, findings };
  } catch (error) {
    return { status: "fail", setDataListStepCount: 0, findings: [{ severity: "error", code: "FORM_ACTION_SET_DATA_LIST_VALIDATION_FAILED", message: error.message }] };
  }
}

function validateReferences(decoded, entry, step, findings) {
  const attrs = step.attrs || {};
  if (attrs.listtype === "select" && attrs.list?.ListID) {
    const target = (decoded.Childs || []).find((child) => String(child.List?.ListID) === String(attrs.list.ListID));
    if (!target) findings.push({ severity: "error", code: "FORM_ACTION_SET_DATA_LIST_TARGET_UNRESOLVED", message: "Selected target ListID does not resolve to a package Data List or Document Library.", host: entry.host, page: entry.page });
    else {
      const fields = new Set((target.Fields || []).map((field) => String(field.FieldName)));
      if (Number(target.List?.Type) === 16) fields.add("_Path");
      for (const mapping of attrs.listdatas || []) if (!fields.has(String(mapping.Columns))) findings.push({ severity: "error", code: "FORM_ACTION_SET_DATA_LIST_MAPPING_FIELD_UNRESOLVED", message: `Mapping target field ${mapping.Columns} is not present on the selected resource.`, host: entry.host, page: entry.page });
      for (const filter of attrs.wheres || []) if (!fields.has(String(filter.left)) && String(filter.left) !== "ListDataID") findings.push({ severity: "error", code: "FORM_ACTION_SET_DATA_LIST_FILTER_FIELD_UNRESOLVED", message: `Filter field ${filter.left} is not present on the selected resource.`, host: entry.host, page: entry.page });
    }
  }
  const formdef = entry.formdef;
  const variableRoot = entry.variableRoot || formdef;
  const declaredTempVars = variableRoot.tempVars || variableRoot.variables?.tempVars || [];
  const tempIds = new Set(declaredTempVars.flatMap((variable) => [variable.id, variable.name, `__temp_${variable.name}`]).filter(Boolean).map(String));
  for (const [key, parentKey] of [["code", "codeparent"], ["itemid", "itemidparent"], ["totalcount", "totalparent"]]) {
    if (!attrs[key] || attrs[parentKey] !== "__temp_") continue;
    if (!tempIds.has(String(attrs[key])) && !tempIds.has(`__temp_${attrs[key]}`)) findings.push({ severity: "error", code: "FORM_ACTION_SET_DATA_LIST_RESULT_TEMP_UNDECLARED", message: `${key} temp variable ${attrs[key]} is not declared on the host page.`, host: entry.host, page: entry.page });
  }
}

function resolveSelectedTarget(decoded, step) {
  const attrs = step?.attrs || {};
  if (attrs.listtype !== "select" || !attrs.list?.ListID) return null;
  return (decoded.Childs || []).find((child) => String(child.List?.ListID) === String(attrs.list.ListID)) || null;
}

function decodePackage(packagePath) {
  const wrapper = JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "")));
  return JSON.parse(quoteLargeJsonIntegers(decodeBrotliTextTolerant(Buffer.from(String(wrapper.Resource || "").replace(/\s+/g, ""), "base64"))));
}

function plannedStepMatches(row, entry, step) {
  return norm(planValue(row, "Host Resource")) === norm(entry.host)
    && norm(planValue(row, "Host Form / Page")) === norm(entry.page)
    && norm(planValue(row, "Action Name")) === norm(entry.action.name || entry.action.title)
    && norm(planValue(row, "Step Name")) === norm(step.name || step.title);
}

function planValue(row, ...names) {
  for (const name of names) {
    const key = Object.keys(row || {}).find((candidate) => norm(candidate) === norm(name));
    if (key) return String(row[key] || "").trim();
  }
  return "";
}

function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

function collectActions(decoded) {
  const out = [];
  for (const form of decoded.Forms || []) {
    const def = decodeDefResource(form.DefResource);
    for (const page of def.pageurls || []) for (const action of page.formdef?.actions || []) out.push({ surface: approvalSurface(page), host: form.Name || "", page: page.name || page.title || "", formdef: page.formdef, variableRoot: def, action });
  }
  for (const child of decoded.Childs || []) for (const layout of child.Layouts || []) if (Number(layout.Type) === 1) for (const resource of layout.LayoutInResources || []) {
    let formdef;
    try { formdef = JSON.parse(resource.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: customFormSurface(child, layout), host: child.List?.Title || "", page: layout.Title || "", formdef, action });
  }
  for (const page of decoded.Pages || []) for (const resource of page.LayoutInResources || []) {
    let formdef;
    try { formdef = JSON.parse(resource.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: "dashboard", host: page.Title || "", page: page.Title || "", formdef, action });
  }
  for (const child of decoded.Childs || []) for (const publicForm of child.PublicForms || []) {
    let formdef;
    try { formdef = JSON.parse(publicForm.Resource); } catch { continue; }
    for (const action of formdef.actions || []) out.push({ surface: "public_form", host: child.List?.Title || "", page: publicForm.Name || "", formdef, action });
  }
  return out;
}

function approvalSurface(page) { const name = String(page.name || page.title || "").toLowerCase(); return /task/.test(name) ? "approval_task" : /print/.test(name) ? "approval_print" : "approval_submission"; }
function customFormSurface(child, layout) { const prefix = Number(child.List?.Type) === 16 ? "document_library" : "data_list"; const name = String(layout.Title || "").toLowerCase(); return /\bnew\b/.test(name) ? `${prefix}_new` : /\bedit\b/.test(name) ? `${prefix}_edit` : `${prefix}_view`; }
function decodeDefResource(value) { const raw = Buffer.from(String(value || ""), "base64"); const prefix = Buffer.from("::brotli::"); return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString())); }
function parseArgs(argv) { const out = {}; for (let index = 0; index < argv.length; index += 1) { if (argv[index] === "--package") out.package = argv[++index]; else if (argv[index] === "--plan") out.plan = argv[++index]; else if (argv[index] === "--strict-generated") out.strictGenerated = true; else if (argv[index] === "--help" || argv[index] === "-h") usage(0); else usage(1); } return out; }
function usage(exitCode) { console.error("Usage: node scripts/validate-form-action-set-data-list.mjs --package <app.yapk> [--plan <app-plan.md>] [--strict-generated]"); process.exit(exitCode); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
