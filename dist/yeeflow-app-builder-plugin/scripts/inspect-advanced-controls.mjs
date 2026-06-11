#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const URL_RE = /\bhttps?:\/\/[^\s"')<>]+/gi;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const LONG_ID_RE = /\b\d{12,}\b/g;

const ADVANCED_TYPES = new Set([
  "aktabs",
  "ak-tabs-tab",
  "toggle",
  "toggle-panel",
  "timer",
  "icon_list",
  "line",
  "alert",
  "progress",
  "gap",
  "progress-circle",
  "steps-bar",
  "list-qrcode",
  "qrcode",
  "barcode",
  "embed",
  "document-embed",
]);

const PRODUCT_NAMES = new Map([
  ["aktabs", "Tab"],
  ["ak-tabs-tab", "Tab item"],
  ["toggle", "Toggle"],
  ["toggle-panel", "Toggle section"],
  ["timer", "Timer"],
  ["icon_list", "Icon list"],
  ["line", "Divider"],
  ["alert", "Alert"],
  ["progress", "Progress bar"],
  ["gap", "Spacer"],
  ["progress-circle", "Progress circle"],
  ["steps-bar", "Steps bar"],
  ["list-qrcode", "QR Code"],
  ["qrcode", "QR Code"],
  ["barcode", "Barcode"],
  ["embed", "Embed"],
  ["document-embed", "Document embed"],
]);

const NUMERIC_VALUE_TYPES = new Set(["input_number", "currency", "percent", "rate", "number", "decimal", "int", "bigint"]);
const SINGLE_SELECT_VALUE_TYPES = new Set(["radio", "select", "flowstatus", "status"]);
const FILE_VALUE_TYPES = new Set(["file-upload", "file-upload-merge", "icon-upload", "file", "image"]);
const BARCODE_TYPES = new Set(["CODE128", "CODE128A", "CODE128B", "CODE128C", "EAN13", "EAN8", "UPC", "CODE39", "ITF14", "MSI", "pharmacode", "codabar"]);

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-advanced-controls.mjs <input.yap|decoded.json> [--page <name>] [--list-form <name>] [--json-out <path>]",
    "",
    "Decodes a Yeeflow export read-only and emits a redacted inventory of advanced Dashboard and Data List custom-form controls.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, pages: [], listForms: [], jsonOut: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--page") args.pages.push(argv[++i]);
    else if (arg === "--list-form") args.listForms.push(argv[++i]);
    else if (arg === "--json-out") args.jsonOut = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
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

