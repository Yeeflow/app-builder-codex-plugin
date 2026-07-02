#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const APP_ID = "1909100000000000001";
const LIST_ID = "1909100000000000100";
const TEMPLATE_IDS = [
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
];

function registry() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
}

function workspaceTemplate(templateId) {
  const template = registry().templates.find((entry) => entry.id === templateId);
  assert.ok(template, `${templateId} must be registered.`);
  const resource = clone(template.template.parsedResource);
  resource.derivedFromDashboardPageLayoutTemplate = templateId;
  resource.generatedFinalDashboardMaterialization = { kpiCount: null };
  mapTemplateDataSources(resource);
  removeOperations(resource);
  ensureSectionContent(resource);
  ensureChartSections(resource);
  adaptWorkspaceDomain(resource);
  bindCurrentItemFields(resource);
  return resource;
}

function mapTemplateDataSources(resource) {
  visit(resource, (control) => {
    if (!control?.attrs?.data) return;
    if (control.type === "collection" || control.type === "data-list") {
      control.attrs.data.list = {
        ...(control.attrs.data.list || {}),
        AppID: 41,
        ListSetID: APP_ID,
        ListID: LIST_ID,
        Type: 1,
        Title: "Support Tickets",
      };
    }
    if (["select-filter", "radio-filter", "checkbox-filter"].includes(control.type)) {
      const label = `${control.name || ""} ${control.title || ""} ${control.label || ""} ${control.nv_label || ""} ${control.attrs?.placeholder?.value || control.attrs?.placeholder || ""}`;
      const field = /\bstatus\b/i.test(label) ? "Status" : /\bpriority\b/i.test(label) ? "Priority" : control.attrs.data.field || "Priority";
      control.attrs.data = {
        ...control.attrs.data,
        list: {
          ...(control.attrs.data.list || {}),
          AppID: 41,
          ListSetID: APP_ID,
          ListID: LIST_ID,
          Type: 1,
          Title: "Support Tickets",
        },
        field,
        optionSourceProven: true,
      };
      control.attrs.display_f = field;
      control.attrs.value_f = field;
      control.attrs.optionSourceProven = true;
      control.attrs["choice-options"] = field === "Status"
        ? ["Open", "In Progress", "Resolved", "Closed"]
        : ["Low", "Medium", "High", "Critical"];
      control.attrs.options = control.attrs["choice-options"].map((value) => ({ value, label: value }));
    }
  });
}

function adaptWorkspaceDomain(node) {
  const replacements = [
    ["Active Loans", "Open Tickets"],
    ["Active Loan Pipeline", "Ticket Work Queue"],
    ["current loan volume", "current ticket volume"],
    ["return activity signal", "resolution activity signal"],
    ["watch coordinator follow-up", "watch support follow-up"],
    ["Office Asset records", "Support Tickets records"],
    ["Coordinator view of active loans, due dates, checkout status, and return follow-up.", "Track support ticket status, priority, ownership, and follow-up context."],
    ["Coordinator guidance: prioritize overdue items and returns due within the next seven days.", "Coordinator guidance: prioritize open tickets due within the next seven days."],
  ];
  const visitValue = (value) => {
    if (Array.isArray(value)) return value.forEach(visitValue);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string" && key !== "id") value[key] = replacements.reduce((text, [from, to]) => text.replaceAll(from, to), child);
      else visitValue(child);
    }
  };
  visitValue(node);
}

