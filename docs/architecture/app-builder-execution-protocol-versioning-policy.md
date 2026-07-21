# App Builder Execution Protocol Versioning Policy

## Version identifier

The protocol identifier is an explicit string: `app-builder.execution/1.0.0`. The structured-intent identifier is independently versioned as `app-builder.intent/1.0.0`.

The current in-process service requires an exact protocol match in the request, execution context, and capability profile. A model result must also declare the exact protocol version. There is no implicit downgrade, prefix match, or silent compatibility mode.

## Open capability profile

Capabilities are `{ id, version }` descriptors. The contract does not enumerate hosts or channels. A service advertises supported descriptors, a host advertises available descriptors, and a request declares required descriptors. Execution proceeds only when all three agree exactly.

Adding a host does not change the protocol. Adding an optional capability does not require a protocol change when old requests remain unambiguous and exact-field validation is preserved. Changing an existing descriptor's meaning requires a new descriptor version.

## Contract changes

The protocol version must change when a request or result field is removed, renamed, changes meaning, or becomes newly required. A compatible additive field still requires an explicit protocol decision because version 1 rejects unknown properties by design.

Every protocol change requires:

- updated execution-contract types;
- negotiation and exact-field validators;
- positive and negative compatibility fixtures;
- source, official distribution, archive, and simulated-installed parity;
- updated distribution contract and checksums;
- an explicit migration note.

## Security and privacy

Opaque model profile values can be consumed only by the host-owned model adapter. They cannot enter canonical Core input or execution output. Provider credentials and provider-specific configuration are not protocol fields. Unknown fields fail closed and diagnostics report only stable codes.

## Transport independence

The protocol is currently invoked in-process. A later network or queue envelope must be a non-Core runtime concern and must preserve the same version and capability semantics. Transport introduction cannot expand authority or add provider details to Core.
