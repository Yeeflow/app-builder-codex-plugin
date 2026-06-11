# Kanban, Collection, And Dynamic Controls

## Feature Overview

This study documents the Kanban control, Collection control, and Dynamic field/user/image/file controls from the `Company Overview.yap` export. It focuses on how dashboard item templates bind to a data source current item, and how Dynamic controls bind to the current list item on a Data List custom form.

Export studied: `/Users/Renger/Downloads/Company Overview.yap`

Targets studied:

- Dashboard `Company overview`: Kanban control with Dynamic controls inside Kanban item cards.
- Dashboard `Collection of activity`: Collection control with Dynamic controls inside Collection items.
- Data List `Company Overview`: source fields for dashboard controls and custom forms.
- Data List custom form `View page`: Dynamic controls bound to the current list item.

Vertical Timeline and Horizontal Timeline controls are intentionally out of scope for this branch.

## Data Source

The export contains one Data List named `Company Overview`. The dashboard Kanban and Collection controls both use this list as their data source.

Observed fields include:

- `Title` / `Name`: text.
- `Datetime1` / `Start date`, `Datetime2` / `Due date`: date/time.
- `Text1` / `Status`, `Text2` / `Project owner`, `Text4` / `RAG status`, `Text5` / `Complexity`, `Text6` / `Impact Level`, `Text7` / `Risk Factor`: choice-style text fields.
- `Decimal1` / `Progress rate`: percent/decimal.
- `Decimal2` / `Project cost`: currency/decimal.
- `Text8` / `Reference`: file attachment field with multiple files enabled.
- `Text10` / `Assignee`: identity/user field with multiple users enabled.
- `Text11` / `Cover image`: image field.

The export does not include raw sample rows in the decoded `ListDatas` array. This study records field/data shape only and does not include private records.

## Kanban Control

Dashboard: `Company overview`

Observed Kanban configuration:

- Control type: `kanban`.
- Data source: `attrs.data.list`, resolving to the `Company Overview` Data List.
- Category/group-by field: `attrs.data.cateField = "Text2"`, resolving to `Project owner`.
- Item template: stored as child controls under the Kanban control, including `kanban-body` and `kanban-footer`.
- Current item dynamic bindings: Dynamic controls inside the Kanban item template use `attrs.source = "3"` plus `attrs["obj-f"] = <field name>`.
- Context expressions: the export contains `exprType = "variable_ctx"` with `ctx = "__ctx_kanban"` and `id = "_cate"` for the current Kanban category. It also contains a collection-style item expression context for progress display.

Observed Dynamic controls inside Kanban item cards:

- Dynamic image bound to `Text11` / `Cover image`.
- Dynamic user bound to `Text10` / `Assignee`.
- Dynamic field bound to general fields including `Title`, `Text3`, `Datetime1`, `Datetime2`, `Text4`, and `Decimal2`.

Kanban runtime behavior, card rendering, drag/drop, and click behavior are not proven by this export.

## Collection Control

Dashboard: `Collection of activity`

Observed Collection configuration:

- Control type: `collection`.
- Data source: `attrs.data.list`, resolving to the `Company Overview` Data List.
- Layout settings: `attrs.layout` contains grid/card layout keys such as column gap, row gap, content padding, and alignment.
- Item template: stored as child controls under the Collection control.
- Current item dynamic bindings: Dynamic controls inside the Collection item template use `attrs.source = "3"` plus `attrs["obj-f"] = <field name>`.

Observed Dynamic controls inside Collection items:

- Dynamic image bound to `Text11` / `Cover image`.
- Dynamic field bound to `Title`, `Text3`, and `Text4`.
- Dynamic user bound to `Text10` / `Assignee`.
- Dynamic file bound to `Text8` / `Reference`; two variants were observed, both limited to two files, one with file type icon display enabled.

Collection runtime rendering, card click behavior, filtering execution, image preview, and file preview/download behavior are not proven by this export.

## Data List View Page

Data List: `Company Overview`

Custom forms found:

- `View page`
- `Edit item`

The `View page` contains three Dynamic field controls bound to the current list item:

- `attrs.source = "4"` and `attrs["obj-f"] = "Title"` for `Name`.
- `attrs.source = "4"` and `attrs["obj-f"] = "Datetime1"` for `Start date`.
- `attrs.source = "4"` and `attrs["obj-f"] = "Datetime2"` for `Due date`, with an observed prefix of `-`.

