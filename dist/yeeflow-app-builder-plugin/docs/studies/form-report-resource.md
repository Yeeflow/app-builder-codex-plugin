# Yeeflow Form Report Resource Study

Proof boundary: export-proven and validator-backed only. This pass studied `<downloads>/AI Training-2 (1).yap` read-only, generated redacted normalized references under `docs/studies/normalized/form-report/`, and did not import, open, execute, mutate, or runtime-test the package.

## Summary

The export proves Form Report is an application-level resource represented in two linked places:

- `Data.FormNewReports[]` stores the report configuration.
- `Data.Childs[]` stores a matching child resource where `ListModel.Type = 32` and `ListModel.ListID = FormNewReports[].ID`.

The export contains one approval form and four Form Reports. All four Form Reports reference the same approval form through `Data.FormNewReports[].DefKey`, which resolves to `Data.Forms[0].Key`. This proves one approval form can have multiple Form Reports in the export schema.

The export does not prove item mutation behavior, Excel export execution, row click runtime behavior, report row multiplication at runtime, or Form Report usage as a data source by lookup/data-table/dashboard/chart controls. Those remain product-understanding-backed or unproven until a focused runtime baseline is run.

## Inventory

| Report | Report resource | Source approval form | Selected variables | Selected sub-list | Sub-list fields | Filter | Views | Detail access | Export setting | Proof |
| --- | --- | --- | ---: | --- | ---: | --- | ---: | --- | --- | --- |
| `<form-report-1>` | `<report-id-1>` | `<approval-form-key-1>` | 38 | none | 0 | none | 3 | enabled in default/custom views | enabled | export-proven |
| `<form-report-2>` | `<report-id-2>` | `<approval-form-key-1>` | 38 | none | 0 | two conditions | 1 | disabled | enabled | export-proven |
| `<form-report-3>` | `<report-id-3>` | `<approval-form-key-1>` | 38 | `vlist_field_37` | 3 | none | 1 | enabled | disabled | export-proven |
| `<form-report-4>` | `<report-id-4>` | `<approval-form-key-1>` | 6 | `vlist_field_38` | 6 | none | 1 | enabled in view, disabled at resource attr | enabled | export-proven |

Names, labels, tenant IDs, user IDs, org data, report titles, list titles, form titles, and category values are redacted in committed study artifacts.

## Export Paths

| Concept | Export path | Notes | Proof |
| --- | --- | --- | --- |
| App resource/nav entry | `Data.Item.ListModel.LayoutView.sort[]` | Type `32` entries point to report child resources. One of four reports is present as a child resource but not visible in the observed root nav sort array. | export-proven |
| Form Report config | `Data.FormNewReports[]` | Keys observed: `ID`, `DefKey`, `Name`, `Description`, `Attr`, `Settings`. | export-proven |
| Child resource | `Data.Childs[]` | Report resources have `ListModel.Type = 32`, `Perm = 4`, and fields/views like list-like resources. | export-proven |
| Source approval form | `Data.FormNewReports[].DefKey` -> `Data.Forms[].Key` | All reports reference the same approval form key. | export-proven |
| Field config | `Data.FormNewReports[].Settings.Fields[]` | `Settings` is JSON string with `Fields`, `Filters`, and `SubListID`. | export-proven |
| Field display names | `Settings.Fields[].Name`, `Label`, `PropName` | Values are redacted; paths are stable. | export-proven |
| Field type | `Settings.Fields[].L_Type` with `Type` | `L_Type` is the report display/control field type; `Type` preserves source-ish variable category. | export-proven |
| Variable reference | `Settings.Fields[].ID`, `Key` | Main variables use keys like `v_<variableId>`. List variables use `vlist_<variableId>`. | export-proven |
| Sub-list reference | `Settings.SubListID` | Empty string means no selected sub-list; one string selects one list variable. | export-proven |
| Sub-list fields | `Settings.Fields[].Key = <SubListID>_<subFieldId>` | The field `ID` remains the parent list variable id; `Key` identifies the sub-list field. | export-proven |
| Filter condition | `Settings.Filters` | Null/absent means no filter in this export; filtered sample uses an array of condition objects. | export-proven |
| Export/detail flags | `Data.FormNewReports[].Attr` and child `ListModel.LayoutView` | `isViewDetail`, `isExport`, and `Attr_IsViewDetail` were observed. | export-proven |
| Views | `Data.Childs[].Layouts[]` | Type `0` list views are used. Some LayoutView payloads include `layout`, `sort`, `query`, `rowColor`, and `filter`. | export-proven |
| Permissions | `Data.Childs[].ListModel.IsBreakInherit`, `Perm` | This export only proves inherited permission shape (`IsBreakInherit = false`). Custom permission group shape was not found. | export-proven gap |

