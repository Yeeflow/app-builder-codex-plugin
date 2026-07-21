# App Builder Execution Adapter Boundary Map

## Dependency direction

```text
adapters
  -> @yeeflow/app-builder-execution-service
  -> @yeeflow/app-builder-execution-contracts + deterministic Core

deterministic Core
  -> no execution contracts, runtimes, adapters, host libraries, or model libraries
```

The dependency direction is one-way. An adapter cannot import Core directly. The execution service cannot import an adapter. Core cannot import either execution package.

## Ownership

| Concern | Owner | Core-visible |
| --- | --- | --- |
| Canonical application DTOs and pure build results | Core contracts | Yes |
| Pure planning, validation, materialization, verification, and repair | Core facade and domain packages | Yes |
| Protocol version and open capability descriptors | Execution contracts | No |
| Execution context and no-write authority | Execution contracts and service | No |
| Model invocation interface and opaque profile reference | Execution contracts and host adapter | No |
| Capability negotiation and exact-field validation | Execution service | No |
| Host model selection and provider policy | Host adapter | No |
| Optional origin and correlation observability | Execution service | No |
| Filesystem, network, credentials, process, tenant, and installation behavior | Existing or future non-Core runtimes/adapters | No |

## Incubated adapters

| Adapter | Purpose | Provider behavior |
| --- | --- | --- |
| `@yeeflow/codex-plugin-adapter` | Host-controlled invocation wiring | Receives an injected host-owned model port |
| `@yeeflow/web-managed-provider-fake-adapter` | Managed-provider architecture fixture | Uses a deterministic fake only |
| `@yeeflow/host-extension-fixture-adapter` | Open future-host extensibility proof | Uses a deterministic fake only |

Only the Codex adapter is part of the Codex Plugin production distribution. The Web managed-provider fake and future-host fixture are monorepo-only architecture tests; their artifact names and package identities are rejected by the official Plugin archive hygiene gate.

These names describe adapters, not a closed list. Adding another host requires a new adapter that implements the same contract and does not require a Core change.

## Automated enforcement

`validate-dependency-boundaries.mjs` and its regressions reject:

- Core imports of execution contracts, runtimes, or adapters;
- Core host/provider/transport/authentication vocabulary and imports;
- runtime imports of adapters;
- adapter imports of Core or any runtime other than the approved execution service;
- deep or relative cross-package import bypasses;
- dependency cycles and undeclared workspace edges.

Behavior tests also capture the exact Core input and prove that context, authority, capabilities, profile values, and model input are absent.
