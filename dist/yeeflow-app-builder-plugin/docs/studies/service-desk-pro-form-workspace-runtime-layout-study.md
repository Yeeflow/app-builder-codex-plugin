# Service Desk Pro Form Workspace Runtime Layout Study

## Purpose

This study restarts the Service Desk Pro form workspace learning after the first generated smoke package rendered as narrow, vertically squeezed text columns. The earlier study captured the application concept and action/state model, but it did not extract enough Yeeflow container and control layout properties to reproduce the real runtime layout.

No app was regenerated in this study step. The goal is to update standards, templates, validators, and tests so a future runtime smoke package must prove the actual layout mechanics before signing or install.

## Reference Inputs Inspected

- `Service Desk Pro (1).yap`
- `Service Desk Pro-v1 - Init.yapk`
- User-provided runtime/design observation of the broken smoke package
- Prior three-column root-shell and Service Desk Pro study artifacts

Raw packages, decoded payloads, screenshots, tenant/workspace identifiers, upload identifiers, private URLs, raw API responses, `Resource`, and `Sign` values are not committed.

## Why The First Service Desk Study Was Insufficient

The first study correctly identified the workspace as a stateful approval/form surface with:

- left HELP DESK navigation
- ticket collection/list panel
- selected-ticket conversation/detail workspace
- right details/attributes panel
- form variables and actions for filters
- collection item selected-record behavior
- dynamic detail fields and comment/update controls

It missed the runtime implementation details that make the layout usable:

- absolute/root shell placement
- row direction and zero shell gap
- fixed column widths
- full-height column behavior
- scrollable body regions
- `flex: 1 1 0` style fill behavior
- horizontal icon/text menu rows
- bounded inline icon sizing
- row/card ticket item layout
- detail field row layout and long-field wrapping rules

Without those properties, a generated package can contain all four semantic panels while still rendering as collapsed one-character text columns.

## Broken Smoke Failure Analysis

| Broken symptom | Likely missing property | Real Service Desk Pro property | Required generation rule |
|---|---|---|---|
| Columns squeezed into vertical text | fixed/fill width behavior missing | left `400px`, list `500px`, right `420px`, selected workspace fills | every column must declare fixed or fill width behavior |
| Panels appear as generic containers | shell placement and row direction missing | shell has `common.pos = absolute`, `hor/ver = center`, `style.direction = row`, `gap = 0` | shell must be a positioned row container |
| Text wraps one character per line | text controls inside containers without safe width | text sits inside padded row/column containers with explicit panel width | text/field controls must not be placed in narrow auto-width containers |
| Menu items collapse | icon/text row layout missing | nav items use `direction = row`, `gap = 6`, `align_items = center`, padding | nav menu containers must use horizontal icon/text layout |
| Ticket item cards collapse | row/card item template missing | collection item uses row layout, padding, background, radius, selected-state display rule | collection item template must be action-bearing row/card container |
| Page scroll expands unexpectedly | body overflow missing | collection/detail bodies use `overflow = scroll`; shell/panels are bounded | panel bodies scroll inside the workspace |
| Icons distort panel layout | icon width/size not bounded | icons use inline widthtype and sizes around 13-18 | icon controls must be inline and bounded |

## Extracted Real Property Map Summary

The normalized sanitized property map is stored at:

`docs/studies/normalized/service-desk-pro-form-workspace/reference-property-map.normalized.json`

Key extracted rules:

- Workspace form page URL shape is requester/form style: outer `type = 1`, outer `pagetype = 1`, embedded `formdef.pagetype = 1`.
- Form page hides its internal header and uses zero container padding.
- Root children are a hidden helper list control and the visible workspace shell.
- The visible shell is an absolute centered row container with gap `0`.
- Left navigation panel is fixed width around `400px`, full height, scrollable, and grey-backed.
- Ticket collection panel is fixed width around `500px`, full height, and contains a scrollable body with `flex: 1 1 0`.
- Selected workspace region fills the remaining area and splits into selected content plus bottom comment/update bar.
- Selected content row contains a fill-width conversation panel and a fixed right attributes panel around `420px`.
- Right attributes panel has full height, left border, z-index, stable header, and scrollable body.
- Navigation menu items are horizontal containers with icon/user + heading, gap, padding, radius, and form actions.
- Ticket collection items are action-bearing row/card containers with selected-state display logic.
- Icon controls use inline width behavior and bounded sizes.

