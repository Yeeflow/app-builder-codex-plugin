# Workflow Layout Golden Reference Standard

Generated Yeeflow workflow diagrams must be readable before signing readiness. This standard applies to Approval form workflows, Data list workflows, and Scheduled workflows.

The workflow layout golden reference is based on export-proven workflow JSON examples and screenshot-backed layout review:

- `workflow_ref_ememo`: a complex horizontal approval workflow with branch gateways, lower-lane cancellation/rejection handling, and vertex-routed long transitions.
- `workflow_ref_expense_reimbursement`: a larger reimbursement workflow with multi-lane branching, optional reviewer paths, finance actions, and rounded/vertex-routed sequence flows.
- `workflow_actions_layout`: a focused action-layout reference with Start, Approval Assignment Tasks, Complete Assignment Tasks, Inclusive Gateway amount branches, shared End with Rejection nodes, and one rejected return line using explicit vertices.

## Scope

This standard validates visual workflow graph layout only:

- node coordinates
- graph spacing
- Assignment Task outcome lines
- Inclusive Gateway branch structure
- End with Rejection placement and grouping
- branch/reject lane separation
- SequenceFlow line style
- Workflow Designer v2 graph attributes
- SequenceFlow vertices for return/backward, overlap, node crossing, and long reroute cases
- graphposition coverage

It does not prove business behavior, assignment correctness, workflow execution, publish success, or runtime task routing.

## Generation Rules

1. Every non-`SequenceFlow` workflow node must have a top-level `position` object with numeric `x` and `y`.
2. Nodes must not share identical coordinates.
3. Nodes must not use near-identical coordinates where both `x` and `y` deltas are below the golden-reference near-collision threshold.
4. Complex workflows must not be compressed into a single small cluster. Main-path steps should use a horizontal column gap of about `335px`, with a minimum of `305px` for adjacent task columns.
5. Approval Assignment Tasks must have at least `Approved` and `Rejected` outcome SequenceFlows.
6. Complete Assignment Tasks must have a `Completed` outcome SequenceFlow; `Completed` is the canonical spelling.
7. Business-field branches such as `Amount >= 5000` / `Amount < 5000` must be modeled through an `InclusiveGateway`, not as direct condition fan-out from an Assignment Task.
8. Gateway branch target nodes should share the same x column and use separated y lanes.
9. Rejected/cancel/exception paths must use a separate lane from the main path.
10. A shared `EndRejectEvent` must not collect more than three adjacent Approval Assignment Task rejected flows. Split into additional `EndRejectEvent` nodes after three sources.
11. A shared `EndRejectEvent` may only collect rejected flows from Approval Assignment Tasks on the same horizontal lane. Assignment Tasks on different y lanes must use separate `EndRejectEvent` nodes.
12. `EndRejectEvent` placement must follow the source group by node centers, not top-left coordinates: one source aligns with the task center; two or three sources align near the horizontal center of the source task centers.
13. If the source Approval Assignment Tasks are on the first workflow row, their shared `EndRejectEvent` must sit on the row above them. If the source tasks are not on the first workflow row, their shared `EndRejectEvent` must sit on the row below them.
14. Workflow diagrams should use the visible Designer canvas as a roughly `16:9` work area. Large workflows should add vertical rows instead of putting all nodes on one long horizontal line.
15. Generated workflows should not exceed five vertical rows/layers.
16. Generated SequenceFlow line style should be `rounded` by default for complex graphs.
17. Generated workflow roots must use the current Workflow Designer v2 graph attributes: `lineType = "rounded"` and `graphver = 2`. Preserve/default `graphzoom`; zoom differences are not layout defects.
18. Every generated `SequenceFlow` must include `properties.linetype = "rounded"`, a string `properties.documentation` field, and `dockers = []` so the designer can auto-route rounded lines.
19. Do not add vertices merely because a line is rejected or cross-lane. Add `vertices[]` for return/backward lines, overlapping lines, lines that cross other nodes, and long reroutes that cannot be made readable by standard spacing.
20. SequenceFlow `source` and `target` references must resolve to existing workflow node ids.
21. `graphposition` should cover the full node area plus padding.

## Standard Spacing

The `workflow_actions_layout` reference establishes the following default spacing for generated workflow diagrams. Position values are top-left coordinates.

| Constant | Recommended value | Minimum | Usage |
| --- | ---: | ---: | --- |
| `Y_MAIN` | `40` | fixed | Main approval backbone lane. |
| `H_START_TO_FIRST_TASK` | `305` | `305` | Start to first Assignment Task. |
| `H_TASK` | `335` | `305` | Assignment Task to next same-level task. |
| `H_TASK_TO_GATEWAY` | `320` | `305` | Task to Inclusive Gateway. |
| `H_GATEWAY_TO_BRANCH` | `195` | `180` | Inclusive Gateway to branch task column. |
| `H_TASK_TO_END` | `335` | `305` | Final task to normal End. |
| `V_REJECT_UP` | `125` | `115` | End with Rejection above task lane. |
| `V_REJECT_DOWN` | `135` | `125` | End with Rejection below task lane. |
| `V_BRANCH_NEAR` | `115` | `115` | Near branch vertical separation. |
| `V_LANE` | `155` | `135` | Main lane to lower approval branch lane. |
| `ROW_TOLERANCE` | `60` | fixed | Nodes within this y delta count as one horizontal lane. |
| `MAX_ROWS` | `5` | fixed | Maximum generated workflow vertical rows/layers. |
| `CANVAS_RATIO` | `16:9` | advisory | Preferred visible Designer canvas usage. |

