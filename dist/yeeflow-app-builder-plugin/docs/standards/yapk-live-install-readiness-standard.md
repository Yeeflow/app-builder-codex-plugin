# YAPK Live Install Readiness Standard

This standard covers generated-final `.yapk` packages after local package validation and before any live signing, install/import, upgrade, or browser runtime proof.

## Purpose

Local schema validation proves that a package can be decoded and inspected. It does not prove that Yeeflow will materialize the same application root, that embedded dashboard resources have fresh per-page control identities, or that encoded approval workflow resources were remapped with the same fresh ID family.

The live install readiness gate exists to block packages that can pass local shape checks but still open a blank shell, collide at runtime, or fail after API submission.

## Required Checks

1. `wrapper.ListID` must equal decoded `ListSet.ListID`.
2. Every Dashboard page (`Type: 103`) must use the decoded root `ListSet.ListID` as its `ListID`.
3. Dashboard `LayoutInResources[].Resource` must be parseable JSON.
4. UUID-shaped dashboard control IDs copied from templates must be re-instantiated per generated page/resource. Cross-page duplicate UUID-shaped control IDs are a hard failure.
5. Large generated IDs embedded inside dashboard JSON strings must be API-issued IDs listed in the ID provenance manifest.
6. Approval `Forms[].DefResource` must decode from the export-shaped `::brotli::` payload and must preserve `key` / `defkey` alignment with `Forms[].Key`.
7. Large generated IDs embedded inside approval `DefResource` must be API-issued IDs listed in the ID provenance manifest.
8. Install/import API `apiStatus: 0` is submitted/accepted only. It is not final success.
9. Final install success requires Version Management evidence for the exact submitted `PackageId` with status `Succeed`.
10. A failed Version Management row blocks fresh-install retry with the same failed `PackageId` / `ListSetID` family. Use a fresh API-issued ID family for a fresh install retry after package mutation.

## Generator Requirements

- The full-app materializer must use a single API-issued root identity for both wrapper and decoded root surfaces.
- Template-cloned Dashboard resources must regenerate UUID-shaped control IDs per page while preserving semantic container IDs used by validators and templates.
- Fresh-ID remap must include nested dashboard JSON strings and encoded approval `DefResource` payloads.
- The materializer may remain signing-ineligible as a generation handoff, but generated-final preflight must produce the signing-readiness handoff when all local hard gates pass.

## Proof Boundary

Passing this gate means the package is locally ready for signing attempts. It does not prove signing, API installation, Version Management final success, or browser/runtime rendering. Those stages remain separate evidence boundaries.
