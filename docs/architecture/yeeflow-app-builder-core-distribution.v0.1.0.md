# Core Distribution Contract v0.1.0

The official distribution builder consumes compiled Core output and writes a self-contained ESM artifact plus checksum manifest to `dist/yeeflow-app-builder-plugin/core`.

Installed Plugin resolution imports that relative artifact and never requires the repository workspace, pnpm symlinks, or root node_modules. The manifest records Core version, package graph version, source commit, Plugin version, checksum, and exports.

Phase 3B.1 passed deterministic dual-build, temporary official-layout ZIP extraction, full installed-plugin resolution, and hidden-core Legacy rollback. The historical 0.9.71 ZIP is never an output target.

The shared scanner is `scripts/lib/core-distribution-validation.mjs`. Gate regressions cover checksum integrity, manifest shape, declared exports, and workspace or source leakage. Source, archive, and installed surfaces each verified all 11 declared exports.

## Phase 3B.2 approved initial caller wave

`scripts/lib/markdown-planning-core-adapter.mjs` is a compatibility adapter that resolves only `core/yeeflow-app-builder-core-planning.v0.1.0.mjs`. It never imports the Legacy parser, TypeScript source, a workspace package, or `node_modules`. Missing artifact, artifact import, required-export, and forbidden-resolution failures use the stable `CORE_COMPAT_ADAPTER_*` codes.

The adapter provides all 11 parity-proven Markdown planning exports. Its focused regression ran the versioned corpus against Legacy, compiled Core, and the adapter: 8 fixtures and 36 calls had exact normalized output and error parity. It passed source-repository, temporary official-layout ZIP, and simulated installed-Plugin resolution. The proof ZIP was created only in a temporary directory and removed after the test; the protected historical Plugin ZIP stayed at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

The approved initial wave switched only these seven non-materializer validators: `validate-workflow-set-data-list-plan.mjs`, `validate-set-variable-plan.mjs`, `validate-form-action-open-resource-plan.mjs`, `validate-form-action-query-data-plan.mjs`, `validate-form-action-set-data-list-plan.mjs`, `validate-workflow-query-data-plan.mjs`, and `validate-workflow-loop-plan.mjs`. The Legacy parser remains present for the materializer and every unapproved caller. Additional caller waves require explicit approval and their own focused parity evidence.

## Phase 3B.2 Print Barcode validator wave

The approved single-caller wave switched `scripts/validate-form-action-print-barcode-plan.mjs` to the adapter. Static API-scope evidence confirmed that the validator imports and calls only `parseMarkdownTables` from the Markdown parser surface.

`compatibility/differential-fixtures/form-action-print-barcode-plan.v0.9.71.json` supplies representative valid Dashboard Print and Barcode Scan planning plus an invalid Public Form Print and invalid Barcode Scan plan. The focused CLI proof injected the Legacy parser, compiled Core parser, and adapter parser into the unchanged validator body. All 2 fixtures and 6 executions had identical exit statuses, stable validation codes, normalized JSON output, and stderr behavior. The existing 16-case `test-form-action-print-barcode-gates.mjs` regression also passed.

The switched validator passed in the source repository, a temporary official-layout ZIP extraction, and a simulated full installed Plugin copy. The proof ZIP was temporary and removed after testing. The historical ZIP remained at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

At the end of the Print Barcode wave, the materializer and the then-unapproved production callers stayed on the Legacy parser. The subsequent Approval Layout Template wave is recorded below. Phase 3B.2 remains in progress; further caller waves need explicit approval and focused parity proof.

## Phase 3B.2 Approval Layout Template validator wave

The approved single-caller wave switched `scripts/validate-approval-form-layout-template.mjs` to the adapter. Static API-scope evidence confirmed that its Markdown dependency surface contains only `extractMarkdownSubsection`, `findMarkdownTable`, and `markdownRowValue`.

