# Document Library YAPK Contract Alignment Training Report

## Scope

This focused training aligns native Document Library generation with the three generated-final signing gates that previously assumed normal Data List resources.

The triggering 0.9.41 E2E evidence proved that full-app materialization correctly generated a native Type `16` Document Library and Type `16` navigation, but pre-sign validation still rejected the package.

## Root Cause

The failure was validator contract drift:

- `validate-yapk-package.js` applied the normal Data List `FieldType` enum to native Document Library support fields and rejected `Bigint1` / `Bigint2`.
- `validate-standard-package-schema.mjs` applied normal `ListFieldInfo` system-field constraints to every Type `16` support field.
- `validate-yapk-navigation-runtime-metadata.mjs` supported only resource types `103`, `105`, and `1`, even though Document Library navigation is export-proven as Type `16`.
- `validate-data-list-system-schema.mjs` and `validate-generated-yapk-export-shape.mjs` forced normal Data List `Title.Status = 0` onto Type `16` Document Libraries, whose native Title metadata uses `Status = 1`.

The materializer output itself already matched the export-proven Document Library contract. Rewriting Bigint fields to Decimal or forcing Document Library Title metadata to the Data List shape would hide the validator defect and damage the resource contract.

## Implemented Contract

- Preserve Type `16` native fields: `Title`, `Bigint1`, `Text1`, `Bigint2`, `Text2`, `Text3`, and `Text4`.
- Accept `Bigint` only for `Bigint1` and `Bigint2` when the owning child resource is Type `16`.
- Keep Bigint invalid on normal Type `1` Data Lists.
- Apply a validation-only Type `16` projection when running the canonical generic `ListFieldInfo` schema. Never write the projected field names or flags back to the package.
- Accept navigation Type `16` only when its `ListID` resolves to an included Type `16` child resource.
- Reject Type `16` navigation that points to a Type `1` list.
- Require `Title.Status = 1` for Type `16` Document Libraries and continue requiring `Title.Status = 0` for Type `1` Data Lists.

## Regression Coverage

`scripts/test-document-library-materialization-gates.mjs` now proves:

- App Plan Document Library rows materialize as native Type `16` resources.
- Native upload field `Text4` remains present.
- Native Bigint support fields pass package and canonical-schema gates without Resource mutation.
- Type `16` navigation passes runtime metadata validation.
- Bigint remains invalid on Type `1` Data Lists.
- Type `16` navigation cannot target Type `1` resources.
- Data-list system-schema and generated-export-shape gates preserve the distinct Data List and Document Library Title status contracts.

The original 0.9.41 generated-final package is also used as a local real-failure regression and now passes the three focused validators without applying the repaired-candidate Decimal coercion.

## Proof Boundary

This training is validator-backed and regression-backed. It removes false signing blockers for an export-proven Type `16` resource shape. It does not by itself prove a new install, Version Management success, browser navigation, upload persistence, or Document Library runtime behavior for the Internal Audit application.
