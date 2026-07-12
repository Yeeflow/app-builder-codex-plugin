# Dashboard Temp Variable Dependency Standard

Status: generated-final hard contract for standalone `.ydp` and Dashboard resources embedded in `.yapk`.

## Declaration Shape

Every `LayoutView.tempVars[]` entry must include:

- non-empty `id` used by Yeeflow Designer as the visible variable identity;
- non-empty `name`;
- stable `idx`;
- correct `type` such as `array`, `number`, `boolean`, or `string`.

A declaration containing only `name` is invalid and renders as a blank Temp variables row in Designer.

## Template Dependency Materialization

Collection and page-layout golden references own their dependency declarations. When cloning a template:

1. copy only dependencies required by the cloned subtree;
2. namespace every dependency per Dashboard page and dataset region;
3. rewrite every `__temp_<id>` reference to the same scoped identity;
4. normalize declaration `id`, `name`, `idx`, and `type`;
5. after all control/action cleanup, remove declarations that have no remaining consumer.

Do not append generic fallback variables such as `var_SelectedItems`, `var_SelectedItemsAmount`, or `var_isDeleteConfirmed` to every Dashboard. Multiselect variables belong only to multiselect templates. Delete-confirmation variables belong only to retained delete actions.

## Required Gates

- `PAGE_SCOPE_TEMP_VAR_ID_MISSING`
- `PAGE_SCOPE_TEMP_VAR_REFERENCE_UNDECLARED`
- `PAGE_SCOPE_TEMP_VAR_UNREFERENCED_TEMPLATE_RESIDUE`
- existing duplicate and canonical namespace gates

Run `validate-page-scope-template-dependencies.mjs` on both standalone `.ydp` artifacts and generated-final `.yapk` packages before signing or import claims.
