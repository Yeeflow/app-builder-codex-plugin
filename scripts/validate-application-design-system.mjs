#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SUPPORTED_LAYOUTS = new Set([
  "application-layout-1-vertical-nav",
  "application-layout-2-horizontal-nav",
  "application-layout-3-header-nav",
  "application-layout-4-no-nav",
]);

const UNSUPPORTED_CHROME = /\b(custom\s+saas\s+shell|invented\s+app\s+shell|arbitrary\s+app\s+shell|arbitrary\s+sidebar|unsupported\s+sidebar|floating\s+navigation|floating\s+nav|custom\s+top\s+bar|arbitrary\s+top\s+bar|bottom\s+navigation|right\s+sidebar\s+navigation)\b/i;
const FORM_APP_CHROME = /\b(app\s+header|application\s+header|app\s+navigation|application\s+navigation|navigation\s+panel|top\s+bar|side\s*bar|sidebar)\b/i;
const RAW_HEX_COLOR = /#[0-9a-f]{3,8}\b/i;
const THEME_TOKEN = /^var\(--(?:c|fs|fw|sp)--[a-z0-9-]+\)$/i;
const SUPPORTED_COLOR_NAMES = new Set(["transparent", "none", "inherit", "currentColor"]);
const SUPPORTED_TYPOGRAPHY = /^(h[1-6](?:-(?:regular|medium|semi-bold|bold))?|body|caption|title|subtitle|var\(--fs--[a-z0-9-]+\)|var\(--fw--[a-z0-9-]+\)|normal|regular|medium|semi-bold|bold|[1-9][0-9]?(?:px|rem)?)$/i;
const PROOF_REQUIRED = /\b(export-learning-required|runtime-proof-required|deferred|proof boundary|not export-proven|not runtime-proven)\b/i;
const ALLOWED_GENERATED_CHROME_PROPERTY_PATHS = new Set([
  "LayoutView.attrs.appearance.bgc",
  "LayoutView.attrs.appearance.color",
  "LayoutView.attrs[\"navigator-menu\"].bgc",
  "LayoutView.attrs[\"navigator-menu\"].color",
  "LayoutView.attrs[\"navigator-menu\"].position",
]);
const RAW_YEEFLOW_PROPERTY_PATH = /\bLayoutView\.attrs(?:\[[^\]]+\]|\.[A-Za-z0-9_-]+)+(?:\.[A-Za-z0-9_-]+)*\b/g;
const DESIGN_INTENT_PROPERTY = /^(?:applicationChrome\.)?(?:header|navigatorMenu|contentArea)\.(?:backgroundColor|textColor|iconColor|titleTypography|titleFontSize|titleFontWeight|titleStyle|hoverBackgroundColor|hoverTextColor|activeBackgroundColor|activeTextColor|selectedItemStyle|groupLabelStyle)$/i;

const CHROME_FIELDS = {
  header: [
    "backgroundColor",
    "textColor",
    "iconColor",
    "titleTypography",
    "titleFontSize",
    "titleFontWeight",
    "titleStyle",
  ],
  navigatorMenu: [
    "backgroundColor",
    "textColor",
    "iconColor",
    "hoverBackgroundColor",
    "hoverTextColor",
    "activeBackgroundColor",
    "activeTextColor",
    "selectedItemStyle",
    "groupLabelStyle",
  ],
  contentArea: ["backgroundColor"],
};

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/validate-application-design-system.mjs <application-design-system.md|json> [--json]",
    "",
    "Validates Application Design System layout/chrome contract. No API calls are made.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasTextValue(value) {
  if (Array.isArray(value)) return value.some((item) => safeString(item).trim());
  if (value && typeof value === "object") return Object.values(value).some(hasTextValue);
  return Boolean(safeString(value).trim());
}

function flattenText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(" ");
  if (typeof value === "object") return Object.values(value).map(flattenText).join(" ");
  return "";
}

function parseMaybeJson(text) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function readPlan(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const parsed = parseMaybeJson(text);
  if (parsed) return { type: "json", text, plan: parsed };
  return { type: "markdown", text, plan: null };
}

