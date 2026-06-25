#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asArray, isObject, parseJsonMaybe, readDecodedYapk } from "./lib/yapk-decode-utils.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/data-list-form-field-layout-templates.json");
const TEMPLATE_ID = "data_list_form_fields_grid_v1_1";
const ROOT_WRAPPER_ID = "form_grid_fields_wrapper";
const REQUIRED_PLACEMENT_SLOT = "section_content_area";
const REQUIRED_FULL_ROW_TYPES = new Set(["textarea", "richtext", "list"]);
const FIELD_CONTROL_TYPES = new Set([
  "input",
  "textarea",
  "richtext",
  "list",
  "lookup",
  "radio",
  "checkbox",
  "tag",
  "datepicker",
  "date",
  "input_number",
  "number",
  "identity-picker",
  "user-picker",
  "location-picker",
  "file-upload",
  "image-upload",
  "dynamic-field",
  "dynamic-user",
  "dynamic-image",
  "dynamic-file",
  "switch",
  "select",
]);

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.resource && !args.package && !args.plan)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateDataListFormFieldsTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateDataListFormFieldsTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry || REGISTRY_PATH);
  const registry = readJson(registryPath, findings, "DATA_LIST_FORM_FIELDS_REGISTRY_MISSING");
  validateRegistry(registry, findings, registryPath);

  if (options.resource) {
    const resource = readJson(path.resolve(options.resource), findings, "DATA_LIST_FORM_FIELDS_RESOURCE_MISSING");
    validateResource(resource, {
      findings,
      source: path.basename(options.resource),
      requirePlacement: options.surface === "data-list-form",
      requireWrapperWhenFieldsExist: true,
    });
  }

  if (options.package) validatePackage(path.resolve(options.package), { findings });
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

function validateRegistry(registry, findings, registryPath) {
  if (!registry) return;
  if (!asArray(registry.approvedTemplateIds).includes(TEMPLATE_ID)) {
    findings.push(error("DATA_LIST_FORM_FIELDS_TEMPLATE_REFERENCE_MISSING", "Data List Form field-layout registry must include data_list_form_fields_grid_v1_1.", { templateId: TEMPLATE_ID }));
  }
  const reference = asArray(registry.templates).find((item) => item?.templateId === TEMPLATE_ID);
  if (!reference) {
    findings.push(error("DATA_LIST_FORM_FIELDS_TEMPLATE_REFERENCE_MISSING", "Data List Form field-layout registry is missing the approved template reference.", { templateId: TEMPLATE_ID }));
    return;
  }
  if (reference.rootWrapperId !== ROOT_WRAPPER_ID || reference.rootControlType !== "flex_grid") {
    findings.push(error("DATA_LIST_FORM_FIELDS_TEMPLATE_ROOT_CONTRACT_INVALID", "Data List Form field-layout registry must identify form_grid_fields_wrapper as a flex_grid root.", { templateId: TEMPLATE_ID }));
  }
  const templatePath = path.resolve(path.dirname(registryPath), "..", "..", reference.sourceTemplate || "");
  if (!fs.existsSync(templatePath)) {
    findings.push(error("DATA_LIST_FORM_FIELDS_TEMPLATE_FILE_MISSING", "Data List Form field-layout template file is missing.", { templateId: TEMPLATE_ID, sourceTemplate: reference.sourceTemplate }));
    return;
  }
  const template = readJson(templatePath, findings, "DATA_LIST_FORM_FIELDS_TEMPLATE_PARSE_FAILED");
  validateResource(template, { findings, source: reference.displayName || TEMPLATE_ID, requirePlacement: false, requireWrapperWhenFieldsExist: true, registryMode: true });
}

function validatePackage(packagePath, context) {
  if (!fs.existsSync(packagePath)) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return;
  }
  let decoded;
  try {
    ({ decoded } = readDecodedYapk(packagePath));
  } catch (err) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return;
  }
  for (const form of collectDataListForms(decoded)) {
    validateResource(form.resource, {
      findings: context.findings,
      source: `${form.listTitle} / ${form.title}`,
      requirePlacement: true,
      requireWrapperWhenFieldsExist: true,
    });
  }
}

