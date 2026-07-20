# Yeeflow App Builder v1.0.3

## Summary

This patch release closes five clean-room generated-final contract gaps found after v1.0.2: Approval field-template selection parsing across subsection order, Approval Choice field planning semantics, export-shaped Approval ContentList mapping lowering, Dashboard Summary temp-variable identity reconciliation, and domain-safe application icon selection.

## Scope

- Parse Approval Form Fields Layout Template Selection at its actual subsection boundary even when it follows Form Actions and Temp Variables.
- Reject Text fields paired with select or radio controls and require explicit values for Choice fields.
- Preserve planned Choice values in Submission and Task form materialization without changing immutable Core projections.
- Lower plan-friendly Approval ContentList mappings into export-proven final YWF expression tokens.
- Keep Summary save variables, dashboard tempVars, visible KPI bindings, ReportIds, and exts aligned without duplicate temp prefixes.
- Select a validator-approved leave/calendar icon through controlled domain mapping and fail safely for unknown domains without an explicit App Plan icon.

## Validation

- Sanitized in-repository clean-room regression fixture and focused negative semantic cases.
- Generated-final Approval Workflow, Dashboard Summary, dashboard hard-gate, and application-icon validation.
- Source, official dist, archive, and simulated-installed parity.
- TypeScript, workspace, package/dependency boundary, Core distribution, OAuth parity, English-only, migration JSON, release-safety, archive, and Git diff gates.

## Proof Boundary

The unsigned-preflight warnings `YAPK_SIGN_UNEXPECTED_SHAPE` and `YAPK_CONTENT_GENERATION_RUNTIME_PROOF_REQUIRED` remain warnings and are not promoted to release blockers. This release does not modify an active Plugin installation, cache, tenant, workspace, or real application. Live application validation remains a separate post-release task using a refreshed stable Plugin.
