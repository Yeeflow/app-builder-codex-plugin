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

Expected plugin: `Yeeflow App Builder` version `0.6.25`.

## Configure Local Environment

Create a gitignored `.env.local` only when local API/OAuth checks or package workspace operations are needed. Fixed API/OAuth defaults are bundled by the plugin; use placeholders in docs and never commit real values.

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

This minimal form is enough for package workspace context and normal API use when OAuth is already authenticated. OAuth login tries PKCE/no-secret first. Refresh also tries no-secret first, but the current Yeeflow OAuth configuration may still require `YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>` in `.env.local` as a private fallback. Keep it private and local; the plugin does not bundle secrets. `YEEFLOW_API_KEY` is not required for normal OAuth-backed API calls and is retained only as a legacy/deprecated fallback.

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.25
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

Local validation is not import proof, and API acceptance is not runtime proof. Report the exact proof boundary when delivering generated work.
