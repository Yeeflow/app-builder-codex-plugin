#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const TARGET_LISTS = [
  "Data list with fields part A",
  "Data list with fields part B",
  "Data list with fields part C",
];
const USAGES = ["add", "edit", "view"];
const USAGE_LABELS = { add: "New Item", edit: "Edit Item", view: "View Item" };
const SIZE_LABELS = { 0: "Medium", 1: "Small", 2: "Large", 3: "Full screen" };
const EXPLICIT_OPEN_MODE_LABELS = {
  modal: "Pop-up window",
  slide: "Slide in",
  target: "Current page",
  new: "New page",
  page: "Full page",
  fullpage: "Full page",
  fullPage: "Full page",
};

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-list-custom-forms.mjs <app.yap|decoded.json> [--list <name>] [--json <report.json>] [--normalized-dir <dir>]",
    "",
    "Examples:",
    "  node scripts/inspect-data-list-custom-forms.mjs '/Users/Renger/Downloads/Data Lists (3).yap'",
    "  node scripts/inspect-data-list-custom-forms.mjs sample.yap --list 'Data list with fields part A' --normalized-dir docs/studies/normalized/data-list-custom-forms",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { input: null, lists: [], json: null, normalizedDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--list") args.lists.push(argv[++i]);
    else if (arg === "--json") args.json = argv[++i];
    else if (arg === "--normalized-dir") args.normalizedDir = argv[++i];
    else if (!args.input) args.input = arg;
    else usage();
  }
  if (!args.input) usage();
  if (!args.lists.length) args.lists = [...TARGET_LISTS];
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
      while (jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (/[0-9eE+\-.]/.test(jsonText[j] || "")) j += 1;
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

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return { ok: true, value };
  if (typeof value !== "string" || !value.trim()) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, value: {}, error: error.message };
  }
}

function decodeInput(inputPath) {
  const parsed = parseJson(fs.readFileSync(inputPath, "utf8"));
  if (typeof parsed.Resource === "string" && parsed.Resource.startsWith(GZIP_PREFIX)) {
    const resource = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"));
    return {
      wrapper: { title: parsed.Title || null, isListSet: parsed.IsListSet },
      resource: { mainListType: resource.MainListType, appId: resource.AppID },
      data: typeof resource.Data === "string" ? parseJson(resource.Data) : resource.Data,
    };
  }
  if (typeof parsed.Data === "string") {
    return {
      wrapper: null,
      resource: { mainListType: parsed.MainListType, appId: parsed.AppID },
      data: parseJson(parsed.Data),
    };
  }
  return { wrapper: null, resource: null, data: parsed.Data && parsed.Item ? parsed.Data : parsed };
}

function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function listTitle(item, fallbackIndex) {
  return safeString(item?.ListModel?.Title) || `list-${fallbackIndex + 1}`;
}

function parseFormResource(layout) {
  const resource = asArray(layout.LayoutInResources)[0]?.Resource;
  if (!resource) return { ok: false, error: "missing" };
  if (isObject(resource)) return { ok: true, value: resource };
  try {
    return { ok: true, value: JSON.parse(resource) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function controlType(control) {
  return safeString(control?.type || control?.controlType || control?.Type || control?.name);
}

function isVisualControl(control) {
  return isObject(control) && typeof control.type === "string" && (control.id || control.binding || control.attrs || Array.isArray(control.children));
}

function walkVisualControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  if (isVisualControl(control)) visitor(control, pointer);
  for (const key of ["children", "controls", "items", "rows", "cells"]) {
    if (Array.isArray(control[key])) {
      control[key].forEach((child, index) => walkVisualControls(child, visitor, `${pointer}/${key}/${index}`));
    }
  }
}

function walkObject(value, visitor, pointer = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkObject(item, visitor, `${pointer}/${index}`));
    return;
  }
  if (!isObject(value)) return;
  visitor(value, pointer);
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") walkObject(child, visitor, `${pointer}/${key}`);
  }
}

function bindingFor(control) {
  return control.binding || control.field || control.FieldName || control.valueField || control.attrs?.binding || control.attrs?.field || control.attrs?.fieldName;
}

function tempVarKey(id) {
  const raw = safeString(id);
  return raw.startsWith("__temp_") ? raw.replace(/^__temp_/, "") : raw;
}

function summarizeAttrs(attrs) {
  return Object.keys(attrs || {}).sort();
}

