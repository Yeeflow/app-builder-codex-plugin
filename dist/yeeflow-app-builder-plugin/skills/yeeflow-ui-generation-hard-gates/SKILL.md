---
name: yeeflow-ui-generation-hard-gates
description: Enforce Yeeflow UI generation hard gates before package validation. Use when designing, generating, upgrading, repairing, or validating dashboard/UI pages, Summary/KPI dashboards, runtime screenshot evidence, sandbox page proof, export-proven control/style shapes, or UI upgrade lineage/ListSetID stability.
---

# Yeeflow UI Generation Hard Gates

## Purpose

Use this skill before Codex modifies or claims quality for Yeeflow dashboard/UI pages. It turns the Marketing Event Management UI lessons into generation behavior so package validators become the backstop, not the first time Codex notices that a UI is only a scaffold.

This is one reusable skill for page-by-page UI/dashboard contracts, Summary/KPI proof boundaries, runtime screenshot evidence, UI upgrade lineage/ListSetID stability, export-proven Yeeflow style/control shape study, and sandbox-page UI proof workflow. Do not create duplicate single-topic skills for those areas unless a future reusable workflow becomes large enough to stand alone.

## Required Workflow

This closed-loop workflow is mandatory for any request that includes high-quality UI, a design image/mockup, generated design images, dashboard UI upgrade, page visual redesign, runtime UI proof, Marketing Event-style dashboard work, "make it look like the design", "not plain scaffold", "professional dashboard", or "one page at a time":

Design/mockup reference -> choose one official Yeeflow application layout -> generate UI implementation contract -> validate application layout design rules -> validate UI contract -> define page/scope manifest -> generate or update one allowed page/scope only -> validate upgrade scope -> run local UI/package hard gates -> sign/install/upgrade only after write confirmation -> capture redacted runtime evidence -> compare design/runtime structure -> iterate exact failing controls.

Phase 3B adds the workflow enforcement check after structure comparison and before final UI-quality/design-fidelity claims.

1. Create a page-by-page implementation contract before dashboard/UI page generation or upgrade. High-quality UI requires a page-by-page implementation contract with target page name, page purpose, requested design/mockup reference, visual sections, Yeeflow control mapping, data/list bindings, KPI/Summary plan, filter/action plan, grid/table plan, status/badge plan, runtime evidence requirement, and proof boundary.
2. Before generating design images for a Yeeflow app, choose one of the four official Yeeflow application layouts: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`. Also choose one canonical `applicationChromeStyleId` for the app. PNG/JPEG layout screenshots are the primary source for generated design-image layout rules; YAPK exports are supporting structural references. All page images for the same app must use the same selected layout and preserve the exact same application chrome. Design-image prompts must preserve the selected Yeeflow header/nav/content safe-area structure, header mode, nav mode, nav background mode, selected state style, app icon placement, and app name placement. For Layout 1 vertical nav, do not add a header hamburger icon or a bottom Collapse control. Do not mix dark and light nav panels across pages unless the app explicitly chooses a different named canonical style and every page follows it. Header/navigation chrome must follow the selected layout, page-specific content must stay inside the content safe area, and generated images must not invent arbitrary app shells, custom sidebars, custom top bars, floating navs, nav bars, sidebars, or top bars. Do not invent arbitrary app shells, nav bars, sidebars, or top bars. Application layout compliance is required before using a generated image as a UI implementation reference. Application chrome fidelity compliance is also required before using generated images as UI implementation references. If layout/chrome cannot be verified automatically, mark `human_review_required`. Screenshot-derived rules are human-reviewed derived rules, not pixel-perfect or automated screenshot proof.
3. Define exact primary navigation labels and order at plan and contract time. Generated design images must show only the approved primary navigation items. UI contracts must include exact visible primary navigation labels and hidden support resources expectations. Visible primary navigation must be generated from the approved UI contract, not inferred from all resources in the package. Support data lists, forms, approval pages, and implementation-only resources must not automatically appear in the primary navigation when the approved design contract excludes them. Hiding support resources must use schema-compatible app/layout metadata such as `ListSet.LayoutView.sort`; do not add invalid direct hidden-resource mutations such as unsupported `IsHidden` fields when the schema rejects extra properties.
3. Run `scripts/generate-ui-contract-from-design.mjs` before generation when a design/mockup exists, then run `scripts/inspect-application-layout-design-rules.mjs` for generated design image specs/UI contracts, and then run the canonical UI contract validator `scripts/inspect-yeeflow-ui-design-contract.mjs` before package generation. If the validator path changes in the future, locate the canonical validator and report the actual path used.
3. Map requested designs or mockups directly to controls and sections. Design/mockup requests that are not mapped are hard failures. Broad scaffold-like UI must not be claimed as high-quality UI, and broad full-app restyling must stop unless every affected page has a page-level contract.
4. Define a page/scope manifest for UI upgrades and run `scripts/validate-ui-upgrade-scope.mjs` before package mutation. Generate or update one allowed page/scope only unless the user explicitly approves a broader declared scope.
5. Use export-proven Yeeflow control/style shapes. Prefer observed shapes such as `attrs.common.background.normal.classic.color`, `attrs.common.border.normal.type`, `attrs.common.border.normal.width`, `attrs.common.border.normal.color`, `attrs.common.border.normal.radius`, `attrs.common.padding`, `attrs.style.gap`, control-level typography style objects, and Collection grid-table patterns when grid-table layout is intended.
6. Prove uncertain UI/runtime patterns on a sandbox page first. The rule is: uncertain UI/runtime patterns should be proven on a sandbox page first, verified with local validators and runtime evidence, and only then applied to real pages.
7. Treat Summary/KPI as three proof states: designer-configured Summary control, validator-valid Summary contract, and runtime-proven visible dynamic KPI rendering. Do not collapse those states in reports.
8. Build Summary/KPI controls with designer-shaped hidden Summary configuration. Summary/KPI controls require designer-shaped hidden Summary configuration. Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; they must resolve to current app/list metadata; numeric summaries must use numeric fields; count summaries must use a valid count/ListDataID shape when required.
9. Keep Summary hosts hidden with designer-compatible shape: a dedicated hidden container, `attrs.common.hide = [null, true, true, true]`, horizontal `attrs.style.direction = [null, "row"]`, and a display rule such as `attrs.display.rule = "1 == 0"` when used.
10. Do not claim dynamic KPI display from configuration alone. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape: UUID Summary IDs, matching layout-resource `Resource.ReportIds[]`, matching layout-resource `Resource.exts[]` entries where `i` is the Summary UUID, `category` is `___Pivot___`, and `key` is `summary`, layout-resource `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, complete Summary field metadata, and no static/fallback proof values.
11. Require before/after mutation proof for dynamic KPI claims. Runtime evidence must include before/after source data mutation evidence, expected-value notes, inspector output, and refreshed/recalculated runtime evidence. Summary recalculation can be asynchronous or cache-delayed; stale after-evidence that still shows before values is not a final verdict.
12. Keep all other KPI binding shapes unproven unless focused runtime proof exists. Semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, and other visible binding shapes remain unproven. For every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback and recorded as a gap.
13. Apply Data Analytics control identity rules to Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Data Analytics controls require UUID/runtime-safe IDs; non-UUID IDs require export-proven evidence for that exact control type. Preserve existing Data Analytics control IDs during upgrades and allocate new UUID/API-issued IDs only for newly added analytics controls.
14. Do not generalize analytics control shapes. Summary has a proven UUID runtime shape. Pivot table has export-proven `Resource.exts[]` registration. Pie/Column/Line charts have focused visible-rendering proof but still need export-proven identity/settings checks for broader claims. Gauge, Funnel chart, and Color block heatmap remain unproven until sandbox/export study captures their designer shapes.
15. Run existing UI/package validators before signing. Package validation, schema validation, signing, install, upgrade-check, and upgrade-apply are not visual proof and must not be reported as high-quality UI proof.
16. Require redacted runtime evidence before UI-quality claims. Runtime screenshot evidence is required before claiming UI quality, including visible KPI values, hidden Summary controls not visible, analytics controls rendering correctly, card-like dashboard sections, visible filters/actions, non-scaffold tables/grids, distinct badges/chips, and no plain scaffold look. Use `scripts/capture-runtime-ui-evidence.mjs` after runtime install/upgrade before any UI-quality or design-fidelity claim. Runtime proof that uses browser screenshots must explicitly refresh Chrome before screenshot capture. Runtime navigation evidence must be nav-scoped or exact-line based; broad body-text scans are not reliable navigation proof and must not be used to prove primary navigation fidelity.
17. Keep proof boundaries explicit. Install/signing/API acceptance is not runtime UI proof, schema validation is not visual proof, successful upgrade-check is not proof that dashboard runtime rendering is good, and upgrade-apply success is not visual/runtime evidence.
18. Preserve upgrade lineage. UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope. They must also preserve existing resource IDs and final `Resource.ReplaceIds` coverage. Stop if a user requested an update but the package is classified as fresh install, existing pages/resources drift outside scope, IDs are reallocated, or lineage metadata is missing.
19. Start runtime proof reports from `docs/examples/runtime-evidence.redacted.example.json` when evidence metadata is needed. The template is synthetic, redacted, includes the UUID Summary v1.0.1 proof-shape fields, preserves fallback examples for unsupported shapes, and is shaped for `scripts/inspect-runtime-evidence.mjs` plus `scripts/inspect-visible-kpi-runtime-bindings.mjs`.
20. Use Phase 2 structural comparison before UI-quality claims when a UI contract and runtime evidence exist. `scripts/compare-design-to-runtime-structure.mjs` compares UI contract expectations against redacted runtime evidence, accepts Phase 1 evidence from `capture-runtime-ui-evidence.mjs`, and reports missing KPIs, tables, filters/actions, badges, spacing/scaffold issues, weak evidence, and design-image review boundaries. It is not pixel-perfect visual diffing and does not claim full automatic design-image understanding. Screenshots are helpful but not always mandatory unless high-quality visual proof is claimed. Dynamic KPI proof remains governed by before/after mutation evidence.
21. Compare design/runtime structure before claiming design fidelity, then iterate exact failing controls from the findings. Structure comparison cannot establish dynamic KPI proof; dynamic KPI proof still requires before/after mutation evidence.
22. Phase 3B adds workflow-level enforcement. Run `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` before claiming high-quality UI or design fidelity. The workflow enforcement helper is required before high-quality UI/design-fidelity claim. Final reports for high-quality UI work must include contract, scope, runtime evidence, and structure-comparison artifact paths as applicable. Generation from design/mockup requires a UI contract. UI upgrades require a scope manifest. Runtime UI quality claims require runtime evidence. Design fidelity claims require structure comparison. Dynamic KPI proof requires before/after mutation evidence. Structure comparison alone is not dynamic KPI proof. Install/sign/upgrade success is not visual proof.
23. Use the standard closed-loop artifact/report paths unless the workflow report explicitly records valid alternatives: UI contract Markdown at `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md`, UI contract JSON at `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json`, UI upgrade scope manifest at `docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json`, runtime evidence at `dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json`, design/runtime structure findings at `dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json`, and workflow enforcement findings at `dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json`.
24. Run `node scripts/test-ui-hard-gates-all.mjs` before claiming UI quality. The aggregate smoke is local-only and must not require live Yeeflow API access, private screenshots, package install/import/upgrade, or write operations.
25. Apply the Marketing Event boundary carefully. Marketing Event dashboards may use the exact UUID Summary v1.0.1 shape, but must still run their own before/after mutation proof before claiming runtime dynamic KPI success. Real Marketing Event private artifacts must not be committed; use synthetic or redacted Marketing Event-inspired fixtures only.
26. Apply the Marketing Event v0.6.45 design/runtime fidelity lessons. Signing, verifysign, upgrade-check, and upgrade-apply are not visual proof. Runtime proof must separately report app chrome fidelity, primary navigation fidelity, content structure fidelity, and dynamic KPI proof boundary. If design KPI values are mock visual placeholders, runtime value mismatch is a warning only; if dynamic KPI proof is claimed, before/after mutation evidence is required. Content-fidelity gaps for KPI card treatment, table badge/progress/avatar treatment, spacing, and hierarchy remain backlog unless executable validators are added. A high-quality UI claim must not pass when runtime content looks like a generic scaffold while the design image has rich dashboard structure.

## Stop Conditions

Stop before package mutation, signing, install/upgrade automation, or generated-final handoff when:

- no page-by-page implementation contract exists for claimed high-quality UI work
- no UI contract exists for a design/mockup request
- no official Yeeflow application layout is declared for generated design images
- page images in the same app use inconsistent application layouts
- page images in the same app use inconsistent application chrome styles, including dark/light nav drift or different selected-state styles
- Layout 1 vertical-nav design images add a header hamburger icon or bottom Collapse control
- generated design image chrome invents arbitrary app shells, unsupported nav bars, unsupported sidebars, unsupported top bars, or content that overlaps/replaces header/nav safe areas
- exact primary navigation labels/order are missing from a plan or UI contract for design-driven app work
- visible primary navigation is inferred from all package resources instead of the approved UI contract
- support data lists, forms, approval pages, or implementation-only resources appear in primary navigation when the design excludes them
- support-resource hiding uses schema-invalid direct hidden-resource mutations instead of schema-compatible metadata such as `ListSet.LayoutView.sort`
- application layout compliance cannot be verified automatically and `human_review_required` is not recorded
- the UI contract has unresolved required sections
- a scope manifest is missing for a UI upgrade
- scope validation fails
- placeholder/scaffold wording remains in generated UI
- requested design/mockup references are not mapped to page sections and controls
- weak JSON styling is used instead of export-proven Yeeflow control/style shapes
- a Summary/KPI metric lacks real list/field/filter metadata, designer-shaped `save_var`, unique temp variable, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, or layout-resource `Resource.tempVars`
- a dynamic KPI proof claim uses semantic/non-UUID Summary IDs, lacks matching `Resource.exts[]`, lacks `Resource.tempVars[]`, or does not bind visible controls through `attrs.headc.title.variable[]`
- a Data Analytics control uses a non-UUID/non-runtime-safe ID without exact export-proven evidence, has missing/mismatched `Resource.exts[]` or report registration where required, uses placeholder fields, or changes existing analytics IDs during an upgrade
- before/after source data mutation evidence is missing, stale, or not captured after refreshed/recalculated runtime state
- visible KPI text shows raw temp variable names or has no runtime evidence
- fallback KPI values are present without explicit fallback labeling
- runtime screenshot evidence is missing for a UI-quality claim
- Chrome was not explicitly refreshed before runtime screenshot capture
- runtime navigation evidence is a broad body-text scan instead of nav-scoped or exact-line evidence
- runtime evidence is missing but UI quality is claimed
- hidden Summary controls appear in screenshot/evidence
- grid-table sections are planned but Collection grid-table templates, columns, headers, item templates, empty states, or row/action links are missing
- UI upgrade package ListSetID, app identity, existing IDs, or declared change scope drifts
- structure comparison has fail findings
- structure comparison has warning findings and the user requested strict quality
- workflow enforcement fails or the final report omits required contract/scope/runtime evidence/structure-comparison artifact paths
- dynamic KPI proof is claimed without before/after mutation evidence
- package signing/install/upgrade succeeded but visual/runtime evidence is missing

## Validator Map

Use the final validator/tool names from the UI hard-gate standard:

- `scripts/generate-ui-contract-from-design.mjs` for Phase 1 review-required UI implementation contract scaffolding from a design image reference plus an optional app plan/spec. Without a local vision parser, it must mark visual extraction items unresolved and require human review.
- `scripts/capture-runtime-ui-evidence.mjs` for Phase 1 redacted runtime UI evidence metadata shaped for the runtime and visible-KPI inspectors. It must not store or print private tenant URLs, raw responses, full workspace IDs, secrets, raw `Resource`, raw `Sign`, or private screenshots.
- `scripts/validate-ui-upgrade-scope.mjs` for Phase 1 declared-scope UI upgrade enforcement before package mutation, including ListSetID, app identity, page/resource, data list/field, approval form, workflow, navigation, and numeric ID lineage boundaries.
- `scripts/compare-design-to-runtime-structure.mjs` for Phase 2 structural design-to-runtime comparison. It compares UI contract expectations against redacted runtime evidence, accepts Phase 1 runtime evidence, warns when design images require human review, and must not claim pixel-perfect visual diffing, full automatic image understanding, or dynamic KPI proof.
- `scripts/inspect-ui-closed-loop-workflow-enforcement.mjs` for Phase 3B workflow/report metadata enforcement before high-quality UI, design-fidelity, runtime UI quality, or dynamic KPI proof claims. It checks contract, contract validation, scope manifest, scope validation, runtime evidence, structure comparison findings, dynamic KPI mutation evidence, final report artifact paths, unresolved findings, and warning waivers without parsing or mutating YAPK payloads.
- `scripts/inspect-application-layout-design-rules.mjs` for official Yeeflow application-layout and application-chrome fidelity compliance in generated design image specs or UI contracts. It requires one consistent application layout and one consistent canonical application chrome style across every page image in an app, blocks Layout 1 header hamburger and bottom Collapse controls, detects dark/light nav drift, blocks unsupported arbitrary app shells/navigation chrome, enforces header/nav/content safe-area declarations, and marks screenshot/image layout verification as unproven unless a reliable parser exists.
- `scripts/inspect-yeeflow-ui-design-contract.mjs` for page-by-page implementation contracts and scaffold/placeholder claims
- `scripts/inspect-dashboard-style-shapes.mjs` for export-proven Yeeflow control/style shapes
- `scripts/inspect-dashboard-summary-control-contract.mjs` for designer-shaped hidden Summary hosts, fields, filters, layout-resource `Resource.ReportIds`, `Resource.exts`, `Resource.tempVars`, and `save_var`
- `scripts/inspect-data-analytics-control-identity.mjs` for Data Analytics control UUID/runtime-safe IDs, registration metadata, `Resource.exts[]` matching, designer-shaped settings/data fields, runtime-proof claims, and upgrade ID preservation
- `scripts/inspect-visible-kpi-runtime-bindings.mjs` for raw temp variable names, blank KPI evidence, exact UUID Summary v1.0.1 dynamic proof evidence, and labeled fallbacks
- `scripts/inspect-runtime-evidence.mjs` for runtime screenshot/evidence requirements before UI-quality claims
- `scripts/inspect-grid-table-quality.mjs` for Collection grid-table columns, headers, item templates, empty states, and row/action links
- `scripts/inspect-yapk-upgrade-app-identity.mjs` for ListSetID/app identity, existing IDs, declared change scope, package lineage, and final `Resource.ReplaceIds` coverage
- `scripts/decode-yapk-tolerant-brotli.mjs` only for safe structural diagnostics of official designer exports; never expose package payload content
- `scripts/test-ui-hard-gates-all.mjs` for the aggregate local UI hard-gate smoke, including the runtime evidence template checks and layout-aware skill wording test
- `docs/examples/runtime-evidence.redacted.example.json` as the redacted runtime evidence template for `inspect-runtime-evidence.mjs` and `inspect-visible-kpi-runtime-bindings.mjs`

