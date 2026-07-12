# Data List Form Field Layouts v1.1 Standard

## Purpose

Data List Form Field Layouts v1.1 defines the approved golden reference template for displaying current Data List fields on generated custom Data List New, Edit, and View forms.

The page-level form shell is still selected from Data List Form Layouts v1.1:

- `data_list_form_layout_new_edit_v1_1`
- `data_list_form_layout_view_item_v1_1`

This field-layout standard governs the field display area inside those page shells. Generated forms must not place current-list field controls directly into `section_content_area`; they must first clone the approved `form_grid_fields_wrapper` Grid template and place fields inside that Grid or approved nested grouping containers/grids.

## Registry

The canonical registry is:

`docs/reference/data-list-form-field-layout-templates.json`

Approved template id:

- `data_list_form_fields_grid_v1_1`

Approved control-level template id:

- `data_list_form_control_sublist_v1_1`

Source template file:

- `docs/reference/data-list-form-fields-grid.template.json`
- `docs/reference/data-list-form-control-sublist.template.json`

Root wrapper:

- `form_grid_fields_wrapper`

## Placement

When a generated custom Data List form uses Data List Form Layouts v1.1, every `form_grid_fields_wrapper` must be placed inside a `section_content_area` container under one of the approved v1.1 content card wrappers: `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`.

If a form has many fields or needs business grouping, create multiple approved content-card sections from the page-level layout template. Each group may contain one `form_grid_fields_wrapper` inside that section's `section_content_area`. Use `content_card_60_wrapper` or `content_card_40_wrapper` when the field group belongs in a 60/40 split section; do not invent a new card wrapper.

Do not place the field grid directly under root `Content`, any content card wrapper, `section_title_area`, `Operations`, or KPI regions.

## Responsive Grid Columns

The root `form_grid_fields_wrapper` and any nested field-group Grid controls may adjust only column count and column sizing metadata. All other exported Grid layout, spacing, style, and identity settings must remain template-derived.

Column rules:

- PC/laptop should use 2 or 3 columns. The most common default is 2 columns.
- Tablet column count must be less than or equal to PC/laptop column count.
- If PC/laptop uses 2 columns, tablet may also use 2 columns.
- If PC/laptop uses 3 columns, tablet should normally use 2 columns.
- Mobile should use 1 column.
- A child control's column span must never exceed its parent Grid's column count for the same responsive breakpoint.

## Field Control Margin

Yeeflow Data List field controls may have default margins. Generated field controls inside `form_grid_fields_wrapper` must explicitly set margin to zero.

Acceptable zero-margin shapes include token zero and numeric zero:

```text
attrs.common.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]
attrs.common.margin = [null, { top: 0, right: 0, bottom: 0, left: 0 }]
attrs.margin = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]
attrs.margin = [null, { top: 0, right: 0, bottom: 0, left: 0 }]
```

Generated field controls must not rely on implicit default margins.

## Field Control Navigator Labels

Every generated field control inside `form_grid_fields_wrapper` must receive a business-specific `nv_label` or `nav_label` derived from the actual Data List field or field group.

Do not keep generic or copied template labels such as `input`, `list`, `Sub list`, `Ticket detail items`, `Survey Program name`, or other source-domain sample names. The navigator label is part of designer maintainability proof and must make the generated form readable in the Yeeflow designer tree.

## Full-Row Controls

These field control types must occupy a full Grid row:

- Multiple line fields, commonly exported as `textarea`
- Rich text fields, commonly exported as `richtext`
- Sub list fields, commonly exported as `list`

Full-row placement is expressed by setting the control's column span to the parent Grid's column count for each responsive breakpoint. The span must never exceed the parent Grid's column count on that breakpoint.

For example, if the parent Grid has 2 PC columns and 1 mobile column, a rich text control should use a PC column span of 2 and a mobile column span of 1.

## Sub List Control Template

Sub list fields must use the approved control-level golden reference template:

- Template ID: `data_list_form_control_sublist_v1_1`
- Source template: `docs/reference/data-list-form-control-sublist.template.json`
- Root control type: `list`
- Required host: inside `form_grid_fields_wrapper`

When mapping a business Sub list field, generation may update only:

- the Sub list field label, title, name, binding, and navigator label;
- `attrs.list-variables`;
- `attrs.list-fields` and nested field control types needed by the selected Sub list fields;
- the column-span metadata required to span the full parent Grid width.

All table, header, row, card, border, padding, typography, and zero-margin settings must remain template-derived. Generated forms must not use simplified `list` controls for Sub list fields.

The host Data List field is the schema authority. A persisted Sub list must be emitted as a real Data List field with `Type: "list"`, `FieldType: "Text"`, and stringified `Defs[].Rules` containing `list-variables`. The custom form builder must rebuild `attrs.list-variables` and `attrs.list-fields` from that target field schema. It must not retain row fields from the cloned golden reference template.

For every `attrs.list-fields[]` entry:

- `control.label` must contain the visible business column title;
- `control.binding` must equal the row field `id`;
- `control.attrs.list_field_binding` must equal the parent Sub list field binding;
- `control.attrs.list_control_id` must equal the parent Sub list control ID;
- nested control IDs must be unique;
- `list-fields` and `list-variables` must contain the same row field IDs in the same order;
- the form row schema must match the host field's stringified `Rules["list-variables"]` schema.

Unlike Approval Form Sub list exports, the official Data List export shape does not require nested column controls to include `label_var: null`. Do not add an Approval-only hard gate to Data List forms. The required Data List title contract is the non-empty `control.label`.

Data List Sub List summaries are planned in `Sub List Summaries` and materialized into `attrs.list-fields-summary[]`. Each Summary must use a UUID, reference an existing numeric row field, and use the export-proven `total` or `avg` type. Bind a persisted result with `__list_` to a real numeric host Data List field; bind a page-session result with `__temp_` to a declared form-resource `tempVars[]` entry. A visible Summary may omit binding. Never use the Approval-only `__variables_` prefix on a Data List form.

## One Control Per Grid Cell

Each Grid cell should contain one direct control.

If a cell needs multiple visual or field controls, add one Container or nested Grid as the direct child of the parent Grid cell, then place the multiple controls inside that Container or nested Grid.

Containers and nested Grids used for grouping may have dynamic display rules when multiple related controls share the same show/hide condition.

## Dynamic Display And Validation

Field controls may use Dynamic display, custom validation, and action properties when supported by the active plugin's Yeeflow control knowledge base.

When several controls share the same Dynamic display rule, prefer grouping them inside a Container or nested Grid and applying the Dynamic display rule to that group. Do not duplicate the same rule across many individual controls when one grouped rule is sufficient.

## App Plan Requirements

The App Plan Custom Data List Forms Plan must select the field layout template for generated field groups.

Add a Form Fields Layout Template Selection table under each relevant custom form plan:

| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <List> | <Form> | <Group> | data_list_form_fields_grid_v1_1 | 2 or 3 | <= PC/laptop | 1 | <Multiple line/Rich text/Sub list fields> | <None or group rule summary> | Generated-final validation |

Rules:

- Select `data_list_form_fields_grid_v1_1` for every generated current-record field group on a New, Edit, or View custom Data List form.
- The App Plan should identify field groups and responsive column intent, but it must not include generated `ListID`, `LayoutID`, field runtime IDs, JSON property paths, or copied control JSON.
- For every Sub list field, add a `Sub List Row Fields` column to the Data List field table. Use either JSON or `rowFieldId:Column Title:fieldType:controlType` entries separated by semicolons. These row fields drive both the stringified field Rules and the custom-form Sub list columns.
- Add `Sub List Summaries` when totals or averages are required. Use `sourceRowField:summaryType:targetKind:targetId` entries separated by semicolons.
- If a New/Edit/View custom Data List form intentionally has no current-record field controls, state that explicitly with the business reason and proof boundary.

## Required Gates

Run:

```bash
node scripts/validate-data-list-form-fields-template.mjs --registry docs/reference/data-list-form-field-layout-templates.json
```

Generated-final `.yapk` packages must also pass:

```bash
node scripts/validate-data-list-form-fields-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

First-generation preflight must invoke this gate before signing readiness. Signing, install/import, upgrade, Version Management, and runtime proof must remain blocked when generated custom Data List form field layouts violate this standard.
