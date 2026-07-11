# Workflow Query Data Golden Reference Standard

## Scope

This standard covers the `QueryData` workflow node in Approval Form workflows, Data List workflows, and Scheduled Workflows. It is separate from Form Action `querydata` steps.

Focused sources: `Approval form workflow sample-V1.6.yapk`, `Approval form workflow sample-v1.7.yapk`, and `Approval form workflow sample-v1.10.yapk`.

Proof boundary: the node, variable, List/Complex Type, Loop, assignment, Custom Service invocation, and condition structures are export-proven. Scheduled triggering, query execution, loop execution, assignment routing, email delivery, and Custom Service execution remain runtime-proof boundaries.

## Business Selection

Use Workflow Query Data when a server-side workflow needs data that is not already available in its current workflow context.

Preferred modes:

| Business need | Mode | Result contract |
| --- | --- | --- |
| Existence/count decision | `multiple_count_only` | No row target; save `totalCount` to a number workflow variable |
| Read one related record | `single_to_variables` | Map selected source fields to declared workflow variables |
| Process multiple rows | `multiple_to_list_variable` | Map selected source fields into a List variable backed by one ListRef/Complex Type definition |
| Store multiple rows as JSON text | `multiple_to_text_variable` | Use only when a downstream expression, Custom Service, or other proven JSON consumer requires text |

Do not query merely to display rows in a page. That is a form/dashboard decision and should normally use Collection or Data Table directly.

## Shared QueryData Node Contract

- Node stencil is `QueryData`.
- `properties.appid`, `listsetid`, `listid`, and `listtype` must resolve to an included source resource.
- Export-proven source types are Data List (`listtype = 1`), Document Library (`listtype = 16`), and Form Report (`listtype = 32`). Data Report remains `focused-learning-required` until its own training round.
- `filters` and `sorts` are arrays.
- Dynamic filter operands are expression-token arrays and use `showCus: false`.
- A Lookup comparison must compare `ListDataID` to the stored Lookup target identity, not its display title.
- `pageIndex` is a positive integer and defaults to `1`.
- `pageSize` is `1..1000`; use only the amount required by the business operation.
- `sorts[]` contains at most two entries. Each entry uses `SortName` and boolean `SortByDesc`.
- Workflow Query Data writes to normal workflow variables. It does not use page temp variables.

## Count-Only

Count-only is still `result.type = "multiple"`, but it intentionally has no row result target:

- `listName`, `vartype`, and `listParent` are empty strings;
- `fieldMap` and `fields` are `null`;
- `totalCount` names a declared number variable;
- `querycount_prefix = "__variables_"`.

The downstream branch must cover all possible count states. A common complete pair is `count > 0` and `count <= 0`. Yeeflow has no implicit default/else branch.

## Single Result to Workflow Variables

- `result.type = "single"`.
- `fieldMap` maps source field storage names to declared workflow variable IDs.
- Every target variable type must be compatible with the source field type.
- A queried User field mapped to a User workflow variable may feed a later Assignment Task assignee using the canonical workflow-variable expression-button shape.
- Branches after the query should handle both value-present and value-empty states when the returned value is optional.

## Multiple Results to List Variable

- The destination variable has `type = "list"` and `value = <listref-id>`.
- `variables.listref[]` contains that ListRef/Complex Type definition.
- `result.listName` is the List variable ID.
- `result.listParent = "__variables_"`.
- `result.vartype = "list"`.
- `result.fieldMap` maps every selected source field to a real field ID in the linked ListRef.
- `result.fields` is `null`; that array belongs to text/JSON result selection, not List-variable row mapping.

## Loop Modes

### Loop Through List Items

V1.6 proves a workflow List variable source:

- `Loop.properties.loopType = "list"`;
- `loopValue.prefix = "__variables_"`;
- `loopValue.value` resolves to a declared List variable;
- `bodyRef` resolves to the Loop body start node;
- body expressions use `type = "loop_ctx"`, `param.defid = <Loop node id>`, and `prop = "LoopItem.<ListRef field id>"`.

V1.7 additionally proves Data List Workflow Sub List iteration:

- `loopType = "list"`;
- `loopValue.prefix = "__list_"`;
- `loopValue.value` is the Sub List field ID;
- current iteration uses `exprType = "loop_ctx"`, `id = <Loop node id>`, `key = "LoopIndex"`;
- current row fields use `key = "LoopItem.<Sub List field id>"`.

### Loop Through Multiple Values

V1.7 proves:

- `loopType = "values"`;
- `loopValue.type = 2`;
- `loopValue.value` is a non-empty expression-token array that resolves to a multi-value value, such as a multiple User field;
- no `loopValue.prefix` is serialized;
- `bodyRef` resolves to a `LoopBody` node.

### Loop For Fixed Times

V1.7 proves:

- `loopType = "number"`;
- `loopValue.type = 2`;
- `loopValue.value` is an expression-token array; a fixed count uses `{ "type": "num", "value": "3" }`;
- no `loopValue.prefix` is serialized;
- `bodyRef` resolves to a `LoopBody` node.

The sample body sends email and then uses `Delay` with `type = "duration"`, `duration.count = "3"`, and `duration.unit = "Day"`. Repeated email and delay execution remain runtime-sensitive and require explicit safe proof.

For all modes, Loop body actions live under the matching `LoopBody.children[]`. Validators and generators must recursively inspect those nested actions rather than scanning only top-level `childshapes[]`.

## Data List Workflow Count-and-Upsert Pattern