function layoutCandidates(plan) {
  const values = [];
  const direct = safeString(plan.applicationLayoutType).trim();
  if (direct) values.push(direct);
  if (typeof plan.selectedApplicationLayout === "string" && plan.selectedApplicationLayout.trim()) values.push(plan.selectedApplicationLayout.trim());
  if (plan.selectedApplicationLayout && typeof plan.selectedApplicationLayout === "object") {
    const nested = safeString(plan.selectedApplicationLayout.applicationLayoutType || plan.selectedApplicationLayout.id || plan.selectedApplicationLayout.value).trim();
    if (nested) values.push(nested);
  }
  for (const value of asArray(plan.applicationLayoutTypes)) {
    if (safeString(value).trim()) values.push(safeString(value).trim());
  }
  for (const value of asArray(plan.selectedApplicationLayouts)) {
    if (typeof value === "string" && value.trim()) values.push(value.trim());
    else if (value && typeof value === "object") {
      const nested = safeString(value.applicationLayoutType || value.id || value.value).trim();
      if (nested) values.push(nested);
    }
  }
  return [...new Set(values)];
}

function applicationChrome(plan) {
  return plan.applicationChrome || plan.appChrome || plan.chrome || {};
}

function isTokenizedOrKnown(value) {
  const stringValue = safeString(value).trim();
  if (!stringValue) return false;
  return THEME_TOKEN.test(stringValue) || SUPPORTED_COLOR_NAMES.has(stringValue);
}

function explicitJustification(value, context = {}) {
  return PROOF_REQUIRED.test(flattenText({
    value,
    justification: context.justification,
    tokenExceptionReason: context.tokenExceptionReason,
    proofStatus: context.proofStatus,
    fallback: context.fallback,
    runtimeProofBoundary: context.runtimeProofBoundary,
  }));
}

function propertyPathFromEntry(entry) {
  if (typeof entry === "string") return entry.trim();
  if (!entry || typeof entry !== "object") return "";
  return safeString(entry.path || entry.propertyPath || entry.targetPath || entry.generatedPropertyPath || entry.yeeflowPropertyPath || entry.field).trim();
}

function propertyList(...values) {
  return values.flatMap((value) => asArray(value).map(propertyPathFromEntry).filter(Boolean));
}

function proofBucketText(chrome) {
  return flattenText({
    exportLearningRequired: chrome.exportLearningRequired,
    runtimeProofRequired: chrome.runtimeProofRequired,
    deferredProperties: chrome.deferredProperties,
  });
}

function validateGeneratedChromeProperty(propertyPath, findings, context = {}) {
  if (!propertyPath) return;
  if (ALLOWED_GENERATED_CHROME_PROPERTY_PATHS.has(propertyPath)) return;
  if (DESIGN_INTENT_PROPERTY.test(propertyPath)) {
    findings.push({
      level: "error",
      code: "APPLICATION_DESIGN_SYSTEM_DESIGN_INTENT_AS_GENERATED_PROPERTY",
      propertyPath,
      message: "Application chrome design intent fields are not generated Yeeflow property proof; only export-proven shell paths may appear in supportedGeneratedProperties.",
    });
    return;
  }
  findings.push({
    level: "error",
    code: "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_GENERATED_CHROME_PROPERTY",
    propertyPath,
    message: "Application Design System may only list plugin-known/export-proven shell paths as generated chrome properties.",
  });
}

function validateRawChromePropertyText(value, findings, context = {}) {
  const text = flattenText(value);
  for (const match of text.matchAll(RAW_YEEFLOW_PROPERTY_PATH)) {
    const propertyPath = match[0];
    if (ALLOWED_GENERATED_CHROME_PROPERTY_PATHS.has(propertyPath)) continue;
    if (context.allowProofBucket) continue;
    findings.push({
      level: "error",
      code: "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_RAW_CHROME_PROPERTY_PATH",
      propertyPath,
      message: "Unsupported Yeeflow app shell property paths must not be treated as generated ADS properties; keep unproven hover/active/title/icon/menu styling in exportLearningRequired, runtimeProofRequired, or deferredProperties.",
    });
  }
}

