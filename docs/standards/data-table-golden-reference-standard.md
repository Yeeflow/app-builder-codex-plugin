# Data Table Golden Reference Standard

This standard defines the approved Yeeflow Data table templates for generated pages and forms.

Data table controls are native `data-list` controls used for lightweight tabular record display. They are different from Dashboard Collection templates: Data table is best for simple grid-style display, while Collection templates are used for richer item layouts, multi-select state, card layouts, kanban/timeline-style presentation, or complex row-level interaction patterns.

## Approved Templates

- `data_table_control_standard_scroll`
- `data_table_control_standard_no_scroll`
- `data_table_control_caption_scroll`

Each template is stored as an export-shaped JSON artifact under `docs/reference/`. Generators must clone the approved template control and preserve all locked style, layout, and typography settings. Do not hand-build a simplified `data-list` control that only resembles the template.

## Template Selection

Use `data_table_control_standard_scroll` when the table needs more fields and horizontal scrolling is acceptable. This template preserves `attrs.table.cwt = [null, "0"]`.

Use `data_table_control_standard_no_scroll` when the table has a small number of columns and should fit all columns inside the current control without horizontal scrolling. This template preserves `attrs.table.cwt = [null, "1"]`.

Use `data_table_control_caption_scroll` when the table needs a caption title plus built-in search, add item, and more-menu import/export affordances. This template preserves `attrs.table.cwt = [null, "0"]` and the caption toolbar contract.

## Allowed Surfaces

Data table templates may be used on:

- Dashboard pages.
- Custom Data List forms.
- Approval form Submission forms.
- Approval form Task forms.
- Approval form Print pages.
- Data List workflow Task forms.
- Schedule workflow Task forms.

## Locked And Editable Regions

All style/layout settings in the source template are locked. In generated output:

- `attrs.table`, `attrs.header`, `attrs.body`, `attrs.cardCont`, and `attrs.caption-style` must preserve the selected template shape.
- `attrs.table.cwt` must match the selected template.
- `attrs.data.list` may be remapped to the target source resource.
- `attrs.listarr` may be replaced with business display columns from the selected source.
- Every display column must include a real `Field` source field and a visible `FieldName` label.
- For `data_table_control_caption_scroll`, only `attrs.caption.title`, `attrs.caption.placeholder`, and `attrs.caption.addtext` may change as business text. `display`, `search`, `add`, and `showmore` must remain enabled.
- For the two standard templates, caption display must not be enabled.

Generated Data tables must not contain unresolved template placeholders such as `{{ListID}}`, `{{layout}}`, or `[object Object]`.

## App Plan Requirements

Every planned Data table region must declare:

| Column | Required Meaning |
| --- | --- |
| Host Surface | Dashboard, Data List form, Approval submission/task/print page, Data List workflow task, or Schedule workflow task. |
| Page/Form | Page or form name. |
| Region | Business section name. |
| Source Resource | Data List, Document Library metadata list, Form Report, or Data Report. |
| Business Purpose | Why a native Data table is the correct display. |
| Selected Data Table Template | One approved template ID. |
| Column Width Mode | Default scroll or Auto no-scroll. |
| Caption/Actions | Whether caption/search/add/import/export are required. |
| Display Columns | Business field labels only, no runtime IDs. |
| Selection Rationale | Why the selected template fits the business need. |
| Proof Boundary | Local validation, runtime proof required, or deferred reason. |

The App Plan must not include generated `ListID`, `ListSetID`, field storage IDs, JSON property paths, copied control payloads, or placeholder IDs.

## Generated-Final Hard Gates

Generated-final validation must fail when:

- A generated Data table `data-list` control does not carry an approved Data table template ID.
- The selected template ID is unknown or retired.
- The generated control type is not `data-list`.
- Locked style/layout attributes drift from the selected source template.
- The selected column width mode is changed.
- A caption template is generated without caption/search/add/more behavior.
- A standard no-caption template enables the caption toolbar.
- The data source is missing.
- `attrs.listarr` is empty or columns lack `Field` / `FieldName`.
- The package contains unresolved template placeholders or `[object Object]`.
- An App Plan-selected Data table template is not materialized in the generated package.

Proof boundary: these templates are export-shaped and validator-backed. Runtime rendering, search execution, add item, import/export, workflow task behavior, and approval print behavior still require focused runtime proof before being claimed as runtime-proven.
