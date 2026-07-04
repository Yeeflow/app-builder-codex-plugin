# App Plan Field Table and Dashboard Rationale Hardening Training Report

## Source Feedback

Hospital Doctor Information Management 0.9.2 fresh E2E passed after two in-run App Plan corrections:

- Dashboard record-display rows selected `collection_control_grid_table` but did not include a business rationale that matched the registry guidance, so the dataset presentation gate failed.
- Data List field tables initially used legacy headings `Display Name | Storage Name | Control`. The 0.9.2 materializer did not parse those rows as business field definitions and generated only native `Title` fields until the table was rewritten to `Field label | Field name | Field type`.

## Root Classification

These findings are plugin planning/materializer hardening issues, not Yeeflow runtime issues:

- The generated package passed after the App Plan was corrected.
- The materializer should not silently collapse a planned data list to Title-only generation when a recognizable field table is present.
- The App Plan generator should write the selected Collection template rationale in the exact form required by the dataset-presentation registry.

## Generation Rules

1. App Plan generation must include business rationale for every Dashboard Collection presentation selection. For `collection_control_grid_table`, use phrases such as dense row/column scanning, operational table, work queue, task list, or record list when that is the real display need.
2. Data List field tables may use either canonical headings such as `Field label | Field name | Field type` or legacy headings such as `Display Name | Storage Name | Control`.
3. `Storage Name` is an accepted alias for the internal field key.
4. When a field table has `Control` but no `Field type`, the materializer must infer schema-safe Yeeflow storage from the control:
   - `input`, `select`, `identity-picker`, `textarea`, `lookup`, file/image controls -> Text-backed storage unless another field type is explicit.
   - `input_number`, number, currency, amount, percent -> Decimal.
   - `datepicker`, datetime/time controls -> Datetime.
   - `switch`, checkbox, boolean, yes/no -> Bit.
5. Recognizable field tables must never produce Title-only generated lists. If neither canonical headings nor supported aliases are present, planning validation should fail before materialization rather than allowing silent under-generation.

## Validator and Regression Requirements

- Keep `DASH_DATASET_APP_PLAN_SELECTION_RATIONALE_MISMATCH` as a hard gate; fix the App Plan generator rather than weakening the validator.
- Add a focused regression that materializes an App Plan using `Display Name | Storage Name | Control` and asserts that the decoded Data List contains Text, Decimal, Bit, Datetime, and select fields.
- Keep the proof boundary separate: local generated-final preflight passing does not claim signing, install, seed, Version Management, or browser runtime proof.
