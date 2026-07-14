# Yeeflow App Builder v0.9.66 Install Smoke

Date: 2026-07-14 (Asia/Singapore)

## Release Candidate

- Release pull request: `#467`
- Release merge commit: `772f0c2f79be0c8dd0d1a5a5cf202b3db8da08a7`
- RC tag: `yeeflow-app-builder-plugin-v0.9.66-rc1`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.66`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME` at `/private/tmp/codex-home-yeeflow-0966-rc1`. The configured user
marketplace and active cache were not changed during RC validation. No Yeeflow
application was deleted, installed, upgraded, saved, submitted, or published by
this smoke test.

## Marketplace Install

The isolated marketplace was added from the RC tag with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.66`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- The installed `0.9.66` cache payload matched
  `dist/yeeflow-app-builder-plugin` byte-for-byte.
- Plugin metadata reported version `0.9.66` and the expected application
  management API release description.
- `test-yeeflow-application-management.mjs` passed from the installed cache.
- `test-yeeflow-api-capabilities.mjs` passed from the installed cache.
- Package workspace selection, API dry-run environment, and API workspace
  configuration regression suites passed from the installed cache.
- Cache guidance retained dry-run-by-default deletion, workspace-scoped
  readback, exact ID/title matching, and strong confirmation requirements.

## Focused Runtime Boundary

The read-only workspace application-list endpoint was exercised before the RC
release and returned HTTP 200 with API status 0. Output evidence was redacted.
No live `DELETE /applications/{id}` request was executed. The destructive helper
was verified through dry-run and negative guardrail regression cases only.

## Result

RC install/cache smoke: **PASS**

Final tag and fast-forward stable promotion are permitted after this evidence is
merged.
