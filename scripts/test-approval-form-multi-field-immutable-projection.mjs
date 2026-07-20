#!/usr/bin/env node

import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";
import { decodeYapkResource } from "./lib/yapk-decode-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = mkdtempSync(resolve(tmpdir(), "yeeflow-approval-multi-field-"));

try {
  const source = await materialize(root, "source");
  assertShape(source);
  console.log("APPROVAL_FORM_MULTI_FIELD_SOURCE_PASSED");

  execFileSync(process.execPath, [resolve(root, "scripts/build-core-distribution.mjs")], { cwd: root, stdio: "pipe" });
  const officialDist = await materialize(resolve(root, "dist/yeeflow-app-builder-plugin"), "official-dist");
  assert.deepEqual(officialDist, source);
  console.log("APPROVAL_FORM_MULTI_FIELD_OFFICIAL_DIST_PARITY_PASSED");

  const archivePath = resolve(temp, "plugin.zip");
  const archiveRoot = resolve(temp, "archive");
  mkdirSync(archiveRoot, { recursive: true });
  execFileSync(process.execPath, [resolve(root, "scripts/build-plugin-archive.mjs"), "--output", archivePath], { cwd: root, stdio: "pipe" });
  execFileSync("unzip", ["-q", archivePath, "-d", archiveRoot]);
  const archive = await materialize(resolve(archiveRoot, "yeeflow-app-builder-plugin"), "archive");
  assert.deepEqual(archive, source);
  console.log("APPROVAL_FORM_MULTI_FIELD_ARCHIVE_PARITY_PASSED");

  const installedRoot = resolve(temp, "installed/yeeflow-app-builder-plugin");
  cpSync(resolve(root, "dist/yeeflow-app-builder-plugin"), installedRoot, { recursive: true });
  const installed = await materialize(installedRoot, "simulated-installed");
  assert.deepEqual(installed, source);
  console.log("APPROVAL_FORM_MULTI_FIELD_SIMULATED_INSTALLED_PARITY_PASSED");

  const materializerSource = readFileSync(resolve(root, "scripts/materialize-full-app-generated-final.mjs"), "utf8");
  assert.match(materializerSource, /const list = \[\.\.\.\(byForm\[normKey\(currentApprovalForm\)\]\?\.\[currentRole\] \|\| \[\]\)\];/u);
  assert.doesNotMatch(materializerSource, /Object\.isFrozen\([^)]*\)\s*\?\s*[^:]+\s*:/u);
  console.log("APPROVAL_FORM_MULTI_FIELD_MUTABLE_COPY_BOUNDARY_PASSED");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

async function materialize(surface, label) {
  const work = resolve(temp, label);
  const outDir = resolve(work, "generated-final");
  mkdirSync(work, { recursive: true });
  const functionalSpec = resolve(work, "functional-specification.md");
  const appPlan = resolve(work, "yeeflow-app-plan.md");
  writeFileSync(functionalSpec, "# Functional Specification: Leave Request\n\nBusiness defaults approval status: user-default-approved-for-generation.\n");
  writeFileSync(appPlan, planMarkdown());
  const module = await import(`${pathToFileURL(resolve(surface, "scripts/materialize-full-app-generated-final.mjs")).href}?${label}`);
  const report = module.materializeFullAppGeneratedFinal({
    cwd: surface,
    functionalSpec,
    appPlan,
    outDir,
    allowFixtureApiIdsForTests: true,
  });
  assert.equal(report.status, "pass", `APPROVAL_FORM_MULTI_FIELD_MATERIALIZATION_FAILED(${label}): ${JSON.stringify(report.findings)}`);
  const resource = decodeYapkResource(JSON.parse(readFileSync(report.outputs.package, "utf8")));
  const form = resource.Forms.find((entry) => entry.Name === "Leave Request Approval");
  assert.ok(form, `APPROVAL_FORM_MULTI_FIELD_FORM_MISSING(${label})`);
  const def = decodeDefResource(form.DefResource);
  const fieldNames = def.variables.basic
    .map((field) => field.id)
    .filter((id) => ["EmployeeName", "LeaveReason", "ReviewerNote"].includes(id));
  return {
    fieldNames,
    submissionBindings: collectBindings(def.flowPage?.form?.submission || def.submissionForm || def),
    taskBindings: collectBindings(def.flowPage?.form?.task || def.taskForm || def),
  };
}

function assertShape(result) {
  assert.deepEqual(result.fieldNames, ["EmployeeName", "LeaveReason", "ReviewerNote"]);
  assert.equal(result.fieldNames.filter((name) => name === "EmployeeName").length, 1);
  assert.ok(result.submissionBindings.includes("EmployeeName"));
  assert.ok(result.submissionBindings.includes("LeaveReason"));
  assert.ok(result.submissionBindings.indexOf("EmployeeName") < result.submissionBindings.indexOf("LeaveReason"));
  assert.ok(result.taskBindings.includes("ReviewerNote"));
}

function planMarkdown() {
  return [
    "# Yeeflow App Plan: Leave Request",
    "",
    "## Plan Status",
    "",
    "- Application name: Leave Request",
    "- Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 4. Data Lists and Document Libraries Plan",
    "",
    "### 4.1 Leave Requests",
    "",
    "| Field Label | Field Name | Field Type | Control Type |",
    "| --- | --- | --- | --- |",
    "| Title | Title | Text | input |",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Leave Request Approval",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type |",
    "| --- | --- | --- | --- | --- |",
    "| 1 | Employee Name | EmployeeName | Text | input |",
    "| 2 | Leave Reason | LeaveReason | Multiple line | textarea |",
    "| 3 | Employee Name Duplicate | EmployeeName | Text | input |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only |",
    "| --- | --- | --- | --- | --- | --- |",
    "| 1 | Reviewer Note | ReviewerNote | Multiple line | textarea | No |",
    "",
  ].join("\n");
}

function decodeDefResource(value) {
  const raw = Buffer.from(value, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  const payload = raw.subarray(0, prefix.length).equals(prefix) ? raw.subarray(prefix.length) : raw;
  return JSON.parse(zlib.brotliDecompressSync(payload).toString("utf8"));
}

function collectBindings(value, results = []) {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    for (const item of value) collectBindings(item, results);
    return results;
  }
  if (typeof value.binding === "string") results.push(value.binding);
  for (const item of Object.values(value)) collectBindings(item, results);
  return results;
}
