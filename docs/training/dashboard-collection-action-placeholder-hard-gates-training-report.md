# Dashboard Collection Action Placeholder Hard Gates Training Report

## Summary

This training closes a generated-final Dashboard runtime risk found during the `0.8.47` Office Asset Loan Management regression run. The package passed first-generation preflight, but the decoded `Asset Availability and Utilization Dashboard` still retained source-template placeholders inside a responsive card Collection action:

- `{{DetailLayoutID}}`
- `{{ListSetID}}`
- `{{ListID}}`

The failure proved that Collection template clone-and-map must include action contracts and nested action-step payloads, not only visible controls and Collection `attrs.data` surfaces.

## Classification

- Generator issue: approved Collection templates were cloned, but nested action payloads were not fully rewritten or pruned.
- Validator gap: Dashboard dataset and aggregate Dashboard hard gates did not scan decoded Dashboard resources for unresolved `{{...}}` tokens after materialization.
- Proof boundary: this is local generated-final validation hardening only. No package signing, install/import, upgrade, Version Management, live seed data, or browser/runtime proof is claimed by this training.

## Shipped Rules

- Source-template placeholders may exist in stored reference templates only.
- Generated-final Dashboard resources must not contain `{{...}}` tokens anywhere in Collection data, actions, action steps, button bindings, page-level dependencies, list references, filter/search values, or open/edit/detail layout references.
- Known placeholders such as `{{ListSetID}}`, `{{ListID}}`, `{{DetailLayoutID}}`, `{{sourceLongId}}`, and helper placeholders such as `{{search}}` are generated-final blockers.
- If a Collection edit/open action requires a detail layout and no concrete Type `1` layout exists for the selected source list, generation must remove the action and any button pointing to it.
- Search/filter runtime values must be expression-token bindings, not `{{search}}` string placeholders.

## Implementation

- `scripts/materialize-full-app-generated-final.mjs`
  - Passes the root ListSet ID into Dashboard Collection template materialization.
  - Rewrites Collection template placeholders to target app/list/layout IDs.
  - Replaces search/fulltext helper placeholders with expression-token filter bindings.
  - Prunes edit/open actions and linked action buttons when no concrete detail layout exists.
  - Rewrites page-level Collection template dependencies before attaching them to the generated Dashboard resource.

- `scripts/validate-dashboard-dataset-presentation-golden-references.mjs`
  - Adds generated-package scanning for unresolved `{{...}}` tokens and `[object Object]` placeholder residue across parsed Dashboard resources.
  - Emits `DASH_DATASET_COLLECTION_TEMPLATE_PLACEHOLDER_UNRESOLVED` before signing eligibility.

- `scripts/test-dashboard-dataset-presentation-golden-references.mjs`
  - Adds a failing responsive-card Collection package fixture with action-step placeholders.

- `scripts/test-full-app-materialization-entrypoint-gates.mjs`
  - Adds a nontrivial materializer assertion that generated-final decoded resources contain no Collection template action/reference placeholders.

- `docs/standards/dashboard-dataset-presentation-golden-reference-standard.md`
  - Documents the generated-final placeholder boundary and action pruning rule for all approved Dashboard Collection templates.

## Validation

Focused validation passed:

- `node --check scripts/materialize-full-app-generated-final.mjs`
- `node --check scripts/validate-dashboard-dataset-presentation-golden-references.mjs`
- `node scripts/test-dashboard-dataset-presentation-golden-references.mjs`
- `node scripts/test-full-app-materialization-entrypoint-gates.mjs`

Broader release validation must run before a release bump.
