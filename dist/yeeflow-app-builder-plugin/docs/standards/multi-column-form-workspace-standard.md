# Multi-Column Form Workspace Standard

## Purpose

The `multi_column_form_workspace_shell` pattern is an optional Yeeflow application pattern for operational workspaces that need form-state, action-driven filtering, selected-record detail binding, comments, and dense multi-panel navigation. The Service Desk Pro export proves this pattern on an approval/form surface rather than a dashboard.

Use it for service desk, help desk, CRM workbench, support console, case management, renewal review, triage, review queues, and operational inbox apps where the user works through records without leaving the workspace.

## When To Use A Form Workspace Instead Of A Dashboard

Use a dashboard when the page is primarily reporting, monitoring, KPI review, charting, or table browsing.

Use an approval/form workspace when the page needs one or more of these capabilities:

- form actions that set state variables and refresh controls
- selected-record state shared across panels
- comment or update input controls
- dynamic fields bound to the selected record
- collection item click actions
- form variables that drive query/filter conditions
- field/edit controls that belong on a form surface

Do not add fake workflow logic just to use this pattern. If the workflow exists only as Start to End, document that the approval form is being used as a workspace shell, not as a true approval workflow.

## Layout Anatomy

The Service Desk Pro workspace is closer to a 4-column service desk console than the earlier 3-column dashboard reference:

```text
approval_form_workspace_root
├─ helper/list controls
└─ multi_column_form_workspace_shell
   ├─ left_help_desk_navigation_panel
   ├─ ticket_collection_panel
   └─ selected_ticket_workspace_area
      ├─ selected_ticket_conversation_panel
      └─ right_ticket_details_panel
```

The exported form uses an absolute row container as the visible shell. The first two visible columns are fixed-width containers. The remaining workspace area fills the rest of the page and contains the selected ticket conversation/detail surface and the right attributes panel.

Recommended semantic names:

- `multi_column_form_workspace_shell`
- `left_help_desk_navigation_panel`
- `ticket_collection_panel`
- `selected_record_workspace_panel`
- `right_attributes_panel`
- `workspace_filter_state`
- `selected_record_state`
- `comment_update_area`
- `collapse_expand_action_area`

## Reference Implementation Notes

The Service Desk Pro export shows these reusable mechanics:

- The form page contains a helper `list` control and then an absolute positioned shell container.
- The shell uses row direction with no gap between columns.
- The left navigation panel uses fixed width behavior around `400px`, full-height behavior, and scroll overflow.
- The ticket collection panel uses fixed width behavior around `500px`, full-height behavior, and a scrollable collection body.
- The selected workspace area uses full-height behavior and contains conversation/detail content and the right detail attributes region.
- The ticket collection body uses a CSS flex fill rule equivalent to `flex: 1 1 0`.
- Header/search/filter areas use row alignment, fixed min height, and stable top placement.
- Panel bodies scroll inside their container rather than expanding the full form vertically.
- Navigation rows are containers made from icon plus text controls.
- Collection item rows have click/action behavior and selected visual state.
- The right panel uses dynamic field controls bound to the selected ticket.

## Required Runtime Layout Properties

The Service Desk Pro runtime proves that `multi_column_form_workspace_shell` is not satisfied by four semantic containers. The form workspace shell must reproduce the layout mechanics, or the designer/runtime can squeeze text into narrow vertical columns.

For YAP generation, also apply the YAP approval form workspace standard:

- `docs/standards/yap-approval-form-workspace-generation-standard.md`
- `docs/standards/yap-generation-contract.md`
- `docs/standards/yap-export-shaped-application-generation-standard.md`

The multi-column workspace layout can be visually correct while the package is still too synthetic to materialize. Generated-final YAP workspaces must therefore pass both the form-workspace layout checks and the export-shaped generation contract.

Required shell rules:

- The form workspace shell must not rely on default container layout.
- The form page should hide the standard header when the app chrome already provides context.
- The form container should use full-width behavior and zero page padding for the workspace surface.
- The visible shell is the root workspace container after any hidden helper/list control.
- The shell must define explicit placement and row layout. In the reference this is `common.pos = absolute`, `common.hor = center`, `common.ver = center`, `style.direction = row`, and `style.gap = 0`.
- The shell must define side-by-side columns; it must not let panels flow as generic sequential content.

Required column rules:

- Left navigation panel: fixed width, about `400px` in the reference; full-height behavior; scroll overflow; grey background; stable header row.
- Ticket collection panel: fixed width, about `500px` in the reference; full-height behavior; right border; stable header/filter area; scrollable collection body.
- Selected ticket workspace region: fills the remaining workspace; full-height behavior; column structure with selected-ticket content and a bottom comment/update bar.
- Selected ticket content row: row layout with the conversation/detail workspace filling available width and the right attributes panel fixed around `420px`.
- Right attributes panel: fixed width, full-height behavior, left border, z-index when needed, stable header, and scrollable body.
- Panel bodies should scroll inside their parent. Do not let collection/detail content expand the whole form vertically.

Required control rules:

- Navigation menu items must be horizontal icon/text containers with `direction = row`, `align_items = center`, a small gap, padding, and click/form actions.
- Ticket collection item templates must be stable row/card containers with padding, background/hover/selected-state styling, and a click action that sets selected/current-ticket state.
- Header rows must specify horizontal direction, alignment, spacing, and justification.
- Detail field rows should use horizontal label/value layout with `justify_content = space-between`; long text fields may switch to column layout with enough width.
- Text, heading, dynamic field, and user controls must sit inside containers with enough width; generated pages must avoid any one-character-per-line vertical text risk.
- Icon, Text/heading, Button, and Dynamic field controls should default to inline width behavior in generated form workspaces. For YAP export-style controls, use `attrs.common.positioning.widthtype = [null, "2"]` unless a proven equivalent is used.
- Icon controls should be bounded and context-aware. The successful v8 Service Desk YAP smoke used 16px icons beside 16px menu text with `attrs.icon.size = [null, "--sp--s200"]`, `attrs.common.width = [null, 16]`, and `attrs.common.height = [null, 16]`.
- Generated icons should be specific to the action or menu item, such as inbox, at, pencil, users, flag, folder, search, ellipsis, plus, or chevron. Generic placeholder icons are a generated-final failure.
- Comment/update controls belong in a bottom bar with row direction, `margin-top: auto` behavior, a top border, and safe selected-record binding.

Required YAP materialization rules:

- Use `Data.Forms[].ListID = 0` for Service Desk Pro-style approval/form workspace entries.
- Add a root Type `105` navigation item pointing to the form key.
- Align `Resource.FormKeys[]`, `Data.Forms[].Key`, Type `105` navigation `ListID`, and embedded `DefResource.defkey` / `DefResource.key`.
- Put the requester workspace form in `DefResource.pageurls[].formdef.children`; do not use unsupported `formdef.controls`.
- Use export-style lowercase controls.
- For YAP Service Desk-style generated workspaces, use only designer-load-proven controls unless an exact export-proven control shape is available. The successful v8 smoke loaded with `list`, `container`, `heading`, and `icon`; generated `collection` and `dynamic-field` approximations later caused the approval form designer to keep loading.
- Keep a minimal complete workflow graph: `StartNoneEvent -> SequenceFlow -> EndNoneEvent`.
- Set workspace page settings: hide default form header, content width Full width, and padding `0`.
- Preserve the v8-proven child-list import shape: native `Title`, business fields starting at `Text2`, record-ID-keyed `ListDatas`, sample row keys that exactly match `Defs[].FieldName`, and stringified field `Rules`.
- Rebuild `Resource.ReplaceIds` from the final decoded package after all generation and repair steps. Include generated root/list/field/layout/form/process/workflow/sample IDs; stale baseline `ReplaceIds` can pass API queue acceptance and still fail async import.
- Generate from a bundled sanitized export-like baseline/reference shape when no user-provided safe export is available. If no safe baseline exists, do not claim import-qualified output.
- Parse runtime-critical strings before output: `DefResource`, field `Rules`, layout/view `Ext1` / `Ext2` / `Ext3`, `LayoutView`, and form `Settings` where present.

Required overflow rules:

- The outer multi-column shell should use Hidden overflow where it owns the full workspace bounds.
- Each column should have independent Scroll or Auto overflow.
- Inner body regions such as ticket collection, selected ticket body, and attributes should scroll independently when content exceeds the panel height.
- Do not rely on Default overflow for multi-column workspace columns.

Property checklist for generated packages claiming this pattern:

- root shell width/height or root placement strategy
- shell direction
- shell align-items when used by direct child rows
- shell justify-content when used by direct child rows
- shell gap
- shell overflow or bounded child overflow
- panel width
- panel height
- panel overflow
- panel padding
- panel margin
- control width
- control shrink/wrap behavior
- icon inline width
- icon bounded size
- Text/heading, Button, and Dynamic field inline width
- collection item layout
- selected record binding
- form action binding

If these properties are missing, the generator must not claim conformance to `multi_column_form_workspace_shell`, and validators should fail the package before signing or install.

## Action-Driven Filtering

Navigation and filters are not just visual labels. The reference uses form actions to set variables and refresh controls:

| UI element | Trigger | Form action | Variables affected | Target control/query | Runtime behavior |
|---|---|---|---|---|---|
| Your inbox | menu container click | nav action | current filter state and current user values | ticket collection query | show tickets relevant to current user |
| Mentioned you | menu container click | nav action | mentioned-user filter values | ticket collection query | show tickets where current user is mentioned |
| Created by you | menu container click | nav action | created-by filter values | ticket collection query | show user-created tickets |
| All tickets | menu container click | nav action | filter mode reset or all-ticket filter | ticket collection query | show all tickets |
| Unassigned | menu container click | nav action | assigned/team filter values | ticket collection query | show unassigned tickets |
| Flagged | menu container click | nav action plus flagged-ticket lookup state | ticket collection query | show flagged tickets |
| Search icon | icon/container click | show or hide search action | keyword filter variable | search filter and ticket collection | expose keyword search and refresh results |
| Priority/Status filters | filter control change | filter variable update | priority/status filter variables | ticket collection query | narrow visible ticket collection |
| Ticket item | collection item click | selected record action | selected/current ticket variable | middle and right panels | refresh selected ticket details |
| Comment submit | action button click | set data list plus refresh action | comment fields and selected ticket reference | ticket activities list | create an activity/comment for the selected ticket |
| Collapse/expand icon | icon/container click | show/hide panel action | panel visibility variables | navigation/details panels | collapse or reopen workspace panels |

