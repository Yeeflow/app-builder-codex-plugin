#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-design-artifacts-"));

function baseManifest() {
  const designSystemPath = "docs/generated-ui/vendor-contract-management/application-design-system.md";
  return {
    applicationName: "Vendor Contract Management",
    pluginVersion: "0.6.65",
    sourceFunctionalSpecificationPath: "docs/generated-app-plans/vendor-contract-management-functional-specification.md",
    sourceAppPlanPath: "docs/generated-app-plans/vendor-contract-management-yeeflow-app-plan.md",
    applicationLayoutType: "application-layout-1-vertical-nav",
    selectedApplicationLayout: "application-layout-1-vertical-nav",
    designSystemPath,
    applicationDesignSystem: {
      path: designSystemPath,
      status: "complete",
      generatedAt: "2026-06-19T01:00:00Z",
      applicationLayoutType: "application-layout-1-vertical-nav",
      applicationLayoutName: "Application layout 1: vertical navigation menu panel",
      applicationChromeStyleId: "layout-1-dark-header-dark-vertical-nav",
      headerMode: "dark-header",
      navMode: "vertical-nav",
      navBackgroundMode: "dark",
      contentSafeArea: "right-of-left-nav-below-header",
      layoutRuleSource: "docs/standards/yeeflow-application-layout-design-rules.md",
      modernVisualQualityStandard: "strong hierarchy, polished density, realistic data, no scaffold anti-patterns",
      responsivePlan: "Desktop dashboard shell stacks to mobile card lists; forms become single-column.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [
      surface("Operations Dashboard", "Dashboard page", "Dashboard Pages Plan", "Operations Dashboard"),
      surface("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval"),
      surface("Contract Approval - Manager Task", "Approval Task form", "Approval Forms Plan", "Contract Approval"),
      surface("Contract Approval - Print", "Approval Print page", "Approval Forms Plan", "Contract Approval"),
      surface("Vendor Contract - Add/Edit", "Data List Add/Edit form", "Custom Data List Forms Plan", "Vendor Contracts"),
      surface("Vendor Contract - View", "Data List View form", "Custom Data List Forms Plan", "Vendor Contracts"),
      surface("Contract Approval Form Report", "Form Report", "Form Reports Plan", "Contract Approval"),
    ],
    artifacts: [
      artifact("Operations Dashboard", "Dashboard page", "Dashboard Pages Plan", "Operations Dashboard", {
        includeHeaderNavigation: true,
        applicationLayoutType: "application-layout-1-vertical-nav",
        applicationChromeStyleId: "layout-1-dark-header-dark-vertical-nav",
        selectedLayoutChromeCompliance: "pass: dark header and dark connected vertical nav follow the selected layout chrome",
      }),
      artifact("Contract Approval - Submission", "Approval Submission form", "Approval Forms Plan", "Contract Approval", { includeHeaderNavigation: false }),
      artifact("Contract Approval - Manager Task", "Approval Task form", "Approval Forms Plan", "Contract Approval", { includeHeaderNavigation: false }),
      artifact("Contract Approval - Print", "Approval Print page", "Approval Forms Plan", "Contract Approval", { includeHeaderNavigation: false }),
      artifact("Vendor Contract - Add/Edit", "Data List Add/Edit form", "Custom Data List Forms Plan", "Vendor Contracts", { includeHeaderNavigation: false }),
      artifact("Vendor Contract - View", "Data List View form", "Custom Data List Forms Plan", "Vendor Contracts", { includeHeaderNavigation: false }),
    ],
    deferredSurfaces: [],
  };
}

function surface(surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName) {
  return { surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName };
}

function artifact(surfaceName, surfaceType, sourceAppPlanSection, sourceResourceName, extra = {}) {
  return {
    surfaceName,
    surfaceType,
    sourceAppPlanSection,
    sourceResourceName,
    designSystemPath: "docs/generated-ui/vendor-contract-management/application-design-system.md",
    canonicalDesktopImagePath: `assets/generated-ui/vendor-contract-management/${slug(surfaceName)}.design.png`,
    responsivePlanReference: "docs/generated-ui/vendor-contract-management/application-design-system.md#mobile-responsive-rules",
    imageDimensions: "1440x2200",
    fullPageCoverageStatus: "full-page",
    includedSections: ["Header", "Primary content", "Action area", "Lower-page region"],
    majorPlannedControlsShown: ["Collection", "Data table", "Status badges"],
    businessDataExamplesShown: ["Acme Supplies renewal due 2026-08-15 owned by Mira Chen"],
    pageEndIncluded: true,
    layoutFidelityStatus: "pass",
    visualQualityStatus: "pass",
    modernVisualQualityChecklist: [
      "strong visual hierarchy",
      "professional spacing and density",
      "realistic business rows/cards/statuses",
      "no generic scaffold look",
    ],
    antiPatternCheck: "pass: no title-only, helper-text-heavy, placeholder chart, or generic SaaS shell anti-patterns",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    ...semanticDefaults(surfaceName, surfaceType),
    ...extra,
  };
}

