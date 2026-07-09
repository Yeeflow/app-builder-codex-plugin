# Internal Audit Generated-Final Hard Gates Focused Training

Date: 2026-07-10

## Scope

Focused training for the remaining generated-final hard gates found in the Internal Audit Workflow Management generation run.

Reference run:

- `/Users/rengerhu/Documents/Plugin Test2/docs/generated-app-plans/internal-audit-workflow-20260708-233759`
- Verification package after this training:
  `/Users/rengerhu/Documents/Plugin Test2/docs/generated-app-plans/internal-audit-workflow-20260708-233759/post-remaining-hard-gates-focused-fix-2/internal-audit-workflow-management.generated-final.yapk`

This is a local fixture-ID regression package. It is not signing-ready because API-issued ID provenance intentionally remains fixture-based.

## Issues Covered

### Data Analytics Planned Template Materialization

Problem:

- The App Plan used a global `Data Analytics Template Selection` table with `Section | Surface | Data Source | ...`.
- The parser treated the surrounding section heading as a dashboard page name.
- Planned analytics templates were therefore scoped to a non-dashboard page and were not materialized.

Training rule:

- If a Data Analytics selection table has `Surface` and `Section` but no explicit Dashboard Page column, treat it as unscoped/global.
- Distribute unscoped analytics records to dashboard pages by the existing dashboard selection logic.
- The validator must apply the same parsing rule as the materializer.

### Reverse-Related View Item Sections

Problem:

- App Plan View Item form names can be business names such as `Observation View`, while generated form resources may be named `Audit Observations View Item`.
- Exact form-name matching skipped a planned reverse-related section.

Training rule:

- Reverse-related form matching must allow host-list concept matching plus view/workbench/detail intent.
- The match may use singular host terms, for example `Observation` matching `Audit Observations View Item`.
- Exact matching remains preferred when available.

### Workbench Empty Right Column

Problem:

- `dashboard-page-layouts-workbench` had `main_work_queue_wrapper` configured as a two-column grid even when only the left/primary business area was generated.
- The single-column pruning helper was only applied to master-detail workspace layouts.

Training rule:

- Apply the same empty-right-column pruning rule to `dashboard-page-layouts-workbench`.
- If `main_work_queue_wrapper` has no meaningful `right_side_panel` business content, remove the right column and use one `1fr` column across desktop, tablet, and mobile definitions.

### Dashboard Golden Reference Leakage False Positive

Problem:

- The marketing-template residue gate treated the bare term `Stage` as a source-template leak.
- Internal Audit uses `Stage` as a valid business term.

Training rule:

- Do not treat bare `Stage` as a marketing/event template residue term.
- Continue rejecting stronger source-template terms such as `Event`, `Region`, `Registration`, and `Budget` when copied into unrelated generated dashboards.

### Regression Fixture Alignment

Problem:

- A dashboard-generation hard-gate positive fixture still had a `dynamic-user` Collection control without zero `item_style.pd`.

Training rule:

- Valid dashboard Collection fixtures must obey the same Dynamic user zero-padding contract as generated packages.

## Verification

Passed local checks:

- `node --check scripts/materialize-full-app-generated-final.mjs`
- `node --check scripts/validate-data-analytics-golden-references.mjs`
- `node --check scripts/validate-dashboard-golden-reference-conformance.mjs`
- `node scripts/test-data-analytics-golden-reference-gates.mjs`
- `node scripts/test-dashboard-golden-reference-conformance.mjs`
- `node scripts/test-dashboard-generation-hard-gates.mjs`

Package-level focused validators on the regenerated Internal Audit package:

- `validate-data-analytics-golden-references.mjs`: pass
- `validate-data-list-form-layout-template.mjs`: pass
- `validate-dashboard-generation-hard-gates.mjs`: pass

Full generated-final preflight result:

- `ok: false`
- only remaining failed gate: `api-issued-content-id-provenance`
- remaining codes: `ID_PROVENANCE_SOURCE_NOT_API_GENERATED`, `ID_PROVENANCE_ALLOCATION_SOURCE_NOT_API_GENERATED`

This remaining failure is expected for regression-only fixture mode and must be resolved by using real API-issued IDs before signing or installing.
