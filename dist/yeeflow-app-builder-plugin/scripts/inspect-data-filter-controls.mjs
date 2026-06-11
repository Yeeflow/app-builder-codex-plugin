#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_RE = /\bhttps?:\/\/[^\s"')]+/gi;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const TARGET_PAGE_NAMES = new Set(["Dashboard", "Data Report"]);
const PRODUCT_CONTROL_NAMES = [
  "Search filter",
  "Select filter",
  "Checkbox filter",
  "Radio filter",
  "Range filter",
  "Check range",
  "Date filter",
  "Relative period",
  "Hierarchy filter",
  "Sorting filter",
  "Apply button",
  "Remove filters",
];
const VALUE_FILTER_TYPES = new Set([
  "search-filter",
  "select-filter",
  "check-filter",
  "checkbox-filter",
  "radio-filter",
  "range-filter",
  "check-range",
  "date-filter",
  "relative-period",
  "hierarchy-filter",
  "sorting-filter",
  "sorting-filters",
]);
const SPECIAL_FILTER_TYPES = new Set(["apply-button", "remove-filters", "remove-filers"]);
const PRODUCT_TYPE_NAMES = new Map([
  ["search-filter", "Search filter"],
  ["select-filter", "Select filter"],
  ["check-filter", "Checkbox filter"],
  ["checkbox-filter", "Checkbox filter"],
  ["radio-filter", "Radio filter"],
  ["range-filter", "Range filter"],
  ["check-range", "Check range"],
  ["date-filter", "Date filter"],
  ["relative-period", "Relative period"],
  ["hierarchy-filter", "Hierarchy filter"],
  ["sorting-filter", "Sorting filter"],
  ["sorting-filters", "Sorting filter"],
  ["apply-button", "Apply button"],
  ["remove-filters", "Remove filters"],
  ["remove-filers", "Remove filters"],
]);
const APPLY_TYPE_NAMES = new Map([
  ["1", "Value change"],
  ["2", "Click on apply button"],
]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-filter-controls.mjs <input.yap> [<input2.yap> ...] [--page <name>] [--out <report.json>] [--out-dir <normalized-dir>] [--coverage] [--list-known-controls]",
    "",
    "Decodes a Yeeflow .yap read-only, inventories dashboard Data Filter controls, and writes redacted normalized references when --out-dir is provided.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { inputs: [], pages: [], out: null, outDir: null, requireTargetPages: false, coverage: false, listKnownControls: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = argv[++i];
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--page") args.pages.push(argv[++i]);
    else if (arg === "--require-target-pages") args.requireTargetPages = true;
    else if (arg === "--coverage") args.coverage = true;
    else if (arg === "--list-known-controls") args.listKnownControls = true;
    else args.inputs.push(arg);
  }
  if (args.listKnownControls) {
    console.log(JSON.stringify({ productControls: PRODUCT_CONTROL_NAMES, exportTypeMap: Object.fromEntries(PRODUCT_TYPE_NAMES) }, null, 2));
    process.exit(0);
  }
  if (!args.inputs.length) usage();
  return args;
}

