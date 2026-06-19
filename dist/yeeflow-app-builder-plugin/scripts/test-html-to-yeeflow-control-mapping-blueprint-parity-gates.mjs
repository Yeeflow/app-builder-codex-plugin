#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-html-control-map-"));
const mappingValidator = path.join(ROOT, "scripts/validate-html-to-yeeflow-control-mapping.mjs");
const blueprintComparator = path.join(ROOT, "scripts/compare-blueprint-to-ui-surface-contract.mjs");
const registryPath = path.join(ROOT, "docs/standards/html-to-yeeflow-control-mapping-registry.md");

runHtmlMappingTests();
runBlueprintParityTests();

console.log("HTML-to-Yeeflow control mapping and blueprint parity gate tests passed");

function runHtmlMappingTests() {
  expectMappingPass("field input element has required Yeeflow mapping metadata", [fieldControl(), saveButton()]);
  expectMappingFail("implementation field has no data-blueprint-id", [fieldControl({ omit: ["data-blueprint-id"] }), saveButton()], "HTML_IMPLEMENTATION_ELEMENT_BLUEPRINT_ID_MISSING");
  expectMappingFail("field data-field-type differs from contract field type", [fieldControl({ "data-field-type": "Number" }), saveButton()], "HTML_FIELD_TYPE_MISMATCH");
  expectMappingFail("field binding differs from contract binding", [fieldControl({ "data-binding": "Vendors.WrongName" }), saveButton()], "HTML_FIELD_BINDING_MISMATCH");
  expectMappingFail("required metadata differs from contract", [fieldControl({ "data-required": "false" }), saveButton()], "HTML_FIELD_REQUIRED_MISMATCH");
  expectMappingFail("readonly metadata differs from contract", [fieldControl({ "data-readonly": "true" }), saveButton()], "HTML_FIELD_READONLY_MISMATCH");
  expectMappingPass("button action maps to action ID/type/contract", [fieldControl(), saveButton()]);
  expectMappingFail("button visually exists but lacks action contract", [fieldControl(), saveButton({ omit: ["data-action-id", "data-action-type", "data-action-contract"] })], "HTML_ACTION_MAPPING_ATTRIBUTE_MISSING");
  expectMappingFail("button action type differs from contract", [fieldControl(), saveButton({ "data-action-type": "open-detail" })], "HTML_ACTION_TYPE_MISMATCH");
  expectMappingPass("Sub List declares source list parent binding and row context", [fieldControl(), saveButton(), subList()]);
  expectMappingFail("Sub List missing source list fails", [fieldControl(), saveButton(), subList({ omit: ["data-source-list"] })], "HTML_LIST_MAPPING_ATTRIBUTE_MISSING");
  expectMappingFail("Sub List missing parent binding fails", [fieldControl(), saveButton(), subList({ omit: ["data-parent-binding"] })], "HTML_LIST_MAPPING_ATTRIBUTE_MISSING");
  expectMappingPass("Collection declares source list and item context", [fieldControl(), saveButton(), collection()]);
  expectMappingFail("Collection source list differs from contract", [fieldControl(), saveButton(), collection({ "data-source-list": "Renewal Tasks" })], "HTML_SOURCE_LIST_MISMATCH");
  expectMappingPass("status badge uses registered mapping and style token", [fieldControl(), saveButton(), statusBadge()]);
  expectMappingFail("unknown data-yeeflow-control fails", [fieldControl(), saveButton(), unknownControl()], "HTML_UNKNOWN_YEEFLOW_CONTROL_MAPPING");
  expectMappingPass("unknown control allowed only when explicitly deferred with proof impact", [fieldControl(), saveButton(), unknownControl({ "data-supported-status": "deferred", "data-proof-boundary": "deferred with reason fallback proof impact before generation" })]);
  expectMappingFail("duplicate data-blueprint-id outside repeated row template fails", [fieldControl(), saveButton(), textDisplay({ "data-blueprint-id": "vendor-name-field" })], "HTML_BLUEPRINT_ID_DUPLICATE");
  expectMappingPass("repeated row template allows duplicate internal pattern IDs", [fieldControl(), saveButton(), repeatedRow(), repeatedRow()]);
  expectMappingFail("arbitrary CSS class with no data-style-token fails", [fieldControl({ omit: ["data-style-token"] }), saveButton()], "HTML_STYLE_TOKEN_MISSING");
  expectMappingPass("style layout and responsive tokens are known", [fieldControl(), saveButton(), collection()]);
}

