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
2. Every generated workflow action node must have a concise business-specific Action name. Defaults such as `Assignment Task`, `Content List`, `Inclusive Gateway`, `Gateway`, `Task`, or `Sequence flow` are invalid. Use names like `Line manager approval`, `Department head approval`, `Finance manager approval`, `Cashier confirm`, `IT security check`, or `Request clarification`.
3. Action names should stay short enough to fit the node card, normally no more than 48 characters.
4. Every generated `SequenceFlow` must include a non-empty business Description in `properties.documentation`. Use concise labels such as `Submitted`, `Approved`, `Rejected`, `Completed`, `Amount >= 5000`, `Amount < 5000`, or `Sensitive data`. Empty strings and defaults such as `Sequence flow_1` are invalid.
5. SequenceFlow descriptions should stay short enough to avoid label collisions, normally no more than 42 characters. Keep full logic in `conditioninfo`.
6. Nodes must not share identical coordinates.
7. Nodes must not use near-identical coordinates where both `x` and `y` deltas are below the golden-reference near-collision threshold.
8. Complex workflows must not be compressed into a single small cluster. Main-path steps should use a horizontal column gap of about `335px`, with a minimum of `305px` for adjacent task columns.
5. Approval Assignment Tasks must have at least `Approved` and `Rejected` outcome SequenceFlows.
6. Complete Assignment Tasks must have a `Completed` outcome SequenceFlow; `Completed` is the canonical spelling.
7. Business-field branches such as `Amount >= 5000` / `Amount < 5000` must be modeled through an `InclusiveGateway`, not as direct condition fan-out from an Assignment Task.
8. Gateway branch target nodes should share the same x column and use separated y lanes.
9. Rejected/cancel/exception paths must use a separate lane from the main path.
10. A shared `EndRejectEvent` must not collect more than three adjacent Approval Assignment Task rejected flows. Split into additional `EndRejectEvent` nodes after three sources.
11. A shared `EndRejectEvent` may only collect rejected flows from Approval Assignment Tasks on the same horizontal lane. Assignment Tasks on different y lanes must use separate `EndRejectEvent` nodes.
12. `EndRejectEvent` placement must follow the source group by node centers, not top-left coordinates: one source aligns with the task center; two or three sources align near the horizontal center of the source task centers.
13. A shared `EndRejectEvent` must collect only local adjacent sources. If two or three rejected sources are far apart on the same lane, split them into separate local `EndRejectEvent` nodes instead of drawing long rejection lines to one global endpoint.
14. If the source Approval Assignment Tasks are on the first workflow row, their shared `EndRejectEvent` must sit on the row above them. If the source tasks are not on the first workflow row, their shared `EndRejectEvent` must sit on the row below them.
15. Workflow diagrams should use the visible Designer canvas as a roughly `16:9` work area. Large workflows should add vertical rows instead of putting all nodes on one long horizontal line.
16. Generated workflows should not exceed five vertical rows/layers.
17. A complex workflow row must not become a dense strip. Fold later actions or branch targets into upper/lower lanes when one row would contain too many nodes or condition labels.
18. Do not compress the standard column spacing just to satisfy a fixed medium-workflow width target. For 14-25 node workflows, `2600px` is an advisory width where the generator should prefer lane folding, not a reason to reduce label, node, or connector clearance.
19. A medium workflow may exceed the advisory width when it uses readable multi-row folding, row density is acceptable, labels do not collide, and connector lanes remain clear. It should fail only when it remains a single/dense horizontal strip, becomes extremely wide, or violates readability gates.
20. Long connector labels must not overlap workflow nodes or other long connector labels. Use separate lanes, local branch routes, or shorter condition labels instead of relying on Designer auto-placement in crowded areas.
21. Long vertical route segments must not stack into one visual wall. If more than two long vertical segments need the same column gap, offset lanes or split the branch into local routes.
22. Generated SequenceFlow line style should be `rounded` by default for complex graphs.
23. Generated workflow roots must use the current Workflow Designer v2 graph attributes: `lineType = "rounded"` and `graphver = 2`. Preserve/default `graphzoom`; zoom differences are not layout defects.
24. Every generated `SequenceFlow` must include `properties.linetype = "rounded"`, a non-empty string `properties.documentation` field, and `dockers = []` so the designer can auto-route rounded lines.
25. Do not add vertices merely because a line is rejected or cross-lane. Add `vertices[]` for return/backward lines, overlapping lines, lines that cross other nodes, and long reroutes that cannot be made readable by standard spacing.
26. Direct same-row connectors must rely on rounded auto-routing. In particular, `StartNoneEvent -> first task` connectors labeled `Submitted` / `Submit` must have empty or absent `vertices[]`.
27. When a connector needs a horizontal segment between two adjacent rows, route that segment at the midpoint of the net row gap: `routeY = (upperRowY + workflowNodeHeight + lowerRowY) / 2`.
28. When a long return/backward connector crosses more than two workflow rows, do not calculate `routeY` from only the source and target rows. Choose an adjacent open row-gap midpoint along the route and ensure the horizontal segment does not pass through any intermediate row's node bounds.
29. When an explicit connector route includes a vertical segment between workflow columns, route that segment through the midpoint of the net column gap: `routeX = (leftColumnX + workflowNodeWidth + rightColumnX) / 2`.
30. Long connector vertical segments must not pass through intermediate workflow node bounds. If the column gap is too narrow or occupied, increase column spacing, choose an adjacent column-gap midpoint, or use a justified external lane.
31. Use an external return lane only for long backward/return/cross-row reroutes where the row-gap/column-gap midpoint is unsafe, crowded, or too narrow.
32. SequenceFlow `source` and `target` references must resolve to existing workflow node ids.
33. `graphposition` should cover the full node area plus padding.
34. Inclusive Gateway branches must be local fan-out motifs. Branch targets should sit in a nearby branch column, normally about `195px` from the gateway and never as a far-right target that requires long labels or detour connectors.
35. Normal End nodes with multiple incoming branches must be local merge points beside the incoming source group. Do not place a final End far from the source group and then wrap long completion connectors into it.
36. Local rejected connectors to a nearby `EndRejectEvent` should not carry explicit vertices. If the rejection endpoint is correctly placed above/below the source group, rounded auto-routing is sufficient.
37. Local forward or merge connectors between nearby upper/lower lanes should also use rounded auto-routing with empty `vertices[]`. Do not add explicit vertices to nearby Completed/Approved merge lines merely because the source and target are on different y lanes. If a short local merge needs several bends to look readable, move the branch/merge nodes into a clearer golden-reference motif instead.
38. Connector display labels must stay concise. Use short visible labels such as `Amount >= 5000`, `Sensitive data`, or `Approved`, and keep the full expression in `conditioninfo`; do not put long business sentences on connector labels.

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
| `ROW_NODE_DENSITY` | `7` | fixed | Maximum suggested nodes in one complex workflow row before folding into another lane. |
| `MEDIUM_WIDTH_ADVISORY` | `2600` | soft | Suggested width where 14-25 node workflows should prefer folding; do not compress columns just to fit it. |
| `MEDIUM_READABLE_WIDTH_ALLOWANCE` | `3400` | hard-ish | Upper allowance for readable multi-row medium workflows before the width itself becomes a blocker. |
| `LONG_LABEL_COLLISION_MIN` | `16 chars` | fixed | Minimum connector label length for label collision checks. |
| `VERTICAL_ROUTE_LANE_MAX` | `2` | fixed | Maximum long vertical connector segments that may share one lane before lane offsets/local routes are required. |
| `END_REJECT_SOURCE_SPAN` | `760` | fixed | Maximum suggested x-span for approval tasks sharing one rejection endpoint. |
| `WORKFLOW_NODE_SIZE` | `190 x 86` | fixed | Standard task/gateway/end node size used for connector midpoint geometry. |
| `ROW_GAP_MIDPOINT_ROUTE_MIN` | `60` | fixed | Preferred minimum net gap for midpoint connector routing. |
| `ROW_GAP_LABELED_MIN` | `40` | fixed | Below this net gap, do not route labeled long connectors through the row gap. |
| `ROW_GAP_ROUTE_Y_TOLERANCE` | `12` | fixed | Allowed pixel tolerance when validating routeY against the row-gap midpoint. |
| `COLUMN_GAP_MIDPOINT_ROUTE_MIN` | `48` | fixed | Preferred minimum net gap for vertical connector routing between columns. |
| `COLUMN_GAP_ROUTE_X_TOLERANCE` | `12` | fixed | Allowed pixel tolerance when validating routeX against the column-gap midpoint. |
| `EXTERNAL_RETURN_LANE_PADDING` | `80-120` | fixed | Padding outside workflow node bounds for true external return lanes. |
| `GATEWAY_BRANCH_LOCAL_MAX_X` | `650` | fixed | Maximum suggested center-x distance from an Inclusive Gateway to a business branch target. |
| `END_MERGE_LOCAL_MAX_X` | `650` | fixed | Maximum suggested center-x distance from the rightmost incoming source to a multi-source normal End node. |
| `END_MERGE_VERTICAL_TOLERANCE` | `130` | fixed | Allowed y padding around incoming source centers for local End merge placement. |
| `CONNECTOR_LABEL_MAX` | `42 chars` | fixed | Maximum suggested visible business-condition connector label length. |
| `LOCAL_REJECT_VERTEX_DELTA` | `760 x 260` | fixed | Local rejected connectors within this x/y distance should not use explicit vertices. |
| `LOCAL_FORWARD_AUTO_ROUTE_DELTA` | `1250 x 360` | fixed | Local forward or merge connectors within this x/y distance should not use explicit vertices. |
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

