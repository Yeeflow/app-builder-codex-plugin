#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const HOSTS = new Set(["approval form", "data list", "scheduled"]);
const OPERATIONS = new Set(["add", "edit", "remove"]);
const NUMERIC_MUTATIONS = new Set(["1", "2", "3", "4"]);
const NUMERIC_TYPES = new Set(["number", "decimal", "integer", "bigint", "currency"]);
const BATCH_SOURCE_TYPES = new Set(["workflow list variable", "data list sub list field"]);

if (isMainModule()) {
  const plan = argument("--plan") || process.argv.slice(2).find((item) => item !== "--json");
  if (!plan) usage(1);
  const report = validateWorkflowSetDataListPlan(fs.readFileSync(plan, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateWorkflowSetDataListPlan(markdown) {
  const rows = extractWorkflowSetDataListPlanRows(markdown);
  const findings = [];
  rows.forEach((row, index) => validateRow(row, index, findings));
  return {
    status: findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "pass_with_warnings" : "pass",
    setDataListRows: rows.length,
    findings,
  };
}

export function extractWorkflowSetDataListPlanRows(markdown) {
  const rows = [];
  const lines = String(markdown || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitRow(lines[index]);
    if (!headers.some((header) => normalize(header) === "target mode") || !headers.some((header) => normalize(header) === "mappings json")) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitRow(lines[rowIndex]);
      rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""])));
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }
  return rows;
}

