#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const TARGET_LISTS = [
  "Data list with fields part A",
  "Data list with fields part B",
];

const EXPORT_PROVEN_PUBLIC_FIELD_TYPES = new Set([
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

const UI_REFERENCE_UNAVAILABLE_FIELD_TYPES = new Set([
  "identity-picker",
  "organization-picker",
  "location-picker",
  "lookup",
  "calculated-column",
  "metadata",
  "mutiple-metadata",
  "cost-center-picker",
  "tag",
  "autonumber",
]);

const DEFAULT_FIELDS_BLOCKED_IN_PUBLIC_FORMS = new Set([
  "ListDataID",
  "Id",
  "ID",
  "Created",
  "CreatedBy",
  "CreatedByName",
  "Modified",
  "ModifiedBy",
  "ModifiedByName",
]);

const EXPORT_PROVEN_VISUAL_TYPES = new Set([
  "container",
  "flex_grid",
  "action_button",
  "submit-button",
  "text",
  "number",
  "boolean",
  "date",
  "file",
  "metadata",
  "user",
  "costcenter",
  "groupselect",
  "location",
  "lookup",
  "img",
  "total",
]);

const UI_REFERENCE_GENERAL_CONTROLS = [
  "Section",
  "Grid",
  "Container",
  "Text",
  "Paragraph",
  "Picture",
  "Divider",
  "Spacer",
  "Button",
  "Tab",
  "Table",
  "Toggle",
  "Icon",
  "Timer",
];

const UI_REFERENCE_ADVANCED_CONTROLS = [
  "Drop bar",
  "Alert",
  "Progress bar",
  "Progress circle",
  "Steps bar",
  "QR Code",
  "Barcode",
  "Custom code",
  "Embed",
  "Submit",
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-data-list-public-forms.mjs <app.yap|decoded.json> [--list <name>] [--json <report.json>] [--normalized-dir <dir>]",
    "",
    "Examples:",
    "  node scripts/inspect-data-list-public-forms.mjs '/Users/Renger/Downloads/Data Lists (4).yap'",
    "  node scripts/inspect-data-list-public-forms.mjs sample.yap --list 'Data list with fields part A' --normalized-dir docs/studies/normalized/data-list-public-forms",
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
    return { wrapper: null, resource: parsed, data: parseJson(parsed.Data) };
  }
  return { wrapper: null, resource: null, data: parsed.Data && parsed.Item ? parsed.Data : parsed };
}

function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, detail });
}

