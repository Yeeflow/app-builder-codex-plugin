# Generated Dashboard Baseline: Service Desk Pro Stage M

Source export studied: `<downloads>/Service Desk Pro Dashboard Stage L.yap`

## Package

- workspace wrapper: `service-desk-pro-dashboard-stage-m.generated.yap`
- Downloads copy: `<downloads>/service-desk-pro-dashboard-stage-m.generated.yap`
- app def: `service-desk-pro-dashboard-stage-m-app-def.json`
- resource: `service-desk-pro-dashboard-stage-m-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-m.mjs`
- ID family: `258`

## What This Proves

- The submitted-period filter can be applied to all local Service Desk Pro KPI summaries.
- The same submitted-period filter condition can be applied to the local `Open Tickets by Priority` chart.
- User-polished Settings card grids with three columns and wider gaps are import-safe.
- A richer static Help Guide card-grid layout is import-safe.

## Submitted-period Condition

The proven reusable condition shape is:

```json
{
  "pre": "and",
  "left": "Datetime1",
  "op": "0",
  "right": [
    {
      "exprType": "variable",
      "valueType": "string",
      "id": "__filter_f_SubmittedPeriod",
      "type": "expr",
      "name": "f_SubmittedPeriod"
    }
  ],
  "showCus": false
}
```

Apply this once per relevant local Support Tickets dashboard binding. Do not duplicate it on the same `exts` filter array.

## Validation Results

- `node --check generate-service-desk-pro-dashboard-stage-m.mjs`: pass
- package validation on decoded resource: `pass_with_warnings`
- only package warning: `APP_THEME_EMPTY`
- graph validation on decoded resource: pass
- wrapper build: pass
- wrapper round-trip: `decodedEqualsSource: true`
- package validation on wrapper: `pass_with_warnings`
- graph validation on wrapper: pass

## Runtime Results

Runtime environment: `https://<yourdomain>.yeeflow.com/`

Stage M imported and opened successfully. Executive Dashboard rendered the KPI cards and the submitted-period control. Clicking `Today` changed the four KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0`, confirming the period filter affected related summary controls.

Settings rendered the 3-column card grids with wider visual spacing. Help Guide rendered the improved static card-grid layout. Drill-down Tickets List rendered only the high-priority tickets `T-1001` and `T-1006`. The local Support Tickets and Support Teams lists opened without visible query failures.

## Known Gaps

- Executive Dashboard helper copy still describes date filtering as staged; update copy in the next generated package.
- Query-param to page `tempVars` mapping is still not proven.
- Original dynamic Drill-down `collection` card layout is still not regenerated.
- Original Settings tile actions remain excluded.
- SLA report resources remain excluded until report dependencies are studied in isolation.
