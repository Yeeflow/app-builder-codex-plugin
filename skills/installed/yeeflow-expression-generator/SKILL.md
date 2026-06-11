---
name: yeeflow-expression-generator
description: generate, inspect, validate, and document Yeeflow expression editor token arrays for calculated controls, dynamic display rules, validation rules, lookup/data filters, workflow conditions, default values, request numbers, and subtotal/total/date/string formulas.
---

# Yeeflow Expression Generator

Business Travel workflow-publish practice: expression-bearing workflow surfaces must resolve variable IDs before packaging. Sequence-flow conditions, assignment expressions, Set Variable values/targets, form bindings, and sub-list summary bindings cannot reference deleted or undeclared variables. If a summary-bound variable is renamed, update every `conditioninfo`, binding, and expression-token reference together. Treat unresolved workflow variables as publish blockers, not cosmetic warnings.

Use this skill when generating or validating Yeeflow expression editor output across approval forms, dashboards, data-list forms, lookup filters, workflow transitions, workflow action conditions, default values, request numbers, and calculated controls.

Data Filter variables appear in downstream data filter conditions as expression-token arrays with `exprType: "variable"`, `id: "__filter_<filterVarId>"`, and `name: "<filterVarId>"`. The Sales export proves this dashboard pattern in data table/list-like filters and report/chart extension `Conditions[]`; the CRM export additionally proves Search variables in `attrs.data.fulltext[]`, Hierarchy variables in `attrs.data.filter[]`, and Sorting variables in `attrs.data.sortingfilter[]`. Validate that `name` exists in the host page `filterVars[]` and that `id` matches the `__filter_` prefix. Do not invent expression shapes for unsupported host contexts; keep unknown filter variable shapes warning-first until an export proves them.

Pivot Table filter conditions can use the same Data Filter variable expression-token convention in `exts[].attr.settings.Conditions[]` when the referenced `__filter_<filterVarId>` resolves to the host page `filterVars[]`. The CRM Pivot Table export proves the Pivot Table `Conditions[]` location and static field conditions, but its Pivot Tables do not themselves consume Data Filter variables; treat Pivot Table filter-variable execution as product-understanding-backed until a focused export or runtime proof observes it. Validate condition fields, variable names, and `__filter_` ids before generated handoff.

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow Expression Context

`AI Agent and Copilot Local Resource Baseline8.yap` proves Scheduled Workflow actions may use legacy rich-text expression-button HTML strings in `MailTask.properties.subject` and `MailTask.properties.html` to reference workflow variables. The AI Assistant workflow action uses expression-object input mapping such as `exprType = "variable"`, `valueType = "text"`, `id = "QueryItems"`, and `type = "expr"`.

When generating new workflow conditions or filters, continue preferring expression-token arrays or proven operand wrappers. When reproducing MailTask rich text, preserve the Yeeflow expression-button HTML pattern exactly and validate referenced workflow variables.
<!-- scheduled-workflow-ai-assistant-learning:end -->

Package type note: expression fixes for a new app can be generated in `.yap`; expression fixes for an existing imported app should be delivered as `.yapk` only from a Yeeflow Version management baseline. Preserve existing IDs and do not assume `.yapk` app-resource mutation is safe while the studied `.yapk` payload remains opaque/signed.

## Source Of Truth

Use the active workspace references first:

- `yeeflow-expression-functions.normalized.json`
- `yeeflow-expression-function-knowledge-base.normalized.json`
- `yeeflow-expression-operators.normalized.json`
- `yeeflow-expression-utils.js`
- `docs/yeeflow-expression-editor-reference.md`
- `docs/yeeflow-expression-generation-rules.md`
- `docs/yeeflow-expression-use-cases.md`
- `docs/yeeflow-expression-function-reference.md`
- `docs/yeeflow-expression-reference-reconciliation.md`
- `docs/yeeflow-expression-editor-ui-contexts.md`

This skill is based on read-only expression training references. Do not bundle raw uploaded training files or screenshots.

## Core Token Rules

