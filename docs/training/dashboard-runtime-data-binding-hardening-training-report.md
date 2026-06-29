# Dashboard Runtime Data Binding Hardening Training Report

## Source Evidence

This training round is based on `plugin-training-analysis-dashboard-runtime-data-binding-20260629.md`, which captured the clean full E2E runtime proof and follow-up diagnosis for Dashboard runtime data binding.

The verified runtime lesson is that generated Dashboard controls can be structurally correct while still rendering empty or unusable at runtime when the binding contract is incomplete. The highest-risk examples were Data Analytics controls that had visible template provenance but missing or drifting chart/pivot runtime metadata, KPI cards whose Summary/temp variable model drifted from the visible value binding, filters that were declared but not consumed, and Collection regions whose source fields or dynamic controls did not resolve to real data.

## Training Decisions

- Data Analytics templates remain visual golden references, but generated-final readiness now requires a complete runtime chart/pivot contract in the same layout resource.
- The visible chart/pivot control and the `Resource.exts[]` runtime model must agree on source identity, not only on field names.
- COUNT analytics must use the runtime-proven `ListDataID` field identity for `field`, `fieldName`, `FieldName`, and `id`.
- Empty `settings.rows[]` / `settings.values[]` objects are not acceptable runtime models.
- `runtimeModelProven: true` is valid only after the wrapper, visible source metadata, `ReportIds[]`, `exts[]`, row/value fields, and visible model surfaces are aligned.
- KPI/Summary, filters, Collections, application icon, package scope, and canonical URL/runtime proof remain separate hard-gate concerns. Passing a structural validator is not enough to claim runtime-visible Dashboard quality.

## Generator Changes

The full-app materializer now writes `ListSetID` into the visible Data Analytics control source surfaces:

- `attrs.data.list.AppID`
- `attrs.data.list.ListID`
- `attrs.data.list.ListSetID`
- `attrs.model.source.AppID`
- `attrs.model.source.ListID`
- `attrs.model.source.ListSetID`

For COUNT analytics values, generated runtime values now use `ListDataID` for the visible model and runtime ext identity instead of field UUIDs or derived aggregate IDs.

## Validator Changes

`validate-data-analytics-golden-references.mjs` now fails generated resources when:

- a visible Data Analytics control omits `AppID`, `ListID`, or `ListSetID` on `attrs.data.list` or `attrs.model.source`;
- the visible source metadata does not match the matching `Resource.exts[]` entry;
- runtime row or value entries are empty objects without a real field identity;
- COUNT runtime values do not use `ListDataID` for `field`, `fieldName`, `FieldName`, and `id`.

The focused regression suite now includes explicit pass/fail coverage for those cases.

## Hard-Gate Expectations

Before signing or installing a generated Dashboard package:

- Run `scripts/validate-data-analytics-golden-references.mjs --package <package.yapk>`.
- Run the aggregate generated-final preflight.
- Run runtime-binding gates when filters, KPI/Summary controls, Collection regions, Data tables, charts, or pivots are present.
- Treat blank charts, `No data` pages, `[object Object]` placeholders, unresolved `filterVars[]`, stale Collection sort fields, wrong Dynamic control types, and empty copied sections as generated-final blockers.

## Proof Boundary

This training adds local generator and validator protection. It does not replace browser/runtime proof. A final claim that Dashboard data is usable still requires opening the installed app, proving the canonical ListSet URL, verifying that charts and Collections render data, and confirming filters/search do not clear valid initial records.
