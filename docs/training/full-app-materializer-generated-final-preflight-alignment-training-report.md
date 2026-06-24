# Full-App Materializer Generated-Final Preflight Alignment Training Report

## Summary

This training follows the `0.8.35` Office Asset Loan Management clean-room reverification. Version `0.8.35` fixed the previous blocker where the standalone materializer could not emit a full-app resource graph at all. It generated a `.yapk`, decoded resource JSON, generation report, and ID provenance report.

The package was still not signing-ready. The generated-final hard stop was correct because local gates found invalid ID/provenance wiring, semantic-only navigation, thin approval resources, incomplete generated data-list views, and simplified dashboard/export-shape contracts.

This training tightens the standalone materializer so the minimal generated-final package it emits is internally consistent and can pass the local pre-signing gates that match the supported minimal resource-graph scope.

## Source Finding

The `0.8.35` reverification showed:

- active plugin and cache were `0.8.35`;
- OAuth refresh and workspace discovery passed;
- 120 API-issued IDs were allocated;
- the materializer emitted generated-final artifacts;
- `signingEligible` remained `false`;
- signing/install/runtime proof correctly did not run.

The failed local gates included:

- ID provenance and path mapping;
- runtime navigation metadata;
- default data-list view schema;
- approval `DefResource` export shape;
- dashboard Summary/runtime export shape;
- generated-final resource completeness for approval task/actions and custom forms.

## Changes

- Preserved API-issued IDs as strings instead of converting them through JavaScript `Number`, preventing precision-loss ID collapse and duplicate resource IDs.
- Changed ID provenance paths from logical helper names to actual decoded JSON paths, for example `Fields[0].FieldID`, `Layouts[0].LayoutID`, `Forms[].DefResourceID`, and `FormNewReports[].ID`.
- Added generator provenance metadata required by the ID provenance validator.
- Generated runtime-shaped navigation groups with API-issued group IDs, `AppID`, `ListSetID`, icons, and child items that resolve to dashboard `LayoutID`, approval `Forms[].Key`, or data-list `ListID`.
- Kept form-report resources in `FormNewReports[]` while mapping report navigation entries to supported runtime targets instead of unsupported Type `106` children.
- Generated default data-list views with `Ext1.Url = default`, visible `layout[]` fields, `query[]` entries, and required system query fields.
- Generated approval `DefResource` as `base64("::brotli::" + Brotli(JSON))`, including page registrations, request/task form metadata, workflow graph nodes, sequence links, approved/rejected paths, task URL, variables, and graph metadata.
- Generated dashboard resources with export-style wrapper keys, `Ext2.src`, `LayoutInResources[0].ID/RefId = LayoutID`, canonical v1.1 Content padding, Summary `exts`, `ReportIds`, and `save_var` runtime model metadata.
- Improved custom form parsing so resource host headings do not replace actual `Form Name` rows.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now verifies that the nontrivial Office Asset style App Plan:

- does not collapse API IDs through JavaScript number precision;
- uses exact decoded paths in the ID provenance manifest;
- passes ID provenance validation;
- passes runtime navigation metadata validation;
- passes generated data-list schema validation;
- passes default YAPK package validation;
- passes generated YAPK export-shape validation;
- passes generated-final App Plan resource-completeness validation;
- keeps `signingEligible: false`.

A direct Office Asset Loan Management regression was also run locally against the saved planning artifacts from the `0.8.35` reverification. The regenerated package passed ID provenance, navigation metadata, data-list schema, default YAPK package validation, generated YAPK export-shape validation, and generated-final resource-completeness validation without signing or installing.

## Safety Boundary

This training does not claim install or runtime readiness. The materializer still does not sign packages, call install/import APIs, run Version Management checks, seed data, or perform browser/runtime proof. A future end-to-end run must still stop before signing unless the full generated-final preflight passes and explicit authorization is provided for signing/install/runtime stages.
