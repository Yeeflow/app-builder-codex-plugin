# Yeeflow App Builder v1.0.5

## Summary

This narrow patch closes a Dashboard planning-contract orchestration gap by running the official Dashboard dataset-presentation App Plan validator before any API-issued ID request.

## Scope

- Add `validate-dashboard-dataset-presentation-golden-references.mjs` to the aggregate, fail-closed pre-ID allocation readiness gate.
- Block ID allocation and every downstream materialization or mutation boundary when a concrete Dashboard Collection row lacks an approved dataset presentation reference or matching business rationale.
- Require the exact approved reference in the concrete Dashboard Record Display Control Selection row, not only in a separate golden-reference summary table.
- Document `collection_control_grid_table` for dense operational row/column scanning and audit-table review without bulk selection.
- Preserve Dashboard validators, materializer behavior, Core contracts, OAuth, API ID semantics, and tenant behavior.

## Validation

- A vague Dashboard Collection row fails with `DASH_DATASET_APP_PLAN_REFERENCE_MISSING` and invokes the injected ID allocator zero times.
- A valid generic Dashboard Collection row using `collection_control_grid_table` with dense audit-table rationale passes and invokes the allocator exactly once.
- Existing Data List and Approval Form pre-ID failures remain enforced.
- Full-app materialization and first-generation preflight regressions pass.
- Source, official dist, archive, and simulated-installed parity cover the aggregate pre-ID entrypoint.
- TypeScript, workspace, package/dependency boundaries, Core distribution, OAuth parity, English-only, archive hygiene, release safety, and Git diff gates pass.

## Proof Boundary

This release does not modify an active Plugin installation/cache, Plugin Test2, a tenant/workspace, any real application, protected duplicate files, or the historical 0.9.71 rollback archive.
