# Generated `.yap` Baseline: Visitor Access Management v5 Fresh-Compatible

This document records the first successful generated Visitor Access Management app-level `.yap` baseline.

## 1. Test Summary

The Visitor Access Management learning track proved an important app-level packaging rule: structural compatibility must be paired with fresh local IDs and fresh approval form keys.

Observed sequence:

- Earlier expanded Visitor app packages failed during import with `Created failed`.
- Isolation packages also failed, including reduced packages with only Departments, two lists without forms, blank request lookup samples, and full package without request samples.
- A control package based directly on the known-working Department Access Management v5 structure imported successfully.
- `visitor-access-management.v4-v5-compatible.yap` imported but opened as a blank app. It reused the old `206...` generated ID family and the `DAR` approval form key from an already-imported generated app.
- `visitor-access-management.v5-fresh-compatible.yap` imported and opened successfully after switching to a fresh local ID family and a fresh form key.

This means Yeeflow can accept a package whose root shell is close enough to import while still leaving components detached if IDs or form keys collide with already-imported generated artifacts.

## 2. Working Package

Working package:

```text
visitor-access-management.v5-fresh-compatible.yap
```

Working decoded source:

```text
visitor-access-management-app-def.v5-fresh-compatible.json
```

Confirmed sandbox result:

- App imports.
- App opens from the workspace card.
- App header and navigation render.
- `Departments` list opens.
- `Departments` list shows 3 sample departments.
- `Visitor Access Requests` list opens from navigation.
- `Visitor Access Request` approval form opens from navigation.

## 3. What The Working Baseline Includes

The v5 fresh-compatible baseline includes:

- root app shell
- root Type `103` app page/navigation structure
- `Departments` data list
- `Visitor Access Requests` data list
- Department lookup in the proven request-list `Text2` field slot
- Department Code in `Text3`
- Visit Purpose in `Text4`
- Visit Date in `Datetime2`
- Visitor Access Request approval form
- approval workflow `ContentList` persistence to `Visitor Access Requests`
- fresh approval page UUIDs
- fresh workflow node IDs
- fresh form key `VAV`

The working baseline intentionally stays close to the proven Department Access Management v5-compatible schema. It does not yet use the expanded 16-field Visitor request schema.

## 4. Key Rules Learned

Fresh ID and key rules:

- Each generated `.yap` app test should use a fresh local ID family.
- Each generated approval form inside a `.yap` should use a fresh FlowKey/form key.
- Do not reuse a local ID family from an already-imported generated app.
- Do not reuse an approval form key from an already-imported generated app unless intentionally updating the same app and the update behavior is understood.
- Reused IDs can import but leave the app blank or components detached.
- Use the proven v5-compatible app schema as the expansion baseline.

Native `Title` field rule:

- Keep `FieldName: "Title"` as Yeeflow's native primary/display field in every generated child data list.
- The required pattern is `Status: 0`, `IsSystem: true`, and `IsIndex: true`.
- Business labels such as `Request No.`, `Name`, or `Department Name` may be displayed on `Title`, but the metadata must remain native/system/indexed.
- Heep Hong IT eWorkflow Option A v7 proved that treating `Title` as a normal custom field can import and render metadata while breaking the row-data query endpoint. Option A v8 fixed that by restoring this baseline pattern.

Generator implication:

- A generated package should not be considered sandbox-ready only because local validators pass.
- The generator should track recently generated/imported ID families when that information is available.
- The generator should warn or fail when a new app package reuses a known generated/imported app ID family or form key.

## 5. Current Unproven Area

The expanded Visitor request schema is still unproven.

Known facts:

- The expanded 16-field Visitor request schema failed during import.
- The exact failing field/control pattern is not yet known.
- The successful v5 baseline uses the smaller v5-compatible schema and the proven field slots.

Future expansion should proceed one field at a time. Do not jump directly from the working v5-compatible baseline to a wide request schema.

## 6. Validator And Generator Recommendations

Recommended validator checks:

