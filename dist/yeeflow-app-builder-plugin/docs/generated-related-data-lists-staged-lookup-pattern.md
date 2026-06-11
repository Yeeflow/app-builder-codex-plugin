# Generated Related Data Lists: Staged Lookup Pattern

This document records the successful Departments -> Employees staged `.ydl` generation pattern for related standalone Yeeflow data lists with lookup sample data.

## 1. Departments -> Employees Staged Result

The successful flow was:

1. Generate the independent reference list first: `Departments`.
2. Import `Departments` into the sandbox.
3. Export `Departments` back from Yeeflow.
4. Decode the exported-back package and extract the real remapped metadata:
   - `AppID`
   - `ListSetID`
   - `ListID`
   - display field, such as `Title`
   - sample/reference row `ListDataID` values
5. Patch the dependent list: `Employees`.
6. Configure `Employees.Department` as a lookup to the real imported `Departments` list.
7. Use real imported Department record `ListDataID` values in Employee sample data.
8. Exclude those external Department IDs from the Employees wrapper `Resource.ReplaceIds`.
9. Validate and build the Employees wrapper.
10. Import Employees and verify sample rows display Department values correctly.

This proved that related standalone `.ydl` packages can be generated safely when imported in stages and patched with export-back metadata.

## 2. Correct Lookup Sample Value Shape

For a single lookup field, the sample data value is a plain string containing the target record `ListDataID`.

Example:

```json
{
  "Text4": "2053735610870284294"
}
```

No extra JSON object, display cache, label value, or lookup metadata object is required.

In the successful Employees test:

| Employee | Department | Department `ListDataID` |
| --- | --- | --- |
| Avery Lim | Information Technology | `2053735610870284293` |
| Jamie Koh | Human Resources | `2053735610870284294` |
| Morgan Tan | Finance | `2053735610870284295` |

## 3. ReplaceIds Rule

`Resource.ReplaceIds` tells Yeeflow which IDs should be remapped during standalone import.

Local generated IDs should be included in `Resource.ReplaceIds`, including:

- generated list IDs
- generated field IDs
- generated layout IDs
- generated custom form resource IDs
- generated sample row `ListDataID` values for the list being imported

External resolved dependency IDs must not be included in `Resource.ReplaceIds`, including:

- external lookup target `ListSetID`
- external lookup target `ListID`
- external lookup target display field `FieldID`
- external lookup target record `ListDataID` values used by sample data

If external lookup record IDs are included in `Resource.ReplaceIds`, Yeeflow remaps them during standalone import. The dependent sample rows then point to newly remapped IDs that do not exist in the already-imported reference list, and the lookup displays as `(Deleted)`.

## 3.1 App-Level `.yap` Internal Lookup Contrast

The standalone `.ydl` rule above applies when the lookup target records already exist outside the dependent package.

For an app-level `.yap` package where both the lookup target list and dependent list are packaged together, the rule is different:

- target sample record IDs are local package IDs
- target sample record IDs should be included in `Resource.ReplaceIds`
- dependent sample lookup values may reference those local target sample record IDs
- Yeeflow remaps target records and dependent lookup values together during app import

This was confirmed by the `Department Access Management_v5` export-back:

| Request | Generated lookup value | Exported-back lookup value | Exported target exists |
| --- | --- | --- | --- |
| DAR-1001 | `2060010000000011001` | `2053789859452960773` | yes |
| DAR-1002 | `2060010000000011002` | `2053789859452960774` | yes |
| DAR-1003 | `2060010000000011003` | `2053789859452960775` | yes |

If the grid display appears blank even though exported-back lookup values match exported-back target records, classify it as a runtime display/index/cache issue unless the item form lookup value or manually edited row is also broken.

## 4. Validator And Builder Updates

`validate-ydl-list.js` now supports resolved external lookup sample values when a dependency map is provided.

It allows non-empty external lookup sample values only when:

- the dependency map resolves the lookup target list
- the dependency map provides target sample/reference record IDs
- the sample lookup value matches one of those target record IDs

It fails when:

- external lookup sample values are unknown
- target reference records are not declared
- a wrapper contains external lookup sample values in `Resource.ReplaceIds`

`build-ydl-wrapper.js` now uses the dependency map to exclude resolved external IDs from `Resource.ReplaceIds`.

This keeps local generated IDs remappable while preserving already-imported external dependency IDs.

## 5. Safe Generation Rules

For standalone `.ydl` packages with external lookup sample data:

- Require a dependency map.
- Require target list metadata.
- Require target display field metadata.
- Require target sample/reference record IDs.
- Use real target `ListDataID` values in the dependent list sample rows.
- Exclude those target IDs from the dependent package `Resource.ReplaceIds`.
- Validate the decoded draft before build.
- Validate the wrapper after build.
- Do not build if lookup records are unresolved.

If reference records are unavailable, either omit sample rows or leave the lookup field empty in sample rows.

## 6. Sandbox Checklist

Use this checklist for related standalone `.ydl` tests:

1. Import the reference list first.
2. Confirm reference sample records import.
3. Export the reference list back from Yeeflow.
4. Extract the remapped reference `ListSetID`, `ListID`, display field, and record `ListDataID` values.
5. Patch the dependent list lookup Rules.
6. Patch dependent sample rows with real target `ListDataID` values if sample lookup data is required.
7. Build the dependent wrapper with the dependency map.
8. Confirm external target IDs are absent from dependent `Resource.ReplaceIds`.
9. Import the dependent list.
10. Verify the lookup field opens and searches the reference list.
11. Verify sample rows display lookup values instead of `(Deleted)`.
12. Export the dependent list back.
13. Confirm exported-back lookup values remain the real target `ListDataID` values.

## 7. Packaging Boundary

This staged pattern is suitable for sandbox testing of related standalone `.ydl` packages.

For multi-list production packages, app-level `.yap` generation may be safer because Yeeflow can remap related resources inside one application package. Until app-level package generation is proven, use staged `.ydl` import/export for related lists.
