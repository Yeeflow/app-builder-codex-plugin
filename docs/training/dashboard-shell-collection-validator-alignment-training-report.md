# Dashboard Shell And Collection Validator Alignment Training Report

## Scope

This training aligns generated-final Dashboard validation after the 0.8.22 multiselect template verification run.

The run proved that:

- `collection_control_grid_table_with_multiselect` can materialize as the selected dense multiselect table template.
- `collection_control_card_with_multiselect_toolbar` can materialize as the selected card multiselect toolbar template.
- The App Plan can select multiple Collection templates without template diversity collapse.

The same run also exposed validator/generation gaps that must block or route correctly before signing:

- Dashboard pages must include the full Dashboard Page Layouts v1.1 page shell, not only a materialized dataset component.
- Grid-table-specific validation must not be applied to card multiselect Collection templates.
- Row/card open metadata is required only when open behavior is planned; otherwise explicit no-open metadata is acceptable.
- Generated-final resource completeness must parse the current unified App Plan schema, including `Page name:` lines and Dashboard planning tables.

## Implemented Changes

- `scripts/validate-dashboard-grid-table-collections.mjs`
  - Routes grid-table templates and card templates separately.
  - Applies grid header/item/detail-link checks only to grid-table references.
  - Allows explicit no-open metadata when no row/card detail behavior is planned.
  - Fails card templates only when a run explicitly requires grid-table Collections.

- `scripts/test-dashboard-grid-table-collections.mjs`
  - Adds regression coverage for explicit no-open grid-table Collections.
  - Adds regression coverage proving card multiselect Collections are not judged by grid-table header/item rules.
  - Keeps an explicit failure case when grid-table-only mode receives a card template.

- `scripts/validate-generated-final-resource-completeness.mjs`
  - Parses current unified App Plan Dashboard declarations from `Page name:` lines and `Dashboard Page Name` tables.
  - Parses Dashboard Filters, Summary Metrics, and Record Display Control Selection rows scoped to the planned dashboard.
  - Keeps fail-closed behavior for resource-like plans that cannot be parsed.

- `scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs`
  - Adds a pass regression for the current App Plan schema, with data list, dashboard page, filter, metric, record-display control, and a package containing corresponding controls.

## Generation Guidance

Dashboard generation must instantiate the Dashboard Page Layouts v1.1 shell first. Dataset presentation templates are component-level regions inserted into approved v1.1 slots such as `section_content_area`.

Collection template validation must dispatch by the selected template ID:

- Grid-table family:
  - `collection_control_grid_table`
  - `collection_control_grid_table_with_multiselect`
  - `collection_control_grid_table_with_search`
  - `Event Pipeline Grid-Table`

- Card family:
  - `collection_control_responsive_card_grid`
  - `collection_control_card_with_multiselect_toolbar`

Do not route every Collection through Event Pipeline or generic grid-table logic. Do not require grid header/item grids for card templates.

## Regression Proof

Focused validation:

- `node scripts/test-dashboard-grid-table-collections.mjs`
- `node scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs`

Aggregate validation remains required before release:

- dashboard page layout template gates
- dashboard golden-reference/export-shape gates
- generated-final materialization/completeness gates
- YAPK schema/package/cache gates
- aggregate UI hard gates

## Safety

This training does not change plugin version metadata, `stable`, release docs, tags, plugin archives, live Yeeflow APIs, signing, install/import, or upgrade behavior.
