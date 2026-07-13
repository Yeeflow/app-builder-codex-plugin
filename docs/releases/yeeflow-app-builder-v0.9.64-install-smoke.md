# Yeeflow App Builder v0.9.64 Install Smoke

Date: 2026-07-14 (Asia/Singapore)

## Release Candidate

- Pull request: `#462`
- Merge commit: `2e31b2b89cfbeeec0e2a7951081622f44d8f1c6a`
- RC tag: `yeeflow-app-builder-plugin-v0.9.64-rc1`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.64`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME`. The configured user marketplace remained on stable `0.9.63`
during RC validation. No Yeeflow application was installed, upgraded, saved,
submitted, or published by this smoke test.

## Marketplace Install

The isolated marketplace was added from the RC tag with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.64`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- The installed `0.9.64` cache payload matched
  `dist/yeeflow-app-builder-plugin` byte-for-byte.
- Plugin metadata reported name `yeeflow-app-builder`, display name
  `Yeeflow App Builder`, and version `0.9.64`.
- `test-yapk-hard-gate-cache-artifacts.mjs` passed in
  `installed-cache-root` mode.

## Regression Proof

The following suites passed from the installed cache root:

- `test-form-action-open-resource-gates.mjs`
- `test-form-action-open-resource-plan-gates.mjs`
- `test-form-action-open-resource-materialization.mjs`
- `test-form-action-open-resource-package-gates.mjs`
- `test-ui-hard-gates-all.mjs`

The focused runtime proof remains render-only. It validates generated Open Item
Form, Open Approval Form, and Open Dashboard action configuration without
clicking actions that can create records, open tenant resources, save forms,
submit approvals, or mutate tenant data.

## Result

RC install/cache smoke: **PASS**

Stable promotion is permitted only after this evidence is merged and the final
release tag is created. Stable must move by fast-forward only.
