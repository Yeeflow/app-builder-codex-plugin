# YAP Approval Form Workspace Generation Standard

## Purpose

This standard captures the YAP-specific lessons from the successful Service Desk Form Workspace Smoke v8 import. It applies only when a generated `.yap` package intentionally creates an approval/requester form as an operational workspace, such as `multi_column_form_workspace_shell`.

It does not make every YAP form a workspace and does not require real approval routing. A simple Start to End workflow is acceptable when the form is being used as a workspace shell.

This standard is subordinate to the generated-final YAP contract:

- `docs/standards/yap-generation-contract.md`
- `docs/standards/yap-export-shaped-application-generation-standard.md`

Passing `schemas/yap-schema.json`, Type `105` navigation, `Data.Forms[].ListID = 0`, and `formdef.children` is necessary but not sufficient. Generated-final approval/form-workspace YAP packages must also be export-shaped and import-qualified across ID shape, `Resource.ReplaceIds`, root/list/layout/field metadata, app-level structures, decoded runtime-critical strings, and proof-boundary reporting.

## Materialization Requirements

YAP approval/form workspaces must follow the export-proven materialization shape:

- `Data.Forms[].ListID = 0` for Service Desk Pro-style approval/form workspace entries.
- Root app navigation must include a Type `105` form navigation item.
- The Type `105` navigation `ListID` must point to the form key.
- `Resource.FormKeys[]`, `Data.Forms[].Key`, root Type `105` navigation key, and embedded `DefResource.defkey` / `DefResource.key` must align.
- Use stable export-like form keys, for example `SDP-WS-V4`, instead of weak generated keys that drift between form, nav, and DefResource.
- Use export-observed string IDs for `DefResource.pageurls[].id` and workflow `childshapes[].id` / `resourceid`.
- Keep full export-style DefResource metadata: `name`, `title`, `workflowType`, `AppListSetID`, `ProcModelAppID`, `ProcModelListID`, `ProcModelListSetID`, `ext`, `lineType`, `iconURL`, `flowPage`, `variables`, `graphposition`, `graphzoom`, and `graphver`.

If these rules fail, import can succeed while the approval form is missing or unreachable.

## Designer-Readable Form Tree

Generated YAP form workspace content must use the designer-readable export shape:

- Put form content in `DefResource.pageurls[].formdef.children`.
- Do not use unsupported `formdef.controls`.
- Use lowercase export-style controls.
- For Service Desk-style generated approval/form workspaces, prefer the designer-load-proven control family from the successful v8 smoke: `list`, `container`, `heading`, and `icon`.
- Do not generate `collection` or `dynamic-field` controls in this YAP approval/form workspace pattern unless the exact control shape is copied from an export-proven form workspace and validated as designer-load safe. Generated approximations of those controls caused the form designer to keep loading after import.
- Controls should include export-style `attrs`, `actions`, `exts`, `formAction`, and `ver` where applicable.
- The designer-readable tree must contain expected root children and nested containers/controls.

The failed smoke packages proved that `formdef.controls` and generated PascalCase control names such as `Container`, `Text`, and `Icon` can import as a blank approval form.

The later fresh smoke loop proved a second designer failure mode: a package can import and publish, but the approval form designer can keep loading when the form tree contains generated, non-export-proven `collection` or `dynamic-field` controls. The successful recovery used the user-confirmed v8 designer-loadable form tree and freshened only app/list/form IDs and package identity.

## Designer-Qualified Approval Form Controls

Generated approval forms must be designer-hydration safe, not merely schema-valid or import-accepted.

- Use designer-safe export-proven control families only for generated approval form YAP workspaces unless another control family has been separately studied and validated.
- Generated form content must use `formdef.children`, not `formdef.controls`.
- Every generated form control must have a unique designer-level `id`.
- IDs must be unique across the entire form tree.
- Parent/child and control-reference fields must resolve to those unique IDs.
- Missing, duplicated, or unresolved control IDs must fail generated-final validation.
- Heading/text controls must populate native rendered text metadata, not only label/display metadata.
- For heading controls, populate `attrs.headc.title.value`.
- Do not allow heading controls to fall back to default placeholder text such as `Here is the title`.
- If the generator cannot confidently populate native text metadata, it must fail generated-final validation.
- Control labels and native rendered title values must be synchronized where both exist.

A generated approval form is not designer-qualified until it imports successfully, opens in the designer, renders intended text, and selecting one control selects only that control. API accepted/queued is not designer proof, and import complete is not designer hydration or selection proof.

The Research v0.6.11 smoke cycle proved this gap: one generated package rendered heading controls as the default placeholder because it set labels without `attrs.headc.title.value`, and another selected many controls at once because generated controls lacked unique designer IDs. A manually edited export with unique IDs and native heading title metadata clarified the required generation shape.

## Data List And Sample Row Import Shape

YAP approval/form workspace import is sensitive to child data-list shape even when the form itself is the main test target.

