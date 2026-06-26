#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-list-form-layout-templates.json");
const TEMPLATE_IDS = new Set(["data_list_form_layout_new_edit_v1_1", "data_list_form_layout_view_item_v1_1"]);
const NEW_EDIT_TEMPLATE_ID = "data_list_form_layout_new_edit_v1_1";
const VIEW_TEMPLATE_ID = "data_list_form_layout_view_item_v1_1";
const BACKGROUND = "#f4f7fb";
const ZERO_PADDING = { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" };
const ALLOWED_BUSINESS_SLOTS = new Set(["page_title_content", "Operations", "section_content_area", "section_title_header", "kpi_card_wrapper"]);
const REPEATABLE_MODULES = new Set(["1_columns_section", "content_card_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section", "kpi_metrics_wrapper", "kpi_card_wrapper"]);
const REMOVABLE_SECTION_MODULES = new Set(["1_columns_section", "content_card_wrapper", "content_card_60_wrapper", "content_card_40_wrapper", "2_columns_section", "3_columns_section", "2_columns_60/40_section"]);
const REQUIRED_NEW_EDIT_REGIONS = ["main", "content", "1_columns_section", "content_card_wrapper", "section_title_area", "section_title_header", "section_content_area"];
const REQUIRED_VIEW_REGIONS = ["main", "content", "page_title_section", "page_title_content", "page_title_text", "page_title_description", "kpi_metrics_wrapper", "1_columns_section", "content_card_wrapper", "section_title_area", "section_title_header", "section_content_area"];
const DATA_ANALYTICS_TYPES = new Set(["pie-chart", "bar-chart", "line-chart", "pivot-table", "summary"]);
const DATASET_TYPES = new Set(["collection", "data-table", "datatable", "data-list", "kanban", "timeline-v", "timeline-h", "document-library"]);
const FORM_USAGES = ["add", "edit", "view"];
const RESIDUAL_TEMPLATE_LABEL_PATTERNS = [
  /\bActive Loan Pipeline\b/i,
  /\bCoordinator guidance: prioritize overdue items and returns/i,
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.plan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataListFormLayoutTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataListFormLayoutTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_LIST_FORM_LAYOUT_REGISTRY_MISSING");
  const references = new Map(asArray(registry?.templates).map((item) => [String(item?.templateId || ""), item]).filter(([id]) => id));
  validateRegistry(registry, references, findings, registryPath);

  if (options.resource) {
    const templateId = String(options.template || "");
    const formUsage = String(options.formUsage || "");
    const resource = readJson(path.resolve(options.resource), findings, "DATA_LIST_FORM_LAYOUT_RESOURCE_MISSING");
    validateFormResource(resource, { findings, templateId, formUsage, source: path.basename(options.resource), requireMarker: Boolean(templateId) });
  }

  if (options.package) validatePackage(path.resolve(options.package), { findings, appPlan: options.plan ? path.resolve(options.plan) : null });
  if (options.plan) validateAppPlan(path.resolve(options.plan), findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    resource: options.resource ? path.resolve(options.resource) : null,
    package: options.package ? path.resolve(options.package) : null,
    appPlan: options.plan ? path.resolve(options.plan) : null,
    findings,
  };
}

function validateRegistry(registry, references, findings, registryPath) {
  if (!registry) return;
  for (const id of TEMPLATE_IDS) {
    if (!asArray(registry.approvedTemplateIds).includes(id) || !references.has(id)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_REFERENCE_MISSING", "Data List Form Layouts v1.1 registry must include both approved template IDs.", { templateId: id }));
    }
  }
  for (const slot of ALLOWED_BUSINESS_SLOTS) {
    if (!asArray(registry.allowedBusinessContentContainers).includes(slot)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_BUSINESS_SLOT_MISSING", "Registry must document every allowed business-content container.", { containerId: slot }));
    }
  }
  for (const moduleId of REPEATABLE_MODULES) {
    if (!asArray(registry.allowedRepeatableRemovableModules).includes(moduleId)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_REPEATABLE_MODULE_MISSING", "Registry must document every repeatable/removable module.", { moduleId }));
    }
  }
  const unusedPolicy = registry.unusedSectionPolicy || {};
  if (unusedPolicy.generatedFinalMustPruneUnusedSections !== true || unusedPolicy.emptySectionContentAreaForbidden !== true || unusedPolicy.titleOnlyCopiedSectionsForbidden !== true) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_POLICY_MISSING", "Registry must explicitly require generated-final Data List forms to prune unused copied sections and reject empty section_content_area containers.", { unusedSectionPolicy: unusedPolicy }));
  }
  for (const moduleId of REMOVABLE_SECTION_MODULES) {
    if (!asArray(unusedPolicy.appliesToModules).includes(moduleId)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_POLICY_MODULE_MISSING", "Registry unused-section policy must list every generated-final removable section module.", { moduleId }));
    }
  }
  for (const reference of references.values()) {
    const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
    if (!fs.existsSync(templatePath)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_FILE_MISSING", "Data List Form Layout template file is missing.", { templateId: reference.templateId, sourceTemplate: reference.sourceTemplate }));
      continue;
    }
    const template = readJson(templatePath, findings, "DATA_LIST_FORM_LAYOUT_TEMPLATE_PARSE_FAILED");
    const resource = template?.templateResource;
    const expectedUsage = reference.templateId === NEW_EDIT_TEMPLATE_ID ? "new/edit" : "view";
    validateFormResource(resource, { findings, templateId: reference.templateId, formUsage: expectedUsage, source: reference.displayName || reference.templateId, requireMarker: false, registryMode: true });
  }
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  const usageByLayoutId = buildUsageByLayoutId(decoded);
  validateListDisplayAssignments(decoded, context);
  let customFormCount = 0;
  for (const form of collectDataListForms(decoded)) {
    customFormCount += 1;
    validateCustomFormRuntimeSource(form, context);
    const usages = usageByLayoutId.get(String(form.layoutId)) || [];
    const expected = inferExpectedTemplate(form, usages);
    validateFormResource(form.resource, {
      findings: context.findings,
      templateId: expected.templateId,
      formUsage: expected.formUsage,
      source: `${form.listTitle} / ${form.title}`,
      requireMarker: true,
    });
  }
  if (customFormCount === 0) return;
}

