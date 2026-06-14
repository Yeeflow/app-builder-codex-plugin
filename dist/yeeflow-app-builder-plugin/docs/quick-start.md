# Quick Start

## Install

Use Codex App marketplace install with:

```text
Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
Git ref: stable
Sparse paths:
  .agents/plugins/marketplace.json
  dist/yeeflow-app-builder-plugin
```

Expected plugin: `Yeeflow App Builder` version `0.6.44`.

## Configure Local Environment

Normal OAuth and workspace discovery do not require `.env.local`; the file may be absent or empty. Fixed API/OAuth defaults are bundled by the plugin.

```env
# No required values for normal OAuth + workspace discovery.
```

Run OAuth login before API access. OAuth uses Authorization Code with PKCE S256, and the plugin generates the `code_verifier`. No OAuth client secret is required for normal login/refresh. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.44
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
```

## Use API Helpers Safely

List documented capabilities:

```sh
node scripts/yeeflow-api-list-capabilities.mjs --read-only
```

Run a read-only mapped smoke call only after OAuth is authenticated:

```sh
node scripts/yeeflow-api-call-capability.mjs --name locations.list
node scripts/yeeflow-workspace-list.mjs --all
node scripts/yeeflow-workspace-list.mjs --category flowcraft
```

Do not use guessed paths or arbitrary raw API calls. `GET /workspaces/settings` and `GET /workspaces/flowcraft` are mapped as read-only OAuth workspace discovery and print only redacted workspace summaries. For current app/package workflows, `flowcraft` is the relevant workspace category unless product/API docs change. Mutating capabilities and package operations require explicit confirmation. Package install/import/upgrade ignores local `YEEFLOW_WORKSPACE_ID` for target selection and must stop with `workspace_selection_required` before request shaping until the user chooses an API-discovered `flowcraft` workspace and passes it with `--selected-workspace-id` or documented user-selected `--workspace-id`.

## Build And Validate Packages

Use the validators and wrapper helpers for local proof:

```sh
node validate-yap-package.js <package.yap>
node validate-yapk-package.js <package.yapk>
node validate-yap-graph.js <package-or-resource>
```

Generated-final `.yapk` packages must also pass the ID provenance and navigation runtime metadata hard gates before signing, install, upgrade-check, or handoff:

```sh
node scripts/validate-yapk-id-provenance.mjs --package <package.yapk> --manifest <id-provenance-report.json>
node scripts/validate-yapk-navigation-runtime-metadata.mjs --package <package.yapk> --id-provenance <id-provenance-report.json>
```

YAPK upgrade/new-version packages must also prove ID continuity against the previous version before signing, upgrade-check, upgrade apply, install-like writes, or handoff:

```sh
node scripts/validate-yapk-upgrade-id-stability.mjs \
  --previous-package <previous.yapk> \
  --previous-manifest <previous-id-lineage.json> \
  --new-package <package.yapk> \
  --new-manifest <new-id-lineage.json>
