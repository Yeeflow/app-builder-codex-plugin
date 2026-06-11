# Environment Configuration

Yeeflow App Builder uses local credentials only when a user explicitly runs API/OAuth helper workflows. Do not commit `.env.local`, OAuth token files, certs, keys, raw API responses, private tenant URLs, or decoded private payloads.

Common local variables for development:

```env
YEEFLOW_API_BASE_URL=https://api.yeeflow.com/v1
YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
YEEFLOW_TENANT_ID=<optional tenant id>
YEEFLOW_WORKSPACE_ID=<optional workspace id for package dry-run shape checks>
YEEFLOW_OAUTH_CLIENT_ID=266479ba-1f82-463b-856d-9a50b6166e0d
YEEFLOW_OAUTH_AUTH_URL=https://login.yeeflow.com/connect/authorize
YEEFLOW_OAUTH_TOKEN_URL=https://login.yeeflow.com/connect/token
YEEFLOW_OAUTH_SCOPES="basic_api openid offline_access"
```

Legacy `YEEFLOW_API_KEY` fallback is supported by helpers when OAuth is unavailable, but users should store credentials locally and never paste secrets into chat.
