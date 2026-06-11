# Yeeflow Codex Managed App Connector Design

## Purpose

Yeeflow App Builder currently works as a Codex plugin with skills, local helper scripts, local browser OAuth, an OAuth/API authentication wrapper, and a documented Yeeflow REST API capability map. This is enough for local internal testing, but it does not create a Codex App connection row with `Connected`, `Reconnect`, and `Disconnect` controls.

This document describes the design path for adding a Codex-managed Yeeflow app connector while keeping the existing local OAuth helper flow intact.

## Current Limitation

The current plugin is skills-first:

- `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json` declares `skills`.
- The plugin interface currently advertises skills behavior.
- The repo has no active `.app.json`.
- Local OAuth scripts store credentials in a local token file and are not managed by Codex App.

Skills and local helper scripts do not create the Codex App connected-account UI. They can guide Codex and run local commands, but they do not register an external app connection with Codex.

Public connector-style plugins, such as Outlook Email, include an `apps` entry in `plugin.json` and a `.app.json` file. The `.app.json` file points to an existing platform-registered connector/app ID. It does not define OAuth URLs, scopes, tool schemas, or token storage by itself.

## Concepts

### Skills

Skills are workflow instructions and local knowledge. They teach Codex how to perform a task, what files to inspect, and what safety policies to follow. Skills do not create external account connections.

### Local Helper Scripts

Local helper scripts run from the repository or bundled plugin files. The current Yeeflow OAuth scripts:

- open a browser-based Yeeflow OAuth login flow,
- use local HTTPS callbacks,
- store tokens locally,
- refresh tokens locally,
- call documented Yeeflow REST API endpoints through local Node scripts.

These scripts are useful for internal development and smoke tests, but their credentials are outside Codex App managed connection storage.

### Codex App Integration

A Codex App integration is a managed connection shown in Codex App. It owns the user-facing connection lifecycle:

- connect,
- connected status,
- reconnect,
- disconnect,
- managed credential storage,
- tool authorization context.

The plugin repository can reference such an integration only after it exists as a registered app/connector.

### Hosted MCP Connector

A hosted MCP connector is the service behind the Codex-managed app integration. It exposes tools to Codex through a reachable HTTPS endpoint and performs Yeeflow API calls using the managed auth context.

The Yeeflow managed connector should not expose raw unrestricted REST calls. It should expose bounded tools that use the Yeeflow REST API capability map.

## Why `.app.json` Is Only A Reference

Installed public plugins use a structure like:

```json
{
  "apps": {
    "outlook-email": {
      "id": "connector_..."
    }
  }
}
```

The ID is an opaque platform connector/app ID. The file does not contain OAuth metadata or implementation code. It links the plugin to an existing connector registered outside the repository.

For Yeeflow, a future `.app.json` should only be activated after Yeeflow has a real registered connector/app ID.

## Disabled Example `.app.json`

Documentation-only example:

```json
{
  "apps": {
    "yeeflow": {
      "id": "connector_or_app_id_from_openai_registration"
    }
  }
}
```

This placeholder must not be added to the active plugin package or promoted to `stable`. A fake connector ID would create a broken app reference and could confuse install/cache smoke tests.

## Proposed Plugin Manifest Change

After a real connector/app ID exists, add an active `.app.json` file to the bundled plugin and update `plugin.json`:

```json
{
  "apps": "./.app.json"
}
```

The plugin interface can then advertise app-backed read behavior, and later write behavior if guarded write tools are added.

This change must be made on a feature branch and validated with Codex App install/cache smoke testing before any stable promotion.

## Hosted MCP Connector Design

### Initial Read-Only Tools

Start with read-only tools only:

- `list_capabilities`
- `get_capability`
- `locations_list`
- `call_readonly_capability`

`locations_list` should map directly to the documented `GET /locations` endpoint and return only safe summaries or response shape by default.

`call_readonly_capability` should accept a capability name and structured parameters. It must reject:

- unknown capability names,
- write capabilities,
- read-only non-GET capabilities until explicitly supported,
- arbitrary raw paths,
- arbitrary HTTP methods.

### Explicitly Excluded From The Initial Connector

Do not expose these by default:

- arbitrary raw API path calls,
- generic write calls,
- package upload/import/install/upgrade,
- delete operations,
- raw response file export,
- private tenant URL reporting,
- credential or token inspection.

### Capability Map Policy

The hosted connector should reuse or mirror the existing Yeeflow REST API capability map:

- use only documented endpoints,
- do not guess paths,
- classify read-only versus write operations,
- require explicit user confirmation for writes,
- require stronger confirmation for package operations,
- keep package install/import/upgrade/delete behind dedicated guarded tools,
- never expose an unrestricted raw API helper as a normal public capability.

The existing source of truth is `scripts/lib/yeeflow-api-capabilities.mjs`. The hosted connector can either import a shared copy at build time or maintain a generated synchronized copy with tests that compare names, methods, paths, and safety classifications.

## OAuth Compatibility Checklist

Before implementing managed auth, confirm:

