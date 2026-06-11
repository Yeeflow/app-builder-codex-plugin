# Workflow Set Data List Action Study

Proof boundary: this is export-proven, product-documented, config-reference-backed, and validator-backed learning only. No workflow was imported, published, triggered, submitted, or executed in this pass. No approval request was submitted, no data-list item was created/updated/deleted, and no email was sent.

## Sources

| Source | Role | Proof label |
|---|---|---|
| `<downloads>/Workflow Actions Runtime Baseline (5)_Set data list.yap` | Export/schema source of truth | export-proven |
| `<downloads>/node-configurations.json` | Node configuration path/control-type reference | config-reference-backed |
| Yeeflow Help Center: Set Data List Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Product behavior and terminology | product-documented |
| Yeeflow Help Center: Set data list step, https://<yourdomain>.yeeflow.com/<redacted-path> | Related form-action behavior for current list and selected data source | product-documented |
| Yeeflow Help Center: Set Variable Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Related workflow variable distinction | product-documented |
| Existing workflow Set variable, Claim Task, Assignment Task, task-form, and workflow-host studies | Comparison/reference | export-proven / validator-backed |

## Summary

The export contains ten Set data list nodes. All Set data list nodes serialize as `ContentList`.

| Workflow host | WorkflowType | `ContentList` count | Operations found | Target modes found | Notes |
|---|---:|---:|---|---|---|
| Approval form workflow | `2` | 6 | `add`, `edit`, `remove` | `select` | Targets included data lists. Proves selected-data-source add/update/delete, filters, numeric operation codes, and approval-form sub-list value mappings. |
| Data-list workflow | `1` | 4 | `add`, `edit` | `current`, `select` | Proves current-list mode, selected-list mode, list-field expression values, and data-list sub-list value mappings. |
| Scheduled workflow | `3` | 0 | none | none | This export does not prove Scheduled Workflow Set data list shape. |

The studied app includes these relevant data sources:

- approval form `Workflow Action Approval Test`
- data list `Purchase Requests Runtime Test`
- data list `Products`
- data list `Save Sub Items`
- form report `Another approval form report`

All exported numeric IDs and private references are redacted in normalized references.

## Node Inventory

| Host | Internal type | Node label | `listtype` | `type` | Target | Mappings | Filters | Notes | Proof |
|---|---|---|---|---|---|---:|---:|---|---|
| Approval form | `ContentList` | Set Data List_1 | `select` | `add` | Purchase Requests Runtime Test | 9 | 0 | Creates a target record from workflow variables and instance context. | export-proven |
| Approval form | `ContentList` | Set Data List | `select` | `edit` | Products | 1 | 1 | Updates Product amount with numeric operation code `2`. | export-proven |
| Approval form | `ContentList` | Set Data List_2 | `select` | `edit` | Purchase Requests Runtime Test | 4 | 1 | Updates target record by Form ID; includes numeric operation codes `3` and `4`. | export-proven |
| Approval form | `ContentList` | Set Data List | `select` | `edit` | Products | 1 | 1 | Updates Product amount with numeric operation code `1`. | export-proven |
| Approval form | `ContentList` | Set Data List_3 | `select` | `remove` | Purchase Requests Runtime Test | 0 | 1 | Deletes by Form ID filter. High-impact behavior not runtime-tested. | export-proven |
| Approval form | `ContentList` | Set Data List_5 | `select` | `add` | Save Sub Items | 6 | 0 | Maps approval-form sub-list fields into detail-record fields. | export-proven |
| Data-list workflow | `ContentList` | Set Data List | `current` | `add` | Purchase Requests Runtime Test | 4 | absent | Current-list mode updates/mutates the host list context; value expressions can read list fields. | export-proven |
| Data-list workflow | `ContentList` | Set Data List | `select` | `add` | Products | 3 | 0 | Adds to another data list using list-field and workflow-variable values. | export-proven |
| Data-list workflow | `ContentList` | Set Data List | `select` | `edit` | Products | 1 | 1 | Updates selected Products row by Title filter. | export-proven |
| Data-list workflow | `ContentList` | Set Data List | `select` | `add` | Save Sub Items | 6 | 0 | Products-list workflow maps data-list sub-list fields to multiple detail records. | export-proven |

