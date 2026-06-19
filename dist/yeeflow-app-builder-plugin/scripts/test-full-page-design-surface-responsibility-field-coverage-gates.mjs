#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-design-surface-responsibility-"));

function baseManifest(artifact) {
  const designSystemPath = "docs/generated-ui/vendor-contract-management/application-design-system.md";
  const deferredSurfaces = /approval/i.test(artifact.surfaceType) && !/submission/i.test(artifact.surfaceType)
    ? [
        {
          surfaceName: "Contract Approval Submission",
          surfaceType: "Approval Submission form",
          sourceResourceName: artifact.sourceResourceName,
          status: "deferred",
          reason: "Sibling submission surface is outside this focused regression case.",
          fallback: "Covered by dedicated submission test cases.",
          proofImpact: "This case proves task/print responsibility only.",
        },
      ]
    : [];
  return {
    applicationName: "Vendor Contract Management",
    pluginVersion: "0.6.69",
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
      modernVisualQualityStandard: "Polished business UI with App Plan faithful form surfaces.",
      responsivePlan: "Forms stack fields and related regions on mobile.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [
      {
        surfaceName: artifact.surfaceName,
        surfaceType: artifact.surfaceType,
        sourceAppPlanSection: artifact.sourceAppPlanSection,
        sourceResourceName: artifact.sourceResourceName,
      },
      ...deferredSurfaces.map((surface) => ({
        surfaceName: surface.surfaceName,
        surfaceType: surface.surfaceType,
        sourceAppPlanSection: "Approval Forms Plan",
        sourceResourceName: surface.sourceResourceName,
      })),
    ],
    artifacts: [artifact],
    deferredSurfaces,
  };
}

