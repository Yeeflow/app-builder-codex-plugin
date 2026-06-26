# Data List Custom Form Default Layout Hard Gate Training Report

## Scope

This training closes the gap where Data List Form Layouts v1.1 validated generated custom forms only after they existed, but did not require every generated business Data List to actually use custom forms for all item entry points.

The new rule is strict: generated business Data Lists and Document Libraries must not rely on Yeeflow's built-in `default` form layout for New Item, Edit Item, or View Item.

## Required Behavior

Every generated business Data List or Document Library must provide custom form routing for:

- New Item
- Edit Item
- View Item

`ListModel.LayoutView.add`, `ListModel.LayoutView.edit`, and `ListModel.LayoutView.view` must each resolve to a Type `1` custom Data List form layout owned by the same list.

New/Edit forms must use:

- `data_list_form_layout_new_edit_v1_1`

View forms must use:

- `data_list_form_layout_view_item_v1_1`

The literal value `default`, missing display settings, unresolved layout IDs, Type `0` data views used as form routes, or generated custom forms without the required template marker are signing blockers.

## App Plan Contract

The App Plan Custom Data List Forms Plan must cover every Data List and Document Library declared in Section 4.

For each business list, Section 10 must include:

- a New/Edit custom form row selecting `data_list_form_layout_new_edit_v1_1`
- a View custom form row selecting `data_list_form_layout_view_item_v1_1`

System or support lists may skip custom forms only when the App Plan explicitly declares a system/support-list form-layout exemption with reason, user impact, fallback, and proof boundary. Silent omission is not generation-ready.

## Validator Coverage

Updated validator:

- `scripts/validate-data-list-form-layout-template.mjs`

Updated focused regression suite:

- `scripts/test-data-list-form-layout-template-gates.mjs`

New hard-gate failure codes include:

- `DATA_LIST_FORM_LAYOUT_DISPLAY_SETTINGS_MISSING`
- `DATA_LIST_FORM_LAYOUT_USAGE_MISSING`
- `DATA_LIST_FORM_LAYOUT_DEFAULT_USAGE_FORBIDDEN`
- `DATA_LIST_FORM_LAYOUT_USAGE_UNRESOLVED`
- `DATA_LIST_FORM_LAYOUT_USAGE_NOT_CUSTOM_FORM`
- `DATA_LIST_FORM_LAYOUT_APP_PLAN_LIST_FORMS_MISSING`
- `DATA_LIST_FORM_LAYOUT_APP_PLAN_NEW_EDIT_FORM_REQUIRED`
- `DATA_LIST_FORM_LAYOUT_APP_PLAN_VIEW_FORM_REQUIRED`

## Safety

This training does not bump the plugin version, move `stable`, create tags/releases/plugin archives, sign packages, install/import packages, upgrade Yeeflow apps, seed live data, or call live Yeeflow write APIs.
