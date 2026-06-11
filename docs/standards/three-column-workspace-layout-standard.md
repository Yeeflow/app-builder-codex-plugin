# Three-Column Workspace Layout Standard

## Purpose

The `three_column_workspace_layout` pattern is an optional Yeeflow page design for dense business workspaces that need an inbox-style left context panel, central work area, and right detail/action panel. It is based on the `Dashboard Layout Golden Reference` export study and is intended for planning and generation guidance, not as a mandatory global layout.

Use this standard when an app needs a Gmail/Outlook-style work management surface: triage queues, service desk inboxes, CRM account workspaces, renewal reviews, approval review centers, task centers, or list-detail-detail experiences.

## When To Use

- The user needs to scan a queue or list and inspect details without leaving the page.
- Left navigation, filters, or contextual summary should remain visible while work happens in the middle.
- A right-side detail panel should show selected item context, actions, SLA/risk information, or notes.
- The page is operational and repeated-use, not a simple single-submit form.
- The generated app can fill each panel with meaningful data-bound controls or business content.

## When Not To Use

- Simple forms, single-purpose dashboards, lightweight request pages, or mobile-first minimal pages.
- Pages where all three panels would be empty placeholders.
- Executive overview dashboards that are better served by KPI rows, charts, and table sections.
- Approval forms where a single-column requester or reviewer experience is clearer.

## Layout Anatomy

Use these semantic names in app plans, composition checklists, and generated Navigator labels where possible:

- `three_column_workspace_layout`
- `left_context_panel`
- `main_content_panel`
- `right_detail_panel`
- `left_panel_bottom`
- `main_panel_bottom`
- `right_panel_bottom`
- `page_header_action_area`
- `detail_information_panel`

The reference app uses a root page/form wrapper with one top-level `container`. That main container contains three sibling panel containers. Each panel contains three regions:

- header/action area
- scrollable body/content area
- bottom/supporting region

The reference body regions contain designer drop-zone text, but generated final apps must replace those placeholders with useful controls, fields, tables, cards, or guidance.

## Runtime Implementation Rules

The golden reference is a container-layout pattern, not just a semantic grouping pattern. A generated page must not claim `three_column_workspace_shell` conformance merely because it contains three labeled sections. The shell must be configured so Yeeflow renders left, main, and right panels side by side at runtime.

The reference package and exported `Dashboard-Home.html` show this implementation model:

- The visible shell is a top-level `container` under the page/form content root.
- The shell uses `attrs.common.pos = [null, "absolute"]` with centered horizontal/vertical placement in the reference.
- The shell uses `attrs.style.direction = [null, "row"]` and a gap token such as `--sp--s100`; the runtime HTML maps this to a flex row with a gap.
- The shell has exactly three direct panel container children for the desktop workspace.
- The left panel uses fixed width behavior: `attrs.style.widthtype = [null, "3", null, "1"]`, `attrs.style.width = [null, 360]`.
- The main panel uses fill/remaining width behavior: `attrs.style.widthtype = [null, "0"]`. The observed `width = 300` is not the layout driver; `widthtype = 0` is what prevents the main panel from becoming a fixed narrow column or stacking below the left panel.
- The right panel uses fixed width behavior: `attrs.style.widthtype = [null, "3", null, "1"]`, `attrs.style.width = [null, 480]`.
- Every panel uses full-height bounded behavior: `attrs.style.height = [null, "2"]`, `attrs.style.cushei = [null, 100]`, `attrs.style.cusheiu = [null, "%"]`, `attrs.style.justify_content = [null, "flex-start"]`, `attrs.style.overflow = [null, "hidden"]`.
- Each panel body uses `attrs.style.overflow = [null, "scroll"]`, full-height behavior, and inner padding, so body content scrolls inside the panel instead of expanding the shell vertically.
- Header containers use sticky/top behavior: `attrs.common.pos = [null, "sticky"]`, `attrs.common.sticky.to = [null, "1"]`, `attrs.common.zidx = [null, 2]`, row direction, center alignment, `justify_content = "space-between"`, and a bottom border separator.
- Bottom/support containers use row direction, center alignment, padding, background, and a top border separator.
- Panel backgrounds, radius, borders, and shadows are part of the bounded workspace feel, but the layout-critical properties are row direction, direct sibling panel hierarchy, fixed/fill/fixed widths, full height, and overflow.

