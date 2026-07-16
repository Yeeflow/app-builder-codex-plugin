# Yeeflow App Builder v0.9.71

## Scope

- Shared Markdown table parsing across Generation Readiness and its child planning validators.
- Escaped-pipe, inline-code-pipe, and fenced-example false-positive prevention.
- Workflow Set Data List List-variable parent/ListRef projection through generated-final materialization.
- Canonical List child expression parity in decoded `ContentList` for Approval and Scheduled workflows.

## Validation

- Source and dist Generation Readiness Markdown parser gates.
- Source and dist Workflow Set Data List planning and materialization gates.
- Source and dist Approval workflow publish-readiness regressions.
- Canonical Generation Readiness, YAPK cache-artifact, source/dist parity, Node syntax, archive integrity, and repository diff checks.

## Proof Boundary

This release proves deterministic Markdown planning parsing and generated package structure through decoded workflow definitions. It does not execute live workflow record mutations or claim tenant runtime execution of Set Data List actions.
