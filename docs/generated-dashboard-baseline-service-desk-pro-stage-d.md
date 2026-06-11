# Generated Dashboard Baseline: Service Desk Pro Stage D

Package: `service-desk-pro-dashboard-stage-d.generated.yap`

Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-d.generated.yap`

Source export studied: `/Users/Renger/Downloads/Service Desk Pro (1).yap`

## What This Proves

Stage D proves the Service Desk Pro-style Executive Dashboard shell can safely include one local `Support Tickets` source list before any dashboard binding is added.

This is the first Service Desk Pro resumed package that includes a child data list.

## Resources Included

- root app/listset: `2480010000000000000`
- Type `103` Executive Dashboard layout: `2480010000000000001`
- Support Tickets list: `2480020000000001000`
- Support Tickets list view layout: `2480020000000001801`
- sample ticket rows: six local records

The package intentionally excludes approval forms, workflows, document libraries, AI modules, reports, Settings, Drill-down Tickets List, Help Guide, dashboard `exts`, filters, and data-bound widgets.

## Support Tickets Minimal Field Pattern

- `Title`: `Ticket Title`, with native Title metadata preserved
- `Text1`: `Ticket ID`
- `Text2`: `Priority`
- `Text3`: `Status`
- `Text4`: `Assigned Team`
- `Datetime1`: `Created Time`
- `Decimal1`: `First Response Hours`
- `Decimal2`: `Resolution Hours`
- `Bit1`: `First Response SLA Compliance`
- `Bit2`: `Resolution SLA Compliance`

## ReplaceIds Rules

`ReplaceIds` includes the local root app ID, dashboard layout ID, Support Tickets list ID, Support Tickets view layout ID, local field IDs, and local sample row IDs.

No external dependency IDs are introduced in Stage D.

## Validation Results

- `node --check generate-service-desk-pro-dashboard-stage-d.mjs`: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

## Runtime Results

Runtime target: `https://<yourdomain>.yeeflow.com`

Result: pass.

Evidence:

- import metadata parsed `Service Desk Pro Dashboard Stage D`
- app appeared in Shared Workspace after refresh
- app opened to `Executive Dashboard | Service Desk Pro Dashboard Stage D`
- Executive Dashboard rendered the static Stage C content plus the Stage D source-list note
- `Support Tickets` navigation opened the list view
- six sample rows rendered
- no visible `datas/query` failure appeared while opening the list

## Known Gaps

- no dashboard data binding is proven in the Service Desk Pro shell yet
- no dashboard `exts` are included
- no Service Desk Pro filters are included
- no chart widgets are included
- no Settings page or actions are included
- no drill-down dashboard action is included

## Generator Rules Learned

- Add local source lists before adding Service Desk Pro dashboard bindings.
- Preserve native `Title` field metadata exactly.
- Keep the dashboard page static while proving the list import/query path.
- Include local sample row IDs in `ReplaceIds`.
- Move to one bound summary only after the local list opens successfully in runtime.

## Next Stage

Stage E should bind exactly one KPI card, recommended `Total Submitted`, to the local `Support Tickets` list count. Use a fresh ID family and keep all charts, filters, Settings, reports, and drill-down actions out of the package.
