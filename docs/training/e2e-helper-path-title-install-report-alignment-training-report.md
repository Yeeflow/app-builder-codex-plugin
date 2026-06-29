# E2E Helper Path, Title, and Install Report Alignment Training

## Context

Office Asset Loan Management clean full E2E passed with `yeeflow-app-builder@yeeflow 0.8.90`, including planning gates, generated-final preflight, signing, package install submission, Version Management `Succeed`, live record import, and Dashboard runtime proof.

The pass exposed follow-up helper/reporting issues that did not block the package but made the handoff less precise:

- `yapk-first-generation-preflight.mjs` resolved relative `--plan` paths from the plugin root instead of the caller working directory.
- `materialize-full-app-generated-final.mjs` could derive the app title from the Markdown document heading and retain the `- Yeeflow App Plan` document suffix.
- `yeeflow-package-api-automation.mjs` reported HTTP 200 / API `Status: 0` submitted installs as `ok: false`, even though this is an accepted asynchronous materialization request.
- The package API helper withheld the canonical application link for submitted installs, even when the decoded package root `ListSetID` and OAuth tenant URL were safely available.

## Training Rules

1. Relative planning artifact paths must resolve from the caller working directory for CLI usage.
   - Absolute paths remain valid.
   - Programmatic callers may still pass an explicit `cwd`.
   - Gate scripts still execute from the plugin root so internal script paths remain stable.

2. Full-app materialization must prefer the App Plan application name over the Markdown document heading.
   - Prefer explicit `Application name:` or `Application Name` table values.
   - Strip document suffixes such as `- Yeeflow App Plan`.
   - Do not append planning artifact names to the generated `ListSet.Title` or wrapper `Title`.

3. Package API reporting must distinguish request acceptance from final live success.
   - HTTP 200 / API `Status: 0` for install/import/upgrade submit means the request was accepted for asynchronous processing.
   - It is not Version Management success and not browser/runtime proof.
   - Reports must expose `apiAccepted`, `finalResultKnown`, `finalSuccess`, and `versionManagementRequired` so downstream summaries do not conflate proof layers.

4. Canonical application links should be emitted when safe.
   - For fresh YAPK installs, prefer the decoded package root `ListSetID` over API `Data.ID`, because API `Data.ID` may be a log or task identifier.
   - Only emit a link when a safe tenant URL and a real ListSetID are available.
   - Keep the proof boundary clear: the link is an access target, not runtime proof.

## Regression Coverage

- `scripts/test-full-app-materialization-entrypoint-gates.mjs`
  - Verifies App Plan application name extraction without `- Yeeflow App Plan` suffix leakage.
  - Verifies first-generation preflight resolves relative package, plan, and ID provenance paths from caller `cwd`.

- `scripts/test-package-api-upload-response-parsing.mjs`
  - Verifies submitted install semantics report `apiAccepted: true`, `finalResultKnown: false`, `finalSuccess: false`, and `versionManagementRequired: true`.
  - Verifies canonical application link generation remains available for submitted installs with decoded package root proof.

## Proof Boundary

This training does not change generator resource materialization, signing, live install behavior, or stable release metadata. It aligns local helper semantics and reporting so successful E2E runs produce clearer proof artifacts and future regressions around path resolution, app title derivation, and install acceptance reporting fail locally before handoff.
