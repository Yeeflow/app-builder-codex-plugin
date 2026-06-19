# HTML-to-Yeeflow Control Mapping and Blueprint Parity Gates Training Report

## Branch

`codex/html-to-yeeflow-control-mapping-blueprint-parity-gates`

## Baseline

- Baseline ref: `origin/main` / `origin/stable`
- Plugin version inspected before editing: `0.6.71`
- Training only: no release bump, stable movement, tag, release, archive, live Yeeflow write, signing, install, import, upgrade-check, or upgrade-apply.

## Source Problem

The HTML-first workflow made the UI Surface Contract the implementation contract and generated high-fidelity HTML previews, screenshots, and blueprint comparisons. The missing conversion layer was explicit Yeeflow control mapping. A polished HTML preview can still fail during generation if controls, fields, actions, lists, bindings, row/current item context, and style intent are inferred visually instead of declared in machine-readable metadata.

## New Control-Mapped HTML Design

Added `docs/standards/html-to-yeeflow-control-mapping-standard.md`.

The standard requires implementation-relevant HTML elements to carry stable mapping metadata such as:

- `data-blueprint-id`
- `data-yeeflow-control`
- `data-control-role`
- source resource/list metadata
- field ID/name/type/binding metadata
- required/read-only/default/validation metadata
- action ID/type/contract metadata
- row/current item and parent binding metadata
- style/layout/responsive tokens
- proof boundary

Blueprint generation must read the UI Surface Contract, Control Mapping Registry, and HTML mapping metadata. It must not infer Yeeflow controls from visual HTML alone.

## Control Mapping Registry

Added `docs/standards/html-to-yeeflow-control-mapping-registry.md`.

The registry defines allowed `data-yeeflow-control` mappings such as `field-input`, `textarea`, `select`, `date-picker`, `user-picker`, `file-upload`, `sub-list`, `collection`, `data-table`, `kanban`, `vertical-timeline`, `horizontal-timeline`, `button`, `status-badge`, `summary-card`, `document-preview`, and `custom-code`.

Unknown mappings fail unless marked `export-learning-required`, `runtime-proof-required`, or `deferred` with reason, fallback, and proof impact.

## Validators Added Or Updated

- Added `scripts/validate-html-to-yeeflow-control-mapping.mjs`.
- Updated `scripts/compare-blueprint-to-ui-surface-contract.mjs` to compare Blueprints against UI Surface Contract plus HTML mapping metadata when `--html` and `--registry` are supplied.

The mapping validator checks:

- every contract control has matching HTML mapping,
- implementation-relevant elements include `data-blueprint-id`,
- `data-yeeflow-control` exists in the registry,
- field metadata matches the contract,
- action metadata matches the contract,
- list/region metadata matches source list, row context, and parent binding,
- style/layout/responsive tokens are present and known,
- duplicate blueprint IDs are blocked unless declared as repeated row templates.

The parity comparator checks:

- every HTML `data-blueprint-id` appears in the Blueprint,
- Blueprint control type matches the registry-backed HTML control,
- field binding/type/id, action contract/type, source list, parent binding, row context, and style/layout/responsive tokens are preserved,
- undeclared implementation controls are blocked unless explicitly helper/hidden/runtime.

## Tests Added

Added `scripts/test-html-to-yeeflow-control-mapping-blueprint-parity-gates.mjs`.

Coverage includes:

- valid field/action/Sub List/Collection/status badge mapping,
- missing blueprint IDs,
- field type/binding/required/read-only mismatches,
- missing action metadata,
- Sub List source/parent binding failures,
- unknown controls with and without proof labels,
- duplicate blueprint IDs and repeated row template allowance,
- missing style tokens,
- Blueprint control type mismatches,
- omitted action controls,
- changed field bindings/source lists/style tokens,
- declared helper runtime controls,
- undeclared Blueprint controls.

## Standards And Skill Updates

Updated:

- `docs/standards/ui-surface-contract-template.md`
- `docs/standards/html-preview-design-standard.md`
- `docs/standards/full-page-design-blueprint-generation-standard.md`
- `docs/standards/design-image-manifest-template.md`
- `docs/standards/application-design-system-template.md`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`

These updates position HTML-to-Yeeflow control mapping validation before Page Implementation Blueprints and HTML-to-Blueprint parity before Yeeflow resource generation.

## Aggregate And Cache Registration

Updated:

- `scripts/test-ui-hard-gates-all.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

The installed plugin cache must now include the new mapping validator, test suite, and mapping standards.

## Dist Mirrors

All changed source scripts, docs, standards, skills, and references are mirrored under `dist/yeeflow-app-builder-plugin/...`.

## Validation Commands

Planned validation:

```bash
git diff --check
node --check scripts/validate-html-to-yeeflow-control-mapping.mjs
node --check scripts/compare-blueprint-to-ui-surface-contract.mjs
node --check scripts/test-html-to-yeeflow-control-mapping-blueprint-parity-gates.mjs
node scripts/test-html-to-yeeflow-control-mapping-blueprint-parity-gates.mjs
node scripts/test-html-first-high-fidelity-ui-surface-contract-workflow-gates.mjs
node scripts/test-full-page-design-surface-responsibility-field-coverage-gates.mjs
node scripts/test-full-page-design-semantic-consistency-visual-usability-gates.mjs
node scripts/test-full-page-lower-region-visual-concreteness-gates.mjs
node scripts/test-full-page-form-detail-semantic-quality-gates.mjs
node scripts/test-full-page-design-artifacts-application-design-system-gates.mjs
node scripts/test-full-page-design-layout-fidelity-visual-quality-gates.mjs
node scripts/test-planning-default-approval-and-exact-type-gates.mjs
node scripts/test-business-clarification-and-app-plan-precision-gates.mjs
node scripts/test-app-plan-control-action-property-gates.mjs
node scripts/test-clarification-readiness-traceability-gates.mjs
node scripts/test-functional-specification-and-app-plan-gates.mjs
node scripts/test-ui-hard-gates-all.mjs
node scripts/test-yapk-hard-gate-cache-artifacts.mjs
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.71
node scripts/audit-release-safety.mjs --base stable --archive does-not-exist.zip --dist-root dist/yeeflow-app-builder-plugin
```

## Proof Boundary

These gates prove control-mapped HTML readiness and Blueprint parity readiness only. They do not prove Yeeflow package validity, resource serialization, signing/API acceptance, install/upgrade success, or runtime rendering.

## Safety Confirmation

No version bump, stable move, tags, releases, plugin archives, live Yeeflow writes, package signing/install/import/upgrade, private artifacts, raw API responses, raw package payloads, raw `Resource`, raw `Sign`, tenant URLs, or unrelated duplicate ` 2` / ` 3` files are part of this training PR.

## Recommended Next Step

Review and merge the training PR. Prepare a separate release bump PR only after the training PR is merged.
