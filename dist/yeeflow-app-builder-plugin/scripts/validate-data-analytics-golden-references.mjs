#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-analytics-golden-references.json");
const DASHBOARD_V11_TEMPLATE_ID = "dashboard-page-layouts-v1.1";
const DATA_LIST_FORM_NEW_EDIT_TEMPLATE_ID = "data_list_form_layout_new_edit_v1_1";
const DATA_LIST_FORM_VIEW_TEMPLATE_ID = "data_list_form_layout_view_item_v1_1";
const ANALYTICS_TYPES = new Set(["pie-chart", "bar-chart", "line-chart", "pivot-table"]);
const APPROVED_LAYOUT_V11_ANALYTICS_HOST_IDS = new Set(["content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
const RUNTIME_CATEGORY = "___Pivot___";
const CONTROL_KEY_BY_TYPE = {
  "pie-chart": "pie-chart",
  "bar-chart": "bar-chart",
  "line-chart": "line-chart",
  "pivot-table": "PivotTable",
};
const REQUIRED_GUIDANCE_KEYS = [
  "summary",
  "suitableSourceResourceTypes",
  "whenToUse",
  "whenNotToUse",
  "requiredBusinessSignals",
  "requiredAppPlanDeclaration",
  "generationProof",
  "proofBoundary",
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.appPlan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataAnalyticsGoldenReferences(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataAnalyticsGoldenReferences(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_ANALYTICS_REGISTRY_MISSING");
  const references = new Map(asArray(registry?.references).map((item) => [String(item?.templateId || ""), item]).filter(([id]) => id));
  validateRegistry(registry, references, findings, registryPath);

  if (options.resource) {
    const surface = String(options.surface || "dashboard");
    const resource = readJson(path.resolve(options.resource), findings, "DATA_ANALYTICS_RESOURCE_MISSING");
    validateResource(resource, { surface, pageTitle: path.basename(options.resource), findings, references });
  }

  let packageSummary = null;
  if (options.package) packageSummary = validatePackage(path.resolve(options.package), { findings, references });
  const appPlanPath = options.appPlan ? path.resolve(options.appPlan) : null;
  if (appPlanPath) validateAppPlanMaterialization(appPlanPath, { findings, references, packageSummary });

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    appPlan: appPlanPath,
    packageSummary: packageSummary ? summarizePackageAnalytics(packageSummary) : null,
    findings,
  };
}

function validateRegistry(registry, references, findings, registryPath) {
  if (!registry) return;
  const approved = new Set(asArray(registry.approvedTemplateIds).map(String));
  for (const id of approved) {
    if (!references.has(id)) {
      findings.push(error("DATA_ANALYTICS_REGISTRY_REFERENCE_MISSING", "Approved Data Analytics template ID must have a registry reference.", { templateId: id }));
    }
  }
  for (const reference of references.values()) {
    for (const key of REQUIRED_GUIDANCE_KEYS) {
      const value = reference[key];
      if (value === undefined || (Array.isArray(value) && value.length === 0) || String(value || "").trim() === "") {
        findings.push(error("DATA_ANALYTICS_REFERENCE_GUIDANCE_INCOMPLETE", "Data Analytics golden reference is missing required App Plan selection guidance.", { templateId: reference.templateId, missing: key }));
      }
    }
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_FILE_MISSING", "Data Analytics source template file is missing.", { templateId: reference.templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "DATA_ANALYTICS_TEMPLATE_PARSE_FAILED");
    const root = template?._ak_c || template;
    const index = indexResource(root);
    const wrapper = findByIdentity(index, reference.rootWrapperId);
    if (!wrapper) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_ROOT_MISSING", "Data Analytics template must include its declared root wrapper/control identity.", { templateId: reference.templateId, rootWrapperId: reference.rootWrapperId }));
    }
    if (reference.titleControlId && !findByIdentity(index, reference.titleControlId)) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_TITLE_MISSING", "Chart-with-title template must include its declared title Text control.", { templateId: reference.templateId, titleControlId: reference.titleControlId }));
    }
    const analyticsControls = index.entries.filter((entry) => ANALYTICS_TYPES.has(String(entry.node?.type || "")));
    if (!analyticsControls.some((entry) => String(entry.node?.type || "") === String(reference.controlType || ""))) {
      findings.push(error("DATA_ANALYTICS_TEMPLATE_CONTROL_TYPE_MISSING", "Data Analytics template must include the declared analytics control type.", { templateId: reference.templateId, expectedControlType: reference.controlType }));
    }
    for (const editableId of asArray(reference.editableRegions)) {
      if (!findByIdentity(index, editableId)) {
        findings.push(error("DATA_ANALYTICS_TEMPLATE_EDITABLE_REGION_MISSING", "Data Analytics template is missing a declared editable region.", { templateId: reference.templateId, editableRegion: editableId }));
      }
    }
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_ANALYTICS_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return null;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_ANALYTICS_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return null;
  }
  const resources = [];

  for (const page of collectDashboardPages(decoded)) {
    resources.push({ surface: "dashboard", title: page.title, resource: page.resource });
    validateResource(page.resource, { surface: "dashboard", pageTitle: page.title, findings: context.findings, references: context.references, listFieldsById: collectListFieldsById(decoded) });
  }
  for (const form of collectDataListForms(decoded)) {
    resources.push({ surface: "data-list-form", title: form.title, resource: form.resource });
    validateResource(form.resource, { surface: "data-list-form", pageTitle: form.title, findings: context.findings, references: context.references, listFieldsById: collectListFieldsById(decoded) });
  }
  for (const form of collectApprovalForms(decoded)) {
    resources.push({ surface: "approval-form", title: form.title, resource: form.resource });
    validateResource(form.resource, { surface: "approval-form", pageTitle: form.title, findings: context.findings, references: context.references });
  }
  return collectPackageAnalytics(resources, context.references);
}

function collectPackageAnalytics(resources, references) {
  const byTemplateId = new Map([...references.keys()].map((id) => [id, []]));
  const occurrences = [];
  for (const resourceInfo of resources) {
    const index = indexResource(resourceInfo.resource);
    for (const entry of index.entries) {
      const type = String(entry.node?.type || "");
      const candidateIds = templateIdCandidates(entry.node).filter((id) => references.has(id));
      if (!ANALYTICS_TYPES.has(type) && !candidateIds.length) continue;
      const provenance = resolveTemplateProvenance(entry, index, references);
      const templateId = provenance.templateId || candidateIds[0] || "";
      if (!templateId || !references.has(templateId)) continue;
      const occurrence = {
        templateId,
        surface: resourceInfo.surface,
        pageTitle: resourceInfo.title,
        path: entry.pointer,
        type,
      };
      occurrences.push(occurrence);
      if (!byTemplateId.has(templateId)) byTemplateId.set(templateId, []);
      byTemplateId.get(templateId).push(occurrence);
    }
  }
  return { occurrences, byTemplateId };
}

function validateAppPlanMaterialization(appPlanPath, context) {
  if (!fs.existsSync(appPlanPath)) {
    context.findings.push(error("DATA_ANALYTICS_APP_PLAN_MISSING", "App Plan file is missing.", { appPlan: appPlanPath }));
    return;
  }
  const planText = fs.readFileSync(appPlanPath, "utf8");
  const planned = collectPlannedDataAnalyticsTemplates(planText, context.references);
  if (!planned.length) return;
  if (!context.packageSummary) {
    context.findings.push(error("DATA_ANALYTICS_PACKAGE_REQUIRED_FOR_APP_PLAN", "App Plan declares Data Analytics templates, so package validation is required.", { appPlan: appPlanPath, plannedCount: planned.length }));
    return;
  }
  for (const record of planned) {
    if (record.surface && /approval/i.test(record.surface)) {
      context.findings.push(error("DATA_ANALYTICS_APPROVAL_FORM_PLANNED", "App Plan must not assign Data Analytics templates to Approval forms.", record));
      continue;
    }
    const occurrences = context.packageSummary.byTemplateId.get(record.templateId) || [];
    if (!occurrences.length) {
      context.findings.push(error("DATA_ANALYTICS_PLANNED_TEMPLATE_NOT_MATERIALIZED", "App Plan selected a Data Analytics golden reference, but the generated package does not materialize that template.", record));
      continue;
    }
    if (record.dashboardPage) {
      const pageMatches = occurrences.some((occurrence) => dashboardNameMatches(record.dashboardPage, occurrence.pageTitle));
      if (!pageMatches) {
        context.findings.push(error("DATA_ANALYTICS_PLANNED_TEMPLATE_PAGE_MISMATCH", "Generated package contains the Data Analytics template, but not on the planned Dashboard/Data List form surface.", { ...record, actualPages: occurrences.map((item) => item.pageTitle) }));
      }
    }
  }
}

function collectPlannedDataAnalyticsTemplates(planText, references) {
  const records = [];
  const lines = String(planText || "").split(/\r?\n/);
  let currentDashboardPage = "";
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^###\s+\d+\.[x0-9]+\s+(.+?)\s*$/i);
    if (heading) currentDashboardPage = cleanMarkdownCell(heading[1]);
    if (!isTableLine(lines[index]) || !isTableLine(lines[index + 1] || "") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = splitTableLine(lines[index]);
    const normalizedHeaders = headers.map(normKey);
    const templateColumn = findHeaderIndex(normalizedHeaders, [
      "selected data analytics template",
      "data analytics template",
      "selected analytics template",
      "analytics template",
    ]);
    if (templateColumn === -1) continue;
    const pageColumn = findHeaderIndex(normalizedHeaders, ["dashboard page", "dashboard page name", "page name", "custom form", "form name"]);
    const surfaceColumn = findHeaderIndex(normalizedHeaders, ["surface", "usage surface", "page type", "form usage"]);
    const sectionColumn = findHeaderIndex(normalizedHeaders, ["analytics region", "section", "section name", "region"]);
    const sourceColumn = findHeaderIndex(normalizedHeaders, ["source resource", "data source", "source data", "source"]);
    let rowIndex = index + 2;
    while (rowIndex < lines.length && isTableLine(lines[rowIndex])) {
      const cells = splitTableLine(lines[rowIndex]);
      const raw = lines[rowIndex];
      const templateId = extractApprovedDataAnalyticsTemplateId(raw, references);
      if (templateId) {
        records.push({
          templateId,
          dashboardPage: cleanMarkdownCell(cells[pageColumn]) || currentDashboardPage,
          surface: surfaceColumn === -1 ? "" : cleanMarkdownCell(cells[surfaceColumn]),
          analyticsRegion: sectionColumn === -1 ? "" : cleanMarkdownCell(cells[sectionColumn]),
          sourceResource: sourceColumn === -1 ? "" : cleanMarkdownCell(cells[sourceColumn]),
          raw: raw.trim(),
        });
      }
      rowIndex += 1;
    }
    index = rowIndex;
  }
  return records;
}

function extractApprovedDataAnalyticsTemplateId(text, references) {
  for (const templateId of references.keys()) {
    const escaped = templateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(String(text || ""))) return templateId;
  }
  return "";
}

