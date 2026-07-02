#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const VALIDATOR = path.join(ROOT, "scripts/validate-dashboard-page-layout-template.mjs");
const REGISTRY = path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json");
const TEMPLATE_IDS = [
  "dashboard-page-layouts-v1.1",
  "dashboard-page-layouts-workbench",
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
];

function registry() {
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

function templateResource(templateId, title) {
  const template = registry().templates.find((entry) => entry.id === templateId);
  assert.ok(template, `${templateId} must be registered.`);
  const resource = clone(template.template.parsedResource);
  resource.name = title;
  resource.title = title;
  resource.derivedFromDashboardPageLayoutTemplate = templateId;
  resource.templateMarker = templateId;
  resource.attrs = {
    ...(resource.attrs || {}),
    dashboardPageLayoutTemplateId: templateId,
    derivedFromDashboardPageLayoutTemplate: templateId,
    templateMarker: templateId,
  };
  removeOperations(resource);
  removeFixtureUnresolvedActions(resource);
  mapTemplateDataSources(resource);
  materializeEmptySlots(resource);
  pruneEmptyGeneratedSections(resource);
  scrubFixtureTemplateResidue(resource);
  return resource;
}

function removeFixtureUnresolvedActions(resource) {
  visit(resource, (control) => {
    if (!control || typeof control !== "object") return;
    if (control.attrs && typeof control.attrs === "object") {
      delete control.attrs.control_action;
      delete control.attrs.action;
    }
    delete control.control_action;
    delete control.action;
  });
}

function mapTemplateDataSources(resource) {
  let leftPanelFilterIndex = 0;
  visit(resource, (control) => {
    const type = String(control?.type || "").toLowerCase();
    if (type === "collection" || type === "data-list") {
      control.attrs = control.attrs || {};
      control.attrs.data = {
        ...(control.attrs.data || {}),
        list: { AppID: 41, ListSetID: "1909100000000000001", ListID: "1909100000000000100", Type: 1, Title: "Loan Transactions" },
      };
    }
    if (["select-filter", "radio-filter", "checkbox-filter", "data-filter"].includes(type)) {
      const label = `${control.name || ""} ${control.title || ""} ${control.label || ""} ${control.nv_label || ""} ${control.attrs?.placeholder?.value || control.attrs?.placeholder || ""}`;
      if (control.nv_label === "left_panel_filter_control") leftPanelFilterIndex += 1;
      const field = control.nv_label === "left_panel_filter_control"
        ? (leftPanelFilterIndex === 1 ? "Priority" : "Status")
        : /\bpriority\b/i.test(label) ? "Priority" : /\bstatus\b/i.test(label) ? "Status" : "Status";
      control.attrs = control.attrs || {};
      control.attrs.data = {
        ...(control.attrs.data || {}),
        field,
        display_f: field,
        value_f: field,
        list: { AppID: 41, ListSetID: "1909100000000000001", ListID: "1909100000000000100", Type: 1, Title: "Loan Transactions" },
      };
      control.attrs.display_f = field;
      control.attrs.value_f = field;
      control.attrs.optionSourceProven = true;
      control.attrs.data.optionSourceProven = true;
      control.attrs["choice-options"] = field === "Priority" ? ["Low", "Medium", "High", "Critical"] : ["Open", "In Progress", "Resolved", "Closed"];
      control.attrs.options = control.attrs["choice-options"].map((value) => ({ value, label: value }));
    }
  });
}

function materializeEmptySlots(resource) {
  for (const slot of findAll(resource, "section_content_area")) {
    if (!hasBusinessContent(slot)) {
      slot.children = [{
        type: "collection",
        name: "Planned records",
        attrs: {
          data: { list: { AppID: 41, ListSetID: "1909100000000000001", ListID: "1909100000000000100", Type: 1, Title: "Loan Transactions" } },
          dashboardDatasetTemplateId: "collection_control_grid_table",
        },
      }];
    }
  }
  for (const chartSection of findAll(resource, "chart_cards_section")) {
    chartSection.children = [{
      type: "pie-chart",
      name: "Planned analytics",
      runtimeModelProven: true,
      attrs: { runtimeModelProven: true, dataAnalyticsTemplateId: "data_analytics_pie_chart_with_title" },
    }];
  }
}

function scrubFixtureTemplateResidue(node) {
  const replacements = [
    ["Active Loans", "Active Records"],
    ["active loans", "active records"],
    ["current loan volume", "current record volume"],
    ["return follow-up", "record follow-up"],
    ["checkout status", "processing status"],
    ["Office Asset records", "Loan Transaction records"],
  ];
  const rewrite = (value) => replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
  visitValue(node, (parent, key, value) => {
    if (typeof value === "string" && key !== "id") parent[key] = rewrite(value);
  });
}

function visitValue(value, fn, parent = null, key = null) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => visitValue(child, fn, value, index));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [childKey, childValue] of Object.entries(value)) {
    fn(value, childKey, childValue);
    visitValue(childValue, fn, value, childKey);
  }
}

