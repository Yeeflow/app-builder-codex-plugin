import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertUniqueDocumentLibraryResourceIds,
  materializeDocumentLibraryNativeFields,
  requireNumericId,
  validateDocumentLibraryNativeFields,
} from "./document-library-materializer.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TEMPLATE_PATHS = Object.freeze({
  newEdit: resolve(ROOT, "docs/reference/data-list-form-layout-new-edit.template.json"),
  view: resolve(ROOT, "docs/reference/data-list-form-layout-view-item.template.json"),
});
const CONTROL_TO_STORAGE = Object.freeze({
  input: "Text",
  textarea: "Text",
  "identity-picker": "Text",
  radio: "Text",
  datepicker: "Datetime",
  input_number: "Decimal",
  switch: "Bit",
});

export function materializeDocumentLibraryLiveBundle(spec = {}) {
  const title = required(spec.title, "DOCUMENT_LIBRARY_LIVE_TITLE_REQUIRED", "title");
  const description = String(spec.description ?? "").trim();
  const listId = requireNumericId(spec.ids?.listId, "ids.listId");
  const nativeFieldIds = requiredArray(spec.ids?.nativeFieldIds, 7, "DOCUMENT_LIBRARY_LIVE_NATIVE_FIELD_ID_COUNT_INVALID", "ids.nativeFieldIds");
  const customSpecs = Array.isArray(spec.fields) ? spec.fields : [];
  const customFieldIds = requiredArray(spec.ids?.customFieldIds, customSpecs.length, "DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_ID_COUNT_INVALID", "ids.customFieldIds");
  const layoutIds = requiredArray(spec.ids?.layoutIds, 3, "DOCUMENT_LIBRARY_LIVE_LAYOUT_ID_COUNT_INVALID", "ids.layoutIds");
  const choiceOptionIds = Array.isArray(spec.choiceOptionIds) ? spec.choiceOptionIds.map(String) : [];
  const controlIds = Array.isArray(spec.controlIds) ? spec.controlIds.map(String) : [];
  const minimumControlIds = (2 + customSpecs.length) * 2;
  if (controlIds.length < minimumControlIds || controlIds.some((value) => !isGuid(value))) {
    fail("DOCUMENT_LIBRARY_LIVE_CONTROL_IDS_INVALID", `At least ${minimumControlIds} MCP-issued GUID control IDs are required.`);
  }

  assertUniqueDocumentLibraryResourceIds([
    { id: listId, property: "ids.listId" },
    ...nativeFieldIds.map((id, index) => ({ id, property: `ids.nativeFieldIds[${index}]` })),
    ...customFieldIds.map((id, index) => ({ id, property: `ids.customFieldIds[${index}]` })),
    ...layoutIds.map((id, index) => ({ id, property: `ids.layoutIds[${index}]` })),
  ]);

  const nativeFields = materializeDocumentLibraryNativeFields({ listId, fieldIds: nativeFieldIds });
  const customFields = materializeCustomFields({ listId, specs: customSpecs, fieldIds: customFieldIds, choiceOptionIds });
  const allFields = [...nativeFields, ...customFields];
  assertUniqueFieldIdentity(allFields);
  validateDocumentLibraryNativeFields(allFields, { listId });

  const baselineLayouts = buildLayouts({ listId, title, fields: nativeFields, layoutIds, controlIds });
  const finalLayouts = buildLayouts({ listId, title, fields: allFields, layoutIds, controlIds });
  const list = {
    ListID: listId,
    Title: title,
    Description: description,
    Status: 1,
    IsItemPerm: Boolean(spec.isItemPerm),
    IsVerRecord: Boolean(spec.isVerRecord),
    HasComment: Boolean(spec.hasComment),
    IconUrl: "",
    TableCode: "flowcraft",
    Ext1: "",
    Ext2: "",
    Ext3: "",
    Type: 16,
    Flags: 1,
    LayoutView: JSON.stringify({ add: layoutIds[1], edit: layoutIds[1], view: layoutIds[2] }),
    Items: {},
  };
  const envelope = (fields, layouts) => ({
    List: { ...list },
    Fields: fields,
    Layouts: layouts,
    RemindRules: [],
    FlowMappings: [],
    Workflows: [],
  });
  const baselineDetail = envelope(nativeFields, baselineLayouts);
  const finalDetail = envelope(allFields, finalLayouts);
  validateDocumentLibraryLiveDetail(finalDetail, { expectedCustomFields: customFields });
  return {
    bundle: { baselineDetail, finalDetail, customFields },
    validation: {
      status: "pass",
      resourceIdsUnique: true,
      nativeFieldContract: "passed",
      customFieldCount: customFields.length,
      twoPhaseCreateRequired: customFields.length > 0,
    },
    proofBoundary: {
      localMaterialization: "passed",
      mcpBaselineSave: "not-run",
      mcpCustomizationSave: "not-run",
      mcpReadback: "not-run",
      designerOpen: "not-run",
      documentUpload: "not-run",
      securityEnforcement: "not-run",
    },
  };
}

