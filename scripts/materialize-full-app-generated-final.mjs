#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  approvalVariableTypeForField,
  buildApprovalFormLayoutDef,
  ensureApprovalSubListColumnTitles,
} from "./lib/approval-form-layout-builder.mjs";
import {
  approvalWorkflowGraphPosition,
  withApprovalWorkflowDesignerBounds,
} from "./lib/approval-workflow-designer-shape-utils.mjs";
import { encodeYapkResourceOfficial } from "./lib/yapk-decode-utils.mjs";
import { cleanPlanningLabel, isPlanningPlaceholder } from "./lib/planning-placeholder-utils.mjs";
import { resolveSchemaAuthoritativeFormControlType } from "./lib/form-control-type-authority.mjs";
import {
  buildWorkflowQueryDataProperties,
  buildWorkflowLoopProperties,
  normalizeWorkflowQueryDataMode,
  parseWorkflowFieldMap,
  parseWorkflowSorts,
} from "./lib/workflow-query-data-utils.mjs";
import workflowAssigneeExpressionUtils from "./lib/workflow-assignee-expression-utils.cjs";
import workflowGraphReferenceUtils from "./lib/approval-workflow-graph-reference-utils.cjs";
import setVariableContractUtils from "./lib/set-variable-contract-utils.cjs";
import formActionSetDataListUtils from "./lib/form-action-set-data-list-utils.cjs";
import formActionOpenResourceUtils from "./lib/form-action-open-resource-utils.cjs";
import choiceFieldOptionUtils from "./lib/choice-field-option-utils.cjs";
import { validateWorkflowSetDataListPlan } from "./validate-workflow-set-data-list-plan.mjs";

const {
  buildWorkflowExpressionButton,
  serializeWorkflowVariableJson,
} = workflowAssigneeExpressionUtils;
const {
  canonicalGraphRef,
  graphRefId: canonicalGraphRefId,
  normalizeApprovalWorkflowGraphReferences,
} = workflowGraphReferenceUtils;
const { buildWorkflowVariableSetting, normalizeSetVariableHostType } = setVariableContractUtils;
const { buildFormActionSetDataListStep } = formActionSetDataListUtils;
const { buildFormActionOpenResourceStep } = formActionOpenResourceUtils;
const { parseChoiceOptionValues } = choiceFieldOptionUtils;

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
const PUBLIC_FORM_PAGE_TEMPLATE_PATH = path.join(ROOT, "docs/reference/public-form-page-layout-standard.template.json");
const PUBLIC_FORM_FIELDS_1COL_TEMPLATE_PATH = path.join(ROOT, "docs/reference/public-form-fields-1col.template.json");
const PUBLIC_FORM_PAGE_TEMPLATE_ID = "public-form-page-layout-standard";
const PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID = "public_form_fields_1col_v1_1";
const PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "input_number",
  "percent",
  "currency",
  "switch",
  "radio",
  "checkbox",
  "datepicker",
  "time",
  "file-upload",
  "icon-upload",
  "rate",
  "hyperlink",
  "signer",
  "list",
]);
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
const DOCUMENT_LIBRARY_DEFAULT_FIELDS = Object.freeze([
  { FieldName: "Title", FieldType: "Text", FieldIndex: 0, DisplayName: "Name", Type: "input", Status: 1, IsSystem: true, IsIndex: true, Rules: { displayLabel: true, isLibrary: true } },
  { FieldName: "Bigint1", FieldType: "Bigint", FieldIndex: 1, DisplayName: "ParentID", Type: "input_number", Status: 127, IsSystem: false, Rules: { displayLabel: true, isNotInListFiles: true } },
  { FieldName: "Text1", FieldType: "Text", FieldIndex: 1, DisplayName: "Type", Type: "input", Status: 119, IsSystem: false, Rules: { displayLabel: true } },
  { FieldName: "Bigint2", FieldType: "Bigint", FieldIndex: 2, DisplayName: "FileSize", Type: "input_number", Status: 99, IsSystem: false, Rules: { displayLabel: true, readonly: true } },
  { FieldName: "Text2", FieldType: "Text", FieldIndex: 2, DisplayName: "Extension", Type: "input", Status: 99, IsSystem: false, Rules: { displayLabel: true, readonly: true } },
  { FieldName: "Text3", FieldType: "Text", FieldIndex: 3, DisplayName: "UniqueName", Type: "input", Status: 319, IsSystem: false, Rules: { displayLabel: true, isNotInListFiles: true } },
  { FieldName: "Text4", FieldType: "Text", FieldIndex: 4, DisplayName: "Upload File", Type: "file-upload", Status: 57, IsSystem: false, Rules: { displayLabel: true, required: true, isLabrary: true, PROP_MAXSIZE: 2147483648 } },
]);
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
  const workflowSetDataListPlan = validateWorkflowSetDataListPlan(planText);
  for (const finding of workflowSetDataListPlan.findings) {
    if (finding.severity !== "error") continue;
    findings.push(error(`FULL_APP_${finding.code}`, finding.message, { planningPath: finding.path }));
  }
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });
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
    ? buildResourceGraphPackage({ appTitle, rootListId: numberId(ids["decoded.ListSet.ListID"]), planDemand, ids, iconUrl: appIconUrl, appPlanText: planText, findings })
    : buildDecodedPackage({
      appTitle,
      rootListId: numberId(ids["decoded.ListSet.ListID"]),
      dashboardLayoutId: stringId(ids["decoded.Pages[0].LayoutID"]),
      layoutResourceId: numberId(ids["decoded.Pages[0].LayoutInResources[0].ID"]),
      layoutResourceRefId: numberId(ids["decoded.Pages[0].LayoutInResources[0].RefId"]),
      iconUrl: appIconUrl,
      appPlanText: planText,
    });
  if (findings.length) return buildFailure(findings, { outDir, specPath, planPath });
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

function inferPlannedChildResourceType(value, fallback = "data-list") {
  const text = normKey(value);
  if (/\b(document library|doc library|document libraries|type 16|native document)\b/.test(text)) return "document-library";
  if (/\b(data list|list|type 1)\b/.test(text)) return "data-list";
  return fallback;
}

function collectPlannedChildResourceRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  if (!section.trim()) return [];
  const recordsByName = new Map();
  const upsert = (name, resourceType, evidence = "") => {
    const cleanName = cleanResourceName(name);
    if (!cleanName || isNonResourceName(cleanName)) return;
    const key = normKey(cleanName);
    const existing = recordsByName.get(key);
    const type = resourceType || existing?.resourceType || "data-list";
    recordsByName.set(key, {
      name: cleanName,
      resourceType: existing?.resourceType === "document-library" ? "document-library" : type,
      evidence: existing?.evidence || evidence,
    });
  };

  const lines = section.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+(?:\.[x0-9]+)?\s+(.+?)\s*$/i);
    if (heading) {
      const name = cleanResourceName(heading[1]);
      const blockLines = [];
      for (let scan = index + 1; scan < lines.length && !/^###\s+\d+(?:\.[x0-9]+)?\s+/i.test(lines[scan]); scan += 1) blockLines.push(lines[scan]);
      const blockText = blockLines.join("\n");
      upsert(name, inferPlannedChildResourceType(`${name}\n${blockText}`), "section-heading");
    }

    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const nameColumn = findHeaderIndex(normalizedHeaders, ["document library name", "data list name", "list name", "resource name", "resource", "name", "item"]);
    const resourceTypeColumn = findHeaderIndex(normalizedHeaders, ["resource type", "yeeflow resource type", "type", "kind"]);
    const documentLibraryNameColumn = findHeaderIndex(normalizedHeaders, ["document library name"]);
    const dataListNameColumn = findHeaderIndex(normalizedHeaders, ["data list name", "list name"]);
    if (nameColumn === -1 && documentLibraryNameColumn === -1 && dataListNameColumn === -1) continue;
    if (resourceTypeColumn === -1 && documentLibraryNameColumn === -1 && dataListNameColumn === -1) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const rawCells = splitRawTableLine(lines[rowIndex]);
      const cells = rawCells.map((cell) => cleanResourceName(cell));
      const name = cleanResourceName(cells[nameColumn !== -1 ? nameColumn : documentLibraryNameColumn !== -1 ? documentLibraryNameColumn : dataListNameColumn]);
      const headerHint = documentLibraryNameColumn !== -1 && (nameColumn === -1 || nameColumn === documentLibraryNameColumn)
        ? "Document Library"
        : dataListNameColumn !== -1 && (nameColumn === -1 || nameColumn === dataListNameColumn)
          ? "Data List"
          : "";
      const typeText = resourceTypeColumn === -1 ? headerHint : cleanResourceName(cells[resourceTypeColumn]) || headerHint;
      upsert(name, inferPlannedChildResourceType(typeText, headerHint === "Document Library" ? "document-library" : "data-list"), "section-table");
      rowIndex += 1;
    }
  }
  return [...recordsByName.values()];
}

function collectDocumentLibraryFolderRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  if (!section.trim()) return [];
  const documentLibraryNames = new Set(
    collectPlannedChildResourceRecords(planText)
      .filter((record) => record.resourceType === "document-library")
      .map((record) => normKey(record.name)),
  );
  const records = [];
  const lines = section.split(/\r?\n/);
  let currentResource = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+(?:\.[x0-9]+)?\s+(.+?)\s*$/i);
    if (heading) currentResource = cleanResourceName(heading[1]);
    if (!currentResource || !documentLibraryNames.has(normKey(currentResource))) continue;
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const levelColumn = findHeaderIndex(normalizedHeaders, ["folder level", "level"]);
    const nameColumn = findHeaderIndex(normalizedHeaders, ["folder name pattern", "folder name", "folder", "name"]);
    if (levelColumn === -1 || nameColumn === -1) continue;
    const generationColumn = findHeaderIndex(normalizedHeaders, ["generation plan", "generation", "plan"]);
    const proofColumn = findHeaderIndex(normalizedHeaders, ["proof boundary", "proof"]);
    const notesColumn = findHeaderIndex(normalizedHeaders, ["notes", "description"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const folderLevel = cleanResourceName(cells[levelColumn]);
      const folderName = cleanResourceName(cells[nameColumn]);
      const generationPlan = generationColumn === -1 ? "" : cleanResourceName(cells[generationColumn]);
      const isRoot = /^root(?:\s|$)/i.test(folderLevel);
      const isDeferred = /post[-\s]*import|defer|runtime[-\s]*proof[-\s]*required|do not generate|not generated/i.test(generationPlan);
      if (isRoot && folderName && !isNonResourceName(folderName) && !isDeferred) {
        records.push({
          libraryName: currentResource,
          folderName,
          folderLevel: "Root",
          generationPlan,
          proofBoundary: proofColumn === -1 ? "" : cleanResourceName(cells[proofColumn]),
          notes: notesColumn === -1 ? "" : cleanResourceName(cells[notesColumn]),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }
  const seen = new Set();
  return records.filter((record) => {
    const key = `${normKey(record.libraryName)}:${normKey(record.folderName)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function analyzeAppPlanResourceDemand(planText) {
  const sections = [
    { key: "dataLists", marker: /^##\s+4\.\s+Data Lists and Document Libraries Plan/im, tableHeaders: ["List Name", "Data List Name", "Document Library Name", "List", "Data List"], outputSurface: "$.Childs[]" },
    { key: "approvalForms", marker: /^##\s+5\.\s+Approval Forms Plan/im, tableHeaders: ["Approval Form Name", "Form Name"], outputSurface: "$.Forms[]" },
    { key: "formReports", marker: /^##\s+6\.\s+Form Reports Plan/im, tableHeaders: ["Form Report Name"], outputSurface: "$.FormNewReports[]" },
    { key: "scheduleWorkflows", marker: /^##\s+7\.\s+(?:Schedule|Scheduled) Workflows Plan/im, tableHeaders: ["Workflow Name", "Scheduled Workflow Name", "Schedule Workflow Name"], outputSurface: "$.Forms[] WorkflowType 3" },
    { key: "customForms", marker: /^##\s+10\.\s+Custom Data List Forms Plan/im, tableHeaders: ["Form Name"], outputSurface: "$.Childs[].Layouts[]" },
    { key: "dataListWorkflows", marker: /^##\s+11\.\s+Data List Workflows Plan/im, tableHeaders: ["Workflow Name", "Data List Workflow Name"], outputSurface: "$.Forms[] WorkflowType 1 + $.Childs[].FlowMappings[]" },
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
  const navigationResourceTypesByName = new Map();
  for (const items of Object.values(navigationItemsByGroup)) {
    for (const item of items || []) {
      const resourceType = inferPlannedChildResourceType(item.type, "");
      if (!resourceType) continue;
      navigationResourceTypesByName.set(normKey(item.target || item.title), resourceType);
      navigationResourceTypesByName.set(normKey(item.title), resourceType);
    }
  }
  const childResourceRecords = collectPlannedChildResourceRecords(planText).map((record) => {
    const navType = navigationResourceTypesByName.get(normKey(record.name));
    return navType && navType !== record.resourceType ? { ...record, resourceType: navType, evidence: `${record.evidence}+navigation-type` } : record;
  });
  if (childResourceRecords.length) {
    resources.dataLists = childResourceRecords.filter((record) => record.resourceType !== "document-library").map((record) => record.name);
    resources.documentLibraries = childResourceRecords.filter((record) => record.resourceType === "document-library").map((record) => record.name);
    counts.dataLists = resources.dataLists.length;
    counts.documentLibraries = resources.documentLibraries.length;
    for (let index = evidence.length - 1; index >= 0; index -= 1) {
      if (evidence[index].section === "dataLists") evidence.splice(index, 1);
    }
    if (resources.dataLists.length) evidence.push({ section: "dataLists", outputSurface: "$.Childs[] Type 1 data list resources", plannedItems: resources.dataLists.length, names: resources.dataLists });
    if (resources.documentLibraries.length) evidence.push({ section: "documentLibraries", outputSurface: "$.Childs[] Type 16 document library resources", plannedItems: resources.documentLibraries.length, names: resources.documentLibraries });
  } else {
    resources.documentLibraries = [];
    counts.documentLibraries = 0;
  }
  const dashboardFilterRecords = collectDashboardFilterRecords(planText);
  const dashboardSummaryMetricRecords = collectDashboardSummaryMetricRecords(planText);
  const dashboardDatasetRecords = collectDashboardDatasetRecords(planText);
  const dashboardAnalyticsRecords = collectDashboardAnalyticsRecords(planText);
  const dashboardDataTableRecords = collectDashboardDataTableRecords(planText);
  const dashboardPageLayoutTemplateRecords = collectDashboardPageLayoutTemplateRecords(planText);
  const reverseRelatedRecords = collectReverseRelatedPlanRows(planText);
  const formActionSetVariableRecords = collectFormActionSetVariableRecords(planText);
  const formActionSetDataListRecords = collectFormActionSetDataListRecords(planText);
  const formActionOpenResourceRecords = collectFormActionOpenResourceRecords(planText);
  const workflowSetDataListRecords = collectWorkflowSetDataListRecords(planText);
  const workflowLoopRecords = collectWorkflowLoopRecords(planText);
  const workflowHostRecords = collectWorkflowHostRecords(planText);
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
    childResourceRecords,
    documentLibraryFolderRecords: collectDocumentLibraryFolderRecords(planText),
    navigationItemsByGroup,
    dataListFieldSpecs: collectDataListFieldSpecs(planText),
    dataListViewRecords: collectDataListViewRecords(planText),
    customFormRecords: collectCustomFormRecords(planText),
    publicFormRecords: collectPublicFormRecords(planText),
    publicFormActionRecords: collectPublicFormActionRecords(planText),
    reverseRelatedRecords,
    approvalFormFieldSpecs: collectApprovalFormFieldSpecs(planText),
    approvalWorkflowNodeSpecs: collectApprovalWorkflowNodeSpecs(planText),
    workflowQueryDataConfigs: collectWorkflowQueryDataConfigs(planText),
    workflowSetDataListRecords,
    workflowLoopRecords,
    workflowHostRecords,
    formActionSetVariableRecords,
    formActionSetDataListRecords,
    formActionOpenResourceRecords,
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

function collectPublicFormActionRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map((header) => normKey(header));
    const column = (names) => findHeaderIndex(headers, names);
    const hostListColumn = column(["host data list", "data list"]);
    const publicFormColumn = column(["public form", "public form name"]);
    const actionColumn = column(["action name"]);
    const stepOrderColumn = column(["step order"]);
    const stepTypeColumn = column(["exact step type", "step type"]);
    const configColumn = column(["step configuration json", "step config json"]);
    if ([hostListColumn, publicFormColumn, actionColumn, stepOrderColumn, stepTypeColumn, configColumn].some((index) => index === -1)) continue;
    const stepNameColumn = column(["step name"]);
    const triggerColumn = column(["trigger"]);
    const boundControlColumn = column(["bound control"]);
    const cell = (row, index) => index === -1 ? "" : row[table.headers[index]];
    const structured = (row, index) => index === -1 ? "" : row.__raw?.[index] ?? cell(row, index);
    for (const row of table.rows) {
      const hostList = cleanResourceName(cell(row, hostListColumn));
      const publicForm = cleanResourceName(cell(row, publicFormColumn));
      const actionName = cleanResourceName(cell(row, actionColumn));
      if (!hostList || !publicForm || !actionName || [hostList, publicForm, actionName].some(isPlanningPlaceholder)) continue;
      records.push({
        hostList,
        publicForm,
        actionName,
        stepOrder: Number(cleanResourceName(cell(row, stepOrderColumn))) || 1,
        stepType: cleanResourceName(cell(row, stepTypeColumn)),
        stepName: cleanResourceName(cell(row, stepNameColumn)),
        trigger: cleanResourceName(cell(row, triggerColumn)),
        boundControl: cleanResourceName(cell(row, boundControlColumn)),
        configJson: cleanStructuredPlanCell(structured(row, configColumn)),
      });
    }
  }
  return records;
}

function collectFormActionSetVariableRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map((header) => normKey(header));
    const column = (names) => findHeaderIndex(headers, names);
    const hostResourceColumn = column(["host resource"]);
    const hostPageColumn = column(["host form page", "host form", "host page"]);
    const hostTypeColumn = column(["host type"]);
    const actionColumn = column(["action name"]);
    const stepOrderColumn = column(["step order"]);
    const targetKindColumn = column(["target kind"]);
    const targetIdColumn = column(["target id"]);
    const rhsColumn = column(["rhs expression tokens", "value expression tokens"]);
    if ([hostResourceColumn, hostPageColumn, hostTypeColumn, actionColumn, stepOrderColumn, targetKindColumn, targetIdColumn, rhsColumn].some((index) => index === -1)) continue;
    const stepNameColumn = column(["step name"]);
    const triggerColumn = column(["trigger"]);
    const boundControlColumn = column(["bound control field", "bound control", "bound field"]);
    const targetTypeColumn = column(["target value type", "value type"]);
    const conditionColumn = column(["condition tokens", "condition"]);
    const continueColumn = column(["continue"]);
    const nextActionColumn = column(["start another action target", "next action target"]);
    const consumerColumn = column(["result consumer use", "consumer"]);
    const cell = (row, index) => index === -1 ? "" : row[table.headers[index]];
    const structuredCell = (row, index) => index === -1 ? "" : row.__raw?.[index] ?? cell(row, index);
    for (const row of table.rows) {
      const hostResource = cleanResourceName(cell(row, hostResourceColumn));
      const hostPage = cleanResourceName(cell(row, hostPageColumn));
      const rawHostType = cleanResourceName(cell(row, hostTypeColumn));
      const hostType = normalizeSetVariableHostType(rawHostType);
      const actionName = cleanResourceName(cell(row, actionColumn));
      if (!hostResource || !hostPage || !actionName || [hostResource, hostPage, actionName].some(isPlanningPlaceholder)) continue;
      if (rawHostType && !hostType) {
        throw new Error(`FORM_ACTION_SETVAR_HOST_TYPE_UNSUPPORTED: ${hostResource} / ${hostPage} / ${rawHostType}`);
      }
      records.push({
        hostResource,
        hostPage,
        hostType,
        actionName,
        stepOrder: Number(cleanResourceName(cell(row, stepOrderColumn))) || 1,
        stepName: cleanResourceName(cell(row, stepNameColumn)),
        trigger: cleanResourceName(cell(row, triggerColumn)) || "None",
        boundControl: cleanResourceName(cell(row, boundControlColumn)),
        targetKind: cleanResourceName(cell(row, targetKindColumn)),
        targetId: cleanResourceName(cell(row, targetIdColumn)),
        targetValueType: cleanResourceName(cell(row, targetTypeColumn)) || "text",
        rhsTokens: cleanStructuredPlanCell(structuredCell(row, rhsColumn)),
        conditionTokens: cleanStructuredPlanCell(structuredCell(row, conditionColumn)),
        continueNext: /^true|yes$/i.test(cleanResourceName(cell(row, continueColumn))),
        nextAction: cleanResourceName(cell(row, nextActionColumn)),
        consumer: cleanResourceName(cell(row, consumerColumn)),
      });
    }
  }
  return records;
}

function collectFormActionSetDataListRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map((header) => normKey(header));
    const column = (names) => findHeaderIndex(headers, names);
    const stepTypeColumn = column(["exact step type", "step type"]);
    if (stepTypeColumn === -1) continue;
    const hostResourceColumn = column(["host resource"]);
    const hostPageColumn = column(["host form page", "host form", "host page"]);
    const hostTypeColumn = column(["host type", "host surface page"]);
    const actionColumn = column(["action name"]);
    const stepOrderColumn = column(["step order"]);
    const stepNameColumn = column(["step name"]);
    const operationColumn = column(["operation"]);
    const targetModeColumn = column(["target mode"]);
    if ([hostResourceColumn, hostPageColumn, hostTypeColumn, actionColumn, stepOrderColumn, stepNameColumn, operationColumn, targetModeColumn].some((index) => index === -1)) continue;
    const triggerColumn = column(["trigger"]);
    const boundControlColumn = column(["bound control", "bound control field"]);
    const targetTypeColumn = column(["target resource type"]);
    const targetResourceColumn = column(["target resource"]);
    const mappingsColumn = column(["field mapping json", "field mapping"]);
    const filtersColumn = column(["filter json", "filters"]);
    const conditionColumn = column(["execution condition tokens", "condition tokens", "condition"]);
    const continueColumn = column(["continue when not met", "continue"]);
    const statusKindColumn = column(["status target kind"]);
    const statusIdColumn = column(["status target id"]);
    const itemKindColumn = column(["item result target kind", "item id count target kind"]);
    const itemIdColumn = column(["item result target id", "item id count target id"]);
    const itemAttrColumn = column(["item result attribute"]);
    const rationaleColumn = column(["business rationale", "notes"]);
    const cell = (row, index) => index === -1 ? "" : row[table.headers[index]];
    const structuredCell = (row, index) => index === -1 ? "" : row.__raw?.[index] ?? cell(row, index);
    for (const row of table.rows) {
      if (!/set\s*data\s*list|setdatalist/i.test(cleanResourceName(cell(row, stepTypeColumn)))) continue;
      const hostResource = cleanResourceName(cell(row, hostResourceColumn));
      const hostPage = cleanResourceName(cell(row, hostPageColumn));
      const hostType = cleanResourceName(cell(row, hostTypeColumn));
      const actionName = cleanResourceName(cell(row, actionColumn));
      const stepName = cleanResourceName(cell(row, stepNameColumn));
      if ([hostResource, hostPage, actionName, stepName].some((value) => !value || isPlanningPlaceholder(value))) continue;
      records.push({
        hostResource,
        hostPage,
        hostType,
        actionName,
        stepOrder: Number(cleanResourceName(cell(row, stepOrderColumn))) || 1,
        stepName,
        trigger: cleanResourceName(cell(row, triggerColumn)) || "None",
        boundControl: cleanResourceName(cell(row, boundControlColumn)),
        operation: cleanResourceName(cell(row, operationColumn)).toLowerCase(),
        targetMode: cleanResourceName(cell(row, targetModeColumn)).toLowerCase(),
        targetResourceType: cleanResourceName(cell(row, targetTypeColumn)),
        targetResource: cleanResourceName(cell(row, targetResourceColumn)),
        mappingsJson: cleanStructuredPlanCell(structuredCell(row, mappingsColumn)),
        filtersJson: cleanStructuredPlanCell(structuredCell(row, filtersColumn)),
        conditionJson: cleanStructuredPlanCell(structuredCell(row, conditionColumn)),
        continueNext: /^(true|yes)$/i.test(cleanResourceName(cell(row, continueColumn))),
        statusTargetKind: cleanResourceName(cell(row, statusKindColumn)),
        statusTargetId: cleanResourceName(cell(row, statusIdColumn)),
        itemTargetKind: cleanResourceName(cell(row, itemKindColumn)),
        itemTargetId: cleanResourceName(cell(row, itemIdColumn)),
        itemResultAttribute: cleanResourceName(cell(row, itemAttrColumn)).toLowerCase(),
        rationale: cleanResourceName(cell(row, rationaleColumn)),
      });
    }
  }
  return records;
}

export function collectFormActionOpenResourceRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map((header) => normKey(header));
    const column = (names) => findHeaderIndex(headers, names);
    const stepTypeColumn = column(["exact step type", "step type"]);
    if (stepTypeColumn === -1) continue;
    const requiredColumns = {
      hostResource: column(["host resource"]), hostPage: column(["host form page", "host form", "host page"]), hostType: column(["host type"]),
      actionName: column(["action name"]), stepOrder: column(["step order"]), stepName: column(["step name"]), trigger: column(["trigger"]),
      boundControl: column(["bound control"]), operation: column(["operation type", "operation"]), targetMode: column(["target mode"]),
      targetType: column(["target resource type"]), targetResource: column(["target resource"]), openMode: column(["open mode"]),
    };
    if (Object.values(requiredColumns).some((index) => index === -1)) continue;
    const optional = {
      idTokens: column(["item form id expression tokens", "item form id tokens"]), layout: column(["selected custom form", "custom form"]),
      defaults: column(["default set variables json", "default variables json", "set variables json"]), query: column(["query parameters json"]),
      size: column(["modal size"]), width: column(["custom width"]), resultId: column(["return item id temp variable"]),
      condition: column(["execution condition tokens", "condition tokens"]), continueNext: column(["continue when not met", "continue"]),
    };
    const cell = (row, index) => index === -1 ? "" : row[table.headers[index]];
    const structured = (row, index) => index === -1 ? "" : row.__raw?.[index] ?? cell(row, index);
    for (const row of table.rows) {
      const stepType = cleanResourceName(cell(row, stepTypeColumn)).toLowerCase();
      if (!/^(listitem|openform|opendashboard)$/.test(stepType)) continue;
      const record = Object.fromEntries(Object.entries(requiredColumns).map(([key, index]) => [key, cleanResourceName(cell(row, index))]));
      if ([record.hostResource, record.hostPage, record.actionName, record.stepName].some((value) => !value || isPlanningPlaceholder(value))) continue;
      records.push({
        ...record, stepType, stepOrder: Number(record.stepOrder) || 1, operation: record.operation.toLowerCase(), targetMode: record.targetMode.toLowerCase(), openMode: record.openMode.toLowerCase(),
        idTokensJson: cleanStructuredPlanCell(structured(row, optional.idTokens)), selectedCustomForm: cleanResourceName(cell(row, optional.layout)),
        defaultsJson: cleanStructuredPlanCell(structured(row, optional.defaults)), queryParamsJson: cleanStructuredPlanCell(structured(row, optional.query)),
        modalSize: cleanResourceName(cell(row, optional.size)), customWidth: cleanResourceName(cell(row, optional.width)), resultItemId: cleanResourceName(cell(row, optional.resultId)),
        conditionJson: cleanStructuredPlanCell(structured(row, optional.condition)), continueNext: /^(true|yes)$/i.test(cleanResourceName(cell(row, optional.continueNext))),
      });
    }
  }
  return records;
}

export function materializePlannedFormActionSetVariables(resource, { records = [], hostResource = "", hostPage = "", hostType = "" } = {}) {
  if (!resource || typeof resource !== "object") return resource;
  const requestedHostType = normalizeSetVariableHostType(hostType);
  if (hostType && !requestedHostType) throw new Error(`FORM_ACTION_SETVAR_HOST_TYPE_UNSUPPORTED: ${hostResource} / ${hostPage} / ${hostType}`);
  const sameHostRecords = records.filter((record) => normKey(record.hostResource) === normKey(hostResource)
    && normKey(record.hostPage) === normKey(hostPage));
  const incompatibleHostTypes = sameHostRecords.filter((record) => record.hostType
    && normalizeSetVariableHostType(record.hostType) !== requestedHostType);
  if (incompatibleHostTypes.length) {
    throw new Error(`FORM_ACTION_SETVAR_HOST_TYPE_MISMATCH: ${hostResource} / ${hostPage} expected ${requestedHostType || "unspecified"}; planned ${incompatibleHostTypes.map((record) => record.hostType).join(", ")}`);
  }
  const selected = records.filter((record) => normKey(record.hostResource) === normKey(hostResource)
    && normKey(record.hostPage) === normKey(hostPage)
    && (!requestedHostType || !record.hostType || normalizeSetVariableHostType(record.hostType) === requestedHostType));
  if (!selected.length) return resource;
  resource.actions = Array.isArray(resource.actions) ? resource.actions : [];
  resource.formAction = resource.formAction && typeof resource.formAction === "object" && !Array.isArray(resource.formAction) ? resource.formAction : {};
  resource.tempVars = Array.isArray(resource.tempVars) ? resource.tempVars : [];
  const actionNames = unique(selected.map((record) => record.actionName));
  const actionIdByName = new Map(actionNames.map((name) => [normKey(name), deterministicUuid(`${hostResource}:${hostPage}:form-action:${name}`)]));
  resource.actions = resource.actions.filter((action) => !actionNames.some((name) => normKey(action?.name) === normKey(name)));
  for (const actionName of actionNames) {
    const actionRecords = selected.filter((record) => normKey(record.actionName) === normKey(actionName));
    const groupedSteps = new Map();
    for (const record of actionRecords) {
      if (!groupedSteps.has(record.stepOrder)) groupedSteps.set(record.stepOrder, []);
      groupedSteps.get(record.stepOrder).push(record);
      if (/temp/i.test(record.targetKind) && record.targetId && !isPlanningPlaceholder(record.targetId)) ensurePlannedTempVariable(resource, record);
    }
    const steps = [];
    for (const [, rows] of [...groupedSteps.entries()].sort((left, right) => left[0] - right[0])) {
      const assignments = rows.map(buildPlannedFormActionAssignment).filter(Boolean);
      const plannedAssignments = rows.filter((row) => row.targetId && !isPlanningPlaceholder(row.targetId));
      if (assignments.length !== plannedAssignments.length) {
        throw new Error(`FORM_ACTION_SETVAR_PLAN_ASSIGNMENT_INVALID: ${hostResource} / ${hostPage} / ${actionName} step ${rows[0].stepOrder}`);
      }
      if (assignments.length) {
        const step = assignments.length === 1
          ? { type: "setvar", name: rows[0].stepName || "Set variable", attrs: { setvar_var: assignments[0].var, setvar_val: assignments[0].value } }
          : { type: "setvar", name: rows[0].stepName || "Set multiple variables", attrs: { setvar_multi: true, setvar_array: assignments } };
        const condition = parseExpressionTokenArray(rows[0].conditionTokens);
        if (condition.length) step.condition = condition;
        if (rows[0].continueNext) step.continue = true;
        steps.push(step);
      }
      const nextAction = rows.map((row) => row.nextAction).find((name) => name && !isPlanningPlaceholder(name));
      if (nextAction) {
        const targetActionId = actionIdByName.get(normKey(nextAction));
        if (!targetActionId) throw new Error(`FORM_ACTION_SETVAR_CHAIN_TARGET_UNRESOLVED: ${hostResource} / ${hostPage} / ${actionName} -> ${nextAction}`);
        steps.push({ type: "otheraction", attrs: { control_action: targetActionId } });
      }
    }
    const action = { id: actionIdByName.get(normKey(actionName)), name: actionName, steps };
    resource.actions.push(action);
    bindPlannedFormActionTrigger(resource, action, actionRecords[0]);
  }
  return resource;
}

export function materializePlannedFormActionSetDataLists(resource, {
  records = [], hostResource = "", hostPage = "", hostSurface = "", listMetaByName = new Map(), rootListSetId = "",
} = {}) {
  if (!resource || typeof resource !== "object") return resource;
  const selected = records.filter((record) => normKey(record.hostResource) === normKey(hostResource)
    && normKey(record.hostPage) === normKey(hostPage)
    && (!record.hostType || formActionSetDataListHostMatches(record.hostType, hostSurface)));
  if (!selected.length) return resource;
  resource.actions = Array.isArray(resource.actions) ? resource.actions : [];
  resource.formAction = resource.formAction && typeof resource.formAction === "object" && !Array.isArray(resource.formAction) ? resource.formAction : {};
  resource.tempVars = Array.isArray(resource.tempVars) ? resource.tempVars : [];
  for (const record of [...selected].sort((left, right) => left.stepOrder - right.stepOrder)) {
    let action = resource.actions.find((item) => normKey(item?.name) === normKey(record.actionName));
    if (!action) {
      action = { id: deterministicUuid(`${hostResource}:${hostPage}:form-action:${record.actionName}`), name: record.actionName, steps: [] };
      resource.actions.push(action);
    }
    action.steps = Array.isArray(action.steps) ? action.steps : [];
    const targetMeta = record.targetMode === "select" ? listMetaByName.get(normKey(record.targetResource)) : null;
    if (record.targetMode === "select" && !targetMeta) throw new Error(`FORM_ACTION_SET_DATA_LIST_TARGET_UNRESOLVED: ${hostResource} / ${hostPage} / ${record.targetResource}`);
    const statusTarget = formActionResultTarget(record.statusTargetKind, record.statusTargetId);
    const itemTarget = formActionResultTarget(record.itemTargetKind, record.itemTargetId);
    if (statusTarget?.parent === "__temp_") ensureFormActionResultTempVariable(resource, statusTarget.id, "number");
    if (itemTarget?.parent === "__temp_") ensureFormActionResultTempVariable(resource, itemTarget.id, "text");
    const step = buildFormActionSetDataListStep({
      hostSurface,
      name: record.stepName,
      operation: record.operation,
      targetMode: record.targetMode,
      target: targetMeta ? { AppID: 41, ListSetID: rootListSetId, ListID: targetMeta.listId, ListType: targetMeta.resourceType === "document-library" ? 16 : 1 } : undefined,
      mappings: parseRequiredPlanJsonArray(record.mappingsJson, record.operation === "remove" ? [] : null, `FORM_ACTION_SET_DATA_LIST_MAPPING_INVALID: ${hostResource} / ${hostPage} / ${record.stepName}`),
      filters: parseRequiredPlanJsonArray(record.filtersJson, [], `FORM_ACTION_SET_DATA_LIST_FILTER_INVALID: ${hostResource} / ${hostPage} / ${record.stepName}`),
      condition: parseRequiredPlanJsonArray(record.conditionJson, [], `FORM_ACTION_SET_DATA_LIST_CONDITION_INVALID: ${hostResource} / ${hostPage} / ${record.stepName}`),
      continueNext: record.continueNext,
      statusTarget,
      itemTarget,
      itemResultAttribute: formActionItemResultAttribute(record.itemResultAttribute),
    });
    const existingIndex = action.steps.findIndex((item) => item?.type === "setdatalist" && normKey(item?.name) === normKey(record.stepName));
    if (existingIndex >= 0) action.steps.splice(existingIndex, 1);
    const insertionIndex = Math.max(0, Math.min(action.steps.length, record.stepOrder - 1));
    action.steps.splice(insertionIndex, 0, step);
    bindPlannedFormActionTrigger(resource, action, record);
  }
  return resource;
}

export function materializePlannedFormActionOpenResources(resource, {
  records = [], hostResource = "", hostPage = "", hostSurface = "", listMetaByName = new Map(), approvalMetaByName = new Map(), dashboardMetaByName = new Map(), rootListSetId = "",
} = {}) {
  if (!resource || typeof resource !== "object") return resource;
  const selected = records.filter((record) => normKey(record.hostResource) === normKey(hostResource)
    && normKey(record.hostPage) === normKey(hostPage)
    && (!record.hostType || formActionSetDataListHostMatches(record.hostType, hostSurface)));
  if (!selected.length) return resource;
  resource.actions = Array.isArray(resource.actions) ? resource.actions : [];
  resource.formAction = resource.formAction && typeof resource.formAction === "object" && !Array.isArray(resource.formAction) ? resource.formAction : {};
  resource.tempVars = Array.isArray(resource.tempVars) ? resource.tempVars : [];
  for (const record of [...selected].sort((left, right) => left.stepOrder - right.stepOrder)) {
    let action = resource.actions.find((item) => normKey(item?.name) === normKey(record.actionName));
    if (!action) { action = { id: deterministicUuid(`${hostResource}:${hostPage}:form-action:${record.actionName}`), name: record.actionName, steps: [] }; resource.actions.push(action); }
    action.steps = Array.isArray(action.steps) ? action.steps : [];
    let target;
    let layout;
    let approvalTargetMeta;
    if (record.stepType === "listitem") {
      const meta = listMetaByName.get(normKey(record.targetResource));
      if (!meta) throw new Error(`FORM_ACTION_OPEN_ITEM_TARGET_UNRESOLVED: ${record.targetResource}`);
      target = { AppID: 41, ListSetID: rootListSetId, ListID: meta.listId };
      if (record.selectedCustomForm && !isPlanningPlaceholder(record.selectedCustomForm) && !/^none|n a|not applicable$/i.test(normKey(record.selectedCustomForm))) {
        const layoutMeta = meta.layoutByName?.get(normKey(record.selectedCustomForm));
        if (!layoutMeta) throw new Error(`FORM_ACTION_OPEN_ITEM_LAYOUT_UNRESOLVED: ${record.targetResource} / ${record.selectedCustomForm}`);
        const layoutPurpose = typeof layoutMeta === "object" ? layoutMeta.purpose : "";
        if (layoutPurpose && !openItemOperationMatchesLayoutPurpose(record.operation, layoutPurpose)) {
          throw new Error(`FORM_ACTION_OPEN_ITEM_LAYOUT_OPERATION_MISMATCH: ${record.operation} cannot use ${record.selectedCustomForm} (${layoutPurpose}).`);
        }
        layout = typeof layoutMeta === "object" ? layoutMeta.id : layoutMeta;
      }
    } else if (record.stepType === "openform") {
      const meta = approvalMetaByName.get(normKey(record.targetResource));
      if (!meta) throw new Error(`FORM_ACTION_OPEN_APPROVAL_TARGET_UNRESOLVED: ${record.targetResource}`);
      approvalTargetMeta = meta;
      target = { AppID: 41, ListSetID: rootListSetId, ProcKey: meta.procKey };
    } else {
      const meta = dashboardMetaByName.get(normKey(record.targetResource));
      if (!meta) throw new Error(`FORM_ACTION_OPEN_DASHBOARD_TARGET_UNRESOLVED: ${record.targetResource}`);
      target = { AppID: 41, ListSetID: rootListSetId, PageID: meta.pageId };
    }
    if (record.resultItemId && !isPlanningPlaceholder(record.resultItemId) && !/^none|n a|not applicable$/i.test(normKey(record.resultItemId))) ensureFormActionResultTempVariable(resource, record.resultItemId, "text");
    const defaultValues = parseRequiredPlanJsonArray(record.defaultsJson, [], `FORM_ACTION_OPEN_RESOURCE_DEFAULTS_INVALID: ${record.stepName}`);
    if (record.stepType === "openform" && record.operation === "new") validatePlannedOpenApprovalVariables(defaultValues, approvalTargetMeta, record);
    const step = buildFormActionOpenResourceStep({
      hostSurface, stepType: record.stepType, name: record.stepName, operation: record.operation, targetMode: record.targetMode || "select", target, layout,
      itemIdTokens: parseRequiredPlanJsonArray(record.idTokensJson, [], `FORM_ACTION_OPEN_RESOURCE_ID_TOKENS_INVALID: ${record.stepName}`),
      formIdTokens: parseRequiredPlanJsonArray(record.idTokensJson, [], `FORM_ACTION_OPEN_RESOURCE_ID_TOKENS_INVALID: ${record.stepName}`),
      defaultValues,
      setVariables: defaultValues,
      queryParams: parseRequiredPlanJsonArray(record.queryParamsJson, [], `FORM_ACTION_OPEN_RESOURCE_QUERY_PARAMS_INVALID: ${record.stepName}`),
      openMode: record.openMode, modalSize: record.modalSize && !/^none|n a|not applicable$/i.test(normKey(record.modalSize)) ? Number(record.modalSize) : undefined,
      customWidth: record.customWidth && !/^none|n a|not applicable$/i.test(normKey(record.customWidth)) ? Number(record.customWidth) : undefined,
      resultItemId: record.resultItemId, resultItemParent: "__temp_",
      condition: parseRequiredPlanJsonArray(record.conditionJson, [], `FORM_ACTION_OPEN_RESOURCE_CONDITION_INVALID: ${record.stepName}`), continueNext: record.continueNext,
    });
    const existingIndex = action.steps.findIndex((item) => item?.type === record.stepType && normKey(item?.name) === normKey(record.stepName));
    if (existingIndex >= 0) action.steps.splice(existingIndex, 1);
    action.steps.splice(Math.max(0, Math.min(action.steps.length, record.stepOrder - 1)), 0, step);
    bindPlannedFormActionTrigger(resource, action, record);
  }
  return resource;
}

function validatePlannedOpenApprovalVariables(rules, targetMeta, record) {
  if (!rules.length) return;
  const variables = targetMeta?.variableById;
  if (!(variables instanceof Map)) throw new Error(`FORM_ACTION_OPEN_APPROVAL_VARIABLE_SCHEMA_MISSING: ${record.targetResource}`);
  for (const rule of rules) {
    const id = String(rule?.id || rule?.idx || rule?.source || "");
    const variable = variables.get(normKey(id));
    if (!variable) throw new Error(`FORM_ACTION_OPEN_APPROVAL_VARIABLE_UNRESOLVED: ${record.targetResource} / ${id}`);
    if (openResourceValueType(variable.type) !== openResourceValueType(rule.type)) {
      throw new Error(`FORM_ACTION_OPEN_APPROVAL_VARIABLE_TYPE_MISMATCH: ${id} expects ${variable.type}; received ${rule.type}.`);
    }
  }
}

function openResourceValueType(value) {
  const text = normKey(value);
  if (/^(text|string|input|textarea|radio|dict)$/.test(text)) return "text";
  if (/^(number|decimal|integer|percent|currency)$/.test(text)) return "number";
  if (/^(bool|boolean|bit|switch)$/.test(text)) return "boolean";
  if (/^(date|datetime|datepicker)$/.test(text)) return "date";
  if (/^(user|identity|identity picker)$/.test(text)) return "user";
  if (/^(department|organization|org)$/.test(text)) return "department";
  if (/^(lookup|list item)$/.test(text)) return "lookup";
  if (/^(file|attachment|attachments)$/.test(text)) return "file";
  if (/^(list|sublist|array)$/.test(text)) return "list";
  return text;
}

function openItemOperationMatchesLayoutPurpose(operation, purpose) {
  const op = normKey(operation);
  const kind = normKey(purpose);
  if (kind === "view") return op === "view";
  if (kind === "new edit") return op === "add" || op === "edit";
  if (kind === "new") return op === "add";
  if (kind === "edit") return op === "edit";
  return false;
}

function customFormAssignmentPurpose(assignment = {}) {
  const text = `${assignment.formType || ""} ${assignment.formName || ""} ${assignment.selectedTemplate || ""}`.toLowerCase();
  if (/workbench|view|detail/.test(text)) return "view";
  if (/new\s*[/&-]?\s*edit|new and edit/.test(text)) return "new-edit";
  if (/\bnew\b|create/.test(text)) return "new";
  if (/\bedit\b/.test(text)) return "edit";
  return "";
}

function formActionSetDataListHostMatches(planned, actual) {
  const normalized = normKey(planned);
  if (actual === "dashboard") return /dashboard/.test(normalized);
  if (/^approval_/.test(actual)) {
    if (!/approval/.test(normalized)) return false;
    if (/submission/.test(normalized)) return actual === "approval_submission";
    if (/task/.test(normalized)) return actual === "approval_task";
    if (/print/.test(normalized)) return false;
    return true;
  }
  if (/^data_list_/.test(actual)) return /data list/.test(normalized);
  if (/^document_library_/.test(actual)) return /document library/.test(normalized);
  return false;
}

function formActionResultTarget(kind, id) {
  if (!id || isPlanningPlaceholder(id) || /^none|n a|not applicable$/i.test(normKey(id))) return null;
  const key = normKey(kind);
  const parent = /temp/.test(key) ? "__temp_" : /current.*field|list field/.test(key) ? "__list_" : "__variables_";
  return { id: cleanResourceName(id).replace(/^__temp_/, ""), parent };
}

function formActionItemResultAttribute(value) {
  const normalized = cleanResourceName(value).toLowerCase();
  return !normalized || /^(none|n a|not applicable)$/.test(normKey(normalized)) ? undefined : normalized;
}

function ensureFormActionResultTempVariable(resource, id, type) {
  const cleanId = cleanResourceName(id).replace(/^__temp_/, "");
  if (resource.tempVars.some((variable) => [variable.id, variable.name].some((value) => normKey(value) === normKey(cleanId)))) return;
  resource.tempVars.push({ idx: deterministicUuid(`${resource.id || resource.title}:temp:${cleanId}`), id: cleanId, name: cleanId, type });
}

function parseRequiredPlanJsonArray(value, fallback, errorMessage) {
  if (!value || isPlanningPlaceholder(value) || /^(none|n\/a|not applicable)$/i.test(value)) {
    if (fallback !== null) return fallback;
    throw new Error(errorMessage);
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed;
  } catch {
    throw new Error(errorMessage);
  }
}

function buildPlannedFormActionAssignment(record) {
  if (!record.targetId || isPlanningPlaceholder(record.targetId)) return null;
  const value = parseExpressionTokenArray(record.rhsTokens);
  if (!value.length) return null;
  const targetKind = normKey(record.targetKind);
  const targetId = /temp/.test(targetKind) ? plannedTempVariableId(record.targetId) : record.targetId;
  const exprType = /current list field|list field/.test(targetKind) ? "list_field" : "variable";
  return {
    var: {
      exprType,
      valueType: record.targetValueType || "text",
      id: targetId,
      ...(exprType === "list_field" ? { prop: targetId } : {}),
      type: "expr",
      name: record.targetId,
    },
    value,
  };
}

function parseExpressionTokenArray(value) {
  if (!value || isPlanningPlaceholder(value)) return [];
  try {
    const parsed = JSON.parse(cleanStructuredPlanCell(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function plannedTempVariableId(value) {
  const id = cleanResourceName(value);
  return /^__temp_/.test(id) ? id : `__temp_${id}`;
}

function ensurePlannedTempVariable(resource, record) {
  const id = plannedTempVariableId(record.targetId);
  if (resource.tempVars.some((variable) => cleanResourceName(variable?.id) === id)) return;
  resource.tempVars.push({
    idx: deterministicUuid(`${resource.id || resource.title}:temp:${id}`),
    id,
    name: id.replace(/^__temp_/, ""),
    type: record.targetValueType || "text",
  });
}

function bindPlannedFormActionTrigger(resource, action, record) {
  const trigger = normKey(record.trigger);
  if (/page load/.test(trigger)) {
    resource.formAction.onLoad = action.id;
    return;
  }
  if (!record.boundControl || isPlanningPlaceholder(record.boundControl)) return;
  const control = findPlannedActionControl(resource, record.boundControl);
  if (!control) throw new Error(`FORM_ACTION_SETVAR_BOUND_CONTROL_UNRESOLVED: ${record.hostResource} / ${record.hostPage} / ${record.actionName} -> ${record.boundControl}`);
  control.attrs = control.attrs && typeof control.attrs === "object" ? control.attrs : {};
  if (/field change|value change|change/.test(trigger)) control.attrs.control_event_rule = action.id;
  else if (/button|container|click|collection action/.test(trigger)) control.attrs.control_action = action.id;
}

function findPlannedActionControl(resource, identity) {
  const wanted = normKey(identity);
  return [resource, ...findDescendants(resource, () => true)].find((control) => [
    control?.id,
    control?.nv_label,
    control?.nav_label,
    control?.name,
    control?.title,
    control?.label,
    control?.binding,
    control?.fieldName,
    control?.field,
  ].some((value) => normKey(value) === wanted));
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
    const hasExplicitPageColumn = pageColumn !== -1;
    const isGlobalSurfaceSelectionTable = !hasExplicitPageColumn && surfaceColumn !== -1 && sectionColumn !== -1;
    if (!hasExplicitPageColumn && !currentDashboardPage && !isGlobalSurfaceSelectionTable) continue;
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const selectedTemplateId = extractApprovedDataAnalyticsTemplateId(lines[rowIndex]);
      const dashboardPage = hasExplicitPageColumn ? (cleanResourceName(cells[pageColumn]) || currentDashboardPage) : (isGlobalSurfaceSelectionTable ? "" : currentDashboardPage);
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
    const displayColumn = findHeaderIndex(normalizedHeaders, ["field label", "display name", "field display name", "business field", "business label", "label", "name", "field name"]);
    const keyColumn = findHeaderIndex(normalizedHeaders, ["field name", "internal id field key", "field key", "internal id", "internal name", "internal field", "field id", "fieldname", "storage name", "storage field", "storage field name"]);
    const fieldTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow field type", "yeeflow field type", "field type", "business type", "type"]);
    const controlTypeColumn = findHeaderIndex(normalizedHeaders, ["exact yeeflow control type", "yeeflow type", "control type", "control"]);
    const choiceColumn = findHeaderIndex(normalizedHeaders, ["choice values", "choices", "options", "values"]);
    const lookupTargetColumn = findHeaderIndex(normalizedHeaders, ["lookup target", "target list", "lookup data list", "lookup list", "related list"]);
    const subListFieldsColumn = findHeaderIndex(normalizedHeaders, ["sub list row fields", "sublist row fields", "sub list columns", "sublist columns", "row fields"]);
    const subListSummariesColumn = findHeaderIndex(normalizedHeaders, ["sub list summaries", "sublist summaries", "sub list summary", "sublist summary", "summary fields"]);
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
        listFields: subListFieldsColumn === -1 ? [] : parseSubListRowFields(cells[subListFieldsColumn]),
        listSummaries: subListSummariesColumn === -1 ? [] : parseSubListSummaries(cells[subListSummariesColumn]),
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

function collectPublicFormRecords(planText) {
  const section = extractNumberedSection(planText, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) return [];
  const lines = section.split(/\r?\n/);
  const records = [];
  const seen = new Set();
  let currentList = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentList = cleanResourceName(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const formColumn = findHeaderIndex(normalizedHeaders, ["public form", "public form name"]);
    if (formColumn === -1) continue;
    const listColumn = findHeaderIndex(normalizedHeaders, ["host data list", "data list", "host list", "list name"]);
    const titleColumn = findHeaderIndex(normalizedHeaders, ["form title", "public title", "title"]);
    const descriptionColumn = findHeaderIndex(normalizedHeaders, ["description", "form description", "purpose"]);
    const fieldsColumn = findHeaderIndex(normalizedHeaders, ["fields", "included fields", "field source"]);
    const pageTemplateColumn = findHeaderIndex(normalizedHeaders, ["page layout template", "public form page layout template", "selected public form page layout template"]);
    const fieldTemplateColumn = findHeaderIndex(normalizedHeaders, ["fields layout template", "public form fields layout template", "selected public form fields layout template"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const formName = cleanResourceName(cells[formColumn]);
      const listName = cleanResourceName(cells[listColumn]) || currentList;
      if (formName && listName && !isNonResourceName(formName) && !isNonResourceName(listName)) {
        const key = `${normKey(listName)}::${normKey(formName)}`;
        if (!seen.has(key)) {
          seen.add(key);
          records.push({
            listName,
            formName,
            title: titleColumn === -1 ? formName : cleanResourceName(cells[titleColumn]) || formName,
            description: descriptionColumn === -1 ? "" : cleanResourceName(cells[descriptionColumn]),
            fields: fieldsColumn === -1 ? "" : cleanResourceName(cells[fieldsColumn]),
            pageTemplateId: pageTemplateColumn === -1 ? PUBLIC_FORM_PAGE_TEMPLATE_ID : cleanResourceName(cells[pageTemplateColumn]) || PUBLIC_FORM_PAGE_TEMPLATE_ID,
            fieldTemplateId: fieldTemplateColumn === -1 ? PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID : cleanResourceName(cells[fieldTemplateColumn]) || PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID,
          });
        }
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
    const readOnlyColumn = findHeaderIndex(normalizedHeaders, ["read only", "readonly"]);
    const dynamicDisplayColumn = findHeaderIndex(normalizedHeaders, ["dynamic display", "dynamic display rules"]);
    const subListFieldsColumn = findHeaderIndex(normalizedHeaders, ["sub list row fields", "sublist row fields", "sub list columns", "sublist columns", "row fields"]);
    const subListSummariesColumn = findHeaderIndex(normalizedHeaders, ["sub list summaries", "sublist summaries", "sub list summary", "sublist summary", "summary fields"]);
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
        readOnly: readOnlyColumn !== -1 && /^(?:yes|true|read.?only)$/i.test(cleanResourceName(cells[readOnlyColumn])),
        dynamicDisplay: dynamicDisplayColumn === -1 ? "" : cleanStructuredPlanCell(cells[dynamicDisplayColumn]),
        listFields: subListFieldsColumn === -1 ? [] : parseSubListRowFields(cells[subListFieldsColumn]),
        listSummaries: subListSummariesColumn === -1 ? [] : parseSubListSummaries(cells[subListSummariesColumn]),
      });
      byForm[normKey(currentApprovalForm)][currentRole] = uniqueApprovalFieldSpecs(list);
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return byForm;
}

function parseSubListRowFields(value) {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return text.split(/\s*;\s*/).map((entry) => {
    const [id, displayName, fieldType, controlType] = entry.split(/\s*:\s*/);
    return {
      id: cleanResourceName(id),
      displayName: cleanResourceName(displayName || id),
      columnTitle: cleanResourceName(displayName || id),
      fieldType: cleanResourceName(fieldType) || "Text",
      controlType: cleanResourceName(controlType),
    };
  }).filter((field) => field.id && field.displayName);
}

function parseSubListSummaries(value) {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(normalizePlannedSubListSummary).filter(Boolean);
    } catch {
      return [];
    }
  }
  return text.split(/\s*;\s*/).map((entry) => {
    const [field, type, targetKind, target] = entry.split(/\s*:\s*/);
    return normalizePlannedSubListSummary({ field, type, targetKind, target });
  }).filter(Boolean);
}

function normalizePlannedSubListSummary(summary) {
  const field = cleanResourceName(summary?.field || summary?.sourceField);
  const type = normKey(summary?.type || summary?.summaryType) || "total";
  const target = cleanResourceName(summary?.target || summary?.bindingValue || summary?.value);
  const kind = normKey(summary?.targetKind || summary?.bindingKind || summary?.prefix);
  const prefix = kind === "__temp_" || /temp/.test(kind)
    ? "__temp_"
    : kind === "__list_" || /list|field|record/.test(kind)
      ? "__list_"
      : "__variables_";
  if (!field) return null;
  return {
    field,
    type,
    display: summary?.display !== false,
    binding: target ? { prefix, value: target } : null,
  };
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
    const jobPositionNameColumn = findHeaderIndex(normalizedHeaders, ["required job position", "job position", "job position name", "position name"]);
    const jobPositionIdColumn = findHeaderIndex(normalizedHeaders, ["job position id", "position id", "assignee position id", "required job position id"]);
    const jobPositionSourceColumn = findHeaderIndex(normalizedHeaders, ["job position source", "assignee source", "source"]);
    const jobPositionProofColumn = findHeaderIndex(normalizedHeaders, ["job position proof", "job position proof status", "proof status", "assignee proof"]);
    const jobPositionOauthStatusColumn = findHeaderIndex(normalizedHeaders, ["job position oauth status", "oauth status", "oauth proof status", "oauth readiness status"]);
    const jobPositionOauthRefreshColumn = findHeaderIndex(normalizedHeaders, ["job position oauth refresh", "oauth refresh status", "oauth refresh attempted"]);
    const jobPositionLookupStatusColumn = findHeaderIndex(normalizedHeaders, ["job position lookup status", "position lookup status", "api lookup status"]);
    const jobPositionLookupAttemptedColumn = findHeaderIndex(normalizedHeaders, ["job position lookup attempted", "position lookup attempted", "api lookup attempted"]);
    const jobPositionCreateAttemptCountColumn = findHeaderIndex(normalizedHeaders, ["job position create attempt count", "position create attempt count", "create attempt count"]);
    const jobPositionCreateResponseColumn = findHeaderIndex(normalizedHeaders, ["job position create response id recorded", "position create response id recorded", "create response id recorded"]);
    const jobPositionDuplicateScanColumn = findHeaderIndex(normalizedHeaders, ["job position duplicate scan", "duplicate name scan", "duplicate scan recorded"]);
    const jobPositionCreationConfirmedColumn = findHeaderIndex(normalizedHeaders, ["job position creation confirmed", "admin creation confirmed", "creation confirmed"]);
    const jobPositionAdminConfirmedColumn = findHeaderIndex(normalizedHeaders, ["job position admin confirmed", "system admin confirmed", "admin permission confirmed"]);
    const outcomesColumn = findHeaderIndex(normalizedHeaders, ["outcomes", "outcome"]);
    const conditionColumn = findHeaderIndex(normalizedHeaders, ["condition/branch", "condition", "branch"]);
    const dataColumn = findHeaderIndex(normalizedHeaders, ["data read/write", "data read write", "data source", "read/write", "read write"]);
    const proofColumn = findHeaderIndex(normalizedHeaders, ["proof boundary", "proof"]);
    const queryModeColumn = findHeaderIndex(normalizedHeaders, ["workflow query mode", "query mode"]);
    const querySourceColumn = findHeaderIndex(normalizedHeaders, ["query source resource", "source resource"]);
    const queryFiltersColumn = findHeaderIndex(normalizedHeaders, ["query filters", "filters"]);
    const querySortsColumn = findHeaderIndex(normalizedHeaders, ["query sorts", "sorts"]);
    const queryResultVariableColumn = findHeaderIndex(normalizedHeaders, ["query result variable", "result variable"]);
    const queryResultVariableTypeColumn = findHeaderIndex(normalizedHeaders, ["query result variable type", "result variable type"]);
    const queryComplexTypeColumn = findHeaderIndex(normalizedHeaders, ["query listref complex type", "listref complex type", "complex type"]);
    const queryFieldMappingColumn = findHeaderIndex(normalizedHeaders, ["query field mapping", "field mapping"]);
    const queryCountVariableColumn = findHeaderIndex(normalizedHeaders, ["query count variable", "count variable"]);
    const queryPageSizeColumn = findHeaderIndex(normalizedHeaders, ["query page size", "page size"]);
    const queryPageNumberColumn = findHeaderIndex(normalizedHeaders, ["query page number", "page number"]);
    const queryConsumerColumn = findHeaderIndex(normalizedHeaders, ["downstream consumer use", "downstream consumer", "result consumer use"]);
    const setVariableAssignmentsColumn = findHeaderIndex(normalizedHeaders, ["set variable assignments", "variable assignments", "assignments", "target value assignments"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const rawCells = splitRawTableLine(lines[rowIndex]);
      const cells = rawCells.map((cell) => cleanResourceName(cell));
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
        requiredJobPositionName: jobPositionNameColumn === -1 ? "" : cleanResourceName(cells[jobPositionNameColumn]),
        jobPositionId: jobPositionIdColumn === -1 ? "" : cleanResourceName(cells[jobPositionIdColumn]),
        jobPositionSource: jobPositionSourceColumn === -1 ? "" : cleanResourceName(cells[jobPositionSourceColumn]),
        jobPositionProofStatus: jobPositionProofColumn === -1 ? "" : cleanResourceName(cells[jobPositionProofColumn]),
        jobPositionOauthStatus: jobPositionOauthStatusColumn === -1 ? "" : cleanResourceName(cells[jobPositionOauthStatusColumn]),
        jobPositionOauthRefreshStatus: jobPositionOauthRefreshColumn === -1 ? "" : cleanResourceName(cells[jobPositionOauthRefreshColumn]),
        jobPositionLookupStatus: jobPositionLookupStatusColumn === -1 ? "" : cleanResourceName(cells[jobPositionLookupStatusColumn]),
        jobPositionLookupAttempted: jobPositionLookupAttemptedColumn === -1 ? "" : cleanResourceName(cells[jobPositionLookupAttemptedColumn]),
        jobPositionCreateAttemptCount: jobPositionCreateAttemptCountColumn === -1 ? "" : cleanResourceName(cells[jobPositionCreateAttemptCountColumn]),
        jobPositionCreateResponseIdRecorded: jobPositionCreateResponseColumn === -1 ? "" : cleanResourceName(cells[jobPositionCreateResponseColumn]),
        jobPositionDuplicateScanRecorded: jobPositionDuplicateScanColumn === -1 ? "" : cleanResourceName(cells[jobPositionDuplicateScanColumn]),
        jobPositionCreationConfirmed: jobPositionCreationConfirmedColumn === -1 ? "" : cleanResourceName(cells[jobPositionCreationConfirmedColumn]),
        jobPositionAdminConfirmed: jobPositionAdminConfirmedColumn === -1 ? "" : cleanResourceName(cells[jobPositionAdminConfirmedColumn]),
        outcomes: outcomesColumn === -1 ? "" : cleanResourceName(cells[outcomesColumn]),
        conditionBranch: conditionColumn === -1 ? "" : cleanResourceName(cells[conditionColumn]),
        dataReadWrite: dataColumn === -1 ? "" : cleanResourceName(cells[dataColumn]),
        proofBoundary: proofColumn === -1 ? "" : cleanResourceName(cells[proofColumn]),
        queryMode: queryModeColumn === -1 ? "" : cleanResourceName(cells[queryModeColumn]),
        querySourceResource: querySourceColumn === -1 ? "" : cleanResourceName(cells[querySourceColumn]),
        queryFilters: queryFiltersColumn === -1 ? "" : cleanResourceName(cells[queryFiltersColumn]),
        querySorts: querySortsColumn === -1 ? "" : cleanResourceName(cells[querySortsColumn]),
        queryResultVariable: queryResultVariableColumn === -1 ? "" : cleanResourceName(cells[queryResultVariableColumn]),
        queryResultVariableType: queryResultVariableTypeColumn === -1 ? "" : cleanResourceName(cells[queryResultVariableTypeColumn]),
        queryComplexType: queryComplexTypeColumn === -1 ? "" : cleanResourceName(cells[queryComplexTypeColumn]),
        queryFieldMapping: queryFieldMappingColumn === -1 ? "" : cleanResourceName(cells[queryFieldMappingColumn]),
        queryCountVariable: queryCountVariableColumn === -1 ? "" : cleanResourceName(cells[queryCountVariableColumn]),
        queryPageSize: queryPageSizeColumn === -1 ? "" : cleanResourceName(cells[queryPageSizeColumn]),
        queryPageNumber: queryPageNumberColumn === -1 ? "" : cleanResourceName(cells[queryPageNumberColumn]),
        queryDownstreamUse: queryConsumerColumn === -1 ? "" : cleanResourceName(cells[queryConsumerColumn]),
        setVariableAssignments: setVariableAssignmentsColumn === -1 ? "" : cleanStructuredPlanCell(rawCells[setVariableAssignmentsColumn]),
      });
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return Object.fromEntries(Object.entries(byForm).map(([key, nodes]) => [key, uniqueApprovalWorkflowNodes(nodes)]));
}

function collectWorkflowQueryDataConfigs(planText) {
  const byWorkflow = {};
  const lines = String(planText || "").split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1]) || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map((header) => normKey(header));
    const workflowColumn = findHeaderIndex(normalizedHeaders, ["workflow"]);
    const nodeColumn = findHeaderIndex(normalizedHeaders, ["node name", "workflow node"]);
    const modeColumn = findHeaderIndex(normalizedHeaders, ["workflow query mode"]);
    if (workflowColumn === -1 || nodeColumn === -1 || modeColumn === -1) continue;
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource"]);
    const filtersColumn = findHeaderIndex(normalizedHeaders, ["filters"]);
    const sortsColumn = findHeaderIndex(normalizedHeaders, ["sorts"]);
    const resultColumn = findHeaderIndex(normalizedHeaders, ["result variable"]);
    const resultTypeColumn = findHeaderIndex(normalizedHeaders, ["result variable type"]);
    const complexTypeColumn = findHeaderIndex(normalizedHeaders, ["listref / complex type", "listref complex type", "complex type"]);
    const mappingColumn = findHeaderIndex(normalizedHeaders, ["field mapping"]);
    const countColumn = findHeaderIndex(normalizedHeaders, ["count variable"]);
    const pageSizeColumn = findHeaderIndex(normalizedHeaders, ["page size"]);
    const pageNumberColumn = findHeaderIndex(normalizedHeaders, ["page number"]);
    const consumerColumn = findHeaderIndex(normalizedHeaders, ["downstream consumer / use", "downstream consumer", "result consumer / use"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const workflow = cleanResourceName(cells[workflowColumn]);
      const nodeName = cleanResourceName(cells[nodeColumn]);
      if (workflow && nodeName && !isNonResourceName(workflow) && !isNonResourceName(nodeName)) {
        const key = normKey(workflow);
        if (!byWorkflow[key]) byWorkflow[key] = [];
        byWorkflow[key].push({
          nodeName,
          queryMode: cleanResourceName(cells[modeColumn]),
          querySourceResource: sourceColumn === -1 ? "" : cleanResourceName(cells[sourceColumn]),
          queryFilters: filtersColumn === -1 ? "" : cleanResourceName(cells[filtersColumn]),
          querySorts: sortsColumn === -1 ? "" : cleanResourceName(cells[sortsColumn]),
          queryResultVariable: resultColumn === -1 ? "" : cleanResourceName(cells[resultColumn]),
          queryResultVariableType: resultTypeColumn === -1 ? "" : cleanResourceName(cells[resultTypeColumn]),
          queryComplexType: complexTypeColumn === -1 ? "" : cleanResourceName(cells[complexTypeColumn]),
          queryFieldMapping: mappingColumn === -1 ? "" : cleanResourceName(cells[mappingColumn]),
          queryCountVariable: countColumn === -1 ? "" : cleanResourceName(cells[countColumn]),
          queryPageSize: pageSizeColumn === -1 ? "" : cleanResourceName(cells[pageSizeColumn]),
          queryPageNumber: pageNumberColumn === -1 ? "" : cleanResourceName(cells[pageNumberColumn]),
          queryDownstreamUse: consumerColumn === -1 ? "" : cleanResourceName(cells[consumerColumn]),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex - 1;
  }
  return byWorkflow;
}

function collectWorkflowSetDataListRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map(normKey);
    const column = (names) => findHeaderIndex(headers, names);
    const hostColumn = column(["workflow host", "workflow host type"]);
    const workflowColumn = column(["workflow name", "workflow"]);
    const nodeColumn = column(["node name", "workflow node"]);
    const modeColumn = column(["target mode"]);
    const resourceColumn = column(["target resource"]);
    const resourceTypeColumn = column(["target resource type"]);
    const operationColumn = column(["operation"]);
    const mappingsColumn = column(["mappings json"]);
    const filtersColumn = column(["filters json"]);
    const parentLoopColumn = column(["parent loop", "loop parent", "loop node"]);
    if ([hostColumn, workflowColumn, nodeColumn, modeColumn, resourceColumn, resourceTypeColumn, operationColumn, mappingsColumn, filtersColumn].some((index) => index === -1)) continue;
    for (const row of table.rows) {
      const raw = row.__raw || [];
      const get = (index) => cleanResourceName(row[table.headers[index]] || "");
      const parse = (index) => parseJsonMaybe(cleanStructuredPlanCell(raw[index] || ""));
      const record = {
        host: get(hostColumn), workflowName: get(workflowColumn), nodeName: get(nodeColumn), targetMode: get(modeColumn), targetResource: get(resourceColumn), targetResourceType: get(resourceTypeColumn), operation: get(operationColumn), mappings: parse(mappingsColumn), filters: parse(filtersColumn),
        batchSourceType: get(column(["batch source type"])),
        batchSource: get(column(["batch source"])),
        batchSourceFields: parse(column(["batch source fields json"])),
        parentLoop: parentLoopColumn === -1 ? "" : get(parentLoopColumn),
      };
      if (record.host && record.workflowName && record.nodeName && !isNonResourceName(record.workflowName)) records.push(record);
    }
  }
  return records;
}

function collectWorkflowLoopRecords(planText) {
  const records = [];
  for (const table of parseMarkdownTables(planText)) {
    const headers = table.headers.map(normKey);
    const column = (names) => findHeaderIndex(headers, names);
    const workflowColumn = column(["workflow", "workflow name"]);
    const hostColumn = column(["workflow host type", "workflow host"]);
    const nodeColumn = column(["loop node name", "loop name"]);
    const modeColumn = column(["loop mode"]);
    const sourceParentColumn = column(["loop source parent"]);
    const sourceColumn = column(["loop source"]);
    const expressionColumn = column(["loop value expression json", "loop expression json"]);
    if ([workflowColumn, nodeColumn, modeColumn].some((index) => index === -1)) continue;
    for (const row of table.rows) {
      const raw = row.__raw || [];
      const get = (index) => index === -1 ? "" : cleanResourceName(row[table.headers[index]] || "");
      const expression = expressionColumn === -1 ? null : parseJsonMaybe(cleanStructuredPlanCell(raw[expressionColumn] || ""));
      const record = {
        workflowName: get(workflowColumn),
        host: get(hostColumn),
        nodeName: get(nodeColumn),
        mode: get(modeColumn).toLowerCase(),
        sourceParent: get(sourceParentColumn),
        source: get(sourceColumn),
        expression,
      };
      if (record.workflowName && record.nodeName && !isNonResourceName(record.workflowName)) records.push(record);
    }
  }
  return records;
}

function collectWorkflowHostRecords(planText) {
  const records = [];
  const collect = (marker, workflowType) => {
    const section = extractNumberedSection(planText, marker);
    for (const table of parseMarkdownTables(section)) {
      const headers = table.headers.map(normKey);
      // The detailed Set Data List action table is nested in the same section.
      // It describes nodes, not workflow hosts.
      if (headers.includes("workflow host")) continue;
      const nameColumn = findHeaderIndex(headers, ["workflow name", "scheduled workflow name", "schedule workflow name", "data list workflow name"]);
      const hostColumn = findHeaderIndex(headers, ["host list library", "host list", "host resource", "data list", "list library"]);
      const triggerColumn = findHeaderIndex(headers, ["trigger condition", "trigger"]);
      const settingsColumn = findHeaderIndex(headers, ["schedule settings json", "trigger settings json", "settings json", "schedule settings"]);
      if (nameColumn === -1) continue;
      for (const row of table.rows) {
        const raw = row.__raw || [];
        const name = cleanResourceName(row[table.headers[nameColumn]] || "");
        if (!name || isNonResourceName(name)) continue;
        records.push({ workflowType, name, hostResource: hostColumn === -1 ? "" : cleanResourceName(row[table.headers[hostColumn]] || ""), trigger: triggerColumn === -1 ? "" : cleanResourceName(row[table.headers[triggerColumn]] || ""), settings: settingsColumn === -1 ? null : parseJsonMaybe(cleanStructuredPlanCell(raw[settingsColumn] || "")) });
      }
    }
  };
  collect(/^##\s+7\.\s+(?:Schedule|Scheduled) Workflows Plan/im, 3);
  collect(/^##\s+11\.\s+Data List Workflows Plan/im, 1);
  return records;
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
  const scopedSignatures = new Set((records || [])
    .filter((record) => normKey(record.dashboardPage))
    .map((record) => [
      normKey(record.selectedTemplateId),
      normKey(record.sourceResource),
    ].join("::")));
  for (const record of records || []) {
    const signature = [
      normKey(record.selectedTemplateId),
      normKey(record.sourceResource),
    ].join("::");
    if (!normKey(record.dashboardPage) && scopedSignatures.has(signature)) continue;
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
    dataLists: "$.Childs[] Type 1 data list resources",
    documentLibraries: "$.Childs[] Type 16 document library resources",
    approvalForms: "$.Forms[] approval form definitions",
    scheduleWorkflows: "$.Forms[] WorkflowType 3 scheduled workflow definitions",
    dataListWorkflows: "$.Forms[] WorkflowType 1 definitions plus host-list FlowMappings[]",
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
  const childResources = plannedChildResources(planDemand);
  childResources.forEach((record, index) => {
    const name = record.name;
    const fieldSpecs = record.resourceType === "document-library" ? DOCUMENT_LIBRARY_DEFAULT_FIELDS : fieldSpecsForList(planDemand, name);
    paths.push(`decoded.Childs[${index}].List.ListID`);
    fieldSpecs.forEach((field, fieldIndex) => {
      paths.push(`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`);
    });
    paths.push(`decoded.Childs[${index}].Layouts[0].LayoutID`);
    if (record.resourceType === "document-library") {
      documentLibraryFoldersForList(planDemand, record.name).forEach((folder, folderIndex) => {
        paths.push(documentLibraryFolderIdPath(index, folderIndex));
      });
    }
  });
  for (const assignment of assignAllCustomFormLayoutPositions(planDemand, childResources.map((record) => record.name))) {
    paths.push(`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`);
  }
  for (const assignment of assignPublicFormPositions(planDemand, childResources)) {
    if (assignment.listIndex >= 0) paths.push(`decoded.Childs[${assignment.listIndex}].PublicForms[${assignment.publicFormIndex}].ID`);
  }
  const customLayoutCountByListIndex = new Map();
  for (const assignment of assignAllCustomFormLayoutPositions(planDemand, childResources.map((record) => record.name))) {
    customLayoutCountByListIndex.set(
      assignment.listIndex,
      Math.max(customLayoutCountByListIndex.get(assignment.listIndex) || 0, assignment.layoutIndex),
    );
  }
  childResources.forEach((record, index) => {
    const name = record.name;
    const plannedViews = dataListViewRecordsForList(planDemand, name);
    const defaultViewRecord = selectDefaultDataListViewRecord(plannedViews);
    const extraViews = plannedViews.filter((record) => record !== defaultViewRecord);
    const baseIndex = (customLayoutCountByListIndex.get(index) || 0) + 1;
    extraViews.forEach((record, viewIndex) => {
      paths.push(`decoded.Childs[${index}].Layouts[${baseIndex + viewIndex}].LayoutID`);
    });
  });
  planDemand.resources.approvalForms.forEach((name, index) => {
    paths.push(`decoded.Forms[${index}].Key`);
    paths.push(`decoded.Forms[${index}].DefResourceID`);
  });
  const workflowFormOffset = planDemand.resources.approvalForms.length;
  const workflowHosts = plannedWorkflowHostRecords(planDemand);
  workflowHosts.forEach((record, index) => {
    paths.push(`decoded.Forms[${workflowFormOffset + index}].Key`);
    paths.push(`decoded.Forms[${workflowFormOffset + index}].DefResourceID`);
    if (record.workflowType !== 1) return;
    const childIndex = childResources.findIndex((child) => normKey(child.name) === normKey(record.hostResource));
    if (childIndex >= 0) paths.push(`decoded.Childs[${childIndex}].FlowMappings[${workflowFlowMappingIndex(planDemand, record)}].ID`);
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

function documentLibraryFoldersForList(planDemand, listName) {
  return (planDemand?.documentLibraryFolderRecords || [])
    .filter((record) => normKey(record.libraryName) === normKey(listName));
}

function documentLibraryFolderIdPath(childIndex, folderIndex) {
  return `decoded.Childs[${childIndex}].List.Items[${folderIndex}].$key`;
}

function documentLibraryFolderUniqueName(folderName) {
  return `0_${String(folderName || "").trim().toLowerCase()}`;
}

function buildDocumentLibraryFolderItems({ planDemand, listName, childIndex, ids }) {
  return Object.fromEntries(documentLibraryFoldersForList(planDemand, listName).map((folder, folderIndex) => {
    const folderId = stringId(ids[documentLibraryFolderIdPath(childIndex, folderIndex)]);
    return [folderId, {
      Title: folder.folderName,
      Bigint1: "0",
      Text1: "folder",
      Bigint2: "",
      Text2: "",
      Text3: documentLibraryFolderUniqueName(folder.folderName),
    }];
  }));
}

function plannedChildResources(planDemand, fallbackNames = []) {
  const records = Array.isArray(planDemand?.childResourceRecords) ? planDemand.childResourceRecords : [];
  if (records.length) return records.map((record) => ({
    name: record.name,
    resourceType: record.resourceType === "document-library" ? "document-library" : "data-list",
  }));
  const dataLists = (planDemand?.resources?.dataLists || []).map((name) => ({ name, resourceType: "data-list" }));
  const documentLibraries = (planDemand?.resources?.documentLibraries || []).map((name) => ({ name, resourceType: "document-library" }));
  const combined = dataLists.concat(documentLibraries);
  if (combined.length) return combined;
  return fallbackNames.map((name) => ({ name, resourceType: "data-list" }));
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
    if (["dataListWorkflows", "scheduleWorkflows"].includes(key) && normalizedHeaders.includes("workflow host")) continue;
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
    const filterColumn = findHeaderIndex(headers, ["filter conditions", "fixed filter conditions", "fixed filters", "filter", "filters", "data filter", "data filters"]);
    const displayColumn = findHeaderIndex(headers, ["display fields", "visible fields", "layout fields", "columns"]);
    const queryColumn = findHeaderIndex(headers, ["query/search fields", "query fields", "search fields", "user filter fields", "user query fields"]);
    const defaultColumn = findHeaderIndex(headers, ["default", "is default", "default view"]);
    const sortColumn = findHeaderIndex(headers, ["sort/grouping", "sort", "sorting", "grouping"]);
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
        filterConditions: filterColumn === -1 ? "" : cleanResourceName(cells[filterColumn]),
        displayFields: displayColumn === -1 ? "" : cleanResourceName(cells[displayColumn]),
        queryFields: queryColumn === -1 ? "" : cleanResourceName(cells[queryColumn]),
        sortGrouping: sortColumn === -1 ? "" : cleanResourceName(cells[sortColumn]),
        isDefault: defaultColumn !== -1 && /\b(?:yes|true|default|primary)\b/i.test(cells[defaultColumn]),
      });
    }
  }
  return unique(records.map((record) => `${normKey(record.viewName)}|${normKey(record.listName)}`))
    .map((key) => records.find((record) => `${normKey(record.viewName)}|${normKey(record.listName)}` === key))
    .filter(Boolean);
}

function dataListViewRecordsForList(planDemand, listName) {
  return (planDemand.dataListViewRecords || []).filter((record) => normKey(record.listName) === normKey(listName));
}

function hasParsedFieldSpecsForList(planDemand, listName) {
  return Boolean(planDemand.dataListFieldSpecs?.[normKey(listName)]?.length);
}

function dataListViewRequiresParsedBusinessFields(viewRecord) {
  if (!viewRecord) return false;
  const requestedFields = [
    ...splitPlannedFieldList(viewRecord.displayFields),
    ...splitPlannedFieldList(viewRecord.queryFields),
  ].filter((fieldName) => normKey(fieldName) !== "title");
  return requestedFields.length > 0 || !isNoFixedDataViewFilterText(viewRecord.filterConditions);
}

function selectDefaultDataListViewRecord(records) {
  if (!records.length) return null;
  return records.find((record) => record.isDefault)
    || records.find((record) => /\b(?:all|all items|all records)\b/i.test(record.viewName))
    || null;
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
      listFields: Array.isArray(field.listFields) ? field.listFields : [],
      listSummaries: Array.isArray(field.listSummaries) ? field.listSummaries : [],
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
  const key = normKey(formName);
  const configs = planDemand.workflowQueryDataConfigs?.[key] || [];
  const nodes = (planDemand.approvalWorkflowNodeSpecs?.[key] || []).map((node) => {
    if (normalizeApprovalWorkflowNodeType(node?.nodeType) !== "QueryData") return node;
    const config = configs.find((item) => normKey(item.nodeName) === normKey(node.nodeName));
    return config ? { ...node, ...config } : node;
  });
  return uniqueApprovalWorkflowNodes(nodes);
}

function uniqueApprovalFieldSpecs(fields) {
  const normalized = [];
  const seen = new Set();
  for (const field of fields) {
    const displayName = cleanResourceName(field?.displayName);
    if (!displayName || isNonResourceName(displayName)) continue;
    let fieldName = cleanResourceName(field?.fieldName || inferFieldKey(displayName, field?.fieldType || "Text", normalized.length));
    if (canonicalApprovalVariableId(fieldName) === "requesttitle" || canonicalApprovalVariableId(displayName) === "requesttitle") fieldName = "requestTitle";
    const key = normKey(fieldName || displayName);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      displayName,
      fieldName,
      fieldType: cleanResourceName(field?.fieldType) || "Text",
      controlType: cleanResourceName(field?.controlType) || inferControlType(field?.fieldType || ""),
      readOnly: field?.readOnly === true,
      dynamicDisplay: cleanStructuredPlanCell(field?.dynamicDisplay),
      listRefId: cleanResourceName(field?.listRefId || field?.complexTypeId),
      listFields: Array.isArray(field?.listFields)
        ? field.listFields.map((rowField) => ({ ...rowField }))
        : Array.isArray(field?.rowFields)
          ? field.rowFields.map((rowField) => ({ ...rowField }))
          : [],
      listSummaries: Array.isArray(field?.listSummaries)
        ? field.listSummaries.map((summary) => ({ ...summary, binding: summary?.binding ? { ...summary.binding } : null }))
        : [],
    });
  }
  return normalized;
}

function canonicalApprovalVariableId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueApprovalWorkflowNodes(nodes) {
  const normalized = [];
  const seen = new Set();
  for (const [index, node] of (nodes || []).entries()) {
    const nodeName = workflowBusinessActionName(node, index);
    const nodeType = normalizeApprovalWorkflowNodeType(node?.nodeType);
    if (!nodeName || !nodeType || isNonResourceName(nodeName)) continue;
    const key = `${normKey(nodeName)}::${nodeType.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      ...node,
      nodeName,
      originalNodeName: cleanResourceName(node?.nodeName),
      nodeType,
      description: cleanResourceName(node?.description),
      assigneeRole: cleanResourceName(node?.assigneeRole),
      assignmentStrategy: cleanResourceName(node?.assignmentStrategy),
      requiredJobPositionName: cleanResourceName(node?.requiredJobPositionName),
      jobPositionId: cleanResourceName(node?.jobPositionId),
      jobPositionSource: cleanResourceName(node?.jobPositionSource),
      jobPositionProofStatus: cleanResourceName(node?.jobPositionProofStatus),
      jobPositionOauthStatus: cleanResourceName(node?.jobPositionOauthStatus),
      jobPositionOauthRefreshStatus: cleanResourceName(node?.jobPositionOauthRefreshStatus),
      jobPositionLookupStatus: cleanResourceName(node?.jobPositionLookupStatus),
      jobPositionLookupAttempted: cleanResourceName(node?.jobPositionLookupAttempted),
      jobPositionCreateAttemptCount: cleanResourceName(node?.jobPositionCreateAttemptCount),
      jobPositionCreateResponseIdRecorded: cleanResourceName(node?.jobPositionCreateResponseIdRecorded),
      jobPositionDuplicateScanRecorded: cleanResourceName(node?.jobPositionDuplicateScanRecorded),
      jobPositionCreationConfirmed: cleanResourceName(node?.jobPositionCreationConfirmed),
      jobPositionAdminConfirmed: cleanResourceName(node?.jobPositionAdminConfirmed),
      outcomes: cleanResourceName(node?.outcomes),
      conditionBranch: cleanResourceName(node?.conditionBranch),
      dataReadWrite: cleanResourceName(node?.dataReadWrite),
      proofBoundary: cleanResourceName(node?.proofBoundary),
      queryMode: cleanResourceName(node?.queryMode),
      querySourceResource: cleanResourceName(node?.querySourceResource),
      queryFilters: cleanResourceName(node?.queryFilters),
      querySorts: cleanResourceName(node?.querySorts),
      queryResultVariable: cleanResourceName(node?.queryResultVariable),
      queryResultVariableType: cleanResourceName(node?.queryResultVariableType),
      queryComplexType: cleanResourceName(node?.queryComplexType),
      queryFieldMapping: cleanResourceName(node?.queryFieldMapping),
      queryCountVariable: cleanResourceName(node?.queryCountVariable),
      queryPageSize: cleanResourceName(node?.queryPageSize),
      queryPageNumber: cleanResourceName(node?.queryPageNumber),
      queryDownstreamUse: cleanResourceName(node?.queryDownstreamUse),
      setVariableAssignments: cleanStructuredPlanCell(node?.setVariableAssignments),
    });
  }
  return normalized;
}

function isDefaultWorkflowActionName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  return /^(assignment\s*task|candidate\s*task|claim\s*task|content\s*list|inclusive\s*gateway|gateway|task|workflow\s*task|sequence\s*flow(?:[_\s-]*\d+)?)$/i.test(text);
}

function truncateWorkflowActionName(value, maxLength = 48) {
  const text = cleanResourceName(value).replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "").trim() || text.slice(0, maxLength).trim();
}

function workflowBusinessActionName(node, index = 0) {
  const raw = cleanResourceName(node?.nodeName || node?.name || node?.title);
  if (raw && !isDefaultWorkflowActionName(raw)) return truncateWorkflowActionName(raw);
  const nodeType = normalizeApprovalWorkflowNodeType(node?.nodeType);
  const text = [
    node?.requiredJobPositionName,
    node?.assigneeRole,
    node?.assignmentStrategy,
    node?.description,
    node?.conditionBranch,
    node?.dataReadWrite,
  ].map(cleanResourceName).join(" ");
  const normalized = normKey(text);
  if (/\bcash(?:i|e)er\b/.test(normalized)) return "Cashier confirm";
  if (/\bfinance\b/.test(normalized) && /\bmanager\b/.test(normalized)) return "Finance manager approval";
  if (/\bgeneral\b/.test(normalized) && /\bmanager\b/.test(normalized)) return "General manager approval";
  if (/\bdepartment\b/.test(normalized) && /\b(head|manager)\b/.test(normalized)) return "Department head approval";
  if (/\bline\b/.test(normalized) && /\bmanager\b/.test(normalized)) return "Line manager approval";
  if (/\bowner\b/.test(normalized) && /\bmanager\b/.test(normalized)) return "Owner's manager approval";
  if (/\bowner\b/.test(normalized)) return "Owner approval";
  if (/\bit\b/.test(normalized) && /\bsecurity\b/.test(normalized)) return "IT security check";
  if (/\bsoftware\b/.test(normalized) && /\blicen[sc]e\b/.test(normalized)) return "Software license check";
  if (/\bprocurement\b/.test(normalized) && /\bavailability\b/.test(normalized)) return "Procurement availability";
  if (/\bvendor\b/.test(normalized) && /\bquotation\b/.test(normalized)) return "Vendor quotation";
  if (/\basset\b/.test(normalized) && /\bregistration\b/.test(normalized)) return "Asset registration";
  if (/\bpickup\b/.test(normalized)) return "Employee pickup";
  if (/\bclarification\b/.test(normalized)) return "Request clarification";
  if (nodeType === "InclusiveGateway") {
    if (/\bamount\b|\bbudget\b|\bcost\b|\bprice\b/.test(normalized)) return "Amount check";
    if (/\bequipment\b/.test(normalized)) return "Equipment type check";
    if (/\bavailability\b/.test(normalized)) return "Availability check";
    return `Business condition ${index + 1}`;
  }
  if (nodeType === "ContentList") {
    if (/\bcreate\b|\badd\b/.test(normalized)) return "Create record";
    if (/\bupdate\b|\bset\b|\bsave\b/.test(normalized)) return "Update record";
    return `Save request data ${index + 1}`;
  }
  if (nodeType === "CandidateTask") return `Claim task ${index + 1}`;
  return `Review request ${index + 1}`;
}

function normalizeApprovalWorkflowNodeType(value) {
  const text = cleanResourceName(value);
  const key = normKey(text);
  if (!key) return "";
  if (/^start/.test(key)) return "StartNoneEvent";
  if (/end\s*reject|reject\s*end/.test(key)) return "EndRejectEvent";
  if (/^end/.test(key)) return "EndNoneEvent";
  if (/sequence|flow|transition/.test(key)) return "SequenceFlow";
  if (/exclusive\s*gateway|exclusivegateway/.test(key)) return "ExclusiveGateway";
  if (/inclusive\s*gateway|inclusivegateway/.test(key)) return "InclusiveGateway";
  if (/query\s*data|querydata/.test(key)) return "QueryData";
  if (/set\s*variable|setvariable|setvariabletask/.test(key)) return "SetVariableTask";
  if (/gateway|condition|branch|decision/.test(key)) return "InclusiveGateway";
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

function assignPublicFormPositions(planDemand, childResourceRecords) {
  const listIndexByName = new Map(childResourceRecords.map((record, index) => [normKey(record.name), index]));
  const countsByList = new Map();
  return (planDemand.publicFormRecords || []).map((record) => {
    const listIndex = listIndexByName.has(normKey(record.listName)) ? listIndexByName.get(normKey(record.listName)) : -1;
    const publicFormIndex = countsByList.get(listIndex) || 0;
    countsByList.set(listIndex, publicFormIndex + 1);
    return { ...record, listIndex, publicFormIndex };
  });
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
  const record = {
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
  if (Array.isArray(field.listSummaries) && field.listSummaries.length) {
    Object.defineProperty(record, "__plannedListSummaries", {
      value: field.listSummaries.map((summary) => clone(summary)),
      enumerable: false,
    });
  }
  return record;
}

function buildDocumentLibraryFieldRecords({ listId, ids, childIndex }) {
  return DOCUMENT_LIBRARY_DEFAULT_FIELDS.map((field, fieldIndex) => {
    const rules = field.Rules && typeof field.Rules === "object" ? JSON.stringify(field.Rules) : field.Rules || "";
    return {
      FieldID: stringId(ids[`decoded.Childs[${childIndex}].Fields[${fieldIndex}].FieldID`]),
      ListID: listId,
      FieldName: field.FieldName,
      FieldType: field.FieldType,
      FieldIndex: field.FieldIndex,
      DisplayName: field.DisplayName,
      InternalName: field.FieldName,
      Type: field.Type,
      Status: field.Status,
      Category: 0,
      DefaultValue: "",
      Rules: rules,
      IsSort: false,
      IsSystem: Boolean(field.IsSystem),
      IsUnique: false,
      IsIndex: Boolean(field.IsIndex),
      Ext1: "",
      Ext2: "",
      Ext3: "",
    };
  });
}

function buildDataListViewLayoutView({ fields, viewRecord = null }) {
  const layoutFields = ensureTitleFirstFields(resolveDataViewFields(fields, viewRecord?.displayFields), fields).slice(0, 12);
  const queryFields = resolveDataViewFields(fields, viewRecord?.queryFields);
  const effectiveQueryFields = uniqueFieldsByName([
    ...layoutFields,
    ...(queryFields.length ? queryFields : fields),
  ]);
  return {
    layout: layoutFields.map((field, fieldIndex) => buildDataViewLayoutColumn(field, fieldIndex)),
    filter: parseDataViewFixedFilterConditions(viewRecord?.filterConditions || "", fields),
    query: [
      ...effectiveQueryFields.map((field) => buildDataViewQueryField(field)),
      { FieldName: "ListDataID", field: "ListDataID" },
      { FieldName: "CreatedBy", field: "CreatedBy" },
      { FieldName: "ModifiedBy", field: "ModifiedBy" },
      { FieldName: "Created", field: "Created" },
      { FieldName: "Modified", field: "Modified" },
    ],
    sort: [],
    rowColor: [],
  };
}

function ensureTitleFirstFields(fields, allFields = fields) {
  const titleField = fields.find((field) => field.FieldName === "Title") || allFields.find((field) => field.FieldName === "Title");
  if (titleField) {
    return [titleField, ...fields.filter((field) => field.FieldName !== "Title")];
  }
  return fields;
}

function uniqueFieldsByName(fields) {
  const out = [];
  const seen = new Set();
  for (const field of fields) {
    const fieldName = field?.FieldName;
    if (!fieldName || seen.has(fieldName)) continue;
    seen.add(fieldName);
    out.push(field);
  }
  return out;
}

function buildDataListViewLayoutViewChecked({ fields, viewRecord = null, listName = "", findings = null }) {
  const layoutView = buildDataListViewLayoutView({ fields, viewRecord });
  const plannedFilterText = viewRecord?.filterConditions || "";
  if (viewRecord && !isNoFixedDataViewFilterText(plannedFilterText) && layoutView.filter.length === 0) {
    findings?.push(error(
      "DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED",
      "Planned Data List View fixed filter text did not materialize into LayoutView.filter[]. Use concrete field-level filters such as `Meeting Date is not empty` or `Status = Active`; vague business phrases are not signing-ready.",
      {
        listName,
        viewName: viewRecord.viewName,
        filterConditions: plannedFilterText,
      },
    ));
  }
  return layoutView;
}

function buildDataViewLayoutColumn(field, fieldIndex) {
  return {
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    DisplayName: field.DisplayName,
    Type: field.Type,
    Order: fieldIndex + 1,
    Mobile: 2,
    Show: true,
  };
}

function buildDataViewQueryField(field) {
  return {
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    field: field.FieldName,
    ID: field.FieldID,
    Name: field.DisplayName,
    Type: field.Type,
    Rules: field.Rules || {},
    InternalName: field.InternalName || field.FieldName,
  };
}

function resolveDataViewFields(fields, plannedText) {
  const tokens = splitPlannedFieldList(plannedText);
  if (!tokens.length) return fields.slice(0, 8);
  const out = [];
  const seen = new Set();
  for (const token of tokens) {
    const field = resolveDataViewField(fields, token);
    if (!field || seen.has(field.FieldName)) continue;
    seen.add(field.FieldName);
    out.push(field);
  }
  return out.length ? out : fields.slice(0, 8);
}

function splitPlannedFieldList(value) {
  const text = cleanResourceName(value)
    .replace(/\bquery\b|\bsearch\b|\bfields?\b|\bcolumns?\b/gi, " ")
    .replace(/\s+and\s+/gi, ",");
  if (!text || isNonResourceName(text) || /^(all|all fields|default)$/i.test(text)) return [];
  return text.split(/[,;，；、]/)
    .map((item) => cleanResourceName(item))
    .filter((item) => item && !isNonResourceName(item));
}

function resolveDataViewField(fields, requestedName) {
  const requested = normKey(requestedName);
  if (!requested) return null;
  return fields.find((field) => [
    field.DisplayName,
    field.FieldName,
    field.InternalName,
  ].some((value) => normKey(value) === requested)) || null;
}

function parseDataViewFixedFilterConditions(value, fields) {
  const text = cleanResourceName(value);
  if (isNoFixedDataViewFilterText(text)) return [];
  const normalized = text
    .replace(/\bDate\s*>=\s*Today\b/gi, "Date >= now")
    .replace(/\bcurrent date\b/gi, "now")
    .replace(/\btoday\b/gi, "now")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=");
  const joiner = /\s+(?:or|OR)\s+|或|任一|any of/i.test(normalized) ? "or" : "and";
  const splitter = joiner === "or" ? /\s+(?:or|OR)\s+|或|；|;|，|,/ : /\s+(?:and|AND)\s+|且|；|;|，|,/;
  const parts = normalized.split(splitter)
    .map((part) => cleanResourceName(part))
    .filter(Boolean);
  const conditions = [];
  for (const [index, part] of parts.entries()) {
    const condition = parseDataViewFixedFilterConditionPart(part, fields, joiner, index);
    if (condition) conditions.push(condition);
  }
  return conditions;
}

function isNoFixedDataViewFilterText(value) {
  const text = cleanResourceName(value);
  return !text || isNonResourceName(text) || /(?:no fixed|no filter|not filtered|all records|all items|无固定|不过滤|全集)/i.test(text);
}

function parseDataViewFixedFilterConditionPart(part, fields, joiner, index) {
  const nonEmptyMatch = part.match(/^(.+?)\s+(?:is\s+not\s+empty|is\s+not\s+blank|not\s+empty|has\s+value|有值|非空|不为空)$/i);
  if (nonEmptyMatch) {
    const field = resolveDataViewField(fields, nonEmptyMatch[1]);
    if (!field) return null;
    return {
      key: crypto.randomUUID(),
      pre: joiner,
      left: field.FieldName,
      op: "7",
      right: null,
    };
  }

  const dateNowMatch = part.match(/^(.+?)\s*>=\s*(?:now)$/i);
  if (dateNowMatch) {
    const field = resolveDataViewField(fields, dateNowMatch[1]);
    if (!field) return null;
    return {
      key: crypto.randomUUID(),
      pre: index === 0 ? "and" : joiner,
      left: field.FieldName,
      op: "3",
      right: [
        {
          type: "func",
          func: "now",
          params: [],
        },
      ],
      showCus: false,
    };
  }

  const directCompareMatch = part.match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
  if (directCompareMatch) {
    const field = resolveDataViewField(fields, directCompareMatch[1]);
    if (!field) return null;
    const op = dataViewCompareOperator(field, directCompareMatch[2]);
    const rawRight = cleanResourceName(directCompareMatch[3]);
    return {
      key: crypto.randomUUID(),
      pre: index === 0 ? "and" : joiner,
      left: field.FieldName,
      op,
      right: coerceDataViewFilterValue(field, rawRight),
    };
  }

  return null;
}

function dataViewCompareOperator(field, comparator) {
  const opMap = {
    "=": "0",
    "!=": "1",
    ">=": "3",
    "<=": "4",
    ">": "5",
    "<": "6",
  };
  return opMap[comparator] || "0";
}

function coerceDataViewFilterValue(field, value) {
  if (/^Decimal$/i.test(field.FieldType)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  if (/^Bit$/i.test(field.FieldType)) return /^(true|yes|1|on)$/i.test(value) ? "true" : "false";
  if (/^Datetime$/i.test(field.FieldType) && /^now$/i.test(value)) {
    return [{ type: "func", func: "now", params: [] }];
  }
  return value;
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

function buildCustomFormLayout({ layoutId, listId, listName, formName, formType = "", selectedTemplate = "", openIn = "", fields, planDemand = {}, listMetaByName = new Map(), approvalMetaByName = new Map(), dashboardMetaByName = new Map(), rootListSetId = "" }) {
  const templateKind = isWorkbenchCustomForm({ formName, formType, selectedTemplate, openIn }) ? "workbench" : (/\bview\b|detail/i.test(`${formType} ${formName}`) ? "view" : "newEdit");
  const templateId = templateKind === "workbench" ? "data_list_form_layout_workbench" : (templateKind === "view" ? "data_list_form_layout_view_item_v1_1" : "data_list_form_layout_new_edit_v1_1");
  const resource = materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields, planDemand, listMetaByName, approvalMetaByName, dashboardMetaByName, rootListSetId, layoutId });
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

function materializeDataListFormResource({ templateKind, templateId, listId, listName, formName, fields, planDemand = {}, listMetaByName = new Map(), approvalMetaByName = new Map(), dashboardMetaByName = new Map(), rootListSetId = "", layoutId = "" }) {
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
  ensureDataListSubListSummaryTempVars(resource);
  removeAllByIdentity(resource, "Operations");
  removeAllByIdentity(resource, "kpi_metrics_wrapper");
  removeAllByIdentity(resource, "kpi_cards_wrapper");
  removeAllByIdentity(resource, "kpi_cards_kpi_row");
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
  if (templateKind === "workbench") normalizeWorkbenchMainQueueColumns(resource);
  materializePlannedFormActionSetVariables(resource, {
    records: planDemand.formActionSetVariableRecords,
    hostResource: listName,
    hostPage: formName,
    hostType: "Data List Form",
  });
  materializePlannedFormActionSetDataLists(resource, {
    records: planDemand.formActionSetDataListRecords,
    hostResource: listName,
    hostPage: formName,
    hostSurface: `${String(planDemand.childResourceRecords?.find((record) => normKey(record.name) === normKey(listName))?.resourceType || "data-list").replace("-", "_")}_${templateKind === "newEdit" ? (/\bedit\b/i.test(formName) ? "edit" : "new") : "view"}`,
    listMetaByName,
    rootListSetId,
  });
  materializePlannedFormActionOpenResources(resource, {
    records: planDemand.formActionOpenResourceRecords,
    hostResource: listName,
    hostPage: formName,
    hostSurface: `${String(planDemand.childResourceRecords?.find((record) => normKey(record.name) === normKey(listName))?.resourceType || "data-list").replace("-", "_")}_${templateKind === "newEdit" ? (/\bedit\b/i.test(formName) ? "edit" : "new") : "view"}`,
    listMetaByName, approvalMetaByName, dashboardMetaByName, rootListSetId,
  });
  reconcilePageTempVariableReferences(resource);
  return resource;
}

function buildPublicFormEntry({ record, publicFormId, listId, listName, fields, findings, planDemand }) {
  const selectedFields = resolvePublicFormFields(record, fields);
  for (const field of selectedFields) {
    const controlType = publicFormControlType(field);
    if (!PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES.has(controlType)) {
      findings.push(error(
        "PUBLIC_FORM_FIELD_CONTROL_TYPE_NOT_ALLOWED",
        "Public Form fields must use anonymous-submission-compatible controls; unsupported Data List field types cannot be materialized on Public Forms.",
        { listName, publicForm: record.formName, field: field.DisplayName, fieldName: field.FieldName, controlType },
      ));
    }
  }
  const resource = materializePublicFormResource({ record, listName, fields: selectedFields.filter((field) => PUBLIC_FORM_ALLOWED_FIELD_CONTROL_TYPES.has(publicFormControlType(field))), planDemand });
  return {
    ListID: listId,
    ID: publicFormId,
    Type: 0,
    Name: record.formName,
    Desc: record.description || `${record.formName} anonymous submission form.`,
    Ext: null,
    ExpiredTip: null,
    RefId: listId,
    Resource: JSON.stringify(resource),
  };
}

function resolvePublicFormFields(record, fields) {
  const requested = splitPlannedFieldList(record.fields);
  if (!requested.length) return fields;
  const selected = [];
  const seen = new Set();
  for (const name of requested) {
    const field = resolveDataViewField(fields, name);
    if (!field || seen.has(field.FieldName)) continue;
    seen.add(field.FieldName);
    selected.push(field);
  }
  return selected;
}

function publicFormControlType(field) {
  const type = String(field?.Type || "input");
  if (type === "select") return "radio";
  return type;
}

function materializePublicFormResource({ record, listName, fields, planDemand }) {
  const pageTemplate = JSON.parse(fs.readFileSync(PUBLIC_FORM_PAGE_TEMPLATE_PATH, "utf8"));
  const resource = clone(pageTemplate.resource);
  resource.publicFormPageLayoutTemplateId = PUBLIC_FORM_PAGE_TEMPLATE_ID;
  resource.publicFormFieldsLayoutTemplateId = PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID;
  resource.title = record.formName;
  setTemplateText(resource, "public_form_title_text", record.title || record.formName);
  setTemplateText(resource, "public_form_description", record.description || `Submit ${listName} information.`);
  setTemplateText(resource, "section_title_text", record.title || record.formName);
  setTemplateText(resource, "section_title_description", record.description || `Complete the ${listName} fields below.`);
  removeAllByIdentity(resource, "public_form_title_cta_area");
  const slot = findBusinessSectionContentArea(resource);
  if (slot) slot.children = [buildPublicFormFieldsGrid({ fields, listName, formName: record.formName })];
  removeAllByIdentity(resource, "Operations");
  removeResidualTemplateSectionHeaders(resource);
  removeEmptySectionTitleAreas(resource);
  removeEmptyBusinessSections(resource);
  reinstantiateTemplateUuidValues(resource);
  materializePlannedFormActionSetVariables(resource, {
    records: planDemand?.formActionSetVariableRecords || [],
    hostResource: listName,
    hostPage: record.formName,
    hostType: "Public Form",
  });
  materializePlannedPublicFormActions(resource, {
    records: planDemand?.publicFormActionRecords || [],
    hostList: listName,
    publicForm: record.formName,
  });
  return resource;
}

function materializePlannedPublicFormActions(resource, { records = [], hostList = "", publicForm = "" } = {}) {
  const selected = records.filter((record) => normKey(record.hostList) === normKey(hostList) && normKey(record.publicForm) === normKey(publicForm));
  if (!selected.length) return resource;
  resource.actions = Array.isArray(resource.actions) ? resource.actions : [];
  resource.formAction = resource.formAction && typeof resource.formAction === "object" && !Array.isArray(resource.formAction) ? resource.formAction : {};
  resource.tempVars = Array.isArray(resource.tempVars) ? resource.tempVars : [];
  const actionNames = unique(selected.map((record) => record.actionName));
  const actionIdByName = new Map(actionNames.map((name) => [normKey(name), deterministicUuid(`${hostList}:${publicForm}:public-form-action:${name}`)]));
  for (const actionName of actionNames) {
    let action = resource.actions.find((item) => normKey(item?.name) === normKey(actionName));
    if (!action) {
      action = { id: actionIdByName.get(normKey(actionName)), name: actionName, steps: [] };
      resource.actions.push(action);
    }
    for (const record of selected.filter((item) => normKey(item.actionName) === normKey(actionName)).sort((left, right) => left.stepOrder - right.stepOrder)) {
      const type = normalizePublicFormPlannedStepType(record.stepType);
      if (type === "setvar") throw new Error(`PUBLIC_FORM_ACTION_SETVAR_USE_SHARED_TABLE: ${hostList} / ${publicForm} / ${actionName}`);
      if (["customcode", "barcode", "nfc"].includes(type)) throw new Error(`PUBLIC_FORM_ACTION_STEP_SERIALIZATION_UNPROVEN: ${hostList} / ${publicForm} / ${record.stepType}`);
      const config = parsePublicFormActionConfig(record.configJson, hostList, publicForm, record.stepName || record.stepType);
      let step;
      if (type === "redirect") {
        const variable = Array.isArray(config.expressionTokens) ? config.expressionTokens : [];
        step = { type: "redirect", name: record.stepName || "Redirect page to", attrs: { link: { opentype: config.openType === true, url: config.fixedUrl || null, variable } } };
      } else if (type === "submit") {
        step = { type: "submit", ...(record.stepName ? { name: record.stepName } : {}) };
      } else if (type === "confirm") {
        const resultId = config.resultTempVariable ? plannedTempVariableId(config.resultTempVariable) : "";
        if (resultId) ensureFormActionResultTempVariable(resource, resultId, "string");
        step = { type: "confirm", name: record.stepName || "Show confirm dialog", attrs: { confirm_qs: Array.isArray(config.messageTokens) ? config.messageTokens : [] } };
        if (resultId) step.attrs.confirm_rs = { exprType: "variable", valueType: "string", id: resultId, type: "expr", name: resultId.replace(/^__temp_/, "") };
      } else if (type === "otheraction") {
        const targetId = actionIdByName.get(normKey(config.targetActionName));
        if (!targetId) throw new Error(`PUBLIC_FORM_ACTION_CHAIN_TARGET_UNRESOLVED: ${hostList} / ${publicForm} / ${config.targetActionName || "missing"}`);
        step = { type: "otheraction", name: record.stepName || "Start another action", attrs: { control_action: targetId } };
      } else {
        throw new Error(`PUBLIC_FORM_ACTION_STEP_TYPE_NOT_ALLOWED: ${hostList} / ${publicForm} / ${record.stepType}`);
      }
      action.steps.splice(Math.max(0, Math.min(action.steps.length, record.stepOrder - 1)), 0, step);
      bindPlannedFormActionTrigger(resource, action, { ...record, hostResource: hostList, hostPage: publicForm });
    }
  }
  return resource;
}

function normalizePublicFormPlannedStepType(value) {
  const normalized = normKey(value);
  const aliases = new Map([
    ["set variables", "setvar"], ["set variable", "setvar"], ["setvar", "setvar"],
    ["execute custom code", "customcode"], ["custom code", "customcode"], ["customcode", "customcode"],
    ["show confirm dialog", "confirm"], ["confirm", "confirm"],
    ["redirect page to", "redirect"], ["redirect", "redirect"],
    ["submit form", "submit"], ["submit", "submit"],
    ["start another action", "otheraction"], ["otheraction", "otheraction"],
    ["barcode scan", "barcode"], ["barcode", "barcode"],
    ["nfc reader", "nfc"], ["nfc", "nfc"],
  ]);
  return aliases.get(normalized) || normalized;
}

function parsePublicFormActionConfig(value, hostList, publicForm, stepName) {
  if (!value || isPlanningPlaceholder(value) || /^(none|n\/a|not applicable)$/i.test(value)) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not object");
    return parsed;
  } catch {
    throw new Error(`PUBLIC_FORM_ACTION_CONFIG_INVALID: ${hostList} / ${publicForm} / ${stepName}`);
  }
}

function buildPublicFormFieldsGrid({ fields, listName, formName }) {
  const template = JSON.parse(fs.readFileSync(PUBLIC_FORM_FIELDS_1COL_TEMPLATE_PATH, "utf8"));
  const wrapper = clone(template._ak_c || template);
  const templateCell = clone((wrapper.children || [])[0]);
  wrapper.children = fields.map((field, index) => {
    const cell = clone(templateCell);
    const title = findFirstByIdentity(cell, "form_grid_field_title");
    const control = findFirstByIdentity(cell, "form_grid_field_control");
    if (title) setTemplateText(cell, "form_grid_field_title", field.DisplayName);
    if (control) {
      const rules = parseJsonObject(field.Rules);
      control.id = crypto.randomUUID();
      control.type = publicFormControlType(field);
      control.binding = field.FieldName;
      control.fieldID = field.FieldID;
      control.name = `${formName} ${field.DisplayName}`;
      control.title = field.DisplayName;
      control.displayLabel = [null, false];
      control.attrs = control.attrs || {};
      control.attrs.required = rules.required === true;
      if (rules.placeholder) control.attrs.placeholder = rules.placeholder;
      if (Array.isArray(rules.choices)) control.attrs.options = rules.choices;
      control.attrs.common = control.attrs.common || {};
      control.attrs.common.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }];
    }
    cell.id = crypto.randomUUID();
    cell.name = `${listName} ${field.DisplayName} field`;
    return cell;
  });
  wrapper.id = crypto.randomUUID();
  return wrapper;
}

function parseJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function appendReverseRelatedCollectionSections(resource, { planDemand, listMetaByName, hostListName, formName, rootListSetId, layoutId }) {
  const records = (planDemand.reverseRelatedRecords || []).filter((record) => {
    if (normKey(record.hostList) !== normKey(hostListName)) return false;
    return reverseRelatedRecordMatchesForm(record, { hostListName, formName });
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

function reverseRelatedRecordMatchesForm(record, { hostListName, formName }) {
  const planned = cleanResourceName(record?.viewItemForm);
  if (!planned) return true;
  if (normKey(planned) === normKey(formName)) return true;
  const plannedText = normalizeForLooseFormMatch(planned);
  const actualText = normalizeForLooseFormMatch(formName);
  const hostText = normalizeForLooseFormMatch(hostListName);
  const hostSingular = hostText.replace(/s\b/g, "");
  const plannedMentionsHost = plannedText.includes(hostText) || (hostSingular && plannedText.includes(hostSingular));
  const actualMentionsHost = actualText.includes(hostText) || (hostSingular && actualText.includes(hostSingular));
  const hostTokens = hostText.split(/\s+/).filter((token) => token.length > 3);
  const hostLastToken = hostTokens[hostTokens.length - 1] || "";
  const hostLastSingular = hostLastToken.replace(/s$/, "");
  const plannedMentionsHostConcept = plannedMentionsHost || (hostLastSingular && plannedText.includes(hostLastSingular));
  const actualMentionsHostConcept = actualMentionsHost || (hostLastSingular && actualText.includes(hostLastSingular));
  const plannedViewIntent = /\bview\b|\bworkbench\b|\bworkspace\b|\bdetails?\b/.test(plannedText);
  const actualViewIntent = /\bview\b|\bitem\b|\bworkbench\b|\bworkspace\b|\bdetails?\b/.test(actualText);
  return plannedMentionsHostConcept && actualMentionsHostConcept && plannedViewIntent && actualViewIntent;
}

function normalizeForLooseFormMatch(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
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
                widthtype: [null, "1"],
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

function normalizeGridColumnDefinition(grid, columnCount, { leadingSelectionColumn = false } = {}) {
  const maxColumns = leadingSelectionColumn ? 7 : 6;
  const count = Math.max(1, Math.min(maxColumns, columnCount || 1));
  grid.attrs = grid.attrs || {};
  const columns = leadingSelectionColumn
    ? [
        { value: 46, unit: "px" },
        ...Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({ value: index === 0 ? 2 : 1, unit: "fr" })),
      ]
    : [
        { value: count > 1 ? 2 : 1, unit: "fr" },
        ...Array.from({ length: Math.max(0, count - 1) }, () => ({ value: 1, unit: "fr" })),
      ];
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
  const listVariables = dataListSubListVariables(field, `${formName}:${field.FieldName}`);
  if (listVariables.length) {
    control.attrs["list-variables"] = listVariables;
    control.attrs["list-fields"] = listVariables.map((variable, columnIndex) => buildDataListSubListColumn({
      variable,
      columnIndex,
      parentBinding: field.FieldName,
      parentControlId: id,
      seed: `${formName}:${field.FieldName}`,
    }));
  }
  const summaries = normalizeDataListSubListSummaries(field?.__plannedListSummaries, control, `${formName}:${field.FieldName}`);
  if (summaries.length) control.attrs["list-fields-summary"] = summaries;
  else delete control.attrs["list-fields-summary"];
  ensureDataListSubListColumnTitles(control);
  return control;
}

function normalizeDataListSubListSummaries(summaries, control, seed) {
  return (Array.isArray(summaries) ? summaries : []).map((summary, index) => {
    const field = cleanResourceName(summary?.field);
    if (!field) return null;
    const prefix = ["__list_", "__temp_"].includes(summary?.binding?.prefix) ? summary.binding.prefix : "";
    const value = cleanResourceName(summary?.binding?.value);
    return {
      id: deterministicUuid(`${seed}:summary:${field}:${index}`),
      field,
      type: normKey(summary?.type) || "total",
      display: summary?.display !== false,
      binding: prefix && value ? { prefix, value } : null,
    };
  }).filter(Boolean);
}

function ensureDataListSubListSummaryTempVars(resource) {
  const tempIds = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const summary of Array.isArray(value?.attrs?.["list-fields-summary"]) ? value.attrs["list-fields-summary"] : []) {
      if (summary?.binding?.prefix === "__temp_" && cleanResourceName(summary?.binding?.value)) tempIds.add(cleanResourceName(summary.binding.value));
    }
    Object.values(value).forEach(visit);
  };
  visit(resource);
  if (!tempIds.size) return;
  resource.tempVars = Array.isArray(resource.tempVars) ? resource.tempVars : [];
  const existing = new Set(resource.tempVars.map((item) => cleanResourceName(item?.id)).filter(Boolean));
  for (const id of tempIds) {
    if (existing.has(id)) continue;
    resource.tempVars.push({ idx: deterministicUuid(`${resource.id || resource.title}:temp:${id}`), id });
  }
}

function dataListSubListVariables(field, seed) {
  const rules = parseJsonMaybe(field?.Rules);
  const rows = Array.isArray(rules?.["list-variables"])
    ? rules["list-variables"]
    : Array.isArray(field?.listFields)
      ? field.listFields
      : [];
  return rows.map((row, index) => {
    const id = cleanResourceName(row?.id || row?.fieldName || row?.name) || `field_${index + 1}`;
    const type = normalizeSubListRowType(row?.type || row?.fieldType);
    return {
      idx: cleanResourceName(row?.idx) || deterministicUuid(`${seed}:row:${id}:${index}`),
      id,
      name: cleanResourceName(row?.name || row?.displayName || row?.columnTitle || row?.label) || id,
      displayName: cleanResourceName(row?.columnTitle || row?.displayName || row?.label || row?.name || id),
      type,
      editable: row?.editable !== false,
      controlType: cleanResourceName(row?.controlType || row?.control?.type),
    };
  }).filter((row) => row.id && row.displayName);
}

function buildDataListSubListColumn({ variable, columnIndex, parentBinding, parentControlId, seed }) {
  const controlType = normalizeSubListColumnControlType(variable.controlType, variable.type);
  const control = {
    id: deterministicUuid(`${seed}:column:${variable.id}:${columnIndex}`),
    label: variable.displayName,
    binding: variable.id,
    attrs: {
      list_field: true,
      list_field_binding: parentBinding,
      list_control_id: parentControlId,
    },
    type: controlType,
    displayLabel: [null, true],
  };
  if (controlType === "datepicker") control.value = null;
  if (controlType === "switch") control.value = false;
  return {
    idx: variable.idx,
    id: variable.id,
    name: variable.name,
    type: variable.type,
    editable: variable.editable,
    control,
  };
}

function ensureDataListSubListColumnTitles(control) {
  const variables = new Map((Array.isArray(control?.attrs?.["list-variables"]) ? control.attrs["list-variables"] : [])
    .map((row) => [String(row?.id || ""), row]));
  for (const [index, listField] of (Array.isArray(control?.attrs?.["list-fields"]) ? control.attrs["list-fields"] : []).entries()) {
    const variable = variables.get(String(listField?.id || ""));
    listField.control ||= {};
    listField.control.id ||= deterministicUuid(`${control.id}:column:${listField?.id || index}:${index}`);
    listField.control.binding = listField?.id || variable?.id || listField.control.binding;
    listField.control.label = cleanResourceName(
      listField.control.label
      || listField.columnTitle
      || listField.displayName
      || variable?.displayName
      || listField.name
      || variable?.name
      || listField.id,
    );
    listField.control.displayLabel = [null, true];
    listField.control.attrs ||= {};
    listField.control.attrs.list_field = true;
    listField.control.attrs.list_field_binding = control.binding;
    listField.control.attrs.list_control_id = control.id;
  }
}

function normalizeSubListRowType(value) {
  const type = normKey(value);
  if (/user|identity|person/.test(type)) return "user";
  if (/date|time/.test(type)) return "date";
  if (/bool|switch|yes no/.test(type)) return "boolean";
  if (/number|decimal|currency|integer/.test(type)) return "number";
  if (/file|attachment/.test(type)) return "file";
  return "text";
}

function normalizeSubListColumnControlType(controlType, rowType) {
  const explicit = normKey(controlType);
  if (/identity|user picker/.test(explicit)) return "identity-picker";
  if (/date/.test(explicit)) return "datepicker";
  if (/number/.test(explicit)) return "input_number";
  if (/switch|toggle/.test(explicit)) return "switch";
  if (/file|upload/.test(explicit)) return "file-upload";
  if (/input/.test(explicit)) return "input";
  return {
    user: "identity-picker",
    date: "datepicker",
    number: "input_number",
    boolean: "switch",
    file: "file-upload",
  }[rowType] || "input";
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
  if (type === "list") {
    const listVariables = dataListSubListVariables(field, `field-rules:${field?.fieldName || field?.displayName || "sublist"}`)
      .map(({ idx, id, name, type: rowType, editable }) => ({ idx, id, name, type: rowType, editable }));
    return listVariables.length ? JSON.stringify({ "list-variables": listVariables }) : "";
  }
  const choiceTypes = new Set(["select", "radio", "checkbox", "tag"]);
  if (!choiceTypes.has(type)) return "";
  const values = parseChoiceOptionValues(field.choiceValues).concat(inferChoiceValues(field));
  const uniqueValues = unique(values);
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
  if (String(field?.choiceValues || "").trim()) return parseChoiceOptionValues(field.choiceValues);
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
      const rawCells = splitRawTableLine(lines[rowIndex]);
      const cells = rawCells.map((cell) => cleanResourceName(cell));
      const row = {};
      headers.forEach((header, cellIndex) => { row[header] = cells[cellIndex] || ""; });
      Object.defineProperty(row, "__raw", { value: rawCells, enumerable: false });
      rows.push(row);
      rowIndex += 1;
    }
    tables.push({ headers, rows });
    index = rowIndex;
  }
  return tables;
}

