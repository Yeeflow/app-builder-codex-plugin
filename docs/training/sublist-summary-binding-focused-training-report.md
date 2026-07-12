# Sub List Summary Binding Focused Training Report

## Scope

This focused training extends the Approval Form and Data List Form Sub List golden references with export-backed Summary configuration from `Business Travel Request Approval (2).ywf` and `Campaign (1).ydl`.

## Export-Backed Shapes

Every Summary is stored in the parent list control's `attrs.list-fields-summary[]`. It uses a UUID `id`, an existing numeric row `field`, an export-proven `type`, `display`, and an optional binding.

Approval Form bindings:

- `__variables_` targets a declared Approval variable, normally a numeric persisted/business variable.
- `__temp_` targets a declared `variables.tempVars[]` entry for page-session logic.

Data List Form bindings:

- `__list_` targets a real numeric host Data List field such as `Decimal1`.
- `__temp_` targets a declared form-resource `tempVars[]` entry.

The current generated standard supports `total` and `avg`. A Summary may be visible without a binding. Bound persisted targets must be numeric; temporary values are page-session values and are not persisted by the Summary itself.

## Plan Contract

Data List and Approval Form field tables may include `Sub List Summaries`. The compact syntax is `sourceRowField:summaryType:targetKind:targetId`. Multiple summaries are separated with semicolons. Target kinds are `variable` or `temp` for Approval Forms, and `list` or `temp` for Data List forms.

## Generation Fix

- Shared Approval builder materializes planned summaries and declares required Approval temp variables.
- Generated-final Data List materializer carries planned summaries without leaking planning metadata into exported field definitions, writes them onto generated Sub List controls, and declares required form temp variables.
- Summary IDs are deterministic UUIDs.

## Validation

Approval validation accepts only `__variables_` and `__temp_`, and verifies UUIDs, source row fields, target declarations, and numeric persisted target types.

Data List validation accepts only `__list_` and `__temp_`, and verifies UUIDs, source row fields, export-proven summary types, host field/temp target existence, and numeric persisted target types.

Regression: `scripts/test-sublist-summary-binding-gates.mjs` materializes both surfaces in one generated-final package and proves two summaries per surface plus all four binding scenarios.