Generated-final requirements:

- Do not emit a claimed three-column shell if the shell lacks row/flex direction or equivalent position-based side-by-side mechanics.
- Do not rely on visual order alone. Left, main, and right panels must be siblings under the same shell container.
- Do not let the main panel flow below the left panel. Use the reference fill-width behavior or another validated side-by-side mechanism.
- Do not let the right panel flow below the main panel. Use explicit fixed width or validated side-by-side positioning.
- Do not leave panel bodies as default overflow. Use scroll/auto body overflow and hidden outer panel overflow when generating an inbox-style workspace.
- Do not use unsupported or invented width styles that create 0px runtime risk.
- Do not show `Drag to add controls here` in generated-final packages.
- If the generator cannot reproduce these mechanics, it must not claim `three_column_workspace_shell`; choose a simpler dashboard section or two-column list/detail pattern instead.

## Dashboard Layout Styles

Yeeflow App Builder now treats dashboard pages as having two valid root layout styles.

### Style 1: Standard Dashboard Content Layout

Use Style 1 for normal dashboard pages: KPI dashboards, overview dashboards, report dashboards, mixed card/table dashboards, and most generated dashboard pages.

Structure:

```text
dashboard_page_wrapper
└─ Main
   └─ Content
      └─ sections/cards/tables
```

Rules:

- `Main > Content` is required.
- Page content width should be Full Width when the dashboard needs full-width content.
- Page padding should be `0` for full-width dashboards; visible spacing belongs inside `Content` sections.
- Existing Type `103`, `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and dashboard wrapper/materialization rules still apply.

### Style 2: Three-Column Workspace Shell Layout

Use Style 2 for inbox-style, Gmail-style, Outlook-style, list-detail-detail workspaces where the shell itself owns the full-page layout.

Structure:

```text
dashboard_page_wrapper
└─ three_column_workspace_shell
   ├─ left_context_panel
   ├─ main_content_panel
   └─ right_detail_panel
```

Rules:

- Do not nest `three_column_workspace_shell` inside default `Main > Content` wrappers.
- `three_column_workspace_shell` must be the root page body layout container.
- The dashboard page must set content width to Full Width.
- The dashboard page must set page padding to `0`.
- The shell controls full available width, full available height, row layout, panel sizing, panel overflow, scrollable body regions, and sticky/stable headers.
- If `three_column_workspace_shell` is nested inside `Main > Content`, the runtime may render blank or incorrectly because the parent containers use default height/positioning and prevent the shell from occupying the page.

This distinction does not invalidate the normal `Main > Content` rule. `Main > Content` remains required for Style 1 dashboards. Style 2 is a separate root-layout rule for three-column workspace pages only.

## Property Checklist

When generating or validating `three_column_workspace_shell`, check these properties on the actual control tree:

| Area | Required properties |
|---|---|
| Shell | `position`/`common.pos`, top/right/bottom/left or equivalent full-page offsets, row direction, gap, background, padding |
| Shell children | exactly three direct panel containers for desktop layout |
| Left panel | explicit fixed width, full height, `overflow = hidden`, bounded background/border/radius/shadow |
| Main panel | fill/remaining width behavior, full height, `overflow = hidden`, bounded background/border/radius/shadow |
| Right panel | explicit fixed width, full height, `overflow = hidden`, bounded background/border/radius/shadow |
| Headers | sticky/top behavior, z-index, row direction, center alignment, `justify_content = space-between`, min height, separator border |
| Bodies | full-height/fill behavior, `overflow = scroll` or `auto`, inner padding, meaningful business controls |
| Bottom regions | row direction, padding, top border separator, meaningful supporting content when present |
| Actions/icons | icon/action containers have explicit small widths/heights and center alignment; active actions have valid bindings |
| Responsive behavior | reference contains mobile/tablet display conditions; generated apps must document mobile behavior as runtime-sensitive unless separately tested |

## Dashboard Implementation Notes

For dashboard pages:

- Keep the dashboard host as a Type `103` page/layout.
- Preserve current dashboard wrapper rules: `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources[]` that points to the embedded page resource when inline content exists.
- The embedded page resource should keep the export-like wrapper keys: `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, and `exts`.
- For normal Style 1 dashboards, keep the standard `Main > Content` composition.
- For `three_column_workspace_shell`, use Style 2: place the shell as the root page body layout container, not under `Main > Content`.
- Set dashboard content width to Full Width and page padding to `0` for Style 2 pages.
- Use native Heading/Text, Data table, Collection, Kanban, Timeline, Dynamic field, Button, Icon, and container controls. Do not use ad hoc `type: "text"` controls.
- Icon controls inside the shell should use inline width behavior, like Text and Button controls. Choose icon size intentionally for the panel/header context; large/default icon sizing can distort narrow panel layout.
- Text/heading, Button, and Dynamic field controls should also default to inline width behavior in generated workspace shells. Other controls still need explicit width behavior appropriate to their container.
- For 3-column, 4-column, or other multi-column workspace layouts, each visible column should have its own vertical scroll behavior. The outer shell should be bounded with hidden overflow when it owns the full-page layout; panel bodies should use Scroll or Auto instead of relying on Default overflow.

