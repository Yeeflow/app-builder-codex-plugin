# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.33
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.33` adds workflow assignment job-position guardrails. Workflow Assignment Tasks require explicit assignee strategy, manager-based assignees validate only supported expression-editor patterns for line manager, department manager, and location manager, and job-position assignees require discovered, user-selected, or admin-created-after-confirmation proof metadata. The plugin must not invent job-position IDs or names. Missing job positions block generation/workflow write paths unless admin status is separately confirmed and explicit write confirmation is provided. `positions.list` and `positions.users.list` are read-only discovery/lookup capabilities, while job-position create/update/assign/remove are write operations and admin-confirmation gated. No system-admin permission API is claimed unless mapped. Generated-final validation fails on empty, placeholder, invented, malformed, missing-proof, or unconfirmed assignment paths before signing, install, upgrade, or handoff. Runtime/browser workflow verification with a safe request is still required to prove actual assignment routing.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
