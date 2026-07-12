# Dashboard Page Layouts v1.1 Standard

## Purpose

Dashboard Page Layouts v1.1 is the canonical page-level Dashboard template for newly generated Yeeflow Dashboard pages. Generators must copy and normalize the export-shaped template shell first, then remove, duplicate, or adapt sections according to business requirements.

This page shell is separate from component golden references. The Event Portfolio Dashboard Golden Reference remains the component/region reference for KPI cards, filter groups, grid-table Collections, and visual dashboard patterns. Component references may be placed inside approved v1.1 business-content containers and `section_content_area` regions, but they must not replace or compete with the v1.1 page skeleton.

`dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, and `dashboard-page-layouts-three-panel-workspace` are approved alternate page-level Dashboard templates. They must be explicitly selected in the App Plan when used. Workbench follows its own registered shell and cleanup rules in `docs/standards/dashboard-page-layouts-workbench-standard.md`; the two master-detail workspace templates follow `docs/standards/dashboard-page-layouts-master-detail-workspace-standard.md`. The default template remains `dashboard-page-layouts-v1.1`.

## Registry

The canonical registry is:

`docs/reference/dashboard-page-layout-templates.json`

The default template id and version are:

`dashboard-page-layouts-v1.1`

The registered source is:

`dashboard-page-layouts-v1.1-template-complete-structure.json`

## Required Page Shell

Every generated Dashboard page must preserve:

- parseable Yeeflow page export JSON
- `attrs.hideHeaderAll = true`
- root page background `#f4f7fb`
- root page container padding set to zero
- `main > content`
- `main` as Full width column layout
- `content` as Full width column layout
- no conflicting `content` background that breaks full-page background continuity
- `content` container padding preserved from the canonical v1.1 template
- selected non-empty business section containers only

Generation must instantiate this full page shell before placing dataset presentation components. A dashboard that only materializes a selected Collection component, KPI component, or filter component without the v1.1 shell is incomplete even when the component-level template itself is valid.

## Standard Sections

Supported section patterns:

- page title/header section
- 1-column content card
- 2-column section
- 3-column section
- 60/40 2-column section
- KPI metrics wrapper

Each business section card must preserve:

- `content_card_wrapper`
- `section_title_area`
- `section_content_area`

Required structural containers must use Full width:

- `main`
- `content`
- `page_title_section`
- `page_title_header`
- `content_card_wrapper`
- `section_title_area`
- `section_content_area`
- `kpi_metrics_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`

Required Full width shape:

```json
"attrs": {
  "style": {
    "widthtype": [null, "1"]
  }
}
```

## Section Selection

Do not mechanically keep every template section.

Use 1-column sections for wide, dense, table-like, long-label, or grid/table content.

Use 2-column or 3-column sections for short comparable cards with similar density.

Use 60/40 sections when one side is primary and the other side is supporting context, summary, notes, actions, or status.

Omit optional `Operations` containers unless real actions exist.

## Controlled Business Slots And Repeatable Modules

Generated Dashboard pages must preserve the v1.1 template shell and non-business layout containers as structural equivalents of the registered template. Business-specific text, bindings, filters, KPI values, FontAwesome icons, actions, and Collection/table fields may change only inside approved business-content containers.

Generator normalization is allowed for page-shell compatibility: `Main` / `Content` labels may be normalized, root/page background may be refreshed to the required `#f4f7fb`, root page padding may be normalized to zero, Full width may use the supported v1.1 export-coded shape, `actions: []` may be emitted or omitted when no actions exist, and meaningful navigator/control names may replace generic `Container` / `Grid` labels. Content container padding must not be normalized to zero; preserve the canonical v1.1 template padding so the page shell spacing remains stable. These normalizations must not be used to invent layout modules, move business controls outside approved slots, or remove required v1.1 structure.

Summary/KPI hidden source controls are business controls even when visually hidden. A generated Dashboard must not append a new `*_kpi_data_host` or any Summary host directly under root `Content`, `content_panel`, or another structural page-shell container. Place the dedicated hidden Summary host inside an approved KPI business slot such as `event_portfolio_kpi_planned_events`, `event_portfolio_kpi_approved_budget`, `event_portfolio_kpi_registration_rate`, `event_portfolio_kpi_lead_follow_up`, or `kpi_card_wrapper`, and preserve the hidden host runtime contract. If no approved KPI slot is planned/materialized, do not invent a host module.