`compatibility/differential-fixtures/approval-form-layout-template.v0.9.71.json` contains 6 valid and invalid Approval Form Layout Template CLI fixtures. It protects the Submission-role false-positive case where descriptive content says `later task processing`; it also covers escaped pipe cells, fenced table-like text, missing template selection, Submission pages selecting the Task template, Task pages selecting the Submission template, and malformed Markdown tables. The focused CLI proof injected Legacy, compiled Core, and adapter parser implementations into the unchanged validator body. All 18 executions had identical exit statuses, stable validation codes, normalized JSON output, and stderr behavior.

Both existing regressions passed without changing their expectations: `test-approval-form-layout-template-gates.mjs` and `test-validator-parsing-hardening-gates.mjs`. The switched validator also passed in the source repository, temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy. The proof ZIP was removed after testing, and the historical ZIP remained at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

The materializer and the remaining unapproved production callers stay on the Legacy parser: `validate-app-plan-resource-order.mjs`, `validate-functional-spec-to-app-plan-traceability.mjs`, and `validate-generation-readiness-review.mjs`. Phase 3B.2 remains in progress; further caller waves need explicit approval and focused parity proof.

## Phase 3B.2 Functional Spec Traceability validator wave

The approved single-caller wave switched `scripts/validate-functional-spec-to-app-plan-traceability.mjs` to the adapter. Static API-scope evidence confirmed that its Markdown dependency surface contains only `findMarkdownTable`, `isNegativeRequirementStatement`, `markdownRowValue`, and `positivePlanningText`.

`compatibility/differential-fixtures/functional-spec-to-app-plan-traceability.v0.9.71.json` contains 5 valid and invalid Traceability CLI fixtures. It covers exact requirement-ID mapping, generic wording without an ID, complete and incomplete structured deferred dispositions, ordinary prose containing `deferred`, escaped pipe table cells, fenced table-like content, and positive and negative requirement statements. The focused CLI proof injected Legacy, compiled Core, and adapter parser implementations into the unchanged validator body. All 15 executions had identical exit statuses, stable validation codes, normalized JSON output, and stderr behavior.

The existing Traceability, control-action, and parsing-hardening regressions passed unchanged: `test-clarification-readiness-traceability-gates.mjs`, `test-app-plan-control-action-property-gates.mjs`, and `test-validator-parsing-hardening-gates.mjs`. The switched validator also passed in the source repository, a temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy. The proof ZIP was removed after testing, and the historical ZIP remained at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

The materializer and the remaining unapproved production callers stay on the Legacy parser: `validate-app-plan-resource-order.mjs` and `validate-generation-readiness-review.mjs`. Phase 3B.2 remains in progress; further caller waves require explicit approval and focused parity proof.

## Phase 3B.2 Resource Order validator wave

The final approved non-materializer wave switched `scripts/validate-app-plan-resource-order.mjs` to the adapter. Static API-scope evidence confirmed that its Markdown dependency surface contains only `extractMarkdownSubsection`, `findMarkdownTable`, `hasTechnicalPlaceholderIdContext`, `markdownRowValue`, `parseMarkdownTables`, and `positivePlanningText`.

`compatibility/differential-fixtures/app-plan-resource-order.v0.9.71.json` contains 7 valid and invalid Resource Order CLI fixtures. It covers resource ordering, required dashboard table shapes and planning subsections, application layout-template selection, ordinary Page-level/Form-level prose, escaped pipe cells, fenced table-like text, not-applicable planning statements, and synthetic technical placeholder IDs. The focused CLI proof injected Legacy, compiled Core, and adapter parser implementations into the unchanged validator body. All 21 executions had identical exit statuses, stable validation codes, normalized JSON output, and stderr behavior.

