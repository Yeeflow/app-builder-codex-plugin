# YAPK Schema Overlay Standard

`schemas/yapk-schema.json` is the product-team canonical YAPK JSON Schema. Keep it replaceable as-is when the product team publishes an updated schema.

`schemas/yapk-schema-codex.json` is the Codex/plugin overlay for additive generation and validation guidance. It owns `x-yeeflow-standard-additions`.

Do not manually merge Codex additions into `schemas/yapk-schema.json`. Future product schema updates should replace only `schemas/yapk-schema.json`.

Validators and generators that need Codex guidance must load the effective composed schema through `scripts/lib/load-yapk-schema.js` or an equivalent composed loader.

Generated YAPK packages must validate against the effective composed schema before output or any ready/import-qualified claim. A package that violates either the product-team canonical schema or the Codex overlay rules is a hard generation failure. Report any unavailable check as a proof-boundary limitation, not as success.

The product-team schema remains authoritative for standard JSON Schema validation. The Codex overlay is additive metadata and must not redefine product schema behavior in a conflicting way unless the conflict is explicitly reviewed.

## Product Schema Refresh v0.6.18

The v0.6.18 official schema refresh replaces only the canonical YAPK schema with the latest product-team file. The v0.6.17 YAP schema remains unchanged.

In the current canonical YAPK schema, decoded `AppPackageInfo.required` is:

- `ListSet`
- `Pages`
- `Childs`

Other decoded app modules, including `Forms`, `FormNewReports`, `DataReports`, `Groups`, `Tags`, `Metadatas`, `Agents`, `Connections`, `Knowledges`, `Themes`, and `Components`, are optional at the canonical JSON Schema layer unless required by the schema in a specific nested structure. The plugin may still require or recommend those modules through internal completeness standards, workflow/report standards, or plan-conformance validation. Schema validity does not mean the generated app fully implements the approved plan.

The current canonical date/date-time storage enum remains `Datetime`, not legacy `DateTime`. Generated YAPK fields must use `FieldType = "Datetime"` and custom storage names such as `Datetime1`.

## Product Schema Refresh v0.6.17

The v0.6.17 official schema refresh replaces the canonical YAP and YAPK schemas with the latest product-team files. Generated YAPK packages must include the stricter required metadata in the canonical schema, including full `ListSet`, `ListInfo`, `ListFieldInfo`, layout/resource/report/tag/metadata/portal/agent/component fields where those structures are present.

The current canonical date/date-time storage enum is `Datetime`, not legacy `DateTime`. Generated YAPK fields must use `FieldType = "Datetime"` and custom storage names such as `Datetime1`.

For empty generated structures, use schema-compatible empty values such as `""`, `[]`, or a required-field object with safe defaults. Do not emit `undefined` or `null` unless the canonical schema allows it.

## Current Canonical Schemas

The current product-team canonical YAP schema is `schemas/yap-schema.json` with `$id` `yap-v1-schema.json` and title `YAP v1 Template Schema`. Its `Resource` rule is `[______gizp______]` plus gzip-compressed UTF-8 JSON for the decoded `ListExportResult`.

The current product-team canonical YAPK schema is `schemas/yapk-schema.json` with `$id` `https://akmii.local/schemas/listset-package-info.schema.json` and title `AppExportPackageInfo`. Its `Resource` rule is a Base64 string containing Brotli-compressed JSON for the decoded `AppPackageInfo`.

`schemas/yapk-schema.json` must remain clean of `x-yeeflow-standard-additions`. `schemas/yapk-schema-codex.json` must retain those additions, and the effective schema loader must expose them by composing the canonical schema and overlay.

## Generated-Final Seed Data Boundary

Generated-final `.yapk` packages must not embed sample rows or seed records in decoded `Childs[].ListDatas` or `Childs[].List.ListDatas`.

The package is responsible for application structure: lists, fields, pages, forms, reports, workflows, navigation, metadata, and export-shaped runtime resources. Sample data is an optional post-install concern and must be emitted only as a separate seed artifact or script with explicit live-write approval.

Validators must treat embedded `ListDatas` in generated-final YAPK packages as a hard failure, even if a future canonical schema permits the property, because app install/import acceptance and sample-data mutation are separate proof layers.
