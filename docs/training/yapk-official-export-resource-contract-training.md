# YAPK Official Export Resource Contract Training

## Scope

This training covers the top-level `.yapk` wrapper `Resource` payload used by full application packages. It does not change nested approval `DefResource` encoding or `.yap` list export gzip handling.

## Product Evidence

Current Yeeflow product exports can use an official export-compatible Brotli shape for the top-level `Resource`:

- Brotli compression quality is `1`.
- The encoded stream may be missing the final byte.
- Strict `brotliDecompressSync` can report `unexpected end of file`.
- Streaming/tolerant Brotli decode can still emit a complete JSON AppPackageInfo payload.

The official sample `Risk-v1.0.yapk` includes these top-level AppPackageInfo keys:

- `FormReports`
- `FormNewReports`
- `CustomServices`
- `DataReports`
- `Pages`
- `Forms`
- `Childs`
- `Themes`
- `Components`

Generated packages must preserve the official export shape, including empty arrays for resource groups that are not used.

## Generator Rules

1. Generate the top-level `.yapk` wrapper `Resource` using official export-compatible Brotli:
   - JSON text is `JSON.stringify(decoded)` plus trailing JSON-whitespace padding so tolerant decode still emits a complete JSON object after the stream-end byte is omitted.
   - Brotli quality is `1`.
   - The final compressed byte is omitted to match the current official export-compatible stream shape.
2. Always include `FormReports: []` and `CustomServices: []` in AppPackageInfo, even when no form reports or custom services are planned.
3. Do not treat unrelated package differences as root cause without exclusion proof. Grouped navigation is allowed when it passes navigation runtime metadata gates.
4. Keep nested approval `DefResource` and other inner resources on their proven export contract unless there is separate product evidence.

## Validator Rules

1. Package decoders must support strict Brotli first and then tolerant streaming Brotli fallback.
2. A strict Brotli `unexpected end of file` is not automatically a failure when tolerant streaming decode returns valid JSON.
3. Missing `FormReports` or `CustomServices` is a hard failure for generated `.yapk` app packages.
4. Live-install proof must remain separate from package-shape validation: install API `submitted` is not the same as Version Management `Succeed`.

## Regression Coverage

The focused regression is:

```bash
node scripts/test-yapk-official-export-resource-contract.mjs
```

It verifies:

- Official-compatible generated `Resource` fails strict Brotli decode.
- Shared tolerant decode parses the package.
- `validate-yapk-package.js` requires `FormReports`.
- `validate-yapk-package.js` requires `CustomServices`.

The local official sample smoke is:

```bash
node scripts/decode-yapk-tolerant-brotli.mjs --package /Users/rengerhu/Downloads/Risk-v1.0.yapk
```
