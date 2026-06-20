#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SUPPORTED_CONTROLS = new Set([
  "Alert",
  "Button",
  "Collection",
  "Container",
  "Data Filter",
  "Data table",
  "Document embed",
  "Dynamic field",
  "Dynamic file",
  "Dynamic image",
  "Dynamic user",
  "Flex Grid",
  "Gauge",
  "Heading",
  "Horizontal timeline",
  "Kanban",
  "Line chart",
  "Pie chart",
  "Pivot table",
  "Progress",
  "QR Code",
  "Sub List",
  "Summary",
  "Tabs",
  "Text",
  "Vertical timeline",
]);

const DEFERRED = /\b(runtime-proof-required|export-learning-required|deferred)\b/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-app-plan-page-function-traceability.mjs --app-plan <app-plan.json> --page-function-plan <page-function-plan.json> [--json]",
    "",
    "Validates App Plan to Page Function Plan coverage and reference integrity. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function norm(value) {
  return safeString(value).trim().toLowerCase();
}

function addNames(set, values) {
  for (const value of asArray(values)) {
    if (typeof value === "string") set.add(norm(value));
    else if (value && typeof value === "object") set.add(norm(value.name || value.title || value.fieldName || value.actionName));
  }
}

function collectAppPlan(appPlan) {
  const dataLists = asArray(appPlan.dataLists);
  const documentLibraries = asArray(appPlan.documentLibraries);
  const approvalForms = asArray(appPlan.approvalForms);
  const dashboards = asArray(appPlan.dashboards);
  const fields = new Set();
  const fieldsBySource = new Map();
  const actions = new Set();
  const sources = new Set();

  for (const source of [...dataLists, ...documentLibraries]) {
    sources.add(norm(source.name));
    addNames(fields, source.fields);
    const sourceFields = new Set();
    addNames(sourceFields, source.fields);
    for (const form of asArray(source.forms)) {
      addNames(fields, form.fields);
      addNames(sourceFields, form.fields);
      addNames(actions, form.actions);
    }
    fieldsBySource.set(norm(source.name), sourceFields);
  }
  for (const approval of approvalForms) {
    sources.add(norm(approval.name));
    addNames(fields, approval.fields);
    addNames(actions, approval.actions);
    for (const task of asArray(approval.taskForms)) addNames(actions, task.actions);
  }
  for (const dashboard of dashboards) {
    sources.add(norm(dashboard.name));
    addNames(actions, dashboard.actions);
  }

  return {
    dashboards,
    approvalForms,
    dataLists,
    documentLibraries,
    fields,
    fieldsBySource,
    actions,
    sources,
  };
}

function findByName(items, name) {
  return asArray(items).find((item) =>
    norm(item.name) === norm(name)
    || norm(item.resourceName) === norm(name)
    || norm(item.appPlanDashboardRef) === norm(name)
    || norm(item.appPlanResourceName) === norm(name),
  );
}

function dashboardPageFunctionRef(dashboard) {
  return safeString(
    dashboard.pageFunctionPlanRef
      || dashboard.dashboardFunctionRef
      || dashboard.pageFunctionRef
      || dashboard.pfpRef,
  ).trim();
}

function pageFunctionId(page) {
  return safeString(
    page.pageFunctionPlanId
      || page.pageFunctionId
      || page.id
      || page.pfpId,
  ).trim();
}

function appPlanSurfaceRef(surface) {
  return safeString(
    surface.appPlanApprovalRef
      || surface.appPlanResourceRef
      || surface.appPlanResourceName
      || surface.appPlanListRef
      || surface.appPlanLibraryRef
      || surface.resourceName
      || surface.approvalFormName
      || surface.name,
  ).trim();
}

function formPageFunctionRef(form) {
  return safeString(
    form.pageFunctionPlanRef
      || form.pageFunctionRef
      || form.pfpRef
      || form.submissionPageFunctionPlanRef
      || form.taskPageFunctionPlanRef
      || form.printPageFunctionPlanRef
      || form.dashboardFunctionRef,
  ).trim();
}

function appPlanDashboardRef(page) {
  return safeString(
    page.appPlanDashboardRef
      || page.appPlanDashboardName
      || page.appPlanResourceName
      || page.name,
  ).trim();
}

function containsDashboardGoldenReference(value) {
  return /\b(dashboardGoldenReference|event_portfolio_dashboard_golden_reference|portfolio_operational_dashboard_golden_reference|dashboard golden reference)\b/i.test(JSON.stringify(value || {}));
}

function formNames(resource) {
  return asArray(resource.forms).map((form) => norm(form.name));
}

