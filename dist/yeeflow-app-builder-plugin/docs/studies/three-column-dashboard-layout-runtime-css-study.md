# Three-Column Dashboard Layout Runtime CSS Study

## Scope

This corrected study re-inspected the golden reference from the runtime/layout perspective:

- `/Users/Renger/Downloads/Dashboard Layout Golden Reference.yap`
- `/Users/Renger/Downloads/Dashboard Layout Golden Reference.yapk`
- `/Users/Renger/Downloads/Dashboard-Home.html`

The raw uploaded `.yap`, `.yapk`, and `.html` files were not committed. Findings below are sanitized structural findings only. Raw `Resource`, `Sign`, decoded payloads, tenant/workspace/upload/private identifiers, private URLs, screenshots, and raw API responses were not persisted in the repository.

The optional live runtime URL was not used as source evidence in this branch because the exported HTML already contains the runtime DOM/CSS evidence needed for the layout study, and live browser access would require an authenticated tenant context. No live API calls were run.

## Why The First Study Was Insufficient

The first study correctly identified the conceptual three-panel layout, but it treated `three_column_workspace_shell` mostly as semantic structure:

- left context panel
- main content panel
- right detail panel
- header/body/bottom regions
- no placeholder-only final panels

That was not enough. The first Service Desk Inbox runtime generation test placed meaningful content into three groups, but the generated dashboard rendered vertically/sequentially rather than as a real three-column workspace. API install success only proved package acceptance; it did not prove browser layout.

The missing learning was the Yeeflow container mechanics that make the layout render side by side.

## Package Structure Findings

Both reference packages contain the same visible layout tree for the Dashboard page and the requester-style approval page.

The `.yap` package is a YAP wrapper with gzip/base64 `Resource`, serialized `Data`, one Type `103` dashboard layout, one deployed approval form, no child lists, and `PortalInfo`/`SimplePortal` empty/null behavior.

The `.yapk` package is an `AppExportPackageInfo` wrapper with Brotli/base64 `Resource`, current `AppPackageInfo` shape, one Type `103` Dashboard page, one deployed form, `FormReports: []`, `FormNewReports: []`, `PortalInfo: null`, and no `Childs`.

The YAPK nested dashboard/form resources use current encoded resource behavior where some nested values may be `base64("::brotli::" + Brotli(JSON))`, not only plain JSON strings.

## Runtime HTML Findings

The exported `Dashboard-Home.html` contains:

- one occurrence each of `App name`, `Main content page`, `Detail information panel`, and each bottom-panel label
- three occurrences of designer placeholder text `Drag to add controls here`
- runtime class families such as `ak-form`, `comp-wrapper`, `akc_container`, `form-container`, `akc_heading`, `akc_icon`, and generated `ak-dynamic-*` CSS classes
- CSS rules generated from Yeeflow container attrs rather than extensive inline styles

Key runtime CSS evidence from the exported HTML:

- page/root area: `height:100%`, `flex:1 0 auto`, zero padding in the page container
- shell: `position:absolute`, `left:0`, `right:0`, `top:0`, `bottom:0`, padding from `--sp--s075`
- shell layout: `display:flex`, `flex-direction:row`, gap from `--sp--s100`
- left panel: `display:flex`, `flex-direction:column`, `overflow:hidden`, `width:360px`, `max-width:100%`, `height:100%`
- main panel: `display:flex`, `flex-direction:column`, `overflow:hidden`, `height:100%` with fill-width behavior from package `widthtype = 0`
- right panel: `display:flex`, `flex-direction:column`, `overflow:hidden`, `width:480px`, `max-width:100%`, `height:100%`
- panel headers: `position:sticky`, `top:0`, `z-index:2`, row flex, center alignment, `justify-content:space-between`, min height around `52px`
- panel bodies: column flex, `overflow:scroll`, `height:100%`, padded content
- bottom regions: row flex, center alignment, top border separator, padded content

## Golden Reference Layout Anatomy

### Page And Root

Dashboard host:

