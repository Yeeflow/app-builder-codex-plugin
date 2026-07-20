type DataListSublistLookupAdditionalFieldIntent = Readonly<{ source: Readonly<{ fieldName: string; fieldId: string; order: string; relationName: string }>; destination: Readonly<{ id: string; readonly: true }> }>;

export function lowerDataListSublistLookupAdditionalFieldIntentForTest(intent: DataListSublistLookupAdditionalFieldIntent): Readonly<Record<string, unknown>> {
  if (!intent || !Object.isFrozen(intent) || intent.destination.readonly !== true || intent.source.relationName !== intent.destination.id) throw Error("SUBLIST_LOOKUP_ADDITIONAL_LOWERING_INVALID");
  return Object.freeze({ FieldName: intent.source.fieldName, FieldID: intent.source.fieldId, IsShow: true, RelationName: intent.destination.id, Value: null, Order: intent.source.order });
}
