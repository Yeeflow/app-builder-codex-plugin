# Phase 9E Data List Sublist Child-Resource Inventory Post-Allocation Integration Readiness

## Decision

`SUBLIST_CHILD_RESOURCE_INVENTORY_INTEGRATION_READINESS_REJECTED`

Production cannot yet construct or thread the validated inventory. The current API-issued allocation only covers top-level Data List ListID, FieldID, and LayoutID paths. It does not provide the child ListID, child FieldID, or row-schema identity required by the public Local Runtime inventory contract.

## Exact Production Boundary

`buildIdPaths` has one caller at line 273 and `allocateIds` has one caller at line 274. The single call to `buildResourceGraphPackage` at line 284 is the future host-only integration location: its entry is after allocation and before `buildFieldRecord` and custom-form lowering diverge. The location is structurally correct but cannot construct a valid inventory from the current response.

## Identity Source Matrix

| Identity | Current source | Status |
| --- | --- | --- |
| parentListId | API allocation response (decoded.Childs[index].List.ListID) | available |
| parentFieldId | API allocation response (decoded.Childs[index].Fields[fieldIndex].FieldID) | available |
| childListId | unavailable | absent |
| childFieldId | unavailable | absent |
| rowSchemaId | unavailable | absent |

The two coupled consumers remain `buildDataListFormSubListControl` at line 4777 and `buildFieldRules` at line 4960 through `dataListSubListVariables` at line 4834. Planned `row.idx` values and `deterministicUuid(seed)` values are presentation keys, not child-resource identities.

## Required External Prerequisite

The product/API allocation manifest and post-allocation resource model must supply API-issued, lossless non-empty decimal-string Sublist child ListID, each child FieldID, and each row-schema identity with explicit parent-child-row-schema scopes before buildResourceGraphPackage lowerings begin.

No code workaround is valid. In particular, Phase 9E rejects plan indexes, deterministic UUIDs, placeholders, parent-ID reuse, numeric coercion, inferred child resources, fallback allocation, and one-consumer-only threading.

## Future Phase 9F and Phase 8E

After the external prerequisite exists, Phase 9F must prove one frozen inventory construction at the documented location and thread the same selection to both consumers. Only then may a separately authorized Phase 8E routing proof be reconsidered.

## Preserved Boundaries

No production materializer, adapter, public API, artifact, distribution contract, active installation, historical ZIP, protected duplicate, Git, or release state changed.
