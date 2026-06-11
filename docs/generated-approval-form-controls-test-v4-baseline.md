# Generated Approval Form Controls Test v4 Baseline

Date: 2026-05-14

## Package

- App name: Approval Form Controls Test v4
- Generator: `generate-approval-form-controls-test-v4-pickers.mjs`
- Decoded app definition: `approval-form-controls-test-v4-app-def.json`
- Approval form definition: `approval-form-controls-test-v4-approval-form-def.json`
- Data list definition: `approval-form-controls-test-v4-list-def.json`
- Generated package: `Approval Form Controls Test v4.generated.yap`
- User-accessible copy: `/Users/Renger/Downloads/Approval Form Controls Test v4.generated.yap`
- ID family: `454...`
- FlowKey/form key: `AFC4`

Generated `.yap` and decoded package JSON artifacts stay out of Git. This document and the generator script are the tracked baseline.

## What This Proves

This stage tests the people and organization picker batch after the successful v1 representative-control baseline, v2 advanced-input baseline, and v3 upload/media baseline.

Controls tested:

- `identity-picker`
- `organization-picker`
- `cost-center-picker`
- `location-picker`

Runtime status:

- `identity-picker`: proven for editable single-select workflow-form usage.
- `organization-picker`: partially proven. It rendered and opened with tenant department data visible, but selected value retention was not proven in this sandbox.
- `cost-center-picker`: partially proven. It rendered and opened, but the sandbox returned no cost center rows.
- `location-picker`: partially proven. It rendered and opened, but the sandbox returned no matching location data.

Direct picker-value persistence into data-list picker fields was intentionally deferred. v4 uses safe text-summary `ContentList` persistence while proving form render, picker open/selection where possible, task display, approval completion, and list-record creation.

## Validation Results

Local checks passed:

- `node --check generate-approval-form-controls-test-v4-pickers.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ywf-def.js`
- `node --check validate-ydl-list.js`
- `node --check workflow-action-config-validator.js`

Package and component validation:

- `validate-yap-package.js approval-form-controls-test-v4-app-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `validate-yap-graph.js approval-form-controls-test-v4-app-def.json --mode generator --stage final`: `pass`, 0 errors.
- `validate-ywf-def.js approval-form-controls-test-v4-approval-form-def.json --mode final`: `pass_with_warnings`, 0 errors.
- `validate-ydl-list.js approval-form-controls-test-v4-list-def.json --mode generator --stage final`: `pass_with_warnings`, 0 errors.
- `workflow-action-config-validator.js`: passed during generator validation.

Expected warnings:

- Picker controls are environment-dependent.
- `organization-picker`, `cost-center-picker`, and `location-picker` remain runtime-sensitive for selection/persistence until tenant metadata is available and export-backed retention attrs are proven.
- `flex_grid` and token-color warnings are known validator warnings for the current generated design-system layout.

Wrapper build and round-trip validation:

- `build-yap-wrapper.js`: passed.
- Wrapper JSON, resource prefix, base64, gzip, resource JSON, and `Resource.Data` validation all passed.
- Decoded wrapper content matched the source app definition.
- Wrapped package validation and graph validation passed with expected warnings only.

## Runtime Result

Runtime testing was completed in `https://<yourdomain>.yeeflow.com`.

Verified:

- App imported successfully.
- Imported app opened successfully.
- `Picker Test Requests` data list opened without `datas/query` 400.
- Seed sample row rendered.
- `Approval Form Controls Test v4` approval form opened.
- `Requester` identity-picker resolved to `Renger from Yeeflow`.
- `Selected User` identity-picker opened the user selector, selected `Renger from Yeeflow`, retained the selection, and displayed it on submitted and reviewer pages.
- `organization-picker` rendered and opened the department picker. The tenant selector showed `Default`; selected value retention was not proven.
- `cost-center-picker` rendered and opened the cost center picker. No cost center rows were available in the sandbox.
- `location-picker` rendered and opened the location picker/dropdown. No matching location data was available in the sandbox.
- Submit completed successfully.
- Reviewer task opened.
- Reviewer task displayed:
  - request title
  - requester
  - selected user
  - notes
  - decision notes
  - Action Panel
  - Flow History
- Approval completed successfully.
- Submitted request status changed to `Completed`.
- `ContentList` created a persisted data-list row:
  - Request Title: `Picker controls runtime test`
  - Requester: runtime internal user ID value
  - Picker Proof Scope: `Picker controls submitted in workflow form; direct picker persistence deferred.`

Runtime status: passed for identity-picker workflow-form usage and partial for organization/cost-center/location picker render/open behavior.

## Generator Rules Confirmed

- Editable single-select `identity-picker` can be generated with the AI Training export-backed shape using `multiple: false` and `identity-maxselection: 1`.
- Current-user readonly identity display remains safe for requester context.
- Tenant-metadata pickers should be generated as optional unless selectable metadata and persistence are already proven.
- For `organization-picker`, render/open can be generated with the export-backed tree-select shape, but selected-value retention needs a focused working export before promotion to proven.
- For `cost-center-picker` and `location-picker`, render/open is safe enough for isolated tests, but value selection and direct persistence depend on tenant metadata availability.
- Persist safe text summaries until direct picker field persistence is proven.

## Next Stage

Proceed to Stage 5 only after this baseline is committed:

- `metadata`
- `mutiple-metadata`
- `tag`

Keep metadata/tag testing isolated because it depends on source/category metadata and multi-value shapes.