function listTitle(item, fallbackIndex) {
  return safeString(item?.ListModel?.Title) || `list-${fallbackIndex + 1}`;
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

function controlType(control) {
  return safeString(control?.type || control?.controlType || control?.Type || control?.name);
}

function isVisualControl(control) {
  return isObject(control) && typeof control.type === "string" && (control.id || control.binding || control.attrs || Array.isArray(control.children));
}

function walkVisualControls(control, visitor, pointer = "$") {
  if (!isObject(control)) return;
  if (isVisualControl(control)) visitor(control, pointer);
  for (const key of ["children", "controls", "items", "rows", "cells", "columns"]) {
    if (Array.isArray(control[key])) {
      control[key].forEach((child, index) => walkVisualControls(child, visitor, `${pointer}/${key}/${index}`));
    }
  }
}

function bindingFor(control) {
  const binding = control.binding || control.field || control.FieldName || control.valueField || control.attrs?.binding || control.attrs?.field || control.attrs?.fieldName;
  return typeof binding === "string" ? binding : "";
}

function parsePublicFormResource(publicForm, findings, listName) {
  if (!publicForm.Resource) {
    addFinding(findings, "error", "PUBLIC_FORM_RESOURCE_MISSING", "PublicForms[] entry is missing Resource.", { list: listName, publicForm: publicForm.Name || null });
    return null;
  }
  if (isObject(publicForm.Resource)) return publicForm.Resource;
  try {
    return JSON.parse(publicForm.Resource);
  } catch (error) {
    addFinding(findings, "error", "PUBLIC_FORM_RESOURCE_PARSE_FAILED", "PublicForms[] Resource must be valid JSON.", { list: listName, publicForm: publicForm.Name || null, error: error.message });
    return null;
  }
}

function hasUrlLikeValue(value) {
  let found = false;
  const walk = (node) => {
    if (found) return;
    if (typeof node === "string" && /https?:\/\/|share\.yeeflow|public/i.test(node)) {
      found = true;
      return;
    }
    if (Array.isArray(node)) node.forEach(walk);
    else if (isObject(node)) Object.values(node).forEach(walk);
  };
  walk(value);
  return found;
}

function isLikelyFieldControl(control, field) {
  if (field) return true;
  return Boolean(bindingFor(control) || control.fieldID);
}

function inspectPublicForm(publicForm, fields, listName, publicFormIndex, findings) {
  const maps = listFieldMap(fields);
  const resource = parsePublicFormResource(publicForm, findings, listName);
  const controls = [];
  const listBoundControls = [];
  const fieldTypes = new Map();
  const controlTypes = new Map();
  const generalControls = new Map();
  const advancedControls = new Map();
  const missingBindings = [];
  const submitControls = [];
  const seenControlIds = new Map();

  if (!resource) {
    return {
      name: publicForm.Name || null,
      publicFormIdPlaceholder: "__PUBLIC_FORM_ID__",
      resourcePath: `Data.Childs[].PublicForms[${publicFormIndex}].Resource`,
      pageCount: 0,
      visualControlsCount: 0,
      listBoundControlsCount: 0,
      submitControlsCount: 0,
      fieldTypesRepresented: [],
      controlTypes: {},
      proofLevel: "export-proven entry; resource parse failed",
    };
  }
  if (resource.pagetype !== 3) addFinding(findings, "warning", "PUBLIC_FORM_PAGETYPE_UNKNOWN", "Public form Resource.pagetype is expected to be 3 in studied exports.", { list: listName, publicForm: publicForm.Name || null, pagetype: resource.pagetype });
  if (!Array.isArray(resource.children)) addFinding(findings, "error", "PUBLIC_FORM_CHILDREN_NOT_ARRAY", "Public form Resource.children must be an array.", { list: listName, publicForm: publicForm.Name || null });
  if (resource.tempVars !== undefined && !Array.isArray(resource.tempVars)) addFinding(findings, "warning", "PUBLIC_FORM_TEMPVARS_NOT_ARRAY", "Public form Resource.tempVars should be an array when present.", { list: listName, publicForm: publicForm.Name || null });
  if (hasUrlLikeValue(publicForm.Ext) || hasUrlLikeValue(publicForm.ExpiredTip)) {
    addFinding(findings, "warning", "PUBLIC_FORM_URL_OR_SHARE_METADATA_PRESENT", "Public form appears to contain URL/share metadata; docs and normalized refs must redact it.", { list: listName, publicForm: publicForm.Name || null });
  }

  asArray(resource.children).forEach((child, childIndex) => {
    walkVisualControls(child, (control, pointer) => {
      const pathInForm = `Resource.children[${childIndex}]${pointer.slice(1)}`;
      const type = controlType(control);
      if (!type) return;
      controls.push({ control, path: pathInForm });
      controlTypes.set(type, (controlTypes.get(type) || 0) + 1);
      if (["submit-button"].includes(type)) submitControls.push({ control, path: pathInForm });
      if (["text", "number", "boolean", "date", "file", "metadata", "user", "costcenter", "groupselect", "location", "lookup", "img", "total"].includes(type)) generalControls.set(type, (generalControls.get(type) || 0) + 1);
      if (["submit-button"].includes(type)) advancedControls.set(type, (advancedControls.get(type) || 0) + 1);
      if (!EXPORT_PROVEN_VISUAL_TYPES.has(type) && !EXPORT_PROVEN_PUBLIC_FIELD_TYPES.has(type)) {
        addFinding(findings, "warning", "PUBLIC_FORM_CONTROL_TYPE_UNKNOWN", "Public form uses a control type that is not yet export-proven for public forms.", { list: listName, publicForm: publicForm.Name || null, type, path: pathInForm });
      }
      const controlId = safeString(control.id);
      if (controlId) {
        if (seenControlIds.has(controlId)) addFinding(findings, "error", "PUBLIC_FORM_CONTROL_ID_DUPLICATE", "Public form control IDs must be unique within a form.", { list: listName, publicForm: publicForm.Name || null, firstPath: seenControlIds.get(controlId), path: pathInForm });
        else seenControlIds.set(controlId, pathInForm);
      }

      const binding = bindingFor(control);
      const field = control.fieldID ? maps.byId.get(String(control.fieldID)) : binding ? maps.byName.get(binding) || maps.byInternalName.get(binding) : null;
      if (isLikelyFieldControl(control, field)) {
        if (!field && !(control.attrs && control.attrs.list_field === true) && type !== "total") {
          missingBindings.push({ path: pathInForm, binding: binding || null, type, label: control.label || null });
          addFinding(findings, "error", "PUBLIC_FORM_FIELD_BINDING_NOT_FOUND", "Public form list-bound control does not resolve to a field in the same data list.", { list: listName, publicForm: publicForm.Name || null, binding: binding || null, type, path: pathInForm });
        } else if (field) {
          listBoundControls.push({ control, field, path: pathInForm });
          fieldTypes.set(safeString(field.Type), (fieldTypes.get(safeString(field.Type)) || 0) + 1);
          const fieldName = safeString(field.FieldName);
          if (DEFAULT_FIELDS_BLOCKED_IN_PUBLIC_FORMS.has(fieldName)) {
            addFinding(findings, "error", "PUBLIC_FORM_DEFAULT_FIELD_NOT_ALLOWED", "Default/system list fields such as Id/Created/Modified fields should not be used in public forms. Title is the export-proven primary-field exception.", { list: listName, publicForm: publicForm.Name || null, fieldName, path: pathInForm });
          }
          if (UI_REFERENCE_UNAVAILABLE_FIELD_TYPES.has(safeString(field.Type))) {
            addFinding(findings, "error", "PUBLIC_FORM_FIELD_TYPE_NOT_ALLOWED", "This field type is UI-reference-backed as unavailable for Data List Public Forms.", { list: listName, publicForm: publicForm.Name || null, fieldType: field.Type, path: pathInForm });
          }
          if (!EXPORT_PROVEN_PUBLIC_FIELD_TYPES.has(safeString(field.Type))) {
            addFinding(findings, "warning", "PUBLIC_FORM_FIELD_TYPE_UNPROVEN", "Public form uses a field type that is not in the export-proven allowed set from Data Lists (4).yap.", { list: listName, publicForm: publicForm.Name || null, fieldType: field.Type, path: pathInForm });
          }
        }
      }
    });
  });

  if (!submitControls.length) addFinding(findings, "warning", "PUBLIC_FORM_SUBMIT_CONTROL_MISSING", "Public forms intended for anonymous collection should include an export-proven submit control.", { list: listName, publicForm: publicForm.Name || null });

  return {
    name: publicForm.Name || null,
    publicFormIdPlaceholder: "__PUBLIC_FORM_ID__",
    type: publicForm.Type ?? null,
    publicShareMetadata: publicForm.Ext || publicForm.ExpiredTip ? "present-redacted" : "not-present-in-entry",
    resourcePath: `Data.Childs[].PublicForms[${publicFormIndex}].Resource`,
    resourceKeys: Object.keys(resource || {}).sort(),
    pageType: resource.pagetype ?? null,
    version: resource.ver ?? null,
    pageCount: asArray(resource.children).length,
    visualControlsCount: controls.length,
    listBoundControlsCount: listBoundControls.length,
    submitControlsCount: submitControls.length,
    missingBindingCount: missingBindings.length,
    controlTypes: Object.fromEntries([...controlTypes.entries()].sort()),
    generalControlsFound: Object.fromEntries([...generalControls.entries()].sort()),
    advancedControlsFound: Object.fromEntries([...advancedControls.entries()].sort()),
    fieldTypesRepresented: Object.fromEntries([...fieldTypes.entries()].sort()),
    listBoundControlSummaries: listBoundControls.slice(0, 20).map(({ control, field }) => ({
      controlType: control.type || null,
      binding: control.binding || null,
      labelPlaceholder: "__LABEL_REDACTED__",
      field: {
        FieldName: field.FieldName || null,
        FieldID: "__FIELD_ID__",
        Type: field.Type || null,
        FieldType: field.FieldType || null,
        IsSystem: field.IsSystem === true,
      },
      attrsKeys: Object.keys(control.attrs || {}).sort(),
      proofLevel: "export-proven; IDs and labels redacted",
    })),
    proofLevel: "export-proven",
  };
}

function buildReport(decoded, targetNames) {
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  const targetSet = new Set(targetNames);
  const targetLists = allLists.filter((item, index) => targetSet.has(listTitle(item, index)));
  const findings = [];

  for (const name of targetNames) {
    if (!targetLists.some((item, index) => listTitle(item, allLists.indexOf(item) === -1 ? index : allLists.indexOf(item)) === name)) {
      addFinding(findings, "error", "TARGET_LIST_NOT_FOUND", "Requested target data list was not found.", { list: name });
    }
  }

  const lists = targetLists.map((item) => {
    const listName = listTitle(item, allLists.indexOf(item));
    const fields = asArray(item.Defs);
    const publicForms = asArray(item.PublicForms);
    if (!publicForms.length) addFinding(findings, "error", "PUBLIC_FORM_NOT_FOUND", "Target data list has no PublicForms[] entries.", { list: listName });
    const publicFormReports = publicForms.map((publicForm, index) => inspectPublicForm(publicForm, fields, listName, index, findings));
    const representedFieldTypes = new Set(publicFormReports.flatMap((form) => Object.keys(form.fieldTypesRepresented || {})));
    const defTypes = new Set(fields.map((field) => safeString(field.Type)).filter(Boolean));
    return {
      list: listName,
      listIdPlaceholder: "__LIST_ID__",
      resourceType: item.ListModel?.Type ?? null,
      fieldCount: fields.length,
      customFieldCount: fields.filter((field) => field.IsSystem !== true).length,
      systemFieldCount: fields.filter((field) => field.IsSystem === true).length,
      publicFormCount: publicForms.length,
      publicFormNames: publicFormReports.map((form) => form.name),
      publicForms: publicFormReports,
      visualControlsCount: publicFormReports.reduce((sum, form) => sum + form.visualControlsCount, 0),
      listBoundControlsCount: publicFormReports.reduce((sum, form) => sum + form.listBoundControlsCount, 0),
      submitControlsCount: publicFormReports.reduce((sum, form) => sum + form.submitControlsCount, 0),
      allowedFieldTypesRepresented: [...representedFieldTypes].sort(),
      fieldTypesDefinedButNotUsedInPublicForms: [...defTypes].filter((type) => !representedFieldTypes.has(type)).sort(),
      defaultFieldRestriction: "Title appears as an export-proven primary-field control; Id/Created/Modified default fields remain UI-reference-backed as unavailable.",
      proofLevel: "export-proven",
    };
  });

  return {
    input: path.basename(process.argv[2] || ""),
    sourcePath: path.resolve(process.argv[2] || ""),
    proofBoundary: {
      dataListPublicForms: "export-proven for the inspected Data Lists (4).yap target data lists",
      screenshots: "UI-reference-backed only; screenshots are not committed",
      anonymousSubmitAndPublicUrlRuntime: "not runtime-proven",
      documentLibraryApplicability: "unproven unless a Type 16 document library export proves public forms",
      formReport: "not involved",
    },
    uiReferenceControls: {
      general: UI_REFERENCE_GENERAL_CONTROLS,
      advanced: UI_REFERENCE_ADVANCED_CONTROLS,
    },
    packageSummary: {
      title: decoded.wrapper?.title || null,
      appResourceCount: allLists.length,
      targetListCount: lists.length,
      targetLists: lists.map((list) => list.list),
      publicForms: lists.reduce((sum, list) => sum + list.publicFormCount, 0),
      visualControlsInspected: lists.reduce((sum, list) => sum + list.visualControlsCount, 0),
      listBoundControlsInspected: lists.reduce((sum, list) => sum + list.listBoundControlsCount, 0),
      submitControlsFound: lists.reduce((sum, list) => sum + list.submitControlsCount, 0),
      fieldTypesRepresented: [...new Set(lists.flatMap((list) => list.allowedFieldTypesRepresented))].sort(),
      controlTypesFound: [...new Set(lists.flatMap((list) => list.publicForms.flatMap((form) => Object.keys(form.controlTypes || {}))))].sort(),
    },
    lists,
    findings,
    errors: findings.filter((finding) => finding.level === "error").length,
    warnings: findings.filter((finding) => finding.level === "warning").length,
  };
}

function firstPublicFormControl(decoded, predicate) {
  const allLists = [decoded.data?.Item, ...asArray(decoded.data?.Childs)].filter(Boolean);
  for (const item of allLists) {
    const fields = asArray(item.Defs);
    const maps = listFieldMap(fields);
    for (const publicForm of asArray(item.PublicForms)) {
      let resource = null;
      try {
        resource = typeof publicForm.Resource === "string" ? JSON.parse(publicForm.Resource) : publicForm.Resource;
      } catch {
        continue;
      }
      let result = null;
      asArray(resource?.children).forEach((child, childIndex) => {
        walkVisualControls(child, (control, pointer) => {
          if (result) return;
          const binding = bindingFor(control);
          const field = control.fieldID ? maps.byId.get(String(control.fieldID)) : binding ? maps.byName.get(binding) || maps.byInternalName.get(binding) : null;
          if (predicate(control, field, publicForm, resource, item)) {
            result = {
              item,
              publicForm,
              resource,
              control,
              field,
              path: `Data.Childs[].PublicForms[].Resource.children[${childIndex}]${pointer.slice(1)}`,
            };
          }
        });
      });
      if (result) return result;
    }
  }
  return null;
}

function sanitizeValue(value, key = "") {
  if (Array.isArray(value)) return value.map((item, index) => sanitizeValue(item, `${key}[${index}]`));
  if (isObject(value)) {
    const out = {};
    for (const [childKey, child] of Object.entries(value)) out[childKey] = sanitizeValue(child, childKey);
    return out;
  }
  if (/url|href|link|share|public/i.test(key) && typeof value === "string" && value.trim()) return "https://share.yeeflow.com/f/<REDACTED_PUBLIC_FORM_CODE>";
  if (/id|appid|listid|tenant|user|by|category|parent|ref|field|control_event_rule|uuid/i.test(key)) return value === undefined || value === null || value === "" ? value : "__ID_REDACTED__";
  if (/name|title|label|value|placeholder|text|prefix|suffix/i.test(key) && typeof value === "string" && value.trim()) return `__${key.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_REDACTED__`;
  return value;
}

function sanitizeControl(found) {
  return {
    exportPath: found.path,
    control: {
      id: "__CONTROL_ID__",
      type: found.control.type || null,
      binding: found.control.binding || null,
      fieldID: found.control.fieldID ? "__FIELD_ID__" : null,
      label: "__LABEL_REDACTED__",
      attrs: sanitizeValue(found.control.attrs || {}),
    },
    field: found.field ? {
      FieldName: found.field.FieldName || null,
      FieldID: "__FIELD_ID__",
      InternalName: "__INTERNAL_NAME_REDACTED__",
      Type: found.field.Type || null,
      FieldType: found.field.FieldType || null,
      IsSystem: found.field.IsSystem === true,
    } : null,
    proof: "export-proven; private values redacted",
  };
}

function writeNormalizedRefs(report, decoded, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const refs = [
    ["public-form-list-entry.normalized.json", () => {
      const list = report.lists.find((entry) => entry.publicForms.length);
      const form = list?.publicForms[0];
      return form && {
        proof: "export-proven from Data Lists (4).yap; IDs and share metadata redacted",
        exportPath: "Data.Childs[].PublicForms[]",
        normalized: {
          ListID: "__LIST_ID__",
          ID: "__PUBLIC_FORM_ID__",
          Type: form.type,
          Name: "__PUBLIC_FORM_NAME_REDACTED__",
          Desc: null,
          Ext: "__SHARE_METADATA_REDACTED_OR_NULL__",
          ExpiredTip: "__EXPIRED_TIP_REDACTED_OR_NULL__",
          RefId: "__LIST_ID__",
          Resource: "__PUBLIC_FORM_RESOURCE_JSON_STRING__",
        },
      };
    }],
    ["public-form-resource.normalized.json", () => {
      const found = firstPublicFormControl(decoded, () => true);
      return found && {
        proof: "export-proven from Data Lists (4).yap; private values redacted",
        exportPath: "Data.Childs[].PublicForms[].Resource",
        normalized: {
          pagetype: found.resource.pagetype,
          ver: found.resource.ver,
          attrsKeys: Object.keys(found.resource.attrs || {}).sort(),
          tempVarsShape: Array.isArray(found.resource.tempVars) ? "array" : typeof found.resource.tempVars,
          childrenShape: "array",
        },
      };
    }],
    ["public-form-page-layout.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control) => control.type === "flex_grid");
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-list-bound-control.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control, field) => Boolean(field && field.IsSystem !== true));
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-submit-control.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control) => control.type === "submit-button");
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-general-control-grid.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control) => control.type === "flex_grid");
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-general-control-text.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control) => control.type === "text");
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-advanced-control-submit.normalized.json", () => {
      const found = firstPublicFormControl(decoded, (control) => control.type === "submit-button");
      return found && { proof: "export-proven from Data Lists (4).yap; private values redacted", normalized: sanitizeControl(found) };
    }],
    ["public-form-share-url-redacted.normalized.json", () => ({
      proof: "redaction rule for public URL/share metadata; no real public share URL is committed",
      normalized: {
        shareUrl: "https://share.yeeflow.com/f/<REDACTED_PUBLIC_FORM_CODE>",
        status: "__PUBLIC_FORM_STATUS_REDACTED_OR_NULL__",
      },
    })],
    ["public-form-disallowed-default-field-ui-reference.normalized.json", () => ({
      proof: "UI-reference-backed from user screenshots; Title is a primary-field exception observed in export",
      disallowedDefaultFields: ["Id", "Created By", "Created Time", "Modified By", "Modified Time"],
      generationRule: "Do not generate default/system fields into Data List Public Forms except the export-proven primary Title field when needed.",
    })],
    ["public-form-allowed-field-types-summary.normalized.json", () => ({
      proof: "export-proven from Data Lists (4).yap target public forms",
      allowedFieldTypes: [...EXPORT_PROVEN_PUBLIC_FIELD_TYPES].sort(),
    })],
    ["public-form-disallowed-field-types-summary.normalized.json", () => ({
      proof: "UI-reference-backed from user screenshots unless a future export proves support",
      disallowedOrUnavailableFieldTypes: [...UI_REFERENCE_UNAVAILABLE_FIELD_TYPES].sort(),
    })],
  ];

  for (const [fileName, factory] of refs) {
    const value = factory();
    if (!value) continue;
    fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
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