function quoteLargeIntegers(jsonText) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function decodeYap(inputPath) {
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing.");
  return { wrapper, resource, data: parseJson(resource.Data) };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function tryParseJson(value) {
  if (Array.isArray(value) || isObject(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (isObject(value)) Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`));
}

function filterVarFromBinding(binding) {
  const text = safeString(binding);
  return text.startsWith("__filter_") ? text.slice("__filter_".length) : "";
}

function isFilterControlType(type) {
  return VALUE_FILTER_TYPES.has(type) || SPECIAL_FILTER_TYPES.has(type);
}

function buildListIndex(data) {
  const byId = new Map();
  for (const child of asArray(data.Childs)) {
    const model = child.ListModel || {};
    const listId = safeString(model.ListID || child.ListID);
    if (!listId) continue;
    const fields = new Map();
    for (const field of asArray(child.Defs)) {
      for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID]) {
        if (safeString(key)) fields.set(safeString(key), field);
      }
    }
    byId.set(listId, {
      placeholder: `<list:${byId.size + 1}>`,
      title: safeString(model.Title || child.Title || model.DisplayName),
      type: model.Type,
      fields,
    });
  }
  return byId;
}

function extractPages(data, targetPageNames = TARGET_PAGE_NAMES) {
  const pages = [];
  for (const layout of asArray(data.Item && data.Item.Layouts)) {
    if (Number(layout.Type) !== 103 || !targetPageNames.has(safeString(layout.Title))) continue;
    const layoutResource = asArray(layout.LayoutInResources)[0] || {};
    const page = tryParseJson(layoutResource.Resource);
    if (!isObject(page)) continue;
    pages.push({ layout, layoutResource, page });
  }
  return pages;
}

function valuePreview(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 4).map(valuePreview);
  if (isObject(value)) {
    const out = {};
    for (const key of Object.keys(value).slice(0, 12)) out[key] = valuePreview(value[key]);
    return out;
  }
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "<email>").replace(URL_RE, "<url>").replace(UUID_RE, "<uuid>").replace(LARGE_INTEGER_RE, "<id>");
  }
  return value;
}

function redactListRef(list, listIndex) {
  const listId = safeString(list && list.ListID);
  const entry = listIndex.get(listId);
  return {
    app: "<app>",
    list: entry ? entry.placeholder : (listId ? "<external-or-missing-list>" : null),
    type: list && list.Type !== undefined ? list.Type : null,
  };
}

function redactFieldName(fieldName, listId, listIndex) {
  const entry = listIndex.get(safeString(listId));
  const field = entry && entry.fields.get(safeString(fieldName));
  if (!field) return fieldName ? "<field>" : "";
  return `<field:${safeString(field.FieldName || field.InternalName || fieldName)}>`;
}

function expressionFilterVarRefs(value) {
  const refs = [];
  walk(value, (node, pointer) => {
    if (!isObject(node)) return;
    const id = safeString(node.id);
    const name = safeString(node.name);
    if (id.startsWith("__filter_") || node.exprType === "variable" && name.startsWith("filter_")) {
      refs.push({ pointer, id, name, expectedId: name ? `__filter_${name}` : "" });
    }
  });
  return refs;
}

function summarizeCondition(condition, pointer, listId, listIndex) {
  const refs = expressionFilterVarRefs(condition.right);
  return {
    path: pointer,
    leftField: redactFieldName(condition.left || condition.FieldName || condition.field, listId, listIndex),
    operator: safeString(condition.op || condition.operator || condition.Operator),
    pre: safeString(condition.pre),
    filterVariables: refs.map((ref) => ref.name || filterVarFromBinding(ref.id)).filter(Boolean),
    rightShape: Array.isArray(condition.right) ? "expression-array" : typeof condition.right,
  };
}

function collectConsumers(page, listIndex) {
  const consumers = [];
  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const type = safeString(node.type);
    const listId = safeString(node.attrs && node.attrs.data && node.attrs.data.list && node.attrs.data.list.ListID);
    const filter = node.attrs && node.attrs.data && node.attrs.data.filter;
    if (Array.isArray(filter) && expressionFilterVarRefs(filter).length) {
      consumers.push({
        path: pointer,
        controlType: type || "<page-node>",
        dataSource: redactListRef(node.attrs.data.list, listIndex),
        conditionPath: `${pointer}.attrs.data.filter`,
        conditions: filter.map((condition, index) => summarizeCondition(condition, `${pointer}.attrs.data.filter[${index}]`, listId, listIndex)),
      });
    }
    const fulltext = node.attrs && node.attrs.data && node.attrs.data.fulltext;
    if (Array.isArray(fulltext) && expressionFilterVarRefs(fulltext).length) {
      consumers.push({
        path: pointer,
        controlType: type || "<page-node>",
        dataSource: redactListRef(node.attrs.data.list, listIndex),
        conditionPath: `${pointer}.attrs.data.fulltext`,
        consumerKind: "fulltext",
        conditions: fulltext.map((item, index) => ({
          path: `${pointer}.attrs.data.fulltext[${index}]`,
          leftFields: asArray(item.fields).map((field) => redactFieldName(field, listId, listIndex)),
          operator: "fulltext",
          pre: "",
          filterVariables: expressionFilterVarRefs(item.value).map((ref) => ref.name || filterVarFromBinding(ref.id)).filter(Boolean),
          rightShape: Array.isArray(item.value) ? "expression-array" : typeof item.value,
        })),
      });
    }
    const sortingfilter = node.attrs && node.attrs.data && node.attrs.data.sortingfilter;
    if (Array.isArray(sortingfilter) && expressionFilterVarRefs(sortingfilter).length) {
      consumers.push({
        path: pointer,
        controlType: type || "<page-node>",
        dataSource: redactListRef(node.attrs.data.list, listIndex),
        conditionPath: `${pointer}.attrs.data.sortingfilter`,
        consumerKind: "sortingfilter",
        conditions: [{
          path: `${pointer}.attrs.data.sortingfilter`,
          leftField: "<sort>",
          operator: "sortingfilter",
          pre: "",
          filterVariables: expressionFilterVarRefs(sortingfilter).map((ref) => ref.name || filterVarFromBinding(ref.id)).filter(Boolean),
          rightShape: "expression-array",
        }],
      });
    }
  });
  for (const [extIndex, ext] of asArray(page.exts).entries()) {
    const attr = ext && ext.attr;
    const settings = attr && attr.settings;
    const listId = safeString(attr && attr.ListID);
    const conditions = asArray(settings && settings.Conditions);
    if (!conditions.length || !expressionFilterVarRefs(conditions).length) continue;
    consumers.push({
      path: `$.exts[${extIndex}]`,
      controlType: "dashboard-report-ext",
      dataSource: redactListRef(attr, listIndex),
      chartType: safeString(attr && attr.chartType),
      modelType: attr && attr.modelType !== undefined ? attr.modelType : null,
      conditionPath: `$.exts[${extIndex}].attr.settings.Conditions`,
      conditions: conditions.map((condition, index) => summarizeCondition(condition, `$.exts[${extIndex}].attr.settings.Conditions[${index}]`, listId, listIndex)),
    });
  }
  return consumers;
}

function collectFilterControls(page, listIndex) {
  const controls = [];
  walk(page, (node, pointer) => {
    if (!isObject(node)) return;
    const type = safeString(node.type);
    if (!isFilterControlType(type)) return;
    const attrs = node.attrs || {};
    const binding = safeString(node.binding);
    const filterVar = filterVarFromBinding(binding);
    const listId = safeString(attrs.data && attrs.data.list && attrs.data.list.ListID);
    controls.push({
      path: pointer,
      id: safeString(node.id) ? "<control-id>" : "",
      type,
      productName: PRODUCT_TYPE_NAMES.get(type) || type,
      label: node.label ? "<control-label>" : "",
      binding: binding ? `__filter_${filterVar || "<unknown>"}` : "",
      filterVariable: filterVar,
      applyTypeRaw: safeString(attrs.apply_t || attrs.applyType),
      applyType: APPLY_TYPE_NAMES.get(safeString(attrs.apply_t || attrs.applyType)) || (attrs.apply_t || attrs.applyType ? "unknown" : "default/unspecified"),
      applyButton: safeString(attrs.apply_btn) ? "<control-id>" : "",
      dataSource: attrs.data && attrs.data.list ? redactListRef(attrs.data.list, listIndex) : null,
      displayField: attrs.display_f ? redactFieldName(attrs.display_f, listId, listIndex) : "",
      valueField: attrs.value_f ? redactFieldName(attrs.value_f, listId, listIndex) : "",
      optionFilterCount: asArray(attrs.data && attrs.data.filter).length,
      settingKeys: Object.keys(attrs).sort(),
      settingsPreview: valuePreview({
        ps: attrs.ps,
        layout: attrs.layout,
        searchEnable: attrs["search-enable"],
        moreEnable: attrs["more-enable"],
        dropdownEnable: attrs["dropdown-enable"],
        displayStyle: attrs.displayStyle,
        numberMin: attrs.number_min,
        numberMax: attrs.number_max,
        numberStep: attrs.number_step,
        options: attrs.options,
        choiceOptions: attrs["choice-options"],
        minLetters: attrs["minnumber-letters"],
        hierarchicalSelect: attrs["hierarchical-select"],
        multiple: attrs.multiple,
        source: attrs.source,
        hierarchyType: attrs.type,
        childField: attrs.child_f,
        parentField: attrs.parent_f,
        sortList: asArray(attrs.sort_list).map((item) => ({
          orderby: item.orderby ? redactFieldName(item.orderby, listId, listIndex) : "",
          order: item.order || "",
          title: item.title ? "<sort-option-title>" : "",
        })),
      }),
    });
  });
  return controls;
}

function validatePage(pageSummary, page, warnings, errors) {
  const filterVars = new Set(pageSummary.filterVariables.map((item) => item.id));
  const applyButtonIds = new Set(pageSummary.filterControls.filter((control) => control.type === "apply-button").map((control) => control.path));
  for (const variable of pageSummary.filterVariables) {
    if (!variable.id) errors.push({ code: "FILTER_VARIABLE_ID_MISSING", page: pageSummary.pageName, path: variable.path });
  }
  for (const control of pageSummary.filterControls) {
    if (VALUE_FILTER_TYPES.has(control.type) && !control.filterVariable) {
      warnings.push({ code: "FILTER_CONTROL_VARIABLE_MISSING", page: pageSummary.pageName, path: control.path, type: control.type });
    } else if (control.filterVariable && !filterVars.has(control.filterVariable)) {
      errors.push({ code: "FILTER_CONTROL_VARIABLE_UNRESOLVED", page: pageSummary.pageName, path: control.path, filterVariable: control.filterVariable });
    }
    if (!PRODUCT_TYPE_NAMES.has(control.type)) {
      warnings.push({ code: "UNKNOWN_FILTER_CONTROL_TYPE", page: pageSummary.pageName, path: control.path, type: control.type });
    }
    if (control.applyTypeRaw === "2" && !control.applyButton) {
      warnings.push({ code: "CLICK_APPLY_FILTER_APPLY_BUTTON_MISSING", page: pageSummary.pageName, path: control.path, filterVariable: control.filterVariable });
    }
    if (control.applyButton) {
      let found = false;
      walk(page, (node) => {
        if (isObject(node) && node.type === "apply-button" && safeString(node.id) && control.applyButton === "<control-id>") found = true;
      });
      if (!found && applyButtonIds.size === 0) {
        errors.push({ code: "APPLY_BUTTON_REFERENCE_UNRESOLVED", page: pageSummary.pageName, path: control.path, filterVariable: control.filterVariable });
      }
    }
  }
  for (const consumer of pageSummary.consumers) {
    for (const condition of consumer.conditions) {
      for (const filterVariable of condition.filterVariables) {
        if (!filterVars.has(filterVariable)) {
          warnings.push({ code: "DOWNSTREAM_FILTER_VARIABLE_UNRESOLVED", page: pageSummary.pageName, path: condition.path, filterVariable });
        }
      }
    }
  }
}

function inspectPage(entry, listIndex, warnings, errors, sourceExport = "") {
  const { layout, page } = entry;
  const filterVariables = asArray(page.filterVars).map((item, index) => ({
    path: `$.filterVars[${index}]`,
    id: safeString(item && item.id),
    idx: item && item.idx ? "<filter-var-idx>" : "",
    keys: Object.keys(item || {}).sort(),
  }));
  const controls = collectFilterControls(page, listIndex);
  const consumers = collectConsumers(page, listIndex);
  const summary = {
    sourceExport,
    pageName: safeString(layout.Title),
    pageId: "<page-id>",
    totalControlsInspected: 0,
    filterVariables,
    filterControls: controls,
    consumers,
    counts: {
      dataFilterControls: controls.length,
      valueFilterControls: controls.filter((control) => VALUE_FILTER_TYPES.has(control.type)).length,
      applyButtons: controls.filter((control) => control.type === "apply-button").length,
      removeFilters: controls.filter((control) => control.type === "remove-filters" || control.type === "remove-filers").length,
      filterVariables: filterVariables.length,
    },
    filterControlTypes: [...new Set(controls.map((control) => control.productName))].sort(),
    applyTypes: [...new Set(controls.map((control) => control.applyType).filter(Boolean))].sort(),
    affectedDataSources: [...new Set(consumers.map((consumer) => consumer.dataSource && consumer.dataSource.list).filter(Boolean))].sort(),
  };
  walk(page, (node) => {
    if (isObject(node) && safeString(node.type) && safeString(node.id)) summary.totalControlsInspected += 1;
  });
  validatePage(summary, page, warnings, errors);
  return summary;
}

function normalizedRefs(report) {
  const refs = new Map();
  const isCrmSource = (source) => String(source || "").toLowerCase().includes("crm");
  const nonCrmPages = report.pages.filter((page) => !isCrmSource(page.sourceExport));
  const firstVarPage = nonCrmPages.find((page) => page.filterVariables.length);
  if (firstVarPage) {
    refs.set("data-filter-variable-definition.normalized.json", {
      proofLevel: "export-proven",
      path: "$.filterVars[]",
      shape: firstVarPage.filterVariables[0],
      notes: ["Filter variables live on the embedded dashboard page JSON, not on the root app resource."],
    });
  }
  const byType = new Map();
  for (const page of report.pages) {
    for (const control of page.filterControls) {
      if (!byType.has(control.type)) byType.set(control.type, { source: page.sourceExport, page: page.pageName, control });
    }
  }
  const fileByType = new Map([
    ["search-filter", "data-filter-search-control.normalized.json"],
    ["select-filter", "data-filter-select-control.normalized.json"],
    ["check-filter", "data-filter-checkbox-control.normalized.json"],
    ["checkbox-filter", "data-filter-checkbox-control.normalized.json"],
    ["radio-filter", "data-filter-radio-control.normalized.json"],
    ["range-filter", "data-filter-range-control.normalized.json"],
    ["check-range", "data-filter-check-range-control.normalized.json"],
    ["date-filter", "data-filter-date-control.normalized.json"],
    ["relative-period", "data-filter-relative-period-control.normalized.json"],
    ["hierarchy-filter", "data-filter-hierarchy-control.normalized.json"],
    ["sorting-filter", "data-filter-sorting-control.normalized.json"],
    ["sorting-filters", "data-filter-sorting-control.normalized.json"],
    ["apply-button", "data-filter-apply-button.normalized.json"],
    ["remove-filters", "data-filter-remove-filters.normalized.json"],
    ["remove-filers", "data-filter-remove-filters.normalized.json"],
  ]);
  for (const [type, found] of byType) {
    const file = fileByType.get(type);
    if (!file) continue;
    const crm = isCrmSource(found.source);
    const refFile = crm && file.startsWith("data-filter-") && file.includes("-control.")
      ? file.replace("-control.", "-control-crm.")
      : file;
    if (crm && refFile === file) continue;
    refs.set(refFile, {
      proofLevel: "export-proven",
      sourceExport: found.source || "",
      page: found.page,
      productName: PRODUCT_TYPE_NAMES.get(type) || type,
      exportControlType: type,
      control: found.control,
    });
    if (crm && found.control.filterVariable) {
      const varFile = `data-filter-${String(PRODUCT_TYPE_NAMES.get(type) || type).toLowerCase().replace(/\s+/g, "-").replace(/-filter$/, "")}-variable-crm.normalized.json`;
      refs.set(varFile, {
        proofLevel: "export-proven",
        sourceExport: found.source || "",
        page: found.page,
        productName: PRODUCT_TYPE_NAMES.get(type) || type,
        filterVariable: found.control.filterVariable,
        binding: found.control.binding,
      });
    }
  }
  const nonCrmConsumerEntries = nonCrmPages.flatMap((page) => page.consumers.map((consumer) => ({ page: page.pageName, consumer })));
  const firstConsumer = nonCrmConsumerEntries[0];
  if (firstConsumer) {
    refs.set("data-filter-consumer-condition.normalized.json", {
      proofLevel: "export-proven",
      page: firstConsumer.page,
      consumer: firstConsumer.consumer,
    });
    const chart = nonCrmConsumerEntries.find((entry) => entry.consumer.controlType === "dashboard-report-ext");
    if (chart) refs.set("data-filter-consumer-chart.normalized.json", { proofLevel: "export-proven", page: chart.page, consumer: chart.consumer });
    const table = nonCrmConsumerEntries.find((entry) => entry.consumer.controlType === "data-list");
    if (table) refs.set("data-filter-consumer-table.normalized.json", { proofLevel: "export-proven", page: table.page, consumer: table.consumer });
  }
  const crmConsumer = report.pages.flatMap((page) => page.consumers.map((consumer) => ({ page: page.pageName, source: page.sourceExport, consumer }))).find((entry) => String(entry.source).toLowerCase().includes("crm"));
  if (crmConsumer) refs.set("data-filter-crm-consumer-condition.normalized.json", { proofLevel: "export-proven", sourceExport: crmConsumer.source, page: crmConsumer.page, consumer: crmConsumer.consumer });
  const nonCrmControlEntries = nonCrmPages.flatMap((page) => page.filterControls.map((control) => ({ page: page.pageName, control })));
  const clickApply = nonCrmControlEntries.find((entry) => entry.control.applyType === "Click on apply button");
  if (clickApply) refs.set("data-filter-click-apply-binding.normalized.json", { proofLevel: "export-proven", page: clickApply.page, control: clickApply.control });
  const crmClickApply = report.pages.flatMap((page) => page.filterControls.map((control) => ({ page: page.pageName, source: page.sourceExport, control }))).find((entry) => String(entry.source).toLowerCase().includes("crm") && entry.control.applyType === "Click on apply button");
  if (crmClickApply) refs.set("data-filter-crm-apply-binding.normalized.json", { proofLevel: "export-proven", sourceExport: crmClickApply.source, page: crmClickApply.page, control: crmClickApply.control });
  const valueChange = nonCrmControlEntries.find((entry) => entry.control.applyType !== "Click on apply button" && VALUE_FILTER_TYPES.has(entry.control.type));
  if (valueChange) refs.set("data-filter-value-change-binding.normalized.json", { proofLevel: "export-proven-default-unspecified", page: valueChange.page, control: valueChange.control });
  return refs;
}

function writeOutput(report, args) {
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) {
    fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    fs.writeFileSync(args.out, text, "utf8");
  }
  if (args.outDir) {
    const dir = path.resolve(args.outDir);
    fs.mkdirSync(dir, { recursive: true });
    for (const [file, ref] of normalizedRefs(report)) {
      fs.writeFileSync(path.join(dir, file), `${JSON.stringify(ref, null, 2)}\n`, "utf8");
    }
  }
  console.log(text);
}

function main() {
  const args = parseArgs(process.argv);
  const warnings = [];
  const errors = [];
  const targetPageNames = new Set(args.pages.length ? args.pages : [...TARGET_PAGE_NAMES]);
  const decodedExports = args.inputs.map((input) => ({ inputPath: path.resolve(input), decoded: decodeYap(path.resolve(input)) }));
  const pages = [];
  for (const item of decodedExports) {
    const listIndex = buildListIndex(item.decoded.data);
    const pageEntries = extractPages(item.decoded.data, targetPageNames);
    if (args.requireTargetPages && pageEntries.length !== targetPageNames.size) {
    const found = new Set(pageEntries.map((entry) => safeString(entry.layout.Title)));
      for (const pageName of targetPageNames) {
        if (!found.has(pageName)) errors.push({ code: "TARGET_PAGE_MISSING", input: item.inputPath, page: pageName });
      }
    }
    pages.push(...pageEntries.map((entry) => inspectPage(entry, listIndex, warnings, errors, item.inputPath)));
  }
  const allControls = pages.flatMap((page) => page.filterControls);
  const foundProductControls = new Set(allControls.map((control) => control.productName));
  const report = {
    status: errors.length ? "fail" : warnings.length ? "pass_with_warnings" : "pass",
    input: decodedExports.length === 1 ? decodedExports[0].inputPath : undefined,
    inputs: decodedExports.map((item) => item.inputPath),
    targetPages: [...targetPageNames],
    pages,
    exportProvenControlTypes: [...new Set(allControls.map((control) => control.productName))].sort(),
    exportProvenValueControlTypes: [...new Set(allControls.filter((control) => VALUE_FILTER_TYPES.has(control.type)).map((control) => control.productName))].sort(),
    productDocumentedOnlyControlTypes: PRODUCT_CONTROL_NAMES.filter((name) => !foundProductControls.has(name)),
    coverage: args.coverage ? PRODUCT_CONTROL_NAMES.map((name) => ({
      productName: name,
      status: foundProductControls.has(name) ? "export-proven" : "pending",
      sources: [...new Set(pages.filter((page) => page.filterControls.some((control) => control.productName === name)).map((page) => path.basename(page.sourceExport || "")))],
    })) : undefined,
    warnings,
    errors,
    proofBoundary: {
      dashboardDataFilterUsage: "export-proven",
      helpCenterBehavior: "product-documented",
      approvalFormAndDataListFormUsage: "product-documented-only",
      runtimeBehavior: "not-runtime-proven",
    },
  };
  writeOutput(report, args);
  if (errors.length) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "DATA_FILTER_INSPECTION_FAILED", message: error.message }], warnings: [] }, null, 2));
  process.exit(1);
}
