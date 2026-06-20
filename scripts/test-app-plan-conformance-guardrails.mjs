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

  console.log(JSON.stringify({ status: "pass", cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
