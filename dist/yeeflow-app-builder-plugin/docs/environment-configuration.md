# Environment Configuration

Use `.env.local` for local-only Yeeflow tenant/workspace settings. The file must stay gitignored and must never be committed.

## API Base And Tenant URL

The plugin provides the shared API base for API calls:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
```

Do not put this in `.env.local` unless overriding the plugin default for development/testing.

Tenant URL is not required for normal OAuth-backed API calls. After OAuth authorization, the plugin derives tenant/user context from the access token claims `tenantid`, `tenant`, and `accountid`; the `tenant` claim is used for tenant UI/browser links when available. Use `YEEFLOW_TENANT_URL` only as an optional manual override before token context is available:

```env
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

Raw tokens and full decoded token payloads are never printed. Do not use a tenant URL as the API base. Treat `YEEFLOW_BASE_URL` as a legacy API-base alias only.

## Single-Tenant Setup

Recommended `.env.local`:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional manual override for tenant UI/browser links before OAuth token context is available:
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

This is enough for package workspace context, OAuth login/refresh, and normal API use. `YEEFLOW_TENANT_URL` is fallback-only because OAuth token context normally provides the tenant link value after login.

## OAuth Setup

Browser OAuth is preferred for user-facing API work. The plugin provides defaults for:

```env
YEEFLOW_OAUTH_CLIENT_ID=266479ba-1f82-463b-856d-9a50b6166e0d
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

Override these only for development/testing.

OAuth login and refresh use Authorization Code with PKCE S256. The plugin creates the `code_verifier`, sends the matching `code_challenge`, and exchanges/refreshes tokens without a client secret:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional manual override for tenant UI/browser links before OAuth token context is available:
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

No OAuth client secret is required for normal login/refresh. Do not commit `.env.local`, OAuth tokens, authorization codes, PKCE verifiers, or private tenant/workspace values.

Commands:

```sh
node scripts/yeeflow-oauth-login.mjs
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-oauth-logout.mjs
```

## Multi-Tenant Profiles

Where scripts support profiles, set `YEEFLOW_PROFILE` to select one local profile for a run:

```env
YEEFLOW_PROFILE=DEV
YEEFLOW_DEV_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<dev tenant id>
YEEFLOW_DEV_WORKSPACE_ID=<dev workspace id>
# Legacy/deprecated fallback only:
YEEFLOW_DEV_API_KEY=<dev key>
```

## Package Automation

Package upload/import/install/upgrade helpers default to dry-run behavior and require explicit confirmation for live operations. Use `YEEFLOW_WORKSPACE_ID` or the active profile workspace variable when a package import/install/upgrade operation needs workspace context.

## Legacy API Key Fallback

Normal API calls use OAuth when a valid local OAuth token is available. `YEEFLOW_API_KEY` is no longer required for read-only OAuth/API calls. If the stored OAuth token is expired and refresh is needed, the helper refreshes without a client secret using the configured public-client PKCE flow. If configured, `YEEFLOW_API_KEY` is treated as a legacy/deprecated fallback for older internal workflows and must never be printed or committed.

## Security Reminders

Never print or commit API keys, OAuth tokens, client secrets, authorization codes, cookies, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, cert/key files, or local cache folders.
