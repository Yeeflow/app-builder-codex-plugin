#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-form-detail-semantic-quality-"));

function baseManifest() {
  const designSystemPath = "docs/generated-ui/vendor-contract-management/application-design-system.md";
  return {
    applicationName: "Vendor Contract Management",
    pluginVersion: "0.6.66",
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
      modernVisualQualityStandard:
        "Strong hierarchy, polished spacing, page-specific business composition, realistic business data, and no generic scaffold anti-patterns.",
      responsivePlan: "Forms become single-column on mobile; action bars stack or become sticky.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [surface("Contract View", "Data List View form", "Custom Data List Forms Plan", "Contracts")],
    artifacts: [validContractView()],
    deferredSurfaces: [],
  };
}

function surface(surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName) {
  return { surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName };
}

function baseArtifact(surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName, extra = {}) {
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
    includedSections: ["Contract header", "Contract fields", "Related documents", "Renewal tasks", "Approval history"],
    majorPlannedControlsShown: ["Text inputs", "User picker", "Date picker", "Attachment list", "Related record table"],
    businessDataExamplesShown: ["MSA-2026 Acme Supplies renewal due 2026-08-15 owned by Mira Chen"],
    pageEndIncluded: true,
    layoutFidelityStatus: "pass",
    visualQualityStatus: "pass",
    modernVisualQualityChecklist: [
      "contract header hierarchy shows vendor, owner, renewal date, approval status, and payment terms",
      "related renewal tasks and approval history are visually separated in lower-page business regions",
      "document checklist and attachment list use realistic contract document examples",
    ],
    antiPatternCheck: "pass: no generic scaffold, page-end-only, blank lower region, or helper-text-only sections",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    primaryBusinessObject: "Contract",
    semanticFieldExamples: [
      { field: "Contract Title / Name", value: "MSA-2026 Acme Supplies" },
      { field: "Vendor", value: "Acme Supplies" },
      { field: "Contract Owner", value: "Mira Chen" },
      { field: "Renewal Date", value: "2026-08-15" },
      { field: "Approval Status", value: "Pending Legal Review" },
      { field: "Payment Terms", value: "Net 45" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions: [
      {
        name: "Related Documents",
        purpose: "Show contract evidence and required document coverage.",
        sourceList: "Contract Documents",
        displayedFields: ["Document name", "Document type", "Uploaded by", "Upload date"],
        behavior: "read-only list with open document action",
        proofImpact: "Blueprint must bind attachment/document rows to the Contract Documents source.",
      },
      {
        name: "Renewal Tasks",
        purpose: "Show active renewal work linked to this contract.",
        sourceList: "Renewal Tasks",
        displayedFields: ["Task", "Owner", "Due date", "Status"],
        behavior: "read-only related task list with open detail action",
        proofImpact: "Blueprint must include related task source and open-detail behavior.",
      },
      {
        name: "Approval History",
        purpose: "Show prior review decisions and reviewer comments.",
        sourceList: "Contract Approval",
        displayedFields: ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
        behavior: "read-only timeline",
        proofImpact: "Blueprint must preserve approval history section.",
      },
    ],
    businessRegionEvidence: "Related Documents, Renewal Tasks, and Approval History show contract-specific lower-page content.",
    formPurposeDifferentiators: ["Read-only contract view with related documents, renewal task list, and approval timeline."],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      "Contract View shows contract header, vendor, owner, renewal date, approval status, and payment terms.",
      "Contract View lower page shows related documents, renewal tasks, and approval history for the selected contract.",
    ],
    ...extra,
  };
}

function validContractView(extra = {}) {
  return baseArtifact("Contract View", "Data List View form", "Custom Data List Forms Plan", "Contracts", extra);
}

