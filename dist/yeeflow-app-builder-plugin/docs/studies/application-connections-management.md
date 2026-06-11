# Application Connections Management

Source export: `<downloads>/DEMO Innovation Ecosystem Platform.yap`

Inspection status: export-proven and locally validated only. All endpoint, OAuth, client, tenant, and token-like values must remain redacted.

## Export Location

Application connections are stored in `Data.OtherModules[]` where `Type = "Connections"`. The module `Data` is an array.

The studied export contains 3 connections:

| Name | Type | Provider class | Auth | Methods |
| --- | ---: | --- | --- | --- |
| Microsoft Graph - Outlook | 11 | OAuth 2.0 API | OAuth2.0 | GET, POST, DELETE, PATCH |
| HTTP Request | 10 | HTTP API / Generic | APIKey | GET |
| Microsoft Graph - SharePoint | 11 | OAuth 2.0 API | OAuth2.0 | GET, POST, PUT, DELETE, PATCH |

## Connection Shape

Export-proven keys:

`ID`, `Type`, `Name`, `Description`, `Config`, `Status`.

`Config` is an object in the decoded export.

For HTTP API / Generic (`Type = 10`), proven config keys:

`Environment`, `Timeout`, `BaseUrl`, `AuthenticationMethod`, `AllowedMethods`.

For OAuth 2.0 API (`Type = 11`), proven config keys:

`Environment`, `Timeout`, `BaseUrl`, `GrantType`, `AuthorizationMode`, `AuthorizationEndpoint`, `TokenEndpoint`, `ClientId`, `Scopes`, `AllowedMethods`, `AuthenticationMethod`.

## Redaction Rules

Never commit raw connection `Config` values for:

- `BaseUrl`
- `AuthorizationEndpoint`
- `TokenEndpoint`
- `ClientId`
- `ClientSecret`
- access tokens, refresh tokens, API keys, passwords, secrets
- tenant IDs, user IDs, endpoint secrets, token-like values

Use placeholders in docs and normalized references:

- `<REDACTED_ENDPOINT>`
- `<REDACTED_CLIENT_ID>`
- `<REDACTED_CLIENT_SECRET>`
- `<REDACTED_ACCESS_TOKEN>`
- `<REDACTED_TENANT_ID>`
- `<REDACTED_CONNECTION_ID>`

## Generation Policy

Generated packages should not include real connection settings. Connection-backed tools may be documented as placeholders only, and the imported app should require admin reconfiguration after import.

Do not include connection IDs in generated `ReplaceIds` unless export-back proves that Yeeflow remaps them safely. Treat source connection IDs as environment-specific.

Runtime tests must not call Outlook, SharePoint, OAuth, or HTTP external systems unless the user explicitly provides safe test credentials and confirms the call scope.

## Normalized Reference

See `docs/studies/normalized/application-connection-reference.normalized.json`.
