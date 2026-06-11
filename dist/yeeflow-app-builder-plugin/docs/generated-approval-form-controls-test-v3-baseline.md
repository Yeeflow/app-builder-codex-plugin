# Generated Approval Form Controls Test v3 Baseline

Date: 2026-05-14

## Package

- App name: Approval Form Controls Test v3
- Generator: `generate-approval-form-controls-test-v3-upload-media.mjs`
- Decoded app definition: `approval-form-controls-test-v3-app-def.json`
- Approval form definition: `approval-form-controls-test-v3-approval-form-def.json`
- Data list definition: `approval-form-controls-test-v3-list-def.json`
- Generated package: `Approval Form Controls Test v3.generated.yap`
- User-accessible copy: `<downloads>/Approval Form Controls Test v3.generated.yap`
- ID family: `453...`
- FlowKey/form key: `AFC3`

Generated `.yap` and decoded package JSON artifacts stay out of Git. This document and the generator script are the tracked baseline.

## What This Proves

This stage proves the upload/media control batch after the successful v1 representative-control baseline and v2 advanced-input baseline.

Controls proved for workflow-form usage:

- `file-upload`
- `icon-upload`

Scope note: binary file/image persistence into data-list fields was intentionally deferred. v3 proves render, upload, submit, submitted-page display, reviewer-task display, approval completion, and text-summary `ContentList` persistence.

## Validation Results

Local checks passed:

- `node --check generate-approval-form-controls-test-v3-upload-media.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ywf-def.js`
- `node --check validate-ydl-list.js`
- `node --check workflow-action-config-validator.js`

Package and component validation:

- `validate-yap-package.js approval-form-controls-test-v3-app-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `validate-yap-graph.js approval-form-controls-test-v3-app-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `validate-ywf-def.js approval-form-controls-test-v3-approval-form-def.json --mode final`: `pass_with_warnings`, 0 errors.
- `validate-ydl-list.js approval-form-controls-test-v3-list-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `workflow-action-config-validator.js`: `pass`, 9 checked nodes, 0 errors, 0 warnings.

Wrapper build and round-trip validation:

- `build-yap-wrapper.js`: `pass`.
- Wrapper JSON, resource prefix, base64, gzip, resource JSON, and `Resource.Data` validation all passed.
- Decoded wrapper content matched the source app definition.
- Wrapped package validation and graph validation passed with expected upload/control support warnings only.

## Runtime Result

Runtime testing was completed in `https://<yourdomain>.yeeflow.com/`.

Verified:

- App imported successfully.
- Imported app opened successfully.
- `Upload Media Test Requests` data list opened without `datas/query` 400.
- Seed sample row rendered.
- `Approval Form Controls Test v3` approval form opened after publishing.
- `file-upload` rendered as the upload attachment control.
- `icon-upload` rendered as the upload image control.
- Uploaded safe test file: `<downloads>/yeeflow-upload-stage3-test.txt`.
- Uploaded safe test image: `<downloads>/yeeflow-upload-stage3-test.png`.
- Submit completed successfully.
- Submitted request detail showed:
  - file name `yeeflow-upload-stage3-test.txt`
  - image preview for the uploaded test PNG
- Reviewer task opened and displayed:
  - request title
  - requester
  - uploaded file name
  - uploaded image preview
  - notes
  - decision notes
  - Action Panel
  - Flow History
- Approval completed successfully.
- Submitted request status changed to `Completed`.
- `ContentList` created a persisted data-list row:
  - Request Title: `Upload media runtime test`
  - Upload Proof Scope: `File and image upload submitted in workflow form; binary persistence deferred.`

Runtime status: passed for Stage 3 workflow-form upload/media usage. Binary upload persistence to data-list file/image fields remains a future isolated proof.

## Generator Rules Confirmed

- `file-upload` can be generated from the AI Training export-backed shape with `attrs.ver`, `attrs.file_multiple`, `attrs.file_maxcount`, and `attrs.upload_btn`.
- `icon-upload` can be generated from the AI Training export-backed shape with `attrs.controlmultiple` and `attrs.maxselection`.
- Upload/media controls should usually span a full row in generated approval forms.
- Persist upload/media proof conservatively unless binary field persistence has been separately proven.
- For Stage 3, text-summary `ContentList` persistence is enough to prove workflow completion without claiming binary list persistence.

## Next Stage

Proceed to Stage 4 only after this baseline is committed:

- `organization-picker`
- `location-picker`
- `cost-center-picker`

Keep the next package isolated because these controls depend on tenant metadata.
