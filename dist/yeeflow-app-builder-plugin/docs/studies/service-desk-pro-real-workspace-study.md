# Service Desk Pro Real Workspace Study

## Inputs Inspected

- `Service Desk Pro (1).yap`
- `Service Desk Pro-v1 - Init.yapk`

The raw packages were inspected as reference inputs only. Raw packages, raw decoded payloads, screenshots, private IDs, tenant/workspace IDs, upload IDs, raw `Resource`, raw `Sign`, and raw API responses are intentionally not committed.

## Package Comparison

| Area | YAP finding | YAPK finding | Reusable lesson |
|---|---|---|---|
| Wrapper | YAP wrapper with `Title`, `Description`, `IconUrl`, `IsListSet`, and gzip-prefixed `Resource`. | AppExportPackageInfo-style wrapper with `PackageId`, `Resource`, metadata, and `Sign`; decoded with tolerant Brotli. | YAP is the better source for legacy/form workspace page details; YAPK confirms modern package wrapper and app resources. |
| App model | Decodes to ListExportResult with `Data`, `FormKeys`, `ReplaceIds`, and `SimplePortal`. | Decodes to AppPackageInfo with `ListSet`, `Pages`, `Forms`, `FormNewReports`, `DataReports`, `PortalInfo`, and `Childs`. | Generated guidance must keep YAP and YAPK structures separate. |
| Lists | Root app plus 12 child resources. | Root ListSet plus 12 child resources and 91 fields. | The real app is a multi-list service desk application, not a single dashboard shell. |
| Main data | Support Tickets, Request Types, Ticket Categorise, Systems or Services, Service Categories, Configuration Items, Support Teams, Ticket Activities, SLA resources, Flagged tickets. | Same functional list family; YAPK exposes field names such as Ticket ID, Description, Type of Request, Category, Priority, Status, Assigned Team, Ticket Activities, and SLA fields. | Workspace generation needs ticket, activity, team, SLA, and flagged-ticket structures when reproducing this pattern. |
| Pages | Root dashboard/pages include Settings, Executive Dashboard, Drill-down Tickets List, and Help Guide. | Four page entries are present. | The real workspace is not one of the dashboard pages. |
| Forms | Four approval/form definitions are present; `SDP-WS` is the Workspace form. | Four form records exist, but exported form page payload is not exposed in the same rich shape as the YAP. | Use YAP form DefResource for layout/action learning; use YAPK for package/list/schema comparison. |
| Workspace form | `Workspace` form has one page URL with outer `type = 1`, outer `pagetype = 1`, embedded `formdef.pagetype = 1`. | Workspace record exists but pageurl detail is not available in the same decoded shape. | This is a form workspace/requester-style page, not a workflow task URL page. |
| Workflow | Workspace form has a simple Start-to-End shape. Other forms handle ticket submitted, SLA/mentioned users, and ticket updated behavior. | FormNewReports is empty in the inspected export. | Do not add fake approval routing when using a form surface as a workspace shell. |
| Controls | Workspace contains list/helper controls, 126 containers, 64 headings, 15 icons, 5 collections, 32 dynamic fields, search/radio filters, action buttons, rich text, identity picker, and file upload. | Data-list forms and dashboards expose corresponding control families. | The reusable pattern combines layout, collection, dynamic fields, comments, and actions. |

## Why This Is A Form Workspace, Not A Dashboard

The Service Desk Pro workspace visually behaves like an inbox console, but it is implemented as an approval/form workspace. That choice matters because the page depends on form capabilities that a dashboard alone does not safely provide:

- form actions that set variables
- page-load actions
- action-driven navigation filters
- collection item click actions
- selected/current ticket state
- dynamic fields bound to selected ticket data
- comment input and related activity creation
- hide/show panel actions
- mobile view switching variables

The workflow for the workspace itself is minimal. The form is used as a stateful workspace shell, not as a real approval process with a submit request button.

## Four-Column Layout Anatomy

The form page contains a helper `list` control and then a visible absolute positioned row shell. The visible workspace is organized as:

| Panel | Role | Extracted layout behavior | Reusable rule |
|---|---|---|---|
| Left navigation | HELP DESK menu, create ticket entry, inbox/menu items, teams, bottom CTA/help area. | Fixed width around 400px, full height, scroll overflow, icon + text rows. | Build as a fixed-width nav panel with action-bearing icon/text containers. |
| Ticket collection | All Tickets title, search, Priority/Status filters, ticket list, selected item state. | Fixed width around 500px, full height, filter/header region plus scrollable collection body with flex fill. | Build as a fixed-width collection panel; filters must feed query state. |
| Selected ticket workspace | Ticket title, description, tags, activity/conversation, comment area. | Fill workspace area, full height, selected-ticket dynamic content and comment controls. | Bind to selected/current record state; comments/updates require validated actions. |
| Right details/attributes | Ticket metadata, priority/status/team/assignee, attributes, edit actions. | Right-side detail/attribute region inside the selected workspace area. | Use dynamic fields and action controls bound to selected/current ticket. |

## Action-Driven Filtering And State

The Workspace form defines form actions for hide/show panels, comments, page load, navigation filters, flagged tickets, mobile view switches, and create-new-ticket behavior. Navigation items are not passive labels; they set variables and refresh the ticket collection.

