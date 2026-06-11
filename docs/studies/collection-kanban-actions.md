# Collection And Kanban Actions

## Source

Export studied: `/Users/Renger/Downloads/Company Overview (2).yap`

Reference UI screenshot: Collection actions step chooser showing standard action steps plus Collection item operations: View item, Edit item, Delete item, Update fields, and Trigger list workflow.

Correct-project rerun note: this study was rechecked in `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - formreport-clean` on branch `codex/collection-kanban-actions-learning-v2` using the export at `/Users/Renger/Downloads/Company Overview (2).yap`. The raw `.yap`, screenshots, decoded payloads, sample records, private IDs, `Resource`, and `Sign` values remain outside git.

Target dashboard pages:

- `Company overview`
- `Collection of activity`

This study extends the existing Kanban, Collection, Timeline, and Dynamic control learning. It focuses on local Collection/Kanban actions, current item context, item selection, and bulk operations.

## Feature Overview

Collection and Kanban controls can define local actions under the host control at `attrs.actions[]`. These local actions use `type = "coll"` and are separate from page-level/dashboard `actions[]`. Buttons, containers, and icons inside a Collection or Kanban item template bind to local actions with `attrs.control_action = <local action id>`.

The current rendered item is available to action expressions through `exprType = "variable_ctx"`, `ctx = "__ctx_coll"`. The export uses this context for the current item ID through `id = "ListDataID"` and for current item fields such as `Text1` / Status. Kanban also uses `ctx = "__ctx_kanban"` with `id = "_cate"` for category styling rules; item operations still use `__ctx_coll`.

Runtime proof update: `docs/studies/collection-kanban-actions-runtime-proof.md` records the correct-project v2 runtime pass for `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` from the `formreport-clean` branch. Keep the runtime claim limited to that generated package and the tested actions: Edit item, Delete item, Mark current item as Completed, selection toggle, selected count, bulk toolbar, bulk mark completed, and bulk delete.

## Company Overview Kanban

Page: `Company overview`

Control: Kanban (`type = "kanban"`)

The Kanban binds to the `Company Overview` Data List. Its category/grouping field is `Text2` / Project owner. It has two local collection actions:

| Action | Serialized step | Notes |
| --- | --- | --- |
| Edit item | `listitem` with `attrs.op_type = "edit"` | Opens the source list edit form in a modal. `attrs.listdataid[]` is the current item `ListDataID` from `__ctx_coll`. |
| Delete item | `deleteitem` with `attrs.showdlg = true` | Current item delete operation with built-in confirmation behavior. |

Inside each Kanban item template, two `action_button` controls bind to those local actions:

- `Edit item` button -> local Edit item action
- `Delete Item` button -> local Delete item action

This proves Kanban item-template buttons can resolve to local `attrs.actions[]` on the Kanban control.

## Collection Of Activity

Page: `Collection of activity`

Control: Collection (`type = "collection"`)

The Collection binds to the same `Company Overview` Data List. It has four local collection actions:

| Action | Serialized steps | Notes |
| --- | --- | --- |
| Select Items | `setvar`, `setvar` | Toggles the current item ID in a selected IDs temp variable, then recalculates selected count. |
| Edit item | `listitem` with `attrs.op_type = "edit"` | Opens the current item edit form in a modal. |
| Delete item | `confirm`, `setdatalist`, `otheraction` | Confirms, removes the current item by `ListDataID`, then calls a page action to reset selection state. |
| Mark current item as Completed | `setdatalist`, `otheraction` | Updates the current item fields, then calls a page action to reset selection state. |

Inside the Collection item template:

- an absolute-positioned container binds to Select Items
- square and checked-square icons use dynamic display rules to show unselected/selected state
- `Edit item`, `Mark as completed`, and `Delete Item` buttons bind to local collection actions
- `Mark as completed` is visible only when current item Status is not `Completed`

## Current Item Context

Observed current item token:

```json
{
  "exprType": "variable_ctx",
  "valueType": "input",
  "id": "ListDataID",
  "ctx": "__ctx_coll",
  "type": "expr",
  "name": "Collection item:Id"
}
```

Observed current field token:

```json
{
  "exprType": "variable_ctx",
  "valueType": "radio",
  "id": "Text1",
  "ctx": "__ctx_coll",
  "type": "expr",
  "name": "Collection item:Status"
}
```

This is the same current item context family as Dynamic controls with `attrs.source = "3"` and `attrs["obj-f"] = <field name>`. Dynamic controls store field binding in control attrs; collection action expressions use expression tokens.

## Selection State Pattern

The Collection page declares dashboard temp variables:

- `var_SelectedItems`: selected item IDs as a comma-delimited string
- `var_SelectedItemsAmount`: selected item count
- `var_isDeleteConfirmed`: current item delete confirmation result
- `var_isDeleteMultipleConfirmed`: bulk delete confirmation result
- `var_UpdatedItemsAmount`: bulk update result count
- `var_DeletedItemsAmount`: bulk delete result count

The Select Items action toggles the current item ID:

- `strIndex(var_SelectedItems, CurrentItem.ListDataID) >= 0` detects selected state
- if selected, `replace(var_SelectedItems, CurrentItem.ListDataID & ",", "", "1")` removes it
- if unselected, appends `CurrentItem.ListDataID & ","`
- selected count is recalculated with `arrayCount(split(var_SelectedItems, ","), [], [], [])`, with null/empty protection

