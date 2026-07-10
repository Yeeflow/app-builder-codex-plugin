# Document Library Folder List.Items Training Report

## Scope

This focused training adds generated-final `.yapk` support for App Plan-defined root folders inside native Type `16` Document Libraries.

The source evidence is the exported `Projects Center_1-v1.7 (1).yapk` package. Its `Documents` child resource is Type `16` and contains three root folders under `Childs[].List.Items`.

## Export-Proven Contract

For generated-final `.yapk`:

- `Childs[].List.Type = 16` identifies the Document Library.
- `Childs[].List.Items` is a record-ID-keyed object.
- Each object key is the folder ID; the row does not contain `ListDataID`.
- Root folder rows use:
  - `Title = <folder name>`
  - `Bigint1 = "0"`
  - `Text1 = "folder"`
  - `Bigint2 = ""`
  - `Text2 = ""`
  - `Text3 = "0_<lowercase folder title>"`
- `Text4` is omitted so the structural folder row cannot carry an uploaded file payload.
- Optional custom fields may be present only as blank export-shaped values.

This differs from the older `.yap` folder baseline, where folder rows live under `ListDatas` and include `ListDataID`. The two package formats must not share the wrong folder container.

## Generation Changes

- App Plan root-folder tables are projected into `documentLibraryFolderRecords`.
- Only non-deferred `Root` rows are materialized; nested desired/post-import rows remain deferred.
- Each root folder receives a dedicated API-issued ID.
- Folder IDs are serialized as `List.Items` object keys.
- ID provenance uses `decoded.Childs[index].List.Items[index].$key` so object-key IDs are verified without adding a non-export row field.

## Validator Changes

Generated-final validators now distinguish structural folders from sample data:

- Type `1` Data List `List.Items` remains forbidden.
- Type `16` `List.Items` is allowed only when every row satisfies the complete root-folder contract.
- Malformed IDs, non-object rows, missing titles, non-root parents, wrong type markers, file metadata, incorrect unique names, `Text4`, row-level `ListDataID`, unknown fields, non-string values, and nonblank custom values are hard failures.
- Plan-to-package completeness fails when a planned root folder is missing.
- Nested folders remain outside the generated-final supported contract.

## Regression Coverage

`scripts/test-document-library-materialization-gates.mjs` covers:

- two planned root folders materialized under Type `16` `List.Items`;
- one nested desired row correctly deferred;
- exact export-shaped folder values;
- object-key API ID allocation and provenance validation;
- package, canonical schema, generated-export-shape, system-schema, navigation, and plan-completeness gates;
- negative Type `1` `List.Items` and Type `16` folder-with-upload cases.

The existing Internal Audit App Plan was also regenerated in a temporary directory with the updated materializer and its existing API ID manifest. The generated `Audit Document Repository` remained Type `16`, contained all five planned root folders under `List.Items`, and passed package, canonical schema, export-shape, ID provenance, plan-completeness, and the complete first-generation preflight with `preflightEligibleForSigning: true`. No package was signed or installed during this training run.

## Proof Boundary

This training is export-proven and validator/regression-backed. Existing `.yap` runtime evidence proves root-folder behavior generally, but this change does not yet constitute a fresh generated-final `.yapk` install, Version Management, browser folder visibility, folder-open, nested-folder, or upload-persistence proof.
