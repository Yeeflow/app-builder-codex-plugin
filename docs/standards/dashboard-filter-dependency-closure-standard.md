# Dashboard Filter Dependency Closure Standard

## Required planning matrix

For each Dashboard filter, plan one row per consumer region: declaration id, control type, control source, consumer, consumer list, consumer field, condition path, and status (`applicable`, `not-applicable`, or `mirror-required`). `not-applicable` must state why; `mirror-required` must name the source field and the maintained target mirror.

## Token and source rules

- Declare `filter_<page>_<name>` in `filterVars[].id`; never declare `__filter_...`.
- Use `__filter_<declaration>` only in the filter control `binding` and expression `id`; expression `name` is the declaration.
- Search consumers use `attrs.data.fulltext[]`; Select-like consumers use `attrs.data.filter[]` with `key`, `pre`, `left`, `op`, `right`, and `showCus`.
- The consumer condition `left` must be a real field of that consumer's own Data List. A lookup to another list does not make the other list's fields locally filterable.
- A cross-list business filter needs a maintained mirror field or separately runtime-proven related-query contract. Otherwise mark the region `not-applicable` and do not emit a condition.

## Gates and evidence

Before save, run the runtime binding validator and fail on runtime-prefixed declarations, unresolved control bindings, unused variables, or missing consumer fields. After readback, publish a binding audit and run browser smoke for default, single-value, Search, two-filter intersection, and clear/reset states. API acceptance and persisted readback are not filter-runtime proof.
