export type DataListSublistEmbeddedLookupHostIntent = Readonly<{
    surface: "data-list-sublist-embedded-lookup";
    column: Readonly<{
        id: string;
        idx: string;
        name: string;
        type: "lookup";
        editable: boolean;
    }>;
    target: Readonly<{
        appId: 41;
        listId: string;
        listSetId: string;
        displayField: "Title";
        valueField: string;
    }>;
}>;
export type DataListSublistEmbeddedLookupHostBinding = Readonly<{
    controlId: string;
    parentBinding: string;
    parentControlId: string;
}>;
export declare function lowerDataListSublistEmbeddedLookupIntentAtHost(intent: DataListSublistEmbeddedLookupHostIntent, binding: DataListSublistEmbeddedLookupHostBinding): Readonly<Record<string, unknown>>;
//# sourceMappingURL=internal-data-list-sublist-embedded-lookup-lowering.d.ts.map