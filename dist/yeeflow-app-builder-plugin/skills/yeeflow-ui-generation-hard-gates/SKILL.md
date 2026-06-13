---
name: yeeflow-ui-generation-hard-gates
description: Enforce Yeeflow UI generation hard gates before package validation. Use when designing, generating, upgrading, repairing, or validating dashboard/UI pages, Summary/KPI dashboards, runtime screenshot evidence, sandbox page proof, export-proven control/style shapes, or UI upgrade lineage/ListSetID stability.
---

# Yeeflow UI Generation Hard Gates

## Purpose

Use this skill before Codex modifies or claims quality for Yeeflow dashboard/UI pages. It turns the Marketing Event Management UI lessons into generation behavior so package validators become the backstop, not the first time Codex notices that a UI is only a scaffold.

This is one reusable skill for page-by-page UI/dashboard contracts, Summary/KPI proof boundaries, runtime screenshot evidence, UI upgrade lineage/ListSetID stability, export-proven Yeeflow style/control shape study, and sandbox-page UI proof workflow. Do not create duplicate single-topic skills for those areas unless a future reusable workflow becomes large enough to stand alone.

## Required Workflow

1. Create a page-by-page implementation contract before dashboard/UI page generation or upgrade. High-quality UI requires a page-by-page implementation contract with target page name, page purpose, requested design/mockup reference, visual sections, Yeeflow control mapping, data/list bindings, KPI/Summary plan, filter/action plan, grid/table plan, status/badge plan, runtime evidence requirement, and proof boundary.
2. Map requested designs or mockups directly to controls and sections. Design/mockup requests that are not mapped are hard failures. Broad scaffold-like UI must not be claimed as high-quality UI, and broad full-app restyling must stop unless every affected page has a page-level contract.
3. Use export-proven Yeeflow control/style shapes. Prefer observed shapes such as `attrs.common.background.normal.classic.color`, `attrs.common.border.normal.type`, `attrs.common.border.normal.width`, `attrs.common.border.normal.color`, `attrs.common.border.normal.radius`, `attrs.common.padding`, `attrs.style.gap`, control-level typography style objects, and Collection grid-table patterns when grid-table layout is intended.
4. Prove uncertain UI/runtime patterns on a sandbox page first. The rule is: uncertain UI/runtime patterns should be proven on a sandbox page first, verified with local validators and runtime evidence, and only then applied to real pages.
5. Treat Summary/KPI as three proof states: designer-configured Summary control, validator-valid Summary contract, and runtime-proven visible dynamic KPI rendering. Do not collapse those states in reports.
6. Build Summary/KPI controls with designer-shaped hidden Summary configuration. Summary/KPI controls require designer-shaped hidden Summary configuration. Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, and `ReportIds`; they must resolve to current app/list metadata; numeric summaries must use numeric fields; count summaries must use a valid count/ListDataID shape when required.
7. Keep Summary hosts hidden with designer-compatible shape: a dedicated hidden container, `attrs.common.hide = [null, true, true, true]`, horizontal `attrs.style.direction = [null, "row"]`, and a display rule such as `attrs.display.rule = "1 == 0"` when used.
8. Do not claim dynamic KPI display from configuration alone. Visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback and recorded as a gap.
9. Require runtime screenshot evidence before UI-quality claims. Runtime screenshot evidence is required before claiming UI quality, including visible KPI values, hidden Summary controls not visible, card-like dashboard sections, visible filters/actions, non-scaffold tables/grids, distinct badges/chips, and no plain scaffold look.
10. Keep proof boundaries explicit. Install/signing/API acceptance is not runtime UI proof, schema validation is not visual proof, and successful upgrade-check is not proof that dashboard runtime rendering is good.
11. Preserve upgrade lineage. UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope. They must also preserve existing resource IDs and final `Resource.ReplaceIds` coverage. Stop if a user requested an update but the package is classified as fresh install, existing pages/resources drift outside scope, IDs are reallocated, or lineage metadata is missing.
12. Start runtime proof reports from `docs/examples/runtime-evidence.redacted.example.json` when evidence metadata is needed. The template is synthetic, redacted, labels fallback KPI values as fallback, and is shaped for `scripts/inspect-runtime-evidence.mjs` plus `scripts/inspect-visible-kpi-runtime-bindings.mjs`.
13. Run `node scripts/test-ui-hard-gates-all.mjs` before claiming UI quality. The aggregate smoke is local-only and must not require live Yeeflow API access, private screenshots, package install/import/upgrade, or write operations.
14. Keep the future dynamic KPI binding path separate from current fallback-only status. Once dynamic KPI binding is truly runtime-proven, add a dedicated golden runtime package/evidence fixture and update the hard gate from “unresolved unless proven” to “use this exact proven shape.” Until then, dynamic visible KPI binding remains unresolved unless runtime evidence proves it, and fallback KPI values must remain explicitly labeled as fallback.

