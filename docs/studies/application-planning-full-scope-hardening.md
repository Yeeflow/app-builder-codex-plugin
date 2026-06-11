# Application Planning And Full-Scope Generation Hardening

## Reason For Study

Public v0.6.1 plugin testing showed that generated applications can fall below the local training workflow quality bar when Codex jumps straight to package generation, under-asks clarifying questions, or builds a small/simple first version instead of the full expected application.

Observed failures:

- no visible application plan before generation
- unclear requirements were not clarified before package work
- data model, pages, forms, dashboards, controls, and actions were chosen too shallowly
- generated output behaved like a simple v1/MVP even when the user expected a complete app
- dashboard Data table controls were emitted without display fields
- dashboard and Data List custom form layouts lacked safe left/right padding

## Plan-First Requirement

For normal application-generation requests, Codex should create a Markdown application plan before building a `.yap` or `.yapk` package unless the user explicitly says to skip planning.

Safe app plans can be saved under:

```text
docs/generated-app-plans/<safe-app-name>-plan.md
```

If a plan contains tenant-specific, private, or runtime-generated information that should not be committed, save it outside git and report the path instead.

## Clarification Gate

Ask focused clarification questions when missing details would likely produce a bad package:

- app purpose
- target users/roles
- required data lists and important fields
- process states/statuses
- approval flow
- dashboards/reports
- actions/workflows
- integrations/API requirements
- package type or expected output

Ask only the minimum needed to unblock safe generation. If uncertainty is not blocking, state assumptions in the plan and proceed.

## Required App Plan Contents

A good Yeeflow app plan should include:

- application purpose
- target users/roles
- business process overview
- data lists and fields
- document libraries if needed
- New/Edit/View forms
- Print Page if needed
- approval forms if needed
- dashboards and pages
- controls selected for each page
- UI/UX and Control Mapping
- actions and workflows
- automation/workflow logic
- permissions/roles if relevant
- integration/API requirements if relevant
- layout/design approach
- validation checklist
- assumptions, exclusions, and deferred items
- proof boundary

## Web Application UI/UX Mapping

Yeeflow application generation should use product-design reasoning before control assembly. Codex should first understand the business goal, target users/roles, main user journeys, data-entry flows, review/approval flows, dashboard/reporting needs, mobile/desktop expectations, what information users need first, and what actions users perform most often.

After designing the intended web-application experience, map the design into Yeeflow controls, layout settings, actions, custom CSS, and Custom code control when needed.

Common mappings:

- web app data grid/admin table -> Yeeflow Data table with configured columns, filters, actions, and padding
- card list/activity feed -> Collection with Dynamic field/user/image/file controls
- status board/task board -> Kanban with configured group/category field and item actions
- timeline/history/milestones -> Vertical Timeline or Horizontal Timeline
- multi-section detail page -> Tabs, Toggle, Containers, Grid, Divider, Alert, Steps bar, and Progress controls
- line items/invoice details/purchase items -> Dynamic Sub List with content layout, body grid, containers, row actions, and summary settings
- printable record -> Data List custom Print Page with read-only fields and Dynamic Sub List where needed
- process/status visualization -> Steps bar, Progress bar/circle, badges, alerts, and status fields
- quick links/shortcuts -> Icon list or custom button/card layout
- QR/barcode sharing/scanning -> QR Code and Barcode controls
- embedded report/map/video/page -> Embed when safe
- attachment/document preview -> Document embed
- custom UI beyond standard controls -> scoped custom CSS or Custom code control when justified

The `UI/UX and Control Mapping` plan section should include, for each page/form/dashboard:

- user goal
- chosen layout pattern
- selected Yeeflow controls
- why those controls were selected
- data bindings
- actions
- styling approach
- custom CSS/custom code needs
- alternatives considered when relevant
- validation checks

Example:

```text
Dashboard: Sales Overview
- User goal: give sales managers a fast view of pipeline health and follow-up work.
- Layout: padded dashboard with KPI cards, chart/collection area, and data table.
- Controls:
  - Progress circle for target attainment
  - Alert for overdue opportunities
  - Collection for priority deals
  - Data table for full deal list with configured columns
  - Icon list for quick actions
- Rationale: combines executive summary with operational follow-up.
- Validation: all data-bound controls must resolve fields and all tables must have columns.
```

## Styling And Customization

Generated applications should not look like raw unstyled controls placed on a blank page. Use Yeeflow styling capabilities for layout padding, card/container spacing, grid columns, section backgrounds, border radius, shadows/borders where supported, typography hierarchy, status colors, icon usage, and responsive layout.

Use custom CSS when standard style settings are not enough for fixed-width tables or scrollable layouts, spacing and alignment refinement, visual card polish, conditional visual states, print-page formatting, special sub-list/table layouts, or dashboard visual grouping. Keep CSS minimal, scoped, documented, safe, and never use it to hide broken structure.

Use Custom code control only when standard Yeeflow controls plus style settings/custom CSS cannot meet the requirement. Confirm that the custom code can be safely embedded, maintained, validated, and runtime-tested.

## Full-Scope Generation Expectation

The default public plugin behavior should be full-scope generation from the accepted plan. Codex should not default to a simple version, MVP, basic app, or small v1 package unless the user explicitly asks for that.

Implement all planned core data lists, fields, forms, dashboards, actions, workflows, and major controls in one package when feasible. If a planned item cannot be generated safely, mark it as excluded or deferred with the reason, workaround, and proof boundary.

Staged generation is allowed only when:

- the user explicitly asks for MVP/v1/simple output
- the app is too large for one safe package
- critical information is missing and the user chooses to proceed with assumptions
- the task is explicitly a focused runtime proof package

## Plan-To-Package Consistency

After generation, compare the package against the plan:

- planned data lists exist
- planned important fields exist
- planned forms exist
- planned dashboards/pages exist
- planned major controls exist
- planned Data tables have configured display columns
- planned actions/workflows exist or are documented as deferred
- forms and dashboards follow padding/layout quality standards
- data sources and bindings resolve
- no empty required controls remain
- package is not an underbuilt simple version when the plan says full implementation
- package matches the `UI/UX and Control Mapping` rationale

Use `scripts/inspect-generated-app-quality.mjs --package <package> --plan <plan.md>` to combine plan presence, package inventory, and generated UI quality checks.

## UI Quality Rules

Generated dashboards and Data List custom forms should use safe outer padding, grouped sections/cards/containers, and readable spacing. Major controls should not touch the page or window edge.

Data table controls must configure a source and meaningful display fields. Include 3 to 5 useful columns when fields are available, prioritizing title/name plus status, date, owner, amount, or progress fields as relevant.

Choose controls based on business value:

- Data table for tabular records with configured columns
- Collection/Kanban for card, task, or status-oriented views
- Timeline for date or event history
- Steps bar for process/status stage
- Progress controls for KPI/completion
- Tabs/toggles for organized dense content
- Dynamic Sub List for line items/details
- Print Page for printable record output

Prefer fewer complete controls over many incomplete controls.

Fail the quality review when controls are selected without business rationale, advanced controls are added without meaningful content, Custom code is used where standard controls would be better, or the generated package does not match the UI/UX control mapping plan.

## Proof Boundary

This branch hardens guidance, docs, and validation. It does not prove every future generated application will be visually perfect or complete. It should reduce known failures such as no plan, underbuilt apps, empty Data tables, and no-padding layouts.

Runtime proof requires generating and testing a focused application package with the new plan-first workflow and quality gate.
