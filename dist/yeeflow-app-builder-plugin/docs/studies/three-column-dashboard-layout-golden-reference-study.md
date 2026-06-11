# Three-Column Dashboard Layout Golden Reference Study

## Scope

This study inspected the uploaded reference packages without committing either raw package:

- `/Users/Renger/Downloads/Dashboard Layout Golden Reference.yap`
- `/Users/Renger/Downloads/Dashboard Layout Golden Reference.yapk`

The goal was to extract a reusable optional Yeeflow layout pattern for dashboard and approval-form generation. The raw `Resource`, `Sign`, decoded payloads, tenant/workspace/private IDs, and package files were not persisted in this repository.

## Package Type Comparison

| Area | `.yap` result | `.yapk` result |
|---|---|---|
| Wrapper | YAP-style wrapper with `Title`, `Description`, `IconUrl`, `IsListSet`, `Resource` | YAPK `AppExportPackageInfo` wrapper with package metadata, `Resource`, and `Sign` |
| Resource encoding | `[______gizp______]` gzip/base64 | Base64 Brotli payload; current inspector decodes through tolerant Brotli path |
| Decoded package model | `MainListType`, `AppID`, `ReplaceIds`, `ReportIds`, `FormKeys`, serialized `Data`, `SimplePortal: null` | `ListSet`, `Pages`, `Forms`, `FormReports`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, `Components`, `PortalInfo`, `Childs` |
| Child data lists | 0 | 0 |
| Dashboard pages | None found in `Data.Item.Layouts`; the layout content appears in the approval form DefResource | 1 Type `103` page named `Home` |
| Approval forms | 1 form named `Home-Approval` | 1 deployed form named `Home-Approval` |
| Form reports | `FormReports: []`, `FormNewReports: []` | `FormReports: []`, `FormNewReports: []` |
| Portal behavior | `SimplePortal: null`; `Data.PortalInfo` present in serialized data | `PortalInfo: null` |
| YAP/YAPK child field shape | No child lists to compare | No child lists; therefore no `Childs[].Fields` sample in this reference |

The `.yapk` passed the repository's redacted `scripts/inspect-yapk-schema-standard.mjs` check with no errors or warnings. The direct canonical schema validator path was not used for the final assertion because this package requires the tolerant Brotli decode path already implemented by the schema-standard inspector.

## Dashboard Page Structure

The `.yapk` dashboard page is a current dashboard page:

- page `Type = 103`
- `LayoutView = null`
- `Ext2` contains the current-dashboard `src` marker
- `LayoutInResources[0].ID` and `RefId` match the page layout ID
- embedded page resource keys: `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts`

The embedded page contains one main container with three sibling panel containers:

- left context panel
- main content panel
- right detail panel

Each panel contains:

- header/action area
- body/drop-zone area
- bottom/supporting area

Observed control types include `container`, `heading`, `icon`, and `action_button`. The page uses native Heading/Text-style controls; it does not use ad hoc generated `type: "text"` controls.

## Approval Form/Page Structure

The approval form is deployed and contains one page URL in the reference:

- outer `pageurls[].type = 1`
- outer `pageurls[].pagetype = 1`
- embedded `pageurls[].formdef.pagetype = 1`

The embedded `formdef` contains the same visible three-column container tree as the dashboard page. The approval reference does not include a workflow task/reviewer page. Therefore, task-page rules remain generation constraints, not reference-observed task-page evidence.

If this pattern is generated for a task page, keep the established hard gate:

- outer `pageurls[].type = 2`
- outer `pageurls[].pagetype = 1`
- embedded `pageurls[].formdef.pagetype = 2`

## Three-Column Layout Anatomy

The reusable pattern is:

```text
three_column_workspace_layout
├─ left_context_panel
│  ├─ header/action area
│  ├─ scrollable body area
│  └─ left_panel_bottom
├─ main_content_panel
│  ├─ page_header_action_area
│  ├─ scrollable main work area
│  └─ main_panel_bottom
└─ right_detail_panel
   ├─ detail header/action area
   ├─ detail_information_panel
   └─ right_panel_bottom
```

The reference uses neutral panel containers with borders/radius/shadow, small gaps between panels, padded header/body/bottom areas, body overflow scroll, and header/footer separator borders. The visual intent is an inbox/workbench shell similar to Gmail or Outlook.

