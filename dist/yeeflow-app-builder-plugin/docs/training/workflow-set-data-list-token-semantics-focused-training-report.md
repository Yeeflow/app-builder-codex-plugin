# Workflow Set Data List Token Semantics Focused Training Report

## Objective

Prevent invalid workflow expression tokens from reaching generated `ContentList` mappings and filters. This training covers Approval Form workflows, Scheduled workflows, and Data List workflows.

## Root Cause

The previous App Plan validator checked the outer `Mappings JSON` and `Filters JSON` arrays but did not recursively validate expression token kinds or compare workflow-variable tokens with a declared variable contract. `buildWorkflowSetDataListProperties` preserves canonical plan JSON, so an upstream token such as `exprType: "workflow-field"` could be copied directly into the package.

## Implemented Contract

- Approval Form and Scheduled workflows allow `variable`, `application`, and `loop_ctx` expression sources.
- Data List workflows additionally allow current-record `list_field` sources.
- `workflow-field` and all other unknown expression source kinds fail before materialization.
- Every `exprType: "variable"` token requires a `Workflow Variable Declarations JSON` entry.
- A declaration includes `id`, workflow-variable `type`, token `valueType`, business `name`, canonical `expressionName`, and optional child-field `key`.
- Tokens match declarations exactly by `id`, optional `key`, case-normalized `valueType`, and canonical expression name.
- Declarations for child fields of one List variable must preserve one parent variable type and business name.

## Hard Gates

- `WORKFLOW_SET_DATALIST_PLAN_WORKFLOW_SOURCE_TOKEN_KIND_INVALID`
- `WORKFLOW_SET_DATALIST_PLAN_WORKFLOW_VARIABLE_DECLARATION_MISMATCH`

## Regression Coverage

`scripts/test-workflow-set-data-list-plan-gates.mjs` covers:

- valid Approval Form and Scheduled List-variable mappings;
- valid Data List current-field and declared workflow-variable usage;
- invalid Approval and Scheduled `workflow-field` tokens;
- missing workflow-variable declarations;
- mismatched variable `valueType`;
- mismatched canonical expression name;
- Data List workflow declaration mismatch;
- existing bulk Sub list source contracts.

The materialization and Approval publish-readiness fixtures now carry the same declaration contract and continue to pass.

## Proof Boundary

This is validator-backed generation prevention and regression proof. It does not claim that a live tenant mutation was executed. Runtime proof remains separate from planning, materialization, package validation, signing, and install acceptance.
