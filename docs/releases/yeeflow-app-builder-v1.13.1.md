# Yeeflow App Builder Plugin v1.13.1

This local candidate incrementally aligns filters, Workflow Sublists, field validation and FormReport capability/dependency checks with the fixed reviewed Product 14.5 commit `41bdac08a55204bb033acea54cf3af8d7ca2f740`. Release validation covers offline contracts, packaging and Marketplace installation; tenant runtime verification remains separate.

## Baseline and scope

Corrected source baseline: released tag `yeeflow-app-builder-plugin-v1.13.0` and `origin/stable`, both verified at `c4547f898dab74a0db1de8cb4cecae667d9b3e83`. The earlier candidate used an obsolete checkout and has been withdrawn. These changes are now applied on top of v1.13.0, retaining its four hosted MCP services and Custom Code attachment patterns. Release version: 1.13.1. Core and execution compatibility remain 1.0.0.

No applicable AGENTS.md was found in the project or checked ancestor directories. The nested older checkout, upstream snapshot, Builder Bridge project and installed plugin cache were not changed. Pre-existing deleted archives, duplicate files, web-library work and Dashboard dependency edits were preserved. No worktree, Yeeflow API write, model call or email was performed.

## Implemented

- Filter planning validation and behavior patches enforce explicit application modes, consuming data-source conditions, reload dependencies, field-bound runtime-distinct selections, valid apply buttons and exact reset scope. The existing encoded Dashboard filter validator now checks disconnected controls and apply/reset references. Existing select-filter/Collection operator 9 failure evidence remains authoritative for that runtime.
- Workflow Sublist validation checks editor compatibility, native editor binding metadata, Lookup source/target identities and types, action references and layout field references. Static patch generation keeps field types, editors, unspecified properties and layout positions; updates all matching native copies and preserves hidden table labels. DataList lowering is unchanged.
- The field capability projector parses configurations/valueType, ordinary schema properties, embedded JSON and dynamic schema metadata. All 27 current catalog types were inspected: 20 explicitly declare string defaults; 7 do not. Existing YAP/YDL schema entrypoints emit bounded product advisories, while the explicit product-profile CLI rejects invalid types, uploads, ranges, embedded row values and repeated encoding. Patch generation preserves strings, false flags and existing Rules. IsFilter requests without confirmed transport support are rejected, never aliased to IsSort.
- FormReport field mappings and operator capabilities are versioned and reproducibly checked against source hashes. The explicit completion validator/finalizer checks source fields, Type 32 backing resource, backing-field identity, views, pending views, false flags, Boolean predicates/equality, group depth, connectors, dates and missing references. Existing YAP final validation also detects zero-field/count omissions and missing views. Report-field Key is used rather than assuming the parent variable ID is unique for flattened fields.
- Six skills, shared filter guidance and source/dist compatibility copies were updated. Packaging now uses tracked payload files plus an explicit reviewed additions manifest. Official logos are unchanged.

## Local validation

The archive preserves the released Core/execution payload using `--tracked-only`: rebuilding the existing stable Core source would regress the released rejected-link routing fix, an unrelated source/dist discrepancy.

On the corrected baseline, all 68 contract tests, TypeScript compilation, source/distribution attachment gates, four-service MCP integration, runtime bindings, Approval control closure, FormReport physical-field checks and archive parity passed. Earlier obsolete-baseline results are excluded.

## Format and proof boundaries

The new CLI input is a local contract, not a product composite DTO or an MCP/YAPK save payload. `formreport.source.fieldTypes` is an authoritative source-field index keyed by report/filter identities, including any relevant system fields; it must be obtained from the actual workflow context. `pendingViewIds` prevents completion before planned views are applied. The projector also records the product composite's required surfaces and view types, but those do not authorize new transport mappings.

Product composite report defaults differ from export permission toggles: the product result schema fixes some booleans, while existing export Attr flags may legitimately be false. Export flags are preserved; no product defaults are blindly copied over them. Field product advisories do not replace existing export validators. Unknown types/hosts/encodings require scoped evidence. The compact projector is not a general JSON Schema implementation, and generic Form validation does not prove every binding.

Remaining online verification: exact host filter empty/select/intersection/apply/reset behavior; Sublist editor, Lookup/action and layout preservation; field editor/default/upload behavior; complete FormReport views/filtering/sublist rows/export/detail permissions; and a separately authorized plugin installation smoke. Product Dashboard dependency merge failure is outside scope and no such merge entrypoint was added.

## Reproduce locally

1. `node --test scripts/test-product-14.5-contracts.mjs`
2. `node scripts/project-product-14.5-capabilities.mjs <read-only-fixed-snapshot> --check`
3. `node scripts/prepare-plugin-patch-release.mjs`
4. `node scripts/build-plugin-archive.mjs --tracked-only --output dist/yeeflow-app-builder-plugin-1.13.1.zip`
5. `node scripts/test-product-14.5-distribution.mjs`

The installable-layout ZIP is `dist/yeeflow-app-builder-plugin-1.13.1.zip`. Marketplace installation passed. Online tenant runtime remains unverified.

## Marketplace install smoke

- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Tested commit: `f65fb91` (the already-pushed `yeeflow-app-builder-plugin-v1.13.1-rc1` ref).
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`.
- Marketplace/plugin: `yeeflow` / `yeeflow-app-builder`.
- Actual installed-cache version: `1.13.1`.
- Installed-cache tests: all 68 Product 14.5 cases, Custom Code Attachment compile/mutation gates and four-service MCP integration passed.
- Codex app-server `skills/list` discovered all 27 skills from the installed 1.13.1 cache. No model calls or generated prompt responses were used.
- Package validation: 553 JSON files parsed, 511 JavaScript files passed syntax checks, ZIP integrity and 21 source/dist/archive mirrors passed; scoped safety scan reported zero blockers.
- User directed immediate final release and stable promotion without further RC iterations. The existing RC tag is retained as history.
- Final promotion changes only release documentation and its rebuilt ZIP; executable payload remains the install-tested payload.