Existing Resource Order and parsing-hardening regressions passed unchanged: `test-app-plan-schema-validator-consistency-gates.mjs`, `test-app-plan-dashboard-pages-plan-gates.mjs`, `test-planning-markdown-template-standardization-gates.mjs`, `test-functional-specification-and-app-plan-gates.mjs`, `test-data-list-form-layout-template-gates.mjs`, and `test-validator-parsing-hardening-gates.mjs`. The switched validator also passed in the source repository, a temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy. The proof ZIP was removed after testing, and the historical ZIP remained at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

The production non-materializer callers migrated so far are the initial seven validators plus `validate-form-action-print-barcode-plan.mjs`, `validate-approval-form-layout-template.mjs`, `validate-functional-spec-to-app-plan-traceability.mjs`, and `validate-app-plan-resource-order.mjs`. `validate-generation-readiness-review.mjs` remains a production Legacy parser caller because its approved wave was not completed. The materializer also remains on the Legacy parser. Test-only Legacy comparators remain intentionally retained for differential evidence: `test-generation-readiness-markdown-parser-gates.mjs`, `test-validator-parsing-hardening-gates.mjs`, `test-markdown-planning-differential.mjs`, and `test-markdown-planning-core-adapter-parity.mjs`.

Generated-final target and projection completeness validation remains intentionally outside this migration wave and keeps its existing generated-final/package validation ownership. No target/projection rule or stable code was added, moved, or changed in the Resource Order validator. Phase 3B.2 remains in progress until the separately approved Generation Readiness Review wave has its own focused proof. Phase 4 materializer seam audit has not started.

## Phase 3B.2 Generation Readiness validator wave and closure

The final approved non-materializer wave switched `scripts/validate-generation-readiness-review.mjs` to the adapter. Static API-scope evidence confirmed that its Markdown dependency surface contains only `findMarkdownTable`, `markdownRowValue`, `positivePlanningText`, `splitMarkdownTableRow`, and `stripMarkdownFencedBlocks`.

`compatibility/differential-fixtures/generation-readiness-review.v0.9.71.json` contains 7 valid and invalid Generation Readiness CLI fixtures. It covers valid readiness, missing planning areas, complete and incomplete runtime-proof rows, ordinary deferred prose, escaped pipe cells, fenced table-like content, and positive and not-applicable planning statements. The focused CLI proof injected Legacy, compiled Core, and adapter parser implementations into the unchanged validator body. All 21 executions had identical exit statuses, stable validation codes, normalized JSON output, and stderr behavior.

Existing Generation Readiness regressions passed unchanged: `test-generation-readiness-markdown-parser-gates.mjs`, `test-clarification-readiness-traceability-gates.mjs`, `test-app-plan-schema-validator-consistency-gates.mjs`, `test-app-plan-control-action-property-gates.mjs`, `test-business-clarification-and-app-plan-precision-gates.mjs`, `test-planning-default-approval-and-exact-type-gates.mjs`, and `test-validator-parsing-hardening-gates.mjs`. The switched validator also passed in the source repository, a temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy. The proof ZIP was removed after testing, and the historical ZIP remained at SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

Phase 3B.2 is complete. Its production non-materializer callers are `validate-workflow-set-data-list-plan.mjs`, `validate-set-variable-plan.mjs`, `validate-form-action-open-resource-plan.mjs`, `validate-form-action-query-data-plan.mjs`, `validate-form-action-set-data-list-plan.mjs`, `validate-workflow-query-data-plan.mjs`, `validate-workflow-loop-plan.mjs`, `validate-form-action-print-barcode-plan.mjs`, `validate-approval-form-layout-template.mjs`, `validate-functional-spec-to-app-plan-traceability.mjs`, `validate-app-plan-resource-order.mjs`, and `validate-generation-readiness-review.mjs`. The only remaining production Legacy parser caller is `materialize-full-app-generated-final.mjs`. Test-only Legacy comparators remain intentionally retained for differential evidence: `test-generation-readiness-markdown-parser-gates.mjs`, `test-validator-parsing-hardening-gates.mjs`, `test-markdown-planning-differential.mjs`, and `test-markdown-planning-core-adapter-parity.mjs`.

