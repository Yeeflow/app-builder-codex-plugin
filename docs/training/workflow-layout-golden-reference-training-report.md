# Workflow Layout Golden Reference Training Report

## Objective

Train the plugin to generate readable workflow diagrams for Approval form workflows, Data list workflows, and Scheduled workflows. The training focuses on node placement and SequenceFlow routing only. It intentionally ignores the specific business semantics of the provided examples.

## References Studied

- `workflow_ref_ememo.json`
- `workflow_ref_expense_reimbursement.json`

The source files were inspected read-only. Raw exports are not bundled into the plugin.

## Extracted Patterns

- Complex workflows use a main path with clear horizontal progression.
- Branches, rejection, cancellation, and exception paths move to separate vertical lanes.
- Long or cross-lane transitions use rounded line style and/or explicit `vertices[]`.
- Nodes carry top-level `position.x` and `position.y`.
- SequenceFlow elements reference source and target node ids and may include `vertices[]` for routing.
- Large workflows reserve enough graph area rather than placing all nodes in one small cluster.

## Plugin Changes

- Added `docs/reference/workflow-layout-golden-references.json`.
- Added `docs/standards/workflow-layout-golden-reference-standard.md`.
- Added `scripts/validate-workflow-layout-golden-reference.mjs`.
- Added `scripts/test-workflow-layout-golden-reference-gates.mjs`.
- Added the workflow layout gate to `scripts/yapk-first-generation-preflight.mjs`.
- Updated full-app materialization so generated approval workflow graphs use spaced lanes and vertex-routed rejected/cross-lane SequenceFlow paths.
- Updated cache artifact expectations and package-validator guidance.

## Proof Boundary

This is export-proven and validator-backed layout training. It does not claim that workflow execution, approval routing, task assignment, or publish behavior is runtime-proven by the two reference files.

## Required Follow-Up Validation

Generated-final packages containing workflows must pass:

```bash
node scripts/validate-workflow-layout-golden-reference.mjs --package <generated-final.yapk>
node scripts/yapk-first-generation-preflight.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md> --json
```
