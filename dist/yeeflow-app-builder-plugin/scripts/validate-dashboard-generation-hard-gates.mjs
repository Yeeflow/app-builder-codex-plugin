#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk, walk } from "./lib/yapk-decode-utils.mjs";
import { validateGeneratedFinalResourceCompleteness } from "./validate-generated-final-resource-completeness.mjs";
import { validateDashboardGoldenReferenceConformance } from "./validate-dashboard-golden-reference-conformance.mjs";
import { validateDashboardPageLayoutTemplate } from "./validate-dashboard-page-layout-template.mjs";
import { validateDashboardDatasetPresentationGoldenReferences } from "./validate-dashboard-dataset-presentation-golden-references.mjs";

const FILTER_TYPES = new Set(["select-filter", "radio-filter", "checkbox-filter"]);
const SEARCH_FILTER_TYPE = "search-filter";
const RECORD_DISPLAY_FIELD = "ListDataID";
const CONTAINER_WIDTH_CODES = new Set(["1", "2", "3"]);
const NUMERIC_AGG_FUNCS = new Set(["SUM", "AVG", "AVERAGE", "MIN", "MAX"]);
const DASHBOARD_DATASET_TEMPLATE_ROOT_IDS = new Set([
  "grid_table_col_wrapper",
  "grid_table_col_multiselect_wrapper",
  "card_with_multiselect_toolbar_wrapper",
  "collection_control_responsive_card_wrapper",
  "Event Pipeline Grid-Table",
]);
const APPROVED_DATA_TABLE_TEMPLATE_IDS = new Set([
  "data_table_control_standard_scroll",
  "data_table_control_standard_no_scroll",
  "data_table_control_caption_scroll",
]);
const APPROVED_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS = new Set([
  "dashboard-page-layouts-v1.1",
  "dashboard-page-layouts-workbench",
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
]);
const MASTER_DETAIL_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS = new Set([
  "dashboard-page-layouts-two-panel-workspace",
  "dashboard-page-layouts-three-panel-workspace",
]);
const PAGE_LAYOUT_STRUCTURAL_CONTAINER_IDS = new Set([
  "Main",
  "main",
  "Content",
  "content",
  "page_title_section",
  "page_title_header",
  "page_title_content",
  "Operations",
  "section_title_area",
  "section_title_header",
  "section_content_area",
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
  "main_work_queue_section",
  "main_work_queue_wrapper",
  "primary_working_area",
  "right_side_panel",
  "content_panel_empty",
  "chart_cards_section",
  "dashboard_standard_filter_group",
  "kpi_metrics_wrapper",
  "kpi_cards_kpi_row",
  "kpi_card_wrapper",
  "kpi_card_content_main",
  "kpi_card_icon_container",
  "kpi_card_summary_content",
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.package && !args.report)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDashboardGenerationHardGates(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDashboardGenerationHardGates(options = {}) {
  const findings = [];
  let decoded = null;
  let packagePath = null;

  if (options.package) {
    packagePath = path.resolve(options.package);
    if (!fs.existsSync(packagePath)) {
      findings.push(error("YAPK_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    } else {
      try {
        ({ decoded } = readDecodedYapk(packagePath));
        validateDecodedDashboards(decoded, findings);
      } catch (decodeError) {
        findings.push(error("YAPK_RESOURCE_DECODE_FAILED", `Could not decode package Resource: ${decodeError.message}`, { package: packagePath }));
      }
    }
  }

  if (options.report) validateReportIdentity(options.report, decoded, findings);
  if (options.plan && options.package) {
    const completeness = validateGeneratedFinalResourceCompleteness({ plan: options.plan, package: options.package });
    for (const finding of completeness.findings || []) {
      if (/^GENERATED_FINAL_DASHBOARD_/.test(finding.code || "")) findings.push(finding);
    }
  }
  if (options.package) {
    const golden = validateDashboardGoldenReferenceConformance({ package: options.package });
    findings.push(...asArray(golden.findings));
    const pageLayout = validateDashboardPageLayoutTemplate({ package: options.package, appPlan: options.plan });
    findings.push(...asArray(pageLayout.findings));
    const datasetPresentation = validateDashboardDatasetPresentationGoldenReferences({ package: options.package, appPlan: options.plan });
    findings.push(...asArray(datasetPresentation.findings));
  }

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    package: packagePath,
    appPlan: options.plan ? path.resolve(options.plan) : null,
    report: options.report ? path.resolve(options.report) : null,
    canonicalApplication: decoded?.ListSet?.ListID ? { listSetId: String(decoded.ListSet.ListID) } : null,
    findings,
  };
}

function validateDecodedDashboards(decoded, findings) {
  const listIndex = buildListIndex(decoded);
  for (const page of collectDashboardPages(decoded)) {
    for (const entry of page.controls) {
      validateDesignerNavigatorLabel(entry, page, findings);
      validateVisibleTextExpression(entry, page, findings);
      if (FILTER_TYPES.has(String(entry.control?.type || "")) && !isMasterDetailLeftPanelFilter(entry, page)) validateFilter(entry, page, listIndex, findings);
      if (String(entry.control?.type || "") === SEARCH_FILTER_TYPE) validateSearchFilter(entry, page, findings);
      if (String(entry.control?.type || "") === "container") validateContainer(entry, page, findings);
    }
    validateDashboardBusinessRuntime(page, listIndex, findings);
    validateKpiCards(page, findings);
    validateKpiTempVarReferences(page, findings);
    validateSummaryBindings(page, listIndex, findings);
    validateMasterDetailWorkspaceItemSemantics(page, findings);
  }
}

function validateDashboardBusinessRuntime(page, listIndex, findings) {
  const collections = page.controls.filter((entry) => String(entry.control?.type || "") === "collection");
  const dataTables = page.controls.filter((entry) => ["data-table", "datatable", "data-list"].includes(String(entry.control?.type || "")));
  const filters = page.controls.filter((entry) => FILTER_TYPES.has(String(entry.control?.type || "")));
  const kpiCards = page.controls.filter((entry) => isKpiCard(entry.control));
  const summaries = page.controls.filter((entry) => String(entry.control?.type || "") === "summary");

  for (const entry of dataTables) {
    if (hasApprovedDataTableTemplateProvenance(entry.control)) continue;
    findings.push(error("DASH_RECORD_REGION_COLLECTION_REQUIRED", "Dashboard record-list regions must use Collection/grid-table structures unless a plan explicitly exempts the page; Data table/data-list lookalikes are not the default golden dashboard record pattern.", {
      page: page.title,
      path: entry.pointer,
      type: entry.control?.type,
    }));
  }

  if (kpiCards.length && !summaries.length) {
    findings.push(error("DASH_KPI_SUMMARY_CONTROL_REQUIRED", "Visible KPI cards require Summary controls, ReportIds, tempVars, exts, and visible value bindings; static KPI cards cannot pass generated-final dashboard quality gates.", {
      page: page.title,
      path: page.pointer,
      kpiCount: kpiCards.length,
    }));
  }

  for (const filter of filters) {
    if (isMasterDetailLeftPanelFilter(filter, page)) continue;
    if (!collections.some((collection) => filterConsumedByCollection(filter, collection))) {
      findings.push(error("DASH_FILTER_COLLECTION_BINDING_MISSING", "Every dashboard filter must be consumed by at least one Collection query/filter contract; visual filter controls alone do not prove runtime linkage.", {
        page: page.title,
        path: filter.pointer,
        filterName: filter.control?.name || filter.control?.id || filter.control?.attrs?.nv_label || null,
      }));
    }
  }

  validatePageTitleSectionPurity(page, findings);
  validateNonEmptyBusinessSections(page, findings);
  validateIndependentContentCardWrappers(page, collections, findings);
  validateDynamicUserFieldTypes(page, listIndex, findings);
}

function hasApprovedDataTableTemplateProvenance(control) {
  const candidates = [
    control?.templateId,
    control?.dataTableTemplateId,
    control?.attrs?.templateId,
    control?.attrs?.dataTableTemplateId,
  ].filter(Boolean).map(String);
  return candidates.some((candidate) => APPROVED_DATA_TABLE_TEMPLATE_IDS.has(candidate));
}

function validateFilter(entry, page, listIndex, findings) {
  const { control, pointer } = entry;
  const attrs = control.attrs || {};
  const data = attrs.data || {};
  if (!present(attrs.display_f)) {
    findings.push(error("DASH_FILTER_DISPLAY_FIELD_MISSING", "Dashboard select/radio/checkbox filters must set attrs.display_f to the display field.", { page: page.title, path: `${pointer}.attrs.display_f`, type: control.type }));
  }
  if (!present(attrs.value_f)) {
    findings.push(error("DASH_FILTER_VALUE_FIELD_MISSING", "Dashboard select/radio/checkbox filters must set attrs.value_f, defaulting to ListDataID for record-backed values where appropriate.", { page: page.title, path: `${pointer}.attrs.value_f`, type: control.type }));
  }
  const listId = String(data?.list?.ListID || data?.listId || "");
  if (!listId || !listIndex.byId.has(listId)) {
    findings.push(error("DASH_FILTER_SOURCE_LIST_UNRESOLVED", "Dashboard filter attrs.data.list must resolve to an included source data list.", { page: page.title, path: `${pointer}.attrs.data.list`, listId: listId || null }));
  }
  const field = String(data?.field || "");
  if (!field || (listId && listIndex.byId.has(listId) && !fieldResolves(listIndex.byId.get(listId), field))) {
    findings.push(error("DASH_FILTER_FIELD_UNRESOLVED", "Dashboard filter attrs.data.field must resolve to the filter field on the source data list.", { page: page.title, path: `${pointer}.attrs.data.field`, listId: listId || null, field: field || null }));
  }
  if (!Array.isArray(data?.filter)) {
    findings.push(error("DASH_FILTER_DATA_FILTER_MISSING", "Dashboard filter attrs.data.filter[] must be present for generated filter bindings.", { page: page.title, path: `${pointer}.attrs.data.filter`, type: control.type }));
  }
  const filterItems = asArray(data?.filter);
  for (const [filterIndex, filterItem] of filterItems.entries()) {
    if (!isObject(filterItem)) {
      findings.push(error("DASH_FILTER_DATA_FILTER_ITEM_INVALID", "Dashboard filter attrs.data.filter[] items must be export-shaped objects, not scalar placeholders.", { page: page.title, path: `${pointer}.attrs.data.filter[${filterIndex}]`, value: filterItem }));
      continue;
    }
    const serialized = JSON.stringify(filterItem);
    if (/"(?:operator|op|compare|compareType|condition)"\s*:\s*0\b/.test(serialized) || /"value"\s*:\s*0\b/.test(serialized)) {
      findings.push(error("DASH_FILTER_OPERATOR_VALUE_PLACEHOLDER", "Dashboard filter operator/value metadata must use legal designer condition shapes, not bare 0 placeholders.", { page: page.title, path: `${pointer}.attrs.data.filter[${filterIndex}]`, filterItem }));
    }
  }
  if (!present(attrs.lablay)) {
    findings.push(error("DASH_FILTER_LABEL_LAYOUT_MISSING", "Dashboard filters must set attrs.lablay for designed label-over-dropdown layout.", { page: page.title, path: `${pointer}.attrs.lablay` }));
  }
  if (!present(attrs.lab?.ty)) {
    findings.push(error("DASH_FILTER_LABEL_TYPOGRAPHY_MISSING", "Dashboard filters must set attrs.lab.ty for label typography.", { page: page.title, path: `${pointer}.attrs.lab.ty` }));
  }
  if (!present(attrs.edit?.pcolor)) {
    findings.push(error("DASH_FILTER_PLACEHOLDER_COLOR_MISSING", "Dashboard filters must set attrs.edit.pcolor for placeholder color.", { page: page.title, path: `${pointer}.attrs.edit.pcolor` }));
  }
  if (!present(attrs.edit?.normal?.border?.radius)) {
    findings.push(error("DASH_FILTER_RADIUS_MISSING", "Dashboard filters must set attrs.edit.normal.border.radius using a Yeeflow-supported radius shape.", { page: page.title, path: `${pointer}.attrs.edit.normal.border.radius` }));
  }
  if (String(control.type || "") === "select-filter" && !present(attrs.lab?.value)) {
    findings.push(error("DASH_FILTER_LABEL_VALUE_MISSING", "Dashboard select-filter controls must set attrs.lab.value to the visible filter label text.", { page: page.title, path: `${pointer}.attrs.lab.value`, type: control.type }));
  }
  validatePlaceholderShape(attrs.placeholder, `${pointer}.attrs.placeholder`, page, findings, { codePrefix: "DASH_FILTER", required: true });
}

function validateSearchFilter(entry, page, findings) {
  const attrs = entry.control?.attrs || {};
  validatePlaceholderShape(attrs.placeholder, `${entry.pointer}.attrs.placeholder`, page, findings, { codePrefix: "DASH_SEARCH_FILTER", required: true, stringOnly: true });
}

function validatePlaceholderShape(value, pointer, page, findings, { codePrefix, required, stringOnly = false }) {
  if (!present(value)) {
    if (required) findings.push(error(`${codePrefix}_PLACEHOLDER_VALUE_MISSING`, "Generated filter controls must include an export-proven placeholder text value.", { page: page.title, path: pointer }));
    return;
  }
  if (typeof value === "string") {
    if (value.trim() === "[object Object]") {
      findings.push(error(`${codePrefix}_PLACEHOLDER_OBJECT_STRING_FORBIDDEN`, "Generated filter placeholder must not render as [object Object].", { page: page.title, path: pointer, value }));
    }
    return;
  }
  if (stringOnly) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_OBJECT_FORBIDDEN`, "Generated search-filter attrs.placeholder must be a primitive string; object-shaped placeholder values render as [object Object] in the runtime input.", { page: page.title, path: pointer, value }));
    return;
  }
  if (!isObject(value)) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_SHAPE_INVALID`, "Generated filter placeholder must be a string or an object containing only a string value plus supported style metadata.", { page: page.title, path: pointer, value }));
    return;
  }
  const numericKeys = Object.keys(value).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_NUMERIC_KEYS_FORBIDDEN`, "Generated filter placeholder objects must not be created by spreading a string into numeric character keys.", { page: page.title, path: pointer, numericKeys: numericKeys.slice(0, 8) }));
  }
  if (value.value !== undefined && (typeof value.value !== "string" || !value.value.trim())) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_VALUE_INVALID`, "Generated filter placeholder object value must be a non-empty string.", { page: page.title, path: `${pointer}.value`, value: value.value }));
  } else if (value.value === undefined && !("color" in value) && !("pcolor" in value)) {
    findings.push(error(`${codePrefix}_PLACEHOLDER_VALUE_MISSING`, "Generated filter placeholder object must include a string value when it is used for placeholder text.", { page: page.title, path: pointer, value }));
  }
}

