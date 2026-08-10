# Yeeflow App Builder Plugin v1.10.5

## Scope

This stable release retires the plugin's standalone OAuth and Yeeflow REST/API surface. Live Yeeflow work now uses only the four scoped hosted MCP services:

- `yeeflow_app_builder_mcp`
- `yeeflow_operations_mcp`
- `yeeflow_admin_mcp`
- `yeeflow_service_portal_mcp`

## Removed

- The standalone `yeeflow-api-operator` skill and its bundled resources.
- OAuth login, refresh, status, and local environment helpers.
- REST capability, workspace discovery, package automation, signing, and application-management CLI helpers.

## Verification

`scripts/test-plugin-mcp-integration.mjs` verifies all four hosted MCP endpoints, rejects embedded credentials, and fails if the retired API Operator skill, OAuth CLI, or REST capability CLI is present in the distributed plugin.

MCP acceptance remains distinct from materialization, Designer, and runtime proof.