function summarizePackageAnalytics(summary) {
  return {
    occurrenceCount: summary.occurrences.length,
    byTemplateId: Object.fromEntries([...summary.byTemplateId.entries()].map(([id, items]) => [id, items.length])),
  };
}

function validateResource(resource, context) {
  if (!isObject(resource)) {
    context.findings.push(error("DATA_ANALYTICS_RESOURCE_INVALID", "Resource must parse as an object.", { page: context.pageTitle, surface: context.surface }));
    return;
  }
  const index = indexResource(resource);
  validateUnknownTemplateMarkers(index, context);
  const analyticsControls = index.entries.filter((entry) => ANALYTICS_TYPES.has(String(entry.node?.type || "")));
  if (!analyticsControls.length) return;

  if (context.surface === "approval-form") {
    for (const entry of analyticsControls) {
      context.findings.push(error("DATA_ANALYTICS_APPROVAL_FORM_FORBIDDEN", "Data Analytics templates must not be used on Approval forms.", { page: context.pageTitle, path: entry.pointer, type: entry.node?.type }));
    }
    return;
  }

  const isDashboardV11 = context.surface === "dashboard" && resourceHasIdentity(resource, DASHBOARD_V11_TEMPLATE_ID);
  const isDataListFormNewEdit = context.surface === "data-list-form" && resourceHasIdentity(resource, DATA_LIST_FORM_NEW_EDIT_TEMPLATE_ID);
  const isDataListFormView = context.surface === "data-list-form" && resourceHasIdentity(resource, DATA_LIST_FORM_VIEW_TEMPLATE_ID);
  for (const entry of analyticsControls) {
    const provenance = resolveTemplateProvenance(entry, index, context.references);
    if (!provenance.templateId) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_PROVENANCE_MISSING", "Every Data Analytics control must carry or inherit one approved Data Analytics golden reference template ID.", { page: context.pageTitle, path: entry.pointer, type: entry.node?.type }));
      continue;
    }
    const reference = context.references.get(provenance.templateId);
    if (!reference) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_UNKNOWN", "Data Analytics control references an unapproved template ID.", { page: context.pageTitle, path: entry.pointer, templateId: provenance.templateId }));
      continue;
    }
    if (String(entry.node?.type || "") !== String(reference.controlType || "")) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_CONTROL_TYPE_MISMATCH", "Generated Data Analytics control type must match the selected golden reference.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, expectedControlType: reference.controlType, actualControlType: entry.node?.type }));
    }
    if (reference.rootWrapperId && !findNearestAncestorByIdentity(entry, reference.rootWrapperId, true)) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_WRAPPER_MISSING", "Generated Data Analytics control must live inside the full approved template wrapper/control subtree, not a simplified lookalike.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, rootWrapperId: reference.rootWrapperId }));
    }
    if (reference.titleControlId && !findByIdentity(index, reference.titleControlId)) {
      context.findings.push(error("DATA_ANALYTICS_TEMPLATE_TITLE_CONTROL_MISSING", "Chart-with-title templates must include the approved title Text control.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, titleControlId: reference.titleControlId }));
    }
    validateGeneratedTemplateContract(entry, reference, context);
    if (isDataListFormNewEdit) {
      context.findings.push(error("DATA_ANALYTICS_DATA_LIST_FORM_NEW_EDIT_FORBIDDEN", "Data Analytics templates must not be used on Data List Form Layouts v1.1 New/Edit forms.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId }));
    }
    if (isDashboardV11 && !hasAncestorInSet(entry, APPROVED_LAYOUT_V11_ANALYTICS_HOST_IDS)) {
      context.findings.push(error("DATA_ANALYTICS_DASHBOARD_V11_SECTION_PLACEMENT_INVALID", "Dashboard Page Layouts v1.1 Data Analytics templates must be placed inside content_card_wrapper, 2_columns_section, 3_columns_section, or 2_columns_60/40_section.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, approvedSectionContainers: [...APPROVED_LAYOUT_V11_ANALYTICS_HOST_IDS] }));
    }
    if (isDataListFormView && !hasAncestorInSet(entry, APPROVED_LAYOUT_V11_ANALYTICS_HOST_IDS)) {
      context.findings.push(error("DATA_ANALYTICS_DATA_LIST_FORM_VIEW_V11_SECTION_PLACEMENT_INVALID", "Data List Form Layouts v1.1 View Item Data Analytics templates must be placed inside content_card_wrapper, 2_columns_section, 3_columns_section, or 2_columns_60/40_section.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, approvedSectionContainers: [...APPROVED_LAYOUT_V11_ANALYTICS_HOST_IDS] }));
    }
    validateRuntimeBinding(resource, entry, reference, context);
  }
}

function validateRuntimeBinding(resource, entry, reference, context) {
  const controlId = analyticsControlId(entry.node);
  if (!controlId) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_CONTROL_ID_MISSING", "Data Analytics controls must have a stable control id for runtime ReportIds/exts binding.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, type: entry.node?.type }));
    return;
  }
  const reportIds = new Set(asArray(resource.ReportIds).map((value) => String(value || "")));
  if (!reportIds.has(controlId)) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_REPORT_ID_MISSING", "Data Analytics control id must be registered in Resource.ReportIds[].", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId }));
  }
  const exts = asArray(resource.exts);
  const ext = exts.find((item) => String(item?.i || "") === controlId);
  if (!ext) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_EXT_MISSING", "Data Analytics control must have a matching Resource.exts[] runtime chart/pivot entry.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId }));
    return;
  }
  const expectedKey = CONTROL_KEY_BY_TYPE[String(reference.controlType || entry.node?.type || "")] || String(reference.controlType || "");
  if (String(ext.category || "") !== RUNTIME_CATEGORY || String(ext.key || "") !== expectedKey) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_EXT_MISMATCH", "Data Analytics runtime ext must use category ___Pivot___, the expected chart/pivot key, and i equal to the control id.", {
      page: context.pageTitle,
      path: entry.pointer,
      templateId: reference.templateId,
      controlId,
      expectedCategory: RUNTIME_CATEGORY,
      expectedKey,
      actualCategory: ext.category,
      actualKey: ext.key,
      actualI: ext.i,
    }));
  }
  const attr = isObject(ext.attr) ? ext.attr : {};
  const settings = isObject(attr.settings) ? attr.settings : {};
  const listId = String(attr.ListID || attr.listId || attr.listID || "");
  const listSetId = String(attr.ListSetID || attr.listSetId || attr.appListSetID || "");
  const appId = String(attr.AppID || attr.appId || "");
  if (!appId || !listId || !listSetId) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_SOURCE_METADATA_MISSING", "Data Analytics runtime ext must include AppID, ListID, and ListSetID source metadata.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId, appId, listId, listSetId }));
  }
  if (String(reference.controlType || "") !== "pivot-table" && !String(attr.chartType || "").trim()) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_CHART_TYPE_MISSING", "Chart runtime ext must include attr.chartType.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId }));
  }
  const rows = asArray(settings.rows);
  const values = asArray(settings.values);
  if (!rows.length) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_ROWS_MISSING", "Data Analytics runtime settings.rows[] must include at least one source field.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId }));
  }
  if (!values.length) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_VALUES_MISSING", "Data Analytics runtime settings.values[] must include at least one aggregate/value field.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId }));
  }
  const sourceFields = context.listFieldsById?.get(listId) || null;
  if (sourceFields) {
    for (const ref of [...rows, ...asArray(settings.columns), ...values].flatMap(runtimeFieldRefs)) {
      if (!sourceFields.has(ref)) {
        context.findings.push(error("DATA_ANALYTICS_RUNTIME_FIELD_UNRESOLVED", "Data Analytics runtime settings field reference must resolve to a field on the source list.", { page: context.pageTitle, path: entry.pointer, templateId: reference.templateId, controlId, listId, field: ref }));
      }
    }
  }
  validateRuntimeModelSurfaceAlignment({ entry, reference, context, controlId, rows, values, settings });
}