| UI element | Trigger | Form action | Variables affected | Target control/query | Runtime behavior |
|---|---|---|---|---|---|
| Your inbox | menu click | Nav Your Inbox | current user and filter state | ticket collection | shows tickets relevant to current user |
| Mentioned you | menu click | Nav Mentioned You | mentioned/current user filters | ticket collection | shows tickets mentioning current user |
| Created by you | menu click | Nav Created by you | creator/current user filters | ticket collection | shows tickets created by current user |
| All tickets | menu click | Nav All tickets | filter mode/reset values | ticket collection | shows all tickets |
| Unassigned | menu click | Nav Unassigned | assignment filter values | ticket collection | shows unassigned tickets |
| Flagged | menu click | Nav Flagged Tickets plus flagged ticket lookup state | flagged item variables | ticket collection | shows flagged tickets |
| Search icon | icon/container click | Show/Hide Search Box | keyword filter variable | search control and collection | toggles keyword search |
| Ticket item | collection click | collection item action | selected/current ticket values | center and right panels | refreshes selected ticket details |
| Comment submit | action button click | Submit New Comment | comment input and selected ticket reference | Ticket Activities | creates activity/comment and refreshes panel |
| Collapse icons | icon/container click | Hide Navigation Panel / Hide Details Panel | panel visibility variables | visible shell | collapses or restores panels |

## Comparison With Three-Column Golden Reference

| Feature | 3-column golden reference | Service Desk Pro real case | Common reusable feature |
|---|---|---|---|
| Host | Dashboard page and requester-style form reference. | Approval/form workspace page. | Multi-column workspace shell. |
| Primary lesson | Runtime-safe side-by-side layout mechanics. | Stateful form actions, variables, filters, selected record, comments. | Layout must be paired with meaningful business behavior. |
| Columns | Left context, main content, right detail. | Left nav, ticket collection, selected ticket workspace, right details. | Fixed/fill/fixed panel mechanics and scrollable bodies. |
| Data behavior | Conceptual list/detail content. | Real collection filters and selected-record binding. | Collection/list plus detail panel composition. |
| Actions | Header/action areas and icon/button controls. | Navigation, filter, selected ticket, comment, flag, collapse, mobile actions. | Icon/text containers and buttons need valid action bindings. |
| Workflow | Approval/task URL rules remain important when adapted. | Workspace form uses minimal Start-to-End workflow. | Do not invent invalid or fake workflow semantics. |

## Reusable Planning Rules

- Consider `multi_column_form_workspace_shell` for service desk, help desk, CRM workbench, support console, case management, renewal review, triage, and operational inbox apps.
- Use dashboard layouts when the page is primarily reporting or monitoring.
- Use a form workspace when the app needs variables, form actions, comments, dynamic fields, selected-record state, or field-driven updates.
- Navigation rows should be containers with icon and text controls plus click/form actions.
- Filter actions should set variables that are consumed by collection filters or queries.
- Collection item actions should update selected/current record state.
- Detail panels should bind to selected/current record state.
- Expand/collapse icons should have action bindings and bounded inline icon sizing.
- Do not claim selected-record behavior if actions and bindings are not implemented.

## Validators And Tests Added

The template quality inspector now includes optional `FORM_WORKSPACE_*` checks when a generated page/template declares `multi_column_form_workspace_shell`, `four_column_service_desk_workspace`, `service_desk_inbox_workspace`, or `action_driven_ticket_workspace`.

New checks include:

- `FORM_WORKSPACE_SURFACE_MISSING`
- `FORM_WORKSPACE_FAKE_SUBMIT_BUTTON`
- `FORM_WORKSPACE_FAKE_WORKFLOW`
- `FORM_WORKSPACE_NAV_ACTION_MISSING`
- `FORM_WORKSPACE_FILTER_VARIABLE_MISSING`
- `FORM_WORKSPACE_COLLECTION_FILTER_MISSING`
- `FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING`
- `FORM_WORKSPACE_DETAIL_BINDING_MISSING`
- `FORM_WORKSPACE_ICON_ACTION_MISSING`
- `FORM_WORKSPACE_PANEL_LAYOUT_INVALID`
- `FORM_WORKSPACE_PLACEHOLDER_PANEL`

These checks are optional and pattern-scoped. They are not global package requirements.

## What Was Added

- `docs/standards/multi-column-form-workspace-standard.md`
- template entry `multi_column_form_workspace_shell`
- updates to the three-column standard describing the relationship between dashboard Style 2 and form workspaces
- skill guidance for application generation, approval forms, YAPK generation, package validation, runtime testing, dashboards, and data lists
- optional quality inspector checks and sanitized synthetic tests

## What Was Intentionally Not Changed

- No raw YAP/YAPK package was committed.
- No screenshot was committed.
- No stable branch, tag, Research repo, install, upgrade, or live API call was used.
- No generated broad/full app was created.
- No private IDs or raw decoded payloads were committed.

## Next Runtime Test Plan

Generate a small YAPK-only Service Desk Workspace smoke app that declares `multi_column_form_workspace_shell` and must pass the new `FORM_WORKSPACE_*` checks before signing or install. The smoke app should include:

- Support Tickets and Ticket Activities lists
- a Workspace approval/form page
- left help desk navigation with action-bound filters
- ticket collection with Priority/Status filters
- collection item action that sets selected/current ticket state
- selected ticket conversation/detail area
- right details/attributes panel bound to selected ticket
- comment/update action only if selected-ticket binding is validated
