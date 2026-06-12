# Browser OAuth Login

Yeeflow App Builder supports local browser OAuth login for Yeeflow REST API helper scripts. OAuth is preferred for user-facing API work; legacy `YEEFLOW_API_KEY` remains available only as a deprecated fallback.

## Local Configuration

The plugin bundles fixed OAuth/API defaults:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_OAUTH_CLIENT_ID=266479ba-1f82-463b-856d-9a50b6166e0d
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

Override these only for development/testing. OAuth login builds an Authorization Code + PKCE S256 request. The plugin generates the `code_verifier`, sends the matching `code_challenge`, and exchanges/refreshes tokens without a client secret.

```env
# No required values for normal OAuth + workspace discovery.

# Optional default/override for package import/install/upgrade target selection:
# YEEFLOW_WORKSPACE_ID=<optional default workspace id>
# Optional manual override for tenant UI/browser links before OAuth token context is available:
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

After authorization, the plugin derives tenant/user context from access token claims `tenantid`, `tenant`, and `accountid`; the `tenant` claim is preferred for tenant UI/browser links. `YEEFLOW_TENANT_URL` is only an optional manual override before token context is available. Raw tokens, full decoded token payloads, raw workspace responses, and full workspace IDs are never printed. No OAuth client secret is required for normal login/refresh. The plugin does not bundle secrets.

Do not commit `.env.local`. Do not paste Yeeflow passwords, OAuth tokens, auth codes, cookies, Authorization headers, or client secrets into Codex chat.

## Commands

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

Live Yeeflow API helpers use this order:

1. Valid stored OAuth access token.
2. Refresh stored OAuth token without a client secret if expired and a refresh token exists.
3. Legacy/deprecated `YEEFLOW_API_KEY` fallback if OAuth is unavailable.

OAuth requests attach `Authorization: Bearer <access_token>`. Legacy requests attach `apiKey` exactly as the existing package automation did. Scripts must never print Authorization headers, API keys, client secrets, OAuth tokens, auth codes, cookies, raw API responses, tenant IDs, private URLs, raw package payloads, screenshots, or generated runtime packages.

Before write operations such as package install or upgrade, confirm the active workspace and require explicit user approval. Local validation is not import proof, API acceptance is not runtime proof, and runtime proof applies only to the tested scope.

## Public Release Note

If a real OAuth client secret was used locally or shared outside secure channels during testing, rotate it before production/public release.
