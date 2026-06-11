#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const DEFAULT_PACKAGE = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.15-yapk-portalinfo-null.yapk";
const SCHEMA = path.resolve("schemas/yapk-schema.json");
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text.replace(/^\uFEFF/, "")));
}

function stringifyWithRawIntegerIds(value) {
  let text = JSON.stringify(value);
  for (const key of ["ListID", "FieldID", "ID", "RefId"]) {
    text = text.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  }
  return text;
}

function readPackage(file) {
  const wrapper = parseJson(fs.readFileSync(file, "utf8"));
  const decoded = parseJson(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
  return { wrapper, decoded };
}

function writePackage(dir, name, wrapper, decoded) {
  const resourceText = stringifyWithRawIntegerIds(decoded);
  const next = {
    ...wrapper,
    Resource: zlib.brotliCompressSync(Buffer.from(resourceText, "utf8")).toString("base64"),
    Sign: "regression-placeholder-sign",
  };
  const file = path.join(dir, `${name}.yapk`);
  fs.writeFileSync(file, `${JSON.stringify(next)}\n`);
  return file;
}

function runValidator(file, validator = "validate-yapk-package.js") {
  const args = validator === "standard"
    ? ["scripts/validate-standard-package-schema.mjs", file, "--yapk-schema", SCHEMA]
    : [validator, file];
  const result = spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 24 * 1024 * 1024 });
  return `${result.stdout}\n${result.stderr}`;
}

function expectCode(name, output, code) {
  if (!output.includes(code)) throw new Error(`${name} did not report ${code}.`);
}

const packagePath = process.argv[2] || DEFAULT_PACKAGE;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-v2-regressions-"));
const results = [];

try {
  const { wrapper, decoded } = readPackage(packagePath);

  const listExportResultFile = writePackage(tempDir, "resource-list-export-result", wrapper, { MainListType: 1024, AppID: 41, Data: "{}" });
  expectCode("YAP-style Resource", runValidator(listExportResultFile), "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO");
  results.push({ case: "YAPK Resource decodes to YAP ListExportResult", expected: "YAPK_RESOURCE_NOT_APP_PACKAGE_INFO", status: "pass" });

  const missingArrays = structuredClone(decoded);
  delete missingArrays.Childs[0].RemindRules;
  const missingArraysFile = writePackage(tempDir, "missing-child-arrays", wrapper, missingArrays);
  expectCode("missing child arrays", runValidator(missingArraysFile, "standard"), "required");
  results.push({ case: "missing required Childs arrays", expected: "required", status: "pass" });

  const defsInstead = structuredClone(decoded);
  defsInstead.Childs[0].Defs = defsInstead.Childs[0].Fields;
  delete defsInstead.Childs[0].Fields;
  const defsFile = writePackage(tempDir, "defs-instead-fields", wrapper, defsInstead);
  expectCode("Defs instead of Fields", runValidator(defsFile), "YAPK_CHILDS_USES_DEFS");
  results.push({ case: "Childs item uses Defs instead of Fields", expected: "YAPK_CHILDS_USES_DEFS", status: "pass" });

  const tenantNumber = structuredClone(wrapper);
  tenantNumber.TenantID = 0;
  const tenantFile = writePackage(tempDir, "tenant-number", tenantNumber, decoded);
  expectCode("TenantID number", runValidator(tenantFile), "YAPK_TENANT_ID_INVALID");
  results.push({ case: "top-level TenantID emitted as number", expected: "YAPK_TENANT_ID_INVALID", status: "pass" });

  const wrongApp = structuredClone(wrapper);
  wrongApp.AppID = 42;
  const appFile = writePackage(tempDir, "wrong-appid", wrongApp, decoded);
  expectCode("AppID unsupported", runValidator(appFile), "YAPK_APPID_UNSUPPORTED");
  results.push({ case: "AppID unsupported", expected: "YAPK_APPID_UNSUPPORTED", status: "pass" });

  const missingField = structuredClone(decoded);
  const table = missingField.Pages[0].LayoutInResources
    .map((resource) => ({ resource, parsed: JSON.parse(resource.Resource) }))
    .flatMap(({ resource, parsed }) => parsed.children?.[0]?.children?.map((child) => ({ resource, parsed, child })) || [])
    .find((item) => item.child?.type === "data-list");
  delete table.child.attrs.listarr[0].Field;
  table.resource.Resource = JSON.stringify(table.parsed);
  const missingFieldFile = writePackage(tempDir, "missing-data-table-field", wrapper, missingField);
  expectCode("Data table missing Field", runValidator(missingFieldFile), "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING");
  results.push({ case: "Data table column missing Field", expected: "DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING", status: "pass" });

  const duplicateLayout = structuredClone(decoded);
  duplicateLayout.Childs[0].Layouts[0].LayoutID = duplicateLayout.Pages[0].LayoutID;
  const duplicateLayoutFile = writePackage(tempDir, "duplicate-layout", wrapper, duplicateLayout);
  expectCode("duplicate LayoutID", runValidator(duplicateLayoutFile), "DUPLICATE_LAYOUT_ID");
  results.push({ case: "duplicate LayoutID", expected: "DUPLICATE_LAYOUT_ID", status: "pass" });

  const invalidId = structuredClone(decoded);
  invalidId.Childs[0].Fields[0].FieldID = "not-a-number";
  const invalidIdFile = writePackage(tempDir, "invalid-id-type", wrapper, invalidId);
  expectCode("invalid ID type", runValidator(invalidIdFile), "INVALID_ID_TYPE");
  results.push({ case: "invalid integer ID type", expected: "INVALID_ID_TYPE", status: "pass" });

  const emptyPortalObject = structuredClone(decoded);
  emptyPortalObject.PortalInfo = {};
  const emptyPortalFile = writePackage(tempDir, "empty-portal-object", wrapper, emptyPortalObject);
  expectCode("empty PortalInfo object", runValidator(emptyPortalFile), "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID");
  results.push({ case: "empty PortalInfo object for no portal", expected: "YAPK_PORTALINFO_EMPTY_OBJECT_INVALID", status: "pass" });

  const portalArray = structuredClone(decoded);
  portalArray.PortalInfo = [];
  const portalArrayFile = writePackage(tempDir, "portal-array", wrapper, portalArray);
  expectCode("PortalInfo array", runValidator(portalArrayFile), "YAPK_PORTALINFO_ARRAY_INVALID");
  results.push({ case: "PortalInfo array for no portal", expected: "YAPK_PORTALINFO_ARRAY_INVALID", status: "pass" });

  console.log(JSON.stringify({ status: "pass", package: packagePath, cases: results }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
