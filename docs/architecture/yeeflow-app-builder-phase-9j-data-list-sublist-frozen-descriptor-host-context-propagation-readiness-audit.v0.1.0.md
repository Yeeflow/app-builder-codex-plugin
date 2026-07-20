# Phase 9J Data List Sublist Frozen-Descriptor Host-Context Propagation Readiness

## Decision

The propagation mechanism is accepted for a future separately authorized route, but is not routed now. A raw-field-only WeakMap is insufficient because custom-form lowering receives a completed field record.

## Accepted Context

Create one closure-owned context per buildResourceGraphPackage invocation. It owns two WeakMaps: raw field to descriptor and completed field record to the same descriptor. Future host-only argument propagation reaches Rules and custom-form without serializing, global state, list-key reuse, or recomputation.

## Lifecycle

Select once before buildFieldRecord; bind the returned completed record; read at both consumers; fail closed on a missing association; allow both WeakMaps to become unreachable when the build returns.

## Boundaries

Rules strings, list-fields, templates, summaries, nested controls, actions, and package output remain host lowerings. Public Core distribution remains rejected until a separately authorized Phase 9K reassessment.