## Dashboard Vs Approval Form Comparison

| Area | Dashboard page shape | Approval form/page shape | Reusable rule |
|---|---|---|---|
| Resource wrapper | Type `103` page with inline `LayoutInResources[0].Resource` | `DefResource.pageurls[].formdef` object | Keep host wrapper rules separate from the shared layout tree |
| Page/form type | Dashboard page `Type = 103` | Requester page `type = 1`, outer `pagetype = 1`, embedded `formdef.pagetype = 1` | Use the same shell only when the host supports the selected controls |
| Root resource keys | `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts` | `children`, `attrs`, `pagetype`, `ver`, `name`, `title`, `exts` | Preserve export-like wrapper keys for each host |
| Main container | One top-level workspace container | Same | Main workspace container owns the panel row |
| Columns | Three sibling panel containers | Same | Left context, main content, right detail |
| Bottom regions | Present under all three panels | Same | Use bottom regions only for real supporting content in generated apps |
| Header/action areas | Icons, Heading, Button/action containers | Same | Headers/actions must have meaningful labels and valid action bindings |
| Body content | Designer drop-zone Heading placeholders | Same | Replace placeholders with real business controls in generated final apps |
| Runtime-sensitive settings | Dashboard shell and `LayoutInResources` IDs matter | Approval `pageurls` and embedded `formdef.pagetype` matter | Validate host-specific hard gates before handoff |

## Reusable Generation Rules

- Treat `three_column_workspace_shell` as optional planning/template guidance.
- Consider it for inbox-style work management, review queues, triage, service desk, CRM account workspace, renewal review, task center, or list-detail-detail experiences.
- Do not use it for simple forms, simple dashboards, or mobile-first minimal pages.
- Keep the dashboard full-page wrapper and `Main > Content` dashboard rules.
- Keep approval task URL rules correct when adapting the pattern to task pages.
- Use native controls and data-bound components.
- Generated final panels must contain meaningful business content, not designer drop-zone placeholders.
- Prefer Data table, Collection, Kanban, Timeline, Dynamic field, Heading/Text, Button, Icon, and container controls inside panels.

## Template Recommendation

The template library can support this as a page-level shell template because existing entries already include section/page composition guidance and conformance rules. This study adds `three_column_workspace_shell` as an optional template entry.

The template should be referenced in a composition checklist when a generated page intentionally uses this workspace pattern. It should not be required for every generated dashboard or form.

## Validator Recommendation

The existing generated app quality inspector now recognizes two optional layout rules:

- `three_column_workspace_shell`
- `meaningful_panel_content`

These are enforced only when a checklist/template declares the pattern. The checks are intentionally structural and quality-oriented rather than tenant/runtime-specific.

## Runtime Risks

- The reference uses placeholder drop-zone text in each panel body; generated apps must not hand off placeholder-only panels.
- Current dashboard wrapper mistakes can still produce blank dashboards.
- Approval task page URL shape can break workflow task rendering/publish readiness if outer and embedded `pagetype` values are confused.
- The reference does not prove mobile responsive behavior.
- The reference does not prove list-detail selection interaction, row-click behavior, or right-panel dynamic refresh; those need a focused runtime generation test.

## What Was Added

- `docs/standards/three-column-workspace-layout-standard.md`
- `docs/studies/three-column-dashboard-layout-golden-reference-study.md`
- Template-library entry `three_column_workspace_shell`
- Optional inspector layout checks for the declared pattern
- Focused template conformance tests for the pattern
- Skill guidance so planning/generation can consider the pattern without making it mandatory

## What Was Intentionally Not Changed

- No raw `.yap` or `.yapk` reference package was committed.
- No generated runtime app/package was created.
- No live install, upgrade, upload, or API calls were run.
- No tags or stable-release metadata were updated.
- No Research repo or Research plugin files were touched.
- No global rule makes the three-column layout mandatory.

## Next Runtime Test Plan

After this study branch, run a small generated YAPK runtime test:

```text
Generate a sample Service Desk Inbox app using the three-column workspace layout:
left panel = ticket queues
main panel = ticket list/work area
right panel = selected ticket details/actions
```

Local validation should run first. Only after explicit approval should the package be installed and manually verified for visible three-column rendering, useful panel content, dashboard wrapper correctness, task-page correctness if approvals are included, and list/detail interaction behavior.
