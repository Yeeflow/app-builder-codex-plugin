# Approval Workflow Designer Editability Focused Training Report

## Incident

`Audit Stage Gate Approval.ywf` rendered a workflow canvas, but nodes could not be selected or configured, new nodes could not be added, and the workflow could not be published.

## Root Cause

The generated graph carried `position` for its 11 workflow nodes but omitted `bounds`. The current Designer uses node bounds as the editable hitbox, so rendering from position alone was not sufficient.

The same artifact also contained independent publish blockers:

- malformed Applicant Line Manager assignee serialization;
- two Query Data actions whose result and count variables were undeclared;
- four Content List actions with empty field mappings;
- Update actions emitted with add semantics.

These failures show why installability, canvas rendering, node editability, and workflow publishability must remain separate proof claims.

## Training Changes

1. Added a shared Approval workflow Designer-shape library used by full-app generation and available to standalone `.ywf` generation.
2. Materialized positive-area node bounds and derived graph extents from bounds.
3. Auto-declared Query Data result/count workflow variables.
4. Added safe minimal field mapping for generated add actions.
5. Refused to treat unresolved update/remove record targeting as complete.
6. Added hard gates for node bounds, Query Data outputs, Content List mappings, and operation semantics.
7. Added positive and negative regression cases based on the incident shape without retaining tenant-specific IDs or business data.
8. Centralized repository, plugin-script, and bundled skill validator entry points on the canonical root validator so the same artifact cannot pass one path and fail another due to duplicated stale code.

The incident artifact is now rejected with focused codes including `APPROVAL_WORKFLOW_NODE_BOUNDS_MISSING`, `WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID`, `QUERYDATA_RESULT_VARIABLE_NOT_FOUND`, `QUERYDATA_COUNT_VARIABLE_NOT_FOUND`, `CONTENTLIST_EMPTY_LISTDATAS`, and `CONTENTLIST_OPERATION_SEMANTICS_MISMATCH`.

## Proof Boundary

The focused regression proves source-level generation and validation behavior. It does not by itself prove browser Designer interaction or publish execution against a tenant. A fresh generated workflow should still be imported and tested for node selection, property editing, node insertion, save, and publish.
