export type ScalarIdentityIntent = Readonly<{ resourceScope: string; fieldOrdinal: number; fieldRequest: Readonly<{ requestId: string; resourceScope: string; kind: string; ordinal: number }>; preIdFieldRecord: Readonly<Record<string, unknown>>; requiredLookupTarget?: string }>;
export type ScalarIdentityAllocation = Readonly<{ listId: string; fieldIdsByRequestId: Readonly<Record<string, string>>; fieldScopesByRequestId: Readonly<Record<string, string>>; lookupResolution?: Readonly<Record<string, string>> }>;

export function lowerDataListScalarResourceIdentityAtHost(intent: ScalarIdentityIntent, allocation: ScalarIdentityAllocation): Readonly<Record<string, unknown>> {
  const listId = validateIdentity(allocation?.listId, "list");
  const request = intent?.fieldRequest;
  if (!request || request.kind !== "FieldID" || request.resourceScope !== intent.resourceScope || request.ordinal !== intent.fieldOrdinal) throw new Error("DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN");
  const fieldId = allocation?.fieldIdsByRequestId?.[request.requestId];
  if (fieldId === undefined) throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${request.requestId}`);
  const scope = allocation?.fieldScopesByRequestId?.[request.requestId];
  if (scope !== intent.resourceScope) throw new Error(`DATA_LIST_IDENTITY_SCOPE_MISMATCH: ${request.requestId}`);
  if (intent.requiredLookupTarget !== undefined && (!allocation.lookupResolution || typeof allocation.lookupResolution[intent.requiredLookupTarget] !== "string" || !allocation.lookupResolution[intent.requiredLookupTarget].trim())) {
    throw new Error(`DATA_LIST_LOOKUP_TARGET_UNRESOLVED: ${intent.requiredLookupTarget}`);
  }
  const validFieldId = validateIdentity(fieldId, request.requestId);
  const duplicate = Object.entries(allocation.fieldIdsByRequestId).find(([id, value]) => id !== request.requestId && value === validFieldId);
  if (duplicate) throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_COLLISION: ${duplicate[0]},${request.requestId}`);
  return Object.freeze({ FieldID: validFieldId, ListID: listId, ...intent.preIdFieldRecord });
}
function validateIdentity(value: unknown, key: string): string {
  if (value === undefined || value === null || value === "") throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${key}`);
  if (typeof value === "number") throw new Error(`DATA_LIST_IDENTITY_LOSSY_INPUT: ${key}`);
  if (typeof value !== "string") throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
  if (!/^\d{1,30}$/.test(value)) throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
  return value;
}
