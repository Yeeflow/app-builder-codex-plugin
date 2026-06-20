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
