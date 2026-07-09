# App Plan Referenced Resource Completeness Training Report

Date: 2026-07-09

## Scope

This focused training covers generated-final applications whose App Plan references a resource that was not planned or generated as a first-class resource.

The triggering example was the Internal Audit Workflow Management generation, where `Risk Categories` appeared as both:

- a Data List navigation target
- a lookup target for `Audit Observations.Risk category`

but `Risk Categories` was not included in the Data Lists and Document Libraries plan and was not generated in `Childs[]`.

## Required Rule

The App Plan must be reference-complete before full-app materialization:

- Data List or Document Library navigation targets must resolve to planned/generated Data Lists, or to planned Data Views whose host list is planned/generated.
- Lookup target lists named in Data List field tables must resolve to planned/generated Data Lists.
- The materializer must not emit lookup fields with empty `Rules` when the target list is missing.
- Missing referenced resources must fail before signing/install readiness and should fail during materialization when possible.

## New Hard Errors

- `APP_PLAN_NAVIGATION_DATA_LIST_TARGET_NOT_PLANNED`
- `APP_PLAN_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED`
- `FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED`

## Generator Contract

When a field table contains a lookup field, the generator must:

1. Parse the lookup target from the `Lookup Target`, `Target List`, `Lookup Data List`, `Lookup List`, or `Related List` column.
2. Resolve the target against generated Data List names.
3. Stop materialization if the target is missing.
4. Emit lookup `Rules` only after the target list ID is known.

Returning `Rules: ""` for a planned lookup field is forbidden because it creates downstream lookup, default-view, navigation, and seed-data failures that obscure the real App Plan defect.

## Validator Contract

`scripts/validate-generated-final-resource-completeness.mjs` must compare both declared resources and referenced resources. It should fail even if the decoded package is otherwise schema-valid.

`scripts/yapk-first-generation-preflight.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md> --json` inherits this check through generated-final resource completeness.

## Regression Coverage

The regression suite now includes:

- `scripts/test-generated-final-resource-completeness-gates.mjs`
  - catches unplanned Data List navigation targets
  - catches unplanned lookup targets
- `scripts/test-app-plan-referenced-resource-completeness-gates.mjs`
  - verifies materializer refusal before emitting lookup fields with empty rules

## Proof Boundary

This training proves local generator/validator behavior only. It does not claim signing, install, seed-data, browser runtime, or designer proof for the Internal Audit application.
