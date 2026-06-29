#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/application-control-style-golden-references.json");
const DEFAULT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/application-control-style-soft-outline-controls.template.json");
const DEFAULT_APPLICATION_COLOR_PATTERN = {
  primary: { value: "#0065FF", lightmodel: "Luminance" },
  secondary: { value: "#00D1FF", lightmodel: "Luminance" },
  neutral: { value: "#B3B7C0", lightmodel: "Luminance" },
  typography: { fontfamily: "Default", fontweight: "regular", basevalue: 14, scale: "1.125", lineheight: 1.6 },
};

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
  const planPath = options.plan ? path.resolve(options.plan) : "";
  const planText = planPath ? readText(planPath, findings, "APPLICATION_CONTROL_STYLE_APP_PLAN_MISSING") : "";
  const plannedColorPattern = planText ? extractApplicationColorPatternFromPlan(planText) : null;
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
  if (decoded) validateDecodedPackage(decoded, template, findings, { plannedColorPattern });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    template: templatePath,
    package: options.package ? packagePath : null,
    decoded: options.decoded ? packagePath : null,
    plan: planPath || null,
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
  validateApplicationColorPatternConfig(app.Config || template.applicationColorPattern?.defaults || DEFAULT_APPLICATION_COLOR_PATTERN, findings, { source: "template" });
  if (!isObject(template.packageMaterializedConfig)) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_CONFIG_MISSING", "Soft outline controls template must include packageMaterializedConfig."));
  }
  if (!Array.isArray(template.packageMaterializedTopLevelKeys) || !template.packageMaterializedTopLevelKeys.length) {
    findings.push(error("APPLICATION_CONTROL_STYLE_TEMPLATE_KEYS_MISSING", "Soft outline controls template must list package materialized top-level keys."));
  }
}

