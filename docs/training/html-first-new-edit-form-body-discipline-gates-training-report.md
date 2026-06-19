# HTML-first New/Edit Form Body Discipline Gates Training Report

## Training Topic

Add HTML-first New/Edit form body discipline, duplicate action, and placeholder/value semantics gates.

## Source Observation

Inspected output:

`/Users/rengerhu/Documents/Plugin Test/outputs/20260620-002600-vendor-contract-management-html-first-mapped-workflow`

The Vendor Contract Management HTML-first mapped workflow reported validation pass, but `contract-new-edit.html` rendered the correct main form fields and Save/Cancel action bar, then added an invalid lower-page region:

- Region title: `Primary form fields`
- Source: `Contracts`
- Control: `grid`
- Fake cards: `Contract title`, `Save`
- A second duplicated Save/Cancel action bar

The same contract issue appeared in UI Surface Contracts for `vendor-new-edit`, `contract-new-edit`, `renewal-task-new-edit`, and `reminder-rule-new-edit`.

Additional placeholder/value issue:

- `Start date` was rendered as the value for the `Start date` field.
- `End date` was rendered as the value for the `End date` field.

## Root Cause

The invalid lower region was generated into the UI Surface Contract first. Existing validators then compared HTML and Blueprint artifacts against an already-wrong contract, so parity preserved the bad structure instead of rejecting it.

## New Gate Rules

- Data List New/Edit and Document Library New/Edit primary editable fields must live in `fieldGroups`, editable field lists, and `controlMapping`.
- Primary form fields must not be represented as `allowedRegions`, `relatedRegions`, lower-page grids, cards, tables, or collections.
- Generic regions such as `Primary form fields`, `Main form fields`, `Editable fields`, and `Document metadata fields` fail unless explicitly App Plan-planned with reason, fallback, and proof impact.
- Related/lower-page regions must be real App Plan-mapped related data regions, Sub Lists, or row/item regions with source list and row/current-item context.
- Primary actions such as Save/Cancel, Save/Submit, Upload/Save, Submit, Approve/Reject, or Complete should appear once unless explicitly row/item/Sub List-scoped.
- Fake cards generated from field names or action names fail.
- Editable controls must distinguish labels, placeholders, sample values, default values, empty values, and read-only current values.
- A field label must not be rendered or mapped as its field value unless it is explicitly placeholder semantics and styled as a placeholder.
- Blueprint parity must not preserve an invalid contract; contract validation, HTML validation, HTML-to-Yeeflow mapping validation, and Blueprint parity are separate proof layers.

## Validators Updated

- `scripts/validate-ui-surface-contracts.mjs`
- `scripts/validate-html-preview-layout.mjs`
- `scripts/validate-html-to-yeeflow-control-mapping.mjs`
- `scripts/compare-blueprint-to-ui-surface-contract.mjs`

## Tests Added

- `scripts/test-html-first-new-edit-form-body-discipline-gates.mjs`

The focused test covers invalid New/Edit contract regions, duplicated primary action bars, fake lower cards, label-as-value misuse, valid placeholder/sample-value cases, valid planned Sub List row actions, and Blueprint rejection of generic primary field-body regions.

Aggregate/cache registrations were updated:

- `scripts/test-ui-hard-gates-all.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

## Standards And Skill Updates

- `docs/standards/ui-surface-contract-template.md`
- `docs/standards/html-preview-design-standard.md`
- `docs/standards/html-to-yeeflow-control-mapping-standard.md`
- `docs/standards/full-page-design-blueprint-generation-standard.md`
- `docs/standards/design-image-manifest-template.md`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`

## Validation Commands

Required validation for this training PR:

```bash
git diff --check
node --check scripts/validate-ui-surface-contracts.mjs
node --check scripts/validate-html-preview-layout.mjs
node --check scripts/validate-html-to-yeeflow-control-mapping.mjs
node --check scripts/compare-blueprint-to-ui-surface-contract.mjs
node --check scripts/test-html-first-new-edit-form-body-discipline-gates.mjs
node scripts/test-html-first-new-edit-form-body-discipline-gates.mjs
node scripts/test-html-to-yeeflow-control-mapping-blueprint-parity-gates.mjs
node scripts/test-html-first-high-fidelity-ui-surface-contract-workflow-gates.mjs
node scripts/test-full-page-design-surface-responsibility-field-coverage-gates.mjs
node scripts/test-full-page-design-semantic-consistency-visual-usability-gates.mjs
node scripts/test-full-page-lower-region-visual-concreteness-gates.mjs
node scripts/test-full-page-form-detail-semantic-quality-gates.mjs
node scripts/test-full-page-design-artifacts-application-design-system-gates.mjs
node scripts/test-full-page-design-layout-fidelity-visual-quality-gates.mjs
node scripts/test-ui-hard-gates-all.mjs
node scripts/test-yapk-hard-gate-cache-artifacts.mjs
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.72
node scripts/audit-release-safety.mjs --base stable --archive does-not-exist.zip --dist-root dist/yeeflow-app-builder-plugin
```

## Proof Boundary

These gates prove New/Edit UI Surface Contract, HTML preview, HTML mapping, and Blueprint parity readiness for the specific body-discipline and placeholder/value semantics covered by the validators. They do not prove Yeeflow package validity, package signing/API acceptance, install/upgrade success, or runtime rendering.

## Safety Confirmation

This training does not bump the plugin version, move `stable`, create tags/releases, generate plugin archives, run live Yeeflow writes, or run package signing/install/import/upgrade.
