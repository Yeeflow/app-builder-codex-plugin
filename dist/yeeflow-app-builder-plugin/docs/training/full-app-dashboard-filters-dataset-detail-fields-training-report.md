# Full-App Dashboard Filters, Dataset Regions, Detail Layouts, and Business Fields Training Report

## Scope

This training responds to the clean-room `0.8.38` Office Asset Loan Management verification where the standalone full-app materializer made visible progress but still failed generated-final preflight at Dashboard and resource-depth gates.

The training focuses on generated-final materialization behavior, not planning-template wording. It keeps signing, install/import, upgrade, seed data, Version Management proof, and browser/runtime proof outside this change.

## Problems Covered

- Planned Dashboard select filters were not materialized; generated dashboards only carried search filters.
- Dashboard dataset-region conformance could miss generated regions because App Plan tables without a `Dashboard Page` column did not inherit the surrounding Dashboard heading.
- App Plan proof text that mentioned internal template wrapper IDs, such as `collection_control_responsive_card_wrapper`, could be misclassified as an unknown selected template.
- Grid-table Collection wrappers still missed the parent-container `attrs.container.gap = 0` / `attrs.style.gap = [null, 0]` contract.
- Collection row detail links could remain as `{{DetailLayoutID}}`, `default`, or another unresolved value instead of a concrete Type `1` layout on the source list.
- Generated data lists were too shallow and could contain only `Title` even when the App Plan declared business fields.
- Custom data-list forms could be attached to the wrong generated list instead of the App Plan host list.
- Choice fields needed runtime-visible `Rules.choices` / `Rules.color_choices` rather than legacy option paths.
- Multiselect Collection filter bindings needed Designer-recognized condition shape and consumable binding names.

## Changes

- The standalone materializer now parses App Plan Data List fields, Custom Data List Forms, Dashboard Filters, and Dashboard Record Display Control Selection.
- Generated data lists now include planned business fields with YAPK-canonical storage names by `FieldIndex` while preserving business display names.
- Choice-like fields now emit runtime-visible `Rules.choices` and aligned `Rules.color_choices`.
- Generated custom forms are assigned to the App Plan host list and become concrete Type `1` detail layouts for same-list Collection row open behavior.
- Generated Dashboard filters are materialized as real `select-filter` controls with label layout, typography, placeholder, placeholder color, radius, fixed-width positioning, source list/field metadata, and Collection consumer linkage.
- Generated Dashboard filters are placed inside approved Dashboard Page Layouts v1.1 business-content slots.
- Generated Collection templates now replace detail-layout placeholders with concrete source-list Type `1` layout IDs.
- Grid-table Collection template materialization now enforces wrapper gap on the Collection parent container.
- The Dashboard dataset-presentation validator now inherits the current Dashboard heading when App Plan dataset tables omit a Dashboard Page column.
- The Dashboard dataset-presentation validator now treats known internal template structure IDs as internal references, not selected template IDs.

## Regression Proof

Focused plugin tests passed:

- `node scripts/test-full-app-materialization-entrypoint-gates.mjs`
- `node scripts/test-dashboard-dataset-presentation-golden-references.mjs`
- `node scripts/test-dashboard-grid-table-collections.mjs`
- `node scripts/test-dashboard-generation-hard-gates.mjs`
- `node scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs`
- `node scripts/test-generated-final-resource-completeness-gates.mjs`

An additional local regression used the same Office Asset planning artifacts from the `0.8.38` verification and a fixture API-issued ID manifest. The regenerated package passed first-generation preflight locally:

- canonical schema: pass
- application FontAwesome icon: pass
- decoded app package runtime: pass
- data-list system schema: pass, with sample-row warnings only
- API-issued content ID provenance: pass
- navigation runtime metadata: pass
- generated YAPK export-shape materialization: pass
- dashboard grid-table collections: pass
- dashboard dataset-presentation golden references: pass
- data analytics golden references: pass
- dashboard generation hard gates: pass
- dashboard golden-reference conformance: pass
- generated-final resource completeness: pass
- package workspace-selection readiness: pass

## Safety Boundary

No signing, verifysign, install/import, upgrade, Version Management proof, seed data write, browser/runtime proof, stable movement, tag, release, or plugin archive was performed by this training change.
