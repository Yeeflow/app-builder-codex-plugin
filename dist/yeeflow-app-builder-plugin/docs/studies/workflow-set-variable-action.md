# Workflow Set Variable Action Study

Proof boundary: this is export-proven, product-documented, config-reference-backed, and validator-backed learning only. No workflow was imported, published, triggered, submitted, or executed in this pass.

## Sources

| Source | Role | Proof label |
|---|---|---|
| `<downloads>/Workflow Actions Runtime Baseline (4)_Set variable.yap` | Export/schema source of truth | export-proven |
| `<downloads>/node-configurations.json` | Node configuration path/control-type reference | config-reference-backed |
| Yeeflow Help Center: Set Variable Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Product behavior and terminology | product-documented |
| Yeeflow Help Center: Set Data List Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Related action distinction | product-documented |
| Existing workflow action studies | Assignment, Claim, Start, task-form comparison | export-proven / validator-backed |

## Summary

The export contains seven Set variable nodes. All Set variable nodes serialize as `SetVariableTask`.

| Workflow host | WorkflowType | Set variable count | Current workflow assignments | Another approval workflow assignments | Notes |
|---|---:|---:|---:|---:|---|
| Approval form workflow | `2` | 5 | 4 nodes | 1 node | Proves single-variable, multiple-variable, and another approval workflow settings. |
| Data-list workflow | `1` | 2 | 1 node | 1 node | Proves workflow-variable targets and data-list field values on the right side of expressions. |
| Scheduled workflow | `3` | 0 | 0 | 0 | This export does not prove Scheduled Workflow Set variable shape. |

The sample also includes target support resources:

- approval form `Workflow Action Approval Test`
- data list `Purchase Requests Runtime Test`
- target approval form `Another approval from`
- report `Another approval form report`, which exposes submitted approval request form IDs for the target approval form

All exported numeric IDs and private references are redacted in normalized references.

## Set Variable Node Inventory

| Host | Internal type | Node label | `formtype` | Variables set | Variable types | Value sources | Flow | Proof |
|---|---|---|---|---:|---|---|---|---|
| Approval form | `SetVariableTask` | Set Variable | `current` | 1 | text | fixed string + workflow variable expression | 1 in / 1 out | export-proven |
| Approval form | `SetVariableTask` | Set Variable | `current` | 1 | text | fixed string | 1 in / 1 out | export-proven |
| Approval form | `SetVariableTask` | Set Variable | `current` | 1 | number | `iif`, `isNullOrEmpty`, current workflow variable | 1 in / 1 out | export-proven |
| Approval form | `SetVariableTask` | Set Variable | `current` | 3 | number, text | fixed values, workflow variables, functions | 1 in / 2 out | export-proven |
| Approval form | `SetVariableTask` | Set Variable | `custom` | 2 | number, text | workflow variable expression + fixed value | 1 in / 1 out | export-proven |
| Data-list workflow | `SetVariableTask` | Set Variable | `current` | 2 | number, text | workflow variable expression + fixed number | 1 in / 1 out | export-proven |
| Data-list workflow | `SetVariableTask` | Set Variable | `custom` | 4 | date, number, text | fixed values + data-list field expressions | 1 in / 1 out | export-proven |

## Current Workflow Variables

`formtype="current"` targets variables in the current workflow. The export proves both single-variable and multiple-variable settings in one action.

Each row under `properties.variablesetting[]` includes:

| Field | Meaning | Export finding |
|---|---|---|
| `idx` | variable row/reference id | present on every assignment |
| `id` | target workflow variable id | present on every assignment |
| `name` | target workflow variable display name | present on every assignment |
| `type` | target workflow variable type | `text`, `number` found |
| `editable` | variable metadata flag | `true` found |
| `value` | right-side expression token array | static tokens, workflow-variable tokens, operator tokens, and function tokens found |

Value expression examples found:

