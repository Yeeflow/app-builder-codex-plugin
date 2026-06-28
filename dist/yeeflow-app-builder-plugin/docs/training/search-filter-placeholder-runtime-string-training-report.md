# Search Filter Placeholder Runtime String Training

## Trigger

A generated Dashboard search filter rendered `[object Object]` in the browser. The decoded resource showed `search-filter.attrs.placeholder` had been generated as:

```json
{ "value": "Search Vendor Requests" }
```

That shape is valid for some label/style helper patterns, but it is not valid for the runtime input placeholder used by `search-filter`.

## Root Cause

The full-app materializer initially created Collection toolbar search filters with primitive placeholder strings, but a later Collection template adaptation pass rewrote every `search-filter` to object-shaped `attrs.placeholder = { "value": "Search <List>" }`.

The existing Dashboard generation hard gate rejected numeric string-spread placeholder objects such as `{ "0": "S", "1": "e", "value": "Search Requests" }`, but it still allowed a plain object with only `value`. That left a validator gap for the runtime failure.

## Generator Rule

Generated `search-filter` controls must set:

```json
"attrs": {
  "placeholder": "Search Vendor Requests"
}
```

Do not emit object-shaped values for `search-filter.attrs.placeholder`, including `{ "value": "..." }`.

Placeholder styling must be carried in proven edit/style paths. The runtime placeholder text field itself remains a primitive string.

## Validator Rule

Generated-final Dashboard hard gates must fail any object-shaped `search-filter.attrs.placeholder` before signing readiness.

Expected failure code:

```text
DASH_SEARCH_FILTER_PLACEHOLDER_OBJECT_FORBIDDEN
```

The gate continues to reject literal `[object Object]` strings and malformed numeric-key placeholder objects.

## Scope

This rule targets `search-filter` runtime input controls. It does not change approved select/radio/filter label or visual style contracts, where export-proven object-shaped style metadata may still be valid in other attributes.

## Validation Added

- Full-app materializer Collection template adaptation now preserves string placeholders for generated `search-filter` controls.
- Dashboard hard gates reject `{ "value": "Search ..." }` on `search-filter.attrs.placeholder`.
- Focused regression coverage proves both numeric-key and plain value-object search placeholder shapes fail before signing readiness.
