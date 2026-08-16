# Approval Workflow Final Layout Closure Standard

## Purpose

Prevent Approval Forms from being persisted with a workflow that is structurally accepted but unreadable, unroutable, or not editable in Workflow Designer.

## Required generation sequence

1. Finish the semantic topology before layout: classify each path as approved completion, final rejection, return/rework, branch, or post-approval system action.
2. Materialize every final node and SequenceFlow.
3. Layout the complete node set using the workflow golden-reference lanes. Do not append a node to an already laid-out graph.
4. Route only the final SequenceFlows. Local forward, merge, and local rejected links use rounded auto-routing; long, cross-row, backward, and return links use safe explicit `vertices[]`. Apply `approval-workflow-route-orthogonality-standard.md` so local lower-right Rework branches remain vertex-free and explicit routes are orthogonal.
5. Recalculate `graphposition` from the final node bounds.
6. Validate the decoded definition before save, then retrieve, decode, and validate the persisted definition after save.

Any graph edit after step 3 restarts at step 3. API acceptance alone is never an exception.

## Layout policy

- Generated sequential flows may contain at most five execution nodes on one main backbone row. Fold later steps into a lower readable row.
- A row transition is a planned backward/return route. It must travel through an open adjacent row gap or a justified external lane; it must not cross node bounds.
- System actions belong in their local action lane. They must not be appended indefinitely to the right of a completed approval chain.
- The normal End is a local completion point beside the final source group, not a fixed far-right endpoint.
- Rejected is terminal. Returned/Rework is non-terminal and must route to a planned clarification/rework node or earlier task; it must not target a historical shared rejection endpoint.

## End with Rejection contract

An `EndRejectEvent` may receive empty-vertex rounded lines only from nearby Approval Tasks on the same local lane. A target is non-local when any of these is true:

- its x position is left of the source;
- its source/target distance exceeds the local reject x or y allowance;
- source and target are on different workflow lanes.

A non-local rejected or return line requires explicit safe `vertices[]`. If a safe route is not available, create a local endpoint or remodel the topology. Never use a long line merely because the target is an `EndRejectEvent`.

## Hard validation gates

Run both commands against the exact generated-final package/definition:

```bash
node scripts/validate-approval-workflow-publish-readiness.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md>
node scripts/validate-workflow-layout-golden-reference.mjs --package <generated-final.yapk>
```

Treat at least these findings as blocking:

- `WORKFLOW_LAYOUT_REJECT_ENDPOINT_VERTICES_MISSING`
- `WORKFLOW_LAYOUT_BACKWARD_FLOW_VERTICES_MISSING`
- `WORKFLOW_LAYOUT_ROUTE_Y_CROSSES_INTERMEDIATE_ROW`
- `WORKFLOW_LAYOUT_ROUTE_X_CROSSES_INTERMEDIATE_COLUMN`
- `WORKFLOW_LAYOUT_END_REJECT_SOURCE_SPAN_TOO_WIDE`
- `WORKFLOW_LAYOUT_END_REJECT_SOURCE_LANES_MISMATCH`
- `WORKFLOW_LAYOUT_GRAPHPOSITION_ORIGIN_MISMATCH`
- `WORKFLOW_LAYOUT_LOCAL_FORWARD_VERTICES_UNNECESSARY`
- `WORKFLOW_LAYOUT_VERTEX_SEGMENT_DIAGONAL`
- `WORKFLOW_LAYOUT_ROUTE_SOURCE_EXIT_NOT_VERTICAL`
- `WORKFLOW_LAYOUT_FORWARD_NODE_CLEARANCE_TOO_SMALL`

## Evidence contract

| Evidence level | What it proves | What it does not prove |
| --- | --- | --- |
| `apiAccepted` | API accepted the payload. | Diagram layout, Designer behavior, workflow execution. |
| `persistedReadback` | Saved payload was retrieved and still passes static closure. | Designer rendering or runtime routing. |
| `designerOpen` | Workflow Designer opens and the full graph is readable/editable. | Request submission and assignee routing. |
| `browserWorkflowRuntime` | A disposable request traversed the tested Submit/Approve/Reject/Return path. | Untested paths, notifications, or production authorizations. |

For any graph with multiple approval tasks, a branch, a return/rework path, or system actions, `designerOpen` is mandatory before claiming workflow readiness. `browserWorkflowRuntime` is mandatory before claiming route execution.