- Warn or fail if a generated app uses an ID family already seen in prior generated/imported test artifacts, when detectable.
- Warn or fail if a generated approval form reuses a FlowKey/form key already seen in prior generated/imported app tests, when detectable.
- Report ID family prefixes in validation output so humans can spot accidental reuse.
- Treat fresh generated ID families as a sandbox-readiness requirement for app-level package tests.

Recommended generator rules:

- Allocate a fresh root ListSetID/app ID family for every new app-level `.yap` test.
- Allocate fresh child list IDs, field IDs, layout IDs, sample record IDs, approval form IDs, page IDs, and workflow node IDs from that family.
- Allocate a fresh short form key per generated approval form, such as `VAV` for Visitor Access Request.
- Keep internal references consistent before build and include local IDs in `ReplaceIds`.
- Do not use a prior generated package as a template by only changing labels while preserving IDs, unless the goal is a controlled import/update experiment.

## 7. Visitor Access v6 Expansion Plan

Recommended next expansion test:

1. Start from `visitor-access-management.v5-fresh-compatible.yap`.
2. Add exactly one additional field to the `Visitor Access Requests` list.
3. Add the corresponding approval form variable/control only if the field should be collected on the request page.
4. Add the corresponding `ContentList` mapping only if the field should persist after approval.
5. Run component validation.
6. Run `validate-yap-package.js` in generator/final mode.
7. Run `validate-yap-graph.js` in generator/final mode.
8. Build a new `.yap` wrapper only after validation passes.
9. Import-test in sandbox.
10. Export back and compare before adding the next field.

Repeat one field at a time until the failing field/control pattern is identified.

## 8. Sandbox Checklist

For every Visitor Access expansion package:

- Import package.
- Confirm import popup shows logo, name, and description.
- Confirm app card appears.
- Open the app from the workspace card.
- Confirm root header and navigation render.
- Open `Departments`.
- Open `Visitor Access Requests`.
- Open `Visitor Access Request` approval form.
- Submit or draft-test the form if workflow testing is in scope.
- Export the app back.
- Compare app shell, child resources, approval form registration, navigation, `ReplaceIds`, and remapped IDs.

## 9. v6 One-Field Expansion Result

The first v6 package added exactly one new field, `Visitor Name`, to the working Visitor Access baseline.

Intended v6 change:

- Add `Visitor Name` to the `Visitor Access Requests` data list.
- Use field slot `Text8`.
- Preserve proven fields:
  - `Text2`: Department lookup
  - `Text3`: Department Code
  - `Text4`: Visit Purpose
  - `Datetime2`: Visit Date
- Add `Visitor Name` to the custom list form.
- Add `VisitorName` to the approval form request page.
- Add readonly `VisitorName` to the approval page.
- Add `VisitorName -> Text8` to workflow `ContentList` persistence.
- Add safe sample values.

### v6 Failure Lesson

The initial v6 package imported and opened, and the data lists appeared, but the `Visitor Access Request` approval form was missing from navigation.

Root cause:

```json
"ListID": "2100030000000000001"
```

The generated app-level approval form row incorrectly set `Data.Forms[0].ListID` to the approval form `ProcModelID`.

Correct rule:

```json
"ListID": 0
```

For app-level approval form registration inside `.yap`, `Data.Forms[].ListID` must remain `0`. The approval form identity belongs in `ProcModelID`, not `ListID`.

### v6 Formfix Lesson

Changing `Data.Forms[0].ListID` back to `0` was structurally correct, and the validator was updated to catch the earlier mistake.

However, the formfix package reused the same `210...` ID family and `VAN` form key after the broken v6 package had already been imported. That package opened as a blank/detached app shell.

Rule reinforced:

- After any generated `.yap` package has been imported, successful or failed, do not reuse that local ID family for another import-test package.
- Do not reuse that FlowKey/form key either.
- A package can import and open the root shell while child components detach because Yeeflow has already seen the generated IDs.

### v6.1 Success

