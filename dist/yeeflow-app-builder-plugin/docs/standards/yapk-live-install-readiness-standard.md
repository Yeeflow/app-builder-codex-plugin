# YAPK Live Install Readiness Standard

This standard covers generated-final `.yapk` packages after local package validation and before any live signing, install/import, upgrade, or browser runtime proof.

## Purpose

Local schema validation proves that a package can be decoded and inspected. It does not prove that Yeeflow will materialize the same application root, that embedded dashboard resources have fresh per-page control identities, or that encoded approval workflow resources were remapped with the same fresh ID family.

The live install readiness gate exists to block packages that can pass local shape checks but still open a blank shell, collide at runtime, or fail after API submission.

## Required Checks

1. `wrapper.ListID` must equal decoded `ListSet.ListID`.
2. `wrapper.TenantID` must be the real target tenant LongAsString. Placeholder `TenantID: "0"` is signing/install readiness failure even when the generic schema accepts numeric strings.
3. Every Dashboard page (`Type: 103`) must use the decoded root `ListSet.ListID` as its `ListID`.
4. Dashboard `LayoutInResources[].Resource` must be parseable JSON.
5. UUID-shaped dashboard control IDs copied from templates must be re-instantiated per generated page/resource. Cross-page duplicate UUID-shaped control IDs are a hard failure.
6. Large generated IDs embedded inside dashboard JSON strings must be API-issued IDs listed in the ID provenance manifest.
7. Approval `Forms[].DefResource` must decode from the export-shaped `::brotli::` payload and must preserve `key` / `defkey` alignment with `Forms[].Key`.
8. Large generated IDs embedded inside approval `DefResource` must be API-issued IDs listed in the ID provenance manifest.
9. Install/import API `apiStatus: 0` is submitted/accepted only. It is not final success.
10. Final install success requires Version Management evidence for the exact submitted `PackageId` with status `Succeed`.
11. A failed Version Management row blocks fresh-install retry with the same failed `PackageId` / `ListSetID` family. Use a fresh API-issued ID family for a fresh install retry after package mutation.
12. Planning placeholders such as `Not planned`, `N/A`, `None`, `Not applicable`, or `No form report` must never materialize as real package resources or visible navigation entries.
13. Navigation must not contain duplicate entries that target the same package-local resource ID and type, such as two Type `105` entries pointing at the same approval/form-report target.

## Generator Requirements

- The full-app materializer must use a single API-issued root identity for both wrapper and decoded root surfaces.
- The package handoff must replace placeholder tenant metadata before signing. The materializer may resolve the target tenant from an explicit `--tenant-id`, profile-scoped `YEEFLOW_<PROFILE>_TENANT_ID`, or `YEEFLOW_TENANT_ID` when those values are safely available. Do not sign or install packages whose wrapper still has `TenantID: "0"`.
- Template-cloned Dashboard resources must regenerate UUID-shaped control IDs per page while preserving semantic container IDs used by validators and templates.
- Fresh-ID remap must include nested dashboard JSON strings and encoded approval `DefResource` payloads.
- The materializer may remain signing-ineligible as a generation handoff, but generated-final preflight must produce the signing-readiness handoff when all local hard gates pass.
- App Plan rows marked `Required = No`, `Include = No`, `Generate = No`, `Not planned`, `N/A`, or `None` are explicit non-resources. The generator must not create `FormNewReports[]`, `DataReports[]`, pages, forms, lists, layouts, navigation entries, permissions, sample rows, workflow bindings, or hidden helper resources from those placeholders.
- Visible navigation must be planned-resource only. Do not generate a navigation item for a row whose target resource is a placeholder, whose visibility is `No`, or whose resource was omitted because it was not planned.

## Proof Boundary

Passing this gate means the package is locally ready for signing attempts. It does not prove signing, API installation, Version Management final success, or browser/runtime rendering. Those stages remain separate evidence boundaries.
