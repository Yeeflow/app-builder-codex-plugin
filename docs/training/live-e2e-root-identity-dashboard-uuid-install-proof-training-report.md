# Live E2E Root Identity, Dashboard UUID, and Install Proof Training Report

## Source Evidence

This training is based on the `0.8.50` Office Asset Loan Management live E2E analysis report:

- `live-e2e-install-failure-full-analysis-report.md`
- `live-e2e-install-failure-full-analysis-report.json`

The report showed that the package could pass local generated-final validation, signing, and signature verification, but still fail runtime proof because local gates did not fully cover live install identity and nested resource remap boundaries.

## Problems Covered

1. The generated wrapper root identity diverged from the decoded root identity:
   - `wrapper.ListID`
   - decoded `ListSet.ListID`
2. API install `apiStatus: 0` was treated too close to success even though it only means submitted/accepted.
3. Runtime proof used a URL derived from the wrong canonical root, producing a blank shell.
4. Dashboard template control UUIDs were reused across generated Dashboard pages.
5. Fresh-ID remap missed IDs inside dashboard `LayoutInResources[].Resource` JSON strings.
6. Fresh-ID remap missed IDs inside encoded approval `DefResource` Brotli payloads.
7. Reusing a failed `PackageId` / `ListSetID` family for a fresh install retry was not blocked strongly enough.
8. Final install success needed exact Version Management row proof for the submitted `PackageId`.

## Implementation

- Added `scripts/validate-yapk-live-install-readiness.mjs`.
- Added `scripts/test-yapk-live-install-readiness-gates.mjs`.
- Integrated `live-install-readiness` into `scripts/yapk-first-generation-preflight.mjs`.
- Updated the full-app materializer so `wrapper.ListID` is the same API-issued ID as decoded `ListSet.ListID`.
- Updated the full-app materializer to re-instantiate UUID-shaped Dashboard template control IDs per generated page.
- Added first-generation materializer regression coverage for root identity and cross-page Dashboard UUID uniqueness.
- Added `docs/standards/yapk-live-install-readiness-standard.md`.
- Registered the new validator/test/standard in cache artifact checks.

## New Hard Gates

- `YAPK_ROOT_LISTID_MISMATCH`
- `YAPK_DASHBOARD_PAGE_ROOT_LISTID_MISMATCH`
- `DASHBOARD_RESOURCE_JSON_PARSE_FAILED`
- `DASHBOARD_CONTROL_UUID_DUPLICATE_ACROSS_PAGES`
- `YAPK_EMBEDDED_DASHBOARD_ID_NOT_IN_MANIFEST`
- `APPROVAL_DEFRESOURCE_DECODE_FAILED`
- `APPROVAL_DEFRESOURCE_KEY_MISMATCH`
- `YAPK_EMBEDDED_APPROVAL_DEFRESOURCE_ID_NOT_IN_MANIFEST`
- `INSTALL_API_ACCEPTANCE_NOT_FINAL_SUCCESS`
- `INSTALL_VERSION_ROW_MISSING`
- `INSTALL_VERSION_ROW_FAILED`
- `INSTALL_VERSION_ROW_NOT_SUCCEEDED`

## Proof Boundary

These gates make generated-final packages safer to hand off to signing, but they do not collapse the evidence stages. Signing, `verifysign`, package API submission, Version Management final `Succeed`, and browser/runtime proof remain separate required stages.
