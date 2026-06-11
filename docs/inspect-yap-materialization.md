# inspect-yap-materialization.mjs

`scripts/inspect-yap-materialization.mjs` is a focused read-only inspection for generated Yeeflow `.yap` packages that may pass syntax validation but import as an empty app shell or as lists without fields.

## Usage

```bash
node scripts/inspect-yap-materialization.mjs custom-code-template-showcase.v1.yap
node scripts/inspect-yap-materialization.mjs custom-code-template-showcase.v1.yap --out custom-code-template-showcase.v1.materialization-inspection.json
```

## YAP App Materialization Rules

The inspector checks the learned materialization rules:

- Every `ListID` must be unique through app graph validation.
- Every `FieldID` must be unique across the whole application.
- Every `field.ListID` must equal the parent data list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list; duplicate display names are reported as materialization-risk warnings.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` as generated app-resource IDs.
- Do not include `TenantID`, `CreatedBy`, or `ModifiedBy` in `Resource.ReplaceIds`.
- Root Type `103` dashboard navigation must point to an existing root layout.
- Root Type `103` dashboard layouts must be owned by the root app/ListSet `ListID`.
- Child lists must be reachable from root navigation.
- Child list layouts and fields must be owned by their parent list.
- Approval forms must use `Data.Forms[].ListID = 0` and be represented in root navigation when present.

Use this inspection before Yeeflow runtime import. If it fails, do not proceed to custom-code component runtime testing.
