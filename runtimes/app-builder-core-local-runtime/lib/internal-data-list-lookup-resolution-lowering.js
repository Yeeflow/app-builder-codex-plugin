/**
 * Internal-only host lowering. The host owns target maps, validates them, and
 * returns a fresh Legacy-shaped Rules payload without mutating any input.
 */
export function lowerDataListLookupResolutionAtHost(intent, targetMap, source) {
    if (!intent || intent.surface !== "data-list" || !intent.resolutionRequest)
        throw new Error("DATA_LIST_LOOKUP_TARGET_UNRESOLVED");
    if (!intent.declaredTargetKey || intent.resolutionRequest.candidateKeys.length === 0)
        throw new Error("DATA_LIST_LOOKUP_TARGET_UNRESOLVED");
    validateSourceContext(source);
    const matches = intent.resolutionRequest.candidateKeys
        .map((candidate) => ({ candidate, listId: targetMap?.targetListIdsByLogicalKey?.[candidate] }))
        .filter((entry) => entry.listId !== undefined);
    if (!matches.length)
        throw new Error(`LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING: ${intent.declaredTargetKey}`);
    if (matches.length > 1)
        throw new Error(`LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS: ${matches.map((entry) => entry.candidate).join(",")}`);
    const matched = matches[0];
    const targetListId = validateLosslessId(matched.listId, matched.candidate);
    const expectedScope = `data-list:${targetListId}`;
    if (targetMap?.targetScopesByLogicalKey?.[matched.candidate] !== expectedScope) {
        throw new Error(`LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH: ${matched.candidate}`);
    }
    return Object.freeze({
        rules: JSON.stringify({ listid: targetListId, listfield: "Title", displayField: intent.displayField, fieldName: intent.displayField, listtype: "select" }),
        targetListId,
        matchedCandidateKey: matched.candidate,
    });
}
function validateSourceContext(source) {
    const sourceListId = validateLosslessId(source?.sourceListId, "source-list");
    validateLosslessId(source?.sourceFieldId, "source-field");
    const sourceFieldListId = validateLosslessId(source?.sourceFieldListId, "source-field-list");
    if (sourceListId !== sourceFieldListId)
        throw new Error("LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN");
}
function validateLosslessId(value, key) {
    if (typeof value !== "string" || !/^\d{1,30}$/.test(value))
        throw new Error(`LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID: ${key}`);
    return value;
}
//# sourceMappingURL=internal-data-list-lookup-resolution-lowering.js.map