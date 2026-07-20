# Core Extraction Caller Graph Reconciliation

`CORE_EXTRACTION_CALLER_GRAPH_RECONCILED`

## Decision

This one-time planning-data correction replaces the baseline same-file name scan and declaration subtraction with TypeScript AST call-expression and import-binding analysis. It parses only the 89 modules already declared by the production ownership inventory. Tests, fixtures, generated dist, documentation, protected duplicates, historical artifacts, and governance-only sources are not evidence.

## Caller Semantics

- Direct local calls are same-module AST call expressions.
- Imported binding calls resolve named and namespace imports to exported functions in another scoped production module.
- Exported consumers are unique importing production modules and remain separate from call-site totals.
- Callback-only functions are recorded from AST callback arguments.
- Truly unreachable means current, unexported production code with no resolved production invocation. Historical Legacy functions replaced by an accepted route remain traceable but are not mislabeled unreachable.

## Reconciliation

2628 inventory caller values changed. The correction does not alter capability ownership, proof-envelope membership, host boundaries, rollback scope, approved routes, Core exports, adapters, distribution artifacts, or closure-lineage transitions. Capacity is therefore unchanged.

## Next Work

The next work item is `core-extraction-wave3-batch-b-workflow-query-data-static-plan`.
