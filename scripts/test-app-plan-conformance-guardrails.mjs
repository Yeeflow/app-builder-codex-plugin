#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAV_GROUPS = [
  { title: "Workspace", items: ["Projects", "Resources", "Collections", "Reports", "Requests"] },
  { title: "Operations", items: ["Workflows", "Approvals", "Teams", "Integrations"] },
  { title: "Settings", items: ["Categories", "Tags", "Attributes", "Permissions", "Audit Log"] },
];

function plan(overrides = {}) {
  return {
    resources: {
      dataLists: ["Projects", "Resources", "Collections", "Requests", "Categories", "Tags", "Attributes", "Permissions", "Audit Log", "Teams", "Integrations"],
      approvalForms: ["Approvals"],
      workflows: ["Workflows"],
      pages: ["Projects", "Resources", "Collections", "Reports", "Requests"],
      reports: ["Reports"],
      integrations: ["Integrations"],
      permissions: ["Permissions"],
      adminResources: ["Categories", "Tags", "Attributes", "Permissions", "Audit Log"],
      teams: ["Teams"],
      ...overrides.resources,
    },
    navigation: {
      groupedNavigationRequired: true,
      groups: NAV_GROUPS,
      ...overrides.navigation,
    },
    generationContract: {
      outputPackage: { defaultOutput: ".yapk", yapOnlyWhenExplicit: true },
      signingGate: { requiredWhenCredentialsAvailable: true, endpoints: ["POST /utils/apppackage/setsign", "POST /utils/apppackage/verifysign"] },
      approvalFormContract: { approvalRequired: true, formsMustNotBeEmpty: true },
      navigationRuntimeContract: { groupShape: "Type: \"classes\" + list", forbidChildrenGroups: true },
      planToPackageConformance: { required: true },
      proofBoundary: { requiredReportSections: ["schema", "plan-conformance", "signing", "runtime UI inspection"] },
      runtimeInspectionChecklist: { requiredWhenInstalled: true },
    },
    deferred: overrides.deferred || [],
  };
}

function layoutViewFlat(items = NAV_GROUPS.flatMap((group) => group.items)) {
  return JSON.stringify({ sortVer: 1, sort: items.map((title, index) => ({ Title: title, Type: index < 5 ? 103 : 1, ListID: `nav-${index}` })) });
}

function layoutViewGrouped(groups = NAV_GROUPS) {
  return JSON.stringify({
    sortVer: 1,
    sort: groups.map((group, groupIndex) => ({
      Title: group.title,
      Type: "classes",
      list: group.items.map((title, itemIndex) => ({ Title: title, Type: groupIndex === 0 ? 103 : 1, ListID: `nav-${groupIndex}-${itemIndex}` })),
    })),
  });
}

function layoutViewLocalChildrenGrouped(groups = NAV_GROUPS) {
  return JSON.stringify({
    sortVer: 1,
    sort: groups.map((group, groupIndex) => ({
      Title: group.title,
      Type: "classes",
      children: group.items.map((title, itemIndex) => ({ Title: title, Type: groupIndex === 0 ? 103 : 1, ListID: `nav-${groupIndex}-${itemIndex}` })),
    })),
  });
}

function decodedApp({ flat = true, navigationItems, dataLists, pages, forms, reports, extraList } = {}) {
  const listTitles = dataLists || ["Projects", "Resources", "Collections", "Requests", "Workflows", "Categories", "Tags", "Attributes", "Permissions", "Audit Log", "Teams", "Integrations"];
  const pageTitles = pages || ["Projects", "Resources", "Collections", "Reports", "Requests"];
  const allLists = extraList ? [...listTitles, extraList] : listTitles;
  return {
    Item: {
      ListModel: {
        Title: "Northpeak Resource Operations",
        ListID: "root",
        LayoutView: flat ? layoutViewFlat(navigationItems) : layoutViewGrouped(),
      },
      Defs: [],
      Layouts: pageTitles.map((title) => ({ Title: title, Type: 103, LayoutID: `page-${title}`, LayoutView: null, LayoutInResources: [] })),
    },
    Childs: allLists.map((title) => ({
      ListModel: { Title: title, ListID: `list-${title}` },
      Defs: [],
      Layouts: [],
    })),
    Forms: (forms || ["Approvals"]).map((title) => ({ Name: title, key: title, nodes: [{ type: "MultiAssignmentTask" }] })),
    FormNewReports: (reports || ["Reports"]).map((title) => ({ Title: title })),
  };
}

function decodedAppWithLocalChildrenNavigation() {
  const app = decodedApp({ flat: false });
  app.Item.ListModel.LayoutView = layoutViewLocalChildrenGrouped();
  return app;
}