Phase 4 has not started. Its entry criteria are a materializer seam audit, selection of one bounded deterministic capability area, a separate Legacy/Core differential corpus, and explicit confirmation that host orchestration remains outside Core. No materializer behavior may change before those criteria are met.

## Phase 4B Materializer Public API and Distribution Proof

`@yeeflow/app-builder-core-materializer` version `0.1.0` now has the versioned public contract at `compatibility/capability-manifests/app-builder-core-materializer-public-api.v0.1.0.json`. Its runtime surface is exactly `capabilityMetadata` and `normalizeHexColor`; `JsonValue` is a type-only export. `normalizeHexColor` accepts a JSON-serializable value or omitted input, applies `String(value || "").trim()`, returns an uppercase six-digit hex color when the input matches `/^#[0-9a-f]{6}$/i`, otherwise returns an empty string, does not throw for the versioned corpus, does not mutate input, and has no host side effects.

The official distribution manifest is now a multi-artifact contract. It records exact path, Core package identity and version, source input SHA-256, compiled input SHA-256, artifact SHA-256, and the exact runtime exports for every approved artifact. The approved artifacts are:

- `core/yeeflow-app-builder-core-planning.v0.1.0.mjs`, SHA-256 `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`, with 11 Planning exports. This existing artifact checksum is unchanged.
- `core/yeeflow-app-builder-core-materializer.v0.1.0.mjs`, SHA-256 `ce83d282c8b6d53d81a077e44c35b83d3221e6b48f7f5974468d710b6b6befe2`, with `capabilityMetadata` and `normalizeHexColor`.

The shared official builder produces both self-contained ESM artifacts; the generalized validator validates every contract artifact for approved path, package and version identity, checksum, public exports, actual ESM exports, and forbidden workspace, package, source-map, and repository leakage. The 13-case normalizeHexColor corpus was run against the Materializer artifact in repository dist, a temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy. The temporary proof ZIP was removed after testing. Planning source/archive/installed all-export proof, deterministic dual-build proof, generic negative gate regressions, and hidden-Core Legacy rollback proof remain part of the distribution suite.

The protected historical `dist/yeeflow-app-builder-plugin-0.9.71.zip` remains a read-only verification target with SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`. The unchanged Legacy materializer remains the sole production materializer owner. This proof introduces neither a compatibility adapter nor a production caller cutover; those remain explicitly deferred to Phase 4C.

## Phase 4C normalizeHexColor Production Routing

Phase 4C routes only the four existing `normalizeHexColor` call expressions in `scripts/materialize-full-app-generated-final.mjs` through `scripts/lib/materializer-core-adapter.mjs`. The adapter resolves only `core/yeeflow-app-builder-core-materializer.v0.1.0.mjs` from the proven Plugin distribution locations. It has no TypeScript source, workspace package, node_modules, or Legacy import path, and fails explicitly with `MATERIALIZER_CORE_ADAPTER_ARTIFACT_MISSING`, `MATERIALIZER_CORE_ADAPTER_ARTIFACT_LOAD_FAILED`, `MATERIALIZER_CORE_ADAPTER_EXPORT_MISSING`, or `MATERIALIZER_CORE_ADAPTER_FORBIDDEN_RESOLUTION`.

The Legacy `normalizeHexColor` helper remains unchanged in the materializer source. The explicit rollback route is limited to a temporary full Plugin copy: remove the adapter import and replace the four `coreNormalizeHexColor` call expressions with `normalizeHexColor`. It has no environment toggle, feature flag, or silent fallback. The temporary rollback copy removes the Materializer Core artifact and still produces the same scoped fixture result.

`compatibility/differential-fixtures/materializer-normalize-hex-materializer-integration.v0.1.0.json` exercises an actual fixture-mode materialization with a planned Primary color of `#12aBcD`, Secondary color of `#345678`, and Neutral color of `#abcdef`. The Legacy baseline, routed source Plugin, temporary official-layout ZIP extraction, and simulated complete installed Plugin each produce `#12ABCD`, `#345678`, and `#ABCDEF`, with identical normalized decoded output and output-file shape. The scoped routing test normalizes only the materializer's pre-existing generated control-style UUID before two-run whole-output comparison; it does not hide color or resource-shape differences.

