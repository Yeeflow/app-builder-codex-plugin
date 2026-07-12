# Data List Sub List Column Title Focused Training Report

## Scope

This training uses the exported `Campaign.ydl` View Campaign form as the export-backed reference for persisted Data List Sub list fields and their custom-form controls.

Sanitized reference fixture: `docs/reference/data-list-form-sublist-campaign-export-reference.json`.

## Learned Contract

- The Data List owns a real Sub list field: `Type = "list"`, `FieldType = "Text"`.
- Its row schema is stored in stringified `Defs[].Rules["list-variables"]`.
- A custom Data List form clones `data_list_form_control_sublist_v1_1`, then rebuilds `attrs.list-variables` and `attrs.list-fields` from the target field Rules.
- Each nested column control needs a visible `control.label`, its row-field binding, and correct references to the parent field binding and parent control ID.
- Text, user, date, number, boolean, and file rows map to `input`, `identity-picker`, `datepicker`, `input_number`, `switch`, and `file-upload` respectively.
- Data List exports do not require Approval Form's `label_var: null` property.

## Root Cause Fixed

The previous materializer cloned the five-column Ticket Sub list template and updated only the parent binding and control ID. It did not serialize the planned row schema into field Rules and did not replace the template's nested business columns. A generated form could therefore look template-derived while carrying unrelated row fields.

## Hard Gates

- `DATA_LIST_FORM_SUBLIST_COLUMN_CONTROL_LABEL_MISSING`
- `DATA_LIST_FORM_SUBLIST_COLUMN_BINDING_MISMATCH`
- `DATA_LIST_FORM_SUBLIST_COLUMN_PARENT_BINDING_MISMATCH`
- `DATA_LIST_FORM_SUBLIST_COLUMN_CONTROL_ID_MISMATCH`
- `DATA_LIST_FORM_SUBLIST_COLUMN_CONTROL_ID_DUPLICATE`
- `DATA_LIST_FORM_SUBLIST_ROW_SCHEMA_MISMATCH`
- `DATA_LIST_FORM_SUBLIST_FIELD_RULES_SCHEMA_MISMATCH`

## Regression Proof

`test-data-list-sublist-column-title-gates.mjs` materializes a Campaign Data List with a three-column Event Items Sub list. It proves stringified field Rules, three matching form columns, complete `Name / Description / Owner` titles, correct nested control types and bindings, no template residue, and package-level validator success.
