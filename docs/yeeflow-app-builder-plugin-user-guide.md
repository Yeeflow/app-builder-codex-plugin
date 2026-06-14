# Yeeflow App Builder User Guide

Use Yeeflow App Builder when you need Codex to work with Yeeflow application packages, validation rules, UI generation guidance, runtime-test planning, or safe API capability lookup.

## Install

Use source https://github.com/Yeeflow/app-builder-codex-plugin.git, Git ref `stable`, and sparse paths `.agents/plugins/marketplace.json` plus `dist/yeeflow-app-builder-plugin`.

## Expected Version

`0.6.39`

## Safe API Usage

Before Yeeflow API work, check OAuth auth status and the REST API capability map. OAuth login is required for normal user-facing API access. Use only documented capabilities. Do not expose arbitrary raw API calls, secrets, raw responses, tenant URLs, full workspace IDs, or decoded private payloads.

`.env.local` can be absent or empty for normal OAuth plus workspace discovery. `YEEFLOW_WORKSPACE_ID` is not a package write target mechanism; package import/install/upgrade ignores local workspace IDs and stops with `workspace_selection_required` until the user explicitly selects an API-discovered workspace. List all current workspaces with `node scripts/yeeflow-workspace-list.mjs --all`, or use `--category flowcraft` for app/package workspace selection. Show only count, title or user-facing fallback name, category, status, status provenance, and redacted workspace ID previews. If API title is blank and `Status: 1`, display `Shared Workspace`. Package writes still require explicit target workspace confirmation and `--execute`.

## Generated-Final YAPK Hard Gates

Generated-final `.yapk` packages require API-issued content ID provenance and complete navigation runtime metadata before signing, install, upgrade-check, or handoff. The package must emit and validate an ID provenance manifest for IDs allocated through `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden.

Navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. `children` / `Childs` runtime navigation groups are forbidden. Signing or install acceptance does not prove ID provenance or navigation runtime metadata completeness.

## Dashboard Grid-Table Collection Gate

Generated-final `.yapk` dashboard record-list sections that require the grid-table pattern must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must be wrapped in one container with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`.

Planned row-click details require Collection link metadata and concrete Type `1` custom detail layouts. Dashboard header hiding, title/text styling, helper metadata leakage prevention, and Type `1` custom detail layout `LayoutView` values are validated separately from signing/install/schema acceptance because those do not prove dashboard runtime/designer fidelity.

## UI Summary/KPI Hard Gates

High-quality UI requires a page-by-page UI implementation contract, and scaffold-like UI must not be claimed as high-quality UI. Uncertain UI/runtime patterns require sandbox-page proof first. Use export-proven Yeeflow control/style shapes.

Summary/KPI controls require designer-shaped hidden Summary configuration. Summary controls must bind real fields, filters, temp variables, `save_var` expression objects, and `ReportIds`. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape with UUID Summary IDs, matching `Resource.ReportIds[]`, matching `Resource.exts[]`, dashboard `Resource.tempVars[]`, designer-shaped `attrs.save_var`, visible `attrs.headc.title.variable[]`, complete field metadata, before/after mutation proof, and refreshed/recalculated runtime evidence. For every other shape, visible KPI dynamic binding is not considered solved unless runtime-proven; fallback KPI values must be explicitly labeled fallback.

Runtime screenshot/evidence is required before claiming UI quality. Install/signing/API acceptance is not runtime UI proof. UI upgrades must preserve ListSetID, app identity, existing IDs, lineage, and declared change scope. Use `yeeflow-ui-generation-hard-gates` when dashboard/UI/Summary/KPI generation or upgrade work is requested.

Version `0.6.39` releases the Summary layout-resource `ReportIds` contract fix. Layout-resource `Resource.ReportIds` is authoritative for Summary registration; top-level `Pages[].ReportIds` is optional compatibility metadata. Empty or missing top-level `Pages[].ReportIds` no longer fails Summary validation, but missing layout-resource `ReportIds`, matching `Resource.exts`, matching `Resource.tempVars`, Summary field/list metadata, or raw temp-variable visible text still fails. Dynamic KPI proof still requires the exact UUID Summary shape plus before/after mutation evidence. Marketing Event v1.0.17 static visible-value compatibility may pass with warnings only and is not dynamic KPI proof; Marketing Event v1.0.18 and the proven UUID KPI proof package pass.
