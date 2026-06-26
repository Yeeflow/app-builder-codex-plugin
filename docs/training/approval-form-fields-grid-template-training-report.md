# Approval Form Fields Grid Template Training Report

## Source

This training registers two user-provided export-shaped Approval form field-grid templates:

- `Approval_form_grid_2col_fields.json`
- `Approval_form_grid_3col_fields.json`

The templates are preserved as complete `_ak_c` / `_ak_c_opt` JSON references.

## Registered Templates

Registry:

`docs/reference/approval-form-field-layout-templates.json`

Approved templates:

- `approval_form_fields_grid_2col_v1_1`
- `approval_form_fields_grid_3col_v1_1`

Template files:

- `docs/reference/approval-form-fields-grid-2col.template.json`
- `docs/reference/approval-form-fields-grid-3col.template.json`

Approved root wrappers:

- `form_grid_fields_2col_wrapper`
- `form_grid_fields_3col_wrapper`

## Generation Contract

Generated Approval form submission and task pages must place Approval form fields inside one of the approved field-grid wrappers.

When the page uses Approval Form Layouts v1.1, the field-grid wrapper must be placed only inside:

`content_card_wrapper > section_content_area`

The generator may update:

- approval field controls inside the wrapper;
- responsive column count and column sizing metadata;
- column span metadata bounded by the parent Grid column count;
- supported Dynamic display, custom validation, and action properties;
- grouping containers or nested grids when multiple controls share a dynamic-display rule.

The generator must preserve:

- root wrapper identity and control type;
- all non-column Grid style properties;
- explicit zero margin on every field control;
- full-row span for Multiple line, Rich text, and Sub list controls;
- one direct control per Grid cell unless a Container or nested Grid is used as the cell host.

The App Plan field tables are mandatory generation inputs. When `Submission Form Fields` or `Task Form Fields` are present, generated `Forms[].DefResource.pageurls[].formdef` must contain those business fields inside the selected field-grid wrapper. A package that only materializes the Approval form layout shell, workflow skeleton, titles, or route is incomplete even if `DefResource` decodes and the page opens in Form Builder.

The generator must remove or rewrite source-template business text that is not part of the target app domain. Template labels such as source loan/pipeline wording must not remain in unrelated Approval form pages after business fields have been materialized.

## App Plan Contract

The App Plan Approval Forms Plan must include an `Approval Form Fields Layout Template Selection` table when Approval forms display submission or task fields. Each field group must select `approval_form_fields_grid_2col_v1_1` or `approval_form_fields_grid_3col_v1_1` and state PC/laptop, tablet, and mobile column intent.

## Gates Added

New validator:

`scripts/validate-approval-form-fields-template.mjs`

New focused regression suite:

`scripts/test-approval-form-fields-template-gates.mjs`

First-generation preflight now invokes the approval form field-grid gate after Approval Form Layouts v1.1 validation and before dashboard gates.

The field-grid validator now also accepts `--plan` together with `--package` and verifies that planned Approval form fields appear in each generated submission/task `formdef`. Missing planned pages, missing planned field groups, or missing individual business fields are hard failures.

## Safety

This training does not move `stable`, does not bump plugin metadata, does not create plugin archives, does not sign or install Yeeflow packages, and does not perform live Yeeflow writes.
