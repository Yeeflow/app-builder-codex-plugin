# Standalone Artifact Plan And Shared Generation Training Report

## Problem

The Approval Form `.ywf` path recently exposed a drift pattern: standalone generation could pass its own structural checks while bypassing the same golden-reference layout builder used by full `.yapk` application generation.

The same risk exists for:

- Approval Form `.ywf` standalone exports.
- Data List `.ydl` standalone exports.
- Dashboard page `.ydp` standalone exports.

If these paths hand-build simplified bodies, future fixes to full-app Data List forms or Dashboard page layouts will not automatically apply to standalone exports.

## Required Training Outcome

Standalone `.ywf`, `.ydl`, and `.ydp` generation must use the same generation standards as full application materialization and must use a plan-first flow:

```text
Standalone Artifact Plan
-> Trace JSON
-> Shared Builder
-> Standalone Export
-> Plan-vs-Actual Validator
```

The plan is the user-readable generation contract. The trace JSON is the machine-readable projection consumed by builders and validators. The standalone exporter wraps the shared-builder output only; it must not rebuild, simplify, or repair the core body in a separate path.

For Approval Forms, this means standalone `.ywf` generation must share Approval Form Layouts v1.1, field-control mapping, task form mapping, workflow node/assignee/condition/layout generation, and validators with the full-app `.yapk` Approval Form path.

For Data Lists, this means standalone `.ydl` generation must share Data List schema planning, field mapping, custom form layout templates, field-grid templates, reverse-related Collection sections, workflow/task form rules, and validators with the full-app `.yapk` Data List path.

For Dashboards, this means standalone `.ydp` generation must share Dashboard page layout selection, component template cloning, Collection/Data Analytics/Data Table/Summary runtime contracts, page-scoped variable/action namespace handling, and validators with the full-app `.yapk` Dashboard path.

## Rules Added

1. Every standalone `.ywf`, `.ydl`, and `.ydp` must have a standalone artifact plan before generation.
2. Every standalone artifact plan must project to trace JSON before materialization.
3. Trace JSON must declare `artifactType`, `name`, `plan`, `sharedBuilder`, `validators`, and `conformance`.
4. Trace JSON must set `sharedBuilder.required = true` and `conformance.planToActualRequired = true`.
5. Standalone `.ywf` and full `.yapk` Approval Form generation must not maintain separate form/workflow/template mappers.
6. Standalone `.ydl` and full `.yapk` Data List generation must not maintain separate field/form/template mappers.
7. Standalone `.ydp` and full `.yapk` Dashboard generation must not maintain separate page-layout/component-template mappers.
8. A standalone export may omit app-level packaging context only when the report explicitly records the proof boundary.
9. Standalone export validation must run the same surface-level hard gates used before full-app signing readiness.
10. Future fixes to Approval Form Layouts v1.1, workflow layout/condition/assignee rules, Data List Form Layouts v1.1, Data List Form Fields Grid v1.1, reverse-related Collection sections, Dashboard Page Layouts, Collection templates, Data Analytics templates, Data table templates, Summary/KPI runtime models, filter variables, temp variables, or form actions must land in shared builders or shared validators instead of one-off standalone scripts.

## Mandatory Plan/Trace Gate

Run this gate before standalone handoff:

```bash
node scripts/validate-standalone-artifact-plan-trace.mjs --plan <artifact-plan.md> --trace <artifact-plan.trace.json>
```

The gate blocks missing plans, missing traces, missing shared builder declarations, missing validator lists, and missing plan-vs-actual conformance requirements.

## Validation Expectations

For `.ywf`:

- `validate-standalone-artifact-plan-trace.mjs`
- `validate-ywf-def.js --mode final`
- `test-approval-ywf-form-structure-gates.mjs`
- workflow layout, assignee, condition, and branch coverage gates when workflow is present

For `.ydl`:

- `validate-standalone-artifact-plan-trace.mjs`
- `validate-ydl-list.js --mode generator --stage final`
- `validate-ydl-list.js --mode generator --stage final --strict-import-ready`
- `validate-data-list-form-layout-template.mjs` when custom forms exist
- `validate-data-list-form-fields-template.mjs` when current-record field grids exist
- field/schema/list creation gates when package context exists
- `test-data-list-view-filter-gates.mjs` when data views contain fixed filters
- `test-ydl-strict-import-ready-gates.mjs`

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

Focused follow-up from `event-planning-datalist-e2e-20260707-234854-plugin-0.9.31-50rows`: a standalone `.ydl` can pass broad structural checks yet fail Yeeflow import with `create failed` when the generated wrapper does not match current export/import expectations. Import-ready standalone `.ydl` output must preserve `Defs[].Rules` as stringified JSON, must not seed audit/system fields in demo `ListDatas`, must keep Type `1` custom form `LayoutView: null` with the form JSON in `LayoutInResources[0].Resource`, and must keep the default view URL as `default`. These are now covered by `--strict-import-ready` and should be enforced before handoff, not deferred to manual import testing.

For `.ydp`:

- `validate-standalone-artifact-plan-trace.mjs`
- `validate-dashboard-page-layout-template.mjs`
- `validate-dashboard-generation-hard-gates.mjs`
- page-layout plan conformance when an App Plan exists
- Collection, Data Analytics, Data Table, filter/runtime-binding, and page-scope dependency gates when those controls exist

## Boundary

This training standardizes generation-path expectations and local validation. It does not by itself prove install, Version Management, runtime data, browser rendering, or Designer-open behavior for a generated standalone export.