Gateway branches should remain local. The `workflow_actions_layout` reference places branch targets close to the gateway, then uses upper/lower lanes to express alternative paths. If a branch target is hundreds of pixels beyond the local branch column, move that node into a nearby lane or restructure the section instead of drawing a long condition connector.

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
- source tasks that are too far apart on the same lane should also use separate local `EndRejectEvent` nodes
- more than three rejected sources: create another `EndRejectEvent`

This prevents many rejected lines from stacking into one crowded endpoint.

## Complex Workflow Lane Strategy

For workflows with many approvals, gateways, and post-approval actions, do not keep extending the main row indefinitely. Use the golden-reference lane pattern:

- main approval backbone on the center row
- condition-specific review branches on upper or lower rows
- request clarification / return paths on a lower row with explicit `vertices[]`
- local rejection endpoints above the first approval row or below lower approval rows
- later procurement, fulfillment, or archive actions folded into another lane when the main row becomes dense

The target visual width for most generated workflows should stay around `1800-2200px`. For medium-complexity workflows, `2600px` is an advisory threshold that should trigger lane folding and readability review. It must not make the generator compress standard column spacing or overlap labels. A wider workflow is acceptable when it uses readable rows, keeps row density under control, avoids connector label collisions, and does not create shared vertical route walls.

