# Data List Generation Standard

## Purpose

This standard defines the minimum quality rules for generated Yeeflow data lists in full application packages. It converts repeated runtime findings from generated applications, especially the Vendor Onboarding application, into hard generation and validation requirements.

Generated data lists must not be technically present but unusable. A generated data list is not complete until its fields, default view, choice options, lookup relationships, lookup display fields, and sample data are usable in the runtime UI.

## Golden Reference Cases

Use these prior proven patterns as references:

- Vendor Onboarding v4.1: `Vendors` is the master list. `Vendor Documents`, `Compliance Reviews`, and `Vendor Activity / History` depend on `Vendors` through lookup fields.
- Department Access Management: `Departments` is created before dependent request/employee lists, and dependent sample rows reference the target list sample record IDs.
- Related data-list staged lookup pattern: reference lists must exist before dependent lookup sample data is generated.

## Required Data List Quality Rules

Every generated data list must include:

1. Valid list schema.
2. Native `Title` field preserved.
3. Unique `DisplayName`, `FieldName`, and `InternalName` values.
4. Correct `FieldName` suffix and `FieldIndex` alignment.
5. Default data view with meaningful display fields.
6. Populated options for every choice field.
7. Complete lookup field rules for every cross-list relationship.
8. Sample data when the application is intended for runtime testing.
9. Custom New/Edit/View forms assigned through list display settings; generated business lists must not use default form routing.
10. Export-shaped default view metadata that materializes columns in the runtime UI.

When the App Plan supplies an explicit schema-safe internal field key, the generated field must preserve it. Do not infer or renumber over planned keys such as `Text5`. A planned `Status | Text5` field must materialize as `FieldName = Text5`. Current generated-final YAPK schema stores identity-picker controls on Text-backed storage fields, so planned user/person fields such as `Requester` or `Assigned Agent` must preserve identity-picker control behavior with schema-safe `Text*` field keys rather than regressing to ordinary text inputs. Placeholder filtering for resource names must not be applied to field display names; `Status`, `State`, `Stage`, `Priority`, `Requester`, `Assigned Agent`, and similar domain labels are real fields unless the App Plan explicitly marks them as not planned.

App Plans may define all Data List fields in one consolidated schema table instead of one heading per list. The generator must treat tables with columns such as `List`, `Field label`, `Internal field`, `Field type`, and `Purpose` as authoritative data-list schemas. Each row must be grouped by the `List` value and materialized into that list's `Childs[].Fields`; headings such as `Data List Schema Table` are not resource names. The generator must preserve explicit `Internal field` values, infer Yeeflow storage from `Field type`, and infer select options from the `Purpose` column when it lists business values such as `Low, Medium, High, Critical` or `Open, In Progress, Resolved, Closed`. Lookup fields described by purpose text such as `Lookup to Tickets` must emit complete lookup runtime rules with the target list ID and a valid display field. Text identifiers such as `Ticket Number` must remain Text/input fields unless the App Plan explicitly marks the field as Decimal/Number.

Field-table parsing must also tolerate legacy planning headings that appear in real generated plans. `Display Name` is an alias for `Field label`, `Storage Name` is an alias for `Internal field` / `Field name`, and `Control` may be used when `Field type` is absent. In that case, infer schema-safe storage from the control shape: `input_number`/number/currency/amount controls map to Decimal, date/datetime controls map to Datetime, switch/checkbox/boolean controls map to Bit, and text/select/identity/lookup/file/image controls remain Text-backed unless an explicit field type says otherwise. Recognizable field tables must never silently collapse a business data list to the native `Title` field only; unsupported headings should fail planning/materialization validation before package handoff. When a planned Data View references non-Title columns, query/search fields, or fixed filters, the host Data List must have a parseable field table; if not, stop with `DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW` rather than generating a Title-only default list.

## Custom Data List Form Layout Templates

Every generated business Data List or Document Library must have custom Data List forms assigned for New Item, Edit Item, and View Item. Default layouts are not signing-ready for generated business lists.

Generated custom Data List forms must use Data List Form Layouts v1.1 when they are planned as New Item, Edit Item, or View Item forms.

Approved page-level templates:

- `data_list_form_layout_new_edit_v1_1` for New Item and Edit Item forms
- `data_list_form_layout_view_item_v1_1` for standard View Item forms
- `data_list_form_layout_workbench` for full-page Workbench View Item forms

