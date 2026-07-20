export type Type1IdentityPlacementIntent = Readonly<{
    templateId: string;
    templateScope: string;
    fieldsGridNodeRef: string;
    controlSlotRef: string;
    ordinal: number;
    descriptor: Readonly<Record<string, unknown>>;
}>;
export type Type1TemplateSnapshot = Readonly<{
    templateId: string;
    templateScope: string;
    nodes: readonly Readonly<{
        reference: string;
        scope: string;
        parentReference?: string;
    }>[];
    slots: readonly Readonly<{
        reference: string;
        scope: string;
        parentReference: string;
    }>[];
}>;
export type Type1IdentityPlacementHostContext = Readonly<{
    controlId: string;
}>;
export declare function lowerDataListType1IdentityControlPlacementAtHost(intent: Type1IdentityPlacementIntent, snapshot: Type1TemplateSnapshot, context: Type1IdentityPlacementHostContext): Readonly<Record<string, unknown>>;
//# sourceMappingURL=internal-data-list-type1-identity-control-placement-lowering.d.ts.map