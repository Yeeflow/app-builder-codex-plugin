#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { parseMarkdownTables } from "./lib/markdown-planning-core-adapter.mjs";

export function extractPrintBarcodePlanRows(text) {
  const rows = [];
  for (const table of parseMarkdownTables(text)) {
    const headers = table.headers.map(norm);
    const typeIndex = find(headers, ["exact step type", "step type"]);
    const hostIndex = find(headers, ["host resource"]);
    const pageIndex = find(headers, ["host form page", "host page", "host form"]);
    const actionIndex = find(headers, ["action name"]);
    const stepIndex = find(headers, ["step name"]);
    if ([typeIndex, hostIndex, pageIndex, actionIndex, stepIndex].some((value) => value < 0)) continue;
    for (const row of table.rows) {
      const cells = row.cells;
      const type = clean(cells[typeIndex]).toLowerCase();
      if (!new Set(["print", "barcode"]).has(type)) continue;
      rows.push(Object.fromEntries(table.headers.map((header, index) => [header, clean(cells[index])])));
    }
  }
  return rows;
}

export function validateFormActionPrintBarcodePlan(text) {
  const rows = extractPrintBarcodePlanRows(text);
  const findings = [];
  const add = (code, message, row) => findings.push({ severity: "error", code, message, row });
  rows.forEach((row, index) => {
    const at = index + 1;
    const value = (...names) => {
      const key = Object.keys(row).find((item) => names.some((name) => norm(item) === norm(name)));
      return clean(key ? row[key] : "");
    };
    for (const required of ["Host Resource", "Host Form / Page", "Host Type", "Action Name", "Step Name", "Trigger", "Bound Control", "Exact Step Type"]) {
      if (!value(required)) add("FORM_ACTION_PRINT_BARCODE_PLAN_REQUIRED_VALUE_MISSING", `${required} is required.`, at);
    }
    const type = value("Exact Step Type").toLowerCase();
    if (/public form/i.test(value("Host Type")) && type === "print") add("FORM_ACTION_PRINT_PLAN_PUBLIC_FORM_FORBIDDEN", "Public Forms do not support Print page.", at);
    if (type === "print") {
      if (!/^dashboard$/i.test(value("Target Page Type"))) add("FORM_ACTION_PRINT_PLAN_TARGET_TYPE_UNPROVEN", "This focused training supports Dashboard print targets only.", at);
      if (!value("Target Page")) add("FORM_ACTION_PRINT_PLAN_TARGET_MISSING", "Dashboard target page is required.", at);
      if (!tokens(value("Print Title Expression Tokens"))) add("FORM_ACTION_PRINT_PLAN_TITLE_TOKENS_INVALID", "Print title requires expression-token JSON.", at);
      if (value("Paper Size").toUpperCase() !== "A4") add("FORM_ACTION_PRINT_PLAN_PAPER_SIZE_UNPROVEN", "This focused export proves A4 only.", at);
      if (!/^(portrait|landscape)$/i.test(value("Print Layout"))) add("FORM_ACTION_PRINT_PLAN_LAYOUT_INVALID", "Print Layout must be portrait or landscape.", at);
      const scale = Number(value("Scale Percent"));
      if (!(scale > 0 && scale <= 200)) add("FORM_ACTION_PRINT_PLAN_SCALE_INVALID", "Scale Percent must be 1..200.", at);
      if (!/^minimum$/i.test(value("Margins"))) add("FORM_ACTION_PRINT_PLAN_MARGINS_UNPROVEN", "This focused export proves Minimum margins only.", at);
    }
    if (type === "barcode") {
      if (!/^(multiple|select|auto)$/i.test(value("Scanning Mode"))) add("FORM_ACTION_BARCODE_PLAN_MODE_INVALID", "Scanning Mode must be multiple, select, or auto.", at);
      if (!/^(auto|ean-13)$/i.test(value("Barcode Type"))) add("FORM_ACTION_BARCODE_PLAN_TYPE_UNPROVEN", "Only Auto and ean-13 are export-proven.", at);
      if (!value("Result Temp Variable") || !value("Error Temp Variable")) add("FORM_ACTION_BARCODE_PLAN_TEMP_VARIABLE_MISSING", "Result and error temp variables are required.", at);
      if (!value("Barcode Filter Field")) add("FORM_ACTION_BARCODE_PLAN_FILTER_FIELD_MISSING", "Barcode scan must identify the Collection filter field that consumes scanned values.", at);
      if (!/^stop$/i.test(value("On Read Error"))) add("FORM_ACTION_BARCODE_PLAN_ERROR_MODE_UNPROVEN", "This focused export proves Stop action only.", at);
    }
  });
  return { status: findings.length ? "fail" : "pass", rows: rows.length, findings };
}

function find(headers, names) { return headers.findIndex((header) => names.some((name) => header === norm(name))); }
function norm(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function clean(value) { return String(value || "").replace(/<br\s*\/?>/gi, " ").trim(); }
function tokens(value) {
  const source = String(value || "").trim().replace(/^`([\s\S]*)`$/, "$1");
  try { const parsed = JSON.parse(source); return Array.isArray(parsed) && parsed.length > 0; } catch { return false; }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = process.argv.indexOf("--plan");
  if (index < 0 || !process.argv[index + 1]) throw new Error("Usage: node scripts/validate-form-action-print-barcode-plan.mjs --plan <yeeflow-app-plan.md>");
  const report = validateFormActionPrintBarcodePlan(fs.readFileSync(process.argv[index + 1], "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}
