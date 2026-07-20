export type ScalarIdentityIntent = Readonly<{
    resourceScope: string;
    fieldOrdinal: number;
    fieldRequest: Readonly<{
        requestId: string;
        resourceScope: string;
        kind: string;
        ordinal: number;
    }>;
    preIdFieldRecord: Readonly<Record<string, unknown>>;
    requiredLookupTarget?: string;
}>;
export type ScalarIdentityAllocation = Readonly<{
    listId: string;
    fieldIdsByRequestId: Readonly<Record<string, string>>;
    fieldScopesByRequestId: Readonly<Record<string, string>>;
    lookupResolution?: Readonly<Record<string, string>>;
}>;
export declare function lowerDataListScalarResourceIdentityAtHost(intent: ScalarIdentityIntent, allocation: ScalarIdentityAllocation): Readonly<Record<string, unknown>>;
//# sourceMappingURL=internal-data-list-scalar-resource-identity-lowering.d.ts.map