function filterConsumedByCollection(filterEntry, collectionEntry) {
  const filter = filterEntry.control || {};
  const collection = collectionEntry.control || {};
  const field = String(filter?.attrs?.data?.field || "");
  const binding = String(filter?.binding || filter?.attrs?.binding || filter?.attrs?.filterVar || filter?.attrs?.filterVariable || filter?.id || filter?.name || "");
  const tokens = [field, binding, filter?.attrs?.display_f, filter?.attrs?.value_f].filter(Boolean).map(String);
  const data = collection?.attrs?.data || {};
  const haystack = JSON.stringify([
    data.filter,
    data.filters,
    data.query,
    data.conditions,
    data.wheres,
    data.filterBindings,
    collection?.filterBindings,
    collection?.attrs?.filterBindings,
  ]);
  return tokens.some((token) => token && haystack.includes(token));
}

function validatePageTitleSectionPurity(page, findings) {
  for (const entry of page.controls.filter((item) => matchesSemanticId(item.control, "page_title_section"))) {
    const descendants = collectDescendants(entry.control, entry.pointer);
    for (const descendant of descendants) {
      const type = String(descendant.control?.type || "");
      if (["collection", "data-table", "datatable", "data-list", "summary", "chart", "pie-chart", "bar-chart", "line-chart", "pivot-table", "kanban", "vertical-timeline", "horizontal-timeline"].includes(type) || isKpiCard(descendant.control)) {
        findings.push(error("DASH_PAGE_TITLE_SECTION_BUSINESS_CONTROL_FORBIDDEN", "page_title_section is title/header only and must not contain record Collections, Data tables, Summary/chart controls, KPI cards, or repeated-record controls.", {
          page: page.title,
          path: descendant.pointer,
          type,
        }));
      }
    }
  }
}

