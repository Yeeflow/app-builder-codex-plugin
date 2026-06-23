# Dashboard Root Binding, v1.1 Padding, And Runtime Proof Gates Training Report

## Source Evidence

This training is based on:

`plugin-0.8.10-dashboard-install-and-padding-training-analysis.md` from the Office Asset Loan Management 0.8.10 E2E validation run.

The 0.8.10 Office Asset Loan Management E2E run proved that Dashboard resources can exist in `Pages[]` and pass local shell checks while still failing to surface in the installed app when copied Dashboard pages keep a source page `ListID`.

## Problems Covered

1. Type `103` Dashboard page root binding.
   - `decoded.Pages[].ListID` must equal `decoded.ListSet.ListID`.
   - `decoded.Pages[].LayoutID` remains the page layout resource ID.
   - Navigation Type `103` entries may target the `LayoutID`, but `Pages[]` records must be rooted to the app.

2. Dashboard Page Layouts v1.1 Content padding.
   - Root page padding remains zero.
   - The v1.1 `Content` container must preserve canonical template padding.
   - Obsolete forced-zero normalization for `Content` padding is forbidden.

3. Canonical runtime URL proof.
   - Runtime proof must use wrapper `ListID` / decoded `ListSet.ListID` when package-root proof is available.
   - Install response `Data.ID` is not application root proof unless explicitly named `ListSetID` or equivalent.

4. Package API diagnostics.
   - Non-zero package API statuses must retain sanitized non-secret server `Message` text.
   - Status `540017` is classified as already installed in tenant and should route to upgrade-check / upgrade-apply flow, not repeated fresh install.

5. Validator and run-script ergonomics.
   - Focused regression coverage now exercises package-level root binding, v1.1 padding parity, package API response parsing, and aggregate hard-gate/cache registration.

## Code And Gate Changes

- `validate-yapk-package.js`
  - Adds `YAPK_DASHBOARD_PAGE_ROOT_BINDING_INVALID`.
  - Adds `DASHBOARD_V11_CONTENT_PADDING_MISMATCH`.

- `scripts/validate-dashboard-page-layout-template.mjs`
  - Enforces v1.1 `Content` padding parity against `docs/reference/dashboard-page-layout-templates.json`.

- `scripts/validate-dashboard-golden-reference-conformance.mjs`
  - Keeps Event Portfolio root-padding checks from competing with v1.1 page-shell padding parity.

- `scripts/yeeflow-package-api-automation.mjs`
  - Removes install `Data.ID` fallback for application root URL generation.
  - Adds decoded package-root URL proof fields.
  - Preserves sanitized server messages.
  - Classifies `540017` and already-installed messages as `already_installed_in_tenant`.

- `scripts/test-dashboard-install-runtime-root-binding-gates.mjs`
  - Covers Type `103` page root binding and v1.1 forced-zero Content padding regressions.

## Classification

These were pre-existing generator/validator gaps exposed by later Dashboard and YAPK hardening:

- Dashboard page shell checks did not validate app-root binding.
- v1.1 template adoption did not fully retire an older Content padding normalization assumption.
- package API automation over-trusted install response IDs.
- package API reports over-redacted useful business error messages.

## Required Validation

Run:

```bash
node scripts/test-dashboard-install-runtime-root-binding-gates.mjs
node scripts/test-dashboard-page-layout-template-gates.mjs
node scripts/test-dashboard-generation-hard-gates.mjs
node scripts/test-package-api-upload-response-parsing.mjs
node scripts/test-application-delivery-workflow.mjs
node scripts/test-ui-hard-gates-all.mjs
node scripts/test-yapk-hard-gate-cache-artifacts.mjs
```

Do not sign, install, upgrade, or claim runtime success when any of these gates fail.