function validateGeneratedTemplateContract(entry, reference, context) {
  const dataAnalyticsTemplateIds = [entry.node?.dataAnalyticsTemplateId, entry.node?.attrs?.dataAnalyticsTemplateId].filter(hasText).map(String);
  const templateIds = [entry.node?.templateId, entry.node?.attrs?.templateId].filter(hasText).map(String);
  if (!dataAnalyticsTemplateIds.length || !templateIds.length || dataAnalyticsTemplateIds.some((id) => id !== reference.templateId) || templateIds.some((id) => id !== reference.templateId)) {
    context.findings.push(error("DATA_ANALYTICS_TEMPLATE_ID_CONTRACT_MISSING", "Generated Data Analytics controls must carry both dataAnalyticsTemplateId and templateId equal to the approved golden reference ID.", {
      page: context.pageTitle,
      path: entry.pointer,
      templateId: reference.templateId,
      dataAnalyticsTemplateIds,
      controlTemplateIds: templateIds,
    }));
  }
  const runtimeModelProven = entry.node?.runtimeModelProven === true || entry.node?.attrs?.runtimeModelProven === true;
  if (!runtimeModelProven) {
    context.findings.push(error("DATA_ANALYTICS_RUNTIME_MODEL_PROVEN_MISSING", "Generated Data Analytics controls must explicitly declare runtimeModelProven only after the wrapper, ReportIds, exts, source fields, and cross-surface model contract are materialized.", {
      page: context.pageTitle,
      path: entry.pointer,
      templateId: reference.templateId,
    }));
  }
}

