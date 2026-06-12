# Dashboard Grid-Table Collection Pattern

Use this pattern when a dashboard page needs a table-like record list with designer/runtime fidelity. The Task Tracker incident showed that schema-valid, signed, and install-accepted packages can still render poorly or lose designer fidelity when dashboard record lists are generated with the wrong control family or incomplete metadata.

## Lessons

- Signing, signature verification, and install acceptance do not prove dashboard visual fidelity or designer behavior.
- Dashboard record-list sections that need the grid-table visual pattern should use grid-table style `collection` controls, not dashboard `data-list` controls, unless the user explicitly requests Data table.
- A header `flex_grid` and its Collection must be siblings inside one wrapper container.
- The wrapper must serialize both runtime and designer gap metadata: `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`.
- Duplicate dashboard header bars should be hidden with `attrs.hideHeaderAll = true` when the app shell/navigation already provides page context.
- Dashboard page titles should use visible typography such as `attrs.heads.ty = [null, "h5-medium"]`.
- Text controls need sufficient designer/runtime style metadata: width/positioning where needed, token typography, and a plain-string color or validated color token.
- Collection row-click detail requires a concrete Type `1` custom detail layout for the source data list.
- Internal helper metadata such as `DetailLayoutID` must not be enumerable on encoded package objects.
- Type `1` custom detail layout `LayoutView` must use a schema-compatible value such as an empty string, not `null`.

## Required Shape

```json
{
  "type": "container",
  "attrs": {
    "container": { "gap": 0 },
    "style": { "gap": [null, 0] }
  },
  "children": [
    { "type": "flex_grid" },
    {
      "type": "collection",
      "attrs": {
        "data": {
          "list": { "ListID": "<source-list-id>" },
          "link": "<type-1-custom-detail-layout-id>",
          "opentype": "slide",
          "modalsize": 2
        }
      },
      "children": [
        { "type": "flex_grid" }
      ]
    }
  ]
}
```

## Validator

Run the local gate before signing, install, upgrade-check, or handoff:

```bash
node scripts/validate-dashboard-grid-table-collections.mjs \
  --package dist/<app>.yapk \
  --require-grid-table-collections \
  --require-hide-header \
  --require-visible-title
```

Use the stricter flags when the approved plan requires grid-table Collections, hidden dashboard headers, or visible title styling. The generated-final preflight also runs the base validator so malformed grid-table Collections, helper leaks, bad detail links, and null Type `1` `LayoutView` values are caught.

## Runtime Checklist

- Open the dashboard page.
- Confirm the duplicate dashboard header is hidden when planned.
- Confirm the dashboard title size and style match the plan.
- Confirm the header grid and Collection have no visible gap.
- Click a Collection row and confirm the slide detail opens.
- Confirm the detail modal size matches the plan.
- Refresh navigation and confirm the dashboard still renders.
