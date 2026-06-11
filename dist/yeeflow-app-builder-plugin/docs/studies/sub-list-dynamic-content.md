# Sub List Dynamic Content Layout And List Actions

## Source

Export studied: `/Users/Renger/Downloads/Sub list Dynamic.yap`

The package contains one Approval Form named `Dynamic sub list form`. It contains two visible Sub List controls. Both Sub Lists use the advanced Dynamic content layout. No Data List custom form with a Sub List is present in this export.

## Feature Overview

Sub List controls in Approval Forms are exported as normal form controls with `type = "list"`. The associated variable is a `variables.basic[]` entry with `type = "list"`, and its `value` points to a `variables.listref[]` row schema. The control stores displayed row fields in `attrs["list-fields"]`, row variable schema in `attrs["list-variables"]`, summary configuration in `attrs["list-fields-summary"]`, fallback text in `attrs.fallback`, list actions in `attrs.actions`, and Dynamic content layout selection in `attrs["list-display-preference"] = "dynamic"`.

Dynamic content layout stores the item template as normal child controls under a `list-body` child. Field controls inside the dynamic item template use the row field as `binding`, set `attrs.list_field = true`, set `attrs.list_field_binding` to the parent Sub List binding, and keep `attrs.list_control_id` pointing at the parent control. The footer is a separate `list-footer` child and can contain action buttons plus `list-summary` controls.

## Controls Found

The first Sub List is titled `Sub list`, binds to the list variable `field_9`, and displays four row fields: text, number, date, and text. It uses Dynamic content layout, a fallback text of `Click the following button to add a new item.`, a visible total summary for the numeric row field, footer buttons for Add another item and Import items, and item-level actions for Duplicate, Insert before, Insert after, and Delete.

The second Sub List is titled in navigation as `Dynamic List Body`, binds to the list variable `DynamicScrollList`, and displays seven row fields: five text fields, one date field, and one number field. It uses the same Dynamic content model, includes a visible total summary for its numeric field, includes the same list actions, and includes the custom CSS pattern below.

```css
selector .dynamic-list .list-footer
{
    position: absolute;
    left: 0;
    right: 0;
    bottom: -60px;
}
```

This CSS is export-proven as part of the second Sub List's layout. Treat it as a layout-preservation pattern for fixed-width or horizontal-scroll dynamic list designs, not as a required rule for every Dynamic content Sub List.

## Dynamic Content Schema

Normalized shape:

```json
{
  "type": "list",
  "binding": "<list-variable-id>",
  "attrs": {
    "list-display-preference": "dynamic",
    "list-fields": ["<row-field-controls>"],
    "list-variables": ["<row-field-definitions>"],
    "list-fields-summary": ["<summary-settings>"],
    "fallback": { "et": "Click the following button to add a new item." },
    "actions": ["<list-action-definitions>"]
  },
  "children": [
    { "type": "list-body", "children": ["<dynamic-item-template-controls>"] },
    { "type": "list-footer", "children": ["<footer-buttons-and-summaries>"] }
  ]
}
```

The dynamic item template can contain normal layout and visual controls. This export proves `container`, `dropbar`, `action_button`, `line`, `icon`, `input`, `input_number`, `datepicker`, and `flex_grid` inside the item template. The second Sub List uses a `flex_grid` inside the item template to align row controls into a table-like row.

## Table-Header Grid Pattern

The second Sub List includes an independent `flex_grid` directly above the Sub List. It is labeled as a Sub List header and contains field-header text such as `Field 1`, `Field 2`, and related column headers. This grid is not stored as a formal child of the Sub List; it is an adjacent/sibling layout control. The matching row layout lives inside the Sub List `list-body` dynamic item template.

Generation guidance: build table-style Dynamic Sub Lists as a sibling header grid plus a Dynamic content Sub List whose item template uses a matching grid/column layout. Do not assume the header grid is semantically attached to the Sub List beyond layout proximity.

## List Actions

Sub List list actions are stored under the parent Sub List control at `attrs.actions[]`. They use `type = "list"` and step definitions under `steps[]`. Action buttons inside the dynamic item template and footer bind to those Sub List action IDs through `attrs.control_action`. These are list-scoped actions, not page-level `formdef.actions[]`.

Export-proven action names and step types:

| Action label | Step type | Scope |
| --- | --- | --- |
| Add sub item | `list_new` | Current list |
| Import items | `list_import` | Current list |
| Duplicate item | `list_dup` | Current object |
| Delete item | `list_del` | Current object |
| Insert before current item | `list_new` with `attrs.position = "0"` | Current list, positioned relative to current object |
| Insert after current item | `list_new` with `attrs.position = "1"` | Current list, positioned relative to current object |

The product UI also shows Current object actions such as Move item and Update fields. Those step names are product-observed from screenshots, but the studied export only contains `list_new`, `list_import`, `list_dup`, and `list_del`. Keep `list_move` and `list_update` warning-first until an export proves their exact serialized attrs.

## Expression Notes

This export proves list action scoping and row-field bindings inside the dynamic item template. It does not contain a focused expression example that reads current object properties inside a list action expression. Treat current-object expression access as product-understanding-backed until a dedicated export or runtime test proves exact expression tokens.

## Validator Guidance

Validators should check Sub Lists without confusing their list-scoped actions with normal form actions:

- `type = "list"` controls must bind to a list variable whose value resolves to a `variables.listref[]` schema.
- Dynamic content layout should include a `list-body` with child controls.
- Dynamic item field controls should resolve to row fields and keep `attrs.list_field_binding` equal to the parent Sub List binding.
- Summary fields should resolve to row fields. Numeric summary compatibility should remain warning-first where exact runtime support is not proven.
- `attrs.actions[]` should be an array; actions should include step objects; export-proven step types are `list_new`, `list_import`, `list_dup`, and `list_del`.
- Action buttons inside `list-body` or `list-footer` should resolve to `attrs.actions[].id` on the same Sub List rather than `formdef.actions[]`.
- The sibling header Grid plus Dynamic Sub List pattern should be allowed.
- The `.dynamic-list .list-footer` CSS pattern should be preserved when required by layout, but it is not globally required.

## Proof Boundary

Approval Form Sub List dynamic content layout in this export is export-proven.

Sub List list actions in this export are export-proven for Add sub item, Duplicate item, Delete item, Import items, Insert before current item, and Insert after current item, with step types `list_new`, `list_dup`, `list_del`, and `list_import`.

Data List custom form Sub List support is product/user-understanding-backed only in this pass because this export contains Approval Form evidence, not a Data List custom form.

Runtime behavior, add/duplicate/delete/import/move/update execution, scrollbar behavior, and current-object expression evaluation are not runtime-proven by this study.