function validateColorToken(value, context, findings) {
  const color = safeString(value).trim();
  if (!color) return;
  if (RAW_HEX_COLOR.test(color) && !explicitJustification(value, context)) {
    findings.push({
      level: "error",
      code: "APPLICATION_DESIGN_SYSTEM_RAW_HEX_CHROME_VALUE",
      field: context.field,
      value: color,
      message: "Application chrome colors should use Yeeflow theme tokens or plugin-known style values; raw hex requires explicit justification/proof boundary.",
    });
    return;
  }
  if (!isTokenizedOrKnown(color) && !explicitJustification(value, context)) {
    findings.push({
      level: "error",
      code: "APPLICATION_DESIGN_SYSTEM_UNTOKENIZED_CHROME_VALUE",
      field: context.field,
      value: color,
      message: "Application chrome colors should use supported Yeeflow theme tokens such as var(--c--primary), var(--c--primary-light), var(--c--background), or var(--c--text).",
    });
  }
}

function validateApplicationChrome(plan, findings) {
  const chrome = applicationChrome(plan);
  if (!hasTextValue(chrome)) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_APPLICATION_CHROME_MISSING", message: "Application Design System must include structured applicationChrome settings." });
    return;
  }

  for (const [section, fields] of Object.entries(CHROME_FIELDS)) {
    if (!chrome[section] || typeof chrome[section] !== "object") {
      findings.push({
        level: "error",
        code: `APPLICATION_DESIGN_SYSTEM_${section.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_CHROME_MISSING`,
        section,
        message: `applicationChrome.${section} settings are required.`,
      });
      continue;
    }
    for (const field of fields) {
      if (!hasTextValue(chrome[section][field])) {
        findings.push({
          level: "error",
          code: `APPLICATION_DESIGN_SYSTEM_${section.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_${field.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_MISSING`,
          field: `applicationChrome.${section}.${field}`,
          message: `applicationChrome.${section}.${field} is required.`,
        });
      }
    }
  }

  for (const field of ["backgroundColor", "textColor", "iconColor"]) {
    validateColorToken(chrome.header?.[field], { ...chrome.header, field: `applicationChrome.header.${field}` }, findings);
  }
  for (const field of ["backgroundColor", "textColor", "iconColor", "hoverBackgroundColor", "hoverTextColor", "activeBackgroundColor", "activeTextColor"]) {
    validateColorToken(chrome.navigatorMenu?.[field], { ...chrome.navigatorMenu, field: `applicationChrome.navigatorMenu.${field}` }, findings);
  }
  validateColorToken(chrome.contentArea?.backgroundColor, { ...chrome.contentArea, field: "applicationChrome.contentArea.backgroundColor" }, findings);

  for (const field of ["titleTypography", "titleFontSize", "titleFontWeight", "titleStyle"]) {
    const value = safeString(chrome.header?.[field]).trim();
    if (value && !SUPPORTED_TYPOGRAPHY.test(value) && !explicitJustification(value, chrome.header)) {
      findings.push({
        level: "error",
        code: "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_HEADER_TYPOGRAPHY",
        field: `applicationChrome.header.${field}`,
        value,
        message: "Header typography should use supported plugin-known typography/token values or be marked proof-required.",
      });
    }
  }

  const propertyPaths = [
    ...asArray(chrome.propertyMappings),
    ...asArray(chrome.header?.propertyMappings),
    ...asArray(chrome.navigatorMenu?.propertyMappings),
    ...asArray(chrome.contentArea?.propertyMappings),
  ].map(propertyPathFromEntry).filter(Boolean);

  const supportedGeneratedProperties = propertyList(
    chrome.supportedGeneratedProperties,
    chrome.generatedProperties,
    chrome.resourceGenerationProperties,
  );

  const requiredBuckets = [
    "designIntent",
    "supportedGeneratedProperties",
    "exportLearningRequired",
    "runtimeProofRequired",
    "deferredProperties",
  ];
  for (const field of requiredBuckets) {
    if (!Object.prototype.hasOwnProperty.call(chrome, field)) {
      findings.push({
        level: "error",
        code: `APPLICATION_DESIGN_SYSTEM_${field.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_MISSING`,
        field: `applicationChrome.${field}`,
        message: `applicationChrome.${field} is required so design intent, generated properties, learning boundaries, runtime proof, and deferred properties stay separate.`,
      });
    }
  }
  if (!hasTextValue(chrome.designIntent)) {
    findings.push({
      level: "error",
      code: "APPLICATION_DESIGN_SYSTEM_DESIGN_INTENT_MISSING",
      field: "applicationChrome.designIntent",
      message: "applicationChrome.designIntent must describe desired header, navigator, and content-area styling separately from generated property proof.",
    });
  }

  for (const requiredPath of [
    "LayoutView.attrs.appearance.bgc",
    "LayoutView.attrs.appearance.color",
    "LayoutView.attrs[\"navigator-menu\"].bgc",
    "LayoutView.attrs[\"navigator-menu\"].color",
  ]) {
    if (!propertyPaths.includes(requiredPath) && !supportedGeneratedProperties.includes(requiredPath)) {
      findings.push({
        level: "error",
        code: "APPLICATION_DESIGN_SYSTEM_CHROME_PROPERTY_MAPPING_MISSING",
        propertyPath: requiredPath,
        message: "Application Design System must document mapping intent to known Yeeflow shell properties.",
      });
    }
  }

  for (const propertyPath of propertyPaths) {
    if (!ALLOWED_GENERATED_CHROME_PROPERTY_PATHS.has(propertyPath) && !explicitJustification(propertyPath, { ...chrome, proofStatus: proofBucketText(chrome) })) {
      findings.push({
        level: "error",
        code: /hover|active|selected/i.test(propertyPath)
          ? "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_HOVER_ACTIVE_PROPERTY_PATH"
          : "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_CHROME_PROPERTY_MAPPING",
        propertyPath,
        message: "Application chrome property mappings may only contain plugin-known/export-proven shell paths; unproven styling belongs in exportLearningRequired, runtimeProofRequired, or deferredProperties.",
      });
    }
  }

  for (const propertyPath of supportedGeneratedProperties) {
    validateGeneratedChromeProperty(propertyPath, findings);
  }
  validateRawChromePropertyText(chrome.supportedGeneratedProperties, findings);
  validateRawChromePropertyText(chrome.generatedProperties, findings);
  validateRawChromePropertyText(chrome.resourceGenerationProperties, findings);
  validateRawChromePropertyText(chrome.propertyMappings, findings);
  validateRawChromePropertyText(chrome.header?.propertyMappings, findings);
  validateRawChromePropertyText(chrome.navigatorMenu?.propertyMappings, findings);
  validateRawChromePropertyText(chrome.contentArea?.propertyMappings, findings);
  validateRawChromePropertyText(chrome.exportLearningRequired, findings, { allowProofBucket: true });
  validateRawChromePropertyText(chrome.runtimeProofRequired, findings, { allowProofBucket: true });
  validateRawChromePropertyText(chrome.deferredProperties, findings, { allowProofBucket: true });

  const layout = layoutCandidates(plan)[0] || "";
  if (layout === "application-layout-1-vertical-nav" && plan.applicationChromeStyleId === "layout-1-dark-header-dark-vertical-nav" && !explicitJustification(chrome, chrome)) {
    const expected = {
      "applicationChrome.header.backgroundColor": "var(--c--primary-light)",
      "applicationChrome.header.textColor": "var(--c--primary)",
      "applicationChrome.header.iconColor": "var(--c--primary)",
      "applicationChrome.navigatorMenu.backgroundColor": "var(--c--primary)",
      "applicationChrome.navigatorMenu.textColor": "var(--c--primary-light)",
      "applicationChrome.navigatorMenu.iconColor": "var(--c--primary-light)",
    };
    for (const [field, value] of Object.entries(expected)) {
      const actual = field.split(".").slice(1).reduce((acc, key) => acc?.[key], chrome);
      if (safeString(actual).trim() !== value) {
        findings.push({
          level: "error",
          code: "APPLICATION_DESIGN_SYSTEM_LAYOUT_CHROME_INCONSISTENT",
          field,
          expected: value,
          actual,
          message: "Selected Layout 1 canonical generated app chrome should use the documented header/nav inverse token pairing unless explicitly justified.",
        });
      }
    }
  }
}

