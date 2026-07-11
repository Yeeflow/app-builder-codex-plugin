#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const MODES = new Set([
  "single_to_variables",
  "single_to_temp_variables",
  "single_to_list_fields",
  "single_to_list_fields_and_temp_variables",
  "multiple_to_sublist",
  "multiple_to_list_sublist",
  "multiple_to_temp_collection",
  "multiple_count_only",
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan) usage(1);
  const report = validateFormActionQueryDataPlan(fs.readFileSync(args.plan, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateFormActionQueryDataPlan(markdown) {
  const findings = [];
  const rows = queryDataRows(markdown);
  for (const [index, row] of rows.entries()) validateRow(row, index, findings);
  return {
    status: findings.some((item) => item.severity === "error") ? "fail" : findings.some((item) => item.severity === "warning") ? "pass_with_warnings" : "pass",
    queryDataRows: rows.length,
    findings,
  };
}

export function extractFormActionQueryDataPlanRows(markdown) {
  return queryDataRows(markdown);
}

function validateRow(row, index, findings) {
  const path = `Form Actions and Temp Variables row ${index + 1}`;
  const mode = value(row, "Query Mode");
  const host = value(row, "Host Surface / Page", "Host Form");
  const sourceType = value(row, "Source Resource Type");
  const source = value(row, "Source Resource", "Data Read");
  const hostResource = value(row, "Host Resource", "Host Data List");
  const hostForm = value(row, "Host Form", "Custom Form");
  const resultType = value(row, "Result Target Type");
  const result = value(row, "Result Target");
  const mapping = value(row, "Field Mapping");
  const countType = value(row, "Count Target Type");
  const count = value(row, "Count Target");
  const pageSize = value(row, "Page Size");
  const pageNumber = value(row, "Page Number");
  const notes = value(row, "Notes", "Business Rationale");
  for (const [label, current] of [["Action Name", value(row, "Action Name")], ["Step Name", value(row, "Step Name")], ["Host Surface / Page", host], ["Trigger", value(row, "Trigger")], ["Query Mode", mode], ["Source Resource Type", sourceType], ["Source Resource", source]]) {
    if (isEmpty(current)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_REQUIRED_VALUE_MISSING", `${label} is required for a Query Data step`, path, { column: label });
  }
  if (!MODES.has(mode)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_MODE_INVALID", "Query Mode must use a supported golden-reference mode", path, { mode });
  if (/public\s*form/i.test(host)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_PUBLIC_FORM_FORBIDDEN", "Public Forms cannot host Form Action Query Data", path);
  if (/data\s*list|document\s*library/i.test(host)) {
    if (isNone(hostResource)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_HOST_RESOURCE_MISSING", "Data List/Document Library Form Query Data requires Host Resource", path);
    if (isNone(hostForm)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_HOST_FORM_MISSING", "Data List/Document Library Form Query Data requires Host Form", path);
  }
  if (/form\s*report|data\s*report/i.test(host)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_REPORT_HOST_FORBIDDEN", "Form Report and Data Report do not have independent Form Action hosts", path);

  if (mode === "single_to_variables") {
    requireTarget(resultType, result, mapping, /workflow/i, findings, path);
  } else if (mode === "single_to_temp_variables") {
    requireTarget(resultType, result, mapping, /temp/i, findings, path);
  } else if (mode === "single_to_list_fields") {
    requireDataListHost(host, findings, path, mode);
    requireTarget(resultType, result, mapping, /current.*field|data\s*list.*field|record.*field/i, findings, path);
  } else if (mode === "single_to_list_fields_and_temp_variables") {
    requireDataListHost(host, findings, path, mode);
    requireTarget(resultType, result, mapping, /current.*field.*temp|temp.*current.*field|data\s*list.*field.*temp/i, findings, path);
  } else if (mode === "multiple_to_sublist") {
    requireTarget(resultType, result, mapping, /sub\s*list|list/i, findings, path);
  } else if (mode === "multiple_to_list_sublist") {
    requireDataListHost(host, findings, path, mode);
    requireTarget(resultType, result, mapping, /current.*sub\s*list|record.*sub\s*list|data\s*list.*sub\s*list/i, findings, path);
    if (/read[ -]?only|display only|view only|仅展示|只读/i.test(notes)) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_READONLY_SUBLIST_MISUSE", "Read-only reverse-related display should use Collection or Data Table instead of Query Data into Sub list", path);
    } else if (!/edit|update|working copy|line item|quotation|quote|quantity|description|编辑|更新|报价|明细/i.test(notes)) {
      add(findings, "warning", "FORM_ACTION_QUERYDATA_PLAN_SUBLIST_WORKING_COPY_RATIONALE_REQUIRED", "Explain why queried rows must become an editable Sub list working copy instead of a Collection/Data Table", path);
    }
  } else if (mode === "multiple_to_temp_collection") {
    requireTarget(resultType, result, mapping, /temp.*collection|collection/i, findings, path);
  } else if (mode === "multiple_count_only") {
    if (!isNone(resultType) || !isNone(result) || !isNone(mapping)) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_COUNT_ONLY_RESULT_PRESENT", "Count-only mode must set result target and field mapping to None", path, { resultType, result, mapping });
    }
    if (isNone(countType) || isNone(count)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_COUNT_TARGET_MISSING", "Count-only mode requires a workflow-number or temp count target", path);
  }

  if (!isNone(count) && isNone(countType)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_COUNT_TARGET_TYPE_MISSING", "Count Target Type is required when Count Target is provided", path);
  if (/data\s*list|document\s*library/i.test(host) && !isNone(count) && !/temp/i.test(countType)) {
    add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_DATALIST_COUNT_TARGET_INVALID", "Current Data List/Document Library Form export proof stores query result counts in a temp variable", path, { countType });
  }
  if (/dashboard/i.test(host)) {
    if (!/temp/i.test(resultType) && !isNone(resultType)) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_DASHBOARD_RESULT_NOT_TEMP", "Dashboard Query Data record outputs must target temp variables or a temp collection", path, { resultType });
    }
    if (!isNone(count) && !/temp/i.test(countType)) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_DASHBOARD_COUNT_NOT_TEMP", "Dashboard Query Data result counts must target a temp variable", path, { countType });
    }
  }
  if (!isNone(pageSize)) {
    const numericPageSize = Number(pageSize);
    if (!Number.isInteger(numericPageSize) || numericPageSize < 1 || numericPageSize > 1000) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_PAGE_SIZE_INVALID", "Page Size must be an integer from 1 to 1000; omitted means the shared default 100", path, { pageSize });
    }
  }
  if (!isNone(pageNumber)) {
    const numericPageNumber = Number(pageNumber);
    if (!Number.isInteger(numericPageNumber) || numericPageNumber < 1) {
      add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_PAGE_NUMBER_INVALID", "Page Number must be a positive integer; omitted means the shared default 1", path, { pageNumber });
    }
  }
  if (!/^data\s*list$/i.test(sourceType) && !isEmpty(sourceType)) {
    add(findings, "warning", "FORM_ACTION_QUERYDATA_PLAN_SOURCE_EXPORT_PROOF_REQUIRED", "This focused baseline proves Data List source metadata; other source types require a focused export before final generation", path, { sourceType });
  }
}

function requireDataListHost(host, findings, path, mode) {
  if (!/data\s*list|document\s*library/i.test(host)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_DATALIST_MODE_HOST_INVALID", `${mode} requires a Custom Data List or Document Library Form host`, path, { host });
}

function requireTarget(type, target, mapping, expectedType, findings, path) {
  if (isNone(type) || !expectedType.test(type)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_RESULT_TARGET_TYPE_INVALID", "Result Target Type does not match Query Mode", path, { type });
  if (isNone(target)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_RESULT_TARGET_MISSING", "Result Target is required for this Query Mode", path);
  if (isNone(mapping)) add(findings, "error", "FORM_ACTION_QUERYDATA_PLAN_FIELD_MAPPING_MISSING", "Field Mapping is required for this Query Mode", path);
}

function queryDataRows(markdown) {
  const rows = [];
  const lines = String(markdown || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitRow(lines[index]);
    if (!headers.some((header) => /Exact Step Type|Steps/i.test(header))) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitRow(lines[rowIndex]);
      const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
      const stepType = value(row, "Exact Step Type", "Steps");
      if (/query\s*data|querydata/i.test(stepType)) rows.push(row);
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }
  return rows;
}

function value(row, ...names) {
  for (const name of names) {
    const key = Object.keys(row).find((candidate) => normalize(candidate) === normalize(name));
    if (key) return String(row[key] || "").trim();
  }
  return "";
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isNone(value) {
  return !String(value || "").trim() || /^(none|n\/a|not applicable|无|不适用)$/i.test(String(value).trim());
}

function isEmpty(value) {
  return isNone(value) || /^<.*>$/.test(String(value || "").trim());
}

function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line || "");
}

function splitRow(line) {
  return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function add(findings, severity, code, message, path, detail = {}) {
  findings.push({ severity, code, message, path, ...detail });
}

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--plan") out.plan = argv[++index];
    else if (argv[index] === "--help" || argv[index] === "-h") usage(0);
    else usage(1);
  }
  return out;
}

function usage(exitCode) {
  console.error("Usage: node scripts/validate-form-action-query-data-plan.mjs --plan <app-plan.md>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
