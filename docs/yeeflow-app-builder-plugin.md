# Yeeflow App Builder Plugin

Yeeflow App Builder is a skills-only Codex plugin for planning, generating, validating, testing, and hardening Yeeflow application packages.

## Current Package

- Repository: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Marketplace ID: yeeflow
- Plugin ID: yeeflow-app-builder
- Display name: Yeeflow App Builder
- Version: 0.6.32
- Dist root: dist/yeeflow-app-builder-plugin

## Capabilities

The plugin includes Yeeflow package validators, canonical schema references at `schemas/yapk-schema.json` and `schemas/yap-schema.json`, application/form/list/dashboard generation guidance, Browser OAuth helper scripts, safe Yeeflow REST API capability-map tooling, package automation dry-run helpers, runtime-proof boundary guidance, and release hygiene documentation.

Version `0.6.32` adds universal login UX and the YAPK upgrade ID stability hard gate. Every Yeeflow API operation preserves its original operation or capability and returns `auth_required` / `login_flow_required` when OAuth is missing or expired; normal user-facing recovery uses the plugin login flow, not local Node OAuth commands, Codex cache paths, API keys, or `.env.local` guidance. CLI OAuth scripts remain developer/local diagnostics only. YAPK upgrade/new-version workflows must prove previous package/manifest continuity, preserve existing semantic resource IDs, assign new API-issued IDs only to newly added resources, forbid removed-ID reuse, fail closed on missing or ambiguous lineage, treat replacing all IDs as a hard failure, and keep signing/install/upgrade acceptance separate from ID-continuity proof and browser runtime proof.

## API Safety

API helpers must use the documented capability map. Read-only calls are preferred for lookup and verification. Write capabilities are not executed by generic read-only helpers, and package install/import/upgrade/delete automation must remain guarded, dry-run by default, and explicitly approved before execution.

## Migration Note

This clean repository replaces the legacy Codex marketplace identity with `yeeflow` / `yeeflow-app-builder` to avoid stale materialization collisions. The legacy repository should remain available until this new identity passes Codex App install/cache smoke testing.
