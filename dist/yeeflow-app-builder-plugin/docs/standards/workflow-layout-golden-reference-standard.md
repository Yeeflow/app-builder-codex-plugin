# Workflow Layout Golden Reference Standard

Generated Yeeflow workflow diagrams must be readable before signing readiness. This standard applies to Approval form workflows, Data list workflows, and Scheduled workflows.

The workflow layout golden reference is based on two export-proven workflow JSON examples:

- `workflow_ref_ememo`: a complex horizontal approval workflow with branch gateways, lower-lane cancellation/rejection handling, and vertex-routed long transitions.
- `workflow_ref_expense_reimbursement`: a larger reimbursement workflow with multi-lane branching, optional reviewer paths, finance actions, and rounded/vertex-routed sequence flows.

## Scope

This standard validates visual workflow graph layout only:

- node coordinates
- graph spacing
- branch/reject lane separation
- SequenceFlow line style
- SequenceFlow vertices for long, rejected, and cross-lane routes
- graphposition coverage

It does not prove business behavior, assignment correctness, workflow execution, publish success, or runtime task routing.

## Generation Rules

1. Every non-`SequenceFlow` workflow node must have a top-level `position` object with numeric `x` and `y`.
2. Nodes must not share identical coordinates.
3. Nodes must not use near-identical coordinates where both `x` and `y` deltas are below the golden-reference near-collision threshold.
4. Complex workflows must not be compressed into a single small cluster. Main-path steps should use a horizontal column gap of about `300px`.
5. Rejected/cancel/exception paths must use a separate lane from the main path.
6. Rejected and cross-lane SequenceFlow edges must include explicit `vertices[]` where the source and target are far apart or on different lanes.
7. Generated SequenceFlow line style should be `rounded` by default for complex graphs.
8. SequenceFlow `source` and `target` references must resolve to existing workflow node ids.
9. `graphposition` should cover the full node area plus padding.

## Generator Guidance

When materializing App Plan workflow nodes:

- Place Start on the left.
- Place approval/task/gateway nodes on the main lane.
- Place data-write/action nodes on a lower action lane when they follow an approval outcome.
- Place rejected/cancel endpoints on a lower reject lane.
- Keep End on the right of the last main/action step.
- Route rejected transitions down and across with two or more vertices.
- Route cross-lane approved/complete transitions with vertices instead of a diagonal line.

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