## Assignment Task Outcome Rules

Approval task:

- `stencil.id = MultiAssignmentTask`
- `properties.tasktype` is empty or not `complete`
- must have an `Approved` SequenceFlow
- must have a `Rejected` SequenceFlow
- `documentation` should display `Approved`, `Rejected`, or a clear business rejection label such as `Reject and return`
- `conditioninfo` must contain the real task outcome condition

Complete task:

- `stencil.id = MultiAssignmentTask`
- `properties.tasktype = "complete"`
- must have a `Completed` SequenceFlow
- usually has only one outgoing SequenceFlow
- use `Completed`, not misspellings such as `comepleted`

## Inclusive Gateway Rules

When a workflow branches on business data, generate:

```text
Approval task Approved -> InclusiveGateway -> business condition branches
```

Do not generate multiple business condition SequenceFlows directly out of an Assignment Task. Place multiple branch target nodes in the same x column when possible, with separate y lanes. This keeps the branch readable and avoids unnecessary vertices.

## End With Rejection Rules

For Approval Task rejected outcomes:

- one task to one `EndRejectEvent`: align `EndRejectEvent.x` with the task and place it vertically above or below the task
- two tasks to one `EndRejectEvent`: place it near the horizontal midpoint of the two tasks
- three tasks to one `EndRejectEvent`: place it near the center of the three tasks, usually near the middle task x
- calculate the alignment using node center points, not the top-left `position.x`
- when source Approval Assignment Tasks are on the first workflow row, place the shared `EndRejectEvent` above that row
- when source Approval Assignment Tasks are on a lower workflow row, place the shared `EndRejectEvent` below that row
- shared rejection endpoints are valid only when the source Approval Assignment Tasks are on the same horizontal lane
- source tasks on different vertical lanes must use separate `EndRejectEvent` nodes, even when there are three or fewer rejected sources
- more than three rejected sources: create another `EndRejectEvent`

This prevents many rejected lines from stacking into one crowded endpoint.

## Workflow Designer V2 Line Style Rules

The current Yeeflow Workflow Designer expects generated workflow graphs to use rounded auto-routing metadata:

- root `lineType: "rounded"`
- root `graphver: 2`
- each `SequenceFlow.properties.linetype: "rounded"`
- each `SequenceFlow.properties.documentation` present as a string, with `""` allowed
- each `SequenceFlow.dockers: []`

Do not generate legacy orthogonal/full-docker routes. Keep `vertices[]` only where explicit routing improves readability, such as return/backward paths, overlap avoidance, node crossing, or long reroutes.

`graphzoom` is not a fidelity gate; keep the reference/default value rather than forcing a new zoom.

## Canvas Aspect and Row Utilization Rules

The Workflow Designer visible canvas is approximately `16:9`. Generated diagrams should use that shape rather than creating one long, narrow strip of nodes.

For complex workflows:

- keep the main approval backbone readable from left to right
- when the number of nodes grows, continue into lower rows/layers instead of extending the main lane indefinitely
- use at most five vertical rows/layers
- keep related sibling branches aligned by column when possible
- avoid a single horizontal row with ten or more nodes and an overly wide aspect ratio

The validator treats five rows as the hard maximum and flags large single-row sprawl as a readability failure.

## Vertices Rules

Default to no vertices when standard spacing makes the line readable.

Require vertices when:

- the target node is to the left of the source node, such as `Reject and return`
- the line overlaps another line for a meaningful segment
- the line crosses through or too close to another node
- the route is a long cross-lane reroute that cannot be made readable through spacing alone

For return lines, route above or below the main lane with two vertices:

```text
sourceCenterX = source.x + taskCenterOffset
targetCenterX = target.x + taskCenterOffset
routeY = source.y + 110
vertices = [
  { x: sourceCenterX, y: routeY },
  { x: targetCenterX, y: routeY }
]
```

## Generator Guidance

When materializing App Plan workflow nodes:

- Place Start on the left.
- Place approval/task/gateway nodes on the main lane.
- Place data-write/action nodes on a lower action lane when they follow an approval outcome.
- Place rejected/cancel endpoints on a lower reject lane.
- Only share an `EndRejectEvent` between Approval Assignment Tasks on the same horizontal lane.
- For large workflows, use additional rows/layers up to the five-row maximum instead of placing every node on one row.
- Keep End on the right of the last main/action step.
- Route return/rework transitions down or up and across with two or more vertices.
- Use vertices for cross-lane approved/complete transitions only when standard spacing would make a diagonal line overlap other lines or cross nodes.

## Hard Gate

Run:

```bash
node scripts/validate-workflow-layout-golden-reference.mjs --package <generated-final.yapk>
```

This gate is also part of `scripts/yapk-first-generation-preflight.mjs`.

The gate must fail generated packages that contain:

- missing node positions
- duplicate or near-duplicate node positions
- compressed complex workflow canvas
- unresolved SequenceFlow endpoints
- rejected/cross-lane flows without readable routing
- invalid `graphposition` coverage
- shared End with Rejection nodes collecting sources from different horizontal lanes
- workflows with more than five vertical rows
- large workflows compressed into one overly wide horizontal row
