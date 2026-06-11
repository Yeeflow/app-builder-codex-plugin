# Visual Design To Yeeflow Implementation Hardening

## Reason For Study

The Vendor Onboarding & Compliance Management mockup test showed that Codex can produce higher-quality application designs when it thinks like a modern web application designer first. The mockups had strong page padding, card-based sections, grid layouts, KPI cards, Kanban boards, configured data tables, Tabs, Steps bar, progress controls, Alerts, Dynamic fields, Document embed, Dynamic Sub List, Collection actions, bulk operation toolbar, QR Code, Barcode, Vertical Timeline, and print-page formatting.

The risk is that package generation may lose that design quality if the images are treated as decoration instead of implementation references.

## Required Workflow

When a user provides UI mockups, screenshots, generated design images, or rich UI descriptions, Codex should:

1. Interpret the design.
2. Extract the page structure, sections, controls, data bindings, actions, styles, spacing, padding, custom CSS needs, and custom code needs.
3. Map every visible UI area to Yeeflow-supported controls.
4. Create a Markdown UI implementation spec before package generation.
5. Generate the package from the spec without simplifying the design unless the user explicitly asks.
6. Validate the generated package against the spec and the normal app plan.

Suggested spec path:

```text
docs/generated-app-plans/<safe-app-name>-ui-implementation-spec.md
```

If the spec contains private data, tenant-specific details, or image references that should not be public, save it outside git and report the local path.

## Design Interpretation

Extract these elements from mockups or UI descriptions:

- pages
- sections
- layout hierarchy
- visible controls
- data bindings
- actions
- style patterns
- spacing and padding
- custom CSS needs
- custom code needs
- print behavior when relevant

## Yeeflow Control Mapping

Map each UI area to Yeeflow controls:

- Container/Grid
- Text
- Button/Form actions
- KPI cards through containers, text, summaries, and dynamic fields
- Progress circle
- Progress bar
- Alert
- Kanban
- Collection
- Data table
- Tabs
- Toggle
- Steps bar
- Dynamic fields
- Dynamic user
- Dynamic file/image
- Dynamic Sub List
- Document embed
- QR Code
- Barcode
- Vertical/Horizontal Timeline
- Icon list
- Divider
- Custom CSS for scoped polish
- Custom code control only when standard controls and custom CSS cannot meet the requirement

## Vendor Onboarding Mockup Examples

The Vendor Onboarding mockups map cleanly to Yeeflow implementation surfaces:

- Vendor Management Dashboard: dashboard page with KPI cards, Progress circle, Alert, Kanban, Data table, Icon list, and Vertical Timeline.
- Vendor Detail View Page: Data List custom View form with header card, Steps bar, Tabs, progress controls, Document embed, Collection actions, and Vertical Timeline.
- New Vendor Request Form: Data List custom New/Edit form or Approval Form with section cards, Toggle sections, Dynamic Sub List checklist, file fields, Alert, and form actions.
- Compliance Review Workspace: dashboard page with Kanban, Collection, right-side summary panel, Progress circle, Alert, Data table, and bulk operation toolbar.
- Vendor Print Page: Data List custom Print Page with read-only Dynamic fields, Steps bar, document checklist, approval timeline, QR Code, Barcode, Divider, and print CSS.

## Implementation Spec Template

Use `docs/generated-app-plans/ui-implementation-spec-template.md` as the starting point. The spec should include:

- page list
- purpose of each page
- layout structure
- Yeeflow controls per section
- data list bindings
- fields displayed
- form fields
- table columns
- collection/kanban/timeline item template fields
- action buttons and collection actions
- workflow/form actions
- style settings
- custom CSS requirements
- responsive considerations
- print-page formatting
- validation checklist

## Preserve Design Quality

Do not simplify a rich design-backed application into a blank, minimal, or simple package. Unless the user explicitly asks for an MVP or focused proof package:

- build the full design-backed application
- keep the major pages and controls from the mockup
- keep card/grid/section layout quality
- keep safe page and form padding
- configure Data table columns
- configure meaningful Collection/Kanban/Timeline item templates
- include print-page layout and scoped CSS when planned
- document and justify any omitted or deferred design area

## Visual Consistency Checklist

Before returning a package, check:

- each mockup page has a corresponding Yeeflow page/form/dashboard
- each major visible section exists
- all Data tables have configured columns
- all Kanban/Collection/Timeline templates have meaningful dynamic fields
- all pages/forms have safe outer padding
- card/grid structure is present
- actions exist and bind correctly
- print page includes print-oriented layout and custom CSS if needed
- no empty/unconfigured controls remain
- no unresolved fields, data sources, or actions remain

Use:

```text
node scripts/inspect-generated-app-quality.mjs --package <package.yap> --plan <plan.md> --spec <ui-implementation-spec.md>
```

The inspector validates structural fidelity. It does not perform pixel-level image comparison.

## Proof Boundary

This branch hardens workflow and guidance. It does not prove perfect pixel-level reproduction. It should improve structural and design fidelity when generating packages from UI mockups or UI design descriptions.

Runtime proof requires generating and testing a real Vendor Onboarding package from a UI implementation spec.
