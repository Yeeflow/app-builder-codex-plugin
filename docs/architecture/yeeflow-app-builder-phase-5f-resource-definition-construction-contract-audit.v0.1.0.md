# Phase 5F Resource-Definition Construction Contract Audit

## Revised Decision

Phase 5G correctly blocked the original default-view proposal because its
fixed-filter parser allocated keys through `crypto.randomUUID()` and its
checked path mutated a caller-owned findings array. Phase 5H defined the
explicit host contract and Phase 5I implemented a non-routed Core intent
parser plus Local Runtime lowering shadow. The Phase 5J re-audit therefore
accepts `data-list-default-view-layout-projection` for a future shadow only:
`DATA_LIST_DEFAULT_VIEW_LAYOUT_PROJECTION_REAUDIT_ACCEPTED`.

The accepted boundary is still not a production route. Core may receive only
supplied FieldIDs, an immutable view intent, and a caller-supplied template
snapshot. Core returns a fresh immutable layout/query/sort/row-color fragment
and fixed-filter intents. Local Runtime remains responsible for opaque key
allocation validation, legacy filter lowering, findings append, and final
resource integration.

## Entry-Point Matrix

| Candidate | Legacy entry points | Classification | Contract blocker or reason |
| --- | --- | --- | --- |
| Data List default view layout projection | `buildDataListViewLayoutView`, `buildDataListViewLayoutViewChecked` | eligible-after-fixed-filter-host-contract | Core can project layout/query data and fixed-filter intents after the explicit Phase 5I host key and findings boundary; FieldIDs remain supplied inputs. |
| Data List resource record assembly | `buildResourceGraphPackage`, `listInfo`, `buildFieldRecord` | requires-identity-allocation-contract | Coordinates ListID, FieldID, LayoutID, lookup references, and mutable record assembly. |
| Document Library resource definition | `buildDocumentLibraryFieldRecords`, `buildDocumentLibraryFolderItems` | requires-identity-allocation-contract | Requires default-field and folder policy plus ListID, FieldID, and folder identities. |
| Data List custom form layout construction | `buildCustomFormLayout`, `materializeDataListFormResource`, `buildDataListFormFieldsGrid` | requires-template-graph-contract | Reads and mutates template graphs and binds action/runtime controls. |
| Public Form resource construction | `buildPublicFormEntry`, `materializePublicFormResource`, `buildPublicFormFieldsGrid` | requires-template-graph-contract | Requires public-form identity, ListID attachment, and mutable template lowering. |
| Dashboard page, layout, and collection construction | `buildMaterialDashboardResource`, `buildCollectionTemplateInstance`, `buildDashboardPageLayoutShell` | requires-template-graph-contract | Combines mutable page/collection templates with Data List references and runtime bindings. |
| Dashboard navigation layout definition | `buildNavigationLayoutView`, `buildApplicationLayoutContract` | requires-identity-allocation-contract | Serializes identities from every generated resource surface into application navigation. |
| Approval Form definition and layout | `approvalFormDef`, `materializeApprovalFieldControls`, `buildApprovalFormFieldsGrid` | requires-workflow-or-form-contract | Couples control/template graphs to variables, workflow, task, and control identities. |
| Approval workflow resource definition | `buildApprovalDefResource`, `buildApprovalWorkflowShapes`, `buildApprovalWorkflowStepNode` | requires-workflow-or-form-contract | Builds cross-surface workflow graphs with expressions, tasks, and node identities. |
| Workflow Set Data List resource definition | `buildWorkflowSetDataListDefResource`, `buildWorkflowSetDataListShapes`, `buildWorkflowSetDataListProperties` | requires-workflow-or-form-contract | Requires host list identities, workflow action semantics, loops, and mutable workflow shapes. |
| Decoded package root construction | `buildDecodedPackage`, `buildDefaultApplicationControlStyles` | requires-identity-allocation-contract | Aggregates root application identities and all child resources. |
| Generated-final entry orchestration | `materializeFullAppGeneratedFinal`, `buildSeedDataArtifact`, `buildFailure` | host-orchestration-only | Owns filesystem, package/archive work, reports, fixture IDs, and runtime orchestration. |

## Future Phase 5K Shadow Boundary

The future shadow input is `DataListDefaultViewLayoutProjectionInput` with a
view scope, supplied field references, immutable view intent, and a
`DataListDefaultViewTemplateSnapshot` containing static query descriptors.
The Core output is a fresh immutable `DataListDefaultViewLayoutProjection`
with layout, query, sort, row-color, and `FixedFilterProjectionResult` data.
Core must not allocate ListID, LayoutID, FieldID, or filter keys; load or mutate
templates; mutate findings; or integrate generated resources.

Local Runtime must receive the fixed-filter projection and explicit
`keysByRequestId`, lower the Legacy-shaped filter, and append findings only to
an explicit caller-owned array. The host then integrates the immutable fragment
into the final resource.

## Re-Audit Requirements

The shadow corpus must cover Title-first ordering, zero and over-twelve field
limits, explicit and fallback display/query fields, duplicate field requests,
supplied FieldIDs, static query snapshot fields, no/valid/malformed filters,
allocated keys, and ordered findings. It must compare unnormalized output,
error behavior, and input snapshots in source, temporary official ZIP, and
simulated installed Plugin layouts. A temporary-copy-only rollback must restore
the checked Legacy lowering without changing identity, template, or package
paths.

## Deferred Families

All other resource-definition entries require an identity-allocation,
template-graph, or workflow/form contract before a narrow Core projection can
be selected. Generated-final orchestration remains host-only because it owns
package writing, archive work, filesystem/report handling, and fixture/runtime
coordination.

## Phase 5F Non-Goals

This audit and its correction do not modify the Legacy materializer, the
materializer Core adapter, existing scalar routing, distribution artifacts, the
active Plugin installation, or the historical release ZIP. They do not
authorize implementation or routing.

## Phase 5K Internal Shadow Status

The accepted candidate now has the workspace-internal
`projectDataListDefaultViewLayoutInternal` shadow module. Its source path and
digest are regenerated in the resource-definition ledger. It remains outside
the public Materializer Core index, the public API and distribution contracts,
and the Plugin distribution artifact. It has no adapter or production route.

Phase 5L rejected public promotion because the required
`lowerFixedFilterProjectionAtHost` companion is still a private workspace Local
Runtime export. A separately versioned, Plugin-resolvable Local Runtime
lowering contract is required before any future LayoutView Core API or
distribution decision.

## Phase 5O Follow-Up

Phase 5N proved the required Local Runtime artifact. Phase 5O therefore
accepted a future public API for this bounded projection, while keeping the
internal module unexported and the route unchanged. The regenerated ledger
records the API as `defined_not_promoted`; Phase 5P distribution proof remains
required before any adapter or production routing decision.

## Phase 5P Follow-Up

Phase 5P promoted only `projectDataListDefaultViewLayout` and its approved
immutable DTOs through the official Materializer Core artifact. The ledger
records the resulting artifact metadata and retains `not_started` routing;
no resource-definition lowering moved to Core or production behavior.
