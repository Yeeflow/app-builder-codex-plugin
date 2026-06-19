#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const validator = path.join(ROOT, "scripts/validate-full-page-design-artifacts.mjs");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-design-layout-quality-"));

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
      contentSafeArea: "content starts to the right of the left nav and below the header",
      layoutRuleSource: "docs/standards/yeeflow-application-layout-design-rules.md",
      modernVisualQualityStandard:
        "Strong hierarchy, polished spacing, purposeful dashboard composition, meaningful analytics, realistic business data, and no generic scaffold anti-patterns.",
      responsivePlan: "Desktop dashboard shell stacks to mobile card lists; forms become single-column.",
      designProofBoundary: "Design-stage visual contract only.",
    },
    plannedSurfaces: [
      surface("Operations Dashboard", "Dashboard page", "Dashboard Pages Plan", "Operations Dashboard"),
      surface("Vendor Contract - Add/Edit", "Data List Add/Edit form", "Custom Data List Forms Plan", "Vendor Contracts"),
    ],
    artifacts: [
      artifact("Operations Dashboard", "Dashboard page", "Dashboard Pages Plan", "Operations Dashboard", {
        includeHeaderNavigation: true,
        applicationLayoutType: "application-layout-1-vertical-nav",
        applicationChromeStyleId: "layout-1-dark-header-dark-vertical-nav",
        selectedLayoutChromeCompliance:
          "pass: full-width dark header, connected dark left vertical nav, and content safe area comply with Layout 1.",
      }),
      artifact("Vendor Contract - Add/Edit", "Data List Add/Edit form", "Custom Data List Forms Plan", "Vendor Contracts", {
        includeHeaderNavigation: false,
        applicationLayoutType: "form-surface-no-app-chrome",
      }),
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
    visualUsabilityStatus: "pass",
    textOverflowStatus: "pass",
    overlapStatus: "pass",
    spacingStatus: "pass",
    mobileUsabilityStatus: "pass",
    responsiveLayoutEvidence: "Dashboard regions stack on mobile with table/card-list fallback and no desktop column pressure.",
    textWrappingStrategy: "Long KPI, table, Collection, and action labels wrap or truncate with ellipsis.",
    containerBoundaryEvidence: "Navigation, cards, charts, rows, and action buttons stay inside reviewed container bounds.",
    visualUsabilityFindings: ["No text overflow, overlap, clipped content, or mobile layout pressure is declared."],
    modernVisualQualityChecklist: [
      "strong visual hierarchy",
      "professional spacing and density",
      "polished cards and sections",
      "purposeful dashboard composition",
      "realistic business rows and status examples",
    ],
    antiPatternCheck: "pass: no generic scaffold, title-only, helper-text-heavy, placeholder chart, or arbitrary SaaS shell anti-patterns",
    readyForBlueprint: true,
    generatedAt: "2026-06-19T01:05:00Z",
    ...semanticDefaults(surfaceName, surfaceType),
    ...extra,
  };
}

