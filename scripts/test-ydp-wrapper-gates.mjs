#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const codec = require("./lib/standalone-ydp-codec.cjs");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ydp-wrapper-gates-"));
let planPath;
let tracePath;
let applicationPlanPath;

try {
  const hashParityFixture = { ReportIds: ["r1"], filterVars: [{ id: "f1" }], _meta: { Zeta: 1, alpha: 2 }, alpha: true, Zeta: false, report_ids: [] };
  const coreLocaleHash = crypto.createHash("sha256").update(JSON.stringify(stableNormalize(hashParityFixture, (left, right) => left.localeCompare(right)))).digest("hex");
  const legacyCodeUnitHash = crypto.createHash("sha256").update(JSON.stringify(stableNormalize(hashParityFixture))).digest("hex");
  assert.equal(codec.sha256(hashParityFixture), coreLocaleHash, "Plugin stable hash must match Core localeCompare key ordering");
  assert.notEqual(coreLocaleHash, legacyCodeUnitHash, "hash parity fixture must distinguish Core locale ordering from legacy code-unit ordering");
  const plan = planPath = path.join(temp, "dashboard-plan.md");
  fs.writeFileSync(plan, "# Dashboard Artifact Plan\n\nArtifact Type: dashboard\nGeneration Contract: standalone YDP\nShared Builder: canonical full YAPK Dashboard builder\nProof Boundary: static wrapper validation only.\n");
  const trace = tracePath = writeJson("dashboard-plan.trace.json", { artifactType: "dashboard", name: "Fixture Dashboard", plan: { path: plan, sha256: fileSha(plan) }, sharedBuilder: { required: true, builderFamily: "canonical-full-yapk-dashboard-page-resource" }, validators: ["validate-ydp", "dashboard-hard-gates"], conformance: { planToActualRequired: true, requiredChecks: ["layout", "dependencies"] }, dashboard: { pageLayoutTemplateId: "dashboard-page-layouts-v1.1", sections: [{ id: "overview" }] } });
  const applicationPlan = applicationPlanPath = path.join(temp, "core-application-plan.md");
  fs.writeFileSync(applicationPlan, "# Core Application Plan\n\nDashboard: Fixture Dashboard\nPage layout: dashboard-page-layouts-v1.1\n");
  const valid = buildResult(applicationPlan);
  const fixtureMinimum = Object.fromEntries(Object.entries(valid.outer).filter(([key]) => !["Ext1", "Ext2", "Ext3", "IsDefault", "IsItemPerm"].includes(key)));
  assert.equal(codec.decode(codec.encode(fixtureMinimum)).profile, "fixture-minimum", "six-field historical fixture must remain readable");
  assert.equal(codec.decode(codec.encode(valid.outer)).profile, "export-proven-11-field", "generated-final outer must use the 11-field export profile");
  const fixtureMinimumPath = path.join(temp, "fixture-minimum.ydp"); fs.writeFileSync(fixtureMinimumPath, codec.encode(fixtureMinimum));
  const compatibility = run(path.join(ROOT, "validate-ydp.js"), [fixtureMinimumPath, "--mode", "compatibility", "--stage", "inspect"]);
  assert.equal(compatibility.status, 0, compatibility.stderr || compatibility.stdout);
  const input = writeJson("valid-build-result.json", valid);
  const output = path.join(temp, "valid.ydp");
  const success = run(path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(input, output));
  assert.equal(success.status, 0, success.stderr || success.stdout);
  assert.ok(fs.existsSync(output));
  assert.ok(fs.existsSync(`${output}.validation-report.json`));
  assert.deepEqual(codec.decode(fs.readFileSync(output)).body, valid.body);
  assert.ok(fs.readFileSync(output).equals(codec.encode(valid.outer)));

  expectFailure("bare body rejected", path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson("bare.json", valid.body), path.join(temp, "bare.ydp")), "YDP_BUILD_RESULT_SHAPE_INVALID", path.join(temp, "bare.ydp"));
  const local = structuredClone(valid); local.readiness = "local-validation-ready";
  expectFailure("local readiness rejected", path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson("local.json", local), path.join(temp, "local.ydp")), "YDP_PREWRITE_VALIDATION_FAILED", path.join(temp, "local.ydp"));

  expectFailure("swapped standalone plan cannot satisfy Core application plan hash", path.join(ROOT, "build-ydp-wrapper.js"), [...wrapperArgs(input, path.join(temp, "swapped.ydp")).filter((_, index) => index < 6), "--application-plan", plan], "YDP_APP_PLAN_SOURCE_BINDING_MISMATCH", path.join(temp, "swapped.ydp"));
  for (const field of ["identityMode", "dashboardId", "platformImportReadiness", "blockers"]) {
    const incomplete = structuredClone(valid); delete incomplete[field];
    expectFailure(`Core field ${field} required`, path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson(`missing-${field}.json`, incomplete), path.join(temp, `missing-${field}.ydp`)), "YDP_PREWRITE_VALIDATION_FAILED", path.join(temp, `missing-${field}.ydp`));
  }

  const emptyBody = buildResult(applicationPlan); emptyBody.body = {}; rebind(emptyBody);
  expectFailure("empty Dashboard body reaches layout gates", path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson("empty-body.json", emptyBody), path.join(temp, "empty-body.ydp")), "DASH_LAYOUT_", path.join(temp, "empty-body.ydp"));

  const blockedReportParent = path.join(temp, "report-parent-is-file"); fs.writeFileSync(blockedReportParent, "not a directory");
  const transactionOutput = path.join(temp, "transaction.ydp");
  const blockedReport = path.join(blockedReportParent, "report.json");
  expectFailure("report write failure rolls back YDP", path.join(ROOT, "build-ydp-wrapper.js"), [...wrapperArgs(input, transactionOutput), "--report", blockedReport], "YDP_REPORT_WRITE_FAILED", transactionOutput);
  assert.equal(fs.existsSync(blockedReport), false, "report write failure must not leave a validation report");

  for (const [label, provenance] of [["copied", "copied-export"], ["deterministic", "deterministic-local"]]) {
    const invalid = structuredClone(valid); invalid.identityProvenance[0].provenance = provenance;
    expectFailure(`${label} provenance rejected`, path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson(`${label}.json`, invalid), path.join(temp, `${label}.ydp`)), "YDP_IDENTITY_PROVENANCE_NOT_ISSUED", path.join(temp, `${label}.ydp`));
  }

  const missingAction = buildResult(applicationPlan);
  missingAction.body.children.push({ type: "button", attrs: { control_action: "missing_action" } });
  rebind(missingAction);
  expectFailure("undeclared action rejected", path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson("missing-action.json", missingAction), path.join(temp, "missing-action.ydp")), "YDP_ACTION_REFERENCE_UNDECLARED", path.join(temp, "missing-action.ydp"));

  const missingSource = buildResult(applicationPlan);
  missingSource.body.children.push({ type: "collection", attrs: { data: { list: { ListID: "8000000000000000999" } } } });
  rebind(missingSource);
  expectFailure("source identity outside closure rejected", path.join(ROOT, "build-ydp-wrapper.js"), wrapperArgs(writeJson("missing-source.json", missingSource), path.join(temp, "missing-source.ydp")), "YDP_RESOURCE_REFERENCE_NOT_IN_ISSUED_CLOSURE", path.join(temp, "missing-source.ydp"));

  const invalidUtf8 = path.join(temp, "invalid-utf8.ydp"); fs.writeFileSync(invalidUtf8, Buffer.from([0xff, 0xfe]));
  expectFailure("invalid UTF-8 rejected", path.join(ROOT, "validate-ydp.js"), [invalidUtf8, "--build-result", input, "--plan", plan, "--trace", trace, "--application-plan", applicationPlan], "YDP_UTF8_INVALID");

  for (const entry of [
    "skills/installed/yeeflow-dashboard-generator/scripts/validate-ydp.js",
    "skills/installed/yeeflow-application-generator/scripts/validate-ydp.js",
  ]) {
    const result = run(path.join(ROOT, entry), [output, "--build-result", input, "--plan", plan, "--trace", trace, "--application-plan", applicationPlan]);
    assert.equal(result.status, 0, `${entry}\n${result.stdout}\n${result.stderr}`);
  }
  for (const [index, entry] of [
    "skills/installed/yeeflow-dashboard-generator/scripts/build-ydp-wrapper.js",
    "skills/installed/yeeflow-application-generator/scripts/build-ydp-wrapper.js",
  ].entries()) {
    const skillOutput = path.join(temp, `skill-${index}.ydp`);
    const result = run(path.join(ROOT, entry), wrapperArgs(input, skillOutput));
    assert.equal(result.status, 0, `${entry}\n${result.stdout}\n${result.stderr}`);
    assert.ok(fs.readFileSync(skillOutput).equals(fs.readFileSync(output)), `${entry} must preserve canonical root-wrapper bytes`);
  }
  console.log("YDP_WRAPPER_GATES_PASSED");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function buildResult(plan) {
  const listId = "8000000000000000001";
  const layoutId = "8000000000000000002";
  const sourceListId = "8000000000000000003";
  const compressedBody = Buffer.from(fs.readFileSync(path.join(ROOT, "scripts/test-fixtures/core-standalone-dashboard-body.br.base64"), "utf8").trim(), "base64");
  const body = JSON.parse(zlib.brotliDecompressSync(compressedBody).toString("utf8").replaceAll("864170278640847938", listId).replaceAll("972395048299894871", sourceListId));
  const dependencyMap = { dependencies: [
    { logicalId: "application.test", sourcePlanId: "application.test", resourceCategory: "application", usage: "application-root-list", canonicalId: listId, status: "issued", provenance: "credentialed-id-provider" },
    { logicalId: "dashboard.test.page", sourcePlanId: "dashboard.test", resourceCategory: "page", usage: "page-layout", canonicalId: layoutId, status: "issued", provenance: "credentialed-id-provider" },
    { logicalId: "data-list.assets", sourcePlanId: "data-list.assets", resourceCategory: "data-list", usage: "collection-source-list", canonicalId: sourceListId, status: "issued", provenance: "credentialed-id-provider" },
  ] };
  const result = {
    contractVersion: "app-builder.standalone-dashboard-artifact/1.1.0",
    dashboardId: "dashboard.test",
    readiness: "wrapper-ready",
    platformImportReadiness: "unproven",
    outerContext: "standalone-export",
    outerProfile: "export-proven-11-field",
    blockers: [],
    body,
    outer: codec.buildOuter({ listId, layoutId, title: "Fixture Dashboard", body }),
    dependencyMap,
    identityMode: "externally-issued",
    identityProvenance: dependencyMap.dependencies.map((entry) => ({ logicalId: entry.logicalId, canonicalId: entry.canonicalId, status: "issued", provenance: "credentialed-id-provider" })),
    sourceBinding: { authorizationId: "authorization.fixture", functionalSpecificationSha256: "1".repeat(64), applicationPlanSha256: fileSha(plan), bridgeContractVersion: "app-builder.universal-dashboard-resource-graph-bridge/1.0.0", graphSha256: "2".repeat(64), selectedClosureSha256: "3".repeat(64), materializationContextSha256: "4".repeat(64) },
  };
  rebind(result);
  return result;
}

