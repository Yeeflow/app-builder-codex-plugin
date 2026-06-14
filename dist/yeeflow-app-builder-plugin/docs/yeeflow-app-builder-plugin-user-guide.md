# Yeeflow App Builder User Guide

Use Yeeflow App Builder when you need Codex to work with Yeeflow application packages, validation rules, UI generation guidance, runtime-test planning, or safe API capability lookup.

## Install

Use source https://github.com/Yeeflow/app-builder-codex-plugin.git, Git ref `stable`, and sparse paths `.agents/plugins/marketplace.json` plus `dist/yeeflow-app-builder-plugin`.

## Expected Version

`0.6.42`

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

Version `0.6.42` releases Phase 3A UI closed-loop hard gates. It makes the closed-loop workflow mandatory for high-quality UI, design/mockup, dashboard redesign, runtime-proof, Marketing Event-style, and one-page-at-a-time work. It requires UI contract generation, UI contract validation, scope manifest, scope validation, local UI/package hard gates, write confirmation before signing/install/upgrade, redacted runtime evidence, design/runtime structure comparison, and iteration on exact failing controls. It reinforces that package validation, signing, install, upgrade-check, and upgrade-apply success are not visual proof, and that dynamic KPI proof requires before/after mutation evidence. It adds Marketing Event-inspired synthetic regressions for missing design contract, missing runtime evidence, one-page scope drift, Summary layout-resource ReportIds/exts/tempVars, top-level Pages[].ReportIds optional-only boundary, Summary save_var.name and COUNT ListDataID, grid-table detail-link/template/column failures, fake upgrade success evidence, missing table section, plain scaffold/placeholder detection, warning vs --strict, and dynamic KPI proof boundary. Phase 3B/future work remains deeper workflow enforcement around Phase 2 findings, broader synthetic Marketing Event regression expansion, and live runtime automation only after explicit authorization.

Version `0.6.41` releases Phase 2 design-to-runtime structural comparison. It adds `compare-design-to-runtime-structure.mjs` to compare UI contract expectations against redacted runtime evidence, accepts Phase 1 evidence from `capture-runtime-ui-evidence.mjs`, and treats design images as review-required references unless a reliable image parser exists. It produces structured JSON/Markdown findings for page/section mismatch, KPI count/label/value mismatch, table section/header/column mismatch, missing filters/actions, missing or weak badges, weak card/spacing/scaffold signals, placeholder/raw-variable text, weak runtime evidence, design image review requirements, and dynamic KPI proof boundaries. This release does not claim pixel-perfect visual diffing, full automatic image understanding, or dynamic KPI proof. Dynamic KPI proof remains governed by existing before/after mutation evidence rules, warning status exits 0, fail status exits nonzero, and `--strict` makes warnings exit nonzero. Phase 3 remains deeper hard-gate integration, stronger workflow enforcement around Phase 2 findings, and expanded Marketing Event regression coverage.

Phase 1 and Phase 2 are now stable closed-loop capabilities. Phase 3A makes the workflow stricter in hard-gate guidance and regression tests: design/mockup requests must generate and validate a UI implementation contract, UI upgrades must validate a declared page/scope manifest, and runtime evidence plus structural comparison is required before design fidelity claims. Package validation/signing/install/upgrade success is not visual proof, and upgrade-check or upgrade-apply success is not enough to claim runtime UI quality. Dynamic KPI proof remains separate and requires before/after mutation evidence. Real Marketing Event private artifacts are not committed; regression fixtures are synthetic/inspired.
