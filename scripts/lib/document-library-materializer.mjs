const NUMERIC_ID = /^\d+$/u;

export const DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS = Object.freeze([
  Object.freeze({ FieldName: "Title", FieldType: "Text", FieldIndex: 0, DisplayName: "Name", Type: "input", Status: 1, IsSystem: true, IsIndex: true, Rules: { displayLabel: true, isLibrary: true } }),
  Object.freeze({ FieldName: "Bigint1", FieldType: "Bigint", FieldIndex: 1, DisplayName: "ParentID", Type: "input_number", Status: 127, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, isNotInListFiles: true } }),
  Object.freeze({ FieldName: "Text1", FieldType: "Text", FieldIndex: 1, DisplayName: "Type", Type: "input", Status: 119, IsSystem: false, IsIndex: false, Rules: { displayLabel: true } }),
  Object.freeze({ FieldName: "Bigint2", FieldType: "Bigint", FieldIndex: 2, DisplayName: "FileSize", Type: "input_number", Status: 99, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, readonly: true } }),
  Object.freeze({ FieldName: "Text2", FieldType: "Text", FieldIndex: 2, DisplayName: "Extension", Type: "input", Status: 99, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, readonly: true } }),
  Object.freeze({ FieldName: "Text3", FieldType: "Text", FieldIndex: 3, DisplayName: "UniqueName", Type: "input", Status: 319, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, isNotInListFiles: true } }),
  Object.freeze({ FieldName: "Text4", FieldType: "Text", FieldIndex: 4, DisplayName: "Upload File", Type: "file-upload", Status: 57, IsSystem: false, IsIndex: false, Rules: { displayLabel: true, required: true, isLabrary: true, PROP_MAXSIZE: 2147483648 } }),
]);

export function requireNumericId(value, property) {
  const id = String(value ?? "").trim();
  if (!NUMERIC_ID.test(id)) fail("DOCUMENT_LIBRARY_LIVE_ID_INVALID", `${property} must be an MCP/API-issued numeric string.`, { property });
  return id;
}

export function assertUniqueDocumentLibraryResourceIds(entries) {
  const seen = new Map();
  for (const entry of entries || []) {
    const id = requireNumericId(entry?.id, entry?.property || "resourceId");
    if (seen.has(id)) {
      fail("DOCUMENT_LIBRARY_LIVE_DUPLICATE_RESOURCE_ID", "Document Library resource IDs must be globally unique before MCP save.", {
        id,
        firstProperty: seen.get(id),
        duplicateProperty: entry?.property || "resourceId",
      });
    }
    seen.set(id, entry?.property || "resourceId");
  }
  return true;
}

export function materializeDocumentLibraryNativeFields({ listId, fieldIds } = {}) {
  const normalizedListId = requireNumericId(listId, "listId");
  if (!Array.isArray(fieldIds) || fieldIds.length !== DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS.length) {
    fail("DOCUMENT_LIBRARY_LIVE_NATIVE_FIELD_ID_COUNT_INVALID", `Exactly ${DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS.length} native FieldIDs are required.`);
  }
  assertUniqueDocumentLibraryResourceIds(fieldIds.map((id, index) => ({ id, property: `nativeFieldIds[${index}]` })));
  return DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS.map((spec, index) => ({
    ListID: normalizedListId,
    FieldID: requireNumericId(fieldIds[index], `nativeFieldIds[${index}]`),
    FieldName: spec.FieldName,
    FieldType: spec.FieldType,
    FieldIndex: spec.FieldIndex,
    DisplayName: spec.DisplayName,
    InternalName: spec.FieldName,
    Type: spec.Type,
    Status: spec.Status,
    Category: 0,
    DefaultValue: "",
    Rules: JSON.stringify(spec.Rules),
    IsSort: false,
    IsSystem: spec.IsSystem,
    IsUnique: false,
    IsIndex: spec.IsIndex,
    Ext1: "",
    Ext2: "",
    Ext3: "",
  }));
}

export function validateDocumentLibraryNativeFields(fields, { listId = "" } = {}) {
  if (!Array.isArray(fields)) fail("DOCUMENT_LIBRARY_LIVE_FIELDS_ARRAY_REQUIRED", "Fields must be an array.");
  const findings = [];
  for (const spec of DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS) {
    const matches = fields.filter((field) => field?.FieldName === spec.FieldName);
    if (matches.length !== 1) {
      findings.push({ code: "DOCUMENT_LIBRARY_LIVE_NATIVE_FIELD_CARDINALITY_INVALID", fieldName: spec.FieldName, matches: matches.length });
      continue;
    }
    const field = matches[0];
    let rules = null;
    try { rules = JSON.parse(field.Rules); } catch { /* finding below */ }
    if (String(field.ListID) !== String(listId)
      || field.FieldType !== spec.FieldType
      || Number(field.FieldIndex) !== spec.FieldIndex
      || field.Type !== spec.Type
      || Number(field.Status) !== spec.Status
      || Boolean(field.IsSystem) !== spec.IsSystem
      || Boolean(field.IsIndex) !== spec.IsIndex
      || JSON.stringify(rules) !== JSON.stringify(spec.Rules)) {
      findings.push({ code: "DOCUMENT_LIBRARY_LIVE_NATIVE_FIELD_METADATA_INVALID", fieldName: spec.FieldName });
    }
  }
  if (findings.length) fail("DOCUMENT_LIBRARY_LIVE_NATIVE_FIELD_VALIDATION_FAILED", "Native Document Library fields failed the Type 16 runtime contract.", { findings });
  return { status: "pass", nativeFieldCount: DOCUMENT_LIBRARY_NATIVE_FIELD_SPECS.length };
}

function fail(code, message, detail = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.detail = detail;
  throw error;
}
