type DataListSublistLookupAdditionalFieldIntent = Readonly<{
    source: Readonly<{
        fieldName: string;
        fieldId: string;
        order: string;
        relationName: string;
    }>;
    destination: Readonly<{
        id: string;
        readonly: true;
    }>;
}>;
export declare function lowerDataListSublistLookupAdditionalFieldIntentForTest(intent: DataListSublistLookupAdditionalFieldIntent): Readonly<Record<string, unknown>>;
export {};
//# sourceMappingURL=internal-data-list-sublist-lookup-additional-field-lowering.d.ts.map