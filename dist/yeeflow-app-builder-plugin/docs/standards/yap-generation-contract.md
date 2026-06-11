# YAP Generation Contract

## Purpose

`schemas/yap-schema.json` is the hard structural schema for readable `.yap` packages. Generated-final YAP packages must pass this schema before output, signing-boundary handoff, API import, or any claim that the package is ready. Schema pass is necessary, but it is not the whole import-qualification contract: generated-final YAP packages must also pass this generation contract and the relevant package/workflow validators.

Northpeak hardening: generated data-list fields must keep `FieldType` inside the canonical enum `Text`, `Bit`, `Decimal`, `Datetime`; UI/control type belongs in `Type`. Generated approval forms must include request/task pageUrl registration and a real assignment-task workflow graph when the design is an approval workflow.

Product schema refresh v0.6.17: generated custom YAP fields must use storage-code `FieldName` values, not business labels. For custom fields, `FieldName` must exactly equal `FieldType + FieldIndex`, such as `Text1`, `Decimal1`, `Bit1`, or `Datetime1`. `Datetime` is the canonical date/date-time storage spelling; legacy `DateTime` must fail for generated packages. Business labels belong in `DisplayName`. The native system title field must remain `FieldName = "Title"`, `IsSystem = true`, and `FieldIndex = 0`.

Use this contract only for plugin-generated final packages or explicit import-qualified runtime tests. Existing customer/product exports should use compatibility mode: report useful warnings, but do not globally reject valid historical exports just because they do not match current generated-final requirements.

## Required Generated-Final Contract

- Generate an export-shaped package, not a thin synthetic skeleton.
- Use a bundled sanitized export-like baseline/reference shape when the user has not provided a safe exported sample.
- Use Yeeflow-compatible long numeric-string local IDs for app, list, field, layout, form/process, app group, and sample record IDs.
- Preserve export-observed string ID shape for `DefResource.pageurls[].id` and workflow `childshapes[].id` / `resourceid`.
- Rebuild `Resource.ReplaceIds` from the final decoded package after every generation or repair step.
- Fail generated-final validation when `Resource.ReplaceIds` is empty or misses local generated IDs.
- Include full export-style root, child list, field, layout/view, approval/process, workflow graph, and app-level metadata.
- Custom data-list fields use `IsSystem = false`, `FieldIndex >= 1`, and storage-code `FieldName = FieldType + FieldIndex`; native `Title` uses `IsSystem = true` and `FieldIndex = 0`.
- Include app-level structures even when empty or null: `Resource.SimplePortal`, `Data.PortalInfo`, `AppTags`, `AppMetadatas`, `AppComponents`, `AppThemes`, `OtherModules`, report arrays, permission/group arrays, and app group structures where needed.
- Parse decoded/stringified runtime-critical fields before output: `DefResource`, field `Rules`, form `Settings`, layout/view `Ext1` / `Ext2` / `Ext3`, `LayoutView`, and workflow graph strings where applicable.
- Preserve native `Title` semantics. `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` is warning-only; do not replace native `Title` with an artificial generated field name when that breaks runtime semantics.
- Generated reports must include proof boundaries. API accepted/queued is not async import success.
- Approval form workspaces must be designer-qualified: every `formdef.children` control has a unique designer-level `id`, all control references resolve, and selecting one control must not select many controls.
- Generated approval form workspaces must use designer-safe export-proven control families unless another family has separate designer proof.
- Heading/text controls must populate native rendered text metadata. Heading controls must set `attrs.headc.title.value` and must not emit default placeholders such as `Here is the title`.
- Generated child lists must include `ListType`, full list/layout export metadata, valid approval `NoRule`, published approval form status, and export-shaped approval DefResource metadata.
- `Resource.ReplaceIds` must include generated app group IDs.

## Dedicated Error Codes

Generated-final validation should hard-fail these conditions:

- `YAP_EXPORT_SHAPE_TOO_SYNTHETIC`
- `YAP_GENERATION_CONTRACT_MISSING`
- `YAP_LOCAL_ID_SHAPE_INVALID`
- `YAP_ID_TYPE_RUNTIME_MISMATCH`
- `YAP_REPLACEIDS_EMPTY`
- `YAP_REPLACEIDS_FINAL_COVERAGE_INCOMPLETE`
- `YAP_ROOT_METADATA_INCOMPLETE`
- `YAP_CHILD_LIST_METADATA_INCOMPLETE`
- `YAP_FIELD_METADATA_INCOMPLETE`
- `YAP_LAYOUT_METADATA_INCOMPLETE`
- `YAP_DEFAULT_VIEW_EXPORT_SHAPE_INCOMPLETE`
- `YAP_APP_LEVEL_EXPORT_FIELDS_MISSING`
- `YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE`
- `YAP_WORKFLOW_GRAPH_METADATA_INCOMPLETE`
- `YAP_PAGEURL_ID_SHAPE_INVALID`
- `YAP_CHILD_SHAPE_ID_SHAPE_INVALID`
- `YAP_LISTDATAS_KEYED_RECORDS_MISSING`
- `YAP_FIELD_RULES_NOT_STRING`
- `YAP_FIELD_RULES_JSON_INVALID`
- `YAP_DEFRESOURCE_DECODE_INVALID`
- `YAP_FORM_SETTINGS_JSON_INVALID`
- `YAP_LAYOUT_EXT_JSON_INVALID`
- `YAP_PROOF_BOUNDARY_MISSING`
- `YAP_REPORT_API_QUEUED_MARKED_SUCCESS`
- `YAP_FORM_CONTROL_ID_MISSING`
- `YAP_FORM_CONTROL_ID_DUPLICATE`
- `YAP_FORM_CONTROL_ID_REFERENCE_INVALID`
- `YAP_FORM_DESIGNER_SELECTION_RISK`
- `YAP_HEADING_NATIVE_TITLE_MISSING`
- `YAP_HEADING_NATIVE_TITLE_PLACEHOLDER`
- `YAP_TEXT_NATIVE_VALUE_MISSING`
- `YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH`
- `YAP_FORM_DESIGNER_UNPROVEN_CONTROL`
- `YAP_FORM_DESIGNER_HYDRATION_RISK`
- `YAP_CHILD_LISTTYPE_MISSING`
- `YAP_LIST_EXPORT_METADATA_INCOMPLETE`
- `YAP_LAYOUT_EXPORT_METADATA_INCOMPLETE`
- `YAP_NORULE_INVALID`
- `YAP_FORM_STATUS_NOT_PUBLISHED`
- `YAP_REPLACEIDS_APP_GROUP_ID_MISSING`

## Proof Boundary

Never call API status `0` with `Completed=false` an import success. Use separate proof levels:

- local validation passed
- API accepted/queued
- async import completed
- app opened
- form designer hydrated
- workflow designer hydrated
- controls render with intended text
- single-control designer selection verified
