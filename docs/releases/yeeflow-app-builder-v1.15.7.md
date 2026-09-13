# Yeeflow App Builder 1.15.7

Previous release: 1.15.6. Patch release, 2026-09-13.

## Changes

- Dashboard Generator and Feature Learning Orchestrator now teach owner-scoped Button/Select CSS, unique CSS IDs versus reusable classes, and empty/selected Select alignment without defeating placeholder hiding.
- New Collection materialization enables native row-menu auto positioning, preserves explicit responsive placement, and scopes white action foregrounds to known dark menus.
- Choice fields use actual-schema Container/Text Dynamic style rules with independent border/background/text, neutral unknown fallback and exact single-choice equality or verified-array multi-choice membership. Badge composition is opt-in; arbitrary fields are not automatically converted.
- New ordinary Dashboard record Collections default to 10 records per page. Records per page/Page size plan values override the default; existing repair configurations, selected detail 1, limited datasets and print semantics remain separate.
- README version/install examples and retired access descriptions are updated.

## Validation and release

Clean stable-baseline checks passed: source and distribution complete UI suites (29/29 each), focused toolbar/choice/pagination and generated-menu package regressions, 68 product contracts, 10 schema/approval preservation regressions, 16 dataset composition cases, typecheck, skill-reference and MCP configuration checks. Distribution parsing checked 540 JavaScript files and 564 JSON files. Archive integrity and release safety scan passed with no blocking findings.

Pre-promotion local Marketplace installation through Codex succeeded with no additional authentication required. All 1,848 payload files matched the installed cache byte-for-byte; Codex discovered 27 skills with no load errors, including the updated Dashboard Generator and Feature Learning Orchestrator. Installed-cache focused regressions and MCP configuration checks passed. This is local Marketplace/payload proof, not remote Git installation or live tenant acceptance.

RC is skipped at the user's explicit request. The final release is promoted to main and stable, then the Git Marketplace is refreshed from stable and the final installed cache is checked again.

## Known limits

This release packages generation rules and regression coverage; it does not update live dashboards. Prior desktop repair evidence applies only to the tested page. Multi-choice visual composition, unknown values, rule precedence, mobile wrapping, pagination interaction and hover/active visuals still require runtime acceptance. Edit-to-View routing, Owner accessible title and exhaustive filter candidate coverage remain open.