## Field Mapping Findings

Export-proven mappings found:

| Approval variable type | Report field types found | Additional settings found | Proof |
| --- | --- | --- | --- |
| `text` | `input`, `textarea`, `richtext` | none for text/rich text | export-proven |
| `number` | `input_number`, `percent`, `currency` | `rounded-to`, `displayThousandths`, `currencyCode`, `displayFormat` | export-proven |
| `boolean` | `switch` | `displayStyle` | export-proven |
| `date` | `datepicker`, `time` | `showtime`, `dateformat` | export-proven |
| `file` | `file-upload` | none | export-proven |
| `img` | `icon-upload` | none | export-proven |
| `user` | `identity-picker` | `multiple` | export-proven |
| `groupselect` | `organization-picker` | `multiple`, `metadata-treeselect` | export-proven |
| `location` | `location-picker` | none | export-proven |
| `costcenter` | `cost-center-picker` | `multiple` | export-proven |
| `metadata` | `metadata` | `source`, `categoryId` | export-proven |
| `mutiple-metadata` | `mutiple-metadata` | `source`, `categoryId` | export-proven |
| `lookup` | `lookup` | `appid`, `listid`, `listfield`, optional `multiple` | export-proven |
| `list` | `textarea` | `listref` | export-proven |
| selected sub-list field `text` | `input` | none | export-proven |
| selected sub-list field `number` | `input_number` | `rounded-to`, `displayThousandths` | export-proven |
| selected sub-list field `date` | `datepicker` | `showtime`, `dateformat` | export-proven |
| selected sub-list field `user` | `identity-picker` | `multiple` | export-proven |
| selected sub-list field `lookup` | `lookup` | `appid`, `listid`, `listfield` | export-proven |
| selected sub-list field `file` | `file-upload` | none | export-proven |

User-provided/product-understanding mappings not found in this export:

- Text variable to Percent, Switch, Signature, Number, Currency, Date picker, Time picker, User, Department, Location, Cost center, Attachment, and Image.
- Attachment variable to any field type beyond `file-upload`.
- Location variable multiple behavior.
- Lookup display using a non-`Title` display field.

These are allowed as product expectations only after Help Center or runtime proof. Validators should warn on unknown mappings, not hard-fail compatibility exports.

## Additional Field Settings

Observed settings:

- Number: `rounded-to`, `displayThousandths`.
- Percent: `rounded-to`.
- Currency: `currencyCode`, `displayFormat`, `displayThousandths`, `rounded-to`.
- Switch: `displayStyle`.
- Date picker: `showtime`, `dateformat`.
- Time picker: `dateformat`.
- User: `multiple`.
- Department: `multiple`, `metadata-treeselect`.
- Cost center: `multiple`.
- Lookup: `appid`, `listid`, `listfield`, optional `multiple`.

The export uses numeric/string date format codes rather than literal `HH`, `HH:MM`, or `HH:MM:SS` labels. The UI-label mapping for those codes is not runtime-proven in this pass.

## Sub-list Behavior

Export-proven:

- `Settings.SubListID = ""` means no selected sub-list.
- `Settings.SubListID = "vlist_<variableId>"` selects one approval form list variable.
- When a sub-list is selected, report fields can include both normal approval variables and selected sub-list fields.
- Selected sub-list fields use `Key = <SubListID>_<subFieldId>`.
- Field keys must be unique within the report.
- Only one sub-list string is represented in each studied report.

Product-understanding-backed, not runtime-proven:

- If no sub-list is selected, one submitted approval request becomes one report row.
- If one sub-list is selected, report row count is driven by the number of sub-list rows.
- A request with three selected sub-list rows should appear as three report records.

Validator guidance: warn if more than one sub-list is generated or if a selected sub-list has no selected sub-list field mappings.

## Permissions

Export-proven:

