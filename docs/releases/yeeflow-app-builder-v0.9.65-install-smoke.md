# Yeeflow App Builder v0.9.65 Install Smoke

Date: 2026-07-14 (Asia/Singapore)

## Release Candidate

- Training pull request: `#464`
- Release pull request: `#465`
- Release merge commit: `8a97bb06b7c613e74a9a53c363b56c94bd287963`
- RC tag: `yeeflow-app-builder-plugin-v0.9.65-rc1`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.65`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME`. The configured user marketplace remained on stable `0.9.64`
during RC validation. No Yeeflow application was installed, upgraded, saved,
submitted, or published by this smoke test.

## Marketplace Install

The isolated marketplace was added from the RC tag with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.65`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- The installed `0.9.65` cache payload matched
  `dist/yeeflow-app-builder-plugin` byte-for-byte.
- The isolated marketplace snapshot also matched the release dist byte-for-byte.
- Plugin metadata reported name `yeeflow-app-builder`, display name
  `Yeeflow App Builder`, and version `0.9.65`.
- `test-yapk-hard-gate-cache-artifacts.mjs` passed from the installed cache.
- `test-installed-cache-root-path-alignment.mjs` passed for source and cache roots.

## Focused Regression Proof

`test-choice-field-option-materialization-gates.mjs` passed from the installed
cache with all 14 cases. The suite covers Chinese and ASCII delimiters, planning
annotation cleanup, Approval Form option materialization, full-app Data List
materialization, a 15-option no-truncation case, `choices` / `color_choices`
parity, and malformed-package signing blockers.

## Proof Boundary

This smoke proves marketplace installation, plugin discovery, cache parity, and
focused generation/preflight behavior. It does not mutate a Yeeflow tenant or
migrate existing records that contain an old merged choice value.

## Result

RC install/cache smoke: **PASS**

Final tag and fast-forward stable promotion are permitted after this evidence is
merged.