The source registry is `docs/reference/data-list-form-layout-templates.json`.

Generators must clone the selected export-shaped template first and then place business-specific fields, actions, analytics, or related data only inside approved business-content slots. They must not generate title-only, flat, or ad hoc custom Data List form layouts.

`ListModel.LayoutView.add`, `ListModel.LayoutView.edit`, and `ListModel.LayoutView.view` must each point to a Type `1` custom form layout owned by the same list. The literal value `default`, missing display settings, unresolved layout IDs, or Type `0` data views used as form routes must fail generated-final validation. System/support lists may skip this requirement only with an explicit App Plan exemption and generated package policy marker.

Current-record Data List fields inside generated New/Edit/View custom forms must use the field-layout golden reference `data_list_form_fields_grid_v1_1` from `docs/reference/data-list-form-field-layout-templates.json`. The generator must clone `form_grid_fields_wrapper` into the page-level template's `section_content_area`, place field controls inside that Grid, set every field control margin to zero, assign each field control a business-specific `nv_label`/`nav_label`, keep Multiple line/Rich text/Sub list controls as full-row controls, and keep responsive column spans bounded by the parent Grid's columns. Sub list field controls must clone the control-level `data_list_form_control_sublist_v1_1` template from `docs/reference/data-list-form-control-sublist.template.json` and preserve its locked style/table/header/card settings while mapping business field metadata.

New/Edit forms must focus on the current list item and must not include related Collection/Data Analytics/KPI regions. View Item forms may show current-record information plus related business data, approved Collection templates, Data Analytics templates, and KPI regions.

Generated-final packages must pass:

```bash
node scripts/validate-data-list-form-layout-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
node scripts/validate-data-list-form-fields-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

Signing readiness, install/import, upgrade, and runtime proof must remain blocked when custom Data List form layouts fail this gate.

## Default Data View Rules

Every generated data list must configure the default data view with visible display fields.

Required:

- Include `Title` or the primary name field.
- Include 3 to 8 useful business fields when available.
- Put status, owner, type, date, amount, risk, or priority fields near the front.
- Include lookup fields that help users understand relationships.
- Do not leave the default view display field list empty.
- Do not rely on a simplified `Layouts[].LayoutView.layout` shape only. API install acceptance does not prove that Yeeflow runtime will materialize data-view columns.
- Use the export-proven default view metadata shape: `Layouts[].Ext1 = "{\"Url\":\"default\"}"`.
- Use full column objects in `Layouts[].LayoutView.layout`, not field-name-only shortcuts.

Example for `Vendors`:

```text
Vendor Name
Vendor Type
Country / Region
Risk Level
Onboarding Status
Compliance Status
Owner
Renewal Date
```

Example for `Vendor Documents`:

```text
Document Name
Vendor
Document Type
Review Status
Expiry Date
Reviewer
```

Generated-final validation must fail when a default data view has no display fields.

## Data View Fixed Filters

Every generated data view must follow `docs/standards/data-list-view-filter-standard.md`.

Planning and materialization rules:

- Default/all-record views may use `LayoutView.filter: []`.
- Business-specific views must materialize their fixed dataset constraints into `LayoutView.filter[]`.
- User-facing filter/search fields belong in `LayoutView.query[]`; they do not satisfy a fixed filter requirement.
- Section 13 fixed-filter column aliases such as `Filters` and `Data Filters` must be parsed the same as `Filter Conditions`.
- Non-empty fixed-filter cells must be executable field-level conditions. Vague phrases such as `All active meetings` must be converted to concrete filters, for example `Meeting Status = Active` or `Meeting Date is not empty`, before generation.
- If the fixed-filter text is non-empty and not an explicit all-record/no-filter marker, generated `LayoutView.filter[]` must contain at least one condition or materialization must fail.
- `op: "7"` with `right: null` is the export-proven non-empty check.
- `pre: "and"` and `pre: "or"` are both valid and must be preserved from the App Plan.
- Business wording such as `Date >= Today` must be converted to the export-proven `now` expression for Data View filters.

Example:

```json
{
  "pre": "and",
  "left": "Datetime1",
  "op": "3",
  "right": [
    {
      "type": "func",
      "func": "now",
      "params": []
    }
  ],
  "showCus": false
}
```

## Default View Runtime Materialization Shape

The default data view must use the export-proven shape that Yeeflow recognizes at runtime. A package can install successfully and still render an empty data view when the view metadata is too simplified.

Required default view metadata:

```text
Layouts[].Title = "All Items" or a business-specific view title
Layouts[].Type = 0
Layouts[].IsDefault = true
Layouts[].Ext1 = "{\"Url\":\"default\"}"
Layouts[].LayoutView = JSON string with layout/query/sort/filter metadata
```

Each visible column object inside `LayoutView.layout` must include:

```text
FieldID
FieldName
DisplayName
Type
Order
Mobile
Show
```

Recommended column object shape:

```json
{
  "FieldID": "<field id>",
  "FieldName": "Text2",
  "DisplayName": "Account Owner",
  "Type": "input",
  "Order": 1,
  "Mobile": 2,
  "Show": true
}
```

`LayoutView.query` should include the visible field names plus common system fields used by runtime views:

```text
ListDataID
CreatedBy
ModifiedBy
Created
Modified
```

Do not treat these as sufficient:

```text
layout: ["Title", "Text1", "Text2"]
layout: [{ "FieldName": "Text1" }]
layout: [{ "field": "Text1" }]
```

These simplified shapes can pass local structural checks but still fail runtime materialization, leaving views such as `All Accounts` or `All Health Signals` with no visible columns.

Suggested hard error:

```text
DEFAULT_VIEW_DISPLAY_FIELDS_MISSING
DEFAULT_VIEW_EXT1_URL_MISSING
DEFAULT_VIEW_COLUMN_SHAPE_INCOMPLETE
DEFAULT_VIEW_RUNTIME_MATERIALIZATION_RISK
```

## Choice Field Option Rules

Every single-select, multiple-select, multi-select, radio, checkbox, select, or tag-style field must include non-empty business-specific options.

Required:

- Use the runtime-visible, export-proven option shape in `Rules.choices`.
- When color metadata is useful, also include aligned `Rules.color_choices`.
- Do not use `Rules.Options`, `Rules.options`, `Rules.Items`, `Rules.Choices`, top-level `Options`, or top-level `Choices` as the only option source. Those paths can pass loose structural checks but are ignored by the runtime dropdown UI.
- Do not create blank option rows.
- Do not create generic options such as `Option 1`, `Option 2`, unless the user explicitly requested them.
- Options must match the business domain.
- Status and lifecycle fields must include all expected statuses used by dashboards, filters, forms, and sample data.
- Apply this rule equally to single-select and multiple-select fields. Multiple-select fields must not be treated as text-only fields without options.
- Sample data values for choice fields must match one or more configured `Rules.choices[].value` entries.

Recommended option shape:

```json
{
  "choices": [
    { "key": "1", "value": "Low", "color": "#22c55e" },
    { "key": "2", "value": "Medium", "color": "#f59e0b" },
    { "key": "3", "value": "High", "color": "#ef4444" }
  ],
  "color_choices": [
    { "key": "1", "value": "Low", "color": "#22c55e" },
    { "key": "2", "value": "Medium", "color": "#f59e0b" },
    { "key": "3", "value": "High", "color": "#ef4444" }
  ]
}
```

Example `Risk Level` options:

```text
Low
Medium
High
Critical
```

Example `Document Type` options:

```text
Insurance Certificate
Tax Form
Security Assessment
Contract
Compliance Evidence
```

Example `Review Status` options:

```text
Not Started
In Review
Needs Information
Approved
Rejected
Expired
```

Generated-final validation must fail when a choice field has missing or blank options.

Suggested hard errors:

```text
CHOICE_OPTIONS_MISSING
CHOICE_OPTION_BLANK
CHOICE_OPTION_GENERIC
CHOICE_OPTION_RUNTIME_SHAPE_MISSING
CHOICE_SAMPLE_VALUE_NOT_IN_OPTIONS
MULTI_SELECT_OPTIONS_MISSING
MULTI_SELECT_SAMPLE_VALUE_NOT_IN_OPTIONS
```

## Lookup Relationship Rules

When data lists are related, the generator must model the relationship as Yeeflow lookup fields instead of duplicating the related record name as plain text.

Required:

- Identify master/reference lists before generating dependent lists.
- Create master/reference lists first.
- Create lookup fields in dependent lists.
- Configure lookup `Rules` with target AppID, ListSetID, ListID, and display field metadata.
- Select a valid display field from the target list, usually `Title` or the target list primary name field.
- Do not point lookup display fields to nonexistent fields such as `Text0` when the target list uses `Title`.
- Include lookup fields in default views and forms where users need the relationship.

For parent/detail relationships, also plan reverse-related View Item sections. When list B contains a lookup field to list A and users need to inspect B records while viewing A, the parent list A View Item form should include a reverse-related Collection section:

- Host form: parent Data List View Item or Workbench View Item form.
- Child source: the dependent Data List that owns the lookup field.
- Read filter: child lookup storage field equals current host item `ListDataID`.
- Search: `search-filter.binding` must be consumed by `collection.attrs.data.fulltext[].value`, with `fulltext.fields[]` resolving on the child list.
- Add: if child creation is allowed, the Add `action_button` must target the child list and include `attrs.passvalues[]` mapping the child lookup field `FieldName` to the current host item `ListDataID` expression.
- Never write the parent title, display name, label, hardcoded ID, or sample row ID as the child lookup value.

This pattern is View-only by default. New/Edit forms must not include reverse-related Collections because a saved current `ListDataID` may not exist yet.

Vendor Onboarding required relationship example:

```text
Vendors
  <- Vendor Documents.Vendor lookup
  <- Compliance Reviews.Vendor lookup
  <- Vendor Activity / History.Vendor lookup
