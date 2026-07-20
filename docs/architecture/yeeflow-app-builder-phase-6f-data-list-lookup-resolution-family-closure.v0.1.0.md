# Phase 6F Data List Lookup-Resolution Family Closure

## Decision

`PHASE_6_CLOSURE_ACCEPTED`

The routed Data List Lookup Rules boundary is complete. No additional Lookup-only deterministic vertical remains under the current contracts.

## Reconfirmed Route

`collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord` has one production caller. It is guarded to `type === "lookup"`, an explicit host target map, and no sublist content. Core returns immutable intent; Local Runtime validates host mapping and lowers fresh `Rules.listid`; the host owns identities, final resource integration, and package output.

## Deferred Lookup-Adjacent Categories

- **target-resource-integration** — `host-orchestration-only`; requires `cross-resource-target-resource-integration-contract`. Target-resource integration reads and writes the generated Data List graph, records planning findings, and participates in package assembly. It is host orchestration rather than immutable Lookup intent or Rules lowering.
- **reverse-relationship-handling** — `requires-template-graph-contract`; requires `advanced-field-template-graph-and-runtime-expression-contract`. Reverse relationships create and mutate template-backed collection controls with runtime expressions and host LayoutID context; they are not field Lookup Rules resolution.
- **lookup-controls-and-form-template-placement** — `requires-template-graph-contract`; requires `advanced-field-template-graph-contract`. Lookup controls are placed by a Type 1 form-template resource builder that loads templates and mutates a generated control graph. A target ListID rule alone does not establish safe control placement.
- **sublist-lookup-embedding** — `requires-template-graph-contract`; requires `sublist-template-graph-contract`. Sublist Lookup semantics are nested control-graph behavior with row variables, summaries, and child controls. They cannot be treated as ordinary top-level Data List Lookup Rules resolution.
- **document-library-lookup-semantics** — `requires-cross-surface-contract`; requires `document-library-field-and-template-contract`. Document Library resources use their own Type 16 field and resource semantics. Data List Lookup evidence does not authorize cross-surface reuse.
- **approval-form-lookup-semantics** — `requires-cross-surface-contract`; requires `approval-form-variable-and-template-graph-contract`. Approval Form Lookup-like controls belong to approval variable and role-template behavior, not Data List field Rules lowering.
- **dashboard-lookup-semantics** — `requires-cross-surface-contract`; requires `dashboard-runtime-query-and-template-contract`. Dashboard lookup/filter behavior is collection runtime configuration and dashboard template lowering. It is outside the Data List field contract.
- **workflow-lookup-semantics** — `requires-cross-surface-contract`; requires `workflow-variable-and-runtime-expression-contract`. Workflow Lookup expressions are runtime variable bindings and workflow materialization, not deterministic Data List target-list resolution.
- **display-layout-and-mutable-resource-assembly** — `host-orchestration-only`; requires `template-graph-and-layout-identity-contract`. Display-layout references and final resource assembly own LayoutID, URL, record mutation, and package output. The completed Type 0 structural route is not proof for host identity integration.
- **fallback-validation-and-package-output** — `host-orchestration-only`; requires `host-resource-inventory-and-package-output-contract`. Candidate matching and unresolved-plan validation are host inventory behavior, while package output is an explicit host side effect. Core must not discover targets, allocate fallbacks, or write packages.

## Phase 7 Recommendation

Start `phase-7-advanced-field-template-graph-contract-audit`. Template snapshots and explicit identity references are the smallest foundational missing contract shared by remaining Data List advanced fields. It must be established before either sublist controls or Type 1 custom-form controls can be assessed without importing mutable host behavior into Core.

Dependency order:

1. immutable template snapshot and identity-reference contract
2. sublist control and nested variable contract
3. Type 1 custom-form control placement and host lowering contract

## Non-Goals

This audit does not change the Legacy materializer, production routes, adapters, public APIs, distribution contracts, artifacts, Plugin dist, active installation, historical ZIP, protected duplicates, or Git/release state.
