# Page Function Plan Generation Stage Training Report

Date: 2026-06-20

Branch: `codex/page-function-plan-generation-stage`

Baseline: `origin/main` and `origin/stable` both resolved to `0a219412dc38c277f7ef9aca6fe3106dcb8e1ceb` before branch creation.

Plugin version: unchanged at `0.6.64`.

## Goal

Add a required Page Function Plan planning stage between the Yeeflow App Plan and Application Design System/page-resource generation.

Required lifecycle:

```text
Functional Specification
-> Yeeflow App Plan
-> Page Function Plan
-> Application Design System
-> Page/resource generation
```

## Changes

- Enhanced `docs/standards/functional-specification-standard-template.md` with business-oriented page requirements by role, task, information need, action need, filtering/grouping/sorting/priority, mobile need, and access requirement.
- Added `docs/standards/page-function-plan-standard-template.md`.
- Added `docs/standards/application-design-system-template.md`.
- Updated `docs/standards/app-plan-standard-template.md` so the App Plan references Page Function Plan entries without embedding page-level details.
- Added `scripts/validate-page-function-plan.mjs`.
- Added `scripts/validate-application-design-system.mjs`.
- Added `scripts/validate-app-plan-page-function-traceability.mjs`.
- Added `scripts/test-page-function-plan-gates.mjs`.
- Added `scripts/test-application-design-system-gates.mjs`.
- Added Dashboard-only Page Function Plan template-selection gates that load the plugin-contained Dashboard template library and require `dashboardPagePattern` plus structured `dashboardSectionTemplates[]`.
- Added Dashboard-only high-fidelity/Event Portfolio gates based on plugin-contained Marketing Event/Event Portfolio lessons for KPI/Summary binding, Data Filter consumers, Collection grid-table requirements, rich table treatment, action metadata, KPI formatting, semantic `nv_label`, and runtime proof boundary.
- Promoted `event_portfolio_dashboard_golden_reference` as an explicit Dashboard golden-reference family in the plugin-contained template library and Page Function Plan contract.
- Clarified document responsibility split: Functional Specification describes business page needs only, App Plan declares Dashboard resources plus stable Page Function Plan refs only, and Page Function Plan owns Dashboard implementation intent including `dashboardGoldenReference`.
- Consolidated the Page Function Plan as the canonical page-level implementation contract for Dashboard pages, Approval submission/task/print surfaces, custom Data list forms, and custom Document library forms.
- Added Page Function Plan `interactiveActions[]` / click-action gates for visible interactive `Container`, `Button`, and `action_button` controls using plugin-known Container/Button action mappings and runtime proof boundaries.
- Added Application Design System layout-selection gates requiring exactly one supported Yeeflow Application Layout and structured app chrome fields before generation.
- Added Application Design System `applicationChrome` gates for app-wide Yeeflow header, navigator menu, content-area tokens, design intent, supported generated shell property paths, export-learning/runtime-proof/deferred boundaries, and Dashboard chrome inheritance.
- Added non-dashboard surface gates for Approval field state/behavior, task decisions, print-specific noninteractive pages, New/Edit current-resource field scope, Save/Cancel actions, View related-region contracts, and Document library metadata/upload/view behavior.
- Extended App Plan to Page Function Plan traceability so App Plan Approval/Data list/Document library surfaces must carry stable Page Function Plan references and Page Function Plan entries must map back to App Plan resources.
- Registered the new validators/tests in focused planning gates, aggregate UI hard gates, and YAPK cache artifact mirror checks.
- Updated `skills/installed/yeeflow-application-builder/SKILL.md` so the lifecycle requires Page Function Plan and Application Design System before generation.
- Mirrored changed standards, scripts, tests, and skill files into `dist/yeeflow-app-builder-plugin/...`.

## Page Function Plan Contract

The Page Function Plan covers UI-required surfaces and excludes Form Reports as required canonical UI design surfaces.

