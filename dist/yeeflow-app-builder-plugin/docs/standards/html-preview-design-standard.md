# HTML Preview Design Standard

Use this standard for the HTML-first high-fidelity UI Surface Contract workflow.

For complex business applications, HTML preview is the primary high-fidelity visual preview source before Page Implementation Blueprints. PNG screenshots are generated evidence from validated HTML previews. SVG may be used for icons, small visual assets, charts, or supplemental visuals, but not as the primary app UI source for complex form/dashboard surfaces.

## Required Workflow

1. Approved Functional Specification.
2. Approved Yeeflow App Plan.
3. Business Clarification Gate approved for generation.
4. Generation Readiness final check.
5. Application Design System.
6. UI Surface Contracts using `docs/standards/ui-surface-contract-template.md`.
7. High-fidelity HTML previews generated from UI Surface Contracts and the Application Design System.
8. DOM/layout/visual-quality validation with `scripts/validate-html-preview-layout.mjs`.
9. Desktop and mobile screenshot evidence captured from HTML previews.
10. Page Implementation Blueprints generated from UI Surface Contract plus validated HTML structure.
11. Blueprint-to-contract comparison with `scripts/compare-blueprint-to-ui-surface-contract.mjs`.

Do not proceed to Page Implementation Blueprints if UI Surface Contract, HTML preview, DOM/layout, visual quality, screenshot evidence, or layout validation fails. Do not proceed to Yeeflow resource/package generation if blueprint-to-contract parity fails.

The HTML-first workflow inherits and enforces all Full-page Canonical Design Artifact gates. It must not replace or bypass any existing generated-design-image requirement. All design-stage gates that previously applied to canonical PNG design artifacts now apply to UI Surface Contracts and high-fidelity HTML previews before screenshots and Page Implementation Blueprints.

## HTML Preview Requirements

- HTML must be generated from the UI Surface Contract.
- HTML must reference the Application Design System.
- CSS must implement the selected Application Design System using design tokens, not arbitrary free-form CSS.
- HTML must use approved UI pattern templates for each surface type.
- Desktop and mobile variants must be renderable.
- DOM must include contract-defined sections, fields, controls, and actions.
- DOM must exclude forbidden regions.
- Dashboard previews must use one official Yeeflow application layout and include official header/navigation chrome.
- Approval, Data List, and Document form previews must be complete no-app-chrome form surfaces.
- HTML previews must be full-page/complete, not viewport-only, and include page-end/completeness evidence.
- HTML previews must preserve surface responsibility, App Plan field/action coverage, semantic consistency, lower-page visual concreteness, visual usability, template reuse risk, and forbidden-region results from the UI Surface Contract.
- Long text must wrap, truncate intentionally, or use a responsive layout.
- Mobile layouts must stack or adapt instead of squeezing desktop grids.
- Screenshots are evidence generated from HTML, not the design source of truth.
- HTML preview must not look like a raw scaffold, plain unstyled controls, field dump, generic admin table, or low-fidelity wireframe.

## Design-System Evidence

Every blueprint-ready HTML preview must include evidence for:

- typography hierarchy
- spacing and density tokens
- card/section/form/table patterns
- action placement and priority
- badge/chip/status treatment
- related-region patterns such as Data table, Collection cards, checklist rows, document cards, activity feed, workflow timeline, or read-only field groups
- responsive/mobile stack or fallback rules
- text wrapping, truncation, or overflow management

## Layout And Visual Quality Gates

The validator checks contract/HTML consistency and conservative layout metadata. If exact browser geometry is unavailable, the preview must include explicit metadata/evidence. The overlap heuristic must check meaningful sibling collisions and must not count parent-child containment as overlap.

Blueprint readiness is blocked by:

- missing required field/action DOM evidence
- missing required App Plan surface coverage
- forbidden region DOM evidence
- Dashboard previews missing official application layout/header/navigation chrome
- form previews that include application chrome
- missing full-page/page-end evidence
- missing design-system token/class evidence
- missing approved pattern-template reference
- raw scaffold/plain field dump/generic admin table styling
- missing typography hierarchy
- missing spacing/density evidence
- missing action placement evidence
- long text without wrapping/truncation/responsive strategy
- mobile desktop-grid pressure without stacking/scroll/card-list fallback
- missing desktop/mobile screenshot evidence
- meaningful sibling overlap
- any inherited design-stage gate status that is missing, failing, or `human_review_required` without explicit deferral reason, fallback, and proof impact

## Proof Boundary

HTML preview validation proves high-fidelity design-preview readiness only. It does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.

Run:

```sh
node scripts/validate-html-preview-layout.mjs --contracts <dir-or-json> --html <dir> --screenshots <dir> --design-system <application-design-system.md>
```
