# Standard Functional Specification and App Plan Flow Training Report

## Branch

- Branch: `codex/standardize-functional-spec-app-plan-flow`
- Baseline: `main` / `stable` at `e3b1097d142993ed86256ccd31f8c2f8a92a05ff`
- Plugin version checked: `0.6.58`

## Training Topic

Standardize the Functional Specification and Yeeflow App Plan flow for new application generation.

## Source Problem Summary

Previous generation flows could move from requirement intake into an ad hoc App Plan/spec and then resource generation. That left gaps:

- no standalone Functional Specification gate
- App Plans could drift from the standard template
- resource generation could start before plugin-supported fields, controls, actions, workflow nodes, and proof boundaries were planned
- Form Report planning could be mixed with Dashboard or Data List view planning
- Dashboard and Collection control planning could be underspecified
- Placeholder planning for fields and form controls could be omitted
- temporary scripts could invent Yeeflow resource/control/action shapes instead of using plugin standards, validators, templates, or export-proven references

## Files Changed

- `docs/standards/functional-specification-standard-template.md`
- `docs/standards/app-plan-standard-template.md`
- `docs/app-plan-standard-template.md`
- `docs/app-plan-generation-contract.md`
- `docs/standards/app-plan-conformance-standard.md`
- `skills/installed/yeeflow-application-builder/SKILL.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`
- `skills/installed/yeeflow-application-generator/SKILL.md`
- `skills/installed/yeeflow-package-validator/SKILL.md`
- `skills/installed/yeeflow-yapk-package-generator/SKILL.md`
- `scripts/validate-functional-specification.mjs`
- `scripts/validate-app-plan-resource-order.mjs`
- `scripts/test-functional-specification-and-app-plan-gates.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`
- `scripts/inspect-generated-app-quality.mjs`
- Matching mirrors under `dist/yeeflow-app-builder-plugin/`

## Functional Specification Template Summary

Added the canonical Step 1 Functional Specification template with 23 sections:

- input detail classification for brief, detailed, document-backed, screenshot-backed, and mixed requirements
- requirement interpretation method
- business objects, relationships, process, lifecycle, approvals, forms, workflows, reporting, documents, AI, integrations, permissions, UI, decision gates, assumptions, risks, completeness review, and readiness for App Plan
- rule that source documents/screenshots/samples are supporting references, not content to copy blindly
- review loop that revises inconsistent, incomplete, or incorrect requirements before App Plan generation

## App Plan Template Summary

Added the canonical Step 2 Yeeflow App Plan template under `docs/standards/app-plan-standard-template.md`.

The plan is now a Yeeflow resource generation contract organized by resource order:

1. Data lists and Document libraries
2. Approval forms
3. Form reports
4. Schedule workflows
5. AI Agents
6. Copilots
7. Custom Data List forms
8. Data List workflows
9. Notifications
10. Data List views
11. Dashboard pages
12. Application navigation
13. Target users, roles, groups, and permissions

The template preserves proof boundary, validation plan, ID provenance, navigation runtime metadata, approval form, dashboard grid-table Collection, root padding, plan-to-package conformance, and advanced capability gates. It also requires Placeholder planning for Data List fields, Approval Form fields, task form fields, and custom Data List form fields.

`docs/app-plan-standard-template.md` is now a compatibility entrypoint that points to the canonical standards path and no longer competes as a second template.

## Skill Changes

`yeeflow-application-builder` now states that it is the top-level application-building controller and must:

- create a standardized Functional Specification first
- run the Functional Specification review gate
- create the App Plan only from the reviewed Functional Specification
- treat the App Plan as a Yeeflow resource generation contract
- block design images, page blueprints, resource/package generation, decoded parity, signing, upgrade, and runtime proof until Functional Specification and App Plan gates pass
- require all field/control/workflow/action/resource shapes to come from plugin-known skills, standards, validators, template library, or export-proven references
- prevent temporary scripts and ad hoc generation logic from bypassing plugin knowledge

## Lifecycle Reference Changes

Replaced the old `Initial Business Analysis` and `Initial App Plan/Spec` flow with:

