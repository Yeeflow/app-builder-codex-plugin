# Phase 5A Field and Control Projection Boundary Audit

Phase 5A is audit-only. No Legacy materializer route, Core export, adapter, or distribution artifact changes.

The audited matrix covers Data List fields and controls, Approval Form variables and controls, Document Library fields, and Dashboard filter-bound controls. Resource-control builders mutate template graphs or require allocated IDs; they cannot enter Core as simple helpers.

The selected Phase 5B vertical is **Data List scalar field projection for non-lookup, non-sublist fields only**. Its immutable contract accepts planned scalar field data and returns canonical field/control projection DTOs plus stable findings. It excludes IDs, resource mutation, templates, persistence, filesystem, APIs, archives, environment, and runtime state.

Phase 5D completed the scalar routing proof with source, temporary official ZIP, installed Plugin, determinism, scope gates, and temporary Legacy rollback evidence. The Phase 5E remaining-family audit closes the field/control family for simple helper extraction: every residual candidate requires a resource-definition contract, a workflow or form contract, or host orchestration. Approval Forms, Document Libraries, Dashboard controls, lookup/sublist fields, and every host-owned resource mutation remain deferred to contract-first work.
