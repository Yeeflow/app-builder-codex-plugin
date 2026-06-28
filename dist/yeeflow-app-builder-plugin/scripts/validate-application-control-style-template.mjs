#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/application-control-style-golden-references.json");
const DEFAULT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/application-control-style-soft-outline-controls.template.json");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.template && !args.package && !args.decoded)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApplicationControlStyleTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateApplicationControlStyleTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry && options.registry !== true ? options.registry : REGISTRY_PATH);
  const templatePath = path.resolve(options.template && options.template !== true ? options.template : DEFAULT_TEMPLATE_PATH);
  const registry = readJson(registryPath, findings, "APPLICATION_CONTROL_STYLE_REGISTRY_MISSING");
  const template = readJson(templatePath, findings, "APPLICATION_CONTROL_STYLE_TEMPLATE_MISSING");
  validateRegistry(registry, templatePath, findings);
  validateTemplate(template, findings);

  let decoded = null;
  let packagePath = null;
  if (options.package) {
    packagePath = path.resolve(options.package);
    decoded = readDecodedPackage(packagePath, findings);
  } else if (options.decoded) {
    packagePath = path.resolve(options.decoded);
    decoded = readJson(packagePath, findings, "APPLICATION_CONTROL_STYLE_DECODED_MISSING");
  }
  if (decoded) validateDecodedPackage(decoded, template, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    template: templatePath,
    package: options.package ? packagePath : null,
    decoded: options.decoded ? packagePath : null,
    findings,
  };
}

function validateRegistry(registry, templatePath, findings) {
  if (!registry) return;
  const approved = asArray(registry.approvedTemplateIds).map(String);
  if (!approved.includes("application_control_style_soft_outline_controls")) {
    findings.push(error("APPLICATION_CONTROL_STYLE_REGISTRY_DEFAULT_MISSING", "Application control style registry must approve the Soft outline controls template."));
  }
  if (String(registry.defaultTemplateId || "") !== "application_control_style_soft_outline_controls") {
    findings.push(error("APPLICATION_CONTROL_STYLE_REGISTRY_DEFAULT_INVALID", "Application control style registry must set Soft outline controls as the default template.", { actual: registry.defaultTemplateId || null }));
  }
  const ref = asArray(registry.references).find((entry) => String(entry?.templateId || "") === "application_control_style_soft_outline_controls");
  if (!ref) {
    findings.push(error("APPLICATION_CONTROL_STYLE_REGISTRY_REFERENCE_MISSING", "Application control style registry must include the Soft outline controls reference."));
    return;
  }
  const resolved = path.resolve(path.dirname(templatePath), "..", "..", String(ref.sourceTemplate || ""));
  if (path.resolve(templatePath) !== resolved) {
    findings.push(error("APPLICATION_CONTROL_STYLE_REGISTRY_TEMPLATE_PATH_MISMATCH", "Application control style registry sourceTemplate must point at the Soft outline controls template.", { sourceTemplate: ref.sourceTemplate || null }));
  }
  for (const key of ["summary", "whenToUse", "whenNotToUse", "generationProof", "proofBoundary"]) {
    if (!String(ref[key] || "").trim()) {
      findings.push(error("APPLICATION_CONTROL_STYLE_REGISTRY_GUIDANCE_INCOMPLETE", "Application control style registry reference is missing required planning guidance.", { missing: key }));
    }
  }
}

