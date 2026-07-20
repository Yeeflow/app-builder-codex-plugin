# Architecture Convergence v0.1.0

The Plugin-incubated Core aligns to Shared Core capability boundaries without copying Shared Core implementation.

## Accepted Boundaries

- Contracts own neutral DTOs and ports; schemas own versioned machine-readable validation data; identity owns semantic IDs and lineage; canonical-model owns validated domain projections.
- Builder creates deterministic ResourceGraph data only. Materializer lowers validated structures only. Package-engine owns deterministic wrappers and encoding.
- Runtime-client defines typed transport contracts only. Local Runtime owns filesystem, OAuth, transport, process, and host execution. Codex Adapter owns Codex orchestration.
- Runtime-verification owns portable assertions and probe contracts. Test-fixtures are sanitized and test-only.

## Intentional Differences

- `runtime-client` maps to the Shared Core API-client responsibility but intentionally excludes concrete transport implementation.
- Compatibility differential fixtures remain under `compatibility/` until sanitized reusable fixtures are promoted into the test-fixtures package.
- Materializer remains a separate lowering package and its Legacy implementation is deferred.

## Enforcement

The approved graph contains 17 packages. Production-to-test-fixtures, validators-to-builder, builder-to-materializer, package-engine-to-runtime-client, Core-to-Local-Runtime, Core-to-Adapter, and dependency-cycle imports are rejected.
