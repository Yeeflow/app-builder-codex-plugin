export type HostDataListLookupIntent = Readonly<{
    surface: "data-list";
    sourceResourceKey: string;
    sourceFieldKey: string;
    sourceFieldOrdinal: number;
    declaredTargetKey: string;
    displayField: "Title";
    resolutionRequest: Readonly<{
        requestId: string;
        sourceResourceKey: string;
        sourceFieldKey: string;
        sourceFieldOrdinal: number;
        candidateKeys: readonly string[];
    }>;
}>;
export type DataListLookupTargetIdentityMap = Readonly<{
    targetListIdsByLogicalKey: Readonly<Record<string, unknown>>;
    targetScopesByLogicalKey: Readonly<Record<string, unknown>>;
}>;
export type DataListLookupSourceContext = Readonly<{
    sourceListId: unknown;
    sourceFieldId: unknown;
    sourceFieldListId: unknown;
}>;
export type DataListLookupResolutionResult = Readonly<{
    rules: string;
    targetListId: string;
    matchedCandidateKey: string;
}>;
/**
 * Internal-only host lowering. The host owns target maps, validates them, and
 * returns a fresh Legacy-shaped Rules payload without mutating any input.
 */
export declare function lowerDataListLookupResolutionAtHost(intent: HostDataListLookupIntent, targetMap: DataListLookupTargetIdentityMap, source: DataListLookupSourceContext): DataListLookupResolutionResult;
//# sourceMappingURL=internal-data-list-lookup-resolution-lowering.d.ts.map