function validateAppPlan(planPath, findings) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  validateAppPlanListCoverage(text, findings);
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) return;
  const hasCustomForms = /New\/Edit|New|Edit|View|Detail|Custom Data List Forms Plan/i.test(section) && /\|/.test(section);
  if (!hasCustomForms) return;
  if (!/Data List Form Layout Template Selection/i.test(section)) {
    findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_SELECTION_TABLE_MISSING", "Custom Data List Forms Plan must include a Data List Form Layout Template Selection table when custom forms are planned."));
    return;
  }
  for (const row of tableRows(section)) {
    const line = row.raw;
    const found = [...TEMPLATE_IDS].filter((id) => line.includes(id));
    if (!found.length) continue;
    const lower = line.toLowerCase();
    if (/(new|edit)/.test(lower) && !line.includes(NEW_EDIT_TEMPLATE_ID)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_TEMPLATE_MISMATCH", "New/Edit custom Data List forms must select data_list_form_layout_new_edit_v1_1.", { row: line }));
    }
    if (/\bview\b/.test(lower) && !line.includes(VIEW_TEMPLATE_ID)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_TEMPLATE_MISMATCH", "View custom Data List forms must select data_list_form_layout_view_item_v1_1.", { row: line }));
    }
  }
}

function validateAppPlanListCoverage(text, findings) {
  const plannedLists = parsePlannedDataLists(text);
  if (!plannedLists.length) return;
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) {
    for (const list of plannedLists) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_LIST_FORMS_MISSING", "Every planned Data List or Document Library must plan custom New/Edit and View forms, or explicitly declare a system/support-list exemption.", { list }));
    }
    return;
  }
  for (const list of plannedLists) {
    const listRows = tableRows(section).map((row) => row.raw).filter((line) => lineMentionsList(line, list));
    const sectionBody = subsectionForList(section, list);
    const evidence = [...listRows, sectionBody].join("\n");
    if (hasExplicitFormExemption(evidence)) continue;
    if (!hasNewEditPlan(evidence)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED", "Every planned Data List or Document Library must plan a New/Edit custom form using data_list_form_layout_new_edit_v1_1. Default New/Edit layouts are not generation-ready.", { list }));
    }
    if (!hasViewPlan(evidence)) {
      findings.push(error("DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED", "Every planned Data List or Document Library must plan a View custom form using data_list_form_layout_view_item_v1_1. Default View layouts are not generation-ready.", { list }));
    }
  }
}

