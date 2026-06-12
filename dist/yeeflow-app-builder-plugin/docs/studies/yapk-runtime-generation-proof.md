# YAPK Runtime Generation Proof

Date: 2026-05-27

Branch: `codex/yapk-runtime-generation-proof`

## Input

Input package label: `Projects Center_1-v1..0.yapk`

Local source path used for read-only inspection: `/Users/Renger/Downloads/Projects Center_1-v1..0.yapk`

Redaction rule: this proof note does not include raw `.yapk` files, raw `Resource` strings, `Sign` values, decoded full payloads, tenant/app/list/package IDs, private URLs, API responses, secrets, tokens, screenshots, or private data.

## Decode Result

Wrapper parse: succeeded.

Wrapper shape:

- UTF-8 JSON with BOM.
- Required wrapper key count: 13.
- Required wrapper keys were present.

Resource inspection:

| Check | Result |
| --- | --- |
| Resource base64 decode | succeeded |
| Resource string length | 65688 |
| Resource decoded byte length | 49264 |
| Resource entropy estimate | 7.9930 |
| Brotli decode of base64 bytes | failed |
| Brotli decode of raw Resource UTF-8 bytes | failed |
| Brotli decode of base64url-normalized bytes | failed |

Schema-standard `AppPackageInfo` parse: not reached because Brotli decode failed.

Decoded structure summary: unavailable. No decoded JSON top-level keys or list/page/form/report counts could be produced safely because the Resource did not decompress to JSON.

## Decode Debug Follow-up

Product confirmation received after the first run: YAPK `Resource` should be exactly `base64(Brotli(AppPackageInfo JSON))`.

Additional safe diagnostics were run against the same input package:

| Diagnostic | Result |
| --- | --- |
| Strict base64 alphabet and padding | passed |
| Resource length modulo 4 | 0 |
| Base64 round-trip after decode/re-encode | unchanged |
| JSON wrapper completeness | closing object present |
| Local Brotli control stream | passed |
| Node Brotli full decoded Resource | failed: unexpected end of file |
| Node Brotli with large-window decoder parameter | failed: unexpected end of file |
| Homebrew Brotli CLI | failed: corrupt input |
| Small header skip attempts | no JSON output |
| Arbitrary trailer trimming with offsets 0-16 | no JSON output |
| gzip/zlib/raw inflate/unzip/zstd checks | failed |
| Historical local legacy API-key fallback for `verifysign` | unavailable during first debug pass |

Interpretation:

- The failure is not caused by JSON BOM handling, non-strict base64, missing base64 padding, URL-safe base64, whitespace, or local Brotli support.
- The decoded bytes are stable and complete as represented in the wrapper, but standard Brotli decoders do not accept them as a complete Brotli stream.
- This conflicts with the product-confirmed format for this specific package unless there is another package/source issue, version layer, export option, or product-specific transformation not represented in the schema statement.

Product later provided the C# helper used for Resource compression/decompression. The compression helper writes to a `BrotliStream`, calls `Flush()`, and returns `memoryStream.ToArray()` before the `BrotliStream` is disposed. That can leave the Brotli stream without its final end marker. This matches the local symptom: synchronous Brotli fails with `unexpected end of file`, but a streaming decoder emits valid JSON before the final stream error.

Safe streaming decode result:

| Check | Result |
| --- | --- |
| Stream decoder error | `Z_BUF_ERROR` / unexpected end of file |
| Partial decoded UTF-8 bytes emitted before error | 498287 |
| Partial decoded text starts with JSON object | yes |
| Partial decoded text parses as JSON | yes |
| Top-level keys | 16 expected `AppPackageInfo` keys |
| Existing child list count | 7 |
| Existing page count | 2 |
| Existing data report count | 1 |
| Existing theme count | 1 |

Important implementation note: the decoded JSON contains 64-bit numeric IDs, so editing must preserve large integers. Plain JavaScript `JSON.parse` is unsafe for app-content editing because it rounds those IDs. The focused edit used Python JSON handling for the decoded `AppPackageInfo` object and used Node only for byte-level extraction, compression, and API calls.

