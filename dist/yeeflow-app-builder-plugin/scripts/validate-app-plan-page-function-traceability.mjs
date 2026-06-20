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
  const actions = new Set();
  const sources = new Set();

  for (const source of [...dataLists, ...documentLibraries]) {
    sources.add(norm(source.name));
    addNames(fields, source.fields);
    for (const form of asArray(source.forms)) {
      addNames(fields, form.fields);
      addNames(actions, form.actions);
    }
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
    actions,
    sources,
  };
}

function findByName(items, name) {
  return asArray(items).find((item) => norm(item.name) === norm(name) || norm(item.resourceName) === norm(name));
}

function formNames(resource) {
  return asArray(resource.forms).map((form) => norm(form.name));
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
    if (!findByName(pages.dashboards, dashboard.name)) {
      findings.push({ level: "error", code: "TRACEABILITY_DASHBOARD_PAGE_FUNCTION_MISSING", resource: dashboard.name, message: "Every App Plan dashboard page must have a Page Function Plan entry." });
    }
  }

  for (const approval of app.approvalForms) {
    const pageApproval = findByName(pages.approvalForms, approval.name);
    if (!pageApproval?.submissionForm) {
      findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_SUBMISSION_MISSING", approvalForm: approval.name, message: "Every Approval form submission form must have a Page Function Plan entry." });
    }
    for (const task of asArray(approval.taskForms)) {
      if (!asArray(pageApproval?.taskForms).some((pageTask) => norm(pageTask.name) === norm(task.name))) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_TASK_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Every planned task form must have a Page Function Plan entry." });
      }
    }
    for (const printPage of asArray(approval.printPages)) {
      if (!asArray(pageApproval?.printPages).some((pagePrint) => norm(pagePrint.name) === norm(printPage.name))) {
        findings.push({ level: "error", code: "TRACEABILITY_APPROVAL_PRINT_MISSING", approvalForm: approval.name, printPage: printPage.name, message: "Every required print page must have a Page Function Plan entry." });
      }
    }
  }

  for (const list of app.dataLists) {
    const pageResource = findByName(pages.dataListForms, list.name);
    for (const form of asArray(list.forms)) {
      if (!formNames(pageResource || {}).includes(norm(form.name))) {
        findings.push({ level: "error", code: "TRACEABILITY_DATA_LIST_FORM_MISSING", resource: list.name, form: form.name, message: "Every planned custom Data list form must have a Page Function Plan entry." });
      }
    }
  }

  for (const library of app.documentLibraries) {
    const pageResource = findByName(pages.documentLibraryForms, library.name);
    for (const form of asArray(library.forms)) {
      if (!formNames(pageResource || {}).includes(norm(form.name))) {
        findings.push({ level: "error", code: "TRACEABILITY_DOCUMENT_LIBRARY_FORM_MISSING", resource: library.name, form: form.name, message: "Every planned Document library form must have a Page Function Plan entry." });
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
      for (const field of asArray(form.fields)) refs.push({ context: `form:${resource.resourceName}:${form.name}:${field.name}`, ...field, source: resource.resourceName });
      for (const action of asArray(form.actions)) refs.push({ context: `form:${resource.resourceName}:${form.name}:action:${action}`, action, source: resource.resourceName });
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
