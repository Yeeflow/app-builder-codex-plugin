# Service Tickets Focused Section And Filter Cleanup Training Report

## Scope

This focused training captures the `0.8.111` Service Tickets E2E feedback where the generated package correctly materialized the two-panel master-detail Dashboard shell but still failed signing-readiness hard gates.

The training is limited to two confirmed plugin defects:

1. Empty `section_title_area` containers remained in a generated master-detail Dashboard.
2. The `Status` filter was bound to the correct field but included unplanned generic workflow options.

No signing, install, seed, Version Management, or browser runtime proof is claimed by this training.

## Generator Rules

### Empty section-title cleanup

For `dashboard-page-layouts-two-panel-workspace` and `dashboard-page-layouts-three-panel-workspace`, `section_title_area` is optional. If it has no `section_title_header` and no configured `Operations` region, remove it before generated-final output.

Do not run Dashboard Page Layouts v1.1 content-card slot repair on master-detail workspace pages. That v1.1 repair can reinsert an empty `section_title_area`, which immediately violates the master-detail cleanup contract.

### Choice filter option source discipline

Choice filter options must come from the App Plan field choices or the generated source field `Rules.choices`. If either source is present, do not append generic fallback choices.

For Service Tickets:

- Priority options must be exactly `Low`, `Medium`, `High`, `Critical`.
- Status options must be exactly `Open`, `In Progress`, `Resolved`, `Closed`.
- Generic workflow/status values such as `Draft`, `Submitted`, and `Completed` must not appear unless explicitly planned.

## Validator And Regression Requirements

The Service Tickets regression gate must assert exact filter option sets, not just non-empty option lists. The dashboard hard gate must continue to fail empty `section_title_area` containers, and the materializer must be fixed so generated-final packages do not reach that failure.

## Proof Boundary

This training is local generator/regression backed. It does not claim a live Yeeflow runtime pass until a later fresh E2E signs, installs, seeds, and proves the two-panel Dashboard behavior in browser.
