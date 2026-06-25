# YAPK Bit/Switch, Root Identity, And Signing Readiness Gates Training Report

## Source Evidence

This training consolidates the 0.8.42 Office Asset Loan Management validation report:

- `plugin-0842-stage-complete-analysis-report.md`
- `plugin-0842-stage-complete-analysis-report.json`

The report showed that several lower-level generated-final issues could still survive local validation until signing, install, or runtime review. The decisive generated package defect was a data-list boolean field generated with `FieldType: "Bit"` but runtime `Type: "input"` in both field metadata and `LayoutView`, which can make the installed app fail or materialize incorrectly.

## Reusable Rules Promoted

Generated-final YAPK packages must keep Bit field storage and runtime control metadata aligned:

- `FieldType` must be `Bit`.
- Custom Bit field storage names must use the `Bit<FieldIndex>` family.
- Runtime field/control `Type` must be `switch`.
- `DefaultValue` must be the string `"0"` or `"1"`.
- Every default view or custom layout `LayoutView` row that references the Bit field must also use `Type: "switch"`.

Existing generated-final package rules remain in force and were reaffirmed by this training:

- Wrapper `TenantID` is tenant metadata and must not be `"0"` before signing.
- Wrapper root `ListID`, decoded `ListSet.ListID`, dashboard page root `ListID`, runtime navigation metadata, and canonical runtime URL proof must agree.
- Package API status `540017` means the app is already installed in the tenant; generation should stop fresh-install retries and continue with upgrade or cleanup flow.
- Approval `DefResource`, Type 105 navigation, and `FormNewReports` must remain export-shaped and designer-readable before install or upgrade.
- Home-page `Install failed` tiles must be attributed to the current package/root identity before being used as current-package evidence.

## Generator Changes

The standalone full-app materializer now maps planned boolean, checkbox, yes/no, flag, or Bit data-list fields to generated-final YAPK `Type: "switch"` and string default value `"0"`.

## Validator Changes

Added `scripts/validate-yapk-bit-field-controls.mjs` and registered it in first-generation preflight.

The new gate fails generated-final packages for:

- `YAPK_BIT_FIELD_CONTROL_TYPE_INVALID`
- `YAPK_BIT_DEFAULT_VALUE_INVALID`
- `YAPK_BIT_LAYOUT_CONTROL_TYPE_INVALID`
- `YAPK_BIT_LAYOUTVIEW_JSON_INVALID`

The gate supports decoded JSON packages and Brotli/base64 `.yapk` wrappers, and parses JSON-string `LayoutView` payloads before checking field rows.

## Regression Coverage

Added `scripts/test-yapk-bit-field-controls.mjs` with focused fixtures for:

- valid `Bit` + `switch` package pass
- invalid `Bit` + `input` field metadata fail
- invalid empty Bit default fail
- invalid `LayoutView` row `Type: "input"` fail
- invalid JSON-string `LayoutView` fail

The new validator and regression test are registered in the YAPK hard-gate cache artifact smoke so source checkout and installed cache payloads must mirror them.

## Proof Boundary

This training is a generated-final validation and materializer hardening update. It does not claim install success, Version Management success, or browser/runtime proof for any generated application. Signing, install/import, upgrade, Version Management, seed data, and browser/runtime proof remain separate gated stages.