The official Core build mirrors the new adapter and the narrowly changed materializer source into Plugin dist while preserving the Planning artifact SHA-256 `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0` and Materializer artifact SHA-256 `ce83d282c8b6d53d81a077e44c35b83d3221e6b48f7f5974468d710b6b6befe2`. The proof ZIP is temporary and removed after testing. The historical 0.9.71 ZIP checksum remains unchanged. No other materializer behavior is routed to Core.

## Phase 4D defaultValueForFieldType Production Routing

Phase 4D adds `defaultValueForFieldType` to the Materializer Core public API and routes only its existing `buildFieldRecord` call expression through `coreDefaultValueForFieldType`. The Legacy helper remains unchanged. Legacy behavior is intentionally narrow: it returns `"0"` only for exactly the primitive, case-sensitive string `"Bit"`; it has no aliases, coercion, trimming, or case normalization, and every other JSON-serializable or omitted input returns an empty string without throwing or mutating input.

The 15-case versioned corpus covers the only supported field type, case variants, aliases, known non-Bit field types, unknown and malformed strings, empty input, null, omitted input, boolean and numeric values, arrays, and objects. The generalized Materializer artifact proof verifies every declared public export and runs both the normalizeHexColor and defaultValueForFieldType corpora in source dist, a temporary official-layout ZIP extraction, and a simulated complete installed Plugin copy.

The actual materializer routing fixture creates a Departments data list with `Bit1` and `Text1`. The Legacy baseline, routed source, temporary official ZIP, and simulated installed Plugin each retain `Bit1.DefaultValue === "0"` and `Text1.DefaultValue === ""`, with identical normalized decoded output and output-file shape. The minimal rollback removes the defaultValueForFieldType adapter binding in a temporary complete Plugin copy and changes the single `coreDefaultValueForFieldType` call back to the retained Legacy helper. The Materializer Core artifact stays present because the independently approved normalizeHexColor route still needs it; no runtime toggle, feature flag, or silent fallback was added.

