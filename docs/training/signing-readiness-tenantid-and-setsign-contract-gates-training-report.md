# Signing Readiness TenantID And SetSign Contract Gates Training Report

## Scope

- Baseline plugin version: `0.7.3`
- Training branch: `codex/signing-readiness-tenantid-and-setsign-contract-gates`
- Release target after merge: `0.7.4`
- Version bump in training PR: none

## Evidence

A Facility Maintenance generated-final package passed generated-final validation but failed `setsign` with HTTP 400 `invalid request`. A controlled copy changed only wrapper `TenantID` from `"0"` to the OAuth tenant ID. No app regeneration, ID allocation, or resource mutation was performed. The copied package then returned HTTP 200 from `setsign`, and `verifysign` also returned HTTP 200.

The same forensics showed that `setsign` may return the signature as a top-level JSON string instead of only an object field. Reports must parse that shape and redact saved signature values.

## Training Changes

- Added a generated-final signing-readiness validator for wrapper `TenantID`.
- Classified wrapper `TenantID`, `CreatedBy`, and `ModifiedBy` as tenant/user metadata, not generated app content IDs.
- Updated ID provenance validation so wrapper `TenantID` is not required in the API-issued app content ID manifest.
- Added signing-readiness failure cases for `TenantID: "0"`, missing/empty TenantID, local draft placeholders, placeholder-like TenantID values, and OAuth tenant mismatches.
- Added `setsign` response parsing for top-level JSON string signatures and supported object-field signatures.
- Added redacted signing request/response metadata helpers so raw signatures are not saved in reports.
- Added the signing-readiness TenantID gate to first-generation YAPK preflight before signing.
- Updated docs and skills to state that generated-final validation is not enough for signing readiness.

## Regression Coverage

- Fails signing readiness with `TenantID: "0"`.
- Fails signing readiness with missing or empty TenantID.
- Fails signing readiness with local/draft TenantID placeholders.
- Passes signing readiness with a real OAuth tenant ID that matches context.
- Passes ID provenance when wrapper TenantID is real tenant metadata and absent from the app content ID manifest.
- Fails ID provenance when generated app content IDs are missing from the API-issued manifest.
- Parses top-level JSON string `setsign` signatures.
- Parses supported object-field `setsign` signatures.
- Fails unknown `setsign` response shapes.
- Confirms saved signing reports redact signature values.

## Safety

This is a training-only change. It does not bump the plugin version, move `stable`, create tags/releases/plugin archives, run live Yeeflow writes, sign packages, install/import/upgrade packages, or touch unrelated duplicate ` 2` / ` 3` files.
