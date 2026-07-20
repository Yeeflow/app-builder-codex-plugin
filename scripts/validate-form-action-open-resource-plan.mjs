#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { splitMarkdownTableRow, stripMarkdownFencedBlocks } from "./lib/markdown-planning-core-adapter.mjs";

if (isMainModule()) {
  const file = process.argv[process.argv.indexOf("--plan") + 1];
  if (!file) usage();
  const report = validateFormActionOpenResourcePlan(fs.readFileSync(file, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateFormActionOpenResourcePlan(text) {
  const rows = extractFormActionOpenResourcePlanRows(text);
  const findings = [];
  for (const [index, row] of rows.entries()) validateRow(row, index, findings);
  return { status: findings.some((item) => item.severity === "error") ? "fail" : "pass", openResourceRows: rows.length, findings };
}

export function extractFormActionOpenResourcePlanRows(text) {
  const rows = [];
  const lines = stripMarkdownFencedBlocks(text).split(/\r?\n/);
  for (let i = 0; i < lines.length - 2; i += 1) {
    if (!isTable(lines[i]) || !isTable(lines[i + 1]) || !/^\s*\|?\s*:?-+/.test(lines[i + 1])) continue;
    const headers = split(lines[i]);
    if (!["Exact Step Type", "Host Resource", "Target Resource"].every((name) => headers.some((header) => norm(header) === norm(name)))) continue;
    for (i += 2; i < lines.length && isTable(lines[i]); i += 1) {
      const cells = split(lines[i]);
      const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
      const type = value(row, "Exact Step Type");
      if (/^(listitem|openform|opendashboard)$/i.test(type)) rows.push(row);
    }
    i -= 1;
  }
  return rows;
}

function validateRow(row, index, findings) {
  const path = `Form Action Open Resource Planning row ${index + 1}`;
  const type = value(row, "Exact Step Type").toLowerCase();
  const host = value(row, "Host Type");
  const operation = value(row, "Operation Type").toLowerCase();
  const targetMode = value(row, "Target Mode").toLowerCase();
  const targetType = value(row, "Target Resource Type");
  const target = value(row, "Target Resource");
  const openMode = value(row, "Open Mode").toLowerCase();
  const size = value(row, "Modal Size");
  const width = value(row, "Custom Width");
  const idTokens = value(row, "Item / Form ID Expression Tokens");
  const setVars = value(row, "Default / Set Variables JSON");
  const query = value(row, "Query Parameters JSON");
  for (const required of ["Host Resource", "Host Form / Page", "Action Name", "Step Name", "Trigger", "Bound Control", "Target Resource Type", "Target Resource", "Open Mode"]) {
    if (none(value(row, required))) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_REQUIRED_VALUE_MISSING", `${required} is required.`, path);
  }
  if (/public/i.test(host)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_PUBLIC_FORM_FORBIDDEN", "Public Forms cannot plan open-resource steps.", path);
  if (!/^(slide|modal|target|new)$/.test(openMode)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_MODE_INVALID", "Open Mode must be slide, modal, target, or new.", path);
  if (/^(slide|modal)$/.test(openMode)) {
    if (!/^(0|1|2|3|9)$/.test(size)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_SIZE_INVALID", "Slide/Pop-up requires Modal Size 0, 1, 2, 3, or 9.", path);
    if (size === "9" && !(Number(width) > 0)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_CUSTOM_WIDTH_MISSING", "Custom size 9 requires a positive Custom Width.", path);
  } else if (!none(size) || !none(width)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_SIZE_NOT_ALLOWED", "Full page/New window must not plan modal sizing.", path);
  if (type === "listitem") {
    if (!/^(add|edit|view)$/.test(operation)) add(findings, "error", "FORM_ACTION_OPEN_ITEM_PLAN_OPERATION_INVALID", "Open Item Form operation must be add, edit, or view.", path);
    if (!/^(current|select)$/.test(targetMode)) add(findings, "error", "FORM_ACTION_OPEN_ITEM_PLAN_TARGET_MODE_INVALID", "Open Item Form target mode must be current or select.", path);
    if (targetMode === "current" && !/(data list|document library)/i.test(host)) add(findings, "error", "FORM_ACTION_OPEN_ITEM_PLAN_CURRENT_HOST_INVALID", "Current item is available only on Data List/Document Library custom forms.", path);
    if (!/^(data list|document library)$/i.test(targetType)) add(findings, "error", "FORM_ACTION_OPEN_ITEM_PLAN_TARGET_TYPE_INVALID", "Open Item Form target must be a Data List or Document Library.", path);
    if (targetMode === "select" && operation !== "add" && !expressionTokenArray(idTokens)) add(findings, "error", "FORM_ACTION_OPEN_ITEM_PLAN_ID_REQUIRED", "Selected Edit/View requires parseable Item ID expression tokens.", path);
  }
  if (type === "openform") {
    if (!/^(new|submitted)$/.test(operation)) add(findings, "error", "FORM_ACTION_OPEN_APPROVAL_PLAN_OPERATION_INVALID", "Open Approval Form operation must be new or submitted.", path);
    if (!/^approval form$/i.test(targetType)) add(findings, "error", "FORM_ACTION_OPEN_APPROVAL_PLAN_TARGET_TYPE_INVALID", "Open Approval Form target type must be Approval Form.", path);
    if (operation === "submitted" && !expressionTokenArray(idTokens)) add(findings, "error", "FORM_ACTION_OPEN_APPROVAL_PLAN_FORM_ID_REQUIRED", "Submitted form requires parseable Form ID expression tokens.", path);
    if (operation === "submitted" && (!none(setVars) || !none(query))) add(findings, "error", "FORM_ACTION_OPEN_APPROVAL_PLAN_SUBMITTED_INPUT_FORBIDDEN", "Submitted form cannot receive Set Variables or Query Parameters.", path);
    if (operation === "new" && !none(setVars) && !setVariableRules(setVars)) add(findings, "error", "FORM_ACTION_OPEN_APPROVAL_PLAN_SETVARS_INVALID", "Set Variables must be a JSON array of typed target-variable expression rules.", path);
  }
  if (type === "opendashboard" && !/^dashboard$/i.test(targetType)) add(findings, "error", "FORM_ACTION_OPEN_DASHBOARD_PLAN_TARGET_TYPE_INVALID", "Open Dashboard target type must be Dashboard.", path);
  if (!none(query) && !queryParameterRules(query)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_QUERY_PARAMS_INVALID", "Query Parameters must be a JSON array with unique names and direct or expression values.", path);
  if (none(target)) add(findings, "error", "FORM_ACTION_OPEN_RESOURCE_PLAN_TARGET_MISSING", "Target Resource is required.", path);
}

function expressionTokenArray(valueText) { try { const value = JSON.parse(valueText); return Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === "object" && !Array.isArray(item) && (item.type || item.exprType)); } catch { return false; } }
function setVariableRules(valueText) { try { const value = JSON.parse(valueText); return Array.isArray(value) && value.every((item) => (item?.id || item?.idx || item?.source) && item?.type && Array.isArray(item?.rule) && item.rule.length > 0); } catch { return false; } }
function queryParameterRules(valueText) { try { const value = JSON.parse(valueText); if (!Array.isArray(value)) return false; const names = value.map((item) => String(item?.name || "").trim().toLowerCase()); return names.every(Boolean) && new Set(names).size === names.length && value.every((item) => item?.value && typeof item.value === "object" && ((Object.prototype.hasOwnProperty.call(item.value, "value") && item.value.value !== null && item.value.value !== undefined) || (Array.isArray(item.value.variable) && item.value.variable.length > 0))); } catch { return false; } }
function value(row, name) { const key = Object.keys(row).find((item) => norm(item) === norm(name)); return String(key ? row[key] : "").trim(); }
function norm(valueText) { return String(valueText || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function none(valueText) { return !String(valueText || "").trim() || /^(none|n\/a|not applicable)$/i.test(String(valueText).trim()) || /^<.*>$/.test(String(valueText).trim()); }
function isTable(line) { return /^\s*\|.*\|\s*$/.test(line || ""); }
function split(line) { return splitMarkdownTableRow(line); }
function add(findings, severity, code, message, path) { findings.push({ severity, code, message, path }); }
function usage() { console.error("Usage: node scripts/validate-form-action-open-resource-plan.mjs --plan <app-plan.md>"); process.exit(1); }
function isMainModule() { return import.meta.url === pathToFileURL(process.argv[1]).href; }
