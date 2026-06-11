# Service Desk Pro Stage D Pattern

Use this reference after `service-desk-pro-stage-c-pattern.md` when resuming the Service Desk Pro dashboard rebuild.

## Proven Package

- workspace package: `service-desk-pro-dashboard-stage-d.generated.yap`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-d.generated.yap`
- source export studied: `/Users/Renger/Downloads/Service Desk Pro (1).yap`
- runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened, rendered the static Executive Dashboard, and opened the local `Support Tickets` list with six rows and no visible `datas/query` failure

## Scope

Stage D adds one local `Support Tickets` child data list to the proven Stage C static Executive Dashboard shell.

It intentionally excludes:

- dashboard `exts`
- bound summary values
- chart widgets
- dashboard filters
- reports
- approval forms
- workflows
- Settings page
- Drill-down Tickets List
- Help Guide
- external dependencies

## Minimal Support Tickets Field Pattern

Use only the minimum local fields needed before adding the first bound KPI:

- native `Title` displayed as `Ticket Title`
- `Text1` displayed as `Ticket ID`
- `Text2` displayed as `Priority`
- `Text3` displayed as `Status`
- `Text4` displayed as `Assigned Team`
- `Datetime1` displayed as `Created Time`
- `Decimal1` displayed as `First Response Hours`
- `Decimal2` displayed as `Resolution Hours`
- `Bit1` displayed as `First Response SLA Compliance`
- `Bit2` displayed as `Resolution SLA Compliance`

The native Title field must preserve:

- `FieldName: "Title"`
- `Status: 0`
- `IsSystem: true`
- `IsIndex: true`

## ReplaceIds

Include local IDs for:

- root app/listset
- Type `103` Executive Dashboard layout
- Support Tickets list
- Support Tickets list view layout
- Support Tickets fields
- local sample rows

Do not introduce external dependency IDs in Stage D.

## Runtime Checklist

After import:

- app appears as `Service Desk Pro Dashboard Stage D`
- app opens to `Executive Dashboard`
- navigation includes `Support Tickets`
- Executive Dashboard renders static placeholder content
- `Support Tickets` opens as a data list
- sample rows render
- no visible `api/crafts/datas/{AppID}/{ListID}/query` failure occurs

## Generator Rule

Before binding any Service Desk Pro dashboard KPI, prove the source list imports and queries by itself. Stage E may add exactly one bound summary over this local list, using a fresh ID family.
