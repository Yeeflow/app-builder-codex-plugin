# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.30
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.30` finalizes the OAuth-first environment cleanup and workspace discovery learnings. Normal plugin use requires no `.env.local`; OAuth is the standard user-facing API path; `YEEFLOW_API_KEY` is legacy/deprecated fallback only; workspace discovery uses `settings` and `flowcraft`; `flowcraft` is the app/package workspace category; "all workspaces" checks both categories; workspace summaries redact full IDs and raw records; blank title plus `Status: 1` displays as `Shared Workspace`; `YEEFLOW_WORKSPACE_ID` is optional manual/default package target override only; and package writes must use an explicit or selected workspace and must not guess.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