## Approval Form/Page Implementation Notes

For approval forms:

- The reference approval form uses the same container tree as the dashboard but is hosted inside `DefResource.pageurls[].formdef`.
- The studied reference includes a requester/submit page: outer `pageurls[].type = 1`, outer `pageurls[].pagetype = 1`, embedded `formdef.pagetype = 1`.
- If this pattern is adapted to a workflow task/reviewer page, keep the task URL shape correct:
  - outer `pageurls[].type = 2`
  - outer `pageurls[].pagetype = 1`
  - embedded `pageurls[].formdef.pagetype = 2`
- Do not reintroduce the invalid task page shape where the outer page URL uses `pagetype = 2`.
- Avoid unsupported controls on approval forms. For example, Pivot Table belongs on dashboards, not approval forms.

## Recommended Container Hierarchy

```text
dashboard_page_wrapper_or_form_content_root
└─ three_column_workspace_shell
   ├─ left_context_panel
   │  ├─ left_header_action_area
   │  ├─ left_panel_body
   │  └─ left_panel_bottom
   ├─ main_content_panel
   │  ├─ page_header_action_area
   │  ├─ main_work_area
   │  └─ main_panel_bottom
   └─ right_detail_panel
      ├─ detail_header_action_area
      ├─ detail_information_panel
      └─ right_panel_bottom
```

Recommended generated content:

- Left panel: queue groups, filters, navigation shortcuts, app context, counts, or ownership summaries.
- Main panel: primary Data table, Collection, Kanban, request fields, selected queue work area, or review checklist.
- Right panel: selected item detail, status/SLA/risk, actions, notes, activity history, or decision context.
- Bottom regions: supporting notes, totals, recent activity, selected queue metadata, secondary actions, or help content. Omit a bottom region when it would be empty.

## Spacing And Style Guidance

The reference uses:

- root/page padding plus an inner main container gap
- fixed-width side panel intent with a wider central work area in generated designs
- panel containers with neutral borders, soft shadow/radius, white background, and hidden outer overflow
- header/footer regions with horizontal padding and a bottom/top border separator
- body regions with larger padding, vertical gap, and scroll overflow

For generated apps:

- Use safe desktop padding, typically 24px to 32px where supported.
- Use a clear gap between panels.
- Make the main panel the dominant work area. If width settings are explicit, the middle panel should be visually largest or should flex to fill remaining space.
- Avoid invented unsupported width/style fields. Prefer export-proven style attributes and validate dashboard wrapper rules.
- Ensure panel text and controls do not overlap at smaller widths. If mobile behavior is not proven, document it as runtime-sensitive and prefer a simpler responsive stack or a different pattern.