Required surface coverage:

- Dashboard pages.
- Approval submission forms.
- Planned approval task forms.
- Required approval print pages.
- Planned custom Data list forms.
- Planned custom Document library forms.

Required page-level content:

- Page purpose.
- Target users/roles.
- Required regions/sections.
- Data source.
- Plugin-supported Yeeflow control type.
- Displayed fields.
- Filters, grouping, sorting, and priority.
- Actions.
- Structured interactive click actions for visible interactive `Container`, `Button`, and `action_button` controls.
- Empty/loading/error state intent where applicable.
- Desktop and mobile layout behavior.
- App Plan traceability by stable resource, field, form, action, workflow, source list, and library names.

Interactive Container/Button action contract:

- Page Function Plan keeps `actions` as stable business action names and defines generated action metadata in `interactiveActions[]`, `clickActions[]`, `actionBindings[]`, or equivalent structured fields.
- Supported action mappings are `action-type: "2"` Link, `action-type: "5"` Add list item, `action-type: "6"` Open dashboard, `action-type: "8"` Open approval form, and `action-type: "1"` Form action binding only where host/form-action shape is supported or explicitly proof/deferred.
- Each planned interactive action requires control label, control type, interaction purpose, action type/code, target resource type/name, target identifiers such as `ListID`, `PageID`, `ProcKey`, `LayoutID`, or form action ID, open mode, size when needed, passValues/queryParams/setVars when needed, proof status, and fallback/deferred reason when unsafe.
- Visible interactive Containers/Buttons/action_buttons without action metadata fail unless marked `nonInteractive` with a reason.
- Action labels implying click behavior fail when they exist only in prose/string actions and not structured fields.
- Resource generation must consume these Page Function Plan action definitions and must not generate visible fake buttons; unsafe actions must be deferred or rendered as non-interactive text.

Dashboard-specific contract:

- Every Dashboard page declares `dashboardPagePattern`.
- Every Dashboard page declares structured `dashboardSectionTemplates[]`.
- Dashboard section `templateId` values must exist in `docs/templates/yeeflow-ui-section-template-library.normalized.json` or documented Dashboard standards.
- Template selection is consumed by downstream page/resource generation, not treated as prose-only visual guidance.
- `three_column_workspace_shell` is allowed only for meaningful left/main/right workspace pages, not simple dashboards.
- High-quality, Marketing Event, Event Portfolio, portfolio/status, operational-table, rich table, and runtime-fidelity Dashboard sections must declare applicable plugin-contained fidelity references and the implementation details page/resource generation must preserve.
- Event Portfolio-style portfolio/status/operational tables require rich table/card treatment, badge/progress/person/avatar treatment where applicable, header hierarchy, row density, real Yeeflow action metadata, Collection grid-table source/field/row-context/detail-open requirements when used, and a runtime proof boundary.
- Dashboards can select `dashboardGoldenReference: event_portfolio_dashboard_golden_reference` for high-quality portfolio, operations, status, pipeline, event, project, vendor, contract, service, or request management pages.
- The Event Portfolio golden reference requires Data Filters, KPI cards, Summary/KPI binding or fallback boundary, Collection grid-table structure, Dynamic controls inside item templates, status/progress/person treatments where fields require them, real action metadata, source/fields/filters/grouping/sorting, semantic `nv_label`, and runtime proof boundary.
- The Event Portfolio golden reference is based only on plugin-contained, redacted, synthetic, or already committed Marketing Event / Event Portfolio training materials. It excludes private raw artifacts, raw package payloads, tenant/app/list IDs, screenshots, raw API responses, and private runtime evidence.
- App Plan Dashboard entries now require `pageFunctionPlanRef`, `dashboardFunctionRef`, or an equivalent stable reference ID. Page Function Plan Dashboard entries require `pageFunctionPlanId` and `appPlanDashboardRef`.
- Dashboard/resource generation must consume the Page Function Plan entry when it exists and must not infer sections only from the App Plan resource list.

