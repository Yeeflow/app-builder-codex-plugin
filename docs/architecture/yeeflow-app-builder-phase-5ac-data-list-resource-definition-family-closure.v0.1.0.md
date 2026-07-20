# Phase 5AC Data List Resource-Definition Family Closure

## Decision

`PHASE_5_CLOSURE_ACCEPTED`

The scalar field-record route is complete. No remaining Data List resource-definition category is eligible for a further Phase 5 vertical without a new contract family.

## Reconfirmed Scalar Route

`collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord` remains the only Core and Local Runtime route. It accepts only the approved scalar matrix and uses lossless host-supplied string identities. Lookup, sublist, identity, binary, template-dependent, cross-resource, and non-Data-List inputs remain on Legacy branches.

## Deferred Categories

- **lookup-fields** — `requires-cross-resource-lookup-resolution-contract`; requires `cross-resource-lookup-resolution-contract`. Lookup Rules.listid is a cross-resource host resolution result. The current scalar identity contract explicitly prohibits Core lookup resolution and fallback IDs.
- **sublist-fields** — `requires-template-graph-contract`; requires `data-list-advanced-field-template-graph-contract`. The form-control path reads a host template, creates nested controls, and mutates a generated resource graph; it is not an immutable scalar record fragment.
- **identity-user-department-fields** — `requires-template-graph-contract`; requires `data-list-advanced-field-template-graph-contract`. Identity controls are carried into Type 1 form-control graph lowering and require an explicit identity and template boundary, not scalar record construction.
- **file-image-binary-fields** — `requires-template-graph-contract`; requires `data-list-advanced-field-template-graph-contract`. File and image controls depend on host-owned binary control configuration and Type 1 template graph mutation.
- **barcode-dependent-non-scalar-behavior** — `defer-high-risk`; requires `data-list-advanced-field-template-graph-contract`. The current barcode contract is an explicit scalar Text error guard. It has no independent non-scalar record projection and must not be reclassified as scalar-safe.
- **type-one-custom-form-layouts** — `requires-template-graph-contract`; requires `data-list-advanced-field-template-graph-contract`. Type 1 custom forms are not Type 0 LayoutViews: they load and mutate template resource graphs and integrate host-owned LayoutIDs and cross-resource references.
- **list-display-layout-references** — `requires-identity-allocation-contract`; requires `template-graph-and-layout-identity-contract`. Display settings select host LayoutIDs and are written into the mutable List record. Type 0 projection parity does not cover this identity integration.
- **remaining-list-field-layout-record-assembly** — `host-orchestration-only`; requires `resource-definition-host-integration-contract`. This is the mutable assembly and package-integration layer. It is intentionally outside Core and Local Runtime lowering contracts.

## Phase 6 Recommendation

Start `phase-6-cross-resource-lookup-resolution-contract-audit`. Cross-resource lookup resolution is the smallest foundational missing contract: it isolates lossless target ListID resolution and failure semantics before the broader mutable template-graph work required by sublist, identity, binary, and Type 1 custom-form controls.

## Non-Goals

This audit changes no production route, adapter, public API, artifact, Plugin dist file, active installation, historical ZIP, or protected duplicate.