- Does Yeeflow expose OAuth/OIDC metadata compatible with ChatGPT connector auth?
- Does Yeeflow support PKCE for the connector client type?
- Does Yeeflow support redirect URIs required by ChatGPT/Codex connector OAuth?
- Current local callbacks use `https://127.0.0.1:{53720-53724}/callback`; these are likely insufficient for managed connector auth.
- Does Yeeflow support refresh tokens with `offline_access`?
- Is a confidential client secret appropriate for the connector, or is dynamic client registration, CIMD, private-key JWT, or a public-client flow required?
- Is a token revoke endpoint available?
- Which scopes are needed for read-only tools first?
- Which additional scopes are needed for write tools later?
- Can managed connector auth use the existing Yeeflow OAuth endpoints?
  - Authorization URL: `https://login.yeeflow.com/connect/authorize`
  - Token URL: `https://login.yeeflow.com/connect/token`
  - Current local scopes: `basic_api openid offline_access`

Read-only connector scope should be as narrow as Yeeflow supports. If Yeeflow currently exposes only `basic_api`, document that limitation before public release.

## Migration And Fallback Plan

Current local token storage:

```text
~/.yeeflow/codex-oauth-token.json
```

Managed connector tokens would live in OpenAI/Codex-managed auth storage. They should not be copied into the local token file, and the local helper scripts should not read managed connector tokens.

Codex App `Disconnect` should clear or revoke the managed connector credential. It will not automatically delete `~/.yeeflow/codex-oauth-token.json`. If users want to clear local helper credentials, they should run:

```bash
node scripts/yeeflow-oauth-logout.mjs
```

Skills should prefer managed connector tools when the Yeeflow app is installed and connected. If the managed app is unavailable, skills may fall back to local helper scripts for internal and development workflows.

Fallback behavior should be explicit:

1. Check for managed connector tools.
2. If available and connected, use the connector.
3. If unavailable, check local OAuth/API helper status.
4. If neither is authenticated, ask the user to connect the Yeeflow app or run the local login helper.
5. Never ask users to paste passwords, auth codes, tokens, cookies, or client secrets into Codex chat.

## Reconnect And Disconnect Behavior

Reconnect should be owned by Codex App and should restart the managed connector auth flow.

Disconnect should be owned by Codex App and should clear the managed connector credential. If Yeeflow exposes a revoke endpoint, the connector should call it. If no revoke endpoint is available, disconnect should clear managed credentials and document that remote revocation is not supported.

Local helper logout remains separate because it clears local token storage only.

## Implementation Phases

### Phase 1: Read-Only Hosted MCP Prototype

- Build a hosted HTTPS MCP connector service.
- Implement read-only tools:
  - `list_capabilities`
  - `get_capability`
  - `locations_list`
  - `call_readonly_capability`
- Use the Yeeflow REST API capability map.
- Do not expose write or package-operation tools.
- Do not save raw API responses.

### Phase 2: Connector Registration

- Register the Yeeflow connector/app in the ChatGPT/Codex developer workflow.
- Complete OAuth compatibility review.
- Obtain the real connector/app ID.
- Add active `.app.json` and `plugin.json` `apps` entry on a feature branch only.
- Keep placeholder IDs out of `stable`.

### Phase 3: Internal Install/Cache Smoke

- Install the plugin from the feature branch.
- Confirm Codex App shows the Yeeflow connection row.
- Confirm `Connected`, `Reconnect`, and `Disconnect` behavior.
- Confirm `app/list` includes Yeeflow with the plugin display name.
- Confirm read-only `locations_list` works through the managed connector.

### Phase 4: Guarded Write Tools

- Add write tools only after review.
- Keep each write tool narrow and named.
- Require explicit confirmation.
- Require stronger confirmation and disposable workspace context for package upload/import/install/upgrade/delete.
- Preserve proof boundaries:
  - local validation is not import proof,
  - API acceptance is not runtime proof,
  - runtime proof applies only to tested scope.

## Risks And Blockers

- A real OpenAI/ChatGPT connector registration is required.
- A hosted HTTPS MCP endpoint is required.
- Yeeflow OAuth may need additional redirect URIs or connector-compatible auth support.
- Secure server-side token handling is required if the connector mediates OAuth.
- Remote revocation behavior is unknown until a revoke endpoint is confirmed.
- Managed connector tokens and local helper tokens are separate credentials.
- Connector review is required before public release.
- Existing local scripts must remain supported for internal development.
- Any active `.app.json` with a fake connector ID would break connection UX and must not be promoted.

## Recommended Future Implementation Prompt

```text
Implement a read-only Yeeflow managed app connector prototype.

Build a hosted HTTPS MCP connector service design or prototype that exposes only:
- list_capabilities
- get_capability
- locations_list
- call_readonly_capability

Use the existing Yeeflow REST API capability map. Do not expose arbitrary raw API paths, write tools, package install/import/upgrade/delete, or delete operations. Keep local OAuth helper scripts unchanged as fallback. Do not add an active .app.json until a real OpenAI/ChatGPT connector ID exists.

Validate OAuth compatibility with Yeeflow before implementation and document any redirect URI, scope, PKCE, refresh-token, or revocation gaps.
```
