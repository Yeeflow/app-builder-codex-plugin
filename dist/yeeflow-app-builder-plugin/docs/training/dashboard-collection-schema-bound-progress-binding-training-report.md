# Dashboard Collection Schema-Bound Progress Binding Training Report

## Context

Hospital Doctor Information Management exposed a Dashboard Collection item template defect after applying a grid-table golden reference. The generated `Doctor Operations Dashboard` showed two visible `Status` columns. One `Status` column rendered a `Progress bar` bound to the copied source-template expression:

```json
{
  "exprType": "variable_ctx",
  "valueType": "percent",
  "id": "Decimal2",
  "ctx": "__ctx_coll",
  "type": "expr",
  "name": "Collection item:Completion percentage"
}
```

The selected Collection source list was `Doctor Profiles`, which did not contain `Decimal2` or `Completion percentage`, and the App Plan did not declare a progress/completion metric. This is a template clone-and-map defect, not a Data List schema defect.

## Root Cause

- The generator cloned a Collection template that included a progress/status column.
- It remapped some visible fields and labels, but it did not recursively clean every source-template field binding inside the Collection item subtree.
- Existing validation covered common `dynamic-*` control surfaces, but did not recursively scan all `exprType: "variable_ctx"` tokens with `ctx: "__ctx_coll"`.
- Existing validation did not enforce that `Progress bar` / `progress-circle` controls must bind numeric/decimal/percent fields from the current source list.
- Duplicate visible column labels such as two `Status` columns were not treated as evidence of incomplete business field mapping.

## Generation Rules

1. Golden reference templates provide structure and style only. They must not carry source application business fields into generated-final resources.
2. After cloning a Collection template, rebuild item field bindings from the current App Plan and selected Data List schema.
3. Every `__ctx_coll` field reference must resolve to the selected Collection source list, except approved system IDs such as `ListDataID`.
4. `Progress bar` and `progress-circle` are optional semantic controls. Generate them only when:
   - the App Plan declares a progress/completion/capacity/utilization/score/rate metric, and
   - the selected source list has a real numeric/decimal/percent field for that metric.
5. Status/choice/text fields must render as `dynamic-field` or status text/badge-style content. Do not convert them into progress controls.
6. If no progress metric exists, remove the progress column from the cloned template.
7. Grid-table headers must not contain duplicate visible labels after mapping. Rename columns to real business fields such as `Employment Status` and `Onboarding Status`, or remove unplanned columns.

## Hard Gates Added

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now blocks generated-final packages when:

- a Collection item subtree contains `exprType: "variable_ctx"` + `ctx: "__ctx_coll"` for a field missing from the selected source list (`DASH_DATASET_COLLECTION_CTX_FIELD_MISSING`);
- a Collection item `Progress bar` / `progress-circle` exists without a collection-bound source field (`DASH_DATASET_PROGRESS_WITHOUT_PROGRESS_SIGNAL`);
- a progress control binds a non-numeric field (`DASH_DATASET_PROGRESS_FIELD_NOT_NUMERIC`);
- a grid-table header contains duplicate visible column labels (`DASH_DATASET_COLLECTION_DUPLICATE_COLUMN_LABEL`).

## Regression Coverage

`scripts/test-dashboard-dataset-presentation-golden-references.mjs` now includes:

- a negative Doctor Profiles fixture with no `Decimal2` and no `Completion Percentage`, proving copied progress expressions fail;
- a negative fixture where `Decimal2` exists but is `Text`, proving progress controls require numeric fields;
- a duplicate `Status` header fixture, proving repeated visible column labels fail;
- existing valid fixtures still pass when Progress bar binds an available numeric field.

## Verification

Commands:

```bash
node --check scripts/validate-dashboard-dataset-presentation-golden-references.mjs
node --check scripts/test-dashboard-dataset-presentation-golden-references.mjs
node scripts/test-dashboard-dataset-presentation-golden-references.mjs
```

Result: pass.