function decodedForPage(templateId, title = "Asset Loan Operations Dashboard") {
  return {
    ListSet: { ListID: "1909100000000000001", Title: "Office Asset Loan Management" },
    Pages: [{
      Type: 103,
      Title: title,
      LayoutID: "dashboard-layout-1",
      LayoutInResources: [{ ID: "dashboard-layout-1", RefId: "dashboard-layout-1", Resource: JSON.stringify(templateResource(templateId, title)) }],
    }],
    Childs: [{ List: { ListID: "1909100000000000100", Title: "Loan Transactions" }, Fields: [{ FieldName: "Title" }, { FieldName: "ListDataID" }, { FieldName: "Status" }, { FieldName: "Priority" }] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [{ ID: "nav", Title: title }],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-chart-pie\",\"c\":\"#ffffff\"}",
    Roles: [],
    Permissions: [],
  };
}

function appPlan(rows) {
  return [
    "# Office Asset Loan Management - Yeeflow App Plan",
    "",
    "## Plan Status",
    "",
    "- Application name: Office Asset Loan Management",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "| List Name | Business Purpose |",
    "| --- | --- |",
    "| Loan Transactions | Tracks asset loan transactions. |",
    "",
    "## 14. Dashboard Pages Plan",
    "",
    "| Dashboard Page Name | Business Purpose |",
    "| --- | --- |",
    ...rows.map((row) => `| ${row.page} | ${row.purpose || "Operational dashboard."} |`),
    "",
    "#### Dashboard Page Layout Template Selection",
    "",
    "| Dashboard Page | Selected Dashboard Page Layout Template | Business Layout Need | Primary Regions Needed | Right Side Panel Needed | Chart Cards Section Needed | Selection Reason | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.page} | ${row.templateId} | ${row.need || "Selected by business workflow."} | ${row.regions || "Primary content"} | ${row.right || "No"} | ${row.charts || "No"} | ${row.reason || "Matches dashboard information architecture."} | Generated-final validation |`),
    "",
    "#### Dashboard Dataset Presentation Template Selection",
    "",
    "| Dashboard Page | Dataset Region | Source List | Selected Collection Template | Selection Reason |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.page} | ${row.page} records | Loan Transactions | collection_control_grid_table | Dense record queue. |`),
    "",
    "## 15. Application Navigation Plan",
    "",
    "| Group | Item | Resource Type |",
    "| --- | --- | --- |",
    "| Workspace | Loan Transactions | Data List |",
    ...rows.map((row) => `| Workspace | ${row.page} | Dashboard |`),
  ].join("\n");
}

function spec() {
  return [
    "# Functional Specification: Office Asset Loan Management",
    "",
    "| Application Name | Office Asset Loan Management |",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n");
}

function writePackage(dir, name, decoded) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64") })}\n`);
  return file;
}

function writePlan(dir, rows, name = "yeeflow-app-plan.md") {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `${appPlan(rows)}\n`);
  return file;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.attrs?.name, node?.attrs?.nv_label, node?.derivedFromDashboardPageLayoutTemplate].filter(Boolean).map(String);
}

function visit(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  for (const child of node.children || []) visit(child, fn);
}

function findAll(node, id) {
  const out = [];
  visit(node, (current) => {
    if (ids(current).includes(id)) out.push(current);
  });
  return out;
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !isOperationContainer(child));
    node.children.forEach(removeOperations);
  }
}