- Type `103`
- `LayoutView = null`
- `Ext2 = "{\"src\":true}"`
- one `LayoutInResources[]` entry with the embedded page resource
- embedded resource has `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, and `exts`

Approval requester host:

- one `pageurls[]` requester page
- outer `type = 1`
- outer `pagetype = 1`
- embedded `formdef.pagetype = 1`

Workflow task rules remain separate and unchanged:

- task page outer `pageurls[].type = 2`
- task page outer `pageurls[].pagetype = 1`
- embedded task `pageurls[].formdef.pagetype = 2`

### Main Workspace Shell

The shell is the first visible container under the page/form resource:

- `attrs.common.pos = [null, "absolute"]`
- horizontal and vertical placement are centered in the reference
- `attrs.common.padding` uses `--sp--s075`
- `attrs.common.background` uses a neutral-light hover token
- `attrs.style.direction = [null, "row"]`
- `attrs.style.gap = [null, "--sp--s100"]`
- exactly three direct child panel containers

This is the critical property that the first generated smoke package missed. Without row/flex mechanics or equivalent side-by-side positioning, Yeeflow can render the groups as sequential vertical content.

### Left Context Panel

Observed package properties:

- fixed width behavior: `widthtype = "3"`
- width around `360`
- full-height behavior: `height = "2"`, `cushei = 100`, `cusheiu = "%"`
- `justify_content = "flex-start"`
- `overflow = "hidden"`
- bounded panel styling: white translucent background, border/radius/shadow
- three children: header, scroll body, bottom region

Runtime CSS confirms `width:360px`, `height:100%`, `overflow:hidden`, and column flex.

### Main Content Panel

Observed package properties:

- fill/remaining width behavior: `widthtype = "0"`
- full-height behavior matching side panels
- `overflow = "hidden"`
- bounded panel styling
- three children: header/action area, scroll body, bottom region

Runtime CSS confirms column flex, `height:100%`, and hidden overflow. The package `widthtype = 0` is the important fill-width signal.

### Right Detail Panel

Observed package properties:

- fixed width behavior: `widthtype = "3"`
- width around `480`
- full-height behavior matching the left panel
- `overflow = "hidden"`
- left separator border plus bounded panel styling
- three children: header/action area, scroll body, bottom region

Runtime CSS confirms `width:480px`, `height:100%`, `overflow:hidden`, and column flex.

### Header And Action Areas

Panel headers use:

- sticky positioning
- `top = 0` behavior through sticky target
- `zidx = 2`
- row direction
- center alignment
- `justify_content = "space-between"`
- min height around `52`
- padding using `--sp--s100` / `--sp--s200`
- bottom border separator

Main and right headers include action/icon containers with small fixed widths/heights and center alignment. Active generated actions must have valid bindings; placeholder action containers are not enough in generated-final apps.

### Body And Bottom Regions

Body containers use:

- `height = "2"`
- `cushei = 100`
- `cusheiu = "%"`
- `overflow = "scroll"`
- padding around `--sp--s200`

Bottom containers use:

- row direction
- center alignment
- padding around `--sp--s100` / `--sp--s200`
- top border separator
- neutral background

The reference body text is designer placeholder text. Generated-final pages must replace it with useful business controls.

## Dashboard Vs Approval Form Comparison

| Area | Dashboard page | Approval requester page | Reusable rule |
|---|---|---|---|
| Host | Type `103` page resource | `DefResource.pageurls[].formdef` | Host wrappers differ, layout tree is shared |
| Shell | absolute, row-direction container | same | Do not generate three sequential sections |
| Left panel | fixed width, full height, hidden overflow | same | Side panels need explicit fixed width |
| Main panel | fill-width, full height, hidden overflow | same | Main must occupy remaining middle space |
| Right panel | fixed width, full height, hidden overflow | same | Right must be sibling, not below main |
| Headers | sticky row headers | same | Header/action areas stay visible in scrolling panels |
| Bodies | scrollable body containers | same | Content scrolls inside panels |
| Bottom regions | separator footer containers | same | Include only meaningful generated content |
| Runtime placeholders | present in reference | same | Forbidden in generated-final packages |

## Correct Generation Rules

- Use `three_column_workspace_shell` only when the generator can reproduce the shell mechanics.
- For dashboard pages, use Style 2 root layout: create `three_column_workspace_shell` as the root page body layout container.
- Do not nest `three_column_workspace_shell` inside default `Main > Content` wrappers.
- Set dashboard page content width to Full Width and page padding to `0`.
- Create one shell container with explicit side-by-side layout, preferably the export-proven absolute row shell.
- Add exactly three direct panel containers under the shell for desktop layout.
- Use fixed-width left/right panels and fill-width main panel.
- Use full-height panel behavior and hidden outer overflow.
- Use scrollable body regions inside every panel.
- Use sticky header/action regions inside panels.
- Replace every designer placeholder with meaningful business content.
- Use safe static/sample detail content when selected-record binding is not proven, but keep the layout mechanics correct.
- Do not claim conformance if the output only contains three semantic sections stacked vertically.
- Treat install/API success as package acceptance only; browser/runtime verification must confirm side-by-side panels.

## Runtime Test Feedback: Shell Must Be Root Layout Container

The first corrected Service Desk Inbox runtime smoke package installed successfully and the generated Navigator tree showed a recognizable `three_column_workspace_shell` with left, main, and right panel children. However, the dashboard still rendered incorrectly: panels were clipped/distorted, text wrapped aggressively in narrow header areas, and the page did not behave like the golden full-page reference.

The root cause was placement. The generated dashboard embedded `three_column_workspace_shell` under the ordinary `Main > Content` dashboard containers. Those `Main` and `Content` containers have default height and positioning in this generated shape, so the absolute/full-height shell could not occupy the full available dashboard page. This means the earlier rule was incomplete: `Main > Content` is correct for standard dashboard content pages, but it is not the correct host for the three-column workspace shell.

The corrected distinction is:

- Style 1, standard dashboard content layout: dashboard wrapper > `Main` > `Content` > sections/cards/tables.
- Style 2, three-column workspace shell layout: dashboard wrapper > `three_column_workspace_shell` > left/main/right panels.

For Style 2, the shell must be the root page body layout container. The page must use Full Width content and `0` page padding, and the shell itself must own full-width/full-height positioning, row layout, panel widths, hidden outer overflow, scrollable bodies, and sticky/stable headers.

The same runtime test also showed that Icon controls can distort panel headers when they keep large/default sizing or block/full-width behavior. Generated Icon controls inside this layout should use inline width behavior, and icon size must be intentionally selected for the surrounding header or action area. Narrow panels should not allow icons to force overflow, wrapping, or oversized header rows.

## Validator Changes

The generated app quality inspector now hardens `three_column_workspace_shell` checks when a checklist/template declares the pattern.

New or now-emitted error codes include:

- `THREE_COLUMN_SHELL_MISSING`
- `THREE_COLUMN_SHELL_NOT_ROOT`
- `THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT`
- `THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK`
- `THREE_COLUMN_PAGE_WIDTH_NOT_FULL`
- `THREE_COLUMN_PAGE_PADDING_NOT_ZERO`
- `THREE_COLUMN_ICON_WIDTH_NOT_INLINE`
- `THREE_COLUMN_ICON_SIZE_LAYOUT_RISK`
- `THREE_COLUMN_PANEL_MISSING`
- `THREE_COLUMN_PANEL_WIDTH_MISSING`
- `THREE_COLUMN_PANEL_POSITIONING_MISSING`
- `THREE_COLUMN_PANELS_STACKED_VERTICALLY`
- `THREE_COLUMN_OVERFLOW_MISSING`
- `THREE_COLUMN_PLACEHOLDER_PANEL`
- `THREE_COLUMN_RUNTIME_LAYOUT_RISK`

The validator remains optional. It applies when a page declares the three-column template or layout rule; it is not a global dashboard requirement.

## Template Behavior

The `three_column_workspace_shell` template now includes `three_column_reference_mechanics`, root page body placement, Full Width page content, zero page padding, and required layout properties for the shell, panels, headers, bodies, icons, and bottom regions. Template conformance can no longer pass on labels alone or on a shell nested inside `Main > Content`.

## Next Runtime Test Plan

Rerun the Service Desk Inbox smoke generation, but require the generated YAPK to pass `three_column_workspace_shell` property validation before signing or install.

Suggested prompt:

```text
Generate a YAPK-only Three Column Service Desk Inbox smoke app using three_column_workspace_shell.
Before signing or install, validate that the dashboard shell passes the three_column_workspace_shell property validator:
root page body shell placement, no Main > Content wrapper, Full Width page content, 0 page padding, left/right fixed-width panels, fill-width main panel, row shell, full-height panels, hidden outer overflow, scrollable bodies, sticky headers, inline/bounded icons, meaningful content, and no placeholder text.
Stop and repair locally if the validator reports THREE_COLUMN_* errors.
```
