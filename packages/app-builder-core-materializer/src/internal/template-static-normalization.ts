export type TemplateStaticNormalizationKind = "layout-purpose-match" | "data-table-template-id" | "template-add-action" | "detail-layout-action" | "source-residue-text" | "default-layout-attrs";

export interface TemplateStaticNormalizationInput {
  readonly kind: TemplateStaticNormalizationKind;
  readonly value?: unknown;
  readonly options?: Readonly<{ readonly approvedTemplateIds?: readonly unknown[] }>;
}

export interface TemplateStaticNormalizationProjection { readonly kind: TemplateStaticNormalizationKind; readonly value: unknown; }

/** Pure projection from caller-owned JSON-safe template snapshots; no graph or resource access. */
export function projectTemplateStaticNormalization(input: TemplateStaticNormalizationInput): Readonly<TemplateStaticNormalizationProjection> {
  const kind = input?.kind;
  const record = templateStaticAsRecord(input?.value);
  let value: unknown;
  if (kind === "layout-purpose-match") value = templateStaticLayoutPurpose(String(record.operation || ""), String(record.purpose || ""));
  else if (kind === "data-table-template-id") value = templateStaticTemplateId(input?.value, input?.options?.approvedTemplateIds || []);
  else if (kind === "template-add-action") value = templateStaticAddAction(record);
  else if (kind === "detail-layout-action") value = templateStaticDetailAction(record);
  else if (kind === "source-residue-text") value = templateStaticResidue(record);
  else if (kind === "default-layout-attrs") value = templateStaticDefaultAttrs();
  else throw new Error(`Unsupported template static normalization kind: ${String(kind || "")}`);
  return templateStaticFreeze({ kind, value });
}

function templateStaticAsRecord(value: unknown): Readonly<Record<string, unknown>> { return value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {}; }
function templateStaticNormKey(value: unknown): string { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function templateStaticLayoutPurpose(operation: string, purpose: string): boolean {
  const op = templateStaticNormKey(operation); const kind = templateStaticNormKey(purpose);
  return kind === "view" ? op === "view" : kind === "new edit" ? op === "add" || op === "edit" : kind === "new" ? op === "add" : kind === "edit" ? op === "edit" : false;
}
function templateStaticTemplateId(value: unknown, approvedTemplateIds: readonly unknown[]): string {
  const text = String(value || "");
  for (const candidate of approvedTemplateIds) {
    const id = String(candidate || ""); if (!id) continue;
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`).test(text)) return id;
  }
  return "";
}
function templateStaticIdentityCandidates(control: Readonly<Record<string, unknown>>): string[] {
  const attrs = templateStaticAsRecord(control.attrs);
  return [control.id, control.ID, control.key, control.name, control.Name, control.label, control.Label, control.nv_label, control.nav_label, attrs.id, attrs.name, attrs.label, attrs.nv_label, attrs.nav_label, attrs.templateMarker, attrs.dashboardPageLayoutTemplateId, attrs.dataListFormLayoutTemplateId, attrs.derivedFromDataListFormLayoutTemplate, attrs.approvalFormLayoutTemplateId, attrs.derivedFromApprovalFormLayoutTemplate, control.templateMarker, control.derivedFromDashboardPageLayoutTemplate, control.dataListFormLayoutTemplateId, control.derivedFromDataListFormLayoutTemplate, control.approvalFormLayoutTemplateId, control.derivedFromApprovalFormLayoutTemplate].filter(Boolean).map(String);
}
function templateStaticAddAction(node: Readonly<Record<string, unknown>>): boolean {
  if (String(node.type || "") !== "action_button") return false;
  const attrs = templateStaticAsRecord(node.attrs);
  const actionType = String(attrs["action-type"] || attrs.actionType || attrs.operation || "").trim();
  const text = templateStaticIdentityCandidates(node).concat([node.label, templateStaticAsRecord(attrs.label).value, templateStaticAsRecord(attrs.text).value].filter(Boolean).map(String)).join(" ");
  return actionType === "5" || /\badd\b|new item|create/i.test(text);
}
function templateStaticDetailAction(action: Readonly<Record<string, unknown>>): boolean { const text = JSON.stringify(action || {}); return text.includes("{{DetailLayoutID}}") || (/"op_type"\s*:\s*"edit"/i.test(text) && /"type"\s*:\s*"listitem"/i.test(text)); }
function templateStaticResidue(node: Readonly<Record<string, unknown>>): boolean {
  const values: string[] = [];
  const visit = (current: unknown): void => {
    const record = templateStaticAsRecord(current); if (!Object.keys(record).length) return;
    for (const key of ["text", "title", "value", "description", "placeholder", "name", "label", "nv_label", "nav_label"]) { const value = record[key]; if (typeof value === "string" && value.trim()) values.push(value); }
    const attrs = templateStaticAsRecord(record.attrs); const head = templateStaticAsRecord(attrs.headc); const title = templateStaticAsRecord(head.title).value ?? templateStaticAsRecord(attrs.title).value ?? attrs.text ?? attrs.value;
    if (typeof title === "string" && title.trim()) values.push(title);
    for (const child of Array.isArray(record.children) ? record.children : []) visit(child);
  };
  visit(node); const text = values.join(" ");
  return /\bActive Loan Pipeline\b/i.test(text) || /\bActive Loans\b/i.test(text) || /\bCoordinator view of active loans/i.test(text) || /\bCoordinator guidance: prioritize overdue items and returns/i.test(text) || /\bcurrent loan volume\b/i.test(text) || /\breturn activity signal\b/i.test(text) || /\bwatch coordinator follow-up\b/i.test(text) || /\bOffice Asset records\b/i.test(text);
}
function templateStaticDefaultAttrs(): Record<string, unknown> { return { appearance: { bgc: "var(--c--primary-dark-hover)", color: "var(--c--background)", height: 46, ty: [null, "h6-semi-bold"] }, "navigator-menu": { bgc: "var(--c--primary-dark)", color: "var(--c--background)", position: "left", active: {} }, CustomColors: [{ id: "extra-color-1", label: "Extra Color 1", value: "#F9C434" }, { id: "extra-color-2", label: "Extra Color 2", value: "#F61515" }], CustomFonts: [{ id: "3708306f-951b-40d5-b459-26c717e8f187", label: "Extra font 1" }, { id: "dc50649a-28d3-42ec-9714-e32cf78de678", label: "Extra font 2" }] }; }
function templateStaticFreeze<T>(value: T): T { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value as Record<string, unknown>)) templateStaticFreeze(child); return Object.freeze(value); }
