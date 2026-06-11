# Generated Dashboard Baseline: Service Desk Pro Stages I-L

## Package Family

Source export studied: `/Users/Renger/Downloads/Service Desk Pro (1).yap`

Generated packages:

- `service-desk-pro-dashboard-stage-i.generated.yap`
- `service-desk-pro-dashboard-stage-j.generated.yap`
- `service-desk-pro-dashboard-stage-k.generated.yap`
- `service-desk-pro-dashboard-stage-l.generated.yap`

Latest proven package:

- workspace wrapper: `service-desk-pro-dashboard-stage-l.generated.yap`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-l.generated.yap`
- app def: `service-desk-pro-dashboard-stage-l-app-def.json`
- resource: `service-desk-pro-dashboard-stage-l-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-l.mjs`
- ID family: `257`

## What This Proves

- Local Support Teams list can back a Service Desk-style dashboard select filter.
- `opendashboard` action can open an included Type `103` Drill-down page in a modal.
- Dashboard `data-list` controls can bind to an included local Support Tickets list.
- Static scalar filters in `attrs.data.filter` work for a dashboard `data-list` control.

## Resources Included

- root app/listset
- Type `103` pages:
  - `Executive Dashboard`
  - `Settings`
  - `Drill-down Tickets List`
  - `Help Guide`
- local data lists:
  - `Support Tickets`
  - `Support Teams`

## Proven Drill-down Data-list Pattern

The Stage K table control:

- `type: "data-list"`
- `attrs.data.list` points to local `Support Tickets`
- `attrs.listarr[]` maps fields:
  - `Text1` Ticket ID
  - `Title` Title
  - `Text2` Priority
  - `Text3` Status
  - `Text4` Assigned Team
- `attrs.data.filter: []`

The Stage L filtered table adds:

```json
{
  "key": "257l-filter-priority-high",
  "pre": "and",
  "left": "Text2",
  "op": "0",
  "right": "High",
  "showCus": true
}
```

## Validation Results

For Stage L:

- `node --check generate-service-desk-pro-dashboard-stage-l.mjs`: pass
- package validation on decoded resource: `pass_with_warnings`
- only package warning: `APP_THEME_EMPTY`
- graph validation on decoded resource: pass
- wrapper build: pass
- wrapper round-trip: `decodedEqualsSource: true`
- package validation on wrapper: `pass_with_warnings`
- graph validation on wrapper: pass

## Runtime Results

Runtime environment: `https://<yourdomain>.yeeflow.com`

Stage L imported and opened successfully. Direct navigation to `Drill-down Tickets List` rendered the data-bound table with only two rows: `T-1001` and `T-1006`. Both visible rows had `Priority = High`.

Stage K also proved the Executive Dashboard action path: clicking the `Drill-down Tickets List` operational card opened the Drill-down page in a modal and rendered the bound table.

## Known Gaps

- Query-param to page `tempVars` mapping is not yet proven.
- Original Drill-down `collection` card layout is not yet regenerated.
- Original Settings tile actions reference external dependencies and remain excluded.
- SLA report resources remain excluded until report dependencies are studied in isolation.

## Generator Rules Learned

- Use a fresh ID family for every import-test package.
- Add local target pages before adding `opendashboard` actions.
- Keep `opendashboard` target `PageID` on an included Type `103` layout.
- Keep query params harmless until temp-variable mapping is proven.
- Prove static `data-list` filters before variable-driven filters.
- Keep external Service Desk dependencies out unless they are included as local child resources and graph validation resolves them.
