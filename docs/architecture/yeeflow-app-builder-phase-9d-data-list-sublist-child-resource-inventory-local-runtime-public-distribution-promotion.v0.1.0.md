# Phase 9D Data List Sublist Child-Resource Inventory Local Runtime Public Distribution Promotion

## Decision

`SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_VALID`

The official pipeline now exposes only `buildDataListSublistChildResourceInventoryAtHost` in addition to the existing approved Local Runtime exports. The unchanged 20-case corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts.

## Public Boundary

The function accepts only immutable post-API-allocation Data List Sublist relationships. It returns only deeply frozen JSON-safe ordered descriptors and `descriptorsByParentField`. It cannot allocate identities, call APIs, inspect or mutate resources/packages, generate row schemas, discover child resources, coerce numeric IDs, or use a Legacy fallback.

## Stable Host Errors

- SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING
- SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID
- SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY
- SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE
- SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH
- SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN
- SUBLIST_ROW_SCHEMA_IDENTITY_MISSING
- SUBLIST_ROW_SCHEMA_IDENTITY_INVALID
- SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE
- SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH
- SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN

## Artifact Transition

Planning Core remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`. Materializer Core remains `f22849123b27d980362c28692eff74e338be826795b71fe7dac847b2f42cbb36`. Local Runtime changed from `11d8267e1b9d416a8af5922f8f109316773d3e5545533fafd7da8ddbb3ffa7c6` to `1b7725b863a6acabc8cfdccef71a63db660e8479fb5d12cf70109e1289d6b2e5`.

## Phase 9E Integration Readiness

Phase 9E is accepted as an audit only. Before Phase 8E can be reopened, it must prove post-allocation child ListID, child FieldID, and row-schema availability, then prove one shared validated descriptor selection reaches both coupled consumers without identity fabrication, coercion, or fallback.

## Non-Goals

No Materializer Core public API, Legacy materializer, adapter, production route, active installation, historical ZIP, protected duplicate, Git, or release state changed.
