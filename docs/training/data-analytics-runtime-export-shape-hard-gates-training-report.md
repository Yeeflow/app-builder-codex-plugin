# Data Analytics Runtime Export Shape Hard Gates Training Report

## Context

Plugin 0.8.110 added Data Analytics runtime hard gates for `ReportIds[]`, matching `Resource.exts[]`, source metadata, chart type codes, date trend row functions, field resolution, visible/runtime model alignment, and `runtimeModelProven`.

A real Office Asset Loan Management regression still passed those gates even though Yeeflow runtime showed chart configuration errors. The failing package was not missing `ReportIds[]` or `exts[]`. Its chart runtime model was too thin: `settings.rows[]` and `settings.values[]` contained field/id tuples, but lacked the export-shaped metadata that the runtime materializer needs.

## Learned Failure Shape

The old generated-final chart model used rows and values shaped like:

```json
{
  "rows": [
    {
      "field": "Datetime1",
      "fieldName": "Datetime1",
      "FieldName": "Datetime1",
      "id": "Datetime1",
      "label": "Checkout Date",
      "role": "row",
      "func": "DATE"
    }
  ],
  "values": [
    {
      "field": "ListDataID",
      "fieldName": "ListDataID",
      "FieldName": "ListDataID",
      "id": "ListDataID",
      "label": "Are requests and returns trending over time?",
      "role": "value",
      "func": "COUNT",
      "aggregate": "COUNT"
    }
  ]
}
```

This is structurally plausible but not export-shaped enough for runtime chart materialization.

## Required Runtime Shape

Generated Data Analytics runtime models must preserve export-shaped metadata:

- `settings.preConditions` must exist, even when `null`.
- `settings.Conditions` must exist and must be an array, even when empty.
- Every `settings.rows[]` entry must include `id`, `fieldName`, `fieldType`, `type`, and an `attr` object.
- Every `settings.values[]` entry must include `id`, `field`, `fieldName`, `FieldName`, `fieldType`, `type`, and an `attr` object.
- Line and area date trend rows still require `func: "DATE"`.
- COUNT values must still use `ListDataID` for `field`, `fieldName`, `FieldName`, and `id`, plus aggregate metadata.

Example accepted value entry:

```json
{
  "type": "input",
  "label": "Id",
  "attr": {
    "displayLabel": true,
    "readonly": true
  },
  "field": "ListDataID",
  "fieldName": "ListDataID",
  "FieldName": "ListDataID",
  "fieldType": "Bigint",
  "func": "COUNT",
  "id": "ListDataID",
  "aggregate": "COUNT"
}
```

## Enforcement Added

`validate-data-analytics-golden-references.mjs` now fails incomplete runtime export shapes with:

- `DATA_ANALYTICS_RUNTIME_ROW_EXPORT_SHAPE_INCOMPLETE`
- `DATA_ANALYTICS_RUNTIME_VALUE_EXPORT_SHAPE_INCOMPLETE`
- `DATA_ANALYTICS_RUNTIME_CONDITIONS_SHAPE_MISSING`

`test-data-analytics-golden-reference-gates.mjs` now includes focused regressions for rows/values/settings that have fields and ext registration but omit export-shaped metadata.

## Generator Requirement

The materializer must not generate visual chart shells with thin runtime tuples. It must write the complete export-shaped `Resource.exts[].attr.settings` model before setting `runtimeModelProven: true` or allowing generated-final signing readiness.

## Safety Boundary

This training changes validation, standards, and regression coverage. It does not sign, install, upgrade, seed data, perform live browser proof, move `stable`, or claim runtime repair for already-installed apps.