The approved Materializer artifact SHA-256 is now `2c51b3f1527bca1b125960e572c7dd877923474c20916ebae68398fb2d1b7da1`; its public exports are `capabilityMetadata`, `normalizeHexColor`, and `defaultValueForFieldType`. The Planning artifact remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`.

## Phase 4E escapeRegExp Production Routing

Phase 4E routes only the one `extractNamedSection` call expression through `coreEscapeRegExp`. TypeScript AST analysis confirmed that the complete Legacy helper has no dependencies, mutable state, host side effects, nondeterminism, external mutation, or error path for JSON-serializable inputs. Its exact behavior is `String(value || "")` without trimming, followed by escaping `.`, `*`, `+`, `?`, `^`, `$`, `{`, `}`, `(`, `)`, `|`, `[`, `]`, and backslash; other characters remain unchanged.

The 13-case corpus covers plain text, every escaped syntax character, preserved whitespace, unescaped hyphens and slashes, empty, null, omitted, numeric, boolean, array, and object inputs. The actual fixture reaches the named-section regular-expression path through Application Color Pattern Selection. Legacy baseline, routed source, temporary official ZIP extraction, and simulated installed Plugin results have identical color values, normalized decoded output, and output-file shape; two routed source runs are deterministic.

Rollback is limited to a temporary full Plugin copy: remove the `escapeRegExp as coreEscapeRegExp` adapter binding and replace the one `coreEscapeRegExp` call with the retained `escapeRegExp` helper. The Core artifact remains because normalizeHexColor and defaultValueForFieldType are independently routed. No runtime toggle, fallback, or other materializer behavior was introduced.

The approved Materializer artifact SHA-256 is now `5d06c22ddb8a462cd08910a2e1236aea69c0bfbd84850772a299bac5dd66f3d5`; its public exports are `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, and `escapeRegExp`. The Planning artifact remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`.

## Phase 4G normalizeForLooseFormMatch Production Routing

Phase 4G adds `normalizeForLooseFormMatch` to the Materializer Core public API and routes only the three `reverseRelatedRecordMatchesForm` call expressions through `coreNormalizeForLooseFormMatch`. The retained Legacy helper remains the rollback baseline. TypeScript AST re-audit confirmed the helper has no dependencies, mutable state, host effects, nondeterminism, external mutation, or JSON-serializable error path. Its exact behavior is `String(value || "")`, lowercase conversion, replacement of each non-ASCII-alphanumeric run with one space, whitespace collapse, and final trimming. Null-like and falsy `0` and `false` values normalize to an empty string; truthy arrays and objects use JavaScript string coercion.

The 15-case versioned corpus covers plain text, punctuation, underscores and slashes, repeated whitespace, casing, empty, null, omitted, numeric, boolean, array, object, and non-ASCII inputs. An actual reverse-related form fixture uses a deliberate double-space form-name mismatch that can match only through the loose normalizer. The Legacy baseline, routed source, temporary official ZIP extraction, and simulated installed Plugin retain the same reverse-related collection section, normalized decoded output, and output-file shape. Two routed source runs are deterministic.

Rollback is limited to a temporary full Plugin copy: remove the `normalizeForLooseFormMatch as coreNormalizeForLooseFormMatch` adapter binding and replace the three `coreNormalizeForLooseFormMatch` calls with the retained `normalizeForLooseFormMatch` helper. The Core artifact remains because normalizeHexColor, defaultValueForFieldType, and escapeRegExp are independently routed. No runtime toggle, fallback, or other materializer behavior was introduced.

The approved Materializer artifact SHA-256 is now `6da72096fce102309b1ffb16df26f8515efd422e95ffabc0e4b3f4fea31e2302`; its public exports are `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, and `normalizeForLooseFormMatch`. The Planning artifact remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`. The historical Plugin release ZIP remained SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2` before and after every temporary proof.

## Phase 4H stripPlanningDocumentSuffix Production Routing

Phase 4H adds `stripPlanningDocumentSuffix` to the Materializer Core public API and routes only three existing call expressions: the heading path in `extractTitle` and the bullet and table paths in `extractApplicationName`. The Legacy helper remains unchanged as the rollback baseline. TypeScript AST re-audit confirmed no direct or transitive dependencies, mutable state, host effects, nondeterminism, external mutation, or JSON-serializable error path.

Its exact behavior is `String(value || "")`, followed first by removal of a terminal, case-insensitive `Yeeflow App Plan` suffix with a whitespace-surrounded hyphen, en dash, or em dash, then by removal of any remaining terminal suffix preceded by whitespace, followed by `trim()`. An unsupported delimiter is retained if the second replacement removes the suffix after its whitespace. Retained text keeps its original case. `null`, omitted input, `0`, `false`, and empty input normalize to an empty string; truthy arrays and objects follow JavaScript string coercion. The 19-case corpus covers recognized suffix forms, case, trailing whitespace, malformed separators, missing whitespace, empty and null-like values, numbers, booleans, arrays, and objects.

The actual routing fixture exercises all three title-source paths. It proves that heading, bullet, and table application names lose the planning-document suffix in source execution, temporary official ZIP extraction, and a simulated installed Plugin, while preserving identical normalized decoded output and output-file shape against a temporary Legacy baseline. Two routed source runs are deterministic. Rollback uses a temporary full Plugin copy only: remove the `stripPlanningDocumentSuffix as coreStripPlanningDocumentSuffix` adapter binding and replace the three `coreStripPlanningDocumentSuffix` calls with the retained Legacy helper. No runtime toggle, fallback, or unrelated materializer behavior was introduced.

