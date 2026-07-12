#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import setVariableContractUtils from "./lib/set-variable-contract-utils.cjs";

const { normalizeSetVariableHostType } = setVariableContractUtils;

export function validateSetVariablePlan(text) {
  const findings = [];
  let formActionRows = 0;
  let workflowRows = 0;
  const lines = String(text || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1] || "")) continue;
    const headers = cells(lines[index]).map(norm);
    const stepType = column(headers, ["exact step type", "step type"]);
    const nodeType = column(headers, ["node type", "workflow node type"]);
    const target = column(headers, ["result target", "target", "target id", "variable target"]);
    const actionName = column(headers, ["action name"]);
    const hostType = column(headers, ["host type"]);
    const targetKind = column(headers, ["target kind"]);
    const rhsTokens = column(headers, ["rhs expression tokens", "value expression tokens"]);
    const nextAction = column(headers, ["start another action target", "next action target"]);
    const notes = column(headers, ["notes", "business rationale", "notes and business rationale"]);
    const assignments = column(headers, ["set variable assignments", "variable assignments", "target value assignments"]);
    let tableEnd = index + 2;
    while (tableEnd < lines.length && isTableLine(lines[tableEnd])) tableEnd += 1;
    const actionNames = new Set();
    if (actionName >= 0) for (let cursor = index + 2; cursor < tableEnd; cursor += 1) {
      const value = cells(lines[cursor])[actionName];
      if (!missing(value)) actionNames.add(norm(value));
    }
    let row = index + 2;
    while (row < lines.length && isTableLine(lines[row])) {
      if (/^\s*\|?\s*:?-{3,}/.test(lines[row + 1] || "")) break;
      const values = cells(lines[row]);
      if (values.some((value) => /<[^>]+>/.test(value))) {
        row += 1;
        continue;
      }
      if (stepType >= 0 && /set\s*variable/i.test(values[stepType] || "")) {
        formActionRows += 1;
        if (target < 0 || missing(values[target])) findings.push(problem("SET_VARIABLE_PLAN_TARGET_MISSING", "Form Action Set variable row must name an exact target ID.", row + 1));
        if (notes < 0 || !/(fixed|expression|function|condition|continue|dynamic display|read.?only|consumer|value)/i.test(values[notes] || "")) findings.push(problem("SET_VARIABLE_PLAN_VALUE_OR_CONSUMER_MISSING", "Form Action Set variable row must describe its RHS value/expression and consumer or condition behavior.", row + 1));
      }
      if (rhsTokens >= 0 && targetKind >= 0 && actionName >= 0) {
        formActionRows += 1;
        const kind = values[targetKind] || "";
        const rhs = values[rhsTokens] || "";
        const chained = nextAction >= 0 ? values[nextAction] || "" : "";
        const rawHostType = hostType >= 0 ? values[hostType] || "" : "";
        const canonicalHostType = normalizeSetVariableHostType(rawHostType);
        if (!missing(rawHostType) && !canonicalHostType) findings.push(problem("FORM_ACTION_SETVAR_HOST_TYPE_UNSUPPORTED", "Host Type must resolve to Approval, Data List Form, or Dashboard using the shared Set Variable host contract.", row + 1));
        if (!missing(kind) && !/^none$/i.test(kind) && missing(values[target])) findings.push(problem("SET_VARIABLE_PLAN_TARGET_MISSING", "Form Action Set variable assignment must name an exact target ID.", row + 1));
        if (!missing(kind) && !/^none$/i.test(kind) && !isJsonArray(rhs)) findings.push(problem("SET_VARIABLE_PLAN_RHS_EXPRESSION_INVALID", "RHS Expression Tokens must be a valid JSON token array.", row + 1));
        if (["dashboard", "approval"].includes(canonicalHostType) && /current\s*(?:data\s*)?list\s*field|list\s*field/i.test(kind)) findings.push(problem("SET_VARIABLE_PLAN_LIST_FIELD_TARGET_UNSUPPORTED_HOST", "Dashboard and Approval Form Actions cannot target current Data List fields.", row + 1));
        if (!missing(chained) && !actionNames.has(norm(chained))) findings.push(problem("SET_VARIABLE_PLAN_CHAIN_TARGET_UNRESOLVED", "Start Another Action Target must resolve to an Action Name in the same planning table.", row + 1));
      }
      if (nodeType >= 0 && /set\s*variable|setvariabletask/i.test(values[nodeType] || "")) {
        workflowRows += 1;
        const value = assignments >= 0 ? values[assignments] : "";
        if (missing(value) || !/::/.test(value) || !/\[\s*\{/.test(value)) findings.push(problem("WORKFLOW_SET_VARIABLE_PLAN_ASSIGNMENTS_MISSING", "Workflow SetVariableTask row must include exact machine-readable Set Variable Assignments.", row + 1));
      }
      row += 1;
    }
    index = row - 1;
  }
  return { status: findings.length ? "fail" : "pass", formActionRows, workflowRows, findings };
}

function cells(line) { const s=String(line||"").trim().replace(/^\|/,'').replace(/\|$/,''); return s.split('|').map((v)=>v.trim()); }
function isTableLine(line) { return /^\s*\|.*\|\s*$/.test(String(line || "")); }
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function column(headers, names) { return headers.findIndex((header) => names.includes(header)); }
function missing(value) { return !String(value || "").trim() || /^(?:n\/?a|none|not applicable|<.*>)$/i.test(String(value || "").trim()); }
function isJsonArray(value) { try { return Array.isArray(JSON.parse(String(value || "").trim().replace(/^`([\s\S]*)`$/, "$1"))); } catch { return false; } }
function problem(code, message, line) { return { severity: "error", code, message, line }; }

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const file = process.argv[process.argv.indexOf("--plan") + 1] || process.argv[2];
  if (!file) { console.error("Usage: node scripts/validate-set-variable-plan.mjs --plan <yeeflow-app-plan.md>"); process.exit(1); }
  const report = validateSetVariablePlan(fs.readFileSync(file, "utf8"));
  console.log(JSON.stringify({ ...report, file: path.resolve(file) }, null, 2));
  if (report.status === "fail") process.exitCode = 1;
}
