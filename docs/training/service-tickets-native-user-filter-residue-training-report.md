# Service Tickets Native User, Filter, and Template Residue Training Report

## Scope

This training closes the Service Tickets regression found after the 0.8.97 fresh E2E run. The plugin preflight passed, but a focused business regression scan found generated-final defects in the decoded package before signing.

## Defects

1. Planned User fields were downgraded to Text storage fields with `identity-picker` controls. `Requester`, `Assigned Agent`, `Commented By`, and `Uploaded By` must preserve native `User1` / `User2` field keys and `FieldType: "User"`.
2. The master-detail Dashboard left record list carried unsafe select-filter conditions. Empty filter variables can clear the Collection at runtime, so the left list must not apply unproven Collection filters.
3. Generated Service Tickets resources retained source-template metadata such as `event_portfolio_pipeline_section`, `event_portfolio_header_band`, and `Asset Loan Operations Header Band`.
4. KPI/Summary runtime IDs reused source template names such as `approved_budget`, `registration_rate`, and `lead_follow_up` instead of business metric names.

## Required Generator Behavior

- Preserve schema-safe native User field keys (`User1`, `User2`, etc.) and emit `FieldType: "User"` with `Type: "identity-picker"`.
- Configure visible filter controls for the page, but do not attach Collection filter conditions unless the filter has a proven safe empty-state runtime contract.
- Business-facing generated resources must not expose source-template IDs, labels, or maintenance metadata from unrelated business domains.
- KPI Summary IDs, temp variables, and generated metadata must be derived from the planned business metric label, not the source golden-reference slot name.
- Dashboard root golden-reference provenance may remain for validator proof, but nested business sections and custom form resources must be scrubbed of unrelated source-template metadata.

## Regression Coverage

`scripts/test-service-tickets-e2e-regression-gates.mjs` now verifies:

- Native User field preservation for Tickets, Ticket Comments, and Ticket Attachments.
- The Service Tickets two-panel Dashboard uses the App Plan selected page layout.
- The left panel Collection has no unsafe empty select-filter conditions.
- The generated package does not contain Office Asset, Event Portfolio, or source-template KPI/Summary identifiers in business resources.
- Dashboard page-layout and hard-gate validators still pass after cleanup.
