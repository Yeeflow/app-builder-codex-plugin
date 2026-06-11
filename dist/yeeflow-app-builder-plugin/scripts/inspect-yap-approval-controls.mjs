#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SECRET_KEY_RE = /(secret|token|password|credential|api[-_]?key|authorization|client[-_]?secret)/i;

function usage() {
  console.error([
    "Usage:",
    "  node scripts/inspect-yap-approval-controls.mjs <input.yap> <form-name> <decoded-resource.json> <decoded-data.json> <approval-form-def.json> <inspection.json> <inspection.md>",
  ].join("\n"));
  process.exit(1);
}

const [inputPath, formName, resourceOutPath, dataOutPath, defOutPath, jsonOutPath, mdOutPath] = process.argv.slice(2);
if (!inputPath || !formName || !resourceOutPath || !dataOutPath || !defOutPath || !jsonOutPath || !mdOutPath) usage();

function quoteLargeIntegers(jsonText, largeNumbers) {
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
    const startsNumber = ch === "-" || (ch >= "0" && ch <= "9");
    if (!startsNumber) {
      out += ch;
      i += 1;
      continue;
    }
    const start = i;
    let j = i;
    if (jsonText[j] === "-") j += 1;
    while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
    if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
      while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
      out += jsonText.slice(start, j);
    } else {
      const token = jsonText.slice(start, j);
      if (LARGE_INTEGER_RE.test(token)) {
        largeNumbers.add(token);
        out += `"${token}"`;
      } else {
        out += token;
      }
    }
    i = j;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compact(value, max = 800) {
  if (value === undefined) return undefined;
  const copy = redact(value);
  const text = JSON.stringify(copy);
  if (!text || text.length <= max) return copy;
  return { truncated: true, preview: text.slice(0, max) };
}

function redact(value, key = "") {
  if (SECRET_KEY_RE.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (isObject(value)) {
    const out = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      out[childKey] = redact(childValue, childKey);
    }
    return out;
  }
  if (typeof value === "string" && SECRET_KEY_RE.test(value) && value.length > 20) return "[REDACTED]";
  return value;
}

function configValue(value) {
  return Array.isArray(value) && value.length === 2 && value[0] === null ? value[1] : value;
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, largeNumbers);
  if (typeof resource.Data !== "string") throw new Error("Decoded Resource.Data is missing or not a JSON string.");
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data, largeNumbers };
}

function formMatches(form, expectedName) {
  const wanted = expectedName.toLowerCase();
  return [form.Name, form.FlowName, form.Title, form.FormName].some((value) => String(value || "").toLowerCase() === wanted);
}

function decodeDefResource(form, largeNumbers) {
  if (!form.DefResource || typeof form.DefResource !== "string") throw new Error("Selected form does not contain DefResource.");
  return parseJson(form.DefResource, largeNumbers);
}

function variableIndex(def) {
  const variables = [];
  for (const groupName of Object.keys(def.variables || {})) {
    const group = def.variables[groupName];
    for (const variable of asArray(group)) {
      variables.push({
        group: groupName,
        id: variable.id || variable.ID || variable.key || variable.name || null,
        name: variable.name || variable.label || variable.DisplayName || variable.title || null,
        type: variable.type || variable.fieldtype || variable.FieldType || null,
        defaultValue: variable.value ?? variable.defaultValue ?? variable.DefaultValue ?? null,
        required: variable.required ?? variable.Rules?.required ?? variable.attrs?.required ?? null,
        raw: redact(variable),
      });
    }
  }
  const byId = new Map();
  const byName = new Map();
  for (const variable of variables) {
    if (variable.id) byId.set(String(variable.id), variable);
    if (variable.name) byName.set(String(variable.name), variable);
  }
  return { variables, byId, byName };
}

function bindingCandidates(control) {
  const attrs = control.attrs || {};
  const candidates = [
    control.binding,
    control.bind,
    control.variable,
    control.variableId,
    control.field,
    control.fieldName,
    attrs.binding,
    attrs.bind,
    attrs.variable,
    attrs.variableId,
    attrs.field,
    attrs.fieldName,
    attrs.dataField,
  ].filter((value) => value !== undefined && value !== null && typeof value !== "object");
  return [...new Set(candidates.map(String))];
}

function variableFromControl(control, index) {
  for (const candidate of bindingCandidates(control)) {
    if (index.byId.has(candidate)) return index.byId.get(candidate);
    if (index.byName.has(candidate)) return index.byName.get(candidate);
  }
  return null;
}

function inferLabel(control) {
  return control.label || control.title || control.name || control.attrs?.label || control.attrs?.title || control.attrs?.fieldLabel || control.attrs?.headc?.title?.value || null;
}