function findForm(resource, name) {
  return asArray(resource?.forms).find((form) => norm(form.name) === norm(name));
}

function submissionPageFunctionRef(approval) {
  return safeString(
    approval.submissionPageFunctionPlanRef
      || approval.submissionForm?.pageFunctionPlanRef
      || approval.submissionFormPageFunctionPlanRef
      || approval.pageFunctionPlanRef,
  ).trim();
}

function collectPageRefs(pagePlan) {
  return {
    dashboards: asArray(pagePlan.dashboards),
    approvalForms: asArray(pagePlan.approvalForms),
    dataListForms: asArray(pagePlan.dataListForms),
    documentLibraryForms: asArray(pagePlan.documentLibraryForms),
  };
}

function validateCoverage(app, pages, findings) {
  for (const dashboard of app.dashboards) {
    const ref = dashboardPageFunctionRef(dashboard);
    if (!ref) {
      findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_REF_MISSING", resource: dashboard.name, message: "Every App Plan dashboard page must reference a Page Function Plan entry using pageFunctionPlanRef, dashboardFunctionRef, or equivalent stable reference ID." });
    }
    const pageDashboard = findByName(pages.dashboards, dashboard.name);
    if (!pageDashboard) {
      findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_MISSING", resource: dashboard.name, message: "Every App Plan dashboard page must have a Page Function Plan entry." });
    } else {
      const pfpId = pageFunctionId(pageDashboard);
      if (!pfpId) {
        findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_ID_MISSING", resource: dashboard.name, message: "Every Page Function Plan dashboard entry must include pageFunctionPlanId or equivalent stable ID." });
      }
      if (ref && pfpId && norm(ref) !== norm(pfpId)) {
        findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_REF_MISMATCH", resource: dashboard.name, pageFunctionPlanRef: ref, pageFunctionPlanId: pfpId, message: "App Plan dashboard pageFunctionPlanRef must match the Page Function Plan dashboard pageFunctionPlanId." });
      }
      const appRef = appPlanDashboardRef(pageDashboard);
      if (!appRef || norm(appRef) !== norm(dashboard.name)) {
        findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_APP_PLAN_REF_MISMATCH", resource: dashboard.name, pageFunctionPlanEntry: pageDashboard.name, appPlanDashboardRef: appRef, message: "Page Function Plan dashboard entry must map back to the App Plan Dashboard page by stable name." });
      }
    }
    if (containsDashboardGoldenReference(dashboard)) {
      findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_GOLDEN_REFERENCE_IN_APP_PLAN", resource: dashboard.name, message: "Dashboard golden reference selection belongs only in the structured Page Function Plan dashboard entry, not in the App Plan." });
    }
  }

  for (const pageDashboard of pages.dashboards) {
    const appRef = appPlanDashboardRef(pageDashboard);
    if (!app.dashboards.some((dashboard) => norm(dashboard.name) === norm(appRef))) {
      findings.push({ level: "error", code: "TRACEABILITY_PAGE_FUNCTION_DASHBOARD_NOT_IN_APP_PLAN", pageFunctionPlanEntry: pageDashboard.name, appPlanDashboardRef: appRef, message: "Page Function Plan dashboard entry must map back to an App Plan Dashboard page." });
    }
  }

  for (const approval of app.approvalForms) {
    const pageApproval = findByName(pages.approvalForms, approval.name);
    if (!pageApproval?.submissionForm) {
      findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_SUBMISSION_MISSING", approvalForm: approval.name, message: "Every Approval form submission form must have a Page Function Plan entry." });
    } else {
      const appRef = appPlanSurfaceRef(pageApproval);
      if (!appRef || norm(appRef) !== norm(approval.name)) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_APP_PLAN_REF_MISMATCH", approvalForm: approval.name, appPlanRef: appRef, message: "Page Function Plan approval entry must map back to the App Plan approval form by stable name." });
      }
      const expectedSubmissionRef = submissionPageFunctionRef(approval);
      if (!expectedSubmissionRef) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_SUBMISSION_PAGE_FUNCTION_REF_MISSING", approvalForm: approval.name, message: "Every App Plan approval submission surface must reference a Page Function Plan entry." });
      }
      const actualSubmissionId = pageFunctionId(pageApproval.submissionForm);
      if (!actualSubmissionId) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_SUBMISSION_PAGE_FUNCTION_ID_MISSING", approvalForm: approval.name, message: "Every Page Function Plan approval submission entry must include pageFunctionPlanId." });
      }
      if (expectedSubmissionRef && actualSubmissionId && norm(expectedSubmissionRef) !== norm(actualSubmissionId)) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_SUBMISSION_REF_MISMATCH", approvalForm: approval.name, pageFunctionPlanRef: expectedSubmissionRef, pageFunctionPlanId: actualSubmissionId, message: "App Plan approval submission Page Function Plan reference must match the Page Function Plan submission pageFunctionPlanId." });
      }
    }
    for (const task of asArray(approval.taskForms)) {
      const pageTask = asArray(pageApproval?.taskForms).find((candidate) => norm(candidate.name) === norm(task.name));
      if (!pageTask) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_TASK_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Every planned task form must have a Page Function Plan entry." });
      } else {
        const expectedRef = formPageFunctionRef(task);
        if (!expectedRef) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_TASK_PAGE_FUNCTION_REF_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Every App Plan approval task form must reference a Page Function Plan entry." });
        }
        const actualId = pageFunctionId(pageTask);
        if (!actualId) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_TASK_PAGE_FUNCTION_ID_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Every Page Function Plan approval task form entry must include pageFunctionPlanId." });
        }
        if (expectedRef && actualId && norm(expectedRef) !== norm(actualId)) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_TASK_REF_MISMATCH", approvalForm: approval.name, taskForm: task.name, pageFunctionPlanRef: expectedRef, pageFunctionPlanId: actualId, message: "App Plan approval task Page Function Plan reference must match the Page Function Plan task pageFunctionPlanId." });
        }
      }
    }
    for (const printPage of asArray(approval.printPages)) {
      const pagePrint = asArray(pageApproval?.printPages).find((candidate) => norm(candidate.name) === norm(printPage.name));
      if (!pagePrint) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_PRINT_MISSING", approvalForm: approval.name, printPage: printPage.name, message: "Every required print page must have a Page Function Plan entry." });
      } else {
        const expectedRef = formPageFunctionRef(printPage);
        if (!expectedRef) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_PRINT_PAGE_FUNCTION_REF_MISSING", approvalForm: approval.name, printPage: printPage.name, message: "Every App Plan approval print page must reference a Page Function Plan entry." });
        }
        const actualId = pageFunctionId(pagePrint);
        if (!actualId) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_PRINT_PAGE_FUNCTION_ID_MISSING", approvalForm: approval.name, printPage: printPage.name, message: "Every Page Function Plan approval print page entry must include pageFunctionPlanId." });
        }
        if (expectedRef && actualId && norm(expectedRef) !== norm(actualId)) {
          findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_PRINT_REF_MISMATCH", approvalForm: approval.name, printPage: printPage.name, pageFunctionPlanRef: expectedRef, pageFunctionPlanId: actualId, message: "App Plan approval print Page Function Plan reference must match the Page Function Plan print pageFunctionPlanId." });
        }
      }
    }
  }

  for (const pageApproval of pages.approvalForms) {
    const appRef = appPlanSurfaceRef(pageApproval);
    if (!app.approvalForms.some((approval) => norm(approval.name) === norm(appRef))) {
      findings.push({ level: "error", code: "TRACEABILITY_PAGE_FUNCTION_APPROVAL_NOT_IN_APP_PLAN", approvalForm: pageApproval.name, appPlanRef: appRef, message: "Page Function Plan approval entry must map back to an App Plan approval form." });
    }
  }

  for (const list of app.dataLists) {
    const pageResource = findByName(pages.dataListForms, list.name);
    for (const form of asArray(list.forms)) {
      const pageForm = findForm(pageResource || {}, form.name);
      if (!pageForm) {
        findings.push({ level: "error", code: "TRACEABILITY_DATA_LIST_FORM_MISSING", resource: list.name, form: form.name, message: "Every planned custom Data list form must have a Page Function Plan entry." });
      } else {
        const expectedRef = formPageFunctionRef(form);
        if (!expectedRef) {
          findings.push({ level: "error", code: "TRACEABILITY_DATA_LIST_FORM_PAGE_FUNCTION_REF_MISSING", resource: list.name, form: form.name, message: "Every App Plan Data list form must reference a Page Function Plan entry." });
        }
        const actualId = pageFunctionId(pageForm);
        if (!actualId) {
          findings.push({ level: "error", code: "TRACEABILITY_DATA_LIST_FORM_PAGE_FUNCTION_ID_MISSING", resource: list.name, form: form.name, message: "Every Page Function Plan Data list form entry must include pageFunctionPlanId." });
        }
        if (expectedRef && actualId && norm(expectedRef) !== norm(actualId)) {
          findings.push({ level: "error", code: "TRACEABILITY_DATA_LIST_FORM_REF_MISMATCH", resource: list.name, form: form.name, pageFunctionPlanRef: expectedRef, pageFunctionPlanId: actualId, message: "App Plan Data list form Page Function Plan reference must match the Page Function Plan form pageFunctionPlanId." });
        }
      }
    }
  }

  for (const library of app.documentLibraries) {
    const pageResource = findByName(pages.documentLibraryForms, library.name);
    for (const form of asArray(library.forms)) {
      const pageForm = findForm(pageResource || {}, form.name);
      if (!pageForm) {
        findings.push({ level: "error", code: "TRACEABILITY_DOCUMENT_LIBRARY_FORM_MISSING", resource: library.name, form: form.name, message: "Every planned Document library form must have a Page Function Plan entry." });
      } else {
        const expectedRef = formPageFunctionRef(form);
        if (!expectedRef) {
          findings.push({ level: "error", code: "TRACEABILITY_DOCUMENT_LIBRARY_FORM_PAGE_FUNCTION_REF_MISSING", resource: library.name, form: form.name, message: "Every App Plan Document library form must reference a Page Function Plan entry." });
        }
        const actualId = pageFunctionId(pageForm);
        if (!actualId) {
          findings.push({ level: "error", code: "TRACEABILITY_DOCUMENT_LIBRARY_FORM_PAGE_FUNCTION_ID_MISSING", resource: library.name, form: form.name, message: "Every Page Function Plan Document library form entry must include pageFunctionPlanId." });
        }
        if (expectedRef && actualId && norm(expectedRef) !== norm(actualId)) {
          findings.push({ level: "error", code: "TRACEABILITY_DOCUMENT_LIBRARY_FORM_REF_MISMATCH", resource: library.name, form: form.name, pageFunctionPlanRef: expectedRef, pageFunctionPlanId: actualId, message: "App Plan Document library form Page Function Plan reference must match the Page Function Plan form pageFunctionPlanId." });
        }
      }
    }
  }

  for (const [resourceType, pageResources, appResources, code] of [
    ["Data list", pages.dataListForms, app.dataLists, "TRACEABILITY_PAGE_FUNCTION_DATA_LIST_NOT_IN_APP_PLAN"],
    ["Document library", pages.documentLibraryForms, app.documentLibraries, "TRACEABILITY_PAGE_FUNCTION_DOCUMENT_LIBRARY_NOT_IN_APP_PLAN"],
  ]) {
    for (const pageResource of pageResources) {
      const appRef = appPlanSurfaceRef(pageResource);
      if (!appResources.some((resource) => norm(resource.name) === norm(appRef))) {
        findings.push({ level: "error", code, resource: pageResource.resourceName, resourceType, appPlanRef: appRef, message: "Page Function Plan form resource group must map back to an App Plan resource." });
      }
    }
  }
}

