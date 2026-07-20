# Core Materializer Public API v0.1.0

## Package

- Package: `@yeeflow/app-builder-core-materializer`
- Version: `0.1.0`
- Runtime exports: `capabilityMetadata`, `normalizeHexColor`, `defaultValueForFieldType`, `escapeRegExp`, `normalizeForLooseFormMatch`, `stripPlanningDocumentSuffix`, `dependencyName`, `safeDependencyIdentifier`, `projectDataListScalarField`
- Type exports: `JsonValue`, `FieldControlProjectionFinding`, `ScalarFieldProjectionInput`, `ScalarFieldProjection`, `ScalarFieldProjectionResult`

## normalizeHexColor

`normalizeHexColor(value?: JsonValue): string` accepts a JSON-serializable value or omitted input. It applies `String(value || "").trim()` and returns an uppercase six-digit `#RRGGBB` value only when the trimmed value matches `/^#[0-9a-f]{6}$/i`. Every other value returns an empty string.

The function does not throw for the versioned JSON corpus, does not mutate its input, and has no filesystem, process, archive, environment, network, API, or other host side effects.

No internal materializer helper is publicly exported. Production materialization retains Legacy host orchestration; only explicitly approved deterministic call sites may resolve through the distributed Core adapter after focused parity and rollback proof.

## defaultValueForFieldType

`defaultValueForFieldType(fieldType?: JsonValue): string` uses strict equality against the primitive string `Bit`. It returns `"0"` only for exactly `"Bit"`; every other JSON-serializable value, including case variants, aliases, unknown values, null, omitted input, arrays, and objects returns an empty string. It performs no coercion, trimming, alias handling, or case normalization.

The function does not throw for JSON-serializable values or omitted input, does not mutate input, and has no filesystem, process, archive, environment, network, API, or other host side effects.

## escapeRegExp

`escapeRegExp(value?: JsonValue): string` applies `String(value || "")` without trimming. It prefixes every occurrence of `.`, `*`, `+`, `?`, `^`, `$`, `{`, `}`, `(`, `)`, `|`, `[`, `]`, and backslash with a backslash. All other characters, including whitespace, hyphens, and slashes, remain unchanged. Falsy `null`, omitted input, `0`, `false`, and empty-string values become an empty string before conversion; truthy arrays and objects follow JavaScript string conversion.

The function does not throw for JSON-serializable values or omitted input, does not mutate input, and has no filesystem, process, archive, environment, network, API, or other host side effects. It is a literal-escaping primitive for constructing regular expressions, not a general pattern validator.

## normalizeForLooseFormMatch

`normalizeForLooseFormMatch(value?: JsonValue): string` applies `String(value || "")` without trimming before normalization. It lowercases the converted string, replaces every non-ASCII-alphanumeric run with one space, collapses whitespace runs to one space, and trims the final result. Falsy null-like values, `0`, `false`, and empty strings therefore normalize to an empty string; truthy arrays and objects use JavaScript string coercion before the punctuation and whitespace rules are applied.

The function does not throw for JSON-serializable values or omitted input, does not mutate input, and has no filesystem, process, archive, environment, network, API, or other host side effects. It is limited to loose form-name matching; it does not create, rename, or modify materialized resources.

## stripPlanningDocumentSuffix

`stripPlanningDocumentSuffix(value?: JsonValue): string` applies `String(value || "")` without pre-trimming. It first removes a terminal, case-insensitive `Yeeflow App Plan` suffix together with a whitespace-surrounded hyphen, en dash, or em dash. It then removes any remaining terminal suffix preceded by whitespace and trims the final result. Therefore an unsupported delimiter before the required whitespace is retained while the suffix is removed; a suffix with no preceding whitespace or non-terminal suffix text is retained.

Falsy null-like values, `0`, `false`, and empty strings become an empty string before conversion; truthy arrays and objects follow JavaScript string coercion. The function does not throw for JSON-serializable values or omitted input, does not mutate input, and has no filesystem, process, archive, environment, network, API, or other host side effects. It is limited to planning-document title normalization.

## dependencyName

`dependencyName(item?: JsonValue): string` reads `item.name`, `item.key`, `item.id`, and `item.ID` in that exact truthy precedence order. It converts the first truthy property with `String(...)` and trims the result. A truthy whitespace-only `name` therefore blocks fallback and returns an empty string after trimming. Missing, falsy, null-like, and omitted values fall through to an empty string. Truthy arrays and objects use ordinary JavaScript string coercion.

The function does not throw for JSON-serializable values or omitted input, does not mutate the supplied item or nested values, and has no filesystem, process, archive, environment, network, API, or other host side effects.

## safeDependencyIdentifier

`safeDependencyIdentifier(value?: JsonValue, options: JsonValue = {}): string` uses `String(value || "")`, with no trimming. If `options.lower` is truthy, it lowercases that string before normalization. Each run of characters outside ASCII letters, digits, and underscores becomes one underscore; leading and trailing underscores are then removed. Leading digits are retained, so the function normalizes dependency tokens but does not enforce a programming-language identifier grammar.

Falsy null-like values, `0`, `false`, and empty strings become an empty string before conversion. Truthy arrays and objects follow JavaScript string coercion. Omitted or `undefined` options use the default empty object. Explicit `null` options throw `TypeError` because the Legacy implementation reads `options.lower` directly. The function does not mutate its value or options inputs and has no filesystem, process, archive, environment, network, API, or other host side effects.

## projectDataListScalarField

`projectDataListScalarField(input?: ScalarFieldProjectionInput): ScalarFieldProjectionResult` accepts only the JSON-serializable pre-ID scalar Data List field boundary. It returns a runtime-frozen result, frozen findings array, and frozen projection when present. The projection is JSON-serializable and deliberately omits Legacy field-record shapes, `ListID`, `FieldID`, mutable template values, generated-resource mutation, and all host state.

Text, Datetime, Decimal, and Bit scalar projections are supported. Lookup, sublist, identity, file, and image controls return explicit deferred findings. A true barcode-scan flag throws `DATA_LIST_BARCODE_SCAN_FIELD_TYPE_INVALID` unless the canonical type is Text and the control type is input. The function performs no filesystem, process, archive, environment, network, API, runtime, ID-allocation, template-mutation, or generated-resource-mutation behavior.

Phase 5C makes this public Core API available in the self-contained Materializer Core artifact only. It does not add a compatibility-adapter export or production materializer route. A separate approved Phase 5D is required before any scalar projection is consumed by `buildFieldRecord`.
