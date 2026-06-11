# Vendor Onboarding Import Isolation Matrix

## Purpose

This matrix isolates the Yeeflow server-side materialization blocker for the Vendor Onboarding & Compliance Management app. The earlier rich YAPK/YAP candidates passed local validation but failed during Yeeflow import or install materialization. After reviewing the supplied standard schema, the latest packages use schema-direct `.yap` shape: wrapper `Resource` gunzips directly to `ListExportInfo`, not to a legacy `Resource.Data` envelope.

Generated isolation packages are stored in `/Users/Renger/Downloads` and are not committed to the repository.

## Source Schemas

- YAP schema: `/Users/Renger/Downloads/yap-v1-schema_v2.json`
- YAPK schema: `/Users/Renger/Downloads/yapk-schema.json`

## Isolation Packages

| Test order | Package | Included scope | Local validation result | Manual import result | Interpretation if import passes | Interpretation if import fails |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `vendor-onboarding-isolation.v1-data-list-only.yap` | One Vendors data list, five safe fields, one simple list view, no lookups, no forms, no dashboard, no advanced controls | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; import-readiness pass with warnings |  | Base schema-direct data-list import works. Continue to V2. | The blocker is in the minimum app/list shell, field metadata, root shell expectations, or server-side rules not represented by the JSON schema. |
| 2 | `vendor-onboarding-isolation.v2-five-lists-no-lookups.yap` | Five data lists with fields only, no lookup relationships, no forms, no dashboard, no advanced controls | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; import-readiness pass with warnings |  | Multiple list materialization works. Continue to V3. | The blocker is likely multi-list app materialization, field count/type mix, or cross-list shell expectations. |
| 3 | `vendor-onboarding-isolation.v3-five-lists-with-lookups.yap` | Five data lists with lookup relationships from related lists to Vendors, no forms, no dashboard, no advanced controls | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; import-readiness pass with warnings |  | Lookup relationship materialization works. Continue to V4. | The blocker is likely lookup Rules metadata or server-side relationship creation. |
| 4 | `vendor-onboarding-isolation.v4-simple-forms.yap` | Five lists, lookup relationships, simple add/edit/view form layouts, no dashboard or advanced controls | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; import-readiness pass with warnings |  | Simple custom form materialization works. Continue to V5. | The blocker is likely custom form `LayoutInResources`, form binding, or `ListModel.LayoutView` form references. |
| 5 | `vendor-onboarding-isolation.v5-simple-dashboard-table.yap` | V4 plus one simple dashboard with KPI cards and one Data table configured with vendor columns; no Kanban/Collection/Timeline | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; generated UI quality pass; import-readiness pass with warnings |  | Simple dashboard and Data table materialization work. Continue to V6. | The blocker is likely dashboard/page resource shape or Data table control configuration. |
| 6 | `vendor-onboarding-isolation.v6-dashboard-kanban.yap` | V5 plus one Kanban grouped by Onboarding Status with meaningful template fields; no document embed, sub list, print page, or timeline | Standard YAP schema pass; schema-standard inspector pass; package validator pass with warnings; graph validator pass with warnings; generated UI quality pass; import-readiness pass with warnings |  | Kanban materialization works. The next blocker is likely one of the richer controls from the full app. | The blocker is likely Kanban category/template metadata or dashboard advanced-control materialization. |

## Validation Notes

- All six packages are schema-direct `.yap` packages and contain no legacy `Resource.Data` envelope.
- All six packages pass `/Users/Renger/Downloads/yap-v1-schema_v2.json` validation with zero errors.
- All six packages pass `scripts/inspect-yap-schema-standard.mjs` with zero errors and zero warnings.
- The repo package, graph, and import-readiness validators were updated to understand schema-direct YAP resources while keeping legacy-envelope support.
- Warnings remain mostly from conservative generator gates, such as unknown normalized field-schema entries for `select`, empty app theme metadata, no forms for early isolation layers, and no dashboard for early isolation layers. These are expected for an isolation ladder and are not local blocking errors.
- No generated package file is committed.

## Manual Test Order

1. Import `/Users/Renger/Downloads/vendor-onboarding-isolation.v1-data-list-only.yap`.
2. If V1 passes, import `/Users/Renger/Downloads/vendor-onboarding-isolation.v2-five-lists-no-lookups.yap`.
3. Continue through V3, V4, V5, and V6 until the first failure appears.
4. Record the result in the `Manual import result` column.
5. Stop at the first failure and inspect that layer before testing richer UI again.

## Proof Boundary

This matrix proves local schema-direct generation and local validation only. It does not prove Yeeflow server-side import success, page rendering, field save behavior, lookup runtime behavior, dashboard render behavior, or Kanban interaction. Those require manual import/runtime confirmation in Yeeflow.
