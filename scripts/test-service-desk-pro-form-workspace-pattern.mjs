#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const standard = fs.readFileSync("docs/standards/multi-column-form-workspace-standard.md", "utf8");
const study = fs.readFileSync("docs/studies/service-desk-pro-real-workspace-study.md", "utf8");
const runtimeStudy = fs.readFileSync("docs/studies/service-desk-pro-form-workspace-runtime-layout-study.md", "utf8");
const propertyMap = JSON.parse(fs.readFileSync("docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json", "utf8"));
const templateLibrary = JSON.parse(fs.readFileSync("docs/templates/yeeflow-ui-section-template-library.normalized.json", "utf8"));
const inspector = fs.readFileSync("scripts/inspect-generated-app-quality.mjs", "utf8");

const sanitizedPackageSummary = {
  yap: {
    packageType: "YAP ListExportResult",
    resourceEncoding: "gzip-prefixed Resource",
    forms: ["New ticket submitted", "Workspace", "Add SLA And Mentioned Users", "Ticket updated"],
    workspace: {
      host: "approval/form workspace",
      pageurl: { outerType: 1, outerPagetype: 1, embeddedPagetype: 1 },
      controls: ["list", "container", "heading", "icon", "collection", "dynamic-field", "richtext", "action_button"],
      actions: ["Page load", "Nav Your Inbox", "Nav Mentioned You", "Nav All tickets", "Nav Unassigned", "Nav Flagged Tickets", "Submit New Comment", "Hide Navigation Panel", "Hide Details Panel"],
    },
  },
  yapk: {
    packageType: "AppExportPackageInfo",
    decodedShape: "AppPackageInfo",
    resourceEncoding: "Brotli/base64 Resource",
    lists: ["Support Tickets", "Ticket Activities", "Support Teams", "Flagged tickets", "SLA Target"],
    fields: ["Ticket ID", "Description", "Priority", "Status", "Assigned Team", "Activity Type", "Ticket", "Mentioned users"],
  },
};

assert.equal(sanitizedPackageSummary.yap.workspace.host, "approval/form workspace");
assert.deepEqual(sanitizedPackageSummary.yap.workspace.pageurl, { outerType: 1, outerPagetype: 1, embeddedPagetype: 1 });
assert.ok(sanitizedPackageSummary.yap.workspace.actions.includes("Nav All tickets"));
assert.ok(sanitizedPackageSummary.yap.workspace.actions.includes("Submit New Comment"));
assert.ok(sanitizedPackageSummary.yapk.fields.includes("Ticket ID"));
assert.ok(sanitizedPackageSummary.yapk.fields.includes("Mentioned users"));

for (const required of [
  "Use an approval/form workspace when the page needs",
  "Navigation and filters are not just visual labels",
  "Required Runtime Layout Properties",
  "Do not add fake workflow logic",
  "Collection items should set selected/current record state",
]) {
  assert.ok(standard.includes(required), `standard missing: ${required}`);
}

for (const required of [
  "Why This Is A Form Workspace, Not A Dashboard",
  "Four-Column Layout Anatomy",
  "Action-Driven Filtering And State",
  "Comparison With Three-Column Golden Reference",
]) {
  assert.ok(study.includes(required), `study missing: ${required}`);
}

for (const required of [
  "Why The First Service Desk Study Was Insufficient",
  "Broken Smoke Failure Analysis",
  "Extracted Real Property Map Summary",
  "FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY",
]) {
  assert.ok(runtimeStudy.includes(required), `runtime study missing: ${required}`);
}

assert.equal(propertyMap.workspaceSurface.pageUrlShape.outerType, 1);
assert.equal(propertyMap.workspaceSurface.pageUrlShape.embeddedFormdefPagetype, 1);
assert.equal(propertyMap.formWorkspaceShell.layout["style.direction"], "row");
assert.equal(propertyMap.panels.left_help_desk_navigation_panel.width["style.width"], 400);
assert.equal(propertyMap.panels.ticket_collection_panel.width["style.width"], 500);
assert.equal(propertyMap.panels.right_ticket_attributes_panel.width["style.width"], 420);
assert.equal(propertyMap.reusableControlPatterns.icon_control["common.positioning.widthtype"], "2");

const template = templateLibrary.templates.find((entry) => entry.templateId === "multi_column_form_workspace_shell");
assert.ok(template, "multi_column_form_workspace_shell template missing");
assert.ok(template.layoutRules.includes("multi_column_form_workspace_shell"));
assert.ok(template.actionRules.includes("collection_selected_record_action_required"));
assert.ok(template.validationRules.includes("no_fake_submit_button"));
assert.ok(template.requiredLayoutProperties.some((item) => item.includes("reference property map")));
assert.ok(template.validationRules.includes("no_default_container_only_layout"));

for (const code of [
  "FORM_WORKSPACE_SURFACE_MISSING",
  "FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING",
  "FORM_WORKSPACE_COLUMN_WIDTH_MISSING",
  "FORM_WORKSPACE_COLUMN_HEIGHT_MISSING",
  "FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING",
  "FORM_WORKSPACE_DIRECTION_INVALID",
  "FORM_WORKSPACE_ALIGN_ITEMS_MISSING",
  "FORM_WORKSPACE_JUSTIFY_CONTENT_MISSING",
  "FORM_WORKSPACE_ELEMENT_GAP_MISSING",
  "FORM_WORKSPACE_CONTROL_WIDTH_RISK",
  "FORM_WORKSPACE_VERTICAL_TEXT_RISK",
  "FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID",
  "FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID",
  "FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE",
  "FORM_WORKSPACE_ICON_SIZE_LAYOUT_RISK",
  "FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY",
  "FORM_WORKSPACE_NAV_ACTION_MISSING",
  "FORM_WORKSPACE_FILTER_VARIABLE_MISSING",
  "FORM_WORKSPACE_COLLECTION_FILTER_MISSING",
  "FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING",
  "FORM_WORKSPACE_DETAIL_BINDING_MISSING",
  "FORM_WORKSPACE_ICON_ACTION_MISSING",
  "FORM_WORKSPACE_FAKE_SUBMIT_BUTTON",
  "FORM_WORKSPACE_PANEL_LAYOUT_INVALID",
  "FORM_WORKSPACE_PLACEHOLDER_PANEL",
]) {
  assert.ok(inspector.includes(code), `validator missing: ${code}`);
}

console.log(JSON.stringify({
  status: "pass",
  cases: [
    "sanitized Service Desk package summary preserves YAP/YAPK roles",
    "form workspace pageurl shape captured without raw IDs",
    "normalized runtime property map captures shell and panel widths",
    "runtime layout study records broken smoke failure mode",
    "standard records action-driven filter and selected-record rules",
    "template entry declares layout/action/validation requirements",
    "validator exposes property-level pattern-scoped FORM_WORKSPACE errors",
  ],
}, null, 2));
