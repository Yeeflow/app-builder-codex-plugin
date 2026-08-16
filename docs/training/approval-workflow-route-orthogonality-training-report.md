# Approval Workflow Route Orthogonality Training Report

## Trigger

The Audit Management `Engagement Closure Approval` and `Fieldwork Gate Approval` definitions contained a local `Returned for Rework` branch with diagonal vertices, a Fieldwork return route whose first vertex remained at a former node x coordinate, and main-lane card clearances of only about 30px. The manually corrected `Engagement Closure Approval 2` and `Fieldword Gate Approval 2` forms are the Golden Reference for this route/spacing motif.

## Learned rules

- A local lower-right rework branch is not a backward route merely because its label contains `Returned` or `Rework`; it must use Designer rounded auto-routing with no vertices.
- An explicit return-route polyline must be orthogonal and must leave a lower/upper source edge on the source center line.
- Node coordinates and route vertices are one finalization unit. A post-layout node move invalidates every affected explicit route.
- Main-lane cards need usable edge-to-edge clearance; workflow width pressure is solved by row folding, never by squeezing cards together.

## Reinforcement

- The layout validator rejects local forward Rework vertices, diagonal route segments, stale non-vertical lower/upper source exits, and insufficient same-row forward card clearance.
- Regression tests exercise each observed failure and retain the allowed explicit same-column/long-return cases.
- Approval workflow generation guidance now classifies route geometry from final topology and positions rather than outcome labels.

## Evidence boundary

The live definitions were retrieved read-only through MCP and compared with the manually corrected forms. Static validation proves only serialized geometry. Workflow Designer-open is required after generated writes to verify visual routing; request submission/approval execution remains a separate browser runtime proof.