function validateFormResource(resource, context) {
  if (!isObject(resource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_RESOURCE_INVALID", "Custom Data List form resource must parse as an object.", { source: context.source }));
    return;
  }
  const actualTemplateId = resolveTemplateId(resource);
  const templateId = actualTemplateId || context.templateId || "";
  if (context.requireMarker && !TEMPLATE_IDS.has(actualTemplateId)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_MARKER_MISSING", "Generated custom Data List forms must declare the selected Data List Form Layout template ID.", { source: context.source, expected: context.templateId || null }));
  }
  if (context.templateId && actualTemplateId && actualTemplateId !== context.templateId) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_MISMATCH", "Custom Data List form template marker does not match its expected usage.", { source: context.source, expected: context.templateId, actual: templateId }));
  }
  validateRootShell(resource, context);
  validateUsageContract(resource, context.templateId || templateId, context);
  validateBusinessSlots(resource, context);
}

function validateRootShell(resource, context) {
  const background = resource?.attrs?.background?.classic?.color || resource?.attrs?.background?.color || null;
  if (normalizeColor(background) !== BACKGROUND) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_BACKGROUND_INVALID", "Custom Data List form root background must be #f4f7fb.", { source: context.source, actual: background }));
  }
  if (resource?.attrs?.container?.cw !== "2" || !isZeroTokenPadding(resource?.attrs?.container?.padding)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_ROOT_CONTENT_AREA_INVALID", "Custom Data List form root must preserve full-width content area and token-array zero padding.", { source: context.source, container: resource?.attrs?.container || null }));
  }
  const main = findFirstByIdentity(resource, "main") || findFirstByIdentity(resource, "Main");
  const content = asArray(main?.children).find((child) => hasIdentity(child, "content") || hasIdentity(child, "Content"));
  if (!main || !content) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_MAIN_CONTENT_MISSING", "Custom Data List form must contain main > content.", { source: context.source }));
    return;
  }
  if (tupleValue(main?.attrs?.style?.direction) !== "column") context.findings.push(error("DATA_LIST_FORM_LAYOUT_MAIN_COLUMN_MISSING", "Main container must preserve column layout.", { source: context.source }));
  if (!isColumnFullWidth(content)) context.findings.push(error("DATA_LIST_FORM_LAYOUT_CONTENT_FULL_WIDTH_COLUMN_MISSING", "Content container must preserve full-width column layout.", { source: context.source }));
  const contentChildren = asArray(content.children).filter((child) => isObject(child) && child.type);
  if (!contentChildren.length) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_CONTENT_EMPTY", "Custom Data List form content must contain selected business section containers.", { source: context.source }));
  }
}

