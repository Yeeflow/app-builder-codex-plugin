export type DataListSublistIdentityControlHostIntent = Readonly<{
    surface: "data-list-sublist-identity-control";
    column: Readonly<{
        id: string;
        idx: string;
        name: string;
        type: "user";
        editable: boolean;
    }>;
    control: Readonly<{
        type: "identity-picker";
        displayLabel: readonly [null, true];
    }>;
}>;
export type DataListSublistIdentityControlHostBinding = Readonly<{
    controlId: string;
    parentBinding: string;
    parentControlId: string;
}>;
/** Lowers only fresh, static list-field metadata. Identity selection remains product-runtime owned. */
export declare function lowerDataListSublistIdentityControlIntentAtHost(intent: DataListSublistIdentityControlHostIntent, binding: DataListSublistIdentityControlHostBinding): Readonly<Record<string, unknown>>;
//# sourceMappingURL=internal-data-list-sublist-identity-control-lowering.d.ts.map