function validateTemplate(template, findings) {
  if (!isObject(template)) return;
  if (String(template.templateId || "") !== "application_control_style_soft_outline_controls") {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_ID_INVALID", "Soft outline controls template ID is invalid.", { actual: template.templateId || null }));
  }
  const style = template.requiredThemes?.controlStyleTheme;
  const app = template.requiredThemes?.applicationStyleTheme;
  if (!isObject(style) || !isObject(app)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_REQUIRED_THEMES_MISSING", "Soft outline controls template must define both required theme contracts."));
    return;
  }
  if (Number(style.Type) !== 1) findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_CONTROL_THEME_TYPE_INVALID", "Control style theme contract must have Type 1.", { actual: style.Type ?? null }));
  if (Number(app.Type) !== 0) findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_APP_THEME_TYPE_INVALID", "Application style theme contract must have Type 0.", { actual: app.Type ?? null }));
  if (!String(style.ID || "").trim()) findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_CONTROL_THEME_ID_MISSING", "Control style theme contract must have a stable ID."));
  if (String(style.Name || "") !== "Soft outline controls (Codex)") {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_CONTROL_THEME_NAME_INVALID", "Control style theme contract must use the exported Soft outline controls name.", { actual: style.Name || null }));
  }
  if (String(app.Name || "") !== "application style") {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_APP_THEME_NAME_INVALID", "Application style theme contract must use the exported application style name.", { actual: app.Name || null }));
  }
  if (app.ExtShape?.controlDefaultId !== style.ID) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_DEFAULT_LINK_INVALID", "Application style ExtShape.controlDefaultId must point to the control style theme ID.", { expected: style.ID, actual: app.ExtShape?.controlDefaultId || null }));
  }
  if (!isObject(template.packageMaterializedConfig)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_CONFIG_MISSING", "Soft outline controls template must include packageMaterializedConfig."));
  }
  if (!Array.isArray(template.packageMaterializedTopLevelKeys) || !template.packageMaterializedTopLevelKeys.length) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_KEYS_MISSING", "Soft outline controls template must list package materialized top-level keys."));
  }
}

function validateDecodedPackage(decoded, template, findings) {
  if (!isObject(template)) return;
  const themes = asArray(decoded?.Themes);
  if (!Array.isArray(decoded?.Themes)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_THEMES_MISSING", "Generated package must include decoded.Themes[]."));
    return;
  }
  const styleContract = template.requiredThemes?.controlStyleTheme || {};
  const appContract = template.requiredThemes?.applicationStyleTheme || {};
  const appTheme = themes.find((theme) => Number(theme?.Type) === 0 && String(theme?.Name || "") === String(appContract.Name || "application style"));
  if (!appTheme) {
    findings.push(error("APPLICATION_CONTROL_STYLE_DEFAULT_THEME_MISSING", "Generated package must include a Type 0 application style theme."));
    return;
  }
  const rootListId = decoded?.ListSet?.ListID;
  const expectedAppThemeId = rootListId === undefined || rootListId === null ? null : `41_${rootListId}`;
  if (expectedAppThemeId && shouldStrictlyValidateAppThemeId(rootListId) && String(appTheme.ID || "") !== expectedAppThemeId) {
    findings.push(error("APPLICATION_CONTROL_STYLE_DEFAULT_ID_INVALID", "Application style theme ID must be 41_<decoded.ListSet.ListID>.", { expected: expectedAppThemeId, actual: appTheme.ID || null }));
  } else if (expectedAppThemeId && !shouldStrictlyValidateAppThemeId(rootListId) && !/^41_\d+$/.test(String(appTheme.ID || ""))) {
    findings.push(error("APPLICATION_CONTROL_STYLE_DEFAULT_ID_INVALID", "Application style theme ID must use the 41_<root list set id> numeric shape.", { actual: appTheme.ID || null }));
  }
  if (appTheme.Config !== null && appTheme.Config !== "") {
    findings.push(error("APPLICATION_CONTROL_STYLE_DEFAULT_CONFIG_INVALID", "Application style theme Config must be null in exported references or an empty string in generated-final schema-safe packages.", { actualType: typeof appTheme.Config }));
  }
  const appExt = parseJsonString(appTheme.Ext, findings, "APPLICATION_CONTROL_STYLE_DEFAULT_EXT_INVALID", "Application style theme Ext must be a JSON string.");
  const defaultId = appExt?.controlDefaultId;
  if (!defaultId) {
    findings.push(error("APPLICATION_CONTROL_STYLE_DEFAULT_LINK_MISSING", "Application style Ext.controlDefaultId must be present."));
    return;
  }
  const styleTheme = themes.find((theme) => Number(theme?.Type) === 1 && String(theme?.ID || "") === String(defaultId));
  if (!styleTheme) {
    findings.push(error("APPLICATION_CONTROL_STYLE_THEME_MISSING", "Application style Ext.controlDefaultId must point to a Type 1 control style theme in the same package.", { controlDefaultId: defaultId }));
    return;
  }
  if (!isUuid(styleTheme.ID)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_THEME_ID_NOT_UUID", "Generated Type 1 control style theme ID must be a UUID-shaped package-local style ID.", { actual: styleTheme.ID || null }));
  }
  if (String(styleTheme.ID || "") === String(styleContract.ID || "")) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_ID_REUSED", "Fresh generated packages must not reuse the golden reference control style UUID; clone the style with a fresh package-local style ID and update Ext.controlDefaultId.", { templateId: styleContract.ID || null }));
  }
  if (String(styleTheme.Name || "") !== String(styleContract.Name || "")) {
    findings.push(error("APPLICATION_CONTROL_STYLE_THEME_NAME_MISMATCH", "Generated control style theme name must match the golden reference.", { expected: styleContract.Name || null, actual: styleTheme.Name || null }));
  }
  if (styleTheme.Ext !== null && styleTheme.Ext !== "") {
    findings.push(error("APPLICATION_CONTROL_STYLE_THEME_EXT_INVALID", "Control style theme Ext must be null in exported references or an empty string in generated-final schema-safe packages.", { actualType: typeof styleTheme.Ext }));
  }
  if (typeof styleTheme.Config !== "string") {
    findings.push(error("APPLICATION_CONTROL_STYLE_CONFIG_NOT_STRING", "Control style theme Config must be a stringified JSON object.", { actualType: typeof styleTheme.Config }));
    return;
  }
  const config = parseJsonString(styleTheme.Config, findings, "APPLICATION_CONTROL_STYLE_CONFIG_INVALID_JSON", "Control style theme Config must parse as JSON.");
  if (!config) return;
  if (JSON.stringify(config) !== JSON.stringify(template.packageMaterializedConfig)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_CONFIG_MISMATCH", "Control style theme Config must match the package-materialized Soft outline controls golden reference."));
  }
  for (const key of asArray(template.packageMaterializedTopLevelKeys)) {
    if (!Object.prototype.hasOwnProperty.call(config, key)) {
      findings.push(error("APPLICATION_CONTROL_STYLE_CONFIG_KEY_MISSING", "Control style theme Config is missing a required top-level style group.", { missing: key }));
    }
  }
}

function readDecodedPackage(packagePath, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return null;
  }
  try {
    const raw = fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "");
    const wrapper = JSON.parse(raw);
    if (!wrapper?.Resource) {
      findings.push(error("APPLICATION_CONTROL_STYLE_PACKAGE_RESOURCE_MISSING", "YAPK wrapper must include Resource."));
      return null;
    }
    return JSON.parse(tolerantBrotliDecode(Buffer.from(String(wrapper.Resource), "base64")));
  } catch (err) {
    findings.push(error("APPLICATION_CONTROL_STYLE_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return null;
  }
}

function tolerantBrotliDecode(bytes) {
  const script = [
    "const zlib=require('zlib');",
    "const chunks=[];",
    "const s=zlib.createBrotliDecompress();",
    "s.on('data',c=>chunks.push(c));",
    "s.on('error',()=>process.stdout.write(Buffer.concat(chunks).toString('base64')));",
    "s.on('end',()=>process.stdout.write(Buffer.concat(chunks).toString('base64')));",
    "s.end(Buffer.from(process.argv[1],'base64'));",
  ].join("");
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0 && !result.stdout) throw new Error(result.stderr || `Brotli helper exited ${result.status}`);
  const decoded = Buffer.from(result.stdout, "base64").toString("utf8");
  if (!decoded.trim()) throw new Error("decoded Resource was empty");
  return decoded;
}

function readJson(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "JSON file is missing.", { path: filePath }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    findings.push(error(code, `JSON file could not be parsed: ${err.message}`, { path: filePath }));
    return null;
  }
}

function parseJsonString(value, findings, code, message) {
  if (typeof value !== "string") {
    findings.push(error(code, message, { actualType: typeof value }));
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    findings.push(error(code, `${message} ${err.message}`));
    return null;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function shouldStrictlyValidateAppThemeId(rootListId) {
  return typeof rootListId === "string" || Number.isSafeInteger(rootListId);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, ...detail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--registry") args.registry = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    else if (arg === "--template") args.template = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    else if (arg === "--package") args.package = argv[++i];
    else if (arg === "--decoded") args.decoded = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-application-control-style-template.mjs --registry
  node scripts/validate-application-control-style-template.mjs --package app.generated-final.yapk
  node scripts/validate-application-control-style-template.mjs --decoded decoded.json
`);
}

function isMainModule() {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}
