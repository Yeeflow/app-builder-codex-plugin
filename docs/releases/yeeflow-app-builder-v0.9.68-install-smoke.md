# Yeeflow App Builder v0.9.68 Install Smoke

Date: 2026-07-14 (Asia/Singapore)

## Release Candidate

- Release pull request: `#473`
- Release merge commit: `bf4f2b7`
- RC tag: `yeeflow-app-builder-plugin-v0.9.68-rc1`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.68`
- Release ZIP SHA-256: `1525acbe85836151be5f16beb450f00ea10955e496b36d66721971650692ed0f`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME` at `/private/tmp/codex-plugin-smoke-0.9.68`. The configured user
marketplace and active cache were not changed during RC validation. No Yeeflow
application, Data List, Document Library, Approval form, or Dashboard was
installed, imported, upgraded, deleted, saved, submitted, or published. No
camera scan, print preview, or printer output was executed.

## Marketplace Install

The isolated marketplace was added from RC1 with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.68`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- Source payload file count: `1628`.
- Installed cache file count: `1628`.
- Recursive SHA-256 comparison reported no missing, extra, or changed files.
- The installed-cache metadata inspector passed directly from the installed
  cache root.
- Installed metadata reported plugin ID `yeeflow-app-builder`, display name
  `Yeeflow App Builder`, and version `0.9.68`.

## Installed-Cache Regression Proof

The following checks passed from the isolated installed cache:

- Form Action Print Page and Barcode Scan gates: `16/16`.
- Official `Online Library-v3.1.yapk` reference validation: one Print Page
  step, four Barcode Scan steps, and two scan-enabled Text fields.

## Result

RC1 install/cache smoke: **PASS**

Final tag and fast-forward stable promotion are permitted after this evidence is
merged. Physical camera scanning, print preview pagination, browser print
output, and printer behavior remain separate runtime-proof boundaries.
