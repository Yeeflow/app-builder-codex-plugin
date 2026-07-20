/**
 * Internal Phase 9G shadow. A Data List Sublist is an embedded schema owned
 * by one parent field; it does not create child product resources.
 */
export type EmbeddedSublistSchemaColumnInput = Readonly<{
  idx: string;
  id: string;
  name: string;
  type: string;
  editable: boolean;
}>;

export type EmbeddedSublistSchemaInput = Readonly<{
  parentListId: string;
  parentFieldId: string;
  columns: readonly EmbeddedSublistSchemaColumnInput[];
}>;

export type EmbeddedSublistSchemaColumn = Readonly<{
  idx: string;
  id: string;
  name: string;
  type: string;
  editable: boolean;
  ordinal: number;
}>;

export type EmbeddedSublistSchemaDescriptor = Readonly<{
  parentListId: string;
  parentFieldId: string;
  columns: readonly EmbeddedSublistSchemaColumn[];
}>;

export type EmbeddedSublistRulesProjection = Readonly<{
  descriptor: EmbeddedSublistSchemaDescriptor;
  listVariables: readonly Readonly<Omit<EmbeddedSublistSchemaColumn, "ordinal">>[];
}>;

export type EmbeddedSublistCustomFormProjection = Readonly<{
  descriptor: EmbeddedSublistSchemaDescriptor;
  listFields: readonly Readonly<Omit<EmbeddedSublistSchemaColumn, "ordinal">>[];
}>;

/**
 * Freezes the one embedded descriptor that Rules and custom-form consumers
 * must receive. `idx` and `id` retain export schema semantics only.
 */
export function projectDataListEmbeddedSublistSchemaInternal(input: EmbeddedSublistSchemaInput): EmbeddedSublistSchemaDescriptor {
  if (!input || !losslessProductId(input.parentListId) || !losslessProductId(input.parentFieldId) || !Array.isArray(input.columns)) {
    throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
  }
  const columns = input.columns.map((column, ordinal) => {
    if (!column || !text(column.idx) || !text(column.id) || !text(column.name) || !text(column.type) || typeof column.editable !== "boolean") {
      throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
    }
    return Object.freeze({ idx: column.idx, id: column.id, name: column.name, type: column.type, editable: column.editable, ordinal });
  });
  if (duplicates(columns.map((column) => column.idx)) || duplicates(columns.map((column) => column.id))) {
    throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
  }
  return deepFreeze({ parentListId: input.parentListId, parentFieldId: input.parentFieldId, columns: Object.freeze(columns) });
}

/** Returns the parent-field Rules shape from the supplied frozen descriptor. */
export function projectEmbeddedSublistRules(descriptor: EmbeddedSublistSchemaDescriptor): EmbeddedSublistRulesProjection {
  return Object.freeze({ descriptor, listVariables: lowerColumns(descriptor) });
}

/** Returns the schema portion of custom-form list-fields from the same descriptor. */
export function projectEmbeddedSublistCustomFormFields(descriptor: EmbeddedSublistSchemaDescriptor): EmbeddedSublistCustomFormProjection {
  return Object.freeze({ descriptor, listFields: lowerColumns(descriptor) });
}

function lowerColumns(descriptor: EmbeddedSublistSchemaDescriptor): readonly Readonly<Omit<EmbeddedSublistSchemaColumn, "ordinal">>[] {
  if (!descriptor || !losslessProductId(descriptor.parentListId) || !losslessProductId(descriptor.parentFieldId) || !Array.isArray(descriptor.columns)) {
    throw new TypeError("DATA_LIST_EMBEDDED_SUBLIST_SCHEMA_INVALID");
  }
  return Object.freeze(descriptor.columns.map(({ idx, id, name, type, editable }) => Object.freeze({ idx, id, name, type, editable })));
}

function losslessProductId(value: unknown): value is string { return typeof value === "string" && /^\d{16,30}$/.test(value); }
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function duplicates(values: readonly string[]): boolean { return new Set(values).size !== values.length; }
function deepFreeze<T>(value: T): T { if (value && typeof value === "object") { for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child); Object.freeze(value); } return value; }
