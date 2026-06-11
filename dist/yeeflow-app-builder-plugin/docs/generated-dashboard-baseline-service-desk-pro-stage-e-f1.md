# Generated Dashboard Baseline: Service Desk Pro Stage E and F1

Source export studied: `<downloads>/Service Desk Pro (1).yap`

## Stage E

Package: `service-desk-pro-dashboard-stage-e.generated.yap`

Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-e.generated.yap`

What it proves:

- local `Support Tickets` list can drive one dashboard summary
- `COUNT(ListDataID)` summary binding works in the Service Desk Pro shell
- `Resource.ReportIds` must include the summary control id

Runtime result: pass.

Evidence:

- app imported as `Service Desk Pro Dashboard Stage E`
- app opened as `Executive Dashboard | Service Desk Pro Dashboard Stage E`
- `Total Submitted` rendered `6`

## Stage F1

Package: `service-desk-pro-dashboard-stage-f1.generated.yap`

Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-f1.generated.yap`

What it proves:

- four KPI summaries can bind to the local `Support Tickets` list
- nested status conditions can count resolved and open tickets
- a combined status plus priority condition can count critical active tickets

Runtime result: pass.

Evidence:

- app imported as `Service Desk Pro Dashboard Stage F1`
- app opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F1`
- KPI values rendered:
  - `Total Submitted`: `6`
  - `Resolved Tickets`: `2`
  - `Open Tickets`: `4`
  - `Critical Open`: `0`

## Stage F2

Package: `service-desk-pro-dashboard-stage-f2.generated.yap`

Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-f2.generated.yap`

Local validation result: pass with only the known `APP_THEME_EMPTY` package warning.

Runtime result: pass.

Evidence:

- app imported as `Service Desk Pro Dashboard Stage F2`
- app opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F2`
- KPI values still rendered `6`, `2`, `4`, and `0`
- `Open Tickets by Priority` rendered as a column chart with Medium and High buckets

## Stage G

Package: `service-desk-pro-dashboard-stage-g.generated.yap`

Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-g.generated.yap`

What it proves:

- Stage F2 can be extended with a second Type `103` page
- static Settings page cards import and render without carrying original external action links
- root navigation can include Executive Dashboard, Settings, and Support Tickets

Runtime result: pass.

Evidence:

- app imported as `Service Desk Pro Dashboard Stage G`
- app opened as `Executive Dashboard | Service Desk Pro Dashboard Stage G`
- `Settings` page opened and rendered Request Types, Ticket Categories, Support Teams, SLA Targets, Configuration Items, and Help Guide cards

## Stage H

Package: `service-desk-pro-dashboard-stage-h.generated.yap`

Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-h.generated.yap`

What it proves:

- Stage G can be extended with additional static Type `103` pages
- static `Drill-down Tickets List` and `Help Guide` page scaffolds import and render
- the local Support Tickets list still opens successfully after adding the page set

Runtime result: pass.

Evidence:

- app imported as `Service Desk Pro Dashboard Stage H`
- app opened as `Executive Dashboard | Service Desk Pro Dashboard Stage H`
- `Drill-down Tickets List` rendered six static ticket rows
- `Help Guide` rendered static dashboard overview/configuration/next-step sections
- `Support Tickets` list opened and rendered six local rows
