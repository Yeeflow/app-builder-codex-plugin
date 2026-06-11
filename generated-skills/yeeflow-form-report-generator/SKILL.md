---
name: yeeflow-form-report-generator
description: generate, inspect, validate, and plan runtime proof for Yeeflow Form Report application resources based on approval forms, including FormNewReports schema, Type 32 child resources, variable-to-report-field mappings, optional one-sub-list reporting, permissions, views, and report data-source boundaries.
---

# Yeeflow Form Report Generator

Schema-v2 carry-forward: Form Report child resources are list-like `CustomListModel` resources and must follow the same standard gates where applicable: `ListModel.Flags = 1`, schema-supported `ListModel.Type = 32`, arrays for `Defs` and `Layouts`, and valid approval-form variable references. Do not use Business Travel import or workflow-publish practice as Form Report runtime proof.

Use this skill when a Yeeflow application needs Form Report resources or when studying/export-validating Form Report schema. A Form Report is an app-level reporting resource based on an approval form. It is not a standalone data list, does not own a workflow, and must not be treated as an editable record store.

Current proof boundary: export-proven and validator-backed only from `docs/studies/form-report-resource.md` and normalized refs under `docs/studies/normalized/form-report/`. Do not claim runtime behavior until a focused import/open/designer/submission/export-back baseline passes.

## Export-Proven Shape

- Config lives in `Data.FormNewReports[]`.
- Matching child resource lives in `Data.Childs[]` where `ListModel.Type = 32` and `ListModel.ListID = FormNewReports[].ID`.
- Source approval form is `Data.FormNewReports[].DefKey`, resolving to `Data.Forms[].Key`.
- Report settings are a JSON string with `Fields`, `Filters`, and `SubListID`.
- Report child resources expose Type `0` list views in `Data.Childs[].Layouts[]`.
- Detail-page access is exported as `Attr_IsViewDetail` in view `LayoutView`; report attr also includes `isViewDetail`.
- Export permission toggle is exported as `Attr.isExport`.
- Inherited permission shape is `ListModel.IsBreakInherit = false`; custom permission audience shapes remain unproven.
- Form Reports can appear in root navigation as `Data.Item.ListModel.LayoutView.sort[]` entries with `Type = 32`.

Shared data-view update: Form Reports use the same `Layouts[]` family as data lists for list-like views. `Data Lists (1).yap` export-proves data-list view metadata on `Title`, `Type`, `Ext1.Url`, `IsDefault`, and `IsItemPerm`, and view settings in `LayoutView`. For Form Reports, only Type `0` views and `Attr_IsViewDetail` are export-proven in this repository; Help Center documents Form Report data views across additional product view types, but generate gallery/calendar/kanban Form Report views only as product-documented or after a Type `32` export proves the exact settings.

Negative rule: Data List / Document Library manage-permission settings and custom notification `RemindRules` do not apply to Form Report. Do not generate Form Report custom notifications or Data List / Document Library administrator/basic/advanced permission matrices; keep Form Report permissions limited to report access, export permission, and view/detail access patterns proven in Form Report studies.

## Generation Rules

- Generate Form Reports only when a source approval form exists in the same app package or the dependency is explicitly external and validated.
- One approval form may have multiple Form Reports.
- Do not generate a Form Report without `DefKey`.
- Do not generate workflow mappings, public edit/create forms, or direct item mutation behavior for a Form Report.
- Do not add arbitrary custom fields as if the report were a normal data list. Report fields should come from source approval variables, system fields, or the selected sub-list fields.
- Keep field keys unique inside each report.
- Keep display names unique where possible; warn on duplicates.
- Generate at most one selected sub-list via `Settings.SubListID`.
- If a sub-list is selected, include deliberate selected sub-list field mappings with keys shaped as `<SubListID>_<subFieldId>`.
- If no filter is selected, use no filter/null filter shape rather than inventing a catch-all condition.
- Every generated Form Report list-like child resource should include one default view where possible; detect the default with `IsDefault = true`, not only the title `All Items`.
- Custom report views need a unique `Ext1.Url` key within the report resource.
- Keep fixed view filters (`LayoutView.filter[]`) separate from Form Report source filters (`Data.FormNewReports[].Settings.Filters`) and separate from end-user query filters (`LayoutView.query[].IsFilter`).
- Treat row multiplication from selected sub-list as product-understanding-backed until runtime-proven.

## Field Mapping Rules

Export-proven mappings:

- `text` -> `input`, `textarea`, `richtext`
- `number` -> `input_number`, `percent`, `currency`
- `boolean` -> `switch`
- `date` -> `datepicker`, `time`
- `file` -> `file-upload`
- `img` -> `icon-upload`
- `user` -> `identity-picker`
- `groupselect` -> `organization-picker`
- `location` -> `location-picker`
- `costcenter` -> `cost-center-picker`
- `metadata` -> `metadata`
- `mutiple-metadata` -> `mutiple-metadata`
- `lookup` -> `lookup`
- `list` -> `textarea` with `Rules.listref`
- selected sub-list `text`, `number`, `date`, `user`, `lookup`, and `file` fields -> matching report field types found in the normalized refs

User/product expectations say text variables can map to many additional report field types, but those broader text conversions are not export-proven in this sample. Warn rather than fail until a focused export/runtime pass proves them.

## Field Settings

Preserve and validate these settings when present:

- Number: `rounded-to`, `displayThousandths`
- Percent: `rounded-to`
- Currency: `currencyCode`, `displayFormat`, `displayThousandths`, `rounded-to`
- Switch: `displayStyle`
- Date picker: `showtime`, `dateformat`
- Time picker: `dateformat`
- User/Department/Cost center: `multiple`
- Department: `metadata-treeselect`
- Lookup: `appid`, `listid`, `listfield`, optional `multiple`
- Metadata/Multiple metadata: `source`, `categoryId`

The export stores date/time format as codes. Do not claim exact UI labels such as `HH`, `HH:MM`, or `HH:MM:SS` without runtime or Help Center evidence.

## Validation And Runtime Boundary

Run:

```bash
node scripts/inspect-form-reports.mjs <input.yap> --out-dir docs/studies/normalized/form-report
node validate-yap-package.js <input.yap> --mode compatibility
node validate-yap-graph.js <input.yap> --mode compatibility
```

Validation is not runtime proof. A focused runtime baseline should prove import/open, source approval form publish/open, disposable submissions, no-filter record visibility, filtered record visibility, selected-sub-list row granularity, detail-page access enabled/disabled, export permission behavior, and export-back schema before broad generator promotion.

## Stop Conditions

Stop and report if the export cannot be decoded, no source approval form resolves from `DefKey`, Form Reports cannot be located, matching Type `32` child resources cannot be located, field mappings are opaque, selected sub-list schema is opaque, permissions cannot be safely redacted, or validation would require unsafe changes.

## App Creation Rule Guardrails

When generating a Form Report baseline that includes a source approval form, the source form must also satisfy app creation rules from `docs/studies/yeeflow-app-creation-rules.md`. Emit approval form `NoRule` as an object with `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`, and include `{index}` in `NoRule.Prefix`. Keep process keys alphanumeric/underscore only. Do not import a generated Form Report package when `validate-yap-package.js` or `scripts/inspect-app-creation-rules.mjs` reports generation-blocking app creation errors.