For Service Desk-style YAP workspaces:

- Preserve native `Title` as the first field.
- Start generated business fields at `Text2`, not `Text1`, when following the v8 Service Desk workspace export pattern.
- Do not use generated `Lookup1` for the Ticket Activities ticket reference in this pattern; the successful v8 shape uses `Text2`.
- Store sample data in `ListDatas` as a record-ID-keyed object. Do not wrap rows in `ListDatas.Datas`.
- Every sample row key must resolve to a declared `Defs[].FieldName`.
- Keep field `Rules` in export-style stringified JSON such as `"{}"` or a stringified `choices` object.
- Preserve runtime-safe native `Title` even when the canonical YAP schema reports the known digit-suffix warning.

The failed fresh smoke packages proved these as hard pre-import rules. The async importer accepted packages with API `Status = 0` but failed later when sample rows used keys such as `Datetime8` against `Text8` definitions, when rows were wrapped under `ListDatas.Datas`, or when Service Desk fields drifted to `Text1` / `Lookup1` numbering instead of the v8-proven `Text2...` shape.

## ReplaceIds Remapping Coverage

Generated YAP approval/form workspace packages must rebuild `Resource.ReplaceIds` from the final decoded package after every generation, ID remap, repair, or baseline copy. Do not reuse a successful baseline package's `ReplaceIds`.

Include every generated local ID that Yeeflow must remap during import:

- root app/ListSet ID
- child data-list IDs
- field IDs
- view and custom-form layout IDs
- approval form/process IDs
- workflow shape/resource IDs
- app group IDs when generated
- local sample record `ListDataID` keys

Exclude tenant/user metadata such as `TenantID`, `CreatedBy`, and `ModifiedBy`, and exclude external dependency IDs.

The broad Service Desk form-workspace YAP test proved this as a hard async-import rule: the package passed local shape checks and API queue acceptance, but async import failed until `Resource.ReplaceIds` was rebuilt from the final broad package and covered all generated child list, layout, field, form/process, workflow, and sample record IDs.

## Minimal Workflow Graph

Even no-submit workspace forms need a complete workflow graph for the workflow designer:

```text
StartNoneEvent -> SequenceFlow -> EndNoneEvent
```

Required graph rules:

- Include `StartNoneEvent`.
- Include `SequenceFlow`.
- Include `EndNoneEvent`.
- Start must have outgoing sequence linkage.
- End must have incoming sequence linkage.
- SequenceFlow must include both source and target references.
- Start `taskurl`, `taskUrl`, and `TaskUrl` should point to the requester form page when those fields are present.

Do not add fake approval routing. If there is no real approval process, keep the graph minimal and document the form as a workspace shell.

## Workspace Page Settings

Workspace-style approval/requester forms should set:

- `hideHeader: true`
- `attrs.container.cw = "2"` for Full width
- `attrs.container.padding["1"] = { top: 0, right: 0, bottom: 0, left: 0 }`

The app chrome and workspace shell provide the visible context. The default form header, narrow content width, or default page padding can break multi-column layout.

## Inline Control Width

Generated controls should use inline width behavior for:

- Icon
- Text / heading
- Button
- Dynamic field

For export-style controls this means `attrs.common.positioning.widthtype = [null, "2"]` unless a proven variant uses an equivalent inline setting.

Other controls should still receive explicit width behavior appropriate to the layout. Do not leave control width behavior undefined when the control participates in a multi-column workspace.

## Icon Size And Context

Icon controls must be inline, bounded, and contextually selected:

- Icons in text/menu rows should match nearby text size.
- The v8 smoke package used 16px icons next to 16px menu text.
- The proven v8 shape used `attrs.icon.size = [null, "--sp--s200"]`, `attrs.common.width = [null, 16]`, and `attrs.common.height = [null, 16]`.
- Use meaningful icons such as inbox, at, pencil, users, flag, folder, search, ellipsis, plus, or chevron according to context.
- Do not use generic placeholder icons in generated-final workspaces.

Oversized or full-width icons can distort narrow columns and collapse surrounding text.

## Multi-Column Overflow

For 3-column, 4-column, or other multi-column workspaces, each column needs its own vertical scroll behavior.

Observed overflow options:

1. Default
2. Hidden
3. Auto
4. Scroll

Working Service Desk v7/v8 pattern:

- Shell: Hidden
- Left navigation panel: Scroll
- Ticket collection panel: Scroll
- Ticket collection scroll region: Scroll
- Selected ticket workspace panel: Scroll
- Selected ticket body scroll region: Scroll
- Right attributes panel: Scroll

Generation rules:

- Use Hidden at the outer shell where needed to keep the workspace bounded.
- Use Scroll or Auto for panel columns and body regions.
- Do not rely on Default overflow for multi-column workspace panels.
- Do not let content expand the whole form vertically when each column should scroll independently.

## Application Color Note