function isOperationContainer(node) {
  return ids(node).some((id) => [
    "Operations",
    "current_item_main_header_operations",
    "current_item_aditional_header_operations",
    "current_item_additional_header_operations",
  ].includes(id));
}

function hasBusinessContent(node) {
  let found = false;
  visit(node, (current) => {
    if (current === node || found) return;
    const type = String(current?.type || "").toLowerCase();
    if (["collection", "summary", "pie-chart", "bar-chart", "line-chart", "area-chart", "pivot-table"].includes(type)) found = true;
  });
  return found;
}

function pruneEmptyGeneratedSections(root) {
  const removable = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "chart_cards_section", "right_side_panel"]);
  const prune = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      prune(child);
      if (ids(child).includes("section_content_area") && !hasBusinessContent(child)) return false;
      if (!ids(child).some((id) => removable.has(id))) return true;
      return hasBusinessContent(child);
    });
  };
  prune(root);
}

function run(command, args, options = {}) {
  return spawnSync(process.execPath, [command, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...options });
}

function expectPass(label, command, args) {
  const result = run(command, args);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
  return result;
}

function expectCode(label, command, args, code) {
  const result = run(command, args);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
  return result;
}

function decodePackageResource(packagePath) {
  const wrapper = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-page-layout-plan-conformance-"));
try {
  const workbenchPlan = writePlan(tempDir, [{ page: "Asset Loan Operations Dashboard", templateId: "dashboard-page-layouts-workbench", right: "Yes", charts: "Yes" }], "workbench-plan.md");
  expectCode(
    "App Plan Workbench selection fails when generated dashboard silently falls back to v1.1",
    VALIDATOR,
    ["--package", writePackage(tempDir, "workbench-planned-v11-actual", decodedForPage("dashboard-page-layouts-v1.1")), "--app-plan", workbenchPlan],
    "DASH_LAYOUT_APP_PLAN_TEMPLATE_MISMATCH",
  );

  for (const templateId of TEMPLATE_IDS) {
    const title = `${templateId} Dashboard`;
    const plan = writePlan(tempDir, [{ page: title, templateId }], `${templateId}.md`);
    expectPass(
      `${templateId} generated resource matches App Plan selected dashboard page layout`,
      VALIDATOR,
      ["--package", writePackage(tempDir, `${templateId}-actual`, decodedForPage(templateId, title)), "--app-plan", plan],
    );
  }

  const specPath = path.join(tempDir, "functional-specification.md");
  const materializerPlan = writePlan(tempDir, [
    { page: "Asset Loan Operations Dashboard", templateId: "dashboard-page-layouts-workbench", right: "Yes", charts: "Yes" },
    { page: "Overdue Monitor", templateId: "dashboard-page-layouts-two-panel-workspace", right: "No", charts: "Yes" },
    { page: "Template Coverage Analytics Dashboard", templateId: "dashboard-page-layouts-three-panel-workspace", right: "Yes", charts: "Yes" },
  ], "materializer-plan.md");
  fs.writeFileSync(specPath, `${spec()}\n`);
  const materialized = expectPass("materializer preserves App Plan selected Dashboard page layout templates", MATERIALIZER, [
    "--functional-spec", specPath,
    "--app-plan", materializerPlan,
    "--out-dir", path.join(tempDir, "materialized"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const report = JSON.parse(materialized.stdout);
  const decoded = decodePackageResource(report.outputs.package);
  const actualByPage = new Map(decoded.Pages.filter((page) => String(page.Type) === "103").map((page) => {
    const resource = JSON.parse(page.LayoutInResources[0].Resource);
    return [page.Title, resource.derivedFromDashboardPageLayoutTemplate || resource.attrs?.dashboardPageLayoutTemplateId || ""];
  }));
  assert.equal(actualByPage.get("Asset Loan Operations Dashboard"), "dashboard-page-layouts-workbench");
  assert.equal(actualByPage.get("Overdue Monitor"), "dashboard-page-layouts-two-panel-workspace");
  assert.equal(actualByPage.get("Template Coverage Analytics Dashboard"), "dashboard-page-layouts-three-panel-workspace");

  console.log(JSON.stringify({ status: "pass", cases: 6 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