This export proves Dynamic field usage on a Data List custom form with current-list-item context. It does not show Dynamic user, Dynamic image, or Dynamic file controls on the Data List View page; those controls are export-proven in Kanban/Collection item templates only in this study.

## Dynamic Control Schema

Shared observed binding pattern:

- `attrs.source = "3"` means current Collection/Kanban item context inside dashboard item templates.
- `attrs.source = "4"` means current Data List item context inside Data List custom forms.
- `attrs["obj-f"]` stores the source field name.

Dynamic field:

- Observed on Kanban, Collection, and Data List View page.
- Used for text, choice, date/time, percent/currency, and other general display values.
- Formatting/style settings appear under `attrs.common`, `attrs.item_style`, `attrs.t-af`, `attrs.t-be`, and optional `attrs.prefix`.

Dynamic user:

- Observed inside Kanban and Collection item templates.
- Bound to `Text10` / `Assignee`, an `identity-picker` field with multiple users enabled.
- Observed settings include `attrs["i-len"]`, `attrs.display_name`, `attrs.addition_fields`, `attrs.picture_style`, `attrs.text_style`, and `attrs.item_style`.

Dynamic image:

- Observed inside Kanban and Collection item templates.
- Bound to `Text11` / `Cover image`, an `icon-upload` image field.
- Observed settings include `attrs.preview_image`, `attrs.setting.img_height`, `attrs.setting.fit`, and image border/style settings.

Dynamic file:

- Observed inside Collection item templates.
- Bound to `Text8` / `Reference`, a `file-upload-merge` field with multiple files enabled.
- Observed settings include `attrs["i-len"]`, `attrs.content`, `attrs.opbtn`, and `attrs.type_icon_show`.

Single vs multiple:

- Multiple user handling is export-proven for the `Assignee` field through the list field rules and Dynamic user display limit.
- Multiple file handling is export-proven for the `Reference` field through the list field rules and Dynamic file display limit.
- Multiple image handling is not observed in this export.

## Comparison

Kanban:

- Data source lives at `attrs.data.list`.
- Grouping lives at `attrs.data.cateField`.
- Dynamic controls use current item source `3`.
- Category context appears as `__ctx_kanban` / `_cate`.

Collection:

- Data source lives at `attrs.data.list`.
- Layout lives at `attrs.layout`.
- Dynamic controls use current item source `3`.
- The studied Collection did not show a separate category context.

Data List custom form:

- Host list is implied by the custom form's parent Data List.
- Dynamic controls use current item source `4`.
- Field binding still uses `attrs["obj-f"]`.

## Generation Guidance

- Resolve every Kanban/Collection `attrs.data.list.ListID` to an included list-like source before handoff.
- For Kanban, resolve `attrs.data.cateField` to a source field.
- Use `attrs.source = "3"` for Dynamic controls inside Kanban/Collection item templates.
- Use `attrs.source = "4"` for Dynamic controls on Data List custom forms that display current record values.
- Bind Dynamic user controls to user/person fields, Dynamic image controls to image fields, and Dynamic file controls to attachment/file fields.
- Use Dynamic field for general field values; prefer specialized controls for user/image/file fields when generating new layouts.
- Do not claim Vertical Timeline or Horizontal Timeline support from this study.

## Validation Guidance

Validators should warn or hard-error depending on generation mode:

- Kanban data source must resolve.
- Kanban category/group-by field must resolve.
- Collection data source must resolve.
- Dynamic controls inside Kanban/Collection must bind to fields available on the source list current item.
- Dynamic controls on Data List custom forms must bind to current list item fields.
- Specialized Dynamic controls should bind to compatible source field types.
- Historical exports should remain warning-first where schema variants are incomplete.

## Proof Boundary

- Kanban control usage on `Company overview` is export-proven.
- Collection control usage on `Collection of activity` is export-proven.
- Dynamic controls inside Kanban/Collection are export-proven where observed.
- Dynamic controls on Data List `View page` are export-proven where observed.
- Runtime Kanban/Collection rendering, drag/drop, click behavior, dynamic file/image preview behavior, and Data List form runtime behavior are not proven unless later tested.
- Vertical Timeline and Horizontal Timeline are not studied in this branch.