The user-updated successful export also included application color setting changes where Neutral color used the Luminance light model rather than the older Lightness setting. Treat this as a product-export-safe theme note until a broader color-setting fixture confirms exact field-level validator rules.

## Scoped Validator Errors

Validators should apply these checks only to generated YAP approval/form workspaces or when a runtime test explicitly asks for this pattern:

- `YAP_FORM_LISTID_MATERIALIZATION_INVALID`
- `YAP_FORM_NAV_TYPE105_MISSING`
- `YAP_FORM_KEY_MISMATCH`
- `YAP_FORM_DEFKEY_MISMATCH`
- `YAP_FORMDEF_CONTROLS_UNSUPPORTED`
- `YAP_FORMDEF_CHILDREN_MISSING`
- `YAP_FORM_CONTROL_EXPORT_SHAPE_INVALID`
- `YAP_FORM_DESIGNER_UNPROVEN_CONTROL`
- `YAP_FORM_DESIGNER_HYDRATION_RISK`
- `YAP_FORM_CONTROL_ID_MISSING`
- `YAP_FORM_CONTROL_ID_DUPLICATE`
- `YAP_FORM_CONTROL_ID_REFERENCE_INVALID`
- `YAP_FORM_DESIGNER_SELECTION_RISK`
- `YAP_HEADING_NATIVE_TITLE_MISSING`
- `YAP_HEADING_NATIVE_TITLE_PLACEHOLDER`
- `YAP_TEXT_NATIVE_VALUE_MISSING`
- `YAP_CONTROL_LABEL_NATIVE_TEXT_MISMATCH`
- `YAP_FORM_DESIGNER_READABLE_TREE_MISSING`
- `YAP_CHILD_LISTTYPE_MISSING`
- `YAP_LIST_EXPORT_METADATA_INCOMPLETE`
- `YAP_LAYOUT_EXPORT_METADATA_INCOMPLETE`
- `YAP_NORULE_INVALID`
- `YAP_FORM_STATUS_NOT_PUBLISHED`
- `YAP_LISTDATAS_KEYED_RECORDS_MISSING`
- `YAP_LISTDATA_FIELD_UNKNOWN`
- `YAP_FIELD_RULES_NOT_STRING`
- `YAP_SERVICE_DESK_FIELD_NUMBERING_DRIFT`
- `YAP_WORKFLOW_START_MISSING`
- `YAP_WORKFLOW_SEQUENCE_MISSING`
- `YAP_WORKFLOW_END_MISSING`
- `YAP_WORKFLOW_START_NOT_LINKED`
- `YAP_WORKFLOW_END_NOT_LINKED`
- `YAP_WORKFLOW_SEQUENCE_SOURCE_TARGET_MISSING`
- `YAP_WORKFLOW_START_TASKURL_MISSING`
- `YAP_FORM_PAGE_HEADER_NOT_HIDDEN`
- `YAP_FORM_PAGE_WIDTH_NOT_FULL`
- `YAP_FORM_PAGE_PADDING_NOT_ZERO`
- `YAP_ICON_WIDTH_NOT_INLINE`
- `YAP_TEXT_WIDTH_NOT_INLINE`
- `YAP_BUTTON_WIDTH_NOT_INLINE`
- `YAP_DYNAMIC_FIELD_WIDTH_NOT_INLINE`
- `YAP_CONTROL_WIDTH_BEHAVIOR_MISSING`
- `YAP_ICON_SIZE_MISMATCH`
- `YAP_ICON_SIZE_LAYOUT_RISK`
- `YAP_ICON_CONTEXT_GENERIC`
- `YAP_WORKSPACE_SHELL_OVERFLOW_INVALID`
- `YAP_WORKSPACE_COLUMN_SCROLL_MISSING`
- `YAP_WORKSPACE_PANEL_OVERFLOW_DEFAULT_RISK`
- `YAP_WORKSPACE_SCROLL_REGION_MISSING`
- `LOCAL_ID_NOT_IN_REPLACEIDS`
- `LOCAL_ID_NOT_IN_REPLACEIDS_TRUNCATED`
- `REPLACEIDS_EMPTY`
- `YAP_EXPORT_SHAPE_TOO_SYNTHETIC`
- `YAP_LOCAL_ID_SHAPE_INVALID`
- `YAP_PAGEURL_ID_SHAPE_INVALID`
- `YAP_CHILD_SHAPE_ID_SHAPE_INVALID`
- `YAP_APPROVAL_DEFRESOURCE_METADATA_INCOMPLETE`
- `YAP_WORKFLOW_GRAPH_METADATA_INCOMPLETE`
- `YAP_REPLACEIDS_APP_GROUP_ID_MISSING`

The native Title schema conflict remains a warning, not a hard failure:

- `YAP_NATIVE_TITLE_SCHEMA_CONFLICT`

Message:

`Canonical YAP schema currently requires digit-suffixed FieldName, but runtime-safe native Title uses FieldName/InternalName Title. Preserve runtime-safe Title and track schema update separately.`
