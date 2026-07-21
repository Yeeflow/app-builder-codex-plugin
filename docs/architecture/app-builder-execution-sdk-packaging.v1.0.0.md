# App Builder Execution SDK Packaging Architecture

## Decision

The Web-consumable distribution is `@yeeflow/app-builder-execution-sdk@1.0.0`.
It is an npm-compatible, ESM-only tarball with declaration files and an explicit
export map, published as a separate Yeeflow App Builder Plugin 1.0.8 GitHub
Release asset.

This SDK is a distribution of the Plugin 1.0.8 host-neutral Core and
execution implementation. It is not a second Core implementation, a standalone
Core repository, a Service Runtime, or a Web adapter. A Web repository must
install this artifact as its single Core/execution consumption path and must not
copy Core or execution source.

## Public surface

The root export exposes only:

- the Core application-intent version and canonical application DTO types;
- the execution protocol and structured-intent versions;
- capability, authority, request, result, and model-port DTO types;
- the deterministic Core application facade;
- execution capability negotiation and the in-process execution kernel;
- immutable SDK version metadata and an exact compatibility assertion.

The export map provides `.` plus narrow `./contracts`, `./core`, `./service`, and
`./manifest` subpaths. Internal planning and materializer modules are bundled
only because the existing Core facade requires them. They are not public SDK
subpaths.

The SDK does not invoke a model. A host owns its model invocation port, performs
provider work outside the SDK, and passes the returned structured intent to the
in-process kernel. The SDK accepts only empty write authority.

## Ownership boundary

The SDK owns version negotiation, exact-field execution validation, no-write
enforcement, structured-intent to canonical-intent isolation, and deterministic
Core invocation.

Every host, including Web, owns provider and model selection, credentials,
provider SDK or API calls, transport, authentication, sessions, persistence,
queues, retries, logging and telemetry transport, tenant policy, UI, and user
confirmation. Codex and Web adapters are not SDK modules. Local Runtime modules
are not part of this distribution because the approved application execution
vertical slice does not require host lowering.

## Version relationship

The four version axes are independent:

| Axis | Release value | Meaning |
| --- | --- | --- |
| Plugin product | `1.0.8` | Source product release whose approved artifacts are repackaged |
| Core distribution | `1.0.0` | Compatibility version recorded by the official Core distribution manifest |
| Execution protocol | `app-builder.execution/1.0.0` | Exact request, context, capability, and result protocol |
| SDK package | `1.0.0` | Final npm distribution contract for external consumers |

An SDK patch does not imply a Plugin patch. A Plugin patch does not imply a
protocol change. Protocol-breaking request or result changes require a new
protocol version. The builder and runtime compatibility assertion reject any
Core distribution or protocol version other than the exact values above.

## Artifact and integrity format

The final filename is derived by npm from its package identity and version:
`yeeflow-app-builder-execution-sdk-1.0.0.tgz`.

The package contains only package metadata, a boundary README, a deterministic
compatibility manifest, six approved runtime modules, four declarations, and a
generated SDK facade with its declaration. The package has no runtime or
development dependencies and declares `sideEffects: false`.

The deterministic manifest records:

- SDK, Plugin product, Core distribution, protocol, structured-intent, and
  package-graph versions;
- the supported capability descriptors;
- source Git and official distribution-manifest provenance;
- a sorted file inventory with byte length and SHA-256 for every package file
  except the manifest itself.

The tarball SHA-256 is written to a sidecar file because a tarball cannot contain
its own checksum without becoming self-referential. Repeated builds from equal
approved inputs must produce equal package manifests and tarball checksums.

## Packaging gates

Packaging fails unless the official Core and execution distribution manifests
match the exact Core, protocol, package-graph, package-name, and input checksum
contract. It also fails on an unexpected file, dependency, export, bare import,
Node built-in, source map, repository path, adapter identity, skill, OAuth,
credential, provider, HTTP, database, queue, retry, telemetry transport, or UI
module.

Validation covers the expanded package, npm tarball, extracted archive, and a
minimal isolated installation. The consumer smoke compiles TypeScript and runs
with a deterministic injected fake model port, empty write authority, no
credentials, and a network trap. Source, expanded package, archive, and installed
outputs must be identical.

## Deprecation and extraction path

This distribution intentionally reads the official Plugin 1.0.8 distribution
artifacts as immutable packaging inputs. The SDK tarball is published without
changing Core behavior.

If Core is later extracted to an independent repository, that repository becomes
the build provenance for the same SDK package name only after clean-build,
checksum, parity, rollback, and consumer compatibility evidence passes. Web keeps
the SDK dependency and does not change to source copies. The Plugin-local input
path may then be deprecated for at least one compatible SDK release and removed
only after both Plugin and Web consume the independently built artifact with
equivalent results.

This release publishes only the SDK tarball beside the Plugin ZIP. It does not
install the artifact into a Web repository, create a Web adapter, call a model
provider, or claim Web bundler, browser, deployment, tenant, or runtime proof.
