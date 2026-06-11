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

Expected plugin: `Yeeflow App Builder` version `0.6.22`.

## Configure Local Environment

Create a gitignored `.env.local` only when local API/OAuth checks are needed. Use placeholders in docs and never commit real values.

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_WORKSPACE_ID=<your workspace id>

YEEFLOW_OAUTH_CLIENT_ID=<your OAuth client id>
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

## Validate Locally

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.22
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
