# Dashboard Dataset Presentation Golden Reference Standard

Dashboard pages often need to present Data List, Form Report, Document Library, or workflow/report datasets. When a Dashboard dataset region uses a `collection` control, generation must choose one approved dataset presentation reference from `docs/reference/dashboard-dataset-presentation-golden-references.json`.

This standard keeps business planning separate from low-level Yeeflow payload generation:

- Functional Specification describes the business dataset need: users, records, fields, filters, search, sorting/grouping, batch operations, actions, mobile support, and runtime proof needs.
- App Plan maps each Dashboard dataset region to exactly one approved presentation reference ID and explains why by using the registry's `whenToUse`, `whenNotToUse`, `requiredBusinessSignals`, and `suitableSourceResourceTypes` guidance.
- Resource generation copies/adapts the selected export-proven template and binds it to real app resources.
- Validators reject simplified, invented, or partially recreated Collection layouts before signing.
- Generated-final validation compares each App Plan Dashboard dataset region to the generated Dashboard package. The selected Collection presentation reference is an implementation contract for that exact page/region, not advisory prose.

## Approved References

| Reference ID | Use For |
| --- | --- |
| `collection_control_responsive_card_grid` | Card-style record browsing. |
| `collection_control_card_with_multiselect_toolbar` | Card-style records with selected state and bulk toolbar. |
| `collection_control_grid_table` | Dense table-like Collection records. |
| `collection_control_grid_table_with_multiselect` | Dense table-like Collection records with checkbox selection and bulk operations. |
| `collection_control_grid_table_with_search` | Dense table-like Collection records with search/fulltext filtering. |
| `Event Pipeline Grid-Table` | High-fidelity primary Dashboard operations/pipeline/work-queue table based on the Event Portfolio Golden Reference. |

No other Dashboard Collection presentation pattern is generated-final eligible unless explicitly marked `export-learning-required` and blocked from signing/install.

## App Plan Requirements

Every Dashboard dataset region that plans to use Collection must declare:

| Column | Required Meaning |
| --- | --- |
| Dashboard Page | Page title. |
| Dataset Region | Business region name. |
| Source Resource | Data List, Form Report, Document Library, or other approved source. |
| Business Purpose | Why this dataset is visible on the Dashboard. |
| Required Fields | Business fields to display, not runtime IDs. |
| Filters/Search | Business filters or search needs. |
| Actions | Row, bulk, or region actions. |
| Selected Collection Presentation Reference | One approved reference ID. |
| Selection Rationale | Why the reference matches the business need. |

App Plan must not include generated IDs, `ListID`, `LayoutID`, `PageID`, `actionTypeCode`, raw JSON property paths, fake placeholder IDs, or low-level payload properties.

Validator scope rule: this gate parses canonical Dashboard record-display / dataset-presentation tables only. It must not treat prose, negative guardrails, Form Report explanations, validation command lists, identity tables, or other non-dataset rows as Dashboard dataset regions. App Plans must not need workaround text such as `no dashboard dataset` to avoid false positives.

## Selection Rules

- Choose `collection_control_responsive_card_grid` for browsing records as cards.
- Choose `collection_control_card_with_multiselect_toolbar` when card records need multi-select bulk actions.
- Choose `collection_control_grid_table` for dense operational records without bulk selection.
- Choose `collection_control_grid_table_with_multiselect` for dense operational records with multi-row selection and batch operations. Projects Center / Project Tasks is the export-proven source reference only, not a business-domain restriction.
- Choose `collection_control_grid_table_with_search` when the dense table also requires free-text search/fulltext filtering.
- Choose `Event Pipeline Grid-Table` for the primary high-fidelity Dashboard work queue, pipeline, or portfolio table.
- Do not choose a template just because it is visually attractive. The selected template must match the business signals: card browsing, dense row/column scanning, free-text search, multiselect/bulk operation, or high-fidelity primary operations table.
- If more than one reference seems possible, the App Plan must pick exactly one for that dataset region and state why the other options were not chosen at business level. Do not defer the choice to resource generation.
- Template IDs must be parsed as exact tokens. `collection_control_grid_table_with_multiselect` and `collection_control_grid_table_with_search` are distinct approved templates and must not be counted as also selecting `collection_control_grid_table`.