function validateAppPlan(planPath, findings) {
  if (!fs.existsSync(planPath)) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_MISSING", "App Plan file is missing.", { plan: planPath }));
    return;
  }
  const text = fs.readFileSync(planPath, "utf8");
  const section = extractSection(text, /^##\s+10\.\s+Custom Data List Forms Plan/im);
  if (!section.trim()) return;
  const hasConcreteCustomFormRows = tableRows(section).some((row) => /\|\s*(New|Edit|View|New\/Edit)\s*\|/i.test(row.raw));
  if (!hasConcreteCustomFormRows) return;
  if (/intentionally has no current-record field controls/i.test(section)) return;
  if (!/Form Fields Layout Template Selection/i.test(section)) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_SELECTION_TABLE_MISSING", "Custom Data List Forms Plan must include a Form Fields Layout Template Selection table when generated forms display current-record fields."));
    return;
  }
  const selectionBlock = section.split(/#### Custom Form Actions|#### Sub List List Actions|##\s+11\./i)[0].split(/#### Form Fields Layout Template Selection/i)[1] || "";
  const rows = tableRows(selectionBlock).filter((row) => row.raw.includes(TEMPLATE_ID));
  if (!rows.length) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_TEMPLATE_SELECTION_REQUIRED", "Form Fields Layout Template Selection must select data_list_form_fields_grid_v1_1 for generated current-record field groups."));
  }
  for (const row of rows) validateAppPlanFieldGridRow(row.raw, findings);
}

function validateAppPlanFieldGridRow(row, findings) {
  const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
  const pc = Number(cells[4]);
  const tablet = Number(cells[5]);
  const mobile = Number(cells[6]);
  if (!Number.isFinite(pc) || pc < 2 || pc > 3) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_PC_COLUMNS_INVALID", "PC/laptop columns for data_list_form_fields_grid_v1_1 must be 2 or 3.", { row }));
  }
  if (Number.isFinite(tablet) && Number.isFinite(pc) && tablet > pc) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_TABLET_COLUMNS_INVALID", "Tablet columns must not exceed PC/laptop columns.", { row }));
  }
  if (Number.isFinite(mobile) && mobile !== 1) {
    findings.push(error("DATA_LIST_FORM_FIELDS_APP_PLAN_MOBILE_COLUMNS_INVALID", "Mobile columns should be 1 for data_list_form_fields_grid_v1_1.", { row }));
  }
}

function validateResource(rawResource, context) {
  const resource = normalizeTemplateResource(rawResource);
  if (!isObject(resource)) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_RESOURCE_INVALID", "Data List Form field-layout resource must parse as an object.", { source: context.source }));
    return;
  }
  const wrappers = findAllByIdentity(resource, ROOT_WRAPPER_ID);
  const fieldControls = flatten(resource).filter((entry) => isFieldControl(entry.node));
  if (!wrappers.length && context.requireWrapperWhenFieldsExist && fieldControls.length) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_WRAPPER_MISSING", "Generated current-record field controls must be placed inside form_grid_fields_wrapper.", { source: context.source, fieldControlCount: fieldControls.length }));
    return;
  }
  for (const wrapper of wrappers) validateWrapper(wrapper, context);
  for (const entry of fieldControls) {
    if (!isInsideAny(entry.node, wrappers)) {
      context.findings.push(error("DATA_LIST_FORM_FIELDS_CONTROL_OUTSIDE_WRAPPER", "Current-record field controls must not be placed outside form_grid_fields_wrapper.", { source: context.source, path: entry.pointer, type: entry.node?.type, identities: identityCandidates(entry.node) }));
    }
  }
  if (context.requirePlacement) {
    for (const wrapper of wrappers) {
      if (!hasAncestorIdentity(resource, wrapper, REQUIRED_PLACEMENT_SLOT)) {
        context.findings.push(error("DATA_LIST_FORM_FIELDS_PLACEMENT_INVALID", "When used with Data List Form Layouts v1.1, form_grid_fields_wrapper must be placed inside section_content_area.", { source: context.source }));
      }
    }
  }
}

function validateWrapper(wrapper, context) {
  if (wrapper.type !== "flex_grid") {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_WRAPPER_TYPE_INVALID", "form_grid_fields_wrapper must remain a flex_grid control.", { source: context.source, actual: wrapper.type }));
  }
  validateGrid(wrapper, context, "form_grid_fields_wrapper");
}

