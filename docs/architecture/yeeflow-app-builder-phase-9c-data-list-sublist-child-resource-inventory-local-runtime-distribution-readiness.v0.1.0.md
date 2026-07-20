# Phase 9C Data List Sublist Child-Resource Inventory Local Runtime Distribution Readiness

## Decision

`SUBLIST_CHILD_RESOURCE_INVENTORY_DISTRIBUTION_READINESS_VALID`

The internal host-only inventory boundary is ready for a future Local Runtime-only public promotion. This audit does not promote an export, build an artifact, add an adapter, or reopen Phase 8E routing.

## Prospective Public API

`buildDataListSublistChildResourceInventoryAtHost` may accept only explicit post-API-allocation host data and immutable planned Sublist relationships. It may return only deeply frozen JSON-safe descriptors and `descriptorsByParentField`. It cannot allocate identities, call APIs, inspect mutable resources or package state, generate row schemas, write packages, or provide a Legacy fallback.

## Stable Errors

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

## Phase 9D Promotion Proof

Use the official Local Runtime distribution builder to add exactly the prospective export. Prove the unchanged 20-case corpus through compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin. Verify export/contract/manifest/artifact/checksum/version/path parity, JSON serialization, deep immutability, all error codes, and the absence of workspace, source, repository, node_modules, source-map, or bare-package leakage.

## Conditions Before Reopening Phase 8E

A separate authorized integration must first prove actual post-allocation child ListID, child FieldID, and row-schema inventory availability. One shared validated descriptor selection must feed both `buildDataListFormSubListControl` and `buildFieldRules`; neither consumer may fabricate or coerce identities. The later routing proof must include source/archive/installed parity, all eleven errors, lossless nineteen-digit IDs, determinism, excluded-family scope gates, and a temporary-copy-only Legacy rollback.

## Preserved Boundaries

No public Local Runtime index, distribution contract or builder, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, Git, or release state changed.