function runBlueprintParityTests() {
  expectBlueprintPass("Blueprint control type matches HTML registry mapping", goodBlueprint());
  expectBlueprintFail("Blueprint maps sub-list to generic container", mutateControl(goodBlueprint(), "related-documents-sublist", { yeeflowControl: "container" }), "BLUEPRINT_HTML_CONTROL_TYPE_MISMATCH");
  expectBlueprintFail("Blueprint maps user-picker to text control", mutateControl(withOwnerControl(goodBlueprint()), "owner-user", { yeeflowControl: "text" }), "BLUEPRINT_HTML_CONTROL_TYPE_MISMATCH", [ownerPicker()]);
  expectBlueprintFail("Blueprint omits required action button", withoutControl(goodBlueprint(), "save-action"), "BLUEPRINT_HTML_CONTROL_MISSING");
  expectBlueprintFail("Blueprint changes field binding", mutateControl(goodBlueprint(), "vendor-name-field", { binding: "Vendors.WrongName" }), "BLUEPRINT_HTML_FIELD_BINDING_MISMATCH");
  expectBlueprintFail("Blueprint changes source list", mutateControl(goodBlueprint(), "related-documents-sublist", { sourceList: "Renewal Tasks" }), "BLUEPRINT_HTML_SOURCE_LIST_MISMATCH");
  expectBlueprintFail("Blueprint loses style token intent", mutateControl(goodBlueprint(), "vendor-name-field", { styleToken: "field.other" }), "BLUEPRINT_HTML_STYLE_TOKEN_MISMATCH");
  expectBlueprintPass("declared hidden/helper runtime control is allowed", {
    ...goodBlueprint(),
    controls: [...goodBlueprint().controls, { blueprintId: "runtime-helper", yeeflowControl: "container", controlRole: "helper runtime", styleToken: "ds-helper", layoutToken: "layout-helper", responsiveToken: "responsive-helper" }],
  });
  expectBlueprintFail("Blueprint adds undeclared implementation-relevant control", {
    ...goodBlueprint(),
    controls: [...goodBlueprint().controls, { blueprintId: "invented-control", yeeflowControl: "field-input", fieldId: "invented", binding: "Vendors.Invented", styleToken: "field.standard", layoutToken: "layout.form", responsiveToken: "responsive.stack" }],
  }, "BLUEPRINT_UNDECLARED_IMPLEMENTATION_CONTROL");
}