function validateUsageContract(resource, templateId, context) {
  const expected = String(context.formUsage || "").toLowerCase();
  const newEditExpected = templateId === NEW_EDIT_TEMPLATE_ID || /new|edit/.test(expected);
  const viewExpected = templateId === VIEW_TEMPLATE_ID || /\bview\b/.test(expected);
  if (newEditExpected) {
    for (const id of REQUIRED_NEW_EDIT_REGIONS) requireIdentity(resource, id, context, "DATA_LIST_FORM_LAYOUT_NEW_EDIT_REQUIRED_REGION_MISSING");
    for (const id of ["page_title_section", "kpi_metrics_wrapper"]) {
      if (findFirstByIdentity(resource, id)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_NEW_EDIT_FORBIDDEN_REGION", "New/Edit custom Data List form template must not include View-only page title or KPI regions.", { source: context.source, region: id }));
      }
    }
    for (const entry of flatten(resource)) {
      const type = String(entry.node?.type || "");
      if (DATASET_TYPES.has(type) || DATA_ANALYTICS_TYPES.has(type)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_NEW_EDIT_RELATED_DATA_FORBIDDEN", "New/Edit custom Data List forms must focus on the current record and must not include related datasets, Collection templates, charts, pivot tables, or KPI analytics.", { source: context.source, path: entry.pointer, type }));
      }
    }
  }
  if (viewExpected) {
    for (const id of REQUIRED_VIEW_REGIONS) requireIdentity(resource, id, context, "DATA_LIST_FORM_LAYOUT_VIEW_REQUIRED_REGION_MISSING");
  }
}

function validateBusinessSlots(resource, context) {
  for (const card of findAllByIdentity(resource, "content_card_wrapper")) {
    if (!findFirstByIdentity(card, "section_title_area")) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_SECTION_TITLE_AREA_MISSING", "Every content_card_wrapper must preserve section_title_area.", { source: context.source }));
    }
    const slot = findFirstByIdentity(card, "section_content_area");
    if (!slot) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_SECTION_CONTENT_AREA_MISSING", "Every content_card_wrapper must preserve section_content_area.", { source: context.source }));
    } else if (!context.registryMode && !hasMeaningfulBusinessContent(slot)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA", "Generated Data List form content card wrappers must not keep empty copied template sections; remove unused sections or materialize real business content.", { source: context.source, path: pointerForNode(resource, slot) }));
    }
  }
  if (!context.registryMode) {
    for (const entry of flatten(resource)) {
      const ids = identityCandidates(entry.node);
      const isRemovableModule = ids.some((id) => REMOVABLE_SECTION_MODULES.has(id));
      if (!isRemovableModule) continue;
      if (ids.includes("page_title_section") || findFirstByIdentity(entry.node, "page_title_content")) continue;
      if (!hasMeaningfulBusinessContent(entry.node)) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_MODULE", "Generated Data List form section modules must be removed when they do not contain real business content.", { source: context.source, path: entry.pointer, identities: ids }));
      }
    }
  }
  if (!context.registryMode) {
    for (const entry of flatten(resource)) {
      const text = nodeText(entry.node);
      const pattern = RESIDUAL_TEMPLATE_LABEL_PATTERNS.find((candidate) => candidate.test(text));
      if (pattern) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_TEMPLATE_RESIDUAL_LABEL", "Generated Data List forms must not retain unrelated source-template section labels or descriptions; map titles/descriptions to the current Data List purpose or remove the unused section.", { source: context.source, path: entry.pointer, text: text.slice(0, 200) }));
      }
    }
    for (const operations of findAllByIdentity(resource, "Operations")) {
      const descendants = flatten(operations).map((entry) => entry.node);
      const actionLike = descendants.filter((node) => isActionLooking(node));
      if (actionLike.length && !actionLike.some((node) => hasActionConfiguration(node))) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_OPERATION_ACTION_BINDING_MISSING", "Operations containers may contain action-looking controls only when real Yeeflow action configuration exists.", { source: context.source }));
      }
    }
  }
  const content = findFirstByIdentity(resource, "content") || findFirstByIdentity(resource, "Content");
  for (const child of asArray(content?.children)) {
    const ids = identityCandidates(child);
    const knownSection = ids.some((id) => REPEATABLE_MODULES.has(id) || id === "page_title_section");
    if (!knownSection) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_INVENTED_ROOT_MODULE", "Business controls or invented layout modules must not be direct children of root Content; copy an approved section module and place business content in an allowed slot.", { source: context.source, identities: ids }));
    }
  }
  for (const entry of flatten(resource)) {
    const type = String(entry.node?.type || "");
    if (!isBusinessControlType(type)) continue;
    if (isInsideAllowedBusinessSlot(entry, resource)) continue;
    context.findings.push(error("DATA_LIST_FORM_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT", "Business controls must be placed only inside approved Data List Form v1.1 business-content slots.", { source: context.source, path: entry.pointer, type, identities: identityCandidates(entry.node) }));
  }
}

