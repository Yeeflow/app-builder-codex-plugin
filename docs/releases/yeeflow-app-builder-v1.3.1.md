# Yeeflow App Builder v1.3.1

## Summary

Yeeflow App Builder v1.3.1 is a metadata-focused patch release that prepares the Plugin listing for OpenAI submission without changing the bundled Skills or hosted MCP capability surface.

## Version

- Previous version: `1.3.0`
- New version: `1.3.1`
- Version decision: patch, because this release changes public listing metadata and package presentation only

## Changes

- Replaced the historical release-log listing text with a concise product description.
- Reduced the short description to the public directory limit.
- Added the public Yeeflow website, privacy policy, terms of service, and support URLs.
- Replaced the legacy oversized default prompt with three concise starter prompts.
- Preserved the existing OAuth-backed hosted MCP configuration and 25 bundled Skills.

## Validation

- Plugin manifest and Marketplace JSON parsing: passed
- MCP integration and embedded-credential check: passed
- Skill structure and metadata validation: passed for 25 bundled Skills
- TypeScript build, 487 packaged JavaScript syntax checks, and 539 packaged JSON parse checks: passed
- Standalone resource release gates: passed for 29 focused cases across four resource types
- ZIP integrity, payload parity, forbidden-file check, and release safety scan: passed
- Private Marketplace install smoke: passed against RC1

## Private Marketplace Install Smoke

- RC tag: `yeeflow-app-builder-plugin-v1.3.1-rc1`
- RC commit: `9bde9890ae6042dbd152c5ac42384cfa607f206f`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Marketplace name: `yeeflow`
- Plugin name: `yeeflow-app-builder`
- Install result: version `1.3.1` installed and enabled in the versioned Plugin cache
- Provenance result: Git Marketplace checkout matched the RC commit; installed payload was byte-identical to the Marketplace payload
- Fresh-process Skill smoke: loaded the installed v1.3.1 release-manager Skill and correctly distinguished RC tags from final tags
- Stateless MCP smoke: GUID generation and all 11 supported App Builder component types passed
- UI/cache behavior: the Git fetch produced no progress output for approximately 90 seconds, but completed successfully; no stale-version or payload-drift condition remained after install
- Icon behavior: not separately evaluated because this release changes listing metadata only

## Release Status

RC1 passed the documented private Marketplace install smoke and is eligible for the final `yeeflow-app-builder-plugin-v1.3.1` annotated tag. This evidence proves Plugin installation, Skill discovery, exact payload provenance, and the tested stateless MCP paths; it does not prove tenant-specific reads or writes, Designer behavior, materialization, workflow execution, or application runtime.

## Known Limitations

- This metadata release does not by itself prove Designer rendering, application materialization, workflow execution, installed-application runtime, or visible UI correctness.
- OpenAI Developer Portal tool annotation review, domain verification, Scan Tools, reviewer credentials, and submission test cases remain separate submission steps.
- The public support URL is `https://support.yeeflow.com/`; the current Codex Plugin manifest schema does not accept a support URL field, so it must be supplied in the OpenAI Developer Portal listing.
