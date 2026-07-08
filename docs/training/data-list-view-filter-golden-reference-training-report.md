# Data List View Filter Golden Reference Training Report

## Source Evidence

Focused sample: `/Users/rengerhu/Downloads/Event Planning (1).ydl`.

The sample was inspected with `inspect-ydl-package.js` and proves that business-specific Data Views must materialize fixed filter conditions into `Layouts[].LayoutView.filter[]`, not only into user `query[]` filters.

## Business Requirement

Event Planning has four views:

| View | Required fixed filter |
| --- | --- |
| `All Events` | none |
| `Schedule Overview` | `Date is not empty` and production-style `Date >= now` |
| `RSVP Tracker` | `Guest List is not empty` AND `RSVP Status is not empty` |
| `Budget and Vendors` | `Budget is not empty` OR `Vendors is not empty` |

Field mapping:

- `Date` -> `Datetime1`
- `Guest List` -> `Text3`
- `RSVP Status` -> `Text4`
- `Budget` -> `Decimal1`
- `Vendors` -> `Text7`

## Learned Export Shapes

`is not empty` uses:

```json
{
  "pre": "and",
  "left": "Text3",
  "op": "7",
  "right": null
}
```

The OR view uses `pre: "or"` on each condition:

```json
[
  { "pre": "or", "left": "Text7", "op": "7", "right": null },
  { "pre": "or", "left": "Decimal1", "op": "7", "right": null }
]
```

The date lower-bound condition uses `now`, not `Today`:

```json
{
  "pre": "and",
  "left": "Datetime1",
  "op": "3",
  "right": [
    {
      "type": "func",
      "func": "now",
      "params": []
    }
  ],
  "showCus": false
}
```

## Training Rules

1. App Plan Section 13 must distinguish fixed `Filter Conditions` from interactive `Query/Search Fields`.
2. The generator must accept fixed-filter column aliases including `Filter Conditions`, `Fixed Filters`, `Filter`, `Filters`, `Data Filter`, and `Data Filters`.
3. The generator must preserve planned fixed filters in `LayoutView.filter[]`.
4. The generator must preserve planned user filters in `LayoutView.query[]`.
5. `All` / default views may have empty fixed filters when they intentionally show the full record set.
6. Business views such as schedule, tracker, finance, and operations views should have fixed filters when the business purpose narrows the record set.
7. Use `pre: "and"` for cumulative requirements and `pre: "or"` for any-of requirements.
8. Convert business wording `Today` to the export-proven `now` function for Data View filters.
9. Do not generate unsupported `Today` tokens or functions.
10. Non-empty fixed-filter cells must contain executable field-level conditions. Vague phrases such as `All active meetings` must be converted to concrete comparisons such as `Meeting Status = Active`; otherwise materialization must fail.
11. A planned fixed-filter cell that does not produce at least one `LayoutView.filter[]` condition is a generated-final blocker.

## Hard Gates Added

- `DATA_VIEW_FILTER_SHAPE_INVALID`
- `DATA_VIEW_FILTER_FIELD_MISSING`
- `DATA_VIEW_FILTER_FIELD_NOT_FOUND`
- `DATA_VIEW_FILTER_OPERATOR_MISSING`
- `DATA_VIEW_FILTER_PRE_INVALID`
- `DATA_VIEW_FILTER_EMPTY_OPERATOR_RIGHT_NOT_NULL`
- `DATA_VIEW_FILTER_TODAY_FUNCTION_UNSUPPORTED`
- `DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED`
- `DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW`

Regression script:

- `scripts/test-data-list-view-filter-gates.mjs`

The regression now includes an App Plan materialization fixture. It generates an Event Planning package in fixture-ID mode, decodes the generated-final `.yapk`, and asserts that:

- `All Events`, `Schedule Overview`, `RSVP Tracker`, and `Budget and Vendors` all exist as `Type: 0` data view layouts.
- `All Events` remains unfiltered.
- `Schedule Overview` uses `Datetime1 op "7"` and `Datetime1 op "3" now`.
- `RSVP Tracker` uses `Text3/Text4` non-empty AND filters.
- `Budget and Vendors` uses `Decimal1/Text7` non-empty OR filters.

The regression also covers the corporate-secretarial failure shape: a Section 13 table using the `Filters` header and a vague value such as `All active meetings` must fail with `DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED` rather than silently generating an empty `LayoutView.filter[]`.

It also covers two corporate-secretarial follow-up cases:

- A positive Meeting Tracker fixture with a parseable `Board Committee Meetings` field table and explicit filter `Meeting Date is not empty AND Minutes Status != Closed` must materialize `Datetime1 op "7"` and `Text5 op "1" right "Closed"`.
- A planned Meeting Tracker view that references business columns or fixed filters without any parseable field table must fail with `DATA_LIST_FIELD_TABLE_REQUIRED_FOR_PLANNED_VIEW`; generator fallback to native `Title` only is not acceptable for business-specific views.
