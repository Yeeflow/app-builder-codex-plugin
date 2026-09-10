# Product adapters and hosted MCP mapping review

Baseline: `41bdac08a55204bb033acea54cf3af8d7ca2f740`. Scope: local implementation plus read-only static MCP contract inspection. No application data was fetched or saved, no install or release performed.

## Implemented product rules

| Rule | Local behavior | Boundary |
| --- | --- | --- |
| allowDevice | Explicit PC encoding `[null, value]`; scalar device slots validated, null slots retained; array-valued device properties follow the product validator's outer-array behavior | Does not validate responsive rendering or impose invented padding-item types |
| requiredForBuild | Required properties and their containing paths must exist | Does not invent default samples or populate values |
| isKeyAttribute | Retained as selection metadata; does not imply required | Business suitability remains separate |
| acceptedValueTypes | Uses declared alternative types | Does not coerce values |
| valueTypeBy | Resolves a declared sibling selector; unknown/missing selector blocks | Does not infer context from labels or unrelated values |
| action enum | Numeric-looking enum keys accept both string and safe numeric forms, scoped to Action dialect | Does not loosen node enums globally |
| Action steps | Resolve exact declared type, enforce actionCategories, validate attrs and reject unrecognized attrs; preserve ID/category on edit | Scope availability and formula execution not proven |
| Variables | Unique IDs within each namespace and each list's fields; cross-category reuse allowed; basic list/dict references must resolve, no orphan listref | Does not equate tempVars with named business variables |
| Graph | GUID identities, matching resourceid, unique IDs, reciprocal flow references, no parallel duplicate directed edge, no edge back to Start | Node-property business rules, reachability, task outcome routing, layout and execution remain separate |
| Workflow expressions | Validate schema, scope and authoritative basic-variable IDs for direct references; allow schema-defined text/constants | Nested reference templates and Calculation formulas remain blocked pending context adapters |
| Formula/code flags | Retained in projection; expression-bearing values, single formula variable objects and code need appropriate context/review | No fabricated expression conversion and no code execution |

These are bounded semantic gates. A successful check is not a fully validated workflow or permission to save it. `semantics.mjs` exposes explicit variable/action/graph/expression entrypoints; the generic `validate` and `draft` entrypoints remain structural.

## Current hosted MCP contracts

Read `mcp-envelopes.json` for a compact, description-free projection of the four actual static contract responses. Source: `appbuilder_component_contract`, checked 2026-09-10. Property casing is significant. This is a contract snapshot, not tenant data or a raw response archive.

| Component | Confirmed outer type | Confirmed internal carrier | Remaining mapping gap |
| --- | --- | --- | --- |
| ApprovalForm | ProcessFormInfo in `detail` | `DefResource`: base64-encoded Brotli; MCP contract names utils_compress_resource | Product definitionJson/form/control graph to decoded persisted definition; authoritative IDs and other creation requirements |
| ScheduleForm | ProcessFormInfo in `detail` | Same DefResource codec | Scheduled context and definition mapping; do not infer a schedule from the shared envelope |
| Dashboard | ListLayoutInfo in `detail` | `LayoutInResources[].Resource` is a string | Product form/control JSON to persisted resource contents, LayoutView and reference IDs |
| DataList | DataListPackageInfo in `detail` | Fields[], Layouts[], Workflows[].DefResource | Physical-field allocation, form/layout links and workflow resource mapping |

The save tool explicitly requires nonempty Fields for DataList. Its static contract declares Fields required but does not encode that minimum; the envelope checker adds the documented tool requirement. Int64 identifiers remain strings. A schema object cannot be submitted where Resource/DefResource requires a string. No attempt is made to fabricate internal contents or IDs.

For updates, call component_get first and preserve unchanged fields; deleteMissing stays false. For creation, refresh the type contract. Envelope validation reports only shape conformity, always `saveReady: false`. `planMapping` exposes the confirmed carrier and explicit unresolved blockers. It deliberately does not produce a save request.

## CLI

`node scripts/product-schema/cli.mjs variables workflow/variables/schema.json input.json`

`node scripts/product-schema/cli.mjs action workflow/action/schema.json input.json [context.json]`

`node scripts/product-schema/cli.mjs graph workflow/node/definition/schema.json nodes.json`

`node scripts/product-schema/cli.mjs expression workflow/expression/schema.json segments.json context.json`

Expression context contains `scope` and authoritative `variables`; Action context may contain `baseline` for edit identity/category checking. These are local inputs, not MCP DTOs.

`node scripts/product-schema/cli.mjs envelope ApprovalForm detail.json`

`node scripts/product-schema/cli.mjs mapping ApprovalForm`

## Validation and next gates

20 local tests cover positive and negative cases, including false values, nested required paths, scope mismatch, missing references, device encoding, category errors and wrong transport types. Source hashes for reviewed product implementations are recorded in `adapter-evidence.json`.

Before full readiness: complete remaining context/template/formula and node-specific semantics, establish the exact product-to-persisted-definition mapping, then perform separately scoped save/readback and runtime checks in a designated test application. Until then, no resource is newly declared transport- or runtime-proven by this batch.
