# Dashboard Page Layouts Master-Detail Workspace Standard

`dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` are approved Dashboard page-level golden reference templates for inbox-style master-detail workspaces. They coexist with the default `dashboard-page-layouts-v1.1` overview shell and the `dashboard-page-layouts-workbench` operational shell.

Use these templates when a Dashboard focuses on one primary source dataset and users need to scan records in a left panel, select one record, and review or act on that selected record in the right panel. Examples include service desk tickets, project records, customer/account workspaces, case triage, document review queues, and operational list/detail management pages.

## Template IDs

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

## Source Templates

- `docs/reference/dashboard-page-layout-two-panel-workspace.template.json`
- `docs/reference/dashboard-page-layout-three-panel-workspace.template.json`

Both templates are registered in `docs/reference/dashboard-page-layout-templates.json` and must be selected explicitly in the App Plan.

## Selection Rules

Use `dashboard-page-layouts-two-panel-workspace` when the page needs:

- A left dataset list panel.
- A right selected-record detail panel.
- Current-record fields, operations, related sections, KPI cards, charts, or tables in the right panel.

Use `dashboard-page-layouts-three-panel-workspace` when the page needs all two-panel behavior plus:

- A dedicated additional right-side information panel.
- More selected-record context than should fit in one detail area.
- Separate extra actions, extra metadata, comments, history, or auxiliary related data.

Do not use these templates for simple overview dashboards, report-only dashboards, or pages where the right/detail areas would be placeholder-only.

## Runtime Contract

The master-detail runtime contract is mandatory:

- Preserve the page temp variable `vCurrentItemID`.
- The left-panel Collection `left_panel_data_items_wrapper` must bind to the primary source dataset.
- Clicking a left-panel Collection item must write that item's record ID into `vCurrentItemID`.
- The selected-record detail Collection `current_item_wrapper` must bind to the same source dataset.
- `current_item_wrapper` must limit records to `1`.
- `current_item_wrapper` must filter the source record ID by `vCurrentItemID`.
- The empty-selection state `content_panel_empty` is shown when no record is selected.

The empty-selection state is editable business content:

- `content_panel_empty_image` may be replaced with a domain-appropriate empty-state image while preserving the Picture control style.
- `content_panel_empty_title` may be rewritten for the app domain.
- `content_panel_empty_description` may be rewritten for the app domain.

## Editable Regions

The following regions may be edited or populated according to the App Plan:

- `left_panel_caption_title`
- `left_panel_caption_add_button`
- `left_panel_filter_group`
- `left_panel_filter_control`
- `left_panel_data_items_wrapper`
- `left_panel_data_item`
- `main_content_page_title`
- `current_item_main_header_operations`
- `current_item_main_header_operations_button`
- `current_item_main_header_operations_button_icon`
- `page_title_header`
- `current_item_subject`
- `page_title_description`
- `Operations`
- `dashboard_standard_filter_group`
- `current_item_fields_grid`
- `current_item_standard_field`
- `current_item_standard_field_title`
- `current_item_standard_field_value`
- `current_item_large_field`
- `current_item_large_field_title`
- `current_item_large_field_value`
- `primary_working_area`
- `content_card_wrapper`
- `content_card_60_wrapper`
- `content_card_40_wrapper`
- `section_title_header`
- `section_content_area`
- `chart_cards_section`
- `kpi_metrics_wrapper`
- `kpi_cards_kpi_row`
- `kpi_card_wrapper`
- `content_panel_empty`
- `content_panel_empty_image`
- `content_panel_empty_title`
- `content_panel_empty_description`

The three-panel template also allows:

- `right_panel_page_title`
- `current_item_aditional_header_operations`
- `current_item_aditional_header_operations_button`
- `current_item_aditional_header_operations_button_icon`
- `current_item_additional_header`
- `current_item_additional_panel`
- `current_item_additional_content_wrapper`
- `current_item_additonal_content`

All other template controls, page temp variables, form actions, layout relationships, and structural style settings must remain template-faithful.

## Filters And Operations

`left_panel_filter_group` is a filter grouping container. Each group should contain no more than two Data Filter controls. If more filters are needed, duplicate another `left_panel_filter_group`.

`left_panel_caption_add_button` may be retained only when the left-panel source supports creating new records, such as a Data list or Document library. When the primary source is a Form report, Data report, or another read-only/reporting source, remove `left_panel_caption_add_button` and its action instead of leaving a visual-only Add button.

`Operations` and operation containers may exist only when they contain real configured action controls. Remove unused Operations regions and visual-only buttons.

## Field Display Rules

The left-panel record item title is mandatory in both workspace templates:

- `left_panel_data_item_space_between` must contain `left_panel_data_item_title`.
- `left_panel_data_item_title` displays the current Collection item subject/title field.
- The title control may be a Dynamic user or Dynamic field control depending on the chosen source field type, but the semantic `nv_label`/`nav_label` value must remain `left_panel_data_item_title`.
- The default date metadata controls inside `left_panel_data_item_space_between` must use `left_panel_data_item_date_wrapper` and `left_panel_data_item_date_value` when retained.
- Date/age text must use Yeeflow expression binding, not a visible literal formula string.

Use `current_item_fields_grid` for selected-record fields. Standard short fields use `current_item_standard_field` and occupy one grid cell. Large or media fields use `current_item_large_field`, including Multiple line, Rich text, Image, and Attachment/File fields.

When `current_item_large_field` appears inside `current_item_fields_grid`, its column span must equal the parent grid column count at each breakpoint. Column span must never exceed the parent grid column count.

Dynamic controls must match field type:

- User/identity fields use Dynamic user.
- Image fields use Dynamic image.
- File or Attachment fields use Dynamic file.
- Other fields use Dynamic field.

## Related Content And Analytics

`primary_working_area` is used for related data and actions tied to the selected record. It may contain KPI metrics, content cards, Data tables, approved Collection templates, approved Data Analytics templates, timelines, or other approved business controls.

`chart_cards_section` is used for grouped Data Analytics templates. Each `chart_cards_section` should contain no more than three Data Analytics templates. If more charts are required, duplicate another `chart_cards_section`. Remove `chart_cards_section` when no Data Analytics templates are planned.

`content_card_wrapper`, `2_columns_section`, `3_columns_section`, `2_columns_60/40_section`, and `kpi_metrics_wrapper` may be reordered to match business priority. Remove any copied section module that contains no meaningful business content.

`section_title_header` is optional in generated master-detail content cards. Keep it only when the section needs a distinct business title/description that is not already carried by the nested Collection, Data table, chart, field grid, or related component. If `section_title_header` is omitted and the sibling `Operations` region is also omitted or has no configured actions, remove the owning `section_title_area` as well. Do not keep copied template headers such as `Left Ticket List` or `Active Loan Pipeline` merely because they existed in the source template.

## Cleanup Rules

Generated pages must remove:

- Empty `section_content_area`.
- Empty `chart_cards_section`.
- Empty filter groups.
- Empty `kpi_metrics_wrapper`.
- Unused Operations containers.
- Title-only copied section modules.
- Empty optional right/detail panels.
- Copied source-template business copy from another domain, including loan/Office Asset helper text in non-loan apps.

KPI cards should be generated only when the Functional Specification or App Plan requires KPI metrics. Generate only the planned number of KPI cards.

## Validation

Before signing readiness, run:

```bash
node scripts/validate-dashboard-page-layout-template.mjs --package <package.yapk>
node scripts/test-dashboard-master-detail-workspace-page-layout-template-gates.mjs
```

The aggregate dashboard hard gates and first-generation preflight must also pass before signing, install/import, upgrade, or runtime proof.
