# Dashboard Dataset Presentation Golden Reference Standard

Dashboard pages often need to present Data List, Form Report, Document Library, or workflow/report datasets. When a Dashboard dataset region uses a `collection` control, generation must choose one approved dataset presentation reference from `docs/reference/dashboard-dataset-presentation-golden-references.json`.

This standard keeps business planning separate from low-level Yeeflow payload generation:

- Functional Specification describes the business dataset need: users, records, fields, filters, search, sorting/grouping, batch operations, actions, mobile support, and runtime proof needs.
- App Plan maps each Dashboard dataset region to one approved presentation reference ID and explains why.
- Resource generation copies/adapts the selected export-proven template and binds it to real app resources.
- Validators reject simplified, invented, or partially recreated Collection layouts before signing.

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

## Selection Rules

- Choose `collection_control_responsive_card_grid` for browsing records as cards.
- Choose `collection_control_card_with_multiselect_toolbar` when card records need multi-select bulk actions.
- Choose `collection_control_grid_table` for dense operational records without bulk selection.
- Choose `collection_control_grid_table_with_multiselect` for dense operational records with multi-row selection and batch operations. Projects Center / Project Tasks is the export-proven source reference only, not a business-domain restriction.
- Choose `collection_control_grid_table_with_search` when the dense table also requires free-text search/fulltext filtering.
- Choose `Event Pipeline Grid-Table` for the primary high-fidelity Dashboard work queue, pipeline, or portfolio table.

## Generation Rules

- Generated Dashboard Collection controls must carry or inherit approved template provenance through a clear field such as `datasetPresentationTemplateId`, `datasetPresentationReferenceId`, `derivedFromDatasetPresentationTemplate`, or the approved Golden Reference region identity.
- Do not create generic repeated cards, fake grid tables, simplified Data table lookalikes, or ad hoc Collection item templates.
- Grid-table references must preserve header `flex_grid`, Collection body, repeated item `flex_grid`, matching columns, mobile item-grid behavior, and valid source list bindings.
- Multiselect references must preserve selected state, selected count, checkbox icons, bulk toolbar/actions, `ListDataID`, and `__ctx_coll` current-item context.
- Search references must preserve `search-filter` or equivalent search control plus Collection `attrs.data.fulltext[]` linkage.
- Event Pipeline Grid-Table must preserve the reference subtree inside Dashboard Page Layouts v1.1 slots and replace Marketing Event fields with app-specific fields.

## Validation

Run `scripts/validate-dashboard-dataset-presentation-golden-references.mjs` for:

- registry quality
- App Plan selected reference IDs
- generated package Collection template provenance
- generated package Collection structural conformance

This gate is included in first-generation YAPK preflight and dashboard hard gates. A package that fails this gate is not eligible for signing, install/import, upgrade, runtime proof, or handoff.