No `ContentList` node targets a document library in this export. Document-library targets are product-documented and config-plausible through selected data source behavior, but not export-proven by this sample.

## Data Source Target Selection

| Pattern | Export shape | Host found | Notes | Proof |
|---|---|---|---|---|
| Selected data source | `properties.listtype="select"` plus `properties.appid`, `properties.listsetid`, `properties.listid` | approval and data-list workflows | Used for `Purchase Requests Runtime Test`, `Products`, and `Save Sub Items`. | export-proven |
| Current list | `properties.listtype="current"` plus current host list `properties.listid` and no selected metadata | data-list workflow | Found on Purchase Requests Runtime Workflow. Product docs say current-list mode is list-form/list-context only. | export-proven + product-documented |
| Document library target | not found | none | Product docs say selected data source can be data list or document library in related Set data list step behavior. | product-documented only |

Generation rule: use `listtype="current"` only when a data-list/list-context host is present and the intent is to mutate the current item/list context. Use `listtype="select"` for other data lists or future document-library targets.

## Operation Types

| Operation | Export shape | Field mappings | Filters | Safety note | Proof |
|---|---|---|---|---|---|
| Add | `properties.type="add"` | `properties.listdatas[]` | usually empty/absent | Creates records/items; runtime mutation not tested here. | export-proven |
| Update/Edit | `properties.type="edit"` | `properties.listdatas[]` | `properties.wheres[]` found on every studied selected-list edit | Treat missing/broad filters as high risk. | export-proven |
| Delete/Remove | `properties.type="remove"` | `listdatas` may be absent/object/unused | `properties.wheres[]` found | High-impact destructive action; require explicit intent and safe filters before generation/runtime. | export-proven |

The Help Center describes Set Data List as the workflow action for adding, updating, or deleting records in a selected data list, and notes that update/delete behavior depends on conditions. Product docs differ slightly on missing-filter behavior across workflow action and form-action articles, so generation should warn strongly and require explicit safe filters for edit/remove actions rather than relying on either interpretation.

## Field Mapping Shape

Add and edit operations use `properties.listdatas[]`. Each mapping entry found in the export includes:

| Field | Meaning | Export finding |
|---|---|---|
| `Columns` | target field name on the selected/current data source | found on every mapping |
| `Per` | operation code for field assignment or numeric operation | codes `0`, `1`, `2`, `3`, `4` found |
| `Data` | expression-token array for the mapped value | found on every mapping |

Value sources found in `Data`:

- fixed text and number tokens
- workflow variable tokens
- application/instance context tokens, such as Form ID, Submitter, and Submission time
- data-list field tokens with `exprType="list_field"`
- expression operators, such as text concatenation
- sub-list/detail-row field references

## Numeric Operation Codes

The export proves that numeric field mappings still use `listdatas[].Data` for the right-side value and store the operation mode in `listdatas[].Per`.

| `Per` code | Product/UI meaning | Export evidence | Proof |
|---|---|---|---|
| `0` | Value/default set | found across text, date, lookup, user, and number fields | export-proven code; product/user-understanding-backed label |
| `1` | Increase | found on Decimal field mappings | export-proven code; product/user-understanding-backed label |
| `2` | Decrease | found on Decimal field mappings | export-proven code; product/user-understanding-backed label |
| `3` | Multiply | found on Decimal field mappings | export-proven code; product/user-understanding-backed label |
| `4` | Divide | found on Decimal field mappings | export-proven code; product/user-understanding-backed label |

The `node-configurations.json` reference only lists `Per` enum `["0"]`, so the export is the source of truth for codes `1..4`. Validators should warn on unknown codes and should validate numeric-operation use against target field metadata when available.

## Filter / `wheres[]` Shape

Edit and remove operations use `properties.wheres[]`.

Found condition fields:

| Field | Export finding |
|---|---|
| `key` | condition identifier, redacted in normalized refs |
| `pre` | logical connector, `and` found |
| `left` | target field name, such as `ListDataID`, `Text1`, or `Title` |
| `op` | operator code, `0` found for equals |
| `right` | expression-token array or static token array |
| `showCus` | `false` found |
| `conditions` | supported by config reference, not populated in this export |

