---
name: yeeflow-plugin-release-manager
description: Standardize Yeeflow App Builder Plugin rebuild and release workflows. Use when bundled Yeeflow skills are updated, the user asks to rebuild or update the Yeeflow App Builder Plugin, create a new plugin version, prepare a release candidate, validate a plugin package, or finalize an RC after private marketplace install smoke testing.
---

# Yeeflow Plugin Release Manager

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- For live user-facing API calls, use OAuth; if OAuth is not authenticated, ask the current user to run `node scripts/yeeflow-oauth-login.mjs`. Keep `YEEFLOW_API_KEY` only as a legacy/deprecated fallback where existing code still supports it.
- Derive tenant/app links from OAuth token context where available; use `YEEFLOW_TENANT_URL` only as an optional manual tenant UI/browser-link fallback and never as the API base.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles. It selects one active local tenant profile per run using `YEEFLOW_<PROFILE>_API_KEY`, `YEEFLOW_<PROFILE>_TENANT_URL`, and `YEEFLOW_<PROFILE>_TENANT_ID`.
- Validate and redact environment variables before API calls and never print API keys, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Core Rule

RC tag equals build ready for testing. Final tag equals install-tested and accepted for users.

Never create a final non-RC release tag before the private marketplace install smoke test passes and the result is documented.

The next Yeeflow App Builder plugin release should include the `yeeflow-yapk-package-generator` skill, `validate-yapk-package.js`, `scripts/inspect-yapk-schema-standard.mjs`, YAPK study docs, normalized YAPK schema refs, and the safe YAPK schema summary. Do not include raw `.yapk` packages, raw `Resource`, raw `Sign`, tenant/app/list/package IDs, decoded full payloads, raw API responses, screenshots, or secrets. Adding the YAPK skill may increase the bundled skill count by one.

## Release Workflow

1. Fetch tags and latest `origin/main`.
2. Detect the latest final plugin release tag automatically. Ignore `-rc*` tags when deciding the latest final release.
3. Read the current plugin version from `dist/yeeflow-app-builder-plugin/.codex-plugin/plugin.json`.
4. Compare latest main with the latest final plugin release tag for bundled skill paths.
5. If no bundled skills changed, report that no rebuild is required and stop.
6. If skills changed, choose the next version, create a rebuild branch, rebuild the plugin folder and zip, update metadata and docs, validate, commit, push, and create an RC tag.
7. After the user confirms private marketplace install smoke passed, record the result and create the final annotated tag.

Use [plugin-rebuild-lifecycle.md](references/plugin-rebuild-lifecycle.md) for the detailed command flow.

## Versioning

Use [plugin-versioning-rules.md](references/plugin-versioning-rules.md) to choose patch or minor:

- patch for minor docs, rules, validator, packaging, or clarification updates
- minor for meaningful new capability, new bundled support skill, or runtime-proven feature expansion

Do not create a final tag as part of the rebuild task. Create only the RC tag until install smoke passes.

## Validation And Smoke

Use [plugin-release-checklist.md](references/plugin-release-checklist.md) before committing or tagging. Use [plugin-install-smoke-test.md](references/plugin-install-smoke-test.md) to document:

- install source
- Git ref
- sparse paths
- marketplace name
- plugin name
- smoke prompts tested
- UI cache or icon behavior
- install result

## Reporting

Report latest detected version, changed bundled skills, version decision, archive path, validation results, commit hash, branch status, RC tag or final tag, and whether plugin rebuild is still pending.