function refsFromPagePlan(pagePlan) {
  const refs = [];
  for (const dashboard of asArray(pagePlan.dashboards)) {
    for (const region of asArray(dashboard.regions)) refs.push({ context: `dashboard:${dashboard.name}:${region.name}`, ...region });
  }
  for (const approval of asArray(pagePlan.approvalForms)) {
    for (const field of asArray(approval.submissionForm?.fields)) refs.push({ context: `approval:${approval.name}:submission:${field.name}`, ...field });
    for (const action of asArray(approval.submissionForm?.actions)) refs.push({ context: `approval:${approval.name}:submission:action:${action}`, action });
    for (const task of asArray(approval.taskForms)) {
      for (const field of asArray(task.fields)) refs.push({ context: `approval:${approval.name}:task:${task.name}:${field.name}`, ...field });
      for (const action of asArray(task.actions)) refs.push({ context: `approval:${approval.name}:task:${task.name}:action:${action}`, action });
    }
    for (const page of asArray(approval.printPages)) {
      for (const item of asArray(page.content)) refs.push({ context: `approval:${approval.name}:print:${page.name}:${item.name}`, ...item });
    }
  }
  for (const resource of [...asArray(pagePlan.dataListForms), ...asArray(pagePlan.documentLibraryForms)]) {
    for (const form of asArray(resource.forms)) {
      for (const field of asArray(form.fields)) refs.push({ context: `form:${resource.resourceName}:${form.name}:${field.name}`, ...field, formType: form.type, source: resource.resourceName });
      for (const action of asArray(form.actions)) refs.push({ context: `form:${resource.resourceName}:${form.name}:action:${action}`, action, formType: form.type, source: resource.resourceName });
      for (const region of asArray(form.relatedRegions)) refs.push({ context: `form:${resource.resourceName}:${form.name}:related:${region.name}`, ...region });
    }
  }
  return refs;
}

