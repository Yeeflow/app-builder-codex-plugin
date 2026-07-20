export type DataListType1IdentityControlPlacementInput = Readonly<{
  surface: "data-list";
  templateKind: "view" | "workbench";
  templateSnapshot: Readonly<{ templateId: string; templateScope: string }>;
  references: Readonly<{ fieldsGridNodeRef: string; controlSlotRef: string; listId: string; fieldId: string }>;
  field: Readonly<{ fieldName: string; displayName: string; fieldType?: string; controlType?: string; type?: string }>;
  formName: string;
  listName: string;
  ordinal: number;
}>;

export type DataListType1IdentityControlPlacementDescriptor = Readonly<{
  type: "dynamic-user";
  name: string;
  title: string;
  label: string;
  nv_label: string;
  binding: string;
  fieldID: string;
  displayLabel: readonly [null, true];
  attrs: Readonly<{
    common: Readonly<{ margin: readonly [null, Readonly<{ top: string; right: string; bottom: string; left: string }>] }>;
    data: Readonly<{ list: Readonly<{ AppID: 41; ListID: string; Type: 1; Title: string }>; field: string; fieldName: string; fieldId: string }>;
  }>;
}>;

export type DataListType1IdentityControlPlacementIntent = Readonly<{
  templateId: string;
  templateScope: string;
  fieldsGridNodeRef: string;
  controlSlotRef: string;
  ordinal: number;
  descriptor: DataListType1IdentityControlPlacementDescriptor;
}>;

export type DataListType1IdentityControlPlacementFinding = Readonly<{ code: string; message: string; context: Readonly<Record<string, string>> }>;
export type DataListType1IdentityControlPlacementResult = Readonly<{ intent: DataListType1IdentityControlPlacementIntent | null; findings: readonly DataListType1IdentityControlPlacementFinding[] }>;

export function projectDataListType1IdentityControlPlacementInternal(input: DataListType1IdentityControlPlacementInput): DataListType1IdentityControlPlacementResult {
  if (!input || input.surface !== "data-list" || !["view", "workbench"].includes(input.templateKind) || !Number.isInteger(input.ordinal) || input.ordinal < 0) throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID");
  if (!isIdentityShape(input.field) || isSublistShape(input.field)) return freeze({ intent: null, findings: [] });
  const fieldName = requiredText(input.field.fieldName);
  const displayName = requiredText(input.field.displayName);
  const formName = requiredText(input.formName);
  const listName = requiredText(input.listName);
  const listId = losslessId(input.references?.listId);
  const fieldId = losslessId(input.references?.fieldId);
  const templateId = requiredText(input.templateSnapshot?.templateId);
  const templateScope = requiredText(input.templateSnapshot?.templateScope);
  const fieldsGridNodeRef = requiredText(input.references?.fieldsGridNodeRef);
  const controlSlotRef = requiredText(input.references?.controlSlotRef);
  const descriptor = {
    type: "dynamic-user" as const,
    name: displayName,
    title: displayName,
    label: displayName,
    nv_label: "field_" + slug(fieldName),
    binding: fieldName,
    fieldID: fieldId,
    displayLabel: [null, true] as const,
    attrs: {
      common: { margin: [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }] as const },
      data: { list: { AppID: 41 as const, ListID: listId, Type: 1 as const, Title: listName }, field: fieldName, fieldName, fieldId },
    },
  };
  return freeze({ intent: { templateId, templateScope, fieldsGridNodeRef, controlSlotRef, ordinal: input.ordinal, descriptor }, findings: [] });
}

function isIdentityShape(field: DataListType1IdentityControlPlacementInput["field"]): boolean {
  return /user|identity|people|person/.test([field?.fieldType, field?.controlType, field?.type, field?.fieldName].join(" ").toLowerCase());
}
function isSublistShape(field: DataListType1IdentityControlPlacementInput["field"]): boolean {
  return /sub\s*list|\blist\b/.test([field?.fieldType, field?.controlType, field?.type, field?.fieldName].join(" ").toLowerCase());
}
function requiredText(value: unknown): string { const text = typeof value === "string" ? value.trim() : ""; if (!text) throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID"); return text; }
function losslessId(value: unknown): string { if (typeof value !== "string" || !/^\d{1,30}$/.test(value)) throw new TypeError("DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_INVALID"); return value; }
function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field"; }
function freeze<T>(value: T): T { if (value && typeof value === "object") { for (const item of Object.values(value as Record<string, unknown>)) freeze(item); Object.freeze(value); } return value; }
