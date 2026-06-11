# Generated Approval Form Controls Test v2 Baseline

Date: 2026-05-14

## Package

- App name: Approval Form Controls Test v2
- Generator: `generate-approval-form-controls-test-v2-advanced-inputs.mjs`
- Decoded app definition: `approval-form-controls-test-v2-app-def.json`
- Approval form definition: `approval-form-controls-test-v2-approval-form-def.json`
- Data list definition: `approval-form-controls-test-v2-list-def.json`
- Generated package: `Approval Form Controls Test v2.generated.yap`
- User-accessible copy: `<downloads>/Approval Form Controls Test v2.generated.yap`
- ID family: `452...`
- FlowKey/form key: `AFC2`

Generated `.yap` and decoded package JSON artifacts stay out of Git. This document and the generator script are the tracked baseline.

## What This Proves

This stage proves the advanced input control batch after the successful v1 representative-control baseline.

Controls proved:

- `percent`
- `time`
- `hyperlink`
- `rate`
- `calculated`

Partially proved:

- `daterange`: from/to values rendered, accepted input, and appeared on the approval task. The generated list view did not expose both mapped date fields, so list-view persistence remains a follow-up proof.

## Validation Results

Local checks passed:

- `node --check generate-approval-form-controls-test-v2-advanced-inputs.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ywf-def.js`
- `node --check validate-ydl-list.js`
- `node --check workflow-action-config-validator.js`
- JSON parse checks for `approval-form-control-runtime-coverage.json` and `approval-form-controls-runtime-test-spec.json`

Package and component validation:

- `validate-yap-package.js approval-form-controls-test-v2-app-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors, 31 warnings.
- `validate-yap-graph.js approval-form-controls-test-v2-app-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors, 4 warnings.
- `validate-ywf-def.js approval-form-controls-test-v2-approval-form-def.json --mode final`: `pass_with_warnings`, 0 errors, 18 warnings.
- `validate-ydl-list.js approval-form-controls-test-v2-list-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors, 6 warnings.
- `workflow-action-config-validator.js`: `pass`, 9 checked nodes, 0 errors, 0 warnings.

Wrapper build and round-trip validation:

- `build-yap-wrapper.js`: `pass`.
- Wrapper JSON, resource prefix, base64, gzip, resource JSON, and `Resource.Data` validation all passed.
- Decoded wrapper content matched the source app definition.
- Wrapped package validation: `pass_with_warnings`, 0 errors, 31 warnings.
- Wrapped graph validation: `pass_with_warnings`, 0 errors, 4 warnings.

Warnings are expected because this stage intentionally exercises schema-supported controls that were not previously runtime-proven.

## Runtime Result

Runtime testing was completed in `https://<yourdomain>.yeeflow.com/`.

Verified:

- App imported successfully.
- Imported app opened successfully.
- `Overview` app page rendered.
- `Advanced Input Test Requests` data list opened without `datas/query` 400.
- Seed sample row rendered.
- `Approval Form Controls Test v2` approval form opened.
- Percent, date range, time, hyperlink, rate, and calculated controls rendered.
- Submitted runtime test request:
  - Request Title: `Advanced inputs runtime test`
  - Base Amount: `200`
  - Adjustment Percent: `25.00%`
  - Calculated Score updated to `50`
  - Satisfaction Rate: `3.5`
  - Preferred Time: `10:30:00`
  - Follow-up Window: `21/05/2026` to `22/05/2026`
  - Reference Link: `https://example.com/runtime-test`
  - Notes: `Runtime test for advanced input controls.`
- Submit completed and showed the Yeeflow success state.
- Pending approval task opened.
- Review task page rendered readonly submitted values, Action Panel, and Flow History.
- Approval completed successfully.
- Pending task list became empty.
- `ContentList` created a persisted data-list record.
- Persisted record appeared in `Advanced Input Test Requests` with:
  - Request Title: `Advanced inputs runtime test`
  - Base Amount: `200.00`
  - Adjustment Percent: `25.00%`
  - Calculated Score: `50.00`
  - Satisfaction Rate: `3.5`
  - Preferred Time: `10:30:00`
  - Reference Link: `Open link`

Runtime status: passed for Stage 2, with date range persistence visibility kept as a follow-up check.

## Generator Rules Confirmed

- Percent values can be generated with the learned percent control shape and mapped to Decimal fields.
- Time values can be generated with the learned time control shape and mapped to Datetime fields for simple time display.
- Hyperlink controls can accept a URL, render as an open link on the task page, and persist as a list-view link.
- Rate controls can generate a star rating and persist a numeric value.
- Calculated controls can safely reference a numeric source and a percent source; Yeeflow evaluated `200 * 25%` as `50`.
- Date range controls should continue to be generated cautiously until both mapped date fields are visible and verified in a list-view proof.

## Next Stage

Proceed to Stage 3 only after this baseline is committed:

- `file-upload`
- `icon-upload`

Use a small safe file and keep upload/media controls isolated from other unproven control families.
