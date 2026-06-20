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
