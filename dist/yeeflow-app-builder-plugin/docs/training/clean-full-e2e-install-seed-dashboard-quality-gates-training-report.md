# Clean Full E2E Install, Seed, Approval, And Dashboard Quality Gates Training Report

## Source Case

- Source report: `clean-full-e2e-0.8.24-plugin-training-analysis-report.md`
- Scenario: Office Asset Loan Management clean full E2E with active `yeeflow-app-builder@yeeflow 0.8.24`
- Outcome: install/materialization was eventually repaired, but generated business quality remained below final acceptance.

## Problem Classes

This training separates package/runtime stages that were previously easy to collapse:

- Package API `Status: 0` is submitted/accepted only, not install success.
- Runtime proof must reject `Install failed` tiles and empty `Start to build with Components` shells.
- Generated-final YAPK packages must not embed seed/demo rows in `Childs[].List.Items`, `Childs[].ListDatas`, or `Childs[].List.ListDatas`.
- Approval `DefResource` must be designer/materialization-safe, not only encoded and decodable.
- Dashboard template selection must be followed by business-domain normalization.
- KPI binding proof is not business correctness proof unless visible values match seed-derived expected values.

## Implemented Gates

- `YAPK_EMBEDDED_LIST_ITEMS_FORBIDDEN`
  - Blocks non-empty generated-final `Childs[].List.Items`.
  - Added to generic YAPK validation, canonical package schema validation, and generated export-shape validation.
- `submitted` package API classification
  - `apiStatus: 0` for install/import is no longer classified as `success`.
  - Upload responses without an explicit `Status` are not misclassified as submitted.
- Approval `DefResource` materialization checks
  - Requires `MultiAssignmentTask`, assignee metadata, and Approved/Rejected paths.
- Runtime evidence blockers
  - Fails empty Components shell text and `Install failed` tile/status evidence.
- Dashboard visible text residue checks
  - Fails raw control labels such as `Grid`, `Container`, `Text`, `Placeholder`, `Dynamic field`, and `Dynamic user`.
  - Fails known source-template residue such as `All tasks - Multiple select`, `Active Survey Programs`, `Survey Program`, `Project Tasks`, and unrelated `Event Pipeline`.
- KPI semantic proof checks
  - When runtime evidence includes `expectedKpis`, visible KPI values must match those seed-derived expected values.

## Generation Guidance

Seed data is a post-install workflow, not package content. Generators may emit a companion seed artifact, but live seed execution requires explicit approval, `TriggerFlow: false` by default, before/after counts, and separate post-seed runtime proof.

Dashboard Collection templates remain valid golden references, but they are not self-sufficient. Every visible Collection title, column, field, action, filter, and KPI label must be rewritten to the current App Plan business domain. Source application labels and generic control names are generated-final blockers.

Approval forms must include enough workflow/designer detail for import and designer hydration. Encoding correctness alone is insufficient.

## Validation Coverage

Focused regression coverage was added or extended in:

- `scripts/test-generated-yapk-export-shape-materialization-gates.mjs`
- `scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs`
- `scripts/test-ui-summary-kpi-runtime-hard-gates.mjs`
- `scripts/test-application-delivery-workflow.mjs`
- `scripts/test-package-api-upload-response-parsing.mjs`

These gates are part of the broader generated-final, dashboard, YAPK, UI, and package API validation matrix.