The normal End node is also a layout motif. When several branch outcomes complete into the same End, place the End as a local merge beside the incoming source group, similar to the reference `End_1` placement. Avoid a single far-away End that forces multiple long wraparound completion lines.

## Workflow Designer V2 Line Style Rules

The current Yeeflow Workflow Designer expects generated workflow graphs to use rounded auto-routing metadata:

- root `lineType: "rounded"`
- root `graphver: 2`
- each `SequenceFlow.properties.linetype: "rounded"`
- each `SequenceFlow.properties.documentation` present as a non-empty concise business Description string
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

Default to no vertices when standard spacing makes the line readable. The workflow layout standard is node-placement first and connector-routing second.

If a connector needs many vertices to avoid looking chaotic, the source/target nodes are probably in the wrong place. Rebuild the node layout using the golden-reference motifs instead of adding more bends:

- main approval backbone
- upper/lower branch lanes
- local gateway fan-out
- local `End with rejection` endpoints
- lower action/complete lanes

Vertices are a last-mile correction, not the primary layout mechanism. In generated workflows with eight or more nodes, non-return/non-rejection connectors that require vertices should be rare. A graph with many such routed connectors must fail validation and be regenerated with better node placement.

Require vertices when:

- the target node is to the left of the source node, such as `Reject and return`
- the line overlaps another line for a meaningful segment
- the line crosses through or too close to another node
- the route is a long cross-lane reroute that cannot be made readable through spacing alone