export function validateDocumentLibraryLiveDetail(detail, { expectedCustomFields = [] } = {}) {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) fail("DOCUMENT_LIBRARY_LIVE_DETAIL_INVALID", "Document component detail is required.");
  if (Number(detail.List?.Type) !== 16) fail("DOCUMENT_LIBRARY_LIVE_TYPE_INVALID", "Document Library List.Type must be 16.");
  for (const property of ["Fields", "Layouts", "RemindRules", "FlowMappings", "Workflows"]) {
    if (!Array.isArray(detail[property])) fail("DOCUMENT_LIBRARY_LIVE_ARRAY_REQUIRED", `${property} must be an array.`, { property });
  }
  const listId = String(detail.List.ListID ?? "");
  validateDocumentLibraryNativeFields(detail.Fields, { listId });
  assertUniqueFieldIdentity(detail.Fields);
  assertUniqueDocumentLibraryResourceIds([
    { id: listId, property: "List.ListID" },
    ...detail.Fields.map((field, index) => ({ id: field.FieldID, property: `Fields[${index}].FieldID` })),
    ...detail.Layouts.map((layout, index) => ({ id: layout.LayoutID, property: `Layouts[${index}].LayoutID` })),
  ]);
  const assignments = parseJson(detail.List.LayoutView, "DOCUMENT_LIBRARY_LIVE_LAYOUT_ASSIGNMENTS_INVALID");
  const layoutIds = new Set(detail.Layouts.map((layout) => String(layout.LayoutID)));
  for (const operation of ["add", "edit", "view"]) {
    if (!layoutIds.has(String(assignments[operation] ?? ""))) fail("DOCUMENT_LIBRARY_LIVE_LAYOUT_ASSIGNMENT_UNRESOLVED", `${operation} must resolve to a Type 1 layout.`, { operation });
  }
  for (const expected of expectedCustomFields) {
    const match = detail.Fields.filter((field) => field.FieldName === expected.FieldName && field.FieldID === expected.FieldID);
    if (match.length !== 1) fail("DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_UNRESOLVED", "Expected custom field is missing or ambiguous.", { fieldName: expected.FieldName });
  }
  const customNames = expectedCustomFields.map((field) => field.FieldName);
  for (const layout of detail.Layouts.filter((entry) => Number(entry.Type) === 1)) {
    const resource = parseJson(layout.LayoutView, "DOCUMENT_LIBRARY_LIVE_FORM_LAYOUT_JSON_INVALID");
    const bindings = collectValues(resource, "binding");
    for (const fieldName of customNames) if (!bindings.includes(fieldName)) fail("DOCUMENT_LIBRARY_LIVE_FORM_BINDING_MISSING", "Custom field is missing from a Document Library form.", { layout: layout.Title, fieldName });
  }
  return { status: "pass", fieldCount: detail.Fields.length, layoutCount: detail.Layouts.length };
}