function validateGrid(grid, context, gridLabel) {
  const columnCounts = responsiveColumnCounts(grid);
  const pc = columnCounts.get("1");
  const tablet = columnCounts.get("2");
  const mobile = columnCounts.get("3");
  if (pc !== undefined && (pc < 2 || pc > 3)) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_GRID_PC_COLUMNS_INVALID", "PC/laptop Grid columns should be 2 or 3.", { source: context.source, grid: gridLabel, pcColumns: pc }));
  }
  if (tablet !== undefined && pc !== undefined && tablet > pc) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_GRID_TABLET_COLUMNS_INVALID", "Tablet Grid columns must not exceed PC/laptop columns.", { source: context.source, grid: gridLabel, pcColumns: pc, tabletColumns: tablet }));
  }
  if (mobile !== undefined && mobile !== 1) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_GRID_MOBILE_COLUMNS_INVALID", "Mobile Grid columns should be 1.", { source: context.source, grid: gridLabel, mobileColumns: mobile }));
  }

  for (const child of asArray(grid.children)) {
    if (!isObject(child)) continue;
    const span = responsiveColumnSpan(child);
    for (const [breakpoint, count] of columnCounts.entries()) {
      const childSpan = span.get(breakpoint);
      if (childSpan !== undefined && childSpan > count) {
        context.findings.push(error("DATA_LIST_FORM_FIELDS_GRID_COLUMN_SPAN_EXCEEDS_COLUMNS", "A field or group column span must not exceed its parent Grid column count for the same breakpoint.", { source: context.source, grid: gridLabel, child: identityCandidates(child), breakpoint, columnCount: count, columnSpan: childSpan }));
      }
    }
    if (isFieldControl(child)) validateFieldControl(child, context);
    if (isFullRowRequired(child)) validateFullRowSpan(child, columnCounts, context, gridLabel);
    for (const entry of flatten(child)) {
      if (entry.node === child) continue;
      if (isFieldControl(entry.node)) validateFieldControl(entry.node, context);
      if (isFullRowRequired(entry.node)) {
        const host = nearestDirectChildOfGrid(entry.node, grid);
        if (host) validateFullRowSpan(host, columnCounts, context, gridLabel, entry.node);
      }
    }
    if (child.type === "flex_grid") validateGrid(child, context, identityCandidates(child)[0] || "nested-grid");
    for (const nested of flatten(child).filter((entry) => entry.node?.type === "flex_grid").map((entry) => entry.node)) {
      if (nested !== child) validateGrid(nested, context, identityCandidates(nested)[0] || "nested-grid");
    }
  }
}

function validateFieldControl(control, context) {
  if (!hasZeroMargin(control)) {
    context.findings.push(error("DATA_LIST_FORM_FIELDS_FIELD_MARGIN_NOT_ZERO", "Every field control inside form_grid_fields_wrapper must explicitly set margin to zero.", { source: context.source, type: control.type, identities: identityCandidates(control) }));
  }
}

function validateFullRowSpan(hostControl, columnCounts, context, gridLabel, originalControl = hostControl) {
  const span = responsiveColumnSpan(hostControl);
  for (const [breakpoint, count] of columnCounts.entries()) {
    const actual = span.get(breakpoint);
    if (actual !== count) {
      context.findings.push(error("DATA_LIST_FORM_FIELDS_FULL_ROW_SPAN_INVALID", "Multiple line, Rich text, and Sub list controls must span the full parent Grid width on every configured breakpoint.", {
        source: context.source,
        grid: gridLabel,
        controlType: originalControl.type,
        host: identityCandidates(hostControl),
        breakpoint,
        expectedColumnSpan: count,
        actualColumnSpan: actual ?? null,
      }));
    }
  }
}

function responsiveColumnCounts(grid) {
  const map = new Map();
  const columns = grid?.attrs?.columns || {};
  for (const [breakpoint, config] of Object.entries(columns)) {
    const count = asArray(config?.list).length || 0;
    if (count) map.set(String(breakpoint), count);
  }
  return map;
}

function responsiveColumnSpan(control) {
  const map = new Map();
  const position = control?.attrs?.common?.grid?.position || control?.attrs?.grid?.position;
  if (Array.isArray(position)) {
    for (let index = 1; index < position.length; index += 1) {
      const value = position[index];
      const span = Number(value?.cSpan);
      if (Number.isFinite(span)) map.set(String(index), span);
    }
  }
  const scalar = Number(control?.attrs?.common?.grid?.cSpan ?? control?.attrs?.grid?.cSpan);
  if (Number.isFinite(scalar)) map.set("1", scalar);
  return map;
}

function hasZeroMargin(control) {
  return isZeroMargin(control?.attrs?.common?.margin) || isZeroMargin(control?.attrs?.margin);
}

function isZeroMargin(value) {
  const obj = Array.isArray(value) ? value.find((item) => isObject(item)) : value;
  if (!isObject(obj)) return false;
  return ["top", "right", "bottom", "left"].every((side) => isZeroValue(obj[side]));
}

function isZeroValue(value) {
  return value === 0 || value === "0" || value === "--sp--s0" || value === "var(--sp--s0)";
}

function isFieldControl(node) {
  return isObject(node) && FIELD_CONTROL_TYPES.has(String(node.type || ""));
}

