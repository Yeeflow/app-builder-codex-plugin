# Phase 9N Selective Data List Embedded Sublist Frozen-Descriptor Production Host-Context Routing Proof

## Decision

Accepted. One descriptor is selected at `buildResourceGraphPackage -> fieldSpecsForList(...).map -> buildFieldRecord` before Rules and custom-form lowering diverge. The Materializer Core API returns the immutable descriptor, while the Plugin-local closure binds the original field-spec and completed record to that same instance.

## Scope

The route accepts only export-proven scalar embedded columns: text, date/datetime, number/decimal, and boolean/bit. Parent ListID and FieldID remain the only product resource identities. Embedded `idx` and `id` remain ordered export-schema semantics and are never allocation input, fallback keys, or child resource identities.

Rules reads the selected descriptor through the original field-spec binding. Custom-form `list-fields` lowering reads the same descriptor through the completed-record binding. The host context is one closure per `buildResourceGraphPackage` invocation, is disposed in `finally`, and has no serializable data properties.

## Evidence

The actual materializer corpus uses the export-derived Leave details shape with four ordered scalar columns. It proved source, temporary official ZIP, and simulated installed Plugin parity against a temporary-copy Legacy rollback. It also proved double-run determinism, descriptor instance equality, one selection, isolated contexts, disposed-context failure, and no child resource identity keys.

`SUBLIST_EMBEDDED_SCHEMA_ADAPTER_ROUTING_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_HOST_CONTEXT_ROUTING_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_SOURCE_ROUTING_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_ARCHIVE_ROUTING_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_INSTALLED_ROUTING_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_MATERIALIZER_INTEGRATION_PARITY_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_SHARED_INSTANCE_PARITY_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_SINGLE_SELECTION_DETERMINISM_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_CONTEXT_ISOLATION_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_ROUTING_SCOPE_GATES_PASSED`

`SUBLIST_EMBEDDED_SCHEMA_LEGACY_ROLLBACK_PASSED`

## Retained Legacy Scope

Nested controls, summaries, Lookup, identity/user/department, binary controls, barcode, actions, Type 0/Type 1 graph mutation, Approval Forms, Document Libraries, Dashboards, workflows, and package output remain Legacy-owned. No Local Runtime API, active installation, historical ZIP, release state, or protected duplicate changed.
