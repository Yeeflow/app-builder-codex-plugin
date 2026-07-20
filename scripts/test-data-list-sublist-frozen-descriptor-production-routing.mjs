#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(resolve(root, "compatibility/differential-fixtures/data-list-sublist-frozen-descriptor-production-routing.v0.1.0.json"), "utf8"));
const temporary = mkdtempSync(resolve(tmpdir(), "yeeflow-phase9n-sublist-baseline-"));

try {
  const source = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.match(source, /DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START/u);
  assert.match(source, /DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_START/u);
  assert.equal((source.match(/coreProjectDataListEmbeddedSublistDescriptor\(/gu) || []).length, 1, "Exactly one production descriptor selection is permitted.");
  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "inherit" });
  const legacyRoot = createLegacyRollbackSurface(resolve(temporary, "legacy"));
  const legacy = await materialize(legacyRoot, "legacy", 1);
  const first = await materialize(root, "source", 1);
  const second = await materialize(root, "source", 2);
  assertParity(legacy, first, "source");
  assert.deepEqual(first.normalizedDecoded, second.normalizedDecoded, "The routed production output must be deterministic.");
  assertEmbeddedShape(first, "source");
  console.log("SUBLIST_EMBEDDED_SCHEMA_ADAPTER_ROUTING_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_HOST_CONTEXT_ROUTING_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_SOURCE_ROUTING_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_MATERIALIZER_INTEGRATION_PARITY_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_SINGLE_SELECTION_DETERMINISM_PASSED");

  const archive = resolve(temporary, "phase9n-proof.zip");
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archive], { cwd: root, stdio: "inherit" });
  const archiveRoot = resolve(temporary, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync("unzip", ["-q", archive, "-d", archiveRoot]);
  const archiveResult = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive", 1);
  assertParity(legacy, archiveResult, "archive");
  assertEmbeddedShape(archiveResult, "archive");
  console.log("SUBLIST_EMBEDDED_SCHEMA_ARCHIVE_ROUTING_PASSED");

  const installedRoot = resolve(temporary, "installed/yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await materialize(installedRoot, "installed", 1);
  assertParity(legacy, installed, "installed");
  assertEmbeddedShape(installed, "installed");
  console.log("SUBLIST_EMBEDDED_SCHEMA_INSTALLED_ROUTING_PASSED");

  await assertHostContextGates();
  assertScopeGates(source);
  console.log("SUBLIST_EMBEDDED_SCHEMA_SHARED_INSTANCE_PARITY_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_CONTEXT_ISOLATION_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_ROUTING_SCOPE_GATES_PASSED");
  console.log("SUBLIST_EMBEDDED_SCHEMA_LEGACY_ROLLBACK_PASSED");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

async function materialize(surfaceRoot, label, run) {
  const fixtureRoot = resolve(temporary, `${label}-${run}`);
  mkdirSync(fixtureRoot, { recursive: true });
  const spec = resolve(fixtureRoot, "functional-specification.md");
  const plan = resolve(fixtureRoot, "yeeflow-app-plan.md");
  const output = resolve(fixtureRoot, "output");
  writeFileSync(spec, "# Functional Specification: Embedded Sublist Routing\n\n| Application Name | Employee Leave Balances |\n", "utf8");
  writeFileSync(plan, planText(), "utf8");
  const materializer = await import(`${pathToFileURL(resolve(surfaceRoot, "scripts/materialize-full-app-generated-final.mjs")).href}?phase9n-baseline=${label}-${run}`);
  const result = materializer.materializeFullAppGeneratedFinal({ cwd: fixtureRoot, functionalSpec: spec, appPlan: plan, outDir: output, allowFixtureApiIdsForTests: true });
  assert.equal(result.status, "pass", `${label} materialization must pass: ${JSON.stringify(result.findings || [])}`);
  const decoded = JSON.parse(readFileSync(result.outputs.decodedResource, "utf8"));
  const list = decoded.Childs?.find((entry) => entry.List?.Title === "Employee Leave Balances");
  assert.ok(list, `${label} must contain the export-proven Data List.`);
  const field = list.Fields?.find((entry) => entry.DisplayName === "Leave details");
  assert.ok(field, `${label} must contain the parent Sublist field.`);
  const rulesColumns = JSON.parse(field.Rules)["list-variables"];
  const form = list.Layouts?.find((entry) => entry.Type === 1 && entry.Title === "Employee Leave Balance Form");
  assert.ok(form, `${label} must contain the custom form.`);
  const sublist = findNodes(JSON.parse(form.LayoutView), (entry) => entry?.type === "list" && entry?.binding === field.FieldName)[0];
  assert.ok(sublist, `${label} must contain the bound Sublist control.`);
  const formColumns = (sublist.attrs?.["list-variables"] || []).map(columnShape);
  return { parentListId: field.ListID, parentFieldId: field.FieldID, rulesColumns: rulesColumns.map(columnShape), formColumns, normalizedDecoded: normalize(decoded), outputFiles: readdirSync(output).sort() };
}

function columnShape(column) { return { idx: column.idx, id: column.id, name: column.name, type: column.type, editable: column.editable }; }
function findNodes(value, predicate, output = []) { if (Array.isArray(value)) { value.forEach((entry) => findNodes(entry, predicate, output)); return output; } if (!value || typeof value !== "object") return output; if (predicate(value)) output.push(value); Object.values(value).forEach((entry) => findNodes(entry, predicate, output)); return output; }
function normalize(value) { return JSON.parse(JSON.stringify(value).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu, "<control-uuid>")); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function assertEmbeddedShape(result, label) {
  assert.deepEqual(result.rulesColumns, fixture.routedColumns, `${label} Rules must preserve export-proven scalar columns.`);
  assert.deepEqual(result.formColumns, fixture.routedColumns, `${label} custom-form must preserve export-proven scalar columns.`);
  assert.match(result.parentListId, /^\d{16,30}$/u, `${label} ListID must remain lossless.`);
  assert.match(result.parentFieldId, /^\d{16,30}$/u, `${label} FieldID must remain lossless.`);
  const text = JSON.stringify(result.normalizedDecoded);
  for (const forbidden of fixture.forbiddenIdentityKeys) assert.equal(text.includes(forbidden), false, `${label} must not create ${forbidden}.`);
}

function assertParity(expected, actual, label) {
  assert.deepEqual(actual.normalizedDecoded, expected.normalizedDecoded, `${label} output differs from the temporary-copy Legacy rollback.`);
  assert.deepEqual(actual.outputFiles, expected.outputFiles, `${label} output files differ from the temporary-copy Legacy rollback.`);
}

function createLegacyRollbackSurface(target) {
  cpSync(resolve(root, "scripts"), resolve(target, "scripts"), { recursive: true });
  cpSync(resolve(root, "docs/reference"), resolve(target, "docs/reference"), { recursive: true });
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin/core"), resolve(target, "core"), { recursive: true });
  const path = resolve(target, "scripts/materialize-full-app-generated-final.mjs");
  const source = readFileSync(path, "utf8");
  const legacy = source
    .replace("  projectDataListEmbeddedSublistDescriptor as coreProjectDataListEmbeddedSublistDescriptor,\n", "")
    .replace('import { createDataListEmbeddedSublistDescriptorHostContext } from "./lib/data-list-sublist-frozen-descriptor-host-context.mjs";\n', "")
    .replace(/\nfunction selectExportProvenEmbeddedSublistDescriptor[\s\S]*?\nfunction buildDataListSubListColumn/u, "\nfunction buildDataListSubListColumn")
    .replace(", embeddedSublistDescriptorHostContext = null }) {", " }) {")
    .replace("buildFieldRules({ field, type, lookupTargetListId, embeddedSublistDescriptorHostContext })", "buildFieldRules({ field, type, lookupTargetListId })")
    .replace(/\n  if \(embeddedSublistDescriptorHostContext\?\.isSelectedRaw\(field\)\) \{[\s\S]*?\n  \}/u, "")
    .replace("embeddedSublistDescriptorHostContext = null }) {", "}) {")
    .replace(", embeddedSublistDescriptorHostContext });", " });")
    .replace("templateKind, embeddedSublistDescriptorHostContext })", "templateKind })")
    .replace("type1PlacementHost, embeddedSublistDescriptorHostContext }", "type1PlacementHost }")
    .replace("listName, embeddedSublistDescriptorHostContext });", "listName });")
    .replace(/\n  \/\/ DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_START[\s\S]*?\n  \/\/ DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_END/u, "\n  const descriptor = null;\n  const listVariables = dataListSubListVariables(field, `${formName}:${field.FieldName}`);")
    .replace(/\n    \/\/ DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START[\s\S]*?\n    \/\/ DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_END/u, "\n    const listVariables = dataListSubListVariables(field, `field-rules:${field?.fieldName || field?.displayName || \"sublist\"}`)\n      .map(({ idx, id, name, type: rowType, editable }) => ({ idx, id, name, type: rowType, editable }));")
    .replace("  const embeddedSublistDescriptorHostContext = createDataListEmbeddedSublistDescriptorHostContext();\n  try {\n", "")
    .replace(/field: selectExportProvenEmbeddedSublistDescriptor\(\{[\s\S]*?\n        \}\),/u, "field,")
    .replace("        embeddedSublistDescriptorHostContext,\n", "")
    .replace(", embeddedSublistDescriptorHostContext }));", " }));")
    .replace("  };\n  } finally {\n    embeddedSublistDescriptorHostContext.dispose();\n  }\n}\n\nfunction validatePlannedLookupTargetsMaterialized", "  };\n}\n\nfunction validatePlannedLookupTargetsMaterialized");
  assert.notEqual(legacy, source, "The temporary copy must remove only the Phase 9N bridge.");
  assert.equal(legacy.includes("coreProjectDataListEmbeddedSublistDescriptor"), false, "Rollback must remove the Core adapter bridge.");
  assert.equal(legacy.includes("createDataListEmbeddedSublistDescriptorHostContext"), false, "Rollback must remove the host context bridge.");
  writeFileSync(path, legacy, "utf8");
  return target;
}

async function assertHostContextGates() {
  const contextModule = await import(`${pathToFileURL(resolve(root, "scripts/lib/data-list-sublist-frozen-descriptor-host-context.mjs")).href}?phase9n-gates`);
  const adapter = await import(`${pathToFileURL(resolve(root, "scripts/lib/materializer-core-adapter.mjs")).href}?phase9n-gates`);
  const raw = Object.freeze({ fieldName: "Text7" });
  const record = Object.freeze({ FieldID: "100000000000000002" });
  const descriptor = adapter.projectDataListEmbeddedSublistDescriptor(Object.freeze({ parentListId: "100000000000000001", parentFieldId: "100000000000000002", columns: Object.freeze(fixture.routedColumns.map((column) => Object.freeze({ ...column }))) })).descriptor;
  const first = contextModule.createDataListEmbeddedSublistDescriptorHostContext();
  first.selectAndBindRaw(raw, descriptor);
  first.bindCompletedRecord(raw, record);
  assert.equal(first.readForRules(raw), descriptor, "Rules must receive the selected descriptor instance.");
  assert.equal(first.readForCustomForm(record), descriptor, "Custom-form must receive the same selected descriptor instance.");
  assert.equal(first.selectionCount(), 1, "One raw field must have one selection.");
  assert.equal(JSON.stringify(first), "{}", "The host context must not serialize.");
  const other = contextModule.createDataListEmbeddedSublistDescriptorHostContext();
  assert.throws(() => other.readForCustomForm(record), /SUBLIST_COMPLETED_RECORD_NOT_BOUND/u);
  assert.throws(() => first.selectAndBindRaw(raw, Object.freeze({ ...descriptor })), /SUBLIST_DESCRIPTOR_RECOMPUTATION_FORBIDDEN/u);
  first.dispose();
  assert.throws(() => first.readForRules(raw), /SUBLIST_DESCRIPTOR_CONTEXT_DISPOSED/u);
  other.dispose();
}

function assertScopeGates(source) {
  for (const required of ["DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_RULES_ROUTE_START", "DATA_LIST_EMBEDDED_SUBLIST_FROZEN_DESCRIPTOR_CUSTOM_FORM_ROUTE_START", "embeddedSublistDescriptorHostContext.dispose()", "projectDataListEmbeddedSublistDescriptor"]) assert.match(source, new RegExp(required));
  for (const forbidden of ["childListId", "childFieldId", "rowSchemaId", "randomUUID", "child-resource inventory"]) assert.doesNotMatch(source.slice(source.indexOf("function selectExportProvenEmbeddedSublistDescriptor"), source.indexOf("function buildDataListSubListColumn")), new RegExp(forbidden, "i"));
}

function planText() { return `# Employee Leave Balances - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Employee Leave Balances
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Sublist Columns | Sublist Summaries | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Leave balance title | Title | Text | input | | | Native title field. |
| Leave details | Text7 | Text | list | Leavetype:Leave type:text:input:a43378ba-2659-4019-8f9d-55df79fbf94a:true; Hours:Hours:number:input_number:2c973bea-8ced-4183-b293-ed13121e18b8:true; StartDate:Start date:date:datepicker:f5b1a1d1-1c8f-4d7e-a928-642c3d1bdb17:true; Paid:Paid:boolean:checkbox:4d788177-952d-44f7-9c52-4c7a39229f61:false | None | Export-proven embedded parent-field schema. |

## 10. Custom Data List Forms Plan

### 10.1 Employee Leave Balances
| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Employee Leave Balance Form | New/Edit | Maintain leave details. |

#### Data List Form Layout Template Selection
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Employee Leave Balance Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current fields | None | Standard Data List form. | Generated-final validation |

#### Form Fields Layout Template Selection
| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Employee Leave Balance Form | Fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Leave details | None | Generated-final validation |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Employee Leave Balances | Employee Leave Balances | Data List | fa-solid fa-list |
`; }
