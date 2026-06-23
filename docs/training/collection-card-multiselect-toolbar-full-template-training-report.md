# Collection Card Multiselect Toolbar Full Template Training Report

## Summary

This training upgrades `collection_control_card_with_multiselect_toolbar` from a summary-level card/multiselect guidance entry into a first-class export-shaped Dashboard Collection template.

The template source is the `Collection card multiple select` Dashboard page from `Company Overview-v1.3.yapk`. The extracted component root is `card_with_multiselect_toolbar_wrapper`; the plugin now carries the component subtree and required page-level dependencies as a standalone reference artifact:

- `docs/reference/collection-control-card-with-multiselect-toolbar.template.json`

## Source Boundary

The source package was decoded through tolerant streaming Brotli because the official export emitted complete parseable `AppPackageInfo` JSON before ending with `Z_BUF_ERROR`. The plugin artifact does not include the raw `.yapk`, raw `Resource`, raw `Sign`, tenant URLs, or a full decoded application payload. Long source resource IDs and local source paths are redacted or placeholderized in the reference artifact.

## New Template Contract

Generation must copy `card_with_multiselect_toolbar_wrapper` and all descendants. It must not satisfy this template with a generic card Collection, ad hoc checkbox icons, or a rebuilt toolbar.

Editable regions:

- `card_col_title_wrapper`
- `op_normal`
- `op_multipleselected`
- `card_col_item`
- optional `card_col_item_operations`

Locked/generated-final required regions and dependencies:

- `card_with_multiselect_toolbar_wrapper`
- `card_col_item_multi_select`
- Collection root `attrs.actions[]`
- page-level `filterVars`
- page-level `tempVars`
- page-level `actions`
- page-level `filter`
- page-level `formAction`

Dynamic control mapping:

- user fields use `dynamic-user`
- image fields use `dynamic-image`
- file or attachment fields use `dynamic-file`
- other fields use `dynamic-field`
- each card item should include one subject-style Dynamic field based on the source `Survey Program name` control

## New Validation

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now validates the full template artifact and enforces card multiselect generated-final conformance.

New or strengthened findings include:

- `DASH_DATASET_CARD_MULTISELECT_TEMPLATE_REFERENCE_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_TEMPLATE_FILE_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_TEMPLATE_SLOT_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_TEMPLATE_DEPENDENCY_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_WRAPPER_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_SLOT_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_CONTROL_MUTATED`
- `DASH_DATASET_CARD_MULTISELECT_COLLECTION_ACTIONS_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_BUTTON_ACTION_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_SUBJECT_FIELD_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_DYNAMIC_USER_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_FILTERVARS_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_TEMPVARS_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_PAGE_ACTIONS_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_FORM_ACTION_MISSING`
- `DASH_DATASET_CARD_MULTISELECT_SELECTED_VARIABLE_MISSING`

## Regression Coverage

The focused Dashboard dataset presentation test now includes `collection_control_card_with_multiselect_toolbar` in the all-approved-template positive package. It also fails simplified or incomplete card multiselect packages, including missing export-shaped slots, missing page-level dependencies, and action buttons without action bindings.

## Classification

Pre-existing template/generator gap:

- The plugin had an approved `collection_control_card_with_multiselect_toolbar` template ID, but only summary-level guidance and broad multiselect checks.
- A generated package could theoretically pass with a simplified card Collection plus checkbox-like controls.

This training makes the full template artifact, editable regions, locked regions, page dependencies, and action dependencies explicit and validator-backed.

## Proof Boundary

This training proves local template/reference and generated-final structural conformance. It does not prove live multiselect action execution, batch mutation behavior, browser rendering, or tenant-specific permissions.
