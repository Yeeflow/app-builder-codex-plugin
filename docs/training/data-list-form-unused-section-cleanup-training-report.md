# Data List Form Unused Section Cleanup Training Report

## Scope

This training closes the gap where generated custom Data List forms copied the Data List Form Layouts v1.1 shell but kept unused template sections in the final form. The visible symptom was New/Edit and View Item forms that contained the real current-record fields followed by several empty card sections with stale template labels such as `Active Loan Pipeline`.

## Root Cause

The Data List Form Layouts v1.1 standard documented repeatable/removable modules, but the generated-final validator did not hard-fail empty copied sections. The full-app materializer inserted fields into the first business section and removed empty Operations containers, but it did not prune unused copied content-card and multi-column section modules after materializing the field grid.

## Training Rules

- Generated custom Data List forms must remove unused copied section modules.
- `content_card_wrapper`, `content_card_60_wrapper`, and `content_card_40_wrapper` must not keep an empty `section_content_area`.
- `1_columns_section`, `2_columns_section`, `3_columns_section`, and `2_columns_60/40_section` must not remain in generated-final output unless they contain real business content.
- New/Edit forms usually need only the current-record field section. Extra copied template sections must be removed unless the App Plan requires additional current-record field groups and those groups are materialized.
- View Item forms may keep related-data, KPI, Data Analytics, Collection, filter, or action sections only when those sections are fully materialized with real business content.
- Generated forms must not retain unrelated source-template labels or descriptions such as `Active Loan Pipeline`.

## Implementation

- `scripts/materialize-full-app-generated-final.mjs`
  - Calls `removeEmptyBusinessSections(resource)` after the Data List form field grid is inserted.
  - Extends cleanup to remove empty copied section modules as well as empty content-card wrappers.
- `scripts/validate-data-list-form-layout-template.mjs`
  - Adds registry policy checks for unused-section pruning.
  - Adds hard-gate errors:
    - `DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_CONTENT_AREA`
    - `DATA_LIST_FORM_LAYOUT_UNUSED_SECTION_MODULE`
    - `DATA_LIST_FORM_LAYOUT_TEMPLATE_RESIDUAL_LABEL`
- `scripts/test-data-list-form-layout-template-gates.mjs`
  - Adds failing fixtures for empty copied sections and stale template labels.
  - Updates valid fixtures to represent materialized Data List forms where unused sections have been pruned.
- `docs/standards/data-list-form-layouts-v1.1-standard.md`
  - Changes unused module guidance from optional cleanup to mandatory generated-final cleanup.

## Validation

Required focused validation:

```bash
node scripts/test-data-list-form-layout-template-gates.mjs
```

Generated-final packages must continue to run:

```bash
node scripts/validate-data-list-form-layout-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
node scripts/yapk-first-generation-preflight.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

Signing, install/import, upgrade, Version Management, and runtime proof must remain blocked when any of the new hard-gate errors appear.
