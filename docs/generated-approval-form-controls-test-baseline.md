# Generated Approval Form Controls Test Baseline

Date: 2026-05-14

## Package

- App name: Approval Form Controls Test
- Generator: `generate-approval-form-controls-test-v1.mjs`
- Decoded app definition: `approval-form-controls-test-app-def.v1.json`
- Approval form definition: `approval-form-controls-test-approval-form-def.v1.json`
- Data list definition: `approval-form-controls-test-list-def.v1.json`
- Generated package: `Approval Form Controls Test v1.generated.yap`
- User-accessible copy: `/Users/Renger/Downloads/Approval Form Controls Test v1.generated.yap`
- ID family: `451...`
- FlowKey/form key: `AFC1`
- Source baseline: `design-system-request-tracker-app-def.v1.json`

Generated artifacts are kept out of the Git baseline unless explicitly allowlisted. The generator script and this runtime baseline are the tracked sources of truth.

## What This Proves

This package validates that the AI Training approval-control learning can produce a small working Yeeflow app with representative native controls, a data list, an app-level approval form, a simple workflow, and `ContentList` persistence.

The app follows the current Yeeflow generation rules:

- Fresh local ID family.
- Fresh FlowKey/form key.
- `Data.Forms[].ListID = 0`.
- Native Title metadata preserved on the data list.
- Page-level background rule applied.
- `Main`, `Content`, `Form body`, and `Form bottom` structure used.
- Learned Text control standard used for display text.
- Normal controls grouped in two-column grids.
- Long controls placed full-row.
- Meaningful `nv_label` values used.
- Action Panel and Flow History included in the form bottom.

## Included Controls

The v1 proof package includes:

- `input`
- `textarea`
- `richtext`
- `input_number`
- `currency`
- `percent`
- `radio`
- `checkbox`
- `switch`
- `datepicker`
- `daterange`
- `file-upload`
- `identity-picker`
- internal `lookup`
- `calculated`
- `workflowControlPanel`
- `workflowHistory`

Runtime-sensitive controls intentionally included for proof:

- `richtext`
- `checkbox`
- `percent`
- `file-upload`
- `identity-picker`
- `lookup`
- `calculated`

Deferred controls:

- `icon-upload`
- `organization-picker`
- `location-picker`
- `cost-center-picker`
- `metadata`
- `mutiple-metadata`
- `lookup-list`
- `list/sublist`

## Validation Results

Local checks passed:

- `node --check generate-approval-form-controls-test-v1.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ywf-def.js`
- `node --check validate-ydl-list.js`
- `node --check workflow-action-config-validator.js`

Package and component validation:

- `validate-yap-package.js approval-form-controls-test-app-def.v1.json --mode generator --stage final`: `pass_with_warnings`, 0 errors, 19 warnings.
- `validate-yap-graph.js approval-form-controls-test-app-def.v1.json --mode generator --stage final`: `pass`, 0 errors, 0 warnings.
- `validate-ywf-def.js approval-form-controls-test-approval-form-def.v1.json --mode final`: `pass_with_warnings`, 0 errors, 18 warnings.
- `validate-ydl-list.js approval-form-controls-test-list-def.v1.json --mode generator --stage final`: `pass_with_warnings`, 0 errors, 2 warnings.
- `workflow-action-config-validator.js`: `pass`, 9 checked nodes, 0 errors, 0 warnings.

Wrapper build and round-trip validation:

- `build-yap-wrapper.js`: `pass`.
- Wrapper JSON, resource prefix, base64, gzip, resource JSON, and `Resource.Data` validation all passed.
- Decoded wrapper content matched the source app definition.
- Wrapped package validation: `pass_with_warnings`, 0 errors, 19 warnings.
- Wrapped graph validation: `pass`, 0 errors, 0 warnings.

The remaining warnings are expected for this proof package because it intentionally includes schema-supported controls that were selected for runtime validation.

## Runtime Result

Runtime testing was completed in `https://<yourdomain>.yeeflow.com`.

Verified:

- App imported successfully.
- Imported app opened successfully.
- `Overview` app page rendered.
- `Control Test Requests` data list opened without `datas/query` 400.
- Seed sample row rendered.
- `Approval Form Controls Test` approval form opened.
- Representative controls rendered, including rich text editor, percent, checkbox, switch, datepicker, daterange, file upload, identity picker, internal lookup, and calculated subtotal.
- Submitted runtime test request:
  - Request Title: `Approval controls runtime test`
  - Quantity: `3`
  - Unit Price: `12`
  - Required Options: `Laptop`
  - Calculated Sub total updated to `36`
- Submit completed and showed the Yeeflow success state.
- Pending approval task opened.
- Review task page rendered readonly submitted values, Action Panel, and Flow History.
- Approval completed successfully.
- Pending task list became empty.
- `ContentList` created a persisted data-list record.
- Persisted record appeared in `Control Test Requests` with:
  - Request Title: `Approval controls runtime test`
  - Required Options: `["Laptop"]`
  - Active Request: `OFF`
  - Quantity: `3.00`
  - Sub total: `36.00`
  - Needed By: `14/05/2026`

Runtime status: passed.

## Known Gaps

- The checkbox field persisted as a JSON-like array display (`["Laptop"]`) in the list view. This is runtime-valid but should be studied further if a cleaner list-view display format is required.
- `Priority`, `Confidence`, `Service Window`, and `Related Record` were rendered but not filled in the runtime submission, so this baseline proves rendering and workflow compatibility, not every value-shape persistence path.
- File upload rendered safely, but no file was uploaded in this run.
- Organization, location, cost center, metadata, lookup-list, and sublist patterns remain deferred until their export-backed runtime patterns are proven.

## Generator Rules Confirmed

- Use the AI Training learned control shapes for representative native controls.
- Keep runtime-sensitive controls in warning mode until repeated generated baselines prove them broadly safe.
- Use calculated controls for formula-like fields such as subtotal.
- Use an internal packaged list for lookup proof when no external dependency is needed.
- Preserve the validation-plus-runtime loop before promoting a control type from schema-supported to generation-safe.
