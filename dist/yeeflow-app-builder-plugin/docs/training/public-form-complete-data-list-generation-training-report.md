# Public Form Complete Data List Generation Training Report

## Training Objective

Prevent generated applications from treating a Data List Public Form as a substitute for the host Data List's normal internal application surfaces.

## Failure Shape

The Customer Survey regression generated a valid-looking `PublicForms[]` entry from Public Form golden references, but the host `Survey Responses` list used `List.LayoutView = null` and contained only a Type `0` data view. No Type `1` New/Edit/View custom forms were generated because a dedicated script hand-built the list instead of using the shared full-app Data List materializer.

Partial validation passed because package schema, export shape, navigation, and focused Public Form checks do not independently prove internal custom form coverage. Full preflight correctly failed the Data List Form Layouts v1.1 gate.

## Required Contract

1. Every generated Type `1` Data List follows the complete shared generation path, with or without Public Forms.
2. New/Edit forms use `data_list_form_layout_new_edit_v1_1`.
3. View forms use `data_list_form_layout_view_item_v1_1` or an explicitly planned Workbench View template.
4. Current-record field groups use `data_list_form_fields_grid_v1_1`.
5. `List.LayoutView.add/edit/view` resolves to Type `1` layouts on the same Data List.
6. Planned Public Forms are attached only after that contract is complete.
7. Public Form page and field templates remain independently validated.
8. A Public Form-only Data List is not signing-ready even when its anonymous page structure is valid.

## Generator Changes

- Parse the optional `Public Forms Plan` table from App Plan section 10.
- Materialize Public Forms inside the shared full-app materializer.
- Preserve automatic required New/Edit/View custom form generation for every host list.
- Allocate Public Form IDs through the same API-issued ID manifest path.
- Reject unresolved hosts, Document Library hosts, unsupported template selections, and anonymous-unsafe field controls.

## Hard Gates

- `YAPK_PUBLIC_FORM_CANNOT_REPLACE_CUSTOM_FORMS`
- `DATA_LIST_PUBLIC_FORM_CUSTOM_FORMS_REQUIRED`
- `DATA_LIST_FORM_LAYOUT_DISPLAY_SETTINGS_MISSING`
- Existing Data List Form Layouts v1.1 template and field-grid gates
- Full `yapk-first-generation-preflight`

## Regression Proof

`scripts/test-public-form-complete-data-list-generation-gates.mjs` proves both sides of the contract:

- with a planned Public Form, the shared materializer generates the Public Form plus standard New/Edit/View custom forms;
- without a planned Public Form, the same materializer still generates the same standard New/Edit/View custom forms;
- a Public Form-only App Plan fails New/Edit and View planning gates;
- deleting generated custom forms makes both package and layout validation fail;
- both fixture packages enter the complete first-generation preflight and pass its Data List Form Layouts v1.1 and Data List Form Fields v1.1 gates.

## Proof Boundary

This training proves generated package structure and local validation. Fixture-ID packages are intentionally not signing-ready because API-issued ID provenance and other live preflight requirements remain unsatisfied. Public URL access, anonymous submit/save, uploads, and installed runtime materialization remain separate runtime proof stages.
