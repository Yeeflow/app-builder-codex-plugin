# Yeeflow App Builder v1.12.1

## Version decision

- Previous stable version: `1.12.0`
- New version: `1.12.1` (patch)
- Scope: Dashboard generation/validation bug fix and bundled skill guidance update; no new user-facing resource type.

## Included changes

- Preserve valid embedded-only Dashboard components with blank `LayoutView` while validating the runtime-authoritative embedded Resource.
- Add fail-closed Custom Code Dashboard materialization and post-save drift checks.
- Add a synthetic fixture and local regression coverage; no customer data or tenant payloads are included.

## Verification boundary

- Local regression, source/distribution parity, archive, and plugin validation are release checks.
- No tenant Designer or browser-action runtime claim is made by this release process.