function writeJson(dir, name, obj) {
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`);
  return file;
}

function writeText(dir, name, text) {
  const file = path.join(dir, `${name}.md`);
  fs.writeFileSync(file, text.trimStart());
  return file;
}

function runValidator(planFile, packageFile, extra = []) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-app-plan-conformance.mjs",
    "--plan",
    planFile,
    "--package",
    packageFile,
    ...extra,
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`validator output was not JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
  return { result, report: parsed };
}

function runInspector(planFile, packageFile) {
  const result = spawnSync(process.execPath, [
    "scripts/inspect-generated-app-quality.mjs",
    "--plan",
    planFile,
    "--package",
    packageFile,
    "--validation-mode",
    "focused-runtime-repair",
    "--repair-scope",
    "plan-conformance-regression",
  ], { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  try {
    return JSON.parse(result.stdout || "{}");
  } catch (error) {
    throw new Error(`inspector output was not JSON: ${error.message}\n${result.stdout}\n${result.stderr}`);
  }
}

function findings(report) {
  return report.findings || [];
}

function expectCode(caseName, report, code) {
  if (!findings(report).some((finding) => finding.code === code)) {
    throw new Error(`${caseName} did not report ${code}. Findings: ${JSON.stringify(findings(report), null, 2)}`);
  }
}

function expectNoCode(caseName, report, code) {
  if (findings(report).some((finding) => finding.code === code)) {
    throw new Error(`${caseName} unexpectedly reported ${code}. Findings: ${JSON.stringify(findings(report), null, 2)}`);
  }
}

function facilityMarkdownPlan({ extraDataList = "" } = {}) {
  const extraRow = extraDataList ? `| Extra list | Need explicit resource | Data list | ${extraDataList} | Yes | Real canonical resource row |\n` : "";
  return `# Facility Maintenance Request Management - Yeeflow App Plan

## 2. Requirement-to-Yeeflow Resource Mapping Summary

| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| Intake | Capture facility requests | Data list | Maintenance Requests | Yes | Canonical resource row |
| Reference data | Track facilities | Data list | Facilities | Yes | Canonical resource row |
| Reference data | Track technicians | Data list | Technicians | Yes | Canonical resource row |
| Vendor coordination | Track vendor updates | Data list | Vendor Follow-ups | Yes | Canonical resource row |
${extraRow}| Approval | Review safety-critical work | Approval form | Maintenance Request Approval | Yes | Canonical resource row |
| Print output | Printable request record | Form report | Maintenance Request Print | Yes | Canonical resource row |
| Dashboard | Coordinator workspace | Dashboard page | Maintenance Dashboard | Yes | Canonical resource row |
| Automation | Approval workflow | Data-list workflow | Maintenance Request Approval | Yes | Canonical resource row |

## 3. Resource Generation Order

| Order | Resource Type | Resource Name | Depends On | Reason for Order | Blocking If Missing |
| --- | --- | --- | --- | --- | --- |
| 1 | Data list | Facilities | None | Lookup target first | Yes |
| 2 | Data list | Technicians | None | Assignment reference first | Yes |
| 3 | Data list | Maintenance Requests | Facilities, Technicians | Main transaction list | Yes |
| 4 | Approval form | Maintenance Request Approval | Maintenance Requests | Review workflow | Yes |
| 5 | Form report | Maintenance Request Print | Maintenance Request Approval | Print output | Yes |
| 6 | Dashboard page | Maintenance Dashboard | Maintenance Requests | Coordinator workspace | Yes |

## 4. Data Lists and Document Libraries Plan

### 4.1 Maintenance Requests

- Selected Yeeflow resource type: Data list
- Description: Stores the request, SLA, vendor, and closure state.
- Implementation note: do not parse this prose row as a resource.

#### Fields

| Field Order | Business Label | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Issue category | Issue Category | issue_category | Single line text | input control | This is a field, not a planned resource |
| 2 | SLA target | SLA Target | sla_target | DateTime | date picker | Urgent 4 business hours, High 1 business day |

## 5. Approval Forms Plan

### 5.1 Maintenance Request Approval

- Approval form name: Maintenance Request Approval
- Validation note: task form, field, and control detail rows are not standalone resources.

#### Assignment Task Forms

| Task Form Name | Used By Workflow Node | Purpose | One Shared Form or Multiple Forms | Notes |
| --- | --- | --- | --- | --- |
| Coordinator Review Task | Coordinator review | Review intake completeness | Shared | This task form is not a top-level Approval form resource |

## 6. Form Reports Plan

| Form Report Name | Related Approval Form | Purpose | Includes Sublist | Fields Included | Extra Field Configuration | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Maintenance Request Print | Maintenance Request Approval | Printable request | No | Request fields | N/A | Canonical report resource |

## 12. Dashboard Pages and Application Navigation

| Navigation Group | Navigation Items | Notes |
| --- | --- | --- |
| Workspace | Maintenance Dashboard | Canonical navigation declaration |

## 14. Assumptions and Deferred Items

- intakeReviewRoute: Facilities Coordinator group.
- technicianAssignmentModel: Technician reference list plus optional user picker after tenant setup.
- slaPolicy: Urgent 4 business hours, High 1 business day, Normal 3 business days, Low 5 business days.
- requesterClosureConfirmation: Coordinator closes directly, with optional requester comment.
- mandatoryAttachments: Optional, mandatory only for Safety Critical if approved later.
- vendorFollowUpPolicy: Separate Vendor Follow-up data list with no external integration.
- permissionModel: Placeholder app groups with broad coordinator access and requester own-record intent documented for post-import setup.

## 15. Generation Contract and Hard Gates

- Output package: .yapk by default.
- YAPK signing gate: run setsign and verifysign only when explicitly approved and credentials are available.
- Approval Form Contract: Maintenance Request Approval must not ship as empty Forms.
- Navigation Runtime Contract: Type: "classes" plus list[] when grouped navigation is generated.
- Plan-to-Package Conformance Contract: planned lists, forms, workflows, pages, and reports must match the package.
- Proof Boundary Contract: schema validation, app-plan conformance, signing, install/import acceptance, and runtime UI inspection are separate.
- Runtime Inspection Checklist: app opens, navigation renders, request page opens, task pages exist, and lists open.
`;
}

function facilityDecoded({ dataLists, pages, forms, reports } = {}) {
  return decodedApp({
    flat: false,
    dataLists: dataLists || ["Facilities", "Technicians", "Maintenance Requests", "Vendor Follow-ups"],
    pages: pages || ["Maintenance Dashboard"],
    forms: forms || ["Maintenance Request Approval"],
    reports: reports || ["Maintenance Request Print"],
  });
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "app-plan-conformance-"));
const results = [];

try {
  const basePlan = writeJson(tempDir, "plan", plan());

  let output = runValidator(basePlan, writeJson(tempDir, "flat", decodedApp()));
  expectCode("flat grouped navigation", output.report, "PLAN_GROUPED_NAVIGATION_UNPROVEN_EXPORT_SHAPE");
  expectCode("flat grouped navigation", output.report, "PLAN_NAVIGATION_FLAT_ONLY");
  results.push({ case: "grouped navigation plan with flat output does not silently pass", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "missing-list", decodedApp({ dataLists: ["Projects", "Resources", "Collections"] })));
  expectCode("missing list", output.report, "PLAN_DATALISTS_MISSING");
  results.push({ case: "missing planned data list detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "missing-approval", decodedApp({ forms: [] })));
  expectCode("missing approval form", output.report, "PLAN_APPROVALFORMS_MISSING");
  results.push({ case: "missing approval form/workflow detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "missing-page-report", decodedApp({ pages: ["Projects"], reports: [] })));
  expectCode("missing dashboard", output.report, "PLAN_PAGES_MISSING");
  expectCode("missing report", output.report, "PLAN_REPORTS_MISSING");
  results.push({ case: "missing dashboard/report detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "missing-admin", decodedApp({ dataLists: ["Projects", "Resources", "Collections", "Requests"] })));
  expectCode("missing integrations", output.report, "PLAN_INTEGRATIONS_MISSING");
  expectCode("missing permissions", output.report, "PLAN_PERMISSIONS_MISSING");
  expectCode("missing admin resources", output.report, "PLAN_ADMINRESOURCES_MISSING");
  results.push({ case: "missing integrations/teams/admin functions detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "grouped-valid", decodedApp({ flat: false })), ["--grouped-navigation-export-proven", "true"]);
  if (output.report.status !== "pass") {
    throw new Error(`grouped valid fixture should pass: ${JSON.stringify(output.report.findings, null, 2)}`);
  }
  results.push({ case: "export-proven grouped navigation shape passes", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "local-children-grouped", decodedAppWithLocalChildrenNavigation()), ["--grouped-navigation-export-proven", "true"]);
  expectCode("local-only grouped navigation", output.report, "PLAN_NAVIGATION_LOCAL_CHILDREN_GROUP_SHAPE");
  results.push({ case: "local-only grouped navigation shape is rejected", status: "pass" });

  output = runValidator(writeJson(tempDir, "missing-contract-plan", { ...plan(), generationContract: undefined }), writeJson(tempDir, "missing-contract-package", decodedApp({ flat: false })), ["--grouped-navigation-export-proven", "true"]);
  expectCode("missing generation contract", output.report, "PLAN_GENERATION_CONTRACT_MISSING");
  results.push({ case: "missing generation contract hard gate detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "flat-strict", decodedApp()), ["--mode", "strict"]);
  expectCode("strict unproven grouped navigation", output.report, "PLAN_GROUPED_NAVIGATION_UNPROVEN_EXPORT_SHAPE");
  if (output.report.status !== "fail") throw new Error("strict grouped-navigation unproven fixture should fail");
  results.push({ case: "unproven grouped support warns by default and fails in strict mode", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "missing-from-nav", decodedApp({ navigationItems: ["Projects", "Resources", "Collections", "Reports"] })), ["--grouped-navigation-export-proven", "true"]);
  expectCode("resource missing from navigation", output.report, "PLAN_RESOURCE_MISSING_FROM_NAVIGATION");
  results.push({ case: "generated resource missing from navigation detected", status: "pass" });

  output = runValidator(basePlan, writeJson(tempDir, "extra-resource", decodedApp({ flat: false, extraList: "Unplanned Archive" })), ["--grouped-navigation-export-proven", "true"]);
  const hasExtraResource = Object.values(output.report.resources || {}).some((bucket) => (bucket.extra || []).some((item) => item.title === "Unplanned Archive"));
  if (!hasExtraResource) throw new Error(`extra resource was not detected: ${JSON.stringify(output.report.resources, null, 2)}`);
  results.push({ case: "generated extra resource detected as unplanned", status: "pass" });

  const inspectorReport = runInspector(basePlan, writeJson(tempDir, "inspector-flat", decodedApp()));
  if (!inspectorReport.planConformance || inspectorReport.planConformance.status !== "pass_with_warnings") {
    throw new Error(`post-generation report did not include planConformance warning summary: ${JSON.stringify(inspectorReport.planConformance, null, 2)}`);
  }
  results.push({ case: "post-generation plan coverage report is included", status: "pass" });

  output = runValidator(
    writeText(tempDir, "facility-markdown-plan", facilityMarkdownPlan()),
    writeJson(tempDir, "facility-package", facilityDecoded()),
    ["--mode", "strict", "--grouped-navigation-export-proven", "true"],
  );
  if (output.report.status !== "pass") {
    throw new Error(`canonical Markdown plan with prose/table detail false positives should pass: ${JSON.stringify(output.report.findings, null, 2)}`);
  }
  for (const falsePositiveCode of [
    "PLAN_DATALISTS_MISSING",
    "PLAN_APPROVALFORMS_MISSING",
    "PLAN_PAGES_MISSING",
    "PLAN_REPORTS_MISSING",
    "PLAN_WORKFLOWS_MISSING",
  ]) {
    expectNoCode("facility Markdown over-parse regression", output.report, falsePositiveCode);
  }
  results.push({ case: "Markdown parser ignores fields, task forms, assumptions, notes, and prose as resources", status: "pass" });

  output = runValidator(
    writeText(tempDir, "facility-missing-real-list-plan", facilityMarkdownPlan({ extraDataList: "Inspection Tasks" })),
    writeJson(tempDir, "facility-missing-real-list-package", facilityDecoded()),
    ["--mode", "strict", "--grouped-navigation-export-proven", "true"],
  );
  expectCode("strict real missing canonical resource", output.report, "PLAN_DATALISTS_MISSING");
  results.push({ case: "strict Markdown parser still fails real missing canonical resource", status: "pass" });

  output = runValidator(
    writeText(tempDir, "facility-extra-resource-plan", facilityMarkdownPlan()),
    writeJson(tempDir, "facility-extra-resource-package", facilityDecoded({ dataLists: ["Facilities", "Technicians", "Maintenance Requests", "Vendor Follow-ups", "Unplanned Archive"] })),
    ["--mode", "strict", "--grouped-navigation-export-proven", "true"],
  );
  expectCode("strict extra generated resource", output.report, "PLAN_DATALISTS_EXTRA_UNPLANNED");
  results.push({ case: "strict mode fails extra generated resource", status: "pass" });

  output = runValidator(
    writeText(tempDir, "facility-mismatch-plan", facilityMarkdownPlan()),
    writeJson(tempDir, "facility-mismatch-package", facilityDecoded({ dataLists: ["Facilities", "Technicians", "Maintenance Requests Archive", "Vendor Follow-ups"] })),
    ["--mode", "strict", "--grouped-navigation-export-proven", "true"],
  );
  expectCode("strict partial resource mismatch", output.report, "PLAN_DATALISTS_MISMATCH");
  results.push({ case: "strict mode fails partial resource name mismatch", status: "pass" });

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