function validateRuntimeModelSurfaceAlignment({ entry, reference, context, controlId, rows, values, settings }) {
  const runtimeCategoryFields = new Set(rows.flatMap(primaryRuntimeFieldRefs));
  const runtimeValueFields = new Set(values.flatMap(primaryRuntimeFieldRefs));
  const surfaces = collectAnalyticsModelSurfaceRefs(entry.node);
  const allRuntimeRefs = [...rows, ...asArray(settings.columns), ...values].flatMap(runtimeFieldRefs);
  for (const field of [...allRuntimeRefs, ...surfaces.categoryFields, ...surfaces.valueFields]) {
    if (/_COUNT\b/i.test(String(field || ""))) {
      context.findings.push(error("DATA_ANALYTICS_RUNTIME_DERIVED_FIELD_ID_INVALID", "Data Analytics runtime models must use real source fields plus aggregate metadata, not derived field IDs such as ListDataID_COUNT.", {
        page: context.pageTitle,
        path: entry.pointer,
        templateId: reference.templateId,
        controlId,
        field,
      }));
    }
  }
  for (const field of surfaces.categoryFields) {
    if (runtimeCategoryFields.size && !runtimeCategoryFields.has(field)) {
      context.findings.push(error("DATA_ANALYTICS_RUNTIME_MODEL_SURFACE_MISMATCH", "Data Analytics category/grouping surfaces must match Resource.exts[].attr.settings.rows[].", {
        page: context.pageTitle,
        path: entry.pointer,
        templateId: reference.templateId,
        controlId,
        field,
        runtimeRows: [...runtimeCategoryFields],
      }));
    }
  }
  for (const field of surfaces.valueFields) {
    if (runtimeValueFields.size && !runtimeValueFields.has(field)) {
      context.findings.push(error("DATA_ANALYTICS_RUNTIME_MODEL_SURFACE_MISMATCH", "Data Analytics value/measure surfaces must match Resource.exts[].attr.settings.values[].", {
        page: context.pageTitle,
        path: entry.pointer,
        templateId: reference.templateId,
        controlId,
        field,
        runtimeValues: [...runtimeValueFields],
      }));
    }
  }
}

