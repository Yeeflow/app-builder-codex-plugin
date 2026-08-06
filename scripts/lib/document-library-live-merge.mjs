import { validateDocumentLibraryLiveDetail } from "./document-library-live-materializer.mjs";

export function normalizeDocumentLibraryComponentDetail(value) {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === "string") {
      try { current = JSON.parse(current); } catch { fail("DOCUMENT_LIBRARY_LIVE_COMPONENT_RESPONSE_INVALID", "Component response string must contain JSON."); }
      continue;
    }
    if (Array.isArray(current?.content)) {
      const entry = current.content.find((candidate) => candidate?.type === "text" && String(candidate?.text || "").trim());
      if (!entry) fail("DOCUMENT_LIBRARY_LIVE_COMPONENT_RESPONSE_INVALID", "MCP result must contain a JSON text entry.");
      current = entry.text;
      continue;
    }
    if (current?.Data && typeof current.Data === "object" && !Array.isArray(current.Data)) {
      current = current.Data;
      continue;
    }
    break;
  }
  if (!current || typeof current !== "object" || Array.isArray(current) || !current.List) fail("DOCUMENT_LIBRARY_LIVE_COMPONENT_DETAIL_INVALID", "A decoded Document component detail is required.");
  return current;
}

export function prepareDocumentLibraryLiveBaseline({ bundle } = {}) {
  const baseline = clone(bundle?.baselineDetail);
  validateDocumentLibraryLiveDetail(baseline, { expectedCustomFields: [] });
  return {
    detail: baseline,
    report: { status: "pass", phase: "baseline", deleteMissingRequired: false, readbackRequired: true },
  };
}

export function mergeDocumentLibraryLiveCustomizations({ baselineReadback, bundle } = {}) {
  const persisted = normalizeDocumentLibraryComponentDetail(baselineReadback);
  const baseline = bundle?.baselineDetail;
  const finalDetail = bundle?.finalDetail;
  const customFields = Array.isArray(bundle?.customFields) ? bundle.customFields : [];
  validateDocumentLibraryLiveDetail(persisted, { expectedCustomFields: [] });
  if (String(persisted.List.ListID) !== String(baseline?.List?.ListID) || String(persisted.List.Title) !== String(baseline?.List?.Title)) {
    fail("DOCUMENT_LIBRARY_LIVE_BASELINE_IDENTITY_MISMATCH", "Persisted baseline must match the generated list identity and title.");
  }
  const persistedByName = new Map(persisted.Fields.map((field) => [field.FieldName, field]));
  for (const native of baseline.Fields) {
    const actual = persistedByName.get(native.FieldName);
    if (!actual || String(actual.FieldID) !== String(native.FieldID)) fail("DOCUMENT_LIBRARY_LIVE_BASELINE_NATIVE_ID_CONTINUITY_FAILED", "Native field identity changed after baseline save.", { fieldName: native.FieldName });
  }
  for (const field of customFields) {
    if (persisted.Fields.some((entry) => entry.FieldID === field.FieldID || entry.FieldName === field.FieldName || entry.InternalName === field.InternalName || entry.DisplayName === field.DisplayName)) {
      fail("DOCUMENT_LIBRARY_LIVE_CUSTOM_FIELD_ALREADY_EXISTS", "Customization phase requires planned custom field identities to be absent.", { fieldName: field.FieldName });
    }
  }
  const result = clone(persisted);
  result.List = { ...result.List, ...clone(finalDetail.List) };
  result.Fields = [...result.Fields, ...clone(customFields)];
  result.Layouts = clone(finalDetail.Layouts);
  for (const property of ["RemindRules", "FlowMappings", "Workflows"]) if (!Array.isArray(result[property])) result[property] = [];
  validateDocumentLibraryLiveDetail(result, { expectedCustomFields: customFields });
  return {
    detail: result,
    report: {
      status: "pass",
      phase: "customizations",
      customFieldCount: customFields.length,
      nativeIdentityContinuity: true,
      deleteMissingRequired: false,
      readbackRequired: true,
    },
  };
}

export function validateDocumentLibraryLiveReadback({ detail, bundle } = {}) {
  const persisted = normalizeDocumentLibraryComponentDetail(detail);
  const customFields = Array.isArray(bundle?.customFields) ? bundle.customFields : [];
  validateDocumentLibraryLiveDetail(persisted, { expectedCustomFields: customFields });
  const expected = bundle?.finalDetail;
  if (String(persisted.List.ListID) !== String(expected?.List?.ListID) || String(persisted.List.Title) !== String(expected?.List?.Title)) {
    fail("DOCUMENT_LIBRARY_LIVE_READBACK_IDENTITY_MISMATCH", "Readback list identity or title does not match the materialized bundle.");
  }
  for (const expectedField of expected.Fields) {
    const matches = persisted.Fields.filter((field) => field.FieldName === expectedField.FieldName && String(field.FieldID) === String(expectedField.FieldID));
    if (matches.length !== 1) fail("DOCUMENT_LIBRARY_LIVE_READBACK_FIELD_IDENTITY_INVALID", "Readback must preserve every native and custom field identity.", { fieldName: expectedField.FieldName, matches: matches.length });
  }
  return {
    status: "pass",
    componentType: "Document",
    type16: true,
    nativeFieldContract: "passed",
    customFieldCount: customFields.length,
    formBindings: "passed",
    proofBoundary: {
      mcpReadback: "passed",
      designerOpen: "not-run",
      documentUpload: "not-run",
      securityEnforcement: "not-run",
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fail(code, message, detail = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.detail = detail;
  throw error;
}
