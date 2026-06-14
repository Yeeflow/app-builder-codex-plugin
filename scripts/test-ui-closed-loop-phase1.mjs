#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateUiContractFromDesign } from "./generate-ui-contract-from-design.mjs";
import { captureRuntimeUiEvidence } from "./capture-runtime-ui-evidence.mjs";
import { validateUiUpgradeScope } from "./validate-ui-upgrade-scope.mjs";
import { inspectRuntimeEvidence } from "./inspect-runtime-evidence.mjs";
import { inspectVisibleKpiRuntimeBindings } from "./inspect-visible-kpi-runtime-bindings.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ui-closed-loop-phase1-"));
const cases = [];

try {
  await run();
  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function run() {
  testContractGeneration();
  await testRuntimeEvidenceCapture();
  testScopeValidation();
}

function testContractGeneration() {
  const plan = writeJson("marketing-event-plan.json", {
    appName: "Marketing Event Management",
    pages: [{
      name: "Event Portfolio",
      purpose: "Track event health and follow-up readiness.",
      sections: ["Header", "KPI cards", "Filter row", "Event grid", "Status badges"],
      controls: ["Heading", "Summary", "Data Filter", "Collection"],
      bindings: ["Events list", "Tasks list"],
      kpis: ["Planned events", "Open follow-ups"],
      filters: ["Search", "Status filter", "Open event action"],
      grid: ["Event name", "Owner", "Budget", "Status"],
      badges: ["Planning", "Live", "Closed"],
    }],
  });
  const contract = generateUiContractFromDesign({ design: "/tmp/event-dashboard.png", plan, targetPage: "Event Portfolio" });
  assert.equal(contract.reviewRequired, true);
  assert.equal(contract.visionParser.available, false);
  assert.equal(contract["target page name"], "Event Portfolio");
  assert.match(contract["proof boundary"].join(" "), /does not prove runtime UI quality/i);
  assert.match(contract["unresolved items"].join(" "), /Human reviewer must extract exact visual hierarchy/i);
  assert.doesNotMatch(JSON.stringify(contract), /fully understand/i);
  cases.push("design contract generator emits strict review-required contract without unsupported vision claims");
}

async function testRuntimeEvidenceCapture() {
  const pages = writeJson("runtime-pages.json", {
    pages: [{
      url: "https://example.invalid/redacted-runtime-page",
      pageOpened: true,
      visibleTitle: "Event Portfolio",
      screenshotCaptured: true,
      redactedScreenshotPath: "/tmp/redacted-event-portfolio.png",
      html: [
        "<main>",
        "<h1>Event Portfolio</h1>",
        "<section class='card kpi'><span>Planned events</span><strong>12</strong></section>",
        "<section class='card kpi'><span>Open follow-ups</span><strong>5</strong></section>",
        "<label>Status</label><select name='status'></select><button>Export</button>",
        "<table><thead><tr><th>Event</th><th>Owner</th><th>Status</th></tr></thead><tbody><tr><td>Launch Briefing</td><td>Ari</td><td><span class='badge status'>Live</span></td></tr></tbody></table>",
        "<div class='hidden-summary' style='display:none'>internal summary</div>",
        "</main>",
      ].join(""),
    }],
  });
  const evidence = await captureRuntimeUiEvidence({ pagesJson: pages });
  assert.equal(evidence.pageOpened, true);
  assert.equal(evidence.visibleTitle, "Event Portfolio");
  assert.equal(evidence.runtimeScreenshotCaptured, true);
  assert.equal(evidence.hiddenSummaryVisible, false);
  assert.ok(evidence.kpis.length >= 2);
  assert.ok(evidence.gridTableHeaders.includes("Event"));
  assert.ok(evidence.badgeLikeCells.includes("Live"));
  assert.doesNotMatch(JSON.stringify(evidence), /12345678901234567890|private\/workspace/);

  const evidencePath = writeJson("runtime-evidence.json", evidence);
  assert.equal(inspectRuntimeEvidence({ evidence: evidencePath, claimHighQualityUi: true }).status, "pass");
  assert.equal(inspectVisibleKpiRuntimeBindings({ evidence: evidencePath }).status, "pass");
  cases.push("runtime evidence capture emits redacted inspector-compatible KPI/filter/grid/badge/card metadata");
}

function testScopeValidation() {
  const previousPackage = writeJson("marketing-event-prev.json", marketingEventPackage());
  const newPackage = writeJson("marketing-event-new.json", marketingEventPackage({
    portfolioLayoutVariant: "phase1-ui-refresh",
  }));
  const scope = writeJson("marketing-event-scope.json", {
    changeScope: "one-page-ui-upgrade",
    allowedPages: ["Event Portfolio"],
    allowedPageLayoutIds: ["layout-event-portfolio"],
    allowedResources: ["layout-event-portfolio"],
    allowedLists: [],
    allowedForms: [],
    allowedNavigationChanges: false,
    forbiddenChanges: [],
    expectedListSetID: "1900000000000001001",
  });
  assert.equal(validateUiUpgradeScope({ previousPackage, newPackage, scope }).status, "pass");

  expectFail("ListSetID drift fails", marketingEventPackage(), marketingEventPackage({ listSetId: "1900000000000002002" }), scope, "UI_SCOPE_LISTSETID_DRIFT");
  expectFail("Unrelated page change fails", marketingEventPackage(), marketingEventPackage({ operationsLayoutVariant: "changed" }), scope, "UI_SCOPE_UNRELATED_PAGE_RESOURCE_CHANGE");
  expectFail("Data field change outside scope fails", marketingEventPackage(), marketingEventPackage({ addField: true }), scope, "UI_SCOPE_DATA_FIELD_CHANGE_OUTSIDE_SCOPE");
  expectFail("Approval form change outside scope fails", marketingEventPackage(), marketingEventPackage({ approvalFormVariant: "changed" }), scope, "UI_SCOPE_APPROVAL_FORM_CHANGE_OUTSIDE_SCOPE");
  expectFail("Workflow change outside scope fails", marketingEventPackage(), marketingEventPackage({ workflowVariant: "changed" }), scope, "UI_SCOPE_WORKFLOW_CHANGE_OUTSIDE_SCOPE");
  expectFail("Navigation drift outside scope fails", marketingEventPackage(), marketingEventPackage({ navigationVariant: "changed" }), scope, "UI_SCOPE_NAVIGATION_DRIFT_OUTSIDE_SCOPE");
  expectFail("New generated numeric IDs fail without allowance", marketingEventPackage(), marketingEventPackage({ newNumericId: true }), scope, "UI_SCOPE_NEW_GENERATED_ID_WITHOUT_ALLOWANCE");
  cases.push("Marketing Event-inspired scope validator fixture covers one-page UI change and drift failures");
}

function expectFail(name, previous, next, scope, code) {
  const prevPath = writeJson(`${name.replace(/\W+/g, "-")}-prev.json`, previous);
  const nextPath = writeJson(`${name.replace(/\W+/g, "-")}-new.json`, next);
  const report = validateUiUpgradeScope({ previousPackage: prevPath, newPackage: nextPath, scope });
  assert.equal(report.status, "fail", name);
  assert.ok(report.findings.some((finding) => finding.code === code), `${name}: expected ${code}`);
}

function marketingEventPackage(flags = {}) {
  const listSetId = flags.listSetId || "1900000000000001001";
  return {
    ListSet: {
      ListID: listSetId,
      AppID: "app-marketing-event",
      Title: "Marketing Event Management",
      Navigation: [
        { ID: "nav-event-portfolio", Title: "Event Portfolio", LayoutID: "layout-event-portfolio" },
        { ID: "nav-operations", Title: "Operations", LayoutID: "layout-operations" },
        ...(flags.navigationVariant ? [{ ID: "nav-extra", Title: "Extra", LayoutID: "layout-extra" }] : []),
      ],
    },
    Pages: [
      page("Event Portfolio", "layout-event-portfolio", flags.portfolioLayoutVariant || "baseline", flags.newNumericId ? "1900000000000099999" : undefined),
      page("Operations", "layout-operations", flags.operationsLayoutVariant || "baseline"),
    ],
    Childs: [{
      List: { ListID: "events", Title: "Events" },
      Fields: [
        { FieldID: "field-event-title", FieldName: "Title", DisplayName: "Event Name" },
        { FieldID: "field-status", FieldName: "Status", DisplayName: flags.addField ? "Event Status Updated" : "Status" },
      ],
      Layouts: [
        { LayoutID: "approval-form", Title: "Approval Form", Variant: flags.approvalFormVariant || "baseline" },
      ],
    }],
    Workflows: [
      { ID: "workflow-follow-up", Title: "Follow Up", Variant: flags.workflowVariant || "baseline" },
    ],
  };
}

function page(title, layoutId, variant, numericId) {
  return {
    Title: title,
    LayoutID: layoutId,
    ResourceID: numericId,
    LayoutInResources: [{
      Resource: JSON.stringify({
        type: "page",
        attrs: { variant },
        children: [{ id: `${layoutId}-card`, type: "container", attrs: { common: { padding: "16px" } } }],
      }),
    }],
  };
}

function writeJson(name, value) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}