function collectAnalyticsModelSurfaceRefs(node) {
  const attrs = isObject(node?.attrs) ? node.attrs : {};
  const data = isObject(attrs.data) ? attrs.data : {};
  const model = isObject(attrs.model) ? attrs.model : {};
  const categoryFields = [
    data.groupBy,
    data.axisField,
    data.categoryField,
    model.categoryField,
    ...asArray(attrs.series).map((item) => item?.categoryField),
  ].filter((value) => value !== undefined && value !== null && String(value).trim()).map(String);
  const valueFields = [
    data.valueField,
    model.valueField,
    ...asArray(attrs.series).map((item) => item?.valueField),
    ...asArray(attrs.values).flatMap(primaryRuntimeFieldRefs),
  ].filter((value) => value !== undefined && value !== null && String(value).trim()).map(String);
  return {
    categoryFields: uniqueStrings(categoryFields),
    valueFields: uniqueStrings(valueFields),
  };
}

function analyticsControlId(node) {
  return String(node?.id || node?.attrs?.id || "");
}

function runtimeFieldRefs(value) {
  if (Array.isArray(value)) return value.flatMap(runtimeFieldRefs);
  if (!isObject(value)) return [];
  return [
    value.FieldName,
    value.fieldName,
    value.field,
    value.id,
    value.name,
  ].filter((item) => item !== undefined && item !== null && String(item).trim()).map(String);
}