function validateReferences(app, pagePlan, findings) {
  for (const ref of refsFromPagePlan(pagePlan)) {
    const control = safeString(ref.controlType || ref.regionType).trim();
    if (control && !DEFERRED.test(control) && !SUPPORTED_CONTROLS.has(control)) {
      findings.push({ level: "error", code: "TRACEABILITY_UNSUPPORTED_CONTROL", context: ref.context, value: control, message: "Page Function Plan references an unsupported control." });
    }
    for (const field of asArray(ref.fields || ref.field ? ref.fields || [ref.field] : [])) {
      if (safeString(field).trim() && !app.fields.has(norm(field))) {
        findings.push({ level: "error", code: "TRACEABILITY_FIELD_NOT_IN_APP_PLAN", context: ref.context, field, message: "Page Function Plan references a field not present in the App Plan." });
      }
    }
    for (const action of asArray(ref.actions || ref.action ? ref.actions || [ref.action] : [])) {
      if (safeString(action).trim() && !app.actions.has(norm(action))) {
        findings.push({ level: "error", code: "TRACEABILITY_ACTION_NOT_IN_APP_PLAN", context: ref.context, action, message: "Page Function Plan references an action not present in the App Plan." });
      }
    }
    if (safeString(ref.source).trim() && !app.sources.has(norm(ref.source))) {
      findings.push({ level: "error", code: "TRACEABILITY_SOURCE_NOT_IN_APP_PLAN", context: ref.context, source: ref.source, message: "Page Function Plan references a source list/library/form not present in the App Plan." });
    }
    if (/^form:/i.test(ref.context) && /^(new|edit|add|add\/edit|new\/edit)$/i.test(safeString(ref.formType).trim())) {
      const sourceName = norm(ref.source);
      const sourceFields = app.fieldsBySource.get(sourceName);
      if (sourceFields) {
        for (const field of asArray(ref.fields || ref.field ? ref.fields || [ref.field] : [])) {
          if (safeString(field).trim() && !sourceFields.has(norm(field))) {
            findings.push({ level: "error", code: "TRACEABILITY_NEW_EDIT_FIELD_OUTSIDE_CURRENT_RESOURCE", context: ref.context, source: ref.source, field, message: "New/Edit Page Function Plan forms may only include fields from the current list/library unless an App Plan-supported exception is declared." });
          }
        }
      }
    }
  }
}