function summarizeControl(control, page, parent, index, pathText) {
  const attrs = control.attrs || {};
  const variable = variableFromControl(control, index);
  const dynamicDisplay = attrs.control_display || attrs.displayRules || null;
  const eventRules = attrs.control_event_rule || attrs.eventRules || null;
  const validation = attrs.control_validation || attrs.validation || control.Rules || attrs.Rules || null;
  const common = attrs.common || {};
  const positioning = common.positioning || attrs.positioning || {};
  return {
    id: control.id || control.ID || null,
    type: control.type || null,
    label: inferLabel(control),
    nv_label: control.nv_label || attrs.nv_label || null,
    page: {
      id: page.id || null,
      title: page.title || page.name || null,
      type: page.type ?? null,
      pagetype: page.pagetype ?? null,
    },
    path: pathText,
    parent: parent ? {
      id: parent.id || null,
      type: parent.type || null,
      nv_label: parent.nv_label || parent.attrs?.nv_label || null,
      label: inferLabel(parent),
    } : null,
    bindingCandidates: bindingCandidates(control),
    relatedVariable: variable ? {
      id: variable.id,
      name: variable.name,
      type: variable.type,
      group: variable.group,
      defaultValue: variable.defaultValue,
      required: variable.required,
    } : null,
    readonly: control.readonly ?? attrs.readonly ?? attrs.disabled ?? attrs.ro ?? null,
    required: control.required ?? attrs.required ?? control.Rules?.required ?? attrs.Rules?.required ?? null,
    defaultValue: control.defaultValue ?? control.DefaultValue ?? attrs.defaultValue ?? attrs.DefaultValue ?? attrs.value ?? control.value ?? null,
    width: {
      widthtype: configValue(positioning.widthtype ?? common.widthtype ?? attrs.widthtype),
      w: configValue(positioning.w ?? common.w ?? attrs.w),
      col: configValue(control.col ?? attrs.col),
      columnSpan: configValue(control.columnSpan ?? attrs.columnSpan ?? attrs.colspan),
      displayLabel: configValue(control.displayLabel ?? attrs.displayLabel),
    },
    style: compact({
      common,
      heads: attrs.heads,
      headc: attrs.headc,
      style: attrs.style,
      css: common.css || attrs.css,
      background: attrs.background,
      border: attrs.border,
    }),
    attrsSummary: compact(attrs, 1200),
    validation: compact(validation),
    dynamicDisplay: compact(dynamicDisplay),
    eventRules: compact(eventRules),
    customCss: common.css || attrs.css || null,
    dataBound: Boolean(variable || bindingCandidates(control).length),
  };
}

function collectControls(def, index) {
  const controls = [];
  function walk(node, page, parent, pathText) {
    if (!isObject(node)) return;
    if (node.type) controls.push(summarizeControl(node, page, parent, index, pathText));
    const children = asArray(node.children);
    children.forEach((child, childIndex) => walk(child, page, node, `${pathText}.children[${childIndex}]`));
    for (const key of ["columns", "items", "tabs", "rows"]) {
      const nested = asArray(node[key]);
      nested.forEach((child, childIndex) => walk(child, page, node, `${pathText}.${key}[${childIndex}]`));
    }
  }
  asArray(def.pageurls).forEach((page, pageIndex) => {
    walk(page.formdef, page, null, `$.pageurls[${pageIndex}].formdef`);
  });
  return controls;
}

function summarizeByType(controls) {
  const grouped = {};
  for (const control of controls) {
    const type = control.type || "unknown";
    grouped[type] ||= {
      count: 0,
      labels: [],
      nvLabels: [],
      variableTypes: [],
      requiredCount: 0,
      readonlyCount: 0,
      hasDynamicDisplay: 0,
      hasValidation: 0,
      sampleIds: [],
    };
    const row = grouped[type];
    row.count += 1;
    if (control.label && row.labels.length < 8) row.labels.push(control.label);
    if (control.nv_label && row.nvLabels.length < 8) row.nvLabels.push(control.nv_label);
    if (control.relatedVariable?.type && !row.variableTypes.includes(control.relatedVariable.type)) row.variableTypes.push(control.relatedVariable.type);
    if (control.required) row.requiredCount += 1;
    if (control.readonly) row.readonlyCount += 1;
    if (control.dynamicDisplay) row.hasDynamicDisplay += 1;
    if (control.validation) row.hasValidation += 1;
    if (control.id && row.sampleIds.length < 5) row.sampleIds.push(control.id);
  }
  return Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)));
}

