# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.41
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.41` releases Phase 2 design-to-runtime structural comparison. It adds `compare-design-to-runtime-structure.mjs` to compare UI contract expectations against redacted runtime evidence, accepts Phase 1 evidence from `capture-runtime-ui-evidence.mjs`, and treats design images as review-required references unless a reliable image parser exists. It produces structured JSON/Markdown findings for page/section mismatch, KPI count/label/value mismatch, table section/header/column mismatch, missing filters/actions, missing or weak badges, weak card/spacing/scaffold signals, placeholder/raw-variable text, weak runtime evidence, design image review requirements, and dynamic KPI proof boundaries. This release does not claim pixel-perfect visual diffing, full automatic image understanding, or dynamic KPI proof. Dynamic KPI proof remains governed by existing before/after mutation evidence rules, warning status exits 0, fail status exits nonzero, and `--strict` makes warnings exit nonzero. Phase 3 remains deeper hard-gate integration, stronger workflow enforcement around Phase 2 findings, and expanded Marketing Event regression coverage.

The UI/Summary/KPI runtime hard gates and UI generation hard-gate skill routing remain active. High-quality UI requires a page-by-page UI implementation contract, uncertain UI/runtime patterns require sandbox-page proof first, and export-proven Yeeflow control/style shapes are required or preferred before real pages are changed. Summary/KPI controls require designer-shaped hidden Summary configuration with real fields, filters, temp variables, `save_var` expression objects, and `ReportIds`. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with UUID Summary IDs, matching `Resource.ReportIds[]`, matching `Resource.exts[]`, dashboard `Resource.tempVars[]`, visible `attrs.headc.title.variable[]`, and before/after mutation proof. For every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven, fallback KPI values must be explicitly labeled fallback, and runtime screenshot/evidence is required before claiming UI quality. Install/signing/API acceptance is not runtime UI proof. UI upgrades must preserve ListSetID, app identity, existing IDs, lineage, and declared change scope. Scaffold-like UI must not be claimed as high-quality UI. The reusable `yeeflow-ui-generation-hard-gates` skill is available and routed from relevant generator, dashboard, package, runtime, and learning skills.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
