#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { decodeYapkResource } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "approval-sublist-column-title-"));

try {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  const outDir = path.join(tempDir, "generated-final");
  fs.writeFileSync(spec, [
    "# Functional Specification: Business Travel Request Approval",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));
  fs.writeFileSync(plan, [
    "# Yeeflow App Plan: Business Travel Request Approval",
    "",
    "## Plan Status",
    "",
    "- Application name: Business Travel Request Approval",
    "- Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## 5. Approval Forms Plan",
    "",
    "### 5.1 Business Travel Request Approval",
    "",
    "##### Submission Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Sub List Row Fields | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Request title | RequestTitle | Text | input | None | Generated-final validation |",
    "| 2 | Itinerary lines | Travel Itinerary | Sub list | list | ItineraryDate:Itinerary Date:date:datepicker; FromLocation:From Location:text:input; ToLocation:To Location:text:input; TransportMode:Transport Mode:text:input; Nights:Nights:number:input_number; AccommodationNeeded:Accommodation Needed:boolean:switch; ItineraryNotes:Notes:text:input | Generated-final validation |",
    "",
    "##### Task Form Fields",
    "",
    "| Field Order | Business Label | Field Name | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Read Only | Proof Label |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "| 1 | Request title | RequestTitle | Text | input | Yes | Generated-final validation |",
    "",
    "#### Approval Form Fields Layout Template Selection",
    "",
    "| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Business Travel Request Approval | Submission form | Request fields | approval_form_fields_grid_2col_v1_1 | Submission fields | 2 | 2 | 1 | Itinerary lines | None | Generated-final validation |",
    "| Business Travel Request Approval | Task form | Review fields | approval_form_fields_grid_2col_v1_1 | Submission mirror | 2 | 2 | 1 | Itinerary lines | None | Generated-final validation |",
  ].join("\n"));

  const run = spawnSync(process.execPath, [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ], { cwd: ROOT, encoding: "utf8" });
  assert.equal(run.status, 0, `materializer should pass\nstdout=${run.stdout}\nstderr=${run.stderr}`);
  const report = JSON.parse(run.stdout);
  const wrapper = JSON.parse(fs.readFileSync(report.outputs.package, "utf8"));
  const resource = decodeYapkResource(wrapper);
  const form = resource.Forms.find((entry) => entry.Name === "Business Travel Request Approval");
  assert.ok(form, "planned Approval Form should be materialized");
  const def = decodeDefResource(form.DefResource);
  const canonicalIds = def.variables.basic.map((variable) => String(variable.id || "").toLowerCase().replace(/[^a-z0-9]/g, ""));
  assert.equal(new Set(canonicalIds).size, canonicalIds.length, "generated Approval variables must be unique after Yeeflow canonical normalization");
  assert.equal(def.variables.basic.filter((variable) => String(variable.id || "").toLowerCase().replace(/[^a-z0-9]/g, "") === "requesttitle").length, 1);
  const itineraryVariable = def.variables.basic.find((variable) => variable.id === "Travel Itinerary");
  assert.equal(itineraryVariable?.type, "list");
  const listref = def.variables.listref.find((entry) => entry.id === itineraryVariable.value);
  assert.equal(listref?.fields?.length, 7, "ListRef should contain all seven Itinerary fields");
  const controls = collectControls(def, (control) => control.type === "list" && control.binding === "Travel Itinerary");
  assert.equal(controls.length, 2, "Submission and Task pages should both contain the Itinerary Sub List");
  for (const control of controls) {
    assert.equal(control.attrs["list-fields"].length, 7);
    assert.deepEqual(
      control.attrs["list-fields"].map((field) => field.control.label),
      ["Itinerary Date", "From Location", "To Location", "Transport Mode", "Nights", "Accommodation Needed", "Notes"],
    );
    assert.equal(control.attrs["list-fields"].every((field) => field.control.label_var === null), true);
  }

  console.log(JSON.stringify({
    status: "pass",
    test: "test-approval-sublist-column-title-gates",
    assertions: {
      forms: 1,
      pagesWithSubList: controls.length,
      columnsPerPage: 7,
      completeColumnTitles: 14,
    },
  }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function decodeDefResource(value) {
  const raw = Buffer.from(value, "base64");
  const prefix = Buffer.from("::brotli::", "utf8");
  const payload = raw.subarray(0, prefix.length).equals(prefix) ? raw.subarray(prefix.length) : raw;
  return JSON.parse(zlib.brotliDecompressSync(payload).toString("utf8"));
}

function collectControls(root, predicate) {
  const controls = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (value.type && predicate(value)) controls.push(value);
    Object.values(value).forEach(visit);
  };
  visit(root);
  return controls;
}
