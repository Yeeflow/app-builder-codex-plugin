# Phase 7A Advanced-Field Template-Graph Contract Audit

## Decision

PHASE_7_TEMPLATE_GRAPH_CONTRACT_ACCEPTED

The future Data List-only shadow is accepted only for the narrow identity-user-people Type 1 view/workbench placement intent. It is not a route, resource builder, or template mutator.

## Immutable Contract

Core receives a JSON-serializable template snapshot descriptor, stable node and slot references, lossless ListID and FieldID references, and normalized field intent. It returns immutable placement intent, a control descriptor without a generated ID, and ordered immutable findings. Core may not load or mutate templates, allocate identities, evaluate runtime expressions, append findings, write a package, or integrate a resource.

The host loads templates, validates references, creates the Legacy-shaped control identity, inserts the mutable control, appends findings, and integrates the final resource.

## Template Reference Errors

- TEMPLATE_GRAPH_REFERENCE_MISSING — A required template, node, slot, or control reference is absent.
- TEMPLATE_GRAPH_REFERENCE_INVALID — A supplied template reference is malformed or not losslessly serializable.
- TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH — A reference belongs to a different Data List template or form scope.
- TEMPLATE_GRAPH_REFERENCE_DUPLICATE — Two supplied references claim the same required template node or control slot.
- TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN — A supplied node, slot, or control reference does not preserve the declared parent-child placement relationship.

## Family Inventory

- sublist-row-schema-and-controls — requires-nested-template-graph-contract. The current path clones a sublist template, allocates child identities, mutates the form graph, and appends temporary variables.
- identity-user-people-control-placement — eligible-phase-7b-shadow. The Legacy helper currently constructs a mutable control object. A snapshot and explicit placement identity boundary are required before a pure intent shadow can preserve this behavior.
- department-control-placement — defer-control-semantics-contract. Department behavior must be specified separately rather than inferred from the identity-user mapping.
- file-image-binary-controls — requires-binary-control-template-contract. File and image controls carry binary control semantics beyond the generic dynamic control descriptor.
- non-scalar-barcode-policy — defer-validation-policy-contract. The existing barcode behavior is a scalar validation error, not a template-graph projection.
- type-one-custom-form-layout-and-field-placement — requires-template-graph-contract. The full Type 1 builder combines template loading, mutable resource assembly, form actions, and cross-resource integration.
- display-layout-references — requires-layout-identity-contract. Display settings mutate the List record and select host LayoutIDs; a placement intent cannot own those identities.
- lookup-form-control-placement — requires-template-graph-contract. The target ListID is resolved, but Type 1 control placement still needs a template snapshot and host graph lowering boundary.

## Selected Phase 7B Candidate

data-list-type1-view-workbench-identity-user-control-placement-intent

The boundary is Data List Type 1 view/workbench identity-user-people non-sublist control placement intent only. The planned eight-case corpus covers identity/user aliases, non-sublist protection, and all template-reference error modes. A temporary full-Plugin copy must restore only the retained Legacy bridge for rollback.

## Non-Goals

This audit changes no Legacy materializer behavior, adapter, public API, artifact, Plugin dist file, active installation, historical ZIP, protected duplicate, or Git/release state.
