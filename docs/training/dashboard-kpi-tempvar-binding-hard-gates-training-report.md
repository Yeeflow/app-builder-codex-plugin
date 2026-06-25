# Dashboard KPI Temp Variable Binding Hard Gates Training Report

## Summary

This training responds to the `0.8.39` Office Asset Loan Management clean-room reverification. Version `0.8.39` made visible progress on Dashboard v1.1 materialization, Collection template diversity, select filters, canonical Content padding, and multiselect layout width. The run still stopped correctly before signing because generated Dashboard KPI cards retained source-template Event Portfolio temp variables that were not declared on the generated business Dashboard pages.

The fix makes Dashboard KPI Summary/temp variable binding a generated-final hard gate and updates the standalone materializer so every visible KPI value is rebound to a page-local temp variable backed by a Summary control.

## Source Finding

The `0.8.39` verification found:

- active plugin and cache were `0.8.39`;
- OAuth and `flowcraft / Codex Mini` workspace discovery passed;
- multiple Dashboard Collection templates were materialized;
- select filters and Collection filter variable bindings were generated;
- generated-final signing was correctly skipped;
- KPI consistency failed because only the first KPI used a page-local Summary temp variable while the other KPI values still referenced source-template variables.

The failing source-template variables included:

- `__temp_event_portfolio_approved_budget`;
- `__temp_event_portfolio_registration_rate`;
- `__temp_event_portfolio_lead_follow_up`.

These variables belong to the Marketing Event Management golden reference and must not remain in generated business Dashboards unless they are explicitly declared and backed by the generated page's own Summary model. For normal generated business apps they must be replaced by page-local temp variables.

## Changes

- Updated the standalone full-app materializer to create one KPI contract per visible KPI card.
- Generated a hidden Summary control for each dynamic KPI value instead of only the first KPI.
- Declared every KPI temp variable in the page resource `tempVars`.
- Added every Summary ID to `Resource.ReportIds`.
- Added one matching Summary metadata entry per KPI in `Resource.exts`.
- Rebound every visible KPI value text control through `attrs.headc.title.variable` to a generated page-local temp variable.
- Added Dashboard hard-gate validation for source-template KPI temp variable residue.
- Added Dashboard hard-gate validation for visible KPI temp variables that are not declared in the same page resource.
- Added regression tests for both source-template residue and undeclared KPI temp variable references.
- Updated full-app generation standards and application generator skill guidance so this is treated as a signing-readiness blocker, not a visual warning.

## Regression Coverage

The focused Dashboard hard-gate suite now includes:

- a valid v1.1 Dashboard with all KPI value controls bound to declared page-local temp variables;
- a failure case for visible KPI values that reference Event Portfolio source-template variables;
- a failure case for visible KPI values that reference undeclared generated temp variables.

A local Office Asset Loan Management regression was also run against the saved `0.8.39` planning artifacts. The regenerated package passed first-generation preflight and the dedicated KPI temp variable scan found no source-template KPI variable residue and no undeclared KPI variable references. This local regression did not sign, install, seed data, run Version Management, or perform browser/runtime proof.

## Safety Boundary

This training does not claim install or runtime readiness. It only closes the generated-final signing-readiness gap where KPI card dynamic text could preserve source-template temp variable bindings after template clone-and-map. Signing, `verifysign`, install/import, Version Management, seed-data writes, and browser/runtime proof remain separate gated stages.