Non-dashboard surface contract:

- Approval submissions require a structured submission `pageFunctionPlanId`, App Plan approval reference, fields/controls, editable/read-only state, required/default/dynamic/validation behavior, sub lists where needed, and Save as draft/Submit actions.
- Approval task forms require structured task `pageFunctionPlanId`, task-specific actions such as Approve/Reject or Complete, explicit differences from the submission form, and field editable/read-only state.
- Approval print pages require structured print page `pageFunctionPlanId`, print-specific content/layout/evidence intent, and no unsupported interactive controls.
- Data list New/Edit forms require structured form `pageFunctionPlanId`, current-list fields only, and Save/Cancel or equivalent actions unless an App Plan-supported exception is explicit.
- View/detail/custom forms may include related regions only when source list/library, parent/current-item binding, displayed fields, filters, actions, and opening behavior are specified.
- Document library forms require structured form `pageFunctionPlanId` plus document metadata and view behavior; upload/edit forms must also define upload behavior.

Application Design System layout contract:

- The Application Design System must select exactly one supported `applicationLayoutType`: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`.
- It must declare structured `selectedApplicationLayout`, `applicationChromeStyleId`, `headerMode`, `navigationMode`, `navigationPanelMode`, `contentSafeArea`, `dashboardChromeRules`, and `formSurfaceChromeRules`.
- It must declare structured `applicationChrome.header`, `applicationChrome.navigatorMenu`, and `applicationChrome.contentArea` settings using Yeeflow theme tokens or plugin-known style values where possible.
- It must separate `applicationChrome.designIntent`, `applicationChrome.supportedGeneratedProperties`, `applicationChrome.exportLearningRequired`, `applicationChrome.runtimeProofRequired`, and `applicationChrome.deferredProperties`.
- It must document mapping intent to known Yeeflow shell properties: `LayoutView.attrs.appearance.bgc`, `LayoutView.attrs.appearance.color`, `LayoutView.attrs["navigator-menu"].bgc`, `LayoutView.attrs["navigator-menu"].color`, and `LayoutView.attrs["navigator-menu"].position`.
- Resource generation may only write the supported generated shell properties currently proven in the plugin: `LayoutView.attrs.appearance.bgc`, `LayoutView.attrs.appearance.color`, `LayoutView.attrs["navigator-menu"].bgc`, `LayoutView.attrs["navigator-menu"].color`, and `LayoutView.attrs["navigator-menu"].position`.
- Hover, active, selected, title typography, icon, and other unproven chrome styling must remain design intent and be marked `export-learning-required`, `runtime-proof-required`, or deferred when exact export-proven property paths are not available.
- A design intent field is not generated property proof, and validation fails if desired chrome styling is treated as a generated Yeeflow property path.
- Dashboard/application pages inherit the app-level selected layout and must include header/navigation/content-safe-area expectations.
- Dashboard/application pages inherit app-wide `applicationChrome`; per-page Dashboard chrome overrides fail unless explicitly unsupported/deferred with proof boundary.
- Approval forms and Data list / Document library forms are form surfaces and must not invent app header/navigation unless explicitly plugin-supported or deferred with proof boundary.
- Arbitrary sidebars, custom nav bars, floating navigation, custom top bars, and unsupported app shells fail validation.
- Page Function Plan validation can consume an Application Design System file and fail Dashboard entries that override the app-level layout without an explicit unsupported/deferred proof boundary.

## Regression Coverage

`scripts/test-page-function-plan-gates.mjs` covers:

- Complete valid Page Function Plan.
- Missing dashboard page function entry.
- Missing approval submission/task/print entry.
- Missing data list form entry.
- Missing App Plan Approval/Data list/Document library Page Function Plan references.
- Valid Application Design System selecting exactly one supported layout.
- Application Design System with no layout, multiple layouts, invented layout name, or arbitrary chrome.
- Application Design System missing header/navigator chrome settings.
- Application Design System using raw hex values without proof-boundary justification.
- Application Design System inventing hover/active navigator property paths.
- Application Design System marking hover/active details `export-learning-required` when exact paths are not proven.
- Application Design System treating design intent fields as generated property proof.
- Dashboard Page Function Plan inheriting the Application Design System layout.
- Dashboard Page Function Plan overriding the app-level layout without explicit deferred/proof boundary.
- Dashboard Page Function Plan overriding app-wide chrome without explicit deferred/proof boundary.
- Dashboard Page Function Plan attempting to cause unsupported generated app shell/chrome properties even with a deferred proof boundary.
- Valid Dashboard quick actions using Open dashboard, Add list item, and Open approval form with structured target metadata.
- Visible interactive Container/Button without action binding.
- Action label implying click behavior without structured action metadata.
- Intentionally static action-looking controls marked `nonInteractive` with a reason.
- Add list item missing target list/layout.
- Open dashboard missing target Dashboard/PageID.
- Open approval form missing target Approval/ProcKey.
- Form action binding referencing a missing form action.
- Invented action type/open mode.
- Click action passValues/queryParams/setVars referencing fields or variables outside the App Plan/Page Function Plan.
- Form Report correctly not required as a UI surface.
- New/Edit form incorrectly containing Collection/Data analytics/audit/dashboard regions.
- Approval submission field missing state/behavior contract.
- Approval task form missing task-specific actions.
- Approval print page with unsupported interactive controls.
- New/Edit form missing Save/Cancel actions.
- New/Edit form using a field from another list/library.
- Document library form missing metadata/view behavior.
- View form correctly containing related Data table regions with source, binding, fields, filters, actions, and opening behavior.
- Page Function Plan referencing unsupported controls or fields not in App Plan.
- Valid Dashboard template selection using `kpi_card_row` plus `data_table_section`.
- Valid Dashboard template selection using `kanban_status_board`.
- Valid `three_column_workspace_shell` Dashboard with meaningful left/main/right panel content.
- Unknown, missing, prose-only, or incompatible Dashboard template selections.
- Valid Event Portfolio-style Dashboard fidelity requirements.
- Missing high-fidelity/Event Portfolio fidelity reference.
- Missing KPI/Summary binding plan.
- Missing Data Filter/action metadata plan.
- Missing rich table treatment.
- Missing Collection grid-table source, row-context, and detail/open-action requirements.
- Valid Event Portfolio Dashboard golden-reference selection.
- Event Portfolio golden-reference selection with static KPI cards only.
- Event Portfolio golden-reference selection with a plain Data table instead of Collection grid-table.
- Event Portfolio golden-reference selection missing Dynamic controls.
- Event Portfolio golden-reference selection with unbound/fake actions.
- Event Portfolio golden-reference selection without runtime proof boundary.
- App Plan Dashboard without a Page Function Plan reference.
- Page Function Plan Dashboard that does not map back to an App Plan Dashboard.
- Dashboard golden reference declared outside the structured Page Function Plan Dashboard entry.
- Dashboard golden reference mentioned only in prose.

## Proof Boundary

These changes prove planning-stage structure and traceability only.

They do not prove:

- Generated package validity.
- Signing.
- API acceptance.
- Install/import/upgrade success.
- Runtime materialization.
- Visual fidelity.
- Workflow execution.

## Safety

- No version bump.
- No stable movement.
- No tags.
- No GitHub release.
- No plugin archive generation.
- No live Yeeflow writes.
- No signing, install, import, or upgrade.
- Duplicate untracked ` 2` / ` 3` files were left unstaged and out of scope.

## Recommended Next Step

After this training PR is reviewed and merged, prepare the separate release bump PR for `0.7.0` on `codex/release-0.7.0-page-function-plan-generation-stage`.
