# Yeeflow Application Design System

This is the standard design system for generated Yeeflow application packages.

It consolidates:

- the focused layout export `UI and UX design (1).yap`
- root design tokens from `/Users/Renger/Downloads/root_styles.txt`
- the Yeeflow Design System Alignment skill
- proven generated-app baselines for Visitor Access Management, Department Access Management, Knowledge Base Phase 1, Service Desk Pro dashboard stages, and Heep Hong IT eWorkflow Option A v9

The source `.yap` and `root_styles.txt` were studied read-only. Do not bundle either source artifact into generated apps, do not modify the originals, and do not inject the full root stylesheet into generated packages.

## Design Intent

Generated Yeeflow apps should feel calm, structured, trustworthy, operational, polished, and enterprise-ready.

Design quality should come from:

- clear page structure
- predictable navigation
- restrained color
- neutral surfaces
- spacing and alignment
- reusable section patterns
- realistic business labels and sample data

Avoid loud gradients, decorative effects, one-off palettes, hype-heavy AI wording, and visible implementation labels.

## Source Priority

Use sources in this order:

1. Runtime-proven Yeeflow export structure.
2. The `UI and UX design (1).yap` shell pattern.
3. Root style tokens from `root_styles.txt`.
4. Proven generated-app baselines.
5. Yeeflow brand/design-system guidance.

When these conflict, preserve proven Yeeflow runtime structure first. For example, the mini UI/UX export proves the `Main` / `Content` shell, but generated data lists must still preserve the stricter native `Title` metadata rule proven by later app baselines.

## Standard Page Shell

Generated dashboard, data-list custom form, and approval-form pages should use:

- hidden header bar by default where proven for dashboard pages
- full-width content area for forms: `attrs.container.cw = "2"`
- zero page padding with `--sp--s0`
- top-level container named `Main`
- child container named `Content`
- semantic section containers inside `Content`

Designer-facing names are stored in `nv_label`. Do not add visible text labels only to describe layout containers.

## Page Background Standard

Full-page background color belongs on the page/form background setting, not on the top-level `Main` container.

- dashboard pages: set the background on the embedded page JSON, such as `page.attrs.background`
- data-list custom forms: set the background on the custom form page JSON, such as `form.attrs.background`
- approval submission and task pages: set the background on `page.formdef.attrs.background`

`Main` is a structural/layout parent. It should provide layout direction, gap, alignment, and containment, but it should not simulate the full page background. If a specific visual section, card, header, summary panel, or content band needs its own background, set that background on that section/card/header container.

## Application Standards

Every generated application should include:

- complete root app shell metadata
- non-null wrapper icon
- populated root navigation
- clear business navigation names
- complete `Data.AppTags`, `Data.AppMetadatas`, `Data.AppComponents`, and `Data.AppThemes`
- fresh local ID family
- fresh approval form key when forms are included
- no raw exports, secrets, credentials, zip files, or environment files in commits

Navigation names should describe user work, not implementation:

- use `Overview`, `Requests`, `Catalog`, `Submit Request`, `Settings`, `Help Guide`
- avoid `Data List`, `Page 1`, field slot names, IDs, or internal type names in production-like generated apps

Navigation styling should preserve contrast. When the root header uses `LayoutView.attrs.appearance.bgc` and `LayoutView.attrs.appearance.color`, set the navigation menu to the inverse pair:

- `LayoutView.attrs["navigator-menu"].bgc = LayoutView.attrs.appearance.color`
- `LayoutView.attrs["navigator-menu"].color = LayoutView.attrs.appearance.bgc`

For the standard generated app shell, the header background is `var(--c--primary-light)`, the header text/icon color is `var(--c--primary)`, the nav background is `var(--c--primary)`, and nav text/icons are `var(--c--primary-light)`.

## Dashboard Standards

Dashboard pages should use:

- Type `103` root app page layouts
- `Ext2 = "{\"src\":true}"`
- embedded page JSON in `LayoutInResources[0].Resource`
- `attrs.hideHeaderAll = true`
- zero page padding
- page-level background on embedded page attrs when a full-page background is needed
- `Main` -> `Content`
- optional `Page header`, `Summary section`, `Body section`, `Collection section`, and `Empty state` containers

KPI cards, lists, filters, Collection controls, and operational cards should live inside `Content`.

