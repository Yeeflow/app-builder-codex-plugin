---
name: yeeflow-form-report-generator
description: generate, inspect, validate, and plan runtime proof for Yeeflow Form Report application resources based on approval forms, including FormNewReports schema, Type 32 child resources, variable-to-report-field mappings, optional one-sub-list reporting, permissions, views, and report data-source boundaries.
---

# Yeeflow Form Report Generator

Schema-v2 carry-forward: Form Report child resources are list-like `CustomListModel` resources and must follow the same standard gates where applicable: `ListModel.Flags = 1`, schema-supported `ListModel.Type = 32`, arrays for `Defs` and `Layouts`, and valid approval-form variable references. Do not use Business Travel import or workflow-publish practice as Form Report runtime proof.

Use this skill when a Yeeflow application needs Form Report resources or when studying/export-validating Form Report schema. A Form Report is an app-level reporting resource based on an approval form. It is not a standalone data list, does not own a workflow, and must not be treated as an editable record store.

Current proof boundary: export-proven and validator-backed only from `docs/studies/form-report-resource.md` and normalized refs under `docs/studies/normalized/form-report/`. Do not claim runtime behavior until a focused import/open/designer/submission/export-back baseline passes.

## FormNewReports Workflow Report Standard

Product clarification for v0.6.9: `FormReports` is the legacy workflow report collection and is not required for generated YAPK apps. `FormNewReports` is the current workflow report collection. Generated workflow reports must be written to `FormNewReports`; validators must not require `FormReports`, but may allow it as legacy when old packages include it. A generated package with workflow report content only in legacy `FormReports` is invalid because current workflow reports must use `FormNewReports`.

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

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the v0.5.12 app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; and generated non-system `FieldName` suffix matching `FieldIndex`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom Form Boundary

Data List custom list forms from `docs/studies/data-list-custom-form-fields.md` are normal editable/list-entry surfaces for Type `1` data lists. Do not transfer those custom form layouts, temp variables, or form actions into Form Report generation. Form Reports remain read/reporting-oriented Type `32` resources generated from approval-form submissions and should not receive editable Data List custom forms or Data List form actions unless a future Form Report export proves a distinct supported shape.
<!-- data-list-custom-form-fields-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Guardrails

Form Report packages must satisfy the same YAP schema-standard envelope as other app resources. The root `Item` and the matching Type `32` child resource for each Form Report must include `Defs` and `Layouts` arrays; empty arrays are valid, but `null` is invalid. Validate with `scripts/inspect-yap-schema-standard.mjs` before import attempts.

Access app resource permission flags for Form Reports currently have a product conflict: `yap-schema.json` says `formReports` uses Read `8`, while the updated rules document says Submit `1`. Keep Form Report access-resource permission generation warning-level until product team clarifies. This does not resolve the separate Form Report field-source runtime diagnosis.
<!-- yap-schema-standard-learning:end -->
