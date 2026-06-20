# Page Function Plan Business Requirement Template Training Report

## Summary

- Training branch: `codex/page-function-plan-business-requirement-template`
- Baseline plugin version: `0.7.1`
- Release target after merge: `0.7.2` in a separate release PR
- Version bump in this PR: No

This training refines the Page Function Plan standard so it is a business/page-function contract after the Yeeflow App Plan, using the Facility Operations Dashboard-style document as the model. The Page Function Plan now emphasizes page purpose, users, business questions, data sources, field usage, filters, metrics, main and secondary regions, action intent, and mobile behavior.

## Responsibility Split

- Functional Specification: high-level business and user page needs.
- Yeeflow App Plan: resource contract, data lists, fields, workflows, forms, actions, dashboards, navigation, roles, and permissions.
- Page Function Plan: page-level business requirements, data-region requirements, field usage, filters, sorting/grouping, action intent, role behavior, and mobile behavior.
- Application Design System: app layout, visual system, tokens, and header/navigation style.
- Dashboard Pattern Library / Golden Reference: dashboard layout and section pattern selection.
- Resource generator: actual Yeeflow controls, property shapes, bindings, and resource JSON using verified plugin-supported capabilities and existing hard gates.

## Validator Changes

`scripts/validate-page-function-plan.mjs` now checks Dashboard Page Function Plan entries for business-functional completeness:

- concrete business purpose and business questions
- data source to field usage
- page filter source list, field, logic, affected regions, and mobile behavior
- summary metric source fields, calculation logic, filter scope, and formatting expectation
- main data region display fields, default sorting, action intent, role behavior, and mobile behavior
- mobile support priority, filters, actions, and visible indicators
- business-level design intent

The validator also rejects vague entries such as “show dashboard data”, “add filters”, “display list”, and “show summary cards” when they lack source data, fields, filter logic, or business purpose. It fails Page Function Plan business sections that prescribe low-level implementation details such as exact Container nesting, Yeeflow property paths, arbitrary CSS, or resource JSON.

Existing Page Function Plan traceability, Dashboard template/golden-reference, Container/Button action, Dashboard Text style, and UI hard-gate tests remain active as downstream generation safeguards.

## Regression Coverage

`scripts/test-page-function-plan-gates.mjs` now includes focused Facility Operations-style Page Function Plan cases:

- pass: rich business/page-function Dashboard PFP with data sources, fields, filters, metrics, regions, actions, and mobile behavior
- fail: vague Dashboard PFP without fields/filter mappings
- fail: PFP that dictates low-level control JSON/properties
- pass: PFP that describes business-level design intent without prescribing implementation

The existing App Plan to Page Function Plan traceability cases remain in place so PFP page references still map back to App Plan resources, source lists, fields, and supported actions.

## Safety Notes

- No version bump was made.
- No `stable` movement was made.
- No tags, GitHub releases, or plugin archives were created.
- No live Yeeflow writes, signing, install/import, or upgrade actions were run.
- Unrelated duplicate ` 2` / ` 3` files were left untouched.
