# Final / Authorized Generation Mode API-Issued ID Training Report

## Summary

This training adds an explicit generation mode decision before Yeeflow resource generation:

- Draft / Offline Mode
- Final / Authorized Generation Mode

Draft / Offline Mode remains the default safe path. It does not call live Yeeflow APIs, may use local draft IDs, and produces local unsigned draft packages only.

Final / Authorized Generation Mode requires explicit user authorization for live Yeeflow API usage and a target workspace. It must allocate API-issued IDs before resource generation and use those IDs directly during initial generation.

## Training Intent

The goal is to prevent generated-final packages from being built with local IDs first and then treated as final after post-hoc replacement. Generated-final readiness now requires proof that IDs were API-issued at initial generation time and consistently preserved across resources and bindings.

## Behavior Added

- Draft mode with local IDs is allowed only as local unsigned draft output.
- Draft mode cannot claim generated-final signing/install readiness.
- Final mode requires explicit authorization metadata and target workspace.
- Final mode requires `GET /utils/generate/ids?count=<n>` before resource generation.
- Final mode blocks local-first-then-remap as the primary path.
- Final mode requires resources to declare `idSource: "api-generated"` and `generatedAt: "initial-generation"`.
- Final mode requires references, lookups, workflows, navigation, dashboards, forms, and resource bindings to resolve to API-issued resource IDs or be explicitly external.

## Files Added

- `docs/standards/final-generation-api-issued-id-mode-standard.md`
- `scripts/validate-generation-mode-id-provenance.mjs`
- `scripts/test-final-generation-api-issued-id-mode.mjs`

## Files Updated

- `docs/yeeflow-application-package-generation-rules.md`
- `docs/yapk-id-provenance-hard-gate.md`
- `docs/package-signing-and-runtime-proof-boundaries.md`
- `docs/app-plan-generation-contract.md`
- `docs/standards/app-plan-standard-template.md`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

All relevant source files are mirrored under `dist/yeeflow-app-builder-plugin`.

## Proof Boundary

The new mode validator proves only generation mode and ID timing evidence. It does not prove:

- package schema validity
- generated package conformance
- signing success
- install/import/upgrade acceptance
- runtime UI behavior
- workflow execution

Those remain separate gates.

## Safety

This training uses synthetic fixtures and local validation only. It does not call Yeeflow APIs, sign packages, install/import/upgrade packages, create plugin archives, create tags, create releases, or move `stable`.
