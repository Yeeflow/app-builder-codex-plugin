# Phase 8E Data List Sublist Scalar Row-Schema Coupled Routing Proof

## Decision

`NO_SAFE_DATA_LIST_SUBLIST_SCALAR_ROW_SCHEMA_ROUTING`

Production routing is unsafe under the approved Phase 8D contract. The shared `dataListSubListVariables` seam has exactly two production call expressions: `buildDataListFormSubListControl` at line 4777 and `buildFieldRules` at line 4960. It receives an untyped field plus a seed, not the required host identity map.

## Missing Host Boundary

The form-control consumer has only a parent `listId` and `field.FieldID`; the rules consumer has neither explicit ListID nor FieldID. Neither caller supplies a child ListID, child FieldID, row-schema ID, or parent-child hierarchy snapshot. The planned rows contain labels, type, and control metadata only.

## Why Routing Would Violate the Contract

The public Core and Local Runtime API require explicit lossless parent/child/row-schema identities. Deriving or reusing identities at this seam would fabricate host-owned identity and would make one or both consumers observe a different result. A one-consumer route would violate the coupled-consumer parity requirement.

## Required Prerequisite

A separate child-resource identity-map and row-schema allocation contract must supply the explicit lossless inputs listed in the blocker manifest. Only then may a new routing readiness audit define source, ZIP, installed, determinism, all-error, and temporary-copy Legacy rollback evidence.

## Preserved Boundaries

No Legacy materializer, adapter, artifact, distribution contract, active installation, historical ZIP, protected duplicate, Git, or release state changed. No Phase 8E lineage transition was appended because no route was approved.