Use Collection controls for repeatable dashboard content when the source list is included in the package and the binding has been proven. Collection item templates should use meaningful `nv_label` values such as `Collection item`, `Table row`, `Status badge`, and `KPI card`.

## Data List Form Standards

Every generated data list should include at least:

- `Edit Item`
- `View Item`

Display settings should map:

- New item -> `Edit Item`
- Edit item -> `Edit Item`
- View item -> `View Item`

Both forms should use:

- `attrs.container.cw = "2"`
- zero padding
- page-level background on the custom form attrs when a full-page background is needed
- `Main` -> `Content`

`Edit Item` is input optimized. `View Item` is readonly/display optimized. Both should use the same shell so generated apps feel coherent.

Native `Title` metadata remains a hard runtime rule:

- `FieldName: "Title"`
- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`
- `FieldIndex: 0` where generator controls metadata

## Approval Form Standards

Submission pages and task pages should use:

- `attrs.container.cw = "2"`
- zero padding
- page-level background for full-page form backgrounds
- `Main`
- `Content`
- `Form body`
- `Form bottom`

`Form body` contains requester fields, readonly mirrored fields, reviewer decision fields, and section containers.

When a submission form has a top request summary, use a `Form header` container above the main field sections. `Form header` should provide background, border, rounded corners, and overflow clipping. Put `Request summary panel` and `Request metric row` inside it.

The manually improved IT Hardware CAPEX Runtime V2 export proved these additional form-quality defaults:

- use `page.formdef.attrs.background` for full-page background instead of `Main.attrs.common.background`
- apply the same page-background rule to dashboard pages and data-list custom forms
- use `attrs.common.css` on a specific container when a gradient/background image is needed and native settings cannot express it
- generate `heading` and `text-editor` controls with inline width positioning by default
- wrap section icons in square centered badge containers
- put normal fields inside two-column `flex_grid` controls
- keep textarea, rich text, and list/sublist controls full row
- use native `calculated` controls for calculated values such as `Subtotal = Quantity * Unit Price`

`Form bottom` appears at the end of `Content` and contains by default:

1. `workflowControlPanel`
2. `workflowHistory`

Task pages should mirror submitted request fields as readonly where appropriate. Workflow logic should not be changed by visual-improvement work unless explicitly requested.

### Form Actions

Generated approval forms may use native form actions when an export-backed pattern exists.

Form Actions Phase 1 proves:

- inline `action_button` controls with native style codes
- `action_button.attrs.control_action` for button click actions
- `page.formdef.formAction.onLoad` for page load initialization
- `page.formdef.actions[]` as the form action definition list
- temp variables under `variables.tempVars[]`
- `setvar` and `confirm` action steps

Use form actions for front-end form behavior such as default values, confirmation dialogs, and temporary UI state. Keep workflow actions for process/backend behavior. Apply the same design rules to action buttons: inline width by default, meaningful `nv_label`, token-aligned styling, and no page background on `Main`.

## Token Standards

Use root style tokens as design guidance. Preserve token names exactly:

- primary: `--c--primary`
- secondary: `--c--secondary`
- success: `--c--success`
- warning: `--c--warning`
- danger: `--c--danger`
- neutral: `--c--neutral`
- background: `--c--background`
- text: `--c--text`
- font sizes: `--fs--base`, `--fs--h6`, `--fs--h5`, `--fs--h4`
- spacing: `--sp--s100`, `--sp--s150`, `--sp--s200`, `--sp--s300`, `--sp--s400`
- weights: `--fw--regular`, `--fw--medium`, `--fw--semi-bold`, `--fw--bold`

Do not require token references where Yeeflow exports resolved hex values. Validator checks for token alignment should be warnings until runtime proof says otherwise.

## Style Defaults

Use these defaults for generated app surfaces:

| Use | Default |
| --- | --- |
| page background | `--c--neutral-light` or `--c--background` |
| section/card background | `--c--background` |
| neutral border | `--c--neutral-light-active` |
| primary action | `--c--primary` |
| success status | `--c--success` / `--c--success-light` |
| warning status | `--c--warning` / `--c--warning-light` |
| danger status | `--c--danger` / `--c--danger-light` |
| body text | `--c--text` or `--c--text-normal` |
| muted text | `--c--neutral-dark` |
| body font | `--fs--base` |
| helper text | `--fs--s` or `--fs--xs` |
| section heading | `--fs--l` or `--fs--h6` |
| page heading | `--fs--h3` through `--fs--h1` |
| field gap | `--sp--s150` or `--sp--s200` |
| card padding | `--sp--s200` or `--sp--s300` |
| section gap | `--sp--s300` or `--sp--s400` |
| control radius | `6px` |
| card radius | `8px` |
| large panel radius | `12px` |

Prefer neutral borders before shadows. Use shadows sparingly.

## Naming Standards

Use consistent `nv_label` names:

- `Main`
- `Content`
- `Form header`
- `Page header`
- `Summary section`
- `Body section`
- `Form body`
- `Form bottom`
- `Action panel`
- `Flow history`
- `Collection section`
- `Collection`
- `Collection item`
- `Table header`
- `Table row`
- `Status badge`
- `KPI card`
- `Field group`
- `Readonly section`
- `Empty state`

Visible headings should be business-friendly and concise, such as `Request details`, `Approval decision`, `Open tickets`, or `Recent articles`.

## Baseline Lessons

Use these proven lessons:

- Department Access Management v5 proves complete root app shell, navigation, related lists, lookup relationships, approval form, and `ContentList` persistence.
- Visitor Access Management v5 and v11 prove fresh ID/form key discipline and richer field/control expansion.
- Knowledge Base Phase 1/v4 proves dashboard Collections can render local list sample rows when scope is kept conservative.
- Service Desk Pro Stage N proves staged dashboard expansion, KPI bindings, filters, Settings/Help pages, and local source lists.
- Heep Hong IT eWorkflow Option A v9 proves the five-list purchase requisition structure, workflow action validation, and the need to defer risky detail-row persistence until proven.
- Design System Request Tracker DSX proves the first combined design-system package: dashboard, local data list, Edit/View custom list forms, approval form controls, workflow action validation, manual form publish, submit/approve path, and `ContentList` persistence to a local list.

## Validator Policy

Generated-app design-system validation should warn for:

- missing `Main`
- missing `Content`
- full-page-like background on `Main`
- missing page-level background when `Main` carries a background
- missing meaningful `nv_label`
- missing `Edit Item` / `View Item` custom list forms
- New/Edit/View display settings not following standard
- approval page missing `Form body` / `Form bottom`
- Action Panel / Flow History outside `Form bottom`
- excessive arbitrary hard-coded colors
- dashboard/form page not full width or zero padding where detectable

Keep warnings non-blocking until a focused generated design-system package proves the rule at import/runtime. The Design System Request Tracker DSX baseline proves the core layout/list/form/workflow path, but generated app-level approval forms may still require publishing in Yeeflow Form Builder after import before submit/approve runtime testing.

## Shared Text Control Standard

Use `docs/yeeflow-text-control-generation-standards.md` for all generated approval forms, data-list custom forms, dashboards, and app pages. The focused `Text Style Sample.ywf` export supersedes earlier CAPEX text-control guesses:

- native Text is `type: "heading"` / `label: "Text"`
- inline width is `attrs.common.positioning.widthtype = [null, "2"]`
- named typography presets use `attrs.heads.ty = [null, "<preset>"]`
- custom typography uses an object under `attrs.heads.ty`
- text color uses a plain string under `attrs.heads.color`
- dynamic content uses `attrs.headc.title.variable[]`

Avoid old generated shapes that store `attrs.heads.color` as `[null, color]`, because they can render but leave designer style popups unresponsive.

## Shared Form Action Standard

Use `docs/yeeflow-form-action-generation-rules.md` for generated approval-form front-end actions.

Phase 1 runtime-proven capabilities:

- action buttons
- button click triggers
- page load triggers
- temp variables
- Set variable steps
- Show confirm dialog steps

Phase 2 export-backed capabilities:

- Query data steps
- query multiple and query single modes
- query result count variables
- query result collections
- query result mapping into form list variables and workflow variables
- Submit form steps
- Save changes submit mode

Keep the boundary clear:

- form actions are front-end form logic
- workflow actions are backend/process graph logic
- temp variables are form-runtime state and should not be treated as persisted business data
- Submit form / Save changes belongs to approval, data-list, and public forms, not dashboards
- Query data output should use explicit selected fields and explicit mapping
- query aggregates should use `arraySum`, not `arraySub`

## Generation Boundary

Do not generate a new app from this document alone. Start from a small focused package, validate it, import-test only when explicitly requested, publish imported approval forms when Yeeflow marks them unpublished, export back when useful, and then promote proven rules from warning to stronger generator behavior.
