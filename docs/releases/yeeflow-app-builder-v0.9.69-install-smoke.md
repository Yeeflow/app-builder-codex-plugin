# Yeeflow App Builder v0.9.69 Install Smoke

Date: 2026-07-15 (Asia/Singapore)

## Release Candidate

- Release pull request: `#476`
- Release merge commit: `ee6ca82`
- RC tag: `yeeflow-app-builder-plugin-v0.9.69-rc1`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.69`
- Release ZIP SHA-256: `1e8942ef44be31f50942395cb50dc8000cdc37419efd19bb74ecc1aa6b3bbb53`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME` at `/private/tmp/codex-plugin-smoke-0.9.69.U1mF03`. The configured
user marketplace and active cache were not changed during RC validation. No
Yeeflow application, Data List, Document Library, Approval form, or Dashboard
was installed, imported, upgraded, deleted, saved, submitted, or published. No
camera scan, native print dialog, or printer output was executed.

## Marketplace Install

The isolated marketplace was added from RC1 with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.69`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- Source payload file count: `1631`.
- Installed cache file count: `1631`.
- Recursive comparison reported no missing, extra, or changed files.
- The installed-cache metadata inspector passed directly from the installed
  cache root.
- Installed metadata reported plugin ID `yeeflow-app-builder`, display name
  `Yeeflow App Builder`, and version `0.9.69`.

## Installed-Cache Regression Proof

The following checks passed from the isolated installed cache:

- Form Action Print Page and Barcode Scan gates: `16/16`.
- Canonical generated-final and preflight integration gates: `6/6`.
- Dashboard generation hard gates.
- Repository duplicate-copy hygiene gate with zero tracked or untracked copy artifacts.

## Result

RC1 install/cache smoke: **PASS**

Final tag and fast-forward stable promotion are permitted after this evidence is
merged. Physical camera scanning, native print dialogs, printer output,
Designer saves, and publishing remain separate runtime-proof boundaries.
