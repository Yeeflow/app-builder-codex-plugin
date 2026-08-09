#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage(exitCode = 1) {
  const out = [
    "Usage:",
    "  node scripts/validate-tab-gantt-golden-references.mjs <decoded-app-or-fixture.json> [--strict]",
    "",
    "Validates Tab workspace structure and linked-activity Gantt field compatibility without emitting raw resources.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, strict: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--strict") args.strict = true;
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  return args;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return value === null || value === undefined ? "" : String(value);
}

function parseMaybe(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodedRoot(value) {
  const parsed = parseMaybe(value) || value;
  const first = parseMaybe(parsed?.Data) || parsed?.Data || parsed;
  return parseMaybe(first?.Data) || first?.Data || first;
}

function fieldName(value) {
  if (typeof value === "string") return value;
  if (isObject(value)) return text(value.FieldName || value.fieldName || value.InternalName || value.internalName);
  return "";
}

function parsedRules(field) {
  const value = field?.Rules;
  if (isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  return parseMaybe(value);
}

function listIndex(data) {
  const index = new Map();
  const candidates = [
    ...asArray(data?.Childs),
    ...asArray(data?.dataLists),
    ...asArray(data?.DataLists),
  ];
  for (const entry of candidates) {
    const model = entry?.ListModel || entry?.List || entry;
    const id = text(model?.ListID || entry?.ListID || model?.ID || entry?.ID);
    if (!id) continue;
    const fields = new Map();
    for (const field of asArray(entry?.Defs || entry?.Fields || model?.Defs || model?.Fields)) {
      for (const key of [field?.FieldName, field?.InternalName, field?.FieldID]) {
        if (text(key)) fields.set(text(key), field);
      }
    }
    index.set(id, { id, fields });
  }
  return index;
}

function collectControls(data) {
  const controls = [];
  const visited = new WeakSet();
  const visit = (value, pointer) => {
    if (!isObject(value) && !Array.isArray(value)) return;
    if (isObject(value)) {
      if (visited.has(value)) return;
      visited.add(value);
      if (text(value.type)) controls.push({ control: value, pointer });
      for (const [key, child] of Object.entries(value)) visit(child, `${pointer}.${key}`);
      return;
    }
    value.forEach((child, index) => visit(child, `${pointer}[${index}]`));
  };
  for (const [index, control] of asArray(data?.controls || data?.Controls).entries()) visit(control, `$.controls[${index}]`);
  for (const [childIndex, child] of asArray(data?.Childs).entries()) {
    for (const [layoutIndex, layout] of asArray(child?.Layouts).entries()) {
      for (const [resourceIndex, resource] of asArray(layout?.LayoutInResources).entries()) {
        const decoded = parseMaybe(resource?.Resource);
        if (decoded) visit(decoded, `$.Childs[${childIndex}].Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].Resource`);
      }
    }
  }
  for (const [layoutIndex, layout] of asArray(data?.Item?.Layouts).entries()) {
    for (const [resourceIndex, resource] of asArray(layout?.LayoutInResources).entries()) {
      const decoded = parseMaybe(resource?.Resource);
      if (decoded) visit(decoded, `$.Item.Layouts[${layoutIndex}].LayoutInResources[${resourceIndex}].Resource`);
    }
  }
  return controls;
}

function hasCurrentListDataId(value) {
  if (Array.isArray(value)) return value.some(hasCurrentListDataId);
  if (!isObject(value)) return false;
  if (text(value.exprType) === "list_field" && text(value.prop || value.id) === "ListDataID") return true;
  return Object.values(value).some(hasCurrentListDataId);
}

function push(findings, severity, code, message, path, detail = {}) {
  findings.push({ severity, code, message, path, ...detail });
}

function validateTabs(control, pointer, findings) {
  const tabs = asArray(control.children);
  if (tabs.length < 2) push(findings, "error", "TAB_ITEMS_MINIMUM_REQUIRED", "Tab workspace requires at least two ak-tabs-tab children.", pointer);
  let defaults = 0;
  tabs.forEach((tab, index) => {
    const path = `${pointer}.children[${index}]`;
    if (text(tab?.type) !== "ak-tabs-tab") push(findings, "error", "TAB_CHILD_TYPE_INVALID", "Every direct Tab child must be ak-tabs-tab.", path);
    if (!text(tab?.id)) push(findings, "error", "TAB_ITEM_ID_MISSING", "Each Tab needs a stable id.", path);
    if (!text(tab?.label)) push(findings, "error", "TAB_ITEM_TITLE_MISSING", "Each Tab needs a non-empty label.", path);
    if (!asArray(tab?.children).length) push(findings, "error", "TAB_ITEM_CONTENT_MISSING", "Each Tab needs a non-empty content container or control subtree.", path);
    if (tab?.attrs?.isDefault === true) defaults += 1;
    if (tab?.attrs?.isDefault === true && tab?.attrs?.isDesignDefault !== true) push(findings, "error", "TAB_DEFAULT_DESIGN_FLAG_INVALID", "The runtime default tab must also be the Designer default tab.", path);
  });
  if (defaults !== 1) push(findings, "error", "TAB_DEFAULT_COUNT_INVALID", "Exactly one Tab must be the default.", pointer, { observed: defaults });
}

function validateLookup(field, sourceListId, multiple, role, pointer, findings) {
  if (text(field?.Type).toLowerCase() !== "lookup") {
    push(findings, "error", `GANTT_${role}_LOOKUP_TYPE_REQUIRED`, `${role} must use a Lookup control type.`, pointer);
    return;
  }
  const rules = parsedRules(field);
  if (!rules) {
    push(findings, "error", `GANTT_${role}_LOOKUP_RULES_MISSING`, `${role} Lookup must have parseable Rules metadata.`, pointer);
    return;
  }
  if (rules.multiple !== multiple) push(findings, "error", `GANTT_${role}_LOOKUP_${multiple ? "MULTIPLE_REQUIRED" : "SINGLE_REQUIRED"}`, `${role} Lookup multiple must be ${multiple}.`, pointer);
  if (text(rules.listid) !== sourceListId) push(findings, "error", `GANTT_${role}_LOOKUP_SOURCE_MISMATCH`, `${role} Lookup must target the selected Gantt source Data List.`, pointer);
}

function validateGantt(control, pointer, lists, findings) {
  const data = control?.attrs?.data || {};
  const sourceId = text(data?.list?.ListID);
  const source = lists.get(sourceId);
  if (!sourceId || !source) {
    push(findings, "error", "GANTT_SOURCE_LIST_UNRESOLVED", "Gantt attrs.data.list.ListID must resolve to a selected Data List.", pointer);
    return;
  }
  const gantt = data?.gantt || {};
  const mappings = gantt?.fields || {};
  const fieldFor = (key) => source.fields.get(fieldName(mappings[key]));
  const requireField = (key, code) => {
    const name = fieldName(mappings[key]);
    const field = fieldFor(key);
    if (!name || !field) push(findings, "error", code, `${key} must reference a field on the selected Gantt source Data List.`, pointer);
    return field;
  };
  requireField("text", "GANTT_TEXT_FIELD_UNRESOLVED");
  const start = requireField("start_date", "GANTT_START_DATE_FIELD_UNRESOLVED");
  const end = requireField("end_date", "GANTT_END_DATE_FIELD_UNRESOLVED");
  if (start && text(start.FieldType) !== "Datetime") push(findings, "error", "GANTT_START_DATE_FIELD_TYPE_INVALID", "Start date must be a Datetime field.", pointer);
  if (end && text(end.FieldType) !== "Datetime") push(findings, "error", "GANTT_END_DATE_FIELD_TYPE_INVALID", "End date must be a Datetime field.", pointer);

  const dependency = requireField("dependency", "GANTT_DEPENDENCY_FIELD_UNRESOLVED");
  if (dependency) validateLookup(dependency, sourceId, true, "DEPENDENCY", pointer, findings);
  const progress = requireField("progress", "GANTT_PROGRESS_FIELD_UNRESOLVED");
  if (progress) {
    if (text(progress.FieldType) !== "Decimal") push(findings, "error", "GANTT_PROGRESS_FIELD_TYPE_INVALID", "Percent complete must use Decimal storage.", pointer);
    if (text(progress.Type).toLowerCase() !== "percent") push(findings, "error", "GANTT_PROGRESS_PERCENT_TYPE_REQUIRED", "Percent complete must use the percent control type.", pointer);
    const rules = parsedRules(progress);
    if (!rules || Number(rules.number_min) !== 0 || Number(rules.number_max) !== 1) push(findings, "error", "GANTT_PROGRESS_PERCENT_RANGE_INVALID", "Percent complete Rules must use the normalized 0..1 range.", pointer);
  }
  const parentName = fieldName(mappings.parent);
  if (parentName) {
    const parent = fieldFor("parent");
    if (!parent) push(findings, "error", "GANTT_PARENT_FIELD_UNRESOLVED", "Mapped Parent must exist on the selected Gantt source Data List.", pointer);
    else validateLookup(parent, sourceId, false, "PARENT", pointer, findings);
  }

  const filter = asArray(data.filter).find((item) => text(item?.left));
  if (!filter || !hasCurrentListDataId(filter.right)) push(findings, "error", "GANTT_PARENT_FILTER_CURRENT_RECORD_REQUIRED", "Linked-activity Gantt requires a parent lookup filter bound to the current ListDataID.", pointer);
  const atts = gantt?.atts || {};
  if (atts.allowadd === true) {
    const pass = asArray(atts.passvalues).find((item) => text(item?.Name) === text(filter?.left));
    if (!pass || !hasCurrentListDataId(pass.Value)) push(findings, "error", "GANTT_ADD_PARENT_PASSVALUE_REQUIRED", "Add-enabled linked Gantt must pass the current parent ListDataID into the same Activity lookup used by the filter.", pointer);
  }
  if (!text(atts.linkLayout) || text(atts.linkLayout) === "default") push(findings, "error", "GANTT_DETAIL_LAYOUT_REQUIRED", "Linked Gantt must resolve linkLayout to a concrete Activity detail/View layout.", pointer);
}

function main() {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const data = decodedRoot(JSON.parse(fs.readFileSync(input, "utf8")));
  const findings = [];
  const lists = listIndex(data);
  const controls = collectControls(data);
  for (const { control, pointer } of controls) {
    if (text(control.type) === "aktabs") validateTabs(control, pointer, findings);
    if (text(control.type) === "gantt") validateGantt(control, pointer, lists, findings);
  }
  const report = {
    status: findings.some((finding) => finding.severity === "error") ? "fail" : "pass",
    mode: args.strict ? "strict" : "standard",
    summary: { tabs: controls.filter(({ control }) => text(control.type) === "aktabs").length, gantts: controls.filter(({ control }) => text(control.type) === "gantt").length, sourceLists: lists.size },
    findings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "fail") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", findings: [{ severity: "error", code: "TAB_GANTT_GOLDEN_REFERENCE_VALIDATION_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
