# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.29
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.29` adds workspace API capability metadata and read-only workspace discovery for package target selection. `YEEFLOW_WORKSPACE_ID` is now an optional default/override instead of a required normal setup value; package install/import/upgrade must still use an explicit or user-selected workspace and must stop rather than guessing. Workspace add/edit/delete/sort are write operations and are not automatically executed; delete is destructive and requires strong confirmation. `YEEFLOW_API_KEY` remains a legacy/deprecated fallback only.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
