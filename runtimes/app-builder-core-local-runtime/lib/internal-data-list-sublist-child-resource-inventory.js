/** Internal Phase 9B host-only identity-inventory shadow. It is not publicly exported. */
export const sublistChildResourceIdentityErrors = [
    "SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH",
    "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN",
    "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING",
    "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID",
    "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE",
    "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH",
    "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN",
];
/**
 * Validates host-supplied, post-allocation identities. This function has no
 * allocation authority and cannot infer a child resource from planning input.
 */
export function buildDataListSublistChildResourceInventoryInternal(input) {
    if (!input || !Array.isArray(input.relationships))
        fail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
    const seenLogical = new Set();
    const seenChildFields = new Set();
    const parentToChild = new Map();
    const childToParent = new Map();
    const rowSchemaOwners = new Map();
    const seenRowOrdinals = new Set();
    const descriptors = input.relationships.map((allocation) => {
        if (!allocation || allocation.fieldFamily !== "sublist-scalar")
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
        const parentListId = identity(allocation.parentListId, "child");
        const parentFieldId = identity(allocation.parentFieldId, "child");
        const childListId = identity(allocation.childListId, "child");
        const childFieldId = identity(allocation.childFieldId, "child");
        const rowSchemaId = identity(allocation.rowSchemaId, "row");
        if (!logicalKey(allocation.childLogicalFieldKey) || !Number.isInteger(allocation.childOrdinal) || allocation.childOrdinal < 0)
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID");
        if (parentListId === childListId || parentFieldId === childFieldId)
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN");
        const parentScope = `data-list:${parentListId}`;
        const childScope = `data-list:${childListId}`;
        const rowSchemaScope = `${childScope}:row-schema:${rowSchemaId}`;
        if (allocation.parentScope !== parentScope || allocation.childScope !== childScope)
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH");
        if (allocation.rowSchemaScope !== rowSchemaScope)
            fail("SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH");
        const parentKey = `${parentListId}:${parentFieldId}`;
        const childKey = `${childListId}:${childFieldId}`;
        const rowSchemaKey = `${childListId}:${rowSchemaId}`;
        const logical = `${parentKey}:${allocation.childLogicalFieldKey}`;
        const rowOrdinal = `${parentKey}:${rowSchemaId}:${allocation.childOrdinal}`;
        if (seenLogical.has(logical) || seenChildFields.has(childKey))
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE");
        if (seenRowOrdinals.has(rowOrdinal))
            fail("SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE");
        const knownChild = parentToChild.get(parentKey);
        if (knownChild && knownChild !== `${childListId}:${rowSchemaId}`)
            fail("SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN");
        const knownParent = childToParent.get(childListId);
        if (knownParent && knownParent !== parentKey)
            fail("SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN");
        const knownRowSchemaOwner = rowSchemaOwners.get(rowSchemaKey);
        if (knownRowSchemaOwner && knownRowSchemaOwner !== parentKey)
            fail("SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE");
        seenLogical.add(logical);
        seenChildFields.add(childKey);
        seenRowOrdinals.add(rowOrdinal);
        parentToChild.set(parentKey, `${childListId}:${rowSchemaId}`);
        childToParent.set(childListId, parentKey);
        rowSchemaOwners.set(rowSchemaKey, parentKey);
        return Object.freeze({ parentListId, parentFieldId, childListId, childFieldId, rowSchemaId, childLogicalFieldKey: allocation.childLogicalFieldKey, childOrdinal: allocation.childOrdinal, parentScope, childScope, rowSchemaScope });
    }).sort(compare);
    const byParentField = {};
    for (const descriptor of descriptors) {
        const key = `${descriptor.parentListId}:${descriptor.parentFieldId}`;
        byParentField[key] = Object.freeze([...(byParentField[key] || []), descriptor]);
    }
    return deepFreeze({ descriptors: Object.freeze(descriptors), descriptorsByParentField: byParentField });
}
function identity(value, family) {
    const prefix = family === "row" ? "SUBLIST_ROW_SCHEMA_IDENTITY" : "SUBLIST_CHILD_RESOURCE_IDENTITY";
    if (value === undefined || value === null)
        fail(`${prefix}_MISSING`);
    if (typeof value === "number" || typeof value === "bigint")
        fail("SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY");
    if (typeof value !== "string" || !value.trim() || !/^\d{16,30}$/.test(value))
        fail(`${prefix}_INVALID`);
    return value;
}
function logicalKey(value) { return typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value); }
function compare(left, right) { return left.parentListId.localeCompare(right.parentListId) || left.parentFieldId.localeCompare(right.parentFieldId) || left.childOrdinal - right.childOrdinal || left.childLogicalFieldKey.localeCompare(right.childLogicalFieldKey); }
function fail(code) { throw new Error(code); }
function deepFreeze(value) { if (value && typeof value === "object") {
    for (const child of Object.values(value))
        deepFreeze(child);
    Object.freeze(value);
} return value; }
//# sourceMappingURL=internal-data-list-sublist-child-resource-inventory.js.map