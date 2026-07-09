# Public Form Page Layout Golden Reference Training Report

## Source

- Export studied: `/Users/rengerhu/Downloads/Customer Satisfaction.ydl`
- Data List: `Customer Satisfaction`
- Public forms in export:
  - `Customer Satisfaction Survey`
  - `Public form page layout standard`

`Public form page layout standard` is the golden reference page layout template for generated Data List Public Forms. The normalized full template resource is stored at:

`docs/reference/public-form-page-layout-standard.template.json`

The survey-style one-column Public Form field layout template is stored at:

`docs/reference/public-form-fields-1col.template.json`

The exported public form `Resource` is a JSON string under `Data.Item.PublicForms[]`. The parsed resource uses `pagetype: 3`, `ver: 2`, root page attributes, `children[]`, and `tempVars`.

## Generation Contract

Any generated Public Form must be plan-first. The App Plan or standalone Data List artifact plan must declare the Public Form name, target Data List, purpose, included fields, CTA requirements, submit behavior, and selected page layout template:

`public-form-page-layout-standard`

The materializer must clone the golden reference template and modify only approved editable regions. It must not hand-build a simplified public form body.

## Locked Page Contract

The public form root page must preserve the template-level page contract:

- `Resource.pagetype = 3`
- `Resource.ver = 2`
- root Content area full width: `attrs.container.cw = "2"`
- root Content padding zero on all sides
- root page background color from the template
- `tempVars` remains an array when present

The business width anchors must stay synchronized:

- `public_form_title_wrapper`
- `public_form_content_section`
- `pubic_form_bottom_section`

The default width is `1280px`. If a future approved template changes this width, all three anchors must change together.

## Editable Regions

Only these public-form regions are editable for business-specific output:

- `public_form_title_section`: background/brand gradient may be adjusted.
- `public_form_title_header`
- `public_form_title_text`
- `public_form_description`
- `public_form_title_cta_area`: optional; remove it if there are no CTA buttons.
- `public_form_title_cta_button_primary`
- `public_form_title_cta_button_secondary`
- `public_form_content_section`
- `1_columns_section`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `content_card_wrapper`
- `content_card_60_wrapper`
- `content_card_40_wrapper`
- `section_title_header`
- `section_title_text`
- `section_title_description`
- `Operations`
- `section_content_area`
- `pubic_form_bottom_section`
- `section_content_center_area`
- `pubic_form_submit_button`

Everything else is locked template structure.

## Content Placement Rules

All public form field controls must be inside:

`content_card_wrapper/content_card_60_wrapper/content_card_40_wrapper > section_content_area`

The content section may only contain approved section layout containers:

- `1_columns_section`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`

The submit button is required for anonymous collection and must remain:

`pubic_form_bottom_section > section_content_center_area > pubic_form_submit_button`

CTA action buttons in the title region must be inside `public_form_title_cta_area`.

## Shared Field Grid Templates

Public Forms may use the Public Form-specific field-layout template for survey and questionnaire-style fields:

- `public_form_fields_1col_v1_1`

The template root is the `flex_grid` control `form_grid_fields_1col_wrapper`. It has one column on PC/laptop, tablet, and mobile, and is recommended for Public Forms with a small number of fields, long question prompts, survey questions, or questionnaire fields where readability is more important than dense two-column scanning.

Hard requirements for `public_form_fields_1col_v1_1`:

- place the root `form_grid_fields_1col_wrapper` only inside an approved content card's `section_content_area`;
- preserve the root Grid attributes exactly, including `canFold`, `ver`, `columns`, `rows`, `cgap/cgapU`, and `rgap/rgapU`;
- place every public-form list field for that section inside the root Grid;
- each Grid cell must be a `form_grid_field_container` container;
- each field container must contain a `form_grid_field_title` heading and a `form_grid_field_control` list-bound control;
- every field control must set native Display title off with `displayLabel: [null, false]`;
- every field control must set `attrs.common.margin` to `--sp--s0` on all sides.

Dynamic display, custom validation, and action settings are allowed on generated Public Form controls. When multiple controls share the same dynamic display rule, group them in a container or nested grid and place the shared rule on the group instead of duplicating it on every field control.

Public Forms may reuse the Data List Form field-layout templates for anonymous field-entry regions:

- `data_list_form_fields_grid_v1_1`
- `data_list_form_control_sublist_v1_1`

This is a field-content rule, not a replacement for the Public Form page layout. The Public Form page shell must still be generated from `public-form-page-layout-standard`. The reused field grid or Sub List control must be hosted inside an approved content card's `section_content_area`.

Allowed mapping changes:

- field label/title/name/binding/fieldID;
- public-form-compatible control type and rules;
- option values and placeholders;
- responsive column spans for full-row controls;
- business-specific `nv_label` / `nav_label`.

Locked template behavior:

- preserve the Data List Form grid/sub-list structure;
- preserve spacing, responsive Grid shape, and zero-margin field-control discipline;
- preserve approved Sub List table/header/body shape when using `data_list_form_control_sublist_v1_1`;
- do not introduce login-dependent field types or controls that are disallowed for anonymous Public Forms.

## Validator Updates

The shared validator helper is:

`scripts/lib/public-form-template-utils.cjs`

It is used by both:

- `validate-ydl-list.js`
- `validate-yap-package.js`

This makes standalone `.ydl` generation and full `.yapk` application generation use the same public form template gate.

Hard-gate examples:

- `PUBLIC_FORM_TEMPLATE_REQUIRED_REGION_MISSING`
- `PUBLIC_FORM_TEMPLATE_ROOT_CONTENT_WIDTH_MISMATCH`
- `PUBLIC_FORM_TEMPLATE_ROOT_PADDING_MISMATCH`
- `PUBLIC_FORM_TEMPLATE_WIDTH_ANCHORS_MISMATCH`
- `PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_COUNT_INVALID`
- `PUBLIC_FORM_TEMPLATE_SUBMIT_BUTTON_LOCATION_INVALID`
- `PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_ALLOWED_SLOT`
- `PUBLIC_FORM_TEMPLATE_FIELD_CONTROL_OUTSIDE_FIELD_TEMPLATE`
- `PUBLIC_FORM_TEMPLATE_CONTENT_SECTION_CHILD_INVALID`
- `PUBLIC_FORM_FIELDS_1COL_GRID_ATTRS_MISMATCH`
- `PUBLIC_FORM_FIELDS_1COL_CONTROL_DISPLAY_LABEL_MISMATCH`
- `PUBLIC_FORM_FIELDS_1COL_CONTROL_MARGIN_MISMATCH`

Regression coverage:

`scripts/test-data-list-public-form-template-gates.mjs`

## Proof Boundaries

This training is export- and validator-proven. It does not prove anonymous public URL submission, upload execution, email delivery, or external sharing runtime behavior. Those require a separate browser/runtime proof.
