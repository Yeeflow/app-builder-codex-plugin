# YAP Approval Form Workspace Generation Lessons

## Scope

This study records sanitized lessons from the Service Desk Form Workspace YAP generation/import loop. The successful reference package inspected locally was:

- `service-desk-form-workspace-smoke-fixed-v8-inline-controls.yap`

Earlier repair stages in the same local folder were inspected only as failure history. No generated package, raw decoded payload, screenshot, tenant/workspace ID, upload ID, private URL, Resource, or Sign is committed.

## Failure And Fix Timeline

| Stage | Runtime/API symptom | Root cause | Fix | Validator rule needed |
|---|---|---|---|---|
| Original generated YAP | Approval form did not materialize as intended | Form metadata and app navigation were not aligned with Service Desk Pro export shape | Use `Data.Forms[].ListID = 0`, Type `105` root nav, and aligned form keys | `YAP_FORM_LISTID_MATERIALIZATION_INVALID`, `YAP_FORM_NAV_TYPE105_MISSING`, `YAP_FORM_KEY_MISMATCH`, `YAP_FORM_DEFKEY_MISMATCH` |
| Materialization repair | Import accepted but approval form was blank | Form used unsupported `formdef.controls` and generated control names | Use `DefResource.pageurls[].formdef.children` with lowercase export-style controls | `YAP_FORMDEF_CONTROLS_UNSUPPORTED`, `YAP_FORMDEF_CHILDREN_MISSING`, `YAP_FORM_CONTROL_EXPORT_SHAPE_INVALID`, `YAP_FORM_DESIGNER_READABLE_TREE_MISSING` |
| Workflow repair | Workflow designer showed only End | Minimal workflow graph omitted Start and SequenceFlow linkage | Include `StartNoneEvent -> SequenceFlow -> EndNoneEvent` and point Start task URL to requester page | `YAP_WORKFLOW_START_MISSING`, `YAP_WORKFLOW_SEQUENCE_MISSING`, `YAP_WORKFLOW_END_MISSING`, `YAP_WORKFLOW_START_NOT_LINKED`, `YAP_WORKFLOW_END_NOT_LINKED`, `YAP_WORKFLOW_SEQUENCE_SOURCE_TARGET_MISSING`, `YAP_WORKFLOW_START_TASKURL_MISSING` |
| Page settings repair | Form content materialized but workspace page did not occupy the intended surface | Default form header, content width, and padding remained active | Hide header, set content width Full width, set padding `0` | `YAP_FORM_PAGE_HEADER_NOT_HIDDEN`, `YAP_FORM_PAGE_WIDTH_NOT_FULL`, `YAP_FORM_PAGE_PADDING_NOT_ZERO` |
| Icon/overflow repair | Layout was visible but icons distorted rows and columns needed separate scrolling | Icon controls were too large/full-width and panel overflow relied on defaults | Set icons inline, 16px for 16px text rows, contextual symbols, shell Hidden, column Scroll | `YAP_ICON_WIDTH_NOT_INLINE`, `YAP_ICON_SIZE_MISMATCH`, `YAP_ICON_SIZE_LAYOUT_RISK`, `YAP_ICON_CONTEXT_GENERIC`, `YAP_WORKSPACE_SHELL_OVERFLOW_INVALID`, `YAP_WORKSPACE_COLUMN_SCROLL_MISSING`, `YAP_WORKSPACE_PANEL_OVERFLOW_DEFAULT_RISK`, `YAP_WORKSPACE_SCROLL_REGION_MISSING` |
| v8 inline control repair | User confirmed form controls rendered; final rule needed to prevent future text/control squeeze | Text/heading controls also needed inline width; Button/Dynamic field should follow the same rule when present | Set Icon, Text/heading, Button, and Dynamic field controls to inline width by default | `YAP_TEXT_WIDTH_NOT_INLINE`, `YAP_BUTTON_WIDTH_NOT_INLINE`, `YAP_DYNAMIC_FIELD_WIDTH_NOT_INLINE`, `YAP_CONTROL_WIDTH_BEHAVIOR_MISSING` |

## Materialization Lessons

YAP approval/form workspaces are sensitive to app-level reachability and form keys. Import can succeed without producing a usable form if the root app navigation and form metadata do not match.

Reusable rules:

- Keep `Data.Forms[].ListID = 0` for Service Desk Pro-style approval/form workspaces.
- Add a root Type `105` navigation item for the workspace form.
- Align the form key across `Resource.FormKeys[]`, `Data.Forms[].Key`, Type `105` navigation `ListID`, and embedded `DefResource.defkey` / `DefResource.key`.
- Use stable real-export-like keys such as `SDP-WS-V4` when generating a workspace form.

## Designer-Readable Form Lessons

The designer-readable form tree lives under:

```text
DefResource.pageurls[].formdef.children
```

Do not generate only `formdef.controls`. The successful v8 shape used export-style controls such as `list`, `container`, `heading`, and `icon`; it did not use generated PascalCase control names.

## Workflow Lessons

Even a no-submit workspace form needs the workflow designer to see a complete minimal graph:

```text
StartNoneEvent -> SequenceFlow -> EndNoneEvent
```

Start must have outgoing sequence linkage, End must have incoming sequence linkage, and SequenceFlow must include source and target. The Start task URL fields should point to the requester form page where applicable.

## Page Settings Lessons

Workspace forms should set:

- `hideHeader: true`
- `attrs.container.cw = "2"`
- `attrs.container.padding["1"] = { top: 0, right: 0, bottom: 0, left: 0 }`

## Inline Control Lessons

Generated workspace forms should default these controls to inline width:

1. Icon
2. Text / heading
3. Button
4. Dynamic field

The successful v8 package had 72 Text/heading controls and 22 Icon controls using inline width. Button and Dynamic field controls were not present in the smoke, but validators should check them when generated.

## Overflow Lessons

For multi-column workspaces, the shell should be bounded and each column should scroll independently:

- Shell: Hidden
- Left navigation panel: Scroll
- Ticket collection panel: Scroll
- Ticket collection scroll region: Scroll
- Selected ticket workspace panel: Scroll
- Selected ticket body scroll region: Scroll
- Right attributes panel: Scroll

Do not rely on Default overflow for multi-column workspace columns.

## App Color Note

The user-updated export included a color-setting correction where Neutral color used the Luminance light model rather than the older Lightness setting. This remains a study note until a dedicated color-setting fixture proves exact validator fields.

## Validation Added

The scoped validator is:

- `scripts/inspect-yap-form-workspace-generation.mjs`

It passes the successful v8 package with zero `YAP_*` errors and one expected warning:

- `YAP_NATIVE_TITLE_SCHEMA_CONFLICT`

The warning documents the current schema/tooling conflict where canonical YAP schema expects digit-suffixed field names, while runtime-safe native Title uses `FieldName/InternalName = Title`.
