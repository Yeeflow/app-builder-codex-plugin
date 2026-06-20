# UI Pattern Library Driven Generation Flow Training Report

## Scope

Training-only update for `yeeflow-app-builder@yeeflow` version `0.6.73`.

No version bump, stable movement, tags, GitHub releases, plugin archive generation, live Yeeflow writes, package signing, install/import/upgrade, or runtime writes are part of this training.

## Intent

The default UI generation source is now the plugin-contained Yeeflow UI Section Template Library and Yeeflow Application Design System:

```text
Functional Specification
-> Yeeflow App Plan
-> Business Clarification + Generation Readiness
-> Application Design System
-> Yeeflow UI Section Template / Pattern Selection
-> Page Implementation Blueprint
-> Blueprint Pattern Conformance Validation
-> Yeeflow Resource Generation
-> Decoded Resource Parity Validation
-> Local hard gates
-> package/sign/install/runtime only when explicitly approved
```

Generated PNG design images and HTML previews remain available as optional review evidence. They are not required for normal generation and must not override the App Plan, Application Design System, selected templates, or Page Implementation Blueprint.

## Source Of Truth

- `docs/templates/yeeflow-ui-section-template-library.md`
- `docs/templates/yeeflow-ui-section-template-library.normalized.json`
- `docs/yeeflow-application-design-system.md`
- `docs/yeeflow-application-ui-ux-standards.md`
- `docs/yeeflow-dashboard-ui-ux-patterns.md`
- `docs/yeeflow-data-list-ui-ux-patterns.md`
- `docs/yeeflow-form-ui-ux-patterns.md`
- `docs/standards/application-design-system-template.md`
- `docs/standards/full-page-design-blueprint-generation-standard.md`
- `docs/standards/yeeflow-ui-pattern-library-generation-standard.md`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`

## New Executable Gates

- `scripts/validate-ui-pattern-selection.mjs`
  - requires every UI surface to select a `templateId`
  - checks that the selected template exists in the normalized registry
  - checks template category compatibility with the surface type
  - preserves pattern proof status
  - blocks forbidden misuse such as dashboard templates as New/Edit form body or HTML-only concepts as Yeeflow controls
  - blocks `readyForResourceGeneration: true` when selection fails

- `scripts/validate-blueprint-ui-pattern-conformance.mjs`
  - validates selected template requirements against Page Implementation Blueprints
  - checks required controls, child controls, fields, data bindings, and actions
  - accepts explicit deferrals/inactive actions while preserving proof boundaries
  - blocks HTML-only control concepts and New/Edit lower-region primary-field misuse
  - blocks `readyForResourceGeneration: true` when conformance fails

- `scripts/test-ui-pattern-library-driven-generation-flow.mjs`
  - covers valid dashboard, New/Edit form, and related-record pattern mappings
  - covers unknown template IDs, category misuse, missing bindings/children, bad proof status, HTML-only controls, explicit deferrals, and readiness blocking

## Backward Compatibility

Existing PNG and HTML validators remain available. The training reclassifies them:

- PNG canonical design artifacts: optional visual review evidence unless explicitly requested.
- HTML previews: optional high-fidelity review/prototype evidence unless explicitly requested.
- Page Implementation Blueprint: generated from App Plan + Application Design System + selected Yeeflow UI patterns by default.

## Safety Boundary

This training changes docs and local validators only. It does not perform package signing, install/import/upgrade, runtime testing, live API writes, release publishing, tag creation, or stable promotion.