Simple direct same-row connectors should not have route vertices:

```text
vertices = []
```

This is mandatory for `Start -> first task` / `Submitted` or `Submit` connectors when the source and target are adjacent and unobstructed.

Local forward/merge connectors should also stay vertex-free when the source and target are nearby. For example, a `Completed` line from an upper branch task to the next local merge task, or an `Approved` line from a nearby lower branch task back into a local process step, should rely on Designer rounded auto-routing. Do not add diagonal or multi-bend `vertices[]` just because the nodes are on different y lanes.

For return lines that can travel in the open space between adjacent rows, route the horizontal segment through the midpoint of the net row gap:

```text
sourceCenterX = source.x + taskCenterOffset
targetCenterX = target.x + taskCenterOffset
upperRowBottom = upperRowY + workflowNodeHeight
lowerRowTop = lowerRowY
routeY = upperRowBottom + ((lowerRowTop - upperRowBottom) / 2)
vertices = [
  { x: sourceCenterX, y: routeY },
  { x: targetCenterX, y: routeY }
]
```

Use an external return lane below or above the graph only when the row gap is too narrow, already crowded, or the connector spans many logical workflow groups. Do not send short local return lines to arbitrary fixed y values.

For long return/backward lines that cross multiple workflow rows, first cluster all rows between source and target. The horizontal segment must use an open adjacent row gap, not the midpoint between the source row and target row when an intermediate row exists. For example, if rows occupy `160..246`, `320..406`, and `480..566`, a return from the third row to the first row should use the first open gap midpoint `283`, not `(160 + 86 + 480) / 2 = 363`, because `363` passes through the middle row.

For long cross-row connectors that also need a vertical segment, first cluster workflow columns along the route. The vertical segment must use an open adjacent column gap, not a task center or a node edge when that x-coordinate overlaps another node. For example, if one column occupies `1260..1450` and the next occupies `1565..1755`, the vertical lane should use `1508`, the midpoint of the net column gap. A vertical segment at an x-coordinate inside any intermediate node's `left..right` bounds is invalid even when the horizontal `routeY` is correct.

Do not trade readability for a hard width number. The medium-width limit is advisory: it should encourage branch folding, not column compression. Standard node spacing, label readability, and low vertex usage are more important than forcing every medium workflow under `2600px`.

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
- Do not use vertices for local Completed/Approved merge transitions when the source and target are nearby branch/action lanes. Rounded auto-routing is cleaner; explicit bends in this case usually signal that node placement should be adjusted.
- When generating vertices for a long connector, choose both a safe horizontal `routeY` from row-gap midpoint rules and a safe vertical `routeX` from column-gap midpoint rules. Do not leave the vertical segment on a task/gateway center line when that would run through another node's bounds.
- Before adding vertices, try moving branch/action nodes into the reference motif lanes. If multiple forward or branch connectors need explicit vertices, the layout engine should move nodes, not add bends.

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
- medium workflows that exceed the advisory width without readable multi-row folding
- connector labels overlapping nodes or other long connector labels
- too many long vertical connector segments sharing one routing lane
- overuse of vertices on non-return/non-rejection connectors
- connector paths whose detours are far longer than the direct source-target distance
