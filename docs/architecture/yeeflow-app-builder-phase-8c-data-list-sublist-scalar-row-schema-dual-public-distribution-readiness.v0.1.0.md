# Phase 8C Data List Sublist Scalar Row-Schema Dual Public-Distribution Readiness

## Decision

DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_DUAL_DISTRIBUTION_READINESS_VALID

Both prospective APIs have bounded public surfaces. This decision authorizes only a future promotion proof; it does not add either public export or route production behavior.

## Prospective Materializer Core API

projectDataListSublistScalarRowSchema may expose immutable JSON-safe scalar descriptors, input, intent, finding, and result DTOs. It excludes mutable templates/resources, allocation maps, generated IDs, nested controls, summaries, Lookup, non-scalar fields, runtime expressions/actions, and Legacy record shapes.

## Prospective Local Runtime API

lowerDataListSublistScalarRowSchemaAtHost may receive immutable Core intent plus explicit host identity and hierarchy context. It owns all supplied-reference validation and returns fresh Legacy-shaped scalar list-variables fragments only. It cannot allocate or discover identities, mutate templates, or silently fall back.

## Required Host Errors

- SUBLIST_TEMPLATE_GRAPH_REFERENCE_MISSING
- SUBLIST_TEMPLATE_GRAPH_REFERENCE_INVALID
- SUBLIST_TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH
- SUBLIST_TEMPLATE_GRAPH_REFERENCE_DUPLICATE
- SUBLIST_TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN
- SUBLIST_ROW_SCHEMA_REFERENCE_MISSING
- SUBLIST_ROW_SCHEMA_REFERENCE_INVALID
- SUBLIST_ROW_SCHEMA_REFERENCE_SCOPE_MISMATCH
- SUBLIST_ROW_SCHEMA_REFERENCE_DUPLICATE
- SUBLIST_ROW_SCHEMA_REFERENCE_RELATIONSHIP_BROKEN

## Phase 8D Promotion Proof

Use the official builder to promote exactly these two APIs, then prove the unchanged 21-case corpus through compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts. Validate export, contract, manifest, path, checksum, serialization, immutability, and leakage parity.

## Phase 8E Coupled-Consumer Routing Proof

Route only the shared scalar row-schema seam and prove both current consumers: buildDataListFormSubListControl and buildFieldRules. The host must retain template loading, identity supply, nested-control construction, summary work, graph mutation, and package output. Require source/archive/installed integration parity, determinism, excluded-family scope gates, and a temporary-copy-only rollback restoring the shared Legacy path.

## Non-Goals

No public index, distribution contract/builder, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.