The approved Materializer artifact SHA-256 is now `29eec29891e8ecc626ca4fc246e07da59704a9699c0f3d118d959998676c3002`; its public exports are `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`, and `stripPlanningDocumentSuffix`. The Planning artifact remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`; the historical Plugin release ZIP remained SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2` before and after every temporary proof.

## Phase 4I dependencyName Production Routing

Phase 4I adds `dependencyName` to the Materializer Core public API and routes only four existing `buildTemplateDependencyNameMaps` call expressions through `coreDependencyName`. The Legacy helper remains unchanged as the rollback baseline. A fresh TypeScript AST audit confirmed the helper has no direct or transitive dependencies, mutable state, host effects, nondeterminism, external mutation, or JSON-serializable error path.

Its exact behavior is strict truthy property precedence: `name`, then `key`, `id`, `ID`, then an empty string. The selected value is converted with `String(...)` and trimmed. A truthy whitespace-only `name` deliberately blocks fallback and becomes an empty string after trimming. Missing and falsy properties fall through; null, omitted, and top-level primitive inputs return an empty string. Truthy arrays and objects used as selected properties follow JavaScript string coercion. The 18-case corpus covers property precedence, whitespace blocking, falsy fallback, nested array and object values, top-level null-like inputs, and input immutability.

The actual routing fixture drives all four template dependency-map call expressions through a collection dashboard materialization. The temporary Legacy baseline, routed source, temporary official ZIP extraction, and simulated installed Plugin have identical normalized decoded output and output-file shape. Two routed source executions are deterministic. Rollback uses a temporary full Plugin copy only: remove the `dependencyName as coreDependencyName` adapter binding and replace the four `coreDependencyName` calls with the retained `dependencyName` helper. No runtime toggle, fallback, or other materializer behavior was introduced.