function validateJson(plan) {
  const findings = [];
  const requiredFields = [
    "selectedApplicationLayout",
    "applicationLayoutType",
    "applicationChromeStyleId",
    "headerMode",
    "navigationMode",
    "navigationPanelMode",
    "contentSafeArea",
    "dashboardChromeRules",
    "formSurfaceChromeRules",
  ];
  for (const field of requiredFields) {
    if (!hasTextValue(plan[field])) {
      findings.push({
        level: "error",
        code: `APPLICATION_DESIGN_SYSTEM_${field.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}_MISSING`,
        field,
        message: `Application Design System must include structured ${field}.`,
      });
    }
  }

  const layouts = layoutCandidates(plan);
  if (!layouts.length) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_LAYOUT_MISSING", message: "Application Design System must select exactly one applicationLayoutType." });
  } else if (layouts.length > 1) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_MULTIPLE_LAYOUTS", layouts, message: "Application Design System must select exactly one applicationLayoutType." });
  } else if (!SUPPORTED_LAYOUTS.has(layouts[0])) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_LAYOUT", value: layouts[0], message: "applicationLayoutType must be one of the four plugin-supported Yeeflow layouts." });
  }

  const allText = flattenText(plan);
  if (UNSUPPORTED_CHROME.test(allText)) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_UNSUPPORTED_CHROME", message: "Application Design System must not invent arbitrary sidebars, custom nav bars, floating navigation, custom top bars, or unsupported app shells." });
  }

  if (!/\b(header|nav|navigation|no nav|safe area|content)\b/i.test(flattenText(plan.dashboardChromeRules))) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_DASHBOARD_CHROME_RULES_INCOMPLETE", message: "dashboardChromeRules must state header/navigation/content-safe-area expectations for Dashboard/application pages." });
  }

  const formRulesText = flattenText(plan.formSurfaceChromeRules);
  if (!/\b(form surface|full form|no app chrome|without app chrome|unless explicitly supported|do not include)\b/i.test(formRulesText)) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_FORM_SURFACE_RULES_INCOMPLETE", message: "formSurfaceChromeRules must treat Approval/Data list/Document library forms as form surfaces and avoid app chrome unless explicitly supported." });
  }
  if (FORM_APP_CHROME.test(formRulesText) && !/\b(explicitly supported|plugin standard|unsupported\/deferred|runtime-proof-required|deferred)\b/i.test(formRulesText)) {
    findings.push({ level: "error", code: "APPLICATION_DESIGN_SYSTEM_FORM_SURFACE_APP_CHROME_UNSUPPORTED", message: "Form surfaces must not invent app header/navigation unless explicitly supported or marked deferred/runtime-proof-required." });
  }
  validateApplicationChrome(plan, findings);
  return findings;
}

