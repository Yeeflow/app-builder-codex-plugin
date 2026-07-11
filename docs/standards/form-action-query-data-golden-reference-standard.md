# Form Action Query Data Golden Reference Standard

## Scope

This standard governs `type: "querydata"` steps inside front-end Yeeflow Form Actions. Focused references include Approval Submission v1.1, Custom Data List Form v1.2, Dashboard v1.3, and pagination/temp JSON/Document Library/Approval Task Form v1.4.

The focused exports prove Approval Submission, Custom Data List Form, and Dashboard placement with Data List sources. Product guidance also allows Form Action Query Data on Approval task/print pages; those unstudied wrappers remain focused-proof-required. Public Forms must never contain Query Data steps.

Workflow Action Query Data is a different workflow-node surface and is outside this focused training.

## Golden Modes

Every planned Form Action Query Data step must select one explicit mode.

| Mode | Query type | Record output | Count output | Intended lifetime |
| --- | --- | --- | --- | --- |
| `single_to_variables` | Single, exported default may omit `querydata_type` | `querydata_fieldmap` to workflow variables | Optional | Persisted with Approval instance and usable by workflow |
| `single_to_temp_variables` | Single, exported default may omit `querydata_type` | `querydata_fieldmap` to `__temp_<id>` targets | Optional | Current page session only |
| `single_to_list_fields` | Single, exported default may omit `querydata_type` | current Data List fields through `____customListFields_<FieldName>` | Optional | Current record, persisted when the New/Edit form is saved |
| `single_to_list_fields_and_temp_variables` | Single, exported default may omit `querydata_type` | current Data List fields plus `__temp_<id>` display targets | Optional | Mixed persisted form state and page-session display state |
| `multiple_to_sublist` | `querydata_type: "multiple"` | Sub list variable through `querydata_listname`, `querydata_vartype: "list"`, `querydata_listname_parent: "__variables_"`, and field map | Optional | Persisted form Sub list / workflow context |
| `multiple_to_list_sublist` | `querydata_type: "multiple"` | current record Sub list through `querydata_listname_parent: "__list_"` | Optional temp count | Editable current-record working copy |
| `multiple_count_only` | `querydata_type: "multiple"` | None | Required through `querydata_totalcount` and `querydata_totalparent` | Workflow or page-session count only |

The previously proven `multiple_to_temp_collection` mode remains supported for transient aggregates/display, with explicit `querydata_fields[]`; it is not one of the four new v1.1 focused templates.

## Required Source Contract

`attrs.querydata_list` must contain confirmed source metadata:

```json
{
  "AppID": 41,
  "ListSetID": "<confirmed-list-set-id>",
  "ListID": "<confirmed-source-id>",
  "ListType": 1
}
```

Keep 19-digit IDs as strings. Do not copy source-template IDs into generated applications. Full-app generation must remap the source to the current API-issued resource IDs.

This focused export proves `ListType: 1` Data List queries. Document Library, Form Report, and Data Report are product-supported source categories but require focused exports before their exact `querydata_list` metadata is promoted as generation-safe.

## Filters And Sorts

- Use `attrs.querydata_filters` plural. The singular `querydata_filter` path is ignored by runtime.
- Literal operands use primitive `right` values and `showCus: true`.
- Dynamic/calculated operands use expression-token arrays and `showCus: false`.
- Never serialize expression-button HTML into `right`.
- Use explicit sorts for deterministic single-record selection. Multiple sort rows preserve their listed priority.
- A single-record query without filters or deterministic sort is a business-quality warning even when structurally valid.
- The Dashboard v1.3 export proves current-user membership filtering as `op: "11"` with `right: null`. Validators must not misclassify this exact nullary operator shape as an incomplete filter.

## Shared Pagination Contract

Approval Form, Custom Data List Form, and Dashboard Query Data use the same pagination semantics:

- omitted `querydata_pagesize` means Page Size `100`;
- explicit `querydata_pagesize` must be an integer from `1` through `1000`;
- omitted Page Number means `1`;
- business planning may request any positive Page Number.

The v1.4 export proves Page Size `5` and Page Number `2`. Serialize non-default Page Number as `querydata_pageindex`; omit it for default Page Number 1. Do not use guessed aliases such as `querydata_page` or `querydata_pagenumber`.

## Output Contracts

### Single To Workflow Variables

Every `querydata_fieldmap` source key must be a real source field. Every target must be a declared workflow variable with a compatible business type. Use this mode when the value must be submitted, persisted, used by workflow routing, or shown on task forms.

### Single To Temp Variables

Every target is serialized as `__temp_<temp-variable-id>`, while the declared temp variable id remains unprefixed under `variables.tempVars[]`. Use this mode only for client-side display and calculations during the current page session.

### Single To Current Data List Fields

- Only Custom Data List New/Edit forms should normally write current-record fields.
- Encode each target with `____customListFields_<FieldName>`; never emit a plain field name.
- `single_to_list_fields_and_temp_variables` may combine current-field targets with declared `__temp_` targets in one field map.
- A field-change trigger is stored on the source field control as `attrs.control_event_rule = <action id>`.
- Use this pattern for dependent-field enrichment after a Lookup selection, such as copying Campaign owner into an Event field while displaying the Campaign description through a temp variable.

### Multiple To Sub List

- The target basic variable must have `type: "list"` and reference a valid `variables.listref[]` definition.
- Every source field must map to an existing row field in that list reference.
- Count output is optional. If it uses `__variables_`, the target must be a number variable.

### Multiple To Current Record Sub List