## Responsive Card Grid Template

`collection_control_responsive_card_grid` is backed by the full export-shaped template artifact at `docs/reference/collection-control-responsive-card-grid.template.json`. The source is Company Overview v1.4, Dashboard page `Collection_control_responsive_card_grid`, component root `collection_control_responsive_card_wrapper`.

Generation must copy `collection_control_responsive_card_wrapper` and all descendants as the component root. It is not enough to create a generic card Collection, ad hoc responsive card grid, or simplified repeated card.

Only these regions are editable:

- `card_col_title_wrapper`
- `op_normal`
- `card_col_item`
- `card_col_item_multi_select`
- `grid_table_col_item_op_menu`

Everything else is locked by default and must strictly preserve the template's existing control settings, style, layout, spacing, and typography. `card_col_body` remains the Collection root and must preserve its responsive layout, pagination, filter/fulltext shape, and action host while remapping source IDs to the target app.

Recommended editable behavior:

- `card_col_title_wrapper` may change the `card_col_title` Text value to a business title derived from the selected Collection data source.
- `op_normal` may add/delete normal-mode controls, but should retain the Search filter and Add item button when the selected Data List or Document Library source supports those actions. Search title/placeholder and Add item button text may be changed, but every button must keep a valid action binding.
- `card_col_item` maps repeated card content to fields from the selected source resource. User fields use `dynamic-user`; image fields use `dynamic-image`; file or attachment fields use `dynamic-file`; all other fields use `dynamic-field`.
- Do not emit `dynamic-image` if the selected data source has no image field.
- `card_col_item` should include one subject-style Dynamic field based on the source `Survey Program name` role and preserve its Large/Semi bold visual role when a title/subject field exists.
- `card_col_item_multi_select` contains `grid_table_col_item_op_menu` for single-record operations such as Edit or Delete. This region may be omitted when no item operations are needed.
- Every `grid_table_col_item_op_menu` operation button must bind to a valid Collection action. Edit/Delete buttons require matching Collection actions. Delete requires the template delete-confirmation temp variable and conditional delete continuation before `setdatalist remove`.
- If the region is display-only, `card_col_caption` and its descendants may be omitted.
- If the source is a Form Report or Data Report, `card_col_caption`, `card_col_item_multi_select`, and item operation controls should not be emitted because report datasets are view-only.

## Base Grid-Table Template

`collection_control_grid_table` is backed by the full export-shaped template artifact at `docs/reference/collection-control-grid-table.template.json`. The source is Projects Center_1 v1.7, Dashboard page `Collection_control_grid_table`, component root `grid_table_col_wrapper`. Projects Center is the export-proven source reference only; the template can be selected for any Dashboard dataset that needs dense row/column scanning without multi-row selection or dedicated fulltext-search specialization.

Generation must copy `grid_table_col_wrapper` and all descendants as the component root. It is not enough to create a generic header grid plus Collection body that merely resembles a table.

Only these regions are editable:

- `grid_table_col_title_wrapper`
- `op_normal`
- `grid_table_col_header`
- `grid_col_item`
- `grid_table_col_item_operations`

Everything else is locked by default and must strictly preserve the template's existing control settings, style, layout, spacing, and typography. `grid_table_col_body` remains the Collection root and must preserve its Collection action host, filter/search host, pagination shape, and runtime binding shape while remapping source IDs to the target app.

Recommended editable behavior:

- `grid_table_col_title_wrapper` may change the `grid_table_col_title` Text value to a business title derived from the selected Collection data source.
- `op_normal` may add/delete controls, but should retain the Search filter and Add item button when the selected Data List or Document Library source supports those actions. Search placeholder and Add item button text may be changed, but every button must keep a valid action binding.
- `grid_table_col_header` maps visible column labels to the selected source resource. `grid_col_item` maps repeated row content to fields from the same source resource.
- User fields use `dynamic-user`; image fields use `dynamic-image`; file or attachment fields use `dynamic-file`; all other fields use `dynamic-field`.
- `grid_table_col_header` and `grid_col_item` must always have the same column count, column widths, and compatible grid properties after business mapping. The actual number of columns and whether a progress control is used depends on business fields; six columns and progress bars are not mandatory.
- Header Text controls inside `grid_table_col_header_title_column` and `grid_table_col_header_column` must describe the corresponding field/content rendered in the matching `grid_col_item` column.
- `grid_table_col_item_operations` is optional and may contain per-item actions such as Edit or Delete through `grid_table_col_item_op_menu`, but every action control must bind to a valid action. Edit/Delete buttons require matching Collection actions. Delete requires the template delete-confirmation temp variable and conditional delete continuation before `setdatalist remove`.
- If the region is display-only, `grid_table_col_caption` and its descendants may be omitted when no title/toolbar/actions are needed.
- If the source is a Form Report or Data Report, `grid_table_col_caption`, `grid_table_col_item_operations`, and operation controls should not be emitted because report datasets are view-only.