- Expressions are Yeeflow JSON token arrays, not JavaScript formulas.
- String literal: `{ "type": "str", "value": "abc" }`
- Number literal: `{ "type": "num", "value": "123" }`
- Boolean literal: `{ "type": "bool", "value": true }`
- Operator: `{ "type": "op", "op": "*" }`
- Function: `{ "type": "func", "func": "dateFormat", "params": [[...], [...]] }`
- Variable:

```json
{
  "exprType": "variable",
  "valueType": "number",
  "id": "Amount",
  "type": "expr",
  "name": "Workflow Variables:Amount"
}
```

Variable `valueType` may only be `number`, `text`, `date`, or `boolean`.

## Operators

Use only:

- arithmetic: `+`, `-`, `*`, `/`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `>`, `>=`, `<`, `<=`, `==`, `!=`
- concatenation: `&`

## Generation Defaults

- Use `iif` for conditional values.
- Use `isNullOrEmpty` for empty checks.
- Use `dateDiff`, `dateAdd`, and `dateFormat` for date logic.
- For `dateDiff`, encode the third date-unit parameter as a raw lowercase string such as `"year"` or `"day"`, not as an expression string-token array. `Implant Application Request (3).ywf` proved the array shape renders as `formcraft.formula.datetype.[object Object]`.
- Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summaries.
- Use `concat` or `&` for request-number and display-string assembly.
- Use `formatNumber`, `fixed`, or `round` for numeric display.
- Use readable lookup summary/autofill variables for user-facing persistence; do not persist raw lookup row IDs into text fields unless that is intentional.
- Use enriched `businessScenarios`, `keywords`, parameter names, and bilingual descriptions from the function knowledge base to select among known functions.
- Preserve exact runtime function names. Do not rename `strIndex`, `UniqueID`, or `subString`.
- Treat `addWorkDays` and `addWorkHours` as screenshot-observed but metadata-pending. Do not generate them until parameter metadata or export-backed token examples are available.
- Runtime-proven in `Expression Runtime Test v1 Patch`: calculated controls, dynamic display rules, lookup filters, lookup addition/autofill variables, FlowNo request numbers, simple approval tasks, and ContentList persistence can work together in one generated app.
- Runtime-proven in `Expression User Profile Test v1`: user/profile expressions can render in generated approval submission pages and task pages, approval can complete, and readable calculated/profile summary variables can be persisted through ContentList. Use `getUserAttr`, `getOrgAttr`, and `getLocAttr` exactly as exported; the department/organization function is `getOrgAttr`, not `getDeptAttr`.
- For current-user expressions, use the export-backed application token `{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }`.
- For profile attribute functions, attribute parameters are descriptor objects such as `{ "key": "Email", "label": "Email" }`, and fallback/default parameters are expression arrays such as `[{ "type": "str", "value": "N/A" }]`.
- User/profile values can be tenant-data dependent. Generate safe fallbacks for optional location, phone, office, manager, and boarding-date fields; document when runtime proof used a tenant where those values were blank.
- Do not serialize expression token arrays directly into `SetVariableTask` text values for request-number generation. Runtime displayed raw JSON literally. Use the proven FlowNo expression-button value shape until a SetVariable expression-token wrapper is export-backed.
- Treat workflow transition branch conditions as wrapper-sensitive. Locally valid numeric condition tokens are not enough; use simple workflow routing unless the exact transition condition wrapper is studied from a successful export/runtime package.
- Runtime-proven in `Expression Sublist Summary Workflow Test v1`: generated sub list row expressions can use `exprType: "variable_ctx"` with `ctx` equal to the parent list variable id and `id` equal to the row field id. Use this for current-object row formulas such as `Current object:Quantity * Current object:Unit Price`.
- Runtime-proven in `Expression Sublist Summary Workflow Test v1`: sub list summaries configured on `attrs["list-fields-summary"]` can bind numeric totals to top-level number variables with `{ "prefix": "__variables_", "value": "TotalAmount" }`, and those summary-bound variables can drive workflow branch conditions. Keep the literal `prefix` key intact: `Implant Application Request (1).ywf` proved that unsafe FlowKey `EFI` can be replaced inside `prefix`, producing `pr<runtimeFlowKey>x` and breaking summary binding.
- Runtime-proven workflow numeric conditions for summary variables use `conditioninfo[]` wrappers with `op` values such as `n.>` and `n.<=`, `left.value` as a number variable token, and `right.value` as a numeric expression token array such as `[{ "type": "num", "value": "5000" }]`.
- Form Actions Phase 1 export-backed: form action `setvar` values, multi-set values, step conditions, and confirm dialog messages use Yeeflow expression-token arrays. Temp variables are declared in `variables.tempVars[]` and referenced as variable tokens with `id: "__temp_<tempVarId>"`, such as `__temp_var_DialogResult`. Keep form action `setvar` distinct from workflow graph `SetVariableTask`; their wrappers differ.
- Data-list workflow AI export update: `Spark & AI (1).yap` proves workflow `AI` node input mappings can use list-field expression tokens directly, including native `ListDataID` and upload-backed fields. The image case uses `exprType = "list_field"`, `valueType = "icon-upload"`, `prop = "Text9"`, and `id = "ImageFile"`. Preserve that token shape when documenting or generating workflow-to-Agent input bindings.
- Form Actions Phase 1 generated runtime: `setvar` and `confirm` tokens rendered and executed. When a form-action test also includes approval tasks, use requester/current-user expression assignment rather than tenant-specific direct-user IDs; invalid direct-user assignments can block publish before expression behavior can be tested.
- Form Actions Phase 2 runtime-proven: Query data steps can store selected multiple-query results in temp collection variables and then aggregate them with `arraySum`; the corrected generated runtime retest returned `2000` for the two active selected `Amount` values. The export-backed query collection display function is spelled `JSONStringfy` and displayed the temp collection JSON at runtime; do not rename it to `JSONStringify` until an export proves that alias. Query data filters are stored in `attrs.querydata_filters` plural; the singular `querydata_filter` helper path is ignored by runtime. Query data filter right operands that come from workflow variables or calculations must be expression-token arrays with `showCus: false`; `Implant Application Request (5).ywf` proved that frontend `<input ...>` expression-button HTML in `right` remains direct-value text and does not match rows. `vLookup` was only seen in labels and remains deferred. Do not use `arraySub`; use `arraySum`.
- Form Report filters: `AI Training-2 (1).yap` export-proves Form Report filter conditions in `Data.FormNewReports[].Settings.Filters` as condition objects with `pre`, `left`, `op`, `right`, and `conditions`. Observed examples include date comparison (`dt.>=`) and status `in` filters using literal right-side values. Treat more complex expression-token operands, grouped conditions, user/org-sensitive filters, and runtime filter execution as unproven until a focused Form Report export/runtime baseline proves them.
- Data view filters: `Data Lists (1).yap` export-proves data-list fixed view filters in `Layouts[].LayoutView.filter[]` as condition objects with `key`, `pre`, `left`, `op`, `right`, and `showCus`. These are separate from user filters, which are selected from `Layouts[].LayoutView.query[]` with `IsFilter = true`. Observed data-view filters are flat literal comparisons; nested filters, current-user operands, date operands, and expression-token operands remain unproven for data-list views until a focused export/runtime pass proves them.
- Workflow transition condition update: `Implant Application Request (4).ywf` proves latest SequenceFlow condition rows can use mode-aware operand wrappers on both sides. Use `type: 1` for direct variable/field selectors, `type: 0` for direct/static/option/date values, and `type: 2` for expression-editor operands. Expressions can appear on the left side, right side, or both; choose the wrapper based on the business rule instead of defaulting all transitions to legacy HTML-button field/value strings.