function bindCurrentItemFields(resource) {
  const fieldMap = new Map([
    ["ticket id", { displayName: "Ticket Number", fieldName: "TicketNumber" }],
    ["ticket number", { displayName: "Ticket Number", fieldName: "TicketNumber" }],
    ["type of request", { displayName: "Status", fieldName: "Status" }],
    ["category", { displayName: "Category", fieldName: "Category" }],
    ["priority", { displayName: "Priority", fieldName: "Priority" }],
    ["description", { displayName: "Description", fieldName: "Description" }],
    ["impact level", { displayName: "Impact Level", fieldName: "ImpactLevel" }],
    ["assigned to", { displayName: "Assigned To", fieldName: "AssignedTo", controlType: "dynamic-user" }],
    ["created time", { displayName: "Created Time", fieldName: "CreatedTime" }],
  ]);
  for (const wrapper of [...findAll(resource, "current_item_standard_field"), ...findAll(resource, "current_item_large_field")]) {
    const titleControl = find(wrapper, "current_item_standard_field_title") || find(wrapper, "current_item_large_field_title");
    const label = visibleText(titleControl).toLowerCase();
    const field = fieldMap.get(label);
    if (!field) continue;
    const valueControl = find(wrapper, "current_item_standard_field_value") || find(wrapper, "current_item_large_field_value");
    if (!valueControl) continue;
    valueControl.type = field.controlType || "dynamic-field";
    valueControl.name = field.displayName;
    valueControl.title = field.displayName;
    valueControl.label = field.displayName;
    valueControl.FieldName = field.fieldName;
    valueControl.field = field.fieldName;
    valueControl.attrs = {
      ...(valueControl.attrs || {}),
      field: field.fieldName,
      fieldName: field.fieldName,
      data: {
        ...(valueControl.attrs?.data || {}),
        list: { AppID: 41, ListSetID: APP_ID, ListID: LIST_ID, Type: 1, Title: "Support Tickets" },
        field: field.fieldName,
        fieldName: field.fieldName,
      },
    };
  }
}

function ensureSectionContent(resource) {
  for (const slot of findAll(resource, "section_content_area")) {
    if (!hasBusinessContent(slot)) {
      slot.children = [{
        type: "collection",
        name: "Related records",
        attrs: {
          dashboardDatasetTemplateId: "collection_control_grid_table",
          data: { list: { AppID: 41, ListSetID: APP_ID, ListID: LIST_ID, Type: 1, Title: "Support Tickets" } },
        },
      }];
    }
  }
}

function ensureChartSections(resource, count = 1) {
  for (const chartSection of findAll(resource, "chart_cards_section")) {
    chartSection.children = [];
    for (let index = 0; index < count; index += 1) {
      chartSection.children.push({
        id: `chart-${index + 1}`,
        type: index % 2 === 0 ? "pie-chart" : "bar-chart",
        name: `Workspace Analytics ${index + 1}`,
        runtimeModelProven: true,
        attrs: {
          runtimeModelProven: true,
          dataAnalyticsTemplateId: index % 2 === 0 ? "data_analytics_pie_chart_with_title" : "data_analytics_bar_chart_with_title",
        },
      });
    }
  }
}

function hasBusinessContent(node) {
  let found = false;
  visit(node, (current) => {
    if (current === node) return;
    const type = String(current?.type || "").toLowerCase();
    if (["collection", "data-list", "summary", "pie-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user"].includes(type)) found = true;
  });
  return found;
}

