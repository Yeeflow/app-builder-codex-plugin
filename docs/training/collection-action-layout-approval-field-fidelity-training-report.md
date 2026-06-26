# Collection Action Layout and Approval Field Fidelity Training Report

## Summary

This training closes two generated-final blockers found during the Office Asset Loan Management 0.8.64 clean E2E run.

The generated package correctly stopped before signing because:

- `collection_control_card_with_multiselect_toolbar` retained an unresolved action-step layout placeholder: `{{layout}}`.
- `Asset Return Review` planned `Loan Number`, but the generated Approval form content drifted to `Request Number` / source-domain cleanup output.

Both failures are generated-final blockers. They are not signing, install, tenant, or runtime-proof issues.

## Classification

- Type: generator bug plus validator fidelity hardening.
- Scope: full-app materializer, Dashboard Collection template action remapping, Approval form planned-field visible-label validation, focused regressions, standards, and dist mirrors.
- Boundary: local generated-final validation only. No Yeeflow signing, install/import, upgrade, Version Management, seed-data execution, or browser/runtime proof was performed.

## Rules Added

- Generated Dashboard Collection actions must not contain unresolved source-template layout placeholders in any action step, button binding, or Collection action payload.
- Layout placeholder replacement covers `{{DetailLayoutID}}`, `{{layout}}`, `{{LayoutID}}`, `{{layoutId}}`, `{{PageID}}`, and `{{pageId}}`.
- If a concrete detail layout is unavailable, generated actions that require that layout must be removed or blanked before signing readiness; placeholders must never remain in generated-final resources.
- Approval form field controls planned in the App Plan must preserve the planned visible business label.
- Technical field keys such as `LoanNumber` are not enough proof when the visible label drifted to a different business label such as `Request Number`.
- Source-domain residue cleanup must not rewrite controls that were materialized from App Plan approval field rows.

## Implementation

- Updated `materialize-full-app-generated-final.mjs` to rewrite lowercase and alternate layout placeholder aliases during Collection template runtime-reference remapping.
- Prevented source-domain cleanup from mutating App Plan materialized Approval field controls.
- Removed the broad `Loan -> Request` cleanup rule that could corrupt valid non-loan app fields such as `Loan Number`.
- Tightened Approval form field validation so App Plan materialization checks require visible/display label fidelity instead of accepting technical binding names alone.
- Added focused regressions for card-multiselect action-step `{{layout}}` placeholders and Approval `Loan Number` visible-label drift.
- Extended the full-app materializer regression with `Asset Return Review` planned `Loan Number` fields and package-wide layout-placeholder absence checks.

## Validation

Validated with:

- `node --check` for changed JS/MJS files
- focused Dashboard dataset presentation tests
- focused Approval form field template tests
- full-app materialization entrypoint regression
- dashboard/template/generated-final preflight-related suites in the broader release gate

This training keeps the materializer signing boundary unchanged. Generated packages become signing-ready only after first-generation preflight passes and emits the signing-readiness handoff.
