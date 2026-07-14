# Yeeflow App Builder v0.9.67 Install Smoke

Date: 2026-07-14 (Asia/Singapore)

## Release Candidate

- Feature pull request: `#469`
- Release pull request: `#470`
- Cache-smoke compatibility pull request: `#471`
- RC2 merge commit: `ca0b55f8515f844c8d8fff0abf54a9af46e8c690`
- RC tag: `yeeflow-app-builder-plugin-v0.9.67-rc2`
- Expected plugin: `yeeflow-app-builder@yeeflow`
- Expected version: `0.9.67`

## Isolation

The RC marketplace and plugin cache were installed under an isolated temporary
`CODEX_HOME` at `/private/tmp/codex-home-yeeflow-0967-rc2`. The configured user
marketplace and active cache were not changed during RC validation. No Yeeflow
application or Data List was installed, imported, upgraded, deleted, saved,
submitted, or published. No anonymous Public Form submission was performed.

## Marketplace Install

The isolated marketplace was added from RC2 with sparse paths:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-app-builder-plugin`

`codex plugin add yeeflow-app-builder@yeeflow --json` reported:

- plugin ID: `yeeflow-app-builder@yeeflow`
- version: `0.9.67`
- enabled: `true`
- authentication policy: `ON_INSTALL`

## Cache Proof

- Source payload file count: `1621`.
- Installed cache file count: `1621`.
- Recursive checksum comparison reported no missing, extra, size-changed, or
  content-changed files. Only copy-time timestamp differences were present.
- The installed-cache metadata inspector passed directly from the installed
  cache root without requiring source-checkout marketplace files.
- Installed metadata reported plugin ID `yeeflow-app-builder`, display name
  `Yeeflow App Builder`, and version `0.9.67`.

## Installed-Cache Regression Proof

The following suites passed when executed from the isolated installed cache:

- Public Form Form Action gates: `17/17`.
- Public Form complete Data List generation gates: `7/7`.
- App Plan schema validator consistency gates.
- Business clarification and App Plan precision gates.
- Functional Specification and App Plan gates.
- YAPK hard-gate cache artifact checks.
- Installed-cache-root path alignment and metadata inspection.

## Result

RC2 install/cache smoke: **PASS**

Final tag and fast-forward stable promotion are permitted after this evidence is
merged. Public Form anonymous-submit behavior remains outside this non-mutating
release smoke and requires a separately authorized runtime test.
