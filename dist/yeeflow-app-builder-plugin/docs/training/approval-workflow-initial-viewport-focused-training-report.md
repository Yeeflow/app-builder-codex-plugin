# Approval Workflow Initial Viewport Focused Training

## Incident

The generated Business Travel Request Approval workflow opened to a blank Designer canvas. The workflow became visible only after manually panning the canvas down and right.

The decoded generated workflow used:

```json
{
  "graphposition": { "x": -330, "y": -245, "width": 2671, "height": 620 },
  "graphzoom": 1
}
```

Its node model extent was `x=-170..2181`, `y=-85..126`. Under the Designer transform `screen = model * zoom + graphposition`, the complete node screen extent was `y=-330..-119`: every node was above the visible canvas.

## Root Cause

The shared helper treated `graphposition.x/y` as the model-coordinate bounding-box origin and wrote `minNode - margin`. Current Designer exports prove that `x/y` are initial viewport translation offsets. The old validator repeated the same misconception by requiring `graphposition` to contain node model bounds, so the generator and validator agreed with each other while the runtime canvas was blank.

`graphposition.width/height` are scaled content dimensions. They must not be used to infer the viewport origin.

## Correct Contract

- Preserve node `position` and positive-area `bounds` in model coordinates.
- Preserve a positive `graphzoom`.
- Compute the initial viewport translation so the topmost and leftmost node bounds render at safe visible insets:
  - `graphposition.x = safeLeft - minNodeX * graphzoom`
  - `graphposition.y = safeTop - minNodeY * graphzoom`
- Generated defaults use `safeLeft=80` and `safeTop=120`.
- Compute `width/height` from scaled node content span, with small minimum dimensions for simple workflows.
- Apply the same normalizer in full `.yapk` materialization and standalone `.ywf` wrapper generation.

## Hard Gate

`APPROVAL_WORKFLOW_INITIAL_VIEWPORT_NODE_EXTENT_OFFSCREEN` fails when the transformed node extent lies completely above, below, left, or right of the expected initial Designer canvas. `APPROVAL_WORKFLOW_GRAPHPOSITION_DIMENSIONS_INVALID` rejects non-positive scaled content dimensions.

Designer-open proof remains distinct from structural validation, but a generated workflow that is mathematically outside the initial viewport cannot proceed to signing readiness.
