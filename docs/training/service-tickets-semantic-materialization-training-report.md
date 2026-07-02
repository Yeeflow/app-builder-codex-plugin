# Service Tickets Semantic Materialization Training Report

## Scope

This training covers the Service Tickets Management E2E failure observed with plugin `0.8.106`, where signing, installation, and Version Management succeeded but the generated application content did not match the approved App Plan.

The failure is a materialization problem, not an install/import, seed-data, or browser-runtime problem.

## Failure Pattern

The App Plan declared one Service Tickets Dashboard using `dashboard-page-layouts-two-panel-workspace`, with three business data lists:

- `Tickets`
- `Ticket Comments`
- `Ticket Attachments`

The generated package instead materialized a generic app shape:

- Dashboard pages were incorrectly split into `Left Panel Work Queue`, `Right Panel Selected Ticket Detail`, and `Explicit Dashboard Exclusions`.
- The `Tickets` data list only contained the native `Title` field.
- Planned ticket fields such as `Ticket Number`, `Subject`, `Requester`, `Priority`, `Status`, `Assigned Agent`, `Created Date`, `Due Date`, and `Description` were missing.

## Root Causes

1. Dashboard page-name parsing was too permissive. The materializer accepted descriptive subsection headings inside `Dashboard Pages Plan` as Type `103` Dashboard page names.
2. Data-list field parsing did not recognize App Plan field-table headers using `Internal Name`, `Business Type`, and `Yeeflow Type`.
3. Existing validators checked package shape and template legality, but did not fail on this specific semantic projection gap before signing/install.

## Required Generation Rules

- Dashboard page resources must be derived from explicit page declarations only:
  - `Page name: ...`
  - Dashboard layout/template selection tables
  - Other approved page-name tables
- Dashboard subsection headings such as `Left panel work queue`, `Right panel selected ticket detail`, `Dashboard filters`, and `Explicit dashboard exclusions` are not Dashboard pages.
- Data-list field parsing must accept both canonical and product-planning table headers:
  - `Internal ID / Field Key`
  - `Internal Name`
  - `Yeeflow Field Type`
  - `Business Type`
  - `Exact Yeeflow Control Type`
  - `Yeeflow Type`
- `User identity` fields must materialize as schema-safe `Text*` fields with `Type: "identity-picker"`, not as unsupported `FieldType: "User"`.
- If a nontrivial App Plan declares business fields but the decoded package contains only native `Title`, generated-final materialization must fail before signing readiness.

## Regression Coverage

The Service Tickets E2E regression fixture now uses the real failure shape:

- Dashboard page selection table with `Dashboard | Layout template | Dataset presentation`.
- Descriptive subsections such as `Left panel work queue`, `Right panel selected ticket detail`, and `Explicit dashboard exclusions`.
- Field tables using `Internal Name`, `Business Type`, and `Yeeflow Type`.

The regression must prove:

- Exactly one Dashboard page: `Service Tickets Dashboard`.
- `Tickets` preserves planned fields and keys such as `Priority -> Text7` and `Status -> Text5`.
- Identity fields remain Text-backed `identity-picker` fields.
- The selected Dashboard page layout is `dashboard-page-layouts-two-panel-workspace`.
- No source-template residue or unplanned generic pages are emitted.

