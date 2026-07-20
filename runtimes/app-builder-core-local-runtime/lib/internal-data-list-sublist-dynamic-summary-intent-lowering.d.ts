export type DynamicSummaryOperation = "total" | "average" | "minimum" | "maximum" | "count";
export type DataListSublistDynamicSummaryHostIntent = Readonly<{
    surface: "data-list-sublist-dynamic-summary";
    scope: Readonly<{
        parentListId: string;
        layoutId: string;
        layoutResourceId: string;
        parentFieldId: string;
        sublistControlId: string;
        summaryId: string;
    }>;
    sourceColumn: Readonly<{
        id: string;
        idx: string;
        name: string;
        scalarType: "number" | "decimal";
    }>;
    summary: Readonly<{
        field: string;
        type: DynamicSummaryOperation;
        display: boolean;
    }>;
    binding: Readonly<{
        kind: "data-list-field" | "temp-variable";
        prefix: "__list_" | "__temp_";
        value: string;
        targetDescriptor: Readonly<{
            id: string;
            idx: string;
        }>;
    }>;
}>;
export type DataListSublistDynamicSummaryMetadata = Readonly<{
    id: string;
    field: string;
    type: DynamicSummaryOperation;
    display: boolean;
    binding: Readonly<{
        prefix: "__list_" | "__temp_";
        value: string;
    }>;
}>;
/** Lowers one frozen scope-resolved intent without resolving or mutating any host inventory. */
export declare function lowerDataListSublistDynamicSummaryIntentAtHost(intent: DataListSublistDynamicSummaryHostIntent): DataListSublistDynamicSummaryMetadata;
//# sourceMappingURL=internal-data-list-sublist-dynamic-summary-intent-lowering.d.ts.map