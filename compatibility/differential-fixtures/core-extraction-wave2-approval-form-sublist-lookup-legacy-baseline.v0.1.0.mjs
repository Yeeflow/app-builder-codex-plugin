// Frozen Phase 18B Legacy-preserving baseline. Test-only; not a production route.
export function normalizeApprovalSubListLookupConfigurationLegacy(rowField) {
  const existing = rowField?.lookupConfiguration && typeof rowField.lookupConfiguration === "object" ? rowField.lookupConfiguration : null;
  if (!existing && ![rowField?.type, rowField?.fieldType, rowField?.controlType].some((value) => normKey(value) === "lookup")) return null;
  const raw = existing || (rowField?.value && typeof rowField.value === "object" ? rowField.value : rowField?.lookupTarget);
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
function firstNonEmpty(...values) { for (const value of values) { const text = String(value ?? "").trim(); if (text) return text; } return ""; }
function normKey(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
