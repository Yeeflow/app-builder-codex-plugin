# Yeeflow App Builder v1.0.8

## Summary

This release publishes the final `@yeeflow/app-builder-execution-sdk@1.0.0`
npm-compatible ESM tarball as a separate GitHub Release asset beside the Yeeflow
App Builder Plugin ZIP. The SDK repackages the existing host-neutral Core and
execution distribution without creating a second Core implementation.

## SDK Scope

- Publish package metadata, declaration files, an explicit export map, a
  deterministic compatibility manifest, and exact version assertions.
- Export only the Core application intent contract and facade, execution
  contracts, capability negotiation, and the in-process execution kernel.
- Preserve exact compatibility with Core distribution `1.0.0`, execution
  protocol `app-builder.execution/1.0.0`, structured intent
  `app-builder.intent/1.0.0`, and package graph `0.2.0`.
- Require the host to inject model results and accept only empty write authority.

## Excluded Responsibilities

The SDK contains no Codex, Web, or future-host adapter; no skill or prompt; no
provider SDK or provider call; no OAuth, credential, HTTP, authentication,
session, persistence, database, queue, retry, telemetry transport, tenant-policy,
or UI implementation. The Plugin continues to package only its Codex production
adapter and does not package Web or future-host fixtures.

## Validation

- Deterministic SDK builds and seven negative package mutation gates.
- Exact file allowlist, dependency-free ESM metadata, export map, checksums,
  module boundaries, and compatibility rejection behavior.
- Source, expanded package, archive, and isolated npm-installed consumer parity.
- Declaration TypeScript consumer compilation with an injected deterministic fake
  model, empty write authority, zero external calls, and zero credential access.
- Core and execution distribution validation, workspace/package/dependency
  boundaries, OAuth parity, English-only, Plugin archive hygiene, release safety,
  and Git diff checks.

## Proof Boundary

This release does not install the SDK into the Yeeflow AI App Builder Web
repository and does not claim Web bundler, browser, deployment, or runtime proof.
It does not call a real model provider, use credentials, call OAuth or tenant
APIs, mutate Yeeflow data, sign or install a generated Yeeflow application,
modify an active Plugin cache, or alter protected duplicate and historical
rollback files.

## Rollback

Plugin `1.0.7` and its immutable tag and Release remain the rollback baseline.
The SDK is an additional Release asset and introduces no Plugin runtime dependency;
downstream Web adoption can be rolled back by removing or pinning its artifact
dependency without changing the Plugin runtime.