The item template has an absolute-positioned click target container in the top-right corner. It contains two icons:

- unchecked square visible when `strIndex(var_SelectedItems, CurrentItem.ListDataID) < 0`
- checked square visible when `strIndex(var_SelectedItems, CurrentItem.ListDataID) >= 0`

Both visibility rules use `style_regulation_action_show`.

## Bulk Operations

The page has a bulk action container whose dynamic display rule shows it only when:

```text
var_SelectedItemsAmount > 0
```

Bulk page actions are stored in page-level `actions[]`, not inside the Collection control:

| Page action | Steps | Pattern |
| --- | --- | --- |
| Change multiple items to completed | `setdatalist`, `setvar`, `confirm` | Updates rows whose `ListDataID` is in the selected IDs list, clears selection variables, then shows updated count. |
| Delete multiple items | `confirm`, `setdatalist`, `setvar`, `confirm` | Confirms, removes rows whose `ListDataID` is in the selected IDs list, clears selection variables, then shows deleted count. |
| Set default values | `setvar` | On page load and after item-level actions, resets selection/result variables. |

Bulk update/delete use `setdatalist` with `wheres[].left = "ListDataID"` and `op = "9"`. The right side is built from selected IDs by trimming the trailing comma and splitting into an array:

```text
split(replace(var_SelectedItems, ",", "", "2"), ",")
```

Bulk update writes `Text1 = "Completed"` and `Decimal1 = 1`. Both bulk actions use `totalcount` with `totalparent = "__temp_"` to capture affected row count.

## Step Types

Export-proven in this package:

- `listitem` with `attrs.op_type = "edit"`: current item edit/open form
- `deleteitem`: current item delete operation
- `setdatalist` with `type = "edit"`: update current or selected list rows
- `setdatalist` with `type = "remove"`: delete current or selected list rows
- `setvar`: set dashboard/page temp variables
- `confirm`: show confirm dialog or message
- `otheraction`: start another page action

UI-reference-backed from screenshot, not serialized in this export unless mapped above:

- View item
- Edit item
- Delete item
- Update fields
- Trigger list workflow
- Show confirm dialog
- Redirect page to
- Close this window
- Start another action
- AI assistant
- Barcode scan
- NFC reader

Do not invent internal schemas for screenshot-only step types. `listitem` with `op_type = "edit"` maps to the observed Edit item behavior; View item likely uses the same family with a different `op_type`, but that exact shape is not export-proven here.

## Comparison With Sub List Actions

Sub List actions and Collection/Kanban actions are both local to their host controls and use item-context actions from within repeated item templates.

Differences:

- Sub List local actions use `type = "list"` and steps such as `list_new`, `list_dup`, `list_del`, `list_import`, and `list_move`.
- Collection/Kanban local actions use `type = "coll"` and can mix form-action-like steps (`setvar`, `confirm`, `otheraction`) with current item/list operations (`listitem`, `deleteitem`, `setdatalist`).
- Collection/Kanban current item context is expression-token based through `__ctx_coll`.

## Generation Guidance

- Define item actions on the Collection/Kanban control at `attrs.actions[]`.
- Use `type = "coll"` for local Collection/Kanban actions.
- Bind item-template buttons, containers, or icons with `attrs.control_action`.
- Resolve item action bindings to local control action IDs.
- Use `__ctx_coll` / `ListDataID` when editing, deleting, selecting, or updating the current item.
- For current item update/delete patterns, use `setdatalist` filtered by current `ListDataID` when the desired confirmation/cleanup flow needs more control than built-in `deleteitem`.
- For selection, create page temp variables for selected IDs and selected count.
- Show checked/unchecked icons with dynamic display rules.
- Show bulk toolbar only when selected count is greater than zero.
- Implement bulk update/delete with page-level actions that filter `ListDataID` using the selected ID array.

## Validation Guidance

Validators should check:

- Collection/Kanban `attrs.actions[]` is an array when present.
- Local action `type` should be `coll`.
- Item-template `attrs.control_action` references resolve to local Collection/Kanban action IDs.
- `listitem` edit/view actions include current item `ListDataID` context and resolve target layouts when configured.
- `setdatalist` update/delete filters and target fields resolve to source list fields.
- `setvar` targets resolve to declared page temp variables.
- Dynamic display rules referencing selected item variables resolve to declared page temp variables.
- `otheraction` targets resolve to page actions or local actions.
- Screenshot-only step types should remain warning-first until export-proven.

## Proof Boundary

Kanban collection actions on `Company overview` are export-proven.

Collection actions on `Collection of activity` are export-proven.

Collection item operation step labels from the screenshot are UI-reference-backed where not present in the export.

Item selection, variable storage, checked/unchecked dynamic display rules, and bulk update/delete patterns are export-proven where observed.

Runtime execution of Edit item, Delete item, Mark current item as Completed, selection toggle, selected count, bulk toolbar, bulk mark completed, and bulk delete is user-confirmed only for the correct-project v2 package documented in `docs/studies/collection-kanban-actions-runtime-proof.md`.

Cross-host variable access in approval forms, Data List forms, and dashboards is product/user-understanding-backed unless separately export-proven for that host.

Do not claim all Collection action step types, Trigger list workflow, Barcode, NFC, AI assistant, unrelated general form action steps, cross-host approval/data-list form variable behavior, or every Kanban action behavior from this runtime proof.
