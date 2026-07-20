# Phase 5AA Data List Scalar Resource-Definition Routing Readiness Audit

## Decision

`DATA_LIST_SCALAR_RESOURCE_IDENTITY_ROUTING_READINESS_ACCEPTED`

The audit accepts only a future selective route inside the existing scalar branch of `buildFieldRecord`. It starts after `projectDataListScalarField` returns an immutable non-null projection and ends before the retained Legacy `buildDataListScalarFieldRecordFromProjection` lowerer returns its scalar record.

## Exact Boundary

The sole production path is:

```text
collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord
```

The TypeScript AST records one `buildFieldRecord` call expression and one ID-bearing call site. The caller converts the decoded ListID and FieldID to lossless strings before invoking `buildFieldRecord`. `fieldIndex` is the scalar ordinal and the immutable projection retains the logical field name.

The future bridge may create a deterministic resource scope, call the Materializer Core intent projector, create a one-request host allocation map from those already supplied string identities, and call the Local Runtime lowerer. It must not allocate, fabricate, coerce, or resolve identities.

## Scope

Included only: Text or unrecognized scalar, Datetime, Decimal, Bit, and the approved scalar select and checkbox control variants.

Excluded: lookup, sublist, identity or department, file or image binary, unresolved lookup target, template-dependent branches, and cross-resource branches.

## Required Phase 5AB Evidence

- One Materializer Core adapter export and one Local Runtime adapter export.
- Actual materializer parity in source, a temporary official ZIP, and a simulated installed Plugin layout.
- Text, Datetime, Decimal, Bit, approved controls, choices, defaults, barcode error, and deferred-family scope matrix.
- All seven identity errors and lossless 19-digit ListID and FieldID checks.
- Determinism, scope gates, existing scalar-field and LayoutView regression protection, and a temporary-copy-only Legacy rollback.

Host code retains field-record insertion, child resource assembly, generated-resource mutation, and package integration. No production route, adapter, artifact, or Legacy behavior changed in this audit.
