# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.31
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.31` adds the package workspace-selection hard gate and application access-link reporting. Package install/import/upgrade ignore local `YEEFLOW_WORKSPACE_ID`, stop with `workspace_selection_required` before request shaping until an API-discovered `flowcraft` workspace is explicitly selected, show redacted workspace choices, prefer `--selected-workspace-id`, and treat `--workspace-id` only as explicit user-selected input. Successful install/import reports include `<tenant-url>/#/list-set/41/<listset-id>` only when the tenant URL comes from safe OAuth/session context and the ListSetID comes from safe install/import result fields. Signing helpers must not use hardcoded versioned Codex cache imports, and local validation, signing/signature verification, and API acceptance are not browser runtime proof.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