function materializeCustomFields({ listId, specs, fieldIds, choiceOptionIds }) {
  const usedNames = new Set(["Title", "Bigint1", "Text1", "Bigint2", "Text2", "Text3", "Text4"]);
  const nextIndex = { Text: 5, Datetime: 1, Decimal: 1, Bit: 1 };
  let choiceIdCursor = 0;
  return specs.map((spec, index) => {
    const displayName = required(spec?.displayName, "DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_DISPLAY_NAME_REQUIRED", `fields[${index}].displayName`);
    const type = required(spec?.type, "DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_TYPE_REQUIRED", `fields[${index}].type`);
    const fieldType = CONTROL_TO_STORAGE[type];
    if (!fieldType) fail("DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_TYPE_UNSUPPORTED", `Unsupported custom field type: ${type}.`, { index, type });
    let fieldName = String(spec?.fieldName ?? "").trim();
    let fieldIndex = Number(spec?.fieldIndex);
    if (!fieldName) {
      fieldIndex = nextIndex[fieldType];
      fieldName = `${fieldType}${fieldIndex}`;
    }
    const match = fieldName.match(new RegExp(`^${fieldType}(\\d+)$`, "u"));
    if (!match || Number(match[1]) !== fieldIndex || fieldIndex < 1) fail("DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_STORAGE_MISMATCH", "FieldName, FieldType, and FieldIndex must agree.", { index, fieldName, fieldType, fieldIndex });
    if (usedNames.has(fieldName)) fail("DOCUMENT_LIBRARY_LIVE_DUPLICATE_FIELD_NAME", "Custom FieldName collides with a native or prior field.", { fieldName });
    usedNames.add(fieldName);
    nextIndex[fieldType] = Math.max(nextIndex[fieldType], fieldIndex + 1);
    const internalName = String(spec?.internalName || displayName.replace(/[^A-Za-z0-9_]+/g, "_")).replace(/^_+|_+$/g, "");
    if (!/^[A-Za-z0-9_]{1,255}$/u.test(internalName)) fail("DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_INTERNAL_NAME_INVALID", "InternalName must contain only letters, digits, and underscores.", { index });
    const rules = { ...(spec?.rules && typeof spec.rules === "object" && !Array.isArray(spec.rules) ? spec.rules : {}) };
    if (type === "radio") {
      const choices = Array.isArray(spec.choices) ? spec.choices.map((value) => String(value).trim()).filter(Boolean) : [];
      if (!choices.length) fail("DOCUMENT_LIBRARY_LIVE_CHOICE_VALUES_REQUIRED", "Radio fields require non-empty choices.", { fieldName });
      const ids = choiceOptionIds.slice(choiceIdCursor, choiceIdCursor + choices.length);
      if (ids.length !== choices.length || ids.some((value) => !isGuid(value))) fail("DOCUMENT_LIBRARY_LIVE_CHOICE_IDS_INVALID", "Every choice requires an MCP-issued GUID.", { fieldName });
      choiceIdCursor += choices.length;
      rules.choices = choices;
      rules.color_choices = choices.map((value, choiceIndex) => ({ value, key: ids[choiceIndex] }));
    }
    return {
      ListID: listId,
      FieldID: requireNumericId(fieldIds[index], `ids.customFieldIds[${index}]`),
      FieldName: fieldName,
      FieldType: fieldType,
      FieldIndex: fieldIndex,
      DisplayName: displayName,
      InternalName: internalName,
      Type: type,
      Status: 1,
      Category: 0,
      DefaultValue: String(spec?.defaultValue ?? (fieldType === "Bit" ? "0" : "")),
      Rules: JSON.stringify(rules),
      IsSort: false,
      IsSystem: false,
      IsUnique: Boolean(spec?.isUnique),
      IsIndex: false,
      Ext1: "",
      Ext2: "",
      Ext3: "",
    };
  });
}

function buildLayouts({ listId, title, fields, layoutIds, controlIds }) {
  const formFields = fields.filter((field) => ["Title", "Text4"].includes(field.FieldName) || !isNativeSupportField(field.FieldName));
  return [
    {
      ListID: listId,
      LayoutID: layoutIds[0],
      Type: 0,
      Title: `All ${title}`,
      LayoutView: JSON.stringify(buildDefaultView(fields)),
      Ext1: "",
      Ext2: "",
      Ext3: "",
      IsDefault: true,
      IsItemPerm: false,
      LayoutInResources: [],
    },
    buildFormLayout({ listId, title, fields: formFields, layoutId: layoutIds[1], kind: "newEdit", controlIds: controlIds.slice(0, formFields.length) }),
    buildFormLayout({ listId, title, fields: formFields, layoutId: layoutIds[2], kind: "view", controlIds: controlIds.slice(formFields.length, formFields.length * 2) }),
  ];
}

function buildDefaultView(fields) {
  const visible = fields.filter((field) => ["Title", "Bigint2"].includes(field.FieldName) || !isNativeSupportField(field.FieldName));
  return {
    layout: visible.map((field, index) => ({ FieldID: field.FieldID, FieldName: field.FieldName, DisplayName: field.DisplayName, Type: field.Type, Order: index, Mobile: index === 0 ? 2 : 0, Show: true, Rules: parseJson(field.Rules, "DOCUMENT_LIBRARY_LIVE_FIELD_RULES_INVALID") })),
    filter: [],
    query: [
      ...fields.map((field) => ({ FieldID: field.FieldID, FieldName: field.FieldName, field: field.FieldName, ID: field.FieldID, Name: field.DisplayName, Type: field.Type, Rules: field.Rules, InternalName: field.InternalName })),
      { FieldName: "ListDataID", field: "ListDataID" },
      { FieldName: "CreatedBy", field: "CreatedBy" },
      { FieldName: "ModifiedBy", field: "ModifiedBy" },
      { FieldName: "Created", field: "Created" },
      { FieldName: "Modified", field: "Modified" },
    ],
    sort: [],
    rowColor: [],
  };
}

