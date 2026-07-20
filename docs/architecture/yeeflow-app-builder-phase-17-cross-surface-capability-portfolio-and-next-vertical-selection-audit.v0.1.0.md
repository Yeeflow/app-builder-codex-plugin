# Phase 17 Cross-Surface Capability Portfolio and Next-Vertical Selection Audit

`CROSS_SURFACE_CAPABILITY_PORTFOLIO_AUDITED`

`CROSS_SURFACE_NEXT_VERTICAL_SELECTION_VALID`

`CROSS_SURFACE_NEXT_VERTICAL_SELECTION_REGRESSIONS_PASSED`

`PHASE_17_NO_SAFE_CANDIDATE`

## Decision

No safe next Core-migration vertical is selected. This is an audit-only decision; no Core shadow, public API, artifact, adapter, distribution, or production route was changed.

The authoritative Approval Form export proves 2 distinct Submission Form Sublist controls with Lookup target/display metadata. It preserves lossless target ListID, AppID, ListSetID, and display field. However, the current Approval Form Legacy lowerer preserves only generic row control information and does not emit `listid`, `appid`, `listsetid`, `listfield`. Therefore it is not an exact matching lowering shape and cannot be selected safely. Data List contracts, identifiers, control shapes, and routing evidence were not reused.

## Portfolio

| Family | Legacy boundary | Direct callers | Decision |
| --- | --- | ---: | --- |
| approval-form-submission-controls-and-sublist | buildApprovalFormLayoutDef -> materializeApprovalSubListControl -> normalizeApprovalSubListRowFields | 1 | rejected_missing_exact_legacy_lowering |
| document-library | buildDocumentLibraryFieldRecords -> child-resource assembly | 1 | rejected_missing_export_evidence |
| dashboard | buildMaterialDashboardResource -> filter/analytics/KPI/table materializers | 1 | rejected_missing_export_and_isolated_boundary |
| workflow-and-runtime-expression-configuration | buildApprovalWorkflowShapes and workflow action materializers | 1 | host_runtime_orchestration_only |
| top-level-data-list-outside-closed-sublist-family | fieldSpecsForList -> buildFieldRecord -> buildResourceGraphPackage | 1 | no_new_isolated_vertical_proven |

## Boundaries

Approval Form and Data List are separate product models. Approval Form list and listref variables are not Data List parent/child identities. For the Data List export, parent ListID and FieldID retain their product meaning while embedded `id` and `idx` remain export-column semantics only.

Document Library and Dashboard lack an authoritative export in this audit. The workflow export proves graph and action configuration, not a runtime-free static capability. Top-level Data List remains outside this phase's candidate set because all evidenced embedded-Sublist routes are already closed and the remaining top-level construction is identity, layout, template, resource, and package orchestration.

## Smallest Prerequisite

Establish, without changing production routing, an Approval Form-specific Legacy parity contract for embedded Sublist Lookup target/display metadata that preserves listid, appid, listsetid, and listfield as lossless configuration values.

Runtime selection, target lookup, writeback, file lifecycle, expression execution, graph mutation, templates, resources, and package output remain host or product-runtime responsibilities.