function summarizeGrid(control) {
  const attrs = control.attrs || {};
  return {
    idPlaceholder: "__CONTROL_ID__",
    type: control.type,
    label: control.label || null,
    columnsBreakpoints: Object.keys(attrs.columns || {}).sort(),
    rowsBreakpoints: Object.keys(attrs.rows || {}).sort(),
    columnGapKeys: Object.keys(attrs.cgap || {}).sort(),
    childCount: asArray(control.children).length,
    proof: "export-proven; IDs redacted",
  };
}

function defaultOpenModeForUsage(usage) {
  return usage === "view" ? "Slide in" : "Pop-up window";
}

function normalizeOpenMode(rawMode, usage) {
  const raw = safeString(rawMode);
  if (!raw) return { code: null, label: defaultOpenModeForUsage(usage), source: "default" };
  return { code: raw, label: EXPLICIT_OPEN_MODE_LABELS[raw] || "Unknown", source: "explicit" };
}

function normalizeSize(rawSize) {
  if (rawSize === undefined || rawSize === null || rawSize === "") return { code: null, label: "Default", source: "missing" };
  return { code: rawSize, label: SIZE_LABELS[Number(rawSize)] || "Unknown", source: "explicit" };
}

function inspectDisplaySettings(item, formsByLayoutId, listName, findings) {
  const parsed = parseMaybeJson(item.ListModel?.LayoutView);
  const value = parsed.value || {};
  if (!parsed.ok || !isObject(value)) {
    addFinding(findings, "warning", "CUSTOM_FORM_DISPLAY_SETTINGS_PARSE_FAILED", "ListModel.LayoutView should parse as a display-settings object.", { list: listName, error: parsed.error || null });
    return [];
  }
  const settings = [];
  for (const usage of USAGES) {
    const formRef = value[usage] === undefined ? "default" : value[usage];
    const refKey = safeString(formRef);
    const usesDefaultLayout = refKey === "" || refKey === "default";
    const selectedForm = usesDefaultLayout ? null : formsByLayoutId.get(refKey);
    const openMode = normalizeOpenMode(value.opentype && value.opentype[usage], usage);
    const size = normalizeSize(value.modalsize && value.modalsize[usage]);
    if (usage === "add" && usesDefaultLayout) {
      addFinding(findings, "error", "LAYOUTVIEW_ADD_LAYOUT_MISSING", "Data List display settings must assign New item to a concrete custom form layout; opentype/modalsize alone can leave the Add modal loading forever.", { list: listName, usage });
    }
    if (!usesDefaultLayout && !selectedForm) {
      addFinding(findings, "error", "CUSTOM_FORM_DISPLAY_FORM_REF_NOT_FOUND", "Custom list form display setting references a form layout that does not exist.", { list: listName, usage, formRef: "__LAYOUT_ID_REDACTED__" });
    }
    if (openMode.label === "Unknown") {
      addFinding(findings, "warning", "CUSTOM_FORM_DISPLAY_OPEN_MODE_UNKNOWN", "Custom list form display setting uses an unknown open mode.", { list: listName, usage, openMode: openMode.code });
    }
    if (size.label === "Unknown") {
      addFinding(findings, "warning", "CUSTOM_FORM_DISPLAY_SIZE_UNKNOWN", "Custom list form display setting uses an unknown size code.", { list: listName, usage, size: size.code });
    }
    if (openMode.label === "Full page" && size.code !== null) {
      addFinding(findings, "warning", "CUSTOM_FORM_DISPLAY_FULL_PAGE_SIZE_SET", "Full page display settings should not rely on pop-up/slide size behavior unless a future export proves it.", { list: listName, usage, size: size.label });
    }
    settings.push({
      usage,
      label: USAGE_LABELS[usage],
      formReference: usesDefaultLayout ? "default" : "__LAYOUT_ID__",
      formName: selectedForm ? selectedForm.Title || null : usesDefaultLayout ? "Default layout" : null,
      usesDefaultLayout,
      openMode,
      size,
      proofLevel: "export-proven for Data Lists (3).yap; UI label mapping uses provided screenshots as visual reference",
    });
  }
  if (value.sort !== undefined) {
    if (!Array.isArray(value.sort)) {
      addFinding(findings, "error", "LAYOUTVIEW_SORT_SHAPE_UNSUPPORTED", "Data List display-settings sort must be omitted or use an export-supported array shape.", { list: listName, shape: typeof value.sort });
    } else {
      value.sort.forEach((entry, index) => {
        if (isObject(entry)) {
          addFinding(findings, "error", "LAYOUTVIEW_SORT_OBJECT_UNSUPPORTED", "Data List display-settings sort object entries are not supported for runtime-safe New item behavior.", { list: listName, index });
        }
      });
    }
  }
  return settings;
}

