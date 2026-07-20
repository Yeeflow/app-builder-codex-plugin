/**
 * Internal Phase 8B shadow only. This module is deliberately not exported from
 * the Materializer Core public index or the distributed artifact.
 */
export type DataListSublistScalarRowDescriptor = Readonly<{
  rowSchemaRowId: string;
  fieldName: string;
  ordinal: number;
  name: string;
  displayName: string;
  fieldType: string;
  editable?: boolean;
  controlType?: string;
}>;

export type DataListSublistScalarRowSchemaInput = Readonly<{
  surface: "data-list-sublist";
  parentListId: string;
  childListId: string;
  parentFieldId: string;
  childFieldId: string;
  rowSchemaId: string;
  templateScope: string;
  rows: readonly DataListSublistScalarRowDescriptor[];
}>;

export type DataListSublistScalarRowSchemaDescriptor = Readonly<{
  idx: string;
  id: string;
  name: string;
  displayName: string;
  type: "text" | "date" | "number" | "boolean";
  editable: boolean;
  controlType: string;
  ordinal: number;
}>;

export type DataListSublistScalarRowSchemaIntent = Readonly<{
  parentListId: string;
  childListId: string;
  parentFieldId: string;
  childFieldId: string;
  rowSchemaId: string;
  templateScope: string;
  rows: readonly DataListSublistScalarRowSchemaDescriptor[];
}>;

export type DataListSublistScalarRowSchemaFinding = Readonly<{
  code: string;
  message: string;
  context: Readonly<Record<string, string>>;
}>;

export type DataListSublistScalarRowSchemaResult = Readonly<{
  intent: DataListSublistScalarRowSchemaIntent | null;
  findings: readonly DataListSublistScalarRowSchemaFinding[];
}>;

export function projectDataListSublistScalarRowSchemaInternal(input: DataListSublistScalarRowSchemaInput): DataListSublistScalarRowSchemaResult {
  if (!input || input.surface !== "data-list-sublist" || !Array.isArray(input.rows)) {
    throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
  }
  const ids = {
    parentListId: losslessId(input.parentListId), childListId: losslessId(input.childListId),
    parentFieldId: losslessId(input.parentFieldId), childFieldId: losslessId(input.childFieldId),
    rowSchemaId: requiredText(input.rowSchemaId), templateScope: requiredText(input.templateScope),
  };
  const rows = input.rows.map((row, index) => normalizeRow(row, index));
  if (rows.some((row) => row === null)) return freeze({ intent: null, findings: [] });
  const descriptors = rows as DataListSublistScalarRowSchemaDescriptor[];
  if (new Set(descriptors.map((row) => row.id)).size !== descriptors.length || new Set(descriptors.map((row) => row.idx)).size !== descriptors.length) {
    throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
  }
  descriptors.sort((left, right) => left.ordinal - right.ordinal);
  return freeze({ intent: { ...ids, rows: descriptors }, findings: [] });
}

function normalizeRow(row: DataListSublistScalarRowDescriptor, expectedOrdinal: number): DataListSublistScalarRowSchemaDescriptor | null {
  if (!row || !Number.isInteger(row.ordinal) || row.ordinal !== expectedOrdinal) throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID");
  const type = scalarType(row.fieldType);
  if (!type) return null;
  return {
    idx: requiredText(row.rowSchemaRowId), id: requiredText(row.fieldName), name: requiredText(row.name), displayName: requiredText(row.displayName),
    type, editable: row.editable !== false, controlType: clean(row.controlType), ordinal: row.ordinal,
  };
}

function scalarType(value: unknown): "text" | "date" | "number" | "boolean" | null {
  const type = clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/user|identity|person|lookup|file|attachment|image|binary|barcode|sub\s*list|\blist\b|department|workflow|action/.test(type)) return null;
  if (/date|time/.test(type)) return "date";
  if (/bool|switch|yes no/.test(type)) return "boolean";
  if (/number|decimal|currency|integer/.test(type)) return "number";
  return "text";
}

function requiredText(value: unknown): string { const text = clean(value); if (!text) throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID"); return text; }
function losslessId(value: unknown): string { if (typeof value !== "string" || !/^\d{1,30}$/.test(value)) throw new TypeError("DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_INVALID"); return value; }
function clean(value: unknown): string { return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : ""; }
function freeze<T>(value: T): T { if (value && typeof value === "object") { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