## Editor Contexts

Use the context-specific wrapper only when export-backed. The nested expression token array can be validated consistently, but each Yeeflow setting stores it in its own surrounding object.

- Calculation control: Content tab `Expression` field and `Edit` button.
- Dynamic display: control settings `Dynamic display rules`.
- Custom validation: field Validation section `Custom validation`.
- Lookup/data filters: Lookup control data source/filter `Condition`.
- Workflow transition: selected sequence/transition arrow `Condition`.
- Sub list row calculated field: list child field `Control type = Calculation`, with row values exposed through current-object tokens (`exprType: "variable_ctx"`).
- Sub list summary binding: list control Summary Editor binds aggregate values to workflow variables, which can then be used by dynamic display, validation, ContentList, and workflow conditions.
- Function tab: categories include All, String, Logical, Date, Mathematical, and Other.
- Variable selector: observed groups include Context, Workflow Variables, Static Variables, Temp variables, and Filter variables.
- Form actions: button click actions use `action_button.attrs.control_action`, page load actions use `page.formdef.formAction.onLoad`, Set variable steps store expressions in `setvar_val` or `setvar_array[].value`, Confirm steps store message tokens in `confirm_qs`, and Phase 2 Query data result expressions can read temp query collections such as `__temp_var_CollectionofQueryItems`.
- Form action step conditions use normal expression-token arrays in `steps[].condition`. When a conditional warning/confirm/check step should be skipped without stopping the action flow, set step-level `continue: true`; this is the export-backed shape for `Continue next step when condition is not met`.
- Approval task-form Submit form steps can use workflow-variable expression arrays for task comments and user-picker-driven task operations. `Workflow Actions Runtime Baseline (2)_Task forms.yap` proves `attrs.comment` and `attrs.remark` can reference a text workflow variable, while `attrs.forword` and `attrs.assignee` can reference a user workflow variable for reassign/add-assignee. `Workflow Action Approval Test.ywf` confirms the corrected Add others button binding to the add-assignee Submit form action. Preserve the export spelling `forword`. This is export-proven only; task-operation execution requires focused runtime proof.
- Assignment task assignee expressions are not generic expression-token arrays in the studied exports. `Test ABC.yap` stores them as expression-button HTML strings in `MultiAssignmentTask.properties.usertaskassignment[].value`, with labels such as `Applicant:Line Manager`, `Applicant:Department:Manager`, `Applicant:Department`, and `Applicant:Location`. `Test ABC (1).yap` also proves expression-button assignee values for user group all-users, position all-users, notification recipient `Current Task Context:Assignee:Email`, and subject `Workflow Name`. `Test ABC (2).yap` proves Assignment Task due-date expression storage in `properties.duedateexpress` and reminder rule rich-text expression buttons in `notifyrules[].subject` and `notifyrules[].content`. `Test ABC (3).yap` proves Start action `revoke-conditions` with operand wrappers and Start notification expression-button fields `to`, `subject`, and `html`. `Purchase Requests.ydl` proves data-list workflow Assignment Task assignee expressions can include list-item context, including a Created By list-field expression resolving `LineManager`. `Workflow Actions Runtime Baseline (1).yap` proves Scheduled Workflow Start and Assignment Task expression-button fields with Applicant/Workflow labels, including Applicant Line Manager for assignment, and no data-list field-value source in the scheduled workflow. Treat these as export-proven workflow-assignee, due-date, condition, or notification wrappers and do not synthesize new assignment/start expression shapes until another export or focused runtime baseline proves them. `yeeflow-api-operator` can help classify adjacent static user/department/location/position/group references and position assignments through authorized read-only lookup, but applicant/context-derived, scheduled workflow, and data-list list-item expression assignees remain runtime-context dependent.

