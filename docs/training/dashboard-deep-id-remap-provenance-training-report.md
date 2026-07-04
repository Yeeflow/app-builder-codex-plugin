# Dashboard Deep ID Remap And Provenance Training Report

## Source Feedback

This training input comes from the Service Tickets Management fresh E2E on plugin `0.8.112`.

- Output directory: `/Users/rengerhu/Documents/Plugin Test2/service-tickets-management-20260703-001007-plugin-0_8_112-fresh-e2e`
- Reports:
  - `E2E_VALIDATION_REPORT.md`
  - `PLUGIN_ISSUE_ANALYSIS_REPORT.md`

## Problem

The generated-final package stopped correctly before signing because `yapk-first-generation-preflight` failed with:

`YAPK_EMBEDDED_DASHBOARD_ID_NOT_IN_MANIFEST`

The package still contained source-template IDs inside stringified Dashboard JSON:

- `2071862448464072704`
- `2071862457508171777`

These IDs were not part of the current API-issued ID provenance manifest. They came from cloned template/resource data and survived materialization in nested Dashboard data bindings.

## Confirmed Failure Shape

The stale IDs appeared in deep Dashboard paths, including:

- `Pages[].LayoutInResources[].Resource.attrs.data.list.ListSetID`
- `Pages[].LayoutInResources[].Resource.attrs.data.list.ListID`
- `Pages[].LayoutInResources[].Resource.attrs.querydata_list.ListSetID`
- `Pages[].LayoutInResources[].Resource.attrs.querydata_list.ListID`
- Dashboard action/custom action steps that carry list references

This is not an install/runtime environment issue. It is a generated-final materialization defect: the template clone step did not recursively remap every package-local list/application reference before writing the package.

## Correct Rule

Generated-final `.yapk` packages must not contain copied source-template package-local IDs anywhere inside Dashboard resources.

The correct fix is to recursively remap each source-template `ListSetID`, `ListID`, `LayoutID`, `FieldID`, action target, filter option source, query source, Collection source, Data Analytics source, and detail/open target to the current generated resource graph. Do not repair this class of failure by adding stale template IDs to the current ID provenance manifest.

If a cloned action or source reference cannot be mapped to a current generated resource, the generator must remove the unsupported action/source or fail before emitting the generated-final package.

## Generator Requirements

1. After cloning any Dashboard page-layout template or component template, run a recursive remap over the final Dashboard resource object before serializing `LayoutInResources[].Resource`.
2. The remap must cover nested object paths and stringified JSON values under Dashboard resources.
3. The remap must include `attrs.data.list`, `attrs.querydata_list`, Collection source bindings, filter option sources, local Collection actions, Dashboard page actions, custom action steps, detail layout refs, and Data Analytics visible/ext source refs.
4. The materializer must scan the final Dashboard JSON and fail closed if it finds any large generated ID that is not in the current manifest.
5. The Service Tickets regression must run aggregate first-generation preflight, not only focused Dashboard semantic gates.

## Validator Requirements

1. `validate-yapk-live-install-readiness.mjs` must treat large IDs in deep Dashboard JSON paths as package-local generated ID pointers.
2. The live-readiness fixture must include realistic deep list refs under `attrs.data.list`, `attrs.querydata_list`, and action step attrs.
3. `test-service-tickets-e2e-regression-gates.mjs` must execute `runYapkFirstGenerationPreflight()` against the generated Service Tickets package and ID provenance report.
4. Packages that pass schema, navigation, and dashboard semantic gates must still fail signing readiness if deep Dashboard JSON contains stale IDs outside the current provenance manifest.

## Proof Boundary

This training closes the local generated-final/signing-readiness gap. It does not claim signing, install, Version Management, seed data, or browser runtime proof. Those remain separate proof stages after generated-final preflight passes.