- Set `querydata_listname_parent: "__list_"`, `querydata_vartype: "list"`, and `querydata_listname` to the host Data List Sub list field name.
- Every `querydata_fieldmap` target must exist in that Sub list control's `list-variables`/`list-fields` schema.
- A result count may use a declared temp variable through `querydata_totalparent: "__temp_"`.
- Prefer New/Edit forms because queried rows are intended to become an editable working copy that is persisted with the host record.
- The v1.2 `View Campaign` sample proves that a View Item custom form can carry this structure, but generation requires an explicit save/edit workflow and business rationale.
- Do not use this pattern merely to show reverse-related rows. Use Collection or Data Table for read-only display. Query into Sub list is appropriate for quotation/product-line scenarios where users edit quantity, description, price, or other loaded row values.

### Multiple Count Only

Count-only output must not retain hidden/stale record-output settings. Omit all of:

- `querydata_fieldmap`
- `querydata_fields`
- `querydata_listname`
- `querydata_vartype`
- `querydata_listname_parent`

The v1.1 source export's fourth step retained Sub list settings while its UI/business intent was count-only. Treat those fields as designer residue, not as the normalized golden template.

### Dashboard Temp Outputs And Chained Queries

- Dashboard pages declare and use temp variables only. Single-query field maps use `__temp_<id>`; result counts use `querydata_totalparent: "__temp_"`; transient collections also use `__temp_`.
- Workflow-variable, current-record field, and current-record Sub list targets are forbidden on Dashboard Query Data.
- Preserve Query Data step order. A later query may filter by a temp ID produced by an earlier query in the same action.
- A chained filter uses expression tokens and `showCus: false`.
- Guard a chained query with `isNullOrEmpty(__temp_<id>) == false` so an absent prior result does not start an invalid dependent query.
- Generated steps require concise business names. Do not preserve an empty step name merely because a manually configured export omitted it.
- A count-only result may drive Text and Dynamic Display. The v1.3 reference shows details only when the count is not empty and greater than zero.
- A multiple query may save selected `querydata_fields[]` to a declared temp JSON value with `querydata_vartype: "text"` and `querydata_listname_parent: "__temp_"`, while also returning a count.
- The temp JSON value is not a Collection/Data Table data source. Use exact function `JSONStringfy` for text output. Use a planned Custom Code control only when a business requirement needs custom tabular processing/display.

### Document Library Custom Forms

- A native `Type: 16` Document Library custom form uses the same Form Action wrapper and Query Data step contracts as a Data List custom form.
- Current-field, current-Sub-list, temp, trigger, pagination, and target validation rules are shared.
- A Document Library lookup may be used as a `list_field` expression operand with `showCus: false` to query its related Data List record.
- This proves Document Library as a host. Querying Document Library records as a source still requires source-specific export proof.
- Form Report and Data Report do not host independent Form Actions. Form Report details use the Approval Submission form; Data Report has no custom form surface.

### Approval Task Forms

- Approval Task Form pages (`pageurls[].type: 2`) use the same `formdef.formAction`, `formdef.actions[]`, trigger, step, and pagination serialization as Submission Form pages.
- Validate each Task Form's declared variables/temp variables and action binding in its own page context.

## Host Rules

- Allowed by product guidance: Approval Submission, Approval task, Approval print, custom Data List form, Dashboard.
- Forbidden: Public Form.
- Temp variables are page scoped and must not be represented as persisted Approval/Data List values.
- Dashboard Query Data targets temp variables only.
- Custom Data List page-load actions use `formAction.onLoad`; field-change actions use the field control's `control_event_rule`.
- Every Query Data action must be bound to at least one proven trigger. An action present only in `actions[]` is not executable.
- Do not transfer Approval Submit/Save steps to Dashboard actions.

## App Plan Contract

Every Query Data row must state:

- action and step name;
- host surface/page and trigger;
- one exact golden mode;
- source resource type/name;
- filters and sorts;
- result target type/name;
- source-to-target field mapping;
- count target type/name;
- persistence/page-lifetime intent;
- proof boundary.
- Page Size and Page Number, including whether each uses its shared default.

Planning labels are resolved to current source fields and declared workflow/temp/listref variables during generation. App Plans must not contain copied runtime IDs.

Run `node scripts/validate-form-action-query-data-plan.mjs --plan <app-plan.md>` before materialization whenever the Form Actions table includes Query Data.

## Hard Gates

Final generation fails when:

- source metadata is missing/incomplete;
- query type is unknown;
- multiple query has neither record output nor count output;
- count-only mode retains result mappings;
- single query lacks field mappings;
- mapped workflow/temp/Sub list row targets are undeclared;
- workflow count target is not numeric;
- temp collection omits selected fields;
- singular filters, HTML operands, or expression mode mismatches are present;
- Query Data is placed on a Public Form.
- a Custom Data List Form action is unbound;
- a temp target is undeclared;
- a current-record target omits `____customListFields_` or references a missing field;
- a `__list_` target is not a real Sub list field or maps to missing row fields;
- a Data List Form incorrectly uses Approval `__variables_` result targets.
- Page Size is outside `1..1000`;
- Page Number is not a positive integer or uses an alias instead of `querydata_pageindex`;
- a Dashboard result/count target is not a declared temp variable;
- a chained Dashboard query reads a temp before an earlier step produces it;
- a chained Dashboard query omits its not-empty guard.
- Collection/Data Table directly binds a Query Data temp JSON value.
- Query Data is hosted directly by a Form Report or Data Report.

Schema/package validation does not prove live query execution, returned values, count accuracy, or host-page trigger execution. Keep runtime proof separate.
