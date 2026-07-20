# Phase 8A Data List Sublist Nested Template-Graph Contract Audit

## Decision

`PHASE_8_SUBLIST_CONTRACT_ACCEPTED`

## Selected Phase 8B Candidate

`data-list-sublist-explicit-scalar-row-schema-intent` is limited to explicit scalar Sublist row-schema intent. All identities are supplied lossless strings. It has no nested control lowering, summaries, Lookup or advanced rows, actions, template mutation, or package output.

## Family Inventory

| Family | Classification |
| --- | --- |
| sublist-field-records-and-rules | requires-resource-identity-and-row-schema-contract |
| sublist-row-schema-normalization | eligible-phase8b-internal-shadow |
| nested-control-placement | requires-nested-template-graph-contract |
| summary-and-aggregation-definitions | requires-summary-temporary-variable-contract |
| type-zero-and-type-one-presentation | requires-view-lifecycle-template-contract |
| default-new-edit-form-lifecycle | requires-form-lifecycle-template-contract |
| embedded-lookup-and-advanced-controls | requires-cross-contract-control-semantics |
| template-identity-layout-and-package-integration | host-orchestration-only |

## Contract

Core receives immutable nested template snapshots and explicit parent, child, row-schema, node, slot, ListID, and FieldID references. It returns immutable intents and findings only. The host owns template loading, identity and hierarchy validation, child-ID supply, graph lowering, mutation, findings append, resource integration, and package output.

## Non-Goals

No Sublist Core shadow, public export, distribution artifact, adapter, production route, active installation, historical ZIP, protected duplicate, Git publication, or release change occurred.
