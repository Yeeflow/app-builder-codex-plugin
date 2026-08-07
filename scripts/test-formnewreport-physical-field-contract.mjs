#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceCheckout = existsSync(resolve(root, "dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json"));
const pluginRoot = sourceCheckout ? resolve(root, "dist/yeeflow-app-builder-plugin") : root;
const registry = readJson(resolve(pluginRoot, "schemas/mcp-incremental-capability-registry.v1.json"));
const skill = readFileSync(resolve(pluginRoot, "skills/yeeflow-form-report-generator/SKILL.md"), "utf8");
const incrementalSkill = readFileSync(resolve(pluginRoot, "skills/yeeflow-mcp-incremental-application-builder/SKILL.md"), "utf8");

const expectedConstraints = {
  sourceApprovalFormReadbackRequired: true,
  settingsFieldsRequired: true,
  physicalType32FieldsRequired: true,
  physicalFieldCount: "one_per_settings_field",
  physicalFieldIdentity: "mcp_issued",
  nativeStorageNames: {
    required: true,
    indexStartsAt: 1,
    observedPrefixes: ["Text", "Decimal", "Datetime"],
    forbidMappingKeyAsFieldName: true,
  },
  viewBinding: "physical_field_id_and_native_field_name_only",
  persistedReadback: ["defKey", "type32_child", "physical_fields", "default_view"],
};

assert.deepEqual(registry.capabilities.find((entry) => entry.id === "FormNewReport")?.constraints, expectedConstraints);
assert.deepEqual(registry.resources.FormNewReport?.constraints, expectedConstraints);
for (const required of [
  "MCP Type 32 Physical Field Gate",
  "Do not submit an empty `Fields[]` array",
  "`Text0` is rejected",
  "never a valid physical `FieldName`",
  "physical field's issued `FieldID` and native `FieldName`",
  "not a claim that a dedicated local FormNewReport materializer exists",
]) assert.match(skill, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")));
for (const required of [
  "FormNewReport Physical Field Gate",
  "one MCP-issued physical Type `32` `Fields[]` entry per mapping",
  "Text0",
  "Type `0` default view",
]) assert.match(incrementalSkill, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")));

if (sourceCheckout) {
  assert.equal(skill, readFileSync(resolve(root, "skills/installed/yeeflow-form-report-generator/SKILL.md"), "utf8"));
  assert.equal(registryText(), readFileSync(resolve(root, "schemas/mcp-incremental-capability-registry.v1.json"), "utf8"));
}

console.log(JSON.stringify({
  status: "pass",
  marker: "FORM_NEW_REPORT_PHYSICAL_FIELD_CONTRACT_PASSED",
  rootMode: sourceCheckout ? "source-checkout" : "installed-cache-root",
}, null, 2));

function registryText() { return readFileSync(resolve(pluginRoot, "schemas/mcp-incremental-capability-registry.v1.json"), "utf8"); }
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