function semanticDefaults(surfaceName, surfaceType) {
  if (!/form/i.test(surfaceType)) return {};
  return {
    primaryBusinessObject: "Vendor Contract",
    semanticFieldExamples: [
      { field: "Contract Title", value: `${surfaceName} MSA-2026` },
      { field: "Vendor", value: "Acme Supplies" },
      { field: "Contract Owner", value: "Mira Chen" },
      { field: "Renewal Date", value: "2026-08-15" },
      { field: "Approval Status", value: "Pending Legal Review" },
    ],
    fieldValueSemanticsStatus: "pass",
    lowerPageBusinessRegions: [
      {
        name: `${surfaceName} Renewal Tasks`,
        purpose: "Show renewal task history and linked actions for this form surface.",
        sourceList: "Renewal Tasks",
        visualPattern: "Collection",
        plannedYeeflowControl: "Collection",
        renderedExampleCount: 2,
        renderedExampleSummary:
          "Card 1: Confirm renewal terms, owner Mira Chen, due 2026-07-15, status In progress. Card 2: Send renewal reminder, owner Alan Lee, due 2026-07-22, status Pending.",
        displayedBusinessFields: ["Task", "Owner", "Due date", "Status"],
        displayedFields: ["Task", "Owner", "Due date", "Status"],
        actionsShown: ["Open task detail"],
        visualConcretenessStatus: "pass",
        antiPlaceholderStatus: "pass",
        behavior: "read-only related records",
        blueprintMappingHint: "Map to Collection cards bound to Renewal Tasks.",
        proofImpact: "Blueprint must include lower-page renewal task evidence.",
      },
    ],
    businessRegionEvidence: `${surfaceName} includes renewal task history and contract evidence.`,
    formPurposeDifferentiators: [`${surfaceName} has its own field state, action area, and lower-page renewal task evidence.`],
    templateReuseRiskStatus: "pass",
    pageSpecificQualityEvidence: [
      `${surfaceName} shows vendor contract fields, owner, renewal date, and approval status.`,
      `${surfaceName} lower page shows renewal tasks and linked contract evidence.`,
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
}

function assertFail(name, manifest, code) {
  const { result, parsed } = runCase(name, manifest);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.equal(parsed.status, "fail", `${name} JSON status`);
  assert(parsed.findings.some((finding) => finding.code === code), `${name} should include ${code}:\n${JSON.stringify(parsed.findings, null, 2)}`);
}

{
  const manifest = baseManifest();
  manifest.applicationLayoutType = "left navigation with compact header and content shell";
  manifest.selectedApplicationLayout = manifest.applicationLayoutType;
  manifest.applicationDesignSystem.applicationLayoutType = manifest.applicationLayoutType;
  assertFail("free-form layout name fails", manifest, "DESIGN_MANIFEST_APPLICATION_LAYOUT_INVALID");
}

{
  const manifest = baseManifest();
  delete manifest.applicationDesignSystem.applicationChromeStyleId;
  assertFail("missing applicationChromeStyleId fails", manifest, "DESIGN_SYSTEM_CHROME_STYLE_ID_MISSING");
}

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].applicationLayoutType;
  assertFail("dashboard row missing applicationLayoutType fails", manifest, "DASHBOARD_DESIGN_APPLICATION_LAYOUT_MISSING");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].includeHeaderNavigation = false;
  assertFail("dashboard row without header navigation fails", manifest, "DASHBOARD_DESIGN_HEADER_NAVIGATION_MISSING");
}

assertPass("data list form row without header navigation passes", baseManifest());

{
  const manifest = baseManifest();
  manifest.artifacts[0].forbiddenChromeMarkers = ["custom-sidebar"];
  assertFail("layout 1 custom sidebar fails", manifest, "DESIGN_ARTIFACT_FORBIDDEN_CHROME_DECLARED");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].forbiddenChromeMarkers = ["arbitrary-saas-shell"];
  assertFail("layout 1 arbitrary SaaS shell fails", manifest, "DESIGN_ARTIFACT_FORBIDDEN_CHROME_DECLARED");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].layoutFidelityStatus = "human_review_required";
  assertFail("ready for blueprint fails when layout fidelity is not pass", manifest, "DESIGN_ARTIFACT_READY_WITHOUT_LAYOUT_FIDELITY");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].visualQualityStatus = "human_review_required";
  assertFail("ready for blueprint fails when visual quality is not pass", manifest, "DESIGN_ARTIFACT_READY_WITHOUT_VISUAL_QUALITY");
}

{
  const manifest = baseManifest();
  delete manifest.artifacts[0].modernVisualQualityChecklist;
  assertFail("missing modern visual quality checklist fails", manifest, "DESIGN_ARTIFACT_VISUAL_QUALITY_CHECKLIST_MISSING");
}

assertPass("valid layout 1 fidelity and modern visual quality manifest passes", baseManifest());

{
  const manifest = baseManifest();
  manifest.artifacts[0].layoutFidelityStatus = "human_review_required";
  manifest.artifacts[0].readyForBlueprint = false;
  assertFail("human review required blocks blueprint readiness without deferral", manifest, "DESIGN_ARTIFACT_LAYOUT_FIDELITY_STATUS_NOT_PASSING");
}

{
  const manifest = baseManifest();
  manifest.artifacts[0].layoutFidelityStatus = "human_review_required";
  manifest.artifacts[0].visualQualityStatus = "human_review_required";
  manifest.artifacts[0].status = "deferred";
  manifest.artifacts[0].readyForBlueprint = false;
  manifest.artifacts[0].reason = "Image-level automated chrome review is not available for this edge case.";
  manifest.artifacts[0].fallback = "Human review must approve the official Layout 1 chrome before blueprint work.";
  manifest.artifacts[0].proofImpact = "Blueprint readiness remains blocked until reviewed evidence is attached.";
  assertPass("human review required passes only as explicitly deferred with proof impact", manifest);
}

console.log("Full-page design layout fidelity and visual quality gate tests passed");
