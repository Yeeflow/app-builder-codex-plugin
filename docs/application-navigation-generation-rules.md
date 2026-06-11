# Application Navigation Generation Rules

Generated application navigation must use Yeeflow export-proven runtime shapes, not local planning-only shapes.

## Group Shape

Use `Type: "classes"` and `list`:

```json
{
  "Title": "Reports",
  "Type": "classes",
  "list": [
    {
      "Title": "Leave Request Print Page",
      "Type": 103,
      "LayoutID": "1700000000000001"
    }
  ]
}
```

Do not emit grouped navigation with `children` or `Childs`. Those shapes can look grouped to local parsers while failing to render as grouped navigation in Yeeflow.

## Entry Targets

- Dashboard/page entries use `Type: 103` and target an included `Pages[].LayoutID`.
- Approval-form entries use `Type: 105` and `ListID` equal to an included `Forms[].Key`.
- Data-list entries use `Type: 1` and `ListID` equal to an included child list ID.

## Reachability

Generated resources intended for users must be visible in navigation. Hidden/deferred resources must be named in the generation report with the reason they are hidden.

Validators should reject generated-final packages when:

- a group uses `children` or `Childs`
- a `Type: "classes"` group has no `list`
- a dashboard/page navigation target does not resolve
- an approval-form navigation target does not resolve to `Forms[].Key`
- a data-list navigation target does not resolve to a child list
- an intended page/list/form is unreachable and not documented as hidden/deferred
