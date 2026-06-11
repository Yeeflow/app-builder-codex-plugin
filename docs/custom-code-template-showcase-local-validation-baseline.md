# Custom Code Template Showcase Local Validation Baseline

App: Enterprise Service Request & Compliance Review

Phase 2 generated a local `.yap` showcase package with all 13 custom code templates embedded in Custom Code controls. The focused repair pass preserved the original template source files and patched only the generated embedded script copies/app wiring.

Runtime status: materialization passed and component smoke testing completed for the repaired package.

Public form support: not claimed.

Generated package path: `custom-code-template-showcase.v1.yap`

## Repair Findings

- Query/read-only templates need Yeeflow runtime field keys such as `Text3` and `Datetime1` when reading list row values. Display labels and custom internal names are not reliable row-value keys.
- Several query templates needed generated-package compatibility with Yeeflow SDK response shapes that return rows under `listData`/`ListData`.
- Broad `queryItems` fallback calls without `selectedFields` are useful for custom-code smoke packages, because projected query payloads can return empty data even when seeded list records exist.
- The original 13 template source files were not changed; compatibility is applied by `generate-custom-code-template-showcase-v1.mjs` while embedding scripts into the showcase package.

## Local Validation

Latest local checks passed before the fresh runtime import:

- TSX/esbuild check for all 13 template sources.
- `node --check` on generator and inspection scripts.
- JSON parse checks for generated app/form/dashboard/resource/report JSON.
- `validate-yap-package`.
- `validate-yap-graph`.
- `validate-ywf-def`.
- `validate-ydl-list` for all 9 lists.
- wrapper round trip.
- custom code control inspection.
- materialization inspection.
- dashboard structure inspection.
- app-wide FieldID uniqueness, per-list name uniqueness, and `field.ListID` ownership checks.
- FlowKey/prefix corruption checks.
- `git diff --check`.

## Runtime Smoke Result

Fresh runtime import name observed: `Enterprise Service Request & Complian r4ce Review`.

Materialization passed: the app opened to real content, not the blank “Start to build with Components” state. Dashboard/home page, data lists with custom fields, approval form, workflow/form prompt, and custom code controls were visible.

| Template | Previous classification | Fix attempted | Retest result | Remaining blocker |
| --- | --- | --- | --- | --- |
| activity-timeline | Blocked by configuration | Runtime field keys plus `listData`/broad-query fallback compatibility. | Runtime-proven for read-only seeded data render on dashboard/form. | None for read-only render; no writeback applicable. |
| approval-decision-panel | Not tested | Kept on review page with decision/comment wiring. | Not tested. | Requires an actual reviewer task/review context to test selection and comment writeback. |
| approval-timeline | Blocked by configuration | Runtime field keys plus `listData`/broad-query fallback compatibility. | Runtime-proven for seeded approval history render. | Live workflow history remains a deeper future test. |
| checklist-compliance-block | Runtime-proven | No repair needed. | Runtime-proven for checkbox interaction and JSON writeback. | Submission persistence not retested in this pass. |
| dependent-selector | Blocked by configuration | Runtime parent/child field keys and seeded matching records. | Runtime-proven for parent filter, child selection, and writeback. | None for smoke scope. |
| distribution-chart-module | Blocked by configuration | Runtime group field key plus query fallback compatibility. | Runtime-proven for seeded dashboard chart render. | None for read-only render. |
| exception-alert-panel | Blocked by configuration | Runtime field keys plus query fallback compatibility. | Runtime-proven for seeded alert render. | None for read-only render. |
| hierarchical-selector | Blocked by configuration | Runtime hierarchy field keys and seeded tree records. | Runtime-proven for hierarchy render, selection, and writeback. | None for smoke scope. |
| kpi-card-set | Render-only proven | No query repair; static config retained. | Render-only proven with configured values. | Data-bound KPI calculation is not proven. |
| multi-entry-tag-input | Runtime-proven | No repair needed. | Runtime-proven for chip add and JSON writeback. | Submission persistence not retested in this pass. |
| related-record-summary-grid | Blocked by configuration | Runtime target-list field keys plus query fallback compatibility. | Runtime-proven for seeded related-record render. | None for read-only render. |
| smart-lookup-picker | Runtime-proven | No source change; wiring retained. | Runtime-proven for approval search/select/writeback; dashboard visibility confirmed. | Dashboard temp output and data-list persistence were not retested here; public form not tested. |
| trend-chart-module | Blocked by configuration | Runtime date field key plus query fallback compatibility. | Runtime-proven for seeded dashboard trend render. | None for read-only render. |