function validateMarkdown(text) {
  const findings = [];
  const required = [
    [/selectedApplicationLayout/i, "APPLICATION_DESIGN_SYSTEM_SELECTED_APPLICATION_LAYOUT_FIELD_MISSING"],
    [/applicationLayoutType/i, "APPLICATION_DESIGN_SYSTEM_APPLICATION_LAYOUT_TYPE_FIELD_MISSING"],
    [/applicationChromeStyleId/i, "APPLICATION_DESIGN_SYSTEM_APPLICATION_CHROME_STYLE_ID_FIELD_MISSING"],
    [/headerMode/i, "APPLICATION_DESIGN_SYSTEM_HEADER_MODE_FIELD_MISSING"],
    [/navigationMode/i, "APPLICATION_DESIGN_SYSTEM_NAVIGATION_MODE_FIELD_MISSING"],
    [/navigationPanelMode/i, "APPLICATION_DESIGN_SYSTEM_NAVIGATION_PANEL_MODE_FIELD_MISSING"],
    [/contentSafeArea/i, "APPLICATION_DESIGN_SYSTEM_CONTENT_SAFE_AREA_FIELD_MISSING"],
    [/dashboardChromeRules/i, "APPLICATION_DESIGN_SYSTEM_DASHBOARD_CHROME_RULES_FIELD_MISSING"],
    [/formSurfaceChromeRules/i, "APPLICATION_DESIGN_SYSTEM_FORM_SURFACE_CHROME_RULES_FIELD_MISSING"],
    [/applicationChrome/i, "APPLICATION_DESIGN_SYSTEM_APPLICATION_CHROME_FIELD_MISSING"],
    [/designIntent/i, "APPLICATION_DESIGN_SYSTEM_DESIGN_INTENT_FIELD_MISSING"],
    [/supportedGeneratedProperties/i, "APPLICATION_DESIGN_SYSTEM_SUPPORTED_GENERATED_PROPERTIES_FIELD_MISSING"],
    [/exportLearningRequired/i, "APPLICATION_DESIGN_SYSTEM_EXPORT_LEARNING_REQUIRED_FIELD_MISSING"],
    [/runtimeProofRequired/i, "APPLICATION_DESIGN_SYSTEM_RUNTIME_PROOF_REQUIRED_FIELD_MISSING"],
    [/deferredProperties/i, "APPLICATION_DESIGN_SYSTEM_DEFERRED_PROPERTIES_FIELD_MISSING"],
    [/header\.backgroundColor/i, "APPLICATION_DESIGN_SYSTEM_HEADER_BACKGROUND_FIELD_MISSING"],
    [/navigatorMenu\.backgroundColor/i, "APPLICATION_DESIGN_SYSTEM_NAVIGATOR_BACKGROUND_FIELD_MISSING"],
    [/contentArea\.backgroundColor/i, "APPLICATION_DESIGN_SYSTEM_CONTENT_BACKGROUND_FIELD_MISSING"],
    [/LayoutView\.attrs\.appearance\.bgc/i, "APPLICATION_DESIGN_SYSTEM_APPEARANCE_BGC_MAPPING_MISSING"],
    [/LayoutView\.attrs\["navigator-menu"\]\.bgc/i, "APPLICATION_DESIGN_SYSTEM_NAVIGATOR_BGC_MAPPING_MISSING"],
    [/hover[\s\S]*active[\s\S]*export-learning-required/i, "APPLICATION_DESIGN_SYSTEM_HOVER_ACTIVE_PROOF_RULE_MISSING"],
    [/design intent[\s\S]*not generated property proof/i, "APPLICATION_DESIGN_SYSTEM_DESIGN_INTENT_PROOF_BOUNDARY_MISSING"],
    [/application-layout-1-vertical-nav[\s\S]*application-layout-2-horizontal-nav[\s\S]*application-layout-3-header-nav[\s\S]*application-layout-4-no-nav/i, "APPLICATION_DESIGN_SYSTEM_SUPPORTED_LAYOUTS_MISSING"],
    [/exactly one/i, "APPLICATION_DESIGN_SYSTEM_EXACTLY_ONE_LAYOUT_RULE_MISSING"],
    [/arbitrary sidebars[\s\S]*custom nav bars[\s\S]*floating nav/i, "APPLICATION_DESIGN_SYSTEM_FORBIDDEN_CHROME_RULE_MISSING"],
    [/Page Function Plan Dashboard entries[\s\S]*inherit/i, "APPLICATION_DESIGN_SYSTEM_PAGE_FUNCTION_LAYOUT_INHERITANCE_RULE_MISSING"],
  ];
  for (const [pattern, code] of required) {
    if (!pattern.test(text)) findings.push({ level: "error", code, message: `Missing required Application Design System template text for ${code}.` });
  }
  return findings;
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) usage(0);
  const json = process.argv.includes("--json");
  const file = process.argv.slice(2).find((arg) => arg !== "--json");
  if (!file) usage();
  if (!fs.existsSync(file)) {
    console.log(JSON.stringify({ status: "fail", file: path.resolve(file), errors: 1, findings: [{ level: "error", code: "APPLICATION_DESIGN_SYSTEM_FILE_MISSING", message: "Application Design System file does not exist." }] }, null, 2));
    process.exit(1);
  }
  const input = readPlan(file);
  const findings = input.type === "json" ? validateJson(input.plan) : validateMarkdown(input.text);
  const errors = findings.filter((finding) => finding.level === "error").length;
  const report = { status: errors ? "fail" : "pass", file: path.resolve(file), inputType: input.type, errors, warnings: 0, findings };
  if (json) console.log(JSON.stringify(report, null, 2));
  else if (report.status === "pass") console.log(`application design system validation passed: ${file}`);
  else {
    console.error(`application design system validation failed: ${file}`);
    for (const finding of findings) console.error(`${finding.code}: ${finding.message}`);
  }
  if (errors) process.exitCode = 1;
}

main();
