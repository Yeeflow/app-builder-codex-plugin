# Phase 6B Data List Lookup-Resolution Internal Shadow

## Decision

The deterministic Lookup intent and explicit host-lowering shadows are complete internally. Phase 6C dual public-distribution readiness is not assessed or accepted by this task.

## Boundary

Materializer Core internal function `projectDataListLookupResolutionIntentInternal` accepts only a Data List logical source, logical field, ordinal, declared target text, display name, and Lookup control type. It returns frozen candidate-key requests and frozen validation findings. It has no target ListID, target map, template, resource, filesystem, environment, API, runtime, or host-effect input.

Local Runtime internal function `lowerDataListLookupResolutionAtHost` receives the immutable intent plus host-supplied readonly target IDs, target scopes, and source relationship context. It validates lossless decimal-string IDs, target scope, ambiguity, and source ListID/FieldID relationship, then creates a fresh Legacy-shaped `Rules` JSON payload. It does not allocate IDs, resolve a tenant resource, mutate a map, or mutate a Core result.

## Legacy Evidence

A TypeScript-AST extracted VM harness executed the exact Legacy `resolveLookupTargetListId` and `buildFieldRules` functions. Four resolved cases have identical Rules JSON. The empty-intent case has the same Legacy empty Rules output; the Core result records the contract-required unresolved finding before host lowering. Host allocation and mapping failures are separately tested contract gates because the Legacy helper only returns an empty Rules value for unresolved host maps.

## Corpus

The versioned corpus has 15 cases: four successful direct, singular, display fallback, and 19-digit target paths; one empty-intent finding; six stable host validation failures; and four excluded surface or control cases.

## Stable Errors

- `LOOKUP_RESOLUTION_TARGET_MAPPING_MISSING`
- `LOOKUP_RESOLUTION_TARGET_LIST_ID_INVALID`
- `LOOKUP_RESOLUTION_TARGET_SCOPE_MISMATCH`
- `LOOKUP_RESOLUTION_SOURCE_TARGET_RELATIONSHIP_BROKEN`
- `DATA_LIST_LOOKUP_TARGET_UNRESOLVED`
- `LOOKUP_RESOLUTION_TARGET_MAPPING_AMBIGUOUS`

## Non-Goals

No public export, distribution artifact, adapter, production route, Legacy materializer change, active installation change, historical ZIP change, or release action occurred.
