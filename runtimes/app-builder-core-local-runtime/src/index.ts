export const capabilityMetadata = {
  packageName: "@yeeflow/app-builder-core-local-runtime",
  version: "0.1.0",
  capabilities: ["Local Runtime capability metadata and explicit fixed-filter key allocation and findings lowering shadow support."],
} as const;

export type { ScalarIdentityIntent, ScalarIdentityAllocation } from "./internal-data-list-scalar-resource-identity-lowering.js";
export { lowerDataListScalarResourceIdentityAtHost } from "./internal-data-list-scalar-resource-identity-lowering.js";

export type {
  HostDataListLookupIntent as DataListLookupHostIntent,
  DataListLookupTargetIdentityMap,
  DataListLookupSourceContext,
  DataListLookupResolutionResult,
} from "./internal-data-list-lookup-resolution-lowering.js";
export { lowerDataListLookupResolutionAtHost } from "./internal-data-list-lookup-resolution-lowering.js";

export type {
  Type1IdentityPlacementIntent,
  Type1TemplateSnapshot,
  Type1IdentityPlacementHostContext,
} from "./internal-data-list-type1-identity-control-placement-lowering.js";
export { lowerDataListType1IdentityControlPlacementAtHost } from "./internal-data-list-type1-identity-control-placement-lowering.js";

export type {
  SublistScalarRowSchemaIntent,
  SublistScalarRowSchemaHostContext,
} from "./internal-data-list-sublist-scalar-row-schema-lowering.js";
export { lowerDataListSublistScalarRowSchemaAtHostInternal as lowerDataListSublistScalarRowSchemaAtHost } from "./internal-data-list-sublist-scalar-row-schema-lowering.js";

export type {
  DataListSublistScalarSummaryHostIntent,
  DataListSublistScalarSummaryStaticMetadata,
} from "./internal-data-list-sublist-scalar-summary-intent-lowering.js";
export { lowerDataListSublistScalarSummaryIntentAtHost } from "./internal-data-list-sublist-scalar-summary-intent-lowering.js";

export type { DynamicSummaryOperation, DataListSublistDynamicSummaryHostIntent, DataListSublistDynamicSummaryMetadata } from "./internal-data-list-sublist-dynamic-summary-intent-lowering.js";
export { lowerDataListSublistDynamicSummaryIntentAtHost } from "./internal-data-list-sublist-dynamic-summary-intent-lowering.js";

export type { DataListSublistNestedControlPlacementHostIntent, DataListSublistNestedControlHostBinding } from "./internal-data-list-sublist-nested-control-placement-lowering.js";
export { lowerDataListSublistNestedControlPlacementAtHost } from "./internal-data-list-sublist-nested-control-placement-lowering.js";
export type { DataListSublistEmbeddedLookupHostIntent, DataListSublistEmbeddedLookupHostBinding } from "./internal-data-list-sublist-embedded-lookup-lowering.js";
export { lowerDataListSublistEmbeddedLookupIntentAtHost } from "./internal-data-list-sublist-embedded-lookup-lowering.js";
export type { DataListSublistIdentityControlHostIntent, DataListSublistIdentityControlHostBinding } from "./internal-data-list-sublist-identity-control-lowering.js";
export { lowerDataListSublistIdentityControlIntentAtHost } from "./internal-data-list-sublist-identity-control-lowering.js";

export type {
  DataListSublistChildResourceAllocation,
  DataListSublistChildResourceInventoryInput,
  DataListSublistChildResourceIdentityDescriptor,
  DataListSublistChildResourceInventory,
  SublistChildResourceIdentityError,
} from "./internal-data-list-sublist-child-resource-inventory.js";
export { buildDataListSublistChildResourceInventoryInternal as buildDataListSublistChildResourceInventoryAtHost } from "./internal-data-list-sublist-child-resource-inventory.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { readonly [key: string]: JsonValue };

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
  keyRequests: readonly Readonly<{ requestId: string; ordinal: number }>[];
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
export function lowerFixedFilterProjectionAtHost(projection: HostFixedFilterProjection, allocation: HostFixedFilterAllocation, callerFindings: Array<Readonly<Record<string, JsonValue>> | undefined> | null = null): FixedFilterHostLoweringResult {
  const requests = [...projection.keyRequests].sort((left, right) => left.ordinal - right.ordinal);
  const keys = allocation?.keysByRequestId;
  const values = new Map<string, string>();
  for (const request of requests) {
    const key = keys?.[request.requestId];
    if (key === undefined) throw new Error(`FIXED_FILTER_KEY_ALLOCATION_MISSING: ${request.requestId}`);
    if (typeof key !== "string" || !key.trim()) throw new Error(`FIXED_FILTER_KEY_ALLOCATION_INVALID: ${request.requestId}`);
    const prior = values.get(key);
    if (prior && prior !== request.requestId) throw new Error(`FIXED_FILTER_KEY_ALLOCATION_COLLISION: ${prior},${request.requestId}`);
    values.set(key, request.requestId);
  }
  const filters = projection.intents
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((intent) => Object.freeze({
      key: keys[intent.requestId] as string,
      pre: intent.pre,
      left: intent.left,
      op: intent.op,
      right: intent.right,
      ...(intent.showCus === undefined ? {} : { showCus: intent.showCus }),
    }));
  const findings = projection.findings.map((finding) => Object.freeze({ level: "error", code: finding.code, message: finding.message, ...finding.context }));
  if (callerFindings) for (const finding of findings) callerFindings.push(finding);
  return Object.freeze({ filter: Object.freeze(filters), findings: Object.freeze(findings) });
}