## Reporting

Reports must state:

- which pages have page-by-page implementation contracts
- which official Yeeflow application layout was selected and whether every generated page image uses the same layout
- which canonical application chrome style was selected and whether every generated page image preserves the same header/nav/content safe-area chrome
- whether application layout compliance was declared, human-reviewed, or automatically verified
- which controls/styles are export-proven and which required sandbox proof
- Summary/KPI proof state for each metric: designer-configured, validator-valid, runtime-proven visible dynamic KPI, or fallback
- whether dynamic KPI proof uses the exact UUID Summary v1.0.1 shape and before/after source mutation evidence, or remains unproven/fallback-only
- whether runtime screenshot proof was completed
- that install/signing/API acceptance is not runtime UI proof
- upgrade lineage inputs and whether ListSetID/app identity/existing IDs stayed stable
- the exact artifact paths for the UI contract, scope manifest and scope validation result when applicable, runtime evidence, design/runtime structure findings, workflow enforcement findings, and dynamic KPI mutation evidence when dynamic KPI proof is claimed
- unresolved findings and warning waiver/disposition summary from the workflow enforcement report

## Related Skills

Use this skill with:

- `yeeflow-application-builder` and `yeeflow-application-generator` for full app UI generation and upgrade planning
- `yeeflow-dashboard-generator` for dashboard controls, grid-table Collection patterns, Summary/KPI dashboards, and page contracts
- `yeeflow-yapk-package-generator` for YAPK update lineage, ListSetID stability, ID reuse, and final `Resource.ReplaceIds`
- `yeeflow-package-validator` for generated-final hard gates and proof-boundary reporting
- `yeeflow-runtime-test-orchestrator` for screenshot/runtime evidence classification
- `yeeflow-feature-learning-orchestrator` when a UI/control/style shape is uncertain and needs sandbox-page learning first