No studied edit/remove node has an empty filter. Validators should still warn strongly when edit/remove has missing or empty `wheres[]`, because broad or destructive mutation is a business-safety risk.

## Sub-List To Multiple Records Pattern

The export includes two Set data list nodes that map sub-list/detail-row values into `Save Sub Items` records:

| Source host | Target | Source value shape | Target fields | Proof |
|---|---|---|---|---|
| Approval form workflow | Save Sub Items | workflow variable references named like `Workflow Variables:Sub List Items:field1` | `Text2`, `Decimal2`, `Text3` plus parent/form/product fields | export-proven |
| Data-list workflow | Save Sub Items | `exprType="list_field"` with `valueType="list"` and names like `List Fields:Sub List Items:field1` | `Text2`, `Decimal2`, `Text3` plus current row/product fields | export-proven |

The product expectation is that sub-list rows can be saved to multiple target records. This export proves the mapping schema but does not execute it, so record count and row iteration behavior remain not runtime-proven.

## Approval Workflow vs Data-List Workflow

| Capability | Approval form workflow | Data-list workflow | Proof |
|---|---|---|---|
| Internal type | `ContentList` | `ContentList` | export-proven |
| Selected data source | found | found | export-proven |
| Current list mode | not found | found | export-proven |
| Add operation | found | found | export-proven |
| Edit operation | found | found | export-proven |
| Remove operation | found | not found | export-proven absence in this export |
| List-field values | not applicable except workflow variables/sub-list variable references | found as `exprType="list_field"` | export-proven |
| Sub-list values | approval sub-list workflow variable references | data-list sub-list list-field references | export-proven |
| Document library target | not found | not found | unproven in this export |

## Set Data List vs Set Variable

| Dimension | Set variable | Set data list |
|---|---|---|
| Internal type | `SetVariableTask` | `ContentList` |
| Target | workflow variables | data-source records and fields |
| Left side | workflow variable assignment row | data-list/document-library field mapping |
| Right side | expression-token array in `variablesetting[].value` | expression-token array in `listdatas[].Data` |
| Data-list workflow list fields | may be read as right-side values | may be read as right-side values and may target current/selected list fields |
| Field mutation | not a Set variable behavior | core Set data list behavior |
| Runtime proof in this branch | none | none |

Generation rule: if the business requirement says to change data-list fields or create/update/delete records, use Set data list / `ContentList`, not Set variable / `SetVariableTask`.

## Node Configuration Reference

`node-configurations.json` maps Set data list to `ContentList` and lists these useful paths:

- `properties.listtype`
- `properties.appid`
- `properties.listsetid`
- `properties.listid`
- `properties.type`
- `properties.listdatas`
- `properties.wheres`

The reference is useful for control-type mapping and path discovery. The export remains source of truth when the reference is incomplete: the reference lists `listdatas[].Per` enum `["0"]`, but the export proves numeric operation codes `1`, `2`, `3`, and `4`.

## Help Center Comparison

| Concept | Product behavior | Export-proven field/shape | Config path | Match | Proof |
|---|---|---|---|---|---|
| Set Data List purpose | Add, update, or delete records from a data list. | `ContentList.properties.type` values `add`, `edit`, `remove` | `properties.type` | matched | product-documented + export-proven |
| Target data source | Select application and data source. | selected target metadata in `appid`, `listsetid`, `listid` | `properties.appid/listsetid/listid` | matched | product-documented + export-proven |
| Current list option | Current list applies to list/form context. | `listtype="current"` in data-list workflow | `properties.listtype` | matched | product-documented + export-proven |
| Selected data source can be data list/document library | Product docs mention data list or document library for related form-action step. | only data-list targets found | same target metadata paths | partial | product-documented; document-library target unproven here |
| Field mapping | User selects fields and values through expression editor. | `listdatas[].Columns` + `listdatas[].Data` | `properties.listdatas` | matched | product-documented + export-proven |
| Update/delete filters | Conditions locate affected records. | `wheres[]` with `pre`, `left`, `op`, `right` | `properties.wheres` | matched | product-documented + export-proven |
| Sub-list values | Product docs describe using sub-list fields in Set Data List workflows. | approval and data-list sub-list field references found | `properties.listdatas[].Data` | matched | product-documented + export-proven schema |

