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
const DASHBOARD_STYLE_REGION = /\b(Collection|Data analytics|Analytics|Summary|KPI|Data table|Kanban|Timeline|audit|dashboard|chart)\b/i;

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-page-function-plan.mjs <page-function-plan.md|json> [--json]",
    "",
    "Validates Page Function Plan structure and page-level guardrails. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function normalizeName(value) {
  return safeString(value).trim().toLowerCase();
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readPlan(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseMaybeJson(text);
  if (parsed) return { type: "json", text, plan: parsed };
  return { type: "markdown", text, plan: null };
}

function markdownFindings(text) {
  const findings = [];
  const required = [
    [/^#\s+.+?\s+-\s+Page Function Plan\s*$/m, "PAGE_FUNCTION_PLAN_TITLE_MISSING"],
    [/## 1\. Plan Status/i, "PAGE_FUNCTION_PLAN_STATUS_SECTION_MISSING"],
    [/## 2\. App Plan Traceability Summary/i, "PAGE_FUNCTION_PLAN_TRACEABILITY_SECTION_MISSING"],
    [/## 3\. Yeeflow Application Layout Guidance/i, "PAGE_FUNCTION_PLAN_LAYOUT_SECTION_MISSING"],
    [/## 4\. Dashboard Page Functions/i, "PAGE_FUNCTION_PLAN_DASHBOARD_SECTION_MISSING"],
    [/## 5\. Approval Form Page Functions/i, "PAGE_FUNCTION_PLAN_APPROVAL_SECTION_MISSING"],
    [/## 6\. Data List and Document Library Form Page Functions/i, "PAGE_FUNCTION_PLAN_DATA_FORM_SECTION_MISSING"],
    [/## 7\. Full-Page and Responsive Requirements/i, "PAGE_FUNCTION_PLAN_RESPONSIVE_SECTION_MISSING"],
    [/Form Reports are not required/i, "PAGE_FUNCTION_PLAN_FORM_REPORT_EXCLUSION_MISSING"],
    [/Save as draft[\s\S]*Submit/i, "PAGE_FUNCTION_PLAN_APPROVAL_SUBMIT_BUTTONS_MISSING"],
    [/New\/Edit forms should normally include only editable fields/i, "PAGE_FUNCTION_PLAN_NEW_EDIT_RULE_MISSING"],
    [/source list\/library, parent\/current-item binding, display fields, filters, actions, and opening behavior/i, "PAGE_FUNCTION_PLAN_RELATED_REGION_RULE_MISSING"],
  ];
  for (const [pattern, code] of required) {
    if (!pattern.test(text)) {
      findings.push({ level: "error", code, message: `Missing required Page Function Plan template text for ${code}.` });
    }
  }
  return findings;
}

function allControls(plan) {
  const controls = [];
  for (const dashboard of asArray(plan.dashboards)) {
    for (const region of asArray(dashboard.regions)) {
      controls.push({ control: region.controlType, context: `dashboard:${dashboard.name}:${region.name}` });
    }
  }
  for (const approval of asArray(plan.approvalForms)) {
    for (const field of asArray(approval.submissionForm?.fields)) controls.push({ control: field.controlType, context: `approval:${approval.name}:submission:${field.name}` });
    for (const task of asArray(approval.taskForms)) {
      for (const field of asArray(task.fields)) controls.push({ control: field.controlType, context: `approval:${approval.name}:task:${task.name}:${field.name}` });
    }
    for (const page of asArray(approval.printPages)) {
      for (const item of asArray(page.content)) controls.push({ control: item.controlType, context: `approval:${approval.name}:print:${page.name}:${item.name}` });
    }
  }
  for (const resource of [...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)]) {
    for (const form of asArray(resource.forms)) {
      for (const field of asArray(form.fields)) controls.push({ control: field.controlType, context: `form:${resource.resourceName}:${form.name}:${field.name}` });
      for (const region of asArray(form.relatedRegions)) controls.push({ control: region.regionType, context: `form:${resource.resourceName}:${form.name}:related:${region.name}` });
    }
  }
  return controls;
}

function validateSupportedControls(plan, findings) {
  for (const item of allControls(plan)) {
    const control = safeString(item.control).trim();
    if (!control || DEFERRED.test(control)) continue;
    if (!SUPPORTED_CONTROLS.has(control)) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_UNSUPPORTED_CONTROL",
        context: item.context,
        value: control,
        message: `Unsupported Page Function Plan control "${control}" is not in the plugin-supported control allowlist or marked runtime-proof/deferred.`,
      });
    }
  }
}

function validateApprovalForms(plan, findings) {
  for (const approval of asArray(plan.approvalForms)) {
    if (!approval.submissionForm) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_MISSING", approvalForm: approval.name, message: "Approval form is missing a submission form page function." });
      continue;
    }
    const actions = asArray(approval.submissionForm.actions).map(normalizeName);
    for (const requiredAction of ["save as draft", "submit"]) {
      if (!actions.includes(requiredAction)) {
        findings.push({
          level: "error",
          code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_REQUIRED_BUTTON_MISSING",
          approvalForm: approval.name,
          action: requiredAction,
          message: "Approval submission forms must include Save as draft and Submit.",
        });
      }
    }
    const unrelated = asArray(approval.submissionForm.regions).find((region) => DASHBOARD_STYLE_REGION.test(`${region.name || ""} ${region.regionType || ""}`) && !region.explicitlyPlanned);
    if (unrelated) {
      findings.push({
        level: "error",
        code: "PAGE_FUNCTION_APPROVAL_SUBMISSION_UNRELATED_REGION",
        approvalForm: approval.name,
        region: unrelated.name,
        message: "Approval submission forms must not include unrelated dashboard/audit/logic-only regions unless explicitly required by the App Plan.",
      });
    }
    for (const task of asArray(approval.taskForms)) {
      if (!asArray(task.actions).length) {
        findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_TASK_ACTIONS_MISSING", approvalForm: approval.name, taskForm: task.name, message: "Task forms must define buttons/actions matching the task type." });
      }
      if (!safeString(task.differencesFromSubmission).trim()) {
        findings.push({ level: "error", code: "PAGE_FUNCTION_APPROVAL_TASK_DIFFERENCE_UNEXPLAINED", approvalForm: approval.name, taskForm: task.name, message: "Task form differences from the submission form must be explicit." });
      }
    }
  }
}

function validateDataForms(plan, findings) {
  for (const resource of [...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)]) {
    for (const form of asArray(resource.forms)) {
      const formType = normalizeName(form.type);
      const relatedRegions = asArray(form.relatedRegions);
      if (/^(new|edit|add|add\/edit|new\/edit)$/.test(formType) && relatedRegions.length) {
        const bad = relatedRegions.find((region) => DASHBOARD_STYLE_REGION.test(`${region.name || ""} ${region.regionType || ""}`) && !region.explicitlyPlannedAndJustified);
        if (bad) {
          findings.push({
            level: "error",
            code: "PAGE_FUNCTION_NEW_EDIT_UNRELATED_REGION",
            resource: resource.resourceName,
            form: form.name,
            region: bad.name,
            message: "New/Edit forms must not include unrelated Collection/Data analytics/audit/dashboard regions unless explicitly planned and justified.",
          });
        }
      }
      if (/^(view|detail|custom)$/.test(formType)) {
        for (const region of relatedRegions) {
          for (const [key, code] of [
            ["source", "PAGE_FUNCTION_VIEW_RELATED_REGION_SOURCE_MISSING"],
            ["binding", "PAGE_FUNCTION_VIEW_RELATED_REGION_BINDING_MISSING"],
            ["fields", "PAGE_FUNCTION_VIEW_RELATED_REGION_FIELDS_MISSING"],
            ["actions", "PAGE_FUNCTION_VIEW_RELATED_REGION_ACTIONS_MISSING"],
            ["filters", "PAGE_FUNCTION_VIEW_RELATED_REGION_FILTERS_MISSING"],
            ["openingBehavior", "PAGE_FUNCTION_VIEW_RELATED_REGION_OPENING_MISSING"],
          ]) {
            const value = region[key];
            const missing = Array.isArray(value) ? value.length === 0 : !safeString(value).trim();
            if (missing) {
              findings.push({
                level: "error",
                code,
                resource: resource.resourceName,
                form: form.name,
                region: region.name,
                message: "View/detail related regions must specify source, binding, fields, filters, actions, and opening behavior.",
              });
            }
          }
        }
      }
    }
  }
}

function validateResponsive(plan, findings) {
  const pages = [
    ...asArray(plan.dashboards).map((page) => ({ type: "dashboard", name: page.name, value: page })),
    ...asArray(plan.approvalForms).flatMap((approval) => [
      { type: "approval-submission", name: `${approval.name}:submission`, value: approval.submissionForm || {} },
      ...asArray(approval.taskForms).map((task) => ({ type: "approval-task", name: `${approval.name}:${task.name}`, value: task })),
      ...asArray(approval.printPages).map((page) => ({ type: "approval-print", name: `${approval.name}:${page.name}`, value: page })),
    ]),
    ...[...asArray(plan.dataListForms), ...asArray(plan.documentLibraryForms)].flatMap((resource) =>
      asArray(resource.forms).map((form) => ({ type: "data-form", name: `${resource.resourceName}:${form.name}`, value: form })),
    ),
  ];
  for (const page of pages) {
    if (!safeString(page.value.mobileBehavior).trim()) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_MOBILE_BEHAVIOR_MISSING", pageType: page.type, page: page.name, message: "Every UI page must define mobile behavior." });
    }
    if (!safeString(page.value.desktopBehavior).trim() && !safeString(page.value.desktopLayout).trim()) {
      findings.push({ level: "error", code: "PAGE_FUNCTION_DESKTOP_BEHAVIOR_MISSING", pageType: page.type, page: page.name, message: "Every UI page must define desktop layout behavior." });
    }
  }
}

function validateJson(plan) {
  const findings = [];
  if (!safeString(plan.applicationName).trim()) findings.push({ level: "error", code: "PAGE_FUNCTION_APPLICATION_NAME_MISSING", message: "applicationName is required." });
  if (!safeString(plan.applicationLayout).trim()) findings.push({ level: "error", code: "PAGE_FUNCTION_APPLICATION_LAYOUT_MISSING", message: "applicationLayout is required." });
  validateSupportedControls(plan, findings);
  validateApprovalForms(plan, findings);
  validateDataForms(plan, findings);
  validateResponsive(plan, findings);
  return findings;
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const file = process.argv.slice(2).find((arg) => arg !== "--json");
  if (!file) usage();
  if (!fs.existsSync(file)) {
    console.log(JSON.stringify({ status: "fail", file: path.resolve(file), errors: 1, findings: [{ level: "error", code: "PAGE_FUNCTION_PLAN_FILE_MISSING", message: "Page Function Plan file does not exist." }] }, null, 2));
    process.exit(1);
  }
  const input = readPlan(file);
  const findings = input.type === "json" ? validateJson(input.plan) : markdownFindings(input.text);
  const errors = findings.filter((finding) => finding.level === "error").length;
  const report = { status: errors ? "fail" : "pass", file: path.resolve(file), inputType: input.type, errors, warnings: 0, findings };
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`page function plan validation passed: ${file}`);
  else {
    console.error(`page function plan validation failed: ${file}`);
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (errors) process.exitCode = 1;
}

main();