function validateFormReportsNotRequired(appPlan, pagePlan, findings) {
  const formReportNames = new Set(asArray(appPlan.formReports).map((report) => norm(report.name)));
  if (!formReportNames.size) return;
  const pageNames = [
    ...asArray(pagePlan.dashboards).map((page) => norm(page.name)),
    ...asArray(pagePlan.dataListForms).flatMap((resource) => asArray(resource.forms).map((form) => norm(form.name))),
    ...asArray(pagePlan.documentLibraryForms).flatMap((resource) => asArray(resource.forms).map((form) => norm(form.name))),
  ];
  for (const reportName of formReportNames) {
    if (pageNames.includes(reportName)) {
      findings.push({ level: "warning", code: "TRACEABILITY_FORM_REPORT_LISTED_AS_UI_SURFACE", resource: reportName, message: "Form Reports are not required as canonical Page Function Plan UI surfaces." });
    }
  }
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const appPlanPath = argValue("--app-plan");
  const pagePlanPath = argValue("--page-function-plan");
  const json = process.argv.includes("--json");
  if (!appPlanPath || !pagePlanPath) usage();
  const appPlan = readJson(appPlanPath);
  const pagePlan = readJson(pagePlanPath);
  const findings = [];
  const app = collectAppPlan(appPlan);
  const pages = collectPageRefs(pagePlan);
  validateCoverage(app, pages, findings);
  validateReferences(app, pagePlan, findings);
  validateFormReportsNotRequired(appPlan, pagePlan, findings);
  const errors = findings.filter((finding) => finding.level === "error").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    appPlan: path.resolve(appPlanPath),
    pageFunctionPlan: path.resolve(pagePlanPath),
    errors,
    warnings,
    findings,
  };
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (errors) {
    console.error(`app-plan/page-function traceability failed: ${appPlanPath} -> ${pagePlanPath}`);
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  } else {
    console.log(`app-plan/page-function traceability passed: ${appPlanPath} -> ${pagePlanPath}`);
  }
  if (errors) process.exitCode = 1;
}

main();