function splitRawTableLine(line) {
  return String(line || "").trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
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
  return cleanPlanningLabel(value);
}

function cleanStructuredPlanCell(value) {
  return String(value == null ? "" : value).trim().replace(/^`([\s\S]*)`$/, "$1").trim();
}

function isNonResourceName(value) {
  const text = cleanResourceName(value);
  if (isPlanningPlaceholder(text)) return true;
  if (/^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)) return true;
  if (/^no\s+(?:form\s+)?reports?\b/i.test(text)) return true;
  if (/^no custom\b/i.test(text)) return true;
  if (/^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text)) return true;
  return false;
}

function isNonFieldName(value) {
  const text = cleanResourceName(value);
  if (!text) return true;
  return /^(not applicable|n\/a|none|no|deferred|field name|display name|business label|label)$/i.test(text);
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

function buildResourceGraphPackage({ appTitle, rootListId, planDemand, ids, iconUrl = DEFAULT_ICON, appPlanText = "", findings = [] }) {
  const childResourceRecords = plannedChildResources(planDemand, planDemand.resources.dataLists.length ? planDemand.resources.dataLists : [`${appTitle} Records`]);
  const dataListNames = childResourceRecords.map((record) => record.name);
  const dataListByName = new Map();
  const childResourceTypeByName = new Map(childResourceRecords.map((record) => [normKey(record.name), record.resourceType]));
  const listMetaByName = new Map();
  const allCustomFormAssignments = assignAllCustomFormLayoutPositions(planDemand, dataListNames);
  const approvalMetaByName = new Map((planDemand.resources.approvalForms || []).map((name, index) => {
    const variables = buildApprovalVariables(approvalFieldSpecsForForm(planDemand, name));
    const variableById = new Map((variables.basic || []).flatMap((variable) => [variable.id, variable.idx, variable.name].filter(Boolean).map((key) => [normKey(key), variable])));
    return [normKey(name), { name, procKey: stringId(ids[`decoded.Forms[${index}].Key`]), variableById }];
  }));
  const dashboardMetaByName = new Map((planDemand.resources.dashboards || []).map((name, index) => [normKey(name), { name, pageId: stringId(ids[`decoded.Pages[${index}].LayoutID`]) }]));
  const allPublicFormAssignments = assignPublicFormPositions(planDemand, childResourceRecords);
  for (const assignment of allPublicFormAssignments) {
    if (assignment.listIndex < 0) {
      findings.push(error("PUBLIC_FORM_HOST_DATA_LIST_NOT_FOUND", "Every planned Public Form must resolve to a planned Type 1 Data List host.", { publicForm: assignment.formName, listName: assignment.listName }));
      continue;
    }
    const host = childResourceRecords[assignment.listIndex];
    if (host?.resourceType === "document-library") {
      findings.push(error("PUBLIC_FORM_HOST_TYPE_INVALID", "Public Forms are supported only on Type 1 Data Lists, not Document Libraries.", { publicForm: assignment.formName, listName: assignment.listName }));
    }
    if (assignment.pageTemplateId !== PUBLIC_FORM_PAGE_TEMPLATE_ID) {
      findings.push(error("PUBLIC_FORM_PAGE_LAYOUT_TEMPLATE_INVALID", "Generated Public Forms must select public-form-page-layout-standard.", { publicForm: assignment.formName, selectedTemplate: assignment.pageTemplateId }));
    }
    if (assignment.fieldTemplateId !== PUBLIC_FORM_FIELDS_1COL_TEMPLATE_ID) {
      findings.push(error("PUBLIC_FORM_FIELDS_LAYOUT_TEMPLATE_INVALID", "This Public Form generation path must select public_form_fields_1col_v1_1.", { publicForm: assignment.formName, selectedTemplate: assignment.fieldTemplateId }));
    }
  }
  dataListNames.forEach((name, index) => {
    dataListByName.set(normKey(name), stringId(ids[`decoded.Childs[${index}].List.ListID`]));
  });
  validatePlannedLookupTargetsMaterialized({ planDemand, dataListNames, dataListByName, findings });
  const fieldRecordsByName = new Map();
  dataListNames.forEach((name, index) => {
    const listId = stringId(ids[`decoded.Childs[${index}].List.ListID`]);
    const plannedViewsForList = dataListViewRecordsForList(planDemand, name);
    if (!hasParsedFieldSpecsForList(planDemand, name) && plannedViewsForList.some(dataListViewRequiresParsedBusinessFields)) {
      findings.push(error(
        "DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW",
        "Planned Data List views reference business columns or fixed filters, but the Data List has no parseable field table. Do not downgrade the list to native Title-only output; add a standard field table with field labels, internal field names, and field types.",
        {
          listName: name,
          viewNames: plannedViewsForList
            .filter(dataListViewRequiresParsedBusinessFields)
            .map((record) => record.viewName),
        },
      ));
    }
    const resourceType = childResourceTypeByName.get(normKey(name)) || "data-list";
    const fields = resourceType === "document-library"
      ? buildDocumentLibraryFieldRecords({ listId, ids, childIndex: index })
      : fieldSpecsForList(planDemand, name).map((field, fieldIndex) => buildFieldRecord({
        field,
        fieldIndex,
        listId,
        fieldId: stringId(ids[`decoded.Childs[${index}].Fields[${fieldIndex}].FieldID`]),
        lookupTargetListId: resolveLookupTargetListId(field, dataListByName),
      }));
    fieldRecordsByName.set(normKey(name), fields);
    const layoutByName = new Map(allCustomFormAssignments.filter((assignment) => assignment.listIndex === index).map((assignment) => [normKey(assignment.formName), {
      id: stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]),
      purpose: customFormAssignmentPurpose(assignment),
    }]));
    listMetaByName.set(normKey(name), { listName: name, listId, fields, detailLayoutId: "", resourceType, layoutByName });
  });
  const childs = childResourceRecords.map((record, index) => {
    const name = record.name;
    const resourceType = record.resourceType || "data-list";
    const listType = resourceType === "document-library" ? 16 : 1;
    const listId = stringId(ids[`decoded.Childs[${index}].List.ListID`]);
    dataListByName.set(normKey(name), listId);
    const fields = fieldRecordsByName.get(normKey(name)) || [];
    const customLayoutsForList = allCustomFormAssignments.filter((assignment) => assignment.listIndex === index);
    const publicFormsForList = allPublicFormAssignments.filter((assignment) => assignment.listIndex === index);
    const plannedViewsForList = dataListViewRecordsForList(planDemand, name);
    const defaultPlannedView = selectDefaultDataListViewRecord(plannedViewsForList);
    const layouts = [
      {
        ListID: listId,
        LayoutID: stringId(ids[`decoded.Childs[${index}].Layouts[0].LayoutID`]),
        Title: defaultPlannedView?.viewName || "Default View",
        Type: 0,
        LayoutView: JSON.stringify(buildDataListViewLayoutViewChecked({ fields, viewRecord: defaultPlannedView, listName: name, findings })),
        Ext1: JSON.stringify({ Url: "default" }),
        IsDefault: true,
        IsItemPerm: false,
        Perms: [],
        LayoutInResources: [],
      },
    ];
    for (const assignment of customLayoutsForList) {
      const layoutId = stringId(ids[`decoded.Childs[${assignment.listIndex}].Layouts[${assignment.layoutIndex}].LayoutID`]);
      layouts.push(buildCustomFormLayout({ layoutId, listId, listName: name, formName: assignment.formName, formType: assignment.formType, selectedTemplate: assignment.selectedTemplate, openIn: assignment.openIn, fields, planDemand, listMetaByName, approvalMetaByName, dashboardMetaByName, rootListSetId: rootListId }));
    }
    const extraDataViews = plannedViewsForList.filter((record) => record !== defaultPlannedView);
    const extraViewBaseIndex = customLayoutsForList.reduce((max, assignment) => Math.max(max, assignment.layoutIndex), 0) + 1;
    for (const [viewIndex, viewRecord] of extraDataViews.entries()) {
      const layoutIndex = extraViewBaseIndex + viewIndex;
      layouts.push({
        ListID: listId,
        LayoutID: stringId(ids[`decoded.Childs[${index}].Layouts[${layoutIndex}].LayoutID`]),
        Title: viewRecord.viewName,
        Type: 0,
        LayoutView: JSON.stringify(buildDataListViewLayoutViewChecked({ fields, viewRecord, listName: name, findings })),
        Ext1: JSON.stringify({ Url: viewRecord.routeKey || slugify(viewRecord.viewName) }),
        IsDefault: false,
        IsItemPerm: false,
        Perms: [],
        LayoutInResources: [],
      });
    }
    const displayLayoutView = buildDataListFormDisplaySettings({ customLayoutsForList, ids });
    const detailLayoutId = displayLayoutView.view || displayLayoutView.edit || displayLayoutView.add || "";
    const currentMeta = listMetaByName.get(normKey(name)) || { listName: name, listId, fields, resourceType };
    currentMeta.detailLayoutId = detailLayoutId;
    listMetaByName.set(normKey(name), currentMeta);
    const list = listInfo({
        listId,
        title: name,
        type: listType,
        ext2: "{\"generatedFinal\":true}",
        layoutView: customLayoutsForList.length ? JSON.stringify(displayLayoutView) : (listType === 1 ? JSON.stringify(displayLayoutView) : ""),
      });
    if (listType === 16) {
      const folderItems = buildDocumentLibraryFolderItems({ planDemand, listName: name, childIndex: index, ids });
      if (Object.keys(folderItems).length) list.Items = folderItems;
    }
    const publicForms = listType === 1 ? publicFormsForList.map((record) => buildPublicFormEntry({
      record,
      publicFormId: stringId(ids[`decoded.Childs[${index}].PublicForms[${record.publicFormIndex}].ID`]),
      listId,
      listName: name,
      fields,
      findings,
      planDemand,
    })) : [];
    return {
      List: list,
      Fields: fields,
      Layouts: layouts,
      RemindRules: [],
      PublicForms: publicForms,
      FlowMappings: [],
    };
  });

  const forms = planDemand.resources.approvalForms.map((name, index) => {
    const key = stringId(ids[`decoded.Forms[${index}].Key`]);
    const defId = stringId(ids[`decoded.Forms[${index}].DefResourceID`]);
    const approvalFieldSpecs = approvalFieldSpecsForForm(planDemand, name);
    const approvalWorkflowNodes = approvalWorkflowNodeSpecsForForm(planDemand, name).map((node) => {
      if (node.nodeType !== "ContentList") return node;
      const setDataListRecord = (planDemand.workflowSetDataListRecords || []).find((record) => (
        normKey(record.host) === "approval form"
        && normKey(record.workflowName) === normKey(name)
        && normKey(record.nodeName) === normKey(node.nodeName)
      ));
      if (!setDataListRecord) {
        findings.push(error("FULL_APP_APPROVAL_WORKFLOW_SET_DATALIST_CONFIG_REQUIRED", "Every Approval Form ContentList node must have one exact Workflow Set Data List Action Plan row; fallback mappings are not generation-ready.", { approvalForm: name, node: node.nodeName }));
      }
      return { ...node, setDataListRecord };
    });
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
        formActionSetVariableRecords: planDemand.formActionSetVariableRecords,
        formActionSetDataListRecords: planDemand.formActionSetDataListRecords,
        formActionOpenResourceRecords: planDemand.formActionOpenResourceRecords,
        listMetaByName,
        approvalMetaByName,
        dashboardMetaByName,
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

  const workflowForms = buildPlannedWorkflowHostForms({
    planDemand,
    rootListSetId: rootListId,
    ids,
    approvalFormCount: forms.length,
    childResourceRecords,
    listMetaByName,
    childs,
    findings,
  });
  forms.push(...workflowForms);

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
    materializePlannedFormActionSetVariables(dashboardResource, {
      records: planDemand.formActionSetVariableRecords,
      hostResource: name,
      hostPage: name,
      hostType: "Dashboard",
    });
    materializePlannedFormActionSetDataLists(dashboardResource, {
      records: planDemand.formActionSetDataListRecords,
      hostResource: name,
      hostPage: name,
      hostSurface: "dashboard",
      listMetaByName,
      rootListSetId: rootListId,
    });
    materializePlannedFormActionOpenResources(dashboardResource, {
      records: planDemand.formActionOpenResourceRecords,
      hostResource: name,
      hostPage: name,
      hostSurface: "dashboard",
      listMetaByName,
      approvalMetaByName,
      dashboardMetaByName,
      rootListSetId: rootListId,
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

function validatePlannedLookupTargetsMaterialized({ planDemand, dataListNames, dataListByName, findings }) {
  const plannedListNames = new Set(dataListNames.map((name) => normKey(name)));
  for (const listName of dataListNames) {
    for (const field of fieldSpecsForList(planDemand, listName)) {
      const lookupTarget = cleanResourceName(field.lookupTarget);
      if (!lookupTarget || isNonResourceName(lookupTarget)) continue;
      const targetKey = normKey(lookupTarget);
      if (plannedListNames.has(targetKey) && dataListByName.has(targetKey)) continue;
      findings.push(error(
        "FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED",
        "A planned lookup field references a Data List that is not included in the generated Data Lists plan. Refusing to emit an empty lookup Rules payload.",
        {
          sourceDataList: listName,
          fieldDisplayName: field.displayName,
          fieldName: field.fieldName,
          lookupTarget,
          expectedPlanSection: "## 4. Data Lists and Document Libraries Plan",
        },
      ));
    }
  }
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
  const isWorkbenchDashboard = pageLayoutTemplateId === "dashboard-page-layouts-workbench";
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
  if (isMasterDetailWorkspace || isWorkbenchDashboard) normalizeWorkbenchMainQueueColumns(resource);
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
  normalizeAndPruneDashboardTempVars(resource);
  reconcilePageTempVariableReferences(resource);
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
  const chartSlots = findDashboardChartAnalyticsSlots(resource);
  const pivotSlots = findDashboardPivotAnalyticsSlots(resource);
  if (!chartSlots.length && !pivotSlots.length) return [];
  const runtimeContracts = [];
  let chartIndex = 0;
  let pivotIndex = 0;
  records.forEach((record, index) => {
    const sourceMeta = listMetaByName?.get(normKey(record.sourceResource)) || fallbackListMeta;
    const { root: module, runtimeContract } = buildDataAnalyticsTemplateInstance({
      record,
      listMeta: sourceMeta,
      dashboardName,
      instanceIndex: index,
      rootListSetId,
    });
    const usePivotSlot = isPivotAnalyticsRecord(record);
    const slots = usePivotSlot ? pivotSlots : chartSlots;
    const slot = usePivotSlot
      ? slots[pivotIndex++ % slots.length]
      : slots[chartIndex++ % slots.length];
    if (!slot) return;
    slot.children = Array.isArray(slot.children) ? slot.children : [];
    slot.children.push(module);
    if (runtimeContract) runtimeContracts.push(runtimeContract);
  });
  return runtimeContracts;
}

function findDashboardChartAnalyticsSlots(resource) {
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

function findDashboardPivotAnalyticsSlots(resource) {
  const slots = [];
  for (const section of findDescendants(resource, (node) => hasIdentity(node, "content_card_wrapper"))) {
    const slot = findFirstByIdentity(section, "section_content_area");
    if (slot) slots.push(slot);
  }
  return slots;
}

function isPivotAnalyticsRecord(record) {
  return String(record?.selectedTemplateId || "") === "data_analytics_pivot_table_standard";
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
  if (requiresDateTrendRow(reference, groupingField)) rowField.func = selectDateTrendRuntimeFunc({ reference, groupingField, title });
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
    preConditions: null,
    Conditions: [],
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

function selectDateTrendRuntimeFunc({ groupingField, title }) {
  const explicit = String(
    groupingField?.dateGrouping ||
    groupingField?.dateGranularity ||
    groupingField?.timeGranularity ||
    groupingField?.grouping ||
    groupingField?.groupBy ||
    groupingField?.func ||
    groupingField?.function ||
    "",
  ).trim().toUpperCase();
  if (["DATE", "MONTH", "QUARTER", "YEAR"].includes(explicit)) return explicit;
  const text = `${title || ""} ${groupingField?.displayName || groupingField?.DisplayName || ""} ${groupingField?.fieldName || groupingField?.FieldName || ""}`.toLowerCase();
  if (/\b(monthly|month|months)\b/.test(text) || /by\s+month|per\s+month/.test(text)) return "MONTH";
  if (/\b(quarterly|quarter|quarters)\b/.test(text) || /by\s+quarter|per\s+quarter/.test(text)) return "QUARTER";
  if (/\b(yearly|annual|year|years)\b/.test(text) || /by\s+year|per\s+year/.test(text)) return "YEAR";
  return "DATE";
}

function isDateLikeAnalyticsField(field) {
  return /date|datetime|time|created|modified|period|month|week|year/i.test(`${field?.fieldName || field?.FieldName || ""} ${field?.displayName || field?.DisplayName || ""} ${field?.fieldType || field?.FieldType || ""} ${field?.controlType || field?.Type || ""}`);
}

function runtimeFieldRef(field, role) {
  const fieldName = String(field?.fieldName || field?.FieldName || "ListDataID");
  const fieldType = String(field?.fieldType || field?.FieldType || (fieldName === "ListDataID" ? "Bigint" : "Text"));
  const type = runtimeFieldControlType(field, fieldName);
  const attr = runtimeFieldAttr(field, type, fieldName);
  return {
    field: fieldName,
    fieldName,
    FieldName: fieldName,
    id: fieldName,
    label: String(field?.displayName || field?.DisplayName || fieldName),
    fieldType,
    type,
    attr,
    role,
  };
}

function runtimeFieldControlType(field, fieldName) {
  if (String(fieldName || "") === "ListDataID") return "input";
  const text = `${field?.controlType || ""} ${field?.Type || ""} ${field?.fieldType || ""} ${field?.FieldType || ""} ${field?.displayName || ""}`.toLowerCase();
  if (/date|datetime|time/.test(text)) return "datepicker";
  if (/radio|select|choice|status|category|type|priority/.test(text)) return "radio";
  if (/identity|user|people|person|owner|assignee/.test(text)) return "identity-picker";
  if (/number|decimal|currency|amount|percent/.test(text)) return "input_number";
  return "input";
}

function runtimeFieldAttr(field, type, fieldName) {
  if (type === "datepicker") return { displayLabel: true, readonly: true, showtime: true, dateformat: "0" };
  if (type === "radio") {
    const choices = Array.isArray(field?.choices) ? field.choices : Array.isArray(field?.Rules?.choices) ? field.Rules.choices : [];
    return choices.length ? { choices } : {};
  }
  if (type === "identity-picker") return { displayLabel: true, readonly: true, "identity-maxselection": field?.Rules?.["identity-maxselection"] || 1 };
  if (String(fieldName || "") === "ListDataID") return { displayLabel: true, readonly: true };
  return { displayLabel: true, readonly: true };
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
  const allowedFields = new Set([...fieldMap.keys(), "listdataid", "id", "created", "createdby", "modified", "modifiedby", "owner"]);
  pruneInvalidProgressControls(root, { fieldMap, allowedFields });
  pruneGridTableColumnsBySchema(root, { fieldMap, allowedFields });
  remapOrRemoveInvalidCollectionContextBindings(root, { listMeta, allowedFields });
}

function remapOrRemoveInvalidCollectionContextBindings(root, { listMeta, allowedFields }) {
  const fields = fieldsForDynamicControls(listMeta);
  const primaryField = fields.find((field) => normKey(field.fieldName) === "title") || fields[0] || {
    fieldName: "Title",
    displayName: "Title",
    fieldType: "Text",
  };
  const conditionalKeys = new Set(["control display", "condition", "conditions", "formulas", "wheres", "sortingfilter"]);

  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      const normalizedKey = normKey(key);
      if (conditionalKeys.has(normalizedKey) && hasInvalidCollectionFieldReference(value[key], allowedFields)) {
        delete value[key];
        continue;
      }
      visit(value[key]);
    }
    const context = String(value.ctx || value.context || "").trim();
    if (context !== "__ctx_coll" && !/Collection item:/i.test(String(value.name || ""))) return;
    const fieldName = String(value.id || value.field || value.FieldName || value.fieldName || value.prop || "").trim();
    if (!fieldName || allowedFields.has(normKey(fieldName))) return;
    value.id = primaryField.fieldName;
    if (Object.hasOwn(value, "field")) value.field = primaryField.fieldName;
    if (Object.hasOwn(value, "FieldName")) value.FieldName = primaryField.fieldName;
    if (Object.hasOwn(value, "fieldName")) value.fieldName = primaryField.fieldName;
    if (Object.hasOwn(value, "prop")) value.prop = primaryField.fieldName;
    value.name = `Collection item:${primaryField.displayName || primaryField.fieldName}`;
  };
  visit(root);
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
      const leadingSelectionColumn =
        hasIdentity(headerRow.children?.[0], "grid_table_col_header_select")
        && hasIdentity(nearestItemRow?.children?.[0], "grid_table_col_item_select");
      normalizeGridColumnDefinition(headerRow, headerRow.children.length, { leadingSelectionColumn });
      if (nearestItemRow && Array.isArray(nearestItemRow.children)) {
        normalizeGridColumnDefinition(nearestItemRow, nearestItemRow.children.length, { leadingSelectionColumn });
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

function normalizeAndPruneDashboardTempVars(resource) {
  const candidates = uniqueByName(normalizeDependencyArray(resource?.tempVars).map((item, index) => {
    const id = cleanResourceName(item?.id || item?.name);
    if (!id) return null;
    const name = cleanResourceName(item?.name) || id.replace(/^__temp_/, "");
    return {
      ...item,
      idx: cleanResourceName(item?.idx) || deterministicUuid(`${resource.id || resource.title}:temp:${id}:${index}`),
      id,
      name,
      type: cleanResourceName(item?.type) || inferDashboardTempVarType(id),
    };
  }).filter(Boolean));
  const body = clone(resource || {});
  delete body.tempVars;
  const bodyText = JSON.stringify(body);
  resource.tempVars = candidates.filter((item) => {
    const id = String(item.id || "");
    const unprefixed = id.replace(/^__temp_/, "");
    return bodyText.includes(id) || bodyText.includes(`__temp_${unprefixed}`);
  });
}

function reconcilePageTempVariableReferences(resource) {
  const declarations = (resource.tempVars || []).filter((item) => String(item?.id || "").trim());
  const canonical = (value) => String(value || "").replace(/^__temp_/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const declarationByCanonicalId = new Map(declarations.map((item) => [canonical(item.id), item]));
  const findScopedDeclaration = (reference) => {
    const referenceKey = canonical(reference);
    if (declarationByCanonicalId.has(referenceKey)) return declarationByCanonicalId.get(referenceKey);
    const matches = declarations.filter((item) => canonical(item.id).endsWith(referenceKey));
    return matches.length === 1 ? matches[0] : null;
  };
  const containsUnresolvableTempReference = (value) => {
    const text = JSON.stringify(value || {});
    return [...text.matchAll(/__temp_([A-Za-z0-9_-]+)/g)].some((match) => !findScopedDeclaration(match[1]));
  };
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      if (normKey(key) === "control display" && containsUnresolvableTempReference(value[key])) {
        delete value[key];
        continue;
      }
      visit(value[key]);
    }
    if (String(value.exprType || "") !== "variable") return;
    const rawId = String(value.id || "");
    if (!rawId.startsWith("__temp_")) return;
    const declaration = findScopedDeclaration(rawId);
    if (!declaration) return;
    value.id = `__temp_${declaration.id}`;
    value.name = declaration.name || declaration.id;
  };
  visit(resource);
}

function inferDashboardTempVarType(id) {
  const value = String(id || "");
  if (/SelectedItems$/i.test(value)) return "array";
  if (/Amount$|Count$/i.test(value)) return "number";
  if (/is[A-Z_]|Confirmed$/i.test(value)) return "boolean";
  return "string";
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

function normalizeWorkbenchMainQueueColumns(root) {
  const queueWrapper = findFirstByIdentity(root, "main_work_queue_wrapper");
  if (!queueWrapper) return;
  const children = Array.isArray(queueWrapper.children) ? queueWrapper.children.filter((child) => child && typeof child === "object") : [];
  const rightPanel = children.find((child) => hasIdentity(child, "right_side_panel"));
  if (rightPanel && hasMeaningfulBusinessContent(rightPanel)) return;
  queueWrapper.children = children.filter((child) => !hasIdentity(child, "right_side_panel"));
  queueWrapper.attrs = queueWrapper.attrs || {};
  queueWrapper.attrs.columns = {
    "1": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
    "2": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
    "3": { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } },
  };
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
  const titleAreaPrototype = findFirstByIdentity(root, "section_title_area");
  const headerPrototype = findFirstByIdentity(root, "section_title_header");
  for (const wrapper of wrappers) {
    if (!Array.isArray(wrapper.children)) wrapper.children = [];
    const existingTitleArea = findFirstByIdentity(wrapper, "section_title_area");
    if (existingTitleArea) {
      ensureDashboardSectionTitleAreaFullWidth(existingTitleArea);
      ensureSectionTitleHeader(existingTitleArea, String(wrapper.id || wrapper.nv_label || wrapper.name || "content-card"), headerPrototype);
      continue;
    }
    if (!findFirstByIdentity(wrapper, "section_content_area")) continue;
    const wrapperSeed = String(wrapper.id || wrapper.nv_label || wrapper.name || "content-card");
    const titleArea = titleAreaPrototype ? clone(titleAreaPrototype) : {
      id: deterministicUuid(`${wrapperSeed}:section-title-area`),
      nv_label: "section_title_area",
      label: "Container",
      type: "container",
      attrs: {
        style: {
          gap: [null, "--sp--s150"],
          direction: [null, "row", null, "column"],
          align_items: [null, "center", null, "flex-start"],
          justify_content: [null, "space-between", null, "flex-start"],
          widthtype: [null, "1"],
        },
      },
      children: [],
    };
    titleArea.id = deterministicUuid(`${wrapperSeed}:section-title-area`);
    titleArea.nv_label = "section_title_area";
    titleArea.nav_label = "section_title_area";
    titleArea.name = "section_title_area";
    titleArea.children = [];
    ensureDashboardSectionTitleAreaFullWidth(titleArea);
    ensureSectionTitleHeader(titleArea, wrapperSeed, headerPrototype);
    const contentIndex = wrapper.children.findIndex((child) => hasIdentity(child, "section_content_area"));
    if (contentIndex === -1) wrapper.children.unshift(titleArea);
    else wrapper.children.splice(contentIndex, 0, titleArea);
  }
}

function ensureDashboardSectionTitleAreaFullWidth(titleArea) {
  if (!titleArea || typeof titleArea !== "object") return;
  titleArea.attrs = titleArea.attrs && typeof titleArea.attrs === "object" ? titleArea.attrs : {};
  titleArea.attrs.style = titleArea.attrs.style && typeof titleArea.attrs.style === "object" ? titleArea.attrs.style : {};
  titleArea.attrs.style.widthtype = [null, "1"];
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
      if (isLockedCollectionTemplateStructuralControl(child)) return true;
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

function isLockedCollectionTemplateStructuralControl(control) {
  return [
    "grid_table_col_item_select",
    "grid_table_col_item_op_menu",
    "grid_table_col_item_op_menu_panel",
  ].some((identity) => hasIdentity(control, identity));
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
  const listItems = plannedChildResources(planDemand).map((record) => {
    const type = record.resourceType === "document-library" ? 16 : 1;
    return {
      Title: record.name,
      Type: type,
      Target: record.name,
      ListID: dataListByName.get(normKey(record.name)),
      Icon: inferNavigationIcon({ title: record.name, type }),
    };
  });
  const dataListViewItems = (planDemand.dataListViewRecords || []).map((record) => ({
    Title: record.viewName,
    Type: (plannedChildResources(planDemand).find((child) => normKey(child.name) === normKey(record.listName))?.resourceType === "document-library") ? 16 : 1,
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
  if (!["1", "16", "103", "105"].includes(String(item.Type))) return null;
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
  if (/document\s+library|doc\s+library/i.test(value)) return 16;
  if (/report/i.test(value)) return 106;
  return 1;
}

function exportResource(resource) {
  const prefix = Buffer.from("::brotli::", "utf8");
  const compressed = zlib.brotliCompressSync(Buffer.from(JSON.stringify(resource), "utf8"));
  return Buffer.concat([prefix, compressed]).toString("base64");
}

function workflowExpressionButton(data, label) {
  return buildWorkflowExpressionButton(data, label);
}

function workflowApplicantUserExpression() {
  return serializeWorkflowVariableJson({ type: "application", prop: "ApplicantUserID" });
}

function workflowVariableUserReferenceExpression(variableId) {
  return serializeWorkflowVariableJson({ type: "variable", param: { id: variableId } });
}

function workflowApplicantLineManagerExpression() {
  return workflowExpressionButton({
    type: "user",
    param: { id: workflowApplicantUserExpression() },
    prop: "LineManager",
  }, "Applicant:Line Manager");
}

function workflowApplicantDepartmentManagerExpression() {
  return workflowExpressionButton({
    type: "org",
    param: {
      id: serializeWorkflowVariableJson({
        type: "user",
        param: { id: workflowApplicantUserExpression() },
        prop: "OrganizationID",
      }),
    },
    prop: "Manager",
  }, "Applicant:Department:Manager");
}

function workflowVariableUserExpression(variableId, label = variableId) {
  return workflowExpressionButton({
    type: "variable",
    param: { id: variableId },
  }, `Workflow Variables:${label}`);
}

function workflowVariableUserLineManagerExpression(variableId, label = variableId) {
  return workflowExpressionButton({
    type: "user",
    param: { id: workflowVariableUserReferenceExpression(variableId) },
    prop: "LineManager",
  }, `Workflow Variables:${label}:Line Manager`);
}

function workflowUserExpressionAssignee(value, plannedAssigneeRole = "") {
  return {
    type: "user",
    method: "expression",
    title: `User: ${value}`,
    value,
    plannedAssigneeRole,
  };
}

function inferWorkflowVariableAssigneeName(step) {
  const text = [
    step?.nodeName,
    step?.assigneeRole,
    step?.assignmentStrategy,
    step?.description,
  ].map(cleanResourceName).join(" ");
  const explicit = text.match(/\b(?:workflow\s+variables?|variable)\s*[:=]?\s*([A-Za-z][A-Za-z0-9_]*)\b/i);
  if (explicit && !/^line|department|manager|user$/i.test(explicit[1])) return explicit[1];
  if (/\bowner\b/i.test(text)) return "Owner";
  return "";
}

function inferRequiredJobPositionName(step) {
  const text = [
    step?.assigneeRole,
    step?.assignmentStrategy,
    step?.nodeName,
    step?.description,
  ].map(cleanResourceName).join(" ");
  if (/cash(?:i|e)r/i.test(text)) return "Casher";
  if (/finance/i.test(text)) return "Finance Manager";
  if (/general\s+manager|\bgm\b/i.test(text)) return "General Manager";
  const explicit = text.match(/job\s+position\s*[:=]?\s*([^;|,]+)/i);
  return explicit ? cleanResourceName(explicit[1]) : "";
}

function truthyPlanValue(value) {
  const text = cleanResourceName(value).toLowerCase();
  return ["true", "yes", "y", "1", "pass", "passed", "success", "succeed", "confirmed", "recorded", "attempted"].includes(text);
}

function numericPlanValue(value) {
  const text = cleanResourceName(value);
  return /^\d+$/.test(text) ? Number(text) : undefined;
}

function jobPositionProofMetadata(step) {
  const metadata = {};
  const oauthStatus = cleanResourceName(step?.jobPositionOauthStatus || step?.oauthStatus || step?.oauthProofStatus || step?.oauthReadinessStatus);
  const oauthRefreshStatus = cleanResourceName(step?.jobPositionOauthRefreshStatus || step?.oauthRefreshStatus);
  const lookupStatus = cleanResourceName(step?.jobPositionLookupStatus || step?.positionLookupStatus || step?.apiLookupStatus);
  const lookupAttempted = cleanResourceName(step?.jobPositionLookupAttempted || step?.positionLookupAttempted || step?.apiLookupAttempted);
  const createAttemptCount = numericPlanValue(step?.jobPositionCreateAttemptCount || step?.positionCreateAttemptCount || step?.createAttemptCount);
  const createResponseIdRecorded = cleanResourceName(step?.jobPositionCreateResponseIdRecorded || step?.positionCreateResponseIdRecorded || step?.createResponseIdRecorded);
  const duplicateScanRecorded = cleanResourceName(step?.jobPositionDuplicateScanRecorded || step?.duplicateNameScanRecorded || step?.duplicateScanRecorded);
  const creationConfirmed = cleanResourceName(step?.jobPositionCreationConfirmed || step?.adminCreationConfirmed || step?.creationConfirmed);
  const adminConfirmed = cleanResourceName(step?.jobPositionAdminConfirmed || step?.systemAdminConfirmed || step?.adminPermissionConfirmed);
  if (oauthStatus) metadata.oauthStatus = oauthStatus;
  if (oauthRefreshStatus) {
    metadata.oauthRefreshStatus = oauthRefreshStatus;
    metadata.oauthRefreshAttempted = truthyPlanValue(oauthRefreshStatus);
  }
  if (lookupStatus) metadata.jobPositionLookupStatus = lookupStatus;
  if (lookupAttempted) metadata.jobPositionLookupAttempted = truthyPlanValue(lookupAttempted);
  if (createAttemptCount !== undefined) metadata.jobPositionCreateAttemptCount = createAttemptCount;
  if (createResponseIdRecorded) metadata.jobPositionCreateResponseIdRecorded = truthyPlanValue(createResponseIdRecorded);
  if (duplicateScanRecorded) metadata.duplicateNameScanRecorded = truthyPlanValue(duplicateScanRecorded);
  if (creationConfirmed) metadata.creationConfirmed = truthyPlanValue(creationConfirmed);
  if (adminConfirmed) metadata.systemAdminConfirmed = truthyPlanValue(adminConfirmed);
  return metadata;
}

function buildWorkflowJobPositionAssignee(step) {
  const positionId = cleanResourceName(step?.jobPositionId || step?.positionId || step?.assigneePositionId || step?.requiredJobPositionId);
  const requiredJobPositionName = cleanResourceName(step?.requiredJobPositionName || step?.jobPositionName || inferRequiredJobPositionName(step));
  const source = cleanResourceName(step?.jobPositionSource || step?.assigneeSource || step?.source);
  const proofStatus = cleanResourceName(step?.jobPositionProofStatus || step?.proofStatus);
  const proofMetadata = jobPositionProofMetadata(step);
  if (!positionId) {
    return {
      type: "position",
      method: "position",
      position: "__JOB_POSITION_REQUIRED__",
      title: requiredJobPositionName ? `Job position: ${requiredJobPositionName}` : "Job position: unresolved",
      requiredJobPositionName: requiredJobPositionName || "__JOB_POSITION_NAME_REQUIRED__",
      source: source || "unresolved",
      proofStatus: proofStatus || "blocked",
      creationRequired: true,
      plannedAssigneeRole: step.assigneeRole || "",
      plannedAssignmentStrategy: step.assignmentStrategy || "",
      ...proofMetadata,
    };
  }
  return {
    type: "position",
    method: "position",
    position: stringId(positionId),
    title: `Job position: ${requiredJobPositionName || positionId}`,
    requiredJobPositionName: requiredJobPositionName || positionId,
    source: source || "user-selected-existing-job-position",
    proofStatus: proofStatus || "user-selected",
    plannedAssigneeRole: step.assigneeRole || "",
    plannedAssignmentStrategy: step.assignmentStrategy || "",
    ...proofMetadata,
  };
}

function workflowTaskAssigneesForStep(step) {
  const text = [
    step?.nodeName,
    step?.assigneeRole,
    step?.assignmentStrategy,
    step?.description,
  ].map(cleanResourceName).join(" ");
  const key = text.toLowerCase();
  const role = step.assigneeRole || "";
  const assignments = [];
  const variableName = inferWorkflowVariableAssigneeName(step);
  const isOwnerManagerApproval = /owner['’]?\s*s?\s+manager\s+approval/i.test(text);
  const isOwnerManagerOnly = /owner['’]?\s*s?\s+manager|owner\s+line\s+manager|variable.*line\s+manager/i.test(text);
  const isOwnerDirect = /\bowner\b|workflow\s+variable|user\s+variable/i.test(text);
  const isDepartmentManager = /department\s+(manager|head|approval)|department\s*:\s*manager/i.test(text);
  const isLineManager = /line\s+manager|applicant\s+manager/i.test(text);
  const isJobPosition = /job\s+position|finance\s+manager|general\s+manager|cash(?:i|e)r/i.test(text);

  if (isOwnerManagerApproval && variableName) {
    assignments.push(workflowUserExpressionAssignee(workflowVariableUserExpression(variableName), role));
    assignments.push(workflowUserExpressionAssignee(workflowVariableUserLineManagerExpression(variableName), role));
    return assignments;
  }
  if (isOwnerManagerOnly && variableName) {
    assignments.push(workflowUserExpressionAssignee(workflowVariableUserLineManagerExpression(variableName), role));
    return assignments;
  }
  if (isOwnerDirect && variableName) {
    assignments.push(workflowUserExpressionAssignee(workflowVariableUserExpression(variableName), role));
    return assignments;
  }
  if (isDepartmentManager) {
    assignments.push(workflowUserExpressionAssignee(workflowApplicantDepartmentManagerExpression(), role));
    return assignments;
  }
  if (isJobPosition) {
    assignments.push(buildWorkflowJobPositionAssignee(step));
    return assignments;
  }
  if (isLineManager || key) {
    assignments.push(workflowUserExpressionAssignee(workflowApplicantLineManagerExpression(), role));
    return assignments;
  }
  assignments.push(workflowUserExpressionAssignee(workflowApplicantLineManagerExpression(), role));
  return assignments;
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
  return canonicalGraphRef(resourceid);
}

function refId(ref) {
  return canonicalGraphRefId(ref);
}

function workflowLayoutForSteps(workflowSteps) {
  const mainLaneY = 40;
  const actionLaneY = 195;
  const rejectUpGap = 125;
  const rejectDownGap = 135;
  const workflowNodeWidth = 190;
  const workflowRowToleranceY = 60;
  const startX = -170;
  const firstStepX = 135;
  const columnGap = 335;
  const rowGap = 155;
  const stepPositions = workflowSteps.map((step, index) => {
    const isAction = ["ContentList", "QueryData", "SetVariableTask"].includes(step.nodeType);
    return {
      x: firstStepX + index * columnGap,
      y: isAction ? actionLaneY : mainLaneY,
    };
  });
  const lastStepIndex = Math.max(0, workflowSteps.length - 1);
  const endX = firstStepX + (lastStepIndex + 1) * columnGap;
  const endY = mainLaneY;
  const approvalEntries = stepPositions.map((position, index) => {
    const nodeType = workflowSteps[index]?.nodeType || "";
    const isApproval = ["MultiAssignmentTask", "CandidateTask"].includes(nodeType);
    return isApproval ? { index, position } : null;
  }).filter(Boolean);
  const approvalRows = workflowLayoutRows(approvalEntries, workflowRowToleranceY);
  const firstApprovalRowY = approvalRows.length ? Math.min(...approvalRows.map((row) => row.y)) : mainLaneY;
  const rejectGroups = [];
  for (const row of approvalRows) {
    const rowEntries = [...row.entries].sort((left, right) => left.position.x - right.position.x);
    for (let index = 0; index < rowEntries.length; index += 3) {
      const chunk = rowEntries.slice(index, index + 3);
      const centers = chunk.map((entry) => ({ x: entry.position.x + workflowNodeWidth / 2, y: entry.position.y }));
      const minX = Math.min(...centers.map((center) => center.x));
      const maxX = Math.max(...centers.map((center) => center.x));
      const sourceRowY = centers.reduce((sum, center) => sum + center.y, 0) / centers.length;
      const rejectGoesAbove = Math.abs(sourceRowY - firstApprovalRowY) <= workflowRowToleranceY;
      const centerX = (minX + maxX) / 2;
      rejectGroups.push({
        stepIndexes: chunk.map((entry) => entry.index),
        position: {
          x: centerX - workflowNodeWidth / 2,
          y: rejectGoesAbove ? sourceRowY - rejectUpGap : sourceRowY + rejectDownGap,
        },
      });
    }
  }
  const fallbackRejectPosition = {
    x: firstStepX,
    y: mainLaneY - rejectUpGap,
  };
  return {
    start: { x: startX, y: mainLaneY },
    stepPositions,
    end: { x: endX, y: endY },
    rejectEnd: rejectGroups[0]?.position || fallbackRejectPosition,
    rejectGroups: rejectGroups.length ? rejectGroups : [{ stepIndexes: [], position: fallbackRejectPosition }],
    routeNodes: [
      { id: "start", position: { x: startX, y: mainLaneY } },
      { id: "end", position: { x: endX, y: endY } },
      ...stepPositions.map((position, index) => ({ id: `step-${index + 1}`, position })),
      ...(rejectGroups.length ? rejectGroups : [{ stepIndexes: [], position: fallbackRejectPosition }])
        .map((group, index) => ({ id: `end-rejected-${index + 1}`, position: group.position })),
    ],
  };
}

function workflowLayoutRows(entries, tolerance) {
  const rows = [];
  for (const entry of [...entries].sort((left, right) => left.position.y - right.position.y)) {
    const existing = rows.find((row) => Math.abs(row.y - entry.position.y) <= tolerance);
    if (existing) {
      existing.entries.push(entry);
      existing.y = existing.entries.reduce((sum, item) => sum + item.position.y, 0) / existing.entries.length;
    } else {
      rows.push({ y: entry.position.y, entries: [entry] });
    }
  }
  return rows;
}

function workflowVerticesBetween(sourcePosition, targetPosition, options = {}) {
  if (!sourcePosition || !targetPosition) return [];
  const dx = Math.abs(targetPosition.x - sourcePosition.x);
  const dy = Math.abs(targetPosition.y - sourcePosition.y);
  const signedDx = Number(targetPosition.x) - Number(sourcePosition.x);
  if (!options.force && dy < 80 && dx < 520) return [];
  if (!options.force && signedDx >= 0 && dx < Number(options.forwardAutoRouteDeltaX || 900)) return [];
  if (!options.force && signedDx > 0 && dx <= Number(options.localForwardAutoRouteDeltaX || 1250) && dy <= Number(options.localForwardAutoRouteDeltaY || 360)) return [];
  const routeY = workflowSafeRouteYBetweenRows(sourcePosition, targetPosition, options.routeNodes || []);
  if (Number.isFinite(routeY)) {
    const nodeWidth = Number(options.nodeWidth || 190);
    const nodeHeight = Number(options.nodeHeight || 86);
    const sourceCenterX = Math.round(sourcePosition.x + nodeWidth / 2);
    const targetCenterX = Math.round(targetPosition.x + nodeWidth / 2);
    const sourceCenterY = Math.round(sourcePosition.y + nodeHeight / 2);
    const routeX = workflowSafeRouteXBetweenColumns(sourcePosition, targetPosition, options.routeNodes || [], options);
    if (Number.isFinite(routeX) && Math.abs(routeX - sourceCenterX) > 8) {
      return [
        { x: routeX, y: sourceCenterY },
        { x: routeX, y: routeY },
        { x: targetCenterX, y: routeY },
      ];
    }
    return [
      { x: sourceCenterX, y: routeY },
      { x: targetCenterX, y: routeY },
    ];
  }
  const bendX = sourcePosition.x + Math.max(120, Math.round(dx / 2));
  return [
    { x: bendX, y: sourcePosition.y },
    { x: bendX, y: targetPosition.y },
  ];
}

function workflowSafeRouteYBetweenRows(sourcePosition, targetPosition, routeNodes = [], options = {}) {
  const nodeHeight = Number(options.nodeHeight || 86);
  const rowTolerance = Number(options.rowTolerance || 60);
  const minimumGap = Number(options.minimumGap || 40);
  const externalPadding = Number(options.externalPadding || 100);
  const sourceY = Number(sourcePosition?.y);
  const targetY = Number(targetPosition?.y);
  if (!Number.isFinite(sourceY) || !Number.isFinite(targetY) || Math.abs(sourceY - targetY) <= rowTolerance) return null;
  const positions = (Array.isArray(routeNodes) ? routeNodes : [])
    .map((entry) => entry?.position || entry)
    .filter((position) => Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y)))
    .map((position) => ({ x: Number(position.x), y: Number(position.y) }));
  if (positions.length < 2) return null;
  const sourceCenterY = sourceY + nodeHeight / 2;
  const targetCenterY = targetY + nodeHeight / 2;
  const minCenterY = Math.min(sourceCenterY, targetCenterY) - rowTolerance;
  const maxCenterY = Math.max(sourceCenterY, targetCenterY) + rowTolerance;
  const rows = workflowPositionRows(positions, rowTolerance)
    .map((row) => {
      const top = Math.min(...row.map((position) => position.y));
      const bottom = Math.max(...row.map((position) => position.y + nodeHeight));
      return { top, bottom, centerY: (top + bottom) / 2 };
    })
    .filter((row) => row.centerY >= minCenterY && row.centerY <= maxCenterY)
    .sort((left, right) => left.top - right.top);
  if (rows.length < 2) return null;
  const gaps = [];
  for (let index = 0; index < rows.length - 1; index += 1) {
    const top = rows[index].bottom;
    const bottom = rows[index + 1].top;
    if (bottom - top >= minimumGap) gaps.push({ top, bottom, midpoint: Math.round((top + bottom) / 2) });
  }
  if (gaps.length) {
    return sourceY > targetY ? gaps[0].midpoint : gaps[gaps.length - 1].midpoint;
  }
  return sourceY > targetY
    ? Math.round(rows[0].top - externalPadding)
    : Math.round(rows[rows.length - 1].bottom + externalPadding);
}

function workflowSafeRouteXBetweenColumns(sourcePosition, targetPosition, routeNodes = [], options = {}) {
  const nodeWidth = Number(options.nodeWidth || 190);
  const columnTolerance = Number(options.columnTolerance || 80);
  const minimumGap = Number(options.minimumColumnGap || 48);
  const externalPadding = Number(options.externalColumnPadding || 100);
  const sourceX = Number(sourcePosition?.x);
  const targetX = Number(targetPosition?.x);
  if (!Number.isFinite(sourceX) || !Number.isFinite(targetX) || Math.abs(sourceX - targetX) <= columnTolerance) return null;
  const positions = (Array.isArray(routeNodes) ? routeNodes : [])
    .map((entry) => entry?.position || entry)
    .filter((position) => Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y)))
    .map((position) => ({ x: Number(position.x), y: Number(position.y) }));
  if (positions.length < 2) return null;
  const sourceCenterX = sourceX + nodeWidth / 2;
  const targetCenterX = targetX + nodeWidth / 2;
  const minCenterX = Math.min(sourceCenterX, targetCenterX) - columnTolerance;
  const maxCenterX = Math.max(sourceCenterX, targetCenterX) + columnTolerance;
  const columns = workflowPositionColumns(positions, columnTolerance)
    .map((column) => {
      const left = Math.min(...column.map((position) => position.x));
      const right = Math.max(...column.map((position) => position.x + nodeWidth));
      return { left, right, centerX: (left + right) / 2 };
    })
    .filter((column) => column.centerX >= minCenterX && column.centerX <= maxCenterX)
    .sort((left, right) => left.left - right.left);
  if (columns.length < 2) return null;
  const gaps = [];
  for (let index = 0; index < columns.length - 1; index += 1) {
    const left = columns[index].right;
    const right = columns[index + 1].left;
    if (right - left >= minimumGap) gaps.push({ left, right, midpoint: Math.round((left + right) / 2) });
  }
  if (gaps.length) {
    return sourceX < targetX ? gaps[gaps.length - 1].midpoint : gaps[0].midpoint;
  }
  return sourceX < targetX
    ? Math.round(columns[columns.length - 1].right + externalPadding)
    : Math.round(columns[0].left - externalPadding);
}

function workflowPositionRows(positions, tolerance) {
  const rows = [];
  for (const position of [...positions].sort((left, right) => left.y - right.y)) {
    const existing = rows.find((row) => Math.abs(rowAverageY(row) - position.y) <= tolerance);
    if (existing) existing.push(position);
    else rows.push([position]);
  }
  return rows;
}

function rowAverageY(row) {
  return row.reduce((sum, position) => sum + position.y, 0) / Math.max(1, row.length);
}

function workflowPositionColumns(positions, tolerance) {
  const columns = [];
  for (const position of [...positions].sort((left, right) => left.x - right.x)) {
    const existing = columns.find((column) => Math.abs(columnAverageX(column) - position.x) <= tolerance);
    if (existing) existing.push(position);
    else columns.push([position]);
  }
  return columns;
}

function columnAverageX(column) {
  return column.reduce((sum, position) => sum + position.x, 0) / Math.max(1, column.length);
}

function workflowRejectedVertices(sourcePosition, rejectPosition) {
  if (!sourcePosition || !rejectPosition) return [];
  const dx = Math.abs(rejectPosition.x - sourcePosition.x);
  const dy = Math.abs(rejectPosition.y - sourcePosition.y);
  if (dx < 520 && dy < 220) return [];
  const bendX = sourcePosition.x + Math.max(120, Math.round(Math.abs(rejectPosition.x - sourcePosition.x) / 2));
  return [
    { x: bendX, y: sourcePosition.y },
    { x: bendX, y: rejectPosition.y },
    { x: rejectPosition.x - 120, y: rejectPosition.y },
  ];
}

function plannedWorkflowHostRecords(planDemand) {
  const parsed = Array.isArray(planDemand?.workflowHostRecords) ? planDemand.workflowHostRecords : [];
  const expected = [
    ...(planDemand?.resources?.dataListWorkflows || []).map((name) => ({ name, workflowType: 1 })),
    ...(planDemand?.resources?.scheduleWorkflows || []).map((name) => ({ name, workflowType: 3 })),
  ];
  return expected.map((expectedRecord) => {
    const found = parsed.find((record) => record.workflowType === expectedRecord.workflowType && normKey(record.name) === normKey(expectedRecord.name));
    return found || { ...expectedRecord, hostResource: "", trigger: "", settings: null };
  });
}

function workflowFlowMappingIndex(planDemand, host) {
  return plannedWorkflowHostRecords(planDemand)
    .filter((record) => record.workflowType === 1 && normKey(record.hostResource) === normKey(host.hostResource))
    .findIndex((record) => normKey(record.name) === normKey(host.name));
}

function buildPlannedWorkflowHostForms({ planDemand, rootListSetId, ids, approvalFormCount, childResourceRecords, listMetaByName, childs, findings }) {
  const hosts = plannedWorkflowHostRecords(planDemand);
  const forms = [];
  for (const [workflowIndex, host] of hosts.entries()) {
    const actionRecords = (planDemand.workflowSetDataListRecords || []).filter((record) => (
      normKey(record.workflowName) === normKey(host.name)
      && ((host.workflowType === 1 && normKey(record.host) === "data list") || (host.workflowType === 3 && normKey(record.host) === "scheduled"))
    ));
    if (!actionRecords.length) {
      findings.push(error("FULL_APP_WORKFLOW_SET_DATALIST_CONFIG_REQUIRED", "Every planned Data List or Scheduled Workflow must declare one or more exact Workflow Set Data List Action Plan rows before it can be materialized.", { workflow: host.name, workflowType: host.workflowType }));
      continue;
    }
    let hostMeta = null;
    let hostChildIndex = -1;
    if (host.workflowType === 1) {
      hostMeta = listMetaByName.get(normKey(host.hostResource)) || null;
      hostChildIndex = childResourceRecords.findIndex((record) => normKey(record.name) === normKey(host.hostResource));
      if (!hostMeta || hostChildIndex < 0) {
        findings.push(error("FULL_APP_DATA_LIST_WORKFLOW_HOST_NOT_MATERIALIZED", "A Data List Workflow must declare a materialized host Data List or Document Library in the Data List Workflows Plan.", { workflow: host.name, hostResource: host.hostResource }));
        continue;
      }
      if (!host.settings || typeof host.settings !== "object" || Array.isArray(host.settings)) {
        findings.push(error("FULL_APP_DATA_LIST_WORKFLOW_TRIGGER_SETTINGS_REQUIRED", "Data List Workflow generation requires exact Trigger Settings JSON from the App Plan; do not infer lifecycle trigger payloads from prose.", { workflow: host.name, hostResource: host.hostResource }));
        continue;
      }
    }
    if (host.workflowType === 3 && (!host.settings || typeof host.settings !== "object" || Array.isArray(host.settings))) {
      findings.push(error("FULL_APP_SCHEDULED_WORKFLOW_SETTINGS_REQUIRED", "Scheduled Workflow generation requires exact Schedule Settings JSON from the App Plan; do not invent schedules from prose.", { workflow: host.name }));
      continue;
    }
    const formIndex = approvalFormCount + forms.length;
    const key = stringId(ids[`decoded.Forms[${formIndex}].Key`]);
    const defId = stringId(ids[`decoded.Forms[${formIndex}].DefResourceID`]);
    if (!key || !defId) {
      findings.push(error("FULL_APP_WORKFLOW_ID_ALLOCATION_MISSING", "Workflow Form IDs were not allocated before materialization.", { workflow: host.name, workflowType: host.workflowType }));
      continue;
    }
    const def = buildWorkflowSetDataListDefResource({
      name: host.name,
      formKey: key,
      defId,
      workflowType: host.workflowType,
      rootListSetId,
      hostListId: hostMeta?.listId || "",
      actionRecords,
      loopRecords: (planDemand.workflowLoopRecords || []).filter((record) => normKey(record.workflowName) === normKey(host.name)),
      listMetaByName,
      findings,
    });
    if (!def) continue;
    forms.push({
      Category: "",
      Name: host.name,
      Key: key,
      IsItemPerm: false,
      AppID: 41,
      ListID: hostMeta?.listId || 0,
      ProcModelID: defId,
      Description: "",
      Ext: "",
      DefResourceID: defId,
      DefResource: exportResource(def),
      Status: 1,
      DeployedDefID: defId,
      WorkflowType: host.workflowType,
      Settings: host.workflowType === 3 ? JSON.stringify(host.settings) : "",
      Deployed: true,
      NoRule: { Prefix: "WF-{index}", StartIndex: 1, CustomLength: 4, AutoIncrement: 1 },
      Perms: [],
    });
    if (host.workflowType === 1) {
      const mappingIndex = workflowFlowMappingIndex(planDemand, host);
      const mappingId = stringId(ids[`decoded.Childs[${hostChildIndex}].FlowMappings[${mappingIndex}].ID`]);
      if (!mappingId) {
        findings.push(error("FULL_APP_DATA_LIST_WORKFLOW_MAPPING_ID_MISSING", "A Data List Workflow FlowMappings ID was not allocated.", { workflow: host.name, hostResource: host.hostResource }));
        continue;
      }
      childs[hostChildIndex].FlowMappings.push({
        ID: mappingId,
        ListID: stringId(hostMeta.listId),
        Method: 0,
        Setting: JSON.stringify(host.settings),
        Title: host.name,
        DefKey: key,
        FieldName: cleanResourceName(host.trigger),
        Ext1: "",
        Ext2: "",
        Ext3: "",
      });
    }
  }
  return forms;
}

function buildWorkflowSetDataListDefResource({ name, formKey, defId, workflowType, rootListSetId, hostListId = "", actionRecords, loopRecords = [], listMetaByName, findings }) {
  const childshapes = buildWorkflowSetDataListShapes({ name, defId, workflowType, rootListSetId, hostListId, actionRecords, loopRecords, listMetaByName, findings });
  if (!childshapes) return null;
  return {
    id: defId,
    key: formKey,
    defkey: formKey,
    name,
    title: name,
    workflowType,
    AppListSetID: stringId(rootListSetId),
    ProcModelAppID: 41,
    ProcModelListID: workflowType === 1 ? stringId(hostListId) : null,
    ProcModelListSetID: workflowType === 1 ? stringId(rootListSetId) : null,
    ext: {},
    lineType: "rounded",
    iconURL: "",
    flowPage: [],
    variables: { basic: [], listref: [], filter: [] },
    graphposition: approvalWorkflowGraphPosition(childshapes),
    graphzoom: 1,
    graphver: 2,
    pageurls: [],
    childshapes: normalizeApprovalWorkflowGraphReferences(childshapes),
  };
}

function buildWorkflowSetDataListShapes({ name, defId, workflowType, rootListSetId, hostListId, actionRecords, loopRecords = [], listMetaByName, findings }) {
  const seed = `${defId}:${name}:set-data-list`;
  const startId = deterministicUuid(`${seed}:start`);
  const endId = deterministicUuid(`${seed}:end`);
  const nodes = [];
  for (const [index, record] of actionRecords.entries()) {
    const target = record.targetMode === "current"
      ? { listId: hostListId, listName: "Current list", resourceType: "data-list" }
      : listMetaByName.get(normKey(record.targetResource));
    if (!target?.listId) {
      findings.push(error("FULL_APP_WORKFLOW_SET_DATALIST_TARGET_NOT_MATERIALIZED", "A Workflow Set Data List selected target must resolve to a generated Data List or Document Library.", { workflow: name, node: record.nodeName, targetResource: record.targetResource }));
      return null;
    }
    nodes.push({
      id: deterministicUuid(`${seed}:content-list:${index + 1}:${record.nodeName}`),
      record,
      target,
      position: { x: 500 + index * 340, y: 200 },
    });
  }
  const segments = [];
  for (const node of nodes) {
    const parentLoop = cleanResourceName(node.record.parentLoop);
    if (!parentLoop) {
      segments.push({ kind: "node", node });
      continue;
    }
    let loop = segments.find((segment) => segment.kind === "loop" && normKey(segment.loop.nodeName) === normKey(parentLoop));
    if (!loop) {
      const loopRecord = loopRecords.find((record) => normKey(record.nodeName) === normKey(parentLoop));
      if (!loopRecord) {
        findings.push(error("FULL_APP_WORKFLOW_LOOP_CONFIG_REQUIRED", "A Set Data List node with Parent Loop requires an exact Workflow Loop Planning row so the LoopBody is not guessed.", { workflow: name, node: node.record.nodeName, parentLoop }));
        return null;
      }
      loop = { kind: "loop", loop: loopRecord, nodes: [] };
      segments.push(loop);
    }
    loop.nodes.push(node);
  }
  for (const segment of segments.filter((entry) => entry.kind === "loop")) {
    const mode = segment.loop.mode;
    if (!["list", "values", "number"].includes(mode)) {
      findings.push(error("FULL_APP_WORKFLOW_LOOP_MODE_INVALID", "Workflow Loop Planning supports only list, values, or number modes.", { workflow: name, loop: segment.loop.nodeName, mode }));
      return null;
    }
    if (mode === "list" && (!segment.loop.sourceParent || !segment.loop.source)) {
      findings.push(error("FULL_APP_WORKFLOW_LOOP_SOURCE_REQUIRED", "A list Loop requires exact Loop Source Parent and Loop Source values.", { workflow: name, loop: segment.loop.nodeName }));
      return null;
    }
    if ((mode === "values" || mode === "number") && !Array.isArray(segment.loop.expression)) {
      findings.push(error("FULL_APP_WORKFLOW_LOOP_EXPRESSION_REQUIRED", "A values or number Loop requires exact Loop Value Expression JSON; do not derive it from prose.", { workflow: name, loop: segment.loop.nodeName, mode }));
      return null;
    }
  }
  const shapes = [];
  const flow = (id, sourceId, targetId, label = "Next") => ({
    id,
    resourceid: id,
    stencil: { id: "SequenceFlow" },
    source: flowRef(sourceId),
    target: flowRef(targetId),
    properties: { name: label, linetype: "rounded", documentation: label, conditioninfo: [] },
    dockers: [],
  });
  const flowIds = [];
  const segmentId = (segment, index) => segment.kind === "node" ? segment.node.id : deterministicUuid(`${seed}:loop:${index + 1}:${segment.loop.nodeName}`);
  const sourceIds = [startId, ...segments.map(segmentId)];
  const targetIds = [...segments.map(segmentId), endId];
  for (const [index, sourceId] of sourceIds.entries()) {
    const id = deterministicUuid(`${seed}:flow:${index + 1}`);
    flowIds.push(id);
    shapes.push(flow(id, sourceId, targetIds[index], index === 0 ? "Started" : "Completed"));
  }
  shapes.push({
    id: startId,
    resourceid: startId,
    stencil: { id: "StartNoneEvent" },
    position: { x: 180, y: 200 },
    incoming: [],
    outgoing: [flowRef(flowIds[0])],
    properties: { name: "Start", taskurl: "", isenabledemail: false, subject: "", to: "", html: "" },
  });
  for (const [index, segment] of segments.entries()) {
    if (segment.kind === "loop") {
      const loopId = segmentId(segment, index);
      const bodyId = deterministicUuid(`${seed}:loop-body:${index + 1}:${segment.loop.nodeName}`);
      const pureEdgeId = deterministicUuid(`${seed}:loop-body-edge:${index + 1}`);
      const loopProperties = buildWorkflowLoopProperties({
        name: segment.loop.nodeName,
        loopType: segment.loop.mode,
        sourceParent: segment.loop.sourceParent,
        source: segment.loop.source,
        expression: segment.loop.expression,
      });
      const internalFlowIds = segment.nodes.slice(0, -1).map((node, nodeIndex) => deterministicUuid(`${seed}:loop:${index + 1}:flow:${nodeIndex + 1}`));
      const bodyChildren = [];
      for (const [nodeIndex, node] of segment.nodes.entries()) {
        bodyChildren.push({
          id: node.id,
          resourceid: node.id,
          stencil: { id: "ContentList" },
          position: { x: 80 + nodeIndex * 320, y: 70 },
          incoming: nodeIndex === 0 ? [] : [flowRef(internalFlowIds[nodeIndex - 1])],
          outgoing: nodeIndex === segment.nodes.length - 1 ? [] : [flowRef(internalFlowIds[nodeIndex])],
          properties: buildWorkflowSetDataListProperties({ record: node.record, target: node.target, rootListSetId, hostListId, workflowType }),
        });
      }
      for (const [nodeIndex, flowId] of internalFlowIds.entries()) bodyChildren.push(flow(flowId, segment.nodes[nodeIndex].id, segment.nodes[nodeIndex + 1].id, "Next"));
      shapes.push({
        id: pureEdgeId,
        resourceid: pureEdgeId,
        stencil: { id: "SequenceFlow" },
        source: flowRef(loopId),
        target: flowRef(bodyId),
        properties: { name: "", linetype: "rounded", documentation: "", conditioninfo: [] },
        dockers: [],
        pureEdge: true,
      });
      shapes.push({
        id: loopId,
        resourceid: loopId,
        stencil: { id: "Loop" },
        bodyRef: bodyId,
        position: { x: 500 + index * 340, y: 200 },
        incoming: [flowRef(flowIds[index])],
        outgoing: [flowRef(flowIds[index + 1]), flowRef(pureEdgeId)],
        properties: loopProperties,
      });
      shapes.push({
        id: bodyId,
        resourceid: bodyId,
        stencil: { id: "LoopBody" },
        position: { x: 500 + index * 340, y: 340 },
        incoming: [flowRef(pureEdgeId)],
        outgoing: [],
        properties: { name: "Loop body" },
        children: bodyChildren,
      });
      continue;
    }
    const node = segment.node;
    shapes.push({
      id: node.id,
      resourceid: node.id,
      stencil: { id: "ContentList" },
      position: node.position,
      incoming: [flowRef(flowIds[index])],
      outgoing: [flowRef(flowIds[index + 1])],
      properties: buildWorkflowSetDataListProperties({ record: node.record, target: node.target, rootListSetId, hostListId, workflowType }),
    });
  }
  shapes.push({
    id: endId,
    resourceid: endId,
    stencil: { id: "EndNoneEvent" },
    position: { x: 500 + segments.length * 340, y: 200 },
    incoming: [flowRef(flowIds[flowIds.length - 1])],
    outgoing: [],
    properties: { name: "End", isenabledemail: false, subject: "", to: "", html: "" },
  });
  return shapes.map(withApprovalWorkflowDesignerBounds);
}

function buildWorkflowSetDataListProperties({ record, target, rootListSetId, hostListId, workflowType }) {
  const selected = record.targetMode === "select";
  const operation = cleanResourceName(record.operation).toLowerCase();
  const properties = {
    name: record.nodeName,
    type: operation,
    listtype: selected ? "select" : "current",
    listid: stringId(selected ? target.listId : hostListId),
    appid: selected ? 41 : "",
    listdatas: operation === "remove" ? null : (record.mappings || []).map(({ TargetType, ...mapping }) => mapping),
  };
  if (selected) properties.listsetid = stringId(rootListSetId);
  if (operation === "edit" || operation === "remove") properties.wheres = record.filters || [];
  return properties;
}

function buildApprovalDefResource({ name, formKey, defId, rootListSetId, approvalFieldSpecs = {}, approvalWorkflowNodes = [], dataListMetas = [], formActionSetVariableRecords = [], formActionSetDataListRecords = [], formActionOpenResourceRecords = [], listMetaByName = new Map(), approvalMetaByName = new Map(), dashboardMetaByName = new Map() }) {
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
  const childshapes = normalizeApprovalWorkflowGraphReferences(buildApprovalWorkflowShapes({
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
  }));
  const variables = buildApprovalVariables(approvalFieldSpecs);
  addApprovalWorkflowActionVariables(variables, childshapes);
  const submissionFormDef = approvalFormDef(submissionPageId, name, "submission", approvalFieldSpecs.submission || []);
  const taskFormDef = approvalFormDef(taskPageId, name, "task", approvalTaskFieldSpecs(approvalFieldSpecs));
  materializePlannedFormActionSetVariables(submissionFormDef, {
    records: formActionSetVariableRecords,
    hostResource: name,
    hostPage: "Submission form",
    hostType: "Approval",
  });
  materializePlannedFormActionSetVariables(taskFormDef, {
    records: formActionSetVariableRecords,
    hostResource: name,
    hostPage: "Task form",
    hostType: "Approval",
  });
  materializePlannedFormActionSetDataLists(submissionFormDef, {
    records: formActionSetDataListRecords,
    hostResource: name,
    hostPage: "Submission form",
    hostSurface: "approval_submission",
    listMetaByName,
    rootListSetId,
  });
  materializePlannedFormActionSetDataLists(taskFormDef, {
    records: formActionSetDataListRecords,
    hostResource: name,
    hostPage: "Task form",
    hostSurface: "approval_task",
    listMetaByName,
    rootListSetId,
  });
  materializePlannedFormActionOpenResources(submissionFormDef, {
    records: formActionOpenResourceRecords,
    hostResource: name,
    hostPage: "Submission form",
    hostSurface: "approval_submission",
    listMetaByName, approvalMetaByName, dashboardMetaByName, rootListSetId,
  });
  materializePlannedFormActionOpenResources(taskFormDef, {
    records: formActionOpenResourceRecords,
    hostResource: name,
    hostPage: "Task form",
    hostSurface: "approval_task",
    listMetaByName, approvalMetaByName, dashboardMetaByName, rootListSetId,
  });
  variables.tempVars = mergeApprovalPageTempVars(variables.tempVars, submissionFormDef.tempVars, taskFormDef.tempVars);
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
    lineType: "rounded",
    iconURL: "",
    flowPage: [],
    variables,
    graphposition: approvalWorkflowGraphPosition(childshapes),
    graphzoom: 1,
    graphver: 2,
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
        formdef: submissionFormDef,
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
        formdef: taskFormDef,
      },
    ],
    childshapes,
  };
}

function mergeApprovalPageTempVars(...groups) {
  const merged = [];
  const seen = new Set();
  for (const group of groups) for (const variable of group || []) {
    const id = cleanResourceName(variable?.id || variable?.name);
    if (!id || seen.has(normKey(id))) continue;
    seen.add(normKey(id));
    merged.push({ idx: variable.idx || deterministicUuid(`approval-temp:${id}`), id, ...(variable.type ? { type: variable.type } : {}) });
  }
  return merged;
}

function approvalWorkflowExecutionSteps(nodes) {
  return uniqueApprovalWorkflowNodes(nodes).filter((node) => !["StartNoneEvent", "EndNoneEvent", "EndRejectEvent", "SequenceFlow"].includes(node.nodeType));
}

function buildApprovalWorkflowShapes({ defId, formKey, rootListSetId, submissionPageId, taskPageId, startId, endId, rejectEndId, workflowSteps, dataListMetas = [] }) {
  const seed = `${defId}:${formKey}:workflow`;
  const layout = workflowLayoutForSteps(workflowSteps);
  const rejectGroups = layout.rejectGroups.map((group, index) => ({
    ...group,
    id: index === 0 ? rejectEndId : deterministicUuid(`${seed}:end-rejected:${index + 1}`),
    incoming: [],
  }));
  const rejectGroupByStepIndex = new Map();
  for (const group of rejectGroups) {
    for (const stepIndex of group.stepIndexes) rejectGroupByStepIndex.set(stepIndex, group);
  }
  const stepNodes = workflowSteps.map((step, index) => {
    const id = deterministicUuid(`${seed}:step:${index + 1}:${step.nodeType}:${step.nodeName}`);
    return buildApprovalWorkflowStepNode({ step, index, id, taskPageId, rootListSetId, dataListMetas, position: layout.stepPositions[index] });
  });
  const positionById = new Map([
    [startId, layout.start],
    [endId, layout.end],
    ...rejectGroups.map((group) => [group.id, group.position]),
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
    properties: {
      name: "Start",
      taskurl: submissionPageId,
      taskUrl: submissionPageId,
      TaskUrl: submissionPageId,
      isenabledemail: false,
      subject: "",
      to: "",
      html: "",
    },
  };
  const flowShapes = [];
  const endIncoming = [];
  const addFlow = ({ id, sourceId, targetId, name, conditioninfo = null, vertices = [] }) => {
    const description = workflowConnectorDescription(name, conditioninfo);
    const flow = {
      id,
      resourceid: id,
      stencil: { id: "SequenceFlow" },
      source: flowRef(sourceId),
      target: flowRef(targetId),
      incoming: [flowRef(sourceId)],
      outgoing: [flowRef(targetId)],
      properties: conditioninfo
        ? { name: description, linetype: "rounded", documentation: description, conditionsequenceflow: "", conditioninfo }
        : { name: description, linetype: "rounded", documentation: description, conditioninfo: [] },
      dockers: [],
    };
    if (vertices.length) flow.vertices = vertices;
    flowShapes.push(flow);
    return flowRef(id);
  };
  addFlow({
    id: startToFirstFlowId,
    sourceId: startId,
    targetId: stepNodes[0]?.id || endId,
    name: "Submitted",
    vertices: [],
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
        vertices: workflowVerticesBetween(node.position, approvedTargetPosition, { routeNodes: layout.routeNodes }),
      });
      const rejectGroup = rejectGroupByStepIndex.get(index) || rejectGroups[0];
      const rejectedRef = addFlow({
        id: rejectedFlowId,
        sourceId: node.id,
        targetId: rejectGroup.id,
        name: "Rejected",
        conditioninfo: [workflowOutcomeCondition({ key: rejectedFlowId, taskId: node.id, taskLabel: node.properties.name, outcome: "Rejected" })],
        vertices: workflowRejectedVertices(node.position, rejectGroup.position),
      });
      node.outgoing = [approvedRef, rejectedRef];
      if (!nextNode) endIncoming.push(approvedRef);
      rejectGroup.incoming.push(rejectedRef);
    } else {
      const completeFlowId = deterministicUuid(`${seed}:flow:${index + 1}:complete`);
      const targetId = nextNode?.id || endId;
      const targetPosition = nextNode?.position || layout.end;
      const completeRef = addFlow({
        id: completeFlowId,
        sourceId: node.id,
        targetId,
        name: "Completed",
        vertices: workflowVerticesBetween(node.position, targetPosition, { routeNodes: layout.routeNodes }),
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
      properties: { name: "End", isenabledemail: false, subject: "", to: "", html: "" },
    },
    ...rejectGroups.map((group, index) => ({
      id: group.id,
      resourceid: group.id,
      stencil: { id: "EndRejectEvent" },
      position: group.position,
      incoming: group.incoming,
      outgoing: [],
      properties: {
        name: index === 0 ? "Rejected" : `Rejected ${index + 1}`,
        isenabledemail: false,
        subject: "",
        to: "",
        html: "",
      },
    })),
  ].map(withApprovalWorkflowDesignerBounds);
}

function workflowConnectorDescription(name, conditioninfo = null) {
  const label = cleanResourceName(name).replace(/\s+/g, " ");
  if (/^complete$/i.test(label)) return "Completed";
  if (label && !/^sequence\s*flow(?:[_\s-]*\d+)?$/i.test(label)) return truncateWorkflowActionName(label, 42);
  const conditionText = summarizeWorkflowCondition(conditioninfo);
  return conditionText || "Next";
}

function summarizeWorkflowCondition(conditioninfo) {
  const rows = Array.isArray(conditioninfo) ? conditioninfo : [];
  for (const row of rows) {
    const op = cleanResourceName(row?.op);
    const left = cleanResourceName(row?.left?.value?.name || row?.left?.value?.id);
    const right = row?.right?.type === 0
      ? cleanResourceName(row.right.value)
      : cleanResourceName(row?.right?.value?.name || row?.right?.value?.id);
    if (!left || !op) continue;
    if (op === "isNull") return `${left} is empty`;
    if (op === "isNotNull") return `${left} is not empty`;
    const symbol = op.replace(/^[a-z]+\./i, "").replace("!=", "!=").replace("=", "=");
    if (right) return truncateWorkflowActionName(`${left} ${symbol} ${right}`, 42);
  }
  return "";
}

function buildApprovalWorkflowStepNode({ step, index, id, taskPageId, rootListSetId, dataListMetas = [], position = null }) {
  const stencil = [
    "CandidateTask",
    "ContentList",
    "ExclusiveGateway",
    "InclusiveGateway",
    "QueryData",
    "SetVariableTask",
  ].includes(step.nodeType)
    ? step.nodeType
    : "MultiAssignmentTask";
  const base = {
    id,
    resourceid: id,
    stencil: { id: stencil },
    position: position || { x: 420 + index * 300, y: stencil === "ContentList" ? 360 : 220 },
    incoming: [],
    outgoing: [],
    properties: {
      name: step.nodeName,
      title: step.nodeName,
      label: step.nodeName,
      plannedWorkflowNodeName: step.nodeName,
      plannedOriginalWorkflowNodeName: step.originalNodeName || "",
      plannedWorkflowNodeType: step.nodeType,
      plannedAssigneeRole: step.assigneeRole || "",
      plannedAssignmentStrategy: step.assignmentStrategy || "",
      plannedRequiredJobPositionName: step.requiredJobPositionName || "",
      plannedJobPositionSource: step.jobPositionSource || "",
      plannedJobPositionProofStatus: step.jobPositionProofStatus || "",
      plannedConditionBranch: step.conditionBranch || "",
      plannedProofBoundary: step.proofBoundary || "",
    },
  };
  if (stencil === "InclusiveGateway" || stencil === "ExclusiveGateway") {
    return base;
  }
  if (stencil === "QueryData") {
    const targetList = resolveContentListTargetList({ step, dataListMetas });
    const fields = Array.isArray(targetList?.fields) ? targetList.fields.slice(0, 12) : [];
    const mode = normalizeWorkflowQueryDataMode(step.queryMode) || "multiple_to_text_variable";
    const explicitFieldMap = parseWorkflowFieldMap(step.queryFieldMapping);
    const resultVariable = cleanResourceName(step.queryResultVariable)
      || (mode === "multiple_count_only" ? "" : workflowVariableIdFromName(step.nodeName || `Query result ${index + 1}`));
    const countVariable = cleanResourceName(step.queryCountVariable)
      || (!cleanResourceName(step.queryMode) || mode === "multiple_count_only"
        ? workflowVariableIdFromName(`${step.nodeName || `Query result ${index + 1}`} Count`)
        : "");
    base.properties = {
      ...base.properties,
      ...buildWorkflowQueryDataProperties({
        name: step.nodeName,
        mode,
        appId: 41,
        listSetId: stringId(rootListSetId),
        listId: stringId(targetList?.listId || rootListSetId),
        listType: 1,
        filters: buildPlannedWorkflowQueryFilters(step),
        sorts: parseWorkflowSorts(step.querySorts),
        resultVariable,
        countVariable,
        pageSize: numericPlanValue(step.queryPageSize),
        pageIndex: numericPlanValue(step.queryPageNumber),
        fieldMap: explicitFieldMap,
        fields: fields.map((field) => buildWorkflowQueryDataResultField(field)),
      }),
      plannedTargetListName: targetList?.listName || "",
      plannedWorkflowQueryMode: mode,
      plannedQueryComplexType: step.queryComplexType || "",
      plannedQueryDownstreamUse: step.queryDownstreamUse || "",
      plannedQuerySourceFieldTypes: Object.fromEntries(fields.map((field) => [
        cleanResourceName(field?.FieldName || field?.fieldName || field?.field),
        workflowVariableTypeFromSourceFieldType(field?.FieldType || field?.fieldType || field?.Type || field?.type),
      ]).filter(([fieldName]) => fieldName)),
    };
    return base;
  }
  if (stencil === "SetVariableTask") {
    const settings = buildPlannedWorkflowSetVariableAssignments(step, index);
    base.properties = {
      ...base.properties,
      formtype: "current",
      data: null,
      formids: "",
      variablesetting: settings,
      applicantuser: null,
    };
    return base;
  }
  if (stencil === "ContentList") {
    if (step.setDataListRecord) {
      const record = step.setDataListRecord;
      const targetList = record.targetMode === "current"
        ? null
        : dataListMetas.find((meta) => normKey(meta?.listName) === normKey(record.targetResource));
      if (!targetList?.listId) return base;
      base.properties = {
        ...base.properties,
        ...buildWorkflowSetDataListProperties({ record, target: targetList, rootListSetId, hostListId: "", workflowType: 2 }),
        plannedTargetListName: targetList.listName,
        plannedBatchSourceType: record.batchSourceType || "",
        plannedBatchSource: record.batchSource || "",
      };
      return base;
    }
    const targetList = resolveContentListTargetList({ step, dataListMetas });
    const operation = workflowContentListOperation(step);
    base.properties = {
      ...base.properties,
      type: operation,
      appid: 41,
      listsetid: stringId(rootListSetId),
      listid: stringId(targetList?.listId || rootListSetId),
      listtype: targetList?.listId ? "select" : "current",
      plannedTargetListName: targetList?.listName || "",
      listdatas: operation === "remove" ? [] : workflowContentListDefaultMappings(targetList),
    };
    if (operation === "edit" || operation === "remove") base.properties.wheres = [];
    return base;
  }
  const tasktype = workflowAssignmentTaskType(step);
  base.properties = {
    ...base.properties,
    pagetype: 1,
    taskurl: taskPageId,
    taskUrl: taskPageId,
    TaskUrl: taskPageId,
    approveway: "anyapprove",
    approvepercentage: 100,
    ...(tasktype ? { tasktype } : {}),
    duedatedefinition: 120,
    isenabledemail: false,
    isallowreassign: false,
    isallowsign: false,
    allowskip: true,
    usertaskassignment: workflowTaskAssigneesForStep(step),
  };
  return base;
}

export function buildPlannedWorkflowSetVariableAssignments(step, index) {
  const raw = cleanStructuredPlanCell(step?.setVariableAssignments);
  if (!raw) return [];
  return raw.split(/\s*;;\s*/).map((entry, assignmentIndex) => {
    const parts = entry.split(/\s*::\s*/);
    if (parts.length < 4) return null;
    const [id, type, name, ...valueParts] = parts;
    let value = [];
    try {
      value = JSON.parse(valueParts.join("::"));
    } catch {
      value = [];
    }
    return buildWorkflowVariableSetting({
      id: cleanResourceName(id),
      idx: cleanResourceName(id),
      name: cleanResourceName(name) || cleanResourceName(id) || `Set variable ${index + 1}.${assignmentIndex + 1}`,
      type: cleanResourceName(type) || "text",
      value,
    });
  }).filter((setting) => setting?.id && setting.value.length);
}

function workflowAssignmentTaskType(step) {
  const outcomes = cleanResourceName(step?.outcomes);
  if (/\bcompleted?\b/i.test(outcomes) && !/\bapproved?|rejected?\b/i.test(outcomes)) return "complete";
  return null;
}

function workflowContentListOperation(step) {
  const text = [step?.nodeName, step?.description, step?.dataReadWrite]
    .map(cleanResourceName)
    .join(" ");
  if (/\b(remove|delete)\b/i.test(text)) return "remove";
  if (/\b(update|edit)\b/i.test(text)) return "edit";
  return "add";
}

function workflowContentListDefaultMappings(targetList) {
  const fields = Array.isArray(targetList?.fields) ? targetList.fields : [];
  const titleField = fields.find((field) => String(field?.FieldName || field?.fieldName || "") === "Title") || fields[0];
  const column = cleanResourceName(titleField?.FieldName || titleField?.fieldName || "Title") || "Title";
  return [{
    Columns: column,
    Per: "0",
    Data: [{
      exprType: "variable",
      valueType: "text",
      id: "requestTitle",
      type: "expr",
      name: "Workflow Variables:Request Title",
    }],
  }];
}

function workflowVariableIdFromName(value) {
  const slug = slugify(cleanResourceName(value) || "workflow-variable").replace(/-/g, "_");
  return slug || "workflow_variable";
}

function buildWorkflowQueryDataResultField(field) {
  return {
    FieldID: stringId(field?.FieldID || field?.fieldId || field?.id || field?.fieldName || field?.FieldName),
    FieldName: cleanResourceName(field?.FieldName || field?.fieldName || field?.field || "Title"),
    DisplayName: cleanResourceName(field?.DisplayName || field?.displayName || field?.name || field?.FieldName || "Title"),
    Type: cleanResourceName(field?.Type || field?.type || field?.FieldType || field?.fieldType || "Text"),
  };
}

function workflowVariableTypeFromSourceFieldType(value) {
  const key = normKey(value);
  if (/user|identity/.test(key)) return "user";
  if (/date|time/.test(key)) return "date";
  if (/decimal|number|currency|percent|bigint/.test(key)) return "number";
  if (/bit|boolean/.test(key)) return "boolean";
  if (/file|image|upload/.test(key)) return "file";
  return "text";
}

function buildPlannedWorkflowQueryFilters(step) {
  const text = cleanResourceName(step?.queryFilters);
  if (!text || /^(none|n\/a|not applicable)$/i.test(text)) return [];
  const lookupMatch = text.match(/(?:ListDataID|record\s+id)\s*(?:=|equals?)\s*`?([A-Za-z][A-Za-z0-9_]*)`?/i);
  if (!lookupMatch || !/ListDataID|stored\s+target|target\s+record\s+id/i.test(text)) return [];
  const variableId = lookupMatch[1];
  return [{
    key: deterministicUuid(`workflow-query-filter:${step?.nodeName || "query"}:${variableId}`),
    pre: "and",
    left: "ListDataID",
    op: "0",
    right: [{
      exprType: "variable",
      valueType: "lookup",
      id: variableId,
      type: "expr",
      name: `Workflow Variables:${variableId}`,
    }],
    showCus: false,
  }];
}

function resolveContentListTargetList({ step, dataListMetas = [] }) {
  const metas = dataListMetas.filter((meta) => meta?.listId && meta?.listName);
  if (!metas.length) return null;
  const text = [
    step?.nodeName,
    step?.description,
    step?.dataReadWrite,
    step?.conditionBranch,
    step?.querySourceResource,
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
  const listref = [];
  const tempVars = [];
  for (const field of fields) {
    const id = String(field.fieldName || slugify(field.displayName));
    const variableType = approvalVariableType(field);
    const listRefId = variableType === "list" ? cleanResourceName(field.listRefId) || `${id}ListRef` : "";
    basic.push({
      id,
      idx: id,
      name: id,
      title: field.displayName,
      label: field.displayName,
      type: variableType,
      ...(listRefId ? { value: listRefId } : {}),
      source: field.fieldName,
    });
    if (listRefId) {
      listref.push({
        id: listRefId,
        idx: listRefId,
        name: `${field.displayName} Rows`,
        fields: (field.listFields || []).map((rowField, index) => {
          const rowFieldId = cleanResourceName(rowField.id || rowField.idx || rowField.fieldName) || `RowField${index + 1}`;
          return {
            id: rowFieldId,
            idx: cleanResourceName(rowField.idx) || rowFieldId,
            name: cleanResourceName(rowField.displayName || rowField.columnTitle || rowField.name || rowField.id) || `Column ${index + 1}`,
            type: approvalListRefFieldType(rowField.fieldType || rowField.type || rowField.controlType),
            editable: rowField.editable !== false,
          };
        }),
      });
    }
    for (const summary of field.listSummaries || []) {
      const tempId = summary?.binding?.prefix === "__temp_" ? cleanResourceName(summary?.binding?.value) : "";
      if (tempId) tempVars.push({ idx: deterministicUuid(`${id}:summary-temp:${tempId}`), id: tempId });
    }
  }
  return { basic: uniqueVariablesById(basic), listref: uniqueVariablesById(listref), filter: [], tempVars: uniqueVariablesById(tempVars) };
}

function approvalListRefFieldType(value) {
  const raw = normKey(value);
  if (/date|time/.test(raw)) return "date";
  if (/number|decimal|currency|amount|integer/.test(raw)) return "number";
  if (/boolean|bit|switch|yes no/.test(raw)) return "boolean";
  if (/user|identity|person/.test(raw)) return "user";
  return "text";
}

function addApprovalWorkflowActionVariables(variables, childshapes) {
  if (!variables || !Array.isArray(variables.basic)) return;
  const additions = [];
  const listrefAdditions = [];
  for (const shape of childshapes || []) {
    const stencil = String(shape?.stencil?.id || "");
    const props = shape?.properties || {};
    if (stencil === "QueryData") {
      const result = props.result || {};
      const listName = cleanResourceName(result.listName);
      const totalCount = cleanResourceName(result.totalCount);
      if (listName) {
        const isListResult = cleanResourceName(result.vartype) === "list";
        const listRefId = cleanResourceName(props.plannedQueryComplexType) || workflowVariableIdFromName(`${listName} row`);
        additions.push({
          id: listName,
          idx: listName,
          name: listName,
          title: `${cleanResourceName(props.name) || "Query Data"} Result`,
          type: cleanResourceName(result.vartype) || "text",
          ...(isListResult ? { value: listRefId } : {}),
          source: "workflow-query-result",
        });
        if (isListResult) {
          const fieldTypes = props.plannedQuerySourceFieldTypes || {};
          listrefAdditions.push({
            id: listRefId,
            idx: listRefId,
            name: cleanResourceName(props.plannedQueryComplexType) || `${cleanResourceName(props.name) || "Query Data"} Rows`,
            fields: Object.entries(result.fieldMap || {}).map(([sourceField, targetField]) => ({
              id: targetField,
              idx: targetField,
              name: targetField,
              type: cleanResourceName(fieldTypes[sourceField]) || "text",
              editable: true,
            })),
          });
        }
      }
      if (result.type === "single") {
        const fieldTypes = props.plannedQuerySourceFieldTypes || {};
        for (const [sourceField, targetVariable] of Object.entries(result.fieldMap || {})) {
          additions.push({
            id: targetVariable,
            idx: targetVariable,
            name: targetVariable,
            title: targetVariable,
            type: cleanResourceName(fieldTypes[sourceField]) || "text",
            source: "workflow-query-single-result",
          });
        }
      }
      if (totalCount) {
        additions.push({
          id: totalCount,
          idx: totalCount,
          name: totalCount,
          title: `${cleanResourceName(props.name) || "Query Data"} Count`,
          type: "number",
          source: "workflow-query-count",
        });
      }
    }
    if (stencil === "SetVariableTask") {
      for (const setting of Array.isArray(props.variablesetting) ? props.variablesetting : []) {
        const id = cleanResourceName(setting?.id || setting?.idx);
        if (!id) continue;
        additions.push({
          id,
          idx: cleanResourceName(setting?.idx) || id,
          name: cleanResourceName(setting?.name) || id,
          title: cleanResourceName(setting?.name) || id,
          type: cleanResourceName(setting?.type) || "text",
          source: "workflow-set-variable",
        });
      }
    }
  }
  variables.basic = uniqueVariablesById([...variables.basic, ...additions]);
  if (!Array.isArray(variables.listref)) variables.listref = [];
  variables.listref = uniqueVariablesById([...variables.listref, ...listrefAdditions]);
}

function uniqueVariablesById(variables) {
  const seen = new Set();
  const out = [];
  for (const variable of variables) {
    const key = canonicalApprovalVariableId(variable?.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(variable);
  }
  return out;
}

function approvalFormDef(id, title, role, fields = []) {
  const resource = buildApprovalFormLayoutDef({ rootDir: ROOT, id, title, role, fields });
  return ensureApprovalSubListColumnTitles(resource);
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
    approvalPlannedFieldType: field.fieldType,
    approvalPlannedControlType: field.controlType,
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
  if (role === "task" || field.readOnly === true) {
    control.readonly = true;
    control.readOnly = true;
    control.attrs.readonly = true;
    control.attrs.readOnly = true;
  }
  const dynamicDisplayRules = parsePlannedDynamicDisplayRules(field.dynamicDisplay, control.id);
  if (dynamicDisplayRules.length) control.attrs.control_display = dynamicDisplayRules;
  if (type === "radio" || type === "select") {
    control.attrs.displayStyle = "dropdown";
    control.attrs.choices = inferChoiceValues(field);
    control.attrs.color_choices = control.attrs.choices.map((value) => ({ value, key: deterministicUuid(`${control.id}-${value}`) }));
  }
  if (fullRow) control.attrs.common.grid = { position: [null, { cSpan: columns }, { cSpan: Math.min(columns, 2) }, { cSpan: 1 }] };
  return control;
}

function parsePlannedDynamicDisplayRules(value, controlId) {
  if (!value || isPlanningPlaceholder(value)) return [];
  try {
    const parsed = JSON.parse(cleanStructuredPlanCell(value));
    const rules = Array.isArray(parsed) ? parsed : [];
    return rules.map((rule) => ({ ...rule, controlId }));
  } catch {
    return [];
  }
}

function normalizeApprovalControlType(field) {
  return resolveSchemaAuthoritativeFormControlType(field);
}

function approvalVariableType(field) {
  return approvalVariableTypeForField(field);
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
    LayoutView: (type === 1 || type === 16) ? (layoutView || "") : "",
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
  return inferControlType(fieldType || "");
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
    ? parseChoiceOptionValues(parsed.choices)
    : [];
  const fromPlan = parseChoiceOptionValues(field?.choiceValues);
  const explicitValues = unique(fromRules.concat(fromPlan));
  if (explicitValues.length) return explicitValues;
  return unique(inferChoiceValues(field));
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
