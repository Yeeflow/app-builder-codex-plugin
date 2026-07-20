export type ApprovalFormStaticConfigurationKind =
  | "explicit-default-approval"
  | "public-step-type"
  | "full-row-field"
  | "unique-field-specs"
  | "public-field-selection"
  | "no-fields-notice"
  | "sublist-row-control-type";

export type ApprovalFormStaticConfigurationInput = Readonly<{
  kind: ApprovalFormStaticConfigurationKind;
  value?: unknown;
}>;

/**
 * Projects Approval Form static configuration only. It deliberately accepts no
 * resource, template, runtime, or page-variable object and returns fresh,
 * frozen JSON-safe values for the existing host materializer seam.
 */
export function projectApprovalFormStaticConfiguration(
  input: ApprovalFormStaticConfigurationInput,
): Readonly<{ kind: ApprovalFormStaticConfigurationKind; value: unknown }> {
  const kind = input?.kind;
  let value: unknown;
  if (kind === "explicit-default-approval") value = approvalStaticHasExplicitDefault(String(input.value || ""));
  else if (kind === "public-step-type") value = approvalStaticNormalizeStep(input.value);
  else if (kind === "full-row-field") {
    const field = approvalStaticRecord(input.value);
    value = approvalStaticIsFullRow(field, String(field.controlType || ""));
  } else if (kind === "unique-field-specs") value = approvalStaticUniqueFields(Array.isArray(input.value) ? input.value : []);
  else if (kind === "public-field-selection") value = approvalStaticSelectPublicFields(approvalStaticRecord(input.value));
  else if (kind === "no-fields-notice") value = approvalStaticNoFieldsNotice(approvalStaticRecord(input.value));
  else if (kind === "sublist-row-control-type") value = approvalStaticSublistRowControlType(input.value);
  else throw new Error(`Unsupported Approval Form static configuration kind: ${String(kind || "")}`);
  return approvalStaticFreeze({ kind, value });
}

function approvalStaticRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function approvalStaticClean(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/^[\s'\"“”‘’([{]+|[\s'\"“”‘’.,;:!?…)}\]]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function approvalStaticKey(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function approvalStaticPlaceholder(value: unknown): boolean {
  const normalized = approvalStaticClean(value).toLowerCase().replace(/\bn\s*[./]s*a\b/g, "n/a");
  return !normalized
    || /^(not applicable|not planned|not required|deferred|n\/a|none)$/.test(normalized)
    || /^(?:not applicable|not planned|not required|deferred|n\/a|none)(?:\s*[-–—:].+)$/.test(normalized);
}

function approvalStaticNonResource(value: unknown): boolean {
  const text = approvalStaticClean(value);
  return approvalStaticPlaceholder(text)
    || /^(status|resource type|notes?|owner|used by|actions?|fields?)$/i.test(text)
    || /^no\s+(?:form\s+)?reports?\b/i.test(text)
    || /^no custom\b/i.test(text)
    || /^(dashboard|dashboard page|dashboard page name|page|page name|list name|form name|group|item|section|metric name|filter name)$/i.test(text);
}

function approvalStaticHasExplicitDefault(text: string): boolean {
  return /\b(user|customer|client|admin|stakeholder|business)\s+(explicitly\s+)?(approved|requested|selected|confirmed)\b[^.\n]{0,120}\b(default|yeeflow default|standard yeeflow)\b/i.test(text)
    || /\b(default|yeeflow default|standard yeeflow)\b[^.\n]{0,120}\b(user|customer|client|admin|stakeholder|business)\s+(approved|requested|selected|confirmed)\b/i.test(text);
}

function approvalStaticNormalizeStep(value: unknown): string {
  const normalized = approvalStaticKey(value);
  const aliases: Record<string, string> = {
    "set variables": "setvar", "set variable": "setvar", setvar: "setvar",
    "execute custom code": "customcode", "custom code": "customcode", customcode: "customcode",
    "show confirm dialog": "confirm", confirm: "confirm",
    "redirect page to": "redirect", redirect: "redirect",
    "submit form": "submit", submit: "submit",
    "start another action": "otheraction", otheraction: "otheraction",
    "barcode scan": "barcode", barcode: "barcode", "nfc reader": "nfc", nfc: "nfc",
  };
  return aliases[normalized] || normalized;
}

function approvalStaticIsFullRow(field: Record<string, unknown>, controlType: string): boolean {
  return controlType === "textarea"
    || controlType === "richtext"
    || controlType === "list"
    || /business purpose|justification|description|notes?/.test(approvalStaticKey(`${field.fieldType || ""} ${field.controlType || ""} ${field.displayName || ""}`));
}

function approvalStaticFieldPrefix(fieldType: unknown): string {
  const normalized = approvalStaticKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "Text";
  if (/date|time/.test(normalized)) return "Datetime";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "Decimal";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "Bit";
  return "Text";
}

function approvalStaticFieldKey(displayName: string, fieldType: unknown, index: number): string {
  if (/^title$/i.test(displayName)) return "Title";
  return `${approvalStaticFieldPrefix(fieldType)}${Math.max(1, index + 1)}`;
}

function approvalStaticControl(fieldType: unknown): string {
  const normalized = approvalStaticKey(fieldType);
  if (/user|people|person|identity/.test(normalized)) return "identity-picker";
  if (/date|time/.test(normalized)) return "datepicker";
  if (/number|decimal|currency|amount|percent|integer/.test(normalized)) return "input_number";
  if (/boolean|yes no|checkbox|bit/.test(normalized)) return "switch";
  if (/choice|select|status|category/.test(normalized)) return "select";
  if (/lookup|reference|relation/.test(normalized)) return "lookup";
  if (/file|attachment/.test(normalized)) return "file-upload";
  if (/image|photo|picture/.test(normalized)) return "icon-upload";
  if (/text ?area|textarea|multi line|multiline|long text|description/.test(normalized)) return "textarea";
  return "input";
}

function approvalStaticUniqueFields(items: readonly unknown[]): readonly Record<string, unknown>[] {
  const normalized: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const field = approvalStaticRecord(raw);
    const displayName = approvalStaticClean(field.displayName);
    if (!displayName || approvalStaticNonResource(displayName)) continue;
    let fieldName = approvalStaticClean(field.fieldName || approvalStaticFieldKey(displayName, field.fieldType || "Text", normalized.length));
    if (approvalStaticKey(fieldName).replace(/ /g, "") === "requesttitle" || approvalStaticKey(displayName).replace(/ /g, "") === "requesttitle") fieldName = "requestTitle";
    const fieldKey = approvalStaticKey(fieldName || displayName);
    if (seen.has(fieldKey)) continue;
    seen.add(fieldKey);
    normalized.push({
      displayName,
      fieldName,
      fieldType: approvalStaticClean(field.fieldType) || "Text",
      controlType: approvalStaticClean(field.controlType) || approvalStaticControl(field.fieldType || ""),
      readOnly: field.readOnly === true,
      dynamicDisplay: String(field.dynamicDisplay == null ? "" : field.dynamicDisplay).trim().replace(/^`([\s\S]*)`$/, "$1").trim(),
      listRefId: approvalStaticClean(field.listRefId || field.complexTypeId),
      listFields: Array.isArray(field.listFields)
        ? field.listFields.map((rowField) => ({ ...approvalStaticRecord(rowField) }))
        : Array.isArray(field.rowFields)
          ? field.rowFields.map((rowField) => ({ ...approvalStaticRecord(rowField) }))
          : [],
      listSummaries: Array.isArray(field.listSummaries)
        ? field.listSummaries.map((summary) => {
          const item = approvalStaticRecord(summary);
          return { ...item, binding: item.binding ? { ...approvalStaticRecord(item.binding) } : null };
        })
        : [],
    });
  }
  return normalized;
}