- fixed string token, such as a text literal
- fixed number token
- concatenation with `&`
- workflow variable token, such as `Workflow Variables:RequestType`
- function tokens, including `iif` and `isNullOrEmpty`

## Another Approval Workflow Variables

`formtype="custom"` targets another approval form workflow instance. The export proves another-workflow variable setting from both approval and data-list workflow hosts.

Target metadata shape:

| Field/path | Export finding | Proof |
|---|---|---|
| `properties.data.AppID` | selected application id | export-proven, redacted |
| `properties.data.ListSetID` | selected application/listset id | export-proven, redacted |
| `properties.data.ProcKey` | target approval form key, `ABC-ANO` in this export | export-proven |
| `properties.formids` | target submitted approval request/workflow instance form id | export-proven, redacted |
| `properties.variablesetting[]` | target variables in the other approval workflow | export-proven |

The target approval form is `Another approval from`. The export also includes `Another approval form report`, whose fields include a `Form ID` field and the target approval-form variables. The report is useful for locating submitted target approval request form IDs, but this export does not prove runtime lookup or mutation behavior.

Current limitation to preserve: based on the user-provided product understanding and this export, another-workflow Set variable should be treated as another approval workflow only. Do not claim data-list or scheduled workflow variable updates through `formtype="custom"` until a focused export or runtime baseline proves it.

## Data-List Workflow Findings

The data-list workflow Set variable nodes still target workflow variables, not list fields.

| Capability | Export finding | Proof |
|---|---|---|
| Set current workflow variables | data-list `formtype="current"` node sets workflow variables | export-proven |
| Set another approval workflow variables | data-list `formtype="custom"` node targets `ABC-ANO` | export-proven |
| Use list field values as right-side expressions | `exprType="list_field"` tokens found for Start / Issue Date and Category / Type values | export-proven |
| Set data-list fields directly | no Set variable node targets a data-list field | not found |

Generation rule: in data-list workflows, use Set variable for workflow variables. Use Set data list / `ContentList` when the intent is to add, update, or delete data-list records or fields.

## Set Variable vs Set Data List

| Dimension | Set variable | Set data list |
|---|---|---|
| Front-end action | Set variable | Set data list |
| Internal type | `SetVariableTask` | `ContentList` |
| Primary purpose | Update workflow variables | Add, update, or delete data-list/document-library records |
| Left side | workflow variable | data-list field/record mapping |
| Right side | expression editor value | expression editor value for selected list fields |
| Data-list workflow behavior | can read list fields as expression values, but still targets workflow variables | writes data-list fields/records |
| Proof | export-proven in this study | export-proven in `Workflow Actions Runtime Baseline (5)_Set data list.yap`; not runtime-proven |

`Workflow Actions Runtime Baseline (5)_Set data list.yap` proves the Set data list side of this distinction. Front-end Set data list serializes as `ContentList`, uses `properties.listtype` for current/selected data source mode, uses `properties.type` for `add`/`edit`/`remove`, uses `properties.listdatas[]` for target field mappings, and uses `properties.wheres[]` for update/delete filters. Data-list workflows can use list fields as right-side values in both Set variable and Set data list, but only Set data list targets list fields/records.

Generation rule update: when a data-list workflow must mutate the current item/list fields, use Set data list `listtype="current"` if the current-list context is export-proven for that generated host. When it must mutate another list or future document library target, use Set data list `listtype="select"` with selected source metadata. Keep Set variable reserved for workflow variable mutation.

## Node Configuration Reference

`node-configurations.json` maps Set variable to `SetVariableTask` and lists these useful paths:

- `properties.formtype`
- `properties.data.AppID`
- `properties.data.ListSetID`
- `properties.data.ProcKey`
- `properties.formids`
- `properties.variablesetting`

This reference is useful for expected path validation, but it is not runtime proof. The export remains the source of truth for concrete field names and value shapes.

## Help Center Comparison

