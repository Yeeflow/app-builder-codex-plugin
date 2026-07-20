# Phase 5B Data List Scalar Field Projection Core Shadow

Phase 5B implements a Core shadow only. It does not route production materialization, create an adapter export, change a distributed Core artifact, or modify the Legacy materializer.

## Legacy boundary

The current AST confirms this boundary:

```text
collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord
```

`buildFieldRecord` has one production call expression. It adds `FieldID` and `ListID`; Phase 5B stops before those values, generated resource records, and form-template mutation. The Legacy `buildFieldRecord` implementation remains unchanged.

## Immutable contract

`@yeeflow/app-builder-core-materializer` now exposes `projectDataListScalarField(input)` for workspace-only shadow parity. The public TypeScript DTOs are `ScalarFieldProjectionInput`, `ScalarFieldProjection`, `FieldControlProjectionFinding`, and `ScalarFieldProjectionResult`.

The input and result are JSON-serializable values. The function returns a fresh immutable projection, never mutates input, never allocates host IDs, and has no filesystem, process, environment, network, archive, API, runtime, template-mutation, or generated-resource-mutation behavior.

## Supported scalar matrix

| Legacy authority | Canonical field type | Canonical controls | Default value |
| --- | --- | --- | --- |
| Text and unrecognized scalar input | Text | input, textarea, select, checkbox | empty string |
| Date or time | Datetime | datepicker | empty string |
| Number, decimal, currency, amount, percent, or integer | Decimal | input_number | empty string |
| Boolean, yes/no, checkbox, or bit | Bit | switch | `0` |

The shadow preserves Legacy storage-name normalization, title handling, index calculation, fixed status/category/flag values, choice and color-choice JSON, inferred choice fallbacks, and barcode-scan error behavior. `required`, `unique`, `filterable`, and `sortable` are fixed `false` because the Legacy pre-ID field record does not own those planned flags.

## Deferred kinds

Lookup, sublist, identity, file, and image controls are explicitly deferred. Their Core findings explain why they require a future contract and do not claim scalar parity. No Lookup target resolution, sublist variable construction, identity binding, or binary-control behavior enters this slice.

## Differential evidence

The versioned corpus has 20 cases: 14 projected scalar cases, one barcode-scan error case, and five deferred-boundary cases. The runner evaluates the exact AST-extracted Legacy `buildFieldRecord` logic and the compiled Core implementation, compares normalized immutable projections and error behavior, and checks input immutability for both sides.

The next decision is Phase 5C review only. It must not add a compatibility adapter, distribution artifact, or production route until the immutable contract, proof surface, and rollback boundary are separately approved.
