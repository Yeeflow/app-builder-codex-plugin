#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "application-design-system-gates-"));
const results = [];

function writeJson(name, value) {
  const file = path.join(tempDir, `${name}.json`);
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

function ads(overrides = {}) {
  return {
    applicationName: "Purchase Operations",
    selectedApplicationLayout: "application-layout-1-vertical-nav",
    applicationLayoutType: "application-layout-1-vertical-nav",
    applicationChromeStyleId: "layout-1-dark-header-dark-vertical-nav",
    headerMode: "dark-header",
    navigationMode: "vertical-nav",
    navigationPanelMode: "left-panel",
    contentSafeArea: "Dashboard content sits below the header and to the right of the left navigation panel.",
    dashboardChromeRules: "Dashboard/application pages use the selected header, left navigation panel, and content safe area.",
    formSurfaceChromeRules: "Approval forms and Data list / Document library forms are full form surfaces with no app chrome unless explicitly supported by plugin standards.",
    ...overrides,
  };
}

function pageFunctionPlan(overrides = {}) {
  return {
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
      applicationDesignSystemLayoutRef: "application-layout-1-vertical-nav",
      applicationLayoutInheritance: "Inherits selected Application Design System layout.",
      desktopBehavior: "Two-column operations dashboard with KPI row and queue.",
      mobileBehavior: "Stacks KPI cards first, then request queue.",
      dashboardSectionTemplates: [{
        templateId: "kpi_card_row",
        regionName: "Operations KPI Row",
        businessPurpose: "KPI metrics for open request counts and total amount.",
        source: "Purchase Requests",
        displayedFields: ["Title", "Amount", "Status"],
        filters: ["Current fiscal period"],
        grouping: ["Status"],
        sorting: ["Created Date descending"],
        actions: [],
        requiredControls: ["container", "summary", "text"],
        proofStatus: "export-proven",
        whyTemplateFits: "KPI metrics need the export-proven KPI/Summary card row.",
      }],
      regions: [{
        name: "Operations KPI Row",
        controlType: "Summary",
        source: "Purchase Requests",
        fields: ["Title", "Amount", "Status"],
        filters: ["Current fiscal period"],
        actions: [],
      }],
    }],
    ...overrides,
  };
}

try {
  let output = run("scripts/validate-application-design-system.mjs", [writeJson("valid-ads", ads())]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "valid ADS selecting one supported layout passes", status: "pass" });

  const missingLayout = ads();
  delete missingLayout.selectedApplicationLayout;
  delete missingLayout.applicationLayoutType;
  output = run("scripts/validate-application-design-system.mjs", [writeJson("missing-layout", missingLayout)]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "APPLICATION_DESIGN_SYSTEM_SELECTED_APPLICATION_LAYOUT_MISSING");
  expectCode(output.report, "APPLICATION_DESIGN_SYSTEM_LAYOUT_MISSING");
  results.push({ case: "invalid ADS with no layout fails", status: "pass" });

  output = run("scripts/validate-application-design-system.mjs", [writeJson("multiple-layouts", ads({
    applicationLayoutTypes: ["application-layout-1-vertical-nav", "application-layout-2-horizontal-nav"],
  }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "APPLICATION_DESIGN_SYSTEM_MULTIPLE_LAYOUTS");
  results.push({ case: "invalid ADS with multiple layouts fails", status: "pass" });

  output = run("scripts/validate-application-design-system.mjs", [writeJson("invented-layout", ads({
    selectedApplicationLayout: "custom-floating-shell",
    applicationLayoutType: "custom-floating-shell",
  }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_LAYOUT");
  results.push({ case: "invalid ADS with invented layout name fails", status: "pass" });

  output = run("scripts/validate-application-design-system.mjs", [writeJson("invented-chrome", ads({
    dashboardChromeRules: "Use a custom top bar and floating navigation.",
  }))]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_CHROME");
  results.push({ case: "invalid ADS with arbitrary chrome fails", status: "pass" });

  const adsFile = writeJson("layout-source-ads", ads());
  output = run("scripts/validate-page-function-plan.mjs", [writeJson("valid-pfp-layout-inheritance", pageFunctionPlan()), "--application-design-system", adsFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "Dashboard Page Function Plan inheriting ADS layout passes", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson("bad-dashboard-layout-override", pageFunctionPlan({
    dashboards: [{
      ...pageFunctionPlan().dashboards[0],
      applicationLayoutType: "application-layout-2-horizontal-nav",
      applicationDesignSystemLayoutRef: "application-layout-2-horizontal-nav",
      applicationLayoutInheritance: "Override the app-level layout for this dashboard.",
    }],
  })), "--application-design-system", adsFile]);
  assert.equal(output.report.status, "fail");
  expectCode(output.report, "PAGE_FUNCTION_DASHBOARD_LAYOUT_OVERRIDE_UNSUPPORTED");
  results.push({ case: "invalid Dashboard Page Function Plan overriding ADS layout fails", status: "pass" });

  output = run("scripts/validate-page-function-plan.mjs", [writeJson("deferred-dashboard-layout-override", pageFunctionPlan({
    dashboards: [{
      ...pageFunctionPlan().dashboards[0],
      applicationLayoutType: "application-layout-2-horizontal-nav",
      applicationDesignSystemLayoutRef: "application-layout-2-horizontal-nav",
      unsupportedLayoutException: "unsupported/deferred exception with runtime-proof-required boundary.",
      runtimeProofBoundary: "runtime-proof-required before generation.",
    }],
  })), "--application-design-system", adsFile]);
  assert.equal(output.report.status, "pass", JSON.stringify(output.report.findings, null, 2));
  results.push({ case: "deferred Dashboard layout override with proof boundary passes", status: "pass" });

  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
