# Approval Form Field Layouts v1.1 Standard

## Purpose

Approval Form Field Layouts v1.1 defines the approved golden reference templates for displaying Approval form submission and task fields inside Approval Form Layouts v1.1.

The page-level form shell is selected separately:

- `approval_form_layout_submission_v1_1`
- `approval_form_layout_task_v1_1`

This standard governs field display inside those shells. Generated Approval forms must not place business field controls directly into `section_content_area`; they must first clone one approved field-grid wrapper and place fields inside that Grid or approved grouping containers/grids.

## Registry

The canonical registry is:

`docs/reference/approval-form-field-layout-templates.json`

Approved template IDs:

- `approval_form_fields_grid_2col_v1_1`
- `approval_form_fields_grid_3col_v1_1`

Source template files:

- `docs/reference/approval-form-fields-grid-2col.template.json`
- `docs/reference/approval-form-fields-grid-3col.template.json`

Root wrappers:

- `form_grid_fields_2col_wrapper`
- `form_grid_fields_3col_wrapper`

The templates were parsed from the user-provided `Approval_form_grid_2col_fields.json` and `Approval_form_grid_3col_fields.json` exports.

## Placement

When a generated Approval submission form or task form uses Approval Form Layouts v1.1, every Approval form field-grid wrapper must be placed inside:

`content_card_wrapper > section_content_area`

If a form has many fields or needs business grouping, create multiple approved `content_card_wrapper` sections from the page-level Approval form layout template. Each group may contain one approved field-grid wrapper inside that section's `section_content_area`.

Do not place approval form field grids directly under root `Content`, `content_card_wrapper`, `section_title_area`, `Operations`, `page_title_section`, or `action_panel_flow_history_wrapper`.

## Template Choice

Use `approval_form_fields_grid_2col_v1_1` for the standard two-column desktop field layout.

Use `approval_form_fields_grid_3col_v1_1` when the field group is dense enough to benefit from three desktop columns.

Both templates may be used on submission forms and task forms. Task forms should render fields readonly unless the App Plan states a business reason for assignee-editable fields.

## Responsive Grid Columns

The root field-grid wrapper and any nested field-group Grid controls may adjust only column count and column sizing metadata. All other exported Grid layout, spacing, style, and identity settings must remain template-derived.

Column rules:

- PC/laptop should use 2 or 3 columns.
- Tablet column count must be less than or equal to PC/laptop column count.
- If PC/laptop uses 2 columns, tablet may also use 2 columns.
- If PC/laptop uses 3 columns, tablet should normally use 2 columns.
- Mobile should use 1 column.
- A child control's column span must never exceed its parent Grid's column count for the same responsive breakpoint.

## Field Control Margin

Yeeflow Approval form field controls may have default margins. Generated field controls inside `form_grid_fields_2col_wrapper` or `form_grid_fields_3col_wrapper` must explicitly set margin to zero.

Acceptable zero-margin shapes include token zero and numeric zero:

```text
attrs.common.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]
attrs.common.margin = [null, { top: 0, right: 0, bottom: 0, left: 0 }]
attrs.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]
attrs.margin = [null, { top: 0, right: 0, bottom: 0, left: 0 }]
```

Generated field controls must not rely on implicit default margins.

## Field Control Navigator Labels

Every generated field control inside an approved Approval form field-grid wrapper must receive a business-specific `nv_label` or `nav_label` derived from the actual Approval form field or field group.

Do not keep generic or copied template labels such as `input`, `list`, `Sub list`, or `Container`. The navigator label is designer maintainability proof and must make the generated Approval form readable in the Yeeflow designer tree.

## Full-Row Controls

These field control types must occupy a full Grid row:

- Multiple line fields, commonly exported as `textarea`
- Rich text fields, commonly exported as `richtext`
- Sub list fields, commonly exported as `list`

Full-row placement is expressed by setting the control's column span to the parent Grid column count for each responsive breakpoint. The span must never exceed the parent Grid column count on that breakpoint.

## One Control Per Grid Cell

Each Grid cell should contain one direct control.

If a cell needs multiple visual or field controls, add one Container or nested Grid as the direct child of the parent Grid cell, then place the multiple controls inside that Container or nested Grid.

Containers and nested Grids used for grouping may have dynamic display rules when multiple related controls share the same show/hide condition.

## Dynamic Display, Validation, And Actions

Approval form field controls may use Dynamic display, custom validation, and action properties when supported by the active plugin's Yeeflow control knowledge base.

When several controls share the same Dynamic display rule, prefer grouping them inside a Container or nested Grid and applying the Dynamic display rule to that group. Do not duplicate the same rule across many individual controls when one grouped rule is sufficient.

## App Plan Requirements

The App Plan Approval Forms Plan must select the field layout template for generated Approval form field groups.

Add an Approval Form Fields Layout Template Selection table under each relevant Approval form plan:

| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Approval form> | <Submission or task form> | <Group> | approval_form_fields_grid_2col_v1_1 or approval_form_fields_grid_3col_v1_1 | Submission fields or task fields | 2 or 3 | <= PC/laptop | 1 | <Multiple line/Rich text/Sub list fields> | <None or group rule summary> | Generated-final validation |

Rules:

- Select one approved Approval form field-grid template for every generated field group on a submission or task form.
- The App Plan should identify field groups and responsive column intent, but it must not include generated `ListID`, `FormID`, `ProcModelID`, `FlowKey`, field runtime IDs, JSON property paths, or copied control JSON.
- If an Approval form page intentionally has no field controls, state that explicitly with the business reason and proof boundary.

## Required Gates

Run:

```bash
node scripts/validate-approval-form-fields-template.mjs --registry docs/reference/approval-form-field-layout-templates.json
```

Generated-final `.yapk` packages must also pass:

```bash
node scripts/validate-approval-form-fields-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

First-generation preflight must invoke this gate before signing readiness. Signing, install/import, upgrade, Version Management, and runtime proof must remain blocked when generated Approval form field layouts violate this standard.
