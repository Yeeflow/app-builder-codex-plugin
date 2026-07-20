# Core v1 Release Candidate Integration and Application E2E Readiness

`CORE_V1_RC_INTEGRATION_READINESS_ACCEPTED`

## Decision

Core v1 is ready to start, but not to skip, the next isolated candidate-build task: `core-v1-rc-candidate-build-and-isolated-e2e-validation`.

This decision accepts a plan for an isolated `1.0.0-rc.1` candidate. It does not create that candidate, change any version, sign an archive, install a Plugin, or authorize release promotion.

## Baseline and version policy

The observed baseline remains Git `fcc8b8e16b784f1032759ee1b6b588a144497feb`, tag `yeeflow-app-builder-plugin-v0.9.71`, root/Core package version `0.1.0`, and current Plugin manifest version `0.9.71`. This workspace is intentionally dirty and is not a release candidate.

The future isolated candidate must use release version `1.0.0-rc.1` consistently in every release-facing package, the Core distribution manifest `coreVersion`, the Plugin manifest, archive filename, and provenance record. Existing `v0.1.0` public-contract schema and artifact filename tokens remain schema identifiers unless a separately approved public-contract migration changes them.

Candidate assembly must create a fresh temporary workspace from an explicit allowlist with content SHA-256 records. It must not build in this workspace, use `node_modules`, copy protected duplicate paths, alter the historical ZIP, or write to an active installation.

## Required E2E envelope

The candidate must pass the versioned matrix in `core-v1-rc-application-e2e-coverage-matrix.v1.0.0.json` for:

- Data List scalar fields and embedded Sublist descriptors.
- Static and dynamic Sublist summary configuration.
- Embedded Lookup target/display and declarative `addition[]` configuration.
- Embedded identity-control configuration.
- Approval Form static configuration and preserved Sublist Lookup metadata.
- Workflow static projections.
- Dashboard static configuration.

Each row requires source, official temporary ZIP, simulated installed Plugin, deterministic, scope/leakage, and retained-Legacy rollback proof where its existing route specifies them. The matrix deliberately does not claim frontend events, target retrieval, temporary-variable lifecycle, identity resolution, workflow execution, chart rendering, package orchestration, or other host/frontend runtime behavior.

## Candidate build and install hard gates

Before signing, the future candidate task must validate release-version alignment, frozen install, typecheck, workspace tests, dependency and package boundaries, Core v1 closure, every matrix row, source/archive/installed parity, determinism, temporary-copy rollback, no leakage, English-only, closure lineage, and `git diff --check` inside the isolated candidate workspace.

Before an isolated install, an authorized operator must provide a disposable target, signing authority, target inventory, candidate checksum, rollback archive, and rollback checksum. The active installation is not a valid target. Before promotion, the isolated install must have version readback, application smoke evidence, and a successful rollback drill; promotion then requires separate authorization.

## Current checksums

| Item | SHA-256 |
| --- | --- |
| `pnpm-lock.yaml` | `3b6669280dda51c183b3d9c7f39aa309e0f462e001f84265865622a8079e149d` |
| Current Plugin manifest | `ce105efe3a8a71a31cd96ddabca5e5df3a4fde58fe1c74c3cd30cfaa0a71be8b` |
| Current Core distribution manifest | `f7b01a141f25766cd21fbc23968f13e5ca62b37e2224fa1cf7ed5361f53e5497` |
| Current materializer | `cbeb0fd58d23f34339df329b77c3afbc2ebe100e1bbceba0cef428e45bc0b87d` |
| Historical `0.9.71` ZIP | `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2` |

## Validation

The readiness validator verifies authority checksums, release version policy, isolated-snapshot policy, coverage completeness, rollback active-install protection, migration-state alignment, and audit-only release prohibitions. Its negative suite rejects an invalid RC version, missing coverage surface, release bypass, authority checksum tampering, and active-install rollback guard removal.

No production materializer behavior, adapter, public API, Core artifact, Plugin dist, active installation, historical ZIP, protected duplicate, Git staging state, commit, push, release, or promotion changed in this audit.
