# Approval Workflow Graphposition Runtime Contract Training

## Runtime Evidence

The Business Travel Request Approval workflow originally opened on a blank canvas with `graphposition = {-330,-245,2671,620}`. Plugin 0.9.55 replaced that with a viewport-translation formula that generated `{250,205,2351,211}`, but the successful runtime upgrade required `{ -80,-40,2351,211 }`.

The successful package had node bounds `x=-170..2181`, `y=-85..126`. A fresh Workflow Designer tab opened with Start and the first approval task visible, and Version Management reported Upgrade application Succeed.

## Corrected Root Cause

The prior training incorrectly equated saved `graphposition.x/y` with the browser-rendered workflow stage translation. Runtime inspection proves those are different coordinate concepts. Therefore `screen = model * graphzoom + graphposition` must not be used to generate or validate saved workflow metadata.

## Runtime-Proven Contract

- `graphposition.x = minNodeX + 90`
- `graphposition.y = minNodeY + 45`
- `graphposition.width = max(470, maxNodeX - minNodeX)`
- `graphposition.height = max(185, maxNodeY - minNodeY)`
- The same shared helper is mandatory for standalone `.ywf` and Approval workflows embedded in `.yapk`.

For the proven bounds, this yields exactly `{ "x": -80, "y": -40, "width": 2351, "height": 211 }`.

## Hard Gates

- `APPROVAL_WORKFLOW_GRAPHPOSITION_ORIGIN_MISMATCH`
- `APPROVAL_WORKFLOW_GRAPHPOSITION_CONTENT_SPAN_MISMATCH`
- `WORKFLOW_LAYOUT_GRAPHPOSITION_ORIGIN_MISMATCH`
- `WORKFLOW_LAYOUT_GRAPHPOSITION_CONTENT_SPAN_MISMATCH`

Regression requires the legacy negative incident and the obsolete `250/205` translation-formula output to fail, while the runtime-proven `-80/-40` shape passes. Structural validation remains distinct from fresh-tab Designer proof.
