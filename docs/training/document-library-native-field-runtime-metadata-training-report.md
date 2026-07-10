# Document Library Native Field Runtime Metadata Training Report

## Scope

This focused training closes a generated-final `.yapk` gap where a native Type `16` Document Library passed structural validation, signing, installation, and navigation checks but failed when the browser opened the library.

The affected package already had the correct resource type, navigation type, native field names, and structural root folders. The failure was caused by treating Document Library support fields like ordinary Data List fields.

## Runtime Incident

The affected Document Library rendered its shell and columns, then returned server-side request errors. A focused package repair aligned the seven native field records with an export-backed Document Library, after which the user confirmed that the newly generated application opened the Document Library without the prior error.

This separates two contracts:

- Structural contract: Type `16`, navigation, fields present, and folder rows under `List.Items`.
- Runtime metadata contract: exact native field `Status`, `Rules`, `IsSystem`, `IsIndex`, field identity, storage type, and control type.

Both contracts are required before signing.

## Required Native Field Contract

| Field | Runtime metadata |
| --- | --- |
| `Title` / Name | `FieldIndex=0`, `Status=1`, `IsSystem=true`, `IsIndex=true`, `displayLabel=true`, `isLibrary=true` |
| `Bigint1` / ParentID | `Status=127`, `IsSystem=false`, `displayLabel=true`, `isNotInListFiles=true` |
| `Text1` / Type | `Status=119`, `IsSystem=false`, `displayLabel=true` |
| `Bigint2` / FileSize | `Status=99`, `IsSystem=false`, `displayLabel=true`, `readonly=true` |
| `Text2` / Extension | `Status=99`, `IsSystem=false`, `displayLabel=true`, `readonly=true` |
| `Text3` / UniqueName | `Status=319`, `IsSystem=false`, `displayLabel=true`, `isNotInListFiles=true` |
| `Text4` / Upload File | `Status=57`, `IsSystem=false`, `displayLabel=true`, `required=true`, `isLabrary=true`, `PROP_MAXSIZE=2147483648` |

`Text4.Rules.isLibrary` is not part of the runtime-proven upload-field contract. The misspelled product key `isLabrary` must be preserved exactly.

The current generated-package canonical schema requires native `Title.FieldIndex=0`. A studied export used `1`, but copying that value caused the canonical schema and field-index uniqueness gates to fail. The runtime-confirmed repair therefore keeps `Title.FieldIndex=0` while adopting the runtime-significant status bits and rules.

## Generator Change

`scripts/materialize-full-app-generated-final.mjs` now emits the runtime-proven contract directly from `DOCUMENT_LIBRARY_DEFAULT_FIELDS`. It no longer assigns `Status=1` and `IsSystem=true` to every support field.

This generator rule applies only to Type `16` Document Libraries. Normal Type `1` Data Lists continue to use the Data List field contract.

## Validator And Preflight

`scripts/validate-document-library-native-field-runtime-metadata.mjs` recursively validates every Type `16` child resource and fails on:

- missing native fields;
- wrong field storage, index, display/internal identity, or control type;
- incorrect runtime status bits;
- incorrect `IsSystem` or `IsIndex` flags;
- missing, malformed, or incompatible native rules;
- legacy `Text4.Rules.isLibrary` residue.

The validator tolerantly decodes official-export-style Brotli and accepts stringified or object-shaped `Rules`. It ignores Type `1` Data Lists.

`scripts/yapk-first-generation-preflight.mjs` runs this as the `document-library-native-field-runtime-metadata` hard gate before signing readiness can pass.

## Regression Coverage

`scripts/test-document-library-materialization-gates.mjs` now proves:

- all seven generated fields match the runtime metadata contract;
- a Type `1` register in the same package is not treated as a Document Library;
- the dedicated validator passes the generated Type `16` resource;
- the old simplified `Status=1` / `IsSystem=true` shape fails;
- missing `displayLabel`, upload max size, and other rules fail;
- legacy `Text4.Rules.isLibrary` fails;
- `Title.FieldIndex=1` fails under the current generated-package schema strategy;
- first-generation preflight reports the dedicated gate for the old shape.

The normalized reference is `docs/reference/document-library-native-field-runtime-metadata.normalized.json`. It contains no tenant, application, list, package, record, user, URL, signature, or file payload identifiers.

## Runtime Verification Checklist

After static preflight and signing, keep the following as separate evidence:

1. Version Management reaches final `Succeed`; install API submission alone is insufficient.
2. The application navigation resolves the intended Type `16` library.
3. Opening the library produces no wrong-request or server-error toast.
4. Planned root folders are visible and can be opened when folder behavior is in scope.
5. Upload is tested only with a safe sample and requires readback/persistence proof.
6. Nested folders, permissions, notifications, version history, and binary download require their own focused proof.

## Proof Boundary

The metadata contract is export-backed, generator-enforced, validator-backed, and user-confirmed for browser opening of the repaired Document Library. It does not by itself prove folder navigation, upload execution, binary persistence, permissions, version history, nested folders, or every future product release. Those remain separate runtime proof stages.
