#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-solid fa-laptop", c: "#0065FF" });
const APPLICATION_CONTROL_STYLE_TEMPLATE_PATH = path.join(ROOT, "docs/reference/application-control-style-soft-outline-controls.template.json");
const APPLICATION_LAYOUT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/application-layout-sidebar-workspace-1.template.json");
const DASHBOARD_V11_TEMPLATE_PATH = path.join(ROOT, "docs/reference/dashboard-page-layout-templates.json");
const DATA_LIST_FORM_TEMPLATE_PATHS = {
  newEdit: path.join(ROOT, "docs/reference/data-list-form-layout-new-edit.template.json"),
  view: path.join(ROOT, "docs/reference/data-list-form-layout-view-item.template.json"),
  workbench: path.join(ROOT, "docs/reference/data-list-form-layout-workbench.template.json"),
};
const APPROVAL_FORM_TEMPLATE_PATHS = {
  submission: path.join(ROOT, "docs/reference/approval-form-layout-submission.template.json"),
  task: path.join(ROOT, "docs/reference/approval-form-layout-task.template.json"),
};
const APPROVAL_FORM_TEMPLATE_IDS = {
  submission: "approval_form_layout_submission_v1_1",
  task: "approval_form_layout_task_v1_1",
};
const DATA_LIST_FORM_FIELDS_GRID_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-fields-grid.template.json");
const DATA_LIST_FORM_SUBLIST_TEMPLATE_PATH = path.join(ROOT, "docs/reference/data-list-form-control-sublist.template.json");
const DATA_ANALYTICS_REGISTRY_PATH = path.join(ROOT, "docs/reference/data-analytics-golden-references.json");
const DATA_ANALYTICS_TEMPLATE_PATHS = {
  data_analytics_pie_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-pie-chart-with-title.template.json"),
  data_analytics_column_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-column-chart-with-title.template.json"),
  data_analytics_bar_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-bar-chart-with-title.template.json"),
  data_analytics_line_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-line-chart-with-title.template.json"),
  data_analytics_area_chart_with_title: path.join(ROOT, "docs/reference/data-analytics-area-chart-with-title.template.json"),
  data_analytics_pivot_table_standard: path.join(ROOT, "docs/reference/data-analytics-pivot-table-standard.template.json"),
};
const APPROVED_DATA_ANALYTICS_TEMPLATE_IDS = Object.freeze(Object.keys(DATA_ANALYTICS_TEMPLATE_PATHS));
const DATA_TABLE_TEMPLATE_PATHS = {
  data_table_control_standard_scroll: path.join(ROOT, "docs/reference/data-table-control-standard-scroll.template.json"),
  data_table_control_standard_no_scroll: path.join(ROOT, "docs/reference/data-table-control-standard-no-scroll.template.json"),
  data_table_control_caption_scroll: path.join(ROOT, "docs/reference/data-table-control-caption-scroll.template.json"),
};
const APPROVED_DATA_TABLE_TEMPLATE_IDS = Object.freeze(Object.keys(DATA_TABLE_TEMPLATE_PATHS));
const COLLECTION_TEMPLATE_PATHS = {
  collection_control_grid_table: path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  "Event Pipeline Grid-Table": path.join(ROOT, "docs/reference/collection-control-grid-table.template.json"),
  collection_control_grid_table_with_multiselect: path.join(ROOT, "docs/reference/collection-control-grid-table-with-multiselect.template.json"),
  collection_control_card_with_multiselect_toolbar: path.join(ROOT, "docs/reference/collection-control-card-with-multiselect-toolbar.template.json"),
  collection_control_responsive_card_grid: path.join(ROOT, "docs/reference/collection-control-responsive-card-grid.template.json"),
};
const APPROVED_COLLECTION_TEMPLATE_IDS = Object.freeze(Object.keys(COLLECTION_TEMPLATE_PATHS));
const GRID_TABLE_TEMPLATE_IDS = new Set([
  "collection_control_grid_table",
  "collection_control_grid_table_with_multiselect",
  "Event Pipeline Grid-Table",
]);
const COLLECTION_DYNAMIC_USER_ZERO_ITEM_PADDING = Object.freeze({
  top: "--sp--s0",
  right: "--sp--s0",
  bottom: "--sp--s0",
  left: "--sp--s0",
});
const COLLECTION_OP_MENU_BUTTON_TRANSPARENT_BG = "rgba(255, 255, 255, 0)";
const COLLECTION_GRID_TABLE_CAPTION_TITLE_TYPOGRAPHY = Object.freeze([null, "l-medium"]);
const SOURCE_COLLECTION_TEMPLATE_IDS = {
  listSetIds: new Set(["2058726109535285249", "2058571956842409984", "2054077087595905025"]),
  listIds: new Set(["2058726119586017281", "2058571966637289476", "2054077096447066112"]),
};
const SOURCE_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS = {
  listSetIds: new Set(["2071862448464072704"]),
  listIds: new Set(["2071862457508171777"]),
};
const PAGE_LAYOUT_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS = Object.freeze([
  PAGE_LAYOUT_TEMPLATE_ID,
  "dashboard-page-layouts-workbench",
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
]);
const MASTER_DETAIL_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS = new Set([
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
]);
const DASHBOARD_GOLDEN_REFERENCE_ID = "event_portfolio_dashboard_golden_reference";
const UUID_CONTROL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_APPLICATION_COLOR_PATTERN = {
  primary: { value: "#0065FF", lightmodel: "Luminance" },
  secondary: { value: "#00D1FF", lightmodel: "Luminance" },
  neutral: { value: "#B3B7C0", lightmodel: "Luminance" },
  typography: { fontfamily: "Default", fontweight: "regular", basevalue: 14, scale: "1.125", lineheight: 1.6 },
};
const BUSINESS_APPLICATION_COLOR_PALETTE_RULES = Object.freeze([
  {
    id: "business-travel-approval",
    keywords: ["travel", "trip", "journey", "itinerary", "visa", "flight", "hotel", "expense", "reimbursement"],
    primary: { value: "#1E40AF", lightmodel: "Luminance" },
    secondary: { value: "#0F766E", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  },
  {
    id: "vendor-procurement-onboarding",
    keywords: ["vendor", "supplier", "procurement", "purchase", "sourcing", "contract", "onboarding"],
    primary: { value: "#0F766E", lightmodel: "Luminance" },
    secondary: { value: "#1D4ED8", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  },
  {
    id: "asset-operations-service",
    keywords: ["asset", "loan", "inventory", "maintenance", "facility", "operations", "service", "ticket", "work order"],
    primary: { value: "#1D4ED8", lightmodel: "Luminance" },
    secondary: { value: "#0F766E", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  },
  {
    id: "finance-risk-compliance",
    keywords: ["finance", "budget", "invoice", "payment", "audit", "risk", "compliance", "policy"],
    primary: { value: "#1E3A8A", lightmodel: "Luminance" },
    secondary: { value: "#7C3AED", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  },
  {
    id: "people-hr-workforce",
    keywords: ["employee", "hr", "human resources", "recruit", "candidate", "onboarding", "training", "performance"],
    primary: { value: "#6D28D9", lightmodel: "Luminance" },
    secondary: { value: "#0F766E", lightmodel: "Luminance" },
    neutral: { value: "#94A3B8", lightmodel: "Luminance" },
  },
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  const report = materializeFullAppGeneratedFinal(args);
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else printTextReport(report);
  process.exit(report.status === "pass" ? 0 : 1);
}

export function materializeFullAppGeneratedFinal(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const specPath = resolveRequiredPath(cwd, options.functionalSpec || options.spec, "functional-specification.md");
  const planPath = resolveRequiredPath(cwd, options.appPlan || options.plan, "yeeflow-app-plan.md");
  const outDir = path.resolve(cwd, options.outDir || "dist");
  const findings = [];

  if (!specPath) findings.push(error("FULL_APP_MATERIALIZATION_SPEC_REQUIRED", "Missing --functional-spec functional-specification.md input."));
  if (!planPath) findings.push(error("FULL_APP_MATERIALIZATION_PLAN_REQUIRED", "Missing --app-plan yeeflow-app-plan.md input."));
  if (findings.length) return buildFailure(findings, { outDir });

  const fixtureMode = options.allowFixtureApiIdsForTests === true;
  const idSource = loadIdSource({ cwd, apiIdManifest: options.apiIdManifest, fixtureMode, findings });
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });

  const specText = fs.readFileSync(specPath, "utf8");
  const planText = fs.readFileSync(planPath, "utf8");
  const planDemand = analyzeAppPlanResourceDemand(planText);
  fs.mkdirSync(outDir, { recursive: true });
  const appTitle = sanitizeTitle(options.title || extractApplicationName(planText) || extractTitle(planText) || extractTitle(specText) || "Generated Yeeflow Application");
  const slug = slugify(appTitle);
  const idPaths = buildIdPaths(planDemand);
  const ids = allocateIds(idSource.ids, idPaths, findings);
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });
  const appIconUrl = options.iconUrl || DEFAULT_ICON;
  const materializationTenantId = resolveMaterializationTenantId(options);
  if (!fixtureMode && !materializationTenantId) {
    findings.push(error("FULL_APP_MATERIALIZATION_TENANT_ID_REQUIRED", "Generated-final materialization requires a real TenantID from --tenant-id, YEEFLOW_TENANT_ID, or profile-specific tenant environment. Refusing to emit TenantID \"0\"."));
    return buildFailure(findings, { outDir, specPath, planPath });
  }

  const decoded = planDemand.hasMaterialResources
    ? buildResourceGraphPackage({ appTitle, rootListId: numberId(ids["decoded.ListSet.ListID"]), planDemand, ids, iconUrl: appIconUrl, appPlanText: planText })
    : buildDecodedPackage({
      appTitle,
      rootListId: numberId(ids["decoded.ListSet.ListID"]),
      dashboardLayoutId: stringId(ids["decoded.Pages[0].LayoutID"]),
      layoutResourceId: numberId(ids["decoded.Pages[0].LayoutInResources[0].ID"]),
      layoutResourceRefId: numberId(ids["decoded.Pages[0].LayoutInResources[0].RefId"]),
      iconUrl: appIconUrl,
      appPlanText: planText,
    });
  const resource = encodeYapkResourceOfficial(decoded);
  const wrapper = {
    PackageId: stringId(ids["wrapper.PackageId"]),
    TenantID: materializationTenantId || "1000000000000000000",
    AppID: 41,
    ListID: stringId(ids["decoded.ListSet.ListID"]),
    Title: appTitle,
    Description: `Generated-final package materialized from ${path.basename(specPath)} and ${path.basename(planPath)}.`,
    IconUrl: appIconUrl,
    Resource: resource,
    Notes: fixtureMode
      ? "Fixture-ID materialization for plugin regression only. Not signing/install eligible."
      : "Generated-final materialization. Run generated-final preflight before signing.",
    Author: "Codex Yeeflow App Builder",
    Date: "2026-06-24T00:00:00Z",
    Version: "1.0",
    Sign: "",
  };

  const packagePath = path.join(outDir, `${slug}.generated-final.yapk`);
  const decodedPath = path.join(outDir, `${slug}.generated-final.decoded-resource.json`);
  const seedDataPath = path.join(outDir, `${slug}.generated-final.seed-data.json`);
  const provenancePath = path.join(outDir, `${slug}.generated-final-id-provenance-report.json`);
  const generationReportPath = path.join(outDir, `${slug}.generated-final-generation-report.json`);
  fs.writeFileSync(packagePath, `${JSON.stringify(wrapper, null, 2)}\n`);
  fs.writeFileSync(decodedPath, `${JSON.stringify(decoded, null, 2)}\n`);
  fs.writeFileSync(seedDataPath, `${JSON.stringify(buildSeedDataArtifact(decoded), null, 2)}\n`);

  const provenance = {
    status: "pass",
    generatorProvenance: {
      name: "materialize-full-app-generated-final",
      pluginVersion: "0.8.35-training",
      mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    },
    generator: {
      name: "materialize-full-app-generated-final",
      version: "0.8.34-training",
      mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    },
    sourceMarker: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    allocationSource: "api-generated",
    signingEligible: false,
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
    package: summarizePath(packagePath),
    allocations: Object.entries(ids).map(([pathName, id]) => ({
      path: pathName,
      id: stringId(id),
      purpose: pathName,
      source: fixtureMode ? "api-generated-fixture-for-tests" : "api-generated",
    })),
    proofBoundary: fixtureMode
      ? "Fixture IDs are only for plugin regression. Do not sign, install, import, upgrade, or claim live Yeeflow ID provenance with this package."
      : "API-issued ID provenance report. Signing/install still require generated-final preflight, setsign, verifysign, package API acceptance, Version Management final success, and browser/runtime proof.",
  };
  fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  const generationReport = {
    status: "pass",
    mode: fixtureMode ? "fixture-regression" : planDemand.hasMaterialResources ? "minimal-resource-graph" : "schema-smoke-only",
    signingEligible: false,
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
    plannedResourceDemand: planDemand,
    inputs: {
      functionalSpecification: summarizePath(specPath),
      appPlan: summarizePath(planPath),
      apiIdManifest: options.apiIdManifest ? summarizePath(path.resolve(cwd, options.apiIdManifest)) : null,
    },
    outputs: {
      package: summarizePath(packagePath),
      decodedResource: summarizePath(decodedPath),
      seedData: summarizePath(seedDataPath),
      idProvenance: summarizePath(provenancePath),
    },
    hardStopsPreserved: [
      "No signing was attempted.",
      "No install/import/upgrade was attempted.",
      "No browser/runtime proof was attempted.",
      "Generated-final preflight is required before any signing request.",
      "Standalone materialization emits the planned generated-final resource surfaces but remains signing-ineligible until all generated-final hard gates pass.",
      "Use yapk-first-generation-preflight output as the signing-readiness handoff; materializer signingEligible remains false because this script does not run the final preflight/signing stage.",
    ],
  };
  fs.writeFileSync(generationReportPath, `${JSON.stringify(generationReport, null, 2)}\n`);

  return {
    status: "pass",
    mode: generationReport.mode,
    signingEligible: generationReport.signingEligible,
    materializerSigningEligible: false,
    preflightEligibleForSigning: null,
    signingReadinessSource: "not-run",
    outputDirectory: outDir,
    outputs: {
      package: packagePath,
      decodedResource: decodedPath,
      seedData: seedDataPath,
      idProvenance: provenancePath,
      generationReport: generationReportPath,
    },
    proofBoundary: generationReport.hardStopsPreserved,
    findings: [],
  };
}

function buildSeedDataArtifact(decoded) {
  const childByListId = new Map((decoded.Childs || []).map((child) => [stringId(child.List?.ListID || child.ListID || ""), child]));
  const lists = (decoded.Childs || []).map((child) => {
    const fields = (child.Fields || []).filter((field) => Number(field.Status) !== 0 || field.FieldName === "Title");
    const fieldSeedRequirements = fields
      .map((field) => seedRequirementForField(field, { childByListId }))
      .filter(Boolean);
    const rows = [0, 1, 2].map((rowIndex) => {
      const row = {};
      for (const field of fields.slice(0, 8)) row[field.FieldName] = sampleValueForField(field, rowIndex, { childByListId });
      return row;
    });
    return {
      listTitle: child.List?.Title || child.List?.Name || "Generated List",
      listId: stringId(child.List?.ListID || child.ListID || ""),
      operation: "post-install-seed-only",
      liveWriteRequired: true,
      fieldSeedRequirements,
      rows,
    };
  });
  return {
    status: "planned",
    artifactType: "post-install-seed-data",
    proofBoundary: "This companion artifact is not embedded in the .yapk package. Use it only after install/upgrade succeeds and explicit live-write permission is available.",
    lists,
  };
}

function sampleValueForField(field, index, context = {}) {
  if (field.FieldName === "Title") return `${field.DisplayName || "Item"} ${index + 1}`;
  if (field.FieldType === "Bit") return index % 2 === 0 ? "1" : "0";
  if (field.FieldType === "Datetime") return `2026-07-${String(index + 1).padStart(2, "0")}`;
  if (field.FieldType === "Decimal") return String((index + 1) * 10);
  if (field.Type === "identity-picker") return {
    seedValueType: "identity-picker",
    value: null,
    requiresLiveUserResolution: true,
    resolutionStrategy: "search-existing-tenant-user-before-live-write",
    displayName: field.DisplayName || field.FieldName,
  };
  if (field.Type === "file-upload") return {
    seedValueType: "file-upload",
    value: null,
    requiresFileUploadReference: true,
    resolutionStrategy: "leave-empty-until-file-upload-reference-is-available",
    displayName: field.DisplayName || field.FieldName,
  };
  if (field.Type === "lookup") {
    const rules = parseJsonMaybe(field.Rules) || {};
    const targetListId = stringId(rules.listid || rules.ListID || "");
    const targetChild = context.childByListId?.get(targetListId);
    return {
      seedValueType: "lookup",
      value: null,
      requiresLookupListDataIDResolution: true,
      resolutionStrategy: "write-target-list-first-readback-listdataid-before-live-write",
      storedValueField: "ListDataID",
      targetListId,
      targetListTitle: targetChild?.List?.Title || targetChild?.List?.Name || "",
      displayField: cleanResourceName(rules.listfield || rules.displayField || rules.fieldName || "Title") || "Title",
      displayValueHint: `${targetChild?.List?.Title || targetChild?.List?.Name || "Target record"} ${index + 1}`,
      mustNotUseDisplayTextAsStoredValue: true,
      displayName: field.DisplayName || field.FieldName,
    };
  }
  if (field.Type === "select") {
    const rules = parseJsonMaybe(field.Rules) || {};
    return String(rules.choices?.[index % Math.max(1, rules.choices.length)]?.value || "Active");
  }
  return `${field.DisplayName || field.FieldName} ${index + 1}`;
}

function seedRequirementForField(field, context = {}) {
  if (field?.Type === "identity-picker") {
    return {
      fieldName: field.FieldName,
      displayName: field.DisplayName || field.FieldName,
      controlType: "identity-picker",
      requiresLiveUserResolution: true,
      mustNotUsePlainStringSeed: true,
    };
  }
  if (field?.Type === "file-upload") {
    return {
      fieldName: field.FieldName,
      displayName: field.DisplayName || field.FieldName,
      controlType: "file-upload",
      requiresFileUploadReference: true,
      mustNotUsePlainStringSeed: true,
    };
  }
  if (field?.Type === "lookup") {
    const rules = parseJsonMaybe(field.Rules) || {};
    const targetListId = stringId(rules.listid || rules.ListID || "");
    const targetChild = context.childByListId?.get(targetListId);
    return {
      fieldName: field.FieldName,
      displayName: field.DisplayName || field.FieldName,
      controlType: "lookup",
      requiresLookupListDataIDResolution: true,
      targetListId,
      targetListTitle: targetChild?.List?.Title || targetChild?.List?.Name || "",
      displayField: cleanResourceName(rules.listfield || rules.displayField || rules.fieldName || "Title") || "Title",
      storedValueField: "ListDataID",
      mustNotUseDisplayTextAsStoredValue: true,
    };
  }
  return null;
}

function parseJsonMaybe(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildDefaultApplicationControlStyles({ rootListId, appPlanText = "" }) {
  const template = JSON.parse(fs.readFileSync(APPLICATION_CONTROL_STYLE_TEMPLATE_PATH, "utf8"));
  const styleContract = template.requiredThemes?.controlStyleTheme || {};
  const appContract = template.requiredThemes?.applicationStyleTheme || {};
  const controlStyleId = crypto.randomUUID();
  const appStyleConfig = buildApplicationColorPatternConfig(appPlanText, template);
  return [
    {
      ID: controlStyleId,
      Type: 1,
      Name: styleContract.Name || "Soft outline controls (Codex)",
      Description: styleContract.Description || "",
      Config: JSON.stringify(template.packageMaterializedConfig || template.sourceYcsConfig || {}),
      Ext: "",
    },
    {
      ID: `41_${rootListId}`,
      Type: 0,
      Name: appContract.Name || "application style",
      Description: "",
      Config: JSON.stringify(appStyleConfig),
      Ext: JSON.stringify({ controlDefaultId: controlStyleId }),
    },
  ];
}

function buildApplicationColorPatternConfig(appPlanText, template = {}) {
  const defaults = template.requiredThemes?.applicationStyleTheme?.Config || template.applicationColorPattern?.defaults || DEFAULT_APPLICATION_COLOR_PATTERN;
  const config = JSON.parse(JSON.stringify(defaults));
  const planned = extractApplicationColorPatternFromPlan(appPlanText);
  const semanticPalette = selectBusinessApplicationColorPalette(appPlanText);
  const useSemanticPalette = semanticPalette
    && (!Object.keys(planned).length || (isDefaultApplicationColorPattern(planned, defaults) && !hasExplicitDefaultColorApproval(appPlanText)));
  for (const role of ["primary", "secondary", "neutral"]) {
    const selected = useSemanticPalette ? semanticPalette[role] : planned[role];
    if (!selected) continue;
    config[role] = {
      value: selected.value,
      lightmodel: selected.lightmodel || "Luminance",
    };
  }
  config.typography = config.typography || DEFAULT_APPLICATION_COLOR_PATTERN.typography;
  return config;
}

function extractApplicationColorPatternFromPlan(planText) {
  const out = {};
  const section = extractNamedSection(planText, "Application Color Pattern Selection") || String(planText || "");
  for (const table of parseMarkdownTables(section)) {
    for (const row of table.rows) {
      const normalized = normalizeRowKeys(row);
      const role = normalizeColorRole(normalized["color role"] || normalized.role || normalized.token || normalized["color pattern"]);
      const value = normalizeHexColor(normalized["base color"] || normalized.value || normalized.color || normalized["normal color"]);
      const lightmodel = cleanResourceName(normalized["light model"] || normalized.lightmodel || normalized["lightmodel"] || "Luminance");
      if (role && value) out[role] = { value, lightmodel: lightmodel || "Luminance" };
    }
  }
  const regex = /\b(primary|secondary|neutral)\b[^\n#]{0,80}(#[0-9a-f]{6})/gi;
  let match;
  while ((match = regex.exec(section))) {
    const role = normalizeColorRole(match[1]);
    if (role && !out[role]) out[role] = { value: normalizeHexColor(match[2]), lightmodel: "Luminance" };
  }
  return out;
}

function selectBusinessApplicationColorPalette(text) {
  const haystack = normKey(text);
  let best = null;
  for (const rule of BUSINESS_APPLICATION_COLOR_PALETTE_RULES) {
    const score = rule.keywords.reduce((total, keyword) => total + (haystack.includes(normKey(keyword)) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, rule };
  }
  if (!best) return null;
  return {
    primary: best.rule.primary,
    secondary: best.rule.secondary,
    neutral: best.rule.neutral,
  };
}

function isDefaultApplicationColorPattern(pattern, defaults = DEFAULT_APPLICATION_COLOR_PATTERN) {
  return ["primary", "secondary", "neutral"].every((role) => {
    if (!pattern?.[role]) return false;
    return normalizeHexColor(pattern[role].value) === normalizeHexColor(defaults?.[role]?.value)
      && String(pattern[role].lightmodel || "Luminance") === String(defaults?.[role]?.lightmodel || "Luminance");
  });
}

function hasExplicitDefaultColorApproval(text) {
  const section = extractNamedSection(text, "Application Color Pattern Selection") || String(text || "");
  return /\b(user|customer|client|admin|stakeholder|business)\s+(explicitly\s+)?(approved|requested|selected|confirmed)\b[^.\n]{0,120}\b(default|yeeflow default|standard yeeflow)\b/i.test(section)
    || /\b(default|yeeflow default|standard yeeflow)\b[^.\n]{0,120}\b(user|customer|client|admin|stakeholder|business)\s+(approved|requested|selected|confirmed)\b/i.test(section);
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

function normalizeRowKeys(row) {
  const out = {};
  for (const [key, value] of Object.entries(row || {})) out[String(key || "").trim().toLowerCase()] = value;
  return out;
}

function normalizeColorRole(value) {
  const text = cleanResourceName(value).toLowerCase();
  if (text === "primary") return "primary";
  if (text === "secondary") return "secondary";
  if (text === "neutral") return "neutral";
  return "";
}

function normalizeHexColor(value) {
  const match = String(value || "").trim().match(/^#[0-9a-f]{6}$/i);
  return match ? match[0].toUpperCase() : "";
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function analyzeAppPlanResourceDemand(planText) {
  const sections = [
    { key: "dataLists", marker: /^##\s+4\.\s+Data Lists and Document Libraries Plan/im, tableHeaders: ["List Name", "Data List Name", "Document Library Name", "List", "Data List"], outputSurface: "$.Childs[]" },
    { key: "approvalForms", marker: /^##\s+5\.\s+Approval Forms Plan/im, tableHeaders: ["Approval Form Name", "Form Name"], outputSurface: "$.Forms[]" },
    { key: "formReports", marker: /^##\s+6\.\s+Form Reports Plan/im, tableHeaders: ["Form Report Name"], outputSurface: "$.FormNewReports[]" },
    { key: "customForms", marker: /^##\s+10\.\s+Custom Data List Forms Plan/im, tableHeaders: ["Form Name"], outputSurface: "$.Childs[].Layouts[]" },
    { key: "dashboards", marker: /^##\s+14\.\s+Dashboard Pages Plan/im, tableHeaders: ["Dashboard Page Name", "Dashboard Page", "Page Name"], outputSurface: "$.Pages[] Type 103" },
    { key: "navigationGroups", marker: /^##\s+15\.\s+Application Navigation Plan/im, tableHeaders: ["Group"], outputSurface: "$.ListSet.LayoutView.sort[]" },
  ];
  const counts = {};
  const resources = {};
  const evidence = [];
  const navigationItemsByGroup = {};
  for (const { key, marker, tableHeaders, outputSurface } of sections) {
    const section = extractNumberedSection(planText, marker);
    const names = collectPlannedResourceNames(section, { tableHeaders, key });
    if (key === "navigationGroups") Object.assign(navigationItemsByGroup, collectNavigationItemsByGroup(section));
    const count = names.length;
    counts[key] = count;
    resources[key] = names;
    if (count > 0) evidence.push({ section: key, outputSurface, plannedItems: count, names });
  }
  const dashboardFilterRecords = collectDashboardFilterRecords(planText);
  const dashboardSummaryMetricRecords = collectDashboardSummaryMetricRecords(planText);
  const dashboardDatasetRecords = collectDashboardDatasetRecords(planText);
  const dashboardAnalyticsRecords = collectDashboardAnalyticsRecords(planText);
  const dashboardDataTableRecords = collectDashboardDataTableRecords(planText);
  const dashboardPageLayoutTemplateRecords = collectDashboardPageLayoutTemplateRecords(planText);
  const reverseRelatedRecords = collectReverseRelatedPlanRows(planText);
  const explicitDashboardNames = resources.dashboards || [];
  const dashboardNamesFromTemplates = [
    ...dashboardPageLayoutTemplateRecords,
    ...dashboardFilterRecords,
    ...dashboardSummaryMetricRecords,
    ...dashboardDatasetRecords,
    ...dashboardAnalyticsRecords,
    ...dashboardDataTableRecords,
  ].map((record) => cleanResourceName(record.dashboardPage)).filter((name) => name && !isNonResourceName(name));
  if (dashboardNamesFromTemplates.length && explicitDashboardNames.length === 0) {
    resources.dashboards = unique([...(resources.dashboards || []), ...dashboardNamesFromTemplates]);
    counts.dashboards = resources.dashboards.length;
    const existing = evidence.find((item) => item.section === "dashboards");
    if (existing) {
      existing.plannedItems = counts.dashboards;
      existing.names = resources.dashboards;
    } else {
      evidence.push({
        section: "dashboards",
        outputSurface: "$.Pages[] Type 103",
        plannedItems: counts.dashboards,
        names: resources.dashboards,
      });
    }
  }
  return {
    counts,
    resources,
    navigationItemsByGroup,
    dataListFieldSpecs: collectDataListFieldSpecs(planText),
    dataListViewRecords: collectDataListViewRecords(planText),
    customFormRecords: collectCustomFormRecords(planText),
    reverseRelatedRecords,
    approvalFormFieldSpecs: collectApprovalFormFieldSpecs(planText),
    approvalWorkflowNodeSpecs: collectApprovalWorkflowNodeSpecs(planText),
    dashboardPageLayoutTemplateRecords,
    dashboardFilterRecords,
    dashboardSummaryMetricRecords,
    dashboardDatasetRecords,
    dashboardAnalyticsRecords,
    dashboardDataTableRecords,
    evidence,
    hasMaterialResources: Object.values(counts).some((count) => count > 0),
  };
}

function collectDashboardPageLayoutTemplateRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^#{3,4}\s+(?:\d+(?:\.\d+)*\s+)?Dashboard Page Layout Template Selection\s*$/i.test(lines[index].trim())) continue;
    let cursor = index + 1;
    while (cursor < lines.length && !isTableLine(lines[cursor])) {
      if (/^#{3,4}\s+/.test(lines[cursor])) break;
      cursor += 1;
    }
    if (!isTableLine(lines[cursor]) || !isTableLine(lines[cursor + 1] || "")) continue;
    const headers = splitTableLine(lines[cursor]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard", "dashboard page name", "page name"]);
    const templateColumn = findHeaderIndex(normalizedHeaders, ["selected dashboard page layout template", "dashboard page layout template", "selected layout template", "layout template", "template id"]);
    if (pageColumn === -1 || templateColumn === -1) continue;
    let rowIndex = cursor + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const dashboardPage = cleanResourceName(cells[pageColumn]);
      const templateId = extractDashboardPageLayoutTemplateId(cells[templateColumn] || lines[rowIndex]);
      if (dashboardPage && !isNonResourceName(dashboardPage) && templateId) {
        records.push({
          dashboardPage,
          selectedTemplateId: templateId,
          raw: lines[rowIndex].trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  for (const table of parseMarkdownTables(section)) {
    const normalizedHeaders = table.headers.map((header) => normKey(header));
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard", "dashboard page name", "page name"]);
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected dashboard page layout template",
      "dashboard page layout template",
      "selected layout template",
      "layout template",
      "template id",
    ]);
    if (pageColumn === -1 || templateColumn === -1) continue;
    for (const row of table.rows) {
      const cells = table.headers.map((header) => row[header] || "");
      const dashboardPage = cleanResourceName(cells[pageColumn]);
      const templateId = extractDashboardPageLayoutTemplateId(cells[templateColumn]);
      if (dashboardPage && !isNonResourceName(dashboardPage) && templateId) {
        records.push({
          dashboardPage,
          selectedTemplateId: templateId,
          raw: JSON.stringify(row),
        });
      }
    }
  }
  let currentDashboardPage = "";
  let currentPageName = "";
  let currentTemplateId = "";
  const flushBulletRecord = () => {
    const dashboardPage = cleanResourceName(currentPageName) || currentDashboardPage;
    if (dashboardPage && !isNonResourceName(dashboardPage) && currentTemplateId) {
      records.push({
        dashboardPage,
        selectedTemplateId: currentTemplateId,
        raw: `${dashboardPage} :: ${currentTemplateId}`,
      });
    }
  };
  for (const line of lines) {
    const heading = line.match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      flushBulletRecord();
      currentDashboardPage = dashboardHeadingPageName(heading[1]);
      currentPageName = "";
      currentTemplateId = "";
      continue;
    }
    if (!currentDashboardPage) continue;
    const pageName = line.match(/^\s*(?:[-*]\s*)?Page\s+name\s*:\s*(.+?)\s*$/i);
    if (pageName) {
      currentPageName = cleanResourceName(pageName[1]);
      continue;
    }
    if (/^\s*(?:[-*]\s*)?Layout\s+template\s*:/i.test(line)) {
      currentTemplateId = extractDashboardPageLayoutTemplateId(line);
    }
  }
  flushBulletRecord();
  return uniqueDashboardLayoutTemplateRecords(records);
}

function collectDashboardAnalyticsRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = dashboardHeadingPageName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected template",
      "selected golden reference template",
      "template id",
      "selected data analytics template",
      "data analytics template",
      "selected analytics template",
      "analytics template",
    ]);
    if (templateColumn === -1) continue;
    let pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard", "dashboard page", "dashboard page name", "page name"]);
    let regionColumn = findHeaderIndex(normalizedHeaders, ["analytics region", "surface", "section name", "region", "section"]);
    const sectionColumn = findHeaderIndex(normalizedHeaders, ["section", "region"]);
    const surfaceColumn = findHeaderIndex(normalizedHeaders, ["surface"]);
    if (pageColumn !== -1 && regionColumn === pageColumn && surfaceColumn !== -1) {
      regionColumn = surfaceColumn;
    } else if (pageColumn === -1 && sectionColumn !== -1 && surfaceColumn !== -1) {
      regionColumn = sectionColumn;
    }
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    const questionColumn = findHeaderIndex(normalizedHeaders, ["business question", "question", "title", "analytics title"]);
    const groupColumn = findHeaderIndex(normalizedHeaders, ["grouping field", "grouping/axis fields", "axis field", "category field", "row fields"]);
    const valueColumn = findHeaderIndex(normalizedHeaders, ["value field", "value/aggregate fields", "aggregate field", "measure field", "values"]);
    if (pageColumn === -1 && !currentDashboardPage) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const selectedTemplateId = extractApprovedDataAnalyticsTemplateId(lines[rowIndex]);
      const dashboardPage = pageColumn === -1 ? currentDashboardPage : (cleanResourceName(cells[pageColumn]) || currentDashboardPage);
      if (!dashboardPage) {
        rowIndex += 1;
        continue;
      }
      if (selectedTemplateId) {
        records.push({
          dashboardPage,
          analyticsRegion: cleanResourceName(cells[regionColumn]),
          sourceResource: cleanResourceName(cells[sourceColumn]),
          businessQuestion: cleanResourceName(cells[questionColumn]) || cleanResourceName(cells[regionColumn]),
          groupingFields: cleanResourceName(cells[groupColumn]),
          valueFields: cleanResourceName(cells[valueColumn]),
          selectedTemplateId,
          raw: lines[rowIndex].trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return uniqueDashboardAnalyticsRecords(records);
}

function collectDashboardDatasetRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = dashboardHeadingPageName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected template",
      "selected golden reference template",
      "template id",
      "selected collection presentation reference",
      "selected record display control",
      "selected collection template",
      "collection template",
    ]);
    const regionColumn = findHeaderIndex(normalizedHeaders, ["dataset region", "planned dashboard / region", "section", "section name", "region"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source list", "source resource", "data source", "source data", "source"]);
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard", "dashboard page", "dashboard page name", "page name"]);
    if (templateColumn === -1 || regionColumn === -1 || sourceColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const raw = lines[rowIndex];
      const selectedTemplateId = extractApprovedCollectionTemplateId(raw);
      if (selectedTemplateId) {
        records.push({
          dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
          datasetRegion: cleanResourceName(cells[regionColumn]),
          sourceResource: cleanResourceName(cells[sourceColumn]),
          selectedTemplateId,
          raw: raw.trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return uniqueDashboardTemplateRecords(records);
}

function collectDashboardDataTableRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = dashboardHeadingPageName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected template",
      "selected golden reference template",
      "template id",
      "selected data table template",
      "data table template",
      "selected table template",
      "table template",
    ]);
    if (templateColumn === -1) continue;
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard", "dashboard page", "dashboard page name", "page name", "page/form"]);
    const regionColumn = findHeaderIndex(normalizedHeaders, ["region", "dataset region", "planned dashboard / region", "section", "section name", "analytics region"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source list", "source resource", "data source", "source data", "source"]);
    const displayColumn = findHeaderIndex(normalizedHeaders, ["display columns", "visible columns", "columns", "fields"]);
    if (sourceColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const selectedTemplateId = extractApprovedDataTableTemplateId(lines[rowIndex]);
      if (selectedTemplateId) {
        records.push({
          dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
          region: cleanResourceName(cells[regionColumn]) || "Data table",
          sourceResource: cleanResourceName(cells[sourceColumn]),
          displayColumns: cleanResourceName(cells[displayColumn]),
          selectedTemplateId,
          raw: lines[rowIndex].trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return uniqueDashboardTemplateRecords(records);
}

function extractApprovedDataTableTemplateId(text) {
  for (const templateId of APPROVED_DATA_TABLE_TEMPLATE_IDS) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return "";
}

function collectDataListFieldSpecs(planText) {
  const section = extractNumberedSection(planText, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  const byList = {};
  if (!section.trim()) return byList;
  const lines = section.split(/\r?\n/);
  let currentList = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentList = cleanResourceName(heading[1]);
      if (currentList && !byList[normKey(currentList)]) byList[normKey(currentList)] = [];
      continue;
    }
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const listColumn = findHeaderIndex(normalizedHeaders, ["list", "data list", "data list name", "list name", "document library", "source list"]);
    const displayColumn = findHeaderIndex(normalizedHeaders, ["display name", "field display name", "business field", "field name", "field label", "label", "name"]);
    const keyColumn = findHeaderIndex(normalizedHeaders, ["internal id field key", "field key", "internal id", "internal name", "internal field", "field id", "fieldname", "storage name", "storage field", "storage field name"]);
    const fieldTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow field type", "yeeflow field type", "field type", "business type", "type"]);
    const controlTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow control type", "yeeflow type", "control type", "control"]);
    const choiceColumn = findHeaderIndex(normalizedHeaders, ["choice values", "choices", "options", "values"]);
    const lookupTargetColumn = findHeaderIndex(normalizedHeaders, ["lookup target", "target list", "lookup data list", "lookup list", "related list"]);
    const purposeColumn = findHeaderIndex(normalizedHeaders, ["purpose", "business purpose", "description", "notes"]);
    if (displayColumn === -1 || (fieldTypeColumn === -1 && controlTypeColumn === -1)) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const rowList = listColumn === -1 ? currentList : cleanResourceName(cells[listColumn]);
      if (!rowList || isNonResourceName(rowList)) {
        rowIndex += 1;
        continue;
      }
      if (!byList[normKey(rowList)]) byList[normKey(rowList)] = [];
      const displayName = cleanResourceName(cells[displayColumn]);
      if (!displayName || isNonFieldName(displayName)) {
        rowIndex += 1;
        continue;
      }
      const explicitControlType = controlTypeColumn === -1 ? "" : cleanResourceName(cells[controlTypeColumn]);
      const fieldType = fieldTypeColumn === -1
        ? inferFieldTypeFromControlPlan({ displayName, controlType: explicitControlType })
        : cleanResourceName(cells[fieldTypeColumn]) || inferFieldTypeFromControlPlan({ displayName, controlType: explicitControlType });
      const purpose = purposeColumn === -1 ? "" : cleanResourceName(cells[purposeColumn]);
      const purposeChoiceValues = choiceValuesFromPurpose({ displayName, fieldType, purpose });
      const choiceValues = choiceColumn === -1 ? purposeChoiceValues : cleanResourceName(cells[choiceColumn]) || purposeChoiceValues;
      const controlType = explicitControlType || inferControlTypeFromFieldPlan({ displayName, fieldType, choiceValues });
      const fieldName = cleanResourceName(cells[keyColumn]) || inferFieldKey(displayName, fieldType, byList[normKey(rowList)].length);
      byList[normKey(rowList)].push({
        displayName,
        fieldName,
        fieldType,
        controlType,
        choiceValues,
        lookupTarget: lookupTargetColumn === -1 ? lookupTargetFromPurpose(purpose) : cleanResourceName(cells[lookupTargetColumn]) || lookupTargetFromPurpose(purpose),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return byList;
}

function collectCustomFormRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  const records = [];
  if (!section.trim()) return records;
  const lines = section.split(/\r?\n/);
  let currentList = "";
  const seen = new Set();
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) {
      currentList = cleanResourceName(heading[1]);
      continue;
    }
    if (!currentList || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const listColumn = findHeaderIndex(normalizedHeaders, ["data list", "host list", "list name", "source list", "list/library", "data list name"]);
    const formColumn = findHeaderIndex(normalizedHeaders, ["form name", "custom form name"]);
    const typeColumn = findHeaderIndex(normalizedHeaders, ["form type", "type", "purpose"]);
    const usageColumn = findHeaderIndex(normalizedHeaders, ["form usage", "usage"]);
    const templateColumn = findHeaderIndex(normalizedHeaders, ["selected data list form layout template", "data list form layout template", "selected layout template"]);
    const openColumn = findHeaderIndex(normalizedHeaders, ["open in", "open mode", "display mode"]);
    const reasonColumn = findHeaderIndex(normalizedHeaders, ["selection reason", "proof boundary", "business sections needed"]);
    if (formColumn === -1 || (listColumn === -1 && !currentList)) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const formName = cleanResourceName(cells[formColumn]);
      if (!formName || isNonResourceName(formName)) {
        rowIndex += 1;
        continue;
      }
      const hostListName = cleanResourceName(cells[listColumn]) || currentList;
      if (!hostListName || isNonResourceName(hostListName)) {
        rowIndex += 1;
        continue;
      }
      const key = `${normKey(hostListName)}::${normKey(formName)}`;
      const selectedTemplate = templateColumn === -1 ? "" : cleanResourceName(cells[templateColumn]);
      const openIn = openColumn === -1 ? "" : cleanResourceName(cells[openColumn]);
      const reason = reasonColumn === -1 ? "" : cleanResourceName(cells[reasonColumn]);
      const formType = typeColumn === -1 ? (usageColumn === -1 ? "" : cleanResourceName(cells[usageColumn])) : cleanResourceName(cells[typeColumn]);
      const record = {
        listName: hostListName,
        formName,
        formType,
        selectedTemplate,
        openIn,
        selectionReason: reason,
      };
      if (!seen.has(key)) {
        seen.add(key);
        records.push(record);
      } else if (selectedTemplate || openIn || reason) {
        const existing = records.find((item) => `${normKey(item.listName)}::${normKey(item.formName)}` === key);
        if (existing) Object.assign(existing, Object.fromEntries(Object.entries(record).filter(([, value]) => value)));
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function collectApprovalFormFieldSpecs(planText) {
  const section = extractNumberedSection(planText, /^##\s+5\.\s+Approval Forms Plan/im);
  const byForm = {};
  if (!section.trim()) return byForm;
  const lines = section.split(/\r?\n/);
  let currentApprovalForm = "";
  let currentRole = "";
  for (let index = 0; index < lines.length; index += 1) {
    const approvalHeading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (approvalHeading) {
      currentApprovalForm = cleanResourceName(approvalHeading[1]);
      currentRole = "";
      if (currentApprovalForm && !byForm[normKey(currentApprovalForm)]) byForm[normKey(currentApprovalForm)] = { submission: [], task: [] };
      continue;
    }
    if (/^#{4,6}\s+Submission Form Fields\s*$/i.test(lines[index])) {
      currentRole = "submission";
      continue;
    }
    if (/^#{4,6}\s+Task Form Fields\s*$/i.test(lines[index])) {
      currentRole = "task";
      continue;
    }
    if (!currentApprovalForm || !currentRole || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const displayColumn = findHeaderIndex(normalizedHeaders, ["business label", "display name", "field name", "label", "name"]);
    const keyColumn = findHeaderIndex(normalizedHeaders, ["field name", "field id / variable id", "variable id", "field key", "internal id field key"]);
    const fieldTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow variable type", "exact yeeflow field type", "field type", "variable type", "type"]);
    const controlTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow control type", "control type", "control"]);
    if (displayColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const displayName = cleanResourceName(cells[displayColumn]);
      if (!displayName || isNonFieldName(displayName)) {
        rowIndex += 1;
        continue;
      }
      const list = byForm[normKey(currentApprovalForm)]?.[currentRole] || [];
      list.push({
        displayName,
        fieldName: cleanResourceName(cells[keyColumn]) || inferFieldKey(displayName, cleanResourceName(cells[fieldTypeColumn]) || "Text", list.length),
        fieldType: cleanResourceName(cells[fieldTypeColumn]) || "Text",
        controlType: cleanResourceName(cells[controlTypeColumn]),
      });
      byForm[normKey(currentApprovalForm)][currentRole] = uniqueApprovalFieldSpecs(list);
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return byForm;
}

function collectApprovalWorkflowNodeSpecs(planText) {
  const section = extractNumberedSection(planText, /^##\s+5\.\s+Approval Forms Plan/im);
  const byForm = {};
  if (!section.trim()) return byForm;
  const lines = section.split(/\r?\n/);
  let currentApprovalForm = "";
  for (let index = 0; index < lines.length; index += 1) {
    const approvalHeading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (approvalHeading) {
      currentApprovalForm = cleanResourceName(approvalHeading[1]);
      if (currentApprovalForm && !byForm[normKey(currentApprovalForm)]) byForm[normKey(currentApprovalForm)] = [];
      continue;
    }
    if (!currentApprovalForm || !isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const nameColumn = findHeaderIndex(normalizedHeaders, ["node name", "workflow node", "step name", "approval step", "task name"]);
    const typeColumn = findHeaderIndex(normalizedHeaders, ["node type", "workflow node type", "stencil", "type"]);
    if (nameColumn === -1 || typeColumn === -1) continue;
    const descriptionColumn = findHeaderIndex(normalizedHeaders, ["description", "purpose"]);
    const assigneeColumn = findHeaderIndex(normalizedHeaders, ["assignee/role", "assignee", "role", "owner"]);
    const strategyColumn = findHeaderIndex(normalizedHeaders, ["assignment strategy", "strategy"]);
    const outcomesColumn = findHeaderIndex(normalizedHeaders, ["outcomes", "outcome"]);
    const conditionColumn = findHeaderIndex(normalizedHeaders, ["condition/branch", "condition", "branch"]);
    const dataColumn = findHeaderIndex(normalizedHeaders, ["data read/write", "data read write", "data source", "read/write", "read write"]);
    const proofColumn = findHeaderIndex(normalizedHeaders, ["proof boundary", "proof"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const nodeName = cleanResourceName(cells[nameColumn]);
      const nodeType = cleanResourceName(cells[typeColumn]);
      if (!nodeName || isNonResourceName(nodeName) || !nodeType) {
        rowIndex += 1;
        continue;
      }
      byForm[normKey(currentApprovalForm)].push({
        nodeName,
        nodeType,
        description: descriptionColumn === -1 ? "" : cleanResourceName(cells[descriptionColumn]),
        assigneeRole: assigneeColumn === -1 ? "" : cleanResourceName(cells[assigneeColumn]),
        assignmentStrategy: strategyColumn === -1 ? "" : cleanResourceName(cells[strategyColumn]),
        outcomes: outcomesColumn === -1 ? "" : cleanResourceName(cells[outcomesColumn]),
        conditionBranch: conditionColumn === -1 ? "" : cleanResourceName(cells[conditionColumn]),
        dataReadWrite: dataColumn === -1 ? "" : cleanResourceName(cells[dataColumn]),
        proofBoundary: proofColumn === -1 ? "" : cleanResourceName(cells[proofColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return Object.fromEntries(Object.entries(byForm).map(([key, nodes]) => [key, uniqueApprovalWorkflowNodes(nodes)]));
}

function collectDashboardFilterRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  const records = [];
  if (!section.trim()) return records;
  const lines = section.split(/\r?\n/);
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = dashboardHeadingPageName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const filterColumn = findHeaderIndex(normalizedHeaders, ["filter name", "filter", "control label"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    const fieldColumn = findHeaderIndex(normalizedHeaders, ["field", "filter field", "source field", "filter field display name"]);
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard", "dashboard page", "dashboard page name", "page name"]);
    if (filterColumn === -1 || fieldColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const filterName = cleanResourceName(cells[filterColumn]);
      if (!filterName || isNonResourceName(filterName) || /not applicable|n\/a|none/i.test(filterName)) {
        rowIndex += 1;
        continue;
      }
      records.push({
        dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
        filterName,
        sourceResource: sourceColumn === -1 ? "" : cleanResourceName(cells[sourceColumn]),
        fieldDisplayName: cleanResourceName(cells[fieldColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function collectDashboardSummaryMetricRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+14\.\s+Dashboard Pages Plan/im);
  const records = [];
  if (!section.trim()) return records;
  const lines = section.split(/\r?\n/);
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = dashboardHeadingPageName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const metricColumn = findHeaderIndex(normalizedHeaders, ["metric name", "kpi name", "summary metric", "summary metric name"]);
    if (metricColumn === -1) continue;
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard", "dashboard page", "dashboard page name", "page name"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source data list", "source resource", "data source", "source"]);
    const fieldColumn = findHeaderIndex(normalizedHeaders, ["source field(s)", "source fields", "source field", "field"]);
    const logicColumn = findHeaderIndex(normalizedHeaders, ["calculation logic", "logic", "aggregation"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const metricName = cleanResourceName(cells[metricColumn]);
      if (!metricName || isNonResourceName(metricName) || /not applicable|n\/a|none/i.test(metricName)) {
        rowIndex += 1;
        continue;
      }
      records.push({
        dashboardPage: cleanResourceName(cells[pageColumn]) || currentDashboardPage,
        metricName,
        sourceResource: sourceColumn === -1 ? "" : cleanResourceName(cells[sourceColumn]),
        sourceFields: fieldColumn === -1 ? "" : cleanResourceName(cells[fieldColumn]),
        calculationLogic: logicColumn === -1 ? "" : cleanResourceName(cells[logicColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function findHeaderIndex(normalizedHeaders, candidates) {
  const normalizedCandidates = candidates.map(normKey);
  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
}

function dashboardHeadingPageName(value) {
  const name = cleanResourceName(value);
  if (!name) return "";
  const key = normKey(name);
  if (key === "business decision gates") return "";
  if (key === "dashboard template coverage matrix") return "";
  if (key === "summary metrics" || key === "dashboard filters" || key === "data analytics" || key === "data tables") return "";
  if (/^(dashboard|record display|item template|collection|kanban|dashboard generation|summary metric|filter|data table|data analytics)/.test(key)) return "";
  return name;
}

function uniqueDashboardTemplateRecords(records) {
  const out = [];
  const indexByKey = new Map();
  for (const record of records || []) {
    const key = [
      normKey(record.dashboardPage),
      normKey(record.selectedTemplateId),
      normKey(record.sourceResource),
    ].join("::");
    if (indexByKey.has(key)) {
      const existingIndex = indexByKey.get(key);
      const existing = out[existingIndex];
      if (!existing.sourceResource && record.sourceResource) out[existingIndex] = record;
      continue;
    }
    indexByKey.set(key, out.length);
    out.push(record);
  }
  return out;
}

function uniqueDashboardLayoutTemplateRecords(records) {
  const out = [];
  const indexByKey = new Map();
  for (const record of records || []) {
    const key = normKey(record.dashboardPage);
    if (!key) continue;
    if (indexByKey.has(key)) {
      out[indexByKey.get(key)] = record;
      continue;
    }
    indexByKey.set(key, out.length);
    out.push(record);
  }
  return out;
}

function uniqueDashboardAnalyticsRecords(records) {
  const out = [];
  const indexByKey = new Map();
  for (const record of records || []) {
    const key = [
      normKey(record.dashboardPage),
      normKey(record.selectedTemplateId),
    ].join("::");
    if (indexByKey.has(key)) {
      const existingIndex = indexByKey.get(key);
      const existing = out[existingIndex];
      const existingScore = [existing.sourceResource, existing.groupingFields, existing.valueFields].filter(Boolean).length;
      const recordScore = [record.sourceResource, record.groupingFields, record.valueFields].filter(Boolean).length;
      if (recordScore > existingScore) out[existingIndex] = record;
      continue;
    }
    indexByKey.set(key, out.length);
    out.push(record);
  }
  return out;
}

function extractApprovedCollectionTemplateId(text) {
  for (const templateId of APPROVED_COLLECTION_TEMPLATE_IDS) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return inferApprovedCollectionTemplateId(text);
}

function inferApprovedCollectionTemplateId(text) {
  const value = String(text || "").toLowerCase();
  const candidates = [
    {
      templateId: "collection_control_grid_table_with_multiselect",
      patterns: [/grid[-\s]*table.*multi\s*select/, /multi\s*select.*grid[-\s]*table/, /batch.*selected/, /selected\s+records/],
    },
    {
      templateId: "collection_control_card_with_multiselect_toolbar",
      patterns: [/card.*multi\s*select/, /multi\s*select.*card/, /selected\s+follow[-\s]*up/, /personal\s+loan\s+cards/],
    },
    {
      templateId: "collection_control_responsive_card_grid",
      patterns: [/responsive\s+cards?/, /visual\s+asset\s+brows/, /asset\s+card\s+browser/, /cards?\s+match\s+asset/],
    },
    {
      templateId: "Event Pipeline Grid-Table",
      patterns: [/event\s+pipeline\s+grid[-\s]*table/, /rich\s+operations\s+pipeline/, /primary\s+operations\s+layout/],
    },
    {
      templateId: "collection_control_grid_table",
      patterns: [/dense\s+grid[-\s]*table/, /dense\s+escalation/, /grid[-\s]*table\s+suits/, /dense\s+queue/],
    },
  ];
  const matched = candidates.filter((candidate) => candidate.patterns.some((pattern) => pattern.test(value)));
  return matched.length === 1 ? matched[0].templateId : "";
}

function extractApprovedDataAnalyticsTemplateId(text) {
  for (const templateId of APPROVED_DATA_ANALYTICS_TEMPLATE_IDS) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return "";
}

function extractDashboardPageLayoutTemplateId(text) {
  for (const templateId of DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return "";
}

function buildMissingResourceGraph(planDemand) {
  const surfaceByKey = {
    dataLists: "$.Childs[] data list/document library resources",
    approvalForms: "$.Forms[] approval form definitions",
    formReports: "$.FormNewReports[] approval report registrations",
    customForms: "$.Childs[].Layouts[] custom data list form layouts",
    dashboards: "$.Pages[] Type 103 dashboard pages with materialized v1.1 content",
    navigationGroups: "$.ListSet.LayoutView.sort[] grouped navigation runtime metadata",
  };
  return Object.entries(planDemand.resources)
    .filter(([, names]) => names.length)
    .map(([category, names]) => ({
      category,
      plannedCount: names.length,
      plannedNames: names,
      requiredOutputSurface: surfaceByKey[category],
      materializerStatus: "not-implemented",
    }));
}

function buildIdPaths(planDemand) {
  if (!planDemand.hasMaterialResources) {
    return [
      "wrapper.PackageId",
      "decoded.ListSet.ListID",
      "decoded.Pages[0].LayoutID",
      "decoded.Pages[0].LayoutInResources[0].ID",
      "decoded.Pages[0].LayoutInResources[0].RefId",
    ];
  }
  const paths = [
    "wrapper.PackageId",
    "decoded.ListSet.ListID",
  ];
  planDemand.resources.dataLists.forEach((name, index) => {
    const fieldSpecs = fieldSpecsForList(planDemand, name);
    paths.push(`decoded.Childs[${index}].List.ListID`);
    fieldSpecs.forEach((field, fieldIndex) => {
      paths.push(`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`);
    });
    paths.push(`decoded.Childs[${index}].Layouts[0].LayoutID`);
  });
  for (const assignment of assignAllCustomFormLayoutPositions(planDemand, planDemand.resources.dataLists)) {
    paths.push(`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`);
  }
  planDemand.resources.approvalForms.forEach((name, index) => {
    paths.push(`decoded.Forms[${index}].Key`);
    paths.push(`decoded.Forms[${index}].DefResourceID`);
  });
  planDemand.resources.formReports.forEach((name, index) => {
    paths.push(`decoded.FormNewReports[${index}].ID`);
  });
  planDemand.resources.dashboards.forEach((name, index) => {
    paths.push(`decoded.Pages[${index}].LayoutID`);
  });
  navigationGroupNames(planDemand).forEach((name, index) => {
    paths.push(`decoded.ListSet.LayoutView.sort[${index}].ID`);
  });
  return paths;
}

function extractNumberedSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function collectPlannedResourceNames(section, { tableHeaders = [], key = "" } = {}) {
  if (!section.trim()) return [];
  const headingNames = [...section.matchAll(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/gim)]
    .map((match) => cleanResourceName(match[1]))
    .filter((name) => !isNonResourceName(name));
  if (headingNames.length && key !== "customForms" && key !== "dashboards" && key !== "dataLists") return unique(headingNames);

  if (key === "dashboards") {
    const pageNames = [...section.matchAll(/^-\s*Page name:\s*(.+?)\s*$/gim)]
      .map((match) => cleanResourceName(match[1]))
      .filter((name) => !isNonResourceName(name));
    const explicitLayoutTableNames = [];
    for (const table of parseMarkdownTables(section)) {
      const normalizedHeaders = table.headers.map((header) => normKey(header));
      const templateColumn = findHeaderIndex(normalizedHeaders, [
        "selected dashboard page layout template",
        "dashboard page layout template",
        "selected layout template",
        "layout template",
      ]);
      if (templateColumn === -1) continue;
      const nameHeader = table.headers.find((header) => ["Dashboard Page Name", "Dashboard Page", "Page Name", "Dashboard"].includes(header));
      if (!nameHeader) continue;
      for (const row of table.rows) {
        const name = cleanResourceName(row[nameHeader]);
        if (!isNonResourceName(name)) explicitLayoutTableNames.push(name);
      }
    }
    const explicitNames = unique([...pageNames, ...explicitLayoutTableNames]);
    if (explicitNames.length) return explicitNames;
    const dashboardHeadings = headingNames.filter((name) => !/\b(?:template|selection|filter|filters|metric|metrics|section|sections|record display|data analytics|data table|navigation|left panel|right panel|exclusion|exclusions)\b/i.test(name));
    return unique(dashboardHeadings);
  }

  const tableNames = [];
  for (const table of parseMarkdownTables(section)) {
    const normalizedHeaders = table.headers.map((header) => normKey(header));
    const nameColumn = findHeaderIndex(normalizedHeaders, tableHeaders);
    if (nameColumn === -1) continue;
    const nameHeader = table.headers[nameColumn];
    for (const row of table.rows) {
      const name = cleanResourceName(row[nameHeader]);
      if (!isNonResourceName(name)) tableNames.push(name);
    }
  }
  if (tableNames.length) return unique(tableNames);
  if (key === "dataLists") return unique(headingNames.filter((name) => !/\b(?:schema|field|fields|table|selection|template|view|views)\b/i.test(name)));
  return unique(tableNames);
}

function collectNavigationItemsByGroup(section) {
  const byGroup = {};
  for (const table of parseMarkdownTables(section)) {
    if (!table.headers.includes("Group") || !table.headers.includes("Item")) continue;
    for (const row of table.rows) {
      const group = cleanResourceName(row.Group);
      const item = cleanResourceName(row.Item || row["Target Resource"]);
      const target = cleanResourceName(row["Target Resource"] || item);
      const type = cleanResourceName(row["Yeeflow Resource Type"] || row.Type || "");
      const icon = cleanResourceName(row.Icon || "");
      if (!group || !item || isNonResourceName(group) || isNonResourceName(item)) continue;
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push({ title: item, target: target || item, type, icon });
    }
  }
  return byGroup;
}

function collectDataListViewRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+13\.\s+Data List Views Plan/im);
  if (!section.trim()) return [];
  const records = [];
  for (const table of parseMarkdownTables(section)) {
    const headers = table.headers.map((header) => normKey(header));
    const viewColumn = findHeaderIndex(headers, ["view name", "view"]);
    const listColumn = findHeaderIndex(headers, ["data list", "list/library", "list", "library", "data list or library"]);
    const urlColumn = findHeaderIndex(headers, ["url / route key", "route key", "url"]);
    if (viewColumn === -1 || listColumn === -1) continue;
    for (const row of table.rows) {
      const cells = table.headers.map((header) => row[header] || "");
      const viewName = cleanResourceName(cells[viewColumn]);
      const listName = cleanResourceName(cells[listColumn]);
      if (!viewName || !listName || isNonResourceName(viewName) || isNonResourceName(listName)) continue;
      records.push({
        viewName,
        listName,
        routeKey: cleanResourceName(cells[urlColumn]) || slugify(viewName),
      });
    }
  }
  return unique(records.map((record) => `${normKey(record.viewName)}|${normKey(record.listName)}`))
    .map((key) => records.find((record) => `${normKey(record.viewName)}|${normKey(record.listName)}` === key))
    .filter(Boolean);
}

function collectReverseRelatedPlanRows(planText) {
  const section = extractNumberedSection(planText, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim() || !/Reverse-Related Collection Selection/i.test(section)) return [];
  const rows = [];
  const subsections = extractSubsections(section, /Reverse-Related Collection Selection/i);
  for (const subsection of subsections) {
    for (const table of parseMarkdownTables(subsection)) {
      const headers = table.headers.map((header) => normKey(header));
      const hostColumn = findHeaderIndex(headers, ["host data list", "host list", "parent data list"]);
      const formColumn = findHeaderIndex(headers, ["view item form", "view form", "custom form"]);
      const childColumn = findHeaderIndex(headers, ["related child list", "child list", "related list"]);
      const lookupColumn = findHeaderIndex(headers, ["child lookup field", "lookup field"]);
      const titleColumn = findHeaderIndex(headers, ["section title", "title"]);
      const templateColumn = findHeaderIndex(headers, ["collection template", "collection presentation", "template"]);
      const searchColumn = findHeaderIndex(headers, ["search"]);
      const addColumn = findHeaderIndex(headers, ["add record", "add"]);
      const defaultColumn = findHeaderIndex(headers, ["default value", "default"]);
      if (hostColumn === -1 || childColumn === -1 || lookupColumn === -1) continue;
      for (const row of table.rows) {
        const cells = table.headers.map((header) => row[header] || "");
        const hostList = cleanResourceName(cells[hostColumn]);
        const childList = cleanResourceName(cells[childColumn]);
        const childLookupField = cleanResourceName(cells[lookupColumn]);
        if (!hostList || !childList || !childLookupField || isNonResourceName(hostList) || isNonResourceName(childList) || isNonResourceName(childLookupField)) continue;
        rows.push({
          hostList,
          viewItemForm: cleanResourceName(cells[formColumn]),
          childList,
          childLookupField,
          sectionTitle: cleanResourceName(cells[titleColumn]) || `${childList} Related Records`,
          collectionTemplate: cleanResourceName(cells[templateColumn]) || "collection_control_grid_table",
          search: cleanResourceName(cells[searchColumn]),
          addRecord: cleanResourceName(cells[addColumn]),
          defaultValue: cleanResourceName(cells[defaultColumn]),
        });
      }
    }
  }
  return unique(rows.map((record) => `${normKey(record.hostList)}|${normKey(record.viewItemForm)}|${normKey(record.childList)}|${normKey(record.childLookupField)}`))
    .map((key) => rows.find((record) => `${normKey(record.hostList)}|${normKey(record.viewItemForm)}|${normKey(record.childList)}|${normKey(record.childLookupField)}` === key))
    .filter(Boolean);
}

function extractSubsections(text, marker) {
  const flags = marker.flags.includes("g") ? marker.flags : `${marker.flags}g`;
  const globalMarker = new RegExp(marker.source, flags);
  const matches = [...text.matchAll(globalMarker)];
  if (!matches.length) return [];
  return matches.map((match) => {
    const start = match.index;
    const remainder = text.slice(start + match[0].length);
    const next = remainder.search(/\n#{2,4}\s+/);
    return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
  });
}

function extractSubsection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const remainder = text.slice(start + match[0].length);
  const next = remainder.search(/\n#{2,4}\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function fieldSpecsForList(planDemand, listName) {
  const specs = planDemand.dataListFieldSpecs?.[normKey(listName)] || [];
  const normalized = [];
  const seen = new Set();
  const usedFieldNames = new Set();
  const reservedFieldNames = new Set(specs.map((field) => schemaSafeFieldName(field.fieldName)).filter((fieldName) => fieldName && normKey(fieldName) !== "title").map((fieldName) => normKey(fieldName)));
  const add = (field) => {
    const explicitFieldName = schemaSafeFieldName(field.fieldName);
    const displayName = cleanResourceName(field.displayName || explicitFieldName);
    if (!displayName) return;
    const displayKey = normKey(displayName);
    if (seen.has(displayKey)) return;
    const fieldType = cleanResourceName(field.fieldType) || "Text";
    let fieldName = explicitFieldName || inferFieldKey(displayName, fieldType, normalized.length);
    if (normKey(fieldName) === "title") {
      const existingTitle = normalized.find((item) => normKey(item.fieldName) === "title");
      if (existingTitle) {
        if (displayKey !== "title" && normKey(existingTitle.displayName) === "title") {
          existingTitle.displayName = displayName;
          existingTitle.fieldType = "Text";
          existingTitle.controlType = cleanResourceName(field.controlType) || "input";
          existingTitle.choiceValues = cleanResourceName(field.choiceValues);
        }
        seen.add(displayKey);
        return;
      }
    }
    if (normKey(fieldName) !== "title" && usedFieldNames.has(normKey(fieldName))) {
      fieldName = nextAvailableFieldName(fieldType, usedFieldNames, reservedFieldNames);
    }
    if (!fieldName) return;
    seen.add(displayKey);
    usedFieldNames.add(normKey(fieldName));
    normalized.push({
      displayName,
      fieldName,
      fieldType,
      controlType: cleanResourceName(field.controlType) || inferControlType(field.fieldType),
      choiceValues: cleanResourceName(field.choiceValues),
      lookupTarget: cleanResourceName(field.lookupTarget),
    });
  };
  add({ displayName: "Title", fieldName: "Title", fieldType: "Text", controlType: "input" });
  for (const spec of specs) add(spec);
  return normalized.slice(0, 16);
}

function nextAvailableFieldName(fieldType, usedFieldNames, reservedFieldNames = new Set()) {
  const prefix = fieldPrefix(fieldType);
  for (let index = 1; index < 200; index += 1) {
    const candidate = `${prefix}${index}`;
    if (!usedFieldNames.has(normKey(candidate)) && !reservedFieldNames.has(normKey(candidate))) return candidate;
  }
  return `${prefix}${usedFieldNames.size + 1}`;
}

function approvalFieldSpecsForForm(planDemand, formName) {
  const planned = planDemand.approvalFormFieldSpecs?.[normKey(formName)] || {};
  const submission = uniqueApprovalFieldSpecs(Array.isArray(planned.submission) ? planned.submission : []);
  const task = uniqueApprovalFieldSpecs(Array.isArray(planned.task) ? planned.task : []);
  return {
    submission,
    task: task.length ? task : submission,
  };
}

function approvalWorkflowNodeSpecsForForm(planDemand, formName) {
  return uniqueApprovalWorkflowNodes(planDemand.approvalWorkflowNodeSpecs?.[normKey(formName)] || []);
}

function uniqueApprovalFieldSpecs(fields) {
  const normalized = [];
  const seen = new Set();
  for (const field of fields) {
    const displayName = cleanResourceName(field?.displayName);
    if (!displayName || isNonResourceName(displayName)) continue;
    const fieldName = cleanResourceName(field?.fieldName || inferFieldKey(displayName, field?.fieldType || "Text", normalized.length));
    const key = normKey(fieldName || displayName);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      displayName,
      fieldName,
      fieldType: cleanResourceName(field?.fieldType) || "Text",
      controlType: cleanResourceName(field?.controlType) || inferControlType(field?.fieldType || ""),
    });
  }
  return normalized;
}

function uniqueApprovalWorkflowNodes(nodes) {
  const normalized = [];
  const seen = new Set();
  for (const node of nodes || []) {
    const nodeName = cleanResourceName(node?.nodeName);
    const nodeType = normalizeApprovalWorkflowNodeType(node?.nodeType);
    if (!nodeName || !nodeType || isNonResourceName(nodeName)) continue;
    const key = `${normKey(nodeName)}::${nodeType.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      ...node,
      nodeName,
      nodeType,
      description: cleanResourceName(node?.description),
      assigneeRole: cleanResourceName(node?.assigneeRole),
      assignmentStrategy: cleanResourceName(node?.assignmentStrategy),
      outcomes: cleanResourceName(node?.outcomes),
      conditionBranch: cleanResourceName(node?.conditionBranch),
      dataReadWrite: cleanResourceName(node?.dataReadWrite),
      proofBoundary: cleanResourceName(node?.proofBoundary),
    });
  }
  return normalized;
}

function normalizeApprovalWorkflowNodeType(value) {
  const text = cleanResourceName(value);
  const key = normKey(text);
  if (!key) return "";
  if (/^start/.test(key)) return "StartNoneEvent";
  if (/end\s*reject|reject\s*end/.test(key)) return "EndRejectEvent";
  if (/^end/.test(key)) return "EndNoneEvent";
  if (/sequence|flow|transition/.test(key)) return "SequenceFlow";
  if (/content\s*list|service\s*action|serviceaction|action\s*node|create|update|archive|persist|master/.test(key) || text === "ContentList") return "ContentList";
  if (/candidate/.test(key)) return "CandidateTask";
  if (/assignment|approval|review|task|multi/.test(key) || text === "MultiAssignmentTask" || text === "AssignmentTask") return "MultiAssignmentTask";
  return text.replace(/[^A-Za-z0-9_]/g, "") || "MultiAssignmentTask";
}

function resolveMaterializationTenantId(options = {}) {
  const explicit = cleanResourceName(options.tenantId);
  if (explicit) return explicit;
  const profile = cleanResourceName(process.env.YEEFLOW_PROFILE).toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const profileTenant = profile ? cleanResourceName(process.env[`YEEFLOW_${profile}_TENANT_ID`]) : "";
  return profileTenant || cleanResourceName(process.env.YEEFLOW_TENANT_ID);
}

function assignCustomFormLayoutPositions(planDemand, dataListNames) {
  const listIndexByName = new Map(dataListNames.map((name, index) => [normKey(name), index]));
  const offsetsByList = new Map();
  return ensureRequiredCustomFormRecords(planDemand, dataListNames)
    .map((record) => {
      const listIndex = listIndexByName.has(normKey(record.listName)) ? listIndexByName.get(normKey(record.listName)) : 0;
      const next = (offsetsByList.get(listIndex) || 0) + 1;
      offsetsByList.set(listIndex, next);
      return { ...record, listIndex, layoutIndex: next };
    });
}

function assignAllCustomFormLayoutPositions(planDemand, dataListNames) {
  const assignments = assignCustomFormLayoutPositions(planDemand, dataListNames);
  const assignedFormKeys = new Set(assignments.map((assignment) => `${normKey(assignment.listName)}::${normKey(assignment.formName)}`));
  const offsetsByList = new Map();
  for (const assignment of assignments) {
    offsetsByList.set(assignment.listIndex, Math.max(offsetsByList.get(assignment.listIndex) || 0, assignment.layoutIndex));
  }
  const fallbackAssignments = [];
  for (const formName of planDemand.resources.customForms) {
    const inferredListName = inferCustomFormHostListName(formName, dataListNames);
    if (!inferredListName) continue;
    const formKey = `${normKey(inferredListName)}::${normKey(formName)}`;
    if (assignedFormKeys.has(formKey)) continue;
    const listIndex = dataListNames.findIndex((name) => normKey(name) === normKey(inferredListName));
    if (listIndex < 0) continue;
    const next = (offsetsByList.get(listIndex) || 0) + 1;
    offsetsByList.set(listIndex, next);
    assignedFormKeys.add(formKey);
    fallbackAssignments.push({
      listName: inferredListName,
      formName,
      formType: "",
      selectedTemplate: "",
      openIn: "",
      generatedByPolicy: "fallback-custom-form-from-resource-list",
      listIndex,
      layoutIndex: next,
    });
  }
  return assignments.concat(fallbackAssignments);
}

function inferCustomFormHostListName(formName, dataListNames) {
  const formKey = normKey(formName);
  const exact = dataListNames.find((name) => formKey.includes(normKey(name)) || normKey(name).includes(formKey.replace(/\b(new|edit|view|item|form|details?)\b/g, "").trim()));
  if (exact) return exact;
  return dataListNames.length === 1 ? dataListNames[0] : "";
}

function navigationGroupNames(planDemand) {
  return planDemand.resources.navigationGroups.length ? planDemand.resources.navigationGroups : ["Workspace"];
}

function ensureRequiredCustomFormRecords(planDemand, dataListNames) {
  const records = [...(planDemand.customFormRecords || [])];
  for (const listName of dataListNames) {
    const listRecords = records.filter((record) => normKey(record.listName) === normKey(listName));
    if (!listRecords.some((record) => customFormUsage(record) === "newEdit")) {
      records.push({
        listName,
        formName: `${listName} New/Edit Form`,
        formType: "New/Edit",
        generatedByPolicy: "required-new-edit-custom-form",
      });
    }
    if (!listRecords.some((record) => customFormUsage(record) === "view")) {
      records.push({
        listName,
        formName: `${listName} View Item`,
        formType: "View",
        generatedByPolicy: "required-view-custom-form",
      });
    }
  }
  return records;
}

function customFormUsage(record) {
  const text = `${record?.formType || ""} ${record?.formName || ""}`.toLowerCase();
  if (/\bview\b|detail/.test(text)) return "view";
  if (/new\s*\/\s*edit|\bnew\b|\bedit\b|create/.test(text)) return "newEdit";
  return "";
}

function buildDataListFormDisplaySettings({ customLayoutsForList, ids }) {
  const byUsage = new Map();
  const viewAssignmentById = new Map();
  for (const assignment of customLayoutsForList) {
    const usage = customFormUsage(assignment);
    if (!usage || byUsage.has(usage)) continue;
    const layoutId = stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]);
    byUsage.set(usage, layoutId);
    if (usage === "view") viewAssignmentById.set(layoutId, assignment);
  }
  const newEditLayoutId = byUsage.get("newEdit") || byUsage.get("view") || "";
  const viewLayoutId = byUsage.get("view") || newEditLayoutId;
  const settings = {
    add: newEditLayoutId,
    edit: newEditLayoutId,
    view: viewLayoutId,
  };
  if (isWorkbenchCustomForm(viewAssignmentById.get(viewLayoutId))) {
    settings.opentype = { view: "new" };
    settings.modalsize = {};
  }
  return settings;
}

function isWorkbenchCustomForm(record) {
  const text = `${record?.formType || ""} ${record?.formName || ""} ${record?.selectedTemplate || ""} ${record?.openIn || ""}`.toLowerCase();
  return /\bworkbench\b/.test(text) || text.includes("data_list_form_layout_workbench");
}

function buildFieldRecord({ field, fieldIndex, listId, fieldId, lookupTargetListId = "" }) {
  const fieldType = normalizeFieldType(field.fieldType);
  const type = controlTypeForFieldType(field, fieldType);
  const isTitle = fieldIndex === 0 || /^title$/i.test(field.fieldName);
  const fieldName = isTitle ? "Title" : schemaSafeFieldName(field.fieldName) || `${fieldPrefix(field.fieldType || fieldType)}${fieldIndex}`;
  const schemaFieldIndex = isTitle ? 0 : fieldIndexFromName(fieldName) || fieldIndex;
  const rules = buildFieldRules({ field, type, lookupTargetListId });
  return {
    FieldID: fieldId,
    ListID: listId,
    FieldName: fieldName,
    FieldType: fieldType,
    FieldIndex: schemaFieldIndex,
    DisplayName: field.displayName,
    InternalName: fieldName,
    Type: type,
    Status: isTitle ? 0 : 1,
    Category: 0,
    DefaultValue: defaultValueForFieldType(fieldType),
    Rules: rules,
    IsSort: false,
    IsSystem: isTitle,
    IsUnique: false,
    IsIndex: isTitle,
    Ext1: "",
    Ext2: "",
    Ext3: "",
  };
}

function controlTypeForFieldType(field, fieldType) {
  if (fieldType === "Bit") return "switch";
  return normalizeControlType(field.controlType || field.fieldType);
}

function cleanFieldName(value) {
  const text = cleanResourceName(value).replace(/[^A-Za-z0-9_]/g, "");
  return text || "";
}

function schemaSafeFieldName(value) {
  const text = cleanFieldName(value);
  if (/^Title$/i.test(text)) return "Title";
  return /^(Text|Bit|Decimal|Datetime)[1-9]\d*$/.test(text) ? text : "";
}

function fieldIndexFromName(value) {
  const match = String(value || "").match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function defaultValueForFieldType(fieldType) {
  return fieldType === "Bit" ? "0" : "";
}

function buildCustomFormLayout({ layoutId, listId, listName, formName, formType = "", selectedTemplate = "", openIn = "", fields, planDemand = {}, listMetaByName = new Map(), rootListSetId = "" }) {
  const templateKind = isWorkbenchCustomForm({ formName, formType, selectedTemplate, openIn }) ? "workbench" : (/\bview\b|detail/i.test(`${formType} ${formName}`) ? "view" : "newEdit");
  const templateId = templateKind === "workbench" ? "data_list_form_layout_workbench" : (templateKind === "view" ? "data_list_form_layout_view_item_v1_1" : "data_list_form_layout_new_edit_v1_1");
  const resource = materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields, planDemand, listMetaByName, rootListSetId, layoutId });
  const resourceJson = JSON.stringify(resource);
  return {
    ListID: listId,
    LayoutID: layoutId,
    Title: formName,
    Type: 1,
    LayoutView: resourceJson,
    IsDefault: false,
    IsItemPerm: false,
    Perms: [],
    LayoutInResources: [
      {
        ID: layoutId,
        RefId: layoutId,
        Resource: resourceJson,
      },
    ],
  };
}

function materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields, planDemand = {}, listMetaByName = new Map(), rootListSetId = "", layoutId = "" }) {
  const templateFile = DATA_LIST_FORM_TEMPLATE_PATHS[templateKind];
  const template = JSON.parse(fs.readFileSync(templateFile, "utf8"));
  const resource = clone(template.templateResource);
  resource.derivedFromDataListFormLayoutTemplate = templateId;
  resource.dataListFormLayoutTemplateId = templateId;
  resource.title = formName;
  removeOperationsWithoutActions(resource);
  setTemplateText(resource, "section_title_text", formName);
  setTemplateText(resource, "section_title_description", templateKind === "newEdit" ? `Capture and maintain ${listName} item details.` : `Review ${listName} details and related context.`);
  if (templateKind === "view" || templateKind === "workbench") {
    setTemplateText(resource, "page_title_text", formName);
    setTemplateText(resource, "page_title_description", `View ${listName} record details and related operational context.`);
  }
  const slot = findBusinessSectionContentArea(resource);
  if (slot) {
    slot.children = [buildDataListFormFieldsGrid({ fields: fields.slice(0, 12), formName, listId, listName, templateKind })];
  }
  removeAllByIdentity(resource, "Operations");
  removeAllByIdentity(resource, "kpi_metrics_wrapper");
  if (templateKind === "view" || templateKind === "workbench") {
    appendReverseRelatedCollectionSections(resource, {
      planDemand,
      listMetaByName,
      hostListName: listName,
      formName,
      rootListSetId,
      layoutId,
    });
  }
  scrubDashboardSourceTemplateResidue(resource, { listName, scrubMetadata: true });
  removeResidualTemplateSectionHeaders(resource);
  removeEmptySectionTitleAreas(resource);
  removeEmptyBusinessSections(resource);
  return resource;
}

function appendReverseRelatedCollectionSections(resource, { planDemand, listMetaByName, hostListName, formName, rootListSetId, layoutId }) {
  const records = (planDemand.reverseRelatedRecords || []).filter((record) => {
    if (normKey(record.hostList) !== normKey(hostListName)) return false;
    if (!record.viewItemForm) return true;
    return normKey(record.viewItemForm) === normKey(formName);
  });
  if (!records.length) return;
  const contentRoot = findFirstByIdentity(resource, "content") || findFirstByIdentity(resource, "Content");
  if (!contentRoot) return;
  contentRoot.children = Array.isArray(contentRoot.children) ? contentRoot.children : [];
  for (const [index, record] of records.entries()) {
    const childMeta = listMetaByName.get(normKey(record.childList));
    if (!childMeta?.listId) continue;
    const section = buildReverseRelatedCollectionSection({
      record,
      childMeta,
      hostListName,
      formName,
      rootListSetId,
      detailLayoutId: childMeta.detailLayoutId || layoutId || "",
      index,
    });
    if (section) {
      contentRoot.children.push(section);
      addDataListFormFilterVar(resource, section?.attrs?.reverseRelated?.searchFilterVar);
    }
  }
}

function buildReverseRelatedCollectionSection({ record, childMeta, hostListName, formName, rootListSetId, detailLayoutId, index }) {
  const sectionId = `${slugify(formName)}_${slugify(record.childList)}_reverse_related_section_${index + 1}`;
  const searchFilterVar = `filter_${slugify(record.childList)}_${index + 1}`.replace(/-/g, "_");
  const binding = `__filter_${searchFilterVar}`;
  const currentIdExpr = currentHostListDataIdExpression();
  const lookupField = resolveFieldSpec(childMeta, record.childLookupField)?.fieldName || record.childLookupField;
  const displayFields = fieldsForDynamicControls(childMeta).slice(0, 6);
  const searchFields = displayFields.map((field) => field.fieldName).filter(Boolean).slice(0, 3);
  const sectionTitle = record.sectionTitle || `${record.childList} Related Records`;
  const search = {
    id: crypto.randomUUID(),
    type: "search-filter",
    label: "Search items",
    name: `Search ${record.childList}`,
    title: `Search ${record.childList}`,
    binding,
    attrs: {
      common: {
        positioning: {
          widthtype: [null, "3", "1"],
          width: [null, 200],
        },
      },
      placeholder: "Search items",
      edit: {
        pcolor: "var(--c--neutral-dark-hover)",
        normal: {
          border: {
            radius: [null, { top: "--sp--s100", right: "--sp--s100", bottom: "--sp--s100", left: "--sp--s100" }],
          },
        },
      },
    },
    displayLabel: [null, false],
  };
  const operationsChildren = [search];
  if (!/^no|false|not/i.test(record.addRecord || "")) {
    operationsChildren.push(buildReverseRelatedAddButton({ record: { ...record, childLookupField: lookupField }, childMeta, sectionId, currentIdExpr, rootListSetId }));
  }
  return {
    id: crypto.randomUUID(),
    type: "container",
    label: "Container",
    name: sectionTitle,
    title: sectionTitle,
    nv_label: "1_columns_section",
    reverseRelatedCollectionSection: true,
    attrs: {
      reverseRelatedCollectionSection: true,
      reverseRelated: {
        hostList: hostListName,
        childList: record.childList,
        childListId: stringId(childMeta.listId),
        childLookupField: lookupField,
        childLookupFieldResolved: lookupField,
        childLookupFieldPlanned: record.childLookupField,
        searchFilterVar,
        searchFilterBinding: binding,
        allowAdd: !/^no|false|not/i.test(record.addRecord || ""),
      },
      style: {
        direction: [null, "column"],
        gap: [null, "--sp--s200"],
      },
    },
    children: [
      {
        id: crypto.randomUUID(),
        type: "container",
        label: "Container",
        nv_label: "content_card_wrapper",
        attrs: standardDataListViewContentCardAttrs(),
        children: [
          {
            id: crypto.randomUUID(),
            type: "container",
            label: "Container",
            nv_label: "section_title_area",
            attrs: {
              style: {
                direction: [null, "row"],
                gap: [null, "--sp--s200"],
                justify_content: [null, "space-between"],
                align_items: [null, "center"],
              },
            },
            children: [
              {
                id: crypto.randomUUID(),
                type: "container",
                label: "Container",
                nv_label: "section_title_header",
                attrs: {
                  style: {
                    direction: [null, "column"],
                    gap: [null, "--sp--s075"],
                    justify_content: [null, "flex-start"],
                    align_items: [null, "flex-start"],
                  },
                },
                children: [
                  {
                    id: crypto.randomUUID(),
                    type: "heading",
                    label: "Text",
                    nv_label: "section_title_text",
                    attrs: { headc: { title: { value: sectionTitle, variable: null } }, heads: { ty: [null, "h5-semi-bold"] } },
                  },
                ],
              },
            ],
          },
          {
            id: crypto.randomUUID(),
            type: "container",
            label: "Container",
            nv_label: "section_content_area",
            attrs: {
              style: {
                direction: [null, "column"],
                gap: [null, "--sp--s200"],
                justify_content: [null, "flex-start"],
                align_items: [null, "flex-start"],
              },
            },
            children: [
              buildOfficialReverseRelatedCollectionWrapper({
                sectionId,
                record,
                childMeta,
                rootListSetId,
                lookupField,
                currentIdExpr,
                binding,
                searchFields,
                displayFields,
                sectionTitle,
                operationsChildren,
              }),
            ],
          },
        ],
      },
    ],
  };
}

function standardDataListViewContentCardAttrs() {
  return {
    style: {
      gap: [null, "--sp--s200"],
      direction: [null, "column"],
      widthtype: [null, "1"],
      align_items: [null, "stretch"],
      justify_content: [null, "flex-start"],
    },
    common: {
      padding: [null, { top: 28, right: 28, bottom: 28, left: 28 }],
      background: {
        normal: {
          type: "classic",
          classic: { color: "#ffffff" },
        },
      },
      border: {
        normal: {
          type: "1",
          width: [null, { top: 1, right: 1, bottom: 1, left: 1 }],
          color: "#d8e1ef",
          radius: [null, { top: 16, right: 16, bottom: 16, left: 16 }],
        },
      },
      shadow: {
        normal: {
          type: "drop",
          x: 0,
          y: 8,
          blur: 20,
          spread: 0,
          color: "rgba(15, 23, 42, 0.06)",
        },
      },
    },
    fullWidthParityWithGoldenReference: true,
  };
}

function buildOfficialReverseRelatedCollectionWrapper({ sectionId, record, childMeta, rootListSetId, lookupField, currentIdExpr, binding, searchFields, displayFields, sectionTitle, operationsChildren }) {
  const template = loadCollectionTemplate("collection_control_grid_table");
  const wrapper = clone(template.templateResource?.rootContainer || template.rootContainer || template);
  reinstantiateTemplateUuidValues(wrapper);
  wrapper.name = sectionTitle;
  wrapper.title = sectionTitle;
  wrapper.collectionTemplateId = "collection_control_grid_table";
  wrapper.derivedFromCollectionTemplate = "collection_control_grid_table";
  wrapper.reverseRelatedCollectionWrapper = true;
  wrapper.attrs = {
    ...(wrapper.attrs || {}),
    reverseRelatedCollectionWrapper: true,
  };

  removeDescendantControls(wrapper, isReverseRelatedOperationResidue);
  setTitleText(wrapper, sectionTitle);
  configureReverseRelatedOperations(wrapper, operationsChildren);
  configureReverseRelatedCollectionRuntime(wrapper, {
    record,
    childMeta,
    rootListSetId,
    lookupField,
    currentIdExpr,
    binding,
    searchFields,
  });
  configureReverseRelatedGridColumns(wrapper, displayFields);
  rewriteCollectionTemplateRuntimeRefs(wrapper, {
    rootListSetId,
    listId: childMeta.listId,
    detailLayoutId: "",
  });
  enforceCollectionTemplateStyleContracts(wrapper);
  return wrapper;
}

function configureReverseRelatedOperations(wrapper, operationsChildren) {
  const opNormal = findFirstByIdentity(wrapper, "op_normal");
  if (opNormal) {
    opNormal.children = operationsChildren;
  }
}

function configureReverseRelatedCollectionRuntime(wrapper, { record, childMeta, rootListSetId, lookupField, currentIdExpr, binding, searchFields }) {
  const collection = findFirstByType(wrapper, "collection");
  if (!collection) return;
  collection.collectionTemplateId = "collection_control_grid_table";
  collection.derivedFromCollectionTemplate = "collection_control_grid_table";
  collection.reverseRelatedCollection = true;
  collection.attrs = {
    data: {
      list: { AppID: 41, ListID: stringId(childMeta.listId), Type: 1, Title: record.childList, ListSetID: stringId(rootListSetId) },
      filter: [{
        key: crypto.randomUUID(),
        pre: "and",
        left: lookupField,
        op: "0",
        right: [clone(currentIdExpr)],
        showCus: false,
      }],
      fulltext: [{
        fields: searchFields.length ? searchFields : [primaryFieldName(childMeta)],
        value: [{ exprType: "variable", valueType: "string", id: binding, type: "expr", name: searchFilterNameFromBinding(binding) }],
      }],
      link: "default",
    },
    layout: clone(collection.attrs?.layout || {}),
    actions: [],
    pagination: clone(collection.attrs?.pagination || {}),
  };
}

function configureReverseRelatedGridColumns(wrapper, displayFields) {
  const fields = displayFields.length ? displayFields : [{ fieldName: "Title", displayName: "Title" }];
  const header = findFirstByIdentity(wrapper, "grid_table_col_header");
  const collection = findFirstByType(wrapper, "collection");
  const itemGrid = collection ? findFirstByIdentity(collection, "grid_col_item") : null;
  if (!header || !itemGrid) return;

  const headerPrototypes = {
    title: clone(header.children?.find((child) => hasIdentity(child, "grid_table_col_header_title_column")) || header.children?.[0] || {}),
    standard: clone(header.children?.find((child) => hasIdentity(child, "grid_table_col_header_column")) || header.children?.[1] || header.children?.[0] || {}),
  };
  const itemPrototypes = {
    title: clone(itemGrid.children?.find((child) => hasIdentity(child, "grid_table_col_item_title_column")) || itemGrid.children?.[0] || {}),
    standard: clone(itemGrid.children?.find((child) => hasIdentity(child, "grid_table_col_item_column")) || itemGrid.children?.[1] || itemGrid.children?.[0] || {}),
  };

  header.children = fields.map((field, index) => buildReverseRelatedHeaderCell(headerPrototypes, field, index));
  itemGrid.children = fields.map((field, index) => buildReverseRelatedItemCell(itemPrototypes, field, index));
  normalizeGridColumnDefinition(header, fields.length);
  normalizeGridColumnDefinition(itemGrid, fields.length);
}

function buildReverseRelatedHeaderCell(prototypes, field, index) {
  const cell = clone(index === 0 ? prototypes.title : prototypes.standard);
  cell.id = crypto.randomUUID();
  cell.nv_label = index === 0 ? "grid_table_col_header_title_column" : "grid_table_col_header_column";
  cell.nav_label = cell.nv_label;
  const heading = findDescendants(cell, (node) => String(node?.type || "") === "heading")[0];
  if (heading) {
    heading.id = crypto.randomUUID();
    heading.nv_label = "grid_table_col_header_text";
    heading.nav_label = "grid_table_col_header_text";
    setHeadingText(heading, field.displayName || field.DisplayName || field.fieldName || field.FieldName || "Field");
  }
  return cell;
}

function buildReverseRelatedItemCell(prototypes, field, index) {
  const cell = clone(index === 0 ? prototypes.title : prototypes.standard);
  cell.id = crypto.randomUUID();
  cell.nv_label = index === 0 ? "grid_table_col_item_title_column" : "grid_table_col_item_column";
  cell.nav_label = cell.nv_label;
  cell.children = [buildReverseRelatedDynamicField(field, index)];
  return cell;
}

function buildReverseRelatedDynamicField(field, index) {
  return {
    id: crypto.randomUUID(),
    type: "dynamic-field",
    label: "Dynamic field",
    name: field.displayName || field.fieldName,
    title: field.displayName || field.fieldName,
    nv_label: index === 0 ? "reverse_related_item_title" : `reverse_related_item_field_${index + 1}`,
    attrs: {
      item_style: {
        ty: {
          size: [null, index === 0 ? 14 : 12],
          wei: index === 0 ? "500" : "0",
        },
      },
      source: "3",
      "obj-f": field.fieldName,
      common: { positioning: { widthtype: [null, "2"] } },
    },
  };
}

function normalizeGridColumnDefinition(grid, columnCount) {
  const count = Math.max(1, Math.min(6, columnCount || 1));
  grid.attrs = grid.attrs || {};
  const first = { value: count > 1 ? 2 : 1, unit: "fr" };
  const rest = Array.from({ length: Math.max(0, count - 1) }, () => ({ value: 1, unit: "fr" }));
  const columns = [first, ...rest];
  if (grid.attrs.columns && !Array.isArray(grid.attrs.columns)) {
    grid.attrs.columns = {
      ...grid.attrs.columns,
      "1": {
        ...(grid.attrs.columns["1"] || {}),
        list: clone(columns),
        last: clone(columns[columns.length - 1]),
      },
    };
    if (grid.attrs.columns["3"]) {
      grid.attrs.columns["3"] = {
        ...(grid.attrs.columns["3"] || {}),
        list: [{ value: 1, unit: "fr" }],
        last: { value: 1, unit: "fr" },
      };
    }
  } else {
    grid.attrs.columns = {
      "1": { list: clone(columns), last: clone(columns[columns.length - 1]) },
    };
  }
}

function removeDescendantControls(root, predicate) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      return !predicate(child);
    });
  };
  visit(root);
}

function isTemplateAddActionButton(node) {
  if (!node || String(node.type || "") !== "action_button") return false;
  const attrs = node.attrs || {};
  const actionType = String(attrs["action-type"] || attrs.actionType || attrs.operation || "").trim();
  const text = identityCandidates(node).concat([node?.label, attrs?.label?.value, attrs?.text?.value]).filter(Boolean).join(" ");
  return actionType === "5" || /\badd\b|new item|create/i.test(text);
}

function isReverseRelatedOperationResidue(node) {
  if (!node || typeof node !== "object") return false;
  const type = String(node.type || "").toLowerCase();
  const ids = identityCandidates(node).join(" ");
  if (type === "dropbar") return true;
  if (/grid_table_col_item_op_menu|grid_table_col_item_operations|card_col_item_operations|row[_-]?operations/i.test(ids)) return true;
  if (type === "action_button") {
    const attrs = node.attrs || {};
    const text = [
      ids,
      node.label,
      node.title,
      node.name,
      attrs.operation,
      attrs["action-type"],
      attrs?.label?.value,
      attrs?.text?.value,
    ].filter(Boolean).join(" ");
    return /edit|delete|remove|bulk|selected|operation|op_menu/i.test(text);
  }
  return false;
}

function buildReverseRelatedAddButton({ record, childMeta, sectionId, currentIdExpr, rootListSetId }) {
  const actionId = crypto.randomUUID();
  return {
    id: `${sectionId}_add_button`,
    type: "action_button",
    label: `Add ${record.childList}`,
    name: `Add ${record.childList}`,
    title: `Add ${record.childList}`,
    nv_label: "reverse_related_add_button",
    attrs: {
      "action-type": "5",
      operation: "add",
      control_action: actionId,
      data: {
        list: { AppID: 41, ListID: stringId(childMeta.listId), Type: 1, Title: record.childList, ListSetID: stringId(rootListSetId) },
      },
      passvalues: [{
        Name: record.childLookupField,
        FieldName: record.childLookupField,
        Value: [clone(currentIdExpr)],
      }],
      button: {
        normal: { border: { type: "0" }, c: "var(--c--background)", bg: "var(--c--primary)" },
      },
      common: {
        positioning: {
          widthtype: [null, "2"],
        },
        container: {
          size: [null, "grow", "none"],
        },
      },
    },
  };
}

function addDataListFormFilterVar(resource, filterVarId) {
  const id = String(filterVarId || "").trim();
  if (!id) return;
  resource.filterVars = Array.isArray(resource.filterVars) ? resource.filterVars : [];
  if (resource.filterVars.some((item) => String(item?.id || "").trim() === id)) return;
  resource.filterVars.push({ id, idx: crypto.randomUUID() });
}

function searchFilterNameFromBinding(binding) {
  const text = String(binding || "").trim();
  if (text.startsWith("__filter_")) return text.slice("__filter_".length);
  return text;
}

function currentHostListDataIdExpression() {
  return {
    exprType: "list_field",
    valueType: "string",
    id: "ListDataID",
    prop: "ListDataID",
    type: "expr",
    name: "List Fields:Id",
  };
}

function buildDataListFormFieldsGrid({ fields, formName, listId, listName, templateKind }) {
  const template = JSON.parse(fs.readFileSync(DATA_LIST_FORM_FIELDS_GRID_TEMPLATE_PATH, "utf8"));
  const wrapper = clone(template._ak_c || template.templateResource || template);
  wrapper.id = "form_grid_fields_wrapper";
  wrapper.nv_label = "form_grid_fields_wrapper";
  wrapper.dataListFormFieldsTemplateId = "data_list_form_fields_grid_v1_1";
  wrapper.derivedFromDataListFormFieldsTemplate = "data_list_form_fields_grid_v1_1";
  wrapper.children = fields.map((field, index) => buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind }));
  return wrapper;
}

function buildDataListFormFieldControl({ field, index, formName, listId, listName, templateKind }) {
  const type = (templateKind === "view" || templateKind === "workbench") && !isSubListFormField(field) ? dynamicControlTypeForField(field) : normalizeControlType(field.Type || field.FieldType || field.DisplayName);
  if (isSubListFormField(field, type)) {
    return buildDataListFormSubListControl({ field, index, formName, listId, listName });
  }
  const fullRow = isFullRowFormField(field, type);
  const control = {
    type,
    id: `${slugify(formName)}_${slugify(field.FieldName)}_${index + 1}`,
    name: field.DisplayName,
    title: field.DisplayName,
    label: field.DisplayName,
    nv_label: fieldNavLabel(field),
    binding: field.FieldName,
    fieldID: field.FieldID,
    displayLabel: [null, true],
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      data: {
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: field.FieldName,
        fieldName: field.FieldName,
        fieldId: field.FieldID,
      },
    },
  };
  if (fullRow) {
    control.attrs.common.grid = { position: [null, { cSpan: 2 }, null, { cSpan: 1 }] };
  }
  return control;
}

function buildDataListFormSubListControl({ field, index, formName, listId, listName }) {
  const template = JSON.parse(fs.readFileSync(DATA_LIST_FORM_SUBLIST_TEMPLATE_PATH, "utf8"));
  const control = clone(template._ak_c || template.templateResource || template);
  const id = `${slugify(formName)}_${slugify(field.FieldName)}_${index + 1}`;
  control.id = id;
  control.name = field.DisplayName;
  control.title = field.DisplayName;
  control.label = field.DisplayName;
  control.nv_label = fieldNavLabel(field);
  control.binding = field.FieldName;
  control.fieldID = field.FieldID;
  control.dataListFormControlTemplateId = "data_list_form_control_sublist_v1_1";
  control.derivedFromDataListFormControlTemplate = "data_list_form_control_sublist_v1_1";
  control.attrs ||= {};
  control.attrs.common ||= {};
  control.attrs.common.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
  control.attrs.common.grid = { position: [null, { cSpan: 2 }, null, { cSpan: 1 }] };
  control.attrs.data = {
    list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
    field: field.FieldName,
    fieldName: field.FieldName,
    fieldId: field.FieldID,
  };
  for (const listField of Array.isArray(control.attrs["list-fields"]) ? control.attrs["list-fields"] : []) {
    if (listField?.control?.attrs) {
      listField.control.attrs.list_field_binding = field.FieldName;
      listField.control.attrs.list_control_id = id;
    }
  }
  return control;
}

function isFullRowFormField(field, controlType) {
  const raw = normKey(`${field?.DisplayName || ""} ${field?.FieldType || ""} ${field?.Type || ""} ${controlType || ""}`);
  return /textarea|multi line|multiline|richtext|rich text|sub list|sublist|\blist\b/.test(raw);
}

function isSubListFormField(field, controlType = "") {
  const raw = normKey(`${field?.DisplayName || ""} ${field?.FieldType || ""} ${field?.Type || ""} ${controlType || ""}`);
  return /sub list|sublist|\blist\b/.test(raw);
}

function fieldNavLabel(field) {
  return `field_${slugify(field?.FieldName || field?.DisplayName || "field")}`.replace(/-/g, "_");
}

function buildFieldRules({ field, type, lookupTargetListId = "" }) {
  if (type === "lookup") {
    if (!lookupTargetListId) return "";
    return JSON.stringify({
      listid: stringId(lookupTargetListId),
      listfield: "Title",
      displayField: "Title",
      fieldName: "Title",
      listtype: "select",
    });
  }
  const choiceTypes = new Set(["select", "radio", "checkbox", "tag"]);
  if (!choiceTypes.has(type)) return "";
  const values = (String(field.choiceValues || "")
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean)).concat(inferChoiceValues(field));
  const uniqueValues = unique(values).slice(0, 8);
  if (!uniqueValues.length) return "";
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const choices = uniqueValues.map((value, index) => ({
    key: String(index + 1),
    value,
    color: colors[index % colors.length],
  }));
  return JSON.stringify({
    choices,
    color_choices: choices,
    displayStyle: "dropdown",
    show_color: false,
  });
}

function inferChoiceValues(field) {
  if (String(field?.choiceValues || "").trim()) return [];
  const raw = normKey(`${field?.displayName || ""} ${field?.fieldName || ""} ${field?.fieldType || ""} ${field?.controlType || ""}`);
  if (/priority|urgency|severity|critical/.test(raw)) return ["Low", "Medium", "High", "Critical"];
  if (/condition|inspection|quality/.test(raw)) return ["Good", "Fair", "Damaged", "Lost"];
  if (/availability|available|reservation/.test(raw)) return ["Available", "Checked Out", "Reserved", "Maintenance"];
  if (/approval|decision|review/.test(raw)) return ["Pending Review", "Approved", "Rejected", "Returned"];
  if (/status|state|stage|phase/.test(raw)) return ["Draft", "Submitted", "In Progress", "Completed", "Closed"];
  if (/category|type|class|group/.test(raw)) return ["Standard", "Special", "Replacement", "Repair"];
  return ["Active", "Pending", "Closed"];
}

function selectDashboardFiltersForPage({ planDemand, pageName, datasetRecord, fallbackListName }) {
  const records = planDemand.dashboardFilterRecords || [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  const sourceName = datasetRecord?.sourceResource || fallbackListName;
  return records.filter((record) => !record.dashboardPage && (!record.sourceResource || normKey(record.sourceResource) === normKey(sourceName)));
}

function dashboardNameMatches(pageName, plannedPageName) {
  if (!plannedPageName) return false;
  const left = normKey(pageName);
  const right = normKey(plannedPageName);
  return left === right || left.includes(right) || right.includes(left);
}

function parseMarkdownTables(section) {
  const lines = section.split(/\r?\n/);
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
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanResourceName(cell));
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function cleanResourceName(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  if (/^(not applicable|not planned|n\/a|none|no|deferred|status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^no\s+(?:form\s+)?reports?\b/i.test(text)) return true;
  if (/^no custom\b/i.test(text)) return true;
  if (/^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text)) return true;
  return false;
}

function isNonFieldName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  return /^(not applicable|n\/a|none|no|deferred|field name|display name|business label|label|name)$/i.test(text);
}

function buildDecodedPackage({ appTitle, rootListId, dashboardLayoutId, layoutResourceId, layoutResourceRefId, iconUrl = DEFAULT_ICON, appPlanText = "" }) {
  return {
    ListSet: listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"src\":true}", iconUrl }),
    Pages: [
      {
        ListID: rootListId,
        LayoutID: dashboardLayoutId,
        Type: 103,
        Title: "Getting Started Dashboard",
        LayoutView: null,
        Ext2: "{\"src\":true}",
        IsDefault: true,
        IsItemPerm: false,
        LayoutInResources: [
          {
            ID: layoutResourceId,
            RefId: layoutResourceRefId,
            Resource: JSON.stringify({
              id: "Main",
              type: "container",
              title: "Main",
              attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
              children: [
                {
                  id: "Content",
                  type: "container",
                  title: "Content",
                  attrs: { container: { cw: "2", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
                  children: [
                    {
                      id: "generated_final_placeholder_notice",
                      type: "text",
                      title: "Generated-final materialization placeholder",
                      attrs: { text: { value: "Generated-final package materialized from approved planning artifacts." } },
                    },
                  ],
                },
              ],
            }),
          },
        ],
      },
    ],
    Forms: [],
    FormReports: [],
    FormNewReports: [],
    CustomServices: [],
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: buildDefaultApplicationControlStyles({ rootListId, appPlanText }),
    Components: [],
    Childs: [],
  };
}

function buildResourceGraphPackage({ appTitle, rootListId, planDemand, ids, iconUrl = DEFAULT_ICON, appPlanText = "" }) {
  const dataListNames = planDemand.resources.dataLists.length ? planDemand.resources.dataLists : [`${appTitle} Records`];
  const dataListByName = new Map();
  const listMetaByName = new Map();
  const allCustomFormAssignments = assignAllCustomFormLayoutPositions(planDemand, dataListNames);
  dataListNames.forEach((name, index) => {
    dataListByName.set(normKey(name), stringId(ids[`decoded.Childs[${index}].List.ListID`]));
  });
  const fieldRecordsByName = new Map();
  dataListNames.forEach((name, index) => {
    const listId = stringId(ids[`decoded.Childs[${index}].List.ListID`]);
    const fieldSpecs = fieldSpecsForList(planDemand, name);
    const fields = fieldSpecs.map((field, fieldIndex) => buildFieldRecord({
      field,
      fieldIndex,
      listId,
      fieldId: stringId(ids[`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`]),
      lookupTargetListId: resolveLookupTargetListId(field, dataListByName),
    }));
    fieldRecordsByName.set(normKey(name), fields);
    listMetaByName.set(normKey(name), { listName: name, listId, fields, detailLayoutId: "" });
  });
  const childs = dataListNames.map((name, index) => {
    const listId = stringId(ids[`decoded.Childs[${index}].List.ListID`]);
    dataListByName.set(normKey(name), listId);
    const fields = fieldRecordsByName.get(normKey(name)) || [];
    const customLayoutsForList = allCustomFormAssignments.filter((assignment) => assignment.listIndex === index);
    const layouts = [
      {
        ListID: listId,
        LayoutID: stringId(ids[`decoded.Childs[${index}].Layouts[0].LayoutID`]),
        Title: "Default View",
        Type: 0,
        LayoutView: JSON.stringify({
          layout: fields.slice(0, 8).map((field, fieldIndex) => ({
            FieldID: field.FieldID,
            FieldName: field.FieldName,
            DisplayName: field.DisplayName,
            Type: field.Type,
            Order: fieldIndex + 1,
            Mobile: 2,
            Show: true,
          })),
          query: [
            ...fields.map((field) => ({ FieldID: field.FieldID, FieldName: field.FieldName, field: field.FieldName })),
            { FieldName: "ListDataID", field: "ListDataID" },
            { FieldName: "CreatedBy", field: "CreatedBy" },
            { FieldName: "ModifiedBy", field: "ModifiedBy" },
            { FieldName: "Created", field: "Created" },
            { FieldName: "Modified", field: "Modified" },
          ],
        }),
        Ext1: JSON.stringify({ Url: "default" }),
        IsDefault: true,
        IsItemPerm: false,
        Perms: [],
        LayoutInResources: [],
      },
    ];
    for (const assignment of customLayoutsForList) {
      const layoutId = stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]);
      layouts.push(buildCustomFormLayout({ layoutId, listId, listName: name, formName: assignment.formName, formType: assignment.formType, selectedTemplate: assignment.selectedTemplate, openIn: assignment.openIn, fields, planDemand, listMetaByName, rootListSetId: rootListId }));
    }
    const displayLayoutView = buildDataListFormDisplaySettings({ customLayoutsForList, ids });
    const detailLayoutId = displayLayoutView.view || displayLayoutView.edit || displayLayoutView.add || "";
    const currentMeta = listMetaByName.get(normKey(name)) || { listName: name, listId, fields };
    currentMeta.detailLayoutId = detailLayoutId;
    listMetaByName.set(normKey(name), currentMeta);
    return {
      List: listInfo({ listId, title: name, type: 1, ext2: "{\"generatedFinal\":true}", layoutView: JSON.stringify(displayLayoutView) }),
      Fields: fields,
      Layouts: layouts,
      RemindRules: [],
      PublicForms: [],
      FlowMappings: [],
    };
  });

  const forms = planDemand.resources.approvalForms.map((name, index) => {
    const key = stringId(ids[`decoded.Forms[${index}].Key`]);
    const defId = stringId(ids[`decoded.Forms[${index}].DefResourceID`]);
    const approvalFieldSpecs = approvalFieldSpecsForForm(planDemand, name);
    const approvalWorkflowNodes = approvalWorkflowNodeSpecsForForm(planDemand, name);
    const pageIds = approvalWorkflowIds(defId, key);
    return {
      Category: "",
      Name: name,
      Key: key,
      IsItemPerm: false,
      AppID: 41,
      ListID: 0,
      ProcModelID: defId,
      Description: "",
      Ext: "",
      DefResourceID: defId,
      DefResource: exportResource(buildApprovalDefResource({
        name,
        formKey: key,
        defId,
        rootListSetId: rootListId,
        approvalFieldSpecs,
        approvalWorkflowNodes,
        dataListMetas: Array.from(listMetaByName.values()),
      })),
      Status: 1,
      DeployedDefID: defId,
      WorkflowType: 2,
      Settings: JSON.stringify({
        taskurl: pageIds.taskPageId,
        actions: [
          { name: "Submit", type: "form_action" },
          { name: "Approve", type: "form_action" },
          { name: "Reject", type: "form_action" },
        ],
      }),
      Deployed: true,
      NoRule: { Prefix: "REQ-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      Perms: [],
    };
  });

  const plannedFormReports = forms.length ? planDemand.resources.formReports.filter((name) => !isNonResourceName(name)) : [];
  const formNewReports = plannedFormReports.map((name, index) => ({
    ID: stringId(ids[`decoded.FormNewReports[${index}].ID`]),
    DefKey: forms[0]?.Key || "",
    Name: name,
    Description: "",
    Attr: "",
    Settings: JSON.stringify({
      Fields: ["Title"],
      Source: forms[0]?.Title || "Approval Forms",
    }),
  }));

  const pages = planDemand.resources.dashboards.map((name, index) => {
    const datasetRecords = selectDashboardDatasetRecordsForPage({ planDemand, pageName: name, pageIndex: index });
    const datasetRecord = datasetRecords[0] || null;
    const firstListName = datasetRecord?.sourceResource || dataListNames[index % dataListNames.length];
    const firstListMeta = listMetaByName.get(normKey(firstListName)) || listMetaByName.values().next().value || { listName: firstListName, listId: rootListId, fields: fieldSpecsForList(planDemand, firstListName), detailLayoutId: "" };
    const firstListId = firstListMeta.listId || dataListByName.get(normKey(firstListName)) || dataListByName.values().next().value || rootListId;
    const dashboardFilters = selectDashboardFiltersForPage({ planDemand, pageName: name, datasetRecord, fallbackListName: firstListName });
    const dashboardAnalytics = selectDashboardAnalyticsForPage({ planDemand, pageName: name, pageIndex: index });
    const dashboardSummaryMetrics = selectDashboardSummaryMetricsForPage({ planDemand, pageName: name, pageIndex: index });
    const dashboardPageLayoutTemplateId = selectDashboardPageLayoutTemplateForPage({ planDemand, pageName: name });
    const dashboardResource = buildMaterialDashboardResource({
      name,
      layoutId: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
      pageLayoutTemplateId: dashboardPageLayoutTemplateId,
      rootListSetId: rootListId,
      listName: firstListName,
      listId: firstListId,
      listMeta: firstListMeta,
      listMetaByName,
      datasetRecords,
      dashboardFilters,
      dashboardAnalytics,
      dashboardDataTables: selectDashboardDataTablesForPage({ planDemand, pageName: name, pageIndex: index }),
      dashboardSummaryMetrics,
      summaryId: deterministicUuid(`${appTitle}:${name}:${stringId(ids[`decoded.Pages[${index}].LayoutID`])}:summary:0`),
      filterId: `${stringId(ids[`decoded.Pages[${index}].LayoutID`])}_filter`,
      collectionId: `${stringId(ids[`decoded.Pages[${index}].LayoutID`])}_collection`,
    });
    const dashboardResourceJson = JSON.stringify(dashboardResource);
    return {
      ListID: rootListId,
      LayoutID: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
      Type: 103,
      Title: name,
      LayoutView: null,
      Ext2: JSON.stringify({ src: true, generatedFinal: true }),
      IsDefault: index === 0,
      IsItemPerm: false,
      LayoutInResources: [
        {
          ID: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
          RefId: stringId(ids[`decoded.Pages[${index}].LayoutID`]),
          Resource: dashboardResourceJson,
        },
      ],
    };
  });

  return {
    ListSet: {
      ...listInfo({ listId: rootListId, title: appTitle, type: 1024, ext2: "{\"generatedFinal\":true}", iconUrl }),
      LayoutView: buildNavigationLayoutView({ planDemand, rootListId, ids, dataListByName, forms, pages }),
    },
    Pages: pages,
    Forms: forms,
    FormReports: [],
    FormNewReports: formNewReports,
    CustomServices: [],
    DataReports: [],
    PortalInfo: null,
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: buildDefaultApplicationControlStyles({ rootListId, appPlanText }),
    Components: [],
    Childs: childs,
  };
}

function selectDashboardPageLayoutTemplateForPage({ planDemand, pageName }) {
  const records = planDemand.dashboardPageLayoutTemplateRecords || [];
  const match = records.find((record) => dashboardNameMatches(pageName, record.dashboardPage));
  return match?.selectedTemplateId || PAGE_LAYOUT_TEMPLATE_ID;
}

function selectDashboardDatasetRecord({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardDatasetRecords || [];
  if (!records.length) return null;
  return records.find((record) => normKey(record.dashboardPage) && (normKey(pageName).includes(normKey(record.dashboardPage)) || normKey(record.dashboardPage).includes(normKey(pageName))))
    || records[pageIndex % records.length]
    || records[0];
}

function selectDashboardDatasetRecordsForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardDatasetRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  const unscoped = records.filter((record) => !record.dashboardPage);
  if (unscoped.length) return unscoped.filter((_, index) => index % Math.max(1, planDemand.resources.dashboards.length || 1) === pageIndex);
  return [];
}

function selectDashboardDataTablesForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardDataTableRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  const unscoped = records.filter((record) => !record.dashboardPage);
  if (unscoped.length) return unscoped.filter((_, index) => index % Math.max(1, planDemand.resources.dashboards.length || 1) === pageIndex);
  return [];
}

function selectDashboardAnalyticsForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardAnalyticsRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  return records.filter((record) => !record.dashboardPage).filter((_, index) => index % Math.max(1, planDemand.resources.dashboards.length || 1) === pageIndex);
}

function selectDashboardSummaryMetricsForPage({ planDemand, pageName, pageIndex }) {
  const records = planDemand.dashboardSummaryMetricRecords || [];
  if (!records.length) return [];
  const pageMatches = records.filter((record) => dashboardNameMatches(pageName, record.dashboardPage));
  if (pageMatches.length) return pageMatches;
  return records.filter((record) => !record.dashboardPage).slice(0, 4);
}

function buildMaterialDashboardResource({ name, layoutId, pageLayoutTemplateId = PAGE_LAYOUT_TEMPLATE_ID, rootListSetId, listName, listId, listMeta, listMetaByName, datasetRecords = [], dashboardFilters, dashboardAnalytics, dashboardDataTables = [], dashboardSummaryMetrics, summaryId, filterId, collectionId }) {
  const tempVar = `tmp_${slugify(name).replace(/-/g, "_")}_count`;
  const kpiContracts = buildDashboardKpiContracts({ pageName: name, summaryIdBase: summaryId, primaryTempVar: tempVar, plannedMetrics: dashboardSummaryMetrics });
  const resource = buildDashboardPageLayoutShell({ name, layoutId, templateId: pageLayoutTemplateId });
  const pageLayoutDependencies = resource.__pageLayoutDependencies || {};
  const isMasterDetailWorkspace = MASTER_DETAIL_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.has(pageLayoutTemplateId);
  const primaryDatasetRecord = (datasetRecords || [])[0] || null;
  const sourceResource = primaryDatasetRecord?.sourceResource || listName;
  const selectedTemplateId = primaryDatasetRecord?.selectedTemplateId || "collection_control_grid_table";
  const datasetRegion = primaryDatasetRecord?.datasetRegion || `${sourceResource} records`;
  const sourceListMeta = listMeta || { listName: sourceResource, listId, fields: [{ fieldName: "Title", displayName: "Title", fieldType: "Text", controlType: "input" }], detailLayoutId: "" };
  const normalizedFilters = normalizeDashboardFilters({ filters: dashboardFilters, listMeta: sourceListMeta, dashboardName: name });
  const collectionRoots = [];
  const effectiveDatasetRecords = (datasetRecords || []).length ? datasetRecords : [{ selectedTemplateId, sourceResource, datasetRegion }];
  if (isMasterDetailWorkspace) {
    const masterRecord = effectiveDatasetRecords[0] || { sourceResource, datasetRegion };
    const leftRecord = effectiveDatasetRecords.find((record) => /left[_\s-]*panel|left_panel_data_items_wrapper/i.test(String(record.datasetRegion || ""))) || masterRecord;
    const currentRecord = effectiveDatasetRecords.find((record) => /current[_\s-]*item|current_item_wrapper|selected/i.test(String(record.datasetRegion || ""))) || effectiveDatasetRecords[1] || masterRecord;
    const masterListMeta = listMetaByName?.get(normKey(masterRecord.sourceResource)) || sourceListMeta;
    materializeMasterDetailWorkspaceCollections(resource, {
      dashboardName: name,
      rootListSetId,
      listMeta: masterListMeta,
      datasetRegion: masterRecord.datasetRegion || datasetRegion,
      leftTemplateId: leftRecord.selectedTemplateId || masterRecord.selectedTemplateId || selectedTemplateId,
      currentTemplateId: currentRecord.selectedTemplateId || leftRecord.selectedTemplateId || masterRecord.selectedTemplateId || selectedTemplateId,
      collectionId,
    });
  }
  const recordsForTemplateMaterialization = isMasterDetailWorkspace ? effectiveDatasetRecords.slice(1) : effectiveDatasetRecords;
  for (const [index, record] of recordsForTemplateMaterialization.entries()) {
    const recordListMeta = listMetaByName?.get(normKey(record.sourceResource)) || (index === 0 ? sourceListMeta : null) || sourceListMeta;
    const recordListName = recordListMeta.listName || record.sourceResource || sourceResource;
    const recordListId = recordListMeta.listId || listId;
    const recordRegion = record.datasetRegion || `${recordListName} records`;
    collectionRoots.push(buildCollectionTemplateInstance({
      templateId: record.selectedTemplateId || "collection_control_grid_table",
      dashboardName: name,
      datasetRegion: recordRegion,
      listName: recordListName,
      rootListSetId,
      listId: recordListId,
      listMeta: recordListMeta,
      detailLayoutId: recordListMeta.detailLayoutId,
      filterBindings: !isMasterDetailWorkspace && index === 0 ? normalizedFilters : [],
      collectionId: isMasterDetailWorkspace ? `${collectionId}_related_${index + 1}` : index === 0 ? collectionId : `${collectionId}_${index + 1}`,
    }));
  }
  const templateDependencies = mergePageDependencies([
    pageLayoutDependencies,
    ...collectionRoots.map((root) => root.pageLevelDependencies || {}),
  ]);
  delete resource.__pageLayoutDependencies;
  const datasetSlots = findDatasetSlots(resource);
  for (const [index, collectionRoot] of collectionRoots.entries()) {
    const slot = datasetSlots[index] || datasetSlots[0] || findBusinessSectionContentArea(resource);
    if (!slot) continue;
    slot.datasetRegion = collectionRoot.datasetRegion || datasetRegion;
    slot.datasetRegionName = collectionRoot.datasetRegionName || collectionRoot.datasetRegion || datasetRegion;
    slot.attrs = {
      ...(slot.attrs || {}),
      datasetRegion: slot.datasetRegion,
      datasetRegionName: slot.datasetRegionName,
      appPlanDatasetRegion: slot.datasetRegionName,
    };
    slot.children = Array.isArray(slot.children) ? slot.children : [];
    slot.children = slot.children.filter((child) => hasMeaningfulBusinessContent(child));
    slot.children.push(collectionRoot);
  }
  const contentArea = datasetSlots[0] || findBusinessSectionContentArea(resource);
  const analyticsRuntimeContracts = materializeDashboardAnalytics(resource, {
    analyticsRecords: dashboardAnalytics,
    fallbackListMeta: sourceListMeta,
    listMetaByName,
    dashboardName: name,
    rootListSetId,
  });
  materializeDashboardDataTables(resource, {
    dataTableRecords: dashboardDataTables,
    fallbackListMeta: sourceListMeta,
    listMetaByName,
    dashboardName: name,
    rootListSetId,
  });
  materializeDashboardKpiCards(resource, kpiContracts, { listName: sourceResource });
  ensureVisibleKpiCards(resource, kpiContracts, { listName: sourceResource });
  const summaries = kpiContracts.map((contract) => buildSummaryControl({
    summaryId: contract.summaryId,
    tempVar: contract.tempVar,
    listName: sourceResource,
    listId,
    rootListSetId,
    label: contract.label,
  }));
  if (summaries.length) {
    const summaryHostParent = findDashboardHiddenSummaryHostParent(resource);
    if (summaryHostParent) {
      summaryHostParent.children = Array.isArray(summaryHostParent.children) ? summaryHostParent.children : [];
      summaryHostParent.children.push(buildHiddenSummaryHost({ dashboardName: name, summaries }));
    }
  }
  materializeDashboardFilters(resource, {
    filters: normalizedFilters,
    listName: sourceResource,
    listId,
    filterIdPrefix: filterId,
    datasetRegion,
    host: contentArea,
  });
  applyDashboardTextMapping(resource, { name, datasetRegion, listName: sourceResource, kpiContracts });
  scrubDashboardSourceTemplateResidue(resource, { listName: sourceResource, scrubMetadata: isMasterDetailWorkspace });
  if (isMasterDetailWorkspace) removeRedundantMasterDetailSectionTitleHeaders(resource);
  removeResidualTemplateSectionHeaders(resource);
  removeEmptySectionTitleAreas(resource);
  resource.filterVars = filterConsumedDashboardFilterVars(resource, uniqueByName([
    ...normalizeDependencyArray(templateDependencies.filterVars),
    ...normalizedFilters.map((filter) => ({ name: filter.variable, type: "text", source: filter.controlId })),
  ]));
  pruneUnconsumedDashboardFilterProducerBindings(resource, resource.filterVars.map((item) => String(item?.name || item?.id || "").trim()).filter(Boolean));
  resource.tempVars = uniqueByName([
    ...normalizeDependencyArray(templateDependencies.tempVars),
    ...kpiContracts.map((contract) => ({
      id: `__temp_${contract.tempVar}`,
      name: contract.tempVar,
      type: "number",
      source: contract.summaryId,
      kpiKey: contract.businessKey || contract.key,
    })),
    ...(isMasterDetailWorkspace ? [
      { id: "__temp_vCurrentItemID", name: "vCurrentItemID", type: "string", source: "left_panel_data_items_wrapper" },
    ] : []),
    { name: "var_SelectedItems", type: "array", source: collectionId },
    { name: "var_SelectedItemsAmount", type: "number", source: collectionId },
    { name: "var_isDeleteConfirmed", type: "boolean", source: "delete-confirmation" },
  ]);
  const summaryRuntimeExts = kpiContracts.map((contract) => ({
    i: contract.summaryId,
    id: contract.summaryId,
    category: "___Pivot___",
    key: "summary",
    attr: {
      AppID: 41,
      ListSetID: stringId(rootListSetId),
      ListID: stringId(listId),
      list: { AppID: 41, ListID: stringId(listId), ListSetID: stringId(rootListSetId), Type: 1, Title: sourceResource },
      source: { AppID: 41, ListID: stringId(listId), ListSetID: stringId(rootListSetId), Type: 1, Title: sourceResource },
      settings: {
        values: [{
          fieldName: "ListDataID",
          field: "ListDataID",
          FieldName: "ListDataID",
          id: "ListDataID",
          func: "COUNT",
          aggregate: "COUNT",
          label: contract.label,
          type: "Text",
          fieldType: "Text",
          attr: { FieldName: "ListDataID", FieldType: "Text", DisplayName: "Record ID" },
          preConditions: [],
          Conditions: [],
        }],
      },
    },
  }));
  resource.ReportIds = unique([
    ...kpiContracts.map((contract) => contract.summaryId),
    ...analyticsRuntimeContracts.map((contract) => contract.controlId),
  ]);
  resource.exts = [
    ...summaryRuntimeExts,
    ...analyticsRuntimeContracts.map((contract) => contract.ext),
  ];
  resource.actions = normalizeDependencyArray(templateDependencies.actions);
  resource.formAction = normalizeDependencyArray(templateDependencies.formAction);
  removeUnresolvedPageActionControls(resource);
  resource.LayoutID = layoutId;
  resource.plannedControls = { kpis: kpiContracts.length > 0, kpiCount: kpiContracts.length, gridTable: true };
  resource.generatedFinalDashboardMaterialization = {
    shellTemplate: pageLayoutTemplateId,
    dashboardPageLayoutTemplateId: pageLayoutTemplateId,
    datasetRegion,
    selectedCollectionTemplateId: selectedTemplateId,
    selectedCollectionTemplateIds: collectionRoots.map((root) => root.datasetPresentationTemplateId).filter(Boolean),
    selectedDataAnalyticsTemplateIds: (dashboardAnalytics || []).map((record) => record.selectedTemplateId),
    selectedDataTableTemplateIds: (dashboardDataTables || []).map((record) => record.selectedTemplateId),
    sourceResource,
    kpiCount: kpiContracts.length,
    kpis: kpiContracts.map((contract) => ({ key: contract.businessKey || contract.key, label: contract.label, tempVar: contract.tempVar, summaryId: contract.summaryId })),
    filters: normalizedFilters.map((filter) => ({ name: filter.filterName, fieldName: filter.fieldName })),
  };
  ensureMasterDetailDashboardRuntimeShell(resource, pageLayoutTemplateId);
  normalizeGeneratedDashboardControls(resource, name);
  scrubDashboardSourceTemplateResidue(resource, { listName: sourceResource, scrubMetadata: isMasterDetailWorkspace });
  if (isMasterDetailWorkspace) restoreDashboardRootGoldenReferenceProvenance(resource);
  if (isMasterDetailWorkspace) removeRedundantMasterDetailSectionTitleHeaders(resource);
  removeResidualTemplateSectionHeaders(resource);
  removeEmptySectionTitleAreas(resource);
  removeEmptyDashboardBusinessSections(resource);
  if (!isMasterDetailWorkspace) ensureDashboardContentCardRequiredSlots(resource);
  ensureVisibleKpiCards(resource, kpiContracts, { listName: sourceResource });
  applyDashboardTextMapping(resource, { name, datasetRegion, listName: sourceResource, kpiContracts });
  scrubDashboardSourceTemplateResidue(resource, { listName: sourceResource, scrubMetadata: false });
  removeOperationsWithoutActions(resource);
  instantiateDashboardControlUuids(resource, slugify(name));
  normalizeSummaryRuntimeExtIds(resource);
  rewriteCollectionTemplateRuntimeRefs(resource, {
    rootListSetId,
    listId,
    detailLayoutId: sourceListMeta.detailLayoutId,
  });
  enforceCollectionTemplateStyleContracts(resource);
  return resource;
}

function restoreDashboardRootGoldenReferenceProvenance(resource) {
  if (!resource || typeof resource !== "object") return;
  resource.derivedFromGoldenReference = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.goldenReferenceId = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.attrs = {
    ...(resource.attrs || {}),
    derivedFromGoldenReference: DASHBOARD_GOLDEN_REFERENCE_ID,
  };
}

function ensureMasterDetailDashboardRuntimeShell(resource, pageLayoutTemplateId) {
  if (!MASTER_DETAIL_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.has(pageLayoutTemplateId)) return;
  resource.attrs ||= {};
  resource.attrs.container ||= {};
  resource.attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
  resource.attrs.contentWidth ||= [null, "1"];

  const topChildren = Array.isArray(resource.children) ? resource.children : [];
  const existingMain = topChildren.find((child) => hasIdentity(child, "Main"));
  const main = existingMain || topChildren[0];
  if (!main || !Array.isArray(main.children)) return;

  main.name = "Main";
  main.title = "Main";
  main.label = "Main";

  const content = main.children.find((child) => hasIdentity(child, "Content"))
    || main.children.find((child) => hasIdentity(child, "content_panel"))
    || main.children.find((child) => hasIdentity(child, "right_side_panel"))
    || main.children[1]
    || main.children[0];
  if (!content) return;
  content.name = "Content";
  content.title ||= "Content";
  content.label ||= "content_panel";
}

function materializeMasterDetailWorkspaceCollections(resource, { dashboardName, rootListSetId, listMeta, datasetRegion, leftTemplateId, currentTemplateId, collectionId }) {
  const leftCollection = findFirstByIdentity(resource, "left_panel_data_items_wrapper");
  const currentCollection = findFirstByIdentity(resource, "current_item_wrapper");
  const leftPanelTitle = findFirstByIdentity(resource, "left_panel_caption_title");
  const leftPanelCaptionIcon = findFirstByIdentity(resource, "left_panel_caption_icon");
  const mainContentTitle = findFirstByIdentity(resource, "main_content_page_title");
  setHeadingText(leftPanelTitle, listMeta.listName || datasetRegion);
  setIconControlFontAwesome(leftPanelCaptionIcon, inferDatasetFontAwesomeIcon(listMeta.listName || datasetRegion));
  setHeadingText(mainContentTitle, `${listMeta.listName || datasetRegion} Details`);
  if (leftCollection) {
    configureMasterDetailCollection(leftCollection, {
      role: "left-panel-list",
      dashboardName,
      datasetRegion,
      listMeta,
      rootListSetId,
      selectedTemplateId: leftTemplateId || "collection_control_grid_table",
      id: `${collectionId}_left_panel`,
    });
    leftCollection.attrs.data.limit = false;
    leftCollection.attrs.data.ps = leftCollection.attrs.data.ps || 20;
    leftCollection.attrs.data.filter = masterDetailLeftPanelFilters(resource, listMeta, rootListSetId);
    leftCollection.attrs.data.fulltext = masterDetailSearchFilters(resource, listMeta);
    leftCollection.attrs.data.sort = [{ SortName: primarySortFieldName(listMeta), SortByDesc: false }];
    leftCollection.attrs.actions = ensureMasterDetailSelectionAction(leftCollection.attrs.actions);
  }
  if (currentCollection) {
    configureMasterDetailCollection(currentCollection, {
      role: "current-item-detail",
      dashboardName,
      datasetRegion: `${datasetRegion} selected detail`,
      listMeta,
      rootListSetId,
      selectedTemplateId: currentTemplateId || leftTemplateId || "collection_control_grid_table",
      id: `${collectionId}_current_item`,
    });
    currentCollection.attrs.data.limit = true;
    currentCollection.attrs.data.disv = false;
    currentCollection.attrs.data.ps = 1;
    currentCollection.attrs.data.filter = [{
      key: deterministicUuid(`${dashboardName}:${listMeta.listName}:current-item-filter`),
      pre: "and",
      left: "ListDataID",
      op: "0",
      right: [{ exprType: "variable", valueType: "string", id: "__temp_vCurrentItemID", type: "expr", name: "vCurrentItemID" }],
      showCus: false,
    }];
    currentCollection.attrs.data.fulltext = [];
  }
  mapMasterDetailFilterControls(resource, listMeta, rootListSetId);
  mapDynamicControlsForList(resource, listMeta, rootListSetId);
  rewriteCollectionTemplateRuntimeRefs(resource, {
    rootListSetId,
    listId: listMeta.listId,
    detailLayoutId: listMeta.detailLayoutId,
  });
  replaceTemplateResidue(resource, { datasetRegion, listName: listMeta.listName || datasetRegion });
}

function configureMasterDetailCollection(collection, { role, dashboardName, datasetRegion, listMeta, rootListSetId, selectedTemplateId, id }) {
  const listName = listMeta.listName || datasetRegion || "Records";
  const templateId = selectedTemplateId || "collection_control_grid_table";
  collection.id = id;
  collection.name = role === "left-panel-list" ? `${listName} list` : `${listName} selected item`;
  collection.title = collection.name;
  collection.dashboardWorkspaceCollectionRole = role;
  collection.dashboardPageLayoutInternalCollection = true;
  collection.datasetPresentationTemplateId = templateId;
  collection.derivedFromDatasetPresentationTemplate = templateId;
  collection.templateId = templateId;
  collection.datasetRegion = datasetRegion;
  collection.datasetRegionName = datasetRegion;
  collection.appPlanDatasetRegion = datasetRegion;
  collection.attrs = {
    ...(collection.attrs || {}),
    dashboardWorkspaceCollectionRole: role,
    dashboardPageLayoutInternalCollection: true,
    dashboardPageLayoutTemplateId: collection.attrs?.dashboardPageLayoutTemplateId || null,
    datasetPresentationTemplateId: templateId,
    derivedFromDatasetPresentationTemplate: templateId,
    templateId,
    datasetRegion,
    datasetRegionName: datasetRegion,
    appPlanDatasetRegion: datasetRegion,
    data: {
      ...(collection.attrs?.data || {}),
      list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listName, ListSetID: stringId(rootListSetId) },
      source: listName,
      sourceResourceType: "Data list",
      datasetRegion,
      ...(role === "left-panel-list" ? {
        datasetPresentationTemplateId: "collection_control_grid_table",
      } : {}),
      field: primaryFieldName(listMeta),
      sort: [{ SortName: primarySortFieldName(listMeta), SortByDesc: false }],
      datasetPresentationTemplateId: templateId,
    },
  };
  collection.generatedFrom = { dashboardName, sourceResource: listName, dashboardWorkspaceCollectionRole: role };
}

function masterDetailSearchFilters(resource, listMeta) {
  const fields = fieldsForDynamicControls(listMeta).slice(0, 5).map((field) => field.fieldName);
  const searches = findDescendants(resource, (node) => String(node?.type || "") === "search-filter");
  return searches.map((search) => {
    const binding = String(search?.binding || search?.attrs?.binding || "__filter_filter_keywords").replace(/^__filter_/, "");
    return {
      fields: fields.length ? fields : [primaryFieldName(listMeta)],
      field: primaryFieldName(listMeta),
      value: [{ exprType: "variable", valueType: "string", id: `__filter_${binding}`, type: "expr", name: binding }],
      sourceFilterId: search.id || search.name || "left_panel_search_filter",
    };
  });
}

function masterDetailLeftPanelFilters(resource, listMeta, rootListSetId) {
  const filters = findDescendants(resource, (node) => hasIdentity(node, "left_panel_filter_control"));
  for (const [index, filter] of filters.slice(0, 4).entries()) {
    const field = resolveMasterDetailFilterField(filter, listMeta, index) || fieldsForDynamicControls(listMeta)[index + 1] || fieldsForDynamicControls(listMeta)[0] || { fieldName: "Title" };
    const variable = String(filter.binding || filter.attrs?.binding || `__filter_filter_${field.displayName || field.fieldName}`).replace(/^__filter_/, "");
    const optionValues = choiceValuesForField(field);
    const label = field.displayName || field.fieldName;
    filter.binding = `__filter_${variable}`;
    filter.name = label;
    filter.title = label;
    filter.label = label;
    filter.attrs = {
      ...(filter.attrs || {}),
      lab: {
        ...(filter.attrs?.lab || {}),
        value: label,
        ty: filter.attrs?.lab?.ty || [null, "xs-light"],
      },
      layout: filter.attrs?.layout || "dropdown",
      displayStyle: filter.attrs?.displayStyle || "dropdown",
      "dropdown-enable": true,
      data: {
        ...(filter.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName, ListSetID: stringId(rootListSetId) },
        field: field.fieldName,
        displayField: field.fieldName,
        valueField: field.fieldName,
        filter: [],
        optionSourceProven: true,
      },
      display_f: field.fieldName,
      value_f: field.fieldName,
      ps: filter.attrs?.ps || 20,
      optionSourceProven: true,
      "choice-options": optionValues,
      options: optionValues.map((value) => ({ value, label: value })),
      placeholder: label,
    };
    setSemanticNavigatorLabel(filter, `left_panel_filter_${label}`);
  }
  // Empty select-filter values can clear the left record list at runtime. Keep
  // filter controls configured for users, but do not apply collection filters
  // unless a proven safe optional-filter expression is available.
  return [];
}

function resolveMasterDetailFilterField(filter, listMeta, index = 0) {
  const fields = fieldsForDynamicControls(listMeta);
  if (!fields.length) return null;
  const rawHint = [
    filter?.name,
    filter?.title,
    filter?.label,
    filter?.nv_label,
    filter?.nav_label,
    filter?.binding,
    filter?.attrs?.name,
    filter?.attrs?.title,
    filter?.attrs?.label,
    filter?.attrs?.nv_label,
    filter?.attrs?.nav_label,
    filter?.attrs?.placeholder,
    filter?.attrs?.lab?.value,
    filter?.attrs?.data?.field,
    filter?.attrs?.display_f,
    filter?.attrs?.value_f,
  ].map((value) => typeof value === "string" ? value : value?.value).filter(Boolean).join(" ");
  const hint = normKey(rawHint);
  const tokenPriority = [
    ["status", /\bstatus\b/i],
    ["priority", /\bpriority\b/i],
    ["category", /\bcategory\b/i],
    ["requester", /\brequester\b/i],
    ["assigned", /\bassigned|agent|assignee\b/i],
    ["type", /\btype\b/i],
  ];
  for (const [token, pattern] of tokenPriority) {
    if (!pattern.test(rawHint)) continue;
    const match = fields.find((field) => {
      const fieldText = `${field.displayName || ""} ${field.fieldName || ""}`;
      return new RegExp(`\\b${token}\\b`, "i").test(fieldText);
    });
    if (match) return match;
  }
  const hinted = fields.find((field) => {
    const display = normKey(field.displayName);
    const internal = normKey(field.fieldName);
    return display && (hint === display || hint.includes(display) || display.includes(hint) || hint === internal);
  });
  return hinted || fields[index + 1] || fields[index] || fields[0] || null;
}

function mapMasterDetailFilterControls(resource, listMeta, rootListSetId) {
  for (const search of findDescendants(resource, (node) => String(node?.type || "") === "search-filter")) {
    search.attrs = {
      ...(search.attrs || {}),
      placeholder: typeof search.attrs?.placeholder === "string" ? search.attrs.placeholder : `Search ${listMeta.listName}`,
      data: {
        ...(search.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName, ListSetID: stringId(rootListSetId) },
        field: primaryFieldName(listMeta),
      },
    };
  }
}

function ensureMasterDetailSelectionAction(actions) {
  const out = Array.isArray(actions) ? clone(actions) : [];
  const text = JSON.stringify(out);
  if (/vCurrentItemID/.test(text) && /ListDataID/.test(text)) return out;
  out.push({
    id: "select-current-item",
    name: "Select current item",
    type: "coll",
    steps: [{
      type: "setvar",
      attrs: {
        setvar_var: { exprType: "variable", valueType: "string", id: "__temp_vCurrentItemID", type: "expr", name: "vCurrentItemID" },
        setvar_val: [{ exprType: "variable_ctx", valueType: "input", id: "ListDataID", ctx: "__ctx_coll", type: "expr", name: "Collection item:Id" }],
      },
    }],
  });
  return out;
}

function mapDynamicControlsForList(root, listMeta, rootListSetId) {
  const bindableFields = fieldsForDynamicControls(listMeta);
  let dynamicIndex = 0;
  for (const control of findDescendants(root, (node) => String(node?.type || "").startsWith("dynamic-"))) {
    const field = selectFieldForDynamicControl(control, bindableFields, dynamicIndex, { root });
    dynamicIndex += 1;
    control.type = dynamicControlTypeForField(field);
    control.attrs = {
      ...(control.attrs || {}),
      source: "3",
      "obj-f": field.fieldName,
      field: field.fieldName,
      fieldName: field.fieldName,
      data: {
        ...(control.attrs?.data || {}),
        ListSetID: stringId(rootListSetId),
        ListID: stringId(listMeta.listId),
        list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName, ListSetID: stringId(rootListSetId) },
        field: field.fieldName,
        fieldName: field.fieldName,
      },
    };
    control.field = field.fieldName;
    control.FieldName = field.fieldName;
    if (control.type === "dynamic-user") {
      control.attrs.user = {
        ...(control.attrs.user || {}),
        field: field.fieldName,
        fieldName: field.fieldName,
      };
      applyCollectionDynamicUserItemPadding(control);
    }
    control.name = field.displayName;
    control.title = field.displayName;
    control.label = field.displayName;
    const navLabel = `collection_item_${slugify(field.displayName || field.fieldName || "field")}`.replace(/-/g, "_");
    setSemanticNavigatorLabel(control, navLabel);
    updateMasterDetailFieldLabel(root, control, field);
  }
}

function enforceCollectionTemplateStyleContracts(root) {
  for (const caption of findDescendants(root, (node) => hasIdentity(node, "grid_table_col_caption"))) {
    for (const title of findDescendants(caption, (node) => hasIdentity(node, "grid_table_col_title"))) {
      applyGridTableCaptionTitleTypography(title);
    }
  }
  for (const control of findDescendants(root, (node) => String(node?.type || "") === "dynamic-user")) {
    applyCollectionDynamicUserItemPadding(control);
  }
  for (const opMenu of findDescendants(root, (node) => hasIdentity(node, "grid_table_col_item_op_menu"))) {
    for (const button of findDescendants(opMenu, (node) => ["action_button", "button"].includes(String(node?.type || "")))) {
      button.attrs = button.attrs || {};
      button.attrs.button = button.attrs.button || {};
      button.attrs.button.normal = {
        ...(button.attrs.button.normal || {}),
        bg: COLLECTION_OP_MENU_BUTTON_TRANSPARENT_BG,
      };
    }
  }
}

function applyCollectionDynamicUserItemPadding(control) {
  control.attrs = control.attrs || {};
  control.attrs.item_style = control.attrs.item_style || {};
  control.attrs.item_style.pd = [null, { ...COLLECTION_DYNAMIC_USER_ZERO_ITEM_PADDING }];
}

function applyGridTableCaptionTitleTypography(control) {
  control.attrs = control.attrs || {};
  control.attrs.heads = control.attrs.heads || {};
  control.attrs.heads.ty = [...COLLECTION_GRID_TABLE_CAPTION_TITLE_TYPOGRAPHY];
}

function instantiateDashboardControlUuids(resource, pageSeed) {
  let index = 0;
  const referenceReplacements = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && UUID_CONTROL_ID_RE.test(node.id)) {
      const oldId = node.id;
      index += 1;
      node.id = deterministicUuid(`${pageSeed}:control:${index}:${node.id}`);
      if (!referenceReplacements.has(oldId)) referenceReplacements.set(oldId, node.id);
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(resource);
  if (!referenceReplacements.size) return;
  const replaceReferences = (node, key = "") => {
    if (Array.isArray(node)) {
      for (let itemIndex = 0; itemIndex < node.length; itemIndex += 1) node[itemIndex] = replaceReferences(node[itemIndex]);
      return node;
    }
    if (!node || typeof node !== "object") {
      if (typeof node !== "string" || key === "id") return node;
      let out = node;
      for (const [from, to] of referenceReplacements) out = out.split(from).join(to);
      return out;
    }
    for (const [childKey, child] of Object.entries(node)) {
      if (childKey === "id") continue;
      node[childKey] = replaceReferences(child, childKey);
    }
    return node;
  };
  replaceReferences(resource);
}

function normalizeSummaryRuntimeExtIds(resource) {
  for (const ext of Array.isArray(resource?.exts) ? resource.exts : []) {
    if (stringId(ext?.category || "") !== "___Pivot___" || stringId(ext?.key || "") !== "summary") continue;
    const summaryId = stringId(ext.i || "");
    if (!summaryId) continue;
    ext.id = summaryId;
    ext.ID = summaryId;
  }
}

function deterministicUuid(seed) {
  const hex = crypto.createHash("sha256").update(seed).digest("hex");
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

function buildDashboardKpiContracts({ pageName, summaryIdBase, primaryTempVar, plannedMetrics = [] }) {
  const pageSlug = slugify(pageName).replace(/-/g, "_");
  const specs = [
    ["planned_events", "Active Records"],
    ["approved_budget", "Approved Records"],
    ["registration_rate", "Completion Signal"],
    ["lead_follow_up", "Follow-up Queue"],
  ];
  return plannedMetrics.slice(0, specs.length).map((metric, index) => {
    const [key, fallbackLabel] = specs[index];
    const label = metric.metricName || fallbackLabel;
    const businessKey = slugify(label).replace(/-/g, "_") || key;
    const tempVar = index === 0 ? primaryTempVar : `tmp_${pageSlug}_${businessKey}_count`;
    const summaryId = index === 0 && UUID_CONTROL_ID_RE.test(String(summaryIdBase || ""))
      ? summaryIdBase
      : deterministicUuid(`${pageName}:${businessKey}:summary:${index}`);
    return { key, businessKey, label, tempVar, summaryId };
  });
}

function materializeDashboardKpiCards(resource, kpiContracts = [], context = {}) {
  const wrappers = findDescendants(resource, (node) => [
    "kpi_metrics_wrapper",
    "kpi_cards_wrapper",
    "kpi_cards_kpi_row",
    "kpi_cards_kpi_column",
  ].some((identity) => hasIdentity(node, identity)));
  if (!wrappers.length) return;
  let activeWrapperUsed = false;
  const processedWrappers = [];
  for (const wrapper of wrappers) {
    if (processedWrappers.some((parent) => nodeContains(parent, wrapper))) continue;
    const contracts = activeWrapperUsed ? [] : kpiContracts;
    materializeDashboardKpiCardsInWrapper(wrapper, contracts, context);
    if (contracts.length) activeWrapperUsed = true;
    processedWrappers.push(wrapper);
  }
}

function materializeDashboardKpiCardsInWrapper(wrapper, kpiContracts = [], context = {}) {
  const cardIds = ["event_portfolio_kpi_planned_events", "event_portfolio_kpi_approved_budget", "event_portfolio_kpi_registration_rate", "event_portfolio_kpi_lead_follow_up"];
  const contractsByKey = new Map(kpiContracts.map((contract) => [contract.key, contract]));
  const allowedKeys = new Set(contractsByKey.keys());
  let workbenchKpiIndex = 0;
  const prune = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      prune(child);
      if (hasIdentity(child, "kpi_card_wrapper")) {
        const contract = kpiContracts[workbenchKpiIndex++];
        if (!contract) return false;
        materializeWorkbenchKpiCard(child, contract);
        return true;
      }
      const matchedCardId = cardIds.find((id) => hasIdentity(child, id));
      if (!matchedCardId) return true;
      const key = matchedCardId.replace("event_portfolio_kpi_", "");
      const contract = contractsByKey.get(key);
      if (!contract || !allowedKeys.has(key)) return false;
      materializeEventPortfolioKpiCard(child, contract, context);
      return true;
    });
  };
  prune(wrapper);
}

function ensureVisibleKpiCards(resource, kpiContracts = [], context = {}) {
  if (!kpiContracts.length) return;
  const missingContracts = kpiContracts.filter((contract) => !hasVisibleKpiBinding(resource, summarySaveVariable(contract.tempVar)));
  if (!missingContracts.length) return;
  let wrapper = findFirstByIdentity(resource, "kpi_metrics_wrapper") || findFirstByIdentity(resource, "kpi_cards_wrapper") || findFirstByIdentity(resource, "kpi_cards_kpi_row");
  if (!wrapper) {
    wrapper = buildGeneratedKpiMetricsWrapper(kpiContracts, context);
    const content = findFirstByIdentity(resource, "Content") || findFirstByIdentity(resource, "content") || resource;
    content.children = Array.isArray(content.children) ? content.children : [];
    const firstBusinessSectionIndex = content.children.findIndex((child) => hasIdentity(child, "content_card_wrapper") || hasIdentity(child, "2_columns_section") || hasIdentity(child, "3_columns_section") || hasIdentity(child, "2_columns_60/40_section"));
    if (firstBusinessSectionIndex === -1) content.children.push(wrapper);
    else content.children.splice(firstBusinessSectionIndex, 0, wrapper);
    return;
  }
  materializeDashboardKpiCardsInWrapper(wrapper, kpiContracts, context);
}

function hasVisibleKpiBinding(root, saveVar) {
  const saveJson = JSON.stringify(saveVar);
  return findDescendants(root, (node) => {
    if (!node || node.type === "summary" || !isGeneratedTextLike(node)) return false;
    const title = node.attrs?.headc?.title || node.attrs?.title || {};
    return JSON.stringify(title?.variable ?? null).includes(saveJson) || JSON.stringify(title ?? null).includes(saveJson);
  }).length > 0;
}

function isGeneratedTextLike(node) {
  const type = String(node?.type || "").toLowerCase();
  const label = String(node?.label || "").toLowerCase();
  return ["heading", "text"].includes(type) || label === "text";
}

function buildGeneratedKpiMetricsWrapper(kpiContracts = [], context = {}) {
  const wrapper = clone(loadApprovedKpiMetricsWrapperTemplate());
  wrapper.generatedKpiRuntimeBound = true;
  wrapper.attrs = {
    ...(wrapper.attrs || {}),
    generatedKpiRuntimeBound: true,
  };
  materializeDashboardKpiCardsInWrapper(wrapper, kpiContracts, context);
  return wrapper;
}

function loadApprovedKpiMetricsWrapperTemplate() {
  const registry = JSON.parse(fs.readFileSync(DASHBOARD_V11_TEMPLATE_PATH, "utf8"));
  const wrapper = findFirstByRegistryIdentity(registry, "kpi_metrics_wrapper");
  if (!wrapper) {
    throw new Error("Approved dashboard KPI metrics wrapper template is missing.");
  }
  return wrapper._ak_c || wrapper;
}

function findFirstByRegistryIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    const control = node._ak_c || node;
    if (identityCandidates(control).some((candidate) => candidate === expected)) {
      found = control;
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(root);
  return found;
}

function nodeContains(root, target) {
  return findDescendants(root, (node) => node === target).length > 0;
}

function materializeWorkbenchKpiCard(card, contract) {
  card.generatedKpiRuntimeBound = true;
  card.attrs = {
    ...(card.attrs || {}),
    generatedKpiRuntimeBound: true,
  };
  const title = findFirstByIdentity(card, "kpi_card_summary_title");
  if (title) setHeadingText(title, contract.label);
  const value = findFirstByIdentity(card, "kpi_card_summary_value");
  if (value) {
    const saveVariable = summarySaveVariable(contract.tempVar);
    value.attrs = {
      ...(value.attrs || {}),
      headc: {
        ...(value.attrs?.headc || {}),
        title: {
          ...(value.attrs?.headc?.title || {}),
          variable: [saveVariable],
        },
      },
    };
    delete value.attrs.headc.title.value;
  }
}

function materializeEventPortfolioKpiCard(card, contract, context = {}) {
  card.generatedKpiRuntimeBound = true;
  card.attrs = {
    ...(card.attrs || {}),
    generatedKpiRuntimeBound: true,
    kpiKey: contract.businessKey || contract.key,
    sourceTemplateKpiKey: contract.key,
  };
  const sourceName = cleanResourceName(context.listName || context.sourceResource || "Records") || "Records";
  const label = findFirstByIdentity(card, `event_portfolio_kpi_${contract.key}_label`);
  if (label) setHeadingText(label, contract.label);
  const value = findFirstByIdentity(card, `event_portfolio_kpi_${contract.key}_value`);
  if (value) bindHeadingToSummaryVariable(value, contract);
  const trend = findFirstByIdentity(card, `event_portfolio_kpi_${contract.key}_trend`);
  if (trend) setHeadingText(trend, `${contract.label} signal`);
  const note = findFirstByIdentity(card, `event_portfolio_kpi_${contract.key}_note`);
  if (note) setHeadingText(note, `Live ${contract.label.toLowerCase()} metric from ${sourceName} records.`);
  scrubEventPortfolioKpiTemplateVariables(card, contract);
}

function bindHeadingToSummaryVariable(control, contract) {
  const saveVariable = summarySaveVariable(contract.tempVar);
  control.name = `${contract.label} Value`;
  control.title = `${contract.label} Value`;
  control.attrs = {
    ...(control.attrs || {}),
    headc: {
      ...(control.attrs?.headc || {}),
      title: {
        ...(control.attrs?.headc?.title || {}),
        variable: [saveVariable],
      },
    },
  };
  delete control.attrs.headc.title.value;
}

function scrubEventPortfolioKpiTemplateVariables(root, contract) {
  const saveVariable = summarySaveVariable(contract.tempVar);
  const valueControl = findFirstByIdentity(root, `event_portfolio_kpi_${contract.key}_value`);
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    const title = node.attrs?.headc?.title;
    if (title && Array.isArray(title.variable) && /event_portfolio/i.test(JSON.stringify(title.variable))) {
      if (node === valueControl) title.variable = [saveVariable];
      else delete title.variable;
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(root);
}

function normalizeDashboardFilters({ filters, listMeta, dashboardName }) {
  return [];
}

function materializeDashboardFilters(resource, { filters, listName, listId, filterIdPrefix, datasetRegion, host }) {
  // Page-level select-filter to Collection runtime linkage is intentionally disabled until an
  // export-proven empty-value bypass contract exists. Collection templates still provide proven
  // search-filter/fulltext behavior for generated dashboards.
  if (!filters.length) return;
  const filterGroup = host || findFirstByIdentity(resource, "section_content_area") || findFirstByIdentity(resource, "Content") || resource;
  filterGroup.children = Array.isArray(filterGroup.children) ? filterGroup.children : [];
  for (const [index, filter] of filters.entries()) {
    filterGroup.children.unshift(buildDashboardSelectFilter({
      filter,
      listName,
      listId,
      id: `${filterIdPrefix}_${index + 1}`,
      datasetRegion,
    }));
  }
}

function buildDashboardSelectFilter({ filter, listName, listId, id, datasetRegion }) {
  return {
    type: "select-filter",
    id,
    name: filter.filterName,
    title: filter.filterName,
    label: filter.filterName,
    binding: filter.variable,
    attrs: {
      nv_label: filter.filterName,
      nav_label: filter.filterName,
      display_f: filter.fieldName,
      value_f: filter.fieldName,
      lablay: [null, "top"],
      lab: { value: filter.filterName, ty: [null, "xs-light"], color: "#667085" },
      edit: {
        pcolor: "#98A2B3",
        placeholder: { color: "#98A2B3" },
        normal: { border: { radius: [null, 8] } },
      },
      placeholder: { value: `Select ${filter.filterName}` },
      common: {
        positioning: {
          widthtype: [null, "3"],
          width: [null, 200],
        },
      },
      data: {
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: filter.fieldName,
        displayField: filter.fieldName,
        valueField: filter.fieldName,
        filter: [],
        datasetRegion,
      },
      filterVar: filter.variable,
    },
  };
}

function materializeDashboardAnalytics(resource, { analyticsRecords, fallbackListMeta, listMetaByName, dashboardName, rootListSetId }) {
  const records = analyticsRecords || [];
  if (!records.length) return [];
  const slots = findDashboardAnalyticsSlots(resource);
  if (!slots.length) return [];
  const runtimeContracts = [];
  records.forEach((record, index) => {
    const sourceMeta = listMetaByName?.get(normKey(record.sourceResource)) || fallbackListMeta;
    const { root: module, runtimeContract } = buildDataAnalyticsTemplateInstance({
      record,
      listMeta: sourceMeta,
      dashboardName,
      instanceIndex: index,
      rootListSetId,
    });
    const slot = slots[index % slots.length];
    slot.children = Array.isArray(slot.children) ? slot.children : [];
    slot.children.push(module);
    if (runtimeContract) runtimeContracts.push(runtimeContract);
  });
  return runtimeContracts;
}

function findDashboardAnalyticsSlots(resource) {
  const allowedSectionIds = new Set(["content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
  const slots = [];
  for (const chartCards of findDescendants(resource, (node) => hasIdentity(node, "chart_cards_section"))) {
    slots.push(chartCards);
  }
  for (const section of findDescendants(resource, (node) => [...allowedSectionIds].some((identity) => hasIdentity(node, identity)))) {
    const slot = findFirstByIdentity(section, "section_content_area");
    if (slot) slots.push(slot);
  }
  return slots;
}

function materializeDashboardDataTables(resource, { dataTableRecords, fallbackListMeta, listMetaByName, dashboardName, rootListSetId }) {
  const records = dataTableRecords || [];
  if (!records.length) return;
  const slots = findDatasetSlots(resource);
  records.forEach((record, index) => {
    const sourceMeta = listMetaByName?.get(normKey(record.sourceResource)) || fallbackListMeta;
    const module = buildDataTableTemplateInstance({
      record,
      listMeta: sourceMeta,
      dashboardName,
      instanceIndex: index,
      rootListSetId,
    });
    const slot = slots[(index + 1) % Math.max(1, slots.length)] || slots[0] || findBusinessSectionContentArea(resource);
    if (!slot) return;
    slot.children = Array.isArray(slot.children) ? slot.children : [];
    slot.children.push(module);
  });
}

function buildDataTableTemplateInstance({ record, listMeta, dashboardName, instanceIndex, rootListSetId }) {
  const template = JSON.parse(fs.readFileSync(DATA_TABLE_TEMPLATE_PATHS[record.selectedTemplateId], "utf8"));
  const root = clone(template._ak_c || template.templateResource || template);
  const fields = selectDataTableFields(listMeta, record.displayColumns);
  const title = record.region || `${listMeta.listName} table`;
  root.id = deterministicUuid(`${dashboardName}:${record.selectedTemplateId}:${instanceIndex}:data-table`);
  root.name = title;
  root.title = title;
  root.templateId = record.selectedTemplateId;
  root.dataTableTemplateId = record.selectedTemplateId;
  root.derivedFromDataTableGoldenReference = record.selectedTemplateId;
  root.attrs = {
    ...(root.attrs || {}),
    templateId: record.selectedTemplateId,
    dataTableTemplateId: record.selectedTemplateId,
    derivedFromDataTableGoldenReference: record.selectedTemplateId,
    data: {
      ...(root.attrs?.data || {}),
      list: { AppID: 41, ListID: stringId(listMeta.listId), Type: 1, Title: listMeta.listName, ListSetID: stringId(rootListSetId) },
    },
    listarr: fields.map((field) => ({
      DisplayName: field.displayName,
      FieldName: field.displayName,
      Field: field.fieldName,
      Attrs: { table: { cw: [null, ""], cwu: [null, "px"] } },
    })),
  };
  if (record.selectedTemplateId === "data_table_control_caption_scroll") {
    root.attrs.caption = {
      ...(root.attrs.caption || {}),
      title,
      placeholder: `Search ${listMeta.listName}`,
      addtext: `Add ${listMeta.listName.replace(/s$/i, "") || "item"}`,
    };
  }
  return root;
}

function selectDataTableFields(listMeta, requestedColumns) {
  const fields = fieldsForDynamicControls(listMeta);
  const requested = String(requestedColumns || "").split(/[,;/]+/).map((value) => normKey(value)).filter(Boolean);
  const selected = requested.length
    ? fields.filter((field) => requested.some((item) => normKey(field.displayName) === item || normKey(field.fieldName) === item || normKey(field.displayName).includes(item) || item.includes(normKey(field.displayName))))
    : fields;
  return (selected.length ? selected : fields).slice(0, 8);
}

function findDatasetSlots(resource) {
  const slots = [];
  const primary = findBusinessSectionContentArea(resource);
  if (primary) slots.push(primary);
  for (const section of findDescendants(resource, (node) => ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"].some((identity) => hasIdentity(node, identity)))) {
    const slot = findFirstByIdentity(section, "section_content_area");
    if (slot && !slots.includes(slot)) slots.push(slot);
  }
  return slots;
}

function mergePageDependencies(dependencies) {
  return {
    tempVars: dependencies.flatMap((item) => normalizeDependencyArray(item.tempVars)),
    filterVars: dependencies.flatMap((item) => normalizeDependencyArray(item.filterVars)),
    actions: dependencies.flatMap((item) => normalizeDependencyArray(item.actions)),
    formAction: dependencies.flatMap((item) => normalizeDependencyArray(item.formAction)),
  };
}

function prepareTemplatePageDependencies(pageDependencies, replacements, scopePrefix) {
  const replaced = {
    tempVars: replaceCollectionTemplatePlaceholders(pageDependencies.tempVars || [], replacements),
    filterVars: replaceCollectionTemplatePlaceholders(pageDependencies.filterVars || [], replacements),
    actions: replaceCollectionTemplatePlaceholders(pageDependencies.actions || [], replacements),
    formAction: replaceCollectionTemplatePlaceholders(pageDependencies.formAction || [], replacements),
  };
  const maps = buildTemplateDependencyNameMaps(replaced, scopePrefix);
  return {
    dependencies: applyDependencyNameMaps(replaced, maps),
    maps,
  };
}

function buildTemplateDependencyNameMaps(pageDependencies, scopePrefix) {
  const maps = {
    filterVars: new Map(),
    tempVars: new Map(),
    actions: new Map(),
    formAction: new Map(),
  };
  for (const item of normalizeDependencyArray(pageDependencies.filterVars)) {
    const name = dependencyName(item);
    if (name) maps.filterVars.set(name, scopedDependencyName("filter", name, scopePrefix));
  }
  for (const item of normalizeDependencyArray(pageDependencies.tempVars)) {
    const name = dependencyName(item);
    if (name) maps.tempVars.set(name, scopedDependencyName("temp", name, scopePrefix));
  }
  for (const item of normalizeDependencyArray(pageDependencies.actions)) {
    const name = dependencyName(item);
    if (name) maps.actions.set(name, scopedDependencyName("action", name, scopePrefix));
  }
  for (const item of normalizeDependencyArray(pageDependencies.formAction)) {
    const name = dependencyName(item);
    if (name) maps.formAction.set(name, scopedDependencyName("formAction", name, scopePrefix));
  }
  return maps;
}

function dependencyName(item) {
  return String(item?.name || item?.key || item?.id || item?.ID || "").trim();
}

function scopedDependencyName(kind, name, scopePrefix) {
  const raw = String(name || "").trim();
  const scope = slugify(scopePrefix || "template").replace(/-/g, "_").slice(0, 44) || "template";
  if (!raw) return raw;
  if (kind === "filter") {
    const suffix = raw.replace(/^__filter_/, "").replace(/^filter_/, "") || "value";
    const normalizedSuffix = safeDependencyIdentifier(suffix, { lower: true }) || "value";
    return `filter_${scope}_${normalizedSuffix}`;
  }
  if (kind === "temp") {
    const suffix = raw.replace(/^__temp_/, "").replace(/^var_/, "") || "value";
    const normalizedSuffix = safeDependencyIdentifier(suffix) || "value";
    return `var_${scope}_${normalizedSuffix}`;
  }
  const normalizedName = safeDependencyIdentifier(raw) || "action";
  return `${scope}_${normalizedName}`;
}

function safeDependencyIdentifier(value, options = {}) {
  const raw = options.lower ? String(value || "").toLowerCase() : String(value || "");
  return raw.replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

function applyDependencyNameMaps(value, maps) {
  const visit = (node) => {
    if (typeof node === "string") return rewriteDependencyString(node, maps);
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) node[index] = visit(node[index]);
      return node;
    }
    if (!node || typeof node !== "object") return node;
    for (const key of Object.keys(node)) {
      const mappedKey = rewriteDependencyObjectKey(key, maps);
      const nextValue = visit(node[key]);
      if (mappedKey !== key) {
        delete node[key];
        node[mappedKey] = nextValue;
      } else {
        node[key] = nextValue;
      }
    }
    return node;
  };
  return visit(clone(value));
}

function rewriteDependencyObjectKey(key, maps) {
  for (const map of [maps.actions, maps.formAction, maps.filterVars, maps.tempVars]) {
    if (map.has(key)) return map.get(key);
  }
  return key;
}

function rewriteDependencyString(value, maps) {
  let out = value;
  for (const [oldName, newName] of maps.filterVars) {
    if (out === oldName) out = newName;
    out = out.split(`__filter_${oldName}`).join(`__filter_${newName}`);
  }
  for (const [oldName, newName] of maps.tempVars) {
    if (out === oldName) out = newName;
    out = out.split(`__temp_${oldName}`).join(`__temp_${newName}`);
  }
  for (const [oldName, newName] of maps.actions) {
    if (out === oldName) out = newName;
  }
  for (const [oldName, newName] of maps.formAction) {
    if (out === oldName) out = newName;
  }
  return out;
}

function buildDataAnalyticsTemplateInstance({ record, listMeta, dashboardName, instanceIndex, rootListSetId }) {
  const reference = dataAnalyticsReference(record.selectedTemplateId);
  const template = JSON.parse(fs.readFileSync(DATA_ANALYTICS_TEMPLATE_PATHS[record.selectedTemplateId], "utf8"));
  const root = clone(template._ak_c || template.templateResource || template);
  const title = record.businessQuestion || record.analyticsRegion || reference.displayName || "Analytics";
  root.dataAnalyticsTemplateId = record.selectedTemplateId;
  root.templateId = record.selectedTemplateId;
  root.derivedFromDataAnalyticsGoldenReference = record.selectedTemplateId;
  root.attrs = {
    ...(root.attrs || {}),
    dataAnalyticsTemplateId: record.selectedTemplateId,
    templateId: record.selectedTemplateId,
    derivedFromDataAnalyticsGoldenReference: record.selectedTemplateId,
    appPlanAnalyticsRegion: record.analyticsRegion,
  };
  normalizeAnalyticsContainerContracts(root);
  if (root.id) root.id = `${slugify(dashboardName)}_${slugify(record.selectedTemplateId)}_${instanceIndex + 1}`;
  if (reference.titleControlId) setHeadingText(findFirstByIdentity(root, reference.titleControlId), title);
  const analyticsControl = reference.controlType === String(root.type || "")
    ? root
    : findFirstByType(root, reference.controlType);
  let runtimeContract = null;
  if (analyticsControl) {
    const groupingField = resolveAnalyticsField(listMeta, record.groupingFields) || fieldsForDynamicControls(listMeta)[0];
    const valueField = analyticsCountField(listMeta);
    if (!analyticsControl.id || !UUID_CONTROL_ID_RE.test(String(analyticsControl.id))) {
      analyticsControl.id = deterministicUuid(`${dashboardName}:${record.selectedTemplateId}:${instanceIndex}:analytics-control`);
    }
    analyticsControl.dataAnalyticsTemplateId = record.selectedTemplateId;
    analyticsControl.templateId = record.selectedTemplateId;
    analyticsControl.derivedFromDataAnalyticsGoldenReference = record.selectedTemplateId;
    analyticsControl.runtimeModelProven = true;
    analyticsControl.attrs = {
      ...(analyticsControl.attrs || {}),
      dataAnalyticsTemplateId: record.selectedTemplateId,
      templateId: record.selectedTemplateId,
      derivedFromDataAnalyticsGoldenReference: record.selectedTemplateId,
      runtimeModelProven: true,
      data: {
        ...(analyticsControl.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listMeta.listId), ListSetID: stringId(rootListSetId), Type: 1, Title: listMeta.listName },
        source: listMeta.listName,
        sourceResourceType: "Data list",
        fields: [
          { fieldName: groupingField.fieldName, role: "group", displayName: groupingField.displayName },
          { fieldName: valueField.fieldName, role: "value", displayName: valueField.displayName, aggregate: "COUNT" },
        ],
        groupBy: groupingField.fieldName,
        axisField: groupingField.fieldName,
        categoryField: groupingField.fieldName,
        valueField: valueField.fieldName,
        aggregate: "COUNT",
        title,
      },
      model: {
        source: { AppID: 41, ListID: stringId(listMeta.listId), ListSetID: stringId(rootListSetId), Type: 1, Title: listMeta.listName },
        categoryField: groupingField.fieldName,
        valueField: valueField.fieldName,
        aggregate: "COUNT",
        runtimeModelProven: true,
      },
      series: [
        {
          name: title,
          categoryField: groupingField.fieldName,
          valueField: valueField.fieldName,
          aggregate: "COUNT",
        },
      ],
      rows: analyticsControl.attrs?.rows || { fields: [groupingField.fieldName] },
      columns: analyticsControl.attrs?.columns || { fields: [] },
      values: analyticsControl.attrs?.values || [{
        field: valueField.fieldName,
        fieldName: valueField.fieldName,
        FieldName: valueField.fieldName,
        id: valueField.fieldName,
        aggregate: "COUNT",
      }],
    };
    runtimeContract = buildDataAnalyticsRuntimeContract({
      controlId: analyticsControl.id,
      reference,
      listMeta,
      rootListSetId,
      groupingField,
      valueField,
      title,
    });
  }
  return { root, runtimeContract };
}

function buildDataAnalyticsRuntimeContract({ controlId, reference, listMeta, rootListSetId, groupingField, valueField, title }) {
  const controlType = String(reference.controlType || "");
  const extKey = controlType === "pivot-table" ? "PivotTable" : controlType;
  const chartType = runtimeChartTypeCode(reference);
  const rowField = runtimeFieldRef(groupingField, "row");
  if (requiresDateTrendRow(reference, groupingField)) rowField.func = "DATE";
  const valueRef = {
    ...runtimeFieldRef(valueField, "value"),
    func: "COUNT",
    aggregate: "COUNT",
    label: title,
  };
  const settings = {
    rows: [rowField],
    columns: [],
    values: [valueRef],
  };
  const attr = {
    AppID: 41,
    ListID: stringId(listMeta.listId),
    ListSetID: stringId(rootListSetId),
    settings,
  };
  if (controlType !== "pivot-table") attr.chartType = chartType;
  return {
    controlId,
    ext: {
      i: controlId,
      category: "___Pivot___",
      key: extKey,
      attr,
    },
  };
}

function runtimeChartTypeCode(reference) {
  const chartKind = String(reference?.semanticChartKind || reference?.controlType || "").toLowerCase();
  if (chartKind === "pie-chart") return "0";
  if (chartKind === "line-chart" || chartKind === "area-chart") return "1";
  if (chartKind === "bar-chart" || chartKind === "column-chart") return "2";
  return "";
}

function requiresDateTrendRow(reference, field) {
  const chartKind = String(reference?.semanticChartKind || reference?.controlType || "").toLowerCase();
  if (chartKind !== "line-chart" && chartKind !== "area-chart") return false;
  return isDateLikeAnalyticsField(field);
}

function isDateLikeAnalyticsField(field) {
  return /date|datetime|time|created|modified|period|month|week|year/i.test(`${field?.fieldName || field?.FieldName || ""} ${field?.displayName || field?.DisplayName || ""} ${field?.fieldType || field?.FieldType || ""} ${field?.controlType || field?.Type || ""}`);
}

function runtimeFieldRef(field, role) {
  const fieldName = String(field?.fieldName || field?.FieldName || "ListDataID");
  return {
    field: fieldName,
    fieldName,
    FieldName: fieldName,
    id: role === "value" ? fieldName : String(field?.fieldId || field?.FieldID || fieldName),
    label: String(field?.displayName || field?.DisplayName || fieldName),
    role,
  };
}

function analyticsCountField(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  const listDataId = fields.find((field) => String(field.fieldName || field.FieldName || "") === "ListDataID");
  return listDataId || {
    fieldName: "ListDataID",
    FieldName: "ListDataID",
    fieldId: "ListDataID",
    FieldID: "ListDataID",
    displayName: "Record ID",
    DisplayName: "Record ID",
    fieldType: "Text",
    FieldType: "Text",
  };
}

function normalizeAnalyticsContainerContracts(root) {
  for (const container of findDescendants(root, (node) => String(node?.type || "") === "container")) {
    container.attrs = container.attrs || {};
    container.attrs.style = {
      ...(container.attrs.style || {}),
      widthtype: normalizeWidthType(container.attrs.style?.widthtype),
      direction: container.attrs.style?.direction || [null, "column"],
      gap: container.attrs.style?.gap || [null, 12],
      align_items: container.attrs.style?.align_items || [null, "stretch"],
      justify_content: container.attrs.style?.justify_content || [null, "flex-start"],
    };
  }
}

function normalizeWidthType(value) {
  if (Array.isArray(value) && ["1", "2", "3"].includes(String(value[1]))) return value;
  return [null, "1"];
}

function resolveAnalyticsField(listMeta, requestedFields) {
  const requested = String(requestedFields || "").split(/[,;/]+/).map((value) => normKey(value)).filter(Boolean);
  const fields = fieldsForDynamicControls(listMeta);
  if (!requested.length) {
    return fields.find((field) => /status|category|type|priority|date|owner|assigned|user/i.test(`${field.displayName} ${field.fieldName}`)) || fields[0] || null;
  }
  return fields.find((field) => requested.some((item) => normKey(field.displayName) === item || normKey(field.fieldName) === item || normKey(field.displayName).includes(item) || item.includes(normKey(field.displayName)))) || fields[0] || null;
}

function dataAnalyticsReference(templateId) {
  if (!dataAnalyticsReference.cache) {
    const registry = JSON.parse(fs.readFileSync(DATA_ANALYTICS_REGISTRY_PATH, "utf8"));
    dataAnalyticsReference.cache = new Map((registry.references || []).map((reference) => [reference.templateId, reference]));
  }
  return dataAnalyticsReference.cache.get(templateId) || { templateId, displayName: templateId, controlType: "bar-chart" };
}

function buildCollectionFilterConditions(filters) {
  return (filters || []).map((filter) => ({
    key: `filter_${slugify(filter.variable)}`,
    pre: "and",
    left: filter.fieldName,
    field: filter.fieldName,
    op: "9",
    operator: "9",
    right: [{ exprType: "variable", valueType: "string", id: `__filter_${filter.variable}`, type: "expr", name: filter.variable }],
    showCus: false,
    sourceFilterId: filter.controlId,
  }));
}

function buildCollectionFullTextConditions(filters) {
  return (filters || []).map((filter) => ({
    fields: [filter.fieldName],
    field: filter.fieldName,
    value: [{ exprType: "variable", valueType: "string", id: `__filter_${filter.variable}`, type: "expr", name: filter.variable }],
    sourceFilterId: filter.controlId,
  }));
}

function buildDashboardPageLayoutShell({ name, templateId = PAGE_LAYOUT_TEMPLATE_ID }) {
  const registry = JSON.parse(fs.readFileSync(DASHBOARD_V11_TEMPLATE_PATH, "utf8"));
  const template = registry.templates?.find((item) => item?.id === templateId) || registry.templates?.find((item) => item?.id === PAGE_LAYOUT_TEMPLATE_ID) || registry.templates?.[0];
  const selectedTemplateId = template?.id || PAGE_LAYOUT_TEMPLATE_ID;
  const resource = clone(template?.template?.parsedResource || {});
  resource.__pageLayoutDependencies = {
    filterVars: clone(template?.template?.parsedResource?.filterVars || template?.filterVars || []),
    tempVars: clone(template?.template?.parsedResource?.tempVars || template?.tempVars || []),
    actions: clone(template?.template?.parsedResource?.actions || template?.actions || []),
    formAction: clone(template?.template?.parsedResource?.formAction || template?.formAction || []),
  };
  resource.id = `${slugify(name)}_${slugify(selectedTemplateId)}_root`;
  resource.name = name;
  resource.title = name;
  resource.ver = "1.0.0";
  resource.derivedFromGoldenReference = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.goldenReferenceId = DASHBOARD_GOLDEN_REFERENCE_ID;
  resource.templateMarker = selectedTemplateId;
  resource.derivedFromDashboardPageLayoutTemplate = selectedTemplateId;
  resource.attrs = {
    ...(resource.attrs || {}),
    derivedFromGoldenReference: DASHBOARD_GOLDEN_REFERENCE_ID,
    templateMarker: selectedTemplateId,
    dashboardPageLayoutTemplateId: selectedTemplateId,
    derivedFromDashboardPageLayoutTemplate: selectedTemplateId,
  };
  removeOperationsWithoutActions(resource);
  return resource;
}

function summarySaveVariable(tempVar) {
  return {
    exprType: "variable",
    valueType: "string",
    id: `__temp_${tempVar}`,
    type: "expr",
    name: tempVar,
  };
}

function buildSummaryFieldMetadata() {
  return {
    FieldID: "ListDataID",
    FieldName: "ListDataID",
    InternalName: "ListDataID",
    DisplayName: "Record ID",
    FieldType: "Text",
    Type: "text",
    IsSystem: true,
    IsIndex: true,
    Status: 0,
  };
}

function buildHiddenSummaryHost({ dashboardName, summaries }) {
  return {
    type: "container",
    id: `${slugify(dashboardName)}_kpi_data_host`,
    name: "KPI data host",
    title: "KPI data host",
    attrs: {
      nv_label: "KPI data host",
      common: { hide: [null, true, true, true] },
      style: {
        direction: [null, "row"],
        widthtype: [null, "1"],
        gap: [null, 0],
        align_items: [null, "center"],
        justify_content: [null, "flex-start"],
      },
      display: { rule: "1 == 0" },
    },
    children: summaries,
  };
}

function findDashboardHiddenSummaryHostParent(resource) {
  const kpiSlotIdentities = [
    "event_portfolio_kpi_planned_events",
    "event_portfolio_kpi_approved_budget",
    "event_portfolio_kpi_registration_rate",
    "event_portfolio_kpi_lead_follow_up",
    "kpi_card_wrapper",
  ];
  for (const identity of kpiSlotIdentities) {
    const slot = findFirstByIdentity(resource, identity);
    if (slot) return slot;
  }
  return null;
}

function buildSummaryControl({ summaryId, tempVar, listName, listId, rootListSetId, label = "Active Records" }) {
  const saveVariable = summarySaveVariable(tempVar);
  const fieldMetadata = buildSummaryFieldMetadata();
  const source = { AppID: 41, ListID: stringId(listId), ListSetID: stringId(rootListSetId), Type: 1, Title: listName };
  return {
    type: "summary",
    id: summaryId,
    name: `${label} Summary`,
    title: `${label} Summary`,
    runtimeModelProven: true,
    attrs: {
      runtimeModelProven: true,
      control_display: { hidden: true },
      data: {
        list: source,
        source,
        AppID: 41,
        ListSetID: stringId(rootListSetId),
        ListID: stringId(listId),
        aggregation: "COUNT",
        field: fieldMetadata,
        fieldName: "ListDataID",
        fieldObject: fieldMetadata,
        fieldInfo: fieldMetadata,
      },
      field: fieldMetadata,
      fieldObject: fieldMetadata,
      fieldInfo: fieldMetadata,
      allowAllRecords: true,
      save_var: saveVariable,
      saveVar: saveVariable,
    },
    save_var: saveVariable,
    saveVar: saveVariable,
  };
}

function buildCollectionTemplateInstance({ templateId, dashboardName, datasetRegion, listName, rootListSetId, listId, listMeta, detailLayoutId, filterBindings, collectionId }) {
  const template = loadCollectionTemplate(templateId);
  const root = clone(template?.templateResource?.rootContainer || {});
  reinstantiateTemplateUuidValues(root);
  const dependencyScope = `${dashboardName}_${datasetRegion || listName || templateId}_${collectionId}`;
  const scopedPageDependencies = prepareTemplatePageDependencies(
    template.pageLevelDependencies || {},
    { rootListSetId, listId, detailLayoutId },
    dependencyScope,
  );
  const scopedRoot = applyDependencyNameMaps(root, scopedPageDependencies.maps);
  Object.keys(root).forEach((key) => delete root[key]);
  Object.assign(root, scopedRoot);
  root.id = `${collectionId}_${slugify(templateId)}_wrapper`;
  root.name = datasetRegion;
  root.datasetRegion = datasetRegion;
  root.datasetRegionName = datasetRegion;
  root.appPlanDatasetRegion = datasetRegion;
  root.datasetPresentationTemplateId = templateId;
  root.derivedFromDatasetPresentationTemplate = templateId;
  root.attrs = {
    ...(root.attrs || {}),
    datasetRegion,
    datasetRegionName: datasetRegion,
    appPlanDatasetRegion: datasetRegion,
    datasetPresentationTemplateId: templateId,
    derivedFromDatasetPresentationTemplate: templateId,
  };
  if (GRID_TABLE_TEMPLATE_IDS.has(templateId)) enforceGridWrapperGap(root);
  const collection = findFirstByType(root, "collection");
  if (collection) {
    if (GRID_TABLE_TEMPLATE_IDS.has(templateId)) enforceContainerGap(findParent(root, collection));
    const filterConditions = buildCollectionFilterConditions(filterBindings);
    const fullTextConditions = buildCollectionFullTextConditions(filterBindings);
    const detailLink = detailLayoutId || "";
    collection.id = collectionId;
    collection.name = `${datasetRegion} Collection`;
    collection.title = `${datasetRegion} Collection`;
    collection.datasetRegion = datasetRegion;
    collection.datasetPresentationTemplateId = templateId;
    collection.derivedFromDatasetPresentationTemplate = templateId;
    collection.attrs = {
      ...(collection.attrs || {}),
      datasetPresentationTemplateId: templateId,
      derivedFromDatasetPresentationTemplate: templateId,
      templateId,
      sourceResourceType: "Data list",
      data: {
        ...(collection.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        source: listName,
        sourceResourceType: "Data list",
        datasetRegion,
        datasetPresentationTemplateId: templateId,
        field: primaryFieldName(listMeta),
        sort: [{ SortName: primarySortFieldName(listMeta), SortByDesc: false }],
        filter: filterConditions,
        fulltext: fullTextConditions,
        link: detailLink,
        opentype: detailLink ? "slide" : "none",
        modalsize: detailLink ? 2 : null,
        detailOpenBehavior: detailLink ? "slide" : "none",
        disableOpen: !detailLink,
        filterBindings: filterBindings.map((filter) => ({ name: filter.variable, id: `__filter_${filter.variable}`, field: filter.fieldName, sourceFilterId: filter.controlId })),
      },
      actions: ensureCollectionActions(collection.attrs?.actions),
      layout: {
        ...(collection.attrs?.layout || {}),
        col: collection.attrs?.layout?.col || [null, { desktop: 3, tablet: 2, mobile: 1 }],
      },
    };
  }
  if (collection && detailLayoutId) {
    collection.attrs.data.link = detailLayoutId;
    collection.attrs.data.opentype = "slide";
    collection.attrs.data.modalsize = 2;
  }
  rewriteCollectionTemplateRuntimeRefs(root, { rootListSetId, listId, detailLayoutId });
  const bindableFields = fieldsForDynamicControls(listMeta);
  let dynamicIndex = 0;
  for (const control of findDescendants(root, (node) => String(node?.type || "").startsWith("dynamic-"))) {
    const field = selectFieldForDynamicControl(control, bindableFields, dynamicIndex);
    dynamicIndex += 1;
    control.type = dynamicControlTypeForField(field);
    control.attrs = {
      ...(control.attrs || {}),
      source: "3",
      "obj-f": field.fieldName,
      field: field.fieldName,
      fieldName: field.fieldName,
      data: {
        ...(control.attrs?.data || {}),
        ListID: stringId(listId),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: field.fieldName,
        fieldName: field.fieldName,
      },
    };
    control.field = field.fieldName;
    control.FieldName = field.fieldName;
    if (control.type === "dynamic-user") {
      control.attrs.user = {
        ...(control.attrs.user || {}),
        field: field.fieldName,
        fieldName: field.fieldName,
      };
      applyCollectionDynamicUserItemPadding(control);
    }
    control.name = field.displayName;
    control.title = field.displayName;
    control.label = field.displayName;
    if (control.type !== "dynamic-user") replaceUserLikeDynamicFieldText(control, field.displayName);
  }
  for (const search of findDescendants(root, (node) => String(node?.type || "") === "search-filter")) {
    search.attrs = {
      ...(search.attrs || {}),
      placeholder: `Search ${listName}`,
      data: {
        ...(search.attrs?.data || {}),
        list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName },
        field: primaryFieldName(listMeta),
      },
    };
  }
  wireTemplateSearchFiltersToCollection(root, { listMeta });
  if (templateId === "collection_control_grid_table_with_multiselect") {
    enforceFullWidth(root, ["grid_table_col_multiselect_wrapper", "grid_table_col_caption", "grid_table_col_content"]);
  }
  if (templateId === "collection_control_responsive_card_grid") {
    removeUnavailableImageControls(root);
  }
  replaceTemplateResidue(root, { datasetRegion, listName });
  setTitleText(root, datasetRegion);
  enforceSchemaBoundCollectionTemplate(root, { listMeta });
  sanitizeCollectionRuntimeReferences(root, {
    rootListSetId,
    listId,
    detailLayoutId,
  });
  enforceCollectionTemplateStyleContracts(root);
  root.pageLevelDependencies = scopedPageDependencies.dependencies;
  root.generatedFrom = { dashboardName, templateId, sourceResource: listName };
  return root;
}

function wireTemplateSearchFiltersToCollection(root, { listMeta }) {
  const searches = findDescendants(root, (node) => String(node?.type || "") === "search-filter");
  const collection = findFirstByType(root, "collection");
  if (!searches.length || !collection) return;
  collection.attrs = collection.attrs || {};
  collection.attrs.data = collection.attrs.data || {};
  collection.attrs.data.fulltext = Array.isArray(collection.attrs.data.fulltext) ? collection.attrs.data.fulltext : [];
  for (const search of searches) {
    const binding = String(search?.binding || search?.attrs?.binding || "").trim();
    const variable = binding.startsWith("__filter_") ? binding.slice("__filter_".length) : "";
    if (!variable) continue;
    const fieldName = String(search?.attrs?.data?.field || primaryFieldName(listMeta) || "Title");
    const alreadyFulltext = collection.attrs.data.fulltext.some((item) => JSON.stringify(item).includes(`__filter_${variable}`) || JSON.stringify(item).includes(`"name":"${variable}"`));
    if (!alreadyFulltext) {
      collection.attrs.data.fulltext.push({
        fields: [fieldName],
        field: fieldName,
        value: [{ exprType: "variable", valueType: "string", id: `__filter_${variable}`, type: "expr", name: variable }],
        sourceFilterId: search.id || search.attrs?.id || variable,
      });
    }
  }
}

function enforceSchemaBoundCollectionTemplate(root, { listMeta }) {
  const fieldMap = new Map();
  for (const field of fieldsForDynamicControls(listMeta)) {
    fieldMap.set(normKey(field.fieldName), field);
    fieldMap.set(normKey(field.displayName), field);
  }
  const allowedFields = new Set([...fieldMap.keys(), "listdataid", "created", "createdby", "modified", "modifiedby", "owner"]);
  pruneInvalidProgressControls(root, { fieldMap, allowedFields });
  pruneGridTableColumnsBySchema(root, { fieldMap, allowedFields });
}

function pruneInvalidProgressControls(root, { fieldMap, allowedFields }) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (!isProgressControl(child)) return true;
      return isProgressControlSchemaValid(child, { fieldMap, allowedFields });
    });
  };
  visit(root);
}

function pruneGridTableColumnsBySchema(root, { fieldMap, allowedFields }) {
  const headerRows = findDescendants(root, (node) => hasIdentity(node, "grid_table_col_header"));
  const itemRows = findDescendants(root, (node) => hasIdentity(node, "grid_col_item"));
  for (const headerRow of headerRows) {
    if (!Array.isArray(headerRow.children)) continue;
    const nearestItemRow = itemRows[0];
    const seenLabels = new Set();
    const keepIndexes = [];
    for (const [index, headerCell] of headerRow.children.entries()) {
      const itemCell = nearestItemRow?.children?.[index];
      const label = normalizedColumnLabel(headerCell, index);
      const duplicateLabel = label && seenLabels.has(label);
      const invalidHeader = hasInvalidCollectionFieldReference(headerCell, allowedFields);
      const invalidItem = itemCell ? hasInvalidCollectionFieldReference(itemCell, allowedFields) : false;
      const invalidProgress = itemCell ? hasInvalidProgressColumn(itemCell, { fieldMap, allowedFields }) : false;
      if (!duplicateLabel && !invalidHeader && !invalidItem && !invalidProgress) {
        keepIndexes.push(index);
        if (label) seenLabels.add(label);
      }
    }
    if (keepIndexes.length && keepIndexes.length < headerRow.children.length) {
      headerRow.children = keepIndexes.map((index) => headerRow.children[index]).filter(Boolean);
      if (nearestItemRow && Array.isArray(nearestItemRow.children)) {
        nearestItemRow.children = keepIndexes.map((index) => nearestItemRow.children[index]).filter(Boolean);
      }
    }
  }
}

function normalizedColumnLabel(cell, index) {
  const text = visibleBusinessText(cell) || firstVisibleTextValue(cell) || `column-${index + 1}`;
  return normKey(text.replace(/\bcollection item:[^ ]+/gi, "").trim()) || `column-${index + 1}`;
}

function hasInvalidProgressColumn(node, { fieldMap, allowedFields }) {
  const progressControls = findDescendants(node, (control) => isProgressControl(control));
  if (!progressControls.length) return false;
  return progressControls.some((control) => !isProgressControlSchemaValid(control, { fieldMap, allowedFields }));
}

function isProgressControl(control) {
  const type = String(control?.type || "").toLowerCase();
  return type === "progress" || type === "progress-bar" || type === "progress-circle" || /\bprogress\b/i.test(identityCandidates(control).join(" "));
}

function isProgressControlSchemaValid(control, { fieldMap, allowedFields }) {
  const refs = collectionContextFieldRefs(control);
  if (!refs.length) return false;
  return refs.every((fieldName) => {
    const key = normKey(fieldName);
    if (!allowedFields.has(key)) return false;
    const field = fieldMap.get(key);
    if (!field) return false;
    return /decimal|number|percent|input_number|currency|amount/i.test(`${field.fieldType || ""} ${field.controlType || ""} ${field.Type || ""} ${field.displayName || ""}`);
  });
}

function hasInvalidCollectionFieldReference(node, allowedFields) {
  return collectionContextFieldRefs(node).some((fieldName) => !allowedFields.has(normKey(fieldName)));
}

function collectionContextFieldRefs(node) {
  const refs = [];
  const visit = (current) => {
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }
    if (!current || typeof current !== "object") return;
    const ctx = String(current.ctx || current.context || "").trim();
    if (ctx === "__ctx_coll" || /Collection item:/i.test(String(current.name || ""))) {
      const id = String(current.id || current.field || current.FieldName || current.fieldName || current.prop || "").trim();
      if (id) refs.push(id);
      const nameMatch = String(current.name || "").match(/Collection item:([A-Za-z0-9_ -]+)/i);
      if (nameMatch) refs.push(nameMatch[1].trim());
    }
    for (const child of Object.values(current)) visit(child);
  };
  visit(node);
  return unique(refs.map((value) => cleanResourceName(value)).filter(Boolean));
}

function reinstantiateTemplateUuidValues(root) {
  const replacements = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && UUID_CONTROL_ID_RE.test(value)) {
        if (!replacements.has(value)) replacements.set(value, crypto.randomUUID());
        node[key] = replacements.get(value);
      } else {
        visit(value);
      }
    }
  };
  visit(root);
  return replacements;
}

function sanitizeCollectionRuntimeReferences(root, { rootListSetId, listId, detailLayoutId }) {
  const removedActionIds = new Set();
  for (const collection of findDescendants(root, (node) => String(node?.type || "") === "collection")) {
    const actions = Array.isArray(collection?.attrs?.actions) ? collection.attrs.actions : [];
    const keptActions = [];
    for (const action of actions) {
      if (!detailLayoutId && isDetailLayoutAction(action)) {
        for (const actionId of actionIdentityCandidates(action)) removedActionIds.add(actionId);
        continue;
      }
      keptActions.push(replaceCollectionTemplatePlaceholders(action, { rootListSetId, listId, detailLayoutId }));
    }
    collection.attrs = collection.attrs || {};
    collection.attrs.actions = keptActions;
  }
  replaceCollectionTemplatePlaceholders(root, { rootListSetId, listId, detailLayoutId }, { mutate: true });
  if (removedActionIds.size) pruneActionButtonsForRemovedActions(root, removedActionIds);
}

function isDetailLayoutAction(action) {
  const text = JSON.stringify(action || {});
  if (text.includes("{{DetailLayoutID}}")) return true;
  return /"op_type"\s*:\s*"edit"/i.test(text) && /"type"\s*:\s*"listitem"/i.test(text);
}

function actionIdentityCandidates(action) {
  return [
    action?.id,
    action?.ID,
    action?.name,
    action?.Name,
    action?.attrs?.id,
    action?.attrs?.name,
    action?.attrs?.control_action,
  ].map((value) => String(value || "").trim()).filter(Boolean);
}

function pruneActionButtonsForRemovedActions(root, removedActionIds) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      const actionId = String(child?.attrs?.control_action || child?.attrs?.action || child?.control_action || child?.action || "").trim();
      if (String(child?.type || "") === "action_button" && actionId && removedActionIds.has(actionId)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function replaceCollectionTemplatePlaceholders(value, { rootListSetId, listId, detailLayoutId }, options = {}) {
  const replacements = {
    "{{ListSetID}}": stringId(rootListSetId || ""),
    "{{ListID}}": stringId(listId || ""),
    "{{DetailLayoutID}}": stringId(detailLayoutId || ""),
    "{{sourceLongId}}": stringId(detailLayoutId || ""),
  };
  const visit = (node) => {
    if (typeof node === "string") {
      let out = node;
      for (const [token, replacement] of Object.entries(replacements)) out = out.split(token).join(replacement);
      return out;
    }
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) node[index] = visit(node[index]);
      return node;
    }
    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) node[key] = visit(child);
      return node;
    }
    return node;
  };
  const target = options.mutate ? value : clone(value);
  return visit(target);
}

function replaceUserLikeDynamicFieldText(control, replacement) {
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string" && /\b(user|owner|assignee|requester|borrower|manager|approver|person|people|accountid|account id)\b/i.test(value)) {
        node[key] = replacement;
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  };
  visit(control);
}

function selectFieldForDynamicControl(control, fields, index, context = {}) {
  const semanticField = selectSemanticFieldForDynamicControl(control, fields, context);
  if (semanticField) return semanticField;
  const type = String(control?.type || "");
  const expectedType = ["dynamic-user", "dynamic-image", "dynamic-file"].includes(type) ? type : "dynamic-field";
  const compatible = fields.filter((field) => dynamicControlTypeForField(field) === expectedType);
  if (compatible.length) return compatible[index % compatible.length];
  return fields[index % fields.length] || fields[0];
}

function selectSemanticFieldForDynamicControl(control, fields, { root } = {}) {
  if (!fields?.length) return null;
  if (hasIdentity(control, "current_item_subject") || hasIdentity(control, "left_panel_data_item_title")) {
    return findFieldBySemanticTokens(fields, ["subject", "title", "name", "number"]) || fields.find((field) => field.fieldName === "Title") || fields[0];
  }
  const hint = masterDetailFieldHint(root, control);
  if (!hint) return null;
  const tokens = semanticFieldTokensForHint(hint, fields);
  if (!tokens.length) return null;
  return findFieldBySemanticTokens(fields, tokens);
}

function masterDetailFieldHint(root, control) {
  if (!root || !control) return "";
  const parent = findParent(root, control);
  const wrapper = parent && (
    hasIdentity(parent, "current_item_standard_field") || hasIdentity(parent, "current_item_large_field")
      ? parent
      : findParent(root, parent)
  );
  if (!wrapper || (!hasIdentity(wrapper, "current_item_standard_field") && !hasIdentity(wrapper, "current_item_large_field"))) return "";
  const titleControl = findFirstByIdentity(wrapper, "current_item_standard_field_title")
    || findFirstByIdentity(wrapper, "current_item_large_field_title");
  return firstVisibleTextValue(titleControl) || visibleBusinessText(titleControl) || "";
}

function semanticFieldTokensForHint(hint, fields) {
  const text = normKey(hint);
  if (!text) return [];
  if (/\b(ticket|request|loan|review)?\s*(id|number|no)\b/.test(text)) return ["ticket number", "request number", "review number", "loan number", "number", "id", "title"];
  if (/\b(subject|summary|title|name)\b/.test(text)) return ["subject", "summary", "title", "name"];
  if (/\btype of request\b|\brequest type\b|\btype\b/.test(text)) {
    const hasType = fields.some((field) => /\btype\b/i.test(field.displayName || ""));
    return hasType ? ["type"] : ["status"];
  }
  if (/\bcategory\b/.test(text)) return ["category"];
  if (/\bpriority|urgency|severity\b/.test(text)) return ["priority", "urgency", "severity"];
  if (/\bstatus|state|stage\b/.test(text)) return ["status", "state", "stage"];
  if (/\brequester|traveler|applicant\b/.test(text)) return ["requester", "traveler", "applicant"];
  if (/\bassigned|agent|assignee|owner\b/.test(text)) return ["assigned agent", "assigned", "agent", "assignee", "owner"];
  if (/\bcreated\b/.test(text)) return ["created date", "created"];
  if (/\bdue\b/.test(text)) return ["due date", "due"];
  if (/\bdescription|purpose|details|notes?\b/.test(text)) return ["description", "purpose", "details", "note"];
  return [text];
}

function findFieldBySemanticTokens(fields, tokens) {
  for (const token of tokens) {
    const tokenKey = normKey(token);
    const exact = fields.find((field) => normKey(field.displayName) === tokenKey || normKey(field.fieldName) === tokenKey);
    if (exact) return exact;
  }
  for (const token of tokens) {
    const tokenKey = normKey(token);
    const partial = fields.find((field) => {
      const display = normKey(field.displayName);
      const name = normKey(field.fieldName);
      return display.includes(tokenKey) || tokenKey.includes(display) || name === tokenKey;
    });
    if (partial) return partial;
  }
  return null;
}

function updateMasterDetailFieldLabel(root, control, field) {
  const hint = masterDetailFieldHint(root, control);
  if (!hint) return;
  const parent = findParent(root, control);
  const wrapper = parent && (
    hasIdentity(parent, "current_item_standard_field") || hasIdentity(parent, "current_item_large_field")
      ? parent
      : findParent(root, parent)
  );
  const titleControl = wrapper && (findFirstByIdentity(wrapper, "current_item_standard_field_title") || findFirstByIdentity(wrapper, "current_item_large_field_title"));
  if (titleControl && field?.displayName) setHeadingText(titleControl, field.displayName);
}

function normalizeDependencyArray(value) {
  if (Array.isArray(value)) return clone(value);
  if (value && typeof value === "object") return Object.entries(value).map(([name, config]) => ({ name, ...(config && typeof config === "object" ? config : { value: config }) }));
  return [];
}

function filterConsumedDashboardFilterVars(resource, filterVars) {
  const candidateVars = uniqueByName(filterVars).filter((item) => String(item?.name || item?.id || "").trim());
  if (!candidateVars.length) return [];
  const consumed = collectConsumedDashboardFilterVarNames(resource);
  return candidateVars.filter((item) => {
    const name = String(item.name || item.id || "").trim();
    return consumed.has(name);
  });
}

function collectConsumedDashboardFilterVarNames(resource) {
  const consumed = new Set();
  const consumerTypes = new Set(["summary", "collection", "data-list", "data-table", "pivot-table", "pie-chart", "bar-chart", "column-chart", "line-chart", "area-chart"]);
  const inspect = (value) => {
    const text = JSON.stringify(value || {});
    for (const match of text.matchAll(/__filter_([A-Za-z0-9_-]+)/g)) consumed.add(match[1]);
    for (const match of text.matchAll(/"name"\s*:\s*"([A-Za-z0-9_-]+)"/g)) {
      if (text.includes(`__filter_${match[1]}`)) consumed.add(match[1]);
    }
  };
  for (const node of findDescendants(resource, (item) => consumerTypes.has(String(item?.type || "")))) {
    inspect(node?.attrs?.data?.filter);
    inspect(node?.attrs?.data?.fulltext);
    inspect(node?.attrs?.data?.sortingfilter);
    inspect(node?.attrs?.data?.Conditions);
    inspect(node?.attrs?.data?.conditions);
  }
  for (const ext of Array.isArray(resource?.exts) ? resource.exts : []) {
    inspect(ext?.attr?.settings?.Conditions);
  }
  return consumed;
}

function pruneUnconsumedDashboardFilterProducerBindings(resource, consumedVars) {
  const consumed = new Set(consumedVars);
  for (const node of findDescendants(resource, (item) => String(item?.binding || item?.attrs?.binding || "").startsWith("__filter_"))) {
    const binding = String(node.binding || node.attrs?.binding || "");
    const filterVar = binding.slice("__filter_".length);
    if (consumed.has(filterVar)) continue;
    if (node.binding === binding) delete node.binding;
    if (node.attrs?.binding === binding) delete node.attrs.binding;
  }
}

function uniqueByName(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item?.name || item?.key || item?.id || JSON.stringify(item));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function loadCollectionTemplate(templateId) {
  const templatePath = COLLECTION_TEMPLATE_PATHS[templateId] || COLLECTION_TEMPLATE_PATHS.collection_control_grid_table;
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  if (templateId === "Event Pipeline Grid-Table") {
    return { ...template, templateId };
  }
  return template;
}

function rewriteCollectionTemplateRuntimeRefs(node, { rootListSetId, listId, detailLayoutId }) {
  const rootId = stringId(rootListSetId);
  const sourceListId = stringId(listId);
  const layoutId = stringId(detailLayoutId);
  const layoutPlaceholderPattern = /\{\{(?:DetailLayoutID|LayoutID|layoutId|layout|PageID|pageId)\}\}/g;
  const layoutPlaceholderTestPattern = /\{\{(?:DetailLayoutID|LayoutID|layoutId|layout|PageID|pageId)\}\}/;
  const isLayoutRefKey = (key) => /^(?:link|layout|LayoutID|layoutId|PageID|pageId)$/i.test(key);
  const hasLayoutPlaceholder = (value) => typeof value === "string" && layoutPlaceholderTestPattern.test(value);
  const replaceLayoutPlaceholders = (value) => String(value).replace(layoutPlaceholderPattern, layoutId);
  const visit = (value, key = "") => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index], key);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      let out = value
        .replaceAll("{{ListSetID}}", rootId)
        .replaceAll("{{ListID}}", sourceListId)
        .replaceAll("{{DetailLayoutID}}", layoutId);
      out = replaceLayoutPlaceholders(out);
      for (const oldId of allSourceDashboardListSetIds()) out = out.replaceAll(oldId, rootId);
      for (const oldId of allSourceDashboardListIds()) out = out.replaceAll(oldId, sourceListId);
      if ((isLayoutRefKey(key) || hasLayoutPlaceholder(value)) && !layoutId) {
        return "";
      }
      return out;
    }
    for (const [childKey, child] of Object.entries(value)) {
      if (/^ListSetID$/i.test(childKey) && typeof child === "string" && (allSourceDashboardListSetIds().has(child) || /\{\{ListSetID\}\}/.test(child))) {
        value[childKey] = rootId;
      } else if (/^ListID$/i.test(childKey) && typeof child === "string" && (allSourceDashboardListIds().has(child) || /\{\{ListID\}\}/.test(child))) {
        value[childKey] = sourceListId;
      } else if (isLayoutRefKey(childKey) && typeof child === "string" && hasLayoutPlaceholder(child)) {
        value[childKey] = layoutId ? replaceLayoutPlaceholders(child) : "";
      } else {
        value[childKey] = visit(child, childKey);
      }
    }
    return value;
  };
  return visit(node);
}

function allSourceDashboardListSetIds() {
  return new Set([
    ...SOURCE_COLLECTION_TEMPLATE_IDS.listSetIds,
    ...SOURCE_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.listSetIds,
  ]);
}

function allSourceDashboardListIds() {
  return new Set([
    ...SOURCE_COLLECTION_TEMPLATE_IDS.listIds,
    ...SOURCE_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.listIds,
  ]);
}

function ensureCollectionActions(actions) {
  const out = Array.isArray(actions) ? clone(actions) : [];
  const text = JSON.stringify(out);
  if (!/ListDataID/.test(text) || !/__ctx_coll/.test(text) || !out.some((action) => String(action?.type || "") === "coll")) {
    out.push({ type: "coll", name: "Open item", field: "ListDataID", value: "{{__ctx_coll.ListDataID}}", context: "__ctx_coll" });
  }
  if (!/confirm/.test(JSON.stringify(out)) || !/setdatalist/.test(JSON.stringify(out))) {
    out.push({
      type: "coll",
      id: "confirm-delete-current-item",
      name: "Confirm delete current item",
      field: "ListDataID",
      value: "{{__ctx_coll.ListDataID}}",
      context: "__ctx_coll",
      steps: [
        { type: "confirm", saveVar: "var_isDeleteConfirmed" },
        { type: "setdatalist", operation: "remove", condition: "{{var_isDeleteConfirmed}}", keyField: "ListDataID", value: "{{__ctx_coll.ListDataID}}" },
      ],
    });
  }
  return out;
}

function enforceFullWidth(root, identities) {
  for (const identity of identities) {
    const node = findFirstByIdentity(root, identity);
    if (!node) continue;
    node.width = "full";
    node.attrs = node.attrs || {};
    node.attrs.style = { ...(node.attrs.style || {}), widthtype: [null, "1"] };
    node.attrs.common = {
      ...(node.attrs.common || {}),
      positioning: {
        ...(node.attrs.common?.positioning || {}),
        widthtype: [null, "1"],
      },
    };
  }
}

function removeUnavailableImageControls(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => String(child?.type || "") !== "dynamic-image");
    for (const child of node.children) visit(child);
  };
  visit(root);
}

function enforceGridWrapperGap(root) {
  for (const identity of ["grid_table_col_wrapper", "grid_table_col_multiselect_wrapper", "Event Pipeline Grid-Table"]) {
    const node = findFirstByIdentity(root, identity);
    if (!node) continue;
    enforceContainerGap(node);
  }
}

function enforceContainerGap(node) {
  if (!node) return;
  node.attrs = node.attrs || {};
  node.attrs.container = { ...(node.attrs.container || {}), gap: 0 };
  node.attrs.style = { ...(node.attrs.style || {}), gap: [null, 0] };
}

function replaceTemplateResidue(root, { datasetRegion, listName }) {
  const singular = listName.replace(/s$/i, "") || "item";
  const replacements = new Map([
    ["All tasks", datasetRegion],
    ["All tasks - Multiple select", datasetRegion],
    ["Search tasks", `Search ${listName}`],
    ["Search items", `Search ${listName}`],
    ["Search events", `Search ${listName}`],
    ["Add Task", `Add ${singular}`],
    ["Add item", `Add ${singular}`],
    ["Mark as completed", "Update selected items"],
    ["Assignee", "Owner"],
    ["Completion (%)", "Status"],
    ["Progress bar", "Status"],
  ]);
  const regexReplacements = [
    [/\bEvent\s+Pipeline\b/gi, datasetRegion],
  ];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "string") {
        if (/^(?:id|templateId|dataTableTemplateId|dataAnalyticsTemplateId|datasetPresentationTemplateId|derivedFrom|derivedFromDatasetPresentationTemplate|derivedFromDataTableGoldenReference|derivedFromDataAnalyticsGoldenReference)$/i.test(key)) continue;
        let next = replacements.has(value) ? replacements.get(value) : value;
        for (const [pattern, replacement] of regexReplacements) next = next.replace(pattern, replacement);
        node[key] = next;
      } else if (value && typeof value === "object") visit(value);
    }
  };
  visit(root);
}

function applyDashboardTextMapping(resource, { name, datasetRegion, listName, kpiContracts }) {
  const pageTitle = findFirstByIdentity(resource, "event_portfolio_title");
  setHeadingText(pageTitle, name);
  const subtitle = findFirstByIdentity(resource, "event_portfolio_subtitle");
  setHeadingText(subtitle, `Operational view for ${listName}.`);
  const sectionTitle = findFirstByIdentity(resource, "section_title_header");
  if (sectionTitle) {
    const titleText = findDescendants(sectionTitle, (node) => String(node?.type || "") === "heading")[0];
    setHeadingText(titleText, datasetRegion);
  }
  for (const contract of kpiContracts || []) {
    const kpiLabel = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_label`);
    setHeadingText(kpiLabel, contract.label);
    const kpiValue = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_value`);
    if (kpiValue) bindHeadingToSummaryVariable(kpiValue, contract);
    const kpiTrend = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_trend`);
    if (kpiTrend) setHeadingText(kpiTrend, `${contract.label} signal`);
    const kpiNote = findFirstByIdentity(resource, `event_portfolio_kpi_${contract.key}_note`);
    if (kpiNote) setHeadingText(kpiNote, `Live ${contract.label.toLowerCase()} metric from ${cleanResourceName(listName) || "Records"} records.`);
  }
}

function setTitleText(root, title) {
  for (const id of ["grid_table_col_title", "card_col_title"]) {
    const control = findFirstByIdentity(root, id);
    if (control) setHeadingText(control, title);
  }
}

function setHeadingText(control, value) {
  if (!control) return;
  control.name = value;
  control.title = value;
  control.attrs = {
    ...(control.attrs || {}),
    headc: {
      ...(control.attrs?.headc || {}),
      title: {
        ...(control.attrs?.headc?.title || {}),
        value,
      },
    },
  };
}

function setIconControlFontAwesome(control, icon) {
  const normalized = normalizeFontAwesomeIcon(icon);
  if (!control || !normalized) return;
  control.attrs = {
    ...(control.attrs || {}),
    icon: {
      ...(control.attrs?.icon || {}),
      icon: normalized,
    },
  };
}

function normalizeGeneratedDashboardControls(resource, pageName) {
  let index = 0;
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type) {
      index += 1;
      const identity = firstMeaningfulIdentity(node);
      if (!identity) node.name = `${pageName} ${node.type} ${index}`;
      else if (isDefaultNavigatorName(node.name) && isDefaultNavigatorName(node.attrs?.nav_label) && isDefaultNavigatorName(node.attrs?.nv_label)) node.name = identity;
      const semanticLabel = semanticNavigatorLabel(node, pageName, index);
      if (semanticLabel) setSemanticNavigatorLabel(node, semanticLabel);
      if (String(node.type) === "heading" && String(node.label || "") === "Text") {
        node.attrs = node.attrs || {};
        node.attrs.heads = node.attrs.heads || {};
        if (!Array.isArray(node.attrs.heads.ty) && typeof node.attrs.heads.ty !== "object") node.attrs.heads.ty = [null, "body-medium"];
        if (typeof node.attrs.heads.color !== "string" || !node.attrs.heads.color.trim()) node.attrs.heads.color = "#1f2937";
        node.attrs.headc = node.attrs.headc || {};
        node.attrs.headc.title = node.attrs.headc.title || { value: node.name || pageName };
        normalizeVisibleTextExpression(node, pageName, index);
        if (node.attrs.headc.title.value === undefined && node.attrs.headc.title.variable === undefined) node.attrs.headc.title.value = node.name || pageName;
      }
    }
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(resource);
}

function semanticNavigatorLabel(control, pageName, index) {
  const existing = firstMeaningfulIdentity(control);
  if (existing) return slugifyNavigatorLabel(existing);
  const text = firstVisibleTextValue(control);
  if (text && !looksLikeRawVisibleExpression(text)) return slugifyNavigatorLabel(text);
  const field = String(
    control?.attrs?.data?.fieldName
    || control?.attrs?.data?.field
    || control?.attrs?.fieldName
    || control?.attrs?.field
    || control?.fieldName
    || control?.FieldName
    || control?.field
    || "",
  );
  if (field) return slugifyNavigatorLabel(`${control.type || "control"} ${field}`);
  return slugifyNavigatorLabel(`${pageName} ${control.type || "control"} ${index}`);
}

function setSemanticNavigatorLabel(control, label) {
  if (!control || !label) return;
  const normalized = slugifyNavigatorLabel(label);
  control.attrs = control.attrs || {};
  if (isDefaultNavigatorName(control.nv_label)) control.nv_label = normalized;
  if (isDefaultNavigatorName(control.nav_label)) control.nav_label = normalized;
  if (isDefaultNavigatorName(control.attrs.nv_label)) control.attrs.nv_label = normalized;
  if (isDefaultNavigatorName(control.attrs.nav_label)) control.attrs.nav_label = normalized;
}

function slugifyNavigatorLabel(value) {
  return slugify(value).replace(/-/g, "_");
}

function normalizeVisibleTextExpression(control, pageName, index) {
  const title = control?.attrs?.headc?.title;
  if (!title || title.variable !== undefined || typeof title.value !== "string") return;
  if (!looksLikeRawVisibleExpression(title.value)) return;
  const replacement = labelFromRawVisibleExpression(title.value) || firstMeaningfulIdentity(control) || `${pageName} text ${index}`;
  title.value = replacement;
  control.name = replacement;
  control.title = replacement;
  control.label = control.label && !isDefaultNavigatorName(control.label) ? control.label : "Text";
  setSemanticNavigatorLabel(control, replacement);
}

function firstVisibleTextValue(control) {
  return [
    control?.attrs?.headc?.title?.value,
    control?.attrs?.title?.value,
    control?.value,
    control?.text,
    control?.title,
    control?.name,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function looksLikeRawVisibleExpression(value) {
  return /\b(?:iif|dateDiff|dateAdd|formatDate|formatNumber|concat|substring|contains|ifempty)\s*\(/i.test(String(value || ""))
    || /Collection item:/i.test(String(value || ""));
}

function labelFromRawVisibleExpression(value) {
  const match = String(value || "").match(/Collection item:([A-Za-z0-9 _-]+)/i);
  if (!match) return "";
  return match[1].replace(/\b(now|day|hour|minute|month|year)\b.*$/i, "").trim() || "";
}

function firstMeaningfulIdentity(control) {
  return identityCandidates(control).find((candidate) => !isDefaultNavigatorName(candidate)) || "";
}

function isDefaultNavigatorName(value) {
  return !value || /^(Container|Grid|Text|Dynamic field|Dynamic user|Kanban|Collection|Button|Summary|Icon|Text Editor)(\s*\d+)?$/i.test(String(value).trim());
}

function removeOperationsWithoutActions(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      if (isGeneratedOperationContainer(child) && !hasActionConfiguration(child)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function isGeneratedOperationContainer(control) {
  return [
    "Operations",
    "current_item_main_header_operations",
    "current_item_aditional_header_operations",
    "current_item_additional_header_operations",
  ].some((identity) => hasIdentity(control, identity));
}

function removeAllByIdentity(root, identity) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      if (hasIdentity(child, identity)) return false;
      visit(child);
      return true;
    });
  };
  visit(root);
}

function removeEmptyBusinessSections(root) {
  const removableWrappers = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "1_row_section", "2_rows_section", "3_rows_section", "chart_cards_section", "right_side_panel"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !hasMeaningfulBusinessContent(child)) return false;
      if (hasIdentity(child, "section_title_area") && !hasSectionTitleAreaContent(child)) return false;
      if (![...removableWrappers].some((identity) => hasIdentity(child, identity))) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function removeEmptyDashboardBusinessSections(root) {
  const removableWrappers = new Set([
    "content_card_wrapper",
    "content_card_60_wrapper",
    "content_card_40_wrapper",
    "1_columns_section",
    "2_columns_section",
    "3_columns_section",
    "2_columns_60/40_section",
    "1_row_section",
    "2_rows_section",
    "3_rows_section",
    "chart_cards_section",
    "dashboard_standard_filter_group",
    "right_side_panel",
    "kpi_metrics_wrapper",
  ]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !hasMeaningfulBusinessContent(child)) return false;
      if (hasIdentity(child, "section_title_area") && !hasSectionTitleAreaContent(child)) return false;
      if (![...removableWrappers].some((identity) => hasIdentity(child, identity))) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function ensureDashboardContentCardRequiredSlots(root) {
  const wrappers = findDescendants(root, (node) => ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"].some((identity) => hasIdentity(node, identity)));
  const headerPrototype = findFirstByIdentity(root, "section_title_header");
  for (const wrapper of wrappers) {
    if (!Array.isArray(wrapper.children)) wrapper.children = [];
    const existingTitleArea = findFirstByIdentity(wrapper, "section_title_area");
    if (existingTitleArea) {
      ensureSectionTitleHeader(existingTitleArea, String(wrapper.id || wrapper.nv_label || wrapper.name || "content-card"), headerPrototype);
      continue;
    }
    if (!findFirstByIdentity(wrapper, "section_content_area")) continue;
    const wrapperSeed = String(wrapper.id || wrapper.nv_label || wrapper.name || "content-card");
    const titleArea = {
      id: deterministicUuid(`${wrapperSeed}:section-title-area`),
      nv_label: "section_title_area",
      label: "Container",
      type: "container",
      attrs: {
        style: {
          direction: [null, "row"],
          gap: [null, "--sp--s200"],
          justify_content: [null, "space-between"],
          align_items: [null, "center"],
        },
      },
      children: [],
    };
    ensureSectionTitleHeader(titleArea, wrapperSeed, headerPrototype);
    const contentIndex = wrapper.children.findIndex((child) => hasIdentity(child, "section_content_area"));
    if (contentIndex === -1) wrapper.children.unshift(titleArea);
    else wrapper.children.splice(contentIndex, 0, titleArea);
  }
}

function ensureSectionTitleHeader(titleArea, seed, headerPrototype = null) {
  if (!titleArea || typeof titleArea !== "object") return;
  titleArea.children = Array.isArray(titleArea.children) ? titleArea.children : [];
  if (findFirstByIdentity(titleArea, "section_title_header")) return;
  if (headerPrototype) {
    const header = clone(headerPrototype);
    header.id = deterministicUuid(`${seed}:section-title-header`);
    titleArea.children.unshift(header);
  }
}

function removeUnresolvedPageActionControls(root) {
  const pageActionIds = new Set(normalizeDependencyArray(root?.actions).flatMap(actionIdentityCandidates));
  for (const item of normalizeDependencyArray(root?.formAction)) {
    for (const id of actionIdentityCandidates(item)) pageActionIds.add(id);
  }
  const visit = (node, ancestors = []) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child, ancestors.concat(node));
      const actionId = String(child?.attrs?.control_action || child?.attrs?.action || child?.control_action || child?.action || "").trim();
      if (!actionId) return true;
      if (pageActionIds.has(actionId)) return true;
      if (resolvesToLocalCollectionAction(actionId, ancestors.concat(node))) return true;
      return !isActionControlCandidate(child);
    });
  };
  visit(root, []);
  removeEmptyDashboardBusinessSections(root);
}

function resolvesToLocalCollectionAction(actionId, ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!["collection", "kanban"].includes(String(ancestor?.type || ""))) continue;
    const localActions = Array.isArray(ancestor?.attrs?.actions) ? ancestor.attrs.actions : [];
    const localIds = new Set(localActions.flatMap(actionIdentityCandidates));
    if (localIds.has(actionId)) return true;
  }
  return false;
}

function isActionControlCandidate(control) {
  const type = String(control?.type || "").toLowerCase();
  if (["action_button", "button", "icon", "container"].includes(type)) return true;
  return /button|operation|action|add|search|sidebar|flip|export|open|delete|edit|comment/i.test(identityCandidates(control).join(" "));
}

function removeUnusedApprovalTemplateSections(root) {
  const removableModules = new Set(["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "1_columns_section", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_content_area") && !findFirstByIdentity(child, "action_panel_flow_history_wrapper") && !hasWorkflowSurface(child) && !hasMeaningfulBusinessContent(child)) return false;
      if (hasIdentity(child, "section_title_area") && !hasSectionTitleAreaContent(child)) return false;
      if (![...removableModules].some((identity) => hasIdentity(child, identity))) return true;
      if (findFirstByIdentity(child, "action_panel_flow_history_wrapper")) return true;
      return hasMeaningfulBusinessContent(child);
    });
  };
  visit(root);
}

function hasMeaningfulBusinessContent(node) {
  if (!node || typeof node !== "object") return false;
  if (node.generatedKpiRuntimeBound === true || node.attrs?.generatedKpiRuntimeBound === true) return true;
  if (node.approvalFormNoFieldsNotice === true) return true;
  if (!Array.isArray(node.children) || node.children.length === 0) return false;
  return findDescendants(node, (control) => {
    const type = String(control?.type || "");
    if (control?.approvalFormNoFieldsNotice === true) return true;
    if (["collection", "data-list", "summary", "data-filter", "select-filter", "radio-filter", "checkbox-filter", "search-filter", "pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return true;
    if (type === "button" && hasActionConfiguration(control)) return true;
    if (hasIdentity(control, "kpi_card_wrapper") && (control.generatedKpiRuntimeBound === true || control.attrs?.generatedKpiRuntimeBound === true)) return true;
    if (hasIdentity(control, "form_grid_fields_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_2col_wrapper")) return true;
    if (hasIdentity(control, "form_grid_fields_3col_wrapper")) return true;
    if (["input", "textarea", "richtext", "rich-text", "radio", "checkbox", "switch", "date", "datetime", "number", "input_number", "lookup", "people", "user"].includes(type)) return true;
    return false;
  }).length > 0;
}

function hasSectionTitleAreaContent(node) {
  const header = findFirstByIdentity(node, "section_title_header");
  const operations = findFirstByIdentity(node, "Operations");
  return Boolean(header || (operations && hasActionConfiguration(operations)));
}

function removeEmptySectionTitleAreas(root, { preserveContentCardTitleAreas = false } = {}) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (preserveContentCardTitleAreas && hasIdentity(child, "section_title_area") && ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"].some((identity) => hasIdentity(node, identity))) return true;
      if (hasIdentity(child, "section_title_area") && !hasSectionTitleAreaContent(child)) return false;
      return true;
    });
  };
  visit(root);
}

function removeResidualTemplateSectionHeaders(root) {
  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child);
      if (hasIdentity(child, "section_title_header") && hasSourceTemplateResidueText(child)) return false;
      return true;
    });
  };
  visit(root);
}

function removeRedundantMasterDetailSectionTitleHeaders(root) {
  const visit = (node, ancestors = []) => {
    if (!node || !Array.isArray(node.children)) return;
    node.children = node.children.filter((child) => {
      visit(child, ancestors.concat(node));
      if (!hasIdentity(child, "section_title_header")) return true;
      const insideContentCard = ancestors.concat(node).some((ancestor) => hasIdentity(ancestor, "content_card_wrapper"));
      if (!insideContentCard) return true;
      const titleArea = ancestors.concat(node).reverse().find((ancestor) => hasIdentity(ancestor, "section_title_area"));
      const operations = titleArea ? findFirstByIdentity(titleArea, "Operations") : null;
      return Boolean(operations && hasActionConfiguration(operations));
    });
  };
  visit(root);
}

function scrubDashboardSourceTemplateResidue(root, { listName, scrubMetadata = false }) {
  const safeName = cleanResourceName(listName) || "Records";
  const safeSlug = slugify(safeName).replace(/-/g, "_") || "records";
  const replacements = [
    [/\bevent_portfolio_header_band\b/gi, `${safeSlug}_header_band`],
    [/\bevent_portfolio_pipeline_section\b/gi, `${safeSlug}_details_section`],
    [/\bevent_portfolio_dashboard_golden_reference\b/gi, `${safeSlug}_dashboard_reference`],
    [/\bAsset Loan Operations Header Band\b/g, `${safeName} Header Band`],
    [/\bActive Loans Metric Display\b/g, `${safeName} Metric Display`],
    [/\bActive Loans card content row\b/g, `${safeName} card content row`],
    [/\bActive Loans KPI Card\b/g, `${safeName} KPI Card`],
    [/\bActive Loans Text\b/g, `${safeName} Text`],
    [/\bActive Loans\b/g, `${safeName} records`],
    [/\bActive Loan Pipeline\b/g, `${safeName} Details`],
    [/\bOffice Asset records\b/g, `${safeName} records`],
    [/\bOffice Asset\b/g, safeName],
    [/\bcurrent loan volume\b/gi, "current record volume"],
    [/\breturn activity signal\b/gi, "activity signal"],
    [/\bwatch coordinator follow-up\b/gi, "follow-up signal"],
    [/Coordinator view of active loans, due dates, checkout status, and return follow-up\./gi, `Track ${safeName} details, status, priority, ownership, and follow-up context.`],
    [/Coordinator guidance: prioritize overdue items and returns due within the next seven days\./gi, `Review ${safeName} records and related activity.`],
  ];
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index]);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement).trim(), value);
    }
    for (const [key, child] of Object.entries(value)) {
      if (!scrubMetadata && /^(?:id|templateId|dataTableTemplateId|dataAnalyticsTemplateId|datasetPresentationTemplateId|goldenReferenceId|derivedFrom|derivedFromGoldenReference|derivedFromDatasetPresentationTemplate|derivedFromDataTableGoldenReference|derivedFromDataAnalyticsGoldenReference)$/i.test(key)) continue;
      if (scrubMetadata && /^(?:templateId|dataTableTemplateId|dataAnalyticsTemplateId|datasetPresentationTemplateId|dataListFormLayoutTemplateId|derivedFromDataListFormLayoutTemplate)$/i.test(key)) continue;
      value[key] = visit(child);
    }
    return value;
  };
  visit(root);
}

function hasSourceTemplateResidueText(node) {
  const text = visibleBusinessText(node);
  return /\bActive Loan Pipeline\b/i.test(text)
    || /\bActive Loans\b/i.test(text)
    || /\bCoordinator view of active loans/i.test(text)
    || /\bCoordinator guidance: prioritize overdue items and returns/i.test(text)
    || /\bcurrent loan volume\b/i.test(text)
    || /\breturn activity signal\b/i.test(text)
    || /\bwatch coordinator follow-up\b/i.test(text)
    || /\bOffice Asset records\b/i.test(text);
}

function visibleBusinessText(node) {
  const values = [];
  const visit = (current) => {
    if (!current || typeof current !== "object") return;
    for (const key of ["text", "title", "value", "description", "placeholder", "name", "label", "nv_label", "nav_label"]) {
      const value = current?.[key];
      if (typeof value === "string" && value.trim()) values.push(value);
    }
    const titleValue = current?.attrs?.headc?.title?.value ?? current?.attrs?.title?.value ?? current?.attrs?.text ?? current?.attrs?.value;
    if (typeof titleValue === "string" && titleValue.trim()) values.push(titleValue);
    for (const child of Array.isArray(current.children) ? current.children : []) visit(child);
  };
  visit(node);
  return values.join(" ");
}

function hasWorkflowSurface(node) {
  if (!node || typeof node !== "object") return false;
  return findDescendants(node, (control) => ["workflowControlPanel", "workflowHistory"].includes(String(control?.type || ""))).length > 0;
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  if (attrs.control_action || attrs.action || attrs["action-type"] || attrs.actionType) return true;
  if (Array.isArray(attrs.actions) && attrs.actions.length) return true;
  if (Array.isArray(control?.actions) && control.actions.length) return true;
  return findDescendants(control, (node) => {
    const childAttrs = node?.attrs || {};
    return Boolean(childAttrs.control_action || childAttrs.action || childAttrs["action-type"] || childAttrs.actionType || (Array.isArray(childAttrs.actions) && childAttrs.actions.length));
  }).length > 0;
}

function findFirstByIdentity(root, expected) {
  let found = null;
  const visit = (node) => {
    if (found || !node || typeof node !== "object") return;
    if (hasIdentity(node, expected)) {
      found = node;
      return;
    }
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return found;
}

function findBusinessSectionContentArea(root) {
  for (const wrapperId of ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"]) {
    const contentCardWrappers = findDescendants(root, (node) => hasIdentity(node, wrapperId));
    for (const wrapper of contentCardWrappers) {
      const slot = findFirstByIdentity(wrapper, "section_content_area");
      if (slot) return slot;
    }
  }
  return findFirstByIdentity(root, "section_content_area");
}

function findFirstByType(root, type) {
  return findDescendants(root, (node) => String(node?.type || "") === type)[0] || null;
}

function findParent(root, target) {
  let parent = null;
  const visit = (node) => {
    if (parent || !node || typeof node !== "object" || !Array.isArray(node.children)) return;
    for (const child of node.children) {
      if (child === target) {
        parent = node;
        return;
      }
      visit(child);
      if (parent) return;
    }
  };
  visit(root);
  return parent;
}

function findDescendants(root, predicate) {
  const out = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) out.push(node);
    for (const child of Array.isArray(node.children) ? node.children : []) visit(child);
  };
  visit(root);
  return out;
}

function hasIdentity(control, expected) {
  const normalized = normKey(expected);
  return identityCandidates(control).some((candidate) => normKey(candidate) === normalized);
}

function identityCandidates(control) {
  return [
    control?.id,
    control?.ID,
    control?.key,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.id,
    control?.attrs?.name,
    control?.attrs?.label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.templateMarker,
    control?.attrs?.dashboardPageLayoutTemplateId,
    control?.attrs?.dataListFormLayoutTemplateId,
    control?.attrs?.derivedFromDataListFormLayoutTemplate,
    control?.attrs?.approvalFormLayoutTemplateId,
    control?.attrs?.derivedFromApprovalFormLayoutTemplate,
    control?.templateMarker,
    control?.derivedFromDashboardPageLayoutTemplate,
    control?.dataListFormLayoutTemplateId,
    control?.derivedFromDataListFormLayoutTemplate,
    control?.approvalFormLayoutTemplateId,
    control?.derivedFromApprovalFormLayoutTemplate,
  ].filter(Boolean).map(String);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setTemplateText(root, identity, value) {
  const node = findFirstByIdentity(root, identity);
  if (!node) return;
  node.name = value;
  node.title = value;
  node.attrs = node.attrs || {};
  node.attrs.headc = node.attrs.headc || {};
  node.attrs.headc.title = node.attrs.headc.title || {};
  node.attrs.headc.title.value = value;
}

function buildLegacyMaterialDashboardResource({ name, layoutId, listName, listId, summaryId, filterId, collectionId }) {
  const tempVar = `tmp_${slugify(name).replace(/-/g, "_")}_count`;
  return {
    type: "dashboard-page",
    id: `${slugify(name)}_root`,
    name,
    title: name,
    ver: "1.0.0",
    attrs: { container: { padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
    filterVars: [],
    tempVars: [{ name: tempVar, type: "number", source: summaryId }],
    ReportIds: [summaryId],
    exts: [{
      i: summaryId,
      id: summaryId,
      category: "___Pivot___",
      key: "summary",
      attr: {
        ListID: stringId(listId),
        settings: {
          values: [{ field: "ListDataID", type: "count", label: "Active Records" }],
        },
      },
    }],
    actions: [],
    derivedFromGoldenReference: "dashboard-page-layouts-v1.1",
    templateMarker: "dashboard-page-layouts-v1.1",
    LayoutID: layoutId,
    children: [
      {
        type: "container",
        id: "Main",
        name: "Main",
        title: "Main",
        attrs: { container: { cw: "2", widthtype: [null, "1"], direction: "vertical", gap: 16, align_items: "stretch", justify_content: "flex-start", padding: ["--sp--s0", "--sp--s0", "--sp--s0", "--sp--s0"] } },
        children: [
          {
            type: "container",
            id: "Content",
            name: "Content",
            title: "Content",
            attrs: {
              container: { cw: "2", widthtype: [null, "1"], direction: "vertical", gap: 16, align_items: "stretch", justify_content: "flex-start" },
              common: { padding: [null, { top: 24, right: 28, bottom: 24, left: 28 }] },
            },
            children: [
              { type: "heading", label: "Text", id: `${slugify(name)}_title`, name, title: name, attrs: { headc: { title: { value: name } }, heads: { ty: [null, "h2-bold"], color: "#111827" } } },
              {
                type: "summary",
                id: summaryId,
                name: "Active Records",
                title: "Active Records",
                save_var: { name: tempVar },
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, aggregation: "count", field: "ListDataID" }, save_var: { name: tempVar } },
              },
              {
                type: "data-filter",
                id: filterId,
                name: "Status filter",
                title: "Status filter",
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, field: "Title" }, label: "Status", placeholder: `Filter ${listName}` },
              },
              {
                type: "collection",
                id: collectionId,
                name: `${listName} collection`,
                title: `${listName} collection`,
                attrs: { data: { list: { AppID: 41, ListID: stringId(listId), Type: 1, Title: listName }, source: listName, field: "Title" }, collection: { template: "collection_control_grid_table" } },
                children: [
                  { type: "dynamic-field", id: `${collectionId}_title`, name: "Title", title: "Title", attrs: { data: { field: "Title", ListID: stringId(listId) } } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildNavigationLayoutView({ planDemand, rootListId, ids, dataListByName, forms, pages }) {
  const layoutContract = buildApplicationLayoutContract();
  const groups = navigationGroupNames(planDemand);
  const dashboardItems = pages.map((page) => ({ Title: page.Title, Type: 103, Target: page.Title, ListID: page.LayoutID, LayoutID: page.LayoutID, Icon: inferNavigationIcon({ title: page.Title, type: 103 }) }));
  const formItems = forms.map((form) => ({ Title: form.Name, Type: 105, Target: form.Name, ListID: form.Key, Icon: inferNavigationIcon({ title: form.Name, type: 105 }) }));
  const listItems = planDemand.resources.dataLists.map((name) => ({ Title: name, Type: 1, Target: name, ListID: dataListByName.get(normKey(name)), Icon: inferNavigationIcon({ title: name, type: 1 }) }));
  const dataListViewItems = (planDemand.dataListViewRecords || []).map((record) => ({
    Title: record.viewName,
    Type: 1,
    Target: record.viewName,
    ListID: dataListByName.get(normKey(record.listName)),
    SourceListName: record.listName,
    Ext1: { Url: record.routeKey || slugify(record.viewName), ViewName: record.viewName },
    Icon: inferNavigationIcon({ title: record.viewName, type: 1 }),
  })).filter((item) => item.ListID);
  const reportItems = planDemand.resources.formReports.map((name) => ({ Title: name, Type: 105, Target: name, ListID: forms[0]?.Key || "", Icon: inferNavigationIcon({ title: name, type: 105 }) }));
  const allItems = dashboardItems.concat(formItems, listItems, dataListViewItems, reportItems);
  const itemsByGroup = planDemand.navigationItemsByGroup || {};
  const targetByName = new Map(allItems.flatMap((item) => [[normKey(item.Target), item], [normKey(item.Title), item]]));
  const sort = groups.map((groupName, index) => ({
    ID: stringId(ids[`decoded.ListSet.LayoutView.sort[${index}].ID`]),
    AppID: 41,
    ListSetID: stringId(rootListId),
    Title: groupName,
    Type: "classes",
    Icon: inferNavigationIcon({ title: groupName, type: "classes" }),
    list: (itemsByGroup[groupName] || []).length
      ? itemsByGroup[groupName].map((item) => {
        const target = targetByName.get(normKey(item.title)) || targetByName.get(normKey(item.target)) || { Title: item.title, Type: inferNavigationType(item.type), ListID: "" };
        return toRuntimeNavigationItem({ ...target, Icon: normalizeFontAwesomeIcon(item.icon) || target.Icon || inferNavigationIcon({ title: item.title, type: target.Type }) }, rootListId);
      })
        .filter(isRuntimeNavigationItemObject)
      : allItems.filter((item, itemIndex) => itemIndex % groups.length === index).map((item) => toRuntimeNavigationItem(item, rootListId)).filter(isRuntimeNavigationItemObject),
  }));
  for (const group of sort) group.list = (group.list || []).filter(isRuntimeNavigationItemObject);
  if (sort.length && sort.every((group) => !group.list.length)) sort[0].list = allItems.map((item) => toRuntimeNavigationItem(item, rootListId)).filter(isRuntimeNavigationItemObject);
  return JSON.stringify({ sortVer: layoutContract.sortVer, sort, attrs: layoutContract.attrs });
}

function isRuntimeNavigationItemObject(item) {
  return Boolean(item && typeof item === "object" && !Array.isArray(item) && item.ListID && item.Title);
}

function toRuntimeNavigationItem(item, rootListId) {
  if (!["1", "103", "105"].includes(String(item.Type))) return null;
  if (!item.ListID) return null;
  const out = {
    AppID: 41,
    Title: item.Title,
    Type: item.Type,
    ListID: stringId(item.ListID || ""),
    ListSetID: stringId(rootListId),
    Icon: normalizeFontAwesomeIcon(item.Icon) || inferNavigationIcon({ title: item.Title, type: item.Type }),
  };
  if (item.Ext1) out.Ext1 = item.Ext1;
  if (item.SourceListName) out.SourceListName = item.SourceListName;
  if (String(item.Type) === "103") out.LayoutID = stringId(item.LayoutID || item.ListID || "");
  return out;
}

function buildApplicationLayoutContract() {
  try {
    const template = JSON.parse(fs.readFileSync(APPLICATION_LAYOUT_TEMPLATE_PATH, "utf8"));
    const required = template.requiredLayoutView || {};
    return {
      sortVer: Number(required.sortVer) || 1,
      attrs: JSON.parse(JSON.stringify(required.attrs || defaultApplicationLayoutAttrs())),
    };
  } catch {
    return { sortVer: 1, attrs: defaultApplicationLayoutAttrs() };
  }
}

function defaultApplicationLayoutAttrs() {
  return {
    appearance: {
      bgc: "var(--c--primary-dark-hover)",
      color: "var(--c--background)",
      height: 46,
      ty: [null, "h6-semi-bold"],
    },
    "navigator-menu": {
      bgc: "var(--c--primary-dark)",
      color: "var(--c--background)",
      position: "left",
      active: {},
    },
    CustomColors: [
      { id: "extra-color-1", label: "Extra Color 1", value: "#F9C434" },
      { id: "extra-color-2", label: "Extra Color 2", value: "#F61515" },
    ],
    CustomFonts: [
      { id: "3708306f-951b-40d5-b459-26c717e8f187", label: "Extra font 1" },
      { id: "dc50649a-28d3-42ec-9714-e32cf78de678", label: "Extra font 2" },
    ],
  };
}

function normalizeFontAwesomeIcon(value) {
  const icon = String(value || "").trim();
  return /^fa-(solid|regular|light|duotone|brands)\s+fa-[a-z0-9-]+$/i.test(icon) ? icon : "";
}

function inferDatasetFontAwesomeIcon(title = "") {
  const text = String(title || "").toLowerCase();
  if (/ticket|service desk|helpdesk|help desk|incident|support/.test(text)) return "fa-solid fa-headset";
  if (/project|program|portfolio|milestone/.test(text)) return "fa-solid fa-diagram-project";
  if (/task|todo|to-do|work item/.test(text)) return "fa-regular fa-square-check";
  if (/issue|risk|problem|defect|bug/.test(text)) return "fa-solid fa-triangle-exclamation";
  if (/comment|message|conversation|discussion/.test(text)) return "fa-regular fa-comments";
  if (/document|file|attachment|library/.test(text)) return "fa-regular fa-folder-open";
  if (/vendor|supplier|customer|client|account|contact|employee|requester|user/.test(text)) return "fa-regular fa-address-card";
  if (/loan|asset|inventory|equipment|item/.test(text)) return "fa-regular fa-table-list";
  if (/request|case|record/.test(text)) return "fa-regular fa-rectangle-list";
  return "fa-regular fa-table-list";
}

function inferNavigationIcon({ title = "", type = "" } = {}) {
  const text = String(title || "").toLowerCase();
  const resourceType = String(type || "");
  if (resourceType === "classes") {
    if (/approval|review|task/.test(text)) return "fa-solid fa-clipboard-check";
    if (/report|analytics|dashboard/.test(text)) return "fa-solid fa-chart-line";
    if (/admin|setting|config/.test(text)) return "fa-solid fa-gear";
    if (/operation|workbench|workspace/.test(text)) return "fa-solid fa-briefcase";
    return "fa-solid fa-folder";
  }
  if (resourceType === "103" || /dashboard|analytics|monitor|overview/.test(text)) return "fa-solid fa-chart-pie";
  if (resourceType === "105" || /approval|request|review/.test(text)) return "fa-regular fa-paste";
  if (/ticket|service desk|helpdesk|help desk|incident|support/.test(text)) return "fa-solid fa-headset";
  if (/project|program|portfolio/.test(text)) return "fa-solid fa-diagram-project";
  if (/task|todo|to-do|work item/.test(text)) return "fa-regular fa-square-check";
  if (/comment|message|conversation|discussion/.test(text)) return "fa-regular fa-comments";
  if (/report/.test(text)) return "fa-regular fa-file-lines";
  if (/document|file|attachment/.test(text)) return "fa-regular fa-folder-open";
  if (/vendor|supplier|customer|user|employee/.test(text)) return "fa-regular fa-address-card";
  if (/loan|asset|inventory|item|record|list/.test(text)) return "fa-regular fa-table-list";
  return "fa-regular fa-circle";
}

function inferNavigationType(value) {
  if (/approval/i.test(value)) return 105;
  if (/dashboard/i.test(value)) return 103;
  if (/report/i.test(value)) return 106;
  return 1;
}

function exportResource(resource) {
  const prefix = Buffer.from("::brotli::", "utf8");
  const compressed = zlib.brotliCompressSync(Buffer.from(JSON.stringify(resource), "utf8"));
  return Buffer.concat([prefix, compressed]).toString("base64");
}

function workflowUserLineManagerExpression(variableId, label) {
  return `<input type="button" data="\${ &quot;type&quot;:&quot;user&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;\${\\&quot;type\\&quot;:\\&quot;variable\\&quot;, \\&quot;param\\&quot;:{\\&quot;id\\&quot;:\\&quot;${variableId}\\&quot;}}&quot;},&quot;prop&quot;:&quot;LineManager&quot;}" expr="__" tabindex="-1" value="Workflow Variables:${label}:Line Manager">`;
}

function workflowTaskOutcomeExpression(taskId, taskLabel) {
  return `<input type="button" data="\${ &quot;type&quot;:&quot;task&quot;, &quot;param&quot;:{&quot;defid&quot;:&quot;${taskId}&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}" expr="__" tabindex="-1" value="${taskLabel}:Outcome">`;
}

function workflowOutcomeButton(outcome) {
  return `<input type="button" data="${outcome}" value="Task outcome:${outcome}">`;
}

function workflowOutcomeCondition({ key, taskId, taskLabel, outcome }) {
  return {
    key,
    pre: "and",
    left: workflowTaskOutcomeExpression(taskId, taskLabel),
    op: "s.=",
    right: workflowOutcomeButton(outcome),
  };
}

function approvalWorkflowIds(defId, formKey) {
  const seed = `${defId}:${formKey}`;
  return {
    submissionPageId: deterministicUuid(`${seed}:submission-page`),
    taskPageId: deterministicUuid(`${seed}:task-page`),
    startId: deterministicUuid(`${seed}:start`),
    flowId: deterministicUuid(`${seed}:flow-start-task`),
    taskId: deterministicUuid(`${seed}:assignment-task`),
    approvedFlowId: deterministicUuid(`${seed}:flow-approved`),
    rejectedFlowId: deterministicUuid(`${seed}:flow-rejected`),
    endId: deterministicUuid(`${seed}:end-approved`),
    rejectEndId: deterministicUuid(`${seed}:end-rejected`),
  };
}

function flowRef(resourceid) {
  return { id: resourceid, resourceid };
}

function refId(ref) {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return String(ref.resourceid || ref.resourceId || ref.id || "");
}

function workflowLayoutForSteps(workflowSteps) {
  const mainLaneY = 220;
  const actionLaneY = 360;
  const rejectLaneY = 520;
  const startX = 100;
  const firstStepX = 420;
  const columnGap = 300;
  const stepPositions = workflowSteps.map((step, index) => ({
    x: firstStepX + index * columnGap,
    y: step.nodeType === "ContentList" ? actionLaneY : mainLaneY,
  }));
  const endX = firstStepX + Math.max(1, workflowSteps.length) * columnGap;
  return {
    start: { x: startX, y: mainLaneY },
    stepPositions,
    end: { x: endX, y: mainLaneY },
    rejectEnd: { x: endX, y: rejectLaneY },
  };
}

function workflowVerticesBetween(sourcePosition, targetPosition, options = {}) {
  if (!sourcePosition || !targetPosition) return [];
  const dx = Math.abs(targetPosition.x - sourcePosition.x);
  const dy = Math.abs(targetPosition.y - sourcePosition.y);
  if (!options.force && dy < 80 && dx < 520) return [];
  const bendX = sourcePosition.x + Math.max(120, Math.round(dx / 2));
  return [
    { x: bendX, y: sourcePosition.y },
    { x: bendX, y: targetPosition.y },
  ];
}

function workflowRejectedVertices(sourcePosition, rejectPosition) {
  if (!sourcePosition || !rejectPosition) return [];
  const bendX = sourcePosition.x + Math.max(120, Math.round(Math.abs(rejectPosition.x - sourcePosition.x) / 2));
  return [
    { x: bendX, y: sourcePosition.y },
    { x: bendX, y: rejectPosition.y },
    { x: rejectPosition.x - 120, y: rejectPosition.y },
  ];
}

function workflowStraightDockers(sourcePosition, targetPosition) {
  if (!sourcePosition || !targetPosition) return [];
  return [
    { x: sourcePosition.x + 120, y: sourcePosition.y },
    { x: targetPosition.x - 120, y: targetPosition.y },
  ];
}

function workflowGraphPosition(childshapes) {
  const positions = childshapes
    .filter((shape) => shape?.stencil?.id !== "SequenceFlow")
    .map((shape) => shape?.position)
    .filter((position) => Number.isFinite(position?.x) && Number.isFinite(position?.y));
  if (!positions.length) return { x: 0, y: 0, width: 960, height: 420 };
  const minX = Math.min(...positions.map((position) => position.x));
  const maxX = Math.max(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));
  const maxY = Math.max(...positions.map((position) => position.y));
  const margin = 160;
  return {
    x: Math.min(0, minX - margin),
    y: Math.min(0, minY - margin),
    width: Math.max(960, maxX - minX + margin * 2),
    height: Math.max(620, maxY - minY + margin * 2),
  };
}

function buildApprovalDefResource({ name, formKey, defId, rootListSetId, approvalFieldSpecs = {}, approvalWorkflowNodes = [], dataListMetas = [] }) {
  const {
    submissionPageId,
    taskPageId,
    startId,
    endId,
    rejectEndId,
  } = approvalWorkflowIds(defId, formKey);
  const plannedSteps = approvalWorkflowExecutionSteps(approvalWorkflowNodes);
  const workflowSteps = plannedSteps.length ? plannedSteps : [{
    nodeName: "Line manager approval",
    nodeType: "MultiAssignmentTask",
    assigneeRole: "Applicant line manager",
    assignmentStrategy: "Line manager expression",
    outcomes: "Approved; Rejected",
    generatedByPolicy: "single-node-fallback",
  }];
  const childshapes = buildApprovalWorkflowShapes({
    defId,
    formKey,
    rootListSetId,
    submissionPageId,
    taskPageId,
    startId,
    endId,
    rejectEndId,
    workflowSteps,
    dataListMetas,
  });
  return {
    id: defId,
    key: formKey,
    defkey: formKey,
    name,
    title: name,
    workflowType: 2,
    AppListSetID: stringId(rootListSetId),
    ProcModelAppID: 41,
    ProcModelListID: "0",
    ProcModelListSetID: stringId(rootListSetId),
    ext: {},
    lineType: "orthogonal",
    iconURL: "",
    flowPage: [],
    variables: buildApprovalVariables(approvalFieldSpecs),
    graphposition: workflowGraphPosition(childshapes),
    graphzoom: 1,
    graphver: 1,
    pageurls: [
      {
        id: submissionPageId,
        key: submissionPageId,
        pageUrl: submissionPageId,
        pageurl: submissionPageId,
        PageUrl: submissionPageId,
        url: submissionPageId,
        type: 1,
        pagetype: 1,
        name: "Submission form",
        title: "Submission form",
        formdef: approvalFormDef(submissionPageId, name, "submission", approvalFieldSpecs.submission || []),
      },
      {
        id: taskPageId,
        key: taskPageId,
        pageUrl: taskPageId,
        pageurl: taskPageId,
        PageUrl: taskPageId,
        url: taskPageId,
        type: 2,
        pagetype: 1,
        name: "Task form",
        title: "Task form",
        formdef: approvalFormDef(taskPageId, name, "task", approvalTaskFieldSpecs(approvalFieldSpecs)),
      },
    ],
    childshapes,
  };
}

function approvalWorkflowExecutionSteps(nodes) {
  return uniqueApprovalWorkflowNodes(nodes).filter((node) => !["StartNoneEvent", "EndNoneEvent", "EndRejectEvent", "SequenceFlow"].includes(node.nodeType));
}

function buildApprovalWorkflowShapes({ defId, formKey, rootListSetId, submissionPageId, taskPageId, startId, endId, rejectEndId, workflowSteps, dataListMetas = [] }) {
  const seed = `${defId}:${formKey}:workflow`;
  const layout = workflowLayoutForSteps(workflowSteps);
  const stepNodes = workflowSteps.map((step, index) => {
    const id = deterministicUuid(`${seed}:step:${index + 1}:${step.nodeType}:${step.nodeName}`);
    return buildApprovalWorkflowStepNode({ step, index, id, taskPageId, rootListSetId, dataListMetas, position: layout.stepPositions[index] });
  });
  const positionById = new Map([
    [startId, layout.start],
    [endId, layout.end],
    [rejectEndId, layout.rejectEnd],
    ...stepNodes.map((node) => [node.id, node.position]),
  ]);
  const startToFirstFlowId = deterministicUuid(`${seed}:flow:start-to-first`);
  const startShape = {
    id: startId,
    resourceid: startId,
    stencil: { id: "StartNoneEvent" },
    position: layout.start,
    incoming: [],
    outgoing: [flowRef(startToFirstFlowId)],
    properties: { name: "Start", taskurl: submissionPageId, taskUrl: submissionPageId, TaskUrl: submissionPageId },
  };
  const flowShapes = [];
  const endIncoming = [];
  const rejectIncoming = [];
  const addFlow = ({ id, sourceId, targetId, name, conditioninfo = null, vertices = [] }) => {
    const sourcePosition = positionById.get(sourceId);
    const targetPosition = positionById.get(targetId);
    const dockers = vertices.length ? vertices : workflowStraightDockers(sourcePosition, targetPosition);
    const flow = {
      id,
      resourceid: id,
      stencil: { id: "SequenceFlow" },
      source: flowRef(sourceId),
      target: flowRef(targetId),
      incoming: [flowRef(sourceId)],
      outgoing: [flowRef(targetId)],
      properties: conditioninfo ? { name, linetype: "rounded", conditioninfo } : { name, linetype: "rounded" },
      dockers,
    };
    if (vertices.length) flow.vertices = vertices;
    flowShapes.push(flow);
    return flowRef(id);
  };
  addFlow({
    id: startToFirstFlowId,
    sourceId: startId,
    targetId: stepNodes[0]?.id || endId,
    name: "Submit",
    vertices: workflowVerticesBetween(layout.start, stepNodes[0]?.position || layout.end),
  });
  for (const [index, node] of stepNodes.entries()) {
    const nextNode = stepNodes[index + 1];
    if (node.stencil.id === "MultiAssignmentTask" || node.stencil.id === "CandidateTask") {
      const approvedFlowId = deterministicUuid(`${seed}:flow:${index + 1}:approved`);
      const rejectedFlowId = deterministicUuid(`${seed}:flow:${index + 1}:rejected`);
      const approvedTargetId = nextNode?.id || endId;
      const approvedTargetPosition = nextNode?.position || layout.end;
      const approvedRef = addFlow({
        id: approvedFlowId,
        sourceId: node.id,
        targetId: approvedTargetId,
        name: "Approved",
        conditioninfo: [workflowOutcomeCondition({ key: approvedFlowId, taskId: node.id, taskLabel: node.properties.name, outcome: "Approved" })],
        vertices: workflowVerticesBetween(node.position, approvedTargetPosition),
      });
      const rejectedRef = addFlow({
        id: rejectedFlowId,
        sourceId: node.id,
        targetId: rejectEndId,
        name: "Rejected",
        conditioninfo: [workflowOutcomeCondition({ key: rejectedFlowId, taskId: node.id, taskLabel: node.properties.name, outcome: "Rejected" })],
        vertices: workflowRejectedVertices(node.position, layout.rejectEnd),
      });
      node.outgoing = [approvedRef, rejectedRef];
      if (!nextNode) endIncoming.push(approvedRef);
      rejectIncoming.push(rejectedRef);
    } else {
      const completeFlowId = deterministicUuid(`${seed}:flow:${index + 1}:complete`);
      const targetId = nextNode?.id || endId;
      const targetPosition = nextNode?.position || layout.end;
      const completeRef = addFlow({
        id: completeFlowId,
        sourceId: node.id,
        targetId,
        name: "Complete",
        vertices: workflowVerticesBetween(node.position, targetPosition),
      });
      node.outgoing = [completeRef];
      if (!nextNode) endIncoming.push(completeRef);
    }
  }
  for (const [index, node] of stepNodes.entries()) {
    const incomingFlows = flowShapes.filter((flow) => refId(flow.target) === node.id).map((flow) => flowRef(flow.id));
    node.incoming = index === 0 ? [flowRef(startToFirstFlowId)] : incomingFlows;
  }
  if (!stepNodes.length) endIncoming.push(flowRef(startToFirstFlowId));
  return [
    startShape,
    ...flowShapes,
    ...stepNodes,
    {
      id: endId,
      resourceid: endId,
      stencil: { id: "EndNoneEvent" },
      position: layout.end,
      incoming: endIncoming,
      outgoing: [],
      properties: { name: "End" },
    },
    {
      id: rejectEndId,
      resourceid: rejectEndId,
      stencil: { id: "EndRejectEvent" },
      position: layout.rejectEnd,
      incoming: rejectIncoming,
      outgoing: [],
      properties: { name: "Rejected" },
    },
  ];
}

function buildApprovalWorkflowStepNode({ step, index, id, taskPageId, rootListSetId, dataListMetas = [], position = null }) {
  const stencil = step.nodeType === "CandidateTask" ? "CandidateTask" : step.nodeType === "ContentList" ? "ContentList" : "MultiAssignmentTask";
  const base = {
    id,
    resourceid: id,
    stencil: { id: stencil },
    position: position || { x: 420 + index * 300, y: stencil === "ContentList" ? 360 : 220 },
    incoming: [],
    outgoing: [],
    properties: {
      name: step.nodeName,
      plannedWorkflowNodeName: step.nodeName,
      plannedWorkflowNodeType: step.nodeType,
      plannedAssigneeRole: step.assigneeRole || "",
      plannedAssignmentStrategy: step.assignmentStrategy || "",
      plannedConditionBranch: step.conditionBranch || "",
      plannedProofBoundary: step.proofBoundary || "",
    },
  };
  if (stencil === "ContentList") {
    const targetList = resolveContentListTargetList({ step, dataListMetas });
    base.properties = {
      ...base.properties,
      type: "add",
      appid: 41,
      listsetid: stringId(rootListSetId),
      listid: stringId(targetList?.listId || rootListSetId),
      listtype: targetList?.listId ? "select" : "current",
      plannedTargetListName: targetList?.listName || "",
      listdatas: [],
    };
    return base;
  }
  base.properties = {
    ...base.properties,
    pagetype: 1,
    taskurl: taskPageId,
    taskUrl: taskPageId,
    TaskUrl: taskPageId,
    approveway: "anyapprove",
    approvepercentage: 100,
    usertaskassignment: [
      {
        type: "user",
        method: "expression",
        title: `User:${workflowUserLineManagerExpression("ApplicantUserID", "Applicant")}`,
        value: workflowUserLineManagerExpression("ApplicantUserID", "Applicant"),
        plannedAssigneeRole: step.assigneeRole || "",
      },
    ],
  };
  return base;
}

function resolveContentListTargetList({ step, dataListMetas = [] }) {
  const metas = dataListMetas.filter((meta) => meta?.listId && meta?.listName);
  if (!metas.length) return null;
  const text = [
    step?.nodeName,
    step?.description,
    step?.dataReadWrite,
    step?.conditionBranch,
  ].map(cleanResourceName).join(" ");
  const normalizedText = normKey(text);
  const textTokens = tokenSet(text);
  let best = null;
  for (const meta of metas) {
    const listTokens = tokenSet(meta.listName);
    const overlap = [...listTokens].filter((token) => textTokens.has(token)).length;
    const exact = normalizedText.includes(normKey(meta.listName)) ? 10 : 0;
    const score = exact + overlap;
    if (!best || score > best.score) best = { meta, score };
  }
  if (best && best.score > 0) return best.meta;
  return null;
}

function tokenSet(value) {
  return new Set(normKey(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/s$/, ""))
    .filter((token) => ![
      "create",
      "update",
      "archive",
      "persist",
      "related",
      "list",
      "record",
      "data",
      "write",
      "read",
      "field",
      "fields",
      "master",
    ].includes(token)));
}

function approvalTaskFieldSpecs(approvalFieldSpecs = {}) {
  const submissionFields = Array.isArray(approvalFieldSpecs.submission) ? approvalFieldSpecs.submission : [];
  const taskOnlyFields = Array.isArray(approvalFieldSpecs.task) ? approvalFieldSpecs.task : [];
  return uniqueApprovalFieldSpecs([...submissionFields, ...taskOnlyFields]);
}

function buildApprovalVariables(approvalFieldSpecs = {}) {
  const fields = uniqueApprovalFieldSpecs([...(approvalFieldSpecs.submission || []), ...(approvalFieldSpecs.task || [])]);
  const basic = [
    { id: "Applicant", idx: "Applicant", name: "Applicant", title: "Applicant", type: "user", source: "Applicant" },
    { id: "ApplicantUserID", idx: "ApplicantUserID", name: "ApplicantUserID", title: "Applicant", type: "user", source: "ApplicantUserID" },
    { id: "requestTitle", idx: "requestTitle", name: "requestTitle", title: "Request Title", type: "text", source: "Title" },
  ];
  for (const field of fields) {
    const id = String(field.fieldName || slugify(field.displayName));
    basic.push({
      id,
      idx: id,
      name: id,
      title: field.displayName,
      label: field.displayName,
      type: approvalVariableType(field),
      source: field.fieldName,
    });
  }
  return { basic: uniqueVariablesById(basic), listref: [], filter: [], tempVars: [] };
}

function uniqueVariablesById(variables) {
  const seen = new Set();
  const out = [];
  for (const variable of variables) {
    const key = String(variable?.id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(variable);
  }
  return out;
}

function approvalFormDef(id, title, role, fields = []) {
  const templateId = role === "task" ? APPROVAL_FORM_TEMPLATE_IDS.task : APPROVAL_FORM_TEMPLATE_IDS.submission;
  const templatePath = role === "task" ? APPROVAL_FORM_TEMPLATE_PATHS.task : APPROVAL_FORM_TEMPLATE_PATHS.submission;
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const resource = clone(raw.templateResource);
  resource.id = id;
  resource.title = role === "task" ? `${title} Task` : `${title} Submission`;
  resource.name = resource.title;
  resource.approvalFormLayoutTemplateId = templateId;
  resource.derivedFromApprovalFormLayoutTemplate = templateId;
  resource.approvalFormLayoutRole = role;
  setTemplateText(resource, "page_title_text", resource.title);
  setTemplateText(resource, "page_title_description", role === "task" ? `Review and act on ${title}.` : `Submit ${title}.`);
  setTemplateText(resource, "section_title_text", role === "task" ? "Review Details" : "Request Details");
  setTemplateText(resource, "section_title_description", role === "task" ? `Review submitted ${title} information before taking action.` : `Complete the required ${title} information.`);
  materializeApprovalFieldControls(resource, { fields, title, role });
  ensureApprovalBusinessSection(resource, { title, role });
  removeOperationsWithoutActions(resource);
  removeUnusedApprovalTemplateSections(resource);
  scrubApprovalSourceDomainResidue(resource, title);
  instantiateDashboardControlUuids(resource, `${slugify(title)}-${role}-approval-form`);
  resource.id = id;
  return resource;
}

function scrubApprovalSourceDomainResidue(node, title) {
  const replacements = [
    [/Active Loan Pipeline/g, `${title} Details`],
    [/Loan Status/g, "Request Status"],
    [/\bPipeline\b/g, "Workflow"],
  ];
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) value[index] = visit(value[index]);
      return value;
    }
    if (!value || typeof value !== "object") {
      if (typeof value !== "string") return value;
      return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
    }
    if (value.approvalFieldMaterializedFromPlan === true) return value;
    for (const [key, child] of Object.entries(value)) {
      if (key === "id") continue;
      value[key] = visit(child);
    }
    return value;
  };
  visit(node);
}

function materializeApprovalFieldControls(resource, { fields, title, role }) {
  const normalizedFields = uniqueApprovalFieldSpecs(fields);
  const slot = findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = normalizedFields.length
    ? [buildApprovalFormFieldsGrid({ fields: normalizedFields, formName: title, role })]
    : [buildApprovalNoFieldsNotice({ title, role })];
}

function ensureApprovalBusinessSection(resource, { title, role }) {
  const wrappers = findDescendants(resource, (node) => hasIdentity(node, "content_card_wrapper"));
  if (wrappers.some((wrapper) => hasMeaningfulBusinessContent(wrapper))) return;
  const wrapper = wrappers[0];
  const slot = wrapper ? findFirstByIdentity(wrapper, "section_content_area") : findBusinessSectionContentArea(resource);
  if (!slot) return;
  slot.children = [buildApprovalNoFieldsNotice({ title, role })];
}

function buildApprovalNoFieldsNotice({ title, role }) {
  return {
    id: deterministicUuid(`${slugify(title)}-${role}-approval-no-additional-fields`),
    name: "No additional fields required",
    title: "No additional fields required",
    label: "No additional fields required",
    nv_label: "approval_no_additional_fields_required",
    type: "heading",
    approvalFormNoFieldsNotice: true,
    attrs: {
      heads: { ty: [null, "body-medium"], color: "#64748b" },
      headc: {
        title: {
          value: role === "task"
            ? "No additional task fields are required. Use the action panel below to complete the workflow task."
            : "No additional submission fields are required for this approval form.",
        },
      },
    },
  };
}

function buildApprovalFormFieldsGrid({ fields, formName, role }) {
  const useThreeColumns = fields.length >= 8;
  const templateId = useThreeColumns ? "approval_form_fields_grid_3col_v1_1" : "approval_form_fields_grid_2col_v1_1";
  const templatePath = useThreeColumns
    ? path.join(ROOT, "docs/reference/approval-form-fields-grid-3col.template.json")
    : path.join(ROOT, "docs/reference/approval-form-fields-grid-2col.template.json");
  const raw = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const wrapper = clone(raw._ak_c || raw.templateResource || raw);
  const wrapperIdentity = useThreeColumns ? "form_grid_fields_3col_wrapper" : "form_grid_fields_2col_wrapper";
  wrapper.id = deterministicUuid(`${slugify(formName)}-${role}-${wrapperIdentity}`);
  wrapper.nv_label = wrapperIdentity;
  wrapper.approvalFormFieldsTemplateId = templateId;
  wrapper.derivedFromApprovalFormFieldsTemplate = templateId;
  wrapper.children = fields.map((field, index) => buildApprovalFormFieldControl({ field, index, formName, role, columns: useThreeColumns ? 3 : 2 }));
  return wrapper;
}

function buildApprovalFormFieldControl({ field, index, formName, role, columns }) {
  const type = normalizeApprovalControlType(field);
  const fullRow = isFullRowApprovalField(field, type);
  const control = {
    type,
    id: deterministicUuid(`${slugify(formName)}-${role}-approval-field-${index + 1}-${field.fieldName}`),
    name: field.displayName,
    title: field.displayName,
    label: field.displayName,
    displayLabel: [null, true],
    nv_label: `approval_field_${slugify(field.displayName).replace(/-/g, "_")}`,
    binding: field.fieldName,
    fieldName: field.fieldName,
    approvalFieldMaterializedFromPlan: true,
    attrs: {
      common: {
        margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }],
      },
      placeholder: `Enter ${field.displayName}`,
      data: {
        field: field.fieldName,
        fieldName: field.fieldName,
        displayName: field.displayName,
        variableType: field.fieldType,
      },
    },
  };
  if (role === "task") {
    control.readonly = true;
    control.readOnly = true;
    control.attrs.readonly = true;
    control.attrs.readOnly = true;
  }
  if (type === "radio" || type === "select") {
    control.attrs.displayStyle = "dropdown";
    control.attrs.choices = inferChoiceValues(field);
    control.attrs.color_choices = control.attrs.choices.map((value) => ({ value, key: deterministicUuid(`${control.id}-${value}`) }));
  }
  if (fullRow) control.attrs.common.grid = { position: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] };
  return control;
}

function normalizeApprovalControlType(field) {
  const raw = normKey(`${field?.controlType || ""} ${field?.fieldType || ""} ${field?.displayName || ""}`);
  if (/sub\s*list|detail\s*list|line\s*items?/.test(raw)) return "list";
  if (/rich\s*text|html/.test(raw)) return "richtext";
  if (/multi(?:ple)?\s*line|long\s*text|paragraph|purpose|justification|description|notes?/.test(raw)) return "textarea";
  if (/user|identity|people|person|traveler|requester|approver|manager/.test(raw)) return "identity-picker";
  if (/image|photo|picture/.test(raw)) return "image-upload";
  if (/file|attachment|document/.test(raw)) return "file-upload";
  if (/date|datetime|time/.test(raw)) return "datepicker";
  if (/currency|cost|amount|budget|price|fee/.test(raw)) return "currency";
  if (/decimal|number|integer|quantity|count|hours?/.test(raw)) return "input_number";
  if (/bit|boolean|yes\/no|switch/.test(raw)) return "switch";
  if (/choice|select|dropdown|radio|status|category|type|priority/.test(raw)) return "radio";
  return "input";
}

function approvalVariableType(field) {
  const type = normalizeApprovalControlType(field);
  if (type === "datepicker") return "date";
  if (type === "currency" || type === "input_number") return "number";
  if (type === "switch") return "boolean";
  if (type === "identity-picker") return "user";
  if (type === "list") return "sublist";
  return "text";
}

function isFullRowApprovalField(field, controlType) {
  const raw = normKey(`${field?.fieldType || ""} ${field?.controlType || ""} ${field?.displayName || ""}`);
  return controlType === "textarea" || controlType === "richtext" || controlType === "list" || /business purpose|justification|description|notes?/.test(raw);
}

function listInfo({ listId, title, type, ext2 = "", iconUrl = "", layoutView = null }) {
  return {
    ListID: listId,
    Title: title,
    Description: "",
    Status: 1,
    IsItemPerm: false,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: iconUrl,
    TableCode: "flowcraft",
    Ext1: "",
    Ext2: ext2,
    Ext3: "",
    Type: type,
    Flags: 1,
    LayoutView: type === 1 ? layoutView : "",
    Perms: [],
    AdvancePerms: [],
    IndexCode: "flowcraft",
  };
}

function loadIdSource({ cwd, apiIdManifest, fixtureMode, findings }) {
  if (apiIdManifest) {
    const file = path.resolve(cwd, apiIdManifest);
    if (!fs.existsSync(file)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_MISSING", "The API-issued ID manifest file does not exist.", { path: file }));
      return null;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const ids = Array.isArray(data.ids) ? data.ids : Array.isArray(data.allocations) ? data.allocations.map((item) => item.id) : [];
    if (!ids.length) findings.push(error("FULL_APP_MATERIALIZATION_API_ID_MANIFEST_EMPTY", "The API-issued ID manifest must contain ids[] or allocations[].id."));
    return { ids };
  }
  if (fixtureMode) {
    return { ids: buildFixtureApiIds(1024) };
  }
  findings.push(error("FULL_APP_MATERIALIZATION_API_ID_SOURCE_REQUIRED", "Generated-final materialization requires --api-id-manifest with API-issued IDs. Use --allow-fixture-api-ids-for-tests only in plugin regression tests."));
  return null;
}

function buildFixtureApiIds(count) {
  const base = 910000000000000001n;
  return Array.from({ length: count }, (_, index) => String(base + BigInt(index)));
}

function allocateIds(ids, paths, findings) {
  const cleanIds = ids.map((id) => String(id || "").trim()).filter(Boolean);
  if (cleanIds.length < paths.length) {
    findings.push(error("FULL_APP_MATERIALIZATION_API_ID_COUNT_INSUFFICIENT", "Not enough API-issued IDs for generated-final materialization.", { required: paths.length, received: cleanIds.length }));
    return {};
  }
  const out = {};
  let cursor = 0;
  for (const pathName of paths) {
    while (cursor < cleanIds.length && looksLikeRoundedGeneratedId(cleanIds[cursor])) cursor += 1;
    const id = cleanIds[cursor];
    cursor += 1;
    if (!id) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_COUNT_INSUFFICIENT_AFTER_ROUNDED_ID_GUARD", "Not enough non-rounded-looking API-issued IDs for generated-final materialization after preserving lossless-ID hard gates.", { required: paths.length, received: cleanIds.length, assigned: Object.keys(out).length }));
      break;
    }
    if (!/^\d{16,}$/.test(id)) {
      findings.push(error("FULL_APP_MATERIALIZATION_API_ID_INVALID", "API-issued IDs must be large numeric strings.", { path: pathName }));
    }
    out[pathName] = id;
  }
  return out;
}

function looksLikeRoundedGeneratedId(id) {
  return /^\d{16,}$/.test(String(id || "")) && /0000$/.test(String(id || ""));
}

function extractTitle(text) {
  const heading = text.match(/^#\s+(.+)$/m)?.[1];
  if (heading) {
    return stripPlanningDocumentSuffix(heading)
      .replace(/^(Functional Specification|Yeeflow App Plan)\s*[:\-]\s*/i, "")
      .trim();
  }
  return text.match(/\|\s*(?:Application|App) Name\s*\|\s*([^|]+)\|/i)?.[1]?.trim() || "";
}

function extractApplicationName(text) {
  const markdown = String(text || "");
  const bullet = markdown.match(/^\s*[-*]\s*(?:Application|App)\s+name\s*:\s*(.+?)\s*$/im)?.[1];
  if (bullet) return stripPlanningDocumentSuffix(bullet).trim();
  const table = markdown.match(/\|\s*(?:Application|App) Name\s*\|\s*([^|]+)\|/i)?.[1];
  if (table) return stripPlanningDocumentSuffix(table).trim();
  return "";
}

function stripPlanningDocumentSuffix(value) {
  return String(value || "")
    .replace(/\s+[-–—]\s+Yeeflow App Plan\s*$/i, "")
    .replace(/\s+Yeeflow App Plan\s*$/i, "")
    .trim();
}

function resolveRequiredPath(cwd, requested, fallbackName) {
  const candidate = requested ? path.resolve(cwd, requested) : path.resolve(cwd, fallbackName);
  return fs.existsSync(candidate) ? candidate : "";
}

function sanitizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Generated Yeeflow Application";
}

function inferFieldKey(displayName, fieldType, index) {
  if (/^title$/i.test(displayName)) return "Title";
  const prefix = fieldPrefix(fieldType);
  return `${prefix}${Math.max(1, index + 1)}`;
}

function fieldPrefix(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "Text";
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function inferControlType(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "identity-picker";
  if (/date|time/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "input_number";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "switch";
  if (/choice|select|status|category/.test(normalized)) return "select";
  if (/lookup|reference|relation/.test(normalized)) return "lookup";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture/.test(normalized)) return "icon-upload";
  if (/text ?area|textarea|multi line|multiline|long text|description/.test(normalized)) return "textarea";
  return "input";
}

function inferControlTypeFromFieldPlan({ displayName, fieldType, choiceValues }) {
  if (String(choiceValues || "").trim()) return "select";
  return inferControlType(fieldType || displayName || "");
}

function inferFieldTypeFromControlPlan({ displayName, controlType }) {
  const normalized = normKey(`${controlType || ""} ${displayName || ""}`);
  if (/date|datetime|timepicker|datepicker/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer|input number|input_number/.test(normalized)) return "Decimal";
  if (/switch|bit|boolean|yes no|flag|checkbox/.test(normalized)) return "Bit";
  return "Text";
}

function choiceValuesFromPurpose({ displayName, fieldType, purpose }) {
  const rawPurpose = cleanResourceName(purpose);
  if (!rawPurpose || !/[,;/]/.test(rawPurpose)) return "";
  const fieldText = normKey(`${displayName || ""} ${fieldType || ""}`);
  if (!/(priority|status|state|category|type|choice|select|severity|urgency|stage|phase)/.test(fieldText)) return "";
  const normalizedPurpose = rawPurpose
    .replace(/\b(?:e\.g\.|eg|values?|options?|choices?|includes?|such as|one of|allowed|supports?)\b[:：]?\s*/gi, "")
    .replace(/\.$/, "");
  const values = normalizedPurpose
    .split(/[,;/]+|\s+\bor\b\s+/i)
    .map((value) => cleanResourceName(value).replace(/^(and|or)\s+/i, "").trim())
    .filter((value) => value && value.length <= 40 && !/[.]/.test(value));
  return unique(values).slice(0, 12).join(", ");
}

function lookupTargetFromPurpose(purpose) {
  const match = cleanResourceName(purpose).match(/\blookup\s+(?:to|for|of)\s+(.+?)\s*$/i);
  if (!match) return "";
  return cleanResourceName(match[1]).replace(/[.;:]$/, "");
}

function resolveLookupTargetListId(field, dataListByName) {
  const controlType = inferControlTypeFromFieldPlan({
    displayName: field?.displayName,
    fieldType: field?.fieldType,
    choiceValues: field?.choiceValues,
  });
  if (normalizeControlType(field?.controlType || controlType) !== "lookup") return "";
  const candidates = [
    field?.lookupTarget,
    field?.displayName,
    `${field?.displayName || ""}s`,
  ].map((value) => normKey(value)).filter(Boolean);
  for (const candidate of candidates) {
    if (dataListByName.has(candidate)) return dataListByName.get(candidate);
    const singular = candidate.replace(/s$/, "");
    const match = [...dataListByName.entries()].find(([name]) => name === singular || name.replace(/s$/, "") === singular);
    if (match) return match[1];
  }
  return "";
}

function normalizeFieldType(fieldType) {
  const normalized = normKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "Text";
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function normalizeControlType(controlType) {
  const normalized = normKey(controlType);
  if (/sub list|sublist|\blist\b/.test(normalized)) return "list";
  if (/user|identity/.test(normalized)) return "identity-picker";
  if (/date|datetime/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent/.test(normalized)) return "input_number";
  if (/switch|bit|boolean|yes no|flag/.test(normalized)) return "switch";
  if (/checkbox/.test(normalized)) return "checkbox";
  if (/select|choice|dropdown/.test(normalized)) return "select";
  if (/lookup|reference|relation/.test(normalized)) return "lookup";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture|icon/.test(normalized)) return "icon-upload";
  if (/note|textarea|multi line/.test(normalized)) return "textarea";
  return "input";
}

function dynamicControlTypeForField(field) {
  const typeShape = normKey(`${field?.FieldType || ""} ${field?.Type || ""} ${field?.fieldType || ""} ${field?.controlType || ""}`);
  const fieldName = normKey(`${field?.FieldName || ""} ${field?.fieldName || ""}`);
  if (/user|identity|people|person/.test(typeShape) || /^(user|identity|person|people)\d*$/.test(fieldName)) return "dynamic-user";
  if (/image|photo|picture/.test(typeShape) || /^(image|photo|picture)\d*$/.test(fieldName)) return "dynamic-image";
  if (/file|attachment/.test(typeShape) || /^(file|attachment)\d*$/.test(fieldName)) return "dynamic-file";
  return "dynamic-field";
}

function fieldsForDynamicControls(listMeta) {
  const rawFields = listMeta?.fields || [];
  const fields = rawFields.map((field) => ({
    fieldName: field.FieldName || field.fieldName || "Title",
    displayName: field.DisplayName || field.displayName || field.FieldName || "Title",
    fieldType: field.FieldType || field.fieldType || "Text",
    controlType: field.Type || field.controlType || "",
    Type: field.Type || field.controlType || "",
    Rules: field.Rules || field.rules || "",
    choiceValues: field.choiceValues || "",
  }));
  return fields.length ? fields : [{ fieldName: "Title", displayName: "Title", fieldType: "Text" }];
}

function choiceValuesForField(field) {
  const parsed = parseJsonMaybe(field?.Rules) || {};
  const fromRules = Array.isArray(parsed.choices)
    ? parsed.choices.map((choice) => String(choice?.value || choice?.label || choice || "").trim()).filter(Boolean)
    : [];
  const fromPlan = String(field?.choiceValues || "").split(/[,;]+/).map((value) => value.trim()).filter(Boolean);
  const explicitValues = unique(fromRules.concat(fromPlan));
  if (explicitValues.length) return explicitValues.slice(0, 12);
  return unique(inferChoiceValues(field)).slice(0, 12);
}

function primaryFieldName(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  return (fields.find((field) => field.fieldName === "Title") || fields[0]).fieldName;
}

function primarySortFieldName(listMeta) {
  const fields = fieldsForDynamicControls(listMeta);
  const dateField = fields.find((field) => /datetime|date|modified|created|due|start|end/i.test(`${field.fieldName} ${field.displayName} ${field.fieldType} ${field.controlType}`));
  if (dateField) return dateField.fieldName;
  return primaryFieldName(listMeta);
}

function resolveFieldSpec(listMeta, requestedName) {
  const requested = normKey(requestedName);
  if (!requested) return null;
  return fieldsForDynamicControls(listMeta).find((field) => normKey(field.fieldName) === requested || normKey(field.displayName) === requested) || null;
}

function slugify(value) {
  return sanitizeTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated-yeeflow-application";
}

function stringId(id) {
  return String(id);
}

function numberId(id) {
  return String(id);
}

function normKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function summarizePath(file) {
  return {
    path: file,
    name: path.basename(file),
    exists: fs.existsSync(file),
    fileSize: fs.existsSync(file) ? fs.statSync(file).size : null,
  };
}

function buildFailure(findings, context = {}) {
  return { status: "fail", ...context, findings };
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--json") args.json = true;
    else if (token === "--allow-fixture-api-ids-for-tests") args.allowFixtureApiIdsForTests = true;
    else if (token === "--functional-spec" || token === "--spec") args.functionalSpec = argv[++i];
    else if (token === "--app-plan" || token === "--plan") args.appPlan = argv[++i];
    else if (token === "--out-dir") args.outDir = argv[++i];
    else if (token === "--api-id-manifest") args.apiIdManifest = argv[++i];
    else if (token === "--tenant-id") args.tenantId = argv[++i];
    else if (token === "--title") args.title = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/materialize-full-app-generated-final.mjs \\
    --functional-spec functional-specification.md \\
    --app-plan yeeflow-app-plan.md \\
    --out-dir dist \\
    --api-id-manifest api-issued-ids.json [--tenant-id <tenant-id>] [--json]

Regression-only fixture mode:
  node scripts/materialize-full-app-generated-final.mjs --functional-spec <file> --app-plan <file> --out-dir <dir> --allow-fixture-api-ids-for-tests --json

This command materializes generated-final package artifacts only. It never signs, installs, imports, upgrades, seeds data, or runs browser/runtime proof.`);
}

function printTextReport(report) {
  console.log(`Full-app generated-final materialization: ${report.status}`);
  if (report.outputs?.package) console.log(`package: ${report.outputs.package}`);
  for (const finding of report.findings || []) console.log(`- ${finding.code}: ${finding.message}`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
