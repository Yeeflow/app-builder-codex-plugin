# Phase 8D Data List Sublist Scalar Row-Schema Dual Public Distribution Promotion

## Decision

`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_VALID`

The official pipeline now exposes only `projectDataListSublistScalarRowSchema` and `lowerDataListSublistScalarRowSchemaAtHost` in addition to prior approved exports. The unchanged 21-case corpus passed compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts.

## Responsibility Boundary

Materializer Core returns immutable scalar row-schema intent, ordered descriptors, and findings only. Local Runtime validates explicit supplied parent/child/row-schema references and returns a fresh frozen Legacy-shaped scalar row fragment. Neither side allocates IDs, mutates templates or resources, discovers schema, resolves Lookup, or lowers non-scalar controls.

## Host Error Contract

All ten template-graph and row-schema reference errors are stable public Local Runtime errors: `SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING`, `SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID`, `SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH`, `SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE`, `SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN`, `SUBLIST_ROW_SCHEMA_REFERENCE_MISSING`, `SUBLIST_ROW_SCHEMA_REFERENCE_INVALID`, `SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH`, `SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE`, `SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN`.

## Artifact Transition

Planning Core remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`. Materializer Core changed from `d0f84581589de821a3c76f0eae8f62a591e6018abb940732b5195ce92453ba01` to `f22849123b27d980362c28692eff74e338be826795b71fe7dac847b2f42cbb36`; Local Runtime changed from `a354089eb7ee89bdaf9fcebc1241e7ecb50234711a17615b505581be0c22eb20` to `11d8267e1b9d416a8af5922f8f109316773d3e5545533fafd7da8ddbb3ffa7c6`.

## Phase 8E Prerequisite

Phase 8E may add thin adapters and route the coupled `buildDataListFormSubListControl` and `buildFieldRules` scalar row-schema boundary only. It must preserve host template integration and prove source, ZIP, installed, scope, determinism, and temporary-copy Legacy rollback parity.

## Non-Goals

No Legacy materializer, adapter, production route, active installation, historical ZIP, protected duplicate, Git, or release state changed.
