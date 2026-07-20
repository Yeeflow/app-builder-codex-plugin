#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { readDecodedYapk } from "./lib/yapk-decode-utils.mjs";
import { validateDashboardGoldenReferenceConformance } from "./validate-dashboard-golden-reference-conformance.mjs";
import { validateDashboardPageLayoutTemplate } from "./validate-dashboard-page-layout-template.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dashboard-v11-summary-host-"));

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`);
  return file;
}

function identities(node) {
  return [node?.id, node?.name, node?.title, node?.nv_label, node?.attrs?.nv_label, node?.attrs?.nav_label]
    .filter(Boolean)
    .map(String);
}

function hasIdentity(node, expected) {
  return identities(node).some((identity) => identity === expected || identity.toLowerCase() === String(expected).toLowerCase());
}

function visit(node, fn, path = "$", parents = []) {
  if (!node || typeof node !== "object") return;
  fn(node, path, parents);
  for (const [index, child] of (Array.isArray(node.children) ? node.children : []).entries()) {
    visit(child, fn, `${path}.children[${index}]`, parents.concat(node));
  }
}

function findAll(root, predicate) {
  const out = [];
  visit(root, (node, pointer, parents) => {
    if (predicate(node, pointer, parents)) out.push({ node, pointer, parents });
  });
  return out;
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Hospital Doctor Information Management

Hospital operations dashboard for doctor profile management and staffing review.
Business defaults approval status: user-default-approved-for-generation.
`);

  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Hospital Doctor Information Management - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Doctor Profiles

| Field label | Internal field | Field type | Purpose |
| --- | --- | --- | --- |
| Title | Title | Text | Native title mirrors doctor name |
| Doctor Name | Text1 | Text | Doctor display name |
| Employee Number | Text2 | Text | Employee number identifier, not a user field |
| Department | Text3 | Text | Department name |
| Profile Owner | Text4 | identity-picker | Existing Yeeflow user responsible for profile maintenance |
| Employment Status | Text5 | Choice | Active, On Leave, Inactive |

## 14. Dashboard Pages Plan

### 14.1 Doctor Operations Dashboard
- Page name: Doctor Operations Dashboard
- Business purpose: Operations overview for active doctors and profile maintenance.
- Layout template: dashboard-page-layouts-v1.1
- Dataset presentation: collection_control_grid_table

#### Dashboard Sections

| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Doctor work queue | Show doctor profile records for review | Doctor Profiles | Doctor Name, Employee Number, Department, Profile Owner, Employment Status | Collection | Dense operational record list | Review records | generated-final validation |

#### Summary Metrics
| Metric Name | Dashboard Page | Source Data List | Source Field(s) | Calculation Logic |
| --- | --- | --- | --- | --- |
| Active Doctors | Doctor Operations Dashboard | Doctor Profiles | ListDataID | Count active doctor profiles |
| Pending Reviews | Doctor Operations Dashboard | Doctor Profiles | ListDataID | Count pending profile reviews |

#### Record Display Control Selection
| Dashboard Page | Dataset Region | Source List | Selected Collection Template | Selection Reason |
| --- | --- | --- | --- | --- |
| Doctor Operations Dashboard | Doctor work queue | Doctor Profiles | collection_control_grid_table | Dense table for row and column scanning. |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Doctor Operations Dashboard | Doctor Operations Dashboard | Dashboard | fa-solid fa-user-doctor |
`);

  const apiIdManifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifestPath, `${JSON.stringify({
    ids: Array.from({ length: 500 }, (_, index) => String(930000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: apiIdManifestPath,
    tenantId: "930000000000099999",
    cwd: tempDir,
  });

  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));
  const packagePath = report.outputs.package;

  const pageLayoutResult = validateDashboardPageLayoutTemplate({
    packagePath,
    registryPath: path.join(path.resolve(import.meta.dirname, ".."), "docs/reference/dashboard-page-layout-templates.json"),
  });
  assert.equal(pageLayoutResult.status, "pass", JSON.stringify(pageLayoutResult.findings, null, 2));

  const goldenResult = validateDashboardGoldenReferenceConformance({
    packagePath,
    registryPath: path.join(path.resolve(import.meta.dirname, ".."), "docs/reference/dashboard-golden-references.json"),
  });
  assert.equal(goldenResult.status, "pass", JSON.stringify(goldenResult.findings, null, 2));

  const { decoded } = readDecodedYapk(packagePath);
  const dashboard = decoded.Pages.find((page) => page.Title === "Doctor Operations Dashboard");
  assert.ok(dashboard, "Doctor Operations Dashboard must be materialized");
  const resource = JSON.parse(dashboard.LayoutInResources[0].Resource);
  const hiddenHosts = findAll(resource, (node) => identities(node).some((identity) => /kpi data host|kpi_data_host/i.test(identity)));
  assert.ok(hiddenHosts.length > 0, "Summary hidden host must be generated for planned KPI/Summary metrics");
  for (const host of hiddenHosts) {
    assert.equal(host.node.attrs?.common?.hide?.[1], true, "Summary host must be hidden on desktop");
    assert.equal(host.node.attrs?.display?.rule, "1 == 0", "Summary host must include a false display rule");
    assert.ok(
      host.parents.some((parent) => [
        "event_portfolio_kpi_planned_events",
        "event_portfolio_kpi_approved_budget",
        "event_portfolio_kpi_registration_rate",
        "event_portfolio_kpi_lead_follow_up",
        "kpi_card_wrapper",
      ].some((identity) => hasIdentity(parent, identity))),
      `Summary host must be nested inside an approved KPI business slot, not naked content: ${host.pointer}`,
    );
  }

  const employeeNumberControls = findAll(resource, (node) => node.type === "dynamic-field" && /employee number/i.test(`${node.name || ""} ${node.title || ""}`));
  assert.ok(employeeNumberControls.length > 0, "Employee Number should render as a normal dynamic-field identifier");
  assert.ok(employeeNumberControls.every((entry) => entry.node.field === "Text2" && entry.node.attrs?.data?.field === "Text2"), "Employee Number dynamic-field slots must retain the planned Text2 field identity");
  const ownerControls = findAll(resource, (node) => /profile owner/i.test(`${node.name || ""} ${node.title || ""}`));
  assert.ok(ownerControls.length > 0, "Profile Owner must be assigned to an eligible dynamic control slot");
  assert.ok(ownerControls.every((entry) => entry.node.type === "dynamic-user"), "Profile Owner identity fields must render as dynamic-user");
  const dynamicSlotFields = findAll(resource, (node) => String(node.type || "").startsWith("dynamic-"))
    .map((entry) => entry.node.field || entry.node.attrs?.data?.field);
  assert.deepEqual(dynamicSlotFields, ["Title", "Text4", "Text2"], "The surviving grid-table dynamic slots must preserve the current Legacy field/type selection order after schema pruning");

  console.log(JSON.stringify({
    status: "pass",
    marker: "DASHBOARD_V11_SUMMARY_HOST_DYNAMIC_USER_FIXTURE_SLOT_SELECTION_RECONCILED",
    cases: [
      "v1.1 Summary hidden host is nested inside approved KPI business slot",
      "Employee Number dynamic-field is not misclassified as a user field",
      "Profile Owner identity-picker renders as dynamic-user",
      "fixture uses the current list-scoped field-table shape and asserts fixed grid-table slot selection",
      "generated package passes dashboard page-layout and golden conformance gates",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
