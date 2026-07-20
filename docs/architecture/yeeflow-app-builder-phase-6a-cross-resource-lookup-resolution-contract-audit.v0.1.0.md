# Phase 6A Cross-Resource Data List Lookup-Resolution Contract Audit

## Decision

`PHASE_6_LOOKUP_CONTRACT_ACCEPTED`

A bounded future Lookup shadow is accepted. Materializer Core may build immutable Lookup intents and deterministic request descriptors only. Host or Local Runtime code resolves supplied target identities and lowers fresh Lookup Rules.

## Legacy Boundary

`buildResourceGraphPackage -> validatePlannedLookupTargetsMaterialized -> fieldSpecsForList -> resolveLookupTargetListId -> buildFieldRecord -> buildFieldRules`

Legacy target matching consults a host map using direct and singularized candidate keys. Unresolved values become an empty Rules payload, while planning validation records `FULL_APP_MATERIALIZATION_LOOKUP_TARGET_DATA_LIST_NOT_PLANNED`. The future contract forbids Core from preserving implicit target discovery.

## Responsibility Split

Core receives logical source and target data only; it does not receive ListIDs, FieldIDs, target maps, templates, resource records, or tenant state. The host receives the readonly target map plus source relationship context, validates all identities, rejects ambiguity, and lowers the Rules JSON.

## Stable Errors

- `LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING` — No supplied target-map entry exists for a declared normalized target key.
- `LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID` — A target ListID is missing, non-string, lossy, malformed, or otherwise invalid.
- `LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH` — A supplied target map entry is not scoped to the resolved Data List.
- `LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN` — The supplied source FieldID does not belong to the supplied source ListID context.
- `DATA_LIST_LOOKUP_TARGET_UNRESOLVED` — No validated target can be resolved from the supplied map and declared target request.
- `LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS` — More than one supplied mapping matches a declared normalized target request.

## Fixture Coverage

The versioned matrix has 14 cases: exact and singular aliases, 19-digit IDs, missing and unresolved targets, numeric and malformed IDs, scope and relationship failures, ambiguity, and excluded surfaces.

## Non-Goals

No Core shadow, public export, artifact, adapter, route, template mutation, API call, package output, active installation, or release action is created by this audit.