## Signing API Check After Local Credentials Were Added

Historical note: local `.env.local` was later added with these variables present for that proof run:

- legacy API-key fallback
- `YEEFLOW_API_BASE_URL`
- tenant ID

Values were not printed or committed.

Current signing/API helpers should use OAuth and plugin defaults. Older notes that used `YEEFLOW_BASE_URL` as an app or site base are historical; going forward `YEEFLOW_BASE_URL` is a legacy API base URL alias only, and `YEEFLOW_TENANT_URL` is only an optional manual tenant UI/browser-link fallback.

Safe API results against the original unmodified package:

| Call | Base variant | Result |
| --- | --- | --- |
| `setsign` on original wrapper without `Sign` | `api-base` | 200 OK, returned 32-byte sign |
| `verifysign` on wrapper with regenerated in-memory `Sign` | `api-base` | 200 OK |
| `verifysign` on original wrapper with original `Sign` | `env-plus-v1` | 200 OK |

No raw API responses, `Sign` values, `Resource` values, or generated packages were saved.

Interpretation:

- The Yeeflow signing service recognizes this original package as valid for signing/verification.
- Server-side signing acceptance does not prove local `Resource` decoding or app-content mutation.
- The current blocker narrows to local/product decode mismatch: product-side signing can validate the package, but standard local Brotli decoders still cannot turn `Resource` into `AppPackageInfo` JSON.

## Requested Edit

Requested change: add one minimal data list named `YAPK Runtime Test List`.

Edit result: completed locally in decoded `AppPackageInfo`.

Added child package summary:

- `List.Type`: `1`
- `List.Flags`: includes `Show = 1`
- `Fields`: 4
- `Layouts`: 1
- `RemindRules`: empty
- `PublicForms`: empty
- `FlowMappings`: empty

Added fields:

| Display name | FieldName | FieldType | Type |
| --- | --- | --- | --- |
| Name | `Title` | `Text` | `input` |
| Test Status | `Text2` | `Text` | `input` |
| Test Notes | `Text3` | `Text` | `textarea` |
| Test Date | `Datetime4` | `Datetime` | `datepicker` |

## Encode, Sign, and Verify Result

Re-encode result: succeeded using finalized standard Brotli over the edited UTF-8 JSON.

Signing result: succeeded with `setsign`.

Verification result: succeeded with `verifysign`.

Generated package path:

`/Users/Renger/Downloads/Projects Center_1-v1.1-yapk-runtime-test.yapk`

Safe generated package stats:

| Check | Result |
| --- | --- |
| Edited decoded JSON bytes | 504154 |
| Generated Resource base64 length | 49580 |
| Generated Resource decoded bytes | 37185 |
| `setsign` result | 200 OK, 32-byte sign |
| `verifysign` result | 200 OK |
| Generated wrapper written | yes, outside git |

## Local Validation

Commands used:

- `node scripts/inspect-yapk-schema-standard.mjs <input.yapk>`
- `node validate-yapk-package.js <input.yapk>`
- `node scripts/inspect-yapk-schema-standard.mjs <generated.yapk>`
- `node validate-yapk-package.js <generated.yapk> --baseline <input.yapk>`

Safe validator result:

- original wrapper parse succeeded
- original Resource base64 decode succeeded
- original Resource required tolerant streaming decode because the Brotli stream appears unfinished
- generated Resource standard Brotli decode succeeded
- generated validation status: passed
- generated decoded child count: 8
- generated decoded field count: 56
- generated decoded layout count: 24
- generated package contains `YAPK Runtime Test List`
- generated Resource changed from baseline
- generated Sign changed from baseline

## Proof Boundary

This experiment proves local decode/edit/encode/sign/verify for one focused package and user-confirmed Yeeflow upgrade/list/form materialization. The v1.4 text-only isolation package also proves record creation for a minimal generated text-only data list.

Current result:

