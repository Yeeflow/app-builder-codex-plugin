#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/validate-page-scope-template-dependencies.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "page-scope-deps-"));
const results = [];

try {
  expectPass("resource with unique template-scoped variables passes", ["--resource", writeJson("unique-resource.json", pageResource())]);
  expectPass("package with unique template-scoped variables passes", ["--package", writeYapk("unique-package.yapk", pageResource())]);
  expectCode("two filter producers sharing one variable fail", ["--resource", writeJson("duplicate-filter-producers.json", pageResource({ duplicateFilterProducers: true }))], "PAGE_SCOPE_FILTER_VAR_MULTIPLE_PRODUCERS");
  expectCode("duplicate filterVars declaration fails", ["--resource", writeJson("duplicate-filter-vars.json", pageResource({ duplicateFilterVars: true }))], "PAGE_SCOPE_FILTER_VAR_DUPLICATE");
  expectCode("duplicate tempVars declaration fails", ["--resource", writeJson("duplicate-temp-vars.json", pageResource({ duplicateTempVars: true }))], "PAGE_SCOPE_TEMP_VAR_DUPLICATE");
  expectCode("duplicate formAction declaration fails", ["--resource", writeJson("duplicate-form-actions.json", pageResource({ duplicateFormActions: true }))], "PAGE_SCOPE_FORM_ACTION_DUPLICATE");
  printSummary(0);
} catch (err) {
  results.push({ name: "unexpected test harness error", status: "fail", error: err.message });
  printSummary(1);
}

function pageResource(options = {}) {
  const leftFilterName = "filter_left_panel_keywords";
  const componentFilterName = options.duplicateFilterProducers ? leftFilterName : "filter_comments_keywords";
  return {
    type: "page",
    filterVars: [
      { id: leftFilterName, name: leftFilterName },
      { id: componentFilterName, name: componentFilterName },
      ...(options.duplicateFilterVars ? [{ id: leftFilterName, name: leftFilterName }] : []),
    ],
    tempVars: [
      { id: "vCurrentItemID", name: "vCurrentItemID" },
      { id: "var_comments_SelectedItems", name: "var_comments_SelectedItems" },
      ...(options.duplicateTempVars ? [{ id: "var_comments_SelectedItems", name: "var_comments_SelectedItems" }] : []),
    ],
    actions: [{ id: "left_panel_select_item", name: "left_panel_select_item" }],
    formAction: options.duplicateFormActions
      ? [
          { name: "open_item", steps: [] },
          { name: "open_item", steps: [] },
        ]
      : {
          open_left_item: { steps: [] },
          open_comment_item: { steps: [] },
        },
    children: [
      {
        type: "container",
        nv_label: "left_panel",
        children: [searchFilter("left_panel_search", leftFilterName)],
      },
      {
        type: "container",
        nv_label: "content_panel",
        children: [searchFilter("comments_search", componentFilterName)],
      },
    ],
  };
}

function searchFilter(id, filterVar) {
  return {
    type: "search-filter",
    id,
    binding: `__filter_${filterVar}`,
    attrs: { binding: `__filter_${filterVar}`, placeholder: "Search" },
  };
}

function expectPass(name, args) {
  const result = run(args);
  results.push({ name, status: result.status === 0 ? "pass" : "fail", stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.equal(result.status, 0, `${name}\n${result.stdout}\n${result.stderr}`);
}

function expectCode(name, args, code) {
  const result = run(args);
  const output = `${result.stdout}\n${result.stderr}`;
  results.push({ name, status: result.status !== 0 && output.includes(code) ? "pass" : "fail", expectedCode: code, stdout: result.stdout.slice(0, 1000), stderr: result.stderr.slice(0, 1000) });
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(output, new RegExp(code), `${name} should include ${code}\n${output}`);
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args, "--json"], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function writeJson(name, value) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function writeYapk(name, resource) {
  const file = path.join(tempDir, name);
  const decoded = {
    Title: "Page Scope Dependency Fixture",
    Pages: [{
      Type: 103,
      Title: "Fixture Dashboard",
      LayoutID: "10001",
      LayoutInResources: [{ Resource: JSON.stringify(resource) }],
    }],
    Childs: [],
    Forms: [],
  };
  const wrapper = {
    PackageId: "10000",
    TenantID: "100",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded))).toString("base64"),
  };
  fs.writeFileSync(file, JSON.stringify(wrapper, null, 2));
  return file;
}

function printSummary(exitCode) {
  if (exitCode) {
    console.error(JSON.stringify({ ok: false, results }, null, 2));
    process.exit(exitCode);
  }
  console.log("page-scope template dependency gate tests passed");
}