| Concept | Product behavior | Export-proven field/shape | Config path | Match | Proof |
|---|---|---|---|---|---|
| Set selected workflow variables | Set Variable action configures workflow variable values. | `SetVariableTask.properties.variablesetting[]` | `properties.variablesetting` | matched | product-documented + export-proven |
| Current approval/workflow target | Product UI lets users select current approval form/workflow context. | `formtype="current"` | `properties.formtype` | matched | product-documented + export-proven |
| Another approval form target | Product UI supports another approval form with target app/form and submitted form id. | `formtype="custom"`, target `data`, `formids` | `properties.data.*`, `properties.formids` | matched | product-documented + export-proven |
| Static or dynamic values | Right-side value uses expression editor. | `variablesetting[].value` expression-token arrays | `properties.variablesetting` | matched | product-documented + export-proven |
| Multiple variables in one action | Product understanding says one action can set multiple variables. | nodes with 3 and 4 `variablesetting[]` entries found | `properties.variablesetting` | matched | export-proven |
| Data-list field values as expression values | Data-list workflow can use list fields as expression values. | `exprType="list_field"` tokens found in data-list workflow values | not specific in SetVariableTask config | matched | export-proven |
| Data-list field writes | Use Set data list for record/field updates. | No Set variable node targets list fields; Set Data List article documents record updates. | `ContentList` paths | matched by absence/product docs | product-documented + export-proven absence |

## Validator Recommendations

- Warning-first: validate `SetVariableTask`.
- Warn when `properties.formtype` is not `current` or `custom`.
- Warn when `properties.variablesetting` is missing, empty, or not an array.
- Warn when assignments are missing `idx`, `id`, `name`, `type`, or `value`.
- Validate `variablesetting[].value` as an expression-token array.
- Warn on unknown variable types rather than failing compatibility mode.
- Warn when `formtype="custom"` lacks `properties.data.AppID`, `ListSetID`, `ProcKey`, or `formids`.
- Warn that `exprType="list_field"` values in data-list workflows are export-proven as right-side expressions but runtime mutation is not proven.
- Do not hard-error compatibility exports for another-workflow targets until runtime behavior is proven.

## Generation Rules

- Use `SetVariableTask` for front-end Set variable only when export-proven.
- Preserve `formtype="current"` for current workflow variables.
- Preserve `formtype="custom"` for another approval workflow instance variables.
- One Set variable node may contain one or multiple rows in `properties.variablesetting[]`.
- Treat `variablesetting[].id` as the target workflow variable, not a data-list field.
- Treat `variablesetting[].value` as the expression-editor right side.
- In data-list workflows, list fields may appear as `exprType="list_field"` value tokens.
- Do not use Set variable to write data-list fields; generate Set data list / `ContentList` for list-field mutation.
- Do not claim variable mutation, another-workflow update, or submitted-form targeting behavior without a focused runtime baseline.

## Runtime Test Plan Addendum

Recommended future runtime baseline:

- designer/open proof for current-workflow Set variable in approval form workflow
- designer/open proof for multiple variables in one Set variable action
- designer/open proof for another approval workflow target metadata and form id setting
- designer/open proof for data-list workflow values sourced from list fields
- optional execution proof only with safe submitted requests and no unintended data mutation

Until then, this study remains export-proven/config-reference-backed/validator-backed only.

## Runtime Baseline Update

The combined `Workflow Actions Batch Runtime Baseline` imported and opened successfully. The approval workflow designer rendered `SetVariableTask` nodes for current-workflow variable settings and another-approval-workflow target settings, and the approval workflow published successfully. The data-list workflow designer rendered a `SetVariableTask` using current-workflow variable settings with list-context value expressions in the generated package, and the data-list workflow published successfully.

This upgrades the generated Set variable shapes to import/open/designer/publish-proven only. Variable mutation, another approval workflow instance mutation, submitted form ID runtime resolution, and any list-field write behavior remain not runtime-proven.
