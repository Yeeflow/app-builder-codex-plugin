#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIST_SET_ID = "1908351910552752128";
const INSTALL_OPERATION_ID = "1908351910552752999";
const LIST_ID = "1908351910552753001";
const SUMMARY_ID = "43c38762-5133-430f-af09-faeec1be3bc0";
const SAVE_VAR = { id: "openRequests", name: "openRequests" };

function style(widthtype = [null, "2"]) {
  return {
    direction: [null, "row"],
    gap: [null, 12],
    widthtype,
    align_items: [null, "center"],
    justify_content: [null, "space-between"],
    background: "#FFFFFF",
    border: { color: "#E7E9EB", width: 1, radius: [null, 8] },
    padding: [null, { top: 12, right: 12, bottom: 12, left: 12 }],
    radius: [null, 8],
  };
}

function field(FieldName, FieldType, Type, FieldID = FieldName) {
  return { FieldID, FieldName, InternalName: FieldName, DisplayName: FieldName, FieldType, Type };
}

function filterControl(patch = {}) {
  return {
    type: "select-filter",
    name: "Priority Filter",
    attrs: {
      data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" }, field: "Text1", filter: [] },
      display_f: "Text1",
      value_f: "ListDataID",
      lablay: [null, "top"],
      lab: { ty: [null, "xs-light"] },
      common: { positioning: { widthtype: [null, "3"], width: [null, 200], widthu: [null, "px"] } },
      edit: { placeholder: { color: "#5f6b7a" }, pcolor: "var(--c--neutral-dark-hover)", normal: { border: { radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } } },
      ...patch,
    },
  };
}

function summaryControl(patch = {}) {
  return {
    type: "summary",
    id: SUMMARY_ID,
    name: "Summary - Open Requests",
    runtimeModelProven: true,
    attrs: {
      data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" } },
      save_var: SAVE_VAR,
      ...patch,
    },
  };
}

function visibleKpiText(variable = SAVE_VAR) {
  return {
    type: "heading",
    name: "Open Requests Value",
    label: "Text",
    attrs: { headc: { title: { variable: [variable] } }, heads: { ty: [null, "h2-bold"], color: "#071638" }, style: { width: "auto" } },
  };
}

function kpiCard(mode = "valid", variable = SAVE_VAR) {
  const iconContainer = {
    type: "container",
    name: "KPI Icon Container",
    attrs: {
      style: { ...style([null, "3"]), width: [null, 48], cushei: [null, 48], justify_content: [null, "center"], align_items: [null, "center"], background: "#E6F0FF", color: "#0065FF", padding: [null, 12], radius: [null, 8] },
    },
    children: mode === "text-icon"
      ? [{ type: "heading", name: "Icon Text", attrs: { headc: { title: { value: "fa-solid fa-clock" } }, heads: { ty: [null, "h5"], color: "#0065FF" } } }]
      : mode === "no-icon"
        ? []
        : [{ type: "icon", name: "Open Requests Icon", attrs: { icon: { icon: "fa-solid fa-clock", size: [null, 24] } } }],
  };
  return {
    type: "container",
    name: "KPI Card - Open Requests",
    width: "full",
    attrs: { style: style([null, "1"]) },
    children: [iconContainer, visibleKpiText(variable)],
  };
}

function registryReferenceRoot() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-golden-references.json"), "utf8"));
  return JSON.parse(JSON.stringify(registry.references[0].exportShape._ak_c));
}

function dashboardV11TemplateRoot() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json"), "utf8"));
  const template = (registry.templates || []).find((entry) => entry.id === "dashboard-page-layouts-v1.1") || registry.templates?.[0];
  return JSON.parse(JSON.stringify(template.template.parsedResource));
}

