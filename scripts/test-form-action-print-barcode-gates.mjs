#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import printBarcodeUtils from "./lib/form-action-print-barcode-utils.cjs";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";
import { validateFormActionPrintBarcodePlan } from "./validate-form-action-print-barcode-plan.mjs";
import { validateFormActionPrintBarcodePackage } from "./validate-form-action-print-barcode.mjs";
import { buildPrintDashboardResource, materializePlannedFormActionPrintBarcode } from "./materialize-full-app-generated-final.mjs";

const { buildDashboardPrintStep, buildBarcodeScanStep, validatePrintBarcodeStep } = printBarcodeUtils;
const titleTokens = [{ type: "str", value: "Inventory_" }, { type: "op", op: "&" }, { type: "func", func: "now", params: [] }];
const print = buildDashboardPrintStep({ name: "Print records", target: { ListSetID: "100", SourceID: "200" }, titleTokens, paperSize: "A4", layout: "landscape", scalePercent: 80, margins: "Minimum" });
assert.equal(print.attrs.settings.Size, "6");
assert.equal(print.attrs.settings.Scale, "0.8");
assert.equal(print.attrs.data.Type, "page");
assert.throws(() => buildDashboardPrintStep({ name: "Bad", target: { ListSetID: "1", SourceID: "2" }, titleTokens, paperSize: "Letter" }), /PAPER_SIZE_UNPROVEN/);

for (const mode of ["multiple", "select", "auto"]) {
  const scan = buildBarcodeScanStep({ name: `Scan ${mode}`, mode, barcodeType: "ean-13", resultVariable: "var_SelectedItems", errorVariable: "var_ScanErrorMsg", onReadError: "Stop" });
  assert.equal(scan.attrs.mode, mode);
  assert.equal(scan.attrs.type, "ean-13");
}
const auto = buildBarcodeScanStep({ name: "Scan auto", mode: "multiple", barcodeType: "auto", resultVariable: "results", errorVariable: "error", onReadError: "Stop" });
assert.equal(auto.attrs.type, undefined);
assert.throws(() => buildBarcodeScanStep({ name: "Bad", mode: "burst", resultVariable: "r", errorVariable: "e" }), /MODE_INVALID/);
assert.throws(() => buildBarcodeScanStep({ name: "Bad", mode: "auto", barcodeType: "code-128", resultVariable: "r", errorVariable: "e" }), /TYPE_UNPROVEN/);

const declared = new Set(["var_SelectedItems", "var_ScanErrorMsg"]);
assert.deepEqual(validatePrintBarcodeStep(buildBarcodeScanStep({ name: "Scan", mode: "multiple", resultVariable: "var_SelectedItems", errorVariable: "var_ScanErrorMsg" }), { strictGenerated: true, declaredTempVariables: declared }), []);

const planReport = validateFormActionPrintBarcodePlan(plan());
assert.equal(planReport.status, "pass");
assert.equal(planReport.rows, 2);
assert.equal(validateFormActionPrintBarcodePlan(plan().replace("| multiple | auto |", "| burst | auto |")).status, "fail");

const resource = {
  type: "container", id: "page", actions: [], formAction: {}, tempVars: [],
  children: [
    { type: "button", id: "print_trigger", nv_label: "print_trigger", attrs: {}, children: [] },
    { type: "container", id: "scan_trigger", nv_label: "scan_trigger", attrs: {}, children: [] },
    { type: "collection", id: "items", attrs: { data: { filter: [] } }, children: [] },
  ],
};
materializePlannedFormActionPrintBarcode(resource, {
  records: records(), hostResource: "Inventory", hostPage: "Inventory", hostSurface: "dashboard", rootListSetId: "100",
  dashboardMetaByName: new Map([["print inventory", { pageId: "200" }]]),
});
assert.deepEqual(resource.actions.map((action) => action.steps[0].type).sort(), ["barcode", "print"]);
assert.equal(resource.children[2].attrs.data.filter[0].op, "9");
assert(resource.tempVars.some((item) => String(item.id || item.name).includes("var_SelectedItems")));

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "print-barcode-test-"));
const packagePath = path.join(tempDir, "focused.yapk");
const decoded = packageFixture(resource);
fs.writeFileSync(packagePath, JSON.stringify({ Resource: encodeYapkResourceOfficial(decoded) }));
const packageReport = validateFormActionPrintBarcodePackage(packagePath, { strictGenerated: true });
assert.equal(packageReport.status, "pass", JSON.stringify(packageReport.findings));
assert.equal(packageReport.printSteps, 1);
assert.equal(packageReport.barcodeSteps, 1);
assert.equal(packageReport.scanFields, 1);

