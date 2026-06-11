#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function page(children = [], attrs = {}) {
  return { attrs: { common: { padding: { left: 24, right: 24 } }, ...attrs }, children };
}

function control(type, attrs = {}, children = [], label = "") {
  return { type, label: label || type, attrs, children };
}

function packageFixture(pageObj, title = "Vendor Management Dashboard") {
  return {
    Item: {
      ListModel: { Title: "Template Test App", ListID: "root" },
      Defs: [],
      Layouts: [{
        Title: title,
        Type: 103,
        LayoutID: "dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        LayoutInResources: [{ Resource: JSON.stringify(pageObj) }],
      }],
    },
    Childs: [],
  };
}

function templateLibrary(overrides = {}) {
  return {
    library: "Template Test Library",
    version: "test",
    templates: [{
      templateId: "dashboard_header_action_bar",
      requiredControls: ["container", "grid", "text", "button"],
      requiredFields: ["Vendor Name"],
      layoutRules: ["safe_padding", "card_container"],
      actionRules: ["active_buttons_require_binding"],
      validationRules: ["section_exists", "no_placeholder_content"],
      proofStatus: "inferred",
      ...overrides,
    }],
  };
}

function checklist(sectionOverrides = {}) {
  return {
    application: "Template Test App",
    version: "test",
    pages: [{
      id: "vendor_management_dashboard",
      title: "Vendor Management Dashboard",
      type: "dashboard",
      required: true,
      sections: [{
        id: "header_action_area",
        title: "Header/action area",
        status: "required",
        templateId: "dashboard_header_action_bar",
        controls: ["container", "grid", "text", "button"],
        requiredFields: ["Vendor Name"],
        matchText: ["Vendor Management Dashboard"],
        layoutRules: ["safe_padding", "card_container"],
        actionBindings: ["New Vendor Request"],
        validationRules: ["section_exists", "no_placeholder_content"],
        ...sectionOverrides,
      }],
    }],
  };
}

function workspaceTemplateLibrary() {
  return templateLibrary({
    templateId: "three_column_workspace_shell",
    requiredControls: ["container", "heading", "icon"],
    requiredFields: [],
    requiredDataBindings: [],
    layoutRules: ["safe_padding", "three_column_workspace_shell", "three_column_reference_mechanics", "section_spacing", "meaningful_panel_content"],
    requiredLayoutProperties: [
      "shell.common.pos",
      "shell.style.direction",
      "panel.style.widthtype",
      "panel.style.height",
      "panel.style.overflow",
      "body.style.overflow",
    ],
    actionRules: [],
    validationRules: ["section_exists", "no_placeholder_content"],
    proofStatus: "export-proven",
  });
}

function workspaceChecklist(sectionOverrides = {}) {
  return {
    application: "Template Test App",
    version: "test",
    pages: [{
      id: "service_desk_inbox",
      title: "Service Desk Inbox",
      type: "dashboard",
      required: true,
      sections: [{
        id: "workspace_shell",
        title: "Service Desk Inbox",
        status: "required",
        templateId: "three_column_workspace_shell",
        controls: ["container", "heading", "icon"],
        matchText: ["Service Desk Inbox"],
        layoutRules: ["three_column_workspace_shell", "three_column_reference_mechanics", "meaningful_panel_content"],
        validationRules: ["section_exists", "no_placeholder_content"],
        ...sectionOverrides,
      }],
    }],
  };
}

function formWorkspaceTemplateLibrary() {
  return templateLibrary({
    templateId: "multi_column_form_workspace_shell",
    requiredControls: ["container", "heading", "icon", "list"],
    requiredFields: [],
    requiredDataBindings: ["ticket_collection_source", "selected_record_state", "filter_variables"],
    layoutRules: ["multi_column_form_workspace_shell", "four_column_service_desk_workspace", "action_driven_ticket_workspace"],
    actionRules: ["nav_menu_actions_required", "filter_variable_actions_required", "collection_selected_record_action_required"],
    validationRules: ["section_exists", "no_placeholder_content"],
    proofStatus: "export-proven",
  });
}