User/person fields must render with `dynamic-user`, but the detector must be field-metadata aware. Do not classify ordinary identifier fields such as `Employee Number`, `Employee ID`, `Employee Code`, `Department Code`, or staffing targets as user fields merely because their display label contains "Employee" or "Department".

Allowed business-content containers:

- `event_portfolio_pipeline_title_group`
- `Operations`
- `section_content_area`
- `section_title_header`
- `event_portfolio_kpi_planned_events`
- `event_portfolio_kpi_approved_budget`
- `event_portfolio_kpi_registration_rate`
- `event_portfolio_kpi_lead_follow_up`

Allowed repeatable/removable template modules:

- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `kpi_cards_kpi_row`
- `event_portfolio_kpi_planned_events`

Unneeded repeatable modules may be removed. New layout modules may only be added by copying one of the allowed repeatable/removable template modules. Copied modules must preserve template structure, hierarchy, control types, width, padding, direction, gap, background, and required children.

Every `section_content_area` copied from a Dashboard Page Layouts golden reference must preserve `attrs.style.gap = [null, "--sp--s200"]`. The older `--sp--s0` gap is not valid for generated Dashboard pages or updated template sources.

The selected repeatable modules may be reordered to match business priority. For example, `kpi_metrics_wrapper` is usually near the top of an operational Dashboard, but `2_columns_section`, `3_columns_section`, `2_columns_60/40_section`, and `content_card_wrapper` may appear before or after it when the Functional Specification/App Plan makes that order more useful. Reordering is allowed only for approved repeatable modules; it must not create new structural container shapes.

Do not invent new dashboard layout modules. Non-business template containers must remain structurally equivalent to the template. KPI cards may be added only by copying one of the approved KPI card variants: `event_portfolio_kpi_planned_events`, `event_portfolio_kpi_approved_budget`, `event_portfolio_kpi_registration_rate`, or `event_portfolio_kpi_lead_follow_up`, then replacing the allowed KPI business content.

KPI card generation is demand-driven. If the Functional Specification/App Plan does not require KPI or Summary Metric cards for a Dashboard, do not include `kpi_metrics_wrapper` or any Event Portfolio KPI card containers. If one, two, or three KPI cards are required, include exactly that many KPI cards and remove the unused source-template KPI cards. Do not keep all four KPI card source containers simply because the template contains four examples.

Business controls such as Collections, Data Filters, KPI values, action buttons, Data Analytics templates, and data-bound display controls must not be placed directly under root `Content`. They must be inside approved v1.1 slots, normally a `section_content_area` that belongs to `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`, inside a copied `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`, or inside registered KPI/action slots.

Data Analytics golden reference templates from `docs/reference/data-analytics-golden-references.json` are component-level analytics regions, not page shells. Any approved Data Analytics template (`data_analytics_pie_chart_with_title`, `data_analytics_column_chart_with_title`, `data_analytics_bar_chart_with_title`, `data_analytics_line_chart_with_title`, `data_analytics_area_chart_with_title`, or `data_analytics_pivot_table_standard`) may be placed in `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`. The generator must clone the full approved template subtree, preserve locked style/layout/typography properties, and map only the approved title/data-binding editable regions.

Dashboard Collection presentation templates from `docs/reference/dashboard-dataset-presentation-golden-references.json` are component-level dataset regions, not page shells. Any approved Collection template (`collection_control_responsive_card_grid`, `collection_control_card_with_multiselect_toolbar`, `collection_control_grid_table`, `collection_control_grid_table_with_multiselect`, or `Event Pipeline Grid-Table`) must be inserted into an approved business-content slot: the `section_content_area` inside `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`. Search/fulltext behavior may be mapped inside an approved template's editable filter/toolbar region, but `collection_control_grid_table_with_search` is retired and must not be selected as a template ID. Do not copy the source app's root shell, page header, root `Content`, structural layout wrappers, source business fields, source IDs, or source labels.

Dashboard filter modules follow the same component rule. When a Dashboard filter is planned, copy an approved v1.1/Event Portfolio filter module into an approved business-content slot such as `section_content_area`, then map it to the app-specific data source and field. Do not create an ad hoc filter container, copy `event_portfolio_filter_group` directly under root `Content`, or invent a new layout module for filters.

When a generated Dashboard page contains two or more page-level Data Filter controls, the filters must be grouped inside `dashboard_standard_filter_group` from `docs/reference/data-filter-standard-filter-group.template.json`. The group may be placed only inside an approved v1.1 business-content slot such as `section_content_area`; do not scatter multiple filters as loose siblings.

