# Yeeflow App Builder v1.12.7

## Version decision

- Previous stable version: `1.12.6`
- New version: `1.12.7` (patch)
- Scope: Approval workflow local-Rework routing, explicit-route orthogonality, final-layout coordinate closure, and main-lane card spacing.

## Included changes

- Treat nearby rightward `Returned for Rework` outcomes as local branches and require empty `vertices[]` so Workflow Designer provides the rounded bend.
- Reject diagonal explicit vertex segments and a source-to-lower/upper route whose first vertex is no longer aligned after its source node moved.
- Enforce at least `110px` visible clearance between same-row forward cards; use row folding instead of compressing layouts.
- Add source and distribution regression coverage for the observed Audit Management workflow geometry failures.

## Verification boundary

- Source and distribution gates prove serialized route and spacing contracts.
- Persisted readback proves saved geometry only.
- Workflow Designer-open remains required to establish visible routing, and browser workflow runtime remains separate execution proof.