## User/Profile Expression Recipes

Use these only with export-backed token shapes:

- current user email: `getUserAttr(Context:Current User, Email, N/A)`
- current user display name: `getUserAttr(Context:Current User, Name, N/A)` using the exported `Name_CN` key
- profile functions (`getUserAttr`, `getOrgAttr`, `getLocAttr`) must use a direct attribute descriptor object as `params[1]`, for example `{ "key": "Name_CN", "label": "Name" }`; do not wrap it as `[{ "key": "...", "label": "..." }]`
- department name: `getOrgAttr(getUserAttr(Context:Current User, Department, N/A), Name, N/A)`
- parent department name: `getOrgAttr(getOrgAttr(getUserAttr(Context:Current User, Department, N/A), Parent, N/A), Name, N/A)`
- line manager name: `getUserAttr(getUserAttr(Context:Current User, Line Manager, N/A), Name, N/A)`
- location name: `getLocAttr(getUserAttr(Context:Current User, Location, N/A), Name, N/A)`
- boarding anniversary: `dateFormat(dateAdd(getUserAttr(Context:Current User, Boarding Date, N/A), "year", 1), "MMM DD, YYYY")`

When persisting profile-derived output, persist readable summary variables. Do not write object-shaped user, organization, or location values directly to text fields.

