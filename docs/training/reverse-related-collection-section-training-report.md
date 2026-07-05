# Reverse-Related Collection Section Training Report

## Scope

This training promotes the learned Data List View Item form pattern for reverse-related Collection sections. The source evidence is the Hospital Doctor Information Management lookup E2E report and the manually exported reverse-related Collection section sample.

The pattern applies when the current View Item form is the parent/lookup target and another child Data List stores a lookup field pointing to the current record.

## Learned Pattern

Examples:

| Host View Item form | Related child list | Child lookup field | Runtime relationship |
| --- | --- | --- | --- |
| Departments View Item | Doctor Profiles | Text2 | Doctor Profiles.Text2 = current Departments.ListDataID |
| Specialties View Item | Doctor Profiles | Text3 | Doctor Profiles.Text3 = current Specialties.ListDataID |

The section belongs only on View Item or Workbench View Item forms. New/Edit forms should not receive reverse-related Collections by default because a persisted current `ListDataID` may not exist.

## Required Runtime Contract

Reverse-related sections must provide both read-side and create-side context.

Read-side Collection filter:

- `collection.attrs.data.filter[]` must exist.
- The filter left side must be the child lookup storage field, such as `Text2` or `Text3`.
- The filter right side must be a current host item `ListDataID` `list_field` expression.
- Parent display text, parent title, hardcoded row IDs, sample IDs, or labels are invalid.

Search:

- If a `search-filter` exists, its `binding` must be consumed by `collection.attrs.data.fulltext[].value`.
- `fulltext.fields[]` must name real child-list fields.
- Do not generate a search control without the matching Collection fulltext binding.

Add record:

- If child creation is allowed, generate an `action_button` with `attrs["action-type"] = "5"` and a valid `attrs.control_action`.
- The Add button target list must match the child Collection source list.
- `action_button.attrs.passvalues[]` must include:
  - `Name = <child lookup FieldName>`
  - `Value = current host ListDataID expression`

The read filter alone proves display, but it does not link newly added child records. The `passvalues` default alone links new records, but it does not restrict the displayed Collection. Both are required for a full reverse-related create/view workflow.

## Designer Stability Update 2026-07-05

The Departments View Item designer failure was reclassified after comparing the generated package with a normal Yeeflow `.ydl` export. The working export contains the reverse-related `collection`, toolbar `action_button`, and `search-filter`, but it does not include a row-level `dropbar` or copied row operation menu. The generated package failed because the Collection row template retained unproven source-template operations such as `grid_table_col_item_op_menu` and edit/delete row controls.

Focused live fixes confirmed the boundary:

- Removing toolbar Add/Search while keeping the row operation residue did not resolve the designer failure.
- Removing the entire reverse-related Collection did resolve the designer failure.
- Therefore Add/Search are not the root cause; copied row `dropbar` / row operations are the unsafe template residue.

Generation must keep official-shape toolbar Search/Add when planned, but must prune row-level operation/dropbar controls from reverse-related Collection rows unless a separate export-proven row action pattern is explicitly supported by the App Plan.

## App Plan Requirement

When a parent/detail lookup relationship should appear on a parent View Item form, the App Plan should include a Reverse-Related Collection Selection table:

| Host Data List | View Item Form | Related Child List | Child Lookup Field | Section Title | Collection Template | Search | Add Record | Default Value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Departments | Departments View Item | Doctor Profiles | Text2 | Doctor Profiles in this Department | collection_control_grid_table | Title/Text fields | Add doctor | Text2 = current ListDataID |
| Specialties | Specialties View Item | Doctor Profiles | Text3 | Doctor Profiles in this Specialty | collection_control_grid_table | Title/Text fields | Add doctor | Text3 = current ListDataID |

## Validator Changes

`scripts/validate-data-list-form-layout-template.mjs` now enforces reverse-related contracts for sections marked with `reverseRelatedCollectionSection` or equivalent metadata:

- `DATA_LIST_FORM_REVERSE_RELATED_COLLECTION_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_FILTER_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_LOOKUP_FIELD_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_FILTER_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FULLTEXT_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_BINDING_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_SEARCH_FIELDS_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_BUTTON_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_TARGET_MISMATCH`
- `DATA_LIST_FORM_REVERSE_RELATED_ADD_ACTION_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_LOOKUP_FIELD_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_PASSVALUES_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN`

The gate is marker-scoped to avoid failing ordinary read-only related Collections. Once the generator declares a section as reverse-related, the full contract must pass.

The validator also enforces App Plan to generated-package conformance when both `--plan` and `--package` are provided:

- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TABLE_MISSING`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_ROW_INCOMPLETE`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_TEMPLATE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_DEFAULT_VALUE_INVALID`
- `DATA_LIST_FORM_REVERSE_RELATED_APP_PLAN_NOT_MATERIALIZED`

This conformance gate makes reverse-related sections an application-building contract rather than documentation-only guidance. If the App Plan includes a `Reverse-Related Collection Selection` row, the generated package must contain a matching View Item or Workbench View Item section for the same host list, related child list, and child lookup field. The generated section must then satisfy the read-side filter, optional search/fulltext binding, and optional Add/passvalues rules above.

## Proof Boundary

This training is export-proven and validator-backed. The original E2E proved reverse-related display filters. The manually exported section proved search/Add/passvalues shape. The current validator proves App Plan row to generated-package materialization before signing readiness. A future generated E2E should still prove the full Add-save-readback loop from a generated app, including that the child lookup field stores the parent `ListDataID`.