function buildFormLayout({ listId, title, fields, layoutId, kind, controlIds }) {
  const template = JSON.parse(fs.readFileSync(TEMPLATE_PATHS[kind], "utf8"));
  const resource = JSON.parse(JSON.stringify(template.templateResource));
  const isView = kind === "view";
  const formTitle = isView ? `${title} View Item` : `${title} New/Edit Form`;
  resource.title = formTitle;
  resource.dataListFormLayoutTemplateId = isView ? "data_list_form_layout_view_item_v1_1" : "data_list_form_layout_new_edit_v1_1";
  resource.derivedFromDataListFormLayoutTemplate = resource.dataListFormLayoutTemplateId;
  setText(resource, "section_title_text", isView ? `${title} Details` : title);
  setText(resource, "section_title_description", isView ? `Review ${title} metadata and document details.` : `Upload and maintain ${title}.`);
  setText(resource, "page_title_text", `${title} Details`);
  setText(resource, "page_title_description", `Review ${title} metadata and document details.`);
  const slot = findByNvLabel(resource, "section_content_area");
  if (!slot) fail("DOCUMENT_LIBRARY_LIVE_FORM_SLOT_MISSING", "The selected form template has no section_content_area slot.", { kind });
  slot.children = [{
    id: `document_library_${kind}_fields_wrapper`,
    type: "flex_grid",
    label: `${title} fields`,
    displayLabel: [null, false],
    attrs: { ver: 1, canFold: true, columns: { 1: { list: [{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } }, 3: { list: [{ value: 1, unit: "fr" }], last: { value: 1, unit: "fr" } } }, rows: { 1: { list: [{ unit: "auto" }], last: { unit: "auto" } } }, cgap: { 1: 24 }, cgapU: { 1: "px" }, rgap: [null, 12], rgapU: [null, "px"] },
    children: fields.map((field, index) => buildFieldControl({ field, listId, title, isView, controlId: controlIds[index] })),
    parentCol: 1,
    nv_label: "form_grid_fields_wrapper",
    dataListFormFieldsTemplateId: "data_list_form_fields_grid_v1_1",
    derivedFromDataListFormFieldsTemplate: "data_list_form_fields_grid_v1_1",
  }];
  return {
    ListID: listId,
    LayoutID: layoutId,
    Type: 1,
    Title: formTitle,
    LayoutView: JSON.stringify(resource),
    Ext1: "",
    Ext2: "",
    Ext3: "",
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [],
  };
}

function buildFieldControl({ field, listId, title, isView, controlId }) {
  const type = isView ? (field.Type === "file-upload" ? "dynamic-file" : "dynamic-field") : field.Type;
  return {
    type,
    id: controlId,
    name: field.DisplayName,
    title: field.DisplayName,
    label: field.DisplayName,
    nv_label: `field_${field.FieldName.toLowerCase()}`,
    binding: field.FieldName,
    fieldID: field.FieldID,
    displayLabel: [null, true],
    attrs: {
      common: { margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] },
      data: { list: { AppID: 41, ListID: listId, Type: 1, Title: title }, field: field.FieldName, fieldName: field.FieldName, fieldId: field.FieldID },
    },
  };
}

function assertUniqueFieldIdentity(fields) {
  for (const property of ["FieldID", "FieldName", "InternalName", "DisplayName"]) {
    const seen = new Set();
    for (const field of fields) {
      const value = String(field[property] ?? "").trim().toLowerCase();
      if (!value || seen.has(value)) fail(`DOCUMENT_LIBRARY_LIVE_DUPLICATE_${property.toUpperCase()}`, `${property} must be unique.`, { property, value });
      seen.add(value);
    }
  }
}

function isNativeSupportField(fieldName) {
  return ["Bigint1", "Text1", "Bigint2", "Text2", "Text3"].includes(fieldName);
}

function collectValues(value, property, out = []) {
  if (Array.isArray(value)) value.forEach((entry) => collectValues(entry, property, out));
  else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) { if (key === property) out.push(entry); collectValues(entry, property, out); }
  return out;
}

function findByNvLabel(value, label) {
  if (!value || typeof value !== "object") return null;
  if (value.nv_label === label) return value;
  for (const entry of Object.values(value)) { const match = findByNvLabel(entry, label); if (match) return match; }
  return null;
}

function setText(value, label, text) {
  const node = findByNvLabel(value, label);
  if (!node) return;
  node.name = text;
  node.title = text;
  if (node.attrs?.headc?.title) node.attrs.headc.title.value = text;
}

function parseJson(value, code) {
  try { return typeof value === "string" ? JSON.parse(value) : value; } catch { fail(code, "Expected valid JSON string."); }
}

function required(value, code, property) {
  const normalized = String(value ?? "").trim();
  if (!normalized) fail(code, `${property} is required.`, { property });
  return normalized;
}

function requiredArray(value, length, code, property) {
  if (!Array.isArray(value) || value.length !== length) fail(code, `${property} must contain exactly ${length} values.`, { property, expected: length, actual: Array.isArray(value) ? value.length : null });
  return value.map(String);
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(String(value ?? ""));
}

function fail(code, message, detail = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.detail = detail;
  throw error;
}
