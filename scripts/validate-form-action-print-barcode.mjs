#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import zlib from "node:zlib";
import { readDecodedYapk, parseJsonMaybe, quoteLargeJsonIntegers, walk } from "./lib/yapk-decode-utils.mjs";
import printBarcodeUtils from "./lib/form-action-print-barcode-utils.cjs";

const { validatePrintBarcodeStep } = printBarcodeUtils;

export function validateFormActionPrintBarcodePackage(packagePath, { strictGenerated = false } = {}) {
  const { decoded } = readDecodedYapk(packagePath);
  const findings = [];
  const pageById = new Map();
  for (const page of decoded.Pages || []) pageById.set(String(page.LayoutID), { page, resource: pageResource(page) });
  let printSteps = 0, barcodeSteps = 0, scanFields = 0;
  for (const entry of collectActionResources(decoded)) {
    const { resource } = entry;
    const declaredTempVariables = new Set((resource.tempVars || []).flatMap((item) => [item?.id, item?.name].filter(Boolean)));
    for (const action of resource.actions || []) {
      for (const step of action.steps || []) {
        if (!new Set(["print", "barcode"]).has(step?.type)) continue;
        if (step.type === "print") printSteps += 1; else barcodeSteps += 1;
        for (const finding of validatePrintBarcodeStep(step, { hostSurface: entry.surface, strictGenerated, declaredTempVariables })) {
          findings.push({ severity: "error", ...finding, host: entry.host, page: entry.page, action: action.name });
        }
        if (step.type === "print") validatePrintTarget(step, entry, pageById, strictGenerated, findings);
        if (step.type === "barcode") validateBarcodeConsumer(resource, step, entry, findings);
      }
    }
  }
  for (const child of decoded.Childs || []) {
    for (const field of child.Fields || []) {
      const rules = parseJsonMaybe(field.Rules) || {};
      if (rules.allowScan !== true) continue;
      scanFields += 1;
      if (field.FieldType !== "Text" || field.Type !== "input") findings.push({ severity: "error", code: "DATA_LIST_BARCODE_SCAN_FIELD_TYPE_INVALID", message: "allowScan=true is supported only on Text/input fields.", list: child.List?.Title, field: field.DisplayName });
    }
  }
  return { status: findings.some((item) => item.severity === "error") ? "fail" : "pass", printSteps, barcodeSteps, scanFields, findings };
}

function validatePrintTarget(step, sourceEntry, pageById, strictGenerated, findings) {
  const target = pageById.get(String(step.attrs?.data?.SourceID || ""));
  if (!target) return findings.push({ severity: "error", code: "FORM_ACTION_PRINT_DASHBOARD_TARGET_UNRESOLVED", message: "Print target SourceID does not resolve to a Dashboard page.", host: sourceEntry.host, page: sourceEntry.page });
  const controls = [];
  walk(target.resource, (value) => { const control = value?._ak_c || value; if (control?.type) controls.push(control); });
  const collection = controls.find((control) => control.type === "collection");
  const tables = controls.filter((control) => control.type === "table-v2");
  const qr = controls.find((control) => control.type === "list-qrcode");
  if (!collection) findings.push({ severity: "error", code: "PRINT_DASHBOARD_COLLECTION_MISSING", message: "Multi-record print Dashboard requires a Collection.", page: target.page.Title });
  if (!tables.length) findings.push({ severity: "error", code: "PRINT_DASHBOARD_TABLE_LAYOUT_MISSING", message: "Print Dashboard requires Table controls for print-safe layout.", page: target.page.Title });
  if (!tables.some((control) => Object.keys(control.attrs?.["table-merges"] || {}).length)) findings.push({ severity: "error", code: "PRINT_DASHBOARD_TABLE_MERGE_REFERENCE_MISSING", message: "The golden print template requires a merged-row/column Table example.", page: target.page.Title });
  if (!qr || qr.attrs?.["qr-code-link"]?.type !== "2") findings.push({ severity: "error", code: "PRINT_DASHBOARD_COLLECTION_ITEM_QR_INVALID", message: "Collection item QR must target the current Collection item (qr-code-link.type=2).", page: target.page.Title });
  if (strictGenerated && target.resource?.templateMarker !== "dashboard-print-multi-record-table-v1") findings.push({ severity: "error", code: "PRINT_DASHBOARD_GOLDEN_TEMPLATE_MARKER_MISSING", message: "Generated print Dashboard must materialize dashboard-print-multi-record-table-v1.", page: target.page.Title });
}

function validateBarcodeConsumer(resource, step, entry, findings) {
  const id = `__temp_${String(step.attrs?.response?.value || "").replace(/^__temp_/, "")}`;
  let consumed = false;
  walk(resource, (value, path) => {
    if (path.includes(".actions")) return;
    if (JSON.stringify(value).includes(id)) consumed = true;
  });
  if (!consumed) findings.push({ severity: "error", code: "FORM_ACTION_BARCODE_RESULT_NOT_CONSUMED", message: "Scanned values must feed a page control, normally a Collection filter.", host: entry.host, page: entry.page });
}

function pageResource(page) { return parseJsonMaybe(page?.LayoutInResources?.[0]?.Resource) || {}; }

function collectActionResources(decoded) {
  const out = [];
  for (const page of decoded.Pages || []) out.push({ surface: "dashboard", host: page.Title || "", page: page.Title || "", resource: pageResource(page) });
  for (const child of decoded.Childs || []) {
    for (const layout of child.Layouts || []) {
      if (Number(layout.Type) !== 1) continue;
      const resource = parseJsonMaybe(layout?.LayoutInResources?.[0]?.Resource);
      if (resource) out.push({ surface: Number(child.List?.Type) === 16 ? "document_library_form" : "data_list_form", host: child.List?.Title || "", page: layout.Title || "", resource });
    }
    for (const publicForm of child.PublicForms || []) {
      const resource = parseJsonMaybe(publicForm.Resource);
      if (resource) out.push({ surface: "public_form", host: child.List?.Title || "", page: publicForm.Name || publicForm.Title || "", resource });
    }
  }
  for (const form of decoded.Forms || []) {
    const def = decodeDefResource(form.DefResource);
    for (const page of def.pageurls || []) {
      const resource = page.formdef;
      if (!resource) continue;
      const name = page.name || page.title || "";
      out.push({ surface: /task/i.test(name) ? "approval_task" : /print/i.test(name) ? "approval_print" : "approval_submission", host: form.Name || form.Title || "", page: name, resource });
    }
  }
  return out;
}

function decodeDefResource(value) {
  const raw = Buffer.from(String(value || ""), "base64");
  const prefix = Buffer.from("::brotli::");
  return JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(raw.subarray(prefix.length)).toString()));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const packageIndex = process.argv.indexOf("--package");
  if (packageIndex < 0 || !process.argv[packageIndex + 1]) throw new Error("Usage: node scripts/validate-form-action-print-barcode.mjs --package <app.yapk> [--strict-generated]");
  const report = validateFormActionPrintBarcodePackage(process.argv[packageIndex + 1], { strictGenerated: process.argv.includes("--strict-generated") });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}