function isFullRowRequired(node) {
  return isObject(node) && REQUIRED_FULL_ROW_TYPES.has(String(node.type || ""));
}

function normalizeTemplateResource(raw) {
  if (raw?.templateResource) return raw.templateResource;
  if (raw?._ak_c) return raw._ak_c;
  return raw;
}

function collectDataListForms(decoded) {
  const forms = [];
  for (const [childIndex, child] of asArray(decoded?.Childs || decoded?.Data?.Childs).entries()) {
    const listTitle = child?.List?.Title || child?.ListModel?.Title || child?.Title || child?.Name || `Childs[${childIndex}]`;
    for (const [layoutIndex, layout] of asArray(child?.Layouts || child?.Item?.Layouts).entries()) {
      if (Number(layout?.Type) !== 1) continue;
      const resource = parseResource(asArray(layout?.LayoutInResources)[0]?.Resource);
      if (!resource) continue;
      forms.push({ listTitle, title: layout?.Title || `Layouts[${layoutIndex}]`, resource });
    }
  }
  return forms;
}

function parseResource(resource) {
  const parsed = parseJsonMaybe(resource);
  return normalizeTemplateResource(parsed);
}

function findAllByIdentity(root, identity) {
  return flatten(root).filter((entry) => hasIdentity(entry.node, identity)).map((entry) => entry.node);
}

function findEntry(root, node) {
  return flatten(root).find((entry) => entry.node === node) || null;
}

function hasAncestorIdentity(root, node, identity) {
  const entry = findEntry(root, node);
  return Boolean(entry?.ancestors?.some((ancestor) => hasIdentity(ancestor, identity)));
}

function isInsideAny(node, ancestors) {
  return ancestors.some((ancestor) => ancestor === node || containsNode(ancestor, node));
}

function containsNode(root, target) {
  if (root === target) return true;
  for (const child of asArray(root?.children)) {
    if (containsNode(child, target)) return true;
  }
  return false;
}

function nearestDirectChildOfGrid(node, grid) {
  for (const child of asArray(grid.children)) {
    if (child === node || containsNode(child, node)) return child;
  }
  return null;
}

function flatten(root, pointer = "$", ancestors = []) {
  if (!isObject(root)) return [];
  const current = { node: root, pointer, ancestors };
  const children = asArray(root.children).flatMap((child, index) => flatten(child, `${pointer}.children[${index}]`, ancestors.concat(root)));
  return [current].concat(children);
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
    node?.attrs?.name,
    node?.attrs?.nv_label,
    node?.attrs?.nav_label,
    node?.attrs?.dataListFormFieldsTemplateId,
    node?.attrs?.derivedFromDataListFormFieldsTemplate,
    node?.dataListFormFieldsTemplateId,
    node?.derivedFromDataListFormFieldsTemplate,
  ].filter(Boolean).map(String);
}

function tableRows(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{3,}:?/.test(line))
    .map((raw) => ({ raw }));
}

function extractSection(text, headingPattern) {
  const match = headingPattern.exec(text);
  if (!match) return "";
  const start = match.index;
  const rest = text.slice(start);
  const next = rest.slice(match[0].length).search(/\n##\s+\d+\.\s+/);
  return next === -1 ? rest : rest.slice(0, match[0].length + next);
}

function readJson(file, findings, code) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    findings.push(error(code, `Could not read JSON: ${err.message}`, { file }));
    return null;
  }
}

function error(code, message, detail = {}) {
  return { level: "error", code, message, detail };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help") args.help = true;
    else if (token === "--registry") {
      args.registry = argv[i + 1] || REGISTRY_PATH;
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) i += 1;
    } else if (token === "--resource") {
      args.resource = argv[i + 1];
      i += 1;
    } else if (token === "--package") {
      args.package = argv[i + 1];
      i += 1;
    } else if (token === "--plan") {
      args.plan = argv[i + 1];
      i += 1;
    } else if (token === "--surface") {
      args.surface = argv[i + 1];
      i += 1;
    } else {
      throw new Error(`Unexpected argument: ${token}`);
    }
  }
  return args;
}

function printUsage() {
  console.error([
    "Usage:",
    "  node scripts/validate-data-list-form-fields-template.mjs --registry docs/reference/data-list-form-field-layout-templates.json",
    "  node scripts/validate-data-list-form-fields-template.mjs --resource <resource.json> [--surface data-list-form]",
    "  node scripts/validate-data-list-form-fields-template.mjs --package <app.yapk> [--plan <yeeflow-app-plan.md>]",
    "  node scripts/validate-data-list-form-fields-template.mjs --plan <yeeflow-app-plan.md>",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