function ids(node) {
  return [node?.id, node?.name, node?.nv_label, node?.nav_label, node?.derivedFromDashboardPageLayoutTemplate, node?.derivedFromGoldenReference, node?.attrs?.id, node?.attrs?.name, node?.attrs?.nv_label, node?.attrs?.nav_label, node?.attrs?.derivedFromDashboardPageLayoutTemplate, node?.attrs?.derivedFromGoldenReference].filter(Boolean).map(String);
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

function bindAllKpiValueControls(root, variable) {
  for (const key of ["planned_events", "approved_budget", "registration_rate", "lead_follow_up"]) {
    const value = find(root, `event_portfolio_kpi_${key}_value`);
    if (!value) continue;
    value.attrs = value.attrs || {};
    value.attrs.headc = { ...(value.attrs.headc || {}), title: { variable: [variable] } };
    value.attrs.heads = { ty: [null, "h2-bold"], color: "#071638" };
  }
}

function domainString(value) {
  const replacements = new Map([
    ["Event", "Request"],
    ["Stage", "Priority"],
    ["Region", "Location"],
    ["Registration", "Completion"],
    ["Budget", "Cost"],
    ["Events", "Maintenance Requests"],
    ["Event Type", "Request Type"],
  ]);
  return replacements.get(value) || value
    .replaceAll("Event Portfolio", "Facility Operations")
    .replaceAll("Campaign", "Readiness")
    .replaceAll("campaign", "readiness");
}

function adaptReferenceDomain(root) {
  const rewrite = (current) => {
    if (Array.isArray(current)) return current.forEach(rewrite);
    if (!current || typeof current !== "object") return;
    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "string" && !["id", "key", "nv_label", "nav_label", "binding", "derivedFromGoldenReference", "goldenReferenceId"].includes(key)) current[key] = domainString(value);
      else rewrite(value);
    }
    if (current?.attrs?.data?.list) {
      current.attrs.data.list = { ListID: LIST_ID, Title: "Maintenance Requests" };
      current.attrs.data.filter = current.attrs.data.filter || [];
    }
  };
  rewrite(root);
}

function normalizeContainers(root) {
  visit(root, (node) => {
    if (node.type !== "container") return;
    node.attrs = node.attrs || {};
    node.attrs.style = { ...style([null, "1"]), ...(node.attrs.style || {}) };
    if (!Array.isArray(node.attrs.style.widthtype)) node.attrs.style.widthtype = [null, "1"];
  });
  const main = find(root, "Main");
  const content = find(root, "Content");
  for (const node of [main, content].filter(Boolean)) {
    node.attrs = node.attrs || {};
    node.attrs.style = { ...style([null, "1"]), ...(node.attrs.style || {}), direction: [null, "column"], background: "#f4f7fb" };
    delete node.attrs.style.padding;
  }
}

function removeOperations(root) {
  const prune = (node) => {
    if (!node || typeof node !== "object" || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => !ids(child).includes("Operations"));
    node.children.forEach(prune);
  };
  prune(root);
}

function firstSummary(root) {
  let summary = null;
  visit(root, (node) => {
    if (!summary && node.type === "summary") summary = node;
  });
  return summary;
}