function primaryRuntimeFieldRefs(value) {
  if (Array.isArray(value)) return value.flatMap(primaryRuntimeFieldRefs);
  if (!isObject(value)) return [];
  return [
    value.FieldName,
    value.fieldName,
    value.field,
    value.id,
    value.name,
  ].filter((item) => item !== undefined && item !== null && String(item).trim()).map(String).slice(0, 1);
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "")).filter(Boolean))];
}

function collectListFieldsById(decoded) {
  const map = new Map();
  for (const child of asArray(decoded?.Childs || decoded?.Data?.Childs)) {
    const list = child?.List || child?.ListModel || child;
    const listId = String(list?.ListID || child?.ListID || "");
    if (!listId) continue;
    const fields = new Set(["ListDataID", "Title"]);
    for (const field of asArray(list?.Defs || child?.Defs || child?.Fields || list?.Fields)) {
      for (const key of ["FieldName", "fieldName", "Name", "name", "InternalName", "FieldID", "fieldId", "ID", "id"]) {
        if (field?.[key]) fields.add(String(field[key]));
      }
    }
    map.set(listId, fields);
  }
  return map;
}

function validateUnknownTemplateMarkers(index, context) {
  for (const entry of index.entries) {
    for (const candidate of templateIdCandidates(entry.node)) {
      if (/^data_analytics_/.test(candidate) && !context.references.has(candidate)) {
        context.findings.push(error("DATA_ANALYTICS_TEMPLATE_UNKNOWN", "Resource contains an unapproved Data Analytics template ID.", { page: context.pageTitle, path: entry.pointer, templateId: candidate }));
      }
    }
  }
}