function hasMeaningfulBusinessContent(node) {
  if (!node) return false;
  for (const entry of flatten(node)) {
    const current = entry.node;
    if (current === node) continue;
    const type = String(current?.type || "");
    if (isBusinessControlType(type)) return true;
    const ids = identityCandidates(current);
    if (ids.some((id) => id === "form_grid_fields_wrapper" || id === "data_list_form_control_sublist_v1_1")) return true;
    if (current?.dataListFormFieldsTemplateId || current?.derivedFromDataListFormFieldsTemplate) return true;
    if (current?.dataListFormControlTemplateId || current?.derivedFromDataListFormControlTemplate) return true;
    if (current?.collectionTemplateId || current?.dataAnalyticsTemplateId || current?.derivedFromCollectionTemplate || current?.derivedFromDataAnalyticsTemplate) return true;
  }
  return false;
}

function nodeText(node) {
  if (!isObject(node)) return "";
  const values = [];
  for (const key of ["text", "title", "value", "DisplayName", "description", "placeholder"]) {
    const value = node?.[key];
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter((item) => typeof item === "string"));
  }
  for (const key of ["text", "title", "value", "description", "placeholder"]) {
    const value = node?.attrs?.[key];
    if (typeof value === "string") values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter((item) => typeof item === "string"));
  }
  return values.join(" ");
}

function requireIdentity(resource, id, context, code) {
  if (!findFirstByIdentity(resource, id)) {
    context.findings.push(error(code, "Custom Data List form template is missing a required region.", { source: context.source, region: id }));
  }
}

function collectDataListForms(decoded) {
  const forms = [];
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    const listTitle = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    for (const [layoutIndex, layout] of asArray(child?.Layouts || child?.Item?.Layouts).entries()) {
      if (Number(layout?.Type) !== 1) continue;
      const layoutResourceValue = asArray(layout?.LayoutInResources)[0]?.Resource;
      const resource = parseResource(layoutResourceValue);
      const layoutViewResource = parseResource(layout?.LayoutView);
      forms.push({
        listTitle,
        title: layout?.Title || `Layouts[${layoutIndex}]`,
        layoutId: layout?.LayoutID,
        layoutIndex,
        resource: resource || layoutViewResource,
        layoutViewResource,
        layoutResource: resource,
        layoutViewRaw: layout?.LayoutView,
        layoutResourceRaw: layoutResourceValue,
      });
    }
  }
  return forms;
}