function decodeInput(inputPath) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return { wrapper: parsed, resource, data: parseJson(resource.Data), inputType: "wrapped-yap" };
  }
  if (typeof parsed.Data === "string") return { wrapper: null, resource: parsed, data: parseJson(parsed.Data), inputType: "resource-json" };
  return { wrapper: null, resource: null, data: parsed, inputType: "decoded-json" };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function iconListItems(attrs) {
  if (Array.isArray(attrs.items)) return attrs.items;
  if (Array.isArray(attrs.options)) return attrs.options;
  if (Array.isArray(attrs.data)) return attrs.data;
  if (attrs.data && Array.isArray(attrs.data.links)) return attrs.data.links;
  return [];
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

function walk(value, visitor, pointer = "$", ancestors = []) {
  visitor(value, pointer, ancestors);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`, ancestors));
  else if (isObject(value)) {
    const nextAncestors = value.type ? [...ancestors, value] : ancestors;
    Object.entries(value).forEach(([key, child]) => walk(child, visitor, `${pointer}.${key}`, nextAncestors));
  }
}

function walkControls(value, visitor, pointer = "$", parents = []) {
  if (!isObject(value)) return;
  visitor(value, pointer, parents);
  const nextParents = safeString(value.type) ? [...parents, value] : parents;
  asArray(value.children).forEach((child, index) => walkControls(child, visitor, `${pointer}.children[${index}]`, nextParents));
}

function redactScalar(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(URL_RE, "<url>")
    .replace(EMAIL_RE, "<email>")
    .replace(UUID_RE, "<id>")
    .replace(LONG_ID_RE, "<id>");
}

function compactValue(value, depth = 0) {
  if (depth > 3) return "<nested>";
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return redactScalar(value);
  if (Array.isArray(value)) {
    if (value.length === 2 && value[0] === null && (typeof value[1] !== "object" || value[1] === null)) return [null, redactScalar(value[1])];
    return value.slice(0, 5).map((item) => compactValue(item, depth + 1));
  }
  if (isObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (/^(id|idx|key|appid|listid|listsetid|layoutid|tenantid|fieldid|refid)$/i.test(key)) {
        out[key] = safeString(child) ? "<id>" : child;
      } else if (/^(value|title|label|name|description|body|code|src|url)$/i.test(key) && typeof child === "string") {
        out[key] = child.match(URL_RE) || key === "code" ? redactScalar(child) : child;
      } else {
        out[key] = compactValue(child, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

function attrKeys(control) {
  return Object.keys(isObject(control.attrs) ? control.attrs : {}).sort();
}

function childTypes(control) {
  return asArray(control.children).map((child) => safeString(child.type) || "<unknown>");
}

function summarizeBinding(value) {
  if (!value && value !== 0) return { mode: "none" };
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = safeString(value);
    if (/^https?:\/\//i.test(text)) return { mode: "static-url", valueShape: "<url>" };
    if (/^__temp_/.test(text)) return { mode: "temp-variable", variable: text.replace(/^__temp_/, "") };
    if (/^__filter_/.test(text)) return { mode: "filter-variable" };
    return { mode: "static", valueShape: redactScalar(text) };
  }
  const variables = [];
  walk(value, (node) => {
    if (!isObject(node) || safeString(node.type) !== "expr") return;
    const exprType = safeString(node.exprType);
    const valueType = safeString(node.valueType);
    const prop = safeString(node.prop || node.id);
    if (exprType === "list_field") variables.push({ mode: "current-item-field", prop: prop ? "<field>" : null, valueType: valueType || null });
    else if (exprType === "variable") variables.push({ mode: "variable", variable: safeString(node.id).replace(/^__temp_/, ""), valueType: valueType || null });
    else if (exprType === "variable_ctx") variables.push({ mode: "current-item-context", prop: prop ? "<field>" : null, ctx: safeString(node.ctx) || null, valueType: valueType || null });
    else variables.push({ mode: exprType || "expression", valueType: valueType || null });
  });
  if (variables.length) return { mode: variables.length === 1 ? variables[0].mode : "expression", refs: variables.slice(0, 6) };
  return { mode: "object", shape: compactValue(value) };
}

function extractBindings(control) {
  const attrs = isObject(control.attrs) ? control.attrs : {};
  const bindings = {};
  for (const key of ["value", "date", "set", "per", "current-step", "doc-source", "binding", "source", "obj-f", "href", "url", "src", "code", "qr-code-link"]) {
    const source = key in attrs ? attrs[key] : key in control ? control[key] : undefined;
    if (source !== undefined) bindings[key] = summarizeBinding(source);
  }
  if (attrs.data && attrs.data.list) bindings["data.list"] = { mode: "list-reference", source: "<list>" };
  return bindings;
}

function summarizeStyles(control) {
  const attrs = isObject(control.attrs) ? control.attrs : {};
  const styles = {};
  for (const key of ["common", "style", "general", "caption", "item", "tabs", "timer", "icon", "line", "alert", "progress", "bar", "barcode", "appearance", "stepstyle", "indicator", "layout", "text-posi", "displayValue", "textPosition", "fallback", "sty", "space", "width", "line-width"]) {
    if (attrs[key] !== undefined) styles[key] = compactValue(attrs[key]);
  }
  return styles;
}

function summarizeItems(control) {
  const attrs = isObject(control.attrs) ? control.attrs : {};
  const items = {};
  if (Array.isArray(attrs["steps-options"])) {
    items.steps = attrs["steps-options"].map((item, index) => ({ key: `<step:${index + 1}>`, label: safeString(item && item.value) || `<step ${index + 1}>` }));
  }
  if (Array.isArray(attrs.options)) {
    items.options = attrs.options.map((item, index) => ({ key: `<option:${index + 1}>`, keys: Object.keys(item || {}).sort() }));
  }
  if (Array.isArray(attrs.items)) {
    items.items = attrs.items.map((item, index) => ({ key: `<item:${index + 1}>`, keys: Object.keys(item || {}).sort() }));
  }
  if (Array.isArray(attrs.data)) {
    items.data = attrs.data.map((item, index) => ({ key: `<item:${index + 1}>`, keys: Object.keys(item || {}).sort() }));
  }
  if (attrs.data && Array.isArray(attrs.data.links)) {
    items.links = attrs.data.links.map((item, index) => ({ key: `<link:${index + 1}>`, keys: Object.keys(item || {}).sort() }));
  }
  return items;
}

function fieldNameFromBinding(binding) {
  if (!binding) return "";
  if (typeof binding === "string") return binding;
  let found = "";
  walk(binding, (node) => {
    if (found || !isObject(node) || safeString(node.type) !== "expr") return;
    found = safeString(node.prop || node.id);
  });
  return found;
}

function buildFieldIndex(data) {
  const listsById = new Map();
  for (const item of [data && data.Item, ...asArray(data && data.Childs)].filter(Boolean)) {
    const model = item.ListModel || {};
    const listId = safeString(model.ListID || item.ListID);
    if (!listId) continue;
    const fields = new Map();
    for (const field of asArray(item.Defs)) {
      for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID]) {
        if (safeString(key)) fields.set(safeString(key), field);
      }
    }
    listsById.set(listId, { title: safeString(model.Title || item.Title), type: Number(model.Type), fields });
  }
  return listsById;
}

function validateControl(control, host, fieldsByName, findings, pointer) {
  const type = safeString(control.type);
  const attrs = isObject(control.attrs) ? control.attrs : {};
  const context = { host, controlType: type, productName: PRODUCT_NAMES.get(type) || type, path: pointer };
  const severity = host.generatedFinal ? "error" : "warning";
  const push = (level, code, message, detail = {}) => findings.push({ severity: level, code, message, ...context, ...detail });

  if (type === "aktabs") {
    const tabs = asArray(control.children).filter((child) => safeString(child.type) === "ak-tabs-tab");
    if (!tabs.length) push(severity, "ADVANCED_TAB_ITEMS_MISSING", "Tab controls should contain ak-tabs-tab children.");
    tabs.forEach((tab, index) => {
      if (!safeString(tab.id)) push(severity, "ADVANCED_TAB_ITEM_ID_MISSING", "Tab items need stable ids.", { item: index + 1 });
      if (!safeString(tab.label)) push(severity, "ADVANCED_TAB_ITEM_TITLE_MISSING", "Tab items should have a visible label/title.", { item: index + 1 });
      if (!asArray(tab.children).length) push("warning", "ADVANCED_TAB_ITEM_EMPTY", "Tab items should contain a child control container or content controls.", { item: index + 1 });
    });
  }

  if (type === "toggle") {
    const panels = asArray(control.children).filter((child) => safeString(child.type) === "toggle-panel");
    if (!panels.length) push(severity, "ADVANCED_TOGGLE_SECTIONS_MISSING", "Toggle controls should contain toggle-panel children.");
    panels.forEach((panel, index) => {
      if (!safeString(panel.id)) push(severity, "ADVANCED_TOGGLE_SECTION_ID_MISSING", "Toggle sections need stable ids.", { item: index + 1 });
      if (!safeString(panel.attrs && panel.attrs.title && panel.attrs.title.value)) push(severity, "ADVANCED_TOGGLE_SECTION_TITLE_MISSING", "Toggle sections should include attrs.title.value.", { item: index + 1 });
      if (!asArray(panel.children).length) push("warning", "ADVANCED_TOGGLE_SECTION_EMPTY", "Toggle sections should contain nested controls.", { item: index + 1 });
    });
  }

  if (type === "timer") {
    if (!attrs.set && !attrs.date && !attrs.value && !attrs["obj-f"]) push(severity, "ADVANCED_TIMER_DATE_MISSING", "Timer should have a static date, dynamic date value, or field binding.");
  }

  if (type === "icon_list") {
    const items = iconListItems(attrs);
    if (!items.length) push("warning", "ADVANCED_ICON_LIST_ITEMS_UNOBSERVED", "Icon list should include item configuration; this export stores some variants opaquely.");
  }

  if (type === "progress" || type === "progress-circle") {
    const value = attrs.value || attrs.per || attrs.percent || attrs.progress || attrs["current-value"];
    const binding = summarizeBinding(value);
    if (binding.mode === "none") push(severity, "ADVANCED_PROGRESS_VALUE_MISSING", "Progress bar/circle should have a static numeric value or numeric binding.");
    const fieldName = fieldNameFromBinding(value);
    const field = fieldsByName && fieldsByName.get(fieldName);
    const fieldType = safeString(field && field.Type).toLowerCase();
    if (fieldName && field && !NUMERIC_VALUE_TYPES.has(fieldType)) push(severity, "ADVANCED_PROGRESS_FIELD_TYPE_UNPROVEN", "Progress bar/circle field binding should resolve to a numeric-compatible field.", { field: "<field>", fieldType });
  }

  if (type === "steps-bar") {
    const steps = asArray(attrs["steps-options"]);
    if (!steps.length) push(severity, "ADVANCED_STEPS_ITEMS_MISSING", "Steps bar static options should include step items.");
    const fieldName = safeString(attrs["obj-f"] || fieldNameFromBinding(attrs["current-step"]));
    const field = fieldsByName && fieldsByName.get(fieldName);
    const fieldType = safeString(field && field.Type).toLowerCase();
    if (fieldName && field && !SINGLE_SELECT_VALUE_TYPES.has(fieldType)) push("warning", "ADVANCED_STEPS_FIELD_TYPE_UNPROVEN", "Field-bound Steps bar should normally resolve to a single-select/status field.", { field: "<field>", fieldType });
  }

  if (type === "list-qrcode" || type === "qrcode") {
    if (!attrs.value && !attrs.url && !attrs.source && !attrs["qr-source"] && !attrs["qr-code-link"] && attrs.common) {
      push("warning", "ADVANCED_QR_VALUE_IMPLICIT", "QR Code has no explicit URL/value in this export; treat as current page/form/item URL only after host-specific runtime proof.");
    } else if (!attrs.value && !attrs.url && !attrs.source && !attrs["qr-source"] && !attrs["qr-code-link"]) {
      push(severity, "ADVANCED_QR_VALUE_MISSING", "QR Code should have a static value/URL or dynamic current page/item/form source.");
    }
  }

  if (type === "barcode") {
    if (!attrs.value) push(severity, "ADVANCED_BARCODE_VALUE_MISSING", "Barcode should have a static value or dynamic binding.");
    const barcodeType = safeString(attrs.type);
    if (barcodeType && !BARCODE_TYPES.has(barcodeType)) push("warning", "ADVANCED_BARCODE_TYPE_UNPROVEN", "Barcode type is not in the known supported set.", { barcodeType });
  }

  if (type === "embed") {
    if (!attrs.code && !attrs.src && !attrs.url) push(severity, "ADVANCED_EMBED_SOURCE_MISSING", "Embed should include iframe/code/src/url configuration.");
  }

  if (type === "document-embed") {
    const binding = attrs["doc-source"];
    const fieldName = fieldNameFromBinding(binding);
    const field = fieldsByName && fieldsByName.get(fieldName);
    const fieldType = safeString(field && field.Type);
    if (!binding) push(severity, "ADVANCED_DOCUMENT_EMBED_SOURCE_MISSING", "Document embed should bind to an attachment/file field.");
    else if (field && !FILE_VALUE_TYPES.has(fieldType)) push(severity, "ADVANCED_DOCUMENT_EMBED_FIELD_TYPE_UNPROVEN", "Document embed binding should resolve to a file/image attachment field.", { field: "<field>", fieldType });
  }
}

function summarizeControl(control, pointer, host, fieldsByName, findings) {
  validateControl(control, host, fieldsByName, findings, pointer);
  const type = safeString(control.type);
  const attrs = isObject(control.attrs) ? control.attrs : {};
  return {
    productName: PRODUCT_NAMES.get(type) || type,
    type,
    path: pointer.replace(UUID_RE, "<id>").replace(LONG_ID_RE, "<id>"),
    label: safeString(control.label) || null,
    attrKeys: attrKeys(control),
    childTypes: childTypes(control),
    nestedChildControlTypes: nestedChildTypes(control),
    bindings: extractBindings(control),
    style: summarizeStyles(control),
    items: summarizeItems(control),
    tabPosition: attrs["tabs-tabposition"] || null,
    defaultTabItem: type === "aktabs" ? defaultChildLabel(control.children, "ak-tabs-tab") : null,
    defaultToggleState: type === "toggle-panel" ? compactValue(attrs.expand || attrs.default || attrs.isDefault || null) : null,
    alertType: type === "alert" ? safeString(control.label).toLowerCase() || alertTypeFromAttrs(attrs) : null,
    sourceMode: sourceMode(control),
  };
}

function nestedChildTypes(control) {
  const counts = {};
  asArray(control.children).forEach((child) => {
    walkControls(child, (node) => {
      const type = safeString(node.type);
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
  });
  return counts;
}

function defaultChildLabel(children, childType) {
  const child = asArray(children).find((item) => safeString(item.type) === childType && item.attrs && item.attrs.isDefault === true);
  return child ? safeString(child.label) || "<default item>" : null;
}

function alertTypeFromAttrs(attrs) {
  const text = JSON.stringify(compactValue(attrs)).toLowerCase();
  if (text.includes("success")) return "success";
  if (text.includes("warning")) return "warning";
  if (text.includes("error") || text.includes("danger")) return "error";
  if (text.includes("info")) return "info";
  return "unspecified";
}

function sourceMode(control) {
  const attrs = isObject(control.attrs) ? control.attrs : {};
  const source = safeString(attrs.source);
  if (source === "4") return "current-item-field";
  if (source === "9") return "variable";
  if (source) return `source-${source}`;
  const bindings = extractBindings(control);
  const modes = new Set(Object.values(bindings).map((binding) => binding.mode));
  if (modes.has("current-item-field")) return "current-item-field";
  if (modes.has("variable")) return "variable";
  if (modes.has("static-url")) return "static-url";
  if (modes.has("static")) return "static";
  return "unspecified";
}

function extractDashboardPages(data, selectedPages) {
  const wanted = new Set(selectedPages);
  const pages = [];
  asArray(data && data.Item && data.Item.Layouts).forEach((layout, layoutIndex) => {
    if (Number(layout.Type) !== 103) return;
    if (wanted.size && !wanted.has(safeString(layout.Title))) return;
    const resource = asArray(layout.LayoutInResources)[0] || {};
    const page = tryParseJson(resource.Resource);
    if (!isObject(page)) return;
    pages.push({ layout, layoutIndex, page });
  });
  return pages;
}

function extractListForms(data, selectedForms) {
  const wanted = new Set(selectedForms);
  const forms = [];
  asArray(data && data.Childs).forEach((child, childIndex) => {
    const model = child.ListModel || {};
    const fieldsByName = new Map();
    asArray(child.Defs).forEach((field) => {
      for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID]) {
        if (safeString(key)) fieldsByName.set(safeString(key), field);
      }
    });
    asArray(child.Layouts).forEach((layout, layoutIndex) => {
      if (Number(layout.Type) !== 1) return;
      if (wanted.size && !wanted.has(safeString(layout.Title))) return;
      const resource = asArray(layout.LayoutInResources)[0] || {};
      const form = tryParseJson(resource.Resource);
      if (!isObject(form)) return;
      forms.push({ child, childIndex, layout, layoutIndex, form, fieldsByName, listTitle: safeString(model.Title) });
    });
  });
  return forms;
}

function summarizeSurface(surface, fieldsByName, host, findings) {
  const controls = [];
  asArray(surface.children).forEach((child, childIndex) => {
    walkControls(child, (control, pointer) => {
      const type = safeString(control.type);
      if (!ADVANCED_TYPES.has(type)) return;
      controls.push(summarizeControl(control, `$.children[${childIndex}]${pointer.slice(1)}`, host, fieldsByName, findings));
    });
  });
  return controls;
}

function buildReport(inputPath, decoded, args) {
  const data = decoded.data;
  const listIndex = buildFieldIndex(data);
  const findings = [];
  const dashboardPages = extractDashboardPages(data, args.pages).map((entry) => {
    const controls = summarizeSurface(entry.page, null, {
      hostType: "dashboard",
      surfaceTitle: safeString(entry.layout.Title),
      generatedFinal: false,
    }, findings);
    return {
      hostType: "dashboard",
      title: safeString(entry.layout.Title),
      pageIndex: entry.layoutIndex,
      controls,
      countsByType: countBy(controls, "type"),
      countsByProductName: countBy(controls, "productName"),
    };
  });

  const listForms = extractListForms(data, args.listForms).map((entry) => {
    const controls = summarizeSurface(entry.form, entry.fieldsByName, {
      hostType: "data-list-form",
      surfaceTitle: safeString(entry.layout.Title),
      generatedFinal: false,
    }, findings);
    return {
      hostType: "data-list-form",
      listTitle: entry.listTitle,
      title: safeString(entry.layout.Title),
      formIndex: entry.layoutIndex,
      controls,
      countsByType: countBy(controls, "type"),
      countsByProductName: countBy(controls, "productName"),
    };
  });

  const controls = [...dashboardPages.flatMap((page) => page.controls), ...listForms.flatMap((form) => form.controls)];
  return {
    input: path.resolve(inputPath),
    inputType: decoded.inputType,
    source: {
      appTitle: safeString(decoded.wrapper && decoded.wrapper.Title) || safeString(data && data.Item && data.Item.ListModel && data.Item.ListModel.Title),
      exportHandling: "decoded read-only; raw Resource/Data payload omitted",
    },
    summary: {
      dashboardPages: dashboardPages.length,
      dataListForms: listForms.length,
      advancedControls: controls.length,
      countsByType: countBy(controls, "type"),
      countsByProductName: countBy(controls, "productName"),
      dataLists: listIndex.size,
    },
    dashboardPages,
    listForms,
    findings,
    status: findings.some((finding) => finding.severity === "error") ? "fail" : findings.length ? "pass_with_warnings" : "pass",
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "<unknown>";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const report = buildReport(args.input, decoded, args);
  const text = JSON.stringify(report, null, 2);
  if (args.jsonOut) {
    fs.mkdirSync(path.dirname(path.resolve(args.jsonOut)), { recursive: true });
    fs.writeFileSync(args.jsonOut, `${text}\n`);
  }
  console.log(text);
  if (report.status === "fail") process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: [{ code: "ADVANCED_CONTROLS_INSPECTION_FAILED", message: error.message }], warnings: [] }, null, 2));
  process.exit(1);
}