function formWorkspaceChecklist(sectionOverrides = {}) {
  return {
    application: "Template Test App",
    version: "test",
    pages: [{
      id: "service_desk_workspace",
      title: "Service Desk Workspace",
      type: "dashboard",
      required: true,
      sections: [{
        id: "workspace_shell",
        title: "Service Desk Workspace",
        status: "required",
        templateId: "multi_column_form_workspace_shell",
        controls: ["container", "heading", "icon", "list"],
        matchText: ["HELP DESK", "All Tickets", "Details"],
        layoutRules: ["multi_column_form_workspace_shell", "four_column_service_desk_workspace", "action_driven_ticket_workspace"],
        validationRules: ["section_exists", "no_placeholder_content"],
        ...sectionOverrides,
      }],
    }],
  };
}

function validPage() {
  return page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8, gap: 24 } }, [
      control("grid", { style: { display: "grid", gap: 24 } }, [
        control("text", { text: "Vendor Management Dashboard Vendor Name" }, [], "Vendor Management Dashboard"),
        control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
      ], "Header Grid"),
    ], "Header Card"),
  ]);
}

function workspacePanel(label, body, bottom) {
  const isMain = /main/i.test(label);
  return control("container", {
    style: {
      border: "1px solid #e5e7eb",
      radius: 8,
      gap: 0,
      widthtype: isMain ? "0" : "3",
      width: isMain ? 300 : (/right/i.test(label) ? 480 : 360),
      height: "2",
      cushei: 100,
      cusheiu: "%",
      overflow: "hidden",
      justify_content: "flex-start",
    },
  }, [
    control("container", { common: { pos: [null, "sticky"] }, style: { direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "space-between"], minheight: [null, 52], gap: [null, "--sp--s150"] } }, [
      control("icon", { icon: label, style: { widthtype: [null, "1"], size: [null, 20] } }, [], `${label} icon`),
      control("heading", { text: label, headc: { title: { value: label } } }, [], label),
    ], `${label} header`),
    control("container", { style: { overflow: "scroll", height: "2", cushei: 100, cusheiu: "%", gap: 16 } }, body, `${label} body`),
    control("container", { style: { direction: [null, "row"], align_items: [null, "center"], gap: 12 } }, [
      control("heading", { text: bottom, headc: { title: { value: bottom } } }, [], bottom),
    ], `${label} bottom`),
  ], label);
}

function validWorkspacePage() {
  return page([
    control("container", { common: { pos: [null, "absolute"] }, style: { gap: 24, direction: [null, "row"], display: "flex" } }, [
      workspacePanel("Left ticket queue context", [
        control("heading", { text: "Open ticket queues by status and priority", headc: { title: { value: "Open ticket queues by status and priority" } } }, [], "Ticket Queues"),
      ], "Bottom queue notes"),
      workspacePanel("Main work ticket list", [
        control("data-list", { data: { ListID: "tickets" }, listarr: [{ Field: "Title", FieldName: "Ticket Title" }, { Field: "Status", FieldName: "Status" }] }, [], "Ticket List"),
      ], "Bottom work area activity"),
      workspacePanel("Right detail information action panel", [
        control("dynamic-field", { FieldName: "Selected Ticket Detail" }, [], "Selected Ticket Detail"),
        control("heading", { text: "SLA owner priority notes actions", headc: { title: { value: "SLA owner priority notes actions" } } }, [], "SLA Detail"),
      ], "Bottom detail history"),
    ], "Service Desk Inbox"),
  ], { contentWidth: "full", container: { padding: { left: 0, right: 0, top: 0, bottom: 0 } } });
}

function navItem(label, action = "nav-action") {
  return control("container", { control_action: action, style: { direction: [null, "row"], gap: 8, align_items: [null, "center"] } }, [
    control("icon", { icon: label, style: { widthtype: [null, "1"], size: [null, 18] } }, [], `${label} icon`),
    control("heading", { text: label, headc: { title: { value: label } } }, [], label),
  ], label);
}

