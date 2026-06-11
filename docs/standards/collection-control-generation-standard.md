# Collection Control Generation Standard

This standard applies only to the Collection card-style responsive grid pattern. It does not authorize arbitrary Collection generation.

It does not cover row-list Collection, kanban-style Collection, grouped Collection, nested Collection, timeline-style Collection, gallery/media variants, or unknown non-card patterns. Any non-card Collection usage must remain guarded until a separate export-backed golden-reference study proves the exact pattern.

Collection + Grid/table-style support is covered separately by `docs/standards/collection-grid-table-generation-standard.md` and the `collection_control_grid_table` template. Do not mix this card standard with the table standard.

## Card Collection Golden-Reference Rule

Use the card Collection pattern for visual card/grid record display on decoded YAP dashboard, approval-form, or data-list-form surfaces when the source list and fields are known.

Required root shape:

- `type: "collection"`
- `label: "Collection"`
- stable unique root `id`
- `attrs.data.list` with `AppID`, `ListID`, `Type`, `Title`, and `ListSetID`
- optional `attrs.data.link`
- first child is the repeated item template
- item template and every child control have unique ids
- current item bindings use `source: "3"` / `obj-f` or `variable_ctx` / `ctx: "__ctx_coll"`

Use this pattern when the user asks for Collection cards, card grids, activity cards, record cards, ticket cards, task cards, project cards, company cards, contact cards, or similar visual card UI.

Do not reuse this card pattern for table-style, grid-table, spreadsheet-style, row-list, kanban, grouped, nested, timeline, gallery, or unknown Collection requests unless the user explicitly accepts a card fallback and the proof boundary is recorded. For table-like Collection requests, use the separate `collection_control_grid_table` standard only when that exact table pattern is requested and valid.

## Format Rules

- Common: source list, fields, current-item bindings, item template, child ids, action references, and responsive settings must validate.
- YAP: dashboard pages live under `Data.Item.Layouts[].LayoutInResources[].Resource`; approval forms live under `Data.Forms[].DefResource.pageurls[].formdef`; data-list forms live under `Data.Childs[].Layouts[].LayoutInResources[].Resource`.
- YAPK: the `Company Overview` card Collection pattern is decoded and proven for dashboard/page, approval-form, and data-list-form resources. The top-level wrapper is `AppExportPackageInfo`; `Resource` is base64 Brotli `AppPackageInfo`. Strict Brotli can end with `Z_BUF_ERROR`; generated-final validation may use the same safe tolerant Brotli path used by Builder/Research diagnostics, as long as no raw decoded payload is printed or stored.
- YAPK card Collection resource locations: dashboard/page controls live in `Pages[].LayoutInResources[].Resource`; approval-form controls live in decoded `Forms[].DefResource -> pageurls[].formdef`; data-list-form controls live in `Childs[].Layouts[].LayoutInResources[].Resource`.
- `COLLECTION_YAPK_SHAPE_UNPROVEN` must not fire for a decoded YAPK card Collection that matches the Company Overview pattern. It must still fire for undecoded YAPK Resources and any YAPK Collection pattern that does not match a proven card or grid/table shape.
- YAPK Collection generation is allowed only for the proven card-style pattern.

## Surface Rules

- Dashboard: generate only inside a dashboard/page resource context.
- Approval form: generate only inside approval `formdef` context and keep Collection actions separate from form-level `formAction`.
- Data-list form: generate only inside a child-list form/layout resource context.
- Do not move dynamic current-item controls outside the item template.
- Do not infer Collection + Grid table-style behavior from this card Collection study.

## Responsive Rules

The card grid golden reference defaults to:

- PC/laptop: 3 columns
- tablet: 2 columns
- mobile: 1 column

The decoded YAP stores this as `attrs.layout.col: [null, null, 2, 1]`; desktop 3 columns are implicit/default. Generated card Collections should also preserve:

- `attrs.layout.cg`
- `attrs.layout.rg`
- `attrs.layout.cp`
- compatible parent container gap/layout
- item card width/gap/wrap behavior

When the template requests responsive card-grid behavior, generated-final validation must hard-fail missing or malformed responsive columns.

## Item Card Template Rules

The repeated item template should preserve these regions when generated:

- image/media region using `dynamic-image`
- primary title using `dynamic-field`
- status/category and progress fields using `dynamic-field`
- owner/requester using `dynamic-user`
- file/attachment display using `dynamic-file` when fields exist
- native text/heading controls with `headc.title` metadata
- bottom operation row with action buttons when actions are proven
- optional absolute top-right selection container with icons

Static text must not leak placeholder copy such as `Here is the title`.

## Action Rules

Separate action layers clearly:

- Collection root actions: `attrs.actions[]`, `type: "coll"`, `steps[]`
- item trigger controls: `attrs.control_action`
- item-level operations: select, edit, update/mark completed, delete
- form actions: host/form-level `formAction`, not a substitute for Collection item actions
- container actions: top-right selection container can trigger the select action

Generated item operations must:

- resolve the action id locally or to a known page action
- carry current item context through `__ctx_coll`
- include `ListDataID` for row-specific operations
- use export-proven step families only, such as `setvar`, `listitem`, `confirm`, `setdatalist`, and `otheraction`
- omit unsafe guessed actions and report the proof boundary

## Multiselect Rules

When multiselect is generated:

- preserve selected item temp variable state
- preserve selected item count binding
- include an operation toolbar above the Collection
- include bulk operation buttons only when their actions are proven
- include the top-right absolute operation/selection container inside each card
- include checked and unchecked icon controls with unique ids
- keep icon size and inline width metadata
- resolve all action references

The top-right operation container must have:

- `type: "container"`
- `attrs.control_action`
- `attrs.common.pos: [null, "absolute"]`
- `attrs.common.hor: [null, "right"]`
- numeric horizontal and vertical offsets
- numeric z-index when z-index is present

## Data Rules

- The source list must exist.
- Referenced fields must exist.
- Seed/sample data must use displayed fields.
- Lookup/user/file/image fields must resolve when used.
- Sort fields must exist; the real export uses `SortName` and `SortByDesc`.
- `attrs.data.ps` must be positive when present.
- `attrs.pagination.p` must be preserved when pagination is generated.

## Proof Rules

- Schema validation is not enough.
- Import/API queue success is not designer proof.
- Import/API queue success is not runtime render proof.
- Designer hydration and runtime render are separate proof levels.
- Generated Collection controls must pass the Collection control validator.
- YAPK validation must inspect all proven resource locations and use tolerant Brotli when strict Brotli ends with `Z_BUF_ERROR`.

## Generated-Final Hard Errors

Generated-final/import-qualified validation should hard-fail:

- `COLLECTION_CONTROL_SHAPE_MISSING`
- `COLLECTION_CONTROL_UNPROVEN_SHAPE`
- `COLLECTION_CONTROL_ID_MISSING`
- `COLLECTION_CONTROL_ID_DUPLICATE`
- `COLLECTION_DATA_SOURCE_MISSING`
- `COLLECTION_DATA_SOURCE_INVALID`
- `COLLECTION_ITEM_TEMPLATE_MISSING`
- `COLLECTION_ITEM_TEMPLATE_INVALID`
- `COLLECTION_ITEM_BINDING_MISSING`
- `COLLECTION_FIELD_BINDING_INVALID`
- `COLLECTION_REFERENCED_FIELD_MISSING`
- `COLLECTION_FILTER_FIELD_INVALID`
- `COLLECTION_SORT_FIELD_INVALID`
- `COLLECTION_DATA_PAGE_SIZE_INVALID`
- `COLLECTION_PAGINATION_INVALID`
- `COLLECTION_RESPONSIVE_COLUMNS_MISSING`
- `COLLECTION_RESPONSIVE_COLUMNS_INVALID`
- `COLLECTION_PARENT_RESPONSIVE_LAYOUT_INVALID`
- `COLLECTION_SURFACE_WRAPPER_INVALID`
- `COLLECTION_APPROVAL_FORM_CONTEXT_INVALID`
- `COLLECTION_DATA_LIST_FORM_CONTEXT_INVALID`
- `COLLECTION_DASHBOARD_CONTEXT_INVALID`
- `COLLECTION_ACTION_REFERENCE_INVALID`
- `COLLECTION_CONTROL_ACTION_REFERENCE_INVALID`
- `COLLECTION_ITEM_ACTION_REFERENCE_INVALID`
- `COLLECTION_FORM_ACTION_REFERENCE_INVALID`
- `COLLECTION_ACTION_SHAPE_INVALID`
- `COLLECTION_CONTROL_ACTION_SHAPE_INVALID`
- `COLLECTION_ROOT_ACTIONS_MISSING`
- `COLLECTION_ACTION_TRIGGER_MISSING`
- `COLLECTION_ACTION_LISTDATAID_MISSING`
- `COLLECTION_CURRENT_ITEM_CONTEXT_MISSING`
- `COLLECTION_ITEM_ACTION_MISSING_CONTEXT`
- `COLLECTION_MULTISELECT_STATE_MISSING`
- `COLLECTION_MULTISELECT_ACTION_INVALID`
- `COLLECTION_MULTISELECT_TOOLBAR_MISSING`
- `COLLECTION_MULTISELECT_TOOLBAR_POSITION_INVALID`
- `COLLECTION_MULTISELECT_ICON_INVALID`
- `COLLECTION_SELECTED_COUNT_BINDING_INVALID`
- `COLLECTION_OPERATION_CONTAINER_POSITION_INVALID`
- `COLLECTION_OPERATION_CONTAINER_OFFSET_INVALID`
- `COLLECTION_OPERATION_CONTAINER_ZINDEX_INVALID`
- `COLLECTION_CHILD_CONTROL_ID_DUPLICATE`
- `COLLECTION_CHILD_TEXT_VALUE_MISSING`
- `COLLECTION_CHILD_NATIVE_TEXT_MISSING`
- `COLLECTION_CHILD_BINDING_CONTEXT_INVALID`
- `COLLECTION_PLACEHOLDER_TEXT_LEAK`
- `COLLECTION_DESIGNER_HYDRATION_RISK`
- `COLLECTION_RUNTIME_RENDER_RISK`
- `COLLECTION_YAPK_SHAPE_UNPROVEN`
- `COLLECTION_YAPK_DECODE_FAILED`
- `COLLECTION_YAPK_RESOURCE_LOCATION_MISSING`
- `COLLECTION_YAPK_CARD_SHAPE_INVALID`
- `COLLECTION_YAPK_UNKNOWN_PATTERN`
- `COLLECTION_PATTERN_UNPROVEN`
- `COLLECTION_NON_CARD_PATTERN_UNPROVEN`
- `COLLECTION_GRID_TABLE_PATTERN_UNPROVEN`
