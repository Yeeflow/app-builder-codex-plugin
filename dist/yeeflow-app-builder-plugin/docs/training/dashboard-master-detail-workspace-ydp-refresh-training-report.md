# Dashboard Master-Detail Workspace YDP Refresh Training Report

## Scope

This training refreshes the approved Dashboard page layout golden reference templates:

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

The canonical source artifacts are the exported Dashboard `.ydp` files:

- `Two-Panel Workspace Layout (1).ydp`
- `Three-Panel Workspace Layout (1).ydp`

## YDP Structure

A Dashboard `.ydp` export is JSON with outer page metadata and a stringified Dashboard page resource:

- Outer metadata includes `AppID`, `ListID`, `LayoutID`, `Type`, `Title`, `Ext1`, `Ext2`, `Ext3`, `IsDefault`, `IsItemPerm`, and related layout fields.
- `LayoutView` is a JSON string containing the actual Dashboard page resource with `children`, `attrs`, `filterVars`, `tempVars`, `exts`, `filter`, and `actions`.

Plugin template ingestion must parse `LayoutView` and use the parsed page resource as the golden reference body. The outer `.ydp` IDs are export-instance metadata and must not be copied into generated applications.

## Confirmed Template Updates

Both refreshed templates preserve the existing master-detail workspace layout and include these intentional updates:

1. `left_panel` custom width is now `attrs.style.width = [null, 520]`.
2. `left_panel_sidebar` moved from `left_panel > left_panel_caption_title_wrapper` into `current_item_main_panel > current_item_main_header_left`.
3. `left_panel_caption_title_wrapper` now contains `left_panel_caption_icon_wrapper`, which contains editable `left_panel_caption_icon`.
4. `current_item_main_header_operations` now preserves explicit current-record edit and delete operation slots:
   - `current_item_main_header_edit_item_button`
   - `current_item_main_header_delete_item_button`

The updated YDP exports preserve the global golden reference spacing rule: every `section_content_area` uses `attrs.style.gap = [null, "--sp--s200"]`.

## Generation Rules

- Preserve the refreshed YDP template structure for both two-panel and three-panel layouts.
- Map `left_panel_caption_icon` to the best FontAwesome icon for the left-panel source dataset.
- Preserve `left_panel_caption_icon_wrapper` inside `left_panel_caption_title_wrapper`.
- Preserve `left_panel_sidebar` inside `current_item_main_header_left`.
- Preserve `left_panel` width at `520px`.
- Preserve the template operation slots `current_item_main_header_operations_button`, `current_item_main_header_edit_item_button`, and `current_item_main_header_delete_item_button`.
- Generated pages may remove `current_item_main_header_edit_item_button` and `current_item_main_header_delete_item_button` when no current selected record edit/delete action is required.
- Generated pages may remove, keep, or duplicate `current_item_main_header_operations_button` for other current selected record operations, but every retained copy must bind to a resolved action.
- Continue to preserve `vCurrentItemID`, left Collection selection action, selected-item Collection limit/filter, `content_panel_empty`, and all existing master-detail runtime contracts.

## Hard Gates

Generated packages and registry templates must fail validation when:

- `left_panel` does not use the 520px custom width.
- `left_panel_caption_icon_wrapper` or `left_panel_caption_icon` is missing.
- `left_panel_caption_icon_wrapper` is outside `left_panel_caption_title_wrapper`.
- `left_panel_sidebar` remains inside `left_panel_caption_title_wrapper`.
- `left_panel_sidebar` is not inside `current_item_main_header_left`.
- The template registry entry is missing `current_item_main_header_edit_item_button` or `current_item_main_header_delete_item_button`.
- A generated page retains a current-item operation button without a resolved action binding.
