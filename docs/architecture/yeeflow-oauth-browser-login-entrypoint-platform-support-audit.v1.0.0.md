# Yeeflow OAuth Browser-Login Entrypoint Platform-Support Audit

## Decision

`PLUGIN_YEEFLOW_OAUTH_BROWSER_LOGIN_ENTRYPOINT_UI_BLOCKER_RETAINED_HOST_FLOW_ACCEPTED`

The custom Plugin UI/MCP conclusion is historical evidence only. It does not apply to host-triggered browser OAuth initiated by an already authorized API operation.

## Evidence

The installed Codex Plugin manifest contract provides Skills, MCP servers, and Apps. It does not provide a declarative action, command, browser-login, or local-handler field. An App manifest records only an existing connector ID and an optional category; it cannot define a local executable, a PKCE configuration, a callback URL, or token storage.

MCP remains outside this request. Marketplace authentication policy controls only authentication timing and supplies none of the required OAuth handler semantics. The existing host-only login flow is invoked by the API-auth continuation instead of by a Plugin UI component.

## Required Prerequisite

The Plugin contract still has no native entrypoint: A native user-action or login registration surface is required to invoke a Plugin-owned local OAuth handler directly from Plugin UI.

The existing developer diagnostic script remains non-user-facing. The ordinary path is a user-requested API operation that detects missing or unusable OAuth, starts the local browser flow, and resumes that same operation once after successful authorization.

## Boundaries Preserved

No signing, installation, release, promotion, active-installation change, historical ZIP change, protected-duplicate change, or Git operation was performed. MCP wiring remains absent. No OAuth token, TLS certificate, private key, or credential was created, logged, or archived by this audit.
