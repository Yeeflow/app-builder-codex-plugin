export function lowerDataListScalarResourceIdentityAtHost(intent, allocation) {
    const listId = validateIdentity(allocation?.listId, "list");
    const request = intent?.fieldRequest;
    if (!request || request.kind !== "FieldID" || request.resourceScope !== intent.resourceScope || request.ordinal !== intent.fieldOrdinal)
        throw new Error("DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN");
    const fieldId = allocation?.fieldIdsByRequestId?.[request.requestId];
    if (fieldId === undefined)
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${request.requestId}`);
    const scope = allocation?.fieldScopesByRequestId?.[request.requestId];
    if (scope !== intent.resourceScope)
        throw new Error(`DATA_LIST_IDENTITY_SCOPE_MISMATCH: ${request.requestId}`);
    if (intent.requiredLookupTarget !== undefined && (!allocation.lookupResolution || typeof allocation.lookupResolution[intent.requiredLookupTarget] !== "string" || !allocation.lookupResolution[intent.requiredLookupTarget].trim())) {
        throw new Error(`DATA_LIST_LOOKUP_TARGET_UNRESOLVED: ${intent.requiredLookupTarget}`);
    }
    const validFieldId = validateIdentity(fieldId, request.requestId);
    const duplicate = Object.entries(allocation.fieldIdsByRequestId).find(([id, value]) => id !== request.requestId && value === validFieldId);
    if (duplicate)
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_COLLISION: ${duplicate[0]},${request.requestId}`);
    return Object.freeze({ FieldID: validFieldId, ListID: listId, ...intent.preIdFieldRecord });
}
function validateIdentity(value, key) {
    if (value === undefined || value === null || value === "")
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_MISSING: ${key}`);
    if (typeof value === "number")
        throw new Error(`DATA_LIST_IDENTITY_LOSSY_INPUT: ${key}`);
    if (typeof value !== "string")
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
    if (!/^\d{1,30}$/.test(value))
        throw new Error(`DATA_LIST_IDENTITY_ALLOCATION_INVALID: ${key}`);
    return value;
}
//# sourceMappingURL=internal-data-list-scalar-resource-identity-lowering.js.map