console.log(JSON.stringify({ status: "pass", test: "test-form-action-print-barcode-gates.mjs", cases: 16 }, null, 2));

function records() {
  return [
    { hostResource: "Inventory", hostPage: "Inventory", hostType: "Dashboard", actionName: "Print inventory", stepOrder: 1, stepName: "Print records", trigger: "Button Click", boundControl: "print_trigger", stepType: "print", targetType: "Dashboard", targetPage: "Print Inventory", titleTokensJson: JSON.stringify(titleTokens), paperSize: "A4", printLayout: "landscape", scalePercent: "80", margins: "Minimum" },
    { hostResource: "Inventory", hostPage: "Inventory", hostType: "Dashboard", actionName: "Scan inventory", stepOrder: 1, stepName: "Scan items", trigger: "Container Click", boundControl: "scan_trigger", stepType: "barcode", scanningMode: "multiple", barcodeType: "auto", resultVariable: "var_SelectedItems", errorVariable: "var_ScanErrorMsg", onReadError: "Stop", barcodeFilterField: "Text10" },
  ];
}

function plan() {
  return `| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Target Page Type | Target Page | Print Title Expression Tokens | Paper Size | Print Layout | Scale Percent | Margins | Scanning Mode | Barcode Type | Result Temp Variable | Error Temp Variable | On Read Error | Barcode Filter Field | Business Rationale | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inventory | Inventory | Dashboard | Print inventory | 1 | Print records | Button Click | print_trigger | print | Dashboard | Print Inventory | ${JSON.stringify(titleTokens)} | A4 | landscape | 80 | Minimum | N/A | N/A | N/A | N/A | N/A | N/A | Print | export-proven |
| Inventory | Inventory | Dashboard | Scan inventory | 1 | Scan items | Container Click | scan_trigger | barcode | N/A | N/A | N/A | N/A | N/A | N/A | N/A | multiple | auto | var_SelectedItems | var_ScanErrorMsg | Stop | Text10 | Scan | export-proven |`;
}

function packageFixture(sourceResource) {
  const printResource = buildPrintDashboardResource({
    name: "Print Inventory",
    layoutId: "200",
    rootListSetId: "100",
    collectionId: "print-collection",
    listMeta: {
      listName: "Inventory List",
      listId: "300",
      resourceType: "data-list",
      fields: [
        { fieldName: "Title", displayName: "Name", fieldType: "Text", controlType: "input" },
        { fieldName: "Text1", displayName: "Serial Number", fieldType: "Text", controlType: "input" },
        { fieldName: "Text2", displayName: "Status", fieldType: "Text", controlType: "input" },
      ],
    },
  });
  return {
    Pages: [
      { Title: "Inventory", Type: 103, LayoutID: "201", LayoutInResources: [{ Resource: JSON.stringify(sourceResource) }] },
      { Title: "Print Inventory", Type: 103, LayoutID: "200", LayoutInResources: [{ Resource: JSON.stringify(printResource) }] },
    ],
    Childs: [{ List: { Title: "Books List", Type: 1 }, Fields: [{ FieldName: "Text2", DisplayName: "ISBN", FieldType: "Text", Type: "input", Rules: JSON.stringify({ allowScan: true }) }] }],
  };
}
