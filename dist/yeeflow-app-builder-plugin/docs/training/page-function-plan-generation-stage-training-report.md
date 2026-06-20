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
- Added `scripts/validate-app-plan-page-function-traceability.mjs`.
- Added `scripts/test-page-function-plan-gates.mjs`.
- Added Dashboard-only Page Function Plan template-selection gates that load the plugin-contained Dashboard template library and require `dashboardPagePattern` plus structured `dashboardSectionTemplates[]`.
- Added Dashboard-only high-fidelity/Event Portfolio gates based on plugin-contained Marketing Event/Event Portfolio lessons for KPI/Summary binding, Data Filter consumers, Collection grid-table requirements, rich table treatment, action metadata, KPI formatting, semantic `nv_label`, and runtime proof boundary.
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
- Empty/loading/error state intent where applicable.
- Desktop and mobile layout behavior.
- App Plan traceability by stable resource, field, form, action, workflow, source list, and library names.

Dashboard-specific contract:

- Every Dashboard page declares `dashboardPagePattern`.
- Every Dashboard page declares structured `dashboardSectionTemplates[]`.
- Dashboard section `templateId` values must exist in `docs/templates/yeeflow-ui-section-template-library.normalized.json` or documented Dashboard standards.
- Template selection is consumed by downstream page/resource generation, not treated as prose-only visual guidance.
- `three_column_workspace_shell` is allowed only for meaningful left/main/right workspace pages, not simple dashboards.
- High-quality, Marketing Event, Event Portfolio, portfolio/status, operational-table, rich table, and runtime-fidelity Dashboard sections must declare applicable plugin-contained fidelity references and the implementation details page/resource generation must preserve.
- Event Portfolio-style portfolio/status/operational tables require rich table/card treatment, badge/progress/person/avatar treatment where applicable, header hierarchy, row density, real Yeeflow action metadata, Collection grid-table source/field/row-context/detail-open requirements when used, and a runtime proof boundary.

## Regression Coverage

`scripts/test-page-function-plan-gates.mjs` covers:

- Complete valid Page Function Plan.
- Missing dashboard page function entry.
- Missing approval submission/task/print entry.
- Missing data list form entry.
- Form Report correctly not required as a UI surface.
- New/Edit form incorrectly containing Collection/Data analytics/audit/dashboard regions.
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