function validateDecodedPackage(decoded, template, findings, options = {}) {
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
  const appStyleConfig = parseApplicationStyleConfig(appTheme.Config, findings);
  const expectedColorPattern = buildExpectedApplicationColorPattern(template, options.plannedColorPattern);
  if (appStyleConfig) {
    validateApplicationColorPatternConfig(appStyleConfig, findings, { source: "package" });
    compareApplicationColorPattern(appStyleConfig, expectedColorPattern, findings);
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

function parseApplicationStyleConfig(value, findings) {
  if (value === null || value === "") {
    findings.push(error("APPLICATION_COLOR_PATTERN_CONFIG_MISSING", "Application style theme Config must be a stringified JSON object with primary, secondary, neutral, and typography settings."));
    return null;
  }
  if (typeof value !== "string") {
    findings.push(error("APPLICATION_COLOR_PATTERN_CONFIG_NOT_STRING", "Application style theme Config must be a stringified JSON object.", { actualType: typeof value }));
    return null;
  }
  return parseJsonString(value, findings, "APPLICATION_COLOR_PATTERN_CONFIG_INVALID_JSON", "Application style theme Config must parse as JSON.");
}

function buildExpectedApplicationColorPattern(template, plannedColorPattern = null) {
  const expected = JSON.parse(JSON.stringify(template?.requiredThemes?.applicationStyleTheme?.Config || template?.applicationColorPattern?.defaults || DEFAULT_APPLICATION_COLOR_PATTERN));
  for (const role of ["primary", "secondary", "neutral"]) {
    if (!plannedColorPattern?.[role]) continue;
    expected[role] = {
      value: plannedColorPattern[role].value,
      lightmodel: plannedColorPattern[role].lightmodel || "Luminance",
    };
  }
  expected.typography = expected.typography || DEFAULT_APPLICATION_COLOR_PATTERN.typography;
  return expected;
}

function compareApplicationColorPattern(actual, expected, findings) {
  for (const role of ["primary", "secondary", "neutral"]) {
    const actualRole = actual?.[role];
    const expectedRole = expected?.[role];
    if (!actualRole || !expectedRole) continue;
    if (normalizeHexColor(actualRole.value) !== normalizeHexColor(expectedRole.value) || String(actualRole.lightmodel || "") !== String(expectedRole.lightmodel || "")) {
      findings.push(error("APPLICATION_COLOR_PATTERN_APP_PLAN_MISMATCH", "Application style theme Config must match the App Plan color pattern selection or default application color pattern.", {
        role,
        expected: expectedRole,
        actual: actualRole,
      }));
    }
  }
}

function validateApplicationColorPatternConfig(config, findings, { source }) {
  if (!isObject(config)) {
    findings.push(error("APPLICATION_COLOR_PATTERN_CONFIG_INVALID", "Application color pattern Config must be an object.", { source }));
    return;
  }
  for (const role of ["primary", "secondary", "neutral"]) {
    const entry = config[role];
    if (!isObject(entry)) {
      findings.push(error("APPLICATION_COLOR_PATTERN_ROLE_MISSING", "Application color pattern Config must include primary, secondary, and neutral role objects.", { role, source }));
      continue;
    }
    const color = normalizeHexColor(entry.value);
    if (!color) {
      findings.push(error("APPLICATION_COLOR_PATTERN_HEX_INVALID", "Application color pattern base color must be a #RRGGBB hex color.", { role, value: entry.value ?? null, source }));
      continue;
    }
    if (String(entry.lightmodel || "") !== "Luminance") {
      findings.push(error("APPLICATION_COLOR_PATTERN_LIGHTMODEL_INVALID", "Application color pattern lightmodel must be exactly \"Luminance\".", { role, actual: entry.lightmodel ?? null, source }));
    }
    const oklch = hexToOklch(color);
    if (!oklch) continue;
    if (role === "neutral") {
      if (oklch.l < 0.65) findings.push(error("APPLICATION_COLOR_PATTERN_BASE_TOO_DARK", "Neutral base color is too dark for readable generated applications.", { role, value: color, lightness: round(oklch.l), minimum: 0.65, source }));
      if (oklch.l > 0.88) findings.push(error("APPLICATION_COLOR_PATTERN_BASE_TOO_LIGHT", "Neutral base color is too light to preserve visible neutral state differences.", { role, value: color, lightness: round(oklch.l), maximum: 0.88, source }));
      if (oklch.c > 0.06) findings.push(error("APPLICATION_COLOR_PATTERN_NEUTRAL_CHROMA_INVALID", "Neutral base color must stay low-chroma so it remains a neutral palette.", { role, value: color, chroma: round(oklch.c), maximum: 0.06, source }));
    } else {
      if (oklch.l < 0.35) findings.push(error("APPLICATION_COLOR_PATTERN_BASE_TOO_DARK", "Primary and secondary base colors are too dark to generate distinguishable dark variants.", { role, value: color, lightness: round(oklch.l), minimum: 0.35, source }));
      if (oklch.l > 0.82) findings.push(error("APPLICATION_COLOR_PATTERN_BASE_TOO_LIGHT", "Primary and secondary base colors are too light for readable brand controls.", { role, value: color, lightness: round(oklch.l), maximum: 0.82, source }));
      if (oklch.l > 0.72) findings.push(warning("APPLICATION_COLOR_PATTERN_BASE_LIGHT_WARNING", "Primary or secondary base color is valid but light; prefer 0.42-0.68 OKLCH lightness for stronger contrast.", { role, value: color, lightness: round(oklch.l), source }));
    }
  }
  if (!isObject(config.typography)) {
    findings.push(error("APPLICATION_COLOR_PATTERN_TYPOGRAPHY_MISSING", "Application style theme Config must preserve typography settings.", { source }));
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

function readText(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "File is missing.", { path: filePath }));
    return "";
  }
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
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

function extractApplicationColorPatternFromPlan(planText) {
  const out = {};
  const section = extractNamedSection(planText, "Application Color Pattern Selection") || String(planText || "");
  for (const table of parseMarkdownTables(section)) {
    for (const row of table.rows) {
      const normalized = normalizeRowKeys(row);
      const role = normalizeColorRole(normalized["color role"] || normalized.role || normalized.token || normalized["color pattern"]);
      const value = normalizeHexColor(normalized["base color"] || normalized.value || normalized.color || normalized["normal color"]);
      const lightmodel = String(normalized["light model"] || normalized.lightmodel || "Luminance").trim();
      if (role && value) out[role] = { value, lightmodel: lightmodel || "Luminance" };
    }
  }
  const regex = /\b(primary|secondary|neutral)\b[^\n#]{0,80}(#[0-9a-f]{6})/gi;
  let match;
  while ((match = regex.exec(section))) {
    const role = normalizeColorRole(match[1]);
    if (role && !out[role]) out[role] = { value: normalizeHexColor(match[2]), lightmodel: "Luminance" };
  }
  return Object.keys(out).length ? out : null;
}

function extractNamedSection(text, heading) {
  const pattern = new RegExp(`^#{2,6}\\s+${escapeRegExp(heading)}\\s*$`, "im");
  const match = pattern.exec(String(text || ""));
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = String(text || "").slice(start);
  const next = /\n#{2,6}\s+/.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function parseMarkdownTables(section) {
  const lines = String(section || "").split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const rows = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const row = {};
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] || ""; });
      rows.push(row);
      rowIndex += 1;
    }
    tables.push({ headers, rows });
    index = rowIndex;
  }
  return tables;
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => String(cell || "").replace(/`/g, "").trim());
}

function normalizeRowKeys(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) out[String(key || "").trim().toLowerCase()] = value;
  return out;
}

function normalizeColorRole(value) {
  const text = String(value || "").replace(/`/g, "").trim().toLowerCase();
  if (text === "primary") return "primary";
  if (text === "secondary") return "secondary";
  if (text === "neutral") return "neutral";
  return "";
}

function normalizeHexColor(value) {
  const match = String(value || "").trim().match(/^#[0-9a-f]{6}$/i);
  return match ? match[0].toUpperCase() : "";
}

function hexToOklch(hex) {
  const match = normalizeHexColor(hex).match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  const r = srgbToLinear(parseInt(match[1], 16) / 255);
  const g = srgbToLinear(parseInt(match[2], 16) / 255);
  const b = srgbToLinear(parseInt(match[3], 16) / 255);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const okL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const okA = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { l: okL, c: Math.sqrt(okA * okA + okB * okB) };
}

function srgbToLinear(value) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function warning(code, message, detail = {}) {
  return { level: "warning", code, message, ...detail };
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
    else if (arg === "--plan" || arg === "--app-plan") args.plan = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-application-control-style-template.mjs --registry
  node scripts/validate-application-control-style-template.mjs --package app.generated-final.yapk [--plan yeeflow-app-plan.md]
  node scripts/validate-application-control-style-template.mjs --decoded decoded.json [--plan yeeflow-app-plan.md]
`);
}

function isMainModule() {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}