function approvalStaticSelectPublicFields(input: Record<string, unknown>): readonly unknown[] {
  const fields = Array.isArray(input.fields) ? input.fields : [];
  const requested = Array.isArray(input.requested) ? input.requested.map(approvalStaticClean).filter(Boolean) : [];
  if (!requested.length) return fields.slice(0, 8);
  const selected: unknown[] = [];
  const seen = new Set<string>();
  for (const requestedName of requested) {
    const field = fields.find((candidate) => {
      const record = approvalStaticRecord(candidate);
      return [record.DisplayName, record.FieldName, record.InternalName].some((value) => approvalStaticKey(value) === approvalStaticKey(requestedName));
    });
    const record = approvalStaticRecord(field);
    if (!field || seen.has(String(record.FieldName || ""))) continue;
    seen.add(String(record.FieldName || ""));
    selected.push(field);
  }
  return selected.length ? selected : fields.slice(0, 8);
}

function approvalStaticNoFieldsNotice(input: Record<string, unknown>): Record<string, unknown> {
  const role = approvalStaticClean(input.role);
  const id = approvalStaticClean(input.id);
  if (!id) throw new Error("Approval Form static no-fields notice requires a host-generated deterministic id.");
  return {
    id,
    name: "No additional fields required",
    title: "No additional fields required",
    label: "No additional fields required",
    nv_label: "approval_no_additional_fields_required",
    type: "heading",
    approvalFormNoFieldsNotice: true,
    attrs: {
      heads: { ty: [null, "body-medium"], color: "#64748b" },
      headc: { title: { value: role === "task"
        ? "No additional task fields are required. Use the action panel below to complete the workflow task."
        : "No additional submission fields are required for this approval form." } },
    },
  };
}

function approvalStaticSublistRowControlType(value: unknown): string {
  const type = approvalStaticKey(value);
  if (type === "date") return "datepicker";
  if (type === "number") return "input_number";
  if (type === "boolean") return "switch";
  if (type === "user") return "identity-picker";
  return "input";
}

function approvalStaticFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value as Record<string, unknown>)) approvalStaticFreeze(nested);
  return Object.freeze(value);
}
