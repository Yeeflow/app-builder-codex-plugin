# Document Library Full-App Materialization Training Report

## Problem

Internal Audit generation planned a `Document Library` navigation/resource, but the generated application only contained Data Lists. The intended document repository was emitted as a Type `1` Data List with `file-upload` fields instead of a native Yeeflow Type `16` Document Library.

## Root Cause

The full-app materializer parsed Section 4, `Data Lists and Document Libraries Plan`, into one `dataLists` collection. It then generated every child resource and every navigation item as Type `1`. The generator already had Document Library studies and validators, but the full-app App Plan projection did not preserve the planned child resource type.

## Required Generation Rule

- Preserve planned child resource kind from App Plan to generated-final resources.
- `Document Library` must materialize as `Childs[].List.Type = 16`.
- `Data List` must materialize as `Childs[].List.Type = 1`.
- Navigation must use the same type as the generated child resource.
- Do not simulate a Document Library with a Data List plus `file-upload` fields.
- When business requirements need a document register/index and native file storage, generate both:
  - Type `1` Data List, for metadata, workflow status, indexing, and approvals.
  - Type `16` Document Library, for native document/file storage.

## Materializer Update

The materializer now builds typed child resource records from Section 4 headings, resource type rows, and Section 15 navigation type evidence. Document Library rows use the export-proven Type `16` default field set:

- `Title` / Name
- `Bigint1` / ParentID
- `Text1` / Type
- `Bigint2` / FileSize
- `Text2` / Extension
- `Text3` / UniqueName
- `Text4` / Upload File

Navigation now allows Type `16` entries and data-view navigation inherits the host child resource type.

## Regression

`scripts/test-document-library-materialization-gates.mjs` covers an Internal Audit-style app with both:

- `Audit Document Register` as Type `1`.
- `Audit Evidence Library` as Type `16`.

The test asserts:

- planned Document Library is not downgraded to Type `1`;
- Type `16` child includes the native upload field;
- all seven Type `16` native fields preserve the runtime-proven status bits, rules, system/index flags, field identities, and controls;
- root navigation includes the Document Library as Type `16`.

## Validation Boundary

Structure and navigation alone are insufficient. Run `scripts/validate-document-library-native-field-runtime-metadata.mjs --package <generated-final.yapk>` and stop before signing if the native field runtime contract fails. The repaired Internal Audit package was user-confirmed to open without the prior server request error. Upload execution, binary persistence, permissions, version history, and nested-folder behavior still require separate focused runtime proof.