## Card Multiselect Toolbar Template

`collection_control_card_with_multiselect_toolbar` is backed by the full export-shaped template artifact at `docs/reference/collection-control-card-with-multiselect-toolbar.template.json`. Generation must copy `card_with_multiselect_toolbar_wrapper` and all descendants as the component root. It is not enough to create a generic card Collection, add checkbox icons, or add a separate toolbar.

Only these regions are editable:

- `card_col_title_wrapper`
- `op_normal`
- `op_multipleselected`
- `card_col_item`
- `card_col_item_operations`

Everything else is locked by default. `card_col_item_multi_select` must remain unchanged, including its checked/unchecked icon controls and selection/action wiring. The Collection root `attrs.actions[]`, selected item/count temp variables, page-level `actions`, `formAction`, `filterVars`, and filter dependencies are part of the template contract and must be copied or intentionally remapped through generator-safe logic.

Recommended editable behavior:

- `op_normal` should retain the Search filter and Add item button unless a validated business rule removes one of them. Search placeholder text and Add button text may be changed.
- `op_multipleselected` should retain a Delete selected items action. `btn_set_items` is optional, and additional batch buttons may be added only when each button has a valid action binding.
- `card_col_item` maps item content to fields from the selected source resource. User fields use `dynamic-user`; image fields use `dynamic-image`; file or attachment fields use `dynamic-file`; all other fields use `dynamic-field`.
- `card_col_item` should include one subject-style Dynamic field based on the source `Survey Program name` control and preserve its Large/Semi bold visual role.
- `card_col_item_operations` is optional and may contain per-item actions such as Edit or Delete, but every action control must bind to a valid action.

## Generation Rules

