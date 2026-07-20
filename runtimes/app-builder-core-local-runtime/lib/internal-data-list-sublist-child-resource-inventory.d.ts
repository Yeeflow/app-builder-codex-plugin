/** Internal Phase 9B host-only identity-inventory shadow. It is not publicly exported. */
export declare const sublistChildResourceIdentityErrors: readonly ["SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING", "SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID", "SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY", "SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE", "SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH", "SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN", "SUBLIST_ROW_SCHEMA_IDENTITY_MISSING", "SUBLIST_ROW_SCHEMA_IDENTITY_INVALID", "SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE", "SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH", "SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN"];
export type SublistChildResourceIdentityError = (typeof sublistChildResourceIdentityErrors)[number];
export type DataListSublistChildResourceAllocation = Readonly<{
    fieldFamily: "sublist-scalar";
    parentListId: string;
    parentFieldId: string;
    childListId: string;
    childFieldId: string;
    rowSchemaId: string;
    childLogicalFieldKey: string;
    childOrdinal: number;
    parentScope: string;
    childScope: string;
    rowSchemaScope: string;
}>;
export type DataListSublistChildResourceInventoryInput = Readonly<{
    relationships: readonly DataListSublistChildResourceAllocation[];
}>;
export type DataListSublistChildResourceIdentityDescriptor = Readonly<{
    parentListId: string;
    parentFieldId: string;
    childListId: string;
    childFieldId: string;
    rowSchemaId: string;
    childLogicalFieldKey: string;
    childOrdinal: number;
    parentScope: string;
    childScope: string;
    rowSchemaScope: string;
}>;
export type DataListSublistChildResourceInventory = Readonly<{
    descriptors: readonly DataListSublistChildResourceIdentityDescriptor[];
    descriptorsByParentField: Readonly<Record<string, readonly DataListSublistChildResourceIdentityDescriptor[]>>;
}>;
/**
 * Validates host-supplied, post-allocation identities. This function has no
 * allocation authority and cannot infer a child resource from planning input.
 */
export declare function buildDataListSublistChildResourceInventoryInternal(input: DataListSublistChildResourceInventoryInput): DataListSublistChildResourceInventory;
//# sourceMappingURL=internal-data-list-sublist-child-resource-inventory.d.ts.map