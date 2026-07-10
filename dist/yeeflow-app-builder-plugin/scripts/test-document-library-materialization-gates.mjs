#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { materializeFullAppGeneratedFinal } from "./materialize-full-app-generated-final.mjs";
import { encodeYapkResourceOfficial, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "document-library-materialization-gate-"));
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, "..");

function write(file, content) {
  fs.writeFileSync(file, `${content.trim()}\n`, "utf8");
  return file;
}

function navigationItems(decoded) {
  const layoutView = JSON.parse(decoded.ListSet?.LayoutView || decoded.Item?.ListModel?.LayoutView || "{}");
  return (layoutView.sort || []).flatMap((group) => group.list || []);
}

function runJson(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let report = null;
  try {
    report = JSON.parse(result.stdout || "{}");
  } catch {
    // Keep the raw process result in the assertion message below.
  }
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  return report;
}

function runJsonExpectFailure(command, args, expectedCode) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.notEqual(result.status, 0, `${command} ${args.join(" ")} unexpectedly passed`);
  const report = JSON.parse(result.stdout || "{}");
  assert.match(JSON.stringify(report), new RegExp(expectedCode), `${expectedCode} was not reported:\n${result.stdout}\n${result.stderr}`);
  return report;
}

function writeVariant(sourcePackage, decoded, name) {
  const wrapper = JSON.parse(fs.readFileSync(sourcePackage, "utf8"));
  wrapper.Resource = encodeYapkResourceOfficial(decoded);
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, `${JSON.stringify(wrapper)}\n`, "utf8");
  return file;
}