- Dashboard Page Layouts v1.1 is the page shell. All approved Dashboard Collection presentation references are component-level dataset regions that must be placed inside approved v1.1 business-content slots, normally `section_content_area`.
- Approved Collection and KPI modules are source-of-truth artifacts, not visual suggestions. Generation must materialize them by cloning the approved export-shaped template subtree, then replacing only the allowed business slots. Do not use local helper functions to rebuild a "similar" grid, card, toolbar, KPI row, checkbox cell, or filter from scratch.
- Do not place Collection presentation templates directly under page root, `Main`, root `Content`, `page_title_section`, header/title areas, structural layout wrappers, or a copied source-app page shell.
- Do not copy the source application page shell for any Collection reference. Event Portfolio, Projects Center, Project Tasks, and card-grid source exports are proof sources only; they are not generated page shells for another app.
- Do not copy source-example business fields, labels, data sources, IDs, ListID, LayoutID, PageID, or domain text. Replace them with current-app business fields and generated IDs during resource generation.
- Template selection is only the first step. The generator must adapt every visible Collection title, column header, card subject, item field, toolbar button, batch action, row/card action, filter placeholder, and empty-state text to the current App Plan. Source-template labels such as `All tasks - Multiple select`, `Active Survey Programs`, Event/Survey/Project-specific terms in unrelated apps, or generic labels such as `Grid`, `Container`, `Text`, and `Placeholder` are generated-final blockers.
- Every visible Collection field must map to an App Plan field for that dashboard dataset region. Every visible action must map to an App Plan action or be removed. Destructive multiselect actions are allowed only when the App Plan explicitly declares the action and its safe business scope.
- Generated Dashboard Collection controls must carry or inherit approved template provenance through a clear field such as `datasetPresentationTemplateId`, `datasetPresentationReferenceId`, `derivedFromDatasetPresentationTemplate`, or the approved Golden Reference region identity.
- For App Plan-declared Dashboard dataset regions, the generated Collection root must carry explicit template provenance. Ancestor-only inference is not enough for plan-to-package conformance because it can hide template collapse.
- Generation must dispatch each Dashboard dataset region by the App Plan's selected template ID. Do not route all Dashboard Collections through `Event Pipeline Grid-Table`, generic grid-table, card fallback, or any other single default builder unless that exact template was selected for that exact region.
- Do not create generic repeated cards, fake grid tables, simplified Data table lookalikes, or ad hoc Collection item templates.
- Grid-table references must preserve the approved template wrapper, header `flex_grid`, Collection body, repeated item `flex_grid`, matching columns, mobile item-grid behavior, and valid source list bindings.
- Grid-table-specific validation applies only to grid-table references: `collection_control_grid_table`, `collection_control_grid_table_with_multiselect`, `collection_control_grid_table_with_search`, and `Event Pipeline Grid-Table`. It must not be applied to card references such as `collection_control_card_with_multiselect_toolbar` or `collection_control_responsive_card_grid`.
- Row/card detail open metadata is required only when the selected template or App Plan declares row/card open behavior. If no open behavior is planned, generation must emit explicit no-open metadata instead of leaving unresolved links or placeholder layout IDs.
- Multiselect references must preserve selected state, selected count, checkbox icons, bulk toolbar/actions, `ListDataID`, and `__ctx_coll` current-item context.
- `collection_control_card_with_multiselect_toolbar` must preserve the full `card_with_multiselect_toolbar_wrapper` subtree, all non-editable style/layout/typography properties, page-level dependencies, Collection root actions, and the locked `card_col_item_multi_select` control.
- `collection_control_grid_table_with_multiselect` must preserve the full `grid_table_col_multiselect_wrapper` subtree, all non-editable style/layout/typography properties, page-level dependencies, Collection root actions, the locked `grid_table_col_item_select` control, and matched `grid_table_col_header` / `grid_col_item` column definitions. The wrapper, caption, and content containers must remain full width in all Designer-relevant width layers: `width = "full"`, `attrs.style.widthtype = [null, "1"]`, and `attrs.common.positioning.widthtype = [null, "1"]`.
- `collection_control_grid_table_with_multiselect` locked spacing values must be cloned from the source template and must not be overwritten by normalizers. At minimum, preserve gap settings for `grid_table_col_multiselect_wrapper`, `grid_table_col_caption`, `grid_table_col_content`, `op_normal`, `op_multipleselected`, `selected_items_amount_wrapper`, and `multiple_operations_wrapper`.
- `collection_control_grid_table_with_multiselect` must replace source-domain text such as `All tasks`, `Search tasks`, `Add Task`, `Mark as completed`, `Assignee`, `Completion (%)`, and `Progress bar` with current-app business labels, placeholders, fields, and actions. Keeping Projects/Tasks wording in a non-task app is a generated-final blocker.
- `grid_table_col_item_select` is locked and must keep a valid select/toggle action binding that resolves to a preserved Collection or page action. Static checkbox icons without action wiring do not satisfy the template.
- Search/filter conditions in grid-table multiselect Collections must preserve Designer-compatible filter expression shape when filters are generated: use `op`/`operator = "9"`, `showCus: false`, RHS `valueType: "string"`, prefixed variable `id` such as `__filter_status`, raw variable `name` such as `filter_status`, and matching `filterBindings[]` consumers.
- KPI regions must clone `kpi_cards_kpi_row` and card copies based on `event_portfolio_kpi_planned_events`. Helper-created cards such as `ops_kpi_*`, loose Containers that merely resemble KPI cards, or static cards without approved KPI row provenance are not generated-final eligible. Live KPI cards still require Summary runtime metadata and visible value binding proof from the Summary/KPI gates.
- Multiselect source template artifacts must themselves pass fidelity lint before they can be used for generation. Every Text control in `collection-control-card-with-multiselect-toolbar.template.json` and `collection-control-grid-table-with-multiselect.template.json` must preserve `attrs.heads.ty` and plain-string `attrs.heads.color`; missing typography/color metadata in the reference file is a release blocker, not something for the generator to infer.
- `collection_control_grid_table_with_multiselect` must keep the wrapper gap contract required by grid-table validators: `grid_table_col_multiselect_wrapper.attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`. Its Collection detail-open contract must use `attrs.data.link = "{{DetailLayoutID}}"` in the source artifact, and generation must replace that placeholder with a concrete Type `1` custom detail layout for the selected source list plus `attrs.data.opentype = "slide"` and `attrs.data.modalsize = 2`. `link: "default"`, empty links, or unresolved placeholders are generated-final blockers.
- Search references must preserve `search-filter` or equivalent search control plus Collection `attrs.data.fulltext[]` linkage.
- Event Pipeline Grid-Table must preserve the reference subtree inside Dashboard Page Layouts v1.1 slots and replace Marketing Event fields with app-specific fields. The same slot-only/component-only rule applies to every approved Collection presentation reference.

