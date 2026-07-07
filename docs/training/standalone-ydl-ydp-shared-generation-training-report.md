# Standalone YDL/YDP Shared Generation Training Report

## Problem

The Approval Form `.ywf` path recently exposed a drift pattern: standalone generation could pass its own structural checks while bypassing the same golden-reference layout builder used by full `.yapk` application generation.

The same risk exists for:

- Data List `.ydl` standalone exports.
- Dashboard page `.ydp` standalone exports.

If these paths hand-build simplified bodies, future fixes to full-app Data List forms or Dashboard page layouts will not automatically apply to standalone exports.

## Required Training Outcome

Standalone `.ydl` and `.ydp` generation must use the same generation standards as full application materialization.

For Data Lists, this means standalone `.ydl` generation must share Data List schema planning, field mapping, custom form layout templates, field-grid templates, reverse-related Collection sections, workflow/task form rules, and validators with the full-app `.yapk` Data List path.

For Dashboards, this means standalone `.ydp` generation must share Dashboard page layout selection, component template cloning, Collection/Data Analytics/Data Table/Summary runtime contracts, page-scoped variable/action namespace handling, and validators with the full-app `.yapk` Dashboard path.

## Rules Added

1. Standalone `.ydl` and full `.yapk` Data List generation must not maintain separate field/form/template mappers.
2. Standalone `.ydp` and full `.yapk` Dashboard generation must not maintain separate page-layout/component-template mappers.
3. A standalone export may omit app-level packaging context only when the report explicitly records the proof boundary.
4. Standalone export validation must run the same surface-level hard gates used before full-app signing readiness.
5. Future fixes to Data List Form Layouts v1.1, Data List Form Fields Grid v1.1, reverse-related Collection sections, Dashboard Page Layouts, Collection templates, Data Analytics templates, Data table templates, Summary/KPI runtime models, filter variables, temp variables, or form actions must land in shared builders or shared validators instead of one-off standalone scripts.

## Validation Expectations

For `.ydl`:

- `validate-ydl-list.js --mode generator --stage final`
- `validate-data-list-form-layout-template.mjs` when custom forms exist
- `validate-data-list-form-fields-template.mjs` when current-record field grids exist
- field/schema/list creation gates when package context exists

Focused follow-up from `Event Planning 2.ydl` on 2026-07-07: standalone `.ydl` final validation must not allow a simplified custom form path to leak out as a generated artifact. The failure shape was one generic `Event Planning Form` assigned to `ListModel.LayoutView.add`, `edit`, and `view`, no separate `Edit Item` and `View Item` forms, no Data List Form Layouts v1.1 `Main` / `Content` / content-card shell, and current-record field controls placed directly in raw containers/flex grids instead of `form_grid_fields_wrapper`. The same artifact also showed that business display labels containing `/` must be sanitized before becoming `InternalName` values.

The validator must therefore treat the following as generator-final hard errors, not warnings:

- `UI_STANDARD_EDIT_ITEM_FORM_MISSING`
- `UI_STANDARD_VIEW_ITEM_FORM_MISSING`
- `UI_STANDARD_CONTENT_WIDTH_NOT_FULL`
- `UI_STANDARD_FORM_PADDING_NOT_ZERO`
- `UI_STANDARD_MAIN_CONTAINER_MISSING`
- `UI_STANDARD_CONTENT_CONTAINER_MISSING`
- `DATA_LIST_FORM_FIELDS_WRAPPER_MISSING`
- `STANDALONE_YDL_SHARED_GENERATION_BYPASSED`

The regression fixture should fail a standalone `.ydl` shape that hand-builds a generic custom form and reuses it for New/Edit/View. It may pass only after standalone `.ydl` generation uses the shared Data List Form Layouts v1.1 and Data List Form Fields Grid v1.1 builders.

For `.ydp`:

- `validate-dashboard-page-layout-template.mjs`
- `validate-dashboard-generation-hard-gates.mjs`
- page-layout plan conformance when an App Plan exists
- Collection, Data Analytics, Data Table, filter/runtime-binding, and page-scope dependency gates when those controls exist

## Boundary

This training standardizes generation-path expectations and local validation. It does not by itself prove install, Version Management, runtime data, browser rendering, or Designer-open behavior for a generated standalone export.