## Real Vs Broken Comparison

| Layout area | Real Service Desk Pro | Broken generated smoke | Required fix |
|---|---|---|---|
| Root form workspace shell | hidden helper list plus positioned row shell | generic root container with child containers | use helper/control pattern only when needed, then root visible shell with explicit placement |
| Four-column layout | fixed nav, fixed list, fill selected workspace, fixed right attributes | semantic containers without enough width behavior | require fixed/fill/fixed width model |
| Left nav panel | full-height scroll panel, grey background, stable header/footer | text squeezed into narrow column | set width, height, overflow, padding, menu row layout |
| Ticket collection panel | header/filter rows plus scrollable collection body | collection/text runs together | set width, header row, filter row, body flex/overflow, item card layout |
| Selected ticket panel | scrollable fill-width content region | selected content collapsed | use fill/grow width and scrollable body |
| Right details panel | fixed width, scroll body, field rows | detail text squeezed | fixed width plus row/column field containers |
| Menu item containers | icon/text rows with actions | generic text/icon placement | require row direction, align-items, gap, action binding |
| Ticket item containers | selected-state row/card action container | missing stable item layout | require collection item row/card template |
| Icon controls | inline widthtype with bounded size | oversized/block icons possible | fail non-inline or oversized icons |
| Comment controls | bottom row with margin-top auto and selected-record context | unproven/misplaced | keep bottom bar and report mutation proof boundary |

## Required Generation Rules

- Generate `multi_column_form_workspace_shell` only on an approval/form workspace surface when form actions, variables, comments, selected-record state, or dynamic fields are required.
- Do not add fake approval routing or a fake submit button.
- Preserve requester/form page URL rules: outer `type = 1`, outer `pagetype = 1`, embedded `formdef.pagetype = 1`.
- Use a positioned row shell with explicit gap and column mechanics.
- Use fixed widths for left navigation, ticket collection, and right attributes panels.
- Use fill/grow behavior for selected ticket conversation/content.
- Add scrollable body regions and bounded full-height panels.
- Configure menu items as horizontal icon/text action containers.
- Configure ticket item templates as row/card action containers that set selected-ticket state.
- Configure dynamic fields and comments inside containers with enough width.
- Use inline/bounded icons.
- Fail validation if the generated form uses only default generic containers.

## Validator Rules Added

The quality inspector now includes property-level checks scoped to generated pages/forms that claim the form workspace pattern:

- `FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING`
- `FORM_WORKSPACE_COLUMN_WIDTH_MISSING`
- `FORM_WORKSPACE_COLUMN_HEIGHT_MISSING`
- `FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING`
- `FORM_WORKSPACE_DIRECTION_INVALID`
- `FORM_WORKSPACE_ALIGN_ITEMS_MISSING`
- `FORM_WORKSPACE_JUSTIFY_CONTENT_MISSING`
- `FORM_WORKSPACE_ELEMENT_GAP_MISSING`
- `FORM_WORKSPACE_CONTROL_WIDTH_RISK`
- `FORM_WORKSPACE_VERTICAL_TEXT_RISK`
- `FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID`
- `FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID`
- `FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE`
- `FORM_WORKSPACE_ICON_SIZE_LAYOUT_RISK`
- `FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY`

These checks do not apply globally. They apply only when the template/pattern is declared or the runtime test asks to validate `multi_column_form_workspace_shell`.

## Next Runtime Test Plan

After this branch is validated, run a new focused generation test:

```text
Generate Service Desk Form Workspace Smoke v2 using multi_column_form_workspace_shell.
Hard gate: zero FORM_WORKSPACE_* errors, including layout-property checks, before signing or install.
Use the Service Desk Pro reference-property map for root shell, panel widths, heights, overflow, menu rows, ticket item rows, inline icons, and selected-record/action bindings.
Do not use default-container-only layout.
Ask before install.
```

Manual runtime verification should confirm:

- the approval/form page contains the custom workspace content
- four workspace regions render side by side
- menu item text is horizontal and readable
- ticket items render as readable cards/list rows
- selected-ticket and right details panels have usable width
- panel body regions scroll inside the workspace