function collectDashboardPages(decoded) {
  const pages = [];
  for (const [index, page] of asArray(decoded?.Pages).entries()) {
    const resource = parseResource(page?.LayoutInResources?.[0]?.Resource || page?.Resource || page?.LayoutView);
    if (resource) pages.push({ title: page?.Title || page?.Name || `Pages[${index}]`, resource });
  }
  return pages;
}

function collectDataListForms(decoded) {
  const forms = [];
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    for (const [layoutIndex, layout] of asArray(child?.Layouts).entries()) {
      for (const [resourceIndex, layoutResource] of asArray(layout?.LayoutInResources).entries()) {
        const resource = parseResource(layoutResource?.Resource);
        if (resource) forms.push({ title: `${child?.Title || child?.Name || `Childs[${childIndex}]`} / ${layout?.Title || layout?.Name || `Layouts[${layoutIndex}]`} / ${resourceIndex}`, resource });
      }
    }
  }
  return forms;
}

function collectApprovalForms(decoded) {
  const forms = [];
  for (const [index, form] of asArray(decoded?.Forms || decoded?.FormNewReports).entries()) {
    const candidates = [
      form?.LayoutInResources?.[0]?.Resource,
      form?.DefResource,
      form?.Resource,
      form?.LayoutView,
    ];
    for (const candidate of candidates) {
      const resource = parseResource(candidate);
      if (resource) forms.push({ title: form?.Title || form?.Name || `ApprovalForm[${index}]`, resource });
    }
  }
  return forms;
}

function parseResource(value) {
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  if (isObject(value)) return value;
  return null;
}

function indexResource(resource) {
  const entries = [];
  const parentByPointer = new Map();
  const entryByPointer = new Map();
  function visit(node, pointer, parentPointer) {
    if (!isObject(node)) return;
    const entry = { node, pointer, parentPointer, index: null };
    entries.push(entry);
    entryByPointer.set(pointer, entry);
    if (parentPointer) parentByPointer.set(pointer, parentPointer);
    for (const [key, child] of Object.entries(node)) {
      if (Array.isArray(child)) child.forEach((item, index) => visit(item, `${pointer}.${key}[${index}]`, pointer));
      else if (isObject(child) && key !== "attrs") visit(child, `${pointer}.${key}`, pointer);
    }
  }
  visit(resource, "$", null);
  const index = { entries, parentByPointer, entryByPointer };
  for (const entry of entries) entry.index = index;
  return index;
}

function resolveTemplateProvenance(entry, index, references) {
  const approved = new Set(references.keys());
  let current = entry;
  while (current) {
    const id = templateIdFromNode(current.node, approved);
    if (id) return { templateId: id, sourcePointer: current.pointer };
    current = index.entryByPointer.get(index.parentByPointer.get(current.pointer));
  }
  return {};
}

