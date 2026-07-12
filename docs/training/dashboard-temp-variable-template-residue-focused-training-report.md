# Dashboard Temp Variable Template Residue Focused Training

## Incident

The generated `My Travel Requests.ydp` displayed three blank Temp variables. The declarations had `name/type` but no `id`: `var_SelectedItems`, `var_SelectedItemsAmount`, and `var_isDeleteConfirmed`.

`var_SelectedItemsAmount` was referenced by a Collection display condition. The other two generic declarations were unreferenced residue, while a separate namespaced delete-confirmation variable already existed.

## Root Cause

- The plain grid-table golden template referenced `var_SelectedItemsAmount` and `var_task-view` without declaring them in `pageLevelDependencies.tempVars`.
- The materializer attempted to compensate by unconditionally appending three generic, name-only variables to every Dashboard.
- Existing validation checked duplicate names but did not require `id`, resolve every `__temp_` reference, or reject unused generated-template variables.

## Fix

- Complete the grid-table template dependency manifest.
- Remove unconditional generic temp-variable injection.
- Namespace template dependencies and references together.
- Normalize every generated declaration to complete `id/name/type/idx` shape.
- Infer export-compatible types for selected arrays, counts/amounts, and confirmation booleans.
- Prune dependencies after final action/control cleanup.
- Validate standalone `.ydp` wrappers directly through `LayoutView` parsing.

Regression covers plain grid-table and multiselect grid-table Dashboard generation, all declaration fields, scoped identities, correct types, consumed-only dependencies, and the three new hard-gate codes.
