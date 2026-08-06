# Yeeflow App Builder v1.4.0

## Summary

Yeeflow App Builder v1.4.0 adds standalone live Data List Workflow creation, update, and replacement through the hosted MCP while reusing the same WorkflowType 1 materializer and workflow-aware validator as full-application generation.

## Version

- Previous version: `1.3.1`
- New version: `1.4.0`
- Version decision: minor, because this release adds a meaningful new live builder capability rather than a compatible metadata or defect-only patch

## Changes

- Added a shared WorkflowType 1 graph, envelope, condition, action, and FlowMapping materializer/validator.
- Added complete live resource bundle generation for Workflow, FlowMapping, flowstatus Field, and new-item RemindRule resources.
- Required MCP/API-issued resource and graph identities for the live path.
- Added fail-closed create, update, and replace merge modes with update identity continuity.
- Added Brotli/Base64 DefResource encoding and persisted readback decoding for the representation used by the online component API.
- Added persisted readback validation that resolves and revalidates all four related resources.
- Added direct normalization for decoded details, `{ Data: detail }` API envelopes, and MCP text-content tool-result envelopes.
- Routed full-application Data List Workflow generation through the shared materializer.
- Updated the Data List and Application Generator Skills so live and full-app WorkflowType 1 guidance consistently routes through the packaged implementation instead of ad hoc JSON assembled during an MCP call.

## Validation

- Focused materializer, live bundle, merge, readback, full-app entrypoint, and workflow Set Data List gates: passed on source and distributed Plugin surfaces
- TypeScript build, Plugin manifest, hosted MCP configuration, embedded-credential rejection, Skill reference structure, and repository hygiene: passed
- Standalone resource release gates: passed for 29 focused cases across four resource types
- Packaged JavaScript syntax, JSON parsing, source/dist workflow parity, ZIP integrity, payload parity, forbidden-file, and release safety gates: passed
- RC1 private Marketplace install provenance, installed-cache byte parity, installed tests, fresh-process Skill routing, stateless MCP calls, and OAuth component read: passed
- RC1 final acceptance: failed closed because the Application Generator Skill retained stale WorkflowType 1 blocker text and the readback CLI did not directly normalize the MCP tool-result envelope
- RC2 private Marketplace reinstall and fresh-process smoke: pending

## Proof Boundaries

- Local materialization proves deterministic bundle generation and fail-closed validation only.
- MCP save acceptance proves that the hosted service accepted a component update; it does not by itself prove persistence.
- MCP readback proves that the related resources and decoded definition persisted and still pass the shared validator.
- Designer open/edit, workflow execution, condition evaluation, and email delivery remain separate runtime evidence.
- Tenant identifiers, raw component definitions, credentials, and recipient data are excluded from release evidence.

## Known Limitations

- Some hosted MCP contract metadata describes `DefResource` as a byte array, while the proven online component representation is a Brotli-prefixed Base64 string. The Plugin handles and validates the persisted representation without changing the hosted MCP CRUD service.
- Create/update/replace requires a complete current Data List component readback and externally issued identities; it fails closed if related resources are missing or ambiguous.
- RC and final release status will be recorded only after the documented private Marketplace install smoke completes.

## Release Status

RC1 was installed from its exact Git tag and passed provenance, installed-cache, stateless MCP, and OAuth read-only checks, but it was not promoted because fresh-process inspection exposed stale cross-Skill guidance and an MCP-envelope usability gap. Both issues are corrected for RC2. The local RC gates must pass again, followed by an exact-tag RC2 Marketplace reinstall and fresh-process smoke, before the final stable tag.