Requester/applicant profile rule: for approval apps where the applicant is a workflow/form user variable such as `RequesterApplicant`, use `getUserAttr(RequesterApplicant, ...)` after that field is initialized. Current User is valid as the default source for a new applicant field, but not for applicant profile reads after submission because HR/reviewer/task viewers may open the form later.

## Stop Conditions

Stop before generation when:

- required variables are unresolved
- the target wrapper/context shape is not export-backed
- a requested function/operator is not in the normalized references
- a requested function is only screenshot-observed and lacks parameter metadata
- a variable token needs a value type other than `number`, `text`, `date`, or `boolean`
- expression JSON cannot pass `yeeflow-expression-utils.js`
- a generated current-object row expression references a row field that is not in the same `variables.listref[]`
- a summary-bound workflow condition references a target variable that is not a number variable

## Checks

Run:

```bash
node --check yeeflow-expression-utils.js
node scripts/smoke-expression-validation.mjs
```

Then run the relevant form/app/list/workflow validators for the generated package.

<!-- workflow-claim-task-learning:start -->
## Claim Task Expression Context

Claim Task receiver/candidate expressions use the same expression-button storage family as Assignment Task receivers, but the task semantics differ. `Workflow Actions Runtime Baseline (3)_Claim task.yap` export-proves user-group receiver expressions in approval-form Claim Tasks and direct/applicant/list-item Created By line-manager receiver expressions in data-list Claim Tasks. Preserve the expression-button HTML and source context; do not convert user group, applicant, or list-item receiver expressions into static IDs.

Data-list Claim Task list-item receiver expressions are export-proven only. Do not claim Created By/list-field receiver expansion or claim routing until a focused runtime baseline proves it with safe records and safe users.
<!-- workflow-claim-task-learning:end -->

<!-- workflow-set-variable-learning:start -->
## Workflow Set Variable Expression Context

Workflow graph Set variable actions (`SetVariableTask`) store right-side values as expression-token arrays in `properties.variablesetting[].value`. `Workflow Actions Runtime Baseline (4)_Set variable.yap` export-proves static `str`/`num` tokens, workflow variable tokens, `op` tokens, and function tokens such as `iif` and `isNullOrEmpty`. Data-list workflow Set variable values can use list-field tokens such as `exprType="list_field"` on the right side.

Keep this distinct from front-end form action `setvar` steps; the wrapper and target model differ. In `SetVariableTask`, the left-side target is the workflow variable row (`idx`, `id`, `name`, `type`), not an expression token. Do not use Set variable to write data-list fields; use Set data list / `ContentList` for field mutation.

Workflow graph Set data list actions (`ContentList`) store right-side field values as expression-token arrays in `properties.listdatas[].Data`. `Workflow Actions Runtime Baseline (5)_Set data list.yap` export-proves fixed `str`/`num` tokens, workflow variable tokens, application/context tokens, `exprType="list_field"` tokens in data-list workflows, and operator tokens such as `&`. For data-list sub-list/detail fields, value expressions can use `exprType="list_field"` with `valueType="list"` and the source sub-list field reference. The left side is `listdatas[].Columns`, not an expression token. Filters live in `properties.wheres[]`; filter right values can also be expression-token arrays. Do not claim expression value resolution or record mutation without focused runtime proof.
<!-- workflow-set-variable-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the v0.5.12 app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; and generated non-system `FieldName` suffix matching `FieldIndex`. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom Form Expressions

Use `docs/studies/data-list-custom-form-fields.md` when generating or validating expressions in Data List custom list forms. The export-proven custom form action shape stores actions in `LayoutInResources[0].Resource.actions[]`, with `setvar` steps that can target either `exprType = "list_field"` entries or form-scoped temp variables. `formAction.onLoad` and `action_button.attrs.control_action` reference action ids.

Data List custom form temp variables are not workflow variables. They live in `Resource.tempVars[]` and may be referenced through aliases such as `__temp_var_*` / `var_*`. Validate that every list-field expression resolves to `Defs[]`, every temp variable expression resolves to `tempVars[]`, and every button/form action reference resolves before package handoff. Do not infer submit/save action expression behavior from approval-form actions until Data List custom-form exports or runtime tests prove it.
<!-- data-list-custom-form-fields-learning:end -->