- Report child resources use `ListModel.IsBreakInherit = false`, so this sample inherits application permissions.
- `ListModel.Perm = 4` is present on report child resources.
- `Attr.isExport` exists on report configs and appears mirrored into child `ListModel.LayoutView`.

Not found in this export:

- Custom administrators by users/departments/user groups.
- Custom View Report permission.
- Custom Export permission audience.
- All-users vs specific-users/departments/user-groups representation.

Validator guidance: if permission inheritance is disabled, warn when explicit administrator/view/export permission metadata is missing or opaque. Do not hard-fail custom permission gaps until an import-breaking shape is proven.

## Views

Export-proven:

- Form Reports support multiple `Data.Childs[].Layouts[]` list views.
- Views use `Type = 0`.
- Default views may have minimal `LayoutView` with only `Attr_IsViewDetail`.
- Custom views can include `layout`, `sort`, `query`, `rowColor`, `filter`, and `Attr_IsViewDetail`.
- `Attr_IsViewDetail` is the export flag for whether users can access the submitted form detail page from the view.

Cross-resource data-view update from `Data Lists (1).yap`:

- Data views are stored in the same `Layouts[]` family used by data lists and document libraries, with `Layouts[].Title`, `Type`, `Ext1.Url`, `IsDefault`, and `IsItemPerm` as top-level view metadata.
- Data-list export proves view type codes `0` list, `999` gallery, `104` kanban, and `100` calendar. The Form Report sample only proved `Type = 0`, so gallery/calendar/kanban Form Report view generation remains product-documented until a Form Report export proves those specific Type `32` settings.
- Default view detection should use `IsDefault = true`, not only the name `All Items`; the data-list export includes one default view renamed `All tasks`.
- Form Report views should continue recognizing `Attr_IsViewDetail` as a Form Report-specific detail-page access flag.

Runtime-sensitive:

- Whether row click actually opens or blocks the submitted detail page was not tested.

## Resource Relationships And Data Sources

Export-proven:

- Form Report relates to its source approval form through `DefKey`.
- Form Report appears as an app child resource with Type `32`.
- Type `32` entries can appear in root application navigation.

Not proven by this export:

- Lookup fields using Form Report as a data source.
- Data table or Collection controls using Form Report as a source.
- Summary/Pie/Column/Line/Pivot controls using Form Report as a source.
- Direct add/update/delete of report items.

The product understanding says Form Report can be used as a read/reporting data source. Keep that as product-understanding-backed until an export or runtime baseline demonstrates the referencing control schema.

## Validator Updates

`validate-yap-package.js` now adds warning-first Form Report checks:

- `Data.FormNewReports[].Settings` parses as JSON.
- `DefKey` resolves to an included approval form.
- A matching Type `32` child resource exists.
- Report fields have unique keys.
- Fields resolve to approval variables or selected sub-list fields.
- Known variable-to-report-field mappings are compatible.
- Field settings for number, percent, currency, switch, date/time, pickers, and lookup are recognized.
- One-sub-list-only guidance is enforced as a warning.
- Report resources should not define workflows or edit/create forms.
- View detail-page access flags are recognized.

Hard errors are reserved for clear generated-final structural failures. Compatibility exports should receive warnings/dependencies rather than runtime claims.

## Skill Recommendation

Recommendation: Option A, create a dedicated `yeeflow-form-report-generator` skill.

Reason: this export proves enough distinct reusable generation rules to justify a focused skill:

- a distinct app-level resource schema (`FormNewReports[]` plus Type `32` child resources),
- a mandatory approval-form dependency through `DefKey`,
- variable-to-report-field mapping rules,
- optional one-sub-list inclusion rules that change row granularity,
- list-view/detail-access rules,
- export/detail flags and permission inheritance behavior,
- no workflow and no direct item mutation surface.

The new skill must remain export-proven and validator-backed only until a focused runtime baseline imports, opens, configures, submits disposable approval requests, verifies row/detail/export behavior, and exports back for comparison.

## Recommended Next Step

After review/merge, run a focused Form Report runtime baseline branch. The baseline should generate the smallest safe package with one approval form, two Form Reports, one no-filter report, one selected-sub-list report, local validation, import/open/designer proof, disposable submissions, row-count/detail-access/export checks, and export-back comparison before plugin rebuild or broad generation use.