function rebind(result) {
  result.outer = codec.buildOuter({ listId: result.outer.ListID, layoutId: result.outer.LayoutID, title: result.outer.Title, body: result.body });
  result.sourceBinding.bodySha256 = codec.sha256(result.body);
  result.sourceBinding.dependencyMapSha256 = codec.sha256(result.dependencyMap);
  result.sourceBinding.outerContractVersion = codec.CONTRACT_VERSION;
  result.sourceBinding.outerSha256 = codec.sha256(result.outer);
}
function writeJson(name, value) { const target = path.join(temp, name); fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`); return target; }
function run(script, args) { return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }); }
function wrapperArgs(input, output) { return [input, output, "--plan", planPath, "--trace", tracePath, "--application-plan", applicationPlanPath]; }
function fileSha(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function stableNormalize(value, compare = undefined) {
  if (Array.isArray(value)) return value.map((item) => stableNormalize(item, compare));
  if (!value || typeof value !== "object") return value;
  const keys = Object.keys(value); compare ? keys.sort(compare) : keys.sort();
  return Object.fromEntries(keys.map((key) => [key, stableNormalize(value[key], compare)]));
}
function expectFailure(name, script, args, code, absent = null) {
  const result = run(script, args); const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, `${name} should fail`); assert.match(output, new RegExp(code), output);
  if (absent) assert.equal(fs.existsSync(absent), false, `${name} must not leave output`);
}
