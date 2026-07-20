/** Internal Phase 8B host lowering shadow. It is not a public runtime export. */
export type SublistScalarRowSchemaIntent = Readonly<{
  parentListId: string; childListId: string; parentFieldId: string; childFieldId: string; rowSchemaId: string; templateScope: string;
  rows: readonly Readonly<{ idx: string; id: string; name: string; displayName: string; type: string; editable: boolean; controlType: string; ordinal: number }>[];
}>;

export type SublistScalarRowSchemaHostContext = Readonly<{
  parentListId: string; childListId: string; parentFieldId: string; childFieldId: string; rowSchemaId: string; templateScope: string;
  parentNodes: readonly Readonly<{ reference: string; scope: string; parentListId: string }>[];
  rowSchemas: readonly Readonly<{ reference: string; scope: string; parentFieldId: string; childListId: string }>[];
}>;

export function lowerDataListSublistScalarRowSchemaAtHostInternal(intent: SublistScalarRowSchemaIntent, context: SublistScalarRowSchemaHostContext): readonly Readonly<Record<string, unknown>>[] {
  if (!intent || !context) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING");
  for (const value of [intent.parentListId, intent.childListId, intent.parentFieldId, intent.childFieldId, context.parentListId, context.childListId, context.parentFieldId, context.childFieldId]) {
    if (typeof value !== "string" || !/^\d{1,30}$/.test(value)) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID");
  }
  if (![intent.parentListId, intent.childListId, intent.parentFieldId, intent.childFieldId].every((value, index) => value === [context.parentListId, context.childListId, context.parentFieldId, context.childFieldId][index])) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
  if (!text(intent.rowSchemaId) || !text(context.rowSchemaId) || !text(intent.templateScope) || !text(context.templateScope)) fail("SUBLIST_ROW_SCHEMA_REFERENCE_MISSING");
  if (!reference(intent.rowSchemaId) || !reference(context.rowSchemaId) || !reference(intent.templateScope) || !reference(context.templateScope)) fail("SUBLIST_ROW_SCHEMA_REFERENCE_INVALID");
  if (intent.rowSchemaId !== context.rowSchemaId || intent.templateScope !== context.templateScope) fail("SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH");
  if (duplicates(context.parentNodes.map((node) => node.reference))) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE");
  if (duplicates(context.rowSchemas.map((schema) => schema.reference))) fail("SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE");
  const parent = context.parentNodes.find((node) => node.reference === intent.parentFieldId);
  if (!parent) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING");
  if (parent.scope !== intent.templateScope) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
  if (parent.parentListId !== intent.parentListId) fail("SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN");
  const rowSchema = context.rowSchemas.find((schema) => schema.reference === intent.rowSchemaId);
  if (!rowSchema) fail("SUBLIST_ROW_SCHEMA_REFERENCE_MISSING");
  if (rowSchema.scope !== intent.templateScope) fail("SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH");
  if (rowSchema.parentFieldId !== intent.parentFieldId || rowSchema.childListId !== intent.childListId) fail("SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN");
  if (!Array.isArray(intent.rows) || duplicates(intent.rows.map((row) => row.id)) || duplicates(intent.rows.map((row) => row.idx))) fail("SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE");
  for (const row of intent.rows) if (!text(row.idx) || !text(row.id) || !Number.isInteger(row.ordinal)) fail("SUBLIST_ROW_SCHEMA_REFERENCE_INVALID");
  return freeze(intent.rows.map(({ ordinal: _ordinal, ...row }) => ({ ...row })));
}

function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function reference(value: string): boolean { return /^[A-Za-z0-9:_-]+$/.test(value); }
function duplicates(values: readonly string[]): boolean { return new Set(values).size !== values.length; }
function fail(code: string): never { throw new Error(code); }
function freeze<T>(value: T): T { if (value && typeof value === "object") { for (const child of Object.values(value as Record<string, unknown>)) freeze(child); Object.freeze(value); } return value; }
