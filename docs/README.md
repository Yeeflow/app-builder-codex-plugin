# App Builder Codex Plugin Docs

These docs support the Yeeflow App Builder Codex plugin.

Current install identity:

- Marketplace: Yeeflow
- Plugin: Yeeflow App Builder
- Version: `0.6.53`
- Dist path: `dist/yeeflow-app-builder-plugin`

Install source:

```text
Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
Git ref: stable
Sparse paths:
  .agents/plugins/marketplace.json
  dist/yeeflow-app-builder-plugin
```

## Start Here

- [Plugin installation](plugin-installation.md)
- [Quick start](quick-start.md)
- [Environment configuration](environment-configuration.md)
- [Workspace discovery and selection](workspace-discovery-and-selection.md)
- [Browser OAuth login](browser-oauth-login.md)
- [Yeeflow REST API capability map](yeeflow-rest-api-capability-map.md)
- [Local development policy](local-development-policy.md)
- [YAPK generation guardrails](yapk-generation-guardrails.md)
- [YAPK ID provenance hard gate](yapk-id-provenance-hard-gate.md)
- [YAPK upgrade ID stability hard gate](yapk-upgrade-id-stability-hard-gate.md)
- [Yeeflow control property knowledge base](standards/yeeflow-control-property-knowledge-base.md)
- [YAPK navigation runtime metadata gate](yapk-navigation-runtime-metadata-gate.md)
- [Dashboard grid-table Collection pattern](dashboard-grid-table-collection-pattern.md)
- [Generated dashboard UI quality gates](generated-dashboard-ui-quality-gates.md)
- [Redacted runtime evidence template](examples/runtime-evidence.redacted.example.json)
- [Application navigation generation rules](application-navigation-generation-rules.md)
- [Package signing and runtime proof boundaries](package-signing-and-runtime-proof-boundaries.md)
- [Release hygiene](release-hygiene.md)
- [Managed app connector design](yeeflow-codex-managed-app-connector.md)

## Skill Routing

- `yeeflow-ui-generation-hard-gates`: use before claiming high-quality dashboard/UI output, generating Summary/KPI dashboards, relying on runtime screenshot evidence, proving uncertain UI/control/style patterns on sandbox pages, or upgrading existing UI packages where ListSetID/app identity must remain stable. This skill owns the reusable page-by-page implementation contract, export-proven style/control shape, Summary/KPI proof-boundary, fallback KPI labeling, runtime screenshot, and UI upgrade lineage standards.

This routing means high-quality UI requires a page-by-page implementation contract; uncertain UI/runtime patterns should be proven on a sandbox page first; use export-proven Yeeflow control/style shapes; Summary/KPI controls require designer-shaped hidden Summary configuration; Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, layout-resource `Resource.ReportIds`, matching layout-resource `Resource.exts`, and layout-resource `Resource.tempVars`; top-level `Pages[].ReportIds` is optional compatibility metadata; dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with before/after mutation proof and refreshed/recalculated runtime evidence; Summary recalculation can be asynchronous or cache-delayed; semantic/non-UUID Summary IDs and other unsupported shapes remain unproven; for every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled as fallback; runtime screenshot evidence is required before claiming UI quality; install/signing/API acceptance is not runtime UI proof; UI upgrades must preserve ListSetID, app identity, existing IDs, and declared change scope; broad scaffold-like UI must not be claimed as high-quality UI. Data Analytics controls require UUID/runtime-safe IDs for Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, Summary, and Pivot table. Preserve existing Data Analytics control IDs during upgrades.

Use `examples/runtime-evidence.redacted.example.json` as the starting point for runtime proof reports consumed by `scripts/inspect-runtime-evidence.mjs` and `scripts/inspect-visible-kpi-runtime-bindings.mjs`. Run `node scripts/test-ui-hard-gates-all.mjs` before claiming UI quality. The KPI Runtime Binding Proof v1.0.1 proves only the exact UUID Summary shape: UUID Summary IDs, matching `Resource.ReportIds[]`, matching `Resource.exts[]` with `category: "___Pivot___"` and `key: "summary"`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, and complete Summary field metadata. Runtime proof must include before/after source data mutation evidence, expected-value notes, inspector output, and refreshed/recalculated after-evidence because Summary recalculation can be asynchronous or cache-delayed. Semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, and other visible binding shapes remain unproven unless focused runtime proof exists. Marketing Event dashboards may use this shape, but still need their own before/after mutation proof before claiming dynamic KPI success.

## Development Areas

- `../scripts/` contains reusable validation, OAuth/API, package automation, and schema utilities.
- `../schemas/` contains YAP/YAPK canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, plus the Codex YAPK overlay.
- `../skills/` and `../generated-skills/` contain source skill material.
- `studies/`, `standards/`, and `templates/` preserve sanitized research and generation rules.
- `legacy/yeeflow-codex-plugins/` preserves safe historical release notes and old investigation docs. It is not current install guidance.

## Safety

Do not commit `.env.local`, OAuth token files, cert/key files, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, screenshots, or local cache folders.

Use documented Yeeflow endpoints only. Mutating APIs and package operations require explicit confirmation.