Use readable aliases in docs and generated plans. Do not expose tenant, workspace, package, upload, or record IDs.

## Generation Rules

- Build the workspace on an approval/form surface when the app needs form actions, variables, comments, selected-record state, or dynamic field controls.
- Do not represent a no-submit workspace as a normal request form.
- Do not add a fake Submit Request button when no request submission is intended.
- If the workflow is only Start to End, keep it minimal and document that the form is used as a workspace shell.
- Navigation menu items should be containers with icon and text controls, and active items should have click/form actions.
- Filter actions should set variables that are consumed by collection query/filter conditions.
- Collection items should set selected/current record state.
- Details and attributes panels should bind to the selected/current record.
- Comment or update controls should write to a related activity/update list only when the data mutation is safe and validated.
- Expand/collapse icons should be action-bearing containers or icon controls with bounded inline sizing.
- Avoid placeholder-only final panels and designer drop-zone text.
- For YAP smoke packages, prefer static designer-safe ticket cards and detail headings until collection/current-record controls are copied from a matching export-proven approval workspace. Do not claim dynamic selected-record behavior when the package uses static designer-safe placeholders.

## Validation Checklist

Apply these checks only when the app/page declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or an equivalent operational inbox pattern:

- A form workspace surface exists.
- The shell has side-by-side panel mechanics and does not stack panels vertically.
- The shell has explicit runtime layout properties: placement, row direction, gap, full-height column behavior, and bounded overflow.
- The implementation is not default-container-only.
- Left navigation, ticket/list collection, selected workspace, and right attributes/detail regions are identifiable.
- Left navigation, ticket collection, selected workspace, and right attributes columns have explicit width behavior.
- Panel body regions have explicit scroll/overflow behavior.
- Navigation menu items use horizontal icon/text layout.
- Ticket collection item templates use stable row/card layout.
- Navigation menu containers have action bindings.
- Filter variables or set-variable actions exist.
- Collection/query filtering is detectable.
- Collection item click actions set selected/current record state.
- Details panels contain dynamic selected-record bindings.
- Icon controls used for collapse/action behavior are inline, bounded, and action-bearing.
- Icon, Text/heading, Button, and Dynamic field controls use inline width behavior.
- Icons match nearby text size and use contextual symbols rather than generic placeholders.
- Text and field controls do not have obvious vertical-text or 0px/narrow-width risk.
- Each multi-column workspace column has its own Scroll or Auto overflow; the shell has Hidden overflow when it bounds the page.
- The form does not contain a fake request-submit button.
- The workflow is not misrepresented as real approval routing when it is only Start to End.
- No final panel is placeholder-only.
- YAP child-list sample rows are keyed by row ID and all row fields resolve to `Defs[].FieldName`.
- Generated YAP workspace packages have complete final-package `Resource.ReplaceIds` coverage for generated local app/list/field/layout/form/process/workflow/sample IDs.
- Service Desk YAP field numbering follows the v8-proven `Title` plus `Text2...` pattern rather than generated `Text1` or `Lookup1` drift.
- YAP approval form controls avoid generated `collection` / `dynamic-field` shapes unless the exact shape is export-proven for this host.

## Relationship To The Three-Column Dashboard Standard

The three-column dashboard standard is layout-focused and uses dashboard Style 2 when `three_column_workspace_shell` is the root dashboard body container. The multi-column form workspace standard is behavior-focused and uses an approval/form surface for stateful operational consoles.

Common reusable mechanics:

- multi-column shell
- fixed/fill/fixed panel behavior
- scrollable panel bodies
- stable header/action areas
- icon plus text navigation rows
- list or collection panel
- selected record workspace
- right detail or attribute panel

Different responsibilities:

- Dashboards are best for reporting and monitoring.
- Form workspaces are best for action-driven state, comments, selected-record editing, field controls, and form actions.

## Runtime Risks

- API import success is not proof that stateful panel interactions work.
- API `Status = 0` with an action-log response is not proof that the async import completed; import can still fail later if child-list sample rows, field numbering, or designer form controls drift from export-proven shape.
- A visually correct shell can still fail if nav actions do not update filter variables.
- Selected-record panels can appear static if collection item actions do not set the expected variables.
- A package can import and publish but leave the approval form designer loading if generated form controls are not designer-load safe.
- Comment/update controls can mutate the wrong list if selected-ticket binding is not validated.
- Fake workflow routing can mislead users and should be avoided.
- Icon controls that render full-width or oversized can distort narrow panels.