function listFieldMap(fields) {
  const byName = new Map();
  const byId = new Map();
  const byInternalName = new Map();
  for (const field of fields) {
    if (field.FieldName) byName.set(String(field.FieldName), field);
    if (field.FieldID) byId.set(String(field.FieldID), field);
    if (field.InternalName) byInternalName.set(String(field.InternalName), field);
  }
  return { byName, byId, byInternalName };
}

function sanitizeValue(value, key = "") {
  if (Array.isArray(value)) return value.map((item, index) => sanitizeValue(item, `${key}[${index}]`));
  if (isObject(value)) {
    const out = {};
    for (const [childKey, child] of Object.entries(value)) out[childKey] = sanitizeValue(child, childKey);
    return out;
  }
  if (/id|appid|listid|listsetid|tenant|user|by|category|parent|ref|link/i.test(key)) return value === undefined || value === null || value === "" ? value : "__ID_REDACTED__";
  if (/name|title|label|value|placeholder|text|prefix|suffix/i.test(key) && typeof value === "string" && value.trim()) return `__${key.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_REDACTED__`;
  return value;
}

function sanitizeControl(control, field = null) {
  return {
    id: "__CONTROL_ID__",
    type: control.type || null,
    binding: control.binding || null,
    fieldID: control.fieldID ? "__FIELD_ID__" : null,
    label: "__LABEL_REDACTED__",
    attrs: sanitizeValue(control.attrs || {}),
    field: field ? {
      FieldName: field.FieldName || null,
      FieldID: "__FIELD_ID__",
      InternalName: "__INTERNAL_NAME_REDACTED__",
      Type: field.Type || null,
      FieldType: field.FieldType || null,
      IsSystem: field.IsSystem === true,
    } : null,
    proof: "export-proven; private values redacted",
  };
}

function sanitizeForm(form, layout) {
  return {
    layout: {
      Type: layout.Type ?? null,
      Title: "__FORM_TITLE_REDACTED__",
      LayoutID: "__LAYOUT_ID__",
      LayoutView: layout.LayoutView ?? null,
      Ext2Shape: typeof layout.Ext2,
      LayoutInResources: [{ ID: "__LAYOUT_ID__", RefId: "__LAYOUT_ID__", Resource: "__JSON_STRING__" }],
    },
    resource: {
      title: "__FORM_TITLE_REDACTED__",
      childrenShape: "array",
      attrsKeys: Object.keys(form.attrs || {}).sort(),
      filterVarsShape: Array.isArray(form.filterVars) ? "array" : typeof form.filterVars,
      tempVarsShape: Array.isArray(form.tempVars) ? "array" : typeof form.tempVars,
      actionsShape: Array.isArray(form.actions) ? "array" : typeof form.actions,
      formActionShape: form.formAction ? "object" : "missing",
      ver: form.ver ?? null,
    },
    proof: "export-proven; private values redacted",
  };
}

function collectExpressionRefs(value) {
  const refs = { fields: [], tempVars: [] };
  walkObject(value, (node) => {
    if (node.exprType === "list_field" && node.prop) refs.fields.push(String(node.prop));
    if (node.exprType === "variable" && (node.id || node.name)) refs.tempVars.push(String(node.id || node.name));
  });
  return refs;
}

