#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const SCHEMA_VALIDATOR = path.join(ROOT, "scripts/validate-standard-package-schema.mjs");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "full-app-materializer-"));
const cases = [];

try {
  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(spec, [
    "# Functional Specification: Office Asset Loan Management",
    "",
    "| Application Name | Office Asset Loan Management |",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));
  fs.writeFileSync(plan, [
    "# Yeeflow App Plan: Office Asset Loan Management",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
  ].join("\n"));

  expectCode("missing API-issued ID source fails", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "no-ids"),
    "--json",
  ], "FULL_APP_MATERIALIZATION_API_ID_SOURCE_REQUIRED");

  const outDir = path.join(tempDir, "fixture-materialized");
  const materialized = expectPass("fixture mode materializes generated-final artifacts", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", outDir,
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const report = JSON.parse(materialized.stdout);
  assert.equal(report.status, "pass");
  assert.equal(report.signingEligible, false);
  assert.equal(fs.existsSync(report.outputs.package), true, "package exists");
  assert.equal(fs.existsSync(report.outputs.decodedResource), true, "decoded resource exists");
  assert.equal(fs.existsSync(report.outputs.idProvenance), true, "id provenance exists");
  assert.equal(fs.existsSync(report.outputs.generationReport), true, "generation report exists");
  assert.match(fs.readFileSync(report.outputs.generationReport, "utf8"), /No signing was attempted/);
  assert.match(fs.readFileSync(report.outputs.idProvenance, "utf8"), /api-generated-fixture-for-tests/);
  cases.push("materialized outputs include package, decoded resource, provenance, and generation report");

  expectPass("materialized package passes canonical schema validation", [
    SCHEMA_VALIDATOR,
    report.outputs.package,
    "--schema-only",
  ]);

  const wrapper = JSON.parse(fs.readFileSync(report.outputs.package, "utf8"));
  assert.equal(wrapper.Sign, "", "materializer must not sign package");
  assert.equal(wrapper.AppID, 41, "materializer emits Flowcraft YAPK wrapper");
  assert.equal(typeof wrapper.Resource, "string");
  cases.push("materializer keeps signing/install boundary clean");

  const apiIdManifest = path.join(tempDir, "api-issued-ids.json");
  fs.writeFileSync(apiIdManifest, JSON.stringify({
    ids: [
      "920000000000000001",
      "920000000000000002",
      "920000000000000003",
      "920000000000000004",
      "920000000000000005",
      "920000000000000006",
    ],
  }, null, 2));
  const apiOut = path.join(tempDir, "api-materialized");
  const apiRun = expectPass("API ID manifest mode is signing-eligible after materialization only", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", apiOut,
    "--api-id-manifest", apiIdManifest,
    "--tenant-id", "1234567890123456",
    "--json",
  ]);
  const apiReport = JSON.parse(apiRun.stdout);
  assert.equal(apiReport.signingEligible, true);
  assert.equal(JSON.parse(fs.readFileSync(apiReport.outputs.package, "utf8")).TenantID, "1234567890123456");
  assert.match(fs.readFileSync(apiReport.outputs.generationReport, "utf8"), /Generated-final preflight is required before any signing request/);
  cases.push("API ID manifest mode writes generated-final artifacts without signing");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function expectPass(name, args) {
  const result = run(args);
  assert.equal(result.status, 0, `${name} should pass\nstdout=${result.stdout}\nstderr=${result.stderr}`);
  cases.push(name);
  return result;
}

function expectCode(name, args, code) {
  const result = run(args);
  assert.notEqual(result.status, 0, `${name} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), `${name} should include ${code}`);
  cases.push(name);
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}
