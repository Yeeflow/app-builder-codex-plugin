# Tab and Gantt Control Golden Reference Study

## Evidence and redaction

Read-only MCP inspection studied the `Project Overview` custom form on the `Projects` Data List in the `Real Estate Project Control Hub` application. IDs, raw layout resources, tokens, and tenant metadata are intentionally omitted.

The form contains one `aktabs` control with six `ak-tabs-tab` children and one `gantt` control in the programme/schedule section. The form also contains Custom Code and document-specific modules; those are source-form concerns, not dependencies of the golden references.

## Extracted control relationships

```text
Projects current record (ListDataID)
  └─ Project Overview custom form
       ├─ Tab workspace
       │    └─ Programme/Schedule tab
       │         └─ Gantt source: Activities
       └─ Current ListDataID filters Activities.Project

Activities
  ├─ Dependency ── multiple self Lookup
  ├─ Parent ────── optional single self Lookup
  ├─ Actual Start / Finish ─ Datetime
  ├─ Actual End ──────────── Datetime
  └─ Complete Percentage ─── Decimal + percent control
```

## Tab extraction

The real form used six peer tabs, the first marked as both the runtime and Designer default. Every tab carried actual nested content. The reusable contract is therefore structural rather than domain-specific: `aktabs` → `ak-tabs-tab[]` → content container(s), one default tab, and stable IDs/labels. The generic template deliberately starts with two tabs; materializers may add validated tabs for the approved form plan.

## Gantt extraction

The Gantt source is Activities and is filtered by the current Project record through an Activity Project lookup. It sorts by the chosen start date, passes the current Project ID into the child lookup on Add, and points item detail opening at the Activity View layout.

The precise source field names are intentionally not made a generation default. The type contract is the portable reference:

- start/end use Datetime storage;
- predecessor dependencies use a multi-value self Lookup;
- completion uses Decimal storage plus a percent control and zero-to-one range;
- hierarchy is optional and uses a single-value self Lookup;
- every lookup target equals the selected Gantt data source, not merely a list with a matching display name.

## Promotion result

The study promotes two redacted templates, a registry, a generator standard, a structural/type validator, and regression fixtures. It is configuration-readback-proven and validator-backed. It does not promote the source application's Custom Code, document library, exact labels, Activity View layout ID, source record data, or runtime Gantt behavior as generic reusable defaults.