function validFormWorkspacePage(overrides = {}) {
  const helperList = control("list", { data: { ListID: "support_tickets" } }, [], "hidden helper ticket list");
  const nav = control("container", {
    style: { widthtype: "3", width: 400, height: "2", cushei: 100, cusheiu: "%", overflow: "scroll" },
  }, [
    control("heading", { text: "HELP DESK", headc: { title: { value: "HELP DESK" } } }, [], "HELP DESK"),
    navItem("Your inbox", "setvar filter current user"),
    navItem("Mentioned you", "setvar filter mentioned"),
    navItem("All tickets", "setvar filter all"),
    navItem("Unassigned", "setvar filter unassigned"),
    control("heading", { text: "Teams", headc: { title: { value: "Teams" } } }, [], "Teams"),
  ], "left_help_desk_navigation_panel");
  const list = control("container", {
    style: { widthtype: "3", width: 500, height: "2", cushei: 100, cusheiu: "%", overflow: "hidden" },
  }, [
    control("container", { style: { direction: [null, "row"], align_items: [null, "center"], justify_content: [null, "space-between"], gap: [null, 10] } }, [
      control("heading", { text: "All Tickets", headc: { title: { value: "All Tickets" } } }, [], "All Tickets"),
      control("icon", { icon: { icon: "Search", size: [null, 16] }, common: { positioning: { widthtype: [null, "2"] } } }, [], "Search"),
    ], "All Tickets header"),
    control("heading", { text: "Priority Status filter variables", filterVars: ["Priority", "Status"] }, [], "Priority Status"),
    control("collection", {
      data: { ListID: "support_tickets" },
      actions: [{ type: "click", action: "setvar selected_ticket ListDataID Current" }],
      filter: { variables: ["filter_priority", "filter_status", "CurrentUser"] },
    }, [
      control("container", { control_action: "setvar selected_ticket ListDataID Current", style: { direction: [null, "row"], gap: [null, 10], align_items: [null, "center"] }, common: { padding: [null, { top: 12, right: 12, bottom: 12, left: 6 }], border: { normal: { radius: [null, { top: 12, right: 12, bottom: 12, left: 12 }] } }, background: { normal: { type: "classic", classic: { color: "rgba(7, 22, 56, 0.05)" } } } } }, [
        control("dynamic-user", { FieldName: "Created By" }, [], "Requester"),
        control("dynamic-field", { FieldName: "Title" }, [], "Ticket title"),
      ], "selected ticket item"),
    ], "ticket collection selected current ListDataID filter"),
  ], "ticket_collection_panel");
  const workspace = control("container", {
    style: { widthtype: "0", height: "2", cushei: 100, cusheiu: "%", direction: [null, "row"], overflow: "hidden" },
  }, [
    control("container", { style: { widthtype: "0", overflow: "scroll" } }, [
      control("heading", { text: "Selected ticket description activities conversation comment", headc: { title: { value: "Selected ticket description activities conversation comment" } } }, [], "Selected ticket workspace"),
      control("dynamic-field", { FieldName: "Description", source: "selected current record" }, [], "Description"),
      control("action_button", { label: "Submit Comment", control_action: "setdatalist comment selected ticket" }, [], "Submit Comment"),
    ], "selected_record_workspace_panel"),
    control("container", { style: { widthtype: "3", width: 360, overflow: "scroll" } }, [
      control("heading", { text: "Details attributes priority status team assignee ticket id", headc: { title: { value: "Details attributes priority status team assignee ticket id" } } }, [], "Details"),
      control("dynamic-field", { FieldName: "Priority", source: "selected current record" }, [], "Priority"),
      control("dynamic-field", { FieldName: "Status", source: "selected current record" }, [], "Status"),
    ], "right_attributes_panel"),
  ], "selected_record_workspace_and_details");
  const shellAttrs = overrides.shellAttrs || { style: { direction: [null, "row"], gap: [null, 0], display: "flex", height: "2", cushei: 100, cusheiu: "%", overflow: "hidden" }, common: { pos: [null, "absolute"] } };
  return page([
    helperList,
    control("container", shellAttrs, [overrides.nav || nav, overrides.list || list, overrides.workspace || workspace], "multi_column_form_workspace_shell"),
  ]);
}

