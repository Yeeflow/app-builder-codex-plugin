# Fixed Product schema adoption

Baseline: `41bdac08a55204bb033acea54cf3af8d7ca2f740`, supplied and confirmed current by the user. No automatic branch tracking. Upstream source stays read-only in the ignored Bridge snapshot cache; no original source, prose or raw schema copies are distributed here.

## Inventory and first batch

`inventory.json` lists every file under `resources/schemas`, including documentation, semantic dictionaries and resource indexes. SHA-256 identifies each source file. A catalog entry is not a supported resource claim.

There are 289 files, including 284 JSON files. First priority covers workflow form, control, definition, node, step, action, variables and expression: 159 definitions have constraint projections in `contracts.json`. This includes 93 controls, 31 node definitions, 30 step definitions and one each of form, definition, action, variables and expression. Other resource families remain inventoried for later batches; the previous Product 14.5 field/FormReport integration remains in place.

The projection preserves recognized structural constraints and references, resolves JSON-encoded structural descriptions, and records unsupported product extensions as explicit adapter issues. Textual product semantics, formulas, context-dependent types and build requirements are not inferred from descriptions. References only resolve within the registry; no network fetching occurs.

## Local use

- Rebuild inventory: `node scripts/product-schema/catalog.mjs <fixed-source> docs/standards/product-schema`
- Detect source/projection drift: append `--check` to the above command.
- Validate structure: `node scripts/product-schema/cli.mjs validate workflow/action/schema.json <input.json>`
- Create a local draft from explicit supplied values: replace `validate` with `draft`.
- Patch a local object: `node scripts/product-schema/cli.mjs patch <resource-id> <current.json> <changes.json>`.
- Regression checks: `node --test scripts/product-schema/runtime.test.mjs`.

Draft creation does not invent missing fields, defaults, IDs or mappings. Patching replaces explicitly named top-level properties, retains unmentioned values, and rejects identity changes. Nested replacements require complete authoritative current values. Outputs are local schema-shaped drafts, NOT MCP save payloads or export envelopes.

The validator implements a bounded structural subset, not a general JSON Schema engine. Unknown keywords, missing references, unresolved product rules and unsupported formats block validation. `structurally-valid` means only that the implemented structural constraints passed. In particular, action step type dispatch, workflow graph and variable-reference semantics, formula execution and device-specific control serialization still need product adapters. Structural success never permits promotion or live save by itself.

## Required proof before adoption

For each resource, record separately:

1. Definition parsed from this exact source hash.
2. Product extensions and description-only semantics reviewed and adapted.
3. Positive and negative generation/patch/validation tests passed.
4. Exact hosted-MCP operation and payload mapping established.
5. Save accepted in the designated test application, followed by persisted definition readback.
6. Relevant Designer/browser/workflow behavior exercised and recorded.

Current result: complete inventory, bounded local adapters, and a first native live validation batch. An existing input label and current-workflow text assignment passed MCP save, exact readback, Designer rendering, and a completed synthetic runtime in the dedicated user-authorized application. General product-to-native compilation remains incomplete. Do not label the 159 projections as 159 fully supported capabilities.

## Version upgrade workflow

Keep the fixed commit and source hashes. For a proposed future snapshot, generate into a separate review directory, compare inventories using `diffCatalog`, review added/removed/changed definitions and their dependent resources, implement adapters, and rerun all six proof stages. Update the plugin version and release only after the relevant gates pass. No installed-cache update or release is performed by these scripts.

## Product adapter and MCP review update

See [adapter-mapping-review.md](adapter-mapping-review.md) for implemented device/build/dynamic/action/variable/graph/expression rules and the four read-only hosted MCP contracts. Run `node --test scripts/product-schema/*.test.mjs` for all 28 tests. Unresolved context-sensitive expressions still block; static envelope verification does not establish internal definition mapping.

## First native live batch

See [native workflow validation](native-workflow-validation.md) for the bounded adapter, verified representation differences and completed synthetic runtime. The result covers an existing input and current-workflow text assignment only; it does not establish full family coverage.
