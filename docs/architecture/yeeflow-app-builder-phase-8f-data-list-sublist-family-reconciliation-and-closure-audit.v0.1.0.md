# Phase 8F Data List Sublist Family Reconciliation and Closure Audit

## Decision

Phase 8 is accepted as closed. The authoritative production model is Phase 9N: parent ListID and parent FieldID are the only product identities; ordered embedded `id`, `idx`, `name`, `type`, and `editable` are export-schema semantics only. One frozen descriptor is selected before `buildFieldRecord` and shared by Rules and custom-form `list-fields` lowering for scalar embedded columns.

Phase 8B and 8D remain valid isolated capability evidence. Their public scalar row-schema APIs are retained as dormant, future-use-only capabilities. They are not production-routed for embedded Sublist schemas because their original child-resource and row-schema identity premise is superseded. Removing or deprecating either API requires separate authorization.

The Phase 8E `NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING` blocker remains unchanged historical evidence. Its child-identity prerequisite is superseded by Phase 9G export evidence and the approved Phase 9N route; the blocker is not deleted or rewritten.

## Deferred Families

Nested controls, summaries, Lookup, identity, binary, barcode, actions, layout mutation, and package output remain deferred. Each requires its own host/runtime contract and cannot inherit the Phase 9N scalar embedded-schema descriptor route.

Phase 10 is `phase-10-sublist-summary-temporary-variable-contract-audit`. It starts with summaries and aggregations only; nested controls and graph mutation remain excluded.

## Preserved Boundaries

No production materializer behavior, adapter, Core API, artifact, distribution contract, Plugin dist, active installation, historical ZIP, protected duplicate, Git, or release state changed.

`DATA_LIST_SUBLIST_EMBEDDED_SCHEMA_ROUTE_RECONFIRMED`

`DATA_LIST_SUBLIST_CHILD_IDENTITY_PREMISE_SUPERSEDED`

`DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_CAPABILITY_RECONCILED`

`DATA_LIST_SUBLIST_FAMILY_CLOSURE_VALID`

`PHASE_8_CLOSURE_ACCEPTED`

`PHASE_CLOSURE_PROOF_LINEAGE_VALID`
