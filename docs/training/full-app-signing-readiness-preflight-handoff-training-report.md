# Full-App Signing Readiness Preflight Handoff Training Report

## Trigger

The `0.8.49` Office Asset Loan Management regression proved that generated-final local validation and first-generation preflight can pass while the standalone materializer still reports `signingEligible: false`. That was not a package-quality failure. It was a reporting boundary problem: the materializer emits artifacts and intentionally does not run signing readiness, while the later `yapk-first-generation-preflight` result is the correct source for pre-sign handoff.

## Rule

The standalone materializer must continue to report its own boundary conservatively:

- `signingEligible: false`
- `materializerSigningEligible: false`
- `preflightEligibleForSigning: null`
- `signingReadinessSource: "not-run"`

After generated-final preflight runs, `yapk-first-generation-preflight.mjs` must report the pre-sign handoff state:

- `preflightEligibleForSigning: true` when every local generated-final gate passes
- `preflightEligibleForSigning: false` when any gate fails
- `signingReadinessSource: "yapk-first-generation-preflight"`
- `signingReadiness.status` set to `preflight-pass` or `preflight-fail`

Do not treat the materializer's static `signingEligible: false` as evidence that a package remains locally invalid after preflight has passed. Use the preflight readiness fields for the next signing-stage decision.

## Implementation

- Added explicit materializer boundary fields to `materialize-full-app-generated-final.mjs`.
- Added preflight signing-readiness handoff fields to `yapk-first-generation-preflight.mjs`.
- Extended full-app materialization regression coverage to prove:
  - generated materializer reports remain signing-ineligible before preflight;
  - preflight pass emits `preflightEligibleForSigning: true`;
  - the next required stages remain `setsign`, `verifysign`, package API write, Version Management proof where applicable, and browser/runtime proof.

## Proof Boundary

This training does not sign, install/import, upgrade, seed data, call live Yeeflow write APIs, or claim browser/runtime proof. A passed preflight means the package is locally eligible to proceed to the explicit signing stage, not that the app is installed, upgraded, or runtime-proven.
