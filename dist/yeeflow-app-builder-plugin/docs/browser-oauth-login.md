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

Override these only for development/testing. OAuth login builds an Authorization Code + PKCE request and token exchange tries the public-client/no-secret path first. OAuth refresh also tries no-secret refresh first. Current auth-only testing shows refresh may still require confidential-client fallback for this Yeeflow OAuth configuration. If the Yeeflow OAuth client or server does not allow public-client PKCE exchange or refresh, the helpers fall back to a private local client secret when configured:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
# Needed when confidential-client fallback is required for OAuth login/refresh:
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
```

Keep the client secret local and private in ignored `.env.local`. The plugin does not bundle secrets. Remove this fallback later only after auth-only testing proves Yeeflow supports PKCE login and refresh without a client secret for the configured client.

Do not commit `.env.local`. Do not paste Yeeflow passwords, OAuth tokens, auth codes, cookies, Authorization headers, or client secrets into Codex chat.

## Commands

```bash
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-login.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-oauth-logout.mjs
node scripts/yeeflow-api-auth-smoke.mjs
```

`yeeflow-oauth-status` reports whether local OAuth token storage exists, whether it is expired, and whether a refresh token is present. Use `--refresh` to refresh when possible.

`yeeflow-oauth-login` starts a local HTTPS callback server, opens the Yeeflow authorization URL, validates returned OAuth state, exchanges the code with PKCE, and stores tokens locally. It prints only safe status messages, including whether the PKCE/no-secret path or confidential-client fallback was used.

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
2. Refresh stored OAuth token if expired and a refresh token exists. The helper tries no-secret refresh first and falls back to the private local client secret only if configured.
3. Legacy/deprecated `YEEFLOW_API_KEY` fallback if OAuth is unavailable.

OAuth requests attach `Authorization: Bearer <access_token>`. Legacy requests attach `apiKey` exactly as the existing package automation did. Scripts must never print Authorization headers, API keys, client secrets, OAuth tokens, auth codes, cookies, raw API responses, tenant IDs, private URLs, raw package payloads, screenshots, or generated runtime packages.

Before write operations such as package install or upgrade, confirm the active workspace and require explicit user approval. Local validation is not import proof, API acceptance is not runtime proof, and runtime proof applies only to the tested scope.

## Public Release Note

If a real OAuth client secret was used locally or shared outside secure channels during testing, rotate it before production/public release.