**Local decode/edit/encode/sign/verify/runtime-upgrade/record-creation is proven for this focused package's minimal text-only data-list-add path.**

Preserved boundaries:

- Wrapper schema inspection is possible.
- Resource base64 outer decoding is possible.
- Resource `AppPackageInfo` recovery is possible for this package by accepting streaming output that parses as complete JSON despite a final Brotli `unexpected end of file` error.
- The generated package uses finalized standard Brotli Resource encoding and passes local decode/validation.
- `setsign` and `verifysign` accepted the generated package.
- Manual Yeeflow runtime upgrade and record creation are user-proven for v1.4.
- The result proves only this focused text-only data-list-add path for one package.
- Offline `.yapk` content mutation is not generally supported beyond this focused proof.

## User Runtime Result for v1.1

User-tested package:

`/Users/Renger/Downloads/Projects Center_1-v1.1-yapk-runtime-test.yapk`

User-confirmed runtime results:

- Application upgrade: succeeded.
- Version-management row status: succeeded.
- `YAPK Runtime Test List` appears in Application settings.
- `YAPK Runtime Test List` appears in the application navigation.
- Add-item form opens and renders the expected fields.
- Saving a new item fails with `Add failed`.

Updated proof boundary:

- Runtime upgrade is proven for this focused package.
- List registration/materialization is proven.
- Add-form rendering is proven.
- Record creation is not proven.

Likely save-path-sensitive differences found in the v1.1 generated list:

- Native lists use `TableCode: "flowcraft"`, while v1.1 used a custom table code.
- Native date fields use `FieldName: "DatetimeN"` and `FieldType: "Datetime"`, while v1.1 used `FieldName: "Datetime4"` and `FieldType: "Datetime"`.

## v1.2 Add-fix Package

A v1.2 repair package was generated to test the narrow save failure.

Generated package:

`/Users/Renger/Downloads/Projects Center_1-v1.2-yapk-runtime-add-fix.yapk`

Changes from v1.1:

- Kept the same generated list and field IDs.
- Changed the generated list `TableCode` to `flowcraft`.
- Changed the test date field to `FieldName: "Datetime4"`.
- Changed the test date field to `FieldType: "Datetime"`.
- Updated layout query/layout references to `Datetime4`.

Safe local validation:

| Check | Result |
| --- | --- |
| `setsign` | 200 OK, 32-byte sign |
| `verifysign` | 200 OK |
| Inspector | pass |
| Validator | pass |
| Generated Resource changed from v1.1 | yes |
| Generated Sign changed from v1.1 | yes |
| `YAPK Runtime Test List` still present | yes |
| `TableCode` | `flowcraft` |
| Test Date field | `Datetime4` / `Datetime` / `datepicker` |

Manual runtime retest needed:

1. Upgrade/import `/Users/Renger/Downloads/Projects Center_1-v1.2-yapk-runtime-add-fix.yapk`.
2. Open `YAPK Runtime Test List`.
3. Add a new item with values for `Name`, `Test Status`, `Test Notes`, and `Test Date`.
4. Confirm whether save succeeds.

User runtime result for v1.2:

- Upgrade/import failed.
- Error: `Data list: YAPK Runtime Test List (field invalid 'Test Date Datetime4!=Datetime4')`.

Conclusion:

- The v1.2 date-field casing hypothesis was wrong.
- Yeeflow's upgrade validator expects the schema field to remain `Datetime4` for this generated field.
- Do not change `Datetime4` / `Datetime` to `Datetime4` / `Datetime` for this package path.

## v1.3 TableCode-only Fix Package

A v1.3 repair package was generated from v1.1 to keep the Datetime field shape accepted by upgrade validation while testing only the likely save-path table-code issue.

Generated package:

`/Users/Renger/Downloads/Projects Center_1-v1.3-yapk-runtime-tablecode-fix.yapk`

Changes from v1.1:

- Kept the same generated list and field IDs.
- Changed generated list `TableCode` to `flowcraft`.
- Preserved the test date field as `FieldName: "Datetime4"`.
- Preserved the test date field as `FieldType: "Datetime"`.
- Preserved layout query/layout references to `Datetime4`.

