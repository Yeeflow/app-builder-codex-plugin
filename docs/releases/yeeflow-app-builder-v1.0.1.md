# Yeeflow App Builder v1.0.1

Patch release for Unicode Approval Workflow node-name parity validation.

## Fix

- Approval Workflow publish-readiness validation now applies Unicode-aware NFKC node-name normalization.
- Distinct non-ASCII workflow node names no longer collapse to the same empty lookup key.
- Real planned-versus-generated workflow node type mismatches remain fail-closed.
- ASCII node-name matching remains backward compatible.

## Scope

This release changes only the Approval Workflow publish-readiness validator, its focused regression coverage, release-facing version metadata, and generated Plugin distribution/archive artifacts. It does not change Core extraction, materialization, OAuth, Approval graph generation, active installations, or tenant state.

## Validation Boundary

The sanitized read-only reproduction package and App Plan pass Approval Workflow publish-readiness after the fix. Stable installation refresh, signing/install preparation, and real application smoke remain a separate post-release task.