Generated Dashboard pages must never retain empty copied layout modules. If any `section_content_area` would contain no real business controls, remove that empty slot or the owning copied module before generated-final validation. Remove `content_card_wrapper`, `2_columns_section`, `3_columns_section`, `2_columns_60/40_section`, and `kpi_metrics_wrapper` when they have no real business content. Empty sections may exist only in the registered template source, never in generated-final package resources.

Every generated Dashboard filter must preserve the reference UI contract and receive app-specific data binding:

- `attrs.data.list` resolves to an included app list
- `attrs.data.field` resolves to the planned filter field on that list
- `attrs.data.filter[]` is present and export-shaped
- `display_f` and `value_f` are present
- label and placeholder remain separate
- `attrs.lab.ty = [null, "xs-light"]`
- `attrs.lablay = [null, "top"]`; scalar `"top"` is invalid
- `attrs.edit.placeholder.color` and `attrs.edit.pcolor` are present
- `attrs.edit.normal.border.radius` uses a supported Yeeflow radius shape
- `attrs.common.positioning.widthtype` preserves the custom-width tuple beginning with `[null, "3"]`
- `attrs.common.positioning.width = [null, 200]`
- the relevant Collection/table/KPI consumer references the filter field, variable, display field, or value field

Filter module synthesis is a generation-stage responsibility. Functional Specification and App Plan documents may describe business filter needs and selected Yeeflow filter/control categories, but they must not carry runtime IDs, copied control JSON, or low-level style/property payloads.

Golden Reference component regions inside v1.1 slots must preserve child-control property fidelity. Page titles, subtitles, section titles/subtitles, KPI labels/values/trends/notes, filter labels, and grid-table column headers keep their role-specific typography tokens from the approved reference. The generator may replace business text and data bindings, but it must not normalize all headings to a generic token such as `h5-medium`.

`page_title_section` is reserved for page title/header content. It must not contain Collection, Data table, Summary, chart, KPI-card, record-list, or other business/data controls. Put those controls in `section_content_area`, KPI card slots, or approved action slots.

## Actions

`Operations` containers may exist only when they contain real configured Yeeflow action controls. Placeholder operation chips, visual-only buttons, and action-looking containers without action configuration are forbidden.

If no real actions exist, omit the `Operations` container.

## Generated Section Cleanup

Generated Dashboard pages must not keep empty copied business sections. If a `section_content_area` would have no generated business content, remove the entire unused copied module that owns it instead of leaving a title-only card or an empty content area. This applies to `content_card_wrapper`, `content_card_60_wrapper`, `content_card_40_wrapper`, `2_columns_section`, `3_columns_section`, and `2_columns_60/40_section`.

An empty `section_content_area` is never acceptable in a generated Dashboard resource. It is allowed in the registry/template source only as a copy source before business section selection. Generated-final validation must fail when a Dashboard page keeps an empty section content area, a copied title-only business card, or a copied repeatable section with no Collection, Data Analytics, KPI/Summary, filter group, field display, or configured action content.

## Business Mapping

Generated Dashboard pages must replace template business content with the current app domain:

- page title and subtitle
- section titles and subtitles
- KPI labels, values, bindings, notes, and trends
- filter labels and bindings
- Collection data source and visible fields
- Dynamic field and Dynamic user controls
- actions, if real actions exist

Unrelated template terms such as generic placeholders, Marketing Event labels, campaign language, registration language, or budget/event language must not remain in unrelated applications.

## Data Controls

Data Filters must bind to valid variables, fields, and legal operators.

Data Filters must also be consumed. Each generated filter must have at least one downstream Collection/table/KPI consumer that references the selected field or filter token. Bare scalar operator/value placeholders such as `0` are invalid in generated-final packages because they do not prove a legal runtime filter condition.

Collection grid/table controls must point to real app lists and fields.

Each primary grid-table Collection must live in its own independent `content_card_wrapper` or approved grid-table wrapper copied from the template/reference. Multiple unrelated grid-table Collections in one wrapper are not considered a valid v1.1 dashboard section because runtime layout and filtering become ambiguous.

Card-style Collection templates such as `collection_control_card_with_multiselect_toolbar` are valid dataset components, but they are not grid-table components. Grid-table-specific gates must not require card templates to have grid header/item grids, grid-table detail links, or table column parity. Card templates are validated through the dataset-presentation template gate and their own export-shaped subtree contract.

User and identity fields must render with Dynamic user controls, not generic Dynamic field controls.

