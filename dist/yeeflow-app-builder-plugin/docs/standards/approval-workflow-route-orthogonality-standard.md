# Approval Workflow Route Orthogonality Standard

## Purpose

Prevent generated Approval workflow diagrams from persisting a valid sequence-flow topology whose visible route is diagonal, stale after layout movement, or compressed beyond usable Designer readability.

## Route classification

Classify geometry from final source and target positions, not from the display label alone.

- A local forward branch targets a nearby node to the right. It uses empty `vertices[]`, including an outcome labelled `Returned for Rework` when it reaches a lower-right rework action.
- A true return/backward route targets a prior/leftward node or must cross an occupied row or column. It may use explicit `vertices[]`.
- A local rejection to a nearby `EndRejectEvent` remains vertex-free; a non-local terminal route follows the existing safe-route rules.

## Explicit route contract

When vertices are required:

1. Generate them only after every final node position and bound is known.
2. Every pair of adjacent vertices must share x or y; diagonal vertex segments are forbidden.
3. If the first vertex exits above or below the source card, its x must match the source center within 12px.
4. Use an open row-gap midpoint for horizontal return segments and an open column-gap midpoint for long vertical segments.
5. Recompute the whole connector after any node move; never copy a previous layout's vertices.

## Spacing contract

For same-row forward SequenceFlows, use at least 110px card-to-card clearance. The Audit Management Golden Reference uses roughly 130–160px and should be preferred. If the workflow exceeds the intended canvas width, fold subsequent steps into another readable row; do not reduce clearance.

## Required gates

Run `scripts/validate-workflow-layout-golden-reference.mjs` before save and on persisted readback. Treat these as blockers:

- `WORKFLOW_LAYOUT_LOCAL_FORWARD_VERTICES_UNNECESSARY`
- `WORKFLOW_LAYOUT_VERTEX_SEGMENT_DIAGONAL`
- `WORKFLOW_LAYOUT_ROUTE_SOURCE_EXIT_NOT_VERTICAL`
- `WORKFLOW_LAYOUT_FORWARD_NODE_CLEARANCE_TOO_SMALL`

The validator proves serialized layout geometry. Workflow Designer-open is required to prove the visible routing result; browser workflow runtime is separate proof of execution.
