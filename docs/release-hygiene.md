# Release Hygiene Checklist

Use this checklist before moving `stable`, creating release tags, publishing release artifacts, or sharing a plugin package publicly.

## Never Commit

Do not commit:

- `.env.local`, `.env`, local profile files, or shell dumps
- `.yeeflow-oauth/`, certificate files, private keys, or OAuth token files
- OAuth access tokens, refresh tokens, ID tokens, authorization codes, cookies, API keys, client secrets, or Authorization headers
- raw Yeeflow exports, generated runtime packages, screenshots, raw API responses, raw `Resource`, raw `Sign`, decoded package payloads, private tenant URLs, tenant IDs, workspace IDs, upload IDs, app IDs from private tenants, or customer/private data

## Payload-Like JSON Review

Tracked files ending in `.app-def.json` or `.resource.json` must be treated as release-risk artifacts until reviewed. For each file, inspect without printing raw values and classify:

- `safe public example`: synthetic data only, no tenant URLs, no emails, no secrets, no raw API response, no private tenant/workspace/app/list/form/workflow IDs
- `sanitized reference`: contains placeholders or redacted structural values only
- `historical debt`: pre-existing tracked payload-like artifact that is not active release content but still needs cleanup before public release
- `blocked`: contains private data, tenant-specific values, credentials, tokens, raw exports, raw responses, or decoded payloads

If a payload-like file is required for tests, prefer a small synthetic fixture over full application payloads. Do not delete or rewrite large proof artifacts unless the test and documentation impact is understood.

## Yeeflow URL Classification

Classify Yeeflow URLs without printing private values:

- `public documentation/provider`: `https://developer.yeeflow.com/api/`, `https://api.yeeflow.com/v1`, `https://login.yeeflow.com/...`, and the public OpenAPI YAML URL
- `generic placeholder`: `https://<yourdomain>.yeeflow.com` or another angle-bracket placeholder
- `local/dev callback`: `https://127.0.0.1:{53720-53724}/callback`
- `private tenant URL`: any real customer, test, production, or personal tenant domain
- `unclear`: any tenant-like URL that cannot be safely classified from local context

Replace private tenant URLs with placeholders when safe. If a URL appears in a historical runtime-proof note and cannot be safely rewritten without losing context, mark it as historical debt and keep it out of release artifacts.

## Source/Dist Skill Mirrors

Before release, verify source and bundled skill mirrors:

```bash
cmp -s generated-skills/yeeflow-api-operator/SKILL.md dist/yeeflow-app-builder-plugin/skills/yeeflow-api-operator/SKILL.md
cmp -s skills/installed/yeeflow-package-validator/SKILL.md dist/yeeflow-app-builder-plugin/skills/yeeflow-package-validator/SKILL.md
```

If a bundled skill has stronger safety language than the source skill, sync it back to source. Never weaken OAuth, API capability map, dry-run, upgrade, confirmation, or proof-boundary language.

Preserve these proof boundaries:

- local validation is not import proof
- API acceptance is not runtime proof
- runtime proof applies only to the tested scope

## Pre-Stable Checks

Run at minimum:

```bash
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
node scripts/test-yeeflow-env-utils.mjs
node scripts/test-package-api-dry-run-env.mjs
node scripts/test-package-api-workspace-config.mjs
node scripts/test-package-api-upload-response-parsing.mjs
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version <expected-version>
node scripts/audit-release-safety.mjs --base origin/main --archive does-not-exist.zip --dist-root dist/yeeflow-app-builder-plugin
git diff --check
```

Do not run package upload, import, install, upgrade, create, update, or delete operations as part of release hygiene unless an explicit live-operation test plan has been approved for a disposable workspace.