## Validator Recommendations

- Warning-first: validate `ContentList`.
- Warn when `properties.listtype` is not `current` or `select`.
- Warn when `properties.type` is not `add`, `edit`, or `remove`.
- For selected-data-source mode, warn when `appid`, `listsetid`, or `listid` is missing.
- For add/edit, warn when `listdatas[]` is missing, not an array, empty, or has entries missing `Columns`, `Per`, or `Data`.
- Validate `Data` as expression-token arrays where possible; tolerate export-proven `exprType="list_field"` tokens.
- Warn when `Per` uses an unknown numeric operation code.
- When field metadata is available, warn if numeric operation codes `1..4` are used on non-number fields.
- For edit/remove, warn strongly when `wheres[]` is missing or empty.
- Validate `wheres[]` condition fields warning-first: `pre`, `left`, `op`, `right`, and nested `conditions`.
- Accept nested conditions but warn on unknown operators.
- Recognize current-list mode only in data-list/list-context workflows unless another export proves more.
- Recognize sub-list-to-multiple-record mappings as export-proven schema but not runtime-proven execution.
- Recognize document-library target only when an export proves it.

## Generation Rules

- Use `ContentList` for front-end Set data list only when export-proven.
- Preserve `properties.listtype`.
- Use `listtype="current"` for current data-list/list context only.
- Use `listtype="select"` plus selected metadata for external data lists or future document-library targets.
- Preserve `properties.type` as `add`, `edit`, or `remove`.
- Add/edit operations should include `properties.listdatas[]`.
- Edit/remove operations should include explicit safe `properties.wheres[]` filters.
- Do not generate delete/remove unless the user explicitly asks for destructive behavior and provides safe filter intent.
- Use `listdatas[].Columns` for target fields and `listdatas[].Data` for expression-editor values.
- Preserve `listdatas[].Per` numeric operation codes. Use codes `1..4` only for number fields when metadata supports it.
- For sub-list-to-record generation, preserve parent/request reference mappings so detail records can be associated back to the source.
- Do not claim record creation/update/delete, current-list mutation, document-library mutation, or sub-list row iteration behavior without focused runtime proof.

## Signal Event Cleanup Note

`Workflow Actions Runtime Baseline (6)_Signal event.yap` proves one approval-form `SignalEvent` branch that connects to a Set data list / `ContentList` edit action. The downstream action uses `listtype="select"`, `type="edit"`, one `listdatas[]` mapping, and one nonempty `wheres[]` filter.

This is an export-proven compensation/cleanup schema only. It supports generation guidance that recall/terminate event branches can use Set data list to release or reverse related records, but the workflow event firing, numeric operation execution, and record mutation remain not runtime-proven. Keep the normal high-impact Set data list safeguards: edit/remove actions need explicit safe filters, and destructive cleanup should use disposable records in runtime tests.

## Runtime Test Plan Addendum

Recommended future runtime baseline:

- designer/open proof for approval workflow selected-list add/edit/remove nodes
- designer/open proof for data-list workflow current-list Set data list node
- designer/open proof for selected external Products and Save Sub Items targets
- designer/open proof for field mappings, numeric operation modes, and filters
- designer/open proof for approval-form and data-list sub-list-to-record mappings
- optional execution proof only with disposable lists/items and explicit safe filters

Execution proof should be split by risk:

- add-to-disposable-list proof can be considered first
- edit proof requires a single disposable target row and a narrow filter
- remove proof should remain deferred unless the user explicitly approves destructive testing on disposable data
- document-library mutation should wait for a dedicated export and runtime plan

## Runtime Baseline Update

The combined `Workflow Actions Batch Runtime Baseline` imported and opened successfully. The approval workflow designer rendered selected-list `ContentList` nodes for add, edit, remove, sub-list/detail-row mapping, and Signal-event cleanup settings, and the approval workflow published successfully. The data-list workflow designer rendered current-list and selected-list `ContentList` nodes, and the data-list workflow published successfully.

This upgrades the generated Set data list shapes to import/open/designer/publish-proven only. Record creation, update, delete/remove, current-list mutation, sub-list row iteration, numeric operation execution, document-library mutation, downstream cleanup execution, and Products workflow triggering remain not runtime-proven.
