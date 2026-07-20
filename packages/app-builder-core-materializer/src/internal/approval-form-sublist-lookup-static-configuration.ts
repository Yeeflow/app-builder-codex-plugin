export type ApprovalFormSubListLookupStaticConfigurationInput = Readonly<{
  type?: unknown;
  fieldType?: unknown;
  controlType?: unknown;
  lookupConfiguration?: unknown;
  value?: unknown;
  lookupTarget?: unknown;
  lookupDisplayField?: unknown;
  listfield?: unknown;
  listField?: unknown;
}>;

export type ApprovalFormSubListLookupStaticConfiguration = Readonly<{
  appId: "41";
  listId: string;
  listSetId: string;
  listField: string;
}>;

/**
 * Projects only Approval Form embedded-Sublist Lookup static target/display
 * configuration. It deliberately excludes Lookup execution and all host state.
 */
export function projectApprovalFormSubListLookupStaticConfigurationInternal(input: ApprovalFormSubListLookupStaticConfigurationInput): ApprovalFormSubListLookupStaticConfiguration | null {
  const rowField = input as Record<string, unknown> | null | undefined;
  const existing = rowField?.lookupConfiguration && typeof rowField.lookupConfiguration === "object" && !Array.isArray(rowField.lookupConfiguration)
    ? rowField.lookupConfiguration as Record<string, unknown>
    : null;
  if (!existing && ![rowField?.type, rowField?.fieldType, rowField?.controlType].some((value) => normKey(value) === "lookup")) return null;
  const raw = existing || (rowField?.value && typeof rowField.value === "object" && !Array.isArray(rowField.value)
    ? rowField.value as Record<string, unknown>
    : rowField?.lookupTarget && typeof rowField.lookupTarget === "object" && !Array.isArray(rowField.lookupTarget)
      ? rowField.lookupTarget as Record<string, unknown>
      : undefined);
  const rawAppId = raw?.AppID ?? raw?.appId;
  const rawListId = raw?.ListID ?? raw?.listId;
  const rawListSetId = raw?.ListSetID ?? raw?.listSetId;
  const rawListField = existing?.listField ?? rowField?.lookupDisplayField ?? rowField?.listfield ?? rowField?.listField ?? raw?.ListField ?? raw?.listfield ?? raw?.DisplayField ?? raw?.displayField;
  if ([rawAppId, rawListId, rawListSetId, rawListField].some((value) => value !== undefined && typeof value !== "string")) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");
  const appId = firstNonEmpty(raw?.AppID, raw?.appId);
  const listId = firstNonEmpty(raw?.ListID, raw?.listId);
  const listSetId = firstNonEmpty(raw?.ListSetID, raw?.listSetId);
  const listField = firstNonEmpty(existing?.listField, rowField?.lookupDisplayField, rowField?.listfield, rowField?.listField, raw?.ListField, raw?.listfield, raw?.DisplayField, raw?.displayField);
  if (!appId && !listId && !listSetId && !listField) return null;
  if (appId !== "41" || !/^\d{19}$/.test(listId) || !/^\d{19}$/.test(listSetId) || !listField) throw Error("APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID");
  return Object.freeze({ appId: "41", listId, listSetId, listField });
}

function firstNonEmpty(...values: unknown[]): string { for (const value of values) { const text = String(value ?? "").trim(); if (text) return text; } return ""; }
function normKey(value: unknown): string { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
