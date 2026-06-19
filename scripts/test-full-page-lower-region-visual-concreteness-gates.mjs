#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-lower-region-visual-concreteness-"));

function baseManifest(region = relatedDocumentsTable()) {
  const designSystemPath = "docs/generated-ui/vendor-contract-management/application-design-system.md";
  return {
    applicationName: "Vendor Contract Management",
    pluginVersion: "0.6.67",
    sourceFunctionalSpecificationPath: "docs/generated-app-plans/vendor-contract-management-functional-specification.md",
    sourceAppPlanPath: "docs/generated-app-plans/vendor-contract-management-yeeflow-app-plan.md",
    applicationLayoutType: "application-layout-2-horizontal-nav",
    selectedApplicationLayout: "application-layout-2-horizontal-nav",
    designSystemPath,
    applicationDesignSystem: {
      path: designSystemPath,
      status: "complete",
      generatedAt: "2026-06-19T01:00:00Z",
      applicationLayoutType: "application-layout-2-horizontal-nav",
      applicationLayoutName: "Application layout 2: horizontal navigation menu bar",
      applicationChromeStyleId: "layout-2-light-header-blue-horizontal-nav",
      headerMode: "light-header",
      navMode: "horizontal-nav",
      navBackgroundMode: "blue",
      contentSafeArea: "content starts below the horizontal navigation bar",
      layoutRuleSource: "docs/standards/yeeflow-application-layout-design-rules.md",
      modernVisualQualityStandard: "Polished business UI with concrete lower-page rendered examples.",
      responsivePlan: "Forms become single-column on mobile.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [
      {
        surfaceName: "Contract View",
        surfaceType: "Data List View form",
        sourceAppPlanSection: "Custom Data List Forms Plan",
        sourceResourceName: "Contracts",
      },
    ],
    artifacts: [contractViewArtifact([region])],
    deferredSurfaces: [],
  };
}

