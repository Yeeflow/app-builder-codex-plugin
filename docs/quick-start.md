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

Expected plugin: `Yeeflow App Builder` version `0.6.28`.

## Configure Local Environment

Create a gitignored `.env.local` only when local API/OAuth checks or package workspace operations are needed. Fixed API/OAuth defaults are bundled by the plugin; use placeholders in docs and never commit real values.

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional manual override for tenant UI/browser links before OAuth token context is available:
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

This form is enough for package workspace context, OAuth login/refresh, and normal API use. OAuth uses Authorization Code with PKCE S256, and the plugin generates the `code_verifier`. No OAuth client secret is required for normal login/refresh. OAuth access token claims `tenantid`, `tenant`, and `accountid` provide tenant/user context after authorization, so `YEEFLOW_TENANT_URL` is only an optional manual override for tenant UI/browser links before token context is available. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.28
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
```

Do not use guessed paths or arbitrary raw API calls. Mutating capabilities and package operations require explicit confirmation.

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
