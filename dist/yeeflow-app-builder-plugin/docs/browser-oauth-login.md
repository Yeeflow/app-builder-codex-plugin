# Browser OAuth Login

Yeeflow App Builder supports local browser OAuth login for Yeeflow REST API helper scripts. OAuth is the standard path for user-facing API work; legacy `YEEFLOW_API_KEY` remains available only as a deprecated fallback for older internal workflows.

## Local Configuration

The plugin bundles fixed OAuth/API defaults. Override them only for development/testing. OAuth login builds an Authorization Code + PKCE S256 request. The plugin generates the `code_verifier`, sends the matching `code_challenge`, and exchanges/refreshes tokens without a client secret.

```env
# No required values for normal OAuth + workspace discovery.
```

After authorization, the plugin derives tenant/user context from access token claims. Raw tokens, full decoded token payloads, tenant IDs, tenant URLs, raw workspace responses, and full workspace IDs are never printed. No OAuth client secret is required for normal login/refresh. The plugin does not bundle secrets.

Do not commit `.env.local`. Do not paste Yeeflow passwords, OAuth tokens, auth codes, cookies, Authorization headers, or client secrets into Codex chat.

## Normal Plugin Login Flow

For normal user-facing API requests, do not tell users to run local Node OAuth scripts. If OAuth is missing or expired, say: `Please sign in to Yeeflow using the plugin login flow so I can continue this operation.` Preserve the original operation. If the current runtime cannot start the plugin login action, say: `I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`

Preserve the original requested API action, such as `positions.list`, so the user can retry after login completes.

## Developer CLI Diagnostics

The following commands are developer/local diagnostic tools only. They are not the normal user-facing login path:

```bash
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-login.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-oauth-logout.mjs
node scripts/yeeflow-api-auth-smoke.mjs
```

`yeeflow-oauth-status` reports whether local OAuth token storage exists, whether it is expired, whether a refresh token is present, and safe tenant-claim presence booleans. It does not print tenant values or decoded payloads. Use `--refresh` to refresh when possible.

`yeeflow-oauth-login` starts a local HTTPS callback server, opens the Yeeflow authorization URL, validates returned OAuth state, exchanges the code with PKCE, and stores tokens locally. It prints only safe status messages, including whether the PKCE/no-secret path was used.

`yeeflow-oauth-refresh` refreshes an expired or near-expired access token using the stored refresh token.

`yeeflow-oauth-logout` deletes local token storage. Remote revocation is not implemented because no revoke endpoint is configured.

`yeeflow-api-auth-smoke` is dry-run by default. Add `--execute` to perform one documented read-only call to `GET /locations`. The smoke command reports HTTP/API status, response keys, and data shape only.

## Local HTTPS Callback

The registered callback URLs are:

```text
https://127.0.0.1:53720/callback
https://127.0.0.1:53721/callback
https://127.0.0.1:53722/callback
https://127.0.0.1:53723/callback
https://127.0.0.1:53724/callback
```

The login helper picks the first available port. It does not fall back to HTTP.

By default it expects local development certificate files at:

```text
.yeeflow-oauth/localhost-cert.pem
.yeeflow-oauth/localhost-key.pem
```

These paths are ignored by Git. You may instead set `YEEFLOW_OAUTH_CALLBACK_CERT_FILE` and `YEEFLOW_OAUTH_CALLBACK_KEY_FILE` to certificate and key files outside the repository. Do not commit certificate private keys.

## Token Storage

Default token file:

```text
~/.yeeflow/codex-oauth-token.json
```

The file contains access token, refresh token, expiry timestamp, token type, scope, and ID token if Yeeflow returns one. It is written with owner read/write permissions where supported. Override with `YEEFLOW_OAUTH_TOKEN_FILE` only to an ignored local path.

## API Authentication Behavior

Normal Yeeflow API helpers use this order:

1. Valid stored OAuth access token.
2. Refresh stored OAuth token without a client secret if expired and a refresh token exists.
3. If OAuth is unavailable, request the Yeeflow plugin login flow and preserve the original operation. If the plugin login action is unavailable in this runtime, say: `I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`

OAuth requests attach `Authorization: Bearer <access_token>`. Legacy API-key fallback may remain in older internal helpers but is not part of normal plugin/API operation. Scripts must never print Authorization headers, API keys, client secrets, OAuth tokens, auth codes, cookies, raw API responses, tenant IDs, private URLs, raw package payloads, screenshots, or generated runtime packages.

Before write operations such as package install or upgrade, discover `flowcraft` workspaces with OAuth, confirm the selected target workspace, and require explicit user approval. Local validation is not import proof, API acceptance is not runtime proof, and runtime proof applies only to the tested scope.

## Public Release Note

If a real OAuth client secret was used locally or shared outside secure channels during testing, rotate it before production/public release.
