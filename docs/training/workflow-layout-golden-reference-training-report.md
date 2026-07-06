# Workflow Layout Golden Reference Training Report

## Objective

Train the plugin to generate readable workflow diagrams for Approval form workflows, Data list workflows, and Scheduled workflows. The training focuses on node placement and SequenceFlow routing only. It intentionally ignores the specific business semantics of the provided examples.

## References Studied

- `workflow_ref_ememo.json`
- `workflow_ref_expense_reimbursement.json`
- `Workflow actions layout.json`

The source files were inspected read-only. Raw exports are not bundled into the plugin.

## Extracted Patterns

- Complex workflows use a main path with clear horizontal progression.
- Branches, rejection, cancellation, and exception paths move to separate vertical lanes.
- Long or cross-lane transitions use rounded line style and/or explicit `vertices[]`.
- Nodes carry top-level `position.x` and `position.y`.
- SequenceFlow elements reference source and target node ids and may include `vertices[]` for routing.
- Large workflows reserve enough graph area rather than placing all nodes in one small cluster.
- Approval Assignment Task nodes require at least `Approved` and `Rejected` outgoing SequenceFlows.
- Complete Assignment Task nodes require canonical `Completed` outcome spelling.
- Business-field branch fan-out, such as amount thresholds, must use an `InclusiveGateway` before branching.
- Branch targets from the same Inclusive Gateway should align on one vertical column when they represent sibling choices.
- A shared `EndRejectEvent` should collect no more than three adjacent Approval Assignment Task rejection paths.
- A single `EndRejectEvent` should sit vertically above or below the source task, or centered above/below a two- or three-task source group by node center points.
- For first-row Approval Assignment Tasks, the shared `EndRejectEvent` must be placed above the source row. For lower-row Approval Assignment Tasks, the shared `EndRejectEvent` must be placed below the source row.
- A shared `EndRejectEvent` may only collect rejected paths from Approval Assignment Tasks on the same horizontal lane. Approval Assignment Tasks on different y lanes require separate rejection endpoints.
- Workflow diagrams should use the Workflow Designer's roughly 16:9 visible canvas. Complex workflows should use additional rows/layers instead of placing every node on one long horizontal line, and generated workflows should not exceed five vertical rows.
- Standard forward rejected/cross-lane lines do not require explicit `vertices[]` when the spacing already prevents overlap. Backward/return lines still require vertices.
- Long return/backward connectors that cross more than two workflow rows must not calculate `routeY` from only the source and target rows. They must use an open adjacent row-gap midpoint and must not place the horizontal segment inside any intermediate row's node bounds.
- Long connectors with vertical route segments must also calculate a safe `routeX` from adjacent column gaps. Vertical segments must not pass through intermediate workflow node bounds or sit on a task/gateway center line when a column-gap midpoint is available.

## Workflow Actions Layout V2 Standard

The focused workflow actions reference establishes these minimum/recommended geometry rules:

| Rule | Standard |
| --- | --- |
| Main approval lane | Stable horizontal backbone, commonly around the same `y` value |
| Start to first task | About 305 px |
| Task to task | About 335 px |
| Task to gateway | About 320 px |
| Gateway to branch targets | About 195 px minimum |
| Approval task reject end | Above or below by at least 110-125 px |
| Gateway branch targets | Same `x` column within about 80 px |
| Shared rejection endpoint | Maximum 3 approval task sources |
| Shared rejection source lane | All sources must be on the same horizontal lane within about 40 px |
| Designer canvas usage | Prefer roughly 16:9 visible area instead of one-row sprawl |
| Maximum vertical rows | 5 rows/layers |

The plugin validator now checks the semantic layout contract, not just visual coordinates:

- `WORKFLOW_LAYOUT_APPROVAL_TASK_OUTCOME_MISSING`
- `WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSING`
- `WORKFLOW_LAYOUT_COMPLETE_TASK_OUTCOME_MISSPELLED`
- `WORKFLOW_LAYOUT_BUSINESS_BRANCH_GATEWAY_MISSING`
- `WORKFLOW_LAYOUT_GATEWAY_BRANCH_COLUMN_MISMATCH`
- `WORKFLOW_LAYOUT_BACKWARD_FLOW_VERTICES_MISSING`
- `WORKFLOW_LAYOUT_END_REJECT_TOO_MANY_SOURCES`
- `WORKFLOW_LAYOUT_END_REJECT_SOURCE_LANES_MISMATCH`
- `WORKFLOW_LAYOUT_END_REJECT_POSITION_MISMATCH`
- `WORKFLOW_LAYOUT_TOO_MANY_VERTICAL_ROWS`
- `WORKFLOW_LAYOUT_SINGLE_ROW_SPRAWL`
- `WORKFLOW_LAYOUT_ROUTE_Y_CROSSES_INTERMEDIATE_ROW`
- `WORKFLOW_LAYOUT_ROUTE_X_CROSSES_INTERMEDIATE_COLUMN`

## Plugin Changes

- Added `docs/reference/workflow-layout-golden-references.json`.
- Added `docs/standards/workflow-layout-golden-reference-standard.md`.
- Added `scripts/validate-workflow-layout-golden-reference.mjs`.
- Added `scripts/test-workflow-layout-golden-reference-gates.mjs`.
- Added the workflow layout gate to `scripts/yapk-first-generation-preflight.mjs`.
- Updated full-app materialization so generated approval workflow graphs use spaced lanes and vertex-routed rejected/cross-lane SequenceFlow paths.
- Updated full-app materialization so generated approval workflow `EndRejectEvent` nodes are placed vertically above the approval source task group instead of being pushed to the far right.
- Updated full-app materialization and validation so shared `EndRejectEvent` placement is calculated from source task center points. Three-source groups now center on the source span center rather than a fixed coordinate or top-left x value.
- Updated the workflow layout gate so first-row approval tasks require reject endpoints above the row, while lower-row approval tasks require reject endpoints below the row.
- Updated the workflow layout gate so standard-spaced rejected/cross-lane lines are allowed without vertices, while explicit return/backward lines still require vertices.
- Updated the workflow layout gate and materializer so multi-row return/backward connectors choose a safe adjacent row-gap midpoint; a route such as `y = 363` is now rejected when it passes through an intermediate row occupying `y = 320..406`.
- Updated the workflow layout gate and materializer so long connector vertical segments choose a safe adjacent column-gap midpoint; vertical route segments are now rejected when they pass through an intermediate node's column bounds.
- Updated the workflow layout gate so shared `EndRejectEvent` nodes can only collect rejected paths from Approval Assignment Tasks on the same horizontal lane.
- Updated the workflow layout gate so generated diagrams fail when they exceed five vertical rows or when large workflows are collapsed into a single over-wide horizontal row instead of using the 16:9 canvas area.
- Updated the workflow designer style gate so generated Approval, Data list, and Scheduled workflow graphs use Workflow Designer v2 attributes: root `lineType = "rounded"`, root `graphver = 2`, each `SequenceFlow.properties.linetype = "rounded"`, each `SequenceFlow.properties.documentation` present as a string, and each `SequenceFlow.dockers = []`. `graphzoom` is intentionally excluded as a hard gate.
- Updated cache artifact expectations and package-validator guidance.

## Proof Boundary

This is export-proven and validator-backed layout training. It does not claim that workflow execution, approval routing, task assignment, or publish behavior is runtime-proven by the two reference files.

## Required Follow-Up Validation

Generated-final packages containing workflows must pass:

```bash
node scripts/validate-workflow-layout-golden-reference.mjs --package <generated-final.yapk>
node scripts/yapk-first-generation-preflight.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md> --json
```
