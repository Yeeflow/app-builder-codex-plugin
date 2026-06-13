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

Expected plugin: `Yeeflow App Builder` version `0.6.31`.

## Configure Local Environment

Normal OAuth and workspace discovery do not require `.env.local`; the file may be absent or empty. Fixed API/OAuth defaults are bundled by the plugin.

```env
# No required values for normal OAuth + workspace discovery.
```

Run OAuth login before API access. OAuth uses Authorization Code with PKCE S256, and the plugin generates the `code_verifier`. No OAuth client secret is required for normal login/refresh. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.31
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

Dashboard-heavy generated-final `.yapk` packages must also pass the dashboard grid-table Collection gate when the plan claims that pattern:

```sh
node scripts/validate-dashboard-grid-table-collections.mjs --package <package.yapk> --require-grid-table-collections --require-hide-header --require-visible-title
```

The materialized Codex plugin cache must include the hard-gate cache artifacts under `scripts/`: `validate-yapk-id-provenance.mjs`, `validate-yapk-navigation-runtime-metadata.mjs`, `validate-dashboard-grid-table-collections.mjs`, `yapk-first-generation-preflight.mjs`, `test-yapk-id-navigation-hard-gates.mjs`, and `test-dashboard-grid-table-collections.mjs`. The root source copies and `dist/yeeflow-app-builder-plugin/scripts/` mirrors must stay byte-identical.

The ID provenance report must prove API-issued content IDs from `GET /utils/generate/ids?count=<n>`. Local sequential, hardcoded, copied, random, timestamp, or UUID fallback IDs are forbidden for generated-final `.yapk` output. Runtime navigation groups require `ID`, `AppID`, `ListSetID`, `Type`, `Title`, `Icon`, and `list`; child items require `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`. Do not use `children` / `Childs` runtime navigation groups.

Dashboard grid-table Collection sections must use `collection`, not dashboard `data-list`, unless Data table is explicitly requested. Header `flex_grid` and Collection must share one wrapper with both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`; planned row-click details require Collection link metadata and a Type `1` custom detail layout. Signing/install acceptance does not prove dashboard runtime/designer visual fidelity.

Local validation is not import proof, and API acceptance is not runtime proof. Report the exact proof boundary when delivering generated work.
