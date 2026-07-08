# Data Filter Standard Filter Group Training Report

## Summary

This training adds `dashboard_standard_filter_group` as the golden reference wrapper for pages and forms that contain multiple page-level Data Filter controls.

The template was updated to the current export-shaped `flex_grid` reference for `dashboard_standard_filter_group`. The standard wrapper is intentionally an empty Grid shell; generators place mapped Data Filter controls into the Grid cells during page/form materialization.

## Requirement Covered

When a generated page or form contains two or more page-level Data Filter controls, those filters must be placed inside `dashboard_standard_filter_group`.

The rule applies to:

- Dashboard pages
- Custom Data List forms
- Approval form submission pages
- Approval form task pages
- Data list workflow task forms
- Schedule workflow task forms

Collection-local search boxes are excluded from this grouping requirement because they are part of Collection operation templates rather than page-level Data Filter groups.

## Training Changes

- Added `docs/reference/data-filter-golden-references.json`.
- Added `docs/reference/data-filter-standard-filter-group.template.json`.
- Added `docs/standards/data-filter-golden-reference-standard.md`.
- Added `scripts/validate-data-filter-standard-group.mjs`.
- Added `scripts/test-data-filter-standard-group-gates.mjs`.
- Registered the validator in first-generation YAPK preflight.
- Registered cache artifact checks.
- Updated App Plan, Dashboard, Data List Form, Approval Form, and full-app generation standards.
- Updated application-builder, application-generator, and package-validator skill guidance.
- Mirrored all source artifacts into `dist/yeeflow-app-builder-plugin`.
- Updated the reference from the older Event Portfolio row container to the export-proven Grid shape: 4 desktop/laptop columns, 2 tablet columns, 1 mobile column, 16px column/row gaps, and hidden Grid label.

## Hard Gates

The new validator rejects:

- multiple page-level filters outside `dashboard_standard_filter_group`
- ad hoc or invented multi-filter wrappers
- mutated group layout settings
- non-Grid wrapper controls
- simplified Grid definitions such as `attrs.columns.count/type/minmax`
- child filter label typography drift
- scalar label layout drift
- missing placeholder color
- missing radius
- missing fixed-width positioning

## Safety

This is a training and validation change only. It does not bump the plugin version, move `stable`, create tags/releases/plugin archives, perform live Yeeflow writes, sign packages, install packages, import packages, or upgrade applications.