function validApprovalTask(extra = {}) {
  return baseArtifact("Contract Approval - Legal Task", "Approval Task form", "Approval Forms Plan", "Contract Approval", {
    primaryBusinessObject: "Contract Approval Task",
    includedSections: ["Read-only contract context", "Decision controls", "Reviewer comments", "Document checklist", "Prior approval timeline"],
    semanticFieldExamples: [
      { field: "Contract Title", value: "MSA-2026 Acme Supplies" },
      { field: "Reviewer", value: "Legal Review Team" },
      { field: "Decision", value: "Approve" },
      { field: "Reviewer Comment", value: "Legal terms reviewed for renewal." },
      { field: "Renewal Date", value: "2026-08-15" },
    ],
    lowerPageBusinessRegions: [
      {
        name: "Document Checklist",
        purpose: "Confirm required evidence before approval.",
        sourceList: "Contract Documents",
        displayedFields: ["Document type", "Required", "Received", "Owner"],
        behavior: "read-only checklist",
        proofImpact: "Blueprint must include the document checklist region for task review.",
      },
      {
        name: "Prior Approval Timeline",
        purpose: "Show earlier approval decisions and comments.",
        sourceList: "Contract Approval",
        displayedFields: ["Step", "Reviewer", "Decision", "Comment", "Date"],
        behavior: "read-only timeline",
        proofImpact: "Blueprint must preserve task-specific approval history.",
      },
    ],
    formPurposeDifferentiators: ["Task form includes decision controls, reviewer comments, and read-only contract context."],
    pageSpecificQualityEvidence: [
      "Approval Task form shows read-only contract context, decision controls, reviewer comment field, and renewal date.",
      "Approval Task form lower page shows document checklist and prior approval timeline.",
    ],
    ...extra,
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

{
  const manifest = baseManifest();
  manifest.artifacts[0].semanticFieldExamples[0].value = "Active";
  assertFail("contract title using Active fails semantic validation", manifest, "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].semanticFieldExamples[2].value = "Task overdue";
  assertFail("owner field using task overdue fails semantic validation", manifest, "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].semanticFieldExamples[3].value = "Signed Contract.pdf";
  assertFail("date field using document filename fails semantic validation", manifest, "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].lowerPageBusinessRegions = ["Page end"];
  assertFail("page end only lower-page region fails", manifest, "FORM_DETAIL_LOWER_PAGE_BUSINESS_REGION_GENERIC");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].lowerPageBusinessRegions = ["Generic notes"];
  assertFail("generic notes lower-page region fails", manifest, "FORM_DETAIL_LOWER_PAGE_BUSINESS_REGION_GENERIC");
}

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].pageSpecificQualityEvidence;
  assertFail("missing page-specific quality evidence fails", manifest, "FORM_DETAIL_PAGE_SPECIFIC_QUALITY_EVIDENCE_MISSING");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].pageSpecificQualityEvidence = ["strong visual hierarchy", "professional spacing and density"];
  assertFail("generic-only quality evidence blocks blueprint readiness", manifest, "FORM_DETAIL_PAGE_SPECIFIC_QUALITY_EVIDENCE_GENERIC");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].formPurposeDifferentiators = [];
  const duplicate = validContractView({
    surfaceName: "Contract Renewal View",
    canonicalDesktopImagePath: "assets/generated-ui/vendor-contract-management/contract-renewal-view.design.png",
    formPurposeDifferentiators: [],
  });
  manifest.plannedSurfaces.push(surface("Contract Renewal View", "Data List View form", "Custom Data List Forms Plan", "Contracts"));
  manifest.artifacts.push(duplicate);
  assertFail("duplicate generic form composition triggers template reuse risk", manifest, "FORM_DETAIL_TEMPLATE_REUSE_RISK");
}

{
  const manifest = baseManifest();
  manifest.plannedSurfaces = [
    surface("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval"),
    surface("Contract Approval - Legal Task", "Approval Task form", "Approval Forms Plan", "Contract Approval"),
  ];
  manifest.artifacts = [
    baseArtifact("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval", {
      includedSections: ["Editable contract request", "Required documents", "Submit actions", "Workflow preview", "Approval history"],
      formPurposeDifferentiators: ["Submission form keeps fields editable and exposes Save as draft and Submit actions."],
      pageSpecificQualityEvidence: [
        "Submission form shows editable contract request fields, required documents, submit actions, and workflow preview.",
        "Submission form lower page shows approval history and required document coverage before submission.",
      ],
    }),
    validApprovalTask(),
  ];
  assertPass("shared submission and task style passes with purposeful differences", manifest);
}

assertPass("valid contract view semantic design passes", baseManifest());

{
  const manifest = baseManifest();
  manifest.plannedSurfaces = [
    surface("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval"),
    surface("Contract Approval - Legal Task", "Approval Task form", "Approval Forms Plan", "Contract Approval"),
  ];
  manifest.artifacts = [
    baseArtifact("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval", {
      formPurposeDifferentiators: ["Submission form includes editable request fields and submit action."],
      pageSpecificQualityEvidence: [
        "Submission form shows editable contract request fields, vendor, renewal date, and submit action.",
        "Submission form lower page shows required documents and approval preview for the contract.",
      ],
    }),
    validApprovalTask(),
  ];
  assertPass("valid approval task form semantic design passes", manifest);
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].fieldValueSemanticsStatus = "human_review_required";
  assertFail("ready for blueprint blocked when semantic quality needs review", manifest, "FORM_DETAIL_READY_WITHOUT_SEMANTIC_QUALITY");
}

console.log("Full-page form/detail semantic quality gate tests passed");
