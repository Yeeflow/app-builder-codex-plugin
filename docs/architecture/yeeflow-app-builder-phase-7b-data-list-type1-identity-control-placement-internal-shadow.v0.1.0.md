# Phase 7B Data List Type 1 Identity/User Control Placement Internal Shadow

## Boundary

The exact Legacy boundary is buildDataListFormFieldControl with one production caller from buildDataListFormFieldsGrid. This shadow covers only non-sublist view/workbench identity, user, people, and person fields that Legacy maps to dynamic-user.

## Core and Host Split

Core receives immutable snapshot descriptors, explicit node and slot references, lossless ListID and FieldID values, and a normalized identity field. It emits a frozen descriptor without a control ID. Local Runtime validates snapshot references, requires the host-supplied control ID, and returns a fresh Legacy-shaped control fragment without mutating the snapshot.

## Evidence

The corpus has 21 cases: five valid Legacy parity variants, five stable host template-reference errors, and eleven excluded field or surface categories. A VM harness executes the exact Legacy helper declarations. No control identity is normalized away.

## Non-Goals

No public export, adapter, distribution artifact, Legacy source change, or production routing occurred.