## Stop Conditions

Stop before package mutation, signing, install/upgrade automation, or generated-final handoff when:

- no page-by-page implementation contract exists for claimed high-quality UI work
- placeholder/scaffold wording remains in generated UI
- requested design/mockup references are not mapped to page sections and controls
- weak JSON styling is used instead of export-proven Yeeflow control/style shapes
- a Summary/KPI metric lacks real list/field/filter metadata, designer-shaped `save_var`, unique temp variable, or page `ReportIds`
- visible KPI text shows raw temp variable names or has no runtime evidence
- fallback KPI values are present without explicit fallback labeling
- runtime screenshot evidence is missing for a UI-quality claim
- hidden Summary controls appear in screenshot/evidence
- grid-table sections are planned but Collection grid-table templates, columns, headers, item templates, empty states, or row/action links are missing
- UI upgrade package ListSetID, app identity, existing IDs, or declared change scope drifts

## Validator Map

Use the final validator/tool names from the UI hard-gate standard:

- `scripts/inspect-yeeflow-ui-design-contract.mjs` for page-by-page implementation contracts and scaffold/placeholder claims
- `scripts/inspect-dashboard-style-shapes.mjs` for export-proven Yeeflow control/style shapes
- `scripts/inspect-dashboard-summary-control-contract.mjs` for designer-shaped hidden Summary hosts, fields, filters, temp variables, `save_var`, and `ReportIds`
- `scripts/inspect-visible-kpi-runtime-bindings.mjs` for raw temp variable names, blank KPI evidence, runtime-proven dynamic visible KPI binding, and labeled fallbacks
- `scripts/inspect-runtime-evidence.mjs` for runtime screenshot/evidence requirements before UI-quality claims
- `scripts/inspect-grid-table-quality.mjs` for Collection grid-table columns, headers, item templates, empty states, and row/action links
- `scripts/inspect-yapk-upgrade-app-identity.mjs` for ListSetID/app identity, existing IDs, declared change scope, package lineage, and final `Resource.ReplaceIds` coverage
- `scripts/decode-yapk-tolerant-brotli.mjs` only for safe structural diagnostics of official designer exports; never expose package payload content
- `scripts/test-ui-hard-gates-all.mjs` for the aggregate local UI hard-gate smoke, including the runtime evidence template checks and layout-aware skill wording test
- `docs/examples/runtime-evidence.redacted.example.json` as the redacted runtime evidence template for `inspect-runtime-evidence.mjs` and `inspect-visible-kpi-runtime-bindings.mjs`

## Reporting

Reports must state:

- which pages have page-by-page implementation contracts
- which controls/styles are export-proven and which required sandbox proof
- Summary/KPI proof state for each metric: designer-configured, validator-valid, runtime-proven visible dynamic KPI, or fallback
- whether runtime screenshot proof was completed
- that install/signing/API acceptance is not runtime UI proof
- upgrade lineage inputs and whether ListSetID/app identity/existing IDs stayed stable

## Related Skills

Use this skill with:

- `yeeflow-application-builder` and `yeeflow-application-generator` for full app UI generation and upgrade planning
- `yeeflow-dashboard-generator` for dashboard controls, grid-table Collection patterns, Summary/KPI dashboards, and page contracts
- `yeeflow-yapk-package-generator` for YAPK update lineage, ListSetID stability, ID reuse, and final `Resource.ReplaceIds`
- `yeeflow-package-validator` for generated-final hard gates and proof-boundary reporting
- `yeeflow-runtime-test-orchestrator` for screenshot/runtime evidence classification
- `yeeflow-feature-learning-orchestrator` when a UI/control/style shape is uncertain and needs sandbox-page learning first
