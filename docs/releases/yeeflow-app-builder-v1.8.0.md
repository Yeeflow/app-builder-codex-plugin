# Yeeflow App Builder v1.8.0

## Summary

v1.8.0 adds formal, reusable Tab and linked-activity Gantt golden references to the Yeeflow App Builder Plugin. It retains the v1.7.2 responsive Table/Card Collection defaults and adds a strict control-level contract for business forms that use peer content sections and related activity schedules.

## Included changes

- Add `tab_control_workspace`: an `aktabs` root with direct `ak-tabs-tab` children, stable identifiers, non-empty content, and exactly one explicit runtime and Designer default.
- Add `gantt_control_linked_activity`: a parent-record Gantt pattern with a resolved Activity source, current-parent filter, Add default propagation, and a concrete Type 1 activity detail/View layout.
- Validate Start/End against `Datetime` fields; Dependency against a same-source multi-value Lookup; Percent Complete against Decimal storage plus percent control and a normalized `0..1` range; and optional Parent against a same-source single-value Lookup.
- Distribute source and Plugin-mirror templates, registry, standard, study, training report, validator, and positive/negative regression test.
- Extend Application, Dashboard, and Data List generation guidance to select these references and to preserve the boundary between configuration readback and runtime proof.

## Validation

- Strict Tab/Gantt structural and negative-regression validation: PASS.
- Source/distribution mirror parity: PASS.
- JavaScript syntax, plugin/MCP contract, skill-relative-reference, and repository-hygiene gates: PASS.

## Proof boundary

This release proves the Plugin’s bundled structures, strict validation, and configuration-derived field mapping. It does not by itself prove generated Data List form Designer rendering, task scheduling, dependency execution, Add default behavior, task-detail navigation, or end-user runtime behavior. Those claims require an exact-tag private Marketplace install and focused tenant/runtime evidence.
