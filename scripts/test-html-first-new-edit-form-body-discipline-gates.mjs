#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-new-edit-body-discipline-"));
const contractsValidator = path.join(ROOT, "scripts/validate-ui-surface-contracts.mjs");
const htmlValidator = path.join(ROOT, "scripts/validate-html-preview-layout.mjs");
const mappingValidator = path.join(ROOT, "scripts/validate-html-to-yeeflow-control-mapping.mjs");
const blueprintComparator = path.join(ROOT, "scripts/compare-blueprint-to-ui-surface-contract.mjs");
const registryPath = path.join(ROOT, "docs/standards/html-to-yeeflow-control-mapping-registry.md");

runContractTests();
runHtmlPreviewTests();
runPlaceholderAndMappingTests();
runBlueprintTests();

console.log("HTML-first New/Edit form body discipline gate tests passed");

function runContractTests() {
  expectContractFail("Data List New/Edit allowedRegions cannot include Primary form fields", { allowedRegions: ["Primary form fields"] }, "UI_SURFACE_CONTRACT_PRIMARY_FIELD_REGION_FORBIDDEN");
  expectContractFail("Data List New/Edit relatedRegions cannot include Primary form fields", { relatedRegions: ["Primary form fields"] }, "UI_SURFACE_CONTRACT_PRIMARY_FIELD_REGION_FORBIDDEN");
  expectContractPass("Data List New/Edit with fieldGroups/controlMapping and no generic region passes", {});
  expectContractFail(
    "Document Library New/Edit cannot use Document metadata fields as lower related region",
    { surfaceType: "Document Library New/Edit form", allowedRegions: [], relatedRegions: ["Document metadata fields"], sourceListOrFormName: "Contract Documents", sourceResourceName: "Contract Documents" },
    "UI_SURFACE_CONTRACT_PRIMARY_FIELD_REGION_FORBIDDEN",
  );
  expectContractPass("Document Library New/Edit has document metadata in fieldGroups/controlMapping", {
    surfaceType: "Document Library New/Edit form",
    sourceResourceType: "Document Library",
    sourceResourceName: "Contract Documents",
    sourceListOrFormName: "Contract Documents",
    requiredFields: ["Document name", "Document type", "Linked contract", "Status", "File upload", "Notes"],
    editableFields: ["Document name", "Document type", "Linked contract", "Status", "File upload", "Notes"],
    fieldGroups: [{ groupName: "Document metadata", fields: ["Document name", "Document type", "Linked contract", "Status", "File upload", "Notes"] }],
    controlMapping: [
      ...baseFieldMappings(["Document name", "Document type", "Linked contract", "Status", "File upload", "Notes"]),
      primaryAction("save", "Save"),
      primaryAction("cancel", "Cancel"),
    ],
  });
  expectContractFail("Duplicate Save action in contract fails", { controlMapping: [...baseFieldMappings(), primaryAction("save", "Save"), primaryAction("primary-form-fields.save", "Save"), primaryAction("cancel", "Cancel")] }, "UI_SURFACE_CONTRACT_DUPLICATE_PRIMARY_ACTION");
  expectContractFail("primary-form-fields action ID fails", { controlMapping: [...baseFieldMappings(), primaryAction("primary-form-fields.save", "Save"), primaryAction("cancel", "Cancel")] }, "UI_SURFACE_CONTRACT_PRIMARY_FIELD_REGION_ACTION_ID");
}

function runHtmlPreviewTests() {
  expectHtmlFail("New/Edit HTML renders lower Primary form fields region", lowerPrimaryRegionHtml(), "HTML_NEW_EDIT_PRIMARY_FIELD_REGION_FORBIDDEN");
  expectHtmlFail("New/Edit HTML repeats Save/Cancel in lower region", duplicateActionsHtml(), "HTML_DUPLICATE_PRIMARY_ACTION");
  expectHtmlFail("New/Edit HTML creates fake cards from field/action names", fakeCardsHtml(), "HTML_NEW_EDIT_FAKE_FIELD_ACTION_CARD");
  expectHtmlPass("New/Edit HTML renders fields once and one Save/Cancel action bar", validHtml());
  expectHtmlPass("Planned Sub List row actions pass with row context", subListHtml());
}

