# Reverse-Related Collection Designer Dropbar Hardening Training Report

## Scope

This focused training covers the 2026-07-05 Departments View Item designer failure found during the Hospital Doctor Information Management E2E. It refines the reverse-related Collection section rules added in v0.9.6.

## Corrected Root Cause

This report originally focused on row operation residue. The follow-up fix11 analysis proved that row operations/dropbar were a real risk point but not the sufficient root cause. The failing generated View Item form also placed the reverse-related Collection inside the current-record details section/card instead of using the official export shape where the reverse-related Collection is an independent `Content.children[]` section after the current-record details section.

The failing generated View Item form contained row template source-template operation residue:

- `dropbar`
- `grid_table_col_item_op_menu`
- copied edit/delete row action buttons
- row operation metadata and `control_action` references not proven safe for this reverse-related section

The failure was not caused by the toolbar Add button or Search filter. A normal Yeeflow `.ydl` export for the same kind of section includes a Collection, toolbar Add action, and Search filter, but does not include a row operation dropbar inside the Collection item template and does not nest the reverse-related Collection inside the current details card.

## Evidence Boundary

Focused patches established the boundary:

- Removing toolbar Add/Search while leaving the row operation residue still failed.
- Removing the reverse-related Collection removed the designer failure.
- Removing row operations/dropbar alone still left the designer loading when the section remained nested in the current details card.
- The official export-compatible fix11 shape keeps toolbar Add/Search, omits row dropbar operations, and places the reverse-related Collection as an independent Content child section.

Therefore the generator must not treat all action controls as unsafe, and it must not learn a local-only "delete dropbar" fix. It must distinguish toolbar section actions from unproven row operations copied from a generic Collection template, and it must generate the official independent reverse-related section shape.

## Generator Rule

When materializing a reverse-related Collection section on a Data List View Item or Workbench View Item form:

- Add the section as an independent `Content` child after the current-record details section.
- Do not place it inside `section_content_area`, current-record fields grids, or the details card.
- Keep planned toolbar `search-filter` only when it is bound to Collection `fulltext`.
- Keep planned toolbar Add `action_button` only when it targets the child list and sets the child lookup field to current host `ListDataID` via `passvalues`.
- Keep Collection runtime attrs to the official surface: `data`, `layout`, `actions`, and `pagination`.
- Ensure Collection item `dynamic-field` controls use `attrs.source = "3"` and `attrs["obj-f"] = <child field>`.
- Remove cloned row `dropbar`, `grid_table_col_item_op_menu`, `grid_table_col_item_operations`, `card_col_item_operations`, and edit/delete/bulk/selected row action controls by default.
- Clear copied Collection row action metadata such as `actions`, `attrs.actions`, `attrs.control_action`, and `attrs.controlActions`.
- Generate row operations only after a separate export-proven row action contract exists and the App Plan explicitly requests those row actions.
- Parse all `#### Reverse-Related Collection Selection` subsections under the Custom Data List Forms plan. Multi-parent apps can plan one reverse-related Collection for Departments and another for Specialties; materializing only the first table is a generator defect and must fail package conformance.

## Validator Rule

Reverse-related Collection validation must recurse through the Collection subtree and fail before signing readiness when row operation residue is present. The hard gate is:

- `DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN`

This gate is intentionally scoped to reverse-related Collections so ordinary approved Collection templates can continue to use row operation menus when their own template contract allows them.

## Regression Expectations

Negative fixture:

- A reverse-related View Item Collection contains `grid_table_col_item_op_menu` or a row `dropbar`.
- Expected result: validator fails with `DATA_LIST_FORM_REVERSE_RELATED_ROW_OPERATION_UNPROVEN`.

Positive fixture:

- A reverse-related View Item section contains a child-list Collection, current `ListDataID` lookup filter, optional toolbar Search/fulltext, and optional toolbar Add/passvalues.
- The Collection row contains no row dropbar/operation menu.
- Expected result: validator passes the reverse-related section contract.
