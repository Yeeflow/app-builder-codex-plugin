# Form Action Query Data v1.2 Custom Data List Form Training Report

## Training Input

- User-provided official export: `Approval form workflow sample-v1.2.yapk`
- `Event Planning` custom forms: `View event`, `New event`
- `Campaign` custom form: `View Campaign`
- Query source resources: `Campaign` and `Event Planning` Data Lists

The raw package, tenant IDs, source IDs, and decoded payload are evidence only and are not committed.

## Export-Proven Patterns

### View Item: single record to temp variables

`View event` binds the Query Data action through `formAction.onLoad`. It queries the related Campaign and maps Campaign name, description, and owner to declared temp variables. Text controls read the `__temp_` expressions. These values are page-session display state and are not stored in the Event record.

### New Item: field change to current fields plus temp variables

`New event` binds the action through the Campaign Lookup control's `control_event_rule`. Its single-record query uses a Lookup-field expression in `querydata_filters[].right`, then maps one source field to a temp variable and another to the current Event record through `____customListFields_<FieldName>`.

This establishes a Data List Form-only target contract. Plain `Text3` or Approval workflow-variable targets are invalid substitutes.

### Current record Sub list plus temp count

`View Campaign` runs on load and queries Event records whose Campaign Lookup points to the current Campaign `ListDataID`. It maps Event fields into the `Event Items` Sub list row schema, using:

- `querydata_type: "multiple"`
- `querydata_listname_parent: "__list_"`
- `querydata_vartype: "list"`
- host Sub list field in `querydata_listname`
- source-to-row-field mappings in `querydata_fieldmap`
- a declared temp count target through `querydata_totalparent: "__temp_"`

## Business Selection Rule

Collection or Data Table remains the default for read-only reverse-related display. Query-to-current-Sub-list is selected only when queried rows become editable line items or a working copy. A quotation is the canonical case: select a product type, load products into quote lines, then let the user edit quantity, description, or price before saving.

New/Edit Item is the preferred host for this pattern. The focused View Item sample proves the serialized structure but does not by itself prove persistence without a separate save/edit action and runtime test.

## Shared And Host-Specific Contracts

Shared with Approval Form Query Data:

- `type: "querydata"`
- source metadata, plural filters, ordered sorts
- omitted `querydata_type` as default single
- `__temp_` target expressions
- multiple query field maps and optional count output

Data List Form-specific:

- `____customListFields_<FieldName>` current-record targets
- `__list_` current Sub list parent
- `control_event_rule` for field-change execution
- host Data List field and Sub list row-schema validation

Approval-specific `__variables_` output targets must not be copied to Data List Forms.

## Plugin Changes

- Added two Data List Form golden templates.
- Extended the shared builder/classifier with current-field, mixed field/temp, and current-Sub-list modes.
- Expanded the package inspector to traverse both Approval and Custom Data List Forms and report trigger bindings.
- Added a generated-package validator for action binding, temp declarations, host fields, Sub list schemas, and parent contracts.
- Expanded App Plan modes and business-rationale checks.
- Added source/dist regression fixtures and preflight integration.

## Proof Boundary

This training is export-backed and validator-backed. It does not claim live query execution, form event firing, current-field persistence, Sub list save behavior, or count accuracy. Dashboard Form Action Query Data and non-Data-List sources remain deferred to focused exports.