function runPlaceholderAndMappingTests() {
  expectHtmlFail("Start date label rendered as value fails", validHtml({ startDateValue: "Start date", startDateSemantics: "sample-value" }), "HTML_LABEL_RENDERED_AS_FIELD_VALUE");
  expectHtmlPass("Start date placeholder semantics passes", validHtml({ startDateValue: "Start date", startDateSemantics: "placeholder", startDatePlaceholder: "Select start date" }));
  expectHtmlPass("Start date sample value passes", validHtml({ startDateValue: "2026-06-01", startDateSemantics: "sample-value" }));
  expectMappingFail("Editable field value equals label without placeholder semantics fails", fieldElement({ "data-value": "Start date", "data-value-semantics": "sample-value" }), "HTML_FIELD_LABEL_AS_VALUE");
  expectMappingPass("Editable field value equals label passes when encoded as placeholder", fieldElement({ "data-value": "Start date", "data-value-semantics": "placeholder", placeholder: "Select start date" }));
  expectMappingFail("Mapped Primary form fields grid fails", primaryFormGridElement(), "HTML_MAPPING_NEW_EDIT_PRIMARY_FIELD_REGION");
}

function runBlueprintTests() {
  expectBlueprintFail("Blueprint contains generic Primary form fields lower region", {
    ...validBlueprint(),
    regions: [{ regionName: "Primary form fields", controls: ["Contract title", "Save"] }],
  }, "BLUEPRINT_NEW_EDIT_PRIMARY_FIELD_REGION_FORBIDDEN");
  expectBlueprintFail("Blueprint duplicates Save/Cancel actions without row context", {
    ...validBlueprint(),
    controls: [...validBlueprint().controls, { blueprintId: "duplicate-save", yeeflowControl: "button", actionId: "saveContractAgain", actionType: "save-record", actionContract: "Save current Contract", label: "Save" }],
  }, "BLUEPRINT_DUPLICATE_PRIMARY_ACTION");
  expectBlueprintPass("Blueprint contains field controls once and primary action controls once", validBlueprint());
  expectBlueprintPass("Blueprint includes planned Sub List row action with row context", {
    ...validBlueprint(),
    controls: [...validBlueprint().controls, { blueprintId: "documents-row-open", yeeflowControl: "button", actionId: "openDocumentRow", actionType: "open-row", actionContract: "Open document row", label: "Open", rowContext: "current sub-list row", parentBinding: "Contracts.ContractId", styleToken: "button.secondary", layoutToken: "layout.sublist-row-action", responsiveToken: "responsive.inline-wrap" }],
  }, subListHtml());
}

