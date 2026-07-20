function cleanPlanningLabel(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[\s'\"“”‘’([{]+|[\s'\"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanResourceName(value) { return cleanPlanningLabel(value); }
function cleanStructuredPlanCell(value) { return String(value == null ? "" : value).trim().replace(/^`([\s\S]*)`$/, "$1").trim(); }
function normKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

export function parseEmbeddedSublistLookupTarget(value) {
  const text = cleanStructuredPlanCell(value).replace(/\\\|/g, "|");
  if (!text) return undefined;
  const [targetText, additionText = ""] = text.split("|");
  const fields = Object.fromEntries(targetText.split(/\s*,\s*/).map((entry) => {
    const separator = entry.indexOf("=");
    return separator === -1 ? ["", ""] : [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
  }));
  if (String(fields.AppID || "") !== "41" || !/^\d{19}$/.test(String(fields.ListID || "")) || !/^\d{19}$/.test(String(fields.ListSetID || ""))) return undefined;
  const additionFields = Object.fromEntries(additionText.split(/\s*,\s*/).filter(Boolean).map((entry) => {
    const separator = entry.indexOf("=");
    return separator === -1 ? ["", ""] : [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
  }));
  const addition = additionText
    ? (additionFields.FieldName && /^\d{19}$/.test(String(additionFields.FieldID || "")) && additionFields.RelationName && /^\d+$/.test(String(additionFields.Order || "")) && String(additionFields.IsShow) === "true"
      ? Object.freeze([{ FieldName: additionFields.FieldName, FieldID: additionFields.FieldID, RelationName: additionFields.RelationName, Order: additionFields.Order, IsShow: true }])
      : undefined)
    : Object.freeze([]);
  const displayField = cleanResourceName(fields.ListField || fields.listfield || fields.DisplayField || fields.displayField);
  return Object.freeze({ value: Object.freeze({ AppID: "41", ListID: fields.ListID, ListSetID: fields.ListSetID }), displayField, addition, additionInvalid: Boolean(additionText && !addition) });
}

export function parseSubListRowFields(value) {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return [];
  if (text.startsWith("[")) {
    try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) return parsed; } catch { return []; }
  }
  return text.split(/\s*;\s*/).map((entry) => {
    const [id, displayName, fieldType, controlType, idx, editable, lookupTarget] = entry.split(/\s*:\s*/);
    const lookup = parseEmbeddedSublistLookupTarget(lookupTarget);
    return { id: cleanResourceName(id), idx: cleanResourceName(idx), displayName: cleanResourceName(displayName || id), columnTitle: cleanResourceName(displayName || id), fieldType: cleanResourceName(fieldType) || "Text", controlType: cleanResourceName(controlType), editable: !/^(?:false|no|off|readonly)$/i.test(cleanResourceName(editable)), value: lookup?.value, lookupDisplayField: lookup?.displayField, lookupAddition: lookup?.addition, lookupAdditionInvalid: lookup?.additionInvalid === true };
  }).filter((field) => field.id && field.displayName);
}

export function normalizePlannedSubListSummary(summary) {
  const field = cleanResourceName(summary?.field || summary?.sourceField);
  const type = normKey(summary?.type || summary?.summaryType) || "total";
  const target = cleanResourceName(summary?.target || summary?.bindingValue || summary?.value);
  const kind = normKey(summary?.targetKind || summary?.bindingKind || summary?.prefix);
  const prefix = kind === "__temp_" || /temp/.test(kind) ? "__temp_" : kind === "__list_" || /list|field|record/.test(kind) ? "__list_" : "__variables_";
  if (!field) return null;
  return { field, type, display: summary?.display !== false, binding: target ? { prefix, value: target } : null };
}

export function parseSubListSummaries(value) {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return [];
  if (text.startsWith("[")) {
    try { const parsed = JSON.parse(text); if (Array.isArray(parsed)) return parsed.map(normalizePlannedSubListSummary).filter(Boolean); } catch { return []; }
  }
  return text.split(/\s*;\s*/).map((entry) => {
    const [field, type, targetKind, target] = entry.split(/\s*:\s*/);
    return normalizePlannedSubListSummary({ field, type, targetKind, target });
  }).filter(Boolean);
}

export function normalizeSubListRowType(value) {
  const type = normKey(value);
  if (/lookup|reference|relation/.test(type)) return "lookup";
  if (/user|identity|person/.test(type)) return "user";
  if (/date|time/.test(type)) return "date";
  if (/bool|switch|yes no/.test(type)) return "boolean";
  if (/number|decimal|currency|integer/.test(type)) return "number";
  if (/file|attachment/.test(type)) return "file";
  return "text";
}

export function normalizeSubListColumnControlType(controlType, rowType) {
  const explicit = normKey(controlType);
  if (/lookup|reference|relation/.test(explicit)) return "lookup";
  if (/identity|user picker/.test(explicit)) return "identity-picker";
  if (/date/.test(explicit)) return "datepicker";
  if (/number/.test(explicit)) return "input_number";
  if (/switch|toggle/.test(explicit)) return "switch";
  if (/file|upload/.test(explicit)) return "file-upload";
  if (/input/.test(explicit)) return "input";
  return { user: "identity-picker", date: "datepicker", number: "input_number", boolean: "switch", file: "file-upload", lookup: "lookup" }[rowType] || "input";
}

export function isSubListFormField(field, controlType = "") {
  const raw = normKey(`${field?.DisplayName || ""} ${field?.FieldType || ""} ${field?.Type || ""} ${controlType || ""}`);
  return /sub list|sublist|\blist\b/.test(raw);
}
