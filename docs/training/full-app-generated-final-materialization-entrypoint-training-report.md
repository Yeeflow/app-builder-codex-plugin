# Full-App Generated-Final Materialization Entrypoint Training Report

## Summary

This training closes the clean-room execution gap where planning gates passed but the run stopped before generated-final package creation because no concrete callable materialization command was available to the executor.

The plugin now ships `scripts/materialize-full-app-generated-final.mjs` as a first-class node CLI materializer. It consumes approved Markdown planning contracts and API-issued IDs, then emits generated-final package artifacts without crossing into signing, install/import, upgrade, seed data, Version Management, or browser/runtime proof.

## Source Finding

A clean Office Asset Loan Management run on plugin `0.8.29` passed:

- Functional Specification quality.
- Yeeflow App Plan template and resource order.
- Business clarification in generation mode.
- Functional Spec to App Plan traceability.
- Generation readiness.
- OAuth refresh.
- `flowcraft / Codex Mini` workspace discovery.
- Collection template fixture validation.

The run still hard-stopped before `.yapk` creation because the registry declared skill-orchestrated generation, but the active tool environment did not expose a concrete materialization command to turn approved Markdown planning artifacts into generated-final package artifacts.

## Changes

- Added `scripts/materialize-full-app-generated-final.mjs`.
- Added `scripts/test-full-app-materialization-entrypoint-gates.mjs`.
- Extended `docs/reference/full-app-generation-entrypoints.json` with `script:materialize-full-app-generated-final`.
- Updated `scripts/inspect-full-app-generation-entrypoints.mjs` to require and validate the standalone node CLI materializer.
- Updated the full-app generation entrypoint standard.
- Updated application builder, application generator, YAPK package generator, and package validator skill guidance.
- Registered the new script, test, and report in YAPK cache artifact checks.
- Added the materialization regression suite to the aggregate UI hard-gate runner.

## Materialization Contract

The callable command is:

```sh
node scripts/materialize-full-app-generated-final.mjs \
  --functional-spec functional-specification.md \
  --app-plan yeeflow-app-plan.md \
  --out-dir dist \
  --api-id-manifest api-issued-ids.json \
  --json
```

It emits:

- generated-final `.yapk`;
- decoded resource JSON;
- ID provenance report;
- generation report.

It must not:

- sign the package;
- call `setsign` or `verifysign`;
- install, import, or upgrade;
- seed sample data;
- claim Version Management success;
- claim browser/runtime proof.

## Regression Coverage

The focused regression suite proves:

- missing API-issued ID source fails closed;
- fixture-ID mode is available only for plugin tests and is not signing/install eligible;
- package, decoded resource, ID provenance, and generation reports are written;
- the generated package wrapper passes canonical schema validation in the focused fixture;
- materialization keeps `Sign` blank and records the proof boundary;
- API ID manifest mode is signing-eligible only after later generated-final preflight passes.

## Expected Future Behavior

A clean-room run that passes planning gates must no longer report "no generator" when the registry and materializer are present. If it cannot proceed, it must report the concrete blocker, such as:

- missing API-issued IDs;
- failed generated-final preflight;
- failed ID provenance;
- failed navigation metadata;
- failed resource completeness;
- user-requested planning-only scope.

## Safety

This training does not relax generated-final validation. The materializer creates artifacts only. Existing generated-final preflight, ID provenance, navigation runtime metadata, dashboard, collection, analytics, schema, signing, install, upgrade, Version Management, and runtime proof boundaries remain separate gates.