function validateCustomFormRuntimeSource(form, context) {
  const detail = {
    list: form.listTitle,
    layout: form.title,
    layoutId: form.layoutId,
    layoutIndex: form.layoutIndex,
  };
  if (!isObject(form.layoutViewResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_MISSING", "Type 1 custom Data List form Layout.LayoutView must contain the complete form JSON used by runtime/designer, not a placeholder, blank, null, or omitted value.", detail));
    return;
  }
  if (!isObject(form.layoutResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTINRESOURCE_RESOURCE_MISSING", "Type 1 custom Data List form LayoutInResources[0].Resource must contain the complete form JSON.", detail));
    return;
  }
  if (isPlaceholderLayoutView(form.layoutViewResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_PLACEHOLDER", "Type 1 custom Data List form Layout.LayoutView must not be a minimal/source placeholder. It must duplicate the complete form JSON so runtime and Designer can load fields.", { ...detail, layoutView: form.layoutViewResource }));
  }
  if (!sameStableJson(form.layoutViewResource, form.layoutResource)) {
    context.findings.push(error("DATA_LIST_FORM_LAYOUTVIEW_RESOURCE_DRIFT", "Type 1 custom Data List form Layout.LayoutView must be equivalent to LayoutInResources[0].Resource. Runtime reads LayoutView, while export/materialization also carries LayoutInResources; both surfaces must stay aligned.", detail));
  }
}

function isPlaceholderLayoutView(value) {
  if (!isObject(value)) return false;
  const source = String(value.source || value.generatedBy || "").toLowerCase();
  return source.includes("minimal-resource-graph") || (!Array.isArray(value.children) && !value.type && !value._ak_c);
}

function sameStableJson(left, right) {
  return stableJson(left) === stableJson(right);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function validateListDisplayAssignments(decoded, context) {
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    if (isExplicitListExempt(child)) continue;
    const listTitle = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    const layoutViewValue = child?.List?.LayoutView || child?.ListModel?.LayoutView || child?.LayoutView;
    const layoutView = parseJsonMaybe(layoutViewValue);
    if (!isObject(layoutView)) {
      context.findings.push(error("DATA_LIST_FORM_LAYOUT_DISPLAY_SETTINGS_MISSING", "Every generated business Data List must assign New/Edit/View to custom Data List forms through LayoutView.add/edit/view. Default layouts are not allowed.", { list: listTitle, childIndex }));
      continue;
    }
    const layouts = new Map(asArray(child?.Layouts || child?.Item?.Layouts).map((layout) => [String(layout?.LayoutID || ""), layout]));
    for (const usage of FORM_USAGES) {
      const value = layoutView?.[usage];
      if (value === undefined || value === null || String(value).trim() === "") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_MISSING", "Every generated business Data List must assign add/edit/view to custom Data List form layout IDs.", { list: listTitle, usage, childIndex }));
        continue;
      }
      const layoutId = String(value);
      if (layoutId.toLowerCase() === "default") {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_DEFAULT_USAGE_FORBIDDEN", "Generated business Data Lists must not use Yeeflow default layout for New Item, Edit Item, or View Item. Generate and assign custom Data List forms instead.", { list: listTitle, usage, actual: layoutId, childIndex }));
        continue;
      }
      const layout = layouts.get(layoutId);
      if (!layout) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_UNRESOLVED", "Data List form display setting points to a layout ID that does not belong to this list.", { list: listTitle, usage, layoutId, childIndex }));
        continue;
      }
      if (Number(layout?.Type) !== 1) {
        context.findings.push(error("DATA_LIST_FORM_LAYOUT_USAGE_NOT_CUSTOM_FORM", "Data List form display setting must point to a Type 1 custom Data List form layout.", { list: listTitle, usage, layoutId, actualType: layout?.Type ?? null, childIndex }));
      }
    }
  }
}

function isExplicitListExempt(child) {
  const candidates = [
    child?.dataListFormLayoutPolicy,
    child?.customFormPolicy,
    child?.formLayoutPolicy,
    child?.List?.dataListFormLayoutPolicy,
    child?.List?.customFormPolicy,
    child?.List?.formLayoutPolicy,
    child?.ListModel?.dataListFormLayoutPolicy,
    child?.ListModel?.customFormPolicy,
    child?.ListModel?.formLayoutPolicy,
  ].map((value) => String(value || "").toLowerCase());
  return Boolean(child?.IsSystem || child?.List?.IsSystem || child?.ListModel?.IsSystem || candidates.some((value) => /system-support-exempt|support-exempt|custom-forms-exempt|exempt/.test(value)));
}

function buildUsageByLayoutId(decoded) {
  const usageByLayoutId = new Map();
  for (const child of asArray(decoded?.Childs || decoded?.Data?.Childs)) {
    const view = parseJsonMaybe(child?.List?.LayoutView || child?.ListModel?.LayoutView || child?.LayoutView);
    for (const usage of ["add", "edit", "view"]) {
      const layoutId = view?.[usage];
      if (!layoutId) continue;
      const key = String(layoutId);
      if (!usageByLayoutId.has(key)) usageByLayoutId.set(key, []);
      usageByLayoutId.get(key).push(usage);
    }
  }
  return usageByLayoutId;
}

function inferExpectedTemplate(form, usages) {
  const title = String(form.title || "").toLowerCase();
  if (usages.includes("view") || /\bview\b|detail/.test(title)) return { templateId: VIEW_TEMPLATE_ID, formUsage: "view" };
  if (usages.includes("add") || usages.includes("edit") || /new|edit|create/.test(title)) return { templateId: NEW_EDIT_TEMPLATE_ID, formUsage: "new/edit" };
  return { templateId: "", formUsage: "" };
}

function parseResource(value) {
  const parsed = parseJsonMaybe(value);
  if (isObject(parsed)) return parsed;
  if (isObject(value)) return value;
  return null;
}

function resolveTemplateId(resource) {
  for (const node of flatten(resource).map((entry) => entry.node)) {
    for (const candidate of [
      node?.derivedFromDataListFormLayoutTemplate,
      node?.dataListFormLayoutTemplateId,
      node?.attrs?.derivedFromDataListFormLayoutTemplate,
      node?.attrs?.dataListFormLayoutTemplateId,
      node?.attrs?.templateId,
    ]) {
      if (TEMPLATE_IDS.has(String(candidate || ""))) return String(candidate);
    }
  }
  return "";
}

function flatten(resource) {
  const entries = [];
  function visit(node, pointer, ancestors) {
    if (!isObject(node)) return;
    entries.push({ node, pointer, ancestors });
    for (const [key, child] of Object.entries(node)) {
      if (Array.isArray(child)) child.forEach((item, index) => visit(item, `${pointer}.${key}[${index}]`, ancestors.concat(node)));
      else if (isObject(child) && key !== "attrs") visit(child, `${pointer}.${key}`, ancestors.concat(node));
    }
  }
  visit(resource, "$", []);
  return entries;
}

function pointerForNode(resource, target) {
  return flatten(resource).find((entry) => entry.node === target)?.pointer || "$";
}

function findFirstByIdentity(resource, identity) {
  return flatten(resource).find((entry) => hasIdentity(entry.node, identity))?.node || null;
}

function findAllByIdentity(resource, identity) {
  return flatten(resource).filter((entry) => hasIdentity(entry.node, identity)).map((entry) => entry.node);
}

function hasIdentity(node, identity) {
  return identityCandidates(node).includes(identity);
}

function identityCandidates(node) {
  return [
    node?.id,
    node?.name,
    node?.label,
    node?.nv_label,
    node?.nav_label,
    node?.attrs?.name,
    node?.attrs?.nv_label,
    node?.attrs?.nav_label,
    node?.attrs?.goldenReferenceId,
    node?.attrs?.derivedFromGoldenReference,
  ].filter(Boolean).map(String);
}

function isInsideAllowedBusinessSlot(entry) {
  return entry.ancestors.some((ancestor) => identityCandidates(ancestor).some((id) => ALLOWED_BUSINESS_SLOTS.has(id)));
}

function isBusinessControlType(type) {
  return DATASET_TYPES.has(type) || DATA_ANALYTICS_TYPES.has(type) || ["input", "input_number", "radio", "select", "checkbox", "switch", "dynamic-field", "dynamic-user", "dynamic-image", "dynamic-file", "button"].includes(type);
}

function isColumnFullWidth(node) {
  const style = node?.attrs?.style || {};
  return tupleValue(style.direction) === "column" && tupleValue(style.widthtype) === "1";
}

function isZeroTokenPadding(value) {
  if (!Array.isArray(value) || !isObject(value[1])) return false;
  return Object.entries(ZERO_PADDING).every(([key, expected]) => value[1]?.[key] === expected);
}

function normalizeColor(value) {
  return String(value || "").trim().toLowerCase();
}

function tupleValue(value) {
  return Array.isArray(value) ? String(value[1] ?? "") : String(value ?? "");
}

function hasActionConfiguration(node) {
  const attrs = node?.attrs || {};
  return Boolean(attrs.control_action || attrs.action || attrs.actions || node?.actions || node?.action || node?.control_action);
}

function isActionLooking(node) {
  const text = identityCandidates(node).join(" ");
  return /button|btn_|action|save|submit|delete|edit|export|add|create|operation/i.test(text);
}

function tableRows(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!/^\s*\|/.test(line) || /^\s*\|\s*:?-{3,}/.test(line)) continue;
    rows.push({ raw: line.trim() });
  }
  return rows;
}

