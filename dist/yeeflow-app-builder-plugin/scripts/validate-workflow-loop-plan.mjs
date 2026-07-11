#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

if (isMainModule()) {
  const plan = argument("--plan") || process.argv.slice(2).find((item) => item !== "--json");
  if (!plan) usage(1);
  const report = validateWorkflowLoopPlan(fs.readFileSync(plan, "utf8"));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "fail" ? 1 : 0);
}

export function validateWorkflowLoopPlan(markdown) {
  const rows = extractWorkflowLoopPlanRows(markdown);
  const findings = [];
  rows.forEach((row, index) => validateRow(row, index, findings));
  return {
    status: findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "pass_with_warnings" : "pass",
    loopRows: rows.length,
    findings,
  };
}

export function extractWorkflowLoopPlanRows(markdown) {
  const rows = [];
  const lines = String(markdown || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitRow(lines[index]);
    if (!headers.some((header) => normalize(header) === "loop mode")) continue;
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
  const path = `Workflow Loop row ${index + 1}`;
  const workflow = value(row, "Workflow");
  const hostType = value(row, "Workflow Host Type");
  const node = value(row, "Loop Node Name");
  const mode = value(row, "Loop Mode").toLowerCase();
  const parent = value(row, "Loop Source Parent");
  const source = value(row, "Loop Source");
  const actions = value(row, "LoopBody Actions");
  const current = value(row, "Current Iteration / Current Item Use");
  const sideEffects = value(row, "Delay or Repeated Side Effects");
  const proof = value(row, "Proof Boundary");
  const rationale = value(row, "Business Rationale");

  for (const [label, currentValue] of [["Workflow", workflow], ["Workflow Host Type", hostType], ["Loop Node Name", node], ["Loop Mode", mode], ["Loop Source", source], ["LoopBody Actions", actions], ["Proof Boundary", proof], ["Business Rationale", rationale]]) {
    if (isNone(currentValue)) add(findings, "error", "WORKFLOW_LOOP_PLAN_REQUIRED_VALUE_MISSING", `${label} is required`, path, { column: label });
  }
  if (!/Approval|Data List|Scheduled/i.test(hostType)) add(findings, "error", "WORKFLOW_LOOP_PLAN_HOST_INVALID", "Workflow Host Type must be Approval, Data List, or Scheduled Workflow", path, { hostType });
  if (!["list", "values", "number"].includes(mode)) add(findings, "error", "WORKFLOW_LOOP_PLAN_MODE_INVALID", "Loop Mode must be list, values, or number", path, { mode });

  if (mode === "list") {
    if (!["__variables_", "__list_"].includes(parent)) add(findings, "error", "WORKFLOW_LOOP_PLAN_LIST_PARENT_INVALID", "List Loop source parent must be __variables_ or __list_", path, { parent });
    if (parent === "__list_" && !/Data List/i.test(hostType)) add(findings, "error", "WORKFLOW_LOOP_PLAN_SUBLIST_HOST_INVALID", "__list_ Sub List Loop sources are valid only in Data List Workflows", path, { hostType });
    if (parent === "__variables_" && !/List/i.test(source)) add(findings, "error", "WORKFLOW_LOOP_PLAN_LIST_VARIABLE_UNCLEAR", "__variables_ Loop source must identify a declared List workflow variable", path, { source });
  }
  if (["values", "number"].includes(mode) && !/expression|field|fixed|number|count|user|value/i.test(source)) {
    add(findings, "error", "WORKFLOW_LOOP_PLAN_EXPRESSION_SOURCE_UNCLEAR", "Values/number Loop source must identify an expression, multi-value field, or fixed count", path, { source });
  }
  if (mode === "number" && /fixed\s*(?:0|zero)\b/i.test(source)) add(findings, "error", "WORKFLOW_LOOP_PLAN_FIXED_COUNT_INVALID", "Fixed Loop count must be positive", path, { source });
  if (!isNone(current) && !/LoopIndex|LoopItem|Current iteration|Current item|None|N\/A/i.test(current)) add(findings, "error", "WORKFLOW_LOOP_PLAN_CONTEXT_UNPROVEN", "Current iteration/item use must name LoopIndex, LoopItem fields, or None", path, { current });
  if (!isNone(sideEffects) && /email|mutation|update|add|delete|delay|service|external/i.test(sideEffects) && !/runtime-proof-required|runtime-sensitive/i.test(proof)) {
    add(findings, "error", "WORKFLOW_LOOP_PLAN_SIDE_EFFECT_PROOF_MISSING", "Repeated email, mutation, Delay, service, or external effects must be marked runtime-proof-required/runtime-sensitive", path, { sideEffects, proof });
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
  console.error("Usage: node scripts/validate-workflow-loop-plan.mjs --plan <yeeflow-app-plan.md>");
  process.exit(exitCode);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
