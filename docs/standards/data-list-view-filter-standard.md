# Data List View Filter Standard

This standard governs fixed Data View filters for Yeeflow Data Lists and Document Libraries. It applies to full application `.yapk` generation and standalone `.ydl` generation.

## Contract

Data View fixed filters live in the parsed `Layouts[].LayoutView.filter[]` array. They are different from user filter/search fields, which live in `Layouts[].LayoutView.query[]`.

Each generated App Plan data view must decide both:

- `Filter Conditions`: fixed business constraints that every user sees.
- `Query/Search Fields`: interactive filter fields that users can apply at runtime.

Do not satisfy a fixed filter requirement by adding only `query[]` fields.
Do not treat App Plan Section 13 as navigation metadata only. Every planned Data View must materialize as a real `Layouts[]` record with `Type: 0`, `Title`, `Ext1.Url`, and a complete `LayoutView` object.

## Export-Proven Basic Shape

```json
{
  "key": "<uuid-or-stable-condition-id>",
  "pre": "and",
  "left": "Datetime1",
  "op": "7",
  "right": null
}
```

Rules:

- `left` must be a real field storage name from the host list, such as `Datetime1`, `Text3`, `Decimal1`, or a known system field.
- `pre` may be `and` or `or`.
- `op: "7"` means the field is not empty and must use `right: null`.
- `right` may be a literal value, `null`, or an expression token array when the export proves that shape.
- Nested groups may use a `conditions[]` child array, up to two levels, when a view needs grouped `and` / `or` logic.

## Event Planning Golden Reference

The `Event Planning (1).ydl` focused sample proves these view-filter patterns:

| View | Fixed `LayoutView.filter[]` | User `LayoutView.query[]` |
| --- | --- | --- |
| `All Events` | `[]` | `Name`, `Date`, `RSVP Status` |
| `Schedule Overview` | `Datetime1 op "7" right null` AND `Datetime1 op "3" right [{ "type": "func", "func": "now", "params": [] }]` | `Name`, `Date` |
| `RSVP Tracker` | `Text3 op "7" right null` AND `Text4 op "7" right null` | `Name`, `RSVP Status`, `Guest List` |
| `Budget and Vendors` | `Text7 op "7" right null` OR `Decimal1 op "7" right null` | `Name`, `Vendors` |

Field mapping:

- `Date` = `Datetime1`
- `Guest List` = `Text3`
- `RSVP Status` = `Text4`
- `Budget` = `Decimal1`
- `Vendors` = `Text7`

## Today To Now Conversion

Yeeflow's current Data View expression editor does not expose a `Today` function in this export path. When the business requirement says `Date >= Today`, generate the export-proven `now` function:

```json
{
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

Never emit `Today`, `today()`, or `{ "func": "Today" }` in generated Data View fixed filters.

## Validation

Generated-final validation must fail when:

- `LayoutView.filter` is not an array.
- A filter field does not resolve to the host list fields or a known system field.
- A leaf condition omits `left` or `op`.
- `pre` is not `and` or `or`.
- `op: "7"` does not use `right: null`.
- a filter uses an unsupported `Today` token/function instead of `now`.

Validation must not confuse `LayoutView.query[]` user filters with `LayoutView.filter[]` fixed filters.
The regression gate must also materialize an Event Planning fixture from App Plan to generated-final `.yapk` and assert that the four planned data views appear as decoded `Type: 0` layouts with the expected filters.