function pageResource(flags = {}) {
  const root = dashboardV11TemplateRoot();
  root.derivedFromDashboardPageLayoutTemplate = "dashboard-page-layouts-v1.1";
  root.derivedFromGoldenReference = "event_portfolio_dashboard_golden_reference";
  root.goldenReferenceId = "event_portfolio_dashboard_golden_reference";
  adaptReferenceDomain(root);
  normalizeContainers(root);
  removeOperations(root);
  const summary = firstSummary(root) || summaryControl(flags.summaryPatch || {});
  Object.assign(summary, summaryControl(flags.summaryPatch || {}));
  const businessSection = findBusinessSectionContentArea(root);
  const filter = find(root, "event_portfolio_region_filter") || find(root, "event_portfolio_pipeline_status_filter");
  if (filter) Object.assign(filter.attrs, { data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" }, field: "Text1", filter: [] }, display_f: "Text1", value_f: "ListDataID", lablay: [null, "top"], lab: { value: "Priority", ty: [null, "xs-light"] }, placeholder: "Select priority...", common: { positioning: { widthtype: [null, "3"], width: [null, 200], widthu: [null, "px"] } }, edit: { placeholder: { color: "#5f6b7a" }, pcolor: "var(--c--neutral-dark-hover)", normal: { border: { radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } } }, ...(flags.filterPatch || {}) });
  const filterTokens = [];
  visit(root, (node) => {
    if (!["select-filter", "radio-filter", "checkbox-filter"].includes(node.type)) return;
    node.attrs = {
      ...(node.attrs || {}),
      data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" }, field: "Text1", filter: [] },
      display_f: "Text1",
      value_f: "ListDataID",
      lablay: [null, "top"],
      lab: { value: "Priority", ty: [null, "xs-light"] },
      placeholder: "Select priority...",
      common: { positioning: { widthtype: [null, "3"], width: [null, 200], widthu: [null, "px"] } },
      edit: { placeholder: { color: "#5f6b7a" }, pcolor: "var(--c--neutral-dark-hover)", normal: { border: { radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } } },
    };
    filterTokens.push(node.binding, "Text1", "ListDataID");
  });
  visit(root, (node) => {
    if (node.type !== "collection") return;
    const identity = ids(node).join(" ");
    const inferredTemplate = /event_pipeline|Facility Work Queue Grid/i.test(identity)
      ? "Event Pipeline Grid-Table"
      : "collection_control_grid_table";
    node.attrs = {
      ...(node.attrs || {}),
      datasetPresentationTemplateId: node?.attrs?.datasetPresentationTemplateId || inferredTemplate,
    };
  });
  if (filter) Object.assign(filter.attrs, flags.filterPatch || {});
  const kpiRow = find(root, "event_portfolio_kpi_row") || find(root, "kpi_cards_kpi_row");
  if (kpiRow) kpiRow.children = [kpiCard(flags.kpiMode || "valid", flags.visibleVariable === false ? { id: "otherVar", name: "otherVar" } : SAVE_VAR)];
  const columns = [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  businessSection.children = [
    summary,
    {
      type: "flex_grid",
      id: "event_pipeline_grid_table_header_grid",
      name: "event_pipeline_grid_table_header_grid",
      displayLabel: [null, false],
      attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } }, common: { hide: [null, false, false, true] } },
      children: ["Request", "Priority", "Owner", "Status"].map((label) => ({ type: "heading", name: label, attrs: { headc: { title: { value: label } }, heads: { ty: [null, "caption-medium"] } } })),
    },
    {
      type: "collection",
      name: "Facility Work Queue Grid",
      nv_label: "event_pipeline_grid_table_collection",
      derivedFromGoldenReference: "Event Pipeline Grid-Table",
      attrs: {
        datasetPresentationTemplateId: "Event Pipeline Grid-Table",
        data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" } },
        filterBindings: filterTokens.filter(Boolean),
      },
      children: [
        {
          type: "flex_grid",
          id: "event_pipeline_grid_table_item_grid",
          name: "event_pipeline_grid_table_item_grid",
          displayLabel: [null, false],
          attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } } },
          children: [
            { type: "dynamic-field", name: "Request Title", attrs: { source: "3", "obj-f": "Title" } },
            { type: "dynamic-field", name: "Priority", attrs: { source: "3", "obj-f": "Text1" } },
            { type: "dynamic-user", name: "Owner", attrs: { source: "3", "obj-f": "User1" } },
            { type: "dynamic-field", name: "Status", attrs: { source: "3", "obj-f": "Text2" } },
          ],
        },
      ],
    },
  ];
  if (flags.mainStyle) find(root, "Main").attrs.style = flags.mainStyle;
  const extValues = flags.extValues === undefined
    ? [{ fieldName: "ListDataID", func: "COUNT", id: "ListDataID" }]
    : flags.extValues;
  return Object.assign(root, {
    title: "Facility Operations Dashboard",
    ver: "1.0.0",
    derivedFromDashboardPageLayoutTemplate: "dashboard-page-layouts-v1.1",
    attrs: {
      hideHeaderAll: true,
      container: { padding: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
      background: { type: "classic", classic: { color: "#f4f7fb" } },
    },
    ReportIds: flags.reportIds === undefined ? [SUMMARY_ID] : flags.reportIds,
    tempVars: flags.tempVars === undefined ? [SAVE_VAR] : flags.tempVars,
    exts: flags.exts === undefined ? [{ i: SUMMARY_ID, category: "___Pivot___", key: "summary", attr: { ListID: LIST_ID, settings: { values: extValues } } }] : flags.exts,
    filterVars: [],
    actions: [],
    derivedFromGoldenReference: "event_portfolio_dashboard_golden_reference",
    plannedRegions: { filters: true, kpis: true, gridTable: true },
  });
}

