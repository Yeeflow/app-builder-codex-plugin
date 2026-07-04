# Tolerant Brotli, Seed Writer, and Dashboard Runtime Training

Date: 2026-07-04

## Source Feedback

This training covers the fresh E2E feedback from active plugin `yeeflow-app-builder@yeeflow 0.8.117`:

- Hospital Doctor Information Management generated with official export-compatible Resource wrapping and passed Resource/readiness gates, but preflight still failed in dashboard golden-reference and Summary/KPI paths.
- Service Tickets Management signed and installed with Version Management `Succeed`, but `dashboard-summary-control-contract` failed because the inspector still used strict Brotli. Runtime opened but showed `No data` because the seed companion artifact was not imported after install.

## Lessons

### 1. UI hard gates must use tolerant Resource decode

Official export-compatible `.yapk` packages may encode wrapper `Resource` with a Brotli shape that strict `zlib.brotliDecompressSync` reports as `unexpected end of file`, while tolerant streaming decode still returns a complete JSON resource. This is a valid package-reader scenario for generated packages that follow the official export-compatible contract.

All package-like validators and inspectors that read `.yapk` wrapper `Resource` must use the shared decoder in `scripts/lib/yapk-decode-utils.mjs` through `readDecodedYapk`, `decodeYapkResource`, or a helper that delegates to them. A validator that reports `SUMMARY_PACKAGE_READ_FAILED` only because strict Brotli failed is a validator defect.

The shared `readPackageLike()` helper used by UI hard gates must not contain an independent strict Brotli branch for `.yapk` packages.

### 2. Install success is not seed proof

Generated seed rows are a post-install companion artifact. They are not automatically imported by `.yapk` installation. After `setsign`, `verifysign`, install submit, Version Management `Succeed`, and child-list materialization proof, a separate seed writer must write rows through live APIs.

The seed writer must:

- wait for the installed root and every target child list to be materialized;
- map companion seed rows to live list IDs and live field IDs/names;
- resolve `identity-picker` values to existing tenant users before writing;
- handle file/image upload fields only when a real upload/reference flow is available;
- report per-list attempted/created/failed rows and block runtime proof on failed required seed rows;
- keep seed proof separate from package install proof.

Runtime dashboards that require records must not be reported as E2E pass from an empty installed application unless the target scenario explicitly expects an empty state.

### 3. Dashboard materialization must stay golden-reference complete

The Hospital Doctor run moved past Resource wrapping and exposed remaining dashboard materialization issues. These are generation defects, not install defects:

- do not invent dashboard layout modules outside selected page-layout slots;
- do not place business controls outside allowed layout/container slots;
- bind user/person display controls as `dynamic-user` where the runtime context is a user/identity field;
- clone approved grid-table Collection templates completely instead of rebuilding simplified internals;
- ensure Summary/KPI controls include hidden host, `ReportIds`, `exts`, `tempVars`, `save_var`, visible binding, and runtime field metadata when KPI/Summary is planned.

### 4. Proof boundaries

Use these labels precisely:

- `package structural pass`: local schema/shape validators passed.
- `preflight pass`: generated-final hard gates passed.
- `install submitted`: package API accepted the request only.
- `Version Management Succeed`: async install/import finished successfully for the submitted package row.
- `seed proof`: companion rows were written to live child lists and read back.
- `runtime dashboard proof`: browser/runtime shows the planned live data/control behavior after install and seed.

Do not collapse these layers into a single success claim.

## Required Regression Coverage

- Official export-compatible `.yapk` Resource must still fail strict Brotli but pass all package readers that use `readPackageLike()`.
- `inspect-dashboard-summary-control-contract.mjs --package <official-style.yapk>` must not emit `SUMMARY_PACKAGE_READ_FAILED`.
- A seed-required application must not claim runtime proof until the post-install seed writer has written and verified rows.
- Dashboard hard gates must continue to fail invented modules, out-of-slot controls, user-field `dynamic-field` mistakes, and incomplete approved grid-table internals.
