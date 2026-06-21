# Functional Spec Business Logic Dashboard Requirements Training Report

## Scope

- Training branch: `codex/functional-spec-business-logic-dashboard-requirements`
- Requested training baseline: current stable `yeeflow-app-builder@yeeflow 0.7.4`
- Training topic: strengthen Functional Specification quality before App Plan generation.
- Training version bump: none.
- Post-merge release target: `0.8.0`; do not use `0.7.5`.
- Post-merge release branch: `codex/release-0.8.0-functional-spec-app-plan-dashboard-template-quality`

Version verification note:

- This training PR does not change plugin version metadata.
- Current local checkout, installed plugin list, `origin/main`, and `origin/stable` still report `0.6.64` after rollback PR #136.
- The `0.7.4` release branch exists as `origin/codex/release-0.7.4-signing-readiness-tenantid-and-setsign`.
- Before opening the separate `0.8.0` release bump PR, verify the intended stable baseline ref is the user-approved `0.7.4` line.

## Problem

Generated Functional Specification documents could satisfy the structural gate while still being too shallow for reliable App Plan, Page Function Plan, dashboard, workflow, and data generation. Common weak outputs used phrases such as "show dashboard", "track status", "manage requests", or "send notifications" without specifying the business roles, rules, fields, source data, conditions, calculations, or exceptions.

## Quality Rules Added

- Functional Specification must now cover business context: business problem, target users, operational scope, expected outcome, business goal, managed objects, value, success criteria, and exclusions.
- Role requirements now require responsibilities, record visibility, allowed actions, owned decisions, and needed dashboards/pages.
- Core process requirements now require start trigger, submission/intake, review/approval, assignment/fulfillment, status tracking, completion/closure, exception handling, and audit/history needs.
- Business rules now require explicit coverage for status lifecycle, approval, assignment, SLA/overdue behavior, validation, document/rich data, notification, escalation, completion, cancellation/rejection/rework, and permission rules when applicable.
- Data requirements now require business purpose, required fields, field meaning, business-level field type expectations, lookup/reference relationships, lifecycle/status fields, audit fields, and reporting/dashboard fields for each major business object.
- Dashboard page requirements now require business questions, source business objects/data lists, summary metrics, metric source fields, calculation logic, data regions, display fields, filters with source object/field/default scope/applies-to regions, sorting/grouping, user actions, mobile support, and alerts.
- App Plan Dashboard Pages Plan now converts those Functional Specification dashboard requirements into Yeeflow-supported control-type planning without changing the overall App Plan structure.
- Each Dashboard page App Plan entry now requires page identity, source Functional Specification dashboard requirement reference, source data lists/business objects, navigation placement, Page Function Plan reference when applicable, section-level control type categories, filter planning, summary metric planning, action categories, record-display control selection, and item-template dynamic display needs.
- Dashboard App Plan validation rejects dashboard-only placeholders, invented or unsupported dashboard control types unless proof/deferred-labeled, and low-level IDs/action codes/property paths/fake placeholder IDs in the Dashboard Pages Plan.
- Planning artifact format now requires `functional-specification.md` and `yeeflow-app-plan.md` as the primary human-readable Markdown artifacts. JSON is allowed only as a companion/projection artifact for validators, traceability, or tests, and must reference the Markdown source.
- Canonical Markdown templates now explicitly define required metadata/readiness blocks, section order, section names, table schemas, validation checklists, and dashboard requirement structures for the Functional Specification.
- Overall App Plan template format is preserved. Only the Dashboard Pages Plan section was enhanced.
- Functional Specification template validation now enforces standardized table schemas for role responsibilities, business object data requirements, status lifecycles, business rules, approvals, workflows/notifications, dashboard identity, dashboard metrics, dashboard data regions, dashboard filters, reporting/audit, permissions/visibility, clarification gates, and validation checklist.
- App Plan template validation is limited to Dashboard Pages Plan identity, dashboard sections, filters, summary metrics, actions, record display selections, dynamic controls, and Dashboard Pages Plan implementation-leakage rejection.
- Non-Dashboard App Plan sections remain backward compatible; data lists, approval forms, custom data list/document library forms, views, navigation, roles/permissions, workflows, notifications, reports/deferred resources, and existing readiness/traceability wording keep their previous formats and validator expectations.
- Generation lifecycle docs now state that generation must use the Markdown Functional Specification and Markdown App Plan as the source contracts first, with JSON projections derived from them only for validation, traceability, or tests.
- Approval/form, workflow/notification, reporting/audit, and business clarification gates now have explicit required business details.
- Functional Specification rejects low-level implementation leakage such as Yeeflow control types, ListID/PageID/FormID/LayoutID/ProcKey values, actionTypeCode values, JSON property paths, and exact generated resource IDs.
- Generated Yeeflow application wrappers now require FontAwesome icon mode for top-level `IconUrl`: a JSON string containing `b`, `i`, and `c`. Image URLs, `https://img.yeeflow.com/...`, SVG, emoji, blank/null, missing fields, and non-FontAwesome icon tokens fail validation. App Plan or generation report output should include selected icon rationale without generated package IDs.
- Dashboard generation hard gates from the Facility Maintenance dashboard review now apply only during dashboard resource generation, package validation, pre-signing readiness, and final reporting. They are explicitly not Functional Specification or App Plan requirements. The combined gate rejects missing filter field/value/style metadata, raw or missing Container width/layout serialization, KPI Heading/Text icon placeholders, incomplete Summary field selection/runtime binding metadata, and canonical application URLs that use install/import operation IDs instead of decoded package `$.ListSet.ListID`.

