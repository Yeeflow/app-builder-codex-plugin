# YAPK Upgrade Scope, Lineage, And Version Management Gates Training Report

Training branch: `codex/yapk-upgrade-scope-lineage-version-management-gates`

Baseline: stable `yeeflow-app-builder@yeeflow 0.8.3`

Primary input:

`/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260621-223735-clean-id-reinstall/upgrade-loan-transactions-field-20260621-2300/validation/upgrade-package-generation-hard-gate-analysis.md`

## Summary

This training adds local hard gates for existing-app YAPK upgrade packages. Upgrade packages must now be scope-specific, ID-stable, lineage-correct, report-safe, Version Management proven, and runtime-proven. Schema validation, signing, `upgrade-check-yapk`, and `upgrade-apply-yapk` API status `0` are not final success proof.

## New Gates

- `scripts/validate-yapk-upgrade-scope.mjs`
  - requires an explicit upgrade scope manifest
  - blocks field-only/list-only upgrades that mutate dashboards, approval forms, workflows, navigation, reports, or unrelated lists
  - validates upgrade wrapper identity boundaries
  - validates approval DefResource upgrade readiness when approval forms are included
- `scripts/validate-yapk-upgrade-report-scope.mjs`
  - blocks FormNewReports/DataReports in field-only/list-only upgrades unless reports are explicitly in scope
  - requires report proof showing each included report is new or update-safe
  - blocks duplicate existing reports without update-safe proof
- `scripts/inspect-yapk-upgrade-version-row.mjs`
  - treats API status `0` as submitted/accepted only
  - requires submitted PackageId Version Management row status `Succeed`
  - fails missing, ambiguous, `Failed`, or non-final rows
  - requires sanitized error-log capture for failed rows
  - requires separate runtime proof after `Succeed`
- `scripts/validate-yapk-upgrade-id-stability.mjs`
  - now rejects layout semantic keys that omit list title, layout title, layout type, and index/equivalent disambiguator
- `validate-yapk-package.js`
  - now requires default-view `LayoutView.query[]` FieldID to match visible `LayoutView.layout[]` FieldID for the same FieldName
- `scripts/yeeflow-package-api-automation.mjs`
  - now classifies `upgrade-apply-yapk` API status `0` as `upgrade_submitted`, not final success

## Report Findings Covered

- Visible field missing from `LayoutView.query`: covered by `DEFAULT_VIEW_QUERY_FIELDS_MISSING`.
- FieldID mismatch between layout/query: covered by `DEFAULT_VIEW_QUERY_FIELD_ID_MISMATCH`.
- Duplicate same-title layout semantic keys: covered by `UPGRADE_LAYOUT_SEMANTIC_KEY_UNDISAMBIGUATED` and existing duplicate-key checks.
- Existing reports included in field-only upgrades: covered by `UPGRADE_REPORT_OUT_OF_SCOPE`.
- Update-safe intentional reports: covered by report proof handling.
- Dashboard, approval form, workflow, and navigation drift outside field-only/list-only scope: covered by upgrade scope validation.
- Numeric/first-install wrapper identity in upgrade packages: covered by upgrade wrapper identity checks.
- API status `0` overclaim: covered by `upgrade_submitted` classification and Version Management row inspection.
- Version Management failure without error log: covered by `UPGRADE_ERROR_LOG_MISSING`.
- Version Management `Succeed` plus runtime field proof: covered by runtime proof requirements.
- Approval DefResource upgrade readiness: covered by UUID page ID, Main/Content, unique designer control ID, graph position, task URL, assignee, and Approved/Rejected route checks.

## Validation

Training validation should include:

- `git diff --check`
- `node --check` for changed `.mjs`
- `node scripts/test-yapk-upgrade-scope-hard-gates.mjs`
- `node scripts/test-yapk-upgrade-id-stability.mjs`
- existing generated-final export-shape/materialization suite
- YAPK schema gates
- YAPK package validation gates
- approval form/export-shaped YAP validators
- dashboard hard gates
- Functional Spec/App Plan/planning suites
- aggregate UI hard gates
- YAPK cache artifact checks
- metadata inspection expecting `0.8.3`
- source/dist mirror checks
- release safety audit
- changed-file private/forbidden artifact scan

## Safety

- No version bump in this training branch.
- No stable movement.
- No tags/releases/plugin archives.
- No live Yeeflow writes.
- No signing/install/import/upgrade.
- Upgrade API and Version Management proof gates are implemented as local validators/tests only.

## Recommendation

After the training PR is reviewed and merged, prepare a separate release bump PR. Do not combine the training changes with a release/version bump.
