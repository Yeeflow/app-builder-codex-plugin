export type DataListSublistStaticConfigurationKind =
  | "parse-row-fields"
  | "parse-summaries"
  | "normalize-row-type"
  | "normalize-control-type"
  | "is-sublist-form-field";

export type DataListSublistStaticConfigurationRequest = Readonly<{
  surface: "data-list-sublist-static-configuration";
  kind: DataListSublistStaticConfigurationKind;
  value: unknown;
}>;

export type DataListSublistStaticConfigurationProjection = Readonly<{
  kind: DataListSublistStaticConfigurationKind;
  value: unknown;
}>;

/**
 * Projects Data List planning-only embedded-Sublist configuration. It does
 * not receive a field record, control, resource, template, package, host
 * context, or runtime state. Lookup target lowering and every Phase 9-16
 * specialized route remain host-owned materializer seams.
 */
export function projectDataListSublistStaticConfigurationInternal(
  request: DataListSublistStaticConfigurationRequest,
): DataListSublistStaticConfigurationProjection {
  if (request?.surface !== "data-list-sublist-static-configuration") {
    throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_SCOPE_INVALID");
  }
  if (["template", "resource", "package", "hostContext", "control", "fieldRecord", "runtimeState"].some((key) => Object.prototype.hasOwnProperty.call(request, key))) {
    throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_HOST_STATE_FORBIDDEN");
  }
  let value: unknown;
  switch (request.kind) {
    case "parse-row-fields": value = sublistStaticParseRowFields(request.value); break;
    case "parse-summaries": value = sublistStaticParseSummaries(request.value); break;
    case "normalize-row-type": value = sublistStaticNormalizeRowType(request.value); break;
    case "normalize-control-type": value = sublistStaticNormalizeControlType(request.value); break;
    case "is-sublist-form-field": value = sublistStaticIsSublistFormField(request.value); break;
    default: throw new Error("DATA_LIST_SUBLIST_STATIC_CONFIGURATION_KIND_INVALID");
  }
  return sublistStaticFreeze({ kind: request.kind, value });
}

function sublistStaticParseRowFields(value: unknown): readonly unknown[] {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return sublistStaticFreeze([]);
  if (text.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return sublistStaticFreeze(parsed.map((item) => sublistStaticCloneJson(item)));
    } catch { return sublistStaticFreeze([]); }
  }
  return sublistStaticFreeze(text.split(/\s*;\s*/).map((entry) => {
    const [id, displayName, fieldType, controlType, idx, editable, lookupTarget] = entry.split(/\s*:\s*/);
    const lookup = sublistStaticParseLookupTarget(lookupTarget);
    return sublistStaticFreeze({
      id: sublistStaticCleanResourceName(id),
      idx: sublistStaticCleanResourceName(idx),
      displayName: sublistStaticCleanResourceName(displayName || id),
      columnTitle: sublistStaticCleanResourceName(displayName || id),
      fieldType: sublistStaticCleanResourceName(fieldType) || "Text",
      controlType: sublistStaticCleanResourceName(controlType),
      editable: !/^(?:false|no|off|readonly)$/i.test(sublistStaticCleanResourceName(editable)),
      value: lookup?.value,
      lookupDisplayField: lookup?.displayField,
      lookupAddition: lookup?.addition,
      lookupAdditionInvalid: lookup?.additionInvalid === true,
    });
  }).filter((field) => Boolean(field.id && field.displayName)));
}

function sublistStaticParseLookupTarget(value: unknown): Readonly<Record<string, unknown>> | undefined {
  const text = sublistStaticCleanStructuredPlanCell(value).replace(/\\\|/g, "|");
  if (!text) return undefined;
  const [targetText, additionText = ""] = text.split("|");
  const fields = sublistStaticKeyValues(targetText);
  if (String(fields.AppID || "") !== "41" || !/^\d{19}$/.test(String(fields.ListID || "")) || !/^\d{19}$/.test(String(fields.ListSetID || ""))) return undefined;
  const additionFields = sublistStaticKeyValues(additionText);
  const addition = additionText
    ? (additionFields.FieldName && /^\d{19}$/.test(String(additionFields.FieldID || "")) && additionFields.RelationName && /^\d+$/.test(String(additionFields.Order || "")) && String(additionFields.IsShow) === "true"
      ? sublistStaticFreeze([sublistStaticFreeze({ FieldName: String(additionFields.FieldName), FieldID: String(additionFields.FieldID), RelationName: String(additionFields.RelationName), Order: String(additionFields.Order), IsShow: true })])
      : undefined)
    : sublistStaticFreeze([]);
  return sublistStaticFreeze({ value: sublistStaticFreeze({ AppID: "41", ListID: String(fields.ListID), ListSetID: String(fields.ListSetID) }), displayField: sublistStaticCleanResourceName(fields.ListField || fields.listfield || fields.DisplayField || fields.displayField), addition, additionInvalid: Boolean(additionText && !addition) });
}