`visitor-access-management.v6.1-add-visitor-name-fresh.yap` succeeded.

Confirmed successful settings:

- Fresh ID family: `211...`
- Fresh root app/listset ID: `2110000000000000001`
- Fresh request list ID: `2110020000000001000`
- Fresh form key: `VAW`
- Approval form `Data.Forms[].ListID = 0`
- Approval form `ProcModelID = 2110030000000000001`
- `Visitor Name` field slot: `Text8`
- `Visitor Name` field ID: `2110020000000001012`

Confirmed sandbox behavior:

- App imports.
- App opens.
- Navigation renders.
- `Departments` appears.
- `Visitor Access Requests` appears.
- `Visitor Access Request` approval form appears in navigation.
- `Visitor Name` renders on the approval form request page.

This validates the one-field expansion strategy.

## 10. Current Generator Rules

For generated app expansion tests:

- Start from a known-good baseline.
- Add exactly one field or behavior change at a time.
- Use a fresh ID family for every import-test package.
- Use a fresh FlowKey/form key for every import-test package.
- Keep app-level approval form `Data.Forms[].ListID = 0`.
- Put approval form identity in `ProcModelID`.
- Preserve proven field slots unless deliberately testing a new slot.
- Validate package, graph, approval form Def, and wrapper round trip before import.

## 11. v7 One-Field Expansion Result

`visitor-access-management.v7-add-visitor-company.yap` succeeded as the next one-field expansion from the working v6.1 baseline.

What changed:

- Added `Visitor Company`.
- Used data-list field slot `Text9`.
- Added workflow variable `VisitorCompany`.
- Added request page control.
- Added approval page readonly control.
- Added custom list form control.
- Added sample row values.
- Added workflow `ContentList` mapping: `VisitorCompany -> Text9`.

Confirmed successful settings:

- Fresh ID family: `212...`
- Fresh root app/listset ID: `2120000000000000001`
- Fresh request list ID: `2120020000000001000`
- Fresh form key: `VAX`
- Approval form `Data.Forms[].ListID = 0`
- Approval form `ProcModelID = 2120030000000000001`
- `Visitor Company` field slot: `Text9`
- `Visitor Company` field ID: `2120020000000001013`

Confirmed sandbox behavior:

- App imported.
- App opened.
- Navigation rendered.
- `Visitor Access Request` approval form appeared.
- `Visitor Name` rendered.
- `Visitor Company` rendered.
- `ContentList` persisted `VisitorCompany` to `Text9`.

## 12. Expansion Rule Confirmation

The v7 result confirms that one-field expansion from a known-good baseline is valid.

Safe text-field expansion pattern:

- Use a fresh ID family.
- Use a fresh FlowKey/form key.
- Preserve `Data.Forms[].ListID = 0`.
- Add the new text field to `Defs`.
- Add the new field to views if needed.
- Add the new field to the custom list form.
- Add the matching workflow variable.
- Add request-page and readonly approval-page controls.
- Add the `ContentList` mapping.
- Add sample row values only when they are local and safe.
- Re-run package, graph, approval form, and wrapper validations.

Current proven Visitor Access request schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

## 13. v8-v10 Incremental Expansion Results

After v7, the Visitor Access Management app was expanded one field at a time from the latest known-good baseline.

### v8 Success

`visitor-access-management.v8-add-access-area.yap` succeeded.

- Added `Access Area` as `Visitor Access Requests.Text10`.
- Used fresh ID family `213...`.
- Used fresh FlowKey/form key `VAY`.
- Preserved app-level approval form `Data.Forms[].ListID = 0`.
- Added the list field, custom list form control, approval request page control, approval page readonly control, sample row values, and `ContentList` mapping.
- App imported and opened correctly.
- `Access Area` rendered in the approval form.
- `ContentList` persisted `AccessArea` to `Text10`.

### v9 Success

`visitor-access-management.v9-add-host-employee.yap` succeeded.

