# Phase 9A Data List Sublist Child-Resource Identity-Map Contract Audit

## Decision

`SUBLIST_CHILD_RESOURCE_IDENTITY_CONTRACT_VALID` and `PHASE_9_SUBLIST_IDENTITY_CONTRACT_ACCEPTED`

The contract is valid, but the current production route remains blocked. API-issued allocation presently creates only top-level child-resource ListID, FieldID, and LayoutID values. It creates no Sublist child ListID, child FieldID, or row-schema identity.

## Audited Flow

| Identity | Current source | Status |
| --- | --- | --- |
| Parent ListID | `decoded.Childs[index].List.ListID` | host-issued lossless string |
| Parent FieldID | `decoded.Childs[index].Fields[fieldIndex].FieldID` | host-issued lossless string |
| Child ListID | no ID path or inventory | absent |
| Child FieldID | no ID path or inventory | absent |
| Row-schema identity | planned `idx` or deterministic UUID | not a host allocation |

The shared `dataListSubListVariables` seam still has two consumers: `buildDataListFormSubListControl` at line 4777 and `buildFieldRules` at line 4960. The former has a parent ListID and FieldID; the latter has neither. It is therefore not a safe identity boundary.

## Contract

A future host-owned `DataListSublistChildResourceIdentityMap` must provide a distinct, non-empty, lossless-string parent ListID, parent FieldID, child ListID, child FieldID, and row-schema identity with explicit scopes and child logical-field keys. The host validates and owns the map, mutable resource integration, and package output. Core receives only a selected frozen descriptor; it cannot allocate, infer, coerce, reuse, or mutate identities.

## Stable Errors

- `SUBLIST_CHILD_RESOURCE_IDENTITY_MISSING`
- `SUBLIST_CHILD_RESOURCE_IDENTITY_INVALID`
- `SUBLIST_CHILD_RESOURCE_IDENTITY_LOSSY`
- `SUBLIST_CHILD_RESOURCE_IDENTITY_DUPLICATE`
- `SUBLIST_CHILD_RESOURCE_IDENTITY_SCOPE_MISMATCH`
- `SUBLIST_CHILD_RESOURCE_IDENTITY_RELATIONSHIP_BROKEN`
- `SUBLIST_ROW_SCHEMA_IDENTITY_MISSING`
- `SUBLIST_ROW_SCHEMA_IDENTITY_INVALID`
- `SUBLIST_ROW_SCHEMA_IDENTITY_DUPLICATE`
- `SUBLIST_ROW_SCHEMA_IDENTITY_SCOPE_MISMATCH`
- `SUBLIST_ROW_SCHEMA_IDENTITY_RELATIONSHIP_BROKEN`

## Phase 8 Dependency

Phase 8E remains blocked on this prerequisite. The accepted Phase 9B candidate is a host-only child-resource inventory and validation shadow at package assembly, before `buildFieldRecord` and custom-form lowering diverge. It must prove a shared immutable descriptor for both consumers before any routing can be reconsidered.

## Preserved Boundaries

No production route, Legacy materializer behavior, adapter, public API, artifact, active installation, historical ZIP, protected duplicate, Git, or release state changed.
