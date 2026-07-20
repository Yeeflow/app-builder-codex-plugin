import type { ScalarFieldProjection } from "../index.js";

export type ScalarResourceIdentityRequest = Readonly<{ requestId: string; resourceScope: string; kind: "FieldID"; ordinal: number }>;
export type ScalarResourceDefinitionIntentInput = Readonly<{ resourceScope: string; fieldOrdinal: number; projection: ScalarFieldProjection }>;
export type ScalarResourceDefinitionIntent = Readonly<{ resourceScope: string; fieldOrdinal: number; fieldRequest: ScalarResourceIdentityRequest; preIdFieldRecord: Readonly<Record<string, unknown>>; findings: readonly Readonly<Record<string, string>>[] }>;

export function projectDataListScalarResourceDefinitionIntentInternal(input: ScalarResourceDefinitionIntentInput): ScalarResourceDefinitionIntent {
  if (!input || typeof input.resourceScope !== "string" || !input.resourceScope.trim() || !Number.isInteger(input.fieldOrdinal) || input.fieldOrdinal < 0 || !input.projection) throw new TypeError("DATA_LIST_SCALAR_RESOURCE_INTENT_INVALID");
  const projection = input.projection;
  const requestId = `${input.resourceScope}:FieldID:${input.fieldOrdinal}`;
  const preIdFieldRecord = Object.freeze({
    FieldName: projection.fieldName, FieldType: projection.canonicalFieldType, FieldIndex: projection.fieldIndex,
    DisplayName: projection.displayName, InternalName: projection.internalName, Type: projection.canonicalControlType,
    Status: projection.status, Category: projection.category, DefaultValue: projection.defaultValue, Rules: projection.rules,
    IsSort: projection.sortable, IsSystem: projection.system, IsUnique: projection.unique, IsIndex: projection.index,
    Ext1: "", Ext2: "", Ext3: "",
  });
  return Object.freeze({ resourceScope: input.resourceScope, fieldOrdinal: input.fieldOrdinal, fieldRequest: Object.freeze({ requestId, resourceScope: input.resourceScope, kind: "FieldID", ordinal: input.fieldOrdinal }), preIdFieldRecord, findings: Object.freeze([]) });
}
