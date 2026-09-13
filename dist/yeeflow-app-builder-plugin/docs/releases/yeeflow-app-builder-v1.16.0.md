# Yeeflow App Builder 1.16.0

Previous release: 1.15.7. Minor release, 2026-09-14.

## Changes

- Plan native Collection column widths after actual field mapping and placement. Full-width tables use balanced percentages; constrained containers and many-column tables retain readable pixel widths with native horizontal scrolling.
- Use `cw`/`cwu` for native Column width and `t-len` for Dynamic field Text length. Reference sample widths are not global defaults.
- Give titles and narratives more room, keep choice and operation columns compact, and derive choice sizing from schema options. Preserve sorting, filters, actions, data, responsive overrides and mobile card children.
- Limit narrative display only with a full-value route. Titles, identifiers and ordinary unknown text remain complete. Native tooltips are not assumed to reveal full text.
- Add App Plan Column widths, Text lengths and Full value access; reject invalid field keys, budgets, lengths and unsafe truncation through the actual builder and public validator.
- Update Dashboard Generator, Feature Learning Orchestrator and UI Generation Hard Gates, with mirrored standards and executable regressions.
- Retain owner-scoped toolbar styles, native row-menu positioning, choice-field Dynamic styles and default 10-record pagination.

## Validation and installation

Source and distribution complete UI suites passed (29/29 each), together with typecheck, skill-reference checks, MCP configuration checks, version metadata checks and extracted-package regressions. All 544 JavaScript and 565 JSON files parsed successfully. The release safety scan reported zero blocking findings.

Pre-promotion installation through Codex plugin/install from the local Marketplace manifest succeeded with no additional authentication required. All 1,855 payload files matched the installed cache byte-for-byte, 27 skills were discovered with no load errors, and installed-cache Collection regressions passed. This proves local installation and module behavior, not a new live tenant acceptance.

RC tags are omitted following the user's explicit instruction; installation checks are retained. The final Git Marketplace target is stable, with main kept current for README visibility. Final stable installation verification is retained separately from this pre-promotion evidence.

## Known limits

This release updates the plugin and does not mutate existing applications. Native Text length is not an exact line clamp. Generated-page rendering, mobile behavior, full-value routes and pagination interactions still require runtime acceptance. Pre-embedded master-detail selection/detail and print-specific layouts retain separate policies. Local module and installed-cache checks do not constitute live tenant acceptance.
