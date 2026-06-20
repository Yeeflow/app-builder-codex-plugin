#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();

function writeJson(dir, name, value) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  let report;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`Could not parse ${script} output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, report };
}

function expectCode(report, code) {
  assert.equal(
    (report.findings || []).some((finding) => finding.code === code),
    true,
    `expected ${code}; findings: ${JSON.stringify(report.findings, null, 2)}`,
  );
}

function openRequestAction(overrides = {}) {
  return {
    controlLabel: "Open Request",
    controlType: "Button",
    interactionPurpose: "Open the request work queue dashboard from the current row/action context.",
    actionType: "Open dashboard",
    actionTypeCode: "6",
    targetResourceType: "Dashboard page",
    targetResourceName: "Operations Dashboard",
    requiredTargetIdentifiers: { PageID: "PAGE-OPERATIONS-DASHBOARD", LayoutID: "PAGE-OPERATIONS-DASHBOARD" },
    openMode: "slide",
    proofStatus: "export-proven Container/Button action-type 6 with runtime-proof-required target verification.",
    ...overrides,
  };
}

function addPurchaseRequestAction(overrides = {}) {
  return {
    controlLabel: "Create Purchase Request",
    controlType: "Container",
    interactionPurpose: "Quick-create a purchase request from the Dashboard.",
    actionType: "Add list item",
    actionTypeCode: "5",
    targetResourceType: "Data list",
    targetResourceName: "Purchase Requests",
    requiredTargetIdentifiers: { ListID: "LIST-PURCHASE-REQUESTS", LayoutID: "LAYOUT-PURCHASE-REQUESTS-NEW" },
    openMode: "modal",
    modalSize: "2",
    passValues: [{ field: "Title", value: "Draft request" }],
    proofStatus: "export-proven Container/Button action-type 5.",
    ...overrides,
  };
}

function openApprovalAction(overrides = {}) {
  return {
    controlLabel: "Start Purchase Approval",
    controlType: "Button",
    interactionPurpose: "Start the Purchase Approval workflow from the Dashboard.",
    actionType: "Open approval form",
    actionTypeCode: "8",
    targetResourceType: "Approval form",
    targetResourceName: "Purchase Approval",
    requiredTargetIdentifiers: { ProcKey: "PURCHASE_APPROVAL" },
    openMode: "slide",
    modalSize: "2",
    setVars: [{ variable: "Title", value: "New approval request" }],
    proofStatus: "export-proven Container/Button action-type 8; approval pageUrl readiness remains generated-package validation.",
    ...overrides,
  };
}

function openDocumentAction(overrides = {}) {
  return {
    controlLabel: "Open Document",
    controlType: "Button",
    interactionPurpose: "Open the current document preview/deep link.",
    actionType: "Link",
    actionTypeCode: "2",
    targetResourceType: "Link",
    targetResourceName: "Document preview URL",
    urlExpression: "Document preview URL expression",
    openMode: "new",
    proofStatus: "export-proven Container/Button action-type 2; URL remains redacted.",
    ...overrides,
  };
}

function attachStructuredOpenRequest(value) {
  if (!value || typeof value !== "object") return value;
  const labels = (value.actions || []).filter((action) => typeof action === "string");
  if (labels.includes("Open Request")) {
    value.interactiveActions = value.interactiveActions || [];
    if (!value.interactiveActions.some((action) => actionLabelForTest(action) === "Open Request")) {
      value.interactiveActions.push(openRequestAction());
    }
  }
  return value;
}

function actionLabelForTest(action) {
  return String(action?.controlLabel || action?.label || action?.name || "").trim();
}

function appPlan(overrides = {}) {
  const plan = {
    dashboards: [{ name: "Operations Dashboard", pageFunctionPlanRef: "PFP-DASH-OPERATIONS", fields: ["Title"], actions: ["Open Request"] }],
    approvalForms: [{
      name: "Purchase Approval",
      submissionPageFunctionPlanRef: "PFP-APPROVAL-PURCHASE-SUBMISSION",
      fields: ["Title", "Amount", "Requester", "Justification", "Manager Comment"],
      actions: ["Save as draft", "Submit", "Approve", "Reject", "Print"],
      taskForms: [{ name: "Manager Review", pageFunctionPlanRef: "PFP-APPROVAL-PURCHASE-MANAGER-REVIEW", actions: ["Approve", "Reject"] }],
      printPages: [{ name: "Purchase Approval Print", pageFunctionPlanRef: "PFP-APPROVAL-PURCHASE-PRINT" }],
    }],
    formReports: [{ name: "Purchase Approval Report", approvalForm: "Purchase Approval" }],
    dataLists: [{
      name: "Purchase Requests",
      fields: ["Title", "Amount", "Status", "Requester", "Created Date", "Manager Comment"],
      forms: [
        { name: "New Purchase Request", type: "New", pageFunctionPlanRef: "PFP-LIST-PURCHASE-REQUESTS-NEW", fields: ["Title", "Amount", "Justification"], actions: ["Save", "Cancel"] },
        { name: "Edit Purchase Request", type: "Edit", pageFunctionPlanRef: "PFP-LIST-PURCHASE-REQUESTS-EDIT", fields: ["Title", "Amount", "Justification"], actions: ["Save", "Cancel"] },
        { name: "View Purchase Request", type: "View", pageFunctionPlanRef: "PFP-LIST-PURCHASE-REQUESTS-VIEW", fields: ["Title", "Amount", "Status", "Requester"], actions: ["Open Request"] },
      ],
    }],
    documentLibraries: [{
      name: "Purchase Documents",
      fields: ["Title", "Status", "Created Date"],
      forms: [{ name: "View Purchase Document", type: "View", pageFunctionPlanRef: "PFP-DOC-PURCHASE-DOCUMENTS-VIEW", fields: ["Title", "Status"], actions: ["Open Document"] }],
    }],
  };
  const merged = { ...plan, ...overrides };
  merged.dashboards = (merged.dashboards || []).map((dashboard) => ({
    pageFunctionPlanRef: `PFP-DASH-${String(dashboard.name || "DASHBOARD").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    ...dashboard,
  }));
  return merged;
}

