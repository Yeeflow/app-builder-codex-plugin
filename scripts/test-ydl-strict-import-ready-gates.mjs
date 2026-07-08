#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ROOT = fs.existsSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin"))
  ? path.join(ROOT, "dist/yeeflow-app-builder-plugin")
  : ROOT;
const SOURCE_INSTALLED_SKILLS_ROOT = path.join(ROOT, "skills/installed");
const checks = [];

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ydl-strict-import-ready-"));
const badFixture = path.join(tmpDir, "bad-standalone.ydl.json");
fs.writeFileSync(badFixture, JSON.stringify(makeFixture({
  rulesAsObject: true,
  auditSampleFields: true,
  customFormLayoutView: JSON.stringify({ stale: true }),
  defaultViewUrl: "all-events",
}), null, 2), "utf8");

const badReport = runValidator(badFixture);
expectCode(badReport, "YDL_IMPORT_FIELD_RULES_NOT_STRINGIFIED");
expectCode(badReport, "YDL_IMPORT_SAMPLE_AUDIT_FIELD_PRESENT");
expectCode(badReport, "YDL_IMPORT_CUSTOM_FORM_LAYOUTVIEW_NOT_NULL");
expectCode(badReport, "YDL_IMPORT_DEFAULT_VIEW_URL_NOT_DEFAULT");

for (const validatorPath of packagedValidatorEntrypoints()) {
  const report = runValidator(badFixture, validatorPath);
  assert.ok(report.errors.some((error) => error.code === "YDL_IMPORT_SAMPLE_AUDIT_FIELD_PRESENT"), `${validatorPath} should enforce strict import-ready audit-field checks`);
  checks.push({ case: `packaged validator strict import-ready: ${path.relative(ROOT, validatorPath)}`, status: "pass" });
}