function expectMappingPass(label, elements) {
  const paths = writeCase(elements);
  const result = run([mappingValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--registry", registryPath]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectMappingFail(label, elements, code) {
  const paths = writeCase(elements);
  const result = run([mappingValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--registry", registryPath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectBlueprintPass(label, blueprint, extraElements = []) {
  const paths = writeCase([fieldControl(), saveButton(), subList(), ...extraElements]);
  const blueprints = writeJson(`blueprints-${Math.random().toString(16).slice(2)}.json`, { blueprints: [blueprint] });
  const result = run([blueprintComparator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--blueprints", blueprints, "--registry", registryPath]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectBlueprintFail(label, blueprint, code, extraElements = []) {
  const paths = writeCase([fieldControl(), saveButton(), subList(), ...extraElements]);
  const blueprints = writeJson(`blueprints-${Math.random().toString(16).slice(2)}.json`, { blueprints: [blueprint] });
  const result = run([blueprintComparator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--blueprints", blueprints, "--registry", registryPath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function writeCase(elements) {
  const htmlDir = path.join(tempRoot, `html-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(path.join(htmlDir, "vendor-edit.html"), html(elements));
  const ids = new Set(elements.map((element) => /data-blueprint-id="([^"]+)"/.exec(element)?.[1]).filter(Boolean));
  const base = contract();
  base.controlMapping = base.controlMapping.filter((mapping) => ids.has(mapping.blueprintId));
  const contracts = writeJson(`contracts-${Math.random().toString(16).slice(2)}.json`, { contracts: [base] });
  return { htmlDir, contracts };
}

function contract() {
  return {
    surfaceId: "vendor-edit",
    surfaceName: "Vendor Edit",
    surfaceType: "Data List New/Edit form",
    requiredFields: ["Vendor Name"],
    requiredActions: ["Save"],
    controlMapping: [
      {
        controlId: "vendor-name",
        blueprintId: "vendor-name-field",
        htmlDataSelector: "[data-blueprint-id=\"vendor-name-field\"]",
        yeeflowControl: "field-input",
        controlRole: "field",
        sourceResource: "Data List",
        sourceList: "Vendors",
        fieldId: "vendorName",
        fieldName: "Vendor Name",
        fieldType: "Text",
        binding: "Vendors.VendorName",
        required: true,
        readonly: false,
        defaultValue: "",
        validationRules: "required",
        styleToken: "field.standard",
        layoutToken: "layout.form.two-column",
        responsiveToken: "responsive.form.stack",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
      {
        controlId: "save-action",
        blueprintId: "save-action",
        htmlDataSelector: "[data-blueprint-id=\"save-action\"]",
        yeeflowControl: "button",
        controlRole: "action",
        actionId: "saveVendor",
        actionType: "save-record",
        actionContract: "Save current Vendor record",
        rowContext: "current Vendor",
        styleToken: "button.primary",
        layoutToken: "layout.action-row",
        responsiveToken: "responsive.action-stack",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
      {
        controlId: "related-documents",
        blueprintId: "related-documents-sublist",
        htmlDataSelector: "[data-blueprint-id=\"related-documents-sublist\"]",
        yeeflowControl: "sub-list",
        controlRole: "list-region",
        sourceResource: "Document Library",
        sourceList: "Contract Documents",
        rowContext: "current document row",
        parentBinding: "Vendors.VendorId",
        styleToken: "sublist.document-table",
        layoutToken: "layout.lower-region",
        responsiveToken: "responsive.table-card-fallback",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
      {
        controlId: "related-contracts",
        blueprintId: "related-contracts-collection",
        htmlDataSelector: "[data-blueprint-id=\"related-contracts-collection\"]",
        yeeflowControl: "collection",
        controlRole: "list-region",
        sourceResource: "Data List",
        sourceList: "Contracts",
        rowContext: "current contract item",
        parentBinding: "Vendors.VendorId",
        styleToken: "collection.contract-card",
        layoutToken: "layout.lower-region",
        responsiveToken: "responsive.card-list",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
      {
        controlId: "status-badge",
        blueprintId: "status-badge",
        htmlDataSelector: "[data-blueprint-id=\"status-badge\"]",
        yeeflowControl: "status-badge",
        controlRole: "display",
        fieldId: "vendorStatus",
        fieldName: "Vendor Status",
        fieldType: "Choice",
        binding: "Vendors.Status",
        styleToken: "badge.status.active",
        layoutToken: "layout.inline",
        responsiveToken: "responsive.inline-wrap",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
      {
        controlId: "owner-user",
        blueprintId: "owner-user",
        htmlDataSelector: "[data-blueprint-id=\"owner-user\"]",
        yeeflowControl: "user-picker",
        controlRole: "field",
        sourceResource: "Data List",
        sourceList: "Vendors",
        fieldId: "owner",
        fieldName: "Owner",
        fieldType: "User",
        binding: "Vendors.Owner",
        required: false,
        readonly: false,
        styleToken: "field.user-picker",
        layoutToken: "layout.form.two-column",
        responsiveToken: "responsive.form.stack",
        supportedStatus: "validator-backed",
        proofBoundary: "mapping validation only",
      },
    ],
  };
}

function html(elements) {
  return `<!doctype html><html><body data-surface-id="vendor-edit">${elements.map((element) => element).join("\n")}</body></html>`;
}

function fieldControl(overrides = {}) {
  return tag("input", {
    "data-section-id": "vendor-fields",
    "data-blueprint-id": "vendor-name-field",
    "data-yeeflow-control": "field-input",
    "data-control-role": "field",
    "data-source-resource": "Data List",
    "data-source-list": "Vendors",
    "data-field-id": "vendorName",
    "data-field-name": "Vendor Name",
    "data-field-type": "Text",
    "data-binding": "Vendors.VendorName",
    "data-required": "true",
    "data-readonly": "false",
    "data-default-value": "",
    "data-validation": "required",
    "data-style-token": "field.standard",
    "data-layout-token": "layout.form.two-column",
    "data-responsive-token": "responsive.form.stack",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  });
}

function ownerPicker(overrides = {}) {
  return tag("input", {
    "data-blueprint-id": "owner-user",
    "data-yeeflow-control": "user-picker",
    "data-control-role": "field",
    "data-source-resource": "Data List",
    "data-source-list": "Vendors",
    "data-field-id": "owner",
    "data-field-name": "Owner",
    "data-field-type": "User",
    "data-binding": "Vendors.Owner",
    "data-required": "false",
    "data-readonly": "false",
    "data-style-token": "field.user-picker",
    "data-layout-token": "layout.form.two-column",
    "data-responsive-token": "responsive.form.stack",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  });
}

function saveButton(overrides = {}) {
  return tag("button", {
    "data-blueprint-id": "save-action",
    "data-yeeflow-control": "button",
    "data-control-role": "action",
    "data-action-id": "saveVendor",
    "data-action-type": "save-record",
    "data-action-contract": "Save current Vendor record",
    "data-row-context": "current Vendor",
    "data-style-token": "button.primary",
    "data-layout-token": "layout.action-row",
    "data-responsive-token": "responsive.action-stack",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Save");
}

function subList(overrides = {}) {
  return tag("section", {
    "data-blueprint-id": "related-documents-sublist",
    "data-yeeflow-control": "sub-list",
    "data-control-role": "list-region",
    "data-source-resource": "Document Library",
    "data-source-list": "Contract Documents",
    "data-parent-binding": "Vendors.VendorId",
    "data-row-context": "current document row",
    "data-style-token": "sublist.document-table",
    "data-layout-token": "layout.lower-region",
    "data-responsive-token": "responsive.table-card-fallback",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Related Documents");
}

function collection(overrides = {}) {
  return tag("section", {
    "data-blueprint-id": "related-contracts-collection",
    "data-yeeflow-control": "collection",
    "data-control-role": "list-region",
    "data-source-resource": "Data List",
    "data-source-list": "Contracts",
    "data-parent-binding": "Vendors.VendorId",
    "data-row-context": "current contract item",
    "data-style-token": "collection.contract-card",
    "data-layout-token": "layout.lower-region",
    "data-responsive-token": "responsive.card-list",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Related Contracts");
}

function statusBadge(overrides = {}) {
  return tag("span", {
    "data-blueprint-id": "status-badge",
    "data-yeeflow-control": "status-badge",
    "data-control-role": "display",
    "data-field-id": "vendorStatus",
    "data-field-name": "Vendor Status",
    "data-field-type": "Choice",
    "data-binding": "Vendors.Status",
    "data-style-token": "badge.status.active",
    "data-layout-token": "layout.inline",
    "data-responsive-token": "responsive.inline-wrap",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Active");
}

function textDisplay(overrides = {}) {
  return tag("span", {
    "data-blueprint-id": "vendor-name-display",
    "data-yeeflow-control": "text",
    "data-control-role": "display",
    "data-style-token": "text.body",
    "data-layout-token": "layout.inline",
    "data-responsive-token": "responsive.inline-wrap",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Acme Supplies");
}

function unknownControl(overrides = {}) {
  return tag("section", {
    "data-blueprint-id": "unsupported-widget",
    "data-yeeflow-control": "unsupported-widget",
    "data-control-role": "display",
    "data-style-token": "surface.unsupported",
    "data-layout-token": "layout.lower-region",
    "data-responsive-token": "responsive.stack",
    "data-proof-boundary": "mapping validation only",
    ...overrides,
  }, "Unsupported Widget");
}

function repeatedRow() {
  return tag("div", {
    "data-blueprint-id": "document-row-template",
    "data-yeeflow-control": "container",
    "data-control-role": "row-template",
    "data-repeat-template": "true",
    "data-repeat-context": "Contract Documents rows",
    "data-style-token": "table.row",
    "data-layout-token": "layout.row",
    "data-responsive-token": "responsive.table-card-fallback",
    "data-proof-boundary": "mapping validation only",
  }, "Document row");
}

function tag(name, attrs, body = "") {
  const omit = new Set(attrs.omit || []);
  delete attrs.omit;
  const rendered = Object.entries(attrs)
    .filter(([key]) => !omit.has(key))
    .map(([key, value]) => `${key}="${String(value).replaceAll("\"", "&quot;")}"`)
    .join(" ");
  return `<${name} ${rendered}>${body}</${name}>`;
}

function goodBlueprint() {
  return {
    surfaceId: "vendor-edit",
    fields: ["Vendor Name"],
    actions: ["Save"],
    controls: [
      { blueprintId: "vendor-name-field", yeeflowControl: "field-input", sourceList: "Vendors", fieldId: "vendorName", fieldType: "Text", binding: "Vendors.VendorName", styleToken: "field.standard", layoutToken: "layout.form.two-column", responsiveToken: "responsive.form.stack" },
      { blueprintId: "save-action", yeeflowControl: "button", actionId: "saveVendor", actionType: "save-record", actionContract: "Save current Vendor record", rowContext: "current Vendor", styleToken: "button.primary", layoutToken: "layout.action-row", responsiveToken: "responsive.action-stack" },
      { blueprintId: "related-documents-sublist", yeeflowControl: "sub-list", sourceList: "Contract Documents", rowContext: "current document row", parentBinding: "Vendors.VendorId", styleToken: "sublist.document-table", layoutToken: "layout.lower-region", responsiveToken: "responsive.table-card-fallback" },
    ],
    designSystemStyleIntent: "Typography hierarchy, spacing scale, card section table form surface pattern, action placement, status badge chip semantics, mobile responsive stack intent.",
    typographyHierarchy: "Page title and section title typography hierarchy.",
    spacingScale: "Design token spacing gap padding density.",
    sectionPattern: "Card, section, table, and form patterns.",
    actionPlacement: "Primary action placement in action bar.",
    statusBadgeSemantics: "Status badge/chip semantics preserved.",
    mobileResponsiveIntent: "Mobile responsive stack and card list fallback.",
  };
}

function mutateControl(blueprint, blueprintId, patch) {
  return {
    ...blueprint,
    controls: blueprint.controls.map((control) => control.blueprintId === blueprintId ? { ...control, ...patch } : control),
  };
}

function withoutControl(blueprint, blueprintId) {
  return { ...blueprint, controls: blueprint.controls.filter((control) => control.blueprintId !== blueprintId), actions: [] };
}

function withOwnerControl(blueprint) {
  return {
    ...blueprint,
    controls: [
      ...blueprint.controls,
      { blueprintId: "owner-user", yeeflowControl: "user-picker", sourceList: "Vendors", fieldId: "owner", fieldType: "User", binding: "Vendors.Owner", styleToken: "field.user-picker", layoutToken: "layout.form.two-column", responsiveToken: "responsive.form.stack" },
    ],
  };
}

function writeJson(name, value) {
  const file = path.join(tempRoot, name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function run(command) {
  const [script, ...args] = command;
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8" });
}
