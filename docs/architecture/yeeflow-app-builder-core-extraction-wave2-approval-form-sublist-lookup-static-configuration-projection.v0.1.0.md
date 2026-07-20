# Core Extraction Wave 2: Approval Form Sublist Lookup Static Configuration Projection

`CORE_EXTRACTION_WAVE2_APPROVAL_FORM_LOOKUP_STATIC_CONFIGURATION_EXECUTION_PASSED`

`CORE_EXTRACTION_WAVE2_CALLER_COUNT_CORRECTED`

## Outcome

The exact Approval Form-only normalizer `normalizeApprovalSubListLookupConfiguration` has one direct production caller, `normalizeApprovalSubListRowFields`; the prior inventory value of zero was corrected. Its sole static target/display configuration path now uses the Materializer Core facade `projectApprovalFormSubListLookupStaticConfiguration`.

## Preserved Contract

The Phase 18B Submission Form configuration remains exact: `appid`, `listid`, `listsetid`, and `listfield` are retained. Both export-proven 19-digit identifiers remain strings. The Core function returns either a frozen JSON-safe configuration or the exact `APPROVAL_FORM_SUBLIST_LOOKUP_CONFIGURATION_INVALID` failure.

## Exclusions

No Data List DTO, target resolution, Local Runtime API, frontend selection, target retrieval, automatic assignment, clearing, expression execution, writeback, readonly timing, mutable template/resource/package state, active installation, or historical ZIP behavior is included.

## Proof

A frozen Phase 18B Legacy-preserving baseline and the decoded `Leave Request (1).ywf` corpus prove valid, non-Lookup, missing, malformed, and lossless-ID cases. Compiled source, Plugin dist, temporary official ZIP, simulated installed Plugin, actual materializer, deterministic double-run, and a temporary-copy rollback to the Phase 18B implementation all passed.

## Checksums

- Materializer Core artifact: `8e24a26f0175478177a4948caeab7652e2eefab8312a8f585cdd80f09dd00977`
- Planning Core artifact: `2d0c680c5af83fdf101853656e8435f9699f30019eddeb491a2fcc8c0a71fa7e`
- Historical ZIP (unchanged): `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`