function writeJson(dir, name, obj) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`);
  return file;
}

function runInspector(pkg, check, library) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--package",
    pkg,
    "--composition-checklist",
    check,
    "--template-library",
    library,
    "--strict-visual-app-quality",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Inspector did not return JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
}

function templateErrors(report) {
  return (report.findings || []).filter((finding) => finding.source === "template-library" && finding.level === "error");
}

function expectCode(name, report, code) {
  if (!templateErrors(report).some((finding) => finding.code === code)) {
    throw new Error(`${name} did not report ${code}. Template findings: ${JSON.stringify(templateErrors(report), null, 2)}`);
  }
}

function expectNoTemplateErrors(name, report) {
  const errors = templateErrors(report);
  if (errors.length) throw new Error(`${name} reported template errors: ${JSON.stringify(errors, null, 2)}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "template-library-conformance-"));
const cases = [];

try {
  const library = writeJson(tempDir, "template-library", templateLibrary());
  const pkg = writeJson(tempDir, "valid-pkg", packageFixture(validPage()));

  expectCode(
    "missing templateId",
    runInspector(pkg, writeJson(tempDir, "missing-template-id-checklist", checklist({ templateId: "" })), library),
    "TEMPLATE_ID_MISSING",
  );
  cases.push({ case: "missing templateId fails", expected: "TEMPLATE_ID_MISSING", status: "pass" });

  expectCode(
    "unknown templateId",
    runInspector(pkg, writeJson(tempDir, "unknown-template-id-checklist", checklist({ templateId: "unknown_template" })), library),
    "TEMPLATE_ID_UNKNOWN",
  );
  cases.push({ case: "unknown templateId fails", expected: "TEMPLATE_ID_UNKNOWN", status: "pass" });

  const missingGridPage = page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
      control("text", { text: "Vendor Management Dashboard Vendor Name" }, [], "Vendor Management Dashboard"),
      control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
    ], "Header Card"),
  ]);
  expectCode(
    "required control missing",
    runInspector(writeJson(tempDir, "missing-control-pkg", packageFixture(missingGridPage)), writeJson(tempDir, "missing-control-checklist", checklist()), library),
    "TEMPLATE_REQUIRED_CONTROL_MISSING",
  );
  cases.push({ case: "required control missing fails", expected: "TEMPLATE_REQUIRED_CONTROL_MISSING", status: "pass" });

  const placeholderPage = page([
    control("container", { style: { border: "1px solid #e5e7eb", radius: 8 } }, [
      control("grid", { style: { display: "grid", gap: 24 } }, [
        control("text", { text: "Vendor Management Dashboard Vendor Name Alert Here is the description" }, [], "Vendor Management Dashboard"),
        control("button", { text: "New Vendor Request", control_action: "open-new-vendor" }, [], "New Vendor Request"),
      ], "Header Grid"),
    ], "Header Card"),
  ]);
  expectCode(
    "placeholder implementation",
    runInspector(writeJson(tempDir, "placeholder-pkg", packageFixture(placeholderPage)), writeJson(tempDir, "placeholder-checklist", checklist()), library),
    "TEMPLATE_PLACEHOLDER_IMPLEMENTATION",
  );
  cases.push({ case: "placeholder implementation fails", expected: "TEMPLATE_PLACEHOLDER_IMPLEMENTATION", status: "pass" });

  expectNoTemplateErrors(
    "valid simplified template fixture",
    runInspector(pkg, writeJson(tempDir, "valid-checklist", checklist()), library),
  );
  cases.push({ case: "valid simplified template fixture passes", expected: "no template errors", status: "pass" });

  const workspaceLibrary = writeJson(tempDir, "workspace-template-library", workspaceTemplateLibrary());
  const workspacePkg = writeJson(tempDir, "workspace-pkg", packageFixture(validWorkspacePage(), "Service Desk Inbox"));
  expectNoTemplateErrors(
    "valid three-column workspace fixture",
    runInspector(workspacePkg, writeJson(tempDir, "workspace-checklist", workspaceChecklist()), workspaceLibrary),
  );
  cases.push({ case: "valid three-column workspace fixture passes", expected: "no template errors", status: "pass" });

  const placeholderWorkspacePage = validWorkspacePage();
  placeholderWorkspacePage.children[0].children[1].children[1].children = [
    control("heading", { text: "Drag to add controls here", headc: { title: { value: "Drag to add controls here" } } }, [], "Placeholder"),
  ];
  expectCode(
    "three-column workspace placeholder content",
    runInspector(writeJson(tempDir, "workspace-placeholder-pkg", packageFixture(placeholderWorkspacePage, "Service Desk Inbox")), writeJson(tempDir, "workspace-placeholder-checklist", workspaceChecklist()), workspaceLibrary),
    "TEMPLATE_LAYOUT_RULE_MISSING",
  );
  cases.push({ case: "three-column workspace placeholder content fails", expected: "TEMPLATE_LAYOUT_RULE_MISSING", status: "pass" });

  const twoColumnWorkspacePage = page([
    control("container", { style: { gap: 24, display: "flex" } }, [
      workspacePanel("Left ticket queue context", [], "Bottom queue notes"),
      workspacePanel("Main work ticket list", [], "Bottom work area activity"),
    ], "Service Desk Inbox"),
  ]);
  expectCode(
    "three-column workspace missing third panel",
    runInspector(writeJson(tempDir, "workspace-two-column-pkg", packageFixture(twoColumnWorkspacePage, "Service Desk Inbox")), writeJson(tempDir, "workspace-two-column-checklist", workspaceChecklist()), workspaceLibrary),
    "TEMPLATE_LAYOUT_RULE_MISSING",
  );
  cases.push({ case: "three-column workspace missing third panel fails", expected: "TEMPLATE_LAYOUT_RULE_MISSING", status: "pass" });

  const stackedWorkspacePage = validWorkspacePage();
  delete stackedWorkspacePage.children[0].attrs.common;
  stackedWorkspacePage.children[0].attrs.style = { gap: 24 };
  expectCode(
    "three-column workspace sequential vertical panels",
    runInspector(writeJson(tempDir, "workspace-stacked-pkg", packageFixture(stackedWorkspacePage, "Service Desk Inbox")), writeJson(tempDir, "workspace-stacked-checklist", workspaceChecklist()), workspaceLibrary),
    "THREE_COLUMN_PANELS_STACKED_VERTICALLY",
  );
  cases.push({ case: "three-column workspace sequential vertical panels fail", expected: "THREE_COLUMN_PANELS_STACKED_VERTICALLY", status: "pass" });

  const formWorkspaceLibrary = writeJson(tempDir, "form-workspace-template-library", formWorkspaceTemplateLibrary());
  const formWorkspacePkg = writeJson(tempDir, "form-workspace-pkg", packageFixture(validFormWorkspacePage(), "Service Desk Workspace"));
  expectNoTemplateErrors(
    "valid multi-column form workspace fixture",
    runInspector(formWorkspacePkg, writeJson(tempDir, "form-workspace-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
  );
  cases.push({ case: "valid multi-column form workspace fixture passes", expected: "no template errors", status: "pass" });

  const noNavActionPage = validFormWorkspacePage({
    nav: control("container", { style: { widthtype: "3", width: 400, height: "2", cushei: 100, cusheiu: "%", overflow: "scroll" } }, [
      control("heading", { text: "HELP DESK Your inbox Mentioned you All tickets Teams", headc: { title: { value: "HELP DESK Your inbox Mentioned you All tickets Teams" } } }, [], "HELP DESK"),
    ], "left_help_desk_navigation_panel"),
  });
  expectCode(
    "form workspace missing nav actions",
    runInspector(writeJson(tempDir, "form-workspace-no-nav-actions-pkg", packageFixture(noNavActionPage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-no-nav-actions-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_NAV_ACTION_MISSING",
  );
  cases.push({ case: "multi-column form workspace missing nav actions fails", expected: "FORM_WORKSPACE_NAV_ACTION_MISSING", status: "pass" });

  const noSelectionList = control("container", { style: { widthtype: "3", width: 500, height: "2", cushei: 100, cusheiu: "%", overflow: "hidden" } }, [
    control("heading", { text: "All Tickets Priority Status filter", headc: { title: { value: "All Tickets Priority Status filter" } } }, [], "All Tickets"),
    control("collection", { data: { ListID: "support_tickets" }, filter: { variables: ["filter_priority"] } }, [], "ticket collection filter"),
  ], "ticket_collection_panel");
  expectCode(
    "form workspace missing selected record action",
    runInspector(writeJson(tempDir, "form-workspace-no-selection-pkg", packageFixture(validFormWorkspacePage({ list: noSelectionList }), "Service Desk Workspace")), writeJson(tempDir, "form-workspace-no-selection-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING",
  );
  cases.push({ case: "multi-column form workspace missing selected-record action fails", expected: "FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING", status: "pass" });

  const fakeSubmitPage = validFormWorkspacePage();
  fakeSubmitPage.children[1].children[2].children[0].children.push(control("button", { text: "Submit Request", control_action: "fake-submit" }, [], "Submit Request"));
  expectCode(
    "form workspace fake submit button",
    runInspector(writeJson(tempDir, "form-workspace-fake-submit-pkg", packageFixture(fakeSubmitPage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-fake-submit-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_FAKE_SUBMIT_BUTTON",
  );
  cases.push({ case: "multi-column form workspace fake submit button fails", expected: "FORM_WORKSPACE_FAKE_SUBMIT_BUTTON", status: "pass" });

  const stackedFormWorkspacePage = validFormWorkspacePage({ shellAttrs: { style: { gap: 16 } } });
  expectCode(
    "form workspace stacked panels",
    runInspector(writeJson(tempDir, "form-workspace-stacked-pkg", packageFixture(stackedFormWorkspacePage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-stacked-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_DIRECTION_INVALID",
  );
  cases.push({ case: "multi-column form workspace stacked panels fail", expected: "FORM_WORKSPACE_DIRECTION_INVALID", status: "pass" });

  const defaultContainerOnlyPage = page([
    control("list", { data: { ListID: "support_tickets" } }, [], "hidden helper ticket list"),
    control("container", {}, [
      control("container", {}, [control("heading", { text: "HELP DESK Your inbox Mentioned you All tickets Teams", headc: { title: { value: "HELP DESK Your inbox Mentioned you All tickets Teams" } } }, [], "HELP DESK")], "left_help_desk_navigation_panel"),
      control("container", {}, [control("heading", { text: "All Tickets Priority Status collection filter", headc: { title: { value: "All Tickets Priority Status collection filter" } } }, [], "All Tickets")], "ticket_collection_panel"),
      control("container", {}, [control("heading", { text: "Selected ticket description activities comment details attributes priority status team assignee", headc: { title: { value: "Selected ticket description activities comment details attributes priority status team assignee" } } }, [], "Details")], "selected_record_workspace_panel"),
    ], "multi_column_form_workspace_shell"),
  ]);
  expectCode(
    "form workspace default containers only",
    runInspector(writeJson(tempDir, "form-workspace-default-container-pkg", packageFixture(defaultContainerOnlyPage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-default-container-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY",
  );
  cases.push({ case: "multi-column form workspace default-container-only layout fails", expected: "FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY", status: "pass" });

  const missingWidthPage = validFormWorkspacePage({
    nav: control("container", { style: { height: "2", cushei: 100, cusheiu: "%", overflow: "scroll" } }, [
      control("heading", { text: "HELP DESK", headc: { title: { value: "HELP DESK" } } }, [], "HELP DESK"),
      navItem("Your inbox", "setvar filter current user"),
      navItem("All tickets", "setvar filter all"),
      navItem("Flagged", "setvar filter flagged"),
    ], "left_help_desk_navigation_panel"),
  });
  expectCode(
    "form workspace missing column width",
    runInspector(writeJson(tempDir, "form-workspace-missing-width-pkg", packageFixture(missingWidthPage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-missing-width-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_COLUMN_WIDTH_MISSING",
  );
  cases.push({ case: "multi-column form workspace missing column width fails", expected: "FORM_WORKSPACE_COLUMN_WIDTH_MISSING", status: "pass" });

  const iconWidthRiskPage = validFormWorkspacePage();
  iconWidthRiskPage.children[1].children[0].children[1].children[0].attrs.style.widthtype = [null, "3"];
  expectCode(
    "form workspace full-width icon",
    runInspector(writeJson(tempDir, "form-workspace-icon-width-pkg", packageFixture(iconWidthRiskPage, "Service Desk Workspace")), writeJson(tempDir, "form-workspace-icon-width-checklist", formWorkspaceChecklist()), formWorkspaceLibrary),
    "FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE",
  );
  cases.push({ case: "multi-column form workspace full-width icon fails", expected: "FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
