#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const APP_ID = "1909100000000000001";
const LIST_ID = "1909100000000000100";

function registry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
}

function templateResource() {
  const resource = clone(registry().templates[0].template.parsedResource);
  resource.derivedFromDashboardPageLayoutTemplate = TEMPLATE_ID;
  removeOperations(resource);
  adaptAllowedBusinessText(resource);
  ensureCollection(resource);
  return resource;
}

function adaptAllowedBusinessText(resource) {
  const allowed = ["event_portfolio_pipeline_title_group", "section_title_header", "event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"];
  for (const id of allowed) {
    for (const node of findAll(resource, id)) replaceBusinessStrings(node);
  }
}

function replaceBusinessStrings(node) {
  if (Array.isArray(node)) return node.forEach(replaceBusinessStrings);
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string" && !["id", "key", "type", "name", "nv_label", "nav_label"].includes(key)) {
      node[key] = value
        .replaceAll("Campaign", "Loan")
        .replaceAll("Registration", "Checkout")
        .replaceAll("Marketing Event", "Asset Loan")
        .replaceAll("Template", "Asset Loan");
    } else {
      replaceBusinessStrings(value);
    }
  }
}

function ensureCollection(resource) {
  const section = find(resource, "section_content_area");
  section.children = section.children || [];
  section.children.push({
    type: "collection",
    name: "Asset Loan Work Queue",
    attrs: {
      data: { list: { ListID: LIST_ID, Title: "Loan Requests" } },
    },
  });
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !ids(child).includes("Operations"));
    node.children.forEach(removeOperations);
  }
}

function decoded(resource = templateResource()) {
  return {
    ListSet: { ListID: APP_ID, Title: "Office Asset Loan Management" },
    Pages: [{ Type: 103, Title: "Asset Loan Dashboard", LayoutID: "dashboard-layout-1", LayoutInResources: [{ ID: "dashboard-layout-1", RefId: "dashboard-layout-1", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Loan Requests" }, Fields: [{ FieldName: "Title" }, { FieldName: "Borrower", FieldType: "User" }] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [{ ID: "nav", Title: "Dashboard" }],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-laptop\",\"c\":\"#ffffff\"}",
    Roles: [],
    Permissions: [],
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.attrs?.nav_label, node?.derivedFromDashboardPageLayoutTemplate, node?.attrs?.derivedFromDashboardPageLayoutTemplate].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function find(node, id) {
  let found = null;
  visit(node, (current) => {
    if (!found && ids(current).includes(id)) found = current;
  });
  return found;
}

function findAll(node, id) {
  const found = [];
  visit(node, (current) => {
    if (ids(current).includes(id)) found.push(current);
  });
  return found;
}

function run(args) {
  return spawnSync(process.execPath, ["scripts/validate-dashboard-page-layout-template.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-page-layout-slots-"));
try {
  expectPass("registry declares controlled slots and repeatable modules", ["--registry", "docs/reference/dashboard-page-layout-templates.json"]);

  const validBusinessSlotContent = templateResource();
  find(validBusinessSlotContent, "section_content_area").children.push({
    type: "container",
    name: "Asset Loan Exception Queue",
    children: [{ type: "heading", attrs: { heads: { title: { value: "Overdue asset returns" } } } }],
  });
  expectPass("business-specific content inside section_content_area passes", ["--package", writePackage(tempDir, "business-slot", decoded(validBusinessSlotContent))]);

  const removableModule = templateResource();
  find(removableModule, "content").children = find(removableModule, "content").children.filter((child) => !ids(child).includes("3_columns_section"));
  expectPass("unneeded repeatable module removal passes", ["--package", writePackage(tempDir, "remove-repeatable", decoded(removableModule))]);

  const copiedCard = templateResource();
  const cardCopy = clone(find(copiedCard, "content_card_wrapper"));
  find(cardCopy, "section_title_header").children.push({ type: "heading", attrs: { heads: { title: { value: "Asset loan exceptions" } } } });
  find(copiedCard, "content").children.push(cardCopy);
  expectPass("new section copied from allowed content_card_wrapper passes", ["--package", writePackage(tempDir, "copy-card", decoded(copiedCard))]);

  const copiedKpi = templateResource();
  const kpiCopy = clone(find(copiedKpi, "event_portfolio_kpi_planned_events"));
  find(kpiCopy, "event_portfolio_kpi_planned_events_label").attrs.headc.title.value = "Overdue Returns";
  find(copiedKpi, "kpi_cards_kpi_row").children.push(kpiCopy);
  expectPass("new KPI copied from allowed planned-events KPI card passes", ["--package", writePackage(tempDir, "copy-kpi", decoded(copiedKpi))]);

  const inventedModule = templateResource();
  find(inventedModule, "content").children.push({ type: "container", name: "custom_asset_lane_module", attrs: { style: { widthtype: [null, "1"] } }, children: [] });
  expectCode("invented dashboard layout module outside slots fails", ["--package", writePackage(tempDir, "invented-module", decoded(inventedModule))], "DASH_LAYOUT_INVENTED_LAYOUT_MODULE");

  const mutatedTemplateContainer = templateResource();
  find(mutatedTemplateContainer, "content_card_wrapper").attrs.style.gap = [null, 99];
  expectCode("non-business template container structure mutation fails", ["--package", writePackage(tempDir, "mutated-container", decoded(mutatedTemplateContainer))], "DASH_LAYOUT_TEMPLATE_STRUCTURE_MUTATION");

  const nonSlotTextMutation = templateResource();
  find(nonSlotTextMutation, "page_title_section").attrs ??= {};
  find(nonSlotTextMutation, "page_title_section").attrs.label = "Unauthorized page title mutation";
  expectCode("business text outside allowed business-content container fails", ["--package", writePackage(tempDir, "non-slot-text", decoded(nonSlotTextMutation))], "DASH_LAYOUT_TEMPLATE_STRUCTURE_MUTATION");

  const brokenKpiCopy = templateResource();
  const brokenKpi = clone(find(brokenKpiCopy, "event_portfolio_kpi_planned_events"));
  brokenKpi.children = brokenKpi.children.filter((child) => !ids(child).includes("event_portfolio_kpi_planned_events_top_row"));
  find(brokenKpiCopy, "kpi_cards_kpi_row").children.push(brokenKpi);
  expectCode("copied KPI card missing required children fails", ["--package", writePackage(tempDir, "broken-kpi", decoded(brokenKpiCopy))], "DASH_LAYOUT_KPI_COPY_REQUIRED_CHILD_MISSING");

  console.log(JSON.stringify({ status: "pass", cases: 9 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
