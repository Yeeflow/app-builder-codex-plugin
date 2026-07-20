# Phase 7E Selective Data List Type 1 Identity-Control Placement Routing Proof

## Decision

`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_ADAPTER_ROUTING_PASSED`

Only the existing `buildDataListFormFieldsGrid -> buildDataListFormFieldControl` production path is routed. The route applies to Type 1 Data List view and workbench non-sublist identity, user, people, and person controls only.

## Responsibility Boundary

Materializer Core receives immutable template descriptors, node and slot references, ListID and FieldID strings, and identity-field intent. Local Runtime validates the host snapshot and host-supplied control ID, then returns a fresh fragment. The Legacy host retains template loading, identity selection, mutable insertion, form and layout integration, and package output.

## Evidence

The seventeen-case matrix passed source, temporary official ZIP, and simulated installed Plugin materialization against a temporary-copy Legacy baseline. It covers every approved identity variant, view and workbench placements, multiple control ordering, nineteen-digit identities, all five template-reference errors, excluded families, deterministic double runs, and rollback. UUID normalization is limited to pre-existing values and never changes node, slot, control, ListID, or FieldID semantics.

## Retained Legacy Scope

- sublists
- department
- file image binary
- barcode
- Lookup placement
- scalar controls
- Type 0 layouts
- Approval Forms
- Document Libraries
- Dashboards
- workflows
- actions
- template graph assembly
- package output

## Non-Goals

No additional Core or Local Runtime public export, unrelated production route, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.
