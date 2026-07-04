# Dashboard v1.1 Summary Host And Dynamic User Training Report

## Source Feedback

Validation against `yeeflow-app-builder@yeeflow 0.9.1` showed that the official export Resource wrapper and Summary package reader had improved, but generated-final Dashboard preflight still failed for Hospital Doctor Information Management.

Remaining failing gates:

- `dashboard-generation-hard-gates`
- `dashboard-golden-reference-conformance`

Key codes reported:

- `DASH_LAYOUT_INVENTED_LAYOUT_MODULE`
- `DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT`
- `DASH_LAYOUT_USER_FIELD_DYNAMIC_FIELD`
- `DASH_GOLDEN_USER_FIELD_DYNAMIC_FIELD`
- `DASH_GOLDEN_APPROVED_GRID_TABLE_INTERNALS`

## Root Cause

The generated Dashboard appended a hidden KPI Summary host such as `doctor-operations-dashboard_kpi_data_host` directly under the selected v1.1 page shell `Content`/`content_panel`. Even when hidden, Summary controls are business controls. A new host directly under structural page shell containers is an invented layout module and places Summary controls outside approved business slots.

The Dashboard user-field validator also used an overly broad heuristic. It treated labels containing `employee` as user fields, causing normal identifier fields such as `Employee Number` to be incorrectly flagged as `dynamic-field` user-field violations.

## Training Rules

1. Dashboard Summary/KPI hidden hosts must be dedicated hidden containers with the normal runtime contract, but they must be nested inside approved KPI business slots copied from the selected page layout.
2. Valid KPI host parents include:
   - `event_portfolio_kpi_planned_events`
   - `event_portfolio_kpi_approved_budget`
   - `event_portfolio_kpi_registration_rate`
   - `event_portfolio_kpi_lead_follow_up`
   - `kpi_card_wrapper`
3. The materializer must not append `*_kpi_data_host` directly under root `Content`, `content_panel`, or other structural shell containers.
4. If no approved KPI slot is planned/materialized, the materializer must not invent a new Summary host module.
5. User/person fields must render with `dynamic-user` when field metadata or business semantics prove a real identity field, such as `identity-picker`, `Requester`, `Approver`, `Manager`, `Owner`, or `Assignee`.
6. Ordinary identifiers such as `Employee Number`, `Employee ID`, `Employee Code`, `Department Code`, or staffing targets must remain normal `dynamic-field` controls unless the field metadata is explicitly `identity-picker`.
7. Grid-table internals remain informational in this scenario when the selected Collection template preserves approved internal grid/flex-grid slots; simplified lookalikes must still fail the dataset presentation gates.

## Implemented Changes

- `scripts/materialize-full-app-generated-final.mjs`
  - Places generated Summary hidden hosts inside the first available approved KPI slot instead of structural page shell containers.
  - Stops treating the word `employee` alone as user-like text during dynamic-field cleanup.
- `scripts/validate-dashboard-page-layout-template.mjs`
  - Narrows user-field detection and excludes common identifier labels such as `Employee Number`.
- `scripts/validate-dashboard-golden-reference-conformance.mjs`
  - Applies the same user-field detection correction to golden-reference conformance.
- `scripts/test-dashboard-v11-summary-host-dynamic-user-gates.mjs`
  - Adds a focused materializer regression for a Doctor Operations Dashboard with Summary metrics, `Employee Number`, and an identity-picker `Profile Owner`.

## Verification Boundary

The focused regression validates generated package structure and Dashboard gates only. It does not sign, install, seed, or run browser runtime proof.

Passing proof must include:

- generated package passes `validate-dashboard-page-layout-template`
- generated package passes `validate-dashboard-golden-reference-conformance`
- hidden Summary host is nested inside an approved KPI business slot
- `Employee Number` remains a normal `dynamic-field`
- identity-picker `Profile Owner` renders as `dynamic-user`