function findBusinessSectionContentArea(root) {
  let found = null;
  visitWithAncestors(root, [], (node, ancestors) => {
    if (found || !ids(node).includes("section_content_area")) return;
    if (ancestors.some((ancestor) => ids(ancestor).includes("page_title_section"))) return;
    found = node;
  });
  assert.ok(found, "Expected v1.1 template to contain a business section_content_area.");
  return found;
}

function visitWithAncestors(node, ancestors, fn) {
  if (!node || typeof node !== "object") return;
  fn(node, ancestors);
  for (const child of node.children || []) visitWithAncestors(child, [...ancestors, node], fn);
}

function decoded(flags = {}) {
  return decodedWithResource(validV11Resource(flags));
}

function decodedWithResource(resource) {
  return {
    ListSet: { ListID: LIST_SET_ID, Title: "Facility Maintenance" },
    Pages: [{ Type: 103, Title: "Facility Operations Dashboard", LayoutID: "dashboard-layout", LayoutInResources: [{ ID: "dashboard-layout", RefId: "dashboard-layout", Resource: JSON.stringify(resource) }] }],
    Childs: [{
      List: { ListID: LIST_ID, Title: "Maintenance Requests" },
      Fields: [
        field("ListDataID", "Text", "input"),
        field("Title", "Text", "input"),
        field("Text1", "Text", "select"),
        field("Decimal1", "Decimal", "input_number", "field-decimal-1"),
      ],
      Layouts: [],
    }],
  };
}

function validV11Resource(flags = {}) {
  const root = dashboardV11TemplateRoot();
  root.derivedFromDashboardPageLayoutTemplate = "dashboard-page-layouts-v1.1";
  root.derivedFromGoldenReference = "event_portfolio_dashboard_golden_reference";
  root.goldenReferenceId = "event_portfolio_dashboard_golden_reference";
  const extValues = flags.extValues === undefined
    ? [{ fieldName: "ListDataID", func: "COUNT", id: "ListDataID" }]
    : flags.extValues;
  root.ReportIds = flags.reportIds === undefined ? [SUMMARY_ID] : flags.reportIds;
  root.tempVars = flags.tempVars === undefined ? [SAVE_VAR] : flags.tempVars;
  root.exts = flags.exts === undefined ? [{ i: SUMMARY_ID, category: "___Pivot___", key: "summary", attr: { ListID: LIST_ID, settings: { values: extValues } } }] : flags.exts;
  root.filterVars = [{ id: "priorityFilter", name: "priorityFilter", field: "Text1" }];
  root.actions = [];
  root.plannedRegions = { filters: true, kpis: true, gridTable: true };
  removeOperations(root);
  const businessSection = findBusinessSectionContentArea(root);
  businessSection.children = [eventPortfolioFilterGroup(flags.filterPatch || {}), summaryControl(flags.summaryPatch || {}), eventPipelineGridTableRegion()];
  const kpiWrapper = find(root, "kpi_metrics_wrapper") || find(root, "kpi_cards_wrapper");
  if (kpiWrapper) {
    kpiWrapper.derivedFromGoldenReference = "event_portfolio_kpi_row";
    kpiWrapper.width = "full";
  }
  const visibleVariable = flags.visibleVariable === false
    ? { id: "otherVar", name: "otherVar" }
    : (typeof flags.visibleVariable === "object" && flags.visibleVariable ? flags.visibleVariable : SAVE_VAR);
  bindAllKpiValueControls(root, visibleVariable);
  applyKpiMode(root, flags.kpiMode || "valid");
  const filter = find(root, "event_portfolio_pipeline_status_filter") || find(root, "event_portfolio_region_filter");
  if (filter) setNearestContainerReference(root, filter, "event_portfolio_filter_group");
  if (filter) {
    filter.attrs = {
      ...(filter.attrs || {}),
      data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" }, field: "Text1", filter: [] },
      display_f: "Text1",
      value_f: "ListDataID",
      lablay: [null, "top"],
      lab: { value: "Priority", ty: [null, "xs-light"] },
      placeholder: "Select priority...",
      common: { positioning: { widthtype: [null, "3"], width: [null, 200], widthu: [null, "px"] } },
      edit: { placeholder: { color: "#5f6b7a" }, pcolor: "var(--c--neutral-dark-hover)", normal: { border: { radius: [null, { top: 8, right: 8, bottom: 8, left: 8 }] } } },
      ...(flags.filterPatch || {}),
    };
  }
  const main = find(root, "Main") || find(root, "main");
  if (flags.mainStyle && main) main.attrs.style = flags.mainStyle;
  return root;
}

