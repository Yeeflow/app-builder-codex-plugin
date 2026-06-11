# YAP And YAPK Schema Must-Pass Standard

Official version: 0.6.19

## Canonical Schemas

`schemas/yap-schema.json` and `schemas/yapk-schema.json` are product-team canonical schemas. Treat them as generation rules, not reference-only docs.

Generated YAP packages must validate against `schemas/yap-schema.json` before output or any ready/import-qualified claim.

Generated YAPK packages must validate against the effective composed schema loaded through `scripts/lib/load-yapk-schema.js`, which combines:

- `schemas/yapk-schema.json`
- `schemas/yapk-schema-codex.json`

The canonical YAPK schema must stay clean of top-level `x-yeeflow-standard-additions`. Codex/plugin additions belong only in `schemas/yapk-schema-codex.json`.

## YAP Field Rules

Custom YAP field names must be storage-code names, not business labels:

- `Text1`
- `Decimal1`
- `Bit1`
- `Datetime1`

For custom fields, `FieldName` must exactly equal `FieldType + FieldIndex`, `IsSystem` must be `false`, and `FieldIndex` must start at `1`.

The current product schema uses `Datetime`, not legacy `DateTime`, for date/date-time storage. Generated packages must use `Datetime{index}` field names for date-backed custom fields. Business labels such as `Start Date` belong in `DisplayName`, not `FieldName`.

The native title field is the only system field:

- `FieldName = "Title"`
- `IsSystem = true`
- `FieldIndex = 0`

Business labels belong in `DisplayName`.

## YAPK Required Metadata

Generated YAPK output must include every field required by the product schema for root package objects, decoded `AppPackageInfo`, `ListSet`, `ListInfo`, `ListFieldInfo`, layouts/resources, and nested `Childs[]` resources.

In the v0.6.18 canonical YAPK schema, decoded `AppPackageInfo.required` is `ListSet`, `Pages`, and `Childs`. Other decoded modules such as forms, current workflow reports, data reports, groups, tags, metadata, agents, connections, knowledges, themes, and components are optional at the canonical schema layer unless the schema requires them in a specific nested structure. Do not confuse canonical schema optionality with app completeness: plan-conformance, workflow, report, and internal quality validators may still require planned modules or safe empty arrays before a generated app is called ready.

If a value is legitimately empty, emit a schema-compatible empty string, empty array, empty object with required fields, or safe scalar default. Do not emit `undefined` or `null` unless the schema explicitly allows it.

Schema failure is a hard generation failure. Report unavailable checks as proof-boundary limitations, not success.
