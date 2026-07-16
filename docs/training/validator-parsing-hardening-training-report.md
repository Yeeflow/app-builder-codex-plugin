# Validator Parsing Hardening Training Report

## Scope

This focused training hardens Functional Specification and App Plan validators against false positives and false coverage caused by whole-row keyword scans, fixed Markdown column indexes, and negation-insensitive prose matching.

## Corrected contracts

- Approval form page roles are read from `Page Role`; template IDs are read from the selected-template column. Words such as `task` in a Submission selection reason no longer change the page role.
- Workflow task surfaces and template IDs are read from their semantic columns.
- Data List form usage, Dashboard navigation visibility/icons, record-display controls, Dynamic controls, and Data Analytics intent use header-based lookup with supported aliases.
- Dashboard fake placeholder IDs are rejected only in technical ID/property contexts. Business codes such as `FORM-REQUEST` and prose such as `Page-level` or `Form-level` remain valid.
- Business Clarification pass/fail classification uses only the Status cell. Answer text such as `Open dashboard` cannot turn an answered row into an open gate.
- Deferred, runtime-proof-required, export-learning-required, and post-import dispositions are validated only in the structured Deferred or Runtime-Proof Items section. Formal rows require reason, user/generation impact, fallback, and proof/follow-up.
- Core requirements may use stable `REQ-*` or `FS-*` markers. Once present in a Functional Specification, the exact marker must occur in the App Plan; generic words such as `field`, `page`, or `workflow` do not count as item-level mapping.
- Negative statements are excluded from intent detection for Collection/Kanban/Timeline, Sub List, chart/data analytics, and related planning gates.

## Regression coverage

`scripts/test-validator-parsing-hardening-gates.mjs` covers:

- reordered and aliased table columns;
- `later task processing` in a Submission reason;
- `Page-level`, `Form-level`, and business label `FORM-REQUEST`;
- real fake IDs in `PageID` context;
- `Open dashboard` in a resolved clarification answer;
- exact requirement-ID mapping and missing-ID failure;
- complete and incomplete structured deferred dispositions.
- canonical Print Page placeholder rows and Markdown-wrapped expression-token JSON.

Existing Approval layout, clarification/readiness/traceability, and control/action planning regression suites remain required.

## Proof boundary

These checks prove deterministic parsing of planning Markdown. They do not prove that a business requirement is correct, that the generated package conforms to the plan, or that runtime behavior succeeds.

## Follow-up promoted to focused training

Workflow Set Data List token semantics are implemented and documented in `workflow-set-data-list-token-semantics-focused-training-report.md`. They remain a separate focused change from Markdown parsing hardening so each regression family has a clear proof boundary.