- Added `Host Employee` as `Visitor Access Requests.Text11`.
- Used fresh ID family `214...`.
- Used fresh FlowKey/form key `VAZ`.
- Preserved app-level approval form `Data.Forms[].ListID = 0`.
- Added the list field, custom list form control, approval request page control, approval page readonly control, sample row values, and `ContentList` mapping.
- App imported and opened correctly.
- `Host Employee` rendered in the approval form.
- `ContentList` persisted `HostEmployee` to `Text11`.

### v10 Success

`visitor-access-management.v10-add-visitor-contact.yap` succeeded.

- Added `Visitor Contact` as `Visitor Access Requests.Text12`.
- Used fresh ID family `215...`.
- Used fresh FlowKey/form key `VBA`.
- Preserved app-level approval form `Data.Forms[].ListID = 0`.
- Added the list field, custom list form control, approval request page control, approval page readonly control, sample row values, and `ContentList` mapping.
- App imported and opened correctly.
- `Visitor Contact` rendered in the approval form.
- `ContentList` persisted `VisitorContact` to `Text12`.

## 14. Proven Incremental Expansion Chain

The current successful expansion chain is:

| Version | Field | Slot | ID family | FlowKey |
| --- | --- | --- | --- | --- |
| v6.1 | Visitor Name | `Text8` | `211...` | `VAW` |
| v7 | Visitor Company | `Text9` | `212...` | `VAX` |
| v8 | Access Area | `Text10` | `213...` | `VAY` |
| v9 | Host Employee | `Text11` | `214...` | `VAZ` |
| v10 | Visitor Contact | `Text12` | `215...` | `VBA` |

Current proven Visitor Access request schema:

| Field | Slot |
| --- | --- |
| Department lookup | `Text2` |
| Department Code | `Text3` |
| Visit Purpose | `Text4` |
| Visitor Name | `Text8` |
| Visitor Company | `Text9` |
| Access Area | `Text10` |
| Host Employee | `Text11` |
| Visitor Contact | `Text12` |
| Visit Date | `Datetime2` |

Generator rule:

- Expand from a known-good baseline one change at a time.
- Use a fresh ID family and fresh FlowKey/form key for every import-test package.
- Keep app-level approval form `Data.Forms[].ListID = 0`.
- Preserve proven field slots unless deliberately testing a new field type or slot.
- Update the data-list field, data-list views where useful, custom list form, approval request page, approval readonly page, workflow variable, sample rows, and `ContentList` mapping together.
- Validate the package, graph, and approval form before wrapper build.
- Build only after validation passes and round-trip comparison confirms decoded source equality.

Next recommended tests:

- Convert `Access Area` from text to a choice/dropdown.
- Test `Host Employee` as a user picker or lookup.
- Add dashboard/report resources only after the core app remains stable.

## 15. Manual v10 Field-Type Pattern Export

The exported file `/Users/rengerhu/Downloads/Visitor Access Management v10.yap` was manually modified in Yeeflow after the generated v10 baseline. It provides the first app-level export evidence for several field/control types.

Reference study:

- `docs/approval-form-and-yap-field-type-pattern-study.md`

Confirmed from the export:

- Approval form number control uses variable `type = "number"` and control `type = "input_number"`.
- Number formatting/min/default settings are stored on the control as attrs/value.
- Data-list number field uses `FieldType = "Decimal"` and `Type = "input_number"`; the observed slot was `Decimal1`.
- Approval form single-select radio uses variable `type = "text"` and control `type = "radio"`.
- Approval form dropdown uses the same `radio` control with `attrs.displayStyle = "dropdown"`.
- Approval form switch uses variable `type = "boolean"` and control `type = "switch"`.
- Data-list switch field uses `FieldType = "Bit"` and `Type = "switch"`; the observed slot was `Bit1`.
- Conditional display is stored on the target control at `attrs.control_display[]`.

Important limitation:

- The manual export did not persist the new fields through `ContentList`.
- The new request-page controls were not mirrored onto the approval page.
- A generated package should add readonly approval-page mirrors and type-compatible `ContentList` mappings when persistence is required.

