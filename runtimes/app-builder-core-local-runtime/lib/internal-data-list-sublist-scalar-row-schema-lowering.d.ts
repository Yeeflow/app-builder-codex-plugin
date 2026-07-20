/** Internal Phase 8B host lowering shadow. It is not a public runtime export. */
export type SublistScalarRowSchemaIntent = Readonly<{
    parentListId: string;
    childListId: string;
    parentFieldId: string;
    childFieldId: string;
    rowSchemaId: string;
    templateScope: string;
    rows: readonly Readonly<{
        idx: string;
        id: string;
        name: string;
        displayName: string;
        type: string;
        editable: boolean;
        controlType: string;
        ordinal: number;
    }>[];
}>;
export type SublistScalarRowSchemaHostContext = Readonly<{
    parentListId: string;
    childListId: string;
    parentFieldId: string;
    childFieldId: string;
    rowSchemaId: string;
    templateScope: string;
    parentNodes: readonly Readonly<{
        reference: string;
        scope: string;
        parentListId: string;
    }>[];
    rowSchemas: readonly Readonly<{
        reference: string;
        scope: string;
        parentFieldId: string;
        childListId: string;
    }>[];
}>;
export declare function lowerDataListSublistScalarRowSchemaAtHostInternal(intent: SublistScalarRowSchemaIntent, context: SublistScalarRowSchemaHostContext): readonly Readonly<Record<string, unknown>>[];
//# sourceMappingURL=internal-data-list-sublist-scalar-row-schema-lowering.d.ts.map