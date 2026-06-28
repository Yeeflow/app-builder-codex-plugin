#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "scripts/validate-application-control-style-template.mjs");
const MATERIALIZER = path.join(ROOT, "scripts/materialize-full-app-generated-final.mjs");
const TEMPLATE = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/application-control-style-soft-outline-controls.template.json"), "utf8"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "application-control-style-"));
const cases = [];

try {
  expectPass("registry and template validate", [VALIDATOR, "--registry"]);
  cases.push("registry/template validation passes");

  const validPackage = writePackage("valid.yapk", buildDecoded());
  expectPass("valid package carries Soft outline default style", [VALIDATOR, "--package", validPackage]);
  cases.push("valid generated package carries default control style contract with a fresh package-local style ID");

  const missingThemes = writePackage("missing-themes.yapk", { ListSet: { ListID: "1001" } });
  expectCode("missing Themes fails", [VALIDATOR, "--package", missingThemes], "APPLICATION_CONTROL_STYLE_THEMES_MISSING");

  const reusedTemplateId = buildDecoded({ controlStyleId: TEMPLATE.requiredThemes.controlStyleTheme.ID });
  expectCode("reused template control style UUID fails", [VALIDATOR, "--package", writePackage("reused-template-id.yapk", reusedTemplateId)], "APPLICATION_CONTROL_STYLE_TEMPLATE_ID_REUSED");

  const nonUuidStyleId = buildDecoded({ controlStyleId: "style-local-1" });
  expectCode("non-UUID control style ID fails", [VALIDATOR, "--package", writePackage("non-uuid-style-id.yapk", nonUuidStyleId)], "APPLICATION_CONTROL_STYLE_THEME_ID_NOT_UUID");

  const wrongLink = buildDecoded();
  wrongLink.Themes.find((theme) => Number(theme.Type) === 0).Ext = JSON.stringify({ controlDefaultId: "wrong-style-id" });
  expectCode("wrong default style link fails", [VALIDATOR, "--package", writePackage("wrong-link.yapk", wrongLink)], "APPLICATION_CONTROL_STYLE_THEME_MISSING");

  const objectConfig = buildDecoded();
  objectConfig.Themes.find((theme) => Number(theme.Type) === 1).Config = TEMPLATE.packageMaterializedConfig;
  expectCode("object-shaped Config fails", [VALIDATOR, "--package", writePackage("object-config.yapk", objectConfig)], "APPLICATION_CONTROL_STYLE_CONFIG_NOT_STRING");

  const driftedConfig = buildDecoded();
  const driftedStyle = driftedConfig.Themes.find((theme) => Number(theme.Type) === 1);
  const parsed = JSON.parse(driftedStyle.Config);
  delete parsed.button;
  driftedStyle.Config = JSON.stringify(parsed);
  expectCode("drifted Config fails", [VALIDATOR, "--package", writePackage("drifted-config.yapk", driftedConfig)], "APPLICATION_CONTROL_STYLE_CONFIG_MISMATCH");

  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(spec, ["# Functional Specification: Control Style Smoke", "", "| Application Name | Control Style Smoke |"].join("\n"));
  fs.writeFileSync(plan, ["# Yeeflow App Plan: Control Style Smoke", "", "## Plan Status", "", "Business defaults approval status: user-default-approved-for-generation."].join("\n"));
  const materialized = expectPass("materializer emits default application control style", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "materialized"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const materializerReport = JSON.parse(materialized.stdout);
  expectPass("materializer package passes control style validator", [VALIDATOR, "--package", materializerReport.outputs.package]);
  const materializedStyleId = getControlStyleId(readDecodedPackage(materializerReport.outputs.package));
  assert.notEqual(materializedStyleId, TEMPLATE.requiredThemes.controlStyleTheme.ID, "materializer must remap the template control style UUID");
  assert.match(materializedStyleId, /^[0-9a-f-]{36}$/i, "materializer must emit a UUID-shaped control style ID");

  const materializedAgain = expectPass("materializer remaps control style ID for each fresh package", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "materialized-again"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const materializerReportAgain = JSON.parse(materializedAgain.stdout);
  const materializedStyleIdAgain = getControlStyleId(readDecodedPackage(materializerReportAgain.outputs.package));
  assert.notEqual(materializedStyleIdAgain, materializedStyleId, "each fresh package should get a distinct control style package-local ID");
  cases.push("materializer output includes default Soft outline control style");

  console.log(JSON.stringify({ status: "pass", cases }, null, 2));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function buildDecoded({ controlStyleId = crypto.randomUUID() } = {}) {
  const rootListId = "1001";
  const style = TEMPLATE.requiredThemes.controlStyleTheme;
  return {
    ListSet: { ListID: rootListId, Title: "Control Style Smoke" },
    Themes: [
      {
        ID: controlStyleId,
        Type: 1,
        Name: style.Name,
        Description: style.Description,
        Config: JSON.stringify(TEMPLATE.packageMaterializedConfig),
        Ext: null,
      },
      {
        ID: `41_${rootListId}`,
        Type: 0,
        Name: "application style",
        Description: null,
        Config: null,
        Ext: JSON.stringify({ controlDefaultId: controlStyleId }),
      },
    ],
  };
}

function writePackage(name, decoded) {
  const filePath = path.join(tempDir, name);
  const wrapper = {
    AppID: 41,
    TenantID: "1234567890123456",
    PackageID: "9000000000000001",
    ListID: decoded?.ListSet?.ListID || "1001",
    Sign: "",
    Resource: zlib.brotliCompressSync(Buffer.from(JSON.stringify(decoded), "utf8")).toString("base64"),
  };
  fs.writeFileSync(filePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  return filePath;
}

function expectPass(label, args, options = {}) {
  const result = runNode(args, options);
  assert.equal(result.status, 0, `${label}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  return result;
}

function expectCode(label, args, code) {
  const result = runNode(args);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(`${result.stdout}\n${result.stderr}`, new RegExp(code), label);
}

function readDecodedPackage(packagePath) {
  const wrapper = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  return JSON.parse(zlib.brotliDecompressSync(Buffer.from(wrapper.Resource, "base64")).toString("utf8"));
}

function getControlStyleId(decoded) {
  const appTheme = decoded.Themes.find((theme) => Number(theme.Type) === 0);
  const controlDefaultId = JSON.parse(appTheme.Ext).controlDefaultId;
  const styleTheme = decoded.Themes.find((theme) => Number(theme.Type) === 1 && theme.ID === controlDefaultId);
  assert.ok(styleTheme, "Type 0 application style must point at a Type 1 style theme");
  return styleTheme.ID;
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}