function applyKpiMode(root, mode) {
  if (mode === "valid") return;
  const iconBlock = find(root, "event_portfolio_kpi_planned_events_icon_block");
  if (!iconBlock) return;
  if (mode === "no-icon") {
    iconBlock.children = [];
    return;
  }
  if (mode === "text-icon") {
    iconBlock.children = [{ type: "heading", name: "Icon Text", attrs: { headc: { title: { value: "fa-solid fa-clock" } }, heads: { ty: [null, "h5"], color: "#0065FF" } } }];
  }
}

function eventPipelineGridTableRegion() {
  const columns = [[2, "fr"], [1, "fr"], [1, "fr"], [1, "fr"]];
  return {
    type: "container",
    id: "Event Pipeline Grid-Table",
    name: "Event Pipeline Grid-Table",
    width: "full",
    derivedFromGoldenReference: "Event Pipeline Grid-Table",
    attrs: { style: { widthtype: [null, "1"], direction: [null, "column"], gap: [null, 8], align_items: [null, "stretch"], justify_content: [null, "flex-start"] } },
    children: [
      {
        type: "flex_grid",
        id: "event_pipeline_grid_table_header_grid",
        name: "event_pipeline_grid_table_header_grid",
        displayLabel: [null, false],
        attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } }, common: { hide: [null, false, false, true] } },
        children: ["Request", "Priority", "Owner", "Status"].map((label) => ({ type: "heading", name: label, attrs: { headc: { title: { value: label } }, heads: { ty: [null, "caption-medium"] } } })),
      },
      {
        type: "collection",
        name: "Facility Work Queue Grid",
        nv_label: "event_pipeline_grid_table_collection",
        attrs: {
          datasetPresentationTemplateId: "Event Pipeline Grid-Table",
          data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" } },
          filterBindings: ["Text1", "ListDataID"],
        },
        children: [
          {
            type: "flex_grid",
            id: "event_pipeline_grid_table_item_grid",
            name: "event_pipeline_grid_table_item_grid",
            displayLabel: [null, false],
            attrs: { columns: { "1": { list: columns }, "3": { list: [[1, "fr"]] } }, rows: { "1": { list: [[1, "fr"]] } } },
            children: [
              { type: "dynamic-field", name: "Request Title", attrs: { source: "3", "obj-f": "Title" } },
              { type: "dynamic-field", name: "Priority", attrs: { source: "3", "obj-f": "Text1" } },
              { type: "dynamic-user", name: "Owner", attrs: { source: "3", "obj-f": "User1" } },
              { type: "dynamic-field", name: "Status", attrs: { source: "3", "obj-f": "Text2" } },
            ],
          },
        ],
      },
    ],
  };
}