function semanticDefaults(surfaceName, surfaceType) {
  if (!/form|print/i.test(surfaceType)) return {};
  const isTask = /task/i.test(surfaceType);
  const isPrint = /print/i.test(surfaceType);
  return {
    primaryBusinessObject: isTask ? "Contract Approval Task" : "Vendor Contract",
    semanticFieldExamples: [
      { field: "Contract Title", value: `${surfaceName} MSA-2026` },
      { field: "Vendor", value: "Acme Supplies" },
      { field: "Contract Owner", value: "Mira Chen" },
      { field: "Renewal Date", value: "2026-08-15" },
      { field: "Approval Status", value: isPrint ? "Approved" : "Pending Legal Review" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions: [
      {
        name: isPrint ? `${surfaceName} Signature Footer` : `${surfaceName} Approval History`,
        purpose: isPrint ? "Show print signature and decision history evidence." : "Show approval decisions and renewal task evidence for this surface.",
        sourceList: isPrint ? "Contract Approval" : "Renewal Tasks",
        visualPattern: isPrint ? "signature block" : "Vertical Timeline",
        plannedYeeflowControl: isPrint ? "signature block" : "Vertical Timeline",
        renderedExampleCount: isPrint ? 1 : 2,
        renderedExampleSummary: isPrint
          ? "Signature row: Legal Approver Nia Patel, decision Approved, signed date 2026-06-08."
          : "Timeline event 1: Renewal task assigned to Mira Chen, due 2026-07-15, status In progress. Timeline event 2: Manager review approved by Omar Chen on 2026-06-06.",
        displayedBusinessFields: isPrint ? ["Signer", "Decision", "Decision date"] : ["Task", "Owner", "Due date", "Status"],
        displayedFields: isPrint ? ["Signer", "Decision", "Decision date"] : ["Task", "Owner", "Due date", "Status"],
        actionsShown: isPrint ? ["Print signature block"] : ["Open task detail", "Read-only timeline"],
        visualConcretenessStatus: "pass",
        antiPlaceholderStatus: "pass",
        behavior: "read-only related records",
        blueprintMappingHint: isPrint ? "Map to print signature block rows." : "Map to Vertical Timeline or related task rows.",
        proofImpact: "Blueprint must preserve the lower-page business evidence region.",
      },
    ],
    businessRegionEvidence: `${surfaceName} includes page-specific approval, renewal, or signature evidence.`,
    formPurposeDifferentiators: [
      `${surfaceName} has purposeful differences for ${isTask ? "task decision controls" : isPrint ? "print signature output" : "form entry or view workflow"}.`,
    ],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      `${surfaceName} shows vendor contract fields, owner, renewal date, approval status, and payment context.`,
      `${surfaceName} lower page shows approval history, renewal tasks, document evidence, or print signature content.`,
    ],
  };
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
  return parsed;
}

function assertFail(name, manifest, code) {
  const { result, parsed } = runCase(name, manifest);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.equal(parsed.status, "fail", `${name} JSON status`);
  assert(parsed.findings.some((finding) => finding.code === code), `${name} should include ${code}:\n${JSON.stringify(parsed.findings, null, 2)}`);
  return parsed;
}

assertPass("form reports excluded from required design image surfaces", baseManifest());

{
  const manifest = baseManifest();
  manifest.plannedSurfaces = manifest.plannedSurfaces.filter((entry) => entry.surfaceType !== "Approval Submission form");
  assertFail("approval forms require submission surface", manifest, "APPROVAL_SUBMISSION_DESIGN_SURFACE_MISSING");
}

{
  const manifest = baseManifest();
  manifest.artifacts = manifest.artifacts.filter((entry) => entry.surfaceName !== "Vendor Contract - Add/Edit");
  assertFail("data list custom forms require artifact coverage", manifest, "DESIGN_SURFACE_COVERAGE_MISSING");
}

{
  const manifest = baseManifest();
  manifest.artifacts.find((entry) => entry.surfaceType === "Dashboard page").includeHeaderNavigation = false;
  assertFail("dashboard pages require application layout header navigation", manifest, "DASHBOARD_DESIGN_HEADER_NAVIGATION_MISSING");
}

assertPass("forms do not require application header navigation", baseManifest());

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].responsivePlanReference;
  assertFail("manifest requires mobile image or responsive plan reference", manifest, "DESIGN_ARTIFACT_RESPONSIVE_PLAN_MISSING");
}

{
  const manifest = baseManifest();
  delete manifest.designSystemPath;
  delete manifest.applicationDesignSystem;
  for (const row of manifest.artifacts) delete row.designSystemPath;
  assertFail("missing design system blocks readiness", manifest, "DESIGN_SYSTEM_MISSING");
}

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].designSystemPath;
  assertFail("manifest rows must reference design system", manifest, "DESIGN_ARTIFACT_DESIGN_SYSTEM_REFERENCE_MISSING");
}

{
  const manifest = baseManifest();
  manifest.applicationDesignSystem.generatedAt = "2026-06-19T02:00:00Z";
  assertFail("design system must be generated before images", manifest, "DESIGN_SYSTEM_GENERATED_AFTER_IMAGE");
}

{
  const manifest = baseManifest();
  manifest.artifacts = manifest.artifacts.filter((entry) => entry.surfaceName !== "Vendor Contract - View");
  manifest.deferredSurfaces = [
    {
      surfaceName: "Vendor Contract - View",
      surfaceType: "Data List View form",
      sourceAppPlanSection: "Custom Data List Forms Plan",
      sourceResourceName: "Vendor Contracts",
      reason: "Detail layout depends on runtime-proven related document panel.",
    },
  ];
  assertFail("deferred surfaces require reason fallback proof impact", manifest, "DEFERRED_DESIGN_SURFACE_INCOMPLETE");
}

console.log("Full-page design artifact Application Design System gate tests passed");