function sublistStaticParseSummaries(value: unknown): readonly unknown[] {
  const text = String(value || "").trim();
  if (!text || /^(?:none|n\/a|not applicable)$/i.test(text)) return sublistStaticFreeze([]);
  if (text.startsWith("[")) {
    try { const parsed: unknown = JSON.parse(text); if (Array.isArray(parsed)) return sublistStaticFreeze(parsed.map(sublistStaticNormalizeSummary).filter(Boolean)); } catch { return sublistStaticFreeze([]); }
  }
  return sublistStaticFreeze(text.split(/\s*;\s*/).map((entry) => {
    const [field, type, targetKind, target] = entry.split(/\s*:\s*/);
    return sublistStaticNormalizeSummary({ field, type, targetKind, target });
  }).filter(Boolean));
}

function sublistStaticNormalizeSummary(value: unknown): Readonly<Record<string, unknown>> | null {
  const summary = sublistStaticRecord(value);
  const field = sublistStaticCleanResourceName(summary.field || summary.sourceField);
  const type = sublistStaticNormKey(summary.type || summary.summaryType) || "total";
  const target = sublistStaticCleanResourceName(summary.target || summary.bindingValue || summary.value);
  const kind = sublistStaticNormKey(summary.targetKind || summary.bindingKind || summary.prefix);
  const prefix = kind === "__temp_" || /temp/.test(kind) ? "__temp_" : kind === "__list_" || /list|field|record/.test(kind) ? "__list_" : "__variables_";
  if (!field) return null;
  return sublistStaticFreeze({ field, type, display: summary.display !== false, binding: target ? sublistStaticFreeze({ prefix, value: target }) : null });
}

function sublistStaticNormalizeRowType(value: unknown): string {
  const type = sublistStaticNormKey(value);
  if (/lookup|reference|relation/.test(type)) return "lookup";
  if (/user|identity|person/.test(type)) return "user";
  if (/date|time/.test(type)) return "date";
  if (/bool|switch|yes no/.test(type)) return "boolean";
  if (/number|decimal|currency|integer/.test(type)) return "number";
  if (/file|attachment/.test(type)) return "file";
  return "text";
}

function sublistStaticNormalizeControlType(value: unknown): string {
  const input = sublistStaticRecord(value);
  const explicit = sublistStaticNormKey(input.controlType);
  if (/lookup|reference|relation/.test(explicit)) return "lookup";
  if (/identity|user picker/.test(explicit)) return "identity-picker";
  if (/date/.test(explicit)) return "datepicker";
  if (/number/.test(explicit)) return "input_number";
  if (/switch|toggle/.test(explicit)) return "switch";
  if (/file|upload/.test(explicit)) return "file-upload";
  if (/input/.test(explicit)) return "input";
  return ({ user: "identity-picker", date: "datepicker", number: "input_number", boolean: "switch", file: "file-upload", lookup: "lookup" } as Record<string, string>)[String(input.rowType || "")] || "input";
}

function sublistStaticIsSublistFormField(value: unknown): boolean {
  const input = sublistStaticRecord(value); const field = sublistStaticRecord(input.field);
  return /sub list|sublist|\blist\b/.test(sublistStaticNormKey(`${field.DisplayName || ""} ${field.FieldType || ""} ${field.Type || ""} ${input.controlType || ""}`));
}

function sublistStaticKeyValues(value: string): Record<string, string> { return Object.fromEntries(value.split(/\s*,\s*/).filter(Boolean).map((entry) => { const separator = entry.indexOf("="); return separator === -1 ? ["", ""] : [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()]; })); }
function sublistStaticCleanResourceName(value: unknown): string { return String(value ?? "").replace(/<[^>]+>/g, "").replace(/`/g, "").replace(/\*\*/g, "").replace(/^[\s'\"“”‘’([{]+|[\s'\"“”‘’.,;:!?…)}\]]+$/g, "").replace(/\s+/g, " ").trim(); }
function sublistStaticCleanStructuredPlanCell(value: unknown): string { return String(value == null ? "" : value).trim().replace(/^`([\s\S]*)`$/, "$1").trim(); }
function sublistStaticNormKey(value: unknown): string { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function sublistStaticRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function sublistStaticCloneJson(value: unknown): unknown { return value === undefined ? null : JSON.parse(JSON.stringify(value)); }
function sublistStaticFreeze<T>(value: T): T { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value as Record<string, unknown>)) sublistStaticFreeze(child); Object.freeze(value); } return value; }
