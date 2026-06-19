# HTML-to-Yeeflow Control Mapping Standard

This standard governs the conversion layer between UI Surface Contracts, high-fidelity HTML previews, Page Implementation Blueprints, and later Yeeflow resources.

HTML previews are not free-form visual artifacts. Every implementation-relevant HTML element must carry machine-readable Yeeflow mapping metadata so Page Implementation Blueprints can be generated from declared contract data instead of visual guessing.

## Required Workflow

The required order is:

1. Approved Functional Specification and Yeeflow App Plan.
2. Application Design System.
3. UI Surface Contract with `controlMapping`.
4. Control Mapping Registry.
5. Control-mapped HTML Preview using `data-*` mapping attributes.
6. HTML-to-Yeeflow control mapping validation.
7. HTML-to-Blueprint parity validation.
8. Page Implementation Blueprint.
9. Blueprint-to-Yeeflow resource parity preparation.

Blueprint generation must read the UI Surface Contract, Control Mapping Registry, and HTML mapping metadata. It must not infer Yeeflow control type, binding, action, source list, current item context, or style intent from visual HTML appearance alone.

## Required Mapping Attributes

Use these attributes on implementation-relevant HTML elements when applicable:

| Attribute | Purpose |
| --- | --- |
| `data-surface-id` | Stable UI surface identifier. |
| `data-section-id` | Stable section or region identifier. |
| `data-blueprint-id` | Stable Page Implementation Blueprint control identifier. Required for every implementation-relevant element. |
| `data-yeeflow-control` | Registry-backed Yeeflow control mapping. |
| `data-control-role` | Role such as field, action, list-region, layout, helper, or display. |
| `data-source-resource` | App Plan resource or Yeeflow resource source. |
| `data-source-list` | Source Data List, Document Library, or form context. |
| `data-field-id` | Stable field identifier. |
| `data-field-name` | Business field label from the UI Surface Contract/App Plan. |
| `data-field-type` | Exact Yeeflow field or variable type. |
| `data-binding` | Field/control binding path or current-record binding. |
| `data-required` | Required-state contract. |
| `data-readonly` | Read-only/editable contract. |
| `data-default-value` | Default value contract when planned. |
| `data-validation` | Validation rule summary. |
| `data-action-id` | Stable action identifier. |
| `data-action-type` | Registry/plugin-supported Yeeflow action type. |
| `data-action-contract` | Action contract, including write target or navigation behavior. |
| `data-row-context` | Current row/item context for list, Collection, Kanban, Timeline, or Sub List actions. |
| `data-parent-binding` | Parent/current item binding for Sub List and related regions. |
| `data-style-token` | Design-system style token, not arbitrary CSS as support proof. |
| `data-layout-token` | Design-system layout token. |
| `data-responsive-token` | Responsive/mobile behavior token. |
| `data-proof-boundary` | Proof boundary for this mapping. |

## Category Requirements

| Element category | Required mapping |
| --- | --- |
| Field controls | `data-blueprint-id`, `data-yeeflow-control`, `data-control-role`, `data-field-id`, `data-field-name`, `data-field-type`, `data-binding`, `data-required`, `data-readonly`, style/layout/responsive tokens, proof boundary. |
| Action controls | `data-blueprint-id`, `data-yeeflow-control`, `data-control-role`, `data-action-id`, `data-action-type`, `data-action-contract`, row/current-item context when applicable, style/layout/responsive tokens, proof boundary. |
| Sub List regions | `data-blueprint-id`, `data-yeeflow-control="sub-list"`, `data-source-list`, `data-parent-binding`, `data-row-context`, style/layout/responsive tokens, proof boundary. |
| Collection/Kanban/Timeline/Data Table regions | `data-blueprint-id`, registered `data-yeeflow-control`, `data-source-resource`, `data-source-list`, `data-row-context`, displayed field/action metadata, style/layout/responsive tokens, proof boundary. |
| Display controls and badges | `data-blueprint-id`, registered `data-yeeflow-control`, role, binding/source field where data-backed, style/layout/responsive tokens, proof boundary. |
| Hidden/helper/runtime controls | Must be explicitly declared in the UI Surface Contract and marked helper/runtime. They must not be silently invented by Blueprint generation. |

## New/Edit Field And Action Mapping Discipline

For Data List and Document Library New/Edit surfaces, primary editable fields must map as field controls in the form body. They must not be mapped as a lower-page `grid`, `collection`, `data-table`, card region, or other related-region pattern named `Primary form fields`, `Main form fields`, `Editable fields`, or `Document metadata fields`.

Primary actions such as Save/Cancel, Save/Submit, Upload/Save, Submit, Approve/Reject, and Complete must not be duplicated in mapped lower regions unless the duplicate is an App Plan-planned row/item action and declares row/current-item context. Action IDs such as `primary-form-fields.save` fail when they duplicate a surface-level action without row or Sub List context.

Editable field mappings should include value semantics when values are shown: `sample-value`, `default-value`, `placeholder`, `empty`, or `read-only-current-value`. A mapped editable field whose value equals its label fails unless the element is explicitly encoded as placeholder semantics and rendered as placeholder guidance.

## Unsupported Mappings

Unsupported controls, action shapes, property paths, style tokens, or configuration shapes must fail validation unless explicitly marked:

- `export-learning-required`
- `runtime-proof-required`
- `deferred`

The proof label must include reason, fallback, and proof/generation impact. A visual pattern never implies runtime support.

## Style Token Rule

Arbitrary CSS is not the source of truth for Yeeflow style support. HTML may use CSS for preview rendering, but implementation intent must be represented by `data-style-token`, `data-layout-token`, and `data-responsive-token`. Page Implementation Blueprints must preserve those tokens so later resource generation can map them to supported Yeeflow properties, extension registry entries, template-library patterns, custom CSS fallback, or an explicit proof/deferred boundary.

## Validation

Run:

```bash
node scripts/validate-html-to-yeeflow-control-mapping.mjs --contracts <contracts.json|dir> --html <html-dir> --registry docs/standards/html-to-yeeflow-control-mapping-registry.md
node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts <contracts.json|dir> --html <html-dir> --blueprints <blueprints.json|dir> --registry docs/standards/html-to-yeeflow-control-mapping-registry.md
```

These checks prove control-mapped HTML and blueprint parity readiness only. They do not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.
