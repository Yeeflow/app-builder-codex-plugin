// Preserve explicit plan values at the native Data List host boundary.
export function planningIdentity(value) {
  return String(value ?? "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, " ").trim();
}

export function plannedBoolean(value, label) {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  if (/^(true|yes|1|是)$/i.test(String(value).trim())) return true;
  if (/^(false|no|0|否)$/i.test(String(value).trim())) return false;
  throw new Error(`FIELD_PLAN_BOOLEAN_INVALID: ${label}`);
}

export function applyPlannedFieldConstraints(record, field) {
  const rules = record.Rules ? JSON.parse(record.Rules) : {};
  if (field.required !== undefined) rules.required = field.required;
  if (field.unique !== undefined) record.IsUnique = field.unique;
  if (field.defaultValue !== undefined && field.defaultValue !== "") {
    record.DefaultValue = record.FieldType === "Bit"
      ? (plannedBoolean(field.defaultValue, field.displayName) ? "1" : "0")
      : String(field.defaultValue);
    if (record.FieldType === "Decimal" && !Number.isFinite(Number(record.DefaultValue))) {
      throw new Error(`FIELD_PLAN_DEFAULT_INVALID: ${field.displayName}`);
    }
  }
  if (planningIdentity(field.controlType) === "currency") {
    if (record.FieldType !== "Decimal") throw new Error(`FIELD_PLAN_CURRENCY_STORAGE_INVALID: ${field.displayName}`);
    record.Type = "currency";
  }
  if (Object.keys(rules).length) record.Rules = JSON.stringify(rules);
  return record;
}