The approved Materializer artifact SHA-256 is now `d24060698b3bace9366c5436435e6cfcf177773d4fbf3083181f55a33bac6203`; its public exports are `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`, `stripPlanningDocumentSuffix`, and `dependencyName`. The Planning artifact remains `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`; the historical Plugin release ZIP remained SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2` before and after every temporary proof.

## Phase 4J safeDependencyIdentifier Production Routing

Phase 4J routes only the three `scopedDependencyName` expressions through `coreSafeDependencyIdentifier`. The retained Legacy helper uses `String(value || "")`, lowercases only for a truthy `options.lower`, replaces invalid-character runs with underscores, and strips edge underscores. Leading digits are retained. Null options intentionally throw `TypeError` because the Legacy code reads `options.lower` directly. The 23-case differential corpus, source, temporary ZIP, installed-layout, determinism, and temporary retained-Legacy rollback proofs passed. No fallback or unrelated materializer behavior was added. The Materializer Core artifact SHA-256 is `5dd5d7bad9ee16607d23dc827f73252ff8e605a42c32f773f7e4188b744c597d`.

## Phase 5C Data List Scalar Field Projection Public API and Distribution Readiness

The Materializer Core public surface now includes `projectDataListScalarField` and only its contractually required type DTOs: `ScalarFieldProjectionInput`, `ScalarFieldProjection`, `FieldControlProjectionFinding`, and `ScalarFieldProjectionResult`. The runtime function accepts a JSON-serializable pre-ID scalar Data List field specification and returns a frozen, JSON-serializable result. It exposes neither Legacy resource-record shapes nor `ListID`, `FieldID`, mutable templates, generated resources, or host state.

The official multi-artifact builder produced `core/yeeflow-app-builder-core-materializer.v0.1.0.mjs` with SHA-256 `4227f40add5726716d4e9a88bb8b64ed5da6ef3c6bfcee442936848e9c0be168`. Its exact runtime export surface is `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`, `stripPlanningDocumentSuffix`, `dependencyName`, `safeDependencyIdentifier`, and `projectDataListScalarField`. The Planning artifact remains SHA-256 `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`.

The complete 20-case scalar corpus passed against compiled Core source, official Plugin dist, a temporary official-layout ZIP extraction, and a simulated installed Plugin. Every surface verified exact runtime exports, JSON serialization, and frozen result/projection/findings objects. Negative gates reject a missing projection export, unexpected internal runtime export, public-contract mismatch, checksum mismatch, workspace and node_modules leakage, source-map leakage, and deliberately mismatched surface output. The generic distribution gates continue to reject bare imports, side-effect imports, export-from, dynamic import, require, file URLs, POSIX and Windows source paths, packages references, and source-map leakage.

Routing readiness is accepted for a future Phase 5D only. The future change is limited to one scalar-only pre-ID branch inside `buildFieldRecord`; its single production invoker remains the `fieldSpecsForList(...).map(... buildFieldRecord(...))` assembly path. Phase 5D must add one explicit adapter export, prove actual materializer parity in source, temporary official ZIP, and simulated installed layouts, and prove a temporary-copy-only Legacy rollback. It must leave deferred lookup, sublist, identity, file, image, IDs, generated-resource mutation, and host orchestration on their current Legacy path. No production routing occurred in Phase 5C.

## Phase 5D Data List Scalar Field Projection Selective Routing

Phase 5D added the single approved `projectDataListScalarField` export to the Materializer Core compatibility adapter and one marked scalar-only pre-ID branch in `buildFieldRecord`. The Core function is authoritative for Text, Datetime, Decimal, and Bit scalar field projections. It receives no `ListID`, `FieldID`, lookup target, generated resource, template object, file, API, runtime, or host state. The Legacy bridge adds `ListID` and `FieldID` only after Core produces its immutable projection DTO.

The source, temporary official ZIP, and simulated installed Plugin proofs compare a retained-Legacy baseline against the Core-routed actual materializer fixture. They cover the four canonical scalar types, textarea, datepicker, input_number, switch, select, checkbox, choices and color choices, defaults, valid barcode rules, and the preserved invalid barcode validation error. The routing-scope gate proves lookup, sublist, identity-picker, file-upload, and icon-upload controls cannot invoke Core. Two source runs are deterministic after normalizing only pre-existing UUID-shaped control identifiers. A temporary-copy-only rollback removes the one adapter binding and marked route while retaining the Core artifact for previous Phase 4 routes.

The Materializer Core artifact remains SHA-256 `4227f40add5726716d4e9a88bb8b64ed5da6ef3c6bfcee442936848e9c0be168`; the Planning artifact remains SHA-256 `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`. The historical Plugin ZIP remains SHA-256 `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

## Phase 5J.1 Fixed-Filter Distribution Contract Alignment

`projectFixedFilterIntents` is an approved public runtime export of
`@yeeflow/app-builder-core-materializer`. It is required by the Phase 5I
fixed-filter parser and host-lowering boundary and by the future, non-routed
Phase 5K LayoutView shadow contract. It remains outside production routing.

Before remediation, Core source and the public API contract declared ten
Materializer runtime exports, while the distribution builder and approved
artifact contract declared nine and omitted `projectFixedFilterIntents`.
The official builder now reads the Materializer public API runtime-export list,
checks it against the distribution contract and compiled Core module, and emits
the same exact list into the artifact manifest. The distribution validator
checks source, public API, contract, manifest, and artifact runtime exports for
an exact match.

The aligned runtime export list is `capabilityMetadata`, `normalizeHexColor`,
`defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`,
`stripPlanningDocumentSuffix`, `dependencyName`, `safeDependencyIdentifier`,
`projectDataListScalarField`, and `projectFixedFilterIntents`. The final
Materializer artifact SHA-256 is
`defe930672c1bd4c6104a7a696bb6b9f587f84bce14b637fc139fd98a0447855`.