## Files Updated

- `docs/standards/functional-specification-standard-template.md`
- `docs/standards/app-plan-standard-template.md`
- `skills/installed/yeeflow-application-builder/references/requirement-to-yap-generation-lifecycle.md`
- `scripts/validate-functional-specification.mjs`
- `scripts/validate-functional-spec-to-app-plan-traceability.mjs`
- `scripts/validate-app-plan-resource-order.mjs`
- `scripts/validate-planning-artifact-formats.mjs`
- `scripts/test-functional-specification-quality-gates.mjs`
- `scripts/test-app-plan-dashboard-pages-plan-gates.mjs`
- `scripts/test-planning-artifact-format-gates.mjs`
- `scripts/test-planning-markdown-template-standardization-gates.mjs`
- `scripts/test-functional-specification-and-app-plan-gates.mjs`
- `scripts/lib/application-icon-validation.cjs`
- `scripts/validate-application-icon.js`
- `scripts/test-application-icon-gates.mjs`
- `scripts/validate-dashboard-generation-hard-gates.mjs`
- `scripts/test-dashboard-generation-hard-gates.mjs`
- `validate-yapk-package.js`
- `validate-yap-package.js`
- `scripts/yapk-first-generation-preflight.mjs`
- `docs/yeeflow-application-package-generation-rules.md`
- `docs/build-yap-wrapper.md`
- `docs/standards/yap-generation-contract.md`
- `skills/installed/yeeflow-application-generator/SKILL.md`
- `skills/installed/yeeflow-package-validator/SKILL.md`
- `scripts/test-clarification-readiness-traceability-gates.mjs`
- `scripts/test-app-plan-control-action-property-gates.mjs`
- matching committed `dist/yeeflow-app-builder-plugin` mirrors for standards, validators, tests, and lifecycle reference.

## Regression Coverage

- Pass: rich Facility Maintenance-style Functional Specification with business rules, dashboard metrics, source fields, calculation logic, filters, data regions, display fields, actions, alerts, roles, and clarification gates.
- Fail: shallow Functional Specification with only a generic app summary and vague phrases.
- Fail: dashboard requirement without required metrics, fields, filters, and data regions.
- Fail: Functional Specification containing low-level implementation IDs, actionTypeCode values, and control-type leakage.
- Pass: App Plan Dashboard page with business sections mapped to Summary/KPI, Data Filter, Collection/Data table, Text/Heading, and Button/action categories.
- Pass: App Plan with existing compact non-Dashboard section formats and enhanced Dashboard Pages Plan remains accepted.
- Fail: App Plan Dashboard page with no section-level control-type planning.
- Fail: App Plan Dashboard page using an invented control type without proof/deferred label.
- Fail: App Plan Dashboard page containing ListID/PageID/actionTypeCode/property paths.
- Pass: App Plan Dashboard page choosing Collection for a portfolio/work queue region without exact runtime properties.
- Pass: `functional-specification.md` and `yeeflow-app-plan.md` with consistent companion trace JSON.
- Fail: Functional Specification generated only as JSON without `functional-specification.md`.
- Fail: Yeeflow App Plan generated only as JSON without `yeeflow-app-plan.md`.
- Fail: skeletal Markdown that only links to JSON.
- Fail: companion JSON projection that points to the wrong Markdown source or stale source hash.
- Pass: complete Functional Specification Markdown using the standardized template.
- Fail: Functional Specification missing Dashboard business requirements.
- Pass: complete App Plan Markdown using the standardized template.
- Fail: App Plan missing detailed Dashboard Pages Plan.
- Fail: App Plan Dashboard planning without legal Yeeflow control type categories.
- Fail: App Plan containing runtime IDs/action codes/property paths.
- Pass: wrapper `IconUrl` is a JSON string with `b`, `i`, and `c`.
- Pass: Facility Maintenance wrapper icon uses a documented domain-appropriate FontAwesome class.
- Fail: wrapper `IconUrl` is an image URL.
- Fail: wrapper `IconUrl` is missing `b`, `i`, or `c`.
- Fail: wrapper `IconUrl` uses emoji, SVG, invented, or non-FontAwesome icon content.
- Fail: domain-specific icon validation detects a mismatched icon class.
- Pass: generated dashboard package with filter display/value/style metadata, coded Container layout, native KPI Icon, Summary field selection, ReportIds/tempVars, and visible KPI binding passes the generation hard gate.
- Fail: select/radio/checkbox filter has `attrs.data.field` but missing `display_f`, missing `value_f`, or missing label/dropdown style metadata.
- Fail: dashboard Container uses raw widthtype strings or omits direction/gap/align/justify layout keys.
- Fail: KPI card icon slot uses Heading/Text or has no native `type:"icon"` descendant.
- Fail: Summary has save_var but no matching `Resource.exts[]` field selection, bad COUNT field, bad numeric aggregate field, or visible KPI binding mismatch.
- Pass: final report uses decoded package ListSetID for canonical app URL and separately records install API return ID.
- Fail: final report URL uses install API returned ID or merges canonical application identity with install operation ID.