for (const wrapperPath of packagedBuildWrapperEntrypoints()) {
  const outputPath = path.join(tmpDir, `${path.relative(ROOT, wrapperPath).replace(/[^a-z0-9]+/gi, "-")}.ydl`);
  const result = spawnSync(process.execPath, [
    wrapperPath,
    badFixture,
    outputPath,
    "--title",
    "Bad Event Planning",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(result.status, 0, `${wrapperPath} should reject strict import-unsafe data before writing: ${result.stdout || result.stderr}`);
  const report = JSON.parse(result.stdout || "{}");
  const nestedErrors = report.errors.flatMap((error) => Array.isArray(error.detail?.errors) ? error.detail.errors : []);
  assert.ok(nestedErrors.some((error) => error.code === "YDL_IMPORT_FIELD_RULES_NOT_STRINGIFIED"), `${wrapperPath} should surface strict validator errors`);
  assert.equal(fs.existsSync(outputPath), false, `${wrapperPath} should not write output when strict import-ready validation fails`);
  checks.push({ case: `build wrapper blocks import-unsafe fixture: ${path.relative(ROOT, wrapperPath)}`, status: "pass" });
}

const goodFixture = path.join(tmpDir, "good-standalone.ydl.json");
fs.writeFileSync(goodFixture, JSON.stringify(makeFixture({
  rulesAsObject: false,
  auditSampleFields: false,
  customFormLayoutView: null,
  defaultViewUrl: "default",
}), null, 2), "utf8");

const goodReport = runValidator(goodFixture);
const strictErrors = new Set([
  "YDL_IMPORT_FIELD_RULES_NOT_STRINGIFIED",
  "YDL_IMPORT_SAMPLE_AUDIT_FIELD_PRESENT",
  "YDL_IMPORT_CUSTOM_FORM_LAYOUTVIEW_NOT_NULL",
  "YDL_IMPORT_CUSTOM_FORM_RESOURCE_MISSING",
  "YDL_IMPORT_DEFAULT_VIEW_URL_NOT_DEFAULT",
]);
assert.deepEqual(goodReport.errors.filter((error) => strictErrors.has(error.code)), [], "import-ready fixture should not emit strict import-ready errors");
checks.push({ case: "import-ready fixture has no strict import errors", status: "pass" });

console.log(JSON.stringify({
  status: "pass",
  test: "test-ydl-strict-import-ready-gates",
  checks,
}, null, 2));

function runValidator(inputPath, validatorPath = path.join(ROOT, "validate-ydl-list.js")) {
  const result = spawnSync(process.execPath, [
    validatorPath,
    inputPath,
    "--mode",
    "generator",
    "--stage",
    "final",
    "--strict-import-ready",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.ok(result.stdout.trim(), `validator should write JSON report for ${inputPath}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function packagedValidatorEntrypoints() {
  return includeSourceInstalledEntrypoints([
    path.join(DIST_ROOT, "scripts/validate-ydl-list.js"),
    path.join(DIST_ROOT, "skills/yeeflow-application-generator/scripts/validate-ydl-list.js"),
    path.join(DIST_ROOT, "skills/yeeflow-data-list-generator/scripts/validate-ydl-list.js"),
  ], "validate-ydl-list.js");
}

function packagedBuildWrapperEntrypoints() {
  return includeSourceInstalledEntrypoints([
    path.join(DIST_ROOT, "scripts/build-ydl-wrapper.js"),
    path.join(DIST_ROOT, "skills/yeeflow-application-generator/scripts/build-ydl-wrapper.js"),
    path.join(DIST_ROOT, "skills/yeeflow-data-list-generator/scripts/build-ydl-wrapper.js"),
  ], "build-ydl-wrapper.js");
}

function includeSourceInstalledEntrypoints(distEntrypoints, scriptName) {
  const entrypoints = [...distEntrypoints];
  if (fs.existsSync(SOURCE_INSTALLED_SKILLS_ROOT)) {
    for (const skillName of ["yeeflow-application-generator", "yeeflow-data-list-generator"]) {
      const entrypoint = path.join(SOURCE_INSTALLED_SKILLS_ROOT, `${skillName}/scripts/${scriptName}`);
      if (fs.existsSync(entrypoint)) {
        entrypoints.push(entrypoint);
      }
    }
  }
  return entrypoints;
}

function expectCode(report, code) {
  assert.ok(report.errors.some((error) => error.code === code), `expected ${code}: ${JSON.stringify(report.errors, null, 2)}`);
  checks.push({ case: code, status: "pass" });
}

function makeFixture({ rulesAsObject, auditSampleFields, customFormLayoutView, defaultViewUrl }) {
  const customFormLayoutId = "2074431339150327819";
  const viewLayoutId = "2074431339150327818";
  const listId = "2074431339146133506";
  const listSetId = "2074431339146133507";
  const recordId = "2074431339154522120";
  const sampleRecord = {
    ListDataID: recordId,
    Title: "Event Alpha",
    Datetime1: "2026-07-07 09:00:00",
  };
  if (auditSampleFields) {
    sampleRecord.Created = "2026-07-07 09:00:00";
    sampleRecord.Modified = "2026-07-07 10:00:00";
    sampleRecord.CreatedBy = "10001";
    sampleRecord.ModifiedBy = "10001";
  }

  return {
    Item: {
      ListModel: {
        TenantID: "1697103066096734208",
        AppID: 41,
        ListID: listId,
        ListSetID: listSetId,
        Title: "Event Planning",
        Status: 1,
        Type: 1,
        ListType: 1,
        LayoutView: JSON.stringify({
          add: customFormLayoutId,
          edit: customFormLayoutId,
          view: customFormLayoutId,
          opentype: { add: "slide", edit: "slide", view: "slide" },
          modalsize: { add: 2, edit: 2, view: 2 },
        }),
      },
      Defs: [
        {
          FieldID: "2074431339146133510",
          FieldName: "Title",
          InternalName: "Title",
          DisplayName: "Name",
          FieldType: "Text",
          Type: "input",
          Rules: rulesAsObject ? { maxLength: 255 } : JSON.stringify({ maxLength: 255 }),
        },
        {
          FieldID: "2074431339146133511",
          FieldName: "Datetime1",
          InternalName: "Datetime1",
          DisplayName: "Date",
          FieldType: "Datetime",
          Type: "datepicker",
          Rules: JSON.stringify({ showTime: true }),
        },
      ],
      Layouts: [
        {
          LayoutID: viewLayoutId,
          Title: "All Events",
          Type: 0,
          IsDefault: true,
          Ext1: JSON.stringify({ Url: defaultViewUrl }),
          LayoutView: JSON.stringify({
            layout: [{ FieldName: "Title" }, { FieldName: "Datetime1" }],
            query: [{ FieldName: "Title", IsFilter: true }],
            filter: [],
            sort: [],
          }),
        },
        {
          LayoutID: customFormLayoutId,
          Title: "Event Planning Edit Item",
          Type: 1,
          IsDefault: false,
          IsItemPerm: false,
          Ext2: JSON.stringify({ src: true }),
          LayoutView: customFormLayoutView,
          LayoutInResources: [{
            ID: customFormLayoutId,
            RefId: customFormLayoutId,
            Resource: JSON.stringify({
              _ak_c: {
                id: "content",
                type: "container",
                attrs: {},
                children: [],
                nv_label: "content",
              },
            }),
          }],
        },
      ],
      ListDatas: {
        [recordId]: sampleRecord,
      },
    },
  };
}
