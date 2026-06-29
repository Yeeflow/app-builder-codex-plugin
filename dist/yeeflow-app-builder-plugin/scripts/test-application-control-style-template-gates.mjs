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
const DEFAULT_APP_STYLE_CONFIG = TEMPLATE.requiredThemes.applicationStyleTheme.Config || {
  primary: { value: "#0065FF", lightmodel: "Luminance" },
  secondary: { value: "#00D1FF", lightmodel: "Luminance" },
  neutral: { value: "#B3B7C0", lightmodel: "Luminance" },
  typography: { fontfamily: "Default", fontweight: "regular", basevalue: 14, scale: "1.125", lineheight: 1.6 },
};
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

  const missingAppStyleConfig = buildDecoded();
  missingAppStyleConfig.Themes.find((theme) => Number(theme.Type) === 0).Config = "";
  expectCode("missing application color pattern Config fails", [VALIDATOR, "--package", writePackage("missing-app-style-config.yapk", missingAppStyleConfig)], "APPLICATION_COLOR_PATTERN_CONFIG_MISSING");

  const objectAppStyleConfig = buildDecoded();
  objectAppStyleConfig.Themes.find((theme) => Number(theme.Type) === 0).Config = DEFAULT_APP_STYLE_CONFIG;
  expectCode("object-shaped application color pattern Config fails", [VALIDATOR, "--package", writePackage("object-app-style-config.yapk", objectAppStyleConfig)], "APPLICATION_COLOR_PATTERN_CONFIG_NOT_STRING");

  const invalidLightmodel = buildDecoded({ appStyleConfig: patchAppStyle({ primary: { value: "#0065FF", lightmodel: "HSV" } }) });
  expectCode("invalid application color lightmodel fails", [VALIDATOR, "--package", writePackage("invalid-lightmodel.yapk", invalidLightmodel)], "APPLICATION_COLOR_PATTERN_LIGHTMODEL_INVALID");

  const tooLightPrimary = buildDecoded({ appStyleConfig: patchAppStyle({ primary: { value: "#F7F7FF", lightmodel: "Luminance" } }) });
  expectCode("too-light primary fails", [VALIDATOR, "--package", writePackage("too-light-primary.yapk", tooLightPrimary)], "APPLICATION_COLOR_PATTERN_BASE_TOO_LIGHT");

  const tooDarkPrimary = buildDecoded({ appStyleConfig: patchAppStyle({ primary: { value: "#010011", lightmodel: "Luminance" } }) });
  expectCode("too-dark primary fails", [VALIDATOR, "--package", writePackage("too-dark-primary.yapk", tooDarkPrimary)], "APPLICATION_COLOR_PATTERN_BASE_TOO_DARK");

  const chromaticNeutral = buildDecoded({ appStyleConfig: patchAppStyle({ neutral: { value: "#60A0FF", lightmodel: "Luminance" } }) });
  expectCode("chromatic neutral fails", [VALIDATOR, "--package", writePackage("chromatic-neutral.yapk", chromaticNeutral)], "APPLICATION_COLOR_PATTERN_NEUTRAL_CHROMA_INVALID");

  const customPlan = path.join(tempDir, "custom-color-plan.md");
  fs.writeFileSync(customPlan, buildPlan({
    primary: "#1618E6",
    secondary: "#D40BE2",
    neutral: "#C0C2C7",
  }));
  const customColorPackage = writePackage("custom-color.yapk", buildDecoded({ appStyleConfig: patchAppStyle({
    primary: { value: "#1618E6", lightmodel: "Luminance" },
    secondary: { value: "#D40BE2", lightmodel: "Luminance" },
    neutral: { value: "#C0C2C7", lightmodel: "Luminance" },
  }) }));
  expectPass("custom App Plan color selection passes", [VALIDATOR, "--package", customColorPackage, "--plan", customPlan]);

  const mismatchColorPackage = writePackage("custom-color-mismatch.yapk", buildDecoded({ appStyleConfig: DEFAULT_APP_STYLE_CONFIG }));
  expectCode("App Plan color mismatch fails", [VALIDATOR, "--package", mismatchColorPackage, "--plan", customPlan], "APPLICATION_COLOR_PATTERN_APP_PLAN_MISMATCH");

  const businessTravelDefaultPlan = path.join(tempDir, "business-travel-default-color-plan.md");
  fs.writeFileSync(businessTravelDefaultPlan, buildPlan(undefined, {
    title: "Business Travel Request",
    rationale: {
      primary: "Default Yeeflow brand primary.",
      secondary: "Default Yeeflow brand secondary.",
      neutral: "Default neutral UI state base.",
    },
    extraBody: "Business Travel Request approval for employee trips, expenses, and reimbursement control.",
  }));
  expectCode("business app cannot keep default colors without explicit approval", [
    VALIDATOR,
    "--package",
    writePackage("business-travel-default-colors.yapk", buildDecoded({ appStyleConfig: DEFAULT_APP_STYLE_CONFIG })),
    "--plan",
    businessTravelDefaultPlan,
  ], "APPLICATION_COLOR_PATTERN_BUSINESS_DEFAULT_USED");

  const businessTravelPlan = path.join(tempDir, "business-travel-color-plan.md");
  fs.writeFileSync(businessTravelPlan, buildPlan({
    primary: "#1E40AF",
    secondary: "#0F766E",
    neutral: "#94A3B8",
  }, {
    title: "Business Travel Request",
    rationale: {
      primary: "Enterprise travel and approval primary blue.",
      secondary: "Compliance and safe-trip supporting teal.",
      neutral: "Slate neutral for forms, borders, and read-only states.",
    },
    extraBody: "Business Travel Request approval for employee trips, expenses, and reimbursement control.",
  }));
  const businessTravelPackage = writePackage("business-travel-colors.yapk", buildDecoded({ appStyleConfig: patchAppStyle({
    primary: { value: "#1E40AF", lightmodel: "Luminance" },
    secondary: { value: "#0F766E", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  }) }));
  expectPass("business semantic App Plan color selection passes", [VALIDATOR, "--package", businessTravelPackage, "--plan", businessTravelPlan]);

  const spec = path.join(tempDir, "functional-specification.md");
  const plan = path.join(tempDir, "yeeflow-app-plan.md");
  fs.writeFileSync(spec, ["# Functional Specification: Control Style Smoke", "", "| Application Name | Control Style Smoke |"].join("\n"));
  fs.writeFileSync(plan, buildPlan());
  const materialized = expectPass("materializer emits default application control style", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", plan,
    "--out-dir", path.join(tempDir, "materialized"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const materializerReport = JSON.parse(materialized.stdout);
  expectPass("materializer package passes control style validator", [VALIDATOR, "--package", materializerReport.outputs.package, "--plan", plan]);
  const decodedMaterialized = readDecodedPackage(materializerReport.outputs.package);
  const materializedStyleId = getControlStyleId(decodedMaterialized);
  assert.deepEqual(getAppStyleConfig(decodedMaterialized).primary, DEFAULT_APP_STYLE_CONFIG.primary, "materializer must emit default primary color pattern");
  assert.notEqual(materializedStyleId, TEMPLATE.requiredThemes.controlStyleTheme.ID, "materializer must remap the template control style UUID");
  assert.match(materializedStyleId, /^[0-9a-f-]{36}$/i, "materializer must emit a UUID-shaped control style ID");

  const customMaterialized = expectPass("materializer emits App Plan selected application colors", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", customPlan,
    "--out-dir", path.join(tempDir, "materialized-custom-colors"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const customMaterializerReport = JSON.parse(customMaterialized.stdout);
  expectPass("custom color materializer package passes control style validator", [VALIDATOR, "--package", customMaterializerReport.outputs.package, "--plan", customPlan]);
  const customConfig = getAppStyleConfig(readDecodedPackage(customMaterializerReport.outputs.package));
  assert.equal(customConfig.primary.value, "#1618E6", "materializer must use App Plan primary base color");
  assert.equal(customConfig.secondary.value, "#D40BE2", "materializer must use App Plan secondary base color");
  assert.equal(customConfig.neutral.value, "#C0C2C7", "materializer must use App Plan neutral base color");

  const businessPlanWithoutColorTable = path.join(tempDir, "business-travel-no-color-table-plan.md");
  fs.writeFileSync(businessPlanWithoutColorTable, [
    "# Business Travel Request - Yeeflow App Plan",
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    "",
    "## Application Navigation Plan",
    "",
    "Business Travel Request approval for employee trips, travel policy, expenses, and reimbursement control.",
    "",
  ].join("\n"));
  const businessMaterialized = expectPass("materializer infers business semantic application colors", [
    MATERIALIZER,
    "--functional-spec", spec,
    "--app-plan", businessPlanWithoutColorTable,
    "--out-dir", path.join(tempDir, "materialized-business-colors"),
    "--allow-fixture-api-ids-for-tests",
    "--json",
  ]);
  const businessMaterializerReport = JSON.parse(businessMaterialized.stdout);
  const businessConfig = getAppStyleConfig(readDecodedPackage(businessMaterializerReport.outputs.package));
  assert.equal(businessConfig.primary.value, "#1E40AF", "materializer must infer travel approval primary color when no explicit color table is present");
  assert.equal(businessConfig.secondary.value, "#0F766E", "materializer must infer travel approval secondary color when no explicit color table is present");
  assert.equal(businessConfig.neutral.value, "#94A3B8", "materializer must infer travel approval neutral color when no explicit color table is present");

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

function buildDecoded({ controlStyleId = crypto.randomUUID(), appStyleConfig = DEFAULT_APP_STYLE_CONFIG } = {}) {
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
        Config: JSON.stringify(appStyleConfig),
        Ext: JSON.stringify({ controlDefaultId: controlStyleId }),
      },
    ],
  };
}

function patchAppStyle(patch) {
  return {
    ...DEFAULT_APP_STYLE_CONFIG,
    ...patch,
    typography: DEFAULT_APP_STYLE_CONFIG.typography,
  };
}

function buildPlan(colors = {
  primary: DEFAULT_APP_STYLE_CONFIG.primary.value,
  secondary: DEFAULT_APP_STYLE_CONFIG.secondary.value,
  neutral: DEFAULT_APP_STYLE_CONFIG.neutral.value,
}, options = {}) {
  const title = options.title || "Control Style Smoke";
  const rationale = options.rationale || {};
  return [
    `# ${title} - Yeeflow App Plan`,
    "",
    "## Plan Status",
    "",
    "Business defaults approval status: user-default-approved-for-generation.",
    options.extraBody ? `\n${options.extraBody}\n` : "",
    "",
    "#### Application Color Pattern Selection",
    "",
    "| Color Role | Base Color | Light Model | Rationale |",
    "| --- | --- | --- | --- |",
    `| Primary | ${colors.primary} | Luminance | ${rationale.primary || "Brand primary"} |`,
    `| Secondary | ${colors.secondary} | Luminance | ${rationale.secondary || "Brand secondary"} |`,
    `| Neutral | ${colors.neutral} | Luminance | ${rationale.neutral || "Neutral UI states"} |`,
    "",
  ].join("\n");
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

function getAppStyleConfig(decoded) {
  const appTheme = decoded.Themes.find((theme) => Number(theme.Type) === 0);
  return JSON.parse(appTheme.Config);
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
}