function markdownReport({ inputPath, wrapper, form, def, controls, variables, byType, largeNumbers }) {
  const lines = [];
  lines.push("# AI Training Approval Form Control Inspection");
  lines.push("");
  lines.push(`Source: \`${inputPath}\``);
  lines.push(`App title: \`${wrapper.Title || ""}\``);
  lines.push(`Approval form: \`${form.Name || form.FlowName || form.Title || ""}\``);
  lines.push(`Form key: \`${form.FlowKey || def.defkey || ""}\``);
  lines.push(`Pages: ${asArray(def.pageurls).length}`);
  lines.push(`Variables: ${variables.length}`);
  lines.push(`Controls: ${controls.length}`);
  lines.push(`Large numeric IDs preserved as strings: ${largeNumbers.size}`);
  lines.push("");
  lines.push("## Control Types");
  lines.push("");
  lines.push("| Type | Count | Variable types | Validation | Dynamic display | Example labels |");
  lines.push("| --- | ---: | --- | ---: | ---: | --- |");
  for (const [type, info] of Object.entries(byType)) {
    lines.push(`| \`${type}\` | ${info.count} | ${info.variableTypes.map((v) => `\`${v}\``).join(", ") || "-"} | ${info.hasValidation} | ${info.hasDynamicDisplay} | ${info.labels.map((v) => String(v).replace(/\|/g, "\\|")).join(", ") || "-"} |`);
  }
  lines.push("");
  lines.push("## Control To Variable Bindings");
  lines.push("");
  lines.push("| Control type | Label / nv_label | Variable | Variable type | Binding candidates |");
  lines.push("| --- | --- | --- | --- | --- |");
  controls.filter((control) => control.relatedVariable || control.bindingCandidates.length).forEach((control) => {
    const label = (control.nv_label || control.label || control.id || "").replace(/\|/g, "\\|");
    lines.push(`| \`${control.type}\` | ${label} | \`${control.relatedVariable?.name || control.relatedVariable?.id || "-"}\` | \`${control.relatedVariable?.type || "-"}\` | ${control.bindingCandidates.map((v) => `\`${String(v).replace(/`/g, "\\`")}\``).join(", ") || "-"} |`);
  });
  lines.push("");
  lines.push("## Reusable Findings");
  lines.push("");
  lines.push("- This export is a focused approval-form control reference, not a generated-app baseline.");
  lines.push("- The form stores value-entry controls and their workflow variables together in one `.yap` app-level approval form with `Data.Forms[].ListID = 0`.");
  lines.push("- Tabs and `flex_grid` containers are used as layout structure around many controls; generation should keep layout containers separate from business value controls.");
  lines.push("- File, icon, picker, lookup-list, metadata, multi-metadata, list/sublist, and data-list controls should remain export-backed/runtime-sensitive patterns unless a generated package proves them.");
  lines.push("- `workflowControlPanel` and `workflowHistory` appear on the submission page and remain the default generated Form bottom controls.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

const decoded = decodeYap(inputPath);
const forms = asArray(decoded.data.Forms);
const selectedForm = forms.find((form) => formMatches(form, formName))
  || forms.find((form) => String(form.Name || "").toLowerCase() === "approval form")
  || forms[0];

if (!selectedForm) throw new Error("No approval form was found in Data.Forms.");
if (!formMatches(selectedForm, formName) && String(selectedForm.Name || "").toLowerCase() !== "approval form") {
  throw new Error(`Approval form named ${formName} was not found.`);
}

const def = decodeDefResource(selectedForm, decoded.largeNumbers);
const index = variableIndex(def);
const controls = collectControls(def, index);
const byType = summarizeByType(controls);

for (const outputPath of [resourceOutPath, dataOutPath, defOutPath, jsonOutPath, mdOutPath]) {
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
}

fs.writeFileSync(resourceOutPath, `${JSON.stringify(redact(decoded.resource), null, 2)}\n`, "utf8");
fs.writeFileSync(dataOutPath, `${JSON.stringify(redact(decoded.data), null, 2)}\n`, "utf8");
fs.writeFileSync(defOutPath, `${JSON.stringify(redact(def), null, 2)}\n`, "utf8");
fs.writeFileSync(jsonOutPath, `${JSON.stringify({
  source: inputPath,
  appTitle: decoded.wrapper.Title || null,
  selectedForm: {
    name: selectedForm.Name || null,
    flowName: selectedForm.FlowName || null,
    title: selectedForm.Title || null,
    flowKey: selectedForm.FlowKey || null,
    procModelId: selectedForm.ProcModelID || null,
    listId: selectedForm.ListID ?? null,
  },
  defkey: def.defkey || null,
  pages: asArray(def.pageurls).map((page) => ({
    id: page.id || null,
    title: page.title || page.name || null,
    type: page.type ?? null,
    pagetype: page.pagetype ?? null,
    childCount: asArray(page.formdef?.children).length,
  })),
  variables: index.variables.map((variable) => ({ ...variable, raw: compact(variable.raw) })),
  controlCount: controls.length,
  controlsByType: byType,
  controls,
  generatedAt: new Date().toISOString(),
  largeNumbersPreserved: decoded.largeNumbers.size,
}, null, 2)}\n`, "utf8");
fs.writeFileSync(mdOutPath, markdownReport({
  inputPath,
  wrapper: decoded.wrapper,
  form: selectedForm,
  def,
  controls,
  variables: index.variables,
  byType,
  largeNumbers: decoded.largeNumbers,
}), "utf8");

console.log(JSON.stringify({
  status: "pass",
  selectedForm: selectedForm.Name || selectedForm.FlowName || selectedForm.Title || null,
  decodedResource: resourceOutPath,
  decodedData: dataOutPath,
  approvalFormDef: defOutPath,
  inspectionJson: jsonOutPath,
  inspectionMarkdown: mdOutPath,
  controls: controls.length,
  controlTypes: Object.keys(byType).length,
  variables: index.variables.length,
  largeNumbersPreserved: decoded.largeNumbers.size,
}, null, 2));
