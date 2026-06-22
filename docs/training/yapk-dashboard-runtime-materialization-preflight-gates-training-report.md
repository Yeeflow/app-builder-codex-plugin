# YAPK Dashboard Runtime Materialization And Preflight Gates Training Report

## Purpose

This training captures the 0.8.9 Office Asset Loan validation findings where generated packages could pass partial local checks while still containing runtime-risk dashboard and package materialization defects.

The fix keeps Functional Specification and App Plan documents business-focused. These rules apply during generated-final package generation, signing readiness, and validation.

## Issues Covered

- Generated-final signing readiness must run full first-generation preflight before `setsign`.
- API status `0` is submitted/accepted evidence only, not final install or upgrade success.
- Final success requires Version Management `Succeed` evidence and separate browser/runtime proof.
- Generated-final YAPK packages must not embed sample rows in `Childs[].ListDatas` or `Childs[].List.ListDatas`.
- KPI cards that claim live metrics must be backed by Summary controls, `ReportIds`, `exts`, `tempVars`, `attrs.save_var`, and visible KPI bindings.
- Dashboard filters must be consumed by Collection/table/KPI query/filter metadata and must not use bare placeholder operator/value shapes such as `0`.
- `page_title_section` must remain title/header-only.
- Grid-table record regions must use real Collection subtree patterns, not simplified Data table lookalikes.
- Each primary grid-table Collection needs an independent wrapper.
- User/identity fields must render with Dynamic user controls; non-user fields must not.
- App Plan parser failure-open cases must fail resource completeness validation when a non-empty resource-like plan yields no parsed resources.

## New Or Updated Gates

- `scripts/validate-generated-yapk-export-shape.mjs`
- `scripts/validate-dashboard-generation-hard-gates.mjs`
- `scripts/validate-generated-final-resource-completeness.mjs`
- `scripts/validate-standard-package-schema.mjs`
- `validate-yapk-package.js`
- `scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs`
- aggregate UI/YAPK cache registrations

## Validation

The focused regression suite covers:

- KPI cards without Summary runtime proof fail.
- Embedded `ListDatas` fail canonical/generated-final validation.
- Non-empty resource-like App Plans that parse to zero resources fail closed.
- Business controls inside `page_title_section` fail.
- Unconsumed filters and placeholder operator/value metadata fail.
- Shared grid-table wrappers fail.
- Identity/user fields rendered as generic Dynamic field controls fail.

## Safety

This training does not change plugin version metadata, release docs, stable refs, tags, plugin archives, signing behavior, install/import behavior, or live Yeeflow write behavior.