Summary, chart, pivot, and other model controls may be used only when their runtime model contract is export-proven. If runtime proof is unavailable, use safer visible KPI/card/table patterns.

Visible KPI cards that claim live metrics must use Summary-backed values. Required package proof includes Summary controls, `ReportIds`, `tempVars`, `exts`, `attrs.save_var`, and visible KPI text bound to the same saved variable. Static KPI text is allowed only when explicitly labeled as static/fallback and must not be claimed as a live KPI.

Data Filter static package validation and runtime filter linkage proof remain separate. Runtime proof must show before/after table or KPI data changes.

When an approved App Plan declares Dashboard Summary/KPI metrics or filters, generation must materialize those declarations as real controls in the v1.1 shell. A generated Dashboard that contains only a Collection template, or only component provenance, fails even if the Collection template itself is valid. Planned metrics require Summary/KPI controls with source list, aggregate field/function, `exts`, `ReportIds`, `tempVars`, `save_var`, and visible bound KPI text. Planned filters require Data Filter/search/select/radio controls with source field, variable, display/value mapping, visual label/placeholder metadata, and at least one downstream Collection/table/KPI consumer.

Every generated Dashboard page is a single dependency scope. When cloning approved component templates into the selected page layout, rename template-owned `filterVars`, `tempVars`, `actions`, and `formAction` entries with a page/region namespace before merging them into the Dashboard resource, and rewrite all in-template `__filter_...`, `__temp_...`, and action references. Multiple Data Filter/Search controls on one Dashboard must not produce the same filter variable unless they are intentionally the same control instance.

Within one Dashboard page resource, `filterVars[]` and `tempVars[]` share one variable-id namespace. IDs must be unique after removing `__filter_` / `__temp_`, lowercasing, and removing spaces and punctuation. Duplicate or canonically equivalent IDs within either array or across both arrays must fail with `PAGE_SCOPE_VARIABLE_ID_DUPLICATE` before export or signing.

Search filter placeholder values are runtime input text, not style objects. Generated `search-filter.attrs.placeholder` must be a primitive string such as `"Search Vendor Requests"`. Object-shaped values such as `{ "value": "Search Vendor Requests" }` are forbidden because Yeeflow runtime renders them as `[object Object]`. Keep placeholder color/style metadata in supported edit/style properties instead of the runtime placeholder text field.

## Runtime Route

Runtime proof must use:

```text
https://codex.yeeflow.com/#/list-set/41/{ListSetID}/{LayoutID}
```

Do not use guessed `/p/{LayoutID}` routes.

Runtime proof fails if the page opens with Access Denied, model-load errors, chart configuration errors, or placeholder-only dashboard content.

## Package Root Binding

When copying Dashboard pages from a baseline, export, golden reference, or generated staging package into a final `.yapk`, every Type `103` page record must be rebound to the target app root:

- `decoded.Pages[].ListID` must equal `decoded.ListSet.ListID`.
- `decoded.Pages[].LayoutID` remains the unique Dashboard layout resource ID.
- `decoded.Pages[].LayoutInResources[]` must include the page `LayoutID` resource.
- Navigation Type `103` items may use `ListID`/`LayoutID` as the page `LayoutID`, but the `Pages[]` record itself must stay rooted to the app.

Do not keep a source/baseline Dashboard page `ListID` after ID remap. A package with copied Dashboard resources and mismatched `Pages[].ListID` can pass shell checks yet fail to surface Dashboard pages in the installed app.

## Dashboard-Only Upgrade Scope

When regenerating Dashboard pages for an existing app:

- only Dashboard page resources may change unless explicitly requested
- preserve data lists, fields, forms, workflows, reports, navigation, icon, permissions, and app metadata
- preserve existing Dashboard `LayoutID` values
- validate dashboard-only scope before signing readiness

## Required Gates

Run:

```bash
node scripts/validate-dashboard-page-layout-template.mjs --registry docs/reference/dashboard-page-layout-templates.json
```

Generated packages must also pass:

```bash
node scripts/validate-dashboard-generation-hard-gates.mjs --package <app.yapk>
```

The dashboard generation hard gate invokes Dashboard Page Layouts v1.1 validation together with Event Portfolio Golden Reference conformance. When a resource declares or matches Dashboard Page Layouts v1.1, validators treat v1.1 as the page shell and Event Portfolio as component/region content inside approved v1.1 slots. Event Portfolio root depth/order is not required at the page root, but a copied Event Portfolio root shell under v1.1 `Content`, invented modules, and business controls directly under root `Content` are hard failures.
