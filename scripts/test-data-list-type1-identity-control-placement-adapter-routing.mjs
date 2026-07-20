#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = resolve(root, "dist/yeeflow-app-builder-plugin");
const historicalZip = resolve(root, "dist/yeeflow-app-builder-plugin-0.9.71.zip");
const historicalZipSha256 = "377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2";
const fixture = json("compatibility/differential-fixtures/data-list-type1-identity-control-placement-routing.v0.1.0.json");
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-type1-identity-routing-"));

assert.equal(sha256(readFileSync(historicalZip)), historicalZipSha256, "Historical ZIP checksum must match before the routing proof.");
try {
  const source = read("scripts/materialize-full-app-generated-final.mjs");
  assert.equal(fixture.caseCount, fixture.cases.length, "The routing corpus count must be exact.");
  assert.match(source, /function buildDataListFormFieldsGrid\(/u);
  assert.match(source, /function buildDataListFormFieldControl\(/u);
  assert.match(source, /DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START/u);
  assert.match(source, /coreProjectDataListType1IdentityControlPlacement/u);
  assert.match(source, /coreLowerDataListType1IdentityControlPlacementAtHost/u);
  assert.match(source, /type === "dynamic-user"/u);
  assert.match(source, /isSubListFormField\(field, type\)/u);

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacy = createLegacySurface(resolve(temporary, "legacy"));
  const baseline = await materialize(legacy, "legacy", 1);
  const sourceFirst = await materialize(root, "source", 1);
  const sourceSecond = await materialize(root, "source", 2);
  assertParity(baseline, sourceFirst, "source");
  assert.deepEqual(sourceFirst.normalized, sourceSecond.normalized, "The routed Type 1 output must be deterministic after pre-existing UUID normalization.");
  assertLossless(sourceFirst);
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_SOURCE_ROUTING_PASSED");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_MATERIALIZER_DETERMINISM_PASSED");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LOSSLESS_ID_ROUTING_PASSED");

  const proofZip = resolve(temporary, "proof.zip");
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", proofZip], { cwd: root, stdio: "inherit" });
  execFileSync("unzip", ["-q", proofZip, "-d", archiveRoot]);
  const archive = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(baseline, archive, "archive");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ARCHIVE_ROUTING_PASSED");

  const installed = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(plugin, installed, { recursive: true });
  const installedResult = await materialize(installed, "installed", 1);
  assertParity(baseline, installedResult, "installed");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INSTALLED_ROUTING_PASSED");

  await assertTemplateReferenceErrors();
  assertScopeGates(source);
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ROUTING_SCOPE_GATES_PASSED");
  console.log("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_LEGACY_ROLLBACK_PASSED");
  assert.equal(sha256(readFileSync(historicalZip)), historicalZipSha256, "Historical ZIP checksum must match after the routing proof.");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

function createSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(plugin, "core"), resolve(target, "core"), { recursive: true });
  return target;
}

function createLegacySurface(target) {
  createSurface(target);
  const materializerPath = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(materializerPath, "utf8");
  const legacy = source
    .replace("  projectDataListType1IdentityControlPlacement as coreProjectDataListType1IdentityControlPlacement,\n", "")
    .replace("  lowerDataListType1IdentityControlPlacementAtHost as coreLowerDataListType1IdentityControlPlacementAtHost,\n", "")
    .replace("  const type1PlacementHost = createDataListType1PlacementHost({ wrapper, listId, templateKind });\n  wrapper.children = fields.map((field, index) => buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind, type1PlacementHost }));", "  wrapper.children = fields.map((field, index) => buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind }));")
    .replace(/\n  \/\/ DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_CORE_ROUTE_END\n/u, "\n")
    .replace(/\nfunction createDataListType1PlacementHost[\s\S]*?\n\}\n\nfunction shouldRouteDataListType1IdentityControlPlacement[\s\S]*?\n\}\n/u, "\n");
  assert.notEqual(legacy, source, "Rollback must restore only the selected Type 1 route.");
  assert.ok(!legacy.includes("coreProjectDataListType1IdentityControlPlacement"), "Rollback must remove the selected Materializer Core binding.");
  assert.ok(!legacy.includes("coreLowerDataListType1IdentityControlPlacementAtHost"), "Rollback must remove the selected Local Runtime binding.");
  writeFileSync(materializerPath, legacy, "utf8");
  return target;
}