V1.7 export-proves a `WorkflowType = 1` workflow registered through the host Data List `FlowMappings[]`:

- current Campaign `ListDataID` is used as a `list_field` expression in the QueryData filter;
- count-only output writes to a number workflow variable;
- an Inclusive Gateway covers `count > 0` and `count <= 0`;
- the positive branch uses `ContentList type = "edit"` with the same current-record identity filter;
- the zero/non-positive branch uses `ContentList type = "add"`.

This is the canonical exists-then-update/otherwise-add pattern for employee balances, budgets, inventory, and similar aggregate/register scenarios. The target fields and mutations remain business-specific.

V1.7 also proves two valid new-item `FlowMappings.FieldName` shapes: `null`, or a field that resolves to a real host-list `flowstatus` field. A normal text/business field must not be used as a substitute flow-status mapping.

## Document Library and Form Report Sources

V1.10 export-proves both source types in a Data List Workflow and in Data List custom-form Form Actions.

Document Library workflow query:

- source `listtype = 16`;
- Event lookup filter compares the document-library lookup field with the current Event `ListDataID` expression;
- rows map native document fields such as `Title` and `Text4` into a declared List variable backed by a matching ListRef;
- the sample uses `pageIndex = 2`, `pageSize = 3`, and two sorts: `Created desc`, then `Bigint2 asc`.

Form Report workflow query:

- source `listtype = 32`;
- the sample filters the Form ID storage field with the export `is not empty` operator (`op = "7"`, `right = null`);
- Form Report storage fields map into a declared List variable and matching ListRef fields;
- the sample uses `pageIndex = 3`, `pageSize = 1000`, and two sorts: submission date descending, then applicant ascending.

Form Report is a valid Query Data source but cannot host its own independent Form Action. A Form Action on an Approval, Data List, Document Library, or Dashboard surface may query it. Do not confuse source capability with host capability.

Form Action uses the same source type values through `attrs.querydata_list.ListType`. Single-result examples keep the normal single-query contract: omitted `querydata_type`, `querydata_fieldmap`, and `querydata_fields = null`. Targets still follow the host rules: workflow variables on Approval forms, temp/current fields on Data List or Document Library forms, and temp variables only on Dashboard.

## Custom Service and Email Chain

A List variable can be passed to an included Custom Service through an `InvokeCode` parameter with `valueType = "list"`. A text output can be saved to a declared text workflow variable and consumed by a later Send Email node.

The V1.6 sample contains a literal organizer email. Treat that as sample-specific data, never as a reusable golden value. Generated workflows must use an approved workflow variable, list field, configured recipient, or an explicitly approved safe test recipient.

## Host Consistency

Approval, Data List, and Scheduled workflows use the same `QueryData` result contract. Host context differs:

- Approval workflows use `WorkflowType = 2` and may reference Approval workflow variables and Approval fields.
- Data List workflows use `WorkflowType = 1` and may additionally use current-record/list-field context where export-proven.
- Scheduled Workflows use `WorkflowType = 3`, have `ListID = 0`, and have no current approval instance or page temp variables; declare every result, count, List, and output variable explicitly.

The QueryData node contract is shared, but the enclosing workflow resource, trigger, and context expressions are host-specific. Do not copy an Approval workflow envelope into a Data List or Scheduled Workflow.

## Current Generation Boundary

The shared full-app materializer currently emits QueryData nodes through the Approval Workflow (`WorkflowType = 2`) resource builder. V1.6/V1.7 provide export-backed contracts and validators for Scheduled/Data List Workflow QueryData, List variables, ListRef/Complex Types, all three Loop modes, InvokeCode, MailTask, Delay, and ContentList composition, but they do not by themselves complete the missing Scheduled/Data List Workflow resource materializer.

Until those host builders are wired into full-app materialization:

- Scheduled/Data List Workflow QueryData may be planned and validated against this standard;
- generated Scheduled/Data List Workflow payloads require a focused export-shaped builder and proof;
- generation must fail or report `focused-proof-required` rather than silently omit the workflow or claim full-app completion;
- Approval Workflow QueryData may use the shared materializer modes implemented by this training.

## Required Validation

Generated-final validation must reject:

- multiple count-only nodes incorrectly forced to have `listName`;
- multiple List results without a List variable and matching ListRef;
- `fieldMap` targets absent from the linked ListRef;
- single-result mappings to undeclared or type-incompatible workflow variables;
- invalid page size/page index;
- more than two sort entries or malformed sort entries;
- source types other than export-proven `1`, `16`, or `32` without a new focused learning baseline;
- count targets that are missing or not number variables;
- Loop list mode targeting a non-List variable or missing ListRef;
- Loop `bodyRef` that does not resolve;
- Data List Sub List Loop that does not use `__list_` or whose field is unresolved;
- values/number Loop that incorrectly requires or emits `loopValue.prefix`;
- values/number Loop without `loopValue.type = 2` and a non-empty expression-token array;
- nested LoopBody actions skipped by workflow action validation;
- Lookup filters that use display text instead of stored target identity;
- query-derived User assignment that does not use a declared User variable;
- count branches that do not cover the complementary zero/non-zero case.

## Source Discrepancy Preserved

The V1.6 `Query Campaigns` node exports with `filters: []`, despite the accompanying business description saying it filters by `SelectedCampaign`. Do not promote that absent filter as a golden filter example. Use the export-proven `Get Campaign Owner` filter for the canonical Lookup `ListDataID` expression-token shape.