function validateNonEmptyBusinessSections(page, findings) {
  const approvedWrappers = ["content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper"];
  for (const entry of page.controls) {
    if (entry.control?.type !== "container") continue;
    if (isInsideDashboardDatasetTemplate(entry, page)) continue;
    if (!approvedWrappers.some((identity) => matchesSemanticId(entry.control, identity))) continue;
    const slot = findDescendantEntry(entry.control, `${entry.pointer}`, "section_content_area");
    if (!slot) continue;
    if (!hasMeaningfulBusinessContent(slot.control)) {
      findings.push(error("DASH_EMPTY_SECTION_CONTENT_AREA", "Visible Dashboard v1.1 content card wrappers must not keep an empty title-only section_content_area; remove unused copied template sections or materialize real business content.", {
        page: page.title,
        path: slot.pointer,
        wrapperPath: entry.pointer,
      }));
    }
  }
}

function findDescendantEntry(control, pointer, semanticId) {
  const descendants = collectDescendants(control, pointer);
  return descendants.find((entry) => matchesSemanticId(entry.control, semanticId)) || null;
}

function hasMeaningfulBusinessContent(control) {
  if (!control || !Array.isArray(control.children) || control.children.length === 0) return false;
  const descendants = collectDescendants(control, "$");
  return descendants.some((entry) => {
    const type = String(entry.control?.type || "");
    if (["data-table", "datatable", "data-list"].includes(type) && hasApprovedDataTableTemplateProvenance(entry.control)) return true;
    if (["collection", "summary", "data-filter", "select-filter", "radio-filter", "checkbox-filter", "search-filter", "pie-chart", "column-chart", "bar-chart", "line-chart", "area-chart", "pivot-table", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return true;
    if (type === "button" && hasActionConfiguration(entry.control)) return true;
    if (matchesSemanticId(entry.control, "kpi_card_wrapper")) return true;
    if (matchesSemanticId(entry.control, "form_grid_fields_wrapper")) return true;
    return false;
  });
}

function hasActionConfiguration(control) {
  const attrs = control?.attrs || {};
  if (attrs.control_action || attrs.action || attrs["action-type"] || attrs.actionType) return true;
  if (Array.isArray(attrs.actions) && attrs.actions.length) return true;
  if (Array.isArray(control?.actions) && control.actions.length) return true;
  return false;
}

function validateIndependentContentCardWrappers(page, collections, findings) {
  for (const collection of collections) {
    if (isMasterDetailWorkspaceInternalCollection(collection, page)) continue;
    const ancestors = findAncestors(page.resource, collection.control);
    const contentWrappers = ancestors.filter((node) => matchesSemanticId(node, "content_card_wrapper"));
    const approvedGridWrappers = ancestors.filter((node) => matchesSemanticId(node, "Event Pipeline Grid-Table") || matchesSemanticId(node, "campaign_readiness_grid_table_container"));
    const candidateWrappers = contentWrappers.length ? contentWrappers : approvedGridWrappers;
    if (!candidateWrappers.length) {
      findings.push(error("DASH_COLLECTION_CONTENT_CARD_WRAPPER_MISSING", "Every dashboard grid-table Collection must live inside its own independent content_card_wrapper.", {
        page: page.title,
        path: collection.pointer,
      }));
      continue;
    }
    const nearestWrapper = candidateWrappers[candidateWrappers.length - 1];
    const collectionCount = countControls(nearestWrapper, (node) => String(node?.type || "") === "collection");
    if (collectionCount !== 1) {
      findings.push(error("DASH_CONTENT_CARD_WRAPPER_COLLECTION_COUNT_INVALID", "Each content_card_wrapper must contain exactly one primary grid-table Collection.", {
        page: page.title,
        path: collection.pointer,
        collectionCount,
      }));
    }
  }
}

function validateDynamicUserFieldTypes(page, listIndex, findings) {
  for (const entry of page.controls) {
    const type = String(entry.control?.type || "");
    if (!["dynamic-user", "dynamic-field"].includes(type)) continue;
    if (isInsideDashboardDatasetTemplate(entry, page)) continue;
    const field = resolveBoundField(entry.control, listIndex);
    if (!field) continue;
    const userField = isUserField(field);
    if (userField && type !== "dynamic-user") {
      findings.push(error("DASH_DYNAMIC_USER_FIELD_TYPE_REQUIRED", "User/identity source fields must render with dynamic-user, not generic dynamic-field.", {
        page: page.title,
        path: entry.pointer,
        field: field.FieldName || field.InternalName || field.DisplayName || null,
      }));
    }
    if (!userField && type === "dynamic-user") {
      findings.push(error("DASH_DYNAMIC_USER_BOUND_TO_NON_USER_FIELD", "dynamic-user controls must not bind to non-user fields.", {
        page: page.title,
        path: entry.pointer,
        field: field.FieldName || field.InternalName || field.DisplayName || null,
      }));
    }
  }
}

function validateDesignerNavigatorLabel(entry, page, findings) {
  const type = String(entry.control?.type || "");
  if (!["container", "heading", "text", "text-editor", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file"].includes(type)) return;
  if (!isInsideCollectionControl(entry, page)) return;
  const label = firstNavigatorLabel(entry.control);
  if (!label || isDefaultNavigatorName(label)) {
    findings.push(error("DASH_DESIGNER_NAV_LABEL_MISSING", "Designer-visible controls inside Dashboard Collection item templates must have semantic nv_label/nav_label values; default Navigator names like Container, Text, or Dynamic user are not maintainable.", {
      page: page.title,
      path: entry.pointer,
      type,
      label: label || null,
    }));
  }
}

function validateVisibleTextExpression(entry, page, findings) {
  if (!isTextLike(entry.control)) return;
  for (const [pathSuffix, value] of visibleTextValues(entry.control)) {
    if (typeof value !== "string" || !looksLikeRawVisibleExpression(value)) continue;
    findings.push(error("DASH_VISIBLE_RAW_EXPRESSION_TEXT", "Generated Dashboard text controls must not render raw formulas or Collection item expressions as visible literal text; use export-proven expression binding or a safe business label.", {
      page: page.title,
      path: `${entry.pointer}${pathSuffix}`,
      value,
    }));
  }
}

function validateMasterDetailWorkspaceItemSemantics(page, findings) {
  if (!isMasterDetailWorkspacePage(page)) return;
  const spaceBetweenItems = page.controls.filter((entry) => matchesSemanticId(entry.control, "left_panel_data_item_space_between"));
  for (const entry of spaceBetweenItems) {
    const descendants = collectDescendants(entry.control, entry.pointer);
    const title = descendants.find((descendant) => matchesSemanticId(descendant.control, "left_panel_data_item_title"));
    if (!title) {
      findings.push(error("DASH_MASTER_DETAIL_LEFT_ITEM_TITLE_MISSING", "Two-panel and three-panel workspace Dashboard templates must preserve a left_panel_data_item_title control inside left_panel_data_item_space_between. It may be mapped to dynamic-user or dynamic-field based on the source field type, but the semantic title control must exist.", {
        page: page.title,
        path: entry.pointer,
      }));
      continue;
    }
    const titleType = String(title.control?.type || "");
    if (!["dynamic-user", "dynamic-field"].includes(titleType)) {
      findings.push(error("DASH_MASTER_DETAIL_LEFT_ITEM_TITLE_TYPE_INVALID", "left_panel_data_item_title must be a dynamic-user or dynamic-field control bound to the selected record title/subject field.", {
        page: page.title,
        path: title.pointer,
        type: titleType || null,
      }));
    }
  }
}

function isInsideCollectionControl(entry, page) {
  return findAncestors(page.resource, entry.control).some((ancestor) => String(ancestor?.type || "") === "collection");
}

function firstNavigatorLabel(control) {
  return [
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function visibleTextValues(control) {
  return [
    [".attrs.headc.title.value", control?.attrs?.headc?.title?.value],
    [".attrs.title.value", control?.attrs?.title?.value],
    [".value", control?.value],
    [".text", control?.text],
  ];
}

function looksLikeRawVisibleExpression(value) {
  return /\b(?:iif|dateDiff|dateAdd|formatDate|formatNumber|concat|substring|contains|ifempty)\s*\(/i.test(String(value || ""))
    || /Collection item:/i.test(String(value || ""));
}

function isDefaultNavigatorName(value) {
  return !value || /^(Container|Grid|Text|Dynamic field|Dynamic user|Dynamic image|Dynamic file|Kanban|Collection|Button|Summary|Icon|Text Editor)(\s*\d+)?$/i.test(String(value).trim());
}

function validateContainer(entry, page, findings) {
  if (isInsideDashboardDatasetTemplate(entry, page)) return;
  if (isMasterDetailWorkspacePage(page)) return;
  const style = entry.control?.attrs?.style || {};
  const widthtype = style.widthtype;
  if ((widthtype === undefined || widthtype === null) && isApprovedPageLayoutStructuralContainer(entry, page)) return;
  if (typeof widthtype === "string") {
    findings.push(error("DASH_CONTAINER_WIDTHTYPE_RAW_STRING", "Generated dashboard Container attrs.style.widthtype must use Yeeflow coded array values, not raw strings.", { page: page.title, path: `${entry.pointer}.attrs.style.widthtype`, value: widthtype }));
  } else if (!Array.isArray(widthtype) || widthtype[0] !== null || !CONTAINER_WIDTH_CODES.has(String(widthtype[1] || ""))) {
    findings.push(error("DASH_CONTAINER_WIDTHTYPE_INVALID", "Generated dashboard Container attrs.style.widthtype must be [null,\"1\"], [null,\"2\"], or [null,\"3\"].", { page: page.title, path: `${entry.pointer}.attrs.style.widthtype`, value: widthtype ?? null }));
  }
  if (Array.isArray(widthtype) && String(widthtype[1]) === "3" && !present(style.width) && !present(style.cushei)) {
    findings.push(error("DASH_CONTAINER_CUSTOM_WIDTH_DIMENSIONS_MISSING", "Custom-width dashboard Containers must include width or cushei when fixed dimensions are required.", { page: page.title, path: `${entry.pointer}.attrs.style` }));
  }
  for (const key of ["direction", "gap", "align_items", "justify_content"]) {
    if (!present(style[key])) {
      findings.push(error(`DASH_CONTAINER_${key.toUpperCase()}_MISSING`, `Generated dashboard Containers must explicitly set attrs.style.${key}.`, { page: page.title, path: `${entry.pointer}.attrs.style.${key}` }));
    }
  }
}

function isApprovedPageLayoutStructuralContainer(entry, page) {
  const templateId = String(
    page.resource?.derivedFromDashboardPageLayoutTemplate
    || page.resource?.dashboardPageLayoutTemplateId
    || page.resource?.templateMarker
    || page.resource?.attrs?.derivedFromDashboardPageLayoutTemplate
    || page.resource?.attrs?.dashboardPageLayoutTemplateId
    || page.resource?.attrs?.templateMarker
    || ""
  );
  if (!APPROVED_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.has(templateId)) return false;
  return [...PAGE_LAYOUT_STRUCTURAL_CONTAINER_IDS].some((identity) => matchesSemanticId(entry.control, identity));
}

function dashboardPageLayoutTemplateId(page) {
  return String(
    page.resource?.derivedFromDashboardPageLayoutTemplate
    || page.resource?.dashboardPageLayoutTemplateId
    || page.resource?.templateMarker
    || page.resource?.attrs?.derivedFromDashboardPageLayoutTemplate
    || page.resource?.attrs?.dashboardPageLayoutTemplateId
    || page.resource?.attrs?.templateMarker
    || ""
  );
}

function isMasterDetailWorkspacePage(page) {
  return MASTER_DETAIL_DASHBOARD_PAGE_LAYOUT_TEMPLATE_IDS.has(dashboardPageLayoutTemplateId(page));
}

function isMasterDetailWorkspaceStructuralContainer(entry, page) {
  if (!isMasterDetailWorkspacePage(page)) return false;
  return [
    "Main",
    "main",
    "Content",
    "content",
    "left_panel",
    "left_panel_caption",
    "left_panel_filter_group",
    "left_panel_data_items_wrapper",
    "content_panel",
    "content_panel_empty",
    "content_panel_current_item_wrapper",
    "current_item_wrapper",
    "current_item_wrapper_content",
    "current_item_wrapper_item",
    "primary_working_area",
    "chart_cards_section",
    "right_side_panel",
  ].some((identity) => matchesSemanticId(entry.control, identity));
}

function isMasterDetailLeftPanelFilter(entry, page) {
  if (!isMasterDetailWorkspacePage(page)) return false;
  if (!matchesSemanticId(entry.control, "left_panel_filter_control")) return false;
  return findAncestors(page.resource, entry.control).some((node) => matchesSemanticId(node, "left_panel_filter_group"));
}

function isMasterDetailWorkspaceInternalCollection(entry, page) {
  if (!isMasterDetailWorkspacePage(page)) return false;
  if (String(entry.control?.type || "").toLowerCase() !== "collection") return false;
  return matchesSemanticId(entry.control, "left_panel_data_items_wrapper")
    || matchesSemanticId(entry.control, "current_item_wrapper")
    || entry.control?.dashboardPageLayoutInternalCollection === true
    || entry.control?.attrs?.dashboardPageLayoutInternalCollection === true;
}

function isInsideDashboardDatasetTemplate(entry, page) {
  if ([...DASHBOARD_DATASET_TEMPLATE_ROOT_IDS].some((identity) => matchesSemanticId(entry.control, identity))) return true;
  const ancestors = findAncestors(page.resource, entry.control);
  return ancestors.some((node) => [...DASHBOARD_DATASET_TEMPLATE_ROOT_IDS].some((identity) => matchesSemanticId(node, identity)));
}

function validateKpiCards(page, findings) {
  const cards = page.controls.filter((entry) => isKpiCard(entry.control));
  for (const card of cards) {
    const descendants = collectDescendants(card.control, card.pointer);
    const nativeIcons = descendants.filter((entry) => entry.control?.type === "icon");
    if (!nativeIcons.length) {
      findings.push(error("DASH_KPI_NATIVE_ICON_MISSING", "Each generated KPI Card must contain a descendant native type:\"icon\" control.", { page: page.title, path: card.pointer }));
    }
    const iconLikeText = descendants.find((entry) => isTextLike(entry.control) && looksLikeIconPlaceholder(entry.control));
    if (iconLikeText) {
      findings.push(error("DASH_KPI_ICON_TEXT_PLACEHOLDER_FORBIDDEN", "KPI icon areas must not be implemented using Heading/Text controls.", { page: page.title, path: iconLikeText.pointer }));
    }
    for (const icon of nativeIcons) validateNativeKpiIcon(icon, page, findings);
    const iconContainer = descendants.find((entry) => entry.control?.type === "container" && nativeIcons.some((icon) => icon.pointer.startsWith(`${entry.pointer}.`)));
    if (!iconContainer) {
      findings.push(error("DASH_KPI_ICON_CONTAINER_MISSING", "Each KPI Card must contain a KPI Icon Container child around the native icon.", { page: page.title, path: card.pointer }));
    } else {
      validateKpiIconContainer(iconContainer, page, findings);
    }
    validateKpiCardSurface(card, page, findings);
  }
}

function validateNativeKpiIcon(entry, page, findings) {
  const iconClass = entry.control?.attrs?.icon?.icon;
  if (typeof iconClass !== "string" || !/^fa-(?:solid|regular|brands|light|thin|duotone|sharp)\s+fa-[a-z0-9-]+/i.test(iconClass.trim())) {
    findings.push(error("DASH_KPI_ICON_CLASS_INVALID", "KPI native Icon attrs.icon.icon must use a metric-appropriate FontAwesome class.", { page: page.title, path: `${entry.pointer}.attrs.icon.icon`, value: iconClass ?? null }));
  }
  if (!present(entry.control?.attrs?.icon?.size)) {
    findings.push(error("DASH_KPI_ICON_SIZE_MISSING", "KPI native Icon attrs.icon.size should be set.", { page: page.title, path: `${entry.pointer}.attrs.icon.size` }));
  }
}

function validateKpiIconContainer(entry, page, findings) {
  const attrs = entry.control?.attrs || {};
  const style = attrs.style || {};
  const visual = attrs.container || attrs.common || {};
  const checks = [
    ["background", style.background ?? visual.background ?? attrs.background, "DASH_KPI_ICON_CONTAINER_BACKGROUND_MISSING"],
    ["color", style.color ?? attrs.color ?? attrs.iconColor ?? attrs.textColor, "DASH_KPI_ICON_CONTAINER_COLOR_MISSING"],
    ["padding", style.padding ?? visual.padding ?? attrs.padding, "DASH_KPI_ICON_CONTAINER_PADDING_MISSING"],
    ["width", style.width ?? style.cuswid ?? attrs.width, "DASH_KPI_ICON_CONTAINER_WIDTH_MISSING"],
    ["height", style.height ?? style.cushei ?? attrs.height, "DASH_KPI_ICON_CONTAINER_HEIGHT_MISSING"],
    ["border radius", style.radius ?? style.border?.radius ?? visual.radius ?? visual.border?.radius ?? attrs.radius, "DASH_KPI_ICON_CONTAINER_RADIUS_MISSING"],
  ];
  for (const [label, value, code] of checks) {
    if (!present(value)) findings.push(error(code, `KPI Icon Container must set ${label}.`, { page: page.title, path: entry.pointer }));
  }
  if (!present(style.align_items) || !present(style.justify_content)) {
    findings.push(error("DASH_KPI_ICON_CONTAINER_CENTERING_MISSING", "KPI Icon Container must set centered alignment.", { page: page.title, path: `${entry.pointer}.attrs.style` }));
  }
}

function validateKpiCardSurface(entry, page, findings) {
  const attrs = entry.control?.attrs || {};
  const style = attrs.style || {};
  const surface = attrs.container || attrs.common || {};
  const required = [
    ["background", style.background ?? surface.background ?? attrs.background, "DASH_KPI_CARD_BACKGROUND_MISSING"],
    ["border", style.border ?? surface.border ?? attrs.border, "DASH_KPI_CARD_BORDER_MISSING"],
    ["padding", style.padding ?? surface.padding ?? attrs.padding, "DASH_KPI_CARD_PADDING_MISSING"],
    ["radius", style.radius ?? style.border?.radius ?? surface.radius ?? surface.border?.radius ?? attrs.radius, "DASH_KPI_CARD_RADIUS_MISSING"],
  ];
  for (const [label, value, code] of required) {
    if (!present(value)) findings.push(error(code, `KPI Card surface must set supported ${label} shape.`, { page: page.title, path: entry.pointer }));
  }
}

function validateSummaryBindings(page, listIndex, findings) {
  const summaryControls = page.controls.filter((entry) => entry.control?.type === "summary");
  if (!summaryControls.length) return;
  const exts = asArray(page.resource?.exts);
  const reportIds = new Set(asArray(page.resource?.ReportIds).map(String));
  const tempVars = new Set(asArray(page.resource?.tempVars).flatMap((item) => [item?.id, item?.name, item?.key].filter(Boolean).map(String)));
  for (const summary of summaryControls) {
    const id = String(summary.control?.id || summary.control?.ID || summary.control?.name || "");
    const ext = exts.find((item) => String(item?.i || item?.id || "") === id && item?.category === "___Pivot___" && item?.key === "summary");
    if (!ext) {
      findings.push(error("DASH_SUMMARY_EXT_MISSING", "Summary control must have matching Resource.exts[] entry with category ___Pivot___, key summary, and i equal to the Summary control id.", { page: page.title, path: summary.pointer, summaryId: id || null }));
      continue;
    }
    const values = asArray(ext?.attr?.settings?.values);
    if (!values.length) {
      findings.push(error("DASH_SUMMARY_EXT_VALUES_EMPTY", "Summary ext attr.settings.values[] must not be empty.", { page: page.title, path: `${summary.pointer}.exts.values`, summaryId: id || null }));
    }
    for (const [index, value] of values.entries()) validateSummaryValue(value, index, ext, summary, page, listIndex, findings);
    const saveVar = summary.control?.attrs?.save_var || summary.control?.attrs?.saveVar || summary.control?.save_var || summary.control?.saveVar;
    if (!isObject(saveVar)) {
      findings.push(error("DASH_SUMMARY_SAVE_VAR_MISSING", "Summary attrs.save_var must be present as the runtime temp-variable expression object.", { page: page.title, path: `${summary.pointer}.attrs.save_var`, summaryId: id || null }));
    } else {
      const saveTokens = saveVarTokens(saveVar);
      if (![...saveTokens].some((token) => tempVars.has(token))) {
        findings.push(error("DASH_SUMMARY_TEMPVAR_MISSING", "Resource.tempVars[] must include the Summary saved temp variable.", { page: page.title, path: `${page.pointer}.tempVars`, summaryId: id || null, saveVar }));
      }
      if (!visibleKpiBindingMatches(page, saveVar)) {
        findings.push(error("DASH_SUMMARY_VISIBLE_KPI_BINDING_MISMATCH", "Visible KPI Text must bind to the exact same expression object used by Summary attrs.save_var.", { page: page.title, path: summary.pointer, summaryId: id || null, saveVar }));
      }
    }
    if (id && !reportIds.has(id)) {
      findings.push(error("DASH_SUMMARY_REPORTIDS_MISSING", "Resource.ReportIds[] must include every Summary control id.", { page: page.title, path: `${page.pointer}.ReportIds`, summaryId: id }));
    }
  }
}

function validateKpiTempVarReferences(page, findings) {
  const declared = new Set(asArray(page.resource?.tempVars).flatMap((item) => [item?.id, item?.name, item?.key, item?.value].filter(Boolean).map(String)));
  for (const item of [...declared]) {
    if (!item.startsWith("__temp_")) declared.add(`__temp_${item}`);
    if (item.startsWith("__temp_")) declared.add(item.replace(/^__temp_+/, ""));
  }
  for (const entry of page.controls) {
    if (!isTextLike(entry.control)) continue;
    const title = entry.control?.attrs?.headc?.title || entry.control?.attrs?.title || {};
    if (!present(title?.variable)) continue;
    const refs = collectTempVarReferenceTokens(title.variable);
    for (const ref of refs) {
      if (/^__temp_event_portfolio_|event_portfolio_/i.test(ref)) {
        findings.push(error("DASH_KPI_SOURCE_TEMPLATE_TEMPVAR_RESIDUE", "Visible KPI value bindings must not retain Event Portfolio source-template temp variables after business-domain mapping.", {
          page: page.title,
          path: `${entry.pointer}.attrs.headc.title.variable`,
          tempVar: ref,
        }));
      }
      const variants = new Set([ref]);
      if (ref.startsWith("__temp_")) variants.add(ref.replace(/^__temp_+/, ""));
      else variants.add(`__temp_${ref}`);
      if (![...variants].some((variant) => declared.has(variant))) {
        findings.push(error("DASH_KPI_TEMPVAR_UNDECLARED", "Visible KPI value bindings must reference temp variables declared in the dashboard Resource.tempVars array.", {
          page: page.title,
          path: `${entry.pointer}.attrs.headc.title.variable`,
          tempVar: ref,
        }));
      }
    }
  }
}

function collectTempVarReferenceTokens(value, out = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTempVarReferenceTokens(item, out));
    return out;
  }
  if (!isObject(value)) {
    if (typeof value === "string" && /(?:^|_)__?temp_|^tmp_|event_portfolio_/i.test(value)) out.add(value);
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    if (["id", "name", "key", "value"].includes(key) && typeof child === "string" && /(?:^|_)__?temp_|^tmp_|event_portfolio_/i.test(child)) out.add(child);
    else collectTempVarReferenceTokens(child, out);
  }
  return out;
}

function validateSummaryValue(value, index, ext, summary, page, listIndex, findings) {
  for (const key of ["fieldName", "func", "id"]) {
    if (!present(value?.[key])) {
      findings.push(error(`DASH_SUMMARY_VALUE_${key.toUpperCase()}_MISSING`, `Summary ext values[] item must include ${key}.`, { page: page.title, path: `${page.pointer}.exts[summary=${summary.control?.id}].attr.settings.values[${index}].${key}` }));
    }
  }
  const func = String(value?.func || "").toUpperCase();
  const fieldName = String(value?.fieldName || "");
  const fieldId = String(value?.id || "");
  if (func === "COUNT" && (fieldName !== RECORD_DISPLAY_FIELD || fieldId !== RECORD_DISPLAY_FIELD)) {
    findings.push(error("DASH_SUMMARY_COUNT_FIELD_INVALID", "COUNT summaries must select ListDataID for fieldName and id.", { page: page.title, summaryId: summary.control?.id || null, fieldName, id: fieldId }));
  }
  if (NUMERIC_AGG_FUNCS.has(func)) {
    const sourceListId = String(ext?.attr?.ListID || ext?.attr?.listId || summary.control?.attrs?.data?.list?.ListID || "");
    const list = listIndex.byId.get(sourceListId);
    const field = list?.fieldsByName.get(fieldName) || list?.fieldsById.get(fieldId);
    if (!field || !isNumericField(field)) {
      findings.push(error("DASH_SUMMARY_NUMERIC_FIELD_INVALID", "SUM/AVG/MIN/MAX summaries must select the actual numeric source field by fieldName and field ID.", { page: page.title, summaryId: summary.control?.id || null, sourceListId: sourceListId || null, fieldName, id: fieldId, func }));
    }
  }
}

function validateReportIdentity(reportPath, decoded, findings) {
  const resolved = path.resolve(reportPath);
  if (!fs.existsSync(resolved)) {
    findings.push(error("DASH_REPORT_MISSING", "Report file is missing.", { report: resolved }));
    return;
  }
  const text = fs.readFileSync(resolved, "utf8");
  const decodedListSetId = decoded?.ListSet?.ListID ? String(decoded.ListSet.ListID) : null;
  let parsed = null;
  try { parsed = JSON.parse(text); } catch {}
  if (parsed) {
    const canonicalId = valueAt(parsed, ["canonicalApplication", "listSetId"]) || valueAt(parsed, ["canonicalApplication", "ListSetID"]);
    const installOperationId = valueAt(parsed, ["installApiReturn", "id"]) || valueAt(parsed, ["installApiReturn", "ID"]);
    const installListSetId = valueAt(parsed, ["installApiReturn", "listSetId"]) || valueAt(parsed, ["installApiReturn", "ListSetID"]) || valueAt(parsed, ["installApiReturn", "Data", "ListSetID"]) || valueAt(parsed, ["installApiReturn", "Data", "listSetId"]);
    const installId = installOperationId || installListSetId;
    if (decodedListSetId && String(canonicalId || "") !== decodedListSetId) {
      findings.push(error("DASH_CANONICAL_APP_LISTSETID_MISMATCH", "Report canonicalApplication.listSetId must equal decoded package $.ListSet.ListID.", { report: resolved, canonicalListSetId: canonicalId ?? null, decodedListSetId }));
    }
    if (installListSetId && decodedListSetId && String(installListSetId) !== decodedListSetId) {
      findings.push(error("DASH_INSTALL_API_LISTSETID_MISMATCH", "Install API reported ListSetID differs from decoded package root $.ListSet.ListID; keep install response identity separate from canonical runtime URL.", { report: resolved, installApiListSetId: String(installListSetId), decodedListSetId }));
    }
    if (installId && canonicalId && String(installId) === String(canonicalId) && decodedListSetId && String(installId) !== decodedListSetId) {
      findings.push(error("DASH_INSTALL_OPERATION_ID_USED_AS_CANONICAL", "Install/import API returned IDs must be labeled operation evidence only, not canonical application identity.", { report: resolved, installApiReturnId: String(installId), decodedListSetId }));
    }
    if (installId && !("canonicalApplication" in parsed && "installApiReturn" in parsed)) {
      findings.push(error("DASH_REPORT_IDENTITY_LABELS_MISSING", "Final reports must separately label canonicalApplication.listSetId and installApiReturn.id when both values exist.", { report: resolved }));
    }
  }
  if (!/\bcanonicalApplication\.listSetId\b|\"canonicalApplication\"\s*:/.test(text) && /\binstallApiReturn\b|install api|install\/import/i.test(text)) {
    findings.push(error("DASH_REPORT_CANONICAL_LABEL_MISSING", "Final reports with install/import evidence must separately label canonicalApplication.listSetId.", { report: resolved }));
  }
  const urlIds = [...text.matchAll(/#\/list-set\/41\/([0-9]+)/g)].map((match) => match[1]);
  for (const urlId of urlIds) {
    if (decodedListSetId && urlId !== decodedListSetId) {
      findings.push(error("DASH_CANONICAL_APP_URL_LISTSETID_MISMATCH", "Canonical application URL must use decoded package $.ListSet.ListID, not install/import operation IDs.", { report: resolved, urlListSetId: urlId, decodedListSetId }));
    }
  }
}

function buildListIndex(decoded) {
  const byId = new Map();
  for (const child of asArray(decoded?.Childs)) {
    const listId = String(child?.List?.ListID || "");
    if (!listId) continue;
    const fieldsByName = new Map();
    const fieldsById = new Map();
    for (const field of asArray(child?.Fields)) {
      for (const key of [field?.FieldName, field?.InternalName, field?.DisplayName].filter(Boolean)) fieldsByName.set(String(key), field);
      if (field?.FieldID !== undefined) fieldsById.set(String(field.FieldID), field);
    }
    byId.set(listId, { child, fieldsByName, fieldsById });
  }
  return { byId };
}

function collectDashboardPages(decoded) {
  const pages = [];
  asArray(decoded?.Pages).forEach((page, pageIndex) => {
    if (String(page?.Type) !== "103") return;
    asArray(page?.LayoutInResources).forEach((resource, resourceIndex) => {
      const parsed = parseJsonMaybe(resource?.Resource);
      if (!isObject(parsed)) return;
      const controls = [];
      collectControls(parsed, controls, "$", null, "", -1);
      pages.push({
        title: String(page?.Title || page?.Name || page?.LayoutID || `dashboard-${pageIndex}`),
        layoutId: String(page?.LayoutID || ""),
        pointer: `decoded.Pages[${pageIndex}].LayoutInResources[${resourceIndex}].Resource`,
        resource: parsed,
        controls,
      });
    });
  });
  return pages;
}

function collectControls(node, out, pointer, parent, parentPointer, siblingIndex) {
  if (!isObject(node)) return;
  if (node.type) out.push({ control: node, pointer, parent, parentPointer, siblingIndex });
  for (const key of ["children", "columns", "controls"]) {
    if (Array.isArray(node[key])) {
      node[key].forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`, node, pointer, index));
    }
  }
}

function collectDescendants(control, pointer) {
  const out = [];
  for (const key of ["children", "columns", "controls"]) {
    asArray(control?.[key]).forEach((child, index) => collectControls(child, out, `${pointer}.${key}[${index}]`, control, pointer, index));
  }
  return out;
}

function isKpiCard(control) {
  const text = `${control?.name || ""} ${control?.label || ""} ${control?.id || ""} ${control?.nv_label || ""} ${control?.attrs?.nv_label || ""}`;
  if (/kpi icon container|icon container/i.test(text)) return false;
  return control?.type === "container" && (
    /\bKPI Card\b|metric card|summary card/i.test(text)
    || matchesSemanticId(control, "kpi_card_wrapper")
    || /event_portfolio_kpi_(planned_events|approved_budget|registration_rate|lead_follow_up)\b/.test(text)
  );
}

function isTextLike(control) {
  return ["heading", "text", "text-editor"].includes(String(control?.type || ""));
}

function looksLikeIconPlaceholder(control) {
  const title = control?.attrs?.headc?.title?.value ?? control?.attrs?.title?.value ?? control?.value ?? control?.name ?? "";
  return /^(?:fa-|[★✓!⚠+\-]|\p{Extended_Pictographic})/u.test(String(title).trim());
}

function fieldResolves(list, field) {
  return list.fieldsByName.has(String(field)) || list.fieldsById.has(String(field));
}

function matchesSemanticId(control, id) {
  const values = [
    control?.id,
    control?.ID,
    control?.name,
    control?.Name,
    control?.label,
    control?.Label,
    control?.nv_label,
    control?.nav_label,
    control?.attrs?.nv_label,
    control?.attrs?.nav_label,
    control?.attrs?.derivedFromGoldenReference,
    control?.derivedFromGoldenReference,
  ].filter(Boolean).map(String);
  return values.some((value) => value === id || value.includes(id));
}

function findAncestors(root, target) {
  const out = [];
  const stack = [];
  let found = false;
  function visit(node) {
    if (found || !isObject(node)) return;
    if (node === target) {
      out.push(...stack);
      found = true;
      return;
    }
    stack.push(node);
    for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach(visit);
    stack.pop();
  }
  visit(root);
  return out;
}

function countControls(root, predicate) {
  let count = 0;
  function visit(node) {
    if (!isObject(node)) return;
    if (predicate(node)) count += 1;
    for (const key of ["children", "columns", "controls"]) asArray(node[key]).forEach(visit);
  }
  visit(root);
  return count;
}

function resolveBoundField(control, listIndex) {
  const fieldName = String(
    control?.attrs?.data?.field
    || control?.attrs?.field
    || control?.attrs?.fieldName
    || control?.attrs?.FieldName
    || control?.field
    || control?.fieldName
    || control?.FieldName
    || "",
  );
  const listId = String(control?.attrs?.data?.list?.ListID || control?.attrs?.data?.listId || control?.attrs?.list?.ListID || "");
  if (listId && listIndex.byId.has(listId)) {
    const list = listIndex.byId.get(listId);
    return list.fieldsByName.get(fieldName) || list.fieldsById.get(fieldName) || null;
  }
  for (const list of listIndex.byId.values()) {
    const field = list.fieldsByName.get(fieldName) || list.fieldsById.get(fieldName);
    if (field) return field;
  }
  return null;
}

function isUserField(field) {
  const text = `${field?.Type || ""} ${field?.FieldType || ""} ${field?.ControlType || ""} ${field?.DisplayName || ""}`.toLowerCase();
  return /\b(identity-picker|user|person|people|owner|requester|assignee|createdby|modifiedby)\b/.test(text);
}

function isNumericField(field) {
  const typeText = `${field?.FieldType || ""} ${field?.Type || ""}`.toLowerCase();
  return /\b(decimal|number|currency|percent|rate|input_number|calculated-column)\b/.test(typeText);
}

function visibleKpiBindingMatches(page, saveVar) {
  const saveJson = stableString(saveVar);
  const tokens = saveVarTokens(saveVar);
  return page.controls.some((entry) => {
    if (!isTextLike(entry.control)) return false;
    const title = entry.control?.attrs?.headc?.title || entry.control?.attrs?.title || {};
    return stableString(title?.variable).includes(saveJson) || stableString(title).includes(saveJson) || [...tokens].some((token) => stableString(title).includes(token));
  });
}

function saveVarTokens(saveVar) {
  return new Set([saveVar?.id, saveVar?.name, saveVar?.key, saveVar?.value].filter(Boolean).map(String));
}

function stableString(value) {
  return JSON.stringify(value ?? null);
}

function present(value) {
  return value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "") && !(Array.isArray(value) && value.length === 0);
}

function valueAt(obj, pathParts) {
  let value = obj;
  for (const part of pathParts) {
    if (!isObject(value) || !(part in value)) return null;
    value = value[part];
  }
  return value;
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--package") args.package = argv[++i];
    else if (token === "--plan") args.plan = argv[++i];
    else if (token === "--report") args.report = argv[++i];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-dashboard-generation-hard-gates.mjs --package <file.yapk> [--plan <yeeflow-app-plan.md>] [--report <final-report.json|md>]
  node scripts/validate-dashboard-generation-hard-gates.mjs --report <final-report.json|md>`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] || "").href;
}
