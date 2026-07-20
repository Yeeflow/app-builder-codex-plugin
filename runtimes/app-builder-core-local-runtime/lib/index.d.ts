export declare const capabilityMetadata: {
    readonly packageName: "@yeeflow/app-builder-core-local-runtime";
    readonly version: "0.1.0";
    readonly capabilities: readonly ["Local Runtime capability metadata and explicit fixed-filter key allocation and findings lowering shadow support."];
};
export type { ScalarIdentityIntent, ScalarIdentityAllocation } from "./internal-data-list-scalar-resource-identity-lowering.js";
export { lowerDataListScalarResourceIdentityAtHost } from "./internal-data-list-scalar-resource-identity-lowering.js";
export type { HostDataListLookupIntent as DataListLookupHostIntent, DataListLookupTargetIdentityMap, DataListLookupSourceContext, DataListLookupResolutionResult, } from "./internal-data-list-lookup-resolution-lowering.js";
export { lowerDataListLookupResolutionAtHost } from "./internal-data-list-lookup-resolution-lowering.js";
export type { Type1IdentityPlacementIntent, Type1TemplateSnapshot, Type1IdentityPlacementHostContext, } from "./internal-data-list-type1-identity-control-placement-lowering.js";
export { lowerDataListType1IdentityControlPlacementAtHost } from "./internal-data-list-type1-identity-control-placement-lowering.js";
export type { SublistScalarRowSchemaIntent, SublistScalarRowSchemaHostContext, } from "./internal-data-list-sublist-scalar-row-schema-lowering.js";
export { lowerDataListSublistScalarRowSchemaAtHostInternal as lowerDataListSublistScalarRowSchemaAtHost } from "./internal-data-list-sublist-scalar-row-schema-lowering.js";
export type { DataListSublistScalarSummaryHostIntent, DataListSublistScalarSummaryStaticMetadata, } from "./internal-data-list-sublist-scalar-summary-intent-lowering.js";
export { lowerDataListSublistScalarSummaryIntentAtHost } from "./internal-data-list-sublist-scalar-summary-intent-lowering.js";
export type { DynamicSummaryOperation, DataListSublistDynamicSummaryHostIntent, DataListSublistDynamicSummaryMetadata } from "./internal-data-list-sublist-dynamic-summary-intent-lowering.js";
export { lowerDataListSublistDynamicSummaryIntentAtHost } from "./internal-data-list-sublist-dynamic-summary-intent-lowering.js";
export type { DataListSublistNestedControlPlacementHostIntent, DataListSublistNestedControlHostBinding } from "./internal-data-list-sublist-nested-control-placement-lowering.js";
export { lowerDataListSublistNestedControlPlacementAtHost } from "./internal-data-list-sublist-nested-control-placement-lowering.js";
export type { DataListSublistEmbeddedLookupHostIntent, DataListSublistEmbeddedLookupHostBinding } from "./internal-data-list-sublist-embedded-lookup-lowering.js";
export { lowerDataListSublistEmbeddedLookupIntentAtHost } from "./internal-data-list-sublist-embedded-lookup-lowering.js";
export type { DataListSublistIdentityControlHostIntent, DataListSublistIdentityControlHostBinding } from "./internal-data-list-sublist-identity-control-lowering.js";
export { lowerDataListSublistIdentityControlIntentAtHost } from "./internal-data-list-sublist-identity-control-lowering.js";
export type { DataListSublistChildResourceAllocation, DataListSublistChildResourceInventoryInput, DataListSublistChildResourceIdentityDescriptor, DataListSublistChildResourceInventory, SublistChildResourceIdentityError, } from "./internal-data-list-sublist-child-resource-inventory.js";
export { buildDataListSublistChildResourceInventoryInternal as buildDataListSublistChildResourceInventoryAtHost } from "./internal-data-list-sublist-child-resource-inventory.js";
type JsonValue = null | boolean | number | string | JsonValue[] | {
    readonly [key: string]: JsonValue;
};
export type HostFixedFilterIntent = Readonly<{
    requestId: string;
    ordinal: number;
    pre: "and" | "or";
    left: string;
    op: string;
    right: JsonValue;
    showCus?: boolean;
}>;
export type HostFixedFilterFinding = Readonly<{
    code: string;
    message: string;
    context: Readonly<Record<string, JsonValue>>;
}>;
export type HostFixedFilterProjection = Readonly<{
    intents: readonly HostFixedFilterIntent[];
    keyRequests: readonly Readonly<{
        requestId: string;
        ordinal: number;
    }>[];
    findings: readonly HostFixedFilterFinding[];
}>;
export type HostFixedFilterAllocation = Readonly<{
    keysByRequestId: Readonly<Record<string, string>>;
}>;
export type LoweredFixedFilterCondition = Readonly<{
    key: string;
    pre: "and" | "or";
    left: string;
    op: string;
    right: JsonValue;
    showCus?: boolean;
}>;
export type FixedFilterHostLoweringResult = Readonly<{
    filter: readonly LoweredFixedFilterCondition[];
    findings: readonly Readonly<Record<string, JsonValue>>[];
}>;
/**
 * Host-only lowering validates supplied opaque keys and performs the explicit
 * caller-owned findings append. It never allocates a fallback key.
 */
export declare function lowerFixedFilterProjectionAtHost(projection: HostFixedFilterProjection, allocation: HostFixedFilterAllocation, callerFindings?: Array<Readonly<Record<string, JsonValue>> | undefined> | null): FixedFilterHostLoweringResult;
//# sourceMappingURL=index.d.ts.map