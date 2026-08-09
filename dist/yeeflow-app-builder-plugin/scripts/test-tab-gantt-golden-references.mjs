#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-tab-gantt-golden-references.mjs");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-tab-gantt-"));
const results = [];

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function write(name, value) { const output = path.join(temp, name); fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`); return output; }
function run(file) { return spawnSync(process.execPath, [SCRIPT, file, "--strict"], { cwd: ROOT, encoding: "utf8" }); }
function expectPass(name, fixture) {
  const result = run(write(`${name}.json`, fixture));
  results.push({ name, status: result.status === 0 ? "pass" : "fail", output: result.stdout.slice(0, 800) });
  assert.equal(result.status, 0, `${name}: ${result.stdout}\n${result.stderr}`);
}
function expectCode(name, fixture, code) {
  const result = run(write(`${name}.json`, fixture));
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", expected: code, output: output.slice(0, 800) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name}: ${output}`);
}

const current = { type: "expr", exprType: "list_field", valueType: "input", prop: "ListDataID", id: "ListDataID" };
const fields = [
  { FieldName: "Title", FieldType: "Text", Type: "input" },
  { FieldName: "Text2", FieldType: "Text", Type: "lookup", Rules: JSON.stringify({ listid: "projects", multiple: false }) },
  { FieldName: "Datetime8", FieldType: "Datetime", Type: "datepicker" },
  { FieldName: "Datetime16", FieldType: "Datetime", Type: "datepicker" },
  { FieldName: "Text17", FieldType: "Text", Type: "lookup", Rules: JSON.stringify({ listid: "activities", multiple: true }) },
  { FieldName: "Decimal18", FieldType: "Decimal", Type: "percent", Rules: JSON.stringify({ number_min: 0, number_max: 1 }) },
  { FieldName: "Text19", FieldType: "Text", Type: "lookup", Rules: JSON.stringify({ listid: "activities", multiple: false }) },
];
const fixture = {
  Childs: [
    { ListModel: { ListID: "projects" }, Defs: [] },
    { ListModel: { ListID: "activities" }, Defs: fields },
  ],
  controls: [
    { type: "aktabs", children: [
      { id: "overview", type: "ak-tabs-tab", label: "Overview", attrs: { isDefault: true, isDesignDefault: true }, children: [{ type: "container", children: [] }] },
      { id: "programme", type: "ak-tabs-tab", label: "Programme", attrs: { isDefault: false, isDesignDefault: false }, children: [{ type: "container", children: [] }] },
    ] },
    { type: "gantt", attrs: { data: {
      list: { AppID: 41, ListSetID: "app", ListID: "activities" },
      filter: [{ left: "Text2", op: "0", right: [current], showCus: false, pre: "and" }],
      gantt: { fields: {
        text: { FieldName: "Title" }, start_date: { FieldName: "Datetime8" }, end_date: { FieldName: "Datetime16" }, dependency: { FieldName: "Text17" }, progress: { FieldName: "Decimal18" }, parent: { FieldName: "Text19" }, order: true,
      }, atts: { allowadd: true, passvalues: [{ Name: "Text2", Value: [current] }], linkLayout: "activity-view", modalsize: 2, scale: "month", auto_scheduling: true, milestone: true, toolbar: true, skins: "right" } }
    } } }],
};

try {
  expectPass("complete", fixture);
  const badSourceApp = clone(fixture); delete badSourceApp.controls[1].attrs.data.list.AppID;
  expectCode("source-app", badSourceApp, "GANTT_SOURCE_APP_ID_REQUIRED");
  const badSourceListSet = clone(fixture); delete badSourceListSet.controls[1].attrs.data.list.ListSetID;
  expectCode("source-listset", badSourceListSet, "GANTT_SOURCE_LISTSET_ID_REQUIRED");
  const noDefault = clone(fixture); noDefault.controls[0].children[0].attrs.isDefault = false; noDefault.controls[0].children[0].attrs.isDesignDefault = false;
  expectCode("tab-default", noDefault, "TAB_DEFAULT_COUNT_INVALID");
  const badStart = clone(fixture); badStart.Childs[1].Defs.find((field) => field.FieldName === "Datetime8").FieldType = "Text";
  expectCode("start-date", badStart, "GANTT_START_DATE_FIELD_TYPE_INVALID");
  const badText = clone(fixture); badText.controls[1].attrs.data.gantt.fields.text.FieldName = "MissingTitle";
  expectCode("text", badText, "GANTT_TEXT_FIELD_UNRESOLVED");
  const badDependency = clone(fixture); badDependency.Childs[1].Defs.find((field) => field.FieldName === "Text17").Rules = JSON.stringify({ listid: "activities", multiple: false });
  expectCode("dependency", badDependency, "GANTT_DEPENDENCY_LOOKUP_MULTIPLE_REQUIRED");
  const badPercent = clone(fixture); badPercent.Childs[1].Defs.find((field) => field.FieldName === "Decimal18").Type = "input_number";
  expectCode("percent", badPercent, "GANTT_PROGRESS_PERCENT_TYPE_REQUIRED");
  const badParent = clone(fixture); badParent.Childs[1].Defs.find((field) => field.FieldName === "Text19").Rules = JSON.stringify({ listid: "activities", multiple: true });
  expectCode("parent", badParent, "GANTT_PARENT_LOOKUP_SINGLE_REQUIRED");
  console.log(JSON.stringify({ status: "pass", results }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
