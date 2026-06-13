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

Expected plugin: `Yeeflow App Builder` version `0.6.33`.

## Configure Local Environment

Normal OAuth and workspace discovery do not require `.env.local`; the file may be absent or empty. Fixed API/OAuth defaults are bundled by the plugin.

```env
# No required values for normal OAuth + workspace discovery.
```

Run OAuth login before API access. OAuth uses Authorization Code with PKCE S256, and the plugin generates the `code_verifier`. No OAuth client secret is required for normal login/refresh. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.33
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
```

The materialized Codex plugin cache must include the hard-gate cache artifacts under `scripts/`: `validate-yapk-id-provenance.mjs`, `validate-yapk-navigation-runtime-metadata.mjs`, `validate-yapk-upgrade-id-stability.mjs`, `validate-dashboard-grid-table-collections.mjs`, `inspect-yeeflow-ui-design-contract.mjs`, `inspect-dashboard-style-shapes.mjs`, `inspect-dashboard-summary-control-contract.mjs`, `inspect-visible-kpi-runtime-bindings.mjs`, `inspect-runtime-evidence.mjs`, `inspect-grid-table-quality.mjs`, `inspect-yapk-upgrade-app-identity.mjs`, `decode-yapk-tolerant-brotli.mjs`, `yapk-first-generation-preflight.mjs`, `test-yapk-id-navigation-hard-gates.mjs`, `test-yapk-upgrade-id-stability.mjs`, `test-dashboard-grid-table-collections.mjs`, and `test-ui-summary-kpi-runtime-hard-gates.mjs`. The root source copies and `dist/yeeflow-app-builder-plugin/scripts/` mirrors must stay byte-identical.

The ID provenance report must prove API-issued content IDs from `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden for generated-final `.yapk` output. Runtime navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. Do not use `children` / `Childs` runtime navigation groups.

For YAPK upgrades, existing semantic resources must keep their previous IDs. Only newly added resources may receive newly API-issued IDs, removed IDs must not be reused for different objects, and a missing previous package or lineage manifest fails closed.

Dashboard grid-table Collection sections must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must share one wrapper with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`; planned row-click details require Collection link metadata and a Type `1` custom detail layout. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

High-quality UI requires a page-by-page implementation contract, export-proven control/style shapes, and runtime screenshot evidence. Summary/KPI controls require designer-shaped metadata and runtime evidence; dynamic visible KPI binding is not solved unless runtime-proven, and fallback KPI values must be labeled as fallback. Upgrade UI packages must preserve ListSetID, app identity, existing IDs, package lineage, and final `ReplaceIds` coverage.

Local validation is not import proof, and API acceptance is not runtime proof. Report the exact proof boundary when delivering generated work.