function inspectForm(layout, form, fields, listName, findings) {
  const maps = listFieldMap(fields);
  const actions = asArray(form.actions);
  const actionIds = new Set(actions.map((action) => safeString(action.id)).filter(Boolean));
  const tempVarIds = new Set(asArray(form.tempVars).flatMap((tempVar) => [safeString(tempVar.id), tempVarKey(tempVar.id)]).filter(Boolean));
  const controls = [];
  const grids = [];
  const listBoundControls = [];
  const nestedListControls = [];
  const actionBindings = [];
  const controlTypes = new Map();
  const fieldTypes = new Map();
  const seenControlIds = new Map();
  const formPath = `${listName}.Layouts[${layout.__layoutIndex}]`;

  if (!Array.isArray(form.children)) addFinding(findings, "error", "CUSTOM_FORM_CHILDREN_NOT_ARRAY", "Custom list form Resource.children must be an array.", { form: layout.Title || null, list: listName });
  if (!Array.isArray(form.tempVars)) addFinding(findings, "warning", "CUSTOM_FORM_TEMPVARS_NOT_ARRAY", "Custom list form Resource.tempVars should be an array.", { form: layout.Title || null, list: listName });
  if (form.actions !== undefined && !Array.isArray(form.actions)) addFinding(findings, "warning", "CUSTOM_FORM_ACTIONS_NOT_ARRAY", "Custom list form Resource.actions should be an array when present.", { form: layout.Title || null, list: listName });

  asArray(form.children).forEach((child, childIndex) => {
    walkVisualControls(child, (control, pointer) => {
      const pointerPath = `${formPath}.Resource.children[${childIndex}]${pointer.slice(1)}`;
      const type = controlType(control);
      if (!type) return;
      controlTypes.set(type, (controlTypes.get(type) || 0) + 1);
      const controlId = safeString(control.id);
      if (controlId) {
        if (seenControlIds.has(controlId)) addFinding(findings, "error", "CUSTOM_FORM_CONTROL_ID_DUPLICATE", "Custom list form control IDs must be unique within a form.", { list: listName, form: layout.Title || null, firstPath: seenControlIds.get(controlId), path: pointerPath });
        else seenControlIds.set(controlId, pointerPath);
      } else {
        addFinding(findings, "warning", "CUSTOM_FORM_CONTROL_ID_MISSING", "Visual controls should include a stable id.", { list: listName, form: layout.Title || null, path: pointerPath, type });
      }

      if (type === "flex_grid") grids.push({ control, path: pointerPath });
      const binding = safeString(bindingFor(control));
      const field = binding ? maps.byName.get(binding) || maps.byInternalName.get(binding) : null;
      if (binding && control.attrs?.list_field === true) {
        nestedListControls.push({ control, path: pointerPath, parentBinding: control.attrs.list_field_binding || null });
      } else if (binding) {
        if (!field) {
          addFinding(findings, "error", "CUSTOM_FORM_FIELD_BINDING_NOT_FOUND", "List-bound form control binding does not resolve to a field in the same list.", { list: listName, form: layout.Title || null, path: pointerPath, binding, type });
        } else {
          listBoundControls.push({ control, field, path: pointerPath });
          fieldTypes.set(safeString(field.Type), (fieldTypes.get(safeString(field.Type)) || 0) + 1);
        }
      }
      if (control.fieldID && !maps.byId.has(String(control.fieldID))) {
        addFinding(findings, "error", "CUSTOM_FORM_FIELDID_NOT_FOUND", "List-bound form control fieldID does not resolve to a field in the same list.", { list: listName, form: layout.Title || null, path: pointerPath, fieldID: "__FIELD_ID_REDACTED__", type });
      }
      if (control.fieldID && field && String(control.fieldID) !== String(field.FieldID)) {
        addFinding(findings, "error", "CUSTOM_FORM_FIELDID_BINDING_MISMATCH", "Form control fieldID should match the field resolved by binding.", { list: listName, form: layout.Title || null, path: pointerPath, binding, type });
      }
      const actionId = safeString(control.attrs?.control_action || control.action || control.actionId);
      if (actionId) {
        actionBindings.push({ control, actionId, path: pointerPath });
        if (!actionIds.has(actionId)) addFinding(findings, "error", "CUSTOM_FORM_ACTION_BINDING_NOT_FOUND", "Action button control references an action id that is not defined in Resource.actions.", { list: listName, form: layout.Title || null, path: pointerPath, actionId: "__ACTION_ID_REDACTED__" });
      }
      if (type === "list") validateSubListControl(control, fields, listName, layout, pointerPath, findings);
    });
  });

  for (const [key, actionId] of Object.entries(form.formAction || {})) {
    if (actionId && !actionIds.has(String(actionId))) addFinding(findings, "error", "CUSTOM_FORM_FORMACTION_NOT_FOUND", "formAction hook references an action id that is not defined in Resource.actions.", { list: listName, form: layout.Title || null, hook: key });
  }

  actions.forEach((action, actionIndex) => {
    if (!action.id) addFinding(findings, "error", "CUSTOM_FORM_ACTION_ID_MISSING", "Custom form actions must include id.", { list: listName, form: layout.Title || null, actionIndex });
    if (!Array.isArray(action.steps)) addFinding(findings, "error", "CUSTOM_FORM_ACTION_STEPS_NOT_ARRAY", "Custom form action steps must be an array.", { list: listName, form: layout.Title || null, actionIndex, actionName: action.name || null });
    asArray(action.steps).forEach((step, stepIndex) => {
      if (!step.type) addFinding(findings, "warning", "CUSTOM_FORM_ACTION_STEP_TYPE_MISSING", "Action step should include type.", { list: listName, form: layout.Title || null, actionName: action.name || null, stepIndex });
      if (step.type && !["setvar", "submit", "submit_form", "save", "close", "open", "message"].includes(String(step.type))) {
        addFinding(findings, "warning", "CUSTOM_FORM_ACTION_STEP_UNKNOWN", "Action step type is not yet export-learned for custom list forms.", { list: listName, form: layout.Title || null, actionName: action.name || null, stepType: step.type });
      }
      const refs = collectExpressionRefs(step);
      for (const fieldRef of refs.fields) {
        if (!maps.byName.has(fieldRef)) addFinding(findings, "error", "CUSTOM_FORM_ACTION_FIELD_REF_NOT_FOUND", "Custom form action references a list field that does not exist.", { list: listName, form: layout.Title || null, actionName: action.name || null, fieldRef });
      }
      for (const tempRef of refs.tempVars) {
        const normalized = tempVarKey(tempRef);
        if (!tempVarIds.has(tempRef) && !tempVarIds.has(normalized)) addFinding(findings, "error", "CUSTOM_FORM_ACTION_TEMPVAR_REF_NOT_FOUND", "Custom form action references a temp variable that does not exist.", { list: listName, form: layout.Title || null, actionName: action.name || null, tempVar: "__TEMP_VAR_REDACTED__" });
      }
    });
  });

  return {
    name: layout.Title || null,
    layoutIdPlaceholder: "__LAYOUT_ID__",
    assignedDisplaySettings: [],
    controlCount: controls.length || [...controlTypes.values()].reduce((sum, count) => sum + count, 0),
    listBoundControlCount: listBoundControls.length,
    nestedListControlCount: listBoundControls
      .filter(({ control }) => control.type === "list")
      .reduce((sum, { control }) => sum + asArray(control.attrs?.["list-fields"]).filter((field) => field && field.control).length, 0),
    gridControlCount: grids.length,
    tempVariableCount: asArray(form.tempVars).length,
    formActionCount: actions.length,
    actionBindingCount: actionBindings.length,
    controlTypes: Object.fromEntries([...controlTypes.entries()].sort()),
    fieldTypesRepresented: Object.fromEntries([...fieldTypes.entries()].sort()),
    gridSummaries: grids.map(({ control }) => summarizeGrid(control)),
    tempVariables: asArray(form.tempVars).map((tempVar, index) => ({
      sourceTempVariable: `temp-var-${index + 1}`,
      idPlaceholder: "__TEMP_VAR_ID__",
      keys: Object.keys(tempVar || {}).sort(),
      proofLevel: "export-proven",
    })),
    actions: actions.map((action, index) => ({
      sourceAction: `action-${index + 1}`,
      idPlaceholder: "__ACTION_ID__",
      namePlaceholder: "__ACTION_NAME_REDACTED__",
      stepTypes: asArray(action.steps).map((step) => step.type || null),
      stepCount: asArray(action.steps).length,
      proofLevel: "export-proven",
    })),
    actionBindings: actionBindings.map((binding, index) => ({
      sourceBinding: `action-binding-${index + 1}`,
      controlType: binding.control.type || null,
      actionIdPlaceholder: "__ACTION_ID__",
      proofLevel: "export-proven",
    })),
  };
}

