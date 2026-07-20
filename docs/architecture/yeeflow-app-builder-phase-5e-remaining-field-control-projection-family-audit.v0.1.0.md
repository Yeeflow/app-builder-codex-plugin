# Phase 5E Remaining Field and Control Projection Family Selection Audit

## Result

`NO_SAFE_REMAINING_FIELD_CONTROL_PROJECTION_VERTICAL`

No remaining field/control candidate can cross into Core as a narrow helper extraction. The Data List scalar pre-ID projection is complete. Every residual candidate requires resource identity, lookup resolution, template mutation, workflow or runtime bindings, or has no active immutable behavior.

## Capability Matrix

| Candidate | Surface | Legacy entry points | Classification | Blocking boundary |
| --- | --- | --- | --- | --- |
| Lookup fields | Data List | `buildFieldRecord`, `buildDataListFormFieldControl` | requires-resource-definition-contract | Target ListID resolution and cross-resource identity. |
| Sublist fields | Data List | `buildFieldRecord`, `buildDataListFormSubListControl` | requires-resource-definition-contract | Row schemas, template reads, generated column IDs, and mutable controls. |
| Identity fields | Data List | `buildFieldRecord`, `buildDataListFormFieldControl` | requires-resource-definition-contract | Platform identity semantics, FieldID attachment, and mutable controls. |
| File and image controls | Data List | `buildFieldRecord`, `buildDataListFormFieldControl` | requires-resource-definition-contract | Binary-control semantics, FieldID attachment, and template mutation. |
| Default and custom fields | Document Library | `buildDocumentLibraryFieldRecords` | requires-resource-definition-contract | Default-field policy and ListID/FieldID record lowering. |
| Variables | Approval Form | `buildApprovalVariables`, `addApprovalWorkflowActionVariables` | requires-workflow-or-form-contract | Workflow action shape propagation, list references, and variable identity. |
| Controls | Approval Form | `buildApprovalFormFieldsGrid`, `buildApprovalFormFieldControl`, `materializeApprovalFieldControls` | requires-workflow-or-form-contract | Template graphs, control IDs, dynamic expressions, and mutable layouts. |
| Filter controls | Dashboard | `normalizeDashboardFilters`, `materializeDashboardFilters`, `buildDashboardSelectFilter` | host-orchestration-only | Current normalization is empty; lowering mutates templates and binds runtime behavior. |

## Contract-First Requirements

The next safe family is **resource-definition construction**. It must first define immutable resource intent, symbolic references, validation findings, and explicit host lowering results. Host adapters must retain ListID and FieldID allocation, lookup target resolution, template loading and mutation, runtime expression binding, package writing, API access, and runtime installation.

Any future vertical must supply a per-surface matrix, a Legacy/Core normalized decoded-resource differential, source/archive/installed resolution proof, and a temporary-copy-only rollback that changes only the scoped lowering boundary.

## Non-Goals

This audit adds no Core API, adapter export, distribution artifact, compatibility route, materializer behavior, or runtime behavior. It does not modify the active installation or the historical Plugin release ZIP.
