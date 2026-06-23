# Dashboard Collection Template Slot Decision Gates Training Report

## Purpose

This training closes the gap between Dashboard Page Layouts v1.1 and the approved Dashboard Collection presentation templates.

Dashboard Page Layouts v1.1 is the page shell. Dashboard Collection templates are component-level dataset presentation references that must be selected from the approved registry and inserted only into approved v1.1 business-content slots.

## Problem

Dashboard generation could treat Collection references as loose visual examples. That left room for:

- App Plans listing a generic Collection without selecting a concrete approved template.
- App Plans naming multiple possible templates and leaving the decision to generation.
- Template selection without business rationale from the registry.
- Generated dashboard resources placing Collections directly under root `Content` or copied source shells.
- Simplified or invented Collection structures that were not part of the approved template registry.
- Source-reference leakage from Event Portfolio, Projects Center, Project Tasks, or other proof apps into unrelated generated apps.

## New Rules

- Each Dashboard dataset region that uses Collection must select exactly one approved reference from `docs/reference/dashboard-dataset-presentation-golden-references.json`.
- The App Plan selection must be justified by the selected registry entry's `suitableSourceResourceTypes`, `whenToUse`, `whenNotToUse`, and `requiredBusinessSignals`.
- Approved Collection references are component-level dataset regions, not page shells.
- Every approved Collection template must be placed inside an approved Dashboard Page Layouts v1.1 business-content slot, normally `section_content_area`.
- No generated Dashboard may copy a source app root shell, page header, root Content, structural wrappers, source IDs, source fields, source labels, or source domain text.
- `collection_control_grid_table_with_multiselect` is broadly usable when business needs match multi-row selection and batch operations; Project Tasks is proof source only.

## Validator Coverage

Updated `scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now checks:

- Registry guidance completeness for every approved reference.
- App Plan selection of exactly one approved reference per Dashboard Collection dataset region.
- Business-rationale alignment with the selected registry guidance.
- Generated Collection placement inside approved v1.1 business-content slots.
- Existing provenance, grid-table, search, multiselect, card, and Event Pipeline checks.

Focused regression coverage includes:

- Valid App Plan selection for card, grid-table, search, multiselect, and Event Pipeline references.
- Missing, unknown, multiple, and rationale-mismatched App Plan selections.
- Generated package failure when a Collection template is outside `section_content_area`.
- Existing failures for missing provenance, invented template IDs, simplified grid-table structure, and broken multiselect contract.

## Files Updated

- `docs/standards/dashboard-dataset-presentation-golden-reference-standard.md`
- `docs/standards/app-plan-standard-template.md`
- `docs/standards/dashboard-page-layouts-v1.1-standard.md`
- `scripts/validate-dashboard-dataset-presentation-golden-references.mjs`
- `scripts/test-dashboard-dataset-presentation-golden-references.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-dashboard-generator/SKILL.md`
- `skills/installed/yeeflow-yapk-package-generator/SKILL.md`
- `skills/installed/yeeflow-package-validator/SKILL.md`
- Matching `dist/yeeflow-app-builder-plugin` mirrors.

## Safety

This is a training-only change. It does not bump the plugin version, move `stable`, create tags or releases, generate plugin archives, call live Yeeflow APIs, sign packages, install/import packages, or upgrade Yeeflow apps.