function pagePlan(overrides = {}) {
  const plan = {
    applicationName: "Purchase Operations",
    applicationLayout: "application-layout-1-vertical-nav",
    dashboards: [{
      pageFunctionPlanId: "PFP-DASH-OPERATIONS",
      appPlanDashboardRef: "Operations Dashboard",
      name: "Operations Dashboard",
      pagePurpose: "Operations overview dashboard for request queues and KPIs.",
      businessTaskSolved: "Help managers see workload metrics and open pending requests.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      dashboardGoldenReference: "none",
      desktopBehavior: "Two-column operations dashboard with KPI row and queue.",
      mobileBehavior: "Stacks KPI cards first, then request queue.",
      dashboardSectionTemplates: [
        {
          templateId: "kpi_card_row",
          regionName: "Operations KPI Row",
          businessPurpose: "KPI metrics for open request counts and total amount.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status"],
          filters: ["Current fiscal period"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: [],
          requiredControls: ["container", "grid", "text", "summary"],
          proofStatus: "export-proven",
          whyTemplateFits: "KPI metrics need the export-proven KPI/Summary card row.",
        },
        {
          templateId: "data_table_section",
          regionName: "Request Queue",
          businessPurpose: "Record table work queue for pending purchase requests.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status"],
          filters: ["Status is not Completed"],
          grouping: [],
          sorting: ["Created Date descending"],
          actions: ["Open Request"],
          interactiveActions: [openRequestAction(), addPurchaseRequestAction(), openApprovalAction()],
      requiredControls: ["data-list"],
      proofStatus: "runtime-proven",
      whyTemplateFits: "A data table section fits a scannable record queue.",
        },
      ],
      regions: [{
        name: "Request Queue",
        controlType: "Collection",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
        interactiveActions: [openRequestAction()],
      }],
    }],
    approvalForms: [{
      pageFunctionPlanId: "PFP-APPROVAL-PURCHASE",
      appPlanApprovalRef: "Purchase Approval",
      name: "Purchase Approval",
      submissionForm: {
        pageFunctionPlanId: "PFP-APPROVAL-PURCHASE-SUBMISSION",
        desktopBehavior: "Sectioned request form.",
        mobileBehavior: "Single-column stacked fields with action bar at bottom.",
        actions: ["Save as draft", "Submit"],
        fields: [
          { name: "Title", controlType: "Text", field: "Title", editable: true, required: true, defaultValue: "N/A", dynamicBehavior: "N/A", validationBehavior: "Required text" },
          { name: "Amount", controlType: "Dynamic field", field: "Amount", editable: true, required: true, defaultValue: "0", dynamicBehavior: "N/A", validationBehavior: "Must be positive" },
          { name: "Justification", controlType: "Text", field: "Justification", editable: true, required: true, defaultValue: "N/A", dynamicBehavior: "N/A", validationBehavior: "Required explanation" },
        ],
      },
      taskForms: [{
        pageFunctionPlanId: "PFP-APPROVAL-PURCHASE-MANAGER-REVIEW",
        name: "Manager Review",
        differencesFromSubmission: "Adds manager comment and decision buttons; request fields are read-only.",
        desktopBehavior: "Same section rhythm as submission with decision panel.",
        mobileBehavior: "Request summary first, decision controls second.",
        actions: ["Approve", "Reject"],
        fields: [{ name: "Manager Comment", controlType: "Text", field: "Manager Comment", editable: true }],
      }],
      printPages: [{
        pageFunctionPlanId: "PFP-APPROVAL-PURCHASE-PRINT",
        name: "Purchase Approval Print",
        printLayoutIntent: "Printable single-column evidence layout with signature area.",
        desktopBehavior: "Printable single-column evidence layout.",
        mobileBehavior: "Print page remains readable in one column.",
        content: [{ name: "Title", controlType: "Text", field: "Title" }],
      }],
    }],
    dataListForms: [{
      resourceName: "Purchase Requests",
      appPlanResourceRef: "Purchase Requests",
      forms: [
        {
          pageFunctionPlanId: "PFP-LIST-PURCHASE-REQUESTS-NEW",
          name: "New Purchase Request",
          type: "New",
          desktopBehavior: "Compact two-column editable form.",
          mobileBehavior: "Single-column editable fields.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Amount", controlType: "Dynamic field", field: "Amount" }],
          actions: ["Save", "Cancel"],
        },
        {
          pageFunctionPlanId: "PFP-LIST-PURCHASE-REQUESTS-EDIT",
          name: "Edit Purchase Request",
          type: "Edit",
          desktopBehavior: "Compact two-column editable form.",
          mobileBehavior: "Single-column editable fields.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Amount", controlType: "Dynamic field", field: "Amount" }],
          actions: ["Save", "Cancel"],
        },
        {
          pageFunctionPlanId: "PFP-LIST-PURCHASE-REQUESTS-VIEW",
          name: "View Purchase Request",
          type: "View",
          desktopBehavior: "Summary header with related document region.",
          mobileBehavior: "Summary first, related documents below.",
          fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Status", controlType: "Dynamic field", field: "Status" }],
          actions: ["Open Request"],
          interactiveActions: [openRequestAction()],
          relatedRegions: [{
            name: "Related Documents",
            regionType: "Data table",
            source: "Purchase Documents",
            binding: "Purchase Documents.Title matches current Title",
            fields: ["Title", "Status"],
            filters: ["Current purchase request"],
            actions: ["Open Document"],
            interactiveActions: [openDocumentAction()],
            openingBehavior: "Open document view form in slide panel",
          }],
        },
      ],
    }],
    documentLibraryForms: [{
      resourceName: "Purchase Documents",
      appPlanResourceRef: "Purchase Documents",
      forms: [{
        pageFunctionPlanId: "PFP-DOC-PURCHASE-DOCUMENTS-VIEW",
        name: "View Purchase Document",
        type: "View",
        documentMetadataBehavior: "Show Title, Status, and Created Date metadata in a side panel.",
        documentViewBehavior: "Open document preview or view behavior using supported Document embed/view surface when available.",
        desktopBehavior: "Document preview with metadata side panel.",
        mobileBehavior: "Metadata stacks above document preview.",
        fields: [{ name: "Title", controlType: "Text", field: "Title" }, { name: "Status", controlType: "Dynamic field", field: "Status" }],
        actions: ["Open Document"],
        interactiveActions: [openDocumentAction()],
      }],
    }],
  };
  const merged = { ...plan, ...overrides };
  merged.dashboards = (merged.dashboards || []).map((dashboard) => ({
    pageFunctionPlanId: `PFP-DASH-${String(dashboard.name || "DASHBOARD").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    appPlanDashboardRef: dashboard.name,
    dashboardGoldenReference: "none",
    ...dashboard,
  }));
  for (const dashboard of merged.dashboards) {
    attachStructuredOpenRequest(dashboard);
    for (const entry of dashboard.dashboardSectionTemplates || []) attachStructuredOpenRequest(entry);
    for (const region of dashboard.regions || []) attachStructuredOpenRequest(region);
  }
  for (const resource of [...(merged.dataListForms || []), ...(merged.documentLibraryForms || [])]) {
    for (const form of resource.forms || []) {
      attachStructuredOpenRequest(form);
      for (const region of form.relatedRegions || []) attachStructuredOpenRequest(region);
    }
  }
  return merged;
}

function addEventPortfolioFidelity(plan) {
  const dashboard = plan.dashboards[0];
  dashboard.dashboardFidelityProfile = "High-quality Event Portfolio runtime-fidelity dashboard";
  dashboard.marketingEventFidelityReference = "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md; docs/standards/yeeflow-ui-control-property-fidelity.md";
  dashboard.runtimeProofBoundary = "Runtime browser/screenshot proof required; signing, install, and API success are not UI proof.";
  dashboard.designerTraceabilityRequirements = "Use semantic nv_label values for generated Dashboard containers, KPI cards, filters, rows, and action-looking controls.";

  for (const entry of dashboard.dashboardSectionTemplates) {
    entry.marketingEventFidelityReference = "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md";
    entry.runtimeProofBoundary = "Requires runtime/browser screenshot proof after generation.";
    entry.designerTraceabilityRequirements = "Semantic nv_label must trace the generated section and key controls.";
    if (entry.templateId === "kpi_card_row" || entry.templateId === "progress_summary_card") {
      entry.kpiSummaryBindingRequirements = {
        source: entry.source,
        summaryControl: "Hidden Summary control bound to Purchase Requests",
        metricFields: ["Amount", "Status"],
        filters: entry.filters,
        visibleBinding: "Visible KPI card reads formatted Summary/temp-variable values",
      };
      entry.kpiFormattingRequirements = "Use formatNumber with compact K/M/B and fixed decimals/currency rules; no raw variable values.";
      entry.dataFilterRequirements = "Status period Data Filter writes filter variables consumed by Summary and queue sections.";
    }
    if (entry.templateId === "data_table_section" || entry.templateId === "collection_card_board" || entry.templateId === "kanban_status_board") {
      entry.dataFilterRequirements = "Real Data Filter controls write filter variables consumed by the table/Collection/Kanban target.";
      entry.richTableTreatmentRequirements = "Status fields render as badges, progress fields as Progress controls, owners as Dynamic user/person/avatar treatment, with header hierarchy and dense rows.";
      entry.actionMetadataRequirements = "Open Request uses real Yeeflow action metadata with row context and target detail/open behavior.";
    }
    if (entry.templateId === "collection_card_board") {
      entry.collectionGridTableRequirements = {
        source: entry.source,
        fields: entry.displayedFields,
        rowContext: "Current Collection row Purchase Request",
        detailOpenAction: "Open Request detail in slide panel",
      };
    }
  }
  return plan;
}

function eventPortfolioGoldenPlan(overrides = {}) {
  const plan = pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Event Portfolio golden reference dashboard for portfolio status and request operations.",
      businessTaskSolved: "Managers filter portfolio requests, review KPI health, scan rich status rows, and open request details.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      dashboardGoldenReference: "event_portfolio_dashboard_golden_reference",
      dashboardFidelityProfile: "High-quality Event Portfolio golden-reference dashboard",
      marketingEventFidelityReference: "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md; docs/standards/yeeflow-ui-control-property-fidelity.md",
      sourceDataLists: ["Purchase Requests"],
      dataFilterControls: [
        { name: "Status Filter", controlType: "Data Filter", filterVariable: "__filter_status", targetConsumers: ["Portfolio KPI Row", "Portfolio Status Grid"] },
        { name: "Period Filter", controlType: "Data Filter", filterVariable: "__filter_period", targetConsumers: ["Portfolio KPI Row", "Portfolio Status Grid"] },
      ],
      runtimeProofBoundary: "Runtime browser/screenshot proof required; signing, install, and API success are not UI proof.",
      designerTraceabilityRequirements: "Semantic nv_label values required for event portfolio filters, KPI cards, grid-table rows, and actions.",
      desktopBehavior: "Filter/action row above Summary-backed KPI cards and rich Collection grid-table.",
      mobileBehavior: "Filters remain compact, KPI cards stack first, and grid-table rows stack with status, progress, owner, and detail action priority.",
      dashboardSectionTemplates: [
        {
          templateId: "kpi_card_row",
          regionName: "Portfolio KPI Row",
          businessPurpose: "KPI summary metric cards for request portfolio totals, amounts, and completion state.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status", "Progress Rate"],
          filters: ["Status Filter", "Period Filter"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: [],
          requiredControls: ["container", "summary", "text"],
          proofStatus: "runtime-proof-required",
          whyTemplateFits: "Summary-backed KPI cards are required by the Event Portfolio golden reference.",
          marketingEventFidelityReference: "docs/standards/dashboard-summary-card-generation-standard.md",
          kpiSummaryBindingRequirements: {
            source: "Purchase Requests",
            summaryControl: "Hidden Summary controls bind Amount, Status, and Progress Rate metrics",
            metricFields: ["Amount", "Status", "Progress Rate"],
            filters: ["__filter_status", "__filter_period"],
            visibleBinding: "Visible KPI Text binds to Summary temp variables",
          },
          dataFilterRequirements: "Real Data Filter controls write __filter_status and __filter_period variables consumed by Summary cards and Collection grid-table.",
          kpiFormattingRequirements: "Use formatNumber with compact K/M/B and fixed decimals/percent formatting; visible values bind to Summary variables.",
          designerTraceabilityRequirements: "Semantic nv_label for each KPI card and hidden Summary host.",
          runtimeProofBoundary: "Runtime screenshot proof required for visible KPI card values and hidden Summary boundary.",
        },
        {
          templateId: "collection_card_board",
          regionName: "Portfolio Status Grid",
          businessPurpose: "Collection grid-table portfolio operational table for request status review.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status", "Progress Rate", "Requester"],
          filters: ["Status Filter", "Period Filter"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: ["Open Request"],
          requiredControls: ["collection", "container", "dynamic-field", "dynamic-user", "progress"],
          proofStatus: "runtime-proof-required",
          whyTemplateFits: "Event Portfolio rows require a rich Collection grid-table with row-context detail actions.",
          marketingEventFidelityReference: "docs/generated-dashboard-ui-quality-gates.md; docs/reference/yeeflow-control-property-extensions.json",
          dataFilterRequirements: "Real Data Filter variables are consumed by the Collection grid-table data binding.",
          collectionGridTableRequirements: {
            source: "Purchase Requests",
            fields: ["Title", "Amount", "Status", "Progress Rate", "Requester"],
            rowContext: "Current Collection row Purchase Request",
            detailOpenAction: "Open Request detail in slide panel",
          },
          dynamicControlRequirements: "Use Dynamic field controls for Title/Amount/Status, Progress control for Progress Rate, and Dynamic user/person treatment for Requester inside the Collection item template.",
          itemTemplateDynamicControls: ["Dynamic field: Title", "Dynamic field: Status", "Progress: Progress Rate", "Dynamic user: Requester"],
          richTableTreatmentRequirements: "Status fields render as badges, Progress Rate renders as Progress controls, Requester renders with Dynamic user/person/avatar treatment, with table header hierarchy, row density, and polished spacing.",
          actionMetadataRequirements: "Open Request uses real Yeeflow action metadata with actionType open/detail, target View Purchase Request form, and current row context.",
          designerTraceabilityRequirements: "Semantic nv_label for grid-table header, row cells, status badge, progress, person, and Open Request action.",
          runtimeProofBoundary: "Runtime screenshot proof required for rich row treatments and action metadata boundary.",
        },
      ],
      regions: [{
        name: "Portfolio Status Grid",
        controlType: "Collection",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status", "Progress Rate", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  });
  return { ...plan, ...overrides };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "page-function-plan-gates-"));
const results = [];

try {
  let planFile = writeJson(tempDir, "valid-page-plan", pagePlan());
  let output = run("scripts/validate-page-function-plan.mjs", [planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete valid Page Function Plan passes", status: "pass" });
  results.push({ case: "valid dashboard using kpi_card_row plus data_table_section passes", status: "pass" });

  const appFile = writeJson(tempDir, "valid-app-plan", appPlan());
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "complete App Plan to Page Function Plan traceability passes", status: "pass" });

  const missingDashboardPfpRef = appPlan();
  delete missingDashboardPfpRef.dashboards[0].pageFunctionPlanRef;
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", writeJson(tempDir, "missing-dashboard-pfp-ref-app-plan", missingDashboardPfpRef), "--page-function-plan", planFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_REF_MISSING");
  results.push({ case: "App Plan dashboard without Page Function Plan ref fails", status: "pass" });

  const extraDashboardPage = pagePlan();
  extraDashboardPage.dashboards.push({
    name: "Unplanned Dashboard",
    pageFunctionPlanId: "PFP-DASH-UNPLANNED",
    appPlanDashboardRef: "Unplanned Dashboard",
    pagePurpose: "Unplanned page.",
    businessTaskSolved: "No matching App Plan resource.",
    dashboardPagePattern: "standard_dashboard_page_shell",
    dashboardGoldenReference: "none",
    desktopBehavior: "Standard dashboard.",
    mobileBehavior: "Stack sections.",
    dashboardSectionTemplates: [{
      templateId: "kpi_card_row",
      regionName: "Unplanned KPI Row",
      businessPurpose: "KPI metrics for unplanned dashboard.",
      source: "Purchase Requests",
      displayedFields: ["Title"],
      filters: ["All"],
      grouping: ["Status"],
      sorting: ["Created Date descending"],
      actions: [],
      requiredControls: ["container", "summary", "text"],
      proofStatus: "runtime-proof-required",
      whyTemplateFits: "KPI row.",
    }],
    regions: [],
  });
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "extra-dashboard-page-function", extraDashboardPage)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_PAGE_FUNCTION_DASHBOARD_NOT_IN_APP_PLAN");
  results.push({ case: "Page Function Plan dashboard not mapped to App Plan dashboard fails", status: "pass" });

  const goldenInAppPlan = appPlan();
  goldenInAppPlan.dashboards[0].dashboardGoldenReference = "event_portfolio_dashboard_golden_reference";
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", writeJson(tempDir, "golden-in-app-plan", goldenInAppPlan), "--page-function-plan", planFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DASHBOARD_GOLDEN_REFERENCE_IN_APP_PLAN");
  results.push({ case: "Dashboard golden reference declared in App Plan fails", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-dashboard", pagePlan({ dashboards: [] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_MISSING");
  results.push({ case: "missing dashboard page function entry fails", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-approval", pagePlan({ approvalForms: [{ name: "Purchase Approval", submissionForm: null, taskForms: [], printPages: [] }] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_APPROVAL_SUBMISSION_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_TASK_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_PRINT_MISSING");
  results.push({ case: "missing approval submission/task/print entries fail", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "missing-data-form", pagePlan({ dataListForms: [{ resourceName: "Purchase Requests", forms: [] }] }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DATA_LIST_FORM_MISSING");
  results.push({ case: "missing data list form entry fails", status: "pass" });

  const missingApprovalRefs = appPlan();
  delete missingApprovalRefs.approvalForms[0].submissionPageFunctionPlanRef;
  delete missingApprovalRefs.approvalForms[0].taskForms[0].pageFunctionPlanRef;
  delete missingApprovalRefs.approvalForms[0].printPages[0].pageFunctionPlanRef;
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", writeJson(tempDir, "missing-approval-page-function-refs", missingApprovalRefs), "--page-function-plan", planFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_APPROVAL_SUBMISSION_PAGE_FUNCTION_REF_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_TASK_PAGE_FUNCTION_REF_MISSING");
  expectCode(output.report, "TRACEABILITY_APPROVAL_PRINT_PAGE_FUNCTION_REF_MISSING");
  results.push({ case: "App Plan approval surfaces without Page Function Plan refs fail", status: "pass" });

  const missingListRefs = appPlan();
  delete missingListRefs.dataLists[0].forms[0].pageFunctionPlanRef;
  delete missingListRefs.documentLibraries[0].forms[0].pageFunctionPlanRef;
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", writeJson(tempDir, "missing-list-page-function-refs", missingListRefs), "--page-function-plan", planFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_DATA_LIST_FORM_PAGE_FUNCTION_REF_MISSING");
  expectCode(output.report, "TRACEABILITY_DOCUMENT_LIBRARY_FORM_PAGE_FUNCTION_REF_MISSING");
  results.push({ case: "App Plan list and document forms without Page Function Plan refs fail", status: "pass" });

  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "Form Report is correctly not required as UI surface", status: "pass" });

  const badNewEdit = pagePlan();
  badNewEdit.dataListForms[0].forms[0].relatedRegions = [{ name: "Audit Analytics", regionType: "Collection", source: "Purchase Requests" }];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-new-edit", badNewEdit)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_NEW_EDIT_UNRELATED_REGION");
  results.push({ case: "New/Edit dashboard-style related region fails", status: "pass" });

  const missingSubmissionContract = pagePlan();
  delete missingSubmissionContract.approvalForms[0].submissionForm.fields[0].editable;
  delete missingSubmissionContract.approvalForms[0].submissionForm.fields[0].validationBehavior;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-submission-field-contract", missingSubmissionContract)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_APPROVAL_SUBMISSION_FIELD_STATE_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_APPROVAL_SUBMISSION_FIELD_BEHAVIOR_MISSING");
  results.push({ case: "approval submission field without state and behavior contract fails", status: "pass" });

  const badTaskActions = pagePlan();
  badTaskActions.approvalForms[0].taskForms[0].actions = ["Comment"];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-task-actions", badTaskActions)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_APPROVAL_TASK_ACTIONS_MISSING");
  results.push({ case: "approval task form without task-specific actions fails", status: "pass" });

  const badPrintPage = pagePlan();
  badPrintPage.approvalForms[0].printPages[0].content.push({ name: "Approve Button", controlType: "Button", field: "Title" });
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-print-page", badPrintPage)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_APPROVAL_PRINT_INTERACTIVE_CONTROL");
  results.push({ case: "approval print page with unsupported interactive control fails", status: "pass" });

  const badNewEditActions = pagePlan();
  badNewEditActions.dataListForms[0].forms[0].actions = ["Save"];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-new-edit-actions", badNewEditActions)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_NEW_EDIT_SAVE_CANCEL_MISSING");
  results.push({ case: "New/Edit form without Save/Cancel actions fails", status: "pass" });

  const badDocumentBehavior = pagePlan();
  delete badDocumentBehavior.documentLibraryForms[0].forms[0].documentMetadataBehavior;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-document-behavior", badDocumentBehavior)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DOCUMENT_LIBRARY_BEHAVIOR_MISSING");
  results.push({ case: "Document library form without metadata/view behavior fails", status: "pass" });

  const fieldOutsideCurrentListApp = appPlan({
    documentLibraries: [{
      name: "Purchase Documents",
      fields: ["Title", "Status", "Created Date", "Document Category"],
      forms: [{ name: "View Purchase Document", type: "View", pageFunctionPlanRef: "PFP-DOC-PURCHASE-DOCUMENTS-VIEW", fields: ["Title", "Status", "Document Category"], actions: ["Open Document"] }],
    }],
  });
  const fieldOutsideCurrentListPlan = pagePlan();
  fieldOutsideCurrentListPlan.dataListForms[0].forms[0].fields.push({ name: "Document Category", controlType: "Text", field: "Document Category" });
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", writeJson(tempDir, "field-outside-current-list-app", fieldOutsideCurrentListApp), "--page-function-plan", writeJson(tempDir, "field-outside-current-list-plan", fieldOutsideCurrentListPlan)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_NEW_EDIT_FIELD_OUTSIDE_CURRENT_RESOURCE");
  results.push({ case: "New/Edit form field outside current list/library fails", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [planFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "View form related Data table region with source/binding/actions passes", status: "pass" });

  const validQuickActions = pagePlan();
  validQuickActions.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [
    openRequestAction(),
    addPurchaseRequestAction(),
    openApprovalAction(),
  ];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-dashboard-quick-actions", validQuickActions), "--app-plan", appFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid Dashboard quick actions with Open dashboard/Add list item/Open approval form pass", status: "pass" });

  const missingVisibleBinding = pagePlan();
  missingVisibleBinding.dashboards[0].dashboardSectionTemplates[1].interactiveControls = [{ controlLabel: "Unplanned Action", controlType: "Container" }];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-visible-container-binding", missingVisibleBinding)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_BINDING_MISSING");
  results.push({ case: "visible interactive Container without action binding fails", status: "pass" });

  const intentionallyStatic = pagePlan();
  intentionallyStatic.dashboards[0].dashboardSectionTemplates[1].interactiveControls = [{ controlLabel: "Static KPI Legend", controlType: "Button", nonInteractive: true, nonInteractiveReason: "Visual label only; rendered as non-clickable text if generation cannot bind safely." }];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "static-interactive-looking-control", intentionallyStatic)]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "intentionally static action-looking control with nonInteractive reason passes", status: "pass" });

  const proseOnlyAction = pagePlan();
  proseOnlyAction.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "prose-only-click-action", proseOnlyAction)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_PROSE_ONLY");
  results.push({ case: "action label implying click without structured metadata fails", status: "pass" });

  const badAddAction = pagePlan();
  badAddAction.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [addPurchaseRequestAction({ requiredTargetIdentifiers: { ListID: "" }, layout: "" })];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-add-list-action", badAddAction), "--app-plan", appFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_ADD_LIST_ID_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_ADD_LAYOUT_MISSING");
  results.push({ case: "Add list item missing target list/layout fails", status: "pass" });

  const badDashboardAction = pagePlan();
  badDashboardAction.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [openRequestAction({ targetResourceName: "", requiredTargetIdentifiers: {}, proofStatus: "planned" })];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-open-dashboard-action", badDashboardAction), "--app-plan", appFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_TARGET_NAME_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_DASHBOARD_PAGE_ID_MISSING");
  results.push({ case: "Open dashboard missing target Dashboard/PageID fails", status: "pass" });

  const badApprovalAction = pagePlan();
  badApprovalAction.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [openApprovalAction({ targetResourceName: "", requiredTargetIdentifiers: {}, proofStatus: "planned" })];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-open-approval-action", badApprovalAction), "--app-plan", appFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_TARGET_NAME_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_APPROVAL_PROCKEY_MISSING");
  results.push({ case: "Open approval form missing target Approval/ProcKey fails", status: "pass" });

  const badFormAction = pagePlan();
  badFormAction.approvalForms[0].submissionForm.interactiveActions = [{
    controlLabel: "Custom Validate",
    controlType: "Button",
    interactionPurpose: "Run custom validation before submit.",
    actionType: "Form action binding",
    actionTypeCode: "1",
    targetResourceType: "Form action",
    targetResourceName: "Missing Custom Validate",
    formActionName: "Missing Custom Validate",
    openMode: "default",
    proofStatus: "planned",
  }];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-form-action-binding", badFormAction), "--app-plan", appFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_FORM_ACTION_UNKNOWN");
  results.push({ case: "Form action binding referencing missing form action fails", status: "pass" });

  const badTypeAndMode = pagePlan();
  badTypeAndMode.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [openRequestAction({ actionType: "Teleport", actionTypeCode: "77", openMode: "drawer" })];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-action-type-mode", badTypeAndMode)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_TYPE_UNSUPPORTED");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_OPEN_MODE_UNSUPPORTED");
  results.push({ case: "invented action type and open mode fail", status: "pass" });

  const badReference = pagePlan();
  badReference.dashboards[0].dashboardSectionTemplates[1].interactiveActions = [addPurchaseRequestAction({ passValues: [{ field: "Unknown Field", value: "X" }] })];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-action-reference", badReference), "--app-plan", appFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_CLICK_ACTION_REFERENCE_UNKNOWN");
  results.push({ case: "click action passValues referencing unknown App Plan field fails", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-kanban-dashboard", pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Status board dashboard for triage queues.",
      businessTaskSolved: "Managers triage requests by status lane.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      desktopBehavior: "Kanban board with actions.",
      mobileBehavior: "Stacks lanes into vertical status groups.",
      dashboardSectionTemplates: [{
        templateId: "kanban_status_board",
        regionName: "Request Status Board",
        businessPurpose: "Kanban status board for request triage.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["kanban", "container", "text", "dynamic-field"],
        proofStatus: "runtime-proven",
        whyTemplateFits: "Status lanes are the intended use for kanban_status_board.",
      }],
      regions: [{
        name: "Request Status Board",
        controlType: "Kanban",
        source: "Purchase Requests",
        fields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  }))]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid dashboard using kanban_status_board passes", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-three-column-dashboard", pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Three column review queue workspace for request triage.",
      businessTaskSolved: "Managers work a list-detail review queue with context and actions.",
      dashboardPagePattern: "three_column_workspace_shell",
      desktopBehavior: "Left filters, main request queue, right selected request detail.",
      mobileBehavior: "Panels stack as filters, queue, then detail.",
      threeColumnPanels: {
        left: { purpose: "Queue filters", source: "Purchase Requests", content: ["Status filters", "Requester filters"] },
        main: { purpose: "Request queue", source: "Purchase Requests", content: ["Request cards", "Open Request action"] },
        right: { purpose: "Selected request detail", source: "Purchase Requests", content: ["Amount", "Requester", "Manager Comment"] },
      },
      dashboardSectionTemplates: [{
        templateId: "three_column_workspace_shell",
        regionName: "Manager Review Workspace",
        businessPurpose: "Three column workspace for list-detail triage.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Amount", "Status", "Requester"],
        filters: ["Status is not Completed"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["container", "heading", "icon"],
        proofStatus: "export-proven",
        whyTemplateFits: "The page needs left context, main work queue, and right detail panels.",
      }],
      regions: [{
        name: "Manager Review Workspace",
        controlType: "Container",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  }))]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid three_column_workspace_shell with meaningful panels passes", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-event-portfolio-fidelity", addEventPortfolioFidelity(pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "High-quality Event Portfolio operational table dashboard for request portfolio status.",
      businessTaskSolved: "Managers review portfolio status metrics, filtered work, and actionable request rows.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      desktopBehavior: "KPI row above a rich Collection grid-table.",
      mobileBehavior: "KPI cards stack first, filters remain compact, and portfolio rows stack with priority fields.",
      dashboardSectionTemplates: [
        {
          templateId: "kpi_card_row",
          regionName: "Portfolio KPI Row",
          businessPurpose: "KPI summary metrics for portfolio request totals and amounts.",
          source: "Purchase Requests",
          displayedFields: ["Amount", "Status"],
          filters: ["Current fiscal period", "Status filter"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: [],
          requiredControls: ["container", "summary", "text"],
          proofStatus: "runtime-proof-required",
          whyTemplateFits: "The section needs a Summary-backed KPI card row.",
        },
        {
          templateId: "collection_card_board",
          regionName: "Portfolio Status Grid",
          businessPurpose: "Collection grid-table portfolio operational table with rich status rows.",
          source: "Purchase Requests",
          displayedFields: ["Title", "Amount", "Status", "Requester"],
          filters: ["Status is not Completed"],
          grouping: ["Status"],
          sorting: ["Created Date descending"],
          actions: ["Open Request"],
          requiredControls: ["collection", "container", "dynamic-field", "progress", "dynamic-user"],
          proofStatus: "runtime-proof-required",
          whyTemplateFits: "A Collection grid-table supports rich row treatment with row-context actions.",
        },
      ],
      regions: [{
        name: "Portfolio Status Grid",
        controlType: "Collection",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  })))]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid Event Portfolio-style dashboard fidelity requirements pass", status: "pass" });

  const missingFidelityRef = addEventPortfolioFidelity(pagePlan());
  delete missingFidelityRef.dashboards[0].marketingEventFidelityReference;
  delete missingFidelityRef.dashboards[0].dashboardSectionTemplates[0].marketingEventFidelityReference;
  delete missingFidelityRef.dashboards[0].dashboardSectionTemplates[1].marketingEventFidelityReference;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-dashboard-fidelity-reference", missingFidelityRef)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_FIDELITY_REFERENCE_MISSING");
  results.push({ case: "high-quality dashboard missing fidelity reference fails", status: "pass" });

  const missingKpiBinding = addEventPortfolioFidelity(pagePlan());
  delete missingKpiBinding.dashboards[0].dashboardSectionTemplates[0].kpiSummaryBindingRequirements;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-kpi-summary-binding", missingKpiBinding)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_KPI_SUMMARY_BINDING_MISSING");
  results.push({ case: "high-quality KPI section missing Summary binding plan fails", status: "pass" });

  const missingFilterAction = addEventPortfolioFidelity(pagePlan());
  delete missingFilterAction.dashboards[0].dashboardSectionTemplates[1].dataFilterRequirements;
  delete missingFilterAction.dashboards[0].dashboardSectionTemplates[1].actionMetadataRequirements;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-filter-action-plan", missingFilterAction)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_DATA_FILTER_REQUIREMENTS_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_ACTION_METADATA_MISSING");
  results.push({ case: "high-quality Dashboard missing filter/action plan fails", status: "pass" });

  const missingRichTable = addEventPortfolioFidelity(pagePlan());
  delete missingRichTable.dashboards[0].dashboardSectionTemplates[1].richTableTreatmentRequirements;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-rich-table-treatment", missingRichTable)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_RICH_TABLE_TREATMENT_MISSING");
  results.push({ case: "Event Portfolio-style operational table missing rich treatment fails", status: "pass" });

  const missingCollectionGrid = addEventPortfolioFidelity(pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "High-quality Event Portfolio operational table dashboard.",
      businessTaskSolved: "Managers review request portfolio rows.",
      dashboardPagePattern: "standard_dashboard_page_shell",
      desktopBehavior: "Collection grid-table.",
      mobileBehavior: "Rows stack with priority fields.",
      dashboardSectionTemplates: [{
        templateId: "collection_card_board",
        regionName: "Portfolio Status Grid",
        businessPurpose: "Collection grid-table portfolio operational table.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["collection", "container", "dynamic-user"],
        proofStatus: "runtime-proof-required",
        whyTemplateFits: "Collection grid-table supports row-context actions.",
      }],
      regions: [{
        name: "Portfolio Status Grid",
        controlType: "Collection",
        source: "Purchase Requests",
        fields: ["Title", "Status", "Requester"],
        filters: ["Status is not Completed"],
        actions: ["Open Request"],
      }],
    }],
  }));
  delete missingCollectionGrid.dashboards[0].dashboardSectionTemplates[0].collectionGridTableRequirements;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "missing-collection-grid-requirements", missingCollectionGrid)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_COLLECTION_GRID_TABLE_REQUIREMENTS_MISSING");
  results.push({ case: "Collection grid-table missing source/row-context/open-action requirements fails", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "valid-event-portfolio-golden-reference", eventPortfolioGoldenPlan())]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid Event Portfolio Dashboard golden reference passes", status: "pass" });

  const staticKpiOnly = eventPortfolioGoldenPlan();
  staticKpiOnly.dashboards[0].dashboardSectionTemplates = [staticKpiOnly.dashboards[0].dashboardSectionTemplates[0]];
  staticKpiOnly.dashboards[0].dashboardSectionTemplates[0].kpiSummaryBindingRequirements = "Static KPI cards only; no Summary binding.";
  staticKpiOnly.dashboards[0].notes = "Use generic cards and static KPI values.";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "event-portfolio-static-kpi-only", staticKpiOnly)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_STATIC_OR_SCAFFOLD");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_COLLECTION_GRID_TABLE_MISSING");
  results.push({ case: "invalid Event Portfolio golden reference with static KPI cards only fails", status: "pass" });

  const plainDataTable = eventPortfolioGoldenPlan();
  plainDataTable.dashboards[0].dashboardSectionTemplates[1].templateId = "data_table_section";
  plainDataTable.dashboards[0].dashboardSectionTemplates[1].requiredControls = ["data-list"];
  plainDataTable.dashboards[0].dashboardSectionTemplates[1].businessPurpose = "Plain table record list for portfolio status.";
  plainDataTable.dashboards[0].dashboardSectionTemplates[1].whyTemplateFits = "A plain table lists records.";
  delete plainDataTable.dashboards[0].dashboardSectionTemplates[1].collectionGridTableRequirements;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "event-portfolio-plain-data-table", plainDataTable)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_COLLECTION_GRID_TABLE_MISSING");
  results.push({ case: "invalid Event Portfolio golden reference with plain Data table fails", status: "pass" });

  const missingDynamicControls = eventPortfolioGoldenPlan();
  delete missingDynamicControls.dashboards[0].dashboardSectionTemplates[1].dynamicControlRequirements;
  delete missingDynamicControls.dashboards[0].dashboardSectionTemplates[1].itemTemplateDynamicControls;
  missingDynamicControls.dashboards[0].dashboardSectionTemplates[1].requiredControls = ["collection", "container", "text"];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "event-portfolio-missing-dynamic-controls", missingDynamicControls)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_DYNAMIC_CONTROLS_MISSING");
  results.push({ case: "invalid Event Portfolio golden reference missing Dynamic controls fails", status: "pass" });

  const fakeActions = eventPortfolioGoldenPlan();
  fakeActions.dashboards[0].dashboardSectionTemplates[1].actions = ["Fake Open Button"];
  fakeActions.dashboards[0].dashboardSectionTemplates[1].actionMetadataRequirements = "Visual only without target or row context.";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "event-portfolio-fake-actions", fakeActions)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_ACTION_METADATA_MISSING");
  results.push({ case: "invalid Event Portfolio golden reference with unbound/fake actions fails", status: "pass" });

  const missingProofBoundary = eventPortfolioGoldenPlan();
  delete missingProofBoundary.dashboards[0].runtimeProofBoundary;
  delete missingProofBoundary.dashboards[0].dashboardSectionTemplates[0].runtimeProofBoundary;
  delete missingProofBoundary.dashboards[0].dashboardSectionTemplates[1].runtimeProofBoundary;
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "event-portfolio-missing-proof-boundary", missingProofBoundary)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_PROOF_BOUNDARY_MISSING");
  results.push({ case: "invalid Event Portfolio golden reference without proof boundary fails", status: "pass" });

  const unknownTemplate = pagePlan();
  unknownTemplate.dashboards[0].dashboardSectionTemplates[0].templateId = "executive_magic_template";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "unknown-template", unknownTemplate)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_GENERIC_OR_UNKNOWN");
  results.push({ case: "invalid dashboard with unknown templateId fails", status: "pass" });

  const noSectionTemplates = pagePlan();
  noSectionTemplates.dashboards[0].dashboardSectionTemplates = [];
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "no-section-templates", noSectionTemplates)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_SECTION_TEMPLATES_MISSING");
  results.push({ case: "invalid dashboard with no section templates fails", status: "pass" });

  const incompatibleTemplate = pagePlan();
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].templateId = "business_alert_card";
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].businessPurpose = "KPI metric row for totals";
  incompatibleTemplate.dashboards[0].dashboardSectionTemplates[0].whyTemplateFits = "This is a metric row";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "incompatible-template", incompatibleTemplate)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PURPOSE_INCOMPATIBLE");
  results.push({ case: "invalid dashboard with incompatible template purpose fails", status: "pass" });

  const badThreeColumn = pagePlan({
    dashboards: [{
      name: "Operations Dashboard",
      pagePurpose: "Simple dashboard overview.",
      businessTaskSolved: "Show a few metrics.",
      dashboardPagePattern: "three_column_workspace_shell",
      desktopBehavior: "Three columns.",
      mobileBehavior: "Stacked.",
      dashboardSectionTemplates: [{
        templateId: "three_column_workspace_shell",
        regionName: "Simple Overview",
        businessPurpose: "Three column workspace shell.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Status"],
        filters: ["All"],
        grouping: [],
        sorting: ["Created Date descending"],
        actions: ["Open Request"],
        requiredControls: ["container", "heading", "icon"],
        proofStatus: "export-proven",
        whyTemplateFits: "Uses three columns.",
      }],
      regions: [{
        name: "Simple Overview",
        controlType: "Container",
        source: "Purchase Requests",
        fields: ["Title", "Status"],
        filters: ["All"],
        actions: ["Open Request"],
      }],
    }],
  });
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "bad-three-column", badThreeColumn)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_THREE_COLUMN_LEFT_PANEL_MISSING");
  expectCode(output.report, "PAGE_FUNCTION_THREE_COLUMN_SIMPLE_DASHBOARD_INVALID");
  results.push({ case: "invalid three_column_workspace_shell without meaningful panels fails", status: "pass" });

  const proseOnly = pagePlan();
  proseOnly.dashboards[0].dashboardPagePattern = "";
  proseOnly.dashboards[0].dashboardSectionTemplates = [];
  proseOnly.dashboards[0].notes = "Use kpi_card_row and data_table_section templates.";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "prose-only-template", proseOnly)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_TEMPLATE_PROSE_ONLY");
  results.push({ case: "invalid prose-only template mention without structured fields fails", status: "pass" });

  const proseOnlyGolden = pagePlan();
  proseOnlyGolden.dashboards[0].dashboardGoldenReference = "";
  proseOnlyGolden.dashboards[0].notes = "Use the Event Portfolio dashboard golden reference.";
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "prose-only-golden-reference", proseOnlyGolden)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_PROSE_ONLY");
  results.push({ case: "invalid prose-only Dashboard golden reference mention fails", status: "pass" });

  const goldenOutsideDashboardEntry = pagePlan({ dashboardGoldenReference: "event_portfolio_dashboard_golden_reference" });
  output = run("scripts/validate-page-function-plan.mjs", [writeJson(tempDir, "golden-outside-dashboard-entry", goldenOutsideDashboardEntry)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_GOLDEN_REFERENCE_OUTSIDE_DASHBOARD_ENTRY");
  results.push({ case: "Dashboard golden reference outside structured Dashboard entry fails", status: "pass" });

  const badRefs = pagePlan();
  badRefs.dashboards[0].regions[0].controlType = "Magic Board";
  badRefs.dashboards[0].regions[0].fields.push("Ghost Field");
  output = run("scripts/validate-app-plan-page-function-traceability.mjs", ["--app-plan", appFile, "--page-function-plan", writeJson(tempDir, "unsupported-and-ghost", badRefs)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "TRACEABILITY_UNSUPPORTED_CONTROL");
  expectCode(output.report, "TRACEABILITY_FIELD_NOT_IN_APP_PLAN");
  results.push({ case: "unsupported controls and fields not in App Plan fail", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