function expectContractPass(label, overrides) {
  const result = run([contractsValidator, "--contracts", writeContracts([contract(overrides)])]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectContractFail(label, overrides, code) {
  const result = run([contractsValidator, "--contracts", writeContracts([contract(overrides)])]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectHtmlPass(label, html) {
  const paths = writeHtmlCase(html);
  const result = run([htmlValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--screenshots", paths.screenshotsDir]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectHtmlFail(label, html, code) {
  const paths = writeHtmlCase(html);
  const result = run([htmlValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--screenshots", paths.screenshotsDir]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectMappingPass(label, element) {
  const paths = writeMappingCase(`<!doctype html><html><body>${element}${buttonElement("save", "Save")}${buttonElement("cancel", "Cancel")}</body></html>`);
  const result = run([mappingValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--registry", registryPath]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectMappingFail(label, element, code) {
  const paths = writeMappingCase(`<!doctype html><html><body>${element}${buttonElement("save", "Save")}${buttonElement("cancel", "Cancel")}</body></html>`);
  const result = run([mappingValidator, "--contracts", paths.contracts, "--html", paths.htmlDir, "--registry", registryPath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectBlueprintPass(label, blueprint, html = validHtml()) {
  const paths = writeHtmlCase(html);
  const result = run([blueprintComparator, "--contracts", paths.contracts, "--blueprints", writeJson({ blueprints: [blueprint] }), "--html", paths.htmlDir, "--registry", registryPath]);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectBlueprintFail(label, blueprint, code) {
  const paths = writeHtmlCase(validHtml());
  const result = run([blueprintComparator, "--contracts", paths.contracts, "--blueprints", writeJson({ blueprints: [blueprint] }), "--html", paths.htmlDir, "--registry", registryPath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function contract(overrides = {}) {
  return {
    applicationName: "Vendor Contract Management",
    surfaceId: "contract-new-edit",
    surfaceName: "Contract New/Edit",
    surfaceType: "Data List New/Edit form",
    appPlanResourceRef: "Custom Data List Forms Plan > Contracts New/Edit",
    sourceResourceType: "Data List",
    sourceResourceName: "Contracts",
    sourceListOrFormName: "Contracts",
    surfaceResponsibility: "Edit the current Contract record only; primary fields are the form body.",
    businessPurpose: "Create or update contract records.",
    primaryUserRole: "Operations",
    dataSource: "Contracts",
    fieldGroups: [{ groupName: "Contract fields", fields: ["Contract title", "Start date", "End date"] }],
    requiredFields: ["Contract title", "Start date", "End date"],
    editableFields: ["Contract title", "Start date", "End date"],
    fieldTypeMapping: { "Contract title": "Text", "Start date": "Date", "End date": "Date" },
    requiredActions: ["Save", "Cancel"],
    forbiddenRegions: [],
    allowedRegions: ["No related/lower-page regions planned"],
    relatedRegions: ["No related/lower-page regions planned"],
    controlMapping: [...baseFieldMappings(), primaryAction("save", "Save"), primaryAction("cancel", "Cancel")],
    responsiveRules: "mobile single-column stack",
    htmlPreviewRequirements: "full-page complete form with one action bar",
    screenshotEvidenceRequirements: { desktopScreenshotPath: "screens/contract-new-edit-desktop.png", mobileScreenshotPath: "screens/contract-new-edit-mobile.png" },
    blueprintRequirements: "field controls once and primary actions once",
    designSystemRef: "application-design-system.md",
    uiPatternTemplateRef: "new-edit-form-body",
    visualQualityRequirements: "high-fidelity form section, spacing, typography, action placement",
    proofBoundary: "contract validation only",
    includeHeaderNavigation: false,
    applicationLayoutType: "form-surface-no-app-chrome",
    ...overrides,
  };
}

function baseFieldMappings(fields = ["Contract title", "Start date", "End date"]) {
  return fields.map((field) => ({
    controlId: `${slug(field)}-field`,
    blueprintId: `${slug(field)}-field`,
    yeeflowControl: field.includes("date") ? "date-picker" : "field-input",
    controlRole: "field",
    sourceResource: "Data List",
    sourceList: "Contracts",
    fieldId: slug(field),
    fieldName: field,
    fieldType: field.includes("date") ? "Date" : "Text",
    binding: `Contracts.${slug(field)}`,
    required: true,
    readonly: false,
    styleToken: "field.standard",
    layoutToken: "layout.form.two-column",
    responsiveToken: "responsive.form.stack",
    supportedStatus: "validator-backed",
    proofBoundary: "mapping validation only",
  }));
}

function primaryAction(id, label) {
  return {
    controlId: `${slug(id)}-action`,
    blueprintId: `${slug(id)}-action`,
    yeeflowControl: "button",
    controlRole: "primary action",
    actionId: id,
    actionType: `${slug(label)}-record`,
    actionContract: `${label} current Contract record`,
    label,
    styleToken: "button.primary",
    layoutToken: "layout.action-row",
    responsiveToken: "responsive.action-stack",
    supportedStatus: "validator-backed",
    proofBoundary: "mapping validation only",
  };
}

function validHtml(options = {}) {
  const startValueAttrs = options.startDateValue
    ? ` value="${options.startDateValue}" data-value="${options.startDateValue}" data-value-semantics="${options.startDateSemantics || "sample-value"}"${options.startDatePlaceholder ? ` placeholder="${options.startDatePlaceholder}"` : ""}`
    : ` placeholder="Select start date" data-value-semantics="placeholder"`;
  return `<!doctype html><html><body data-surface-id="contract-new-edit">
    <main class="high-fidelity form-section polished-card typography section-title gap-4 padding-4 action-bar mobile-stack"
      data-design-system="vendor-contract-ds" data-ui-pattern-template="new-edit-form-body"
      data-full-page="true" data-page-end="true" data-mobile-layout="stacked"
      data-ready-for-blueprint="true" data-layout-fidelity="pass" data-modern-visual-quality="pass"
      data-surface-responsibility="pass" data-field-coverage="pass" data-action-coverage="pass"
      data-forbidden-region-status="pass" data-semantic-consistency="pass"
      data-lower-region-visual-concreteness="pass" data-rendered-example-count="1"
      data-visual-usability="pass" text-overflow="pass" overlap-status="pass" spacing-status="pass"
      data-template-reuse-risk="pass" data-responsive-token="responsive.form.stack">
      <label>Contract title</label>
      ${fieldElement({ "data-blueprint-id": "contract-title-field", "data-yeeflow-control": "field-input", "data-field-id": "contract-title", "data-field-name": "Contract title", "data-field-type": "Text", "data-binding": "Contracts.contract-title", "data-value": "Master Services Agreement", "data-value-semantics": "sample-value", value: "Master Services Agreement" })}
      <label>Start date</label>
      ${fieldElement({ "data-blueprint-id": "start-date-field", "data-field-id": "start-date", "data-field-name": "Start date", "data-field-type": "Date", "data-binding": "Contracts.start-date", rawExtra: startValueAttrs })}
      <label>End date</label>
      ${fieldElement({ "data-blueprint-id": "end-date-field", "data-field-id": "end-date", "data-field-name": "End date", "data-field-type": "Date", "data-binding": "Contracts.end-date", placeholder: "Select end date", "data-value-semantics": "placeholder" })}
      <div class="form-actions primary-action action-placement">${buttonElement("save", "Save")}${buttonElement("cancel", "Cancel")}</div>
      <footer data-page-end="true">End of form</footer>
    </main>
  </body></html>`;
}

function lowerPrimaryRegionHtml() {
  return validHtml().replace("<footer", `<section data-region="lower-region" class="polished-card"><h2>Primary form fields</h2><p>Contract title</p><p>Save</p></section><footer`);
}

function duplicateActionsHtml() {
  return validHtml().replace("<footer", `<section data-region="lower-region" class="polished-card"><h2>Related Documents</h2>${buttonElement("save-copy", "Save")}${buttonElement("cancel-copy", "Cancel")}</section><footer`);
}

function fakeCardsHtml() {
  return validHtml().replace("<footer", `<section data-region="lower-region" class="polished-card"><h2>Primary form fields</h2><div class="collection-card">Contract title</div><div class="collection-card">Save</div></section><footer`);
}

function subListHtml() {
  return validHtml().replace("<footer", `<section data-region="lower-region" class="polished-card sub-list-row" data-rendered-example-count="2"><h2>Related Documents</h2><button data-blueprint-id="documents-row-open" data-yeeflow-control="button" data-control-role="sub-list row action" data-action-id="openDocumentRow" data-action-type="open-row" data-action-contract="Open document row" data-row-context="current sub-list row" data-parent-binding="Contracts.ContractId" data-style-token="button.secondary" data-layout-token="layout.sublist-row-action" data-responsive-token="responsive.inline-wrap" data-proof-boundary="mapping validation only">Open document</button></section><footer`);
}

function fieldElement(attrs = {}) {
  const finalAttrs = {
    "data-blueprint-id": "start-date-field",
    "data-yeeflow-control": "date-picker",
    "data-control-role": "field",
    "data-source-resource": "Data List",
    "data-source-list": "Contracts",
    "data-field-id": "start-date",
    "data-field-name": "Start date",
    "data-field-type": "Date",
    "data-binding": "Contracts.start-date",
    "data-required": "true",
    "data-readonly": "false",
    "data-style-token": "field.standard",
    "data-layout-token": "layout.form.two-column",
    "data-responsive-token": "responsive.form.stack",
    "data-proof-boundary": "mapping validation only",
    ...attrs,
  };
  const rawExtra = finalAttrs.rawExtra || "";
  delete finalAttrs.rawExtra;
  return `<input ${Object.entries(finalAttrs).map(([key, value]) => `${key}="${value}"`).join(" ")}${rawExtra}>`;
}

function buttonElement(id, label) {
  return `<button data-blueprint-id="${slug(id)}-action" data-yeeflow-control="button" data-control-role="primary action" data-action-id="${id}" data-action-type="${slug(label)}-record" data-action-contract="${label} current Contract record" data-style-token="button.primary" data-layout-token="layout.action-row" data-responsive-token="responsive.action-stack" data-proof-boundary="mapping validation only">${label}</button>`;
}

function primaryFormGridElement() {
  return `<section data-blueprint-id="primary-form-fields-grid" data-yeeflow-control="grid" data-control-role="lower-region" data-section-id="Primary form fields" data-style-token="grid.form" data-layout-token="layout.lower-region" data-responsive-token="responsive.stack" data-proof-boundary="mapping validation only">Primary form fields</section>`;
}

function validBlueprint() {
  return {
    surfaceId: "contract-new-edit",
    styleIntent: "typography spacing card form surface pattern action placement badge mobile responsive stack",
    controls: [
      ...baseFieldMappings().map((mapping) => ({ ...mapping, valueSemantics: "sample-value", value: mapping.fieldName === "Contract title" ? "Master Services Agreement" : "2026-06-01" })),
      primaryAction("save", "Save"),
      primaryAction("cancel", "Cancel"),
    ],
  };
}

function writeHtmlCase(html) {
  const htmlDir = path.join(tempRoot, `html-${Math.random().toString(16).slice(2)}`);
  const screenshotsDir = path.join(tempRoot, `screens-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.writeFileSync(path.join(htmlDir, "contract-new-edit.html"), html);
  const desktop = path.join(screenshotsDir, "contract-new-edit-desktop.png");
  const mobile = path.join(screenshotsDir, "contract-new-edit-mobile.png");
  fs.writeFileSync(desktop, "redacted");
  fs.writeFileSync(mobile, "redacted");
  return {
    htmlDir,
    screenshotsDir,
    contracts: writeContracts([contract({ screenshotEvidenceRequirements: { desktopScreenshotPath: desktop, mobileScreenshotPath: mobile } })]),
  };
}

function writeMappingCase(html) {
  const htmlDir = path.join(tempRoot, `html-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(path.join(htmlDir, "contract-new-edit.html"), html);
  const ids = new Set([...html.matchAll(/data-blueprint-id="([^"]+)"/g)].map((match) => match[1]));
  const base = contract();
  base.controlMapping = base.controlMapping.filter((mapping) => ids.has(mapping.blueprintId));
  return { htmlDir, contracts: writeContracts([base]) };
}

function writeContracts(items) {
  return writeJson({ contracts: items });
}

function writeJson(value) {
  const file = path.join(tempRoot, `case-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
