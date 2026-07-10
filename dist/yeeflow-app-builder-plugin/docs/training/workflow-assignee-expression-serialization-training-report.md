# Workflow Assignee Expression Serialization Training Report

## Trigger

A generated Approval Form reported this Designer configuration error on `Legal Triage`:

```text
Assignee variable json format is invalid
```

The generated file contained four invalid Applicant Line Manager assignments, while another task in the same workflow preserved the real export shape and remained valid.

## Root Cause

The materializer used generic `JSON.stringify()` for the outer Expression Button payload. That produced `${{...}}`. It also stored the Applicant application expression as plain JSON text instead of nested `${...}` variable JSON.

The previous guardrail tests used the same incorrect helper, and the validator classified manager assignments from labels such as `LineManager` without requiring the Expression Button to parse. Generation and validation therefore agreed with each other while disagreeing with Yeeflow Designer.

## Training Changes

- Added shared serializer/parser `scripts/lib/workflow-assignee-expression-utils.cjs`.
- Updated the full-app workflow materializer to use canonical Yeeflow variable JSON.
- Updated standalone YWF and package validators to recursively validate nested assignee expressions.
- Updated Applicant Line Manager, Applicant Department Manager, workflow user variable, workflow user variable manager, and multiple-assignee regression patterns.
- Added real-export canonical Applicant Line Manager text to the golden reference.
- Added negative regressions for `${{...}}`, plain JSON `param.id`, malformed nested expressions, unparseable buttons, and title/value mismatch.
- Preserved Job Position proof rules and direct-user safeguards.

## Focused Evidence

The updated standalone validator identifies the four malformed assignee nodes in the reported YWF with:

```text
WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID
```

The correctly exported assignee entry in the same workflow is not reported.

## Required Regression Commands

```text
node scripts/test-workflow-assignment-assignee-guardrails.mjs
node scripts/test-approval-ywf-form-structure-gates.mjs
node --check scripts/lib/workflow-assignee-expression-utils.cjs
node --check scripts/materialize-full-app-generated-final.mjs
node --check validate-yap-package.js
node --check validate-ywf-def.js
```

Run the same tests from `dist/yeeflow-app-builder-plugin` and require source/dist byte parity before release.

## Proof Boundary

This training proves canonical serialization and preflight rejection of malformed expressions. Designer open and runtime assignee routing remain separate proof layers.
