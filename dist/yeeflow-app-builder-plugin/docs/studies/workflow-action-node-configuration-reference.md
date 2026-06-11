# Workflow Action Node Configuration Reference

Proof boundary: `node-configurations.json` is config-reference-backed only. It is useful for control-type mapping and expected property paths, but it is not export proof and not runtime proof.

Source path studied:

```text
<downloads>/node-configurations.json
```

## Useful Mappings

| Product/front-end action | Internal control type | Config id | Current use |
|---|---|---|---|
| Assignment Task | `MultiAssignmentTask` | `config_MultiAssignmentTask` | Compare with Claim Task, validate direct-assignment properties. |
| Claim Task | `CandidateTask` | `config_CandidateTask` | New Claim Task export-learning reference. |
| Set variable | `SetVariableTask` | `config_SetVariableTask` | Current Set variable export-learning reference. |
| Set data list | `ContentList` | `config_ContentList` | Set data-list export-learning reference. |
| Signal event | `SignalEvent` | `config_SignalEvent` | Signal event export-learning reference for recall/terminate event branches. |
| Start | `StartNoneEvent` | `config_StartNoneEvent` | Start action comparison across workflow hosts. |
| Connector line | `SequenceFlow` | `config_SequenceFlow` | Workflow transition condition validation. |

## CandidateTask vs MultiAssignmentTask

| Area | CandidateTask config | MultiAssignmentTask config | Notes |
|---|---|---|---|
| People picker field | `properties.usertaskassignment` | `properties.usertaskassignment` | Same family, different semantics: receivers/candidates vs direct assignees. |
| Task form | `properties.taskurl` | `properties.taskurl` | Same task form association path. |
| Task type | `properties.tasktype ` in config reference | `properties.tasktype` | The Claim Task config has a trailing-space path, but the export uses `properties.tasktype`. Treat trailing-space path as a warning-only config mismatch. |
| Due date | `duedatetype`, `duedatedefinition`, `duedateexpress`, `isfromworkcalendar` | same family | Export confirms Claim Task `hour` and `day`; minutes and express are product/config-known but not found in this Claim Task export. |
| Quick completion | `disablequickapproval` | `disablequickapproval` | Product-documented for Claim Task approval type; not found in the studied Claim Task export. |
| Notification | `isenabledemail`, `from`, `to`, `cc`, `subject`, `html` | same family | Export confirms enabled Claim Task email config in data-list workflow. |
| Files | `properties.files.list`, `properties.files.variables` | same family | Config says list-workflow task; not found in the Claim Task export. |

## SetVariableTask Reference

`Workflow Actions Runtime Baseline (4)_Set variable.yap` proves front-end Set variable serializes as `SetVariableTask` in approval form and data-list workflows.

| Config path | Export finding | Notes |
|---|---|---|
| `properties.formtype` | `current` and `custom` found | `current` targets current workflow variables; `custom` targets another approval form workflow instance. |
| `properties.variablesetting` | array found on every Set variable node | Each entry represents one left-side target workflow variable and one right-side expression value. |
| `properties.data.AppID` | found for `formtype="custom"` | Redact target app IDs in docs/refs. |
| `properties.data.ListSetID` | found for `formtype="custom"` | Redact target listset/application IDs. |
| `properties.data.ProcKey` | found for `formtype="custom"` | Stores target approval form key in the studied export. |
| `properties.formids` | found for `formtype="custom"` | Stores the target submitted approval request/form instance id; redact in docs/refs. |

The config reference is useful for validating expected paths, but the export is still source of truth for concrete field names and shapes. The studied export did not show Set variable updating data-list fields; it only targeted workflow variables. Data-list field tokens appeared only as right-side expression values.

## SetVariableTask vs ContentList

| Area | SetVariableTask | ContentList |
|---|---|---|
| Product action | Set variable | Set data list |
| Target | workflow variables | data-list/document-library records and fields |
| Current data-list workflow use | set workflow variables; may read list fields as expression values | add/update/delete list records |
| Reference status | export-proven in Set variable study | export-proven in Set data list study, config-reference-backed, product-documented |

## ContentList Reference

`Workflow Actions Runtime Baseline (5)_Set data list.yap` proves front-end Set data list serializes as `ContentList` in approval-form and data-list workflows.

| Config path | Export finding | Notes |
|---|---|---|
| `properties.listtype` | `select` and `current` found | `select` targets a selected data source; `current` was found in a data-list workflow current-list context. |
| `properties.appid` | found for `listtype="select"` | Redact app IDs in docs/refs. |
| `properties.listsetid` | found for `listtype="select"` | Redact listset/application IDs. |
| `properties.listid` | found for selected and current-list targets | Redact list IDs in docs/refs. |
| `properties.type` | `add`, `edit`, `remove` found | Use warning-first validation for unknown operation values. |
| `properties.listdatas` | array found for add/edit and current-list mappings | Each mapping uses `Columns`, `Per`, and `Data`. |
| `properties.wheres` | array found for edit/remove selected-list filters | Missing/empty filters are high-risk and should warn strongly. |

The config reference is useful for expected paths and operation names, but it is incomplete for numeric field operations: it lists `listdatas[].Per` enum `["0"]`, while the export proves codes `0`, `1`, `2`, `3`, and `4`. Treat the export as source of truth and map those codes to Value, Increase, Decrease, Multiply, and Divide only with product/user-understanding context until runtime proof confirms execution.

Current limitation: this Set data list export targets data lists only. It does not prove document-library target serialization, even though related product docs describe selected data source behavior that can include document libraries.

## SignalEvent Reference

`Workflow Actions Runtime Baseline (6)_Signal event.yap` proves front-end Signal event serializes as `SignalEvent` in an approval-form workflow.

| Config path | Export finding | Notes |
|---|---|---|
| `properties.eventdefinitions` | array with `RevokeEventDefinition` and `CancelEventDefinition` | Selects recall/revoke and terminate/cancel event triggers. |
| incoming flow | none | Signal event is a special event source; graph validation should allow no incoming flow. |
| outgoing flow | one sequence flow to `ContentList` edit | The branch can run compensation/cleanup actions. Execution is not runtime-proven. |

The config reference is useful for enum names and the required path. The export remains source of truth for graph placement and downstream action shape. Signal event host support is export-proven only for approval-form workflow in this pass; no data-list or scheduled `SignalEvent` was found.

## Reference Use Rules

- Use this JSON as a map of expected workflow action configuration paths.
- Use real exports as source of truth for serialized field names and actual shapes.
- If the config reference and export disagree, document the mismatch and preserve the export shape.
- Keep validation warning-first unless a bad shape is proven to break import/publish/runtime.
- Do not commit raw `node-configurations.json` unless a future repo policy explicitly allows a sanitized copy.
- Do not treat config-reference-backed fields as runtime-safe.

## Future Study Candidates

- `SetVariableTask`: validate `properties.variablesetting[]` and cross-workflow variable references.
- `ContentList`: add document-library target proof, execution proof for add/edit/remove on disposable data, and runtime proof for sub-list row iteration.
- `SignalEvent`: add designer/open/publish proof and later recall/terminate execution proof with disposable requests and safe cleanup targets.
- `SequenceFlow`: continue aligning transition condition wrappers with expression/condition docs.
- `StartNoneEvent`: continue separating approval-form-only terminate/recall fields from data-list and scheduled workflow Start shapes.
