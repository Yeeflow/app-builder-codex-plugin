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
- Private Marketplace install smoke: pending RC publication

## Known Limitations

- This metadata release does not by itself prove Designer rendering, application materialization, workflow execution, installed-application runtime, or visible UI correctness.
- OpenAI Developer Portal tool annotation review, domain verification, Scan Tools, reviewer credentials, and submission test cases remain separate submission steps.
- The public support URL is `https://support.yeeflow.com/`; the current Codex Plugin manifest schema does not accept a support URL field, so it must be supplied in the OpenAI Developer Portal listing.