function eventPortfolioFilterGroup(filterPatch = {}) {
  return {
    type: "container",
    id: "event_portfolio_filter_group",
    name: "event_portfolio_filter_group",
    width: "full",
    derivedFromGoldenReference: "event_portfolio_filter_group",
    attrs: { style: { widthtype: [null, "1"], direction: [null, "row"], gap: [null, 12], align_items: [null, "center"], justify_content: [null, "flex-start"] } },
    children: [filterControl({ filterVar: "priorityFilter", lab: { value: "Priority", ty: [null, "xs-light"] }, placeholder: "Select priority...", ...filterPatch })],
  };
}

function setNearestContainerReference(root, target, referenceId) {
  let best = null;
  visitWithAncestors(root, [], (node, ancestors) => {
    if (node !== target) return;
    best = [...ancestors].reverse().find((ancestor) => ancestor?.type === "container" && !["Main", "Content"].some((id) => ids(ancestor).includes(id)));
  });
  if (best) {
    best.derivedFromGoldenReference = referenceId;
    best.width = "full";
  }
}

function decodedShellDashboard() {
  return {
    ListSet: { ListID: LIST_SET_ID, Title: "Facility Maintenance", LayoutView: JSON.stringify({ sort: [] }) },
    Pages: [{
      Type: 103,
      Title: "Facility Operations Dashboard",
      LayoutID: "dashboard-layout",
      LayoutInResources: [{
        ID: "dashboard-layout",
        RefId: "dashboard-layout",
        Resource: JSON.stringify({
          type: "page",
          children: [{
            type: "container",
            name: "Main",
            attrs: { style: style([null, "2"]) },
            children: [{ type: "container", name: "Content", attrs: { style: style([null, "2"]) }, children: [] }],
          }],
        }),
      }],
    }],
    Childs: [],
    Forms: [],
    FormNewReports: [],
    DataReports: [],
  };
}

function appPlanWithDashboard() {
  return `# Facility Maintenance - Yeeflow App Plan

## 14. Dashboard Pages Plan
### 14.1 Facility Operations Dashboard
- Page name: Facility Operations Dashboard

#### Dashboard Sections
| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | KPI strip | Monitor open work | Maintenance Requests | Open Requests | Summary / KPI card | KPI card gives operators a count | Open filtered list | validator-backed |
| 2 | Work queue | Review requests | Maintenance Requests | Title, Priority, Status | Collection | Work queue card region is required | Open detail | validator-backed |

#### Dashboard Filters
| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Priority Filter | Maintenance Requests | Priority | KPI strip, Work queue | Data Filter | Active work | validator-backed |

#### Summary Metrics
| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| Open Requests | Maintenance Requests | ListDataID | Count open records | Summary / KPI card | count | validator-backed |

#### Record Display Control Selection
| Section | Data Source | Display Need | Selected Record Display Control | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Work queue | Maintenance Requests | Request cards | Collection | Portfolio queue display | Open detail | validator-backed |
`;
}

