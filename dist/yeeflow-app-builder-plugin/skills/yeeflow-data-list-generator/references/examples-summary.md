# Examples Summary

This skill intentionally summarizes examples instead of bundling bulky `.ydl`, `.yap`, or customer export files.

## Asset Inventory v5

Purpose: prove single-list generation.

Proved:

- generated standalone `.ydl` wrapper imports
- fields, views, sample rows, custom form, and form assignment work
- custom form controls render in designer
- `LayoutInResources[0].ID` and `RefId` must equal `LayoutID`

Use as the baseline for custom-form registration and usable form layout.

Source project artifacts:

- `asset-inventory-def.import-debug-v5.json`
- `asset-inventory.import-debug-v5.ydl` as test reference only
- `docs/generated-data-list-baseline-asset-inventory-v5.md`

## Departments -> Employees

Purpose: prove staged related-list lookup generation.

Proved:

- standalone related `.ydl` files should be imported in stages
- reference list is imported/exported first
- dependent lookup is patched to real exported-back metadata
- single lookup sample values are plain target `ListDataID` strings
- external lookup record IDs must not be in dependent `Resource.ReplaceIds`

Source project artifacts:

- `departments-def.draft.json`
- `employees-def.final-after-departments-v4-sample-lookups.json`
- `departments-employees-generation-plan.md`
- `docs/generated-related-data-lists-staged-lookup-pattern.md`

## NHIC Study

Purpose: learn real `.ydl` and `.yap` structures.

Studied lists:

- Portfolio Management
- Partner Management
- Communication Records

Observed:

- field/control type diversity
- lookup relationships
- views and Type 104 board-like view
- custom forms
- list workflows
- sample data shapes
- full `.yap` metadata resolves dependencies not present in the three standalone `.ydl` files

Reference summaries:

- `nhic-ydl-metadata.md`
- `nhic-yap-metadata.md`

## Visitor Access Management v11 Storage List Patterns

Source project references:

- `visitor-access-management-app-def.v11-five-fields-multitype.json`
- `docs/data-list-generator-operating-playbook.md`
- `docs/approval-form-and-yap-field-type-pattern-study.md`

Proves generated app-level child-list support for:

- `Text13` / `Text14` as text input storage
- `Decimal1` with `FieldType = "Decimal"` and `Type = "input_number"`
- `Text15` with text/radio-compatible choice storage
- `Bit1` with `FieldType = "Bit"` and `Type = "switch"`

Sample value shapes:

- Decimal: numeric values
- choice: selected option text
- Bit/switch: `"1"` or `"0"`

Use these when a generated approval form persists values into a generated request/storage list.