function parsePlannedDataLists(text) {
  const section = extractSection(text, /^##\s+4\.\s+Data Lists and Document Libraries Plan/im);
  if (!section.trim()) return [];
  const names = [];
  for (const match of section.matchAll(/^###\s+4\.[x0-9]+\s+(.+?)\s*$/gim)) {
    const name = cleanName(match[1]);
    if (!name || isPlaceholderName(name)) continue;
    names.push(name);
  }
  return unique(names);
}

function lineMentionsList(line, list) {
  const lineKey = norm(line);
  const listKey = norm(list);
  return Boolean(listKey && (lineKey.includes(listKey) || listKey.includes(lineKey)));
}

function subsectionForList(section, list) {
  const headings = [...section.matchAll(/^###\s+10\.[x0-9]+\s+(.+?)\s*$/gim)];
  for (let index = 0; index < headings.length; index += 1) {
    const match = headings[index];
    const name = cleanName(match[1]);
    if (!lineMentionsList(name, list)) continue;
    const next = headings[index + 1]?.index ?? section.length;
    return section.slice(match.index, next);
  }
  return "";
}

function hasExplicitFormExemption(text) {
  return /custom\s+data\s+list\s+forms?\s+(?:not\s+required|not\s+applicable|n\/a)|(?:system|support|technical|hidden)\s+(?:list|resource)[^.\n|]*(?:exempt|no\s+custom\s+forms|not\s+required)|form\s+layout\s+exemption/i.test(text || "");
}

function hasNewEditPlan(text) {
  const body = String(text || "");
  return body.includes(NEW_EDIT_TEMPLATE_ID) && /new\s*\/\s*edit|\bnew\b|\bedit\b/i.test(body);
}

function hasViewPlan(text) {
  const body = String(text || "");
  return body.includes(VIEW_TEMPLATE_ID) && /\bview\b|detail/i.test(body);
}

function cleanName(value) {
  return String(value ?? "").replace(/<[^>]+>/g, "").replace(/`/g, "").replace(/\s+/g, " ").trim();
}

function isPlaceholderName(value) {
  const text = cleanName(value);
  return !text || /^x$/i.test(text) || /^<.*>$/.test(String(value || "").trim()) || /^(list|library|data list|document library|name)$/i.test(text);
}

function norm(value) {
  return cleanName(value).replace(/[_-]+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function unique(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = norm(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function extractSection(text, marker) {
  const match = marker.exec(text);
  if (!match) return "";
  const start = match.index;
  const next = text.slice(start + match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? text.slice(start) : text.slice(start, start + match[0].length + next);
}

function readJson(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "File is missing.", { path: filePath }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not parse JSON: ${err.message}`, { path: filePath }));
    return null;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--registry") args.registry = argv[++index] || REGISTRY_PATH;
    else if (token === "--resource") args.resource = argv[++index];
    else if (token === "--template") args.template = argv[++index];
    else if (token === "--form-usage") args.formUsage = argv[++index];
    else if (token === "--package") args.package = argv[++index];
    else if (token === "--plan" || token === "--app-plan") args.plan = argv[++index];
    else throw new Error(`Unexpected argument: ${token}`);
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-data-list-form-layout-template.mjs --registry docs/reference/data-list-form-layout-templates.json
  node scripts/validate-data-list-form-layout-template.mjs --resource <form-resource.json> --template <template-id> --form-usage <new/edit/view>
  node scripts/validate-data-list-form-layout-template.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]`);
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, detail };
}
