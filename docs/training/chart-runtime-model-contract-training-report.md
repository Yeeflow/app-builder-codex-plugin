# Chart Runtime Model Contract Training Report

## Context

Office Asset Loan Management live Dashboard upgrades showed that Data Analytics chart controls can pass structural/template checks while still rendering a Yeeflow runtime error:

`The model could not be loaded. Please complete or fix the chart configuration.`

The failing pages had visible chart shells and `dataAnalyticsTemplateId` provenance, but the visible controls and host layout runtime metadata were not a single coherent model. In particular, chart readiness depends on both the visible chart/pivot control and the host layout resource `ReportIds[]` plus `exts[]` runtime model.

## Training Scope

This focused training applies to Dashboard and Data List form Data Analytics controls only. It does not change Approval form behavior, Form report upgrade scope, signing, install, or seed data rules.

## Required Contract

Every generated chart or pivot instance must satisfy all of these before generated-final signing readiness:

- Clone the approved Data Analytics golden reference wrapper and preserve its locked style/layout properties.
- Use a stable visible chart or pivot control ID.
- Register that exact ID in the same layout resource `ReportIds[]`.
- Register exactly one matching `Resource.exts[]` entry whose `i` equals the visible control ID.
- Use `category: "___Pivot___"` and the expected runtime `key`.
- Include `attr.AppID`, `attr.ListID`, and `attr.ListSetID` that resolve to the generated package source list/report.
- Include non-empty `attr.settings.rows[]` and `attr.settings.values[]`.
- Use real source field references, never derived aggregate aliases such as `ListDataID_COUNT`.
- For COUNT metrics, use `ListDataID` for `field`, `fieldName`, `FieldName`, and `id`.
- For line/area date trend rows, include `func: "DATE"`.
- Keep visible `attrs.data.list` and `attrs.model.source` aligned with the `exts[].attr` source metadata.
- Keep visible `attrs.data`, `attrs.model`, `attrs.series[]`, and `attrs.values[]` aligned with `exts[].attr.settings.rows[]` and `settings.values[]`.
- Set `runtimeModelProven: true` only after the full wrapper, visible model surfaces, `ReportIds[]`, `exts[]`, source metadata, rows/values, and field resolution are all materialized.

## Enforcement Added

- Data Analytics validation now rejects duplicate runtime `exts[]` entries for the same visible chart ID.
- Data Analytics validation now rejects runtime source `ListID` values that do not resolve to a package source list.
- Data Analytics validation now rejects visible chart controls missing required `attrs.data`, `attrs.model`, `attrs.series[]`, or `attrs.values[]` runtime model surfaces.
- Runtime evidence inspection now rejects chart model-load error text even when a canvas or visible chart shell is present.
- Regression coverage includes duplicate ext, unresolved runtime source list, missing visible chart model surfaces, and model-load runtime proof failures.

## Proof Boundary

Passing local generated-final validation proves the package contains the required chart/pivot model contract. It does not prove final browser rendering. Runtime acceptance still requires Version Management success plus delayed/refresh browser evidence showing rendered chart or pivot output and no Yeeflow model-load error.
