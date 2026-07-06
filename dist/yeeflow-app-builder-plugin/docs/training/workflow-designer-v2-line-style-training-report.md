# Workflow Designer V2 Line Style Training Report

## Objective

Train generated Approval form workflows, Data list workflows, and Scheduled workflows to use the current Yeeflow Workflow Designer graph attributes instead of legacy designer routing attributes.

## Reference Inputs

- User-provided `Approval form workflow reference.ywf`
- `employee-equipment-purchase-approval.v4.ywf`
- `approval-workflow-line-style-standard-analysis-report.md`

The reference comparison showed that the v4 workflow became aligned with the current designer after adding the v2 graph attributes while leaving `graphzoom` unchanged.

## Required Generation Rules

- Workflow root must include `lineType: "rounded"`.
- Workflow root must include `graphver: 2`.
- Preserve or default `graphzoom`; do not treat zoom differences as defects.
- Every `SequenceFlow.properties.linetype` must be `"rounded"`.
- Every `SequenceFlow.properties.documentation` must exist as a string. Empty string is valid.
- Every `SequenceFlow.dockers` must be an empty array so the current designer can auto-route rounded lines.
- Keep `vertices[]` only when the route needs explicit readability help: return/backward paths, overlap avoidance, node crossing, or long reroutes.
- Do not generate legacy `lineType: "orthogonal"`, `graphver: 1`, missing SequenceFlow documentation, or non-empty old-style docker arrays.

## Surfaces

This standard applies equally to:

- Approval form workflows inside `Forms[].DefResource`
- Data list workflows
- Scheduled workflows
- Standalone `.ywf` exports

## Validator Coverage

Generated-final validation should fail when:

- root `lineType` is missing or not `rounded`
- root `graphver` is missing or not `2`
- any `SequenceFlow` omits `properties.linetype = "rounded"`
- any `SequenceFlow` omits `properties.documentation`
- any `SequenceFlow` contains a non-empty `dockers[]`

`graphzoom` is intentionally not a hard gate.

## Proof Boundary

This is designer-shape and line-style training. It does not prove workflow execution, task assignment routing, publish behavior, or tenant-specific Job Position mapping.