function validateSubListControl(control, fields, listName, layout, pointerPath, findings) {
  const variables = asArray(control.attrs?.["list-variables"]);
  const listFields = asArray(control.attrs?.["list-fields"]);
  if (!variables.length) addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_VARIABLES_MISSING", "Sub-list form control should include attrs.list-variables.", { list: listName, form: layout.Title || null, path: pointerPath, binding: control.binding || null });
  if (!listFields.length) addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_FIELDS_MISSING", "Sub-list form control should include attrs.list-fields.", { list: listName, form: layout.Title || null, path: pointerPath, binding: control.binding || null });
  const variableNames = new Set(variables.map((field) => safeString(field.name)).filter(Boolean));
  const nestedControlIds = new Set();
  for (const [index, nested] of listFields.entries()) {
    const name = safeString(nested.name);
    if (name && !variableNames.has(name)) addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_FIELD_VARIABLE_NOT_FOUND", "Sub-list attrs.list-fields entry does not resolve to attrs.list-variables by name.", { list: listName, form: layout.Title || null, path: `${pointerPath}.attrs.list-fields[${index}]`, name });
    const nestedControl = nested.control || {};
    if (!nestedControl.type || !nestedControl.binding) addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_NESTED_CONTROL_INCOMPLETE", "Sub-list nested field control should include type and binding.", { list: listName, form: layout.Title || null, path: `${pointerPath}.attrs.list-fields[${index}]` });
    const nestedId = safeString(nestedControl.id);
    if (nestedId) {
      if (nestedControlIds.has(nestedId)) addFinding(findings, "error", "CUSTOM_FORM_SUBLIST_CONTROL_ID_DUPLICATE", "Sub-list nested control ids must be unique inside the sub-list control.", { list: listName, form: layout.Title || null, path: `${pointerPath}.attrs.list-fields[${index}]` });
      nestedControlIds.add(nestedId);
    }
    if (nestedControl.attrs?.list_field_binding !== control.binding) {
      addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_PARENT_BINDING_MISMATCH", "Sub-list nested control attrs.list_field_binding should point back to the parent sub-list field binding.", { list: listName, form: layout.Title || null, path: `${pointerPath}.attrs.list-fields[${index}]`, parentBinding: control.binding || null });
    }
  }
  const field = fields.find((candidate) => candidate.FieldName === control.binding);
  const rules = parseMaybeJson(field?.Rules).value || {};
  const ruleVariables = asArray(rules["list-variables"]);
  if (field && ruleVariables.length && variables.length !== ruleVariables.length) {
    addFinding(findings, "warning", "CUSTOM_FORM_SUBLIST_VARIABLE_COUNT_DIFFERS_FROM_FIELD_RULES", "Sub-list form control variable count differs from the parent field Rules.list-variables count.", { list: listName, form: layout.Title || null, path: pointerPath, controlVariables: variables.length, fieldRuleVariables: ruleVariables.length });
  }
}

