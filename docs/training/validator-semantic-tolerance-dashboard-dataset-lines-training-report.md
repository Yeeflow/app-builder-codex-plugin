# Validator Semantic Tolerance And Dashboard Dataset Line Scope Training Report

## Source

This training addresses the remaining `0.8.16` regression findings from:

`/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-170528-0815-full-e2e-collection-templates/validation/plugin-0.8.16-regression-20260623-175038/plugin-0.8.16-regression-verification-report.md`

## Problems

1. `validate-dashboard-dataset-presentation-golden-references.mjs` still collected broad prose lines as Dashboard dataset regions when they mentioned words such as dashboard, collection, Form report, validation commands, or Data list. App Plans should not need workaround wording such as `no dashboard dataset`.
2. `validate-app-plan-resource-order.mjs` still depended on several exact sentences even when the App Plan preserved the same business intent with equivalent wording.

## Changes

- Dashboard dataset presentation App Plan validation now parses canonical Markdown tables in the Dashboard Pages Plan and validates rows that are truly dataset-presentation rows:
  - tables with `Selected Collection Presentation Reference`
  - Dashboard dataset/source/section context
  - Collection selected as the record display control when a control column exists
- Unknown Collection template scanning is scoped to those dataset rows only.
- Non-dataset prose, Form Report explanations, validator command lists, identity tables, and negative guardrails are ignored.
- App Plan resource-order validation now accepts semantic equivalents for required planning intent, including:
  - `Submission fields`
  - `Task page fields`
  - `Form reports are independent approval-based resources`
  - `Form reports are separate from Dashboard/page planning`
  - `Unsupported shapes should not be generated`
  - `No Sub List actions are needed`

## Regression Coverage

- Added a Dashboard dataset presentation regression proving non-dataset prose and validator command text do not require workaround text.
- Preserved failure coverage for missing Collection presentation references, unknown references, mismatched rationale, multiple selected references, and generated package Collection conformance.
- Added an App Plan resource-order regression proving semantic-equivalent wording passes without relaxing canonical heading, table schema, resource-order, or low-level implementation leakage checks.

## Proof Boundary

This training fixes validator false positives only. It does not change package generation behavior, signing, install/import, upgrade, runtime browser proof, or live Yeeflow API behavior.