## Validation Summary

- `git diff --check`: passed.
- `node --check` for changed source/dist `.mjs` files: passed.
- `node scripts/validate-functional-specification.mjs docs/standards/functional-specification-standard-template.md --json`: passed.
- `node scripts/test-functional-specification-quality-gates.mjs`: passed.
- `node scripts/test-functional-specification-and-app-plan-gates.mjs`: passed.
- `node scripts/test-app-plan-dashboard-pages-plan-gates.mjs`: passed.
- `node scripts/test-planning-artifact-format-gates.mjs`: passed.
- `node scripts/test-planning-markdown-template-standardization-gates.mjs`: passed.
- `node scripts/test-clarification-readiness-traceability-gates.mjs`: passed.
- `node scripts/test-business-clarification-and-app-plan-precision-gates.mjs`: passed.
- `node scripts/test-planning-default-approval-and-exact-type-gates.mjs`: passed.
- `node scripts/test-app-plan-control-action-property-gates.mjs`: passed.
- `node scripts/test-ui-hard-gates-all.mjs`: passed.
- `node scripts/test-ui-summary-kpi-runtime-hard-gates.mjs`: passed.
- `node scripts/test-yapk-id-navigation-hard-gates.mjs`: passed.
- `node scripts/test-yapk-hard-gate-cache-artifacts.mjs`: passed.
- `node scripts/test-yapk-v3-runtime-hardening.mjs`: passed.
- `node scripts/test-application-icon-gates.mjs`: passed.
- `node scripts/test-dashboard-generation-hard-gates.mjs`: passed.
- Metadata inspection: no training version bump was made; the local training checkout still reports `0.6.64`, while the requested release baseline for the post-merge release path is `0.7.4`.
- Source/dist mirror checks for changed committed mirrors: passed.
- `node scripts/audit-release-safety.mjs`: passed with zero blocking findings.
- Changed-file private/forbidden artifact scan: passed with only expected policy/proof-boundary wording.

## Proof Boundaries

The Functional Specification and App Plan gates prove document quality and planning traceability only. The new FontAwesome icon and dashboard generation hard gates prove local wrapper/resource/reporting conformance for their scoped checks only. They do not prove signing/API acceptance, install/import/upgrade success, runtime rendering, workflow delivery, notification delivery, permission enforcement, or business correctness.

## Safety Confirmation

- No version bump was made.
- No `0.7.5` release target was prepared.
- No stable movement, tags, releases, or plugin archives were created.
- No live Yeeflow writes, signing, install, import, or upgrade were performed.
- Existing duplicate-suffixed untracked files were left untouched.

## Post-Merge 0.8.0 Release Notes Draft

Release branch after training merge:

`codex/release-0.8.0-functional-spec-app-plan-dashboard-template-quality`

Release notes for `0.8.0` should mention:

- richer Functional Specification business logic requirements
- standardized Functional Specification Markdown template
- Functional Spec Dashboard business requirements
- preserved App Plan template structure
- enhanced Dashboard Pages Plan only
- Dashboard legal Yeeflow control-type planning
- prevention of low-level implementation leakage in Functional Spec/App Plan
- Markdown primary planning artifacts with JSON companions only
- FontAwesome-only generated application icons with image icon packages blocked before signing/readiness
