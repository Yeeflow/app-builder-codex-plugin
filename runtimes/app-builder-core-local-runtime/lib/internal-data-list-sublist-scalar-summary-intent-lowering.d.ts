export type ScalarSummaryOperation = "total" | "average" | "minimum" | "maximum" | "count";
export type DataListSublistScalarSummaryHostIntent = Readonly<{
    summaryKey: string;
    summaryReference: string;
    sourceColumn: Readonly<{
        id: string;
        name: string;
        scalarType: string;
    }>;
    aggregateOperation: ScalarSummaryOperation;
    display: boolean;
    format: string;
}>;
export type DataListSublistScalarSummaryStaticMetadata = Readonly<{
    field: string;
    type: ScalarSummaryOperation;
    display: boolean;
    binding: null;
}>;
/** Lowers immutable static aggregate intent without any temporary-variable lifecycle or host binding. */
export declare function lowerDataListSublistScalarSummaryIntentAtHost(intent: DataListSublistScalarSummaryHostIntent): DataListSublistScalarSummaryStaticMetadata;
//# sourceMappingURL=internal-data-list-sublist-scalar-summary-intent-lowering.d.ts.map