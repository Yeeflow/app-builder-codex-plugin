# Tab and Gantt Control Golden Reference Standard

## Status and scope

This standard records privacy-safe configuration learning from the `Projects` Data List `Project Overview` custom form in Real Estate Project Control Hub. It is a generation and validation contract for the following Data List custom-form controls:

- `tab_control_workspace` (`aktabs`)
- `gantt_control_linked_activity` (`gantt`)

It does not copy tenant, workspace, application, list, layout, record, or user identifiers. Replace every `{{...}}` placeholder with a resolving ID or field name for the target application.

## Selection

Use `tab_control_workspace` when a form needs several peer sections, each with its own meaningful content. Use `gantt_control_linked_activity` only when the selected Activity source list contains the required fields and the parent form can provide a current `ListDataID` for the relationship filter and Add defaults.

Do not use either template as a full-page clone. The source form contains source-specific Custom Code, document, and business sections that are not part of these reusable control templates.

## Tab structure

Clone `docs/reference/tab-control-workspace.template.json`.

- Root type is `aktabs`.
- Every direct tab is `ak-tabs-tab` with a unique stable ID, non-empty label, and at least one content container/control.
- Exactly one child sets both `attrs.isDefault = true` and `attrs.isDesignDefault = true`; all other tabs set both to false.
- Preserve the observed root top margin token `--sp--s100` unless the host page layout needs a documented variation.
- `attrs.tabs-tabposition` is optional. When supplied, only use `top`, `bottom`, `left`, or `right`.
- Map labels and tab contents to the target domain; do not retain source-specific labels or Custom Code controls by default.

## Gantt source and relationship structure

Clone `docs/reference/gantt-control-linked-activity.template.json` only after the Activity Data List and its Type 1 detail/View layout are resolved.

1. `attrs.data.list` must identify the selected Activity Data List.
2. The standard related-record filter is `Activity.ParentBusinessLookup == current parent ListDataID`. The filter left field and Add `passvalues[].Name` must be the same Activity lookup field.
3. `attrs.data.gantt.atts.allowadd = true` requires `passvalues` to set that lookup field from the current parent `ListDataID` expression.
4. `linkLayout` must resolve to a Type 1 detail/View layout on the Activity source list. Keep the observed `modalsize: 2`, month scale, toolbar, milestones, automatic scheduling, and right skin unless the App Plan explicitly changes them.
5. The selected source list and every Gantt field mapping must resolve before materialization. Never bind by display label alone.

## Gantt field compatibility contract

Inspect both the Yeeflow storage metadata and the form control metadata. `FieldType` alone is insufficient for Lookup and Percent validation.

| Gantt mapping | Required field metadata |
| --- | --- |
| `start_date` | `FieldType = Datetime` |
| `end_date` | `FieldType = Datetime` |
| `dependency` | `Type = lookup`; parsed `Rules.multiple = true`; parsed `Rules.listid` equals `attrs.data.list.ListID` |
| `progress` | `FieldType = Decimal`; `Type = percent`; normalized Rules range is `number_min = 0`, `number_max = 1` |
| `parent` | Optional. If mapped: `Type = lookup`; parsed `Rules.multiple = false`; parsed `Rules.listid` equals `attrs.data.list.ListID` |

The observed Activity reference uses an Activity title for text, two Datetime fields for actual start/end, a multiple self-Lookup for predecessors, a Decimal/percent completion value, and an optional single self-Lookup for hierarchy. A business may use different internal field names, but it must preserve these type relationships.

## Validation and stop conditions

Run:

```bash
node scripts/validate-tab-gantt-golden-references.mjs <decoded-app-or-fixture.json> --strict
node scripts/test-tab-gantt-golden-references.mjs
```

Stop before packaging or live save if any required Gantt source field is missing, either date field is not `Datetime`, Dependency is not a same-source multiple Lookup, Progress is not Decimal/percent, a mapped Parent is not a same-source single Lookup, the parent filter/`passvalues` relationship does not resolve, a Tab has no content, or the default-tab count is not exactly one.

## Proof boundary

The source configuration was read back from the live Designer data model. The plugin also has a separate focused Dashboard proof that Tab switching works. This does not prove this exact Gantt configuration renders, schedules, opens Activity View, creates prefilled child activities, or executes dependencies in a generated Data List form. Those behaviors require a focused generated-package runtime test before a runtime-proven release claim.
