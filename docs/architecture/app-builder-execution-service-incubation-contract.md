# App Builder Execution Service Incubation Contract

## Status and scope

This contract defines the in-process execution boundary incubated inside the App Builder monorepo. It does not define an independently deployed service, an external repository, a live model provider, or a tenant runtime.

The service accepts structured application intent after a host-owned model adapter has produced it. It negotiates a versioned capability profile, enforces no-write authority, isolates the canonical domain input, invokes deterministic Core, and returns stable structured results.

## Flow

```text
host controller
  -> host-owned ModelInvocationPort
  -> StructuredApplicationIntent
  -> InProcessExecutionKernel
  -> CanonicalApplicationIntent
  -> buildApplicationFromCanonicalIntent
  -> plan, validation, materialization, verification, and repair result
```

The service never invokes `ModelInvocationPort`. Adapters must negotiate capabilities before invoking their model port, then submit only the returned structured intent. This prevents unsupported capability, protocol, and authority requests from consuming model work.

## Protocol

The initial protocol is `app-builder.execution/1.0.0`. Its contracts live in `@yeeflow/app-builder-execution-contracts`, which is not a Core package.

`ExecutionRequest` contains:

- a protocol version and request identifier;
- an open `ExecutionContext` with a versioned capability profile;
- an empty-effect authority declaration;
- required capabilities;
- a `StructuredApplicationIntent`.

Capability identifiers are strings, not a closed host or channel enum. The current service supports independently versioned plan, validate, materialize, verify, and repair capabilities. Unknown capabilities fail closed.

`origin` and `correlationId` are optional observability fields. They may be returned in the observability envelope, but they cannot select Core behavior. `modelProfileRef` is opaque, remains outside Core, and is not returned by the service.

## Authority

The incubation provides no external write authority. `allowedEffects` must be an empty array. Any requested effect is rejected before model invocation by conforming adapters and before Core invocation by the service.

No package signing, installation, tenant mutation, workspace mutation, credential access, or external communication is performed by this service.

## Core isolation

The service validates exact protocol fields and maps accepted structured intent into a new `CanonicalApplicationIntent` object. Only application name, operation, resource kind and name, and field declarations cross that boundary. Execution context, capabilities, authority, origin, correlation, profile references, model input, and unknown fields do not cross it.

Core returns immutable domain results. The service clones and freezes its output envelope. Errors use stable codes and do not echo rejected values.

## Failure behavior

The kernel fails closed for:

- protocol mismatch;
- malformed or unsupported capabilities;
- requested external effects;
- unknown context, request, resource, or field properties;
- unsupported intent schema or operation;
- Core validation failure;
- unexpected Core failure.

Adapters additionally reject model results with a mismatched protocol or extra properties before Core invocation.