function buildReport(decoded, targetNames) {
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  const targetSet = new Set(targetNames);
  const targetLists = allLists.filter((item) => targetSet.has(listTitle(item, allLists.indexOf(item))));
  const findings = [];
  for (const name of targetNames) {
    if (!targetLists.some((item) => listTitle(item, allLists.indexOf(item)) === name)) {
      addFinding(findings, "error", "TARGET_LIST_NOT_FOUND", "Requested target data list was not found.", { list: name });
    }
  }

  const listReports = targetLists.map((item) => {
    const listName = listTitle(item, allLists.indexOf(item));
    const fields = asArray(item.Defs);
    const customLayouts = asArray(item.Layouts)
      .map((layout, index) => ({ ...layout, __layoutIndex: index }))
      .filter((layout) => Number(layout.Type) === 1);
    const formsByLayoutId = new Map(customLayouts.map((layout) => [safeString(layout.LayoutID), layout]));
    const displaySettings = inspectDisplaySettings(item, formsByLayoutId, listName, findings);
    const layoutView = parseMaybeJson(item.ListModel?.LayoutView).value || {};
    const forms = [];
    for (const layout of customLayouts) {
      const parsed = parseFormResource(layout);
      if (!parsed.ok) {
        addFinding(findings, "error", "CUSTOM_FORM_RESOURCE_PARSE_FAILED", "Custom list form resource could not be parsed.", { list: listName, form: layout.Title || null, error: parsed.error });
        continue;
      }
      const formReport = inspectForm(layout, parsed.value, fields, listName, findings);
      formReport.assignedDisplaySettings = Object.entries(layoutView)
        .filter(([, value]) => String(value) === String(layout.LayoutID))
        .map(([key]) => key);
      forms.push(formReport);
    }
    if (!customLayouts.length) addFinding(findings, "error", "CUSTOM_FORM_NOT_FOUND", "Target data list has no custom list form layouts.", { list: listName });
    const fieldTypesRepresented = new Set(forms.flatMap((form) => Object.keys(form.fieldTypesRepresented || {})));
    return {
      list: listName,
      listIdPlaceholder: "__LIST_ID__",
      resourceType: item.ListModel?.Type ?? null,
      fieldCount: fields.length,
      customFieldCount: fields.filter((field) => field.IsSystem !== true).length,
      systemFieldCount: fields.filter((field) => field.IsSystem === true).length,
      customFormCount: forms.length,
      customFormNames: forms.map((form) => form.name),
      displaySettings,
      controlsCount: forms.reduce((sum, form) => sum + form.controlCount, 0),
      listBoundControlsCount: forms.reduce((sum, form) => sum + form.listBoundControlCount, 0),
      gridControlsCount: forms.reduce((sum, form) => sum + form.gridControlCount, 0),
      tempVariablesCount: forms.reduce((sum, form) => sum + form.tempVariableCount, 0),
      formActionsCount: forms.reduce((sum, form) => sum + form.formActionCount, 0),
      fieldTypesRepresented: [...fieldTypesRepresented].sort(),
      forms,
      proofLevel: "export-proven",
    };
  });

  return {
    input: path.basename(process.argv[2] || ""),
    sourcePath: path.resolve(process.argv[2] || ""),
    proofBoundary: {
      dataListCustomForms: "export-proven for the inspected Data Lists (3).yap target data lists",
      documentLibraryApplicability: "product/user-understanding-backed unless a Type 16 document library export proves the exact custom form shape",
      runtimeRenderingAndActions: "not runtime-proven",
    },
    packageSummary: {
      title: decoded.wrapper?.title || null,
      appResourceCount: allLists.length,
      targetListCount: targetLists.length,
      targetLists: listReports.map((list) => list.list),
      customListForms: listReports.reduce((sum, list) => sum + list.customFormCount, 0),
      controlsInspected: listReports.reduce((sum, list) => sum + list.controlsCount, 0),
      listBoundControlsInspected: listReports.reduce((sum, list) => sum + list.listBoundControlsCount, 0),
      nestedSubListControlsInspected: listReports.reduce((sum, list) => sum + list.forms.reduce((formSum, form) => formSum + form.nestedListControlCount, 0), 0),
      gridControlsInspected: listReports.reduce((sum, list) => sum + list.gridControlsCount, 0),
      tempVariablesFound: listReports.reduce((sum, list) => sum + list.tempVariablesCount, 0),
      formActionsFound: listReports.reduce((sum, list) => sum + list.formActionsCount, 0),
      displaySettings: listReports.flatMap((list) => list.displaySettings).length,
      openModesFound: [...new Set(listReports.flatMap((list) => list.displaySettings).map((setting) => setting.openMode.label))].sort(),
      sizesFound: [...new Set(listReports.flatMap((list) => list.displaySettings).map((setting) => setting.size.label))].sort(),
      fieldTypesRepresented: [...new Set(listReports.flatMap((list) => list.fieldTypesRepresented))].sort(),
    },
    lists: listReports,
    findings,
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
  };
}