```

In this structure:

- `Vendors` must be created first.
- `Vendor Documents`, `Compliance Reviews`, and `Vendor Activity / History` must each include a `Vendor` lookup field.
- The lookup display field must resolve on `Vendors`, normally `Title` / `Vendor Name`.
- Dependent sample rows must use valid `Vendors` sample record IDs.

Generated-final validation must fail when lookup targets or display fields are unresolved.

Suggested hard errors:

```text
LOOKUP_TARGET_LIST_MISSING
LOOKUP_DISPLAY_FIELD_MISSING
LOOKUP_DISPLAY_FIELD_NOT_FOUND
LOOKUP_RULES_INCOMPLETE
LOOKUP_RELATIONSHIP_MODELED_AS_TEXT
```

## Data List Creation Order

When multiple lists are generated in one application, the creation order must follow dependency order.

Required order:

1. Master/reference lists.
2. Lists that depend on master/reference lists.
3. Transaction/detail/activity/history lists.
4. Dashboards and forms that bind to those lists.
5. Workflows/actions that depend on the lists.

Example:

```text
1. Vendors
2. Vendor Documents
3. Compliance Reviews
4. Vendor Activity / History
5. Dashboards and custom forms
```

If a dependency graph has multiple master lists, topologically sort the lists so every lookup target exists before dependent lookup fields and sample data are generated.

Generated-final validation must fail when a dependent list is generated before its lookup target is resolvable.

Suggested hard error:

```text
DATA_LIST_DEPENDENCY_ORDER_INVALID
```

## Sample Data Rules

When sample data is requested or needed for runtime testing, generate sample data in dependency order.

Required:

1. Generate sample data for master/reference lists first.
2. Use generated master record IDs as lookup values in dependent sample rows.
3. Generate dependent list sample data after the target lookup rows exist.
4. Keep sample data synthetic and tenant-neutral.
5. Do not use private tenant records, private URLs, or real customer data.

For generated-final app-level `.yapk` packages:

- Do not embed seed/sample rows in `Childs[].List.Items`, `Childs[].ListDatas`, or `Childs[].List.ListDatas`.
- Emit synthetic seed rows as a separate companion artifact.
- Seed artifacts for `identity-picker`, `lookup`, and `file-upload` fields must be structured live-write instructions, not plain strings. Identity-picker sample values must declare `seedValueType: "identity-picker"` and `requiresLiveUserResolution: true` so the runtime seed step resolves an existing tenant user before writing. Lookup sample values must declare `seedValueType: "lookup"`, `requiresLookupListDataIDResolution: true`, `storedValueField: "ListDataID"`, the target list, and the display field; the live seed writer must create/read the target rows first and write the target record `ListDataID`, never the lookup display title, code, or other display text. File-upload sample values must declare `seedValueType: "file-upload"` and `requiresFileUploadReference: true` so the runtime seed step waits for an uploaded file reference or leaves the field empty. The generated YAPK field shape remains schema-safe `FieldType: "Text"` plus `Type: "identity-picker"`, `Type: "lookup"`, or `Type: "file-upload"`; do not invent unsupported `FieldType: "User"` storage.
- Run live seed writes only after explicit approval, after install/materialization proof, and with before/after count reporting.
- Use `TriggerFlow: false` by default for demo/test seed writes unless the user explicitly asks to exercise workflows.

For app-level `.yap` packages or non-final local-only experiments where the target list and dependent list are packaged together:

- Local sample record IDs may be generated in the package.
- Yeeflow should remap target sample record IDs and dependent lookup values consistently during import/install.
- Export-back validation should confirm dependent lookup values resolve after import when runtime testing is available.

For standalone `.ydl` packages that reference an already-existing external lookup target:

- Use real imported target `ListDataID` values only when provided safely.
- Exclude external target record IDs from `ReplaceIds`.
- Do not invent external lookup target record IDs.

Generated-final validation must fail when sample lookup values reference missing target rows.

Suggested hard errors:

```text
LOOKUP_SAMPLE_TARGET_ROW_MISSING
LOOKUP_SAMPLE_VALUE_UNRESOLVED
MASTER_SAMPLE_DATA_MISSING
DEPENDENT_SAMPLE_DATA_ORDER_INVALID
```

## Form and View Relationship Rules

Default views and forms must expose relationships clearly.

Required:

- Lookup fields must be included in dependent list default views.
- Lookup fields must appear in New/Edit/View forms when the user needs to select or understand the related record.
- Lookup display fields must already be selected.
- Do not leave lookup fields with empty display-field settings.
- Known product issues, such as a lookup picker not returning records in a specific tenant, must be documented separately and must not be fixed by removing lookup display-field validation.

## Validator Checklist

Before a generated package is returned:

- [ ] Every data list has a non-empty default display field set.
- [ ] Every default view includes `Title` or primary name.
- [ ] Every default view has `Ext1.Url = default`.
- [ ] Every default view column uses the full export-shaped column object with `FieldID`, `FieldName`, `DisplayName`, `Order`, `Mobile`, and `Show`.
- [ ] Every choice field has non-empty, business-specific options.
- [ ] Single-select and multiple-select fields both have populated options.
- [ ] No choice field has blank option rows.
- [ ] Every cross-list relationship is modeled as a lookup field.
- [ ] Every lookup field has complete target metadata.
- [ ] Every lookup display field exists on the target list.
- [ ] Master/reference lists are generated before dependent lists.
- [ ] Master/reference sample rows are generated before dependent sample rows.
- [ ] Dependent sample lookup values point to valid target sample record IDs.
- [ ] Lookup fields are included in relevant views and forms.
- [ ] Custom Add/Edit/View forms load correctly or have safe default routing.

## Generator Checklist

When designing a generated application:

1. Identify master/reference lists.
2. Identify dependent lists and lookup relationships.
3. Draw or write the list dependency graph.
4. Generate fields with correct schema and options.
5. Generate master lists first.
6. Generate dependent lookup fields after targets are known.
7. Generate default data views with export-shaped metadata and meaningful display fields.
8. Generate sample data in dependency order.
9. Validate lookup display fields and sample lookup values.
10. Validate runtime-facing forms and dashboards against the data model.

## Failure Examples

These are quality failures:

- A data list opens with no display fields in its default view.
- A data list has fields in `LayoutView.layout` but the runtime view is empty because `Ext1.Url = default` or full column metadata is missing.
- A single-select field opens with blank option rows.
- A multiple-select field opens with blank option rows.
- A dependent list stores a related vendor name as plain text instead of a lookup to `Vendors`.
- A lookup field points to a nonexistent display field.
- A dependent sample row references a lookup target row that was never created.
- A dashboard expects related records but the underlying data model has no lookup relationships.

## Proof Boundary

This standard captures known generation lessons from Vendor Onboarding v4.1 and prior related-list lookup studies. It does not claim that every tenant's lookup picker runtime behavior is fully solved. If a lookup field is structurally correct but a product runtime API returns no records, record that as a product-team follow-up while keeping the generation requirements for lookup target metadata, display fields, and data dependency order.
