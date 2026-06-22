# Dashboard Page Layouts v1.1 Standard

## Purpose

Dashboard Page Layouts v1.1 is the canonical page-level Dashboard template for newly generated Yeeflow Dashboard pages. Generators must copy and normalize the export-shaped template shell first, then remove, duplicate, or adapt sections according to business requirements.

This page shell is separate from component golden references. The Event Portfolio Dashboard Golden Reference remains the component/region reference for KPI cards, filter groups, grid-table Collections, and visual dashboard patterns. Component references may be placed inside v1.1 `section_content_area` regions, but they must not break the v1.1 page skeleton.

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
- selected non-empty business section containers only

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

Do not invent new dashboard layout modules. Non-business template containers must remain structurally equivalent to the template. KPI cards may be added only by copying `event_portfolio_kpi_planned_events` and replacing the allowed KPI business content.

## Actions

`Operations` containers may exist only when they contain real configured Yeeflow action controls. Placeholder operation chips, visual-only buttons, and action-looking containers without action configuration are forbidden.

If no real actions exist, omit the `Operations` container.

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

Collection grid/table controls must point to real app lists and fields.

User and identity fields must render with Dynamic user controls, not generic Dynamic field controls.

Summary, chart, pivot, and other model controls may be used only when their runtime model contract is export-proven. If runtime proof is unavailable, use safer visible KPI/card/table patterns.

Data Filter static package validation and runtime filter linkage proof remain separate. Runtime proof must show before/after table or KPI data changes.

## Runtime Route

Runtime proof must use:

```text
https://codex.yeeflow.com/#/list-set/41/{ListSetID}/{LayoutID}
```

Do not use guessed `/p/{LayoutID}` routes.

Runtime proof fails if the page opens with Access Denied, model-load errors, chart configuration errors, or placeholder-only dashboard content.

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

The dashboard generation hard gate invokes Dashboard Page Layouts v1.1 validation together with Event Portfolio Golden Reference conformance.
