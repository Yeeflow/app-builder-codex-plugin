# Full-Page Design Blueprint Generation Standard

Full-application Yeeflow generation is a staged evidence workflow. A visually polished canonical image is not enough: the generated Yeeflow controls, decoded resources, bindings, interactions, and runtime proof must trace back to a complete design and blueprint contract.

## Mandatory Stage Order

1. Functional spec.
2. App plan.
3. Page Function Plan as the business/page-function contract.
4. Dashboard Golden Reference selection, using `event_portfolio_dashboard_golden_reference` as the default Dashboard construction style when appropriate.
5. Application Design System.
6. Full-page canonical design images.
7. Page implementation blueprint.
8. Yeeflow control/property contract validation.
9. Resource generation.
10. Decoded resource parity validation.
11. Local hard gates.
12. Package/sign/upgrade only after explicit write approval.
13. Runtime/browser proof only after Chrome/runtime evidence exists.

Do not start a later stage when the prior stage lacks completion evidence. Schema validation, signing, install, upgrade, decoded CSS, decoded controls, or ID stability do not prove UI fidelity or runtime behavior. Runtime proof cannot claim success until Chrome/runtime evidence exists.

## Canonical Page Design Images

Each page must have one canonical PNG at `assets/generated-ui/<app-slug>/NN-<page-slug>.design.png`. The canonical page image must be a full-page implementation artifact, not a first-viewport mockup. It must show all planned sections, major controls, tables, forms, cards, filters, actions, lower-page regions, and page end. A viewport-only screenshot or cropped top-page mockup fails unless the page truly has no below-fold content.

SVG files and combined design boards may support review, but they cannot replace the canonical per-page PNG. The design manifest must map page order, page title, page slug, canonical PNG path, optional source file, selected Yeeflow layout/chrome, and expected viewport.

## Page Implementation Blueprint

Before generating Yeeflow resources, every page requires a blueprint with:

- page purpose and selected Yeeflow layout/chrome
- selected Dashboard Golden Reference and per-section reference trace when the page is a Dashboard
- full section list
- design-to-control mapping for every visible element
- control hierarchy, control type, `id`, `nv_label`, and parent/child relationships
- exact Yeeflow property paths for width, height, gap, margin, padding, border, background, shadow, and typography
- data source/list/field bindings
- Summary/KPI aggregation bindings
- Data Filter variables and target consumption
- Collection/table columns and row detail links
- Dynamic user/person, progress/status/badge, and action metadata
- runtime proof plan

Default Dashboard pages should use `event_portfolio_dashboard_golden_reference` unless the page function clearly requires another plugin-contained pattern. The blueprint must trace the page shell, header area, filter area, KPI area, main content section, and grid-table Collection region to the selected golden reference IDs where applicable, and must adapt fields/actions/labels to the current App Plan instead of copying Marketing Event-specific source fields.

Every property path must be validated against `docs/reference/yeeflow-control-configurations.normalized.json` or `docs/reference/yeeflow-control-property-extensions.json`. Container `attrs.style` rules and non-Container `attrs.common` rules remain separate.

## Resource Parity

After generation, inspect decoded JSON and compare it to the blueprint. All sections and mapped controls must exist, hierarchy and types must match, `nv_label` values must remain semantic, required properties and bindings must exist, action metadata must be present, visible text must not show raw variables, and collection/detail/form links must resolve.

Run:

```bash
node scripts/inspect-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/inspect-page-implementation-blueprint.mjs --blueprint page-implementation-blueprint.json
node scripts/compare-blueprint-to-decoded-resource.mjs --blueprint page-implementation-blueprint.json --resource decoded-resource.json
```

These checks are local and synthetic/redacted-safe. They do not claim pixel-perfect comparison, runtime UI success, signing success, or live Yeeflow runtime proof.