function templateIdFromNode(node, approved) {
  const candidates = templateIdCandidates(node);
  return candidates.find((candidate) => approved.has(candidate)) || candidates.find((candidate) => /^data_analytics_/.test(candidate)) || "";
}

function templateIdCandidates(node) {
  return [
    node?.dataAnalyticsTemplateId,
    node?.analyticsTemplateId,
    node?.templateId,
    node?.derivedFromDataAnalyticsGoldenReference,
    node?.derivedFromGoldenReference,
    node?.attrs?.dataAnalyticsTemplateId,
    node?.attrs?.analyticsTemplateId,
    node?.attrs?.templateId,
    node?.attrs?.derivedFromDataAnalyticsGoldenReference,
    node?.attrs?.derivedFromGoldenReference,
    node?.attrs?.provenance?.dataAnalyticsTemplateId,
  ].map((value) => String(value || ""));
}

function findNearestAncestorByIdentity(entry, identity, includeSelf = false) {
  let current = includeSelf ? entry : null;
  if (!current) return null;
  while (current) {
    if (resourceHasIdentity(current.node, identity)) return current;
    current = current.index?.entryByPointer?.get(current.index?.parentByPointer?.get(current.pointer));
  }
  return null;
}

function hasAncestorInSet(entry, identitySet) {
  let current = entry;
  while (current) {
    if (identityCandidates(current.node).some((id) => identitySet.has(id))) return true;
    current = current.index?.entryByPointer?.get(current.index?.parentByPointer?.get(current.pointer));
  }
  return false;
}

function findByIdentity(index, identity) {
  return index.entries.find((entry) => identityCandidates(entry.node).includes(identity)) || null;
}

function resourceHasIdentity(node, identity) {
  return identityCandidates(node).includes(identity) || JSON.stringify([
    node?.derivedFromDashboardPageLayoutTemplate,
    node?.attrs?.derivedFromDashboardPageLayoutTemplate,
    node?.templateId,
    node?.attrs?.templateId,
  ]).includes(identity);
}

function identityCandidates(node) {
  if (!isObject(node)) return [];
  const attrs = isObject(node.attrs) ? node.attrs : {};
  return [
    node.id,
    node.name,
    node.label,
    node.nv_label,
    node.nav_label,
    node.key,
    node.title,
    attrs.id,
    attrs.name,
    attrs.label,
    attrs.nv_label,
    attrs.nav_label,
    attrs.key,
    attrs.title,
    attrs?.common?.name,
    attrs?.common?.nv_label,
  ].filter((value) => value !== undefined && value !== null).map(String);
}

function dashboardNameMatches(left, right) {
  if (!left || !right) return false;
  const normalizedLeft = normKey(left);
  const normalizedRight = normKey(right);
  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function findHeaderIndex(normalizedHeaders, candidates) {
  const normalizedCandidates = candidates.map(normKey);
  return normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
}

function isTableLine(line) {
  return /^\s*\|.+\|\s*$/.test(line || "");
}

function splitTableLine(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cleanMarkdownCell(cell));
}

function cleanMarkdownCell(value) {
  return String(value || "").replace(/`/g, "").replace(/\*\*/g, "").trim();
}

function normKey(value) {
  return cleanMarkdownCell(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

function readJson(filePath, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not read JSON: ${err.message}`, { path: filePath }));
    return null;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") args.help = true;
    else if (token === "--registry") args.registry = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : REGISTRY_PATH;
    else if (token === "--resource") args.resource = argv[++index];
    else if (token === "--surface") args.surface = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else if (token === "--plan" || token === "--app-plan") args.appPlan = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-data-analytics-golden-references.mjs --registry
  node scripts/validate-data-analytics-golden-references.mjs --resource <resource.json> --surface <dashboard|data-list-form|approval-form>
  node scripts/validate-data-analytics-golden-references.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]`);
}

function error(code, message, data = {}) {
  return { level: "error", code, message, ...data };
}
