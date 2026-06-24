# Full-App Dashboard v1.1 Collection Template Materialization Training Report

## Purpose

This training closes the validation gap found in the 0.8.36 clean-room reverification of Office Asset Loan Management. The generated-final package had improved core package wiring, ID provenance, navigation runtime metadata, export shape, FontAwesome icon handling, and resource completeness, but it still failed before signing because Dashboard pages were minimal hand-built structures instead of full Dashboard Page Layouts v1.1 pages with App Plan-selected Collection templates.

## Root Cause

The standalone full-app materializer generated Dashboard resources by assembling a small heading, Summary, filter, and simplified Collection control. That bypassed the registered Dashboard Page Layouts v1.1 shell and did not clone the export-shaped Collection templates selected in the App Plan. As a result, generated dashboards carried some semantic markers but lacked the actual section structure, allowed business slot placement, Collection template internals, page-level dependencies, and explicit template provenance required by the hard gates.

The aggregate Dashboard hard gate also applied generic container and dynamic-user checks inside approved Collection template subtrees. That duplicated the template-specific validators and produced false failures after the Collection template conformance gate had already verified those internal structures.

## Changes

- The full-app materializer now parses Dashboard dataset presentation rows from the Markdown App Plan.
- For each planned Dashboard page, the materializer clones the registered `dashboard-page-layouts-v1.1` parsed resource shell instead of creating a simplified page by hand.
- Business Collection content is inserted only into a `content_card_wrapper > section_content_area` business slot.
- The materializer dispatches to the exact App Plan-selected Collection template and clones the corresponding export-shaped template root from `docs/reference/collection-control-*.template.json`.
- Generated Collection roots now include explicit dataset presentation provenance, App Plan dataset-region metadata, source list binding, and selected template metadata.
- Multiselect and delete-operation dependencies are surfaced at page level through temp variables, actions, and form actions.
- Grid-table multiselect structural containers preserve the full-width contract required by the specialized template validator.
- Source-domain residue in reusable templates is replaced with target app business text.
- Hidden Summary controls are marked as runtime-model-proven and are bound to temp variables consumed by visible KPI text.
- The aggregate Dashboard hard gate now delegates approved Collection template internals to the Collection template validators instead of reapplying generic container and dynamic-user rules inside those subtrees.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now proves that a nontrivial App Plan materialized by `scripts/materialize-full-app-generated-final.mjs` passes:

- canonical schema validation,
- generated-final resource completeness,
- API ID provenance,
- navigation runtime metadata,
- data-list system schema validation,
- default YAPK package validation,
- generated YAPK export-shape validation,
- Dashboard Page Layouts v1.1 validation,
- Dashboard Collection template materialization validation,
- Dashboard Golden Reference validation,
- aggregate Dashboard hard gates.

The regression uses multiple Dashboard Collection templates so template diversity cannot collapse silently into one default grid-table template.

## Proof Boundary

This training improves generated-final package materialization and validation. It does not sign packages, call `setsign` or `verifysign`, install/import packages, run Version Management proof, seed data, or run browser/runtime proof. Signing remains blocked unless all generated-final preflight gates pass in the target run with API-issued IDs and the correct workspace context.
