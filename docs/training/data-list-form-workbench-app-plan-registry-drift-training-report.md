# Data List Form Workbench App Plan Registry Drift Training Report

## Purpose

This training fixes a planning-gate drift between the Data List Form Layout template registry and the App Plan resource-order validator.

The `data_list_form_layout_workbench` template was already registered in `docs/reference/data-list-form-layout-templates.json` and documented as an approved full-page View Item layout. However, `scripts/validate-app-plan-resource-order.mjs` still used a private hard-coded allowlist containing only `data_list_form_layout_new_edit_v1_1` and `data_list_form_layout_view_item_v1_1`.

That caused valid App Plans selecting `data_list_form_layout_workbench` to fail with:

- `APP_PLAN_DATA_LIST_FORM_LAYOUT_TEMPLATE_UNKNOWN`

## Root Cause

The registry and the validator had separate sources of truth.

The registry was current:

- `data_list_form_layout_new_edit_v1_1`
- `data_list_form_layout_view_item_v1_1`
- `data_list_form_layout_workbench`

The resource-order validator was stale and rejected the Workbench template before package generation could start.

## Fix

`scripts/validate-app-plan-resource-order.mjs` now derives approved Data List Form Layout template IDs from `docs/reference/data-list-form-layout-templates.json`.

The validator also uses the registry metadata to decide whether a selected template supports a form usage:

- New/Edit rows must select a template that supports New/Edit usage.
- View rows may select either the standard View template or the Workbench View template.
- Unknown IDs still fail closed.

A conservative fallback keeps the last known approved IDs available if the registry cannot be read.

## Regression Coverage

`scripts/test-data-list-form-layout-template-gates.mjs` now includes a focused regression ensuring the resource-order validator does not emit either of these findings for a Workbench View selection:

- `APP_PLAN_DATA_LIST_FORM_LAYOUT_TEMPLATE_UNKNOWN`
- `APP_PLAN_DATA_LIST_FORM_LAYOUT_VIEW_TEMPLATE_MISMATCH`

The previously failing clean E2E App Plan was also rechecked directly and now passes `scripts/validate-app-plan-resource-order.mjs`.

## Required Future Behavior

Planning validators must not maintain private template allowlists when a registry exists. The registry is the source of truth for approved template IDs and form-usage metadata.

When new Data List Form Layout templates are added, validators should consume the registry instead of requiring a second hard-coded update.

## Safety Boundary

This training changes planning validation only. It does not change generator materialization, signing, install, upgrade, runtime proof, plugin metadata version, or stable branch state.