try {
  const specPath = write(path.join(tempDir, "functional-specification.md"), `
# Functional Specification: Internal Audit Document Library Regression

Build an internal audit management app with a document register data list and a native document library for audit evidence files.
`);

  const planPath = write(path.join(tempDir, "yeeflow-app-plan.md"), `
# Internal Audit Workflow Management - Yeeflow App Plan

## 1. Plan Status
Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Audit Document Register
- Resource type: Data List
- Business purpose: Track approved audit document metadata and lifecycle status.

| Field label | Field name | Field type | Purpose |
| --- | --- | --- | --- |
| Document Title | Title | Text | Native document register title. |
| Document Type | Text1 | Choice | Policy, Evidence, Report. |
| Approval Status | Text2 | Choice | Draft, Approved, Retired. |

### 4.2 Audit Evidence Library
- Resource type: Document Library
- Business purpose: Store native uploaded audit evidence documents and final audit reports.

| Folder Level | Folder Name / Pattern | Generation Plan | Proof Boundary | Notes |
| --- | --- | --- | --- | --- |
| Root | 01 Planning Evidence | Generate as root-level folder row | Export-proven | Planning files. |
| Root | 02 Final Reports | Generate as root-level folder row | Export-proven | Final reports. |
| Nested desired | Audit Year / Project ID | Post-import/runtime-proof-required | Deferred | Nested folders are not generated. |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Audit Workspace | Audit Document Register | Audit Document Register | Data List | fa-regular fa-table-list |
| Audit Workspace | Audit Evidence Library | Audit Evidence Library | Document library | fa-regular fa-folder-open |
`);

  const apiIdManifestPath = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifestPath, `${JSON.stringify({
    ids: Array.from({ length: 300 }, (_, index) => String(980000000000000000n + BigInt(index))),
  }, null, 2)}\n`);

  const report = materializeFullAppGeneratedFinal({
    functionalSpec: specPath,
    appPlan: planPath,
    outDir: path.join(tempDir, "dist"),
    apiIdManifest: apiIdManifestPath,
    tenantId: "980000000000099999",
    cwd: tempDir,
  });

  assert.equal(report.status, "pass", JSON.stringify(report.findings || [], null, 2));
  const { decoded } = readDecodedYapk(report.outputs.package);
  const childByTitle = new Map((decoded.Childs || []).map((child) => [child.List?.Title, child]));
  const register = childByTitle.get("Audit Document Register");
  const library = childByTitle.get("Audit Evidence Library");
  assert.ok(register, "planned data list must materialize");
  assert.ok(library, "planned document library must materialize");
  assert.equal(Number(register.List?.Type), 1, "document register must remain a Type 1 data list");
  assert.equal(Number(library.List?.Type), 16, "document library must materialize as native Type 16");
  assert.ok((library.Fields || []).some((field) => field.FieldName === "Text4" && field.Type === "file-upload"), "document library must include native Upload File field");
  const nativeFieldContract = {
    Title: { Status: 1, IsSystem: true, IsIndex: true, Rules: { displayLabel: true, isLibrary: true } },
    Bigint1: { Status: 127, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, isNotInListFiles: true } },
    Text1: { Status: 119, IsSystem: false, IsIndex: false, Rules: { displayLabel: true } },
    Bigint2: { Status: 99, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, readonly: true } },
    Text2: { Status: 99, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, readonly: true } },
    Text3: { Status: 319, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, isNotInListFiles: true } },
    Text4: { Status: 57, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, required: true, isLabrary: true, PROP_MAXSIZE: 2147483648 } },
  };
  for (const [fieldName, expected] of Object.entries(nativeFieldContract)) {
    const field = library.Fields.find((candidate) => candidate.FieldName === fieldName);
    assert.ok(field, `Document Library native field ${fieldName} must exist`);
    assert.equal(field.Status, expected.Status, `${fieldName} must preserve runtime Status`);
    assert.equal(field.IsSystem, expected.IsSystem, `${fieldName} must preserve IsSystem`);
    assert.equal(field.IsIndex, expected.IsIndex, `${fieldName} must preserve IsIndex`);
    assert.deepEqual(JSON.parse(field.Rules), expected.Rules, `${fieldName} must preserve runtime Rules`);
  }
  assert.equal(Object.keys(library.List?.Items || {}).length, 2, "planned root folders must materialize under Type 16 List.Items");
  const folderEntries = Object.entries(library.List.Items);
  assert.ok(folderEntries.every(([folderId]) => /^\d{16,}$/.test(folderId)), "folder object keys must use allocated API-style IDs");
  assert.deepEqual(folderEntries.map(([, row]) => row.Title), ["01 Planning Evidence", "02 Final Reports"], "root folder order must follow the App Plan");
  for (const [, row] of folderEntries) {
    assert.equal(row.Bigint1, "0", "root folders must use Bigint1 = 0");
    assert.equal(row.Text1, "folder", "folder rows must use Text1 = folder");
    assert.equal(row.Bigint2, "", "folder rows must keep file size blank");
    assert.equal(row.Text2, "", "folder rows must keep extension blank");
    assert.equal(row.Text3, `0_${row.Title.toLowerCase()}`, "folder unique name must follow export shape");
    assert.equal(Object.prototype.hasOwnProperty.call(row, "Text4"), false, "folder rows must omit file upload payloads");
    assert.equal(Object.prototype.hasOwnProperty.call(row, "ListDataID"), false, "folder IDs must remain List.Items keys");
  }
  assert.equal(folderEntries.some(([, row]) => /Audit Year/.test(row.Title)), false, "nested desired folders must remain deferred");
  const provenance = JSON.parse(fs.readFileSync(report.outputs.idProvenance, "utf8"));
  const folderAllocations = (provenance.allocations || []).filter((allocation) => /\.List\.Items\[\d+\]\.\$key$/.test(allocation.path || ""));
  assert.equal(folderAllocations.length, 2, "each generated folder key must have an ID provenance allocation");
  assert.deepEqual(folderAllocations.map((allocation) => allocation.id), folderEntries.map(([folderId]) => folderId), "folder key IDs must match provenance allocations");
  const provenanceValidationFixture = structuredClone(provenance);
  provenanceValidationFixture.sourceMarker = "api-generated";
  provenanceValidationFixture.allocations = (provenanceValidationFixture.allocations || []).map((allocation) => ({ ...allocation, source: "api-generated" }));
  const provenanceValidationPath = path.join(tempDir, "folder-key-id-provenance.json");
  fs.writeFileSync(provenanceValidationPath, `${JSON.stringify(provenanceValidationFixture, null, 2)}\n`, "utf8");
  const idProvenanceValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-yapk-id-provenance.mjs"),
    "--package", report.outputs.package,
    "--manifest", provenanceValidationPath,
  ]);
  assert.equal(idProvenanceValidation.status, "pass", "folder object-key IDs must pass generated-final provenance validation");

  const nav = navigationItems(decoded);
  assert.ok(nav.some((item) => item.Title === "Audit Document Register" && Number(item.Type) === 1), "data-list navigation item must be Type 1");
  assert.ok(nav.some((item) => item.Title === "Audit Evidence Library" && Number(item.Type) === 16), "document-library navigation item must be Type 16");

  const packageValidation = runJson(process.execPath, [path.join(PLUGIN_ROOT, "validate-yapk-package.js"), report.outputs.package]);
  assert.deepEqual(packageValidation.errors || [], [], "generated native Document Library package must pass validate-yapk-package");
  const schemaValidation = runJson(process.execPath, [path.join(SCRIPT_DIR, "validate-standard-package-schema.mjs"), report.outputs.package]);
  assert.equal(schemaValidation.status, "pass", "generated native Document Library package must pass canonical schema validation");
  const navigationValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-yapk-navigation-runtime-metadata.mjs"),
    "--package", report.outputs.package,
    "--id-provenance", report.outputs.idProvenance,
  ]);
  assert.equal(navigationValidation.status, "pass", "Type 16 navigation must pass runtime metadata validation");
  const systemSchemaValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-data-list-system-schema.mjs"),
    report.outputs.package,
    "--json",
  ]);
  assert.deepEqual(systemSchemaValidation.errors || [], [], "Data List system schema validation must preserve Document Library native Title metadata");
  const exportShapeValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-generated-yapk-export-shape.mjs"),
    "--package", report.outputs.package,
  ]);
  assert.equal(exportShapeValidation.status, "pass", "generated YAPK export shape must preserve Document Library native Title metadata");
  const runtimeMetadataValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-document-library-native-field-runtime-metadata.mjs"),
    "--package", report.outputs.package,
  ]);
  assert.equal(runtimeMetadataValidation.status, "pass", "generated Type 16 fields must satisfy the runtime metadata contract");
  assert.equal(runtimeMetadataValidation.documentLibraryCount, 1, "runtime metadata validation must inspect the Type 16 library and ignore the Type 1 register");
  const completenessValidation = runJson(process.execPath, [
    path.join(SCRIPT_DIR, "validate-generated-final-resource-completeness.mjs"),
    "--plan", planPath,
    "--package", report.outputs.package,
  ]);
  assert.equal(completenessValidation.status, "pass", "planned Document Library folders must pass plan-to-package completeness validation");

  const invalidDataListBigint = structuredClone(decoded);
  const invalidRegister = invalidDataListBigint.Childs.find((child) => child.List?.Title === "Audit Document Register");
  invalidRegister.Fields[1] = {
    ...invalidRegister.Fields[1],
    FieldName: "Bigint1",
    InternalName: "Bigint1",
    FieldType: "Bigint",
    FieldIndex: 1,
    Type: "input_number",
    Rules: "",
  };
  runJsonExpectFailure(process.execPath, [
    path.join(PLUGIN_ROOT, "validate-yapk-package.js"),
    writeVariant(report.outputs.package, invalidDataListBigint, "invalid-data-list-bigint.yapk"),
  ], "YAPK_FIELD_TYPE_INVALID");

  const invalidDataListItems = structuredClone(decoded);
  invalidDataListItems.Childs.find((child) => child.List?.Title === "Audit Document Register").List.Items = {
    "980000000000099991": { Title: "Forbidden sample" },
  };
  runJsonExpectFailure(process.execPath, [
    path.join(PLUGIN_ROOT, "validate-yapk-package.js"),
    writeVariant(report.outputs.package, invalidDataListItems, "invalid-data-list-items.yapk"),
  ], "YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN");

  const invalidFolderUpload = structuredClone(decoded);
  const invalidFolderLibrary = invalidFolderUpload.Childs.find((child) => child.List?.Title === "Audit Evidence Library");
  invalidFolderLibrary.List.Items[Object.keys(invalidFolderLibrary.List.Items)[0]].Text4 = "forbidden-file-payload";
  const invalidFolderPackage = writeVariant(report.outputs.package, invalidFolderUpload, "invalid-folder-upload.yapk");
  runJsonExpectFailure(process.execPath, [path.join(PLUGIN_ROOT, "validate-yapk-package.js"), invalidFolderPackage], "DOCUMENT_LIBRARY_FOLDER_UPLOAD_FORBIDDEN");
  runJsonExpectFailure(process.execPath, [path.join(SCRIPT_DIR, "validate-standard-package-schema.mjs"), invalidFolderPackage], "DOCUMENT_LIBRARY_FOLDER_UPLOAD_FORBIDDEN");
  runJsonExpectFailure(process.execPath, [path.join(SCRIPT_DIR, "validate-generated-yapk-export-shape.mjs"), "--package", invalidFolderPackage], "DOCUMENT_LIBRARY_FOLDER_UPLOAD_FORBIDDEN");

  const missingPlannedFolder = structuredClone(decoded);
  const missingFolderLibrary = missingPlannedFolder.Childs.find((child) => child.List?.Title === "Audit Evidence Library");
  delete missingFolderLibrary.List.Items[Object.keys(missingFolderLibrary.List.Items)[0]];
  runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-generated-final-resource-completeness.mjs"),
    "--plan", planPath,
    "--package", writeVariant(report.outputs.package, missingPlannedFolder, "missing-planned-folder.yapk"),
  ], "GENERATED_FINAL_DOCUMENT_LIBRARY_FOLDER_MISSING");

  const invalidDocumentLibraryNavigation = structuredClone(decoded);
  const invalidLayoutView = JSON.parse(invalidDocumentLibraryNavigation.ListSet.LayoutView);
  const invalidNavItems = invalidLayoutView.sort.flatMap((group) => group.list || []);
  invalidNavItems.find((item) => item.Title === "Audit Evidence Library").ListID = register.List.ListID;
  invalidDocumentLibraryNavigation.ListSet.LayoutView = JSON.stringify(invalidLayoutView);
  runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-yapk-navigation-runtime-metadata.mjs"),
    "--package", writeVariant(report.outputs.package, invalidDocumentLibraryNavigation, "invalid-document-library-navigation.yapk"),
    "--id-provenance", report.outputs.idProvenance,
  ], "NAVIGATION_DOCUMENT_LIBRARY_TARGET_INVALID");

  const invalidDocumentLibraryTitle = structuredClone(decoded);
  const invalidLibrary = invalidDocumentLibraryTitle.Childs.find((child) => child.List?.Title === "Audit Evidence Library");
  invalidLibrary.Fields.find((field) => field.FieldName === "Title").Status = 0;
  const invalidDocumentLibraryTitlePackage = writeVariant(report.outputs.package, invalidDocumentLibraryTitle, "invalid-document-library-title.yapk");
  runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-data-list-system-schema.mjs"),
    invalidDocumentLibraryTitlePackage,
    "--json",
  ], "DOCUMENT_LIBRARY_NATIVE_TITLE_STATUS_INVALID");
  runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-generated-yapk-export-shape.mjs"),
    "--package", invalidDocumentLibraryTitlePackage,
  ], "DOCUMENT_LIBRARY_NATIVE_TITLE_STATUS_INVALID");

  const simplifiedDocumentLibraryMetadata = structuredClone(decoded);
  const simplifiedLibrary = simplifiedDocumentLibraryMetadata.Childs.find((child) => child.List?.Title === "Audit Evidence Library");
  for (const field of simplifiedLibrary.Fields) {
    if (field.FieldName === "Title") {
      field.Rules = JSON.stringify({ isLibrary: true });
      continue;
    }
    field.Status = 1;
    field.IsSystem = true;
    if (field.FieldName === "Bigint1" || field.FieldName === "Text3") field.Rules = JSON.stringify({ isNotInListFiles: true });
    else if (field.FieldName === "Bigint2" || field.FieldName === "Text2") field.Rules = JSON.stringify({ readonly: true });
    else if (field.FieldName === "Text4") field.Rules = JSON.stringify({ required: true, isLabrary: true, isLibrary: true });
    else field.Rules = "";
  }
  const simplifiedMetadataPackage = writeVariant(report.outputs.package, simplifiedDocumentLibraryMetadata, "simplified-document-library-runtime-metadata.yapk");
  const simplifiedMetadataFailure = runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-document-library-native-field-runtime-metadata.mjs"),
    "--package", simplifiedMetadataPackage,
  ], "DOCUMENT_LIBRARY_NATIVE_FIELD_STATUS_INVALID");
  const simplifiedCodes = new Set((simplifiedMetadataFailure.findings || []).map((finding) => finding.code));
  assert.ok(simplifiedCodes.has("DOCUMENT_LIBRARY_NATIVE_FIELD_SYSTEM_FLAG_INVALID"), "simplified IsSystem metadata must fail");
  assert.ok(simplifiedCodes.has("DOCUMENT_LIBRARY_NATIVE_FIELD_RULE_INVALID"), "missing displayLabel and upload runtime rules must fail");
  assert.ok(simplifiedCodes.has("DOCUMENT_LIBRARY_NATIVE_FIELD_RULE_UNSUPPORTED"), "legacy Text4 Rules.isLibrary must fail");

  const invalidDocumentLibraryTitleIndex = structuredClone(decoded);
  invalidDocumentLibraryTitleIndex.Childs
    .find((child) => child.List?.Title === "Audit Evidence Library")
    .Fields.find((field) => field.FieldName === "Title").FieldIndex = 1;
  runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "validate-document-library-native-field-runtime-metadata.mjs"),
    "--package", writeVariant(report.outputs.package, invalidDocumentLibraryTitleIndex, "invalid-document-library-title-index.yapk"),
  ], "DOCUMENT_LIBRARY_NATIVE_FIELD_INDEX_INVALID");

  const preflightFailure = runJsonExpectFailure(process.execPath, [
    path.join(SCRIPT_DIR, "yapk-first-generation-preflight.mjs"),
    "--package", simplifiedMetadataPackage,
    "--plan", planPath,
    "--id-provenance", provenanceValidationPath,
    "--json",
  ], "DOCUMENT_LIBRARY_NATIVE_FIELD_STATUS_INVALID");
  assert.equal(preflightFailure.failedGate, "document-library-native-field-runtime-metadata", "first-generation preflight must stop at the dedicated Document Library runtime metadata gate");

  console.log(JSON.stringify({
    status: "pass",
    cases: [
      "App Plan Document Library rows materialize as Type 16 child resources",
      "Document Libraries are not downgraded to Data Lists with file-upload fields",
      "Document Library navigation uses Type 16",
      "Document Library default upload field is present",
      "All seven native Document Library fields preserve runtime-proven Status, Rules, IsSystem, and IsIndex metadata",
      "The dedicated runtime metadata validator inspects Type 16 resources and ignores Type 1 Data Lists",
      "Simplified Data List-style Document Library field metadata fails before signing",
      "Title FieldIndex remains 0 for current canonical schema compatibility",
      "First-generation preflight exposes the Document Library runtime metadata hard gate",
      "Native Bigint Document Library fields pass package validation without Data List coercion",
      "Type 16 fields pass the canonical schema compatibility projection",
      "Type 16 navigation targets resolve through the runtime metadata gate",
      "Bigint remains forbidden for normal Type 1 Data Lists",
      "Type 16 navigation cannot target a Type 1 Data List",
      "Document Library Title Status 1 passes system-schema and export-shape gates",
      "Data List Title Status 0 and Document Library Title Status 1 remain distinct contracts",
      "App Plan root-folder rows materialize as Type 16 List.Items folder entries",
      "Nested desired folders remain deferred until focused runtime proof",
      "Folder object-key IDs are represented in generated ID provenance",
      "Folder object-key IDs pass generated-final provenance validation",
      "Type 1 List.Items sample rows remain forbidden",
      "Folder rows with Text4 upload payloads fail all generated-final gates",
      "Planned root folders are enforced by plan-to-package completeness validation",
    ],
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