function validateRow(row, index, findings) {
  const path = `Workflow Set Data List row ${index + 1}`;
  const host = value(row, "Workflow Host").toLowerCase();
  const workflow = value(row, "Workflow Name");
  const node = value(row, "Node Name");
  const targetMode = value(row, "Target Mode").toLowerCase();
  const target = value(row, "Target Resource");
  const targetType = value(row, "Target Resource Type");
  const operation = value(row, "Operation").toLowerCase();
  const mappings = parseJson(value(row, "Mappings JSON"), "Mappings JSON", path, findings);
  const filters = parseJson(value(row, "Filters JSON"), "Filters JSON", path, findings);
  const batchSourceType = value(row, "Batch Source Type").toLowerCase();
  const batchSource = value(row, "Batch Source");
  const batchSourceFields = parseJson(value(row, "Batch Source Fields JSON"), "Batch Source Fields JSON", path, findings);
  const proof = value(row, "Proof Boundary");

  for (const [label, current] of [["Workflow Host", host], ["Workflow Name", workflow], ["Node Name", node], ["Target Mode", targetMode], ["Operation", operation], ["Proof Boundary", proof]]) {
    if (isNone(current)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_REQUIRED_VALUE_MISSING", `${label} is required`, path, { column: label });
  }
  if (!HOSTS.has(host)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_HOST_INVALID", "Workflow Host must be Approval Form, Data List, or Scheduled.", path, { host });
  if (!["current", "select"].includes(targetMode)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_TARGET_MODE_INVALID", "Target Mode must be current or select.", path, { targetMode });
  if (!OPERATIONS.has(operation)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_OPERATION_INVALID", "Operation must be add, edit, or remove.", path, { operation });
  if (["approval form", "scheduled"].includes(host) && targetMode === "current") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_CURRENT_TARGET_HOST_INVALID", "Approval Form and Scheduled workflows must use a selected target resource.", path);
  if (host === "data list" && targetMode === "current" && operation === "remove") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_CURRENT_REMOVE_UNPROVEN", "Current-list remove is not export-proven; use a selected target with an exact filter.", path);
  if (targetMode === "select" && (isNone(target) || isNone(targetType))) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_SELECTED_TARGET_INCOMPLETE", "Selected targets require resource name and resource type.", path);
  const documentLibraryTarget = /document library/i.test(targetType);
  if (documentLibraryTarget && !/export-proven|runtime-proof-required/i.test(proof)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_PROOF_MISSING", "Document Library mutation requires an explicit export-proven or runtime-proof-required boundary.", path);
  validateBatchSource({ host, operation, targetMode, batchSourceType, batchSource, batchSourceFields, mappings, findings, path });
  if (["add", "edit"].includes(operation) && (!Array.isArray(mappings) || mappings.length === 0)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_MAPPINGS_REQUIRED", "Add and edit require a non-empty Mappings JSON array.", path);
  if (["edit", "remove"].includes(operation) && (!Array.isArray(filters) || filters.length === 0)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_FILTERS_REQUIRED", "Edit and remove require a non-empty Filters JSON array.", path);
  if (Array.isArray(mappings)) {
    mappings.forEach((mapping, mappingIndex) => {
      const mappingPath = `${path}, mapping ${mappingIndex + 1}`;
      if (!mapping || !mapping.Columns || mapping.Per === undefined || !Array.isArray(mapping.Data)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_MAPPING_SHAPE_INVALID", "Each mapping needs Columns, Per, and expression-token Data array.", mappingPath);
      if (mapping && NUMERIC_MUTATIONS.has(String(mapping.Per)) && !NUMERIC_TYPES.has(String(mapping.TargetType || "").toLowerCase())) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_NUMERIC_TARGET_INVALID", "Increase/decrease/multiply/divide mappings must declare a numeric TargetType.", mappingPath, { targetType: mapping.TargetType, Per: mapping.Per });
    });
  }
  if (documentLibraryTarget && operation === "add" && Array.isArray(mappings)) validateDocumentLibraryAddMappings(mappings, findings, path);
}

function validateBatchSource({ host, operation, targetMode, batchSourceType, batchSource, batchSourceFields, mappings, findings, path }) {
  const batchTokens = Array.isArray(mappings)
    ? mappings.flatMap((mapping) => Array.isArray(mapping?.Data) ? mapping.Data : []).filter((token) => String(token?.key || "").startsWith("_list."))
    : [];
  const hasDeclaredBatchSource = Boolean(batchSourceType || batchSource || (Array.isArray(batchSourceFields) && batchSourceFields.length));
  if (!hasDeclaredBatchSource && !batchTokens.length) return;
  if (!hasDeclaredBatchSource) {
    add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_UNDECLARED", "Mappings that use _list.<child field> must declare Batch Source Type, Batch Source, and Batch Source Fields JSON.", path);
    return;
  }
  if (!BATCH_SOURCE_TYPES.has(batchSourceType)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_TYPE_INVALID", "Batch Source Type must be Workflow List Variable or Data List Sub List Field.", path, { batchSourceType });
  if (isNone(batchSource)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_REQUIRED", "Batch Source is required for a bulk Sub list write.", path);
  if (!Array.isArray(batchSourceFields) || !batchSourceFields.length || batchSourceFields.some((field) => !String(field || "").trim())) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_FIELDS_INVALID", "Batch Source Fields JSON must be a non-empty JSON array of Sub list child field IDs.", path);
  if (operation !== "add") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_OPERATION_UNPROVEN", "The studied bulk Sub list pattern is an add operation; edit/remove require a new export reference.", path, { operation });
  if (targetMode !== "select") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_TARGET_MODE_INVALID", "Bulk Sub list writes must select an explicit target Data List or Document Library.", path);
  if (["approval form", "scheduled"].includes(host) && batchSourceType !== "workflow list variable") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_HOST_MISMATCH", "Approval Form and Scheduled workflows batch-write from a Workflow List variable.", path, { host, batchSourceType });
  if (host === "data list" && batchSourceType !== "data list sub list field") add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_SOURCE_HOST_MISMATCH", "Data List workflows batch-write from a current-list Sub list field.", path, { host, batchSourceType });
  if (!batchTokens.length) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_MAPPING_MISSING", "A bulk Sub list write requires one or more mappings with key _list.<child field>.", path);
  for (const token of batchTokens) {
    const childField = String(token.key || "").slice("_list.".length);
    if (!childField) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_KEY_INVALID", "A bulk mapping key must be _list.<child field>.", path);
    if (Array.isArray(batchSourceFields) && batchSourceFields.length && !batchSourceFields.includes(childField)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_CHILD_FIELD_UNKNOWN", "A bulk mapping references a child field absent from Batch Source Fields JSON.", path, { childField });
    if (batchSourceType === "workflow list variable" && (token.exprType !== "variable" || String(token.id || "") !== batchSource)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_VARIABLE_TOKEN_INVALID", "Workflow List variable bulk mappings must use exprType variable with the declared Batch Source id.", path, { token });
    if (batchSourceType === "data list sub list field" && (token.exprType !== "list_field" || String(token.id || "") !== batchSource)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_BATCH_LIST_FIELD_TOKEN_INVALID", "Data List Sub list bulk mappings must use exprType list_field with the declared Batch Source field id.", path, { token });
  }
  const hasParentAssociation = Array.isArray(mappings) && mappings.some((mapping) => Array.isArray(mapping?.Data) && mapping.Data.some((token) => !String(token?.key || "").startsWith("_list.")));
  if (!hasParentAssociation) add(findings, "warning", "WORKFLOW_SET_DATALIST_PLAN_BATCH_PARENT_ASSOCIATION_RECOMMENDED", "Bulk Sub list writes should also map a parent form/list identifier such as Applicant, Employee, or instance ID to relate the added rows.", path);
}

function validateDocumentLibraryAddMappings(mappings, findings, path) {
  const byColumn = new Map(mappings.map((mapping) => [String(mapping?.Columns || ""), mapping]));
  for (const field of ["Title", "Text4", "_Path"]) {
    if (!byColumn.has(field)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_ADD_FIELD_MISSING", "Document Library add requires Title, Text4 (Upload file), and _Path mappings.", path, { field });
  }
  const upload = byColumn.get("Text4");
  if (upload && !Array.isArray(upload.Data)) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_INVALID", "Document Library Upload file mapping must use expression tokens from a file field or Loop item.", path);
  if (upload && Array.isArray(upload.Data) && !upload.Data.some((token) => token?.exprType === "loop_ctx" || (token?.exprType === "variable" && String(token?.valueType || "").toLowerCase() === "file"))) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_UPLOAD_INVALID", "Document Library Upload file mapping must use a file variable or Loop item, not a fixed value.", path);
  const title = byColumn.get("Title");
  if (title && Array.isArray(title.Data) && !title.Data.some((token) => token?.exprType === "variable" || token?.exprType === "application" || token?.exprType === "loop_ctx" || token?.exprType === "list_field" || token?.type === "func")) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_TITLE_UNIQUE_COMPONENT_MISSING", "Document Library Title mapping must include a dynamic uniqueness component such as instance identity or LoopIndex.", path);
  const pathMapping = byColumn.get("_Path");
  const staticPath = Array.isArray(pathMapping?.Data) && pathMapping.Data.length === 1 && pathMapping.Data[0]?.type === "str" ? String(pathMapping.Data[0].value || "") : "";
  if (staticPath && (/^\//.test(staticPath) || /\/$/.test(staticPath) || /\/\//.test(staticPath))) add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_DOCUMENT_LIBRARY_PATH_FORMAT_INVALID", "Document Library _Path must use folder/subfolder format without leading, trailing, or repeated slashes.", path, { value: staticPath });
}

function parseJson(raw, label, path, findings) {
  const value = String(raw || "").trim().replace(/^`([\s\S]*)`$/, "$1").trim();
  if (isNone(value)) return null;
  try { return JSON.parse(value); } catch {
    add(findings, "error", "WORKFLOW_SET_DATALIST_PLAN_JSON_INVALID", `${label} must be valid JSON.`, path, { column: label });
    return null;
  }
}

function add(findings, severity, code, message, path, detail = {}) { findings.push({ severity, code, message, path, ...detail }); }
function value(row, name) { const key = Object.keys(row).find((candidate) => normalize(candidate) === normalize(name)); return key ? String(row[key] || "").trim() : ""; }
function normalize(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isNone(value) { return !String(value || "").trim() || /^(none|n\/a|not applicable|无|不适用)$/i.test(String(value).trim()); }
function isTableLine(line) { return /^\s*\|.*\|\s*$/.test(String(line || "")); }
function splitRow(line) { return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()); }
function argument(name) { const index = process.argv.indexOf(name); return index === -1 ? "" : process.argv[index + 1] || ""; }
function usage(exitCode) { console.error("Usage: node scripts/validate-workflow-set-data-list-plan.mjs --plan <yeeflow-app-plan.md>"); process.exit(exitCode); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
