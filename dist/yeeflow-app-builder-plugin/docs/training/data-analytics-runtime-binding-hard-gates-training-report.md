# Data Analytics Runtime Binding Hard Gates Training Report

## Context

Office Asset Loan Management validation found that Dashboard Data Analytics templates were visually materialized but rendered blank at runtime. The generated pages contained Pie, Bar, Line, Area, and Pivot controls with template provenance, but the host layout resources only registered KPI Summary runtime entries. Chart and pivot controls were missing the Yeeflow runtime model required by `Resource.exts[]` and `Resource.ReportIds[]`.

## Training Scope

This training closes the gap between visual Data Analytics template materialization and runtime-ready chart/pivot materialization:

- Data Analytics controls must still clone the approved golden reference templates.
- Every visible chart or pivot control must have a stable control ID.
- The same layout resource must include that control ID in `Resource.ReportIds[]`.
- The same layout resource must include a matching `Resource.exts[]` entry.
- Chart/pivot runtime entries must use `category: "___Pivot___"`.
- Runtime entry `key` must match the generated control family: `pie-chart`, `bar-chart`, `line-chart`, or `PivotTable`.
- Runtime entry `i` must equal the visible chart/pivot control ID.
- Runtime entry `attr` must include `AppID`, `ListID`, `ListSetID`, chart type for chart controls, and non-empty `settings.rows[]` plus `settings.values[]`.
- Runtime field references must resolve to fields on the selected source list/report.

## Enforcement Added

- `validate-data-analytics-golden-references.mjs` now validates runtime `ReportIds[]`, `exts[]`, source metadata, chart type, settings rows/values, and field resolution.
- `materialize-full-app-generated-final.mjs` now emits runtime contracts for materialized Dashboard Data Analytics templates.
- Focused regression coverage now fails provenance-only charts, missing `ReportIds[]`, missing `exts[]`, and unresolved runtime field references.
- Data Analytics standards and generation/validation skill guidance now state that provenance-only chart wrappers are not generated-final complete.

## Safety Boundary

This training only changes local generation, validation, standards, skills, and regression coverage. It does not bump plugin version metadata, move `stable`, create tags/releases/plugin archives, perform live Yeeflow writes, sign packages, install packages, import packages, upgrade applications, seed data, or claim browser/runtime proof.
