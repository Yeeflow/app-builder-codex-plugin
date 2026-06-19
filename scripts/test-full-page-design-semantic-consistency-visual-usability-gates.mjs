#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-design-semantic-usability-"));

function baseManifest(region = linkedContractsRegion(), artifactOverrides = {}) {
  const designSystemPath = "docs/generated-ui/vendor-contract-management/application-design-system.md";
  return {
    applicationName: "Vendor Contract Management",
    pluginVersion: "0.6.68",
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
      modernVisualQualityStandard: "Polished business UI with semantic consistency and visual usability.",
      responsivePlan: "Forms become single-column on mobile; lower-page regions stack.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [
      {
        surfaceName: "Vendor View",
        surfaceType: "Data List View form",
        sourceAppPlanSection: "Custom Data List Forms Plan",
        sourceResourceName: "Vendors",
      },
    ],
    artifacts: [vendorViewArtifact([region], artifactOverrides)],
    deferredSurfaces: [],
  };
}

function vendorViewArtifact(lowerPageBusinessRegions, overrides = {}) {
  return {
    surfaceName: "Vendor View",
    surfaceType: "Data List View form",
    sourceAppPlanSection: "Custom Data List Forms Plan",
    sourceResourceName: "Vendors",
    designSystemPath: "docs/generated-ui/vendor-contract-management/application-design-system.md",
    applicationLayoutType: "form-surface-no-app-chrome",
    includeHeaderNavigation: false,
    selectedLayoutChromeCompliance: "form surface uses Application Design System without app chrome",
    canonicalDesktopImagePath: "assets/generated-ui/vendor-contract-management/vendor-view.design.png",
    responsivePlanReference: "docs/generated-ui/vendor-contract-management/application-design-system.md#mobile-responsive-rules",
    imageDimensions: "1440x2200",
    fullPageCoverageStatus: "full-page",
    includedSections: ["Vendor summary", "Vendor fields", "Linked Contracts lower-page region"],
    majorPlannedControlsShown: ["Text inputs", "User picker", "Data table", "Collection", "Vertical Timeline"],
    businessDataExamplesShown: ["Acme Supplies with 4 active contracts and renewal exposure in Q3"],
    pageEndIncluded: true,
    layoutFidelityStatus: "pass",
    visualQualityStatus: "pass",
    visualUsabilityStatus: "pass",
    textOverflowStatus: "pass",
    overlapStatus: "pass",
    spacingStatus: "pass",
    mobileUsabilityStatus: "pass",
    responsiveLayoutEvidence: "Mobile Vendor View stacks summary, linked contracts, and history regions vertically.",
    textWrappingStrategy: "Long contract names wrap in linked-contract rows; badges truncate with ellipsis if needed.",
    containerBoundaryEvidence: "Linked-contract table cells, action chips, and field labels fit within reviewed container bounds.",
    visualUsabilityFindings: ["No text overflow, overlap, spacing, clipping, or mobile layout pressure found."],
    modernVisualQualityChecklist: [
      "Vendor View shows vendor summary, owner, payment exposure, and linked contract regions.",
      "Linked Contracts shows realistic contract rows, owners, renewal dates, statuses, and actions.",
    ],
    antiPatternCheck: "pass: no placeholder-only, overflow, overlap, or generic lower-page regions",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    primaryBusinessObject: "Vendor",
    semanticFieldExamples: [
      { field: "Vendor Name", value: "Acme Supplies" },
      { field: "Vendor Owner", value: "Mira Chen" },
      { field: "Payment Terms", value: "Net 45" },
      { field: "Vendor Status", value: "Active Vendor" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions,
    businessRegionEvidence: "Lower-page regions contain semantically consistent rendered business rows.",
    formPurposeDifferentiators: ["Vendor View emphasizes linked contracts and vendor relationship context."],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      "Vendor View shows vendor owner, payment terms, contract exposure, and linked contracts.",
      "Linked Contracts rows show contract, owner, renewal date, lifecycle status, and contract actions.",
    ],
    ...overrides,
  };
}

function linkedContractsRegion(overrides = {}) {
  return {
    name: "Linked Contracts",
    purpose: "List contracts attached to the current vendor.",
    sourceList: "Contracts",
    sourceListOrDataSource: "Contracts",
    visualPattern: "Data table",
    plannedYeeflowControl: "Data table",
    renderedExampleCount: 2,
    renderedExampleSummary:
      "Row 1: MSA-2026 Acme Supplies, owner Mira Chen, renewal date 2026-08-15, lifecycle status Active. Row 2: Support Renewal 2026, owner Omar Chen, renewal date 2026-09-01, lifecycle status In review.",
    displayedBusinessFields: ["Contract", "Owner", "Renewal date", "Lifecycle status"],
    displayedFields: ["Contract", "Owner", "Renewal date", "Lifecycle status"],
    actionsShown: ["Open contract", "Review renewal"],
    visualConcretenessStatus: "pass",
    antiPlaceholderStatus: "pass",
    behavior: "related contract table with open contract and review renewal actions",
    blueprintMappingHint: "Map to Data table rows bound to Contracts filtered by current Vendor.",
    proofImpact: "Blueprint must bind linked contract rows to Contracts through current Vendor relationship.",
    ...overrides,
  };
}

function documentRegion(overrides = {}) {
  return linkedContractsRegion({
    name: "Related Documents",
    purpose: "Show vendor contract evidence and uploaded files.",
    sourceList: "Contract Documents",
    sourceListOrDataSource: "Contract Documents",
    visualPattern: "document table",
    plannedYeeflowControl: "Data table",
    renderedExampleSummary:
      "Row 1: Signed MSA.pdf, type Signed Contract, status Received, uploaded 2026-06-01. Row 2: Insurance Certificate.pdf, type Compliance Evidence, status Required, uploaded 2026-06-04.",
    displayedBusinessFields: ["Document name", "Document type", "Status", "Uploaded date"],
    displayedFields: ["Document name", "Document type", "Status", "Uploaded date"],
    actionsShown: ["Open document", "Request missing file"],
    behavior: "document table with open document action",
    blueprintMappingHint: "Map to Data table rows bound to Contract Documents.",
    proofImpact: "Blueprint must bind document rows to Contract Documents.",
    ...overrides,
  });
}

function approvalHistoryRegion(overrides = {}) {
  return linkedContractsRegion({
    name: "Approval History",
    purpose: "Show prior approval decisions and reviewer comments.",
    sourceList: "Contract Approval",
    sourceListOrDataSource: "Contract Approval",
    visualPattern: "Vertical Timeline",
    plannedYeeflowControl: "Vertical Timeline",
    renderedExampleSummary:
      "Timeline event 1: Legal Review, reviewer Nia Patel, decision Approved, comment Terms acceptable, timestamp 2026-06-03. Timeline event 2: Finance Review, reviewer Omar Chen, decision Pending, timestamp 2026-06-05.",
    displayedBusinessFields: ["Step", "Reviewer", "Decision", "Comment", "Timestamp"],
    displayedFields: ["Step", "Reviewer", "Decision", "Comment", "Timestamp"],
    actionsShown: ["View approval"],
    behavior: "read-only approval timeline",
    blueprintMappingHint: "Map to Vertical Timeline events bound to Contract Approval history.",
    proofImpact: "Blueprint must preserve approval reviewer and decision history.",
    ...overrides,
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
  "Vendor View Linked Contracts using Renewal Task fields/actions fails",
  baseManifest(
    linkedContractsRegion({
      displayedFields: ["Task", "Due date", "Status", "Priority"],
      actionsShown: ["Open task detail", "Mark complete"],
      blueprintMappingHint: "Map to Renewal Tasks filtered by current Contract.",
    }),
  ),
  "FORM_DETAIL_LOWER_REGION_CROSS_OBJECT_SEMANTIC_MISMATCH",
);

assertPass("Vendor View Linked Contracts with contract semantics passes", baseManifest(linkedContractsRegion()));

assertFail(
  "Document region using task fields and actions fails",
  baseManifest(
    documentRegion({
      displayedBusinessFields: ["Task", "Due date", "Status", "Priority"],
      displayedFields: ["Task", "Due date", "Status", "Priority"],
      actionsShown: ["Open task detail", "Mark complete"],
      blueprintMappingHint: "Map to Renewal Tasks filtered by current Contract.",
    }),
  ),
  "FORM_DETAIL_LOWER_REGION_CROSS_OBJECT_SEMANTIC_MISMATCH",
);

assertPass("Document region using document fields/actions passes", baseManifest(documentRegion()));

assertFail(
  "Approval History region using document task-card semantics fails",
  baseManifest(
    approvalHistoryRegion({
      displayedBusinessFields: ["Document name", "Task", "Priority", "Uploaded date"],
      displayedFields: ["Document name", "Task", "Priority", "Uploaded date"],
      actionsShown: ["Open document", "Open task detail"],
      blueprintMappingHint: "Map to document cards and Renewal Tasks cards.",
    }),
  ),
  "FORM_DETAIL_LOWER_REGION_CROSS_OBJECT_SEMANTIC_MISMATCH",
);

assertPass("Approval History region using reviewer decision timestamp semantics passes", baseManifest(approvalHistoryRegion()));

assertFail(
  "displayedBusinessFields and displayedFields mismatch without mapping fails",
  baseManifest(linkedContractsRegion({ displayedFields: ["Task", "Due date", "Status", "Priority"] })),
  "FORM_DETAIL_LOWER_REGION_FIELD_SEMANTIC_MISMATCH",
);

assertPass(
  "displayed fields mismatch passes with semanticFieldMapping",
  baseManifest(
    linkedContractsRegion({
      displayedFields: ["Contract title", "Contract owner", "Renewal date", "Lifecycle status"],
      semanticFieldMapping: {
        Contract: "Contract title",
        Owner: "Contract owner",
      },
    }),
  ),
);

assertFail(
  "blueprintMappingHint referencing wrong list fails",
  baseManifest(linkedContractsRegion({ blueprintMappingHint: "Map to Renewal Tasks filtered by current Contract." })),
  "FORM_DETAIL_LOWER_REGION_BLUEPRINT_MAPPING_SEMANTIC_MISMATCH",
);

assertPass(
  "blueprintMappingHint using explicit related-record relationship passes",
  baseManifest(linkedContractsRegion({ blueprintMappingHint: "Map to Data table rows bound to Contracts filtered by current Vendor.", relatedRecordRelationship: "Contracts are related records attached to current Vendor." })),
);

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].visualUsabilityStatus;
  assertFail("blueprint-ready artifact missing visualUsabilityStatus fails", manifest, "DESIGN_ARTIFACT_VISUAL_USABILITY_STATUS_MISSING");
}

assertFail("textOverflowStatus fail blocks blueprint", baseManifest(linkedContractsRegion(), { textOverflowStatus: "fail" }), "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER");
assertFail("overlapStatus fail blocks blueprint", baseManifest(linkedContractsRegion(), { overlapStatus: "fail" }), "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER");
assertFail("spacingStatus fail blocks blueprint", baseManifest(linkedContractsRegion(), { spacingStatus: "fail" }), "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER");
assertFail("mobileUsabilityStatus fail blocks blueprint", baseManifest(linkedContractsRegion(), { mobileUsabilityStatus: "fail" }), "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER");
assertFail("human review required without deferral blocks blueprint", baseManifest(linkedContractsRegion(), { visualUsabilityStatus: "human_review_required" }), "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER");

assertPass("visual usability statuses all pass with wrap responsive evidence", baseManifest(linkedContractsRegion()));

assertPass(
  "pass-with-reviewed-risk passes with risk mitigation and proof impact",
  baseManifest(linkedContractsRegion(), {
    visualUsabilityStatus: "pass-with-reviewed-risk",
    visualUsabilityRisk: "One long contract title may truncate on mobile.",
    visualUsabilityMitigation: "Use ellipsis plus tooltip and card-list fallback on mobile.",
    visualUsabilityProofImpact: "Blueprint must preserve truncation and tooltip behavior.",
  }),
);

assertFail(
  "long button badge table text without wrapping strategy fails",
  baseManifest(linkedContractsRegion(), {
    textWrappingStrategy: "none",
    visualUsabilityFindings: [
      "Button label Extremely Long Renewal Approval Escalation Workflow Action Label That Exceeds The Card Width",
    ],
  }),
  "DESIGN_ARTIFACT_LONG_TEXT_WITHOUT_WRAP_STRATEGY",
);

assertPass(
  "long text passes with explicit wrap truncate strategy",
  baseManifest(linkedContractsRegion(), {
    textWrappingStrategy:
      "Extremely Long Renewal Approval Escalation Workflow Action Label wraps to two lines or truncates with ellipsis inside action containers.",
    visualUsabilityFindings: ["Long labels reviewed with wrapping, truncation, and responsive card fallback."],
  }),
);

assertFail(
  "mobile desktop multi-column layout without stacking evidence fails",
  baseManifest(linkedContractsRegion(), {
    responsiveLayoutEvidence: "Mobile artifact keeps desktop 4-column layout for vendor fields.",
  }),
  "DESIGN_ARTIFACT_MOBILE_LAYOUT_PRESSURE",
);

assertPass(
  "mobile stacked layout evidence passes",
  baseManifest(linkedContractsRegion(), {
    responsiveLayoutEvidence: "Mobile artifact converts desktop 4-column layout into stacked single-column sections and card-list rows.",
  }),
);

console.log("Full-page design semantic consistency and visual usability gate tests passed");
