# Live E2E Signing and Install Readiness Training Report

## Source Evidence

This training is based on the Office Asset Loan Management `0.8.60` E2E issue analysis:

- `plugin-0.8.60-e2e-issue-analysis-report.md`
- `plugin-0.8.60-e2e-issue-analysis-report.json`

The report separated true plugin/generator/preflight gaps from tenant/workspace state. The plugin changes in this training focus on generated-final signing readiness, install proof attribution, validator consistency, and planning parser false positives.

## Problems Covered

1. A generated-final wrapper with `TenantID: "0"` reached the signing boundary. Generic schema validation accepts numeric strings, but signing/install readiness must reject placeholder tenant metadata.
2. Runtime proof could treat an old unrelated home-page `Install failed` tile as failure for the current package because evidence scanning was global instead of target-app scoped.
3. Duplicate `validate-yapk-package.js` entrypoints can drift when one copy is updated and another stale copy remains callable.
4. Approval Form Layout Template Selection parsing could read into the following Approval Form Fields Layout Template Selection subsection and report false mismatches.
5. Approval Form v1.1, Data List Form v1.1, and Dashboard v1.1 cleanup rules remain mandatory: copied modules with no business content or no configured actions must be removed, not rendered as empty template scaffolding.
6. Runtime seed data remains a post-install proof step. Generated-final packages must not embed sample rows under package resources.

## Implementation

- `scripts/validate-yapk-live-install-readiness.mjs` now blocks placeholder tenant metadata with `YAPK_WRAPPER_TENANTID_ZERO_BEFORE_SIGNING`.
- `scripts/test-yapk-live-install-readiness-gates.mjs` covers the placeholder tenant signing-readiness failure.
- `scripts/inspect-runtime-evidence.mjs` now scopes `Install failed` tile checks to the target app title when `targetAppTitle`/`expectedAppTitle` and tile evidence are provided. Without scoped evidence, it keeps the existing conservative global check.
- `scripts/test-ui-summary-kpi-runtime-hard-gates.mjs` covers both unrelated historical failure tiles and target-app failure tiles.
- `scripts/test-yapk-validator-entrypoint-drift.mjs` asserts every public `validate-yapk-package.js` entrypoint byte-matches the canonical root validator.
- Approval Form Layout App Plan parsing now stops at the next `####` subsection, so field-grid template rows do not get interpreted as page-layout template rows.

## New or Strengthened Hard Gates

- `YAPK_WRAPPER_TENANTID_ZERO_BEFORE_SIGNING`
- `YAPK_WRAPPER_TENANTID_INVALID_BEFORE_SIGNING`
- target-scoped `YAPK_RUNTIME_INSTALL_FAILED_TILE`
- canonical `validate-yapk-package.js` entrypoint byte-parity
- Approval Form Layout Template Selection subsection boundary enforcement

## Proof Boundary

These updates do not claim live install success. They only make the package safer to hand off to signing and make runtime evidence attribution more precise. Final success still requires signing, `verifysign`, install/upgrade API submission, exact Version Management `Succeed` for the submitted `PackageId`, and browser/runtime proof against the decoded package root.
