#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectFullPageDesignArtifacts } from "./inspect-full-page-design-artifacts.mjs";
import { inspectPageImplementationBlueprint } from "./inspect-page-implementation-blueprint.mjs";
import { compareBlueprintToDecodedResource } from "./compare-blueprint-to-decoded-resource.mjs";
import { artifactPathsForRoot } from "./lib/plugin-root-layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "full-page-blueprint-gates-"));
const cases = [];

try {
  testViewportOnlyDesignFails();
  testFullPageDesignManifestPasses();
  testMissingPlannedSectionFails();
  testMissingTableDetailFails();
  testMissingFormDetailFails();
  testUnresolvedPlaceholderFails();
  testMissingPageBlueprintFails();
  testUnmappedDesignElementFails();
  testUnknownPropertyPathFails();
  testIncompleteBindingContractFails();
  testResourceMissingControlFails();
  testResourceWrongControlTypeFails();
  testResourceMissingRequiredPropertyFails();
  testResourceMissingActionFails();
  testResourceMissingBindingFails();
  testCompleteDesignBlueprintResourceParityPasses();
  testWorkflowCannotProceedWithIncompletePriorStep();
  testCliSmoke();
  testDistMirror();

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function testViewportOnlyDesignFails() {
  const manifest = goodManifest();
  manifest.pages[0].viewportOnly = true;
  manifest.pages[0].fullPage = false;
  const report = inspectFullPageDesignArtifacts({ manifest: writeJson("viewport-only-design.json", manifest) });
  expectFail("viewport-only design image metadata fails", report, "DESIGN_IMAGE_VIEWPORT_CROP_ONLY");
  assertHasCode(report, "CANONICAL_PAGE_DESIGN_NOT_FULL_PAGE");
}

function testFullPageDesignManifestPasses() {
  expectPass("full-page design manifest passes", inspectFullPageDesignArtifacts({ manifest: writeJson("full-page-design-pass.json", goodManifest()) }));
}

function testMissingPlannedSectionFails() {
  const manifest = goodManifest();
  manifest.pages[0].sections = ["Case KPIs", "Open Cases Table"];
  expectFail("missing planned section fails", inspectFullPageDesignArtifacts({ manifest: writeJson("missing-planned-section.json", manifest) }), "DESIGN_IMAGE_MISSING_PLANNED_SECTION");
}

function testMissingTableDetailFails() {
  const manifest = goodManifest();
  manifest.pages[0].tables[0].detailComplete = false;
  expectFail("missing table detail fails", inspectFullPageDesignArtifacts({ manifest: writeJson("missing-table-detail.json", manifest) }), "DESIGN_IMAGE_MISSING_TABLE_DETAIL");
}

function testMissingFormDetailFails() {
  const manifest = goodManifest();
  manifest.pages[0].forms[0].fieldsComplete = false;
  expectFail("missing form detail fails", inspectFullPageDesignArtifacts({ manifest: writeJson("missing-form-detail.json", manifest) }), "DESIGN_IMAGE_MISSING_FORM_DETAIL");
}

function testUnresolvedPlaceholderFails() {
  const manifest = goodManifest();
  manifest.pages[0].unresolvedPlaceholders = ["lower-page chart TBD"];
  expectFail("unresolved placeholder region fails", inspectFullPageDesignArtifacts({ manifest: writeJson("unresolved-placeholder.json", manifest) }), "DESIGN_IMAGE_PLACEHOLDER_REGION_UNRESOLVED");
}

function testMissingPageBlueprintFails() {
  expectFail("missing page blueprint fails", inspectPageImplementationBlueprint({ blueprint: writeJson("missing-blueprint.json", { pages: [] }) }), "PAGE_IMPLEMENTATION_BLUEPRINT_MISSING");
}

function testUnmappedDesignElementFails() {
  const blueprint = goodBlueprint();
  blueprint.pages[0].designElements.push({ id: "unmapped-export-button", label: "Export" });
  expectFail("unmapped design element fails", inspectPageImplementationBlueprint({ blueprint: writeJson("unmapped-design-element.json", blueprint) }), "DESIGN_ELEMENT_UNMAPPED_TO_CONTROL");
}

function testUnknownPropertyPathFails() {
  const blueprint = goodBlueprint();
  blueprint.pages[0].controls[0].properties.push({ path: "attrs.style.inventedAlias" });
  expectFail("unknown property path fails", inspectPageImplementationBlueprint({ blueprint: writeJson("unknown-property-path.json", blueprint) }), "CONTROL_PROPERTY_PATH_UNVERIFIED");
}

function testIncompleteBindingContractFails() {
  const blueprint = goodBlueprint();
  const collection = blueprint.pages[0].controls.find((control) => control.id === "cases_table");
  delete collection.binding;
  expectFail("incomplete binding contract fails", inspectPageImplementationBlueprint({ blueprint: writeJson("incomplete-binding.json", blueprint) }), "CONTROL_BINDING_CONTRACT_INCOMPLETE");
}

function testResourceMissingControlFails() {
  const resource = goodResource();
  resource.pages[0].resource.children = resource.pages[0].resource.children.filter((control) => control.id !== "cases_table");
  expectFail("resource missing blueprint control fails", compareBlueprintToDecodedResource({ blueprint: writeJson("blueprint-missing-control.json", goodBlueprint()), resource: writeJson("resource-missing-control.json", resource) }), "RESOURCE_CONTROL_MISSING_FROM_BLUEPRINT");
}

function testResourceWrongControlTypeFails() {
  const resource = goodResource();
  resource.pages[0].resource.children.find((control) => control.id === "cases_table").type = "text";
  expectFail("resource wrong control type fails", compareBlueprintToDecodedResource({ blueprint: writeJson("blueprint-wrong-type.json", goodBlueprint()), resource: writeJson("resource-wrong-type.json", resource) }), "RESOURCE_CONTROL_TYPE_MISMATCH");
}

function testResourceMissingRequiredPropertyFails() {
  const resource = goodResource();
  delete resource.pages[0].resource.attrs.style.widthtype;
  expectFail("resource missing required property fails", compareBlueprintToDecodedResource({ blueprint: writeJson("blueprint-missing-property.json", goodBlueprint()), resource: writeJson("resource-missing-property.json", resource) }), "RESOURCE_CONTROL_PROPERTY_MISSING");
}

function testResourceMissingActionFails() {
  const resource = goodResource();
  delete resource.pages[0].resource.children.find((control) => control.id === "new_case_action").attrs["action-type"];
  expectFail("resource missing action fails", compareBlueprintToDecodedResource({ blueprint: writeJson("blueprint-missing-action.json", goodBlueprint()), resource: writeJson("resource-missing-action.json", resource) }), "RESOURCE_ACTION_MISSING");
}

function testResourceMissingBindingFails() {
  const resource = goodResource();
  const table = resource.pages[0].resource.children.find((control) => control.id === "cases_table");
  delete table.binding;
  delete table.attrs.data;
  expectFail("resource missing binding fails", compareBlueprintToDecodedResource({ blueprint: writeJson("blueprint-missing-binding.json", goodBlueprint()), resource: writeJson("resource-missing-binding.json", resource) }), "RESOURCE_BINDING_MISSING");
}

function testCompleteDesignBlueprintResourceParityPasses() {
  expectPass("complete design image + blueprint + decoded resource parity fixture passes", inspectFullPageDesignArtifacts({ manifest: writeJson("complete-design.json", goodManifest()) }));
  expectPass("complete page implementation blueprint fixture passes", inspectPageImplementationBlueprint({ blueprint: writeJson("complete-blueprint.json", goodBlueprint()) }));
  expectPass("complete decoded resource parity fixture passes", compareBlueprintToDecodedResource({ blueprint: writeJson("complete-blueprint-parity.json", goodBlueprint()), resource: writeJson("complete-resource-parity.json", goodResource()) }));
}

function testWorkflowCannotProceedWithIncompletePriorStep() {
  const manifest = goodManifest();
  manifest.workflow.resourceGeneration = { status: "started" };
  manifest.workflow.pageImplementationBlueprint = { status: "missing" };
  const designReport = inspectFullPageDesignArtifacts({ manifest: writeJson("workflow-design-incomplete.json", manifest) });
  expectFail("workflow cannot proceed to generation when prior step evidence is incomplete", designReport, "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP");

  const resource = goodResource();
  resource.workflow.packageSignUpgrade = { status: "started" };
  resource.workflow.resourceBlueprintParityValidation = { status: "missing" };
  expectFail("workflow cannot proceed to signing when parity evidence is incomplete", compareBlueprintToDecodedResource({ blueprint: writeJson("workflow-blueprint.json", goodBlueprint()), resource: writeJson("workflow-resource-incomplete.json", resource) }), "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP");
}

function testCliSmoke() {
  const manifest = writeJson("cli-design-pass.json", goodManifest());
  const blueprint = writeJson("cli-blueprint-pass.json", goodBlueprint());
  const resource = writeJson("cli-resource-pass.json", goodResource());
  for (const command of [
    ["node", "scripts/inspect-full-page-design-artifacts.mjs", "--manifest", manifest],
    ["node", "scripts/inspect-page-implementation-blueprint.mjs", "--blueprint", blueprint],
    ["node", "scripts/compare-blueprint-to-decoded-resource.mjs", "--blueprint", blueprint, "--resource", resource],
  ]) {
    const result = spawnSync(command[0], command.slice(1), { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, `${command.join(" ")} should pass: ${result.stderr || result.stdout}`);
  }
  cases.push("direct source CLI smoke passes");
}

function testDistMirror() {
  for (const script of [
    "inspect-full-page-design-artifacts.mjs",
    "inspect-page-implementation-blueprint.mjs",
    "compare-blueprint-to-decoded-resource.mjs",
    "test-full-page-design-blueprint-generation-gates.mjs",
  ]) {
    const { source, mirror, mirrorRequired } = artifactPathsForRoot(ROOT, `scripts/${script}`);
    assert.equal(fs.existsSync(source), true, `${script} source exists`);
    if (mirrorRequired) {
      assert.equal(fs.readFileSync(mirror, "utf8"), fs.readFileSync(source, "utf8"), `${script} source/dist mirror differs`);
    }
  }
  cases.push("source/dist or installed-payload full-page design blueprint scripts resolve");
}

function goodManifest() {
  return {
    appSlug: "customer-support-case-triage",
    appPlan: {
      pages: [
        { pageSlug: "case-triage-dashboard", sections: ["Case KPIs", "Filters", "Open Cases Table", "Case Detail Form"] },
      ],
    },
    pages: [
      {
        pageSlug: "case-triage-dashboard",
        canonicalPngPath: "assets/generated-ui/customer-support-case-triage/01-case-triage-dashboard.design.png",
        fullPage: true,
        pageEndVisible: true,
        sections: ["Case KPIs", "Filters", "Open Cases Table", "Case Detail Form"],
        tables: [{ id: "open-cases-table", detailComplete: true, columnsComplete: true, rowTreatmentComplete: true }],
        forms: [{ id: "case-detail-form", detailComplete: true, fieldsComplete: true, actionsComplete: true }],
      },
    ],
    workflow: completeWorkflow(),
  };
}

function goodBlueprint() {
  return {
    pages: [
      {
        pageSlug: "case-triage-dashboard",
        purpose: "Triage support cases by urgency, owner, SLA, and action state.",
        layout: "application-layout-2-horizontal-nav",
        sections: ["Case KPIs", "Filters", "Open Cases Table", "Case Detail Form"],
        runtimeProofPlan: "After package upgrade, open the decoded ListSetID URL, capture Chrome evidence, and compare against canonical PNG.",
        designElements: [
          { id: "root", controlId: "case_triage_root" },
          { id: "cases-table", controlId: "cases_table" },
          { id: "new-case-button", controlId: "new_case_action" },
        ],
        controls: [
          {
            id: "case_triage_root",
            type: "container",
            nv_label: "case_triage_root",
            root: true,
            properties: [
              { path: "attrs.style.widthtype" },
              { path: "attrs.style.direction" },
              { path: "attrs.style.gap" },
            ],
          },
          {
            id: "cases_table",
            type: "collection",
            nv_label: "cases_table",
            parentId: "case_triage_root",
            requiresBinding: true,
            binding: { AppID: "app-redacted", ListSetID: "listset-redacted", ListID: "cases-list-redacted" },
            properties: [{ path: "attrs.data.list.ListID" }],
          },
          {
            id: "new_case_action",
            type: "container",
            nv_label: "new_case_action",
            parentId: "case_triage_root",
            requiresAction: true,
            action: { "action-type": "5", list: { AppID: "app-redacted", ListSetID: "listset-redacted", ListID: "cases-list-redacted" } },
            properties: [{ path: "attrs.action-type" }],
          },
        ],
      },
    ],
    workflow: {
      fullPageDesignImages: { status: "complete", artifact: "assets/generated-ui/customer-support-case-triage/01-case-triage-dashboard.design.png" },
      blueprintValidation: { status: "pass", evidence: "inspect-page-implementation-blueprint" },
      resourceGeneration: { status: "not-started" },
    },
  };
}

function goodResource() {
  return {
    parityValidationRun: true,
    pages: [
      {
        pageSlug: "case-triage-dashboard",
        resource: {
          id: "case_triage_root",
          type: "container",
          nv_label: "case_triage_root",
          section: "Case KPIs",
          attrs: { style: { widthtype: "1", direction: "column", gap: [null, 16] } },
          children: [
            {
              id: "cases_table",
              type: "collection",
              nv_label: "cases_table",
              section: "Open Cases Table",
              attrs: { data: { list: { AppID: "app-redacted", ListSetID: "listset-redacted", ListID: "cases-list-redacted" } } },
              binding: { AppID: "app-redacted", ListSetID: "listset-redacted", ListID: "cases-list-redacted" },
              detailLink: { resolved: true, target: "case-detail-form" },
            },
            {
              id: "new_case_action",
              type: "container",
              nv_label: "new_case_action",
              section: "Filters",
              attrs: { "action-type": "5" },
              children: [{ id: "new_case_label", type: "heading", text: "New Case" }],
            },
            { id: "case_detail_form", type: "container", section: "Case Detail Form", text: "Case detail" },
          ],
        },
      },
    ],
    workflow: {
      resourceBlueprintParityValidation: { status: "pass", evidence: "compare-blueprint-to-decoded-resource" },
      packageSignUpgrade: { status: "not-started" },
    },
  };
}

function completeWorkflow() {
  return {
    functionalSpec: { status: "complete", artifact: "functional-spec.md" },
    appPlan: { status: "complete", artifact: "app-plan.md" },
    fullPageDesignImages: { status: "complete", artifact: "design-image-manifest.json" },
    pageImplementationBlueprint: { status: "complete", artifact: "page-blueprint.json" },
    controlPropertyContract: { status: "complete", artifact: "control-property-contract.json" },
    resourceGeneration: { status: "complete", artifact: "decoded-resource.json" },
    decodedResourceParityValidation: { status: "pass", evidence: "compare-blueprint-to-decoded-resource" },
    localHardGates: { status: "pass", evidence: "test-ui-hard-gates-all" },
    packageSignUpgrade: { status: "not-started" },
    runtimeProof: { status: "not-started" },
  };
}

function writeJson(name, value) {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

function expectPass(label, report) {
  assert.equal(report.status, "pass", `${label}: expected pass but got ${JSON.stringify(report.findings, null, 2)}`);
  cases.push(label);
}

function expectFail(label, report, code) {
  assert.equal(report.status, "fail", `${label}: expected fail`);
  assertHasCode(report, code);
  cases.push(label);
}

function assertHasCode(report, code) {
  assert.equal(report.findings.some((finding) => finding.code === code), true, `expected finding ${code}; got ${JSON.stringify(report.findings, null, 2)}`);
}