async function materialize(surfaceRoot, label, run) {
  const fixtureRoot = resolve(temporary, `${label}-${run}`);
  mkdirSync(fixtureRoot, { recursive: true });
  const functionalSpecification = resolve(fixtureRoot, "functional-specification.md");
  const appPlan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  const apiIds = resolve(fixtureRoot, "api-ids.json");
  const output = resolve(fixtureRoot, "output");
  writeFileSync(functionalSpecification, "# Functional Specification: Type 1 Identity Placement Routing\n\n| Application Name | Type 1 Identity Placement Routing |\n");
  writeFileSync(appPlan, planText());
  writeFileSync(apiIds, JSON.stringify({ ids: Array.from({ length: 1024 }, (_, index) => String(1000000000000000001n + BigInt(index))) }));
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?type1=${label}-${run}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: functionalSpecification, appPlan, outDir: output, apiIdManifest: apiIds, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${label} materialization failed: ${JSON.stringify(result.findings || result)}`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const list = decoded.Childs?.find((item) => item.List?.Title === "Identity Records");
  assert.ok(list, `${label} must produce the Data List.`);
  const layouts = list.Layouts.filter((item) => Number(item.Type) === 1 && ["Identity Record View", "Identity Record Workbench"].includes(item.Title)).map((item) => ({ title: item.Title, layoutId: item.LayoutID, resource: JSON.parse(item.LayoutView) }));
  assert.equal(layouts.length, 2, `${label} must produce view and workbench Type 1 layouts.`);
  const controls = layouts.flatMap((layout) => findNodes(layout.resource, (node) => node?.type === "dynamic-user"));
  assert.equal(controls.length, 8, `${label} must route four approved identity controls in each Type 1 layout.`);
  for (const control of controls) {
    assert.equal(typeof control.id, "string", `${label} host must retain control ID supply.`);
    assert.equal(typeof control.attrs?.data?.list?.ListID, "string", `${label} ListID must remain a lossless string.`);
    assert.equal(typeof control.attrs?.data?.fieldId, "string", `${label} FieldID must remain a lossless string.`);
  }
  return { normalized: normalize(decoded), findings: normalize(result.findings), files: readdirSync(output).sort(), controls: controls.map((control) => ({ id: control.id, fieldId: control.attrs.data.fieldId, listId: control.attrs.data.list.ListID, binding: control.binding })) };
}

async function assertTemplateReferenceErrors() {
  const core = await import(`${pathToFileURL(resolve(root, "scripts/lib/materializer-core-adapter.mjs")).href}?type1-errors`);
  const runtime = await import(`${pathToFileURL(resolve(root, "scripts/lib/local-runtime-core-adapter.mjs")).href}?type1-errors`);
  const input = Object.freeze({ surface: "data-list", templateKind: "view", templateSnapshot: Object.freeze({ templateId: "data_list_form_fields_grid_v1_1", templateScope: "data-list:1000000000000000001:view" }), references: Object.freeze({ fieldsGridNodeRef: "form_grid_fields_wrapper", controlSlotRef: "slot:data-list-form-fields", listId: "1000000000000000001", fieldId: "1000000000000000002" }), field: Object.freeze({ fieldName: "User1", displayName: "Owner", fieldType: "User", controlType: "dynamic-user", type: "dynamic-user" }), formName: "Identity Record View", listName: "Identity Records", ordinal: 1 });
  const intent = core.projectDataListType1IdentityControlPlacement(input).intent;
  const snapshot = () => ({ templateId: input.templateSnapshot.templateId, templateScope: input.templateSnapshot.templateScope, nodes: [{ reference: "form_grid_fields_wrapper", scope: input.templateSnapshot.templateScope }], slots: [{ reference: "slot:data-list-form-fields", scope: input.templateSnapshot.templateScope, parentReference: "form_grid_fields_wrapper" }] });
  for (const item of fixture.cases.filter((entry) => entry.kind === "host-error")) {
    const value = snapshot(); const context = { controlId: "identity-record-view_user1_2" };
    if (item.id === "missing-template-reference") value.slots = [];
    if (item.id === "invalid-template-reference") context.controlId = "";
    if (item.id === "wrong-template-scope") value.templateScope = "data-list:other:view";
    if (item.id === "duplicate-template-reference") value.nodes.push({ ...value.nodes[0] });
    if (item.id === "broken-template-relationship") value.slots = [{ reference: "slot:data-list-form-fields", scope: value.templateScope, parentReference: "other" }];
    assert.throws(() => runtime.lowerDataListType1IdentityControlPlacementAtHost(intent, value, context), new RegExp(item.error), item.id);
  }
}

function assertScopeGates(source) {
  assert.match(source, /templateKind === "view" \|\| templateKind === "workbench"/u);
  assert.match(source, /type === "dynamic-user"/u);
  assert.match(source, /!isSubListFormField\(field, type\)/u);
  for (const excluded of ["dynamic-image", "dynamic-file", "identity-picker", "list"]) assert.match(source, new RegExp(excluded));
  assert.doesNotMatch(source, /fallback.*Type1|randomUUID\(.*Type1/iu);
}

function planText() { return `# Type 1 Identity Placement Routing - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Identity Records
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Lookup Target | Notes |
| --- | --- | --- | --- | --- | --- |
| Record Name | Title | Text | input | | Native title field. |
| Owner | Identity1 | Identity | dynamic-user | | Approved identity control. |
| Assignee | User2 | User | dynamic-user | | Approved user control. |
| Reviewers | People3 | People | dynamic-user | | Approved people control. |
| Approver | Person4 | Person | dynamic-user | | Approved person control. |

## 10. Custom Data List Forms Plan

### 10.1 Identity Records
| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Identity Record View | View item | Review identity fields. |
| Identity Record Workbench | View item | Workbench identity fields. |

#### Data List Form Layout Template Selection
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Identity Records | Identity Record View | View | data_list_form_layout_view_item_v1_1 | Current fields | None | Standard Type 1 view. | Generated-final validation |
| Identity Records | Identity Record Workbench | View | data_list_form_layout_workbench | Current fields | None | Type 1 workbench. | Generated-final validation |

#### Form Fields Layout Template Selection
| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity Records | Identity Record View | Fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | None | None | Generated-final validation |
| Identity Records | Identity Record Workbench | Fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | None | None | Generated-final validation |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Identity Records | Identity Records | Data List | fa-solid fa-list |
`; }

function findNodes(value, predicate, output = []) { if (Array.isArray(value)) { value.forEach((item) => findNodes(item, predicate, output)); return output; } if (!value || typeof value !== "object") return output; if (predicate(value)) output.push(value); Object.values(value).forEach((item) => findNodes(item, predicate, output)); return output; }
function assertLossless(result) { for (const control of result.controls) { assert.match(control.listId, /^\d{19}$/u); assert.match(control.fieldId, /^\d+$/u); } }
function assertParity(expected, actual, label) { assert.deepEqual(actual.normalized, expected.normalized, `${label} decoded resource differs from the Legacy baseline.`); assert.deepEqual(actual.findings, expected.findings, `${label} findings differ from the Legacy baseline.`); assert.deepEqual(actual.files, expected.files, `${label} output files differ from the Legacy baseline.`); assert.deepEqual(actual.controls, expected.controls, `${label} Type 1 fragment shape differs from the Legacy baseline.`); }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<legacy-uuid>")); }
function json(path) { return JSON.parse(read(path)); }
function read(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