function writePackage(dir, name, data) {
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify({ Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(data), "utf8")).toString("base64") })}\n`);
  return file;
}

function writeReport(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof body === "string" ? body : `${JSON.stringify(body, null, 2)}\n`);
  return file;
}

function writeText(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function expectPass(label, args) {
  const result = run(["scripts/validate-dashboard-generation-hard-gates.mjs", ...args]);
  assert.equal(result.status, 0, `${label} should pass.\n${result.stdout}\n${result.stderr}`);
}

function expectCode(label, args, code) {
  const result = run(["scripts/validate-dashboard-generation-hard-gates.mjs", ...args]);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${label} should fail.`);
  assert.match(output, new RegExp(code), `${label} did not report ${code}.\n${output}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-generation-hard-gates-"));

try {
  const valid = writePackage(tempDir, "valid", decodedWithResource(validV11Resource()));
  expectPass("complete dashboard generation hard gates", ["--package", valid]);

  expectCode(
    "plan-aware dashboard hard gate rejects shell-only dashboard",
    ["--package", writePackage(tempDir, "shell-dashboard", decodedShellDashboard()), "--plan", writeText(tempDir, "app-plan.md", appPlanWithDashboard())],
    "GENERATED_FINAL_DASHBOARD_SHELL_ONLY",
  );

  expectCode("filter has data field but no display_f", ["--package", writePackage(tempDir, "filter-no-display", decoded({ filterPatch: { display_f: "" } }))], "DASH_FILTER_DISPLAY_FIELD_MISSING");
  expectCode("filter has no value_f", ["--package", writePackage(tempDir, "filter-no-value", decoded({ filterPatch: { value_f: "" } }))], "DASH_FILTER_VALUE_FIELD_MISSING");
  expectCode("filter copied without app-specific attrs.data.field fails", ["--package", writePackage(tempDir, "filter-no-field", decoded({ filterPatch: { data: { list: { ListID: LIST_ID, Title: "Maintenance Requests" }, filter: [] } } }))], "DASH_FILTER_FIELD_UNRESOLVED|DASH_GOLDEN_RESOURCE_FILTER_DATA_FIELD_MISSING|DASH_LAYOUT_DATA_FILTER_FIELD_MISSING");
  expectCode("filter lacks label/dropdown style metadata", ["--package", writePackage(tempDir, "filter-no-style", decoded({ filterPatch: { lablay: undefined, lab: {}, edit: {} } }))], "DASH_FILTER_LABEL_LAYOUT_MISSING|DASH_FILTER_PLACEHOLDER_COLOR_MISSING|DASH_FILTER_RADIUS_MISSING");

  const adHocRootFilterGroup = validV11Resource();
  find(adHocRootFilterGroup, "Content").children.push(eventPortfolioFilterGroup());
  expectCode("Event Portfolio filter group copied directly under v1.1 Content fails", ["--package", writePackage(tempDir, "root-filter-group", decodedWithResource(adHocRootFilterGroup))], "DASH_GOLDEN_COMPETING_ROOT_SHELL|DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT");

  const inventedRootFilterModule = validV11Resource();
  find(inventedRootFilterModule, "Content").children.push({
    type: "container",
    name: "asset_loan_filter_bar",
    attrs: { style: { widthtype: [null, "1"], direction: [null, "row"], gap: [null, 12], align_items: [null, "center"], justify_content: [null, "flex-start"] } },
    children: [filterControl({ binding: "priorityFilter", placeholder: "Select priority...", lab: { value: "Priority", ty: [null, "xs-light"] } })],
  });
  expectCode("invented ad hoc filter layout module under root Content fails", ["--package", writePackage(tempDir, "invented-root-filter", decodedWithResource(inventedRootFilterModule))], "DASH_LAYOUT_INVENTED_LAYOUT_MODULE|DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT");

  const obsoleteContentPadding = validV11Resource();
  const obsoleteContent = find(obsoleteContentPadding, "Content");
  obsoleteContent.attrs = obsoleteContent.attrs || {};
  obsoleteContent.attrs.container = { ...(obsoleteContent.attrs.container || {}), padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] };
  obsoleteContent.attrs.common = { ...(obsoleteContent.attrs.common || {}), padding: [null, { top: 0, right: 0, bottom: 0, left: 0 }] };
  expectCode("obsolete forced-zero v1.1 Content padding fails", ["--package", writePackage(tempDir, "obsolete-content-padding", decodedWithResource(obsoleteContentPadding))], "DASH_LAYOUT_RESOURCE_CONTENT_PADDING_MISMATCH");

  expectCode("container raw widthtype string fails", ["--package", writePackage(tempDir, "container-raw-width", decoded({ mainStyle: { ...style("full") } }))], "DASH_CONTAINER_WIDTHTYPE_RAW_STRING");
  expectCode("container missing layout keys fails", ["--package", writePackage(tempDir, "container-missing-layout", decoded({ mainStyle: { widthtype: [null, "2"] } }))], "DASH_CONTAINER_DIRECTION_MISSING|DASH_CONTAINER_GAP_MISSING|DASH_CONTAINER_ALIGN_ITEMS_MISSING|DASH_CONTAINER_JUSTIFY_CONTENT_MISSING");

  expectCode("KPI icon implemented as Heading/Text fails", ["--package", writePackage(tempDir, "kpi-text-icon", decoded({ kpiMode: "text-icon" }))], "DASH_KPI_ICON_TEXT_PLACEHOLDER_FORBIDDEN");
  expectCode("KPI card without native icon fails", ["--package", writePackage(tempDir, "kpi-no-icon", decoded({ kpiMode: "no-icon" }))], "DASH_KPI_NATIVE_ICON_MISSING");

  expectCode("summary save_var without ext field selection fails", ["--package", writePackage(tempDir, "summary-no-ext", decoded({ exts: [] }))], "DASH_SUMMARY_EXT_MISSING");
  expectCode("COUNT does not select ListDataID fails", ["--package", writePackage(tempDir, "summary-bad-count", decoded({ extValues: [{ fieldName: "Title", func: "COUNT", id: "Title" }] }))], "DASH_SUMMARY_COUNT_FIELD_INVALID");
  expectCode("AVG does not select numeric field fails", ["--package", writePackage(tempDir, "summary-bad-avg", decoded({ extValues: [{ fieldName: "Text1", func: "AVG", id: "Text1" }] }))], "DASH_SUMMARY_NUMERIC_FIELD_INVALID");
  expectCode("visible KPI text variable mismatch fails", ["--package", writePackage(tempDir, "summary-visible-mismatch", decoded({ visibleVariable: false }))], "DASH_SUMMARY_VISIBLE_KPI_BINDING_MISMATCH");
  expectCode("visible KPI source-template temp variable residue fails", ["--package", writePackage(tempDir, "kpi-source-template-tempvar", decoded({ visibleVariable: { id: "__temp_event_portfolio_approved_budget", name: "__temp_event_portfolio_approved_budget" } }))], "DASH_KPI_SOURCE_TEMPLATE_TEMPVAR_RESIDUE");
  expectCode("visible KPI undeclared temp variable fails", ["--package", writePackage(tempDir, "kpi-undeclared-tempvar", decoded({ visibleVariable: { id: "__temp_missing_metric", name: "missing_metric" } }))], "DASH_KPI_TEMPVAR_UNDECLARED");

  const passReport = writeReport(tempDir, "pass-report.json", {
    canonicalApplication: { listSetId: LIST_SET_ID, url: `https://codex.yeeflow.com/#/list-set/41/${LIST_SET_ID}` },
    installApiReturn: { id: INSTALL_OPERATION_ID },
  });
  expectPass("canonical URL and install operation ID are separate", ["--package", valid, "--report", passReport]);
  expectCode(
    "final report URL uses install API returned ID",
    ["--package", valid, "--report", writeReport(tempDir, "bad-url.md", `canonicalApplication.listSetId: ${LIST_SET_ID}\ninstallApiReturn.id: ${INSTALL_OPERATION_ID}\nURL: https://codex.yeeflow.com/#/list-set/41/${INSTALL_OPERATION_ID}\n`)],
    "DASH_CANONICAL_APP_URL_LISTSETID_MISMATCH",
  );
  expectCode(
    "report merges canonical app identity and install operation ID",
    ["--package", valid, "--report", writeReport(tempDir, "merged.json", { canonicalApplication: { listSetId: INSTALL_OPERATION_ID }, installApiReturn: { id: INSTALL_OPERATION_ID } })],
    "DASH_CANONICAL_APP_LISTSETID_MISMATCH|DASH_INSTALL_OPERATION_ID_USED_AS_CANONICAL",
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("dashboard generation hard gates passed");
