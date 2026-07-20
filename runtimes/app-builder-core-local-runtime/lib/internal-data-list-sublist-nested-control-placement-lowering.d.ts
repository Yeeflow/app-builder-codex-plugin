export type DataListSublistNestedControlPlacementHostIntent = Readonly<{
    readonly surface: "data-list-sublist-nested-control-placement";
    readonly placements: readonly Readonly<{
        readonly childControlReference: string;
        readonly column: Readonly<{
            readonly id: string;
            readonly idx: string;
            readonly name: string;
            readonly type: "text" | "date" | "number" | "boolean";
            readonly editable: boolean;
        }>;
        readonly control: Readonly<{
            readonly type: "input" | "datepicker" | "input_number" | "switch";
            readonly defaultValue: null | false;
        }>;
    }>[];
}>;
export type DataListSublistNestedControlHostBinding = Readonly<{
    readonly childControlReference: string;
    readonly controlId: string;
    readonly parentBinding: string;
    readonly parentControlId: string;
}>;
/** Lowers frozen intent and explicit host IDs to fresh metadata; it never loads or mutates a graph. */
export declare function lowerDataListSublistNestedControlPlacementAtHost(intent: DataListSublistNestedControlPlacementHostIntent, bindings: readonly DataListSublistNestedControlHostBinding[]): readonly Readonly<Record<string, unknown>>[];
//# sourceMappingURL=internal-data-list-sublist-nested-control-placement-lowering.d.ts.map