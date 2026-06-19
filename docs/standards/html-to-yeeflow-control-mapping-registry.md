# HTML-to-Yeeflow Control Mapping Registry

This registry defines allowed `data-yeeflow-control` values for control-mapped HTML previews. Do not invent mappings. Unknown mappings fail unless explicitly marked `export-learning-required`, `runtime-proof-required`, or `deferred` with reason, fallback, and proof impact.

Registry entries are proof-scoped. A visual HTML pattern does not imply Yeeflow runtime support. Entries must be backed by plugin-known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.

## Registered Mappings

- `container` -> Yeeflow Container
- `grid` -> supported Yeeflow layout grid/container pattern
- `layout-grid` -> supported Yeeflow layout grid/container pattern
- `heading` -> Heading
- `text` -> Text
- `field-input` -> field input control for form surfaces
- `textarea` -> multiline text field control
- `select` -> choice/dropdown field control
- `choice` -> choice/dropdown field control
- `date-picker` -> Date/DateTime field control
- `user-picker` -> User/person field control
- `number-input` -> Number/Currency field control
- `file-upload` -> file/attachment/document upload control where supported
- `sub-list` -> Sub List
- `collection` -> Collection
- `data-table` -> Data Table
- `kanban` -> Kanban
- `vertical-timeline` -> Vertical Timeline
- `horizontal-timeline` -> Horizontal Timeline
- `button` -> Button/action control
- `status-badge` -> Text/label/status style pattern
- `summary-card` -> Summary + display wrapper only when Summary shape is supported/proven
- `document-preview` -> document embed/open/download pattern where supported
- `custom-code` -> Custom code only when explicitly justified and supported

## Required Support Fields

Each registry-backed mapping used by a UI Surface Contract or HTML preview must preserve:

- stable `data-blueprint-id`
- control role
- source resource/list when data-backed
- field metadata when field-backed
- action metadata when action-backed
- row/current item/parent binding when list-backed
- style/layout/responsive tokens
- proof boundary

## Unknown Mapping Boundary

Unknown mappings must not be downgraded into generic Containers or Text. They must block `readyForBlueprint: true` unless explicitly deferred or proof-labeled. The fallback must state what later export learning or runtime proof is required before generation.
