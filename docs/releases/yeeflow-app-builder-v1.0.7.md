# Yeeflow App Builder v1.0.7

## Summary

This release incubates a host-neutral App Builder Execution Service inside the existing monorepo. The boundary is runnable in process, keeps deterministic domain logic in Core, and allows hosts to supply structured model results without introducing provider, credential, transport, or persistence concerns into Core.

## Scope

- Add `@yeeflow/app-builder-execution-contracts` with versioned requests, contexts, capabilities, model invocation, results, verification, and repair contracts.
- Add `@yeeflow/app-builder-execution-service` with fail-closed protocol and capability negotiation, exact envelope validation, explicit no-write authority, Core input isolation, and deterministic result mapping.
- Adapt the Codex Plugin through injected host-controlled model invocation.
- Add deterministic Web managed-provider and future-host fixtures for source-only cross-host equivalence proof.
- Add a deterministic canonical application vertical slice that plans, validates, materializes, verifies, and suggests repairs through existing domain-pure Core projections.
- Add dependency and vocabulary gates that prevent Core from importing execution packages or acquiring host, model, provider, transport, authorization, session, or persistence responsibilities.

## Plugin Packaging Boundary

The official Codex Plugin archive contains only five execution artifacts: Core domain contracts, the Core application facade, execution contracts, the execution service, and the Codex Plugin adapter. The Web managed-provider fake adapter and future-host fixture remain monorepo source/test fixtures. Archive hygiene fails if either non-Plugin adapter artifact or package identity appears in the Plugin archive.

The Plugin release version is `1.0.7`. The Core distribution compatibility version and execution protocol remain independently versioned at `1.0.0`; the official archive builder supplies this internal Core version explicitly and rejects conflicting input.

## Validation

- TypeScript, workspace/package/dependency boundaries, architecture convergence, and 16 dependency-negative cases pass.
- Cross-host equivalence passes for Codex, Web fake, and future-host fixtures in compiled source.
- Protocol mismatch, unsupported capability, authority escalation, credential-field leakage, model-result leakage, and Core input/output isolation regressions pass fail closed.
- The canonical generated-app regression preserves resource, field order, deterministic field identity, Choice values, immutability, validation, verification, and repair behavior.
- Core distribution builds and validates three artifacts with 32 negative gates and source/archive/simulated-installed resolution proof.
- Plugin execution distribution builds and validates five artifacts with 10 negative gates; the Codex path has source, official dist, archive, and simulated-installed parity.
- OAuth source/dist/archive/installed parity, English-only, migration JSON parsing, archive hygiene, release safety, and Git diff checks pass.

## Proof Boundary

This release uses deterministic fake model ports only. It does not add a live provider integration, HTTP service, queue, database, persistence, retries, provider SDK, API key handling, or model policy to Core or the Plugin. It does not sign or install an application, mutate an active Plugin cache, access OAuth credentials, write to Yeeflow, change tenant/workspace resources, modify Plugin Test2, or alter historical rollback archives and protected duplicates.

The standalone Core repository remains **not ready**. The evidence-backed blockers remain the independent package/release policy, clean extracted-topology build, legacy runtime-client ownership decision, future repository placement, reproducible extracted artifact build, and downstream compatibility/rollback policy.
