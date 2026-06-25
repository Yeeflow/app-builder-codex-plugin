# Full-App Materializer Fixture ID Demand Alignment Training Report

## Summary

This training follows the `0.8.40` Office Asset Loan Management local regression. Version `0.8.40` fixed the Dashboard KPI source-template temp variable blocker and the generated package passed first-generation preflight when supplied with a sufficiently large local test ID manifest. A smaller test path still exposed a materializer regression usability issue: `--allow-fixture-api-ids-for-tests` returned only six synthetic IDs, which was enough for trivial schema-smoke packages but not enough for nontrivial App Plans.

The fix makes fixture-ID regression mode allocate a large pool of synthetic API-shaped numeric string IDs so clean-room local regression can exercise the same nontrivial resource graph path without requiring live API allocation.

## Source Finding

The `0.8.40` regression run showed:

- active plugin and cache were `0.8.40`;
- first-generation preflight passed when the materializer received a sufficient synthetic ID manifest;
- the same nontrivial Office Asset App Plan failed in fixture mode before package generation with `FULL_APP_MATERIALIZATION_API_ID_COUNT_INSUFFICIENT`;
- the failure reported `required: 47` and `received: 6`.

This was not a production signing/install bug because generated-final output still requires API-issued IDs for signing readiness. It was a regression harness gap that made plugin-only clean-room verification harder than necessary.

## Changes

- Replaced the six-ID fixture set with a generated pool of 1024 API-shaped numeric string IDs.
- Kept fixture mode explicitly marked as regression-only through `api-generated-fixture-for-tests`.
- Kept fixture materialization `signingEligible: false`.
- Added a nontrivial App Plan fixture-mode regression that materializes data lists, approval forms, form reports, custom forms, dashboards, and grouped navigation without ID-count failure.
- Updated full-app generation standards and application generator skill guidance to require fixture mode to cover realistic App Plan resource demand while preserving the live-ID proof boundary.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now verifies that:

- trivial fixture materialization still emits generated-final package, decoded resource, provenance, and generation report artifacts;
- nontrivial fixture materialization allocates enough synthetic API-shaped IDs;
- fixture output remains `signingEligible: false`;
- fixture provenance remains visibly marked as regression-only.

## Safety Boundary

This training does not make fixture IDs signing-eligible and does not claim live Yeeflow ID provenance. Fixture output is still forbidden for signing, `verifysign`, install/import, upgrade, Version Management, seed data, and browser/runtime proof.
