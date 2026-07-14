#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const OPERATIONS = new Set(["add", "edit", "remove"]);
const TARGET_MODES = new Set(["current", "select"]);
const ALLOWED_HOST_TYPES = /^(Approval Submission|Approval Task|Data List (?:New|Edit|View)(?: Item)?|Document Library (?:New|Edit|View)(?: Item)?|Dashboard)$/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan) usage(1);
  const report = validateFormActionSetDataListPlan(fs.readFileSync(args.plan, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateFormActionSetDataListPlan(markdown) {
  const rows = extractFormActionSetDataListPlanRows(markdown);
  const findings = [];
  rows.forEach((row, index) => validateRow(row, index, findings));
  return {
    status: findings.some((item) => item.severity === "error") ? "fail" : findings.length ? "pass_with_warnings" : "pass",
    setDataListRows: rows.length,
    findings,
  };
}

export function extractFormActionSetDataListPlanRows(markdown) {
  const rows = [];
  const lines = String(markdown || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitRow(lines[index]);
    if (!headers.some((header) => /Exact Step Type|Step Type/i.test(header))) continue;
    let cursor = index + 2;
    while (cursor < lines.length && isTableLine(lines[cursor])) {
      const cells = splitRow(lines[cursor]);
      if (hasPlaceholderCell(cells)) {
        cursor += 1;
        continue;
      }
      const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
      if (/set\s*data\s*list|setdatalist/i.test(value(row, "Exact Step Type", "Step Type"))) rows.push(row);
      cursor += 1;
    }
    index = cursor - 1;
  }
  return rows;
}

function hasPlaceholderCell(cells) {
  return cells.some((cell) => /<[^>]+>/.test(String(cell || "")));
}

function validateRow(row, index, findings) {
  const path = `Form Action Set Data List row ${index + 1}`;
  const required = ["Host Resource", "Host Form / Page", "Host Type", "Action Name", "Step Order", "Step Name", "Trigger", "Operation", "Target Mode"];
  for (const column of required) if (isNone(value(row, column))) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_REQUIRED_VALUE_MISSING", `${column} is required.`, path, { column });
  const hostType = value(row, "Host Type", "Host Surface / Page");
  const operation = value(row, "Operation").toLowerCase();
  const targetMode = value(row, "Target Mode").toLowerCase();
  const targetType = value(row, "Target Resource Type");
  const targetResource = value(row, "Target Resource");
  const mappings = value(row, "Field Mapping JSON", "Field Mapping");
  const filters = value(row, "Filter JSON", "Filters");
  const condition = value(row, "Execution Condition Tokens", "Condition Tokens");
  const continueNext = value(row, "Continue When Not Met", "Continue");
  const trigger = value(row, "Trigger");
  const boundControl = value(row, "Bound Control", "Bound Control / Field");
  if (/public\s*form/i.test(hostType)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_PUBLIC_FORM_FORBIDDEN", "Public Forms cannot host Set Data List Form Actions.", path);
  else if (!ALLOWED_HOST_TYPES.test(hostType)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_HOST_TYPE_INVALID", "Host Type must be an export-proven Approval Submission/Task, Data List/Document Library New/Edit/View, or Dashboard surface.", path, { hostType });
  if (!OPERATIONS.has(operation)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_OPERATION_INVALID", "Operation must be add, edit, or remove.", path, { operation });
  if (!TARGET_MODES.has(targetMode)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_TARGET_MODE_INVALID", "Target Mode must be current or select.", path, { targetMode });
  if (targetMode === "current") {
    if (!/data\s*list|document\s*library/i.test(hostType)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_CURRENT_HOST_INVALID", "Current-record mode requires a Data List or Document Library custom form.", path);
    if (operation !== "edit") add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_CURRENT_OPERATION_INVALID", "Current-record mode supports edit only.", path);
    if (/\bnew\b|\bedit\b/i.test(value(row, "Host Form / Page")) && !/direct|immediate|before submit|side effect|explicit/i.test(value(row, "Business Rationale", "Notes"))) {
      add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_NEW_EDIT_DIRECT_WRITE_RATIONALE_MISSING", "New/Edit forms should use Set Variable plus Submit Form; direct current-item mutation requires an explicit rationale.", path);
    }
  } else if (!/^(Data List|Document Library)$/i.test(targetType) || isNone(targetResource)) {
    add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_SELECTED_TARGET_INVALID", "Selected mode requires an exact Data List or Document Library target.", path, { targetType, targetResource });
  }
  if (operation !== "remove" && (isNone(mappings) || !validJsonArray(mappings))) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_FIELD_MAPPING_INVALID", "Add/Edit requires Field Mapping JSON as a non-empty JSON array.", path);
  if (operation === "add" && targetMode === "select" && /^Document Library$/i.test(targetType) && validJsonArray(mappings)) {
    const parsedMappings = JSON.parse(mappings);
    const upload = parsedMappings.find((mapping) => String(mapping?.Columns) === "Text4");
    if (!upload) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_REQUIRED", "Document Library Add requires a Text4 Upload File mapping.", path);
    else if (containsMultiValueSource(upload.Data)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_MULTI_VALUE_UNSUPPORTED", "Form Action Document Library Add accepts one file per step; multi-file, List, and Sub List sources require Workflow Set Data List.", path);
  }
  if (operation !== "add" && targetMode === "select" && (isNone(filters) || !validJsonArray(filters))) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_FILTER_REQUIRED", "Selected-resource Edit/Remove requires non-empty Filter JSON.", path);
  if (!isNone(mappings) && /_list\.|__list_|sub\s*list.*rows|bulk.*sub\s*list/i.test(mappings)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_SUBLIST_BULK_WRITE_UNSUPPORTED", "Form Action Set Data List cannot expand Sub List rows; use Workflow Set Data List.", path);
  if (!isNone(condition) && !validJsonArray(condition)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_CONDITION_INVALID", "Execution Condition Tokens must be a JSON token array or None.", path);
  if (/button|container|field\s*change|value\s*change|collection\s*action|click/i.test(trigger) && isNone(boundControl)) {
    add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_BOUND_CONTROL_REQUIRED", "Button, Container, Field Change, Collection Action, and click triggers require an exact Bound Control identity.", path);
  }
  if (!isNone(condition) && !/^(true|yes)$/i.test(continueNext) && /add|edit|branch|count|zero|greater/i.test(`${value(row, "Step Name")} ${value(row, "Business Rationale", "Notes")}`)) {
    add(findings, "warning", "FORM_ACTION_SET_DATA_LIST_PLAN_CONDITIONAL_CHAIN_CONTINUE_REVIEW", "Mutually exclusive conditional Add/Edit chains normally enable Continue When Not Met.", path);
  }
  const statusKind = value(row, "Status Target Kind");
  const statusId = value(row, "Status Target ID");
  const itemKind = value(row, "Item Result Target Kind", "Item ID / Count Target Kind");
  const itemId = value(row, "Item Result Target ID", "Item ID / Count Target ID");
  const itemAttribute = value(row, "Item Result Attribute");
  if (isNone(statusKind) !== isNone(statusId)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_STATUS_RESULT_INCOMPLETE", "Status result kind and ID must either both be set or both be None.", path);
  if (isNone(itemKind) !== isNone(itemId)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_ITEM_RESULT_INCOMPLETE", "Item/count result kind and ID must either both be set or both be None.", path);
  if (!isNone(itemKind) && !/^(itemid|totalcount)$/i.test(itemAttribute)) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_ITEM_RESULT_ATTRIBUTE_INVALID", "Item Result Attribute must be itemid or totalcount when an item/count target is configured.", path, { itemAttribute });
  if (/dashboard/i.test(hostType) && [statusKind, itemKind].some((kind) => !isNone(kind) && !/temp/i.test(kind))) add(findings, "error", "FORM_ACTION_SET_DATA_LIST_PLAN_DASHBOARD_RESULT_NOT_TEMP", "Dashboard execute-result targets must be temp variables.", path);
}

function validJsonArray(valueText) {
  try { const parsed = JSON.parse(valueText); return Array.isArray(parsed) && parsed.length > 0; } catch { return false; }
}

function containsMultiValueSource(value) {
  if (Array.isArray(value)) return value.some(containsMultiValueSource);
  if (!value || typeof value !== "object") return false;
  const valueType = String(value.valueType || value.variableType || "").toLowerCase();
  if (/^(?:array|list|sublist|multi(?:file|attachment|select)?)$/.test(valueType)
    || value.multiple === true || value.isMultiple === true || value.multi === true) return true;
  const id = String(value.id || value.key || value.prop || "");
  if (/^_list\.|^__list_|\.items?\b/i.test(id)) return true;
  return Object.values(value).some(containsMultiValueSource);
}

function value(row, ...names) {
  for (const name of names) {
    const key = Object.keys(row).find((candidate) => normalize(candidate) === normalize(name));
    if (key) return String(row[key] || "").trim();
  }
  return "";
}
function normalize(valueText) { return String(valueText || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isNone(valueText) { return !String(valueText || "").trim() || /^(none|n\/a|not applicable|无|不适用)$/i.test(String(valueText).trim()) || /^<.*>$/.test(String(valueText).trim()); }
function isTableLine(line) { return /^\s*\|.*\|\s*$/.test(line || ""); }
function splitRow(line) { return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()); }
function add(findings, severity, code, message, path, detail = {}) { findings.push({ severity, code, message, path, ...detail }); }
function parseArgs(argv) { const out = {}; for (let index = 0; index < argv.length; index += 1) { if (argv[index] === "--plan") out.plan = argv[++index]; else if (argv[index] === "--help" || argv[index] === "-h") usage(0); else usage(1); } return out; }
function usage(exitCode) { console.error("Usage: node scripts/validate-form-action-set-data-list-plan.mjs --plan <app-plan.md>"); process.exit(exitCode); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