```

Dashboard-heavy generated-final `.yapk` packages must also pass the dashboard grid-table Collection gate when the plan claims that pattern:

```sh
node scripts/validate-dashboard-grid-table-collections.mjs --package <package.yapk> --require-grid-table-collections --require-hide-header --require-visible-title
```

High-quality UI, Summary/KPI, and runtime-evidence claims must also pass the UI hard gates from `docs/standards/ui-summary-kpi-runtime-hard-gates.md`:

```sh
node scripts/inspect-yeeflow-ui-design-contract.mjs --contract <ui-contract.md> --claim-high-quality-ui
node scripts/inspect-dashboard-style-shapes.mjs --package <package.yapk>
node scripts/inspect-dashboard-summary-control-contract.mjs --package <package.yapk>
node scripts/inspect-visible-kpi-runtime-bindings.mjs --evidence <redacted-runtime-evidence.json>
node scripts/inspect-runtime-evidence.mjs --evidence <redacted-runtime-evidence.json> --claim-high-quality-ui
node scripts/inspect-grid-table-quality.mjs --package <package.yapk> --require-grid-table
node scripts/inspect-yapk-upgrade-app-identity.mjs --package <package.yapk> --lineage <lineage.json>
node scripts/test-ui-hard-gates-all.mjs
```

When a task claims high-quality dashboard/UI output, route through `yeeflow-ui-generation-hard-gates` before package generation or handoff. High-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

Phase 1 and Phase 2 are stable closed-loop capabilities. Phase 3A makes the workflow stricter in hard-gate guidance and regression tests: design/mockup work must generate and validate a UI contract first, UI upgrades must validate a declared page/scope manifest, and runtime evidence plus structural comparison is required before design fidelity claims. Package validation/signing/install/upgrade success is not visual proof, and upgrade-check or upgrade-apply success is not a replacement for runtime evidence. Dynamic KPI proof remains separate and requires before/after mutation evidence. Real Marketing Event private artifacts are not committed; regression fixtures are synthetic/inspired.

Phase 3B is the workflow enforcement layer. Phase 3B closes the planned UI-quality track; after Phase 3B, future work is normal incremental improvement unless a new runtime issue class appears. The workflow enforcement helper purpose is to validate the final metadata/report chain before high-quality UI, runtime UI quality, design fidelity, or dynamic KPI proof is claimed. High-quality UI claims require evidence chain, not just install success: UI contract, UI contract validation, scope manifest and scope validation for upgrades, runtime evidence, design/runtime structure findings, workflow enforcement findings, and before/after KPI mutation evidence when dynamic KPI proof is claimed. Standard artifact paths are `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md`, `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json`, `docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json`, `dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json`, `dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json`, and `dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json`. Run `node scripts/inspect-ui-closed-loop-workflow-enforcement.mjs --workflow <workflow-report.json-or-md>` before final UI-quality or design-fidelity claims. Dynamic KPI proof remains separate.

Start runtime proof reports from `docs/examples/runtime-evidence.redacted.example.json`. The template is synthetic and redacted, labels fallback KPI values as fallback, and is shaped for `scripts/inspect-runtime-evidence.mjs` plus `scripts/inspect-visible-kpi-runtime-bindings.mjs`. Run `node scripts/test-ui-hard-gates-all.mjs` before claiming UI quality.

`scripts/test-ui-generation-hard-gate-skills.mjs` validates `yeeflow-ui-generation-hard-gates` in both supported layouts: source layout `skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md` and installed plugin cache layout `skills/yeeflow-ui-generation-hard-gates/SKILL.md`. The test reports which path is used, fails only when neither path exists, and does not weaken UI/Summary/KPI hard-gate wording checks.

The materialized Codex plugin cache must include the hard-gate cache artifacts under `scripts/`: `validate-yapk-id-provenance.mjs`, `validate-yapk-navigation-runtime-metadata.mjs`, `validate-yapk-upgrade-id-stability.mjs`, `validate-dashboard-grid-table-collections.mjs`, `generate-ui-contract-from-design.mjs`, `capture-runtime-ui-evidence.mjs`, `validate-ui-upgrade-scope.mjs`, `compare-design-to-runtime-structure.mjs`, `inspect-ui-closed-loop-workflow-enforcement.mjs`, `inspect-application-layout-design-rules.mjs`, `inspect-yeeflow-ui-design-contract.mjs`, `inspect-dashboard-style-shapes.mjs`, `inspect-dashboard-summary-control-contract.mjs`, `inspect-visible-kpi-runtime-bindings.mjs`, `inspect-runtime-evidence.mjs`, `inspect-grid-table-quality.mjs`, `inspect-yapk-upgrade-app-identity.mjs`, `decode-yapk-tolerant-brotli.mjs`, `yapk-first-generation-preflight.mjs`, `test-yapk-id-navigation-hard-gates.mjs`, `test-yapk-upgrade-id-stability.mjs`, `test-dashboard-grid-table-collections.mjs`, `test-ui-closed-loop-phase1.mjs`, `test-ui-closed-loop-phase2.mjs`, `test-ui-closed-loop-phase3.mjs`, `test-ui-closed-loop-phase3b.mjs`, `test-application-layout-design-rules.mjs`, and `test-ui-summary-kpi-runtime-hard-gates.mjs`. The root source copies and `dist/yeeflow-app-builder-plugin/scripts/` mirrors must stay byte-identical.

Generated design images for Yeeflow apps must declare one official application layout before they are used as UI implementation references. PNG/JPEG layout screenshots are the primary visual references for header/navigation/content safe-area geometry and dropdown or expanded menu behavior; YAPK exports are supporting structural references. Use `docs/standards/yeeflow-application-layout-design-rules.md` and run `scripts/inspect-application-layout-design-rules.mjs` to require one consistent layout across all page images in the same app and to block unsupported arbitrary app shells, custom sidebars, custom top bars, floating navigation chrome, or content that overlaps the selected Yeeflow safe area. If image verification is not automated, mark `human_review_required`; screenshot-derived rules are human-reviewed derived rules, not pixel-perfect or automated screenshot proof.

The ID provenance report must prove API-issued content IDs from `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden for generated-final `.yapk` output. Runtime navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. Do not use `children` / `Childs` runtime navigation groups.

For YAPK upgrades, existing semantic resources must keep their previous IDs. Only newly added resources may receive newly API-issued IDs, removed IDs must not be reused for different objects, and a missing previous package or lineage manifest fails closed.

Dashboard grid-table Collection sections must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must share one wrapper with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`; planned row-click details require Collection link metadata and a Type `1` custom detail layout. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

High-quality UI requires a page-by-page implementation contract, export-proven control/style shapes, and runtime screenshot evidence. Summary/KPI controls require designer-shaped metadata and runtime evidence. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape: UUID Summary IDs, `Resource.ReportIds[]`, `Resource.exts[]` with `category: "___Pivot___"` and `key: "summary"`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, and complete field metadata. Before claiming proof, capture before/after source data mutation evidence, expected values, inspector output, and refreshed/recalculated after-evidence; Summary recalculation can be asynchronous or cache-delayed. Other shapes remain unproven unless focused runtime proof exists, and fallback KPI values must be labeled as fallback. Upgrade UI packages must preserve ListSetID, app identity, existing IDs, package lineage, and final `ReplaceIds` coverage.

KPI Runtime Binding Proof v1.0.1 proves the exact UUID Summary shape only. Do not generalize it to semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, or other visible binding shapes. Marketing Event dashboards may use this shape, but must still run their own before/after mutation proof before claiming runtime dynamic KPI success.

Local validation is not import proof, and API acceptance is not runtime proof. Report the exact proof boundary when delivering generated work.
