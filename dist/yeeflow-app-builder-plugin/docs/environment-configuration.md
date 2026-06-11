# Environment Configuration

Use `.env.local` for local-only Yeeflow tenant/workspace settings and private OAuth secrets. The file must stay gitignored and must never be committed.

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

Recommended minimal `.env.local`:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
# Optional only if tenant UI/browser links are needed:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

## OAuth Setup

Browser OAuth is preferred for user-facing API work. The plugin provides defaults for:

```env
YEEFLOW_OAUTH_CLIENT_ID=266479ba-1f82-463b-856d-9a50b6166e0d
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

Override these only for development/testing.

The current token exchange/refresh implementation still requires a private local client secret:

```env
YEEFLOW_WORKSPACE_ID=<your workspace id>
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
# Optional:
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

The client secret must stay in `.env.local`; the plugin does not bundle secrets. Implement PKCE/no-secret native OAuth later if the Yeeflow OAuth client can support public-client token exchange.

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

Normal API calls use OAuth when a valid local OAuth token is available. `YEEFLOW_API_KEY` is no longer required for read-only OAuth/API calls. If configured, it is treated as a legacy/deprecated fallback for older internal workflows and must never be printed or committed.

## Security Reminders

Never print or commit API keys, OAuth tokens, client secrets, authorization codes, cookies, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, cert/key files, or local cache folders.
