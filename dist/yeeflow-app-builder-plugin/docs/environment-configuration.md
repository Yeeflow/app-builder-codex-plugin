# Environment Configuration

Use `.env.local` for local-only Yeeflow tenant/workspace settings and, only when needed, private OAuth fallback secrets. The file must stay gitignored and must never be committed.

## API Base And Tenant URL

The plugin provides the shared API base for API calls:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
```

Do not put this in `.env.local` unless overriding the plugin default for development/testing.

Use the tenant URL only for links:

```env
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

Do not use a tenant URL as the API base. Treat `YEEFLOW_BASE_URL` as a legacy API-base alias only.

## Single-Tenant Setup

Case A, already authenticated / normal API use:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

Case B, OAuth login/refresh when confidential-client fallback is required:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
# Needed when confidential-client fallback is required for OAuth login/refresh:
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
```

Case A is enough for package workspace context and normal API use when OAuth is already authenticated. Use Case B when login/refresh needs confidential-client fallback. Do not commit or paste the client secret.

## OAuth Setup

Browser OAuth is preferred for user-facing API work. The plugin provides defaults for:

```env
YEEFLOW_OAUTH_CLIENT_ID=266479ba-1f82-463b-856d-9a50b6166e0d
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

Override these only for development/testing.

OAuth login tries PKCE/no-secret exchange first. Refresh also tries no-secret first, but the current Yeeflow OAuth configuration may still require confidential-client fallback. If Yeeflow rejects public-client PKCE exchange or refresh, configure a private local client secret as fallback only:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
# Needed when confidential-client fallback is required for OAuth login/refresh:
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
```

The client secret must stay in ignored `.env.local`; the plugin does not bundle secrets. Remove the fallback later only after auth-only testing proves Yeeflow supports PKCE login and refresh without a client secret for the configured client.

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

Normal API calls use OAuth when a valid local OAuth token is available. `YEEFLOW_API_KEY` is no longer required for read-only OAuth/API calls. If the stored OAuth token is expired and refresh is needed, the helper tries no-secret refresh first and falls back to `YEEFLOW_OAUTH_CLIENT_SECRET` only when configured locally. Current auth-only testing shows this fallback may still be required for refresh with the configured Yeeflow OAuth client. If configured, `YEEFLOW_API_KEY` is treated as a legacy/deprecated fallback for older internal workflows and must never be printed or committed.

## Security Reminders

Never print or commit API keys, OAuth tokens, client secrets, authorization codes, cookies, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, cert/key files, or local cache folders.