function artifact(surfaceName, surfaceType, sourceResourceName, overrides = {}) {
  const sourceAppPlanSection = /approval/i.test(surfaceType)
    ? "Approval Forms Plan"
    : /document/i.test(surfaceType)
      ? "Data lists and Document libraries"
      : "Custom Data List Forms Plan";
  const baseFields = ["Name", "Owner", "Renewal date", "Status"];
  const baseActions = /view|detail/i.test(surfaceType) ? ["Edit", "Open related record"] : ["Save", "Cancel"];
  return {
    surfaceName,
    surfaceType,
    sourceAppPlanSection,
    sourceResourceName,
    designSystemPath: "docs/generated-ui/vendor-contract-management/application-design-system.md",
    applicationLayoutType: "form-surface-no-app-chrome",
    includeHeaderNavigation: false,
    selectedLayoutChromeCompliance: "form surface uses Application Design System without app chrome",
    canonicalDesktopImagePath: `assets/generated-ui/vendor-contract-management/${slug(surfaceName)}.design.png`,
    responsivePlanReference: "docs/generated-ui/vendor-contract-management/application-design-system.md#mobile-responsive-rules",
    imageDimensions: "1440x2200",
    fullPageCoverageStatus: "full-page",
    includedSections: ["Record header", "Current record fields", "Action row", "Related business region"],
    majorPlannedControlsShown: ["Input controls", "Status badges", "Read-only field group"],
    businessDataExamplesShown: ["MSA-2026 Acme Supplies renewal due 2026-08-15 owned by Mira Chen"],
    pageEndIncluded: true,
    layoutFidelityStatus: "pass",
    visualQualityStatus: "pass",
    visualUsabilityStatus: "pass",
    textOverflowStatus: "pass",
    overlapStatus: "pass",
    spacingStatus: "pass",
    mobileUsabilityStatus: "pass",
    responsiveLayoutEvidence: "Mobile form stacks fields, action row, and related business regions into a single column.",
    textWrappingStrategy: "Long field labels and action labels wrap or truncate with ellipsis.",
    containerBoundaryEvidence: "Fields, buttons, and related-record cards fit inside reviewed containers.",
    visualUsabilityFindings: ["No text overflow, overlap, clipped content, or mobile layout pressure found."],
    modernVisualQualityChecklist: [
      `${surfaceName} shows App Plan fields and actions for ${sourceResourceName}.`,
      `${surfaceName} keeps current-record responsibility distinct from unrelated regions.`,
    ],
    antiPatternCheck: "pass: no generic scaffold or unrelated regions",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    primaryBusinessObject: sourceResourceName,
    semanticFieldExamples: [
      { field: "Name", value: "MSA-2026 Acme Supplies" },
      { field: "Owner", value: "Mira Chen" },
      { field: "Renewal Date", value: "2026-08-15" },
      { field: "Status", value: "Pending Legal Review" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions: [relatedRegion(sourceResourceName)],
    businessRegionEvidence: `${surfaceName} uses only planned related business regions for ${sourceResourceName}.`,
    formPurposeDifferentiators: [`${surfaceName} has surface-specific field states and action coverage.`],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      `${surfaceName} shows ${sourceResourceName} fields, ownership, status, and action responsibility.`,
      `${surfaceName} maps related regions to App Plan resources with concrete rendered examples.`,
    ],
    appPlanResourceRef: `${sourceAppPlanSection} > ${sourceResourceName}`,
    sourceResourceType: /document/i.test(surfaceType) ? "Document Library" : /approval/i.test(surfaceType) ? "Approval form" : "Data List",
    sourceListOrFormName: sourceResourceName,
    surfaceResponsibility: `${surfaceName} fulfills the ${surfaceType} responsibility for ${sourceResourceName}.`,
    plannedFieldCoverage: baseFields,
    requiredFieldsShown: baseFields,
    optionalFieldsShown: [],
    missingPlannedFields: [],
    fieldCoverageStatus: "pass",
    plannedActions: baseActions,
    actionsShown: baseActions,
    missingRequiredActions: [],
    actionCoverageStatus: "pass",
    forbiddenRegionsPresent: [],
    forbiddenRegionStatus: "pass",
    surfaceResponsibilityStatus: "pass",
    appPlanTraceabilityStatus: "pass",
    ...overrides,
  };
}

function relatedRegion(sourceResourceName, overrides = {}) {
  return {
    name: "Related Contracts",
    purpose: "Show current-record related contract context.",
    sourceList: "Contracts",
    sourceListOrDataSource: "Contracts",
    visualPattern: "Data table",
    plannedYeeflowControl: "Data table",
    renderedExampleCount: 2,
    renderedExampleSummary:
      "Row 1: MSA-2026 Acme Supplies, owner Mira Chen, renewal date 2026-08-15, lifecycle status Active. Row 2: Support Renewal 2026, owner Omar Chen, renewal date 2026-09-01, lifecycle status In review.",
    displayedBusinessFields: ["Contract", "Owner", "Renewal date", "Lifecycle status"],
    displayedFields: ["Contract", "Owner", "Renewal date", "Lifecycle status"],
    actionsShown: ["Open contract"],
    visualConcretenessStatus: "pass",
    antiPlaceholderStatus: "pass",
    behavior: "read-only related records",
    blueprintMappingHint: `Map to Data table rows related to ${sourceResourceName}.`,
    proofImpact: "Blueprint must preserve current-record related resource binding.",
    ...overrides,
  };
}

function submission(overrides = {}) {
  return artifact("Contract Approval Submission", "Approval Submission form", "Contract Approval", {
    sourceResourceType: "Approval form",
    sourceListOrFormName: "Contract Approval",
    plannedFieldCoverage: ["Contract title", "Vendor", "Contract owner", "Renewal date", "Payment terms", "Related Documents Sub List"],
    requiredFieldsShown: ["Contract title", "Vendor", "Contract owner", "Renewal date", "Payment terms", "Related Documents Sub List"],
    plannedActions: ["Save as draft", "Submit"],
    actionsShown: ["Save as draft", "Submit"],
    majorPlannedControlsShown: ["Input controls", "Dynamic Sub List", "Submit button"],
    lowerPageBusinessRegions: [
      relatedRegion("Contract Approval", {
        name: "Related Documents Sub List",
        purpose: "Capture submission document rows as a planned Sub List.",
        sourceList: "Contract Documents",
        sourceListOrDataSource: "Contract Documents",
        visualPattern: "Dynamic Sub List",
        plannedYeeflowControl: "Dynamic Sub List",
        displayedBusinessFields: ["Document type", "Required", "Uploaded file", "Status"],
        displayedFields: ["Document type", "Required", "Uploaded file", "Status"],
        actionsShown: ["Open document"],
        blueprintMappingHint: "Map to Dynamic Sub List rows inside the Approval Submission form.",
      }),
    ],
    surfaceResponsibility: "Approval Submission form captures request input fields and planned Related Documents Sub List.",
    ...overrides,
  });
}

function task(overrides = {}) {
  return artifact("Contract Approval Task", "Approval Task form", "Contract Approval", {
    plannedFieldCoverage: ["Contract title", "Vendor", "Contract owner", "Reviewer comments", "Decision"],
    requiredFieldsShown: ["Contract title", "Vendor", "Contract owner", "Reviewer comments", "Decision"],
    plannedActions: ["Approve", "Reject"],
    actionsShown: ["Approve", "Reject"],
    surfaceResponsibility: "Approval Task form shows read-only request context plus task decision controls.",
    includedSections: ["Read-only request context", "Reviewer comments", "Decision controls", "Prior approval timeline"],
    ...overrides,
  });
}

function printPage(overrides = {}) {
  return artifact("Contract Approval Print", "Approval Print page", "Contract Approval", {
    plannedFieldCoverage: ["Contract title", "Vendor", "Contract owner", "Renewal date", "Approval decision", "Signature date"],
    requiredFieldsShown: ["Contract title", "Vendor", "Contract owner", "Renewal date", "Approval decision", "Signature date"],
    plannedActions: ["Print", "Export PDF"],
    actionsShown: ["Print", "Export PDF"],
    surfaceResponsibility: "Approval Print page is read-only and print-oriented with approval evidence.",
    includedSections: ["Read-only printable fields", "Approval evidence", "Signature block"],
    majorPlannedControlsShown: ["Read-only field group", "Signature block", "Print footer"],
    lowerPageBusinessRegions: [
      relatedRegion("Contract Approval", {
        name: "Signature Block",
        purpose: "Show print signature and approval evidence.",
        sourceList: "Contract Approval",
        sourceListOrDataSource: "Contract Approval",
        visualPattern: "signature block",
        plannedYeeflowControl: "signature block",
        displayedBusinessFields: ["Signer", "Decision", "Decision date"],
        displayedFields: ["Signer", "Decision", "Decision date"],
        actionsShown: ["Print"],
        blueprintMappingHint: "Map to print signature block.",
      }),
    ],
    ...overrides,
  });
}

function vendorNewEdit(overrides = {}) {
  const fields = ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"];
  return artifact("Vendor New/Edit", "Data List Add/Edit form", "Vendors", {
    plannedFieldCoverage: fields,
    requiredFieldsShown: fields,
    plannedActions: ["Save", "Cancel"],
    actionsShown: ["Save", "Cancel"],
    surfaceResponsibility: "Data List New/Edit form edits the current Vendor item and prioritizes App Plan field coverage.",
    ...overrides,
  });
}

function contractNewEdit(overrides = {}) {
  const fields = ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms", "Effective Date", "Expiration Date", "Contract Value", "Related Documents", "Renewal Reminder", "Notes"];
  return artifact("Contract New/Edit", "Data List Add/Edit form", "Contracts", {
    plannedFieldCoverage: fields,
    requiredFieldsShown: fields,
    plannedActions: ["Save", "Cancel"],
    actionsShown: ["Save", "Cancel"],
    surfaceResponsibility: "Data List New/Edit form edits the current Contract item and all App Plan add/edit fields.",
    ...overrides,
  });
}

function dataListView(overrides = {}) {
  return artifact("Vendor View", "Data List View form", "Vendors", {
    plannedFieldCoverage: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"],
    requiredFieldsShown: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"],
    plannedActions: ["Edit", "Open related contract"],
    actionsShown: ["Edit", "Open related contract"],
    surfaceResponsibility: "Data List View form displays current Vendor record fields plus explicitly planned related contracts.",
    ...overrides,
  });
}

function documentNewEdit(overrides = {}) {
  const fields = ["File upload", "Document name", "Document type", "Linked Contract", "Status", "Uploaded by", "Uploaded date", "Notes"];
  return artifact("Document New/Edit", "Document Library New/Edit form", "Contract Documents", {
    sourceResourceType: "Document Library",
    plannedFieldCoverage: fields,
    requiredFieldsShown: fields,
    plannedActions: ["Upload", "Save", "Cancel"],
    actionsShown: ["Upload", "Save", "Cancel"],
    surfaceResponsibility: "Document Library New/Edit form captures file upload and document metadata.",
    ...overrides,
  });
}

function documentView(overrides = {}) {
  const fields = ["Document name", "Document type", "Linked Contract", "Status", "Uploaded by", "Uploaded date", "Notes"];
  return artifact("Document View", "Document Library View form", "Contract Documents", {
    sourceResourceType: "Document Library",
    plannedFieldCoverage: fields,
    requiredFieldsShown: fields,
    plannedActions: ["Open document", "Download", "View linked contract"],
    actionsShown: ["Open document", "Download", "View linked contract"],
    surfaceResponsibility: "Document Library View form displays metadata and document preview/open/download behavior.",
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

assertFail("Approval Submission missing Save as draft and Submit fails", baseManifest(submission({ actionsShown: [] })), "APPROVAL_SUBMISSION_REQUIRED_ACTION_MISSING");
assertPass("Approval Submission includes Save as draft and Submit passes", baseManifest(submission()));
assertFail("Approval Submission duplicated internal hero title card fails", baseManifest(submission({ includedSections: ["Duplicated title hero card", "Request fields", "Action row"] })), "APPROVAL_SUBMISSION_FORBIDDEN_REGION_PRESENT");
assertFail("Approval Submission visible Approval Route Preview without planning fails", baseManifest(submission({ includedSections: ["Request fields", "Approval Route Preview", "Action row"] })), "APPROVAL_SUBMISSION_FORBIDDEN_REGION_PRESENT");
assertFail("Approval Submission Audit Activity without planning fails", baseManifest(submission({ includedSections: ["Request fields", "Audit Activity", "Action row"] })), "APPROVAL_SUBMISSION_FORBIDDEN_REGION_PRESENT");
assertFail(
  "Approval Submission Related Documents generic table when Sub List planned fails",
  baseManifest(submission({ majorPlannedControlsShown: ["Input controls", "generic data table", "Submit button"] })),
  "APPROVAL_SUBMISSION_SUB_LIST_RENDERING_MISMATCH",
);
assertPass("Approval Submission Related Documents planned Sub List passes", baseManifest(submission()));

assertFail("Approval Task missing Approve Reject or Complete fails", baseManifest(task({ actionsShown: [] })), "APPROVAL_TASK_REQUIRED_DECISION_ACTION_MISSING");
assertFail("Approval Task Submit-only primary action fails", baseManifest(task({ actionsShown: ["Submit"] })), "APPROVAL_TASK_SUBMIT_ONLY_ACTION_INVALID");
assertPass("Approval Task includes Approve Reject and read-only request context passes", baseManifest(task()));

assertFail("Approval Print Page editable fields actions fails", baseManifest(printPage({ actionsShown: ["Save", "Submit"], includedSections: ["Editable inputs", "Signature block"] })), "APPROVAL_PRINT_EDITABLE_CONTROL_PRESENT");
assertPass("Approval Print Page read-only print-oriented passes", baseManifest(printPage()));

assertFail("Vendor New Edit missing two planned fields fails", baseManifest(vendorNewEdit({ requiredFieldsShown: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status"] })), "DESIGN_ARTIFACT_PLANNED_FIELD_COVERAGE_INCOMPLETE");
assertPass("Vendor New Edit all six planned fields passes", baseManifest(vendorNewEdit()));
assertFail("Contract New Edit missing planned contract fields fails", baseManifest(contractNewEdit({ requiredFieldsShown: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date"] })), "DESIGN_ARTIFACT_PLANNED_FIELD_COVERAGE_INCOMPLETE");
assertFail("Data List New Edit Collection filters analytics audit fails", baseManifest(vendorNewEdit({ includedSections: ["Current fields", "Collection", "Data filters", "Data analytics", "Audit Activity"] })), "DATA_LIST_NEW_EDIT_FORBIDDEN_REGION_PRESENT");
assertPass("Data List New Edit current list fields Save Cancel passes", baseManifest(vendorNewEdit()));

assertFail("Data List View unrelated task document approval regions fail", baseManifest(dataListView({ includedSections: ["Vendor fields", "unrelated task region", "unrelated document region", "unrelated approval region"] })), "DATA_LIST_VIEW_UNRELATED_REGION_PRESENT");
assertPass("Data List View current record fields and planned related regions passes", baseManifest(dataListView()));

assertFail("Document New Edit missing file metadata fields fails", baseManifest(documentNewEdit({ requiredFieldsShown: ["Document name", "Status"] })), "DESIGN_ARTIFACT_PLANNED_FIELD_COVERAGE_INCOMPLETE");
assertPass("Document New Edit includes file metadata and upload action passes", baseManifest(documentNewEdit()));
assertFail("Document View lacks preview open download behavior fails", baseManifest(documentView({ actionsShown: ["Read-only metadata"] })), "DOCUMENT_VIEW_OPEN_DOWNLOAD_ACTION_MISSING");
assertPass("Document View metadata and open download actions passes", baseManifest(documentView()));

assertFail("fieldCoverageStatus pass with missingPlannedFields fails", baseManifest(vendorNewEdit({ missingPlannedFields: ["Notes"] })), "DESIGN_ARTIFACT_FIELD_COVERAGE_INCONSISTENT");
assertFail("actionCoverageStatus pass with missingRequiredActions fails", baseManifest(vendorNewEdit({ missingRequiredActions: ["Cancel"] })), "DESIGN_ARTIFACT_ACTION_COVERAGE_INCONSISTENT");
assertPass(
  "explicit field and action deferral with reason fallback proof impact passes",
  baseManifest(vendorNewEdit({
    fieldCoverageStatus: "deferred",
    actionCoverageStatus: "deferred",
    missingPlannedFields: ["Unsupported legacy score"],
    missingRequiredActions: ["Bulk archive"],
    missingPlannedFieldDeferrals: [{ status: "deferred", reason: "Unsupported field pending export learning.", fallback: "Hide field in v1.", proofImpact: "Blueprint cannot map the field until export learning completes." }],
    missingRequiredActionDeferrals: [{ status: "deferred", reason: "Bulk archive action is unsupported.", fallback: "Use row-level archive.", proofImpact: "Blueprint excludes bulk archive until runtime proof." }],
  })),
);

console.log("Full-page design surface responsibility and field/action coverage gate tests passed");
