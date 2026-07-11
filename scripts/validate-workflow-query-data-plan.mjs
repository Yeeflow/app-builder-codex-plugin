#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { normalizeWorkflowQueryDataMode, WORKFLOW_QUERY_DATA_MODES } from "./lib/workflow-query-data-utils.mjs";

if (isMainModule()) {
  const plan = argument("--plan") || process.argv.slice(2).find((item) => item !== "--json");
  if (!plan) usage(1);
  const report = validateWorkflowQueryDataPlan(fs.readFileSync(plan, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateWorkflowQueryDataPlan(markdown) {
  const rows = extractWorkflowQueryDataPlanRows(markdown);
  const findings = [];
  rows.forEach((row, index) => validateRow(row, index, findings));
  return {
    status: findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "pass_with_warnings" : "pass",
    queryDataRows: rows.length,
    findings,
  };
}

export function extractWorkflowQueryDataPlanRows(markdown) {
  const rows = [];
  const lines = String(markdown || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitRow(lines[index]);
    if (!headers.some((header) => normalize(header) === "workflow query mode")) continue;
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
  const path = `Workflow Query Data row ${index + 1}`;
  const hostType = value(row, "Workflow Host Type");
  const workflow = value(row, "Workflow");
  const node = value(row, "Node Name");
  const modeRaw = value(row, "Workflow Query Mode");
  const mode = normalizeWorkflowQueryDataMode(modeRaw);
  const source = value(row, "Source Resource");
  const sourceType = value(row, "Source Resource Type");
  const filters = value(row, "Filters");
  const resultVariable = value(row, "Result Variable");
  const resultType = value(row, "Result Variable Type");
  const complexType = value(row, "ListRef / Complex Type");
  const mapping = value(row, "Field Mapping");
  const countVariable = value(row, "Count Variable");
  const pageSize = value(row, "Page Size");
  const pageNumber = value(row, "Page Number");
  const downstream = value(row, "Downstream Consumer / Use");
  const branchCoverage = value(row, "Branch Coverage");
  const sorts = value(row, "Sorts");

  for (const [label, current] of [["Workflow", workflow], ["Workflow Host Type", hostType], ["Node Name", node], ["Workflow Query Mode", modeRaw], ["Source Resource", source], ["Downstream Consumer / Use", downstream]]) {
    if (isNone(current)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_REQUIRED_VALUE_MISSING", `${label} is required`, path, { column: label });
  }
  if (!mode || !WORKFLOW_QUERY_DATA_MODES.includes(mode)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_MODE_INVALID", "Workflow Query Mode must use a supported golden-reference mode", path, { mode: modeRaw });
  if (!/Approval|Data List|Scheduled/i.test(hostType)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_HOST_INVALID", "Workflow Host Type must be Approval, Data List, or Scheduled Workflow", path, { hostType });
  if (!/^(Data List|Document Library|Form Report)$/i.test(sourceType)) {
    add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_SOURCE_TYPE_UNPROVEN", "Source Resource Type must be an export-proven Data List, Document Library, or Form Report. Data Report remains focused-learning-required.", path, { sourceType });
  }
  const sortCount = String(sorts || "").split(/\s*;\s*/).filter((entry) => entry && !isNone(entry)).length;
  if (sortCount > 2) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_SORT_COUNT_EXCEEDED", "Workflow Query Data supports at most two sort fields", path, { sortCount, sorts });
  validatePagination(pageSize, pageNumber, findings, path);
  if (/lookup/i.test(filters) && !/ListDataID|stored target|target record id|target identifier/i.test(filters)) {
    add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_LOOKUP_IDENTITY_MISSING", "Lookup-backed filters must use the stored target ListDataID/record identity, not display text", path, { filters });
  }

  if (mode === "multiple_count_only") {
    if (!isNone(resultVariable) || !isNone(resultType) || !isNone(complexType) || !isNone(mapping)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_COUNT_ONLY_ROW_TARGET_PRESENT", "Count-only mode must not define a row result variable, Complex Type, or field mapping", path);
    if (isNone(countVariable)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_COUNT_VARIABLE_MISSING", "Count-only mode requires a number workflow variable", path);
    if (!hasCompleteCountCoverage(branchCoverage)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_COUNT_BRANCH_INCOMPLETE", "Count-based branching must explicitly cover both positive and zero/non-positive outcomes because Yeeflow has no default branch", path, { branchCoverage });
  }
  if (mode === "single_to_variables") {
    if (isNone(resultVariable) || isNone(resultType) || isNone(mapping)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_SINGLE_MAPPING_INCOMPLETE", "Single-result mode requires declared workflow variable targets and source-to-variable mappings", path);
    if (!/workflow/i.test(resultType)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_TEMP_VARIABLE_FORBIDDEN", "Workflow Query Data must use normal workflow variables, not page temp variables", path, { resultType });
  }
  if (mode === "multiple_to_list_variable") {
    if (isNone(resultVariable) || !/list/i.test(resultType) || isNone(complexType) || isNone(mapping)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_LIST_CONTRACT_INCOMPLETE", "List-result mode requires a List variable, linked ListRef/Complex Type, and explicit source-to-row-field mappings", path);
    if (/temp/i.test(resultType)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_TEMP_VARIABLE_FORBIDDEN", "Workflow Query Data has no page temp-variable result contract", path, { resultType });
  }
  if (mode === "multiple_to_text_variable") {
    if (isNone(resultVariable) || !/text|workflow/i.test(resultType) || isNone(mapping)) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_TEXT_CONTRACT_INCOMPLETE", "Text/JSON result mode requires a text workflow variable and selected fields", path);
  }
  if (/loop/i.test(downstream) && mode !== "multiple_to_list_variable") add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_LOOP_REQUIRES_LIST", "Loop through list items requires Query Data output to a List variable backed by a Complex Type", path, { mode });
  if (/assignee|approval owner|task owner/i.test(downstream) && mode !== "single_to_variables") add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_ASSIGNEE_REQUIRES_SINGLE_USER_MAPPING", "Query-derived assignee scenarios require a single-result mapping into a declared User workflow variable", path, { mode });
}

function hasCompleteCountCoverage(value) {
  const text = String(value || "");
  return /(>\s*0|positive|has\s+)/i.test(text) && /(<=\s*0|=\s*0|zero|no\s+)/i.test(text);
}

function validatePagination(pageSize, pageNumber, findings, path) {
  if (!isNone(pageSize)) {
    const size = Number(pageSize);
    if (!Number.isInteger(size) || size < 1 || size > 1000) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_PAGE_SIZE_INVALID", "Page Size must be an integer from 1 to 1000", path, { pageSize });
  }
  if (!isNone(pageNumber)) {
    const number = Number(pageNumber);
    if (!Number.isInteger(number) || number < 1) add(findings, "error", "WORKFLOW_QUERYDATA_PLAN_PAGE_NUMBER_INVALID", "Page Number must be a positive integer", path, { pageNumber });
  }
}

function add(findings, severity, code, message, path, detail = {}) {
  findings.push({ severity, code, message, path, ...detail });
}

function value(row, name) {
  const key = Object.keys(row).find((candidate) => normalize(candidate) === normalize(name));
  return key ? String(row[key] || "").trim() : "";
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isNone(value) {
  return !String(value || "").trim() || /^(none|n\/a|not applicable|无|不适用)$/i.test(String(value).trim());
}

function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(String(line || ""));
}

function splitRow(line) {
  return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function usage(exitCode) {
  console.error("Usage: node scripts/validate-workflow-query-data-plan.mjs --plan <yeeflow-app-plan.md>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
