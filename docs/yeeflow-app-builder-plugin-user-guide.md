# Yeeflow App Builder User Guide

Use Yeeflow App Builder when you need Codex to work with Yeeflow application packages, validation rules, UI generation guidance, runtime-test planning, or safe API capability lookup.

## Install

Use source https://github.com/Yeeflow/app-builder-codex-plugin.git, Git ref `stable`, and sparse paths `.agents/plugins/marketplace.json` plus `dist/yeeflow-app-builder-plugin`.

## Expected Version

`0.6.29`

## Safe API Usage

Before Yeeflow API work, check OAuth/API auth status and the REST API capability map. Use only documented capabilities. Do not expose arbitrary raw API calls, secrets, raw responses, tenant URLs, full workspace IDs, or decoded private payloads.

`.env.local` can be empty for normal OAuth plus workspace discovery. `YEEFLOW_WORKSPACE_ID` is an optional default/override for package import/install/upgrade, not a required setup value. List workspaces with `node scripts/yeeflow-workspace-list.mjs --category <category>` and show only count, title, category, status, and redacted workspace ID previews. Package writes still require explicit target workspace confirmation and `--execute`.

## Generated-Final YAPK Hard Gates

Generated-final `.yapk` packages require API-issued content ID provenance and complete navigation runtime metadata before signing, install, upgrade-check, or handoff. The package must emit and validate an ID provenance manifest for IDs allocated through `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden.

Navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. `children` / `Childs` runtime navigation groups are forbidden. Signing or install acceptance does not prove ID provenance or navigation runtime metadata completeness.

## Dashboard Grid-Table Collection Gate

Generated-final `.yapk` dashboard record-list sections that require the grid-table pattern must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must be wrapped in one container with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`.

Planned row-click details require Collection link metadata and concrete Type `1` custom detail layouts. Dashboard header hiding, title/text styling, helper metadata leakage prevention, and Type `1` custom detail layout `LayoutView` values are validated separately from signing/install/schema acceptance because those do not prove dashboard runtime/designer fidelity.