Safe local validation:

| Check | Result |
| --- | --- |
| `setsign` | 200 OK, 32-byte sign |
| `verifysign` | 200 OK |
| Inspector | pass |
| Validator | pass |
| Generated Resource changed from v1.1 | yes |
| Generated Sign changed from v1.1 | yes |
| `YAPK Runtime Test List` still present | yes |
| `TableCode` | `flowcraft` |
| Test Date field | `Datetime4` / `Datetime` / `datepicker` |

Manual runtime retest needed:

1. Upgrade/import `/Users/Renger/Downloads/Projects Center_1-v1.3-yapk-runtime-tablecode-fix.yapk`.
2. Confirm the upgrade succeeds.
3. Open `YAPK Runtime Test List`.
4. Add a new item with values for `Name`, `Test Status`, `Test Notes`, and `Test Date`.
5. Confirm whether save succeeds.

User runtime result for v1.3:

- Upgrade/import succeeded.
- `YAPK Runtime Test List` still appears.
- Add form still renders.
- Saving a new item still fails with `Add failed`.

Conclusion:

- `TableCode` was not the missing save-path piece.
- The remaining failure may be tied to the Datetime field, to field/table materialization, or to another server-side list registration detail not represented by wrapper/sign/schema validation.

## v1.4 Text-only Isolation Package

A v1.4 package was generated from v1.1 to remove the date field and isolate whether record creation fails because of the Datetime field/control.

Generated package:

`/Users/Renger/Downloads/Projects Center_1-v1.4-yapk-runtime-text-only.yapk`

Changes from v1.1:

- Removed `Test Date`.
- Removed `Datetime4` from layout query/layout references.
- Kept `Name`, `Test Status`, and `Test Notes`.
- Kept the original generated list table code from v1.1.

Safe local validation:

| Check | Result |
| --- | --- |
| `setsign` | 200 OK, 32-byte sign |
| `verifysign` | 200 OK |
| Inspector | pass |
| Validator | pass |
| Generated Resource changed from v1.1 | yes |
| Generated Sign changed from v1.1 | yes |
| `YAPK Runtime Test List` still present | yes |
| Field count | 3 text fields |

Manual runtime retest needed:

1. Upgrade/import `/Users/Renger/Downloads/Projects Center_1-v1.4-yapk-runtime-text-only.yapk`.
2. Confirm the upgrade succeeds.
3. Open `YAPK Runtime Test List`.
4. Add a new item with values for `Name`, `Test Status`, and `Test Notes`.
5. Confirm whether save succeeds.

User runtime result for v1.4:

- Upgrade/import succeeded.
- `YAPK Runtime Test List` appears in the application navigation.
- Add form renders the expected text fields.
- Saving a new item succeeds.
- The saved row appears in the list with values for `Name`, `Test Status`, and `Test Notes`.

Conclusion:

- The first complete runtime proof is now established for decode -> edit -> encode -> sign -> verify -> upgrade -> add-item-save on this focused package.
- The proven scope is a minimal generated text-only data list.
- The earlier save failure was isolated away by removing the Datetime field, so Datetime field generation remains unproven.

## Product Question

Ask product to confirm whether the provided `BrotliHelper.Compress(byte[])` intentionally returns the memory stream before disposing `BrotliStream`. If not intentional, the helper should dispose/close the Brotli stream before `ToArray()` so generated Resources are complete standard Brotli streams.

Also ask product for a fresh schema-standard `.yapk` pair known to satisfy:

1. base64 decode `Resource`
2. Brotli decompress
3. parse decompressed UTF-8 JSON
4. validate JSON as `AppPackageInfo`

## Next Step

Follow-up proof target:

1. Generate one more small package from a fresh Yeeflow-generated baseline or version pair.
2. Add a minimal non-text field only after matching native field metadata exactly.
3. Runtime-test upgrade and add-item-save before broadening the supported `.yapk` generation claim.
