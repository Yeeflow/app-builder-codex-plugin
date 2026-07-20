# Phase 5AB Data List Scalar Resource Identity Routing Proof

## Routed Boundary

Only the existing Data List scalar branch in `buildFieldRecord` routes through the distributed APIs. The route starts after `projectDataListScalarField` returns a non-null immutable projection and ends before the retained `buildDataListScalarFieldRecordFromProjection` helper.

The host preserves the already supplied lossless `ListID`, `FieldID`, and `fieldIndex`. Materializer Core receives an immutable scalar projection, deterministic resource scope, and ordinal. Local Runtime receives one explicit immutable allocation map and returns a fresh Legacy-shaped scalar field-record fragment. The host still owns field-record insertion, child-resource assembly, generated-resource mutation, and package integration.

## Scope

The route includes Text or unrecognized scalar, Datetime, Decimal, Bit, and approved select or checkbox variants. Lookup, sublist, identity or department, file or image binary, unresolved lookup, template-dependent, cross-resource, and non-Data-List paths remain on the retained Legacy branches.

## Evidence

The eighteen-case routing matrix covers scalar field shapes, 19-digit identity preservation, barcode behavior, all seven host identity errors, deferred-family exclusions, and decoded resource references. Source, temporary official ZIP, simulated installed Plugin, deterministic output, scope gates, and a temporary-copy-only rollback passed.

The rollback restores only the retained Legacy scalar record-builder call in a temporary Plugin copy. It removes the two new adapter bindings and route statements while retaining the scalar field projection, Materializer Core artifact, and Local Runtime artifact required by prior routed capabilities.