## Grid-Table Multiselect Template

`collection_control_grid_table_with_multiselect` is backed by the full export-shaped template artifact at `docs/reference/collection-control-grid-table-with-multiselect.template.json`. The source is Projects Center_1 v1.6, Dashboard page `All Tasks - multiple select`, component root `grid_table_col_multiselect_wrapper`. Projects Center / Project Tasks is the export-proven source reference only; the template can be selected for any Dashboard dataset that needs dense table scanning plus multi-row selection and batch operations.

Generation must copy `grid_table_col_multiselect_wrapper` and all descendants as the component root. It is not enough to create a generic grid-table Collection, add a checkbox column, or add a separate toolbar.

Only these regions are editable:

- `grid_table_col_title_wrapper`
- `op_normal`
- `op_multipleselected`
- `grid_table_col_header`
- `grid_col_item`

Everything else is locked by default. `grid_table_col_item_select` must remain unchanged, including its checked/unchecked icon controls and selection/action wiring. The Collection root `attrs.actions[]`, selected item/count temp variables, page-level `actions`, `formAction`, `filterVars`, and filter dependencies are part of the template contract and must be copied or intentionally remapped through generator-safe logic.

Recommended editable behavior:

- `op_normal` should retain the Search filter and Add item button unless a validated business rule removes one of them. Search placeholder text and Add button text may be changed.
- `op_multipleselected` should retain a Delete selected items action. `btn_set_items` is optional, and additional batch buttons may be added only when each button has a valid action binding.
- `grid_table_col_header` maps visible column labels to the selected source resource. `grid_col_item` maps repeated row content to fields from the same source resource.
- User fields use `dynamic-user`; image fields use `dynamic-image`; file or attachment fields use `dynamic-file`; all other fields use `dynamic-field`.
- `grid_table_col_header` and `grid_col_item` must always have the same column count, column widths, and compatible grid properties after business mapping.

## Validation

Run `scripts/validate-dashboard-dataset-presentation-golden-references.mjs` for:

- registry quality
- source template fidelity for card/grid multiselect artifacts, including Text metadata, grid wrapper gap, and grid detail-open placeholder contract
- App Plan selected reference IDs
- generated package Collection template provenance
- generated package Collection structural conformance
- App Plan-to-package region-level template conformance when both `--app-plan` and `--package` are provided
- grid-table multiselect full-width, locked spacing, source-text replacement, row-select action wiring, and Designer-compatible filter condition shape
- KPI wrapper materialization from approved KPI row/card modules instead of helper-created lookalikes

This gate is included in first-generation YAPK preflight and dashboard hard gates. A package that fails this gate is not eligible for signing, install/import, upgrade, runtime proof, or handoff.

When an App Plan is available, generated-final packages must fail if:

- a template selected in the App Plan is not materialized in the generated package (`DASH_DATASET_APP_PLAN_TEMPLATE_NOT_MATERIALIZED`)
- a generated Dashboard Collection region uses a different template than the App Plan selected (`DASH_DATASET_REGION_TEMPLATE_MISMATCH`)
- multiple planned templates collapse to one effective generated template (`DASH_DATASET_TEMPLATE_DIVERSITY_COLLAPSED`)
- a planned Dashboard Collection region has no generated Collection region (`DASH_DATASET_COLLECTION_REGION_MISSING`)
- a matched generated Collection region lacks explicit Collection-root template provenance (`DASH_DATASET_COLLECTION_EXPLICIT_PROVENANCE_MISSING`)
