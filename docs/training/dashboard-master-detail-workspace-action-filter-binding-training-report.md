# Dashboard Master-Detail Workspace Action and Filter Binding Training Report

## Scope

This training hardens `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace` materialization after Service Tickets runtime validation found several generated controls that looked interactive but did not execute correctly.

The affected layouts are inbox-style master-detail Dashboard page templates. Both layouts have page-level temp variables, filter variables, and form/page actions in the golden reference source. Those dependencies are part of the template contract and must survive clone-and-map generation.

## Confirmed Defects

The generated Dashboard dropped the page-layout root dependencies and kept only component-template dependencies. As a result, copied controls could still contain `attrs.control_action`, but the referenced page action no longer existed in the generated page. Runtime rendered visual controls, yet clicking them could not execute a page action.

The left-panel filters were mapped by field position instead of business semantics. In a Service Tickets page, `Priority Level` and `Status` filters were bound to neighboring fields instead of the actual Priority and Status fields. This produced empty or misleading option lists.

The hidden Summary host could be inserted into a visible content-card section on master-detail pages, leaving a visually empty section below KPI cards.

## Required Generator Behavior

When materializing either master-detail workspace page layout:

- Merge the page-layout template's own `filterVars`, `tempVars`, `actions`, and `formAction` dependencies before merging inserted component-template dependencies.
- Preserve mandatory shell variables such as `vCurrentItemID`.
- Rewrite and namespace inserted component-template dependencies, but do not drop the page-layout shell dependencies.
- After clone-and-map, every generated control with an action reference must resolve to a page `actions[]` / `formAction[]` entry or to the nearest Collection/Kanban local action list.
- Remove unresolved operation controls instead of shipping visual-only buttons.
- Clean up empty `Operations`, `section_title_area`, `section_content_area`, and copied optional modules after removing unresolved controls.
- Bind left-panel filters by label/placeholder semantics. `Status` must bind to the actual Status field, and `Priority` / `Priority Level` must bind to the actual Priority field.
- Put hidden Summary runtime controls under a non-visible host that does not create a visible empty card or section in the right content panel.

## Required Validator Behavior

Generated packages must fail if:

- A Dashboard control has an unresolved `attrs.control_action`, `attrs.action`, `control_action`, or `action` reference.
- A master-detail left-panel filter points to a field that does not exist on its bound source list.
- A master-detail left-panel filter's label/placeholder indicates a business field but the bound field is a different neighboring field.
- Either two-panel or three-panel workspace layout loses mandatory runtime dependencies or emits empty placeholder modules.

Template registry validation may still allow source-template operation placeholders, but generated package validation must not.

## Regression Coverage

The focused regression suite now covers both:

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

The tests verify:

- valid generated shells preserve master-detail structure;
- unresolved generated page action controls fail;
- Status filters bound to Priority fail;
- mandatory `vCurrentItemID` remains required;
- empty optional operation and business sections are cleaned;
- page-scope dependency validation remains compatible.

## Proof Commands

Run these before signing readiness:

```bash
node scripts/test-dashboard-master-detail-workspace-page-layout-template-gates.mjs
node scripts/test-dashboard-page-layout-template-gates.mjs
node scripts/test-page-scope-template-dependency-gates.mjs
node scripts/test-dashboard-generation-hard-gates.mjs
node scripts/test-runtime-binding-lessons.mjs
```

For a generated package, also run:

```bash
node scripts/validate-dashboard-page-layout-template.mjs --package <generated-final.yapk> --app-plan <yeeflow-app-plan.md>
node scripts/validate-page-scope-template-dependencies.mjs --package <generated-final.yapk> --json
```

Do not sign or install if any of these fail.