function firstMatchingForm(decoded, predicate) {
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  for (const item of allLists) {
    const fields = asArray(item.Defs);
    const maps = listFieldMap(fields);
    for (const layout of asArray(item.Layouts).filter((entry) => Number(entry.Type) === 1)) {
      const parsed = parseFormResource(layout);
      if (!parsed.ok) continue;
      const form = parsed.value;
      let result = null;
      asArray(form.children).forEach((child, childIndex) => {
        walkVisualControls(child, (control, pointer) => {
          if (!result && predicate(control, fields, form, layout)) {
            const binding = safeString(bindingFor(control));
            result = {
              item,
              layout,
              form,
              control,
              path: `children[${childIndex}]${pointer.slice(1)}`,
              field: binding ? maps.byName.get(binding) || maps.byInternalName.get(binding) : null,
            };
          }
        });
      });
      if (result) return result;
    }
  }
  return null;
}

function writeNormalizedRefs(report, decoded, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const refs = [
    ["custom-list-form-resource.normalized.json", () => {
      const found = firstMatchingForm(decoded, () => true);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", normalized: sanitizeForm(found.form, found.layout) };
    }],
    ["custom-list-form-grid-layout.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "flex_grid");
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: summarizeGrid(found.control) };
    }],
    ["custom-list-form-list-bound-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control, fields) => fields.some((field) => field.FieldName === control.binding && field.IsSystem !== true));
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-default-field-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control, fields) => fields.some((field) => field.FieldName === control.binding && field.IsSystem === true));
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-sublist-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "list");
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-lookup-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "lookup" && !control.attrs?.list_field);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-user-picker-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "identity-picker" && !control.attrs?.list_field);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-attachment-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "file-upload" && !control.attrs?.list_field);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-image-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "icon-upload" && !control.attrs?.list_field);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-calculated-control.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => control.type === "calculated-column");
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
    ["custom-list-form-temp-variable.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control, fields, form) => asArray(form.tempVars).length > 0);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", normalized: sanitizeValue(asArray(found.form.tempVars)[0]) };
    }],
    ["custom-list-form-action.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control, fields, form) => asArray(form.actions).length > 0);
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", normalized: sanitizeValue(asArray(found.form.actions)[0]) };
    }],
    ["custom-list-form-submit-action-step.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control, fields, form) => asArray(form.actions).some((action) => asArray(action.steps).some((step) => /submit/i.test(step.type || ""))));
      if (!found) return null;
      const action = asArray(found.form.actions).find((candidate) => asArray(candidate.steps).some((step) => /submit/i.test(step.type || "")));
      const step = asArray(action.steps).find((candidate) => /submit/i.test(candidate.type || ""));
      return { proof: "not found in Data Lists (3).yap target custom forms; placeholder retained only when a submit step is export-proven later", normalized: sanitizeValue(step) };
    }],
    ["custom-list-form-button-action-binding.normalized.json", () => {
      const found = firstMatchingForm(decoded, (control) => Boolean(control.attrs?.control_action));
      return found && { proof: "export-proven from Data Lists (3).yap; private values redacted", exportPath: found.path, normalized: sanitizeControl(found.control, found.field) };
    }],
  ];

  for (const [fileName, factory] of refs) {
    const value = factory();
    if (!value) continue;
    fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
  }

  const displaySettings = report.lists.flatMap((list) => list.displaySettings.map((setting) => ({ list: list.list, ...setting })));
  const displayRefs = [
    ["custom-list-form-display-new-item-popup-small.normalized.json", (setting) => setting.usage === "add" && setting.openMode.label === "Pop-up window" && setting.size.label === "Small"],
    ["custom-list-form-display-edit-item-popup-large.normalized.json", (setting) => setting.usage === "edit" && setting.openMode.label === "Pop-up window" && setting.size.label === "Large"],
    ["custom-list-form-display-view-item-slide-medium.normalized.json", (setting) => setting.usage === "view" && setting.openMode.label === "Slide in" && setting.size.label === "Medium"],
    ["custom-list-form-display-full-page.normalized.json", (setting) => setting.openMode.label === "Full page"],
    ["custom-list-form-display-default-layout.normalized.json", (setting) => setting.usesDefaultLayout],
    ["custom-list-form-display-view-item-popup-full-screen.normalized.json", (setting) => setting.usage === "view" && setting.openMode.label === "Pop-up window" && setting.size.label === "Full screen"],
  ];
  for (const [fileName, predicate] of displayRefs) {
    const setting = displaySettings.find(predicate);
    if (!setting) continue;
    fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify({
      proof: "export-proven from Data Lists (3).yap target data lists; private values redacted",
      exportPath: "Data.Childs[].ListModel.LayoutView",
      normalizedDisplaySetting: {
        list: "__LIST_TITLE_REDACTED__",
        usage: setting.usage,
        label: setting.label,
        formReference: setting.formReference,
        formName: setting.usesDefaultLayout ? "Default layout" : "__FORM_TITLE_REDACTED__",
        usesDefaultLayout: setting.usesDefaultLayout,
        openMode: setting.openMode,
        size: setting.size,
      },
    }, null, 2)}\n`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const decoded = decodeInput(args.input);
  const report = buildReport(decoded, args.lists);
  const output = JSON.stringify(report, null, 2);
  if (args.json) {
    fs.mkdirSync(path.dirname(args.json), { recursive: true });
    fs.writeFileSync(args.json, `${output}\n`);
  }
  if (args.normalizedDir) writeNormalizedRefs(report, decoded, args.normalizedDir);
  console.log(output);
  if (report.errors) process.exitCode = 1;
}

main();