function contractViewArtifact(lowerPageBusinessRegions) {
  return {
    surfaceName: "Contract View",
    surfaceType: "Data List View form",
    sourceAppPlanSection: "Custom Data List Forms Plan",
    sourceResourceName: "Contracts",
    designSystemPath: "docs/generated-ui/vendor-contract-management/application-design-system.md",
    applicationLayoutType: "form-surface-no-app-chrome",
    includeHeaderNavigation: false,
    selectedLayoutChromeCompliance: "form surface uses Application Design System without app chrome",
    canonicalDesktopImagePath: "assets/generated-ui/vendor-contract-management/contract-view.design.png",
    responsivePlanReference: "docs/generated-ui/vendor-contract-management/application-design-system.md#mobile-responsive-rules",
    imageDimensions: "1440x2200",
    fullPageCoverageStatus: "full-page",
    includedSections: ["Contract header", "Contract fields", "Lower-page related business regions"],
    majorPlannedControlsShown: ["Text inputs", "User picker", "Date picker", "Data table", "Collection", "Vertical Timeline"],
    businessDataExamplesShown: ["MSA-2026 Acme Supplies renewal due 2026-08-15 owned by Mira Chen"],
    pageEndIncluded: true,
    layoutFidelityStatus: "pass",
    visualQualityStatus: "pass",
    modernVisualQualityChecklist: [
      "Contract View shows vendor, contract owner, renewal date, payment terms, and approval status.",
      "Lower-page regions show rendered related documents, renewal tasks, and approval history examples.",
    ],
    antiPatternCheck: "pass: no placeholder-only lower-page regions",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    primaryBusinessObject: "Contract",
    semanticFieldExamples: [
      { field: "Contract Title", value: "MSA-2026 Acme Supplies" },
      { field: "Vendor", value: "Acme Supplies" },
      { field: "Contract Owner", value: "Mira Chen" },
      { field: "Renewal Date", value: "2026-08-15" },
      { field: "Approval Status", value: "Pending Legal Review" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions,
    businessRegionEvidence: "Lower-page regions include rendered business rows/cards/timeline entries.",
    formPurposeDifferentiators: ["Read-only contract view with concrete related records and approval history."],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      "Contract View shows contract title, vendor, owner, renewal date, approval status, and payment terms.",
      "Contract View lower page shows related documents, renewal tasks, and approval history as concrete UI regions.",
    ],
  };
}

function region(overrides = {}) {
  return {
    name: "Related Documents",
    purpose: "Show contract evidence and required document coverage.",
    sourceList: "Contract Documents",
    visualPattern: "Data table",
    plannedYeeflowControl: "Data table",
    renderedExampleCount: 2,
    renderedExampleSummary:
      "Row 1: Signed MSA.pdf, type Signed Contract, status Received, uploaded 2026-06-01. Row 2: Insurance Certificate.pdf, type Compliance Evidence, status Required, uploaded 2026-06-04.",
    displayedBusinessFields: ["Document name", "Document type", "Status", "Uploaded date"],
    displayedFields: ["Document name", "Document type", "Status", "Uploaded date"],
    actionsShown: ["Open document"],
    visualConcretenessStatus: "pass",
    antiPlaceholderStatus: "pass",
    behavior: "read-only document table with open document action",
    blueprintMappingHint: "Map to Data table rows bound to Contract Documents.",
    proofImpact: "Blueprint must bind document rows to the Contract Documents source.",
    ...overrides,
  };
}

function relatedDocumentsTable() {
  return region();
}

function renewalTaskCards() {
  return region({
    name: "Renewal Tasks",
    purpose: "Show active renewal work linked to this contract.",
    sourceList: "Renewal Tasks",
    visualPattern: "Collection",
    plannedYeeflowControl: "Collection",
    renderedExampleCount: 2,
    renderedExampleSummary:
      "Card 1: Confirm renewal terms, owner Mira Chen, due 2026-07-15, status In progress. Card 2: Send finance reminder, owner Alan Lee, due 2026-07-22, status Pending.",
    displayedBusinessFields: ["Task", "Owner", "Due date", "Status"],
    displayedFields: ["Task", "Owner", "Due date", "Status"],
    actionsShown: ["Open task detail"],
    blueprintMappingHint: "Map to Collection cards bound to Renewal Tasks.",
  });
}

function approvalTimeline() {
  return region({
    name: "Approval History",
    purpose: "Show prior approval decisions and reviewer comments.",
    sourceList: "Contract Approval",
    visualPattern: "Vertical Timeline",
    plannedYeeflowControl: "Vertical Timeline",
    renderedExampleCount: 2,
    renderedExampleSummary:
      "Timeline event 1: Legal Review, reviewer Nia Patel, decision Approved, comment Terms acceptable, date 2026-06-03. Timeline event 2: Finance Review, reviewer Omar Chen, decision Pending, date 2026-06-05.",
    displayedBusinessFields: ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
    displayedFields: ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
    actionsShown: ["Read-only timeline"],
    blueprintMappingHint: "Map to Vertical Timeline events bound to Contract Approval history.",
  });
}

function requiredDocumentChecklist() {
  return region({
    name: "Required Document Checklist",
    purpose: "Show required, received, and missing contract document states.",
    sourceList: "Contract Documents",
    visualPattern: "checklist rows",
    plannedYeeflowControl: "checklist rows",
    renderedExampleCount: 3,
    renderedExampleSummary:
      "Checklist row 1: Signed Contract required yes, received yes, current file Signed MSA.pdf. Checklist row 2: Insurance Certificate required yes, received yes. Checklist row 3: DPA required yes, received no, next action Request file.",
    displayedBusinessFields: ["Document type", "Required", "Received", "Current file", "Next action"],
    displayedFields: ["Document type", "Required", "Received", "Current file", "Next action"],
    actionsShown: ["Open document", "Request missing file"],
    blueprintMappingHint: "Map to checklist rows with received/required status badges.",
  });
}

function intentionalEmptyState() {
  return region({
    name: "Related Reminders",
    purpose: "Show renewal reminders after reminder generation begins.",
    sourceList: "Renewal Reminders",
    visualPattern: "Collection",
    plannedYeeflowControl: "Collection",
    renderedExampleCount: 0,
    renderedExampleSummary: "Empty state component: No renewal reminders yet. Next action: Create reminder schedule.",
    emptyState: {
      emptyStateComponent: "No renewal reminders yet card with Create reminder schedule action",
      emptyStateReason: "No reminders exist before reminder offsets are approved.",
      emptyStateNextAction: "Create reminder schedule",
    },
    displayedBusinessFields: ["Reminder offset", "Owner", "Due date", "Status"],
    displayedFields: ["Reminder offset", "Owner", "Due date", "Status"],
    actionsShown: ["Create reminder schedule"],
    blueprintMappingHint: "Map to Collection empty-state card with action.",
  });
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function runCase(name, manifest) {
  const file = path.join(tempRoot, `${slug(name)}.json`);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  const result = spawnSync(process.execPath, [validator, "--manifest", file, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error(`${name}: validator did not emit JSON\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return { result, parsed };
}

function assertPass(name, manifest) {
  const { result, parsed } = runCase(name, manifest);
  assert.equal(result.status, 0, `${name} should pass:\n${JSON.stringify(parsed.findings, null, 2)}`);
  assert.equal(parsed.status, "pass", `${name} JSON status`);
}

function assertFail(name, manifest, code) {
  const { result, parsed } = runCase(name, manifest);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.equal(parsed.status, "fail", `${name} JSON status`);
  assert(parsed.findings.some((finding) => finding.code === code), `${name} should include ${code}:\n${JSON.stringify(parsed.findings, null, 2)}`);
}

assertFail(
  "source and field-list only region fails",
  baseManifest(region({ renderedExampleSummary: "Source: Contract Documents. Document name, type, status, uploaded date" })),
  "FORM_DETAIL_LOWER_REGION_RENDERED_EXAMPLE_PLACEHOLDER_ONLY",
);

assertFail(
  "zero rendered examples without empty state fails",
  baseManifest(region({ renderedExampleCount: 0 })),
  "FORM_DETAIL_LOWER_REGION_RENDERED_EXAMPLE_COUNT_MISSING",
);

assertFail(
  "generic notes visual pattern fails",
  baseManifest(region({ visualPattern: "generic notes", plannedYeeflowControl: "generic notes" })),
  "FORM_DETAIL_LOWER_REGION_VISUAL_PATTERN_UNSUPPORTED",
);

assertFail(
  "page end only lower region fails",
  baseManifest("Page end"),
  "FORM_DETAIL_LOWER_PAGE_BUSINESS_REGION_GENERIC",
);

assertFail(
  "ready for blueprint blocked when visual concreteness fails",
  baseManifest(region({ visualConcretenessStatus: "fail" })),
  "FORM_DETAIL_LOWER_REGION_VISUAL_CONCRETENESS_NOT_PASSING",
);

assertPass("related documents data table with rendered rows passes", baseManifest(relatedDocumentsTable()));
assertPass("renewal tasks Collection cards with realistic task examples passes", baseManifest(renewalTaskCards()));
assertPass("approval history Vertical Timeline with decision rows passes", baseManifest(approvalTimeline()));
assertPass("required document checklist rows with file states passes", baseManifest(requiredDocumentChecklist()));
assertPass("intentional empty state with component reason and next action passes", baseManifest(intentionalEmptyState()));

console.log("Full-page lower-region visual concreteness gate tests passed");
