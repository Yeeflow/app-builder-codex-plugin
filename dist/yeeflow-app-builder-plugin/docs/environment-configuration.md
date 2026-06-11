# Environment Configuration

Use `.env.local` for local-only Yeeflow API and OAuth settings. The file must stay gitignored and must never be committed.

## API Base And Tenant URL

Use the shared API base for API calls:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
```

Use the tenant URL only for links:

```env
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

Do not use a tenant URL as the API base. Treat `YEEFLOW_BASE_URL` as a legacy API-base alias only.

## Single-Tenant Setup

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_API_KEY=<your Yeeflow API key>
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id>
YEEFLOW_WORKSPACE_ID=<your workspace id>
```

## OAuth Setup

Browser OAuth is preferred for user-facing API work:

```env
YEEFLOW_OAUTH_CLIENT_ID=<your OAuth client id>
YEEFLOW_OAUTH_CLIENT_SECRET=<your local OAuth client secret>
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

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
YEEFLOW_DEV_API_KEY=<dev key>
YEEFLOW_DEV_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_DEV_TENANT_ID=<dev tenant id>
YEEFLOW_DEV_WORKSPACE_ID=<dev workspace id>
```

## Package Automation

Package upload/import/install/upgrade helpers default to dry-run behavior and require explicit confirmation for live operations. Use `YEEFLOW_WORKSPACE_ID` or the active profile workspace variable when a package operation needs workspace context.

## Security Reminders

Never print or commit API keys, OAuth tokens, client secrets, authorization codes, cookies, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, cert/key files, or local cache folders.
