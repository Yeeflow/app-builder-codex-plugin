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
- RC2 private Marketplace reinstall, exact-tag checkout, installed-cache byte parity, installed workflow tests, fresh-process Skill routing, stateless MCP, and OAuth discovery: passed

## Private Marketplace Install Smoke

- Accepted RC tag: `yeeflow-app-builder-plugin-v1.4.0-rc2`
- RC commit: `42bef6f21cc981ad60f04801dbbf742b50a703fe`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Marketplace name: `yeeflow`
- Plugin name: `yeeflow-app-builder`
- Install result: version `1.4.0` installed and enabled in the versioned Plugin cache
- Provenance result: Marketplace checkout matched the peeled RC2 commit and the installed cache was byte-identical to the Marketplace Plugin payload
- Installed tests: WorkflowType 1 materializer, live bundle, and live merge/readback suites passed
- Fresh-process task: `019fd5d1-0030-7f21-a558-c9633bfe8e33`
- Fresh-process Skill result: version and both Data List/Application Generator WorkflowType 1 statements passed; the stale blocker was absent
- Stateless MCP result: GUID generation and all 11 supported App Builder component types passed
- OAuth read-only result: the selected workspace, target application, and target Data List were uniquely discovered without reading the full component payload
- Git behavior: background Marketplace auto-upgrade logged a 30-second checkout timeout, but the explicit exact-tag installation had already completed; commit and byte-parity checks proved that no stale-version or payload-drift condition remained
- UI/icon behavior: not separately evaluated because this release changes workflow generation and validation rather than Plugin artwork

An authorized live workflow create/save/readback earlier in the same development session proved persistence of the related Workflow, FlowMapping, flowstatus Field, RemindRule, condition, and MailTask definition. It was not rerun after the RC2 reinstall and is not presented as fresh-process execution or email-delivery proof.

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

RC1 was installed from its exact Git tag and passed provenance, installed-cache, stateless MCP, and OAuth read-only checks, but it was not promoted because fresh-process inspection exposed stale cross-Skill guidance and an MCP-envelope usability gap. Both issues were corrected in RC2. RC2 then passed the full local gates, exact-tag Marketplace reinstall, installed-cache byte parity, installed workflow tests, fresh-process Skill checks, stateless MCP calls, and narrow OAuth read-only discovery. The release is eligible for the final `yeeflow-app-builder-plugin-v1.4.0` annotated tag. This acceptance does not prove Designer behavior, workflow execution, condition firing, or email delivery.
