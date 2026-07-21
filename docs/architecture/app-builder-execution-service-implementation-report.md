# App Builder Execution Service Implementation Report

## Summary

The monorepo now contains a runnable in-process execution-service boundary around deterministic App Builder Core packages. Cross-host protocol concerns were deliberately separated into `@yeeflow/app-builder-execution-contracts`; no execution context or model invocation abstraction was added to Core.

## Implemented packages

- `packages/app-builder-execution-contracts`: protocol, capability, authority, structured-intent, model-port, and result contracts.
- `runtimes/app-builder-execution-service`: negotiation, exact-field validation, no-write enforcement, canonical-intent isolation, and Core invocation.
- `adapters/codex-plugin-adapter`: injected host-controlled model invocation.
- `adapters/web-managed-provider-fake-adapter`: deterministic managed-provider fixture.
- `adapters/host-extension-fixture-adapter`: open future-host extensibility fixture.

The Core facade implements a deterministic canonical application vertical slice using existing planning-label and Data List scalar-field projections. It returns immutable plan, validation, materialization, verification, and repair data.

## Security and authority results

Focused regressions prove that unsupported capabilities, protocol mismatch, nonempty write authority, and unknown credential fields reject before model invocation. Model results with extra properties reject before Core invocation. A capturing Core port proves that execution context, capabilities, authority, origin, correlation, model profile references, and model input are absent from Core input and results.

## Distribution results

The official Plugin execution builder emits five self-contained ESM artifacts under `dist/yeeflow-app-builder-plugin/execution`: the Core domain contracts and facade, execution contracts and service, and the Codex Plugin adapter. The Web managed-provider fake and future-host fixture remain monorepo-only source/test adapters and are prohibited from the Codex Plugin archive. The distribution manifest records exact exports, source and compiled input checksums, output checksums, package graph version, protocol version, and checksums of required Core planning/materializer artifacts.

Compiled source executes all three adapters with identical Core output. The Plugin-owned Codex adapter additionally passes source, official distribution, temporary official archive, and simulated-installed parity. Distributed authority-negative cases invoke the model zero times, and archive hygiene rejects either non-Plugin adapter by artifact or package name.

## Verification record

The final monorepo verification completed on 2026-07-21:

| Gate | Result |
| --- | --- |
| TypeScript build | Passed across 21 workspace packages |
| Workspace/package boundaries | Passed with 21 registered packages |
| Dependency boundaries | Passed across 80 source files |
| Dependency negative regressions | Passed 16 cases, including Core execution imports and capability vocabulary, adapter bypass, and runtime-to-adapter imports |
| Execution architecture gate | Passed for 15 Core packages and three adapters |
| Cross-host equivalence | Passed for three adapters |
| Protocol, capability, authority, and leakage negatives | Passed before model or Core invocation as applicable |
| Core distribution | Built and validated three artifacts; 32 negative gates and source/archive/installed resolution passed |
| Execution distribution | Built and validated five Plugin-production artifacts; 10 negative gates passed |
| Execution parity | Three-adapter equivalence passed in source; Codex adapter parity passed on source, official dist, official archive, and simulated-installed surfaces |
| English-only | Passed for 90 explicit incubation/release paths; the official changed scope and 10-case English gate regression also passed |
| Archive hygiene | Passed with zero protected duplicate artifacts in the official temporary archive |
| Git diff check | Passed; no files were staged or committed |

A temporary official archive was built and checked as incubation evidence. It is not a release artifact or release claim; its checksum is reported outside the archive to avoid making the archive content self-referential.

## Proof boundaries

This work used deterministic fake model ports only. It did not access credentials, mutate an active Plugin cache, call a provider, write to Yeeflow, sign or install a package, mutate a tenant or workspace, modify Plugin Test2, create a repository, commit, push, tag, or release.

## Extraction verdict

**NOT READY to create the standalone Core repository.**

The in-process service boundary itself is verified and ready for continued monorepo incubation. Repository extraction remains blocked only by the following evidence-backed items:

1. No independent package/release/versioning policy has been approved.
2. A clean-checkout build of the future extracted topology has not been produced; this work intentionally remains uncommitted, and the current repository still carries historical ignored scaffolding.
3. The legacy `app-builder-core-runtime-client` package name and migration treatment need an explicit ownership decision, even though its present source and capability metadata are restricted to pure deterministic runtime-operation DTO concerns.
4. The repository placement of the execution service relative to a future Core repository has not been decided.
5. No extracted-repository build exists from which to reproduce the current sanitized fixtures and official artifact checksums.
6. Downstream compatibility and rollback policy for the monorepo consumer has not been defined.

Live provider parity, Web deployment, tenant mutation, signing, installation, and production runtime proof are neither claimed nor required for this incubation verdict.