## Header And Action Guidance

- The main panel header should include the page/workspace title and primary actions.
- The left panel header should identify the app/context and may include a compact navigation/action icon.
- The right panel header should identify the selected detail context and may include overflow or detail actions.
- Active buttons must have valid action bindings. Placeholder buttons are generated-final failures.
- Icon-only actions must have meaningful Navigator labels and business purpose.
- Icon controls should use inline width behavior unless a full-width icon block is explicitly intended and validated.
- Text/heading, Button, and Dynamic field controls should use inline width behavior by default in generated workspace pages.
- In narrow panels, icon size must not force wrapping, overflow, or header distortion.
- Icon size should match the nearby text or control rhythm. For menu/action rows with 16px text, use a 16px bounded icon instead of a large default icon.

## Runtime Risks

- Empty drop-zone headings from a designer reference are not acceptable generated-final content.
- Dashboard pages can render blank if the embedded page resource wrapper is incomplete or placed outside the expected dashboard shell.
- Three-column dashboards can render blank or incorrectly if `three_column_workspace_shell` is nested under default `Main > Content` containers with default height/positioning.
- Data tables can fail at runtime if display columns omit source `Field` bindings.
- Approval task pages can fail publish/import if task URL page shapes are incorrect.
- Mobile behavior is not runtime-proven by this reference and should be tested separately.
- A YAPK wrapper can validate while runtime rendering still needs manual proof.

## Validation Checklist

When a generated page declares `three_column_workspace_shell` or `three_column_workspace_layout`:

- The page/form contains one main workspace container with three sibling panel containers.
- For dashboard Style 2, `three_column_workspace_shell` is the root page body layout container and is not nested under `Main > Content`.
- The dashboard page sets content width to Full Width and page padding to `0`.
- The panels can be identified as left context, main content, and right detail/action regions.
- Each used panel contains header and body regions; bottom regions are present only when meaningful.
- The main panel is the primary work area and is not visually subordinate.
- No final panel is placeholder-only.
- Dashboard wrappers still satisfy current Type `103` page rules.
- Approval task pages keep outer task page URL `pagetype = 1` and embedded task formdef `pagetype = 2`.
- Native Text/Heading controls are used instead of ad hoc text shapes.
- Icon controls inside the workspace use inline width and intentionally bounded sizes.
- Data-bound controls resolve their lists, fields, filter variables, actions, and display columns.

## Relationship To Existing Dashboard Standards

This standard extends the existing dashboard standards with a page-level workspace composition. It does not replace KPI row, summary card, alert, table, Kanban, Collection, timeline, filter, or dashboard shell rules. Use those section templates inside the three-column panels when they fit the business process.

## Relationship To Approval Form/Page Rules

This standard can guide requester and reviewer form layout, but it does not change approval workflow generation rules. Workflow task URL hard gates, publish-readiness checks, variable reference checks, form action bindings, and supported-control host rules remain authoritative.

## Relationship To Multi-Column Form Workspaces

Service Desk Pro proves a related but distinct pattern: `multi_column_form_workspace_shell`. That real-case app is an approval/form workspace, not a dashboard. It uses the form surface for variables, form actions, comments, selected-record behavior, dynamic field controls, and action-driven filtering. Its visible layout is closer to a four-column service desk console: left help desk navigation, ticket collection/list, selected ticket conversation/detail workspace, and right ticket attributes panel.

Use this three-column standard for dashboard Style 2 workspaces where the main goal is a side-by-side dashboard/list-detail-detail layout. Use `docs/standards/multi-column-form-workspace-standard.md` when the app needs form actions, variable-driven filters, collection item click actions, selected-record state, comment/update controls, or dynamic form fields. Do not force `Main > Content` dashboard rules onto the form workspace pattern, and do not add fake workflow routing just to get a stateful form surface.