1. Requirement Intake
2. Functional Specification
3. Functional Specification Review Gate
4. Yeeflow App Plan
5. App Plan Review Gate
6. Business Clarification Gate
7. Generation Readiness Review
8. Decide Safe Build Scope
9. Resource/Package Generation

The lifecycle now states that new application generation defaults to `.yapk`; `.yap` is only for explicit requests or fallback/debug scope; existing application upgrades require an official baseline `.yapk` and ID stability.

## Dist Mirror Changes

Mirrored all source docs, skills, validators, tests, and updated helper wording into `dist/yeeflow-app-builder-plugin/`. Mirror checks passed for the new canonical templates, controller skill, lifecycle reference, and validator scripts.

## Validators and Tests Added

- `scripts/validate-functional-specification.mjs`
  - checks required 23 sections
  - checks requirement interpretation method
  - checks business objects and relationships are present or explicitly not applicable
  - checks business decision gates, completeness review, and readiness for App Plan

- `scripts/validate-app-plan-resource-order.mjs`
  - checks required 23 sections
  - checks standard Yeeflow resource generation order
  - checks Placeholder planning in Data List, Approval Form, task form, and custom Data List form sections
  - checks Form Report is standalone and based on Approval Form
  - checks Dashboard planning is separate from Form Report planning
  - checks plugin capability compliance, proof boundary, assumptions, deferred/runtime-proof items, and recommended next prompt

- `scripts/test-functional-specification-and-app-plan-gates.mjs`
  - validates canonical templates
  - verifies failing fixtures for missing Functional Specification relationships and missing App Plan resource-order/Placeholder gates

- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`
  - now requires the new validators/tests and canonical templates to be present and mirrored in the dist cache payload

## Validation Commands and Results

- `git diff --check` - passed
- `node --check scripts/validate-functional-specification.mjs` - passed
- `node --check scripts/validate-app-plan-resource-order.mjs` - passed
- `node --check scripts/test-functional-specification-and-app-plan-gates.mjs` - passed
- `node --check scripts/inspect-generated-app-quality.mjs` - passed
- `node --check scripts/test-yapk-hard-gate-cache-artifacts.mjs` - passed
- `node --check dist/yeeflow-app-builder-plugin/scripts/validate-functional-specification.mjs` - passed
- `node --check dist/yeeflow-app-builder-plugin/scripts/validate-app-plan-resource-order.mjs` - passed
- `node --check dist/yeeflow-app-builder-plugin/scripts/test-functional-specification-and-app-plan-gates.mjs` - passed
- `node scripts/test-functional-specification-and-app-plan-gates.mjs` - passed
- `node scripts/validate-functional-specification.mjs docs/standards/functional-specification-standard-template.md` - passed
- `node scripts/validate-app-plan-resource-order.mjs docs/standards/app-plan-standard-template.md` - passed
- `node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.58` - passed, plugin version `0.6.58`
- `node scripts/test-yapk-hard-gate-cache-artifacts.mjs` - passed
- `node scripts/test-ui-hard-gates-all.mjs` - passed
- `node scripts/audit-release-safety.mjs --base main --archive does-not-exist.zip --dist-root dist/yeeflow-app-builder-plugin` - passed, no blocking findings
- `rg` checks for `Functional Specification`, `App Plan`, `Form report`, `resource generation order`, and `Placeholder` - passed

## Safety Confirmation

- No plugin version bump
- No `stable` movement
- No tags
- No releases
- No plugin archives generated
- No live Yeeflow writes
- No signing, install, import, or upgrade
- No secrets, tenant URLs, full workspace IDs, raw user IDs, raw API responses, raw package `Resource`, raw `Sign`, or private screenshots added

## Known Follow-Up Items

- Existing `scripts/validate-app-plan-template.mjs` remains as an older compatibility validator. Future cleanup can either retire it or make it delegate to `validate-app-plan-resource-order.mjs`.
- Future generated-app conformance validators can consume the new Functional Specification directly and compare package resources against both the Functional Specification and App Plan.