## 16. v11 Multi-Field, Multi-Type Expansion Result

`visitor-access-management.v11-five-fields-multitype.yap` succeeded as the first generated multi-field, multi-type expansion from the working v10 baseline.

Confirmed successful settings:

- Fresh ID family: `216...`
- Fresh root app/listset ID: `2160000000000000001`
- Fresh request list ID: `2160020000000001000`
- Fresh FlowKey/form key: `VBB`
- Approval form `Data.Forms[].ListID = 0`
- Approval form `ProcModelID = 2160030000000000001`
- `ReplaceIds` count: `46`

Confirmed runtime behavior:

- App imported and opened.
- Root navigation rendered.
- Data lists appeared.
- Approval form appeared.
- Multi-field expansion worked.
- Multi-type controls worked.
- The v11 wrapper round-trip, package validation, graph validation, and extracted approval form validation all passed before import testing.

### Proven v11 Field/Control Types

v11 moves the field-type study from manual export evidence to generated package evidence.

| Type | Approval control | Data-list field pattern | Proven in v11 |
| --- | --- | --- | --- |
| Text | `input` | `FieldType = "Text"`, `Type = "input"` | yes |
| Number | `input_number` | `FieldType = "Decimal"`, `Type = "input_number"` | yes |
| Single select dropdown | `radio` plus `attrs.displayStyle = "dropdown"` | `FieldType = "Text"`, `Type = "radio"` | yes |
| Switch/boolean | `switch` | `FieldType = "Bit"`, `Type = "switch"` | yes |
| Conditional display | target control `attrs.control_display[]` | approval-form-only behavior | yes |

### Proven v11 Storage Mappings

| Business field | Storage slot | Field/control type |
| --- | --- | --- |
| Visitor Email | `Text13` | text/input |
| Visitor Phone | `Text14` | text/input |
| Number of Visitors | `Decimal1` | Decimal/input_number |
| Access Type | `Text15` | Text/radio dropdown |
| Requires Escort | `Bit1` | Bit/switch |

### Proven v11 ContentList Mappings

| Approval variable | Target field |
| --- | --- |
| `VisitorEmail` | `Text13` |
| `VisitorPhone` | `Text14` |
| `NumberofVisitors` | `Decimal1` |
| `AccessType` | `Text15` |
| `RequiresEscort` | `Bit1` |

### Sample Value Shapes

| Field type | Sample value shape |
| --- | --- |
| Decimal | numeric values such as `1`, `2`, `4` |
| Choice/dropdown | selected option text such as `Vendor Service` |
| Bit/switch list sample | string `"1"` or `"0"` |
| Boolean approval control | boolean `true` or `false` |

### Conditional Display

`Escort User` was added as a form-only conditional field:

- workflow variable: `EscortUser`
- request-page control: text input
- visibility rule: show when `RequiresEscort == true`
- storage location: target control `attrs.control_display[]`
- persistence: not persisted in v11

This keeps v11 as a five persisted-field expansion while still proving conditional display in a generated app package.

### Updated Generator Rule

Multi-field expansion is allowed after the underlying field/control types have been proven by export-backed examples and at least one generated import test.

For generated `.yap` app expansion:

- Start from a known-good baseline.
- Use a fresh ID family and fresh FlowKey/form key for every import-test package.
- Keep app-level approval form `Data.Forms[].ListID = 0`.
- Preserve proven slots unless deliberately testing a new slot or field type.
- Update data-list fields, custom list forms, approval request pages, approval readonly pages, workflow variables, sample rows, and `ContentList` mappings together.
- Validate package, graph, extracted approval form Def, and wrapper round-trip before import testing.

Remaining gaps after v11:

- Persisted conditional field, such as `EscortUser -> Text16`.
- Multi-select choice.
- User picker.
- Lookup inside a line-item table.
- Dashboards and reports beyond the root Type `103` shell page.