function decoded(resource) {
  return {
    ListSet: { ListID: APP_ID, Title: "Service Desk Workspace Test" },
    Pages: [{ Type: 103, Title: "Service Desk Workspace", LayoutID: "dashboard-layout-workspace", LayoutInResources: [{ ID: "dashboard-layout-workspace", RefId: "dashboard-layout-workspace", Resource: JSON.stringify(resource) }] }],
    Childs: [{ List: { ListID: LIST_ID, Title: "Support Tickets" }, Fields: [
      { FieldName: "Title", DisplayName: "Title" },
      { FieldName: "ListDataID", DisplayName: "Record ID" },
      { FieldName: "TicketNumber", DisplayName: "Ticket Number" },
      { FieldName: "Status", DisplayName: "Status" },
      { FieldName: "Category", DisplayName: "Category" },
      { FieldName: "Priority", DisplayName: "Priority" },
      { FieldName: "Description", DisplayName: "Description" },
      { FieldName: "ImpactLevel", DisplayName: "Impact Level" },
      { FieldName: "AssignedTo", DisplayName: "Assigned To" },
      { FieldName: "CreatedTime", DisplayName: "Created Time" },
    ] }],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
    Workflows: [],
    Navigation: [{ ID: "nav", Title: "Workspace" }],
    IconUrl: "{\"b\":\"#0f766e\",\"i\":\"fa-solid fa-headset\",\"c\":\"#ffffff\"}",
    Roles: [],
    Permissions: [],
  };
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function writeJson(dir, name, data) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
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

function removeFirstByIdentity(node, id) {
  if (!node || typeof node !== "object" || !Array.isArray(node.children)) return null;
  const index = node.children.findIndex((child) => ids(child).includes(id));
  if (index !== -1) return node.children.splice(index, 1)[0];
  for (const child of node.children) {
    const removed = removeFirstByIdentity(child, id);
    if (removed) return removed;
  }
  return null;
}

function visibleText(node) {
  return [
    node?.attrs?.headc?.title?.value,
    node?.attrs?.title?.value,
    node?.title,
    node?.name,
    node?.label,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function removeOperations(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.children)) {
    node.children = node.children.filter((child) => !ids(child).some((id) => /^(?:Operations|current_item_.*operations|right_panel_.*operations)$/i.test(id)));
    node.children.forEach(removeOperations);
  }
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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-master-detail-workspace-layout-"));
try {
  expectPass("registry includes master-detail workspace Dashboard templates", ["--registry", "docs/reference/dashboard-page-layout-templates.json"]);

  for (const templateId of TEMPLATE_IDS) {
    const missingEditSlotRegistry = registry();
    removeFirstByIdentity(missingEditSlotRegistry.templates.find((entry) => entry.id === templateId).template.parsedResource, "current_item_main_header_edit_item_button");
    expectCode(`${templateId} registry template without edit slot fails`, ["--registry", writeJson(tempDir, `${templateId}-registry-missing-edit-slot`, missingEditSlotRegistry)], "DASH_LAYOUT_TEMPLATE_CURRENT_ITEM_MAIN_HEADER_EDIT_BUTTON_MISSING");

    const missingDeleteSlotRegistry = registry();
    removeFirstByIdentity(missingDeleteSlotRegistry.templates.find((entry) => entry.id === templateId).template.parsedResource, "current_item_main_header_delete_item_button");
    expectCode(`${templateId} registry template without delete slot fails`, ["--registry", writeJson(tempDir, `${templateId}-registry-missing-delete-slot`, missingDeleteSlotRegistry)], "DASH_LAYOUT_TEMPLATE_CURRENT_ITEM_MAIN_HEADER_DELETE_BUTTON_MISSING");

    const valid = workspaceTemplate(templateId);
    expectPass(`${templateId} generated package preserves master-detail shell`, ["--package", writePackage(tempDir, `${templateId}-valid`, decoded(valid))]);

    const badLeftPanelWidth = workspaceTemplate(templateId);
    find(badLeftPanelWidth, "left_panel").attrs.style.width = [null, 620];
    expectCode(`${templateId} left_panel 620px width fails`, ["--package", writePackage(tempDir, `${templateId}-left-panel-width-620`, decoded(badLeftPanelWidth))], "DASH_LAYOUT_RESOURCE_LEFT_PANEL_WIDTH_INVALID");

    const missingCaptionIcon = workspaceTemplate(templateId);
    removeFirstByIdentity(missingCaptionIcon, "left_panel_caption_icon_wrapper");
    expectCode(`${templateId} without left_panel_caption_icon_wrapper fails`, ["--package", writePackage(tempDir, `${templateId}-missing-caption-icon`, decoded(missingCaptionIcon))], "DASH_LAYOUT_RESOURCE_LEFT_PANEL_CAPTION_ICON_WRAPPER_MISSING");

    const misplacedSidebar = workspaceTemplate(templateId);
    const sidebar = removeFirstByIdentity(misplacedSidebar, "left_panel_sidebar");
    find(misplacedSidebar, "left_panel_caption_title_wrapper").children.unshift(sidebar);
    expectCode(`${templateId} sidebar under left caption title wrapper fails`, ["--package", writePackage(tempDir, `${templateId}-sidebar-caption-placement`, decoded(misplacedSidebar))], "DASH_LAYOUT_RESOURCE_LEFT_PANEL_SIDEBAR_PLACEMENT_INVALID");

    const unresolvedAction = workspaceTemplate(templateId);
    const titleHeader = find(unresolvedAction, "page_title_header");
    titleHeader.children = titleHeader.children || [];
    titleHeader.children.push({ type: "container", nv_label: "bad_operation_button", attrs: { control_action: "missing_action" }, children: [] });
    expectCode(`${templateId} unresolved page control action fails`, ["--package", writePackage(tempDir, `${templateId}-unresolved-action`, decoded(unresolvedAction))], "DASH_LAYOUT_RESOURCE_CONTROL_ACTION_UNRESOLVED");

    const visualOnlyCurrentOperations = workspaceTemplate(templateId);
    const headerRight = find(visualOnlyCurrentOperations, "current_item_main_header_right");
    headerRight.children = headerRight.children || [];
    headerRight.children.push({
      type: "container",
      nv_label: "current_item_main_header_operations",
      children: [{ type: "container", nv_label: "current_item_main_header_edit_item_button", children: [] }],
    });
    expectCode(`${templateId} current item operation container without action fails`, ["--package", writePackage(tempDir, `${templateId}-visual-only-current-ops`, decoded(visualOnlyCurrentOperations))], "DASH_LAYOUT_OPERATIONS_WITHOUT_ACTIONS");

    const badFilterField = workspaceTemplate(templateId);
    const statusFilter = findAll(badFilterField, "left_panel_filter_control").find((filter) => /status/i.test(JSON.stringify(filter)));
    statusFilter.attrs.data.field = "Priority";
    statusFilter.attrs.display_f = "Priority";
    statusFilter.attrs.value_f = "Priority";
    expectCode(`${templateId} left panel Status filter bound to Priority fails`, ["--package", writePackage(tempDir, `${templateId}-bad-filter-field`, decoded(badFilterField))], "DASH_LAYOUT_MASTER_DETAIL_FILTER_FIELD_MISMATCH");

    const missingTempVar = workspaceTemplate(templateId);
    missingTempVar.tempVars = missingTempVar.tempVars.filter((entry) => entry?.id !== "vCurrentItemID" && entry?.id !== "__temp_vCurrentItemID");
    expectCode(`${templateId} without vCurrentItemID fails`, ["--package", writePackage(tempDir, `${templateId}-missing-tempvar`, decoded(missingTempVar))], "DASH_LAYOUT_RESOURCE_CURRENT_ITEM_TEMPVAR_MISSING");

    const noLimit = workspaceTemplate(templateId);
    find(noLimit, "current_item_wrapper").attrs.data.limit = false;
    expectCode(`${templateId} detail Collection without limit fails`, ["--package", writePackage(tempDir, `${templateId}-no-limit`, decoded(noLimit))], "DASH_LAYOUT_RESOURCE_CURRENT_ITEM_LIMIT_MISSING");

    const noSelectionFilter = workspaceTemplate(templateId);
    find(noSelectionFilter, "current_item_wrapper").attrs.data.filter = [];
    expectCode(`${templateId} detail Collection without vCurrentItemID filter fails`, ["--package", writePackage(tempDir, `${templateId}-no-current-filter`, decoded(noSelectionFilter))], "DASH_LAYOUT_RESOURCE_CURRENT_ITEM_FILTER_MISSING");
  }

  const emptyChart = workspaceTemplate("dashboard-page-layouts-two-panel-workspace");
  find(emptyChart, "chart_cards_section").children = [];
  expectCode("empty chart_cards_section fails for master-detail workspace", ["--package", writePackage(tempDir, "empty-chart-section", decoded(emptyChart))], "DASH_LAYOUT_EMPTY_CHART_CARDS_SECTION");

  const tooManyCharts = workspaceTemplate("dashboard-page-layouts-three-panel-workspace");
  ensureChartSections(tooManyCharts, 4);
  expectCode("too many analytics in chart_cards_section fails for master-detail workspace", ["--package", writePackage(tempDir, "too-many-charts", decoded(tooManyCharts))], "DASH_LAYOUT_CHART_CARDS_SECTION_TOO_MANY_ANALYTICS");

  console.log(JSON.stringify({ status: "pass", templates: TEMPLATE_IDS.length, cases: 22 }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
