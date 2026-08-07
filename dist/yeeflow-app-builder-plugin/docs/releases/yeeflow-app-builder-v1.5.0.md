# Yeeflow App Builder v1.5.0

## Summary

Yeeflow App Builder v1.5.0 adds a contract-driven incremental build mode for the hosted Yeeflow App Builder MCP. It lets a Codex task create or select an application and then add, change, inspect, or safely remove resources in dependency order without first assembling a complete YAPK package.

## Coverage

The incremental capability registry covers 22 application-scoped targets:

- Application.
- Component types: ApprovalForm, ScheduleForm, Dashboard, DataList, Document, DataReport, FormNewReport, Knowledge, AIAgent, Copilot, and CustomService.
- Shared-resource types: Theme, Component, Group, Credential, Tag, Metadata, and Connection.
- Portal, Navigation, and Permissions.

The hosted MCP remains contract-authoritative. The Plugin records semantic operations and requires a runtime contract discovery step; it does not embed or guess server tool names, payload fields, credentials, or tenant data.

## Lifecycle and Safety

Every planned write follows this sequence: contract discovery, current-state read, MCP-issued identity allocation, materialization, local validation, explicit confirmation, save, exact readback, persisted validation, and ledger update. For a new Application, the ledger starts in `bootstrap` status with only the planned Application create operation; the MCP-returned application ID is recorded only after exact readback. The ledger is non-secret and records only redacted application references, plan revision/hash, dependencies, MCP-issued IDs/GUIDs, and proof status.

Deletes require an exact-target confirmation receipt. Credential and Connection operations, permission broadening, and Portal publication require elevated confirmation. A successful save is API acceptance only; persisted readback, Designer editability, and runtime behavior remain separate proof levels.

## Compatibility

The existing specialized live paths remain in force:

- Document Libraries use the v1.4.1 two-phase baseline/customization/readback path.
- Data List Workflow Type 1 uses the v1.4.0 materialize/merge/readback path.

Other component and shared-resource types use the generic fail-closed lifecycle and their existing type-specific generation/validation Skills where available. The Plugin does not claim a dedicated local materializer where none exists.

## Validation

- Capability registry coverage and dependency invariants.
- Incremental ledger coverage of all 22 target categories, ID/GUID provenance, safe state transitions, dependency closure, secret rejection, and delete receipts.
- Operation planner tests for no-network planning, blocked/already-verified/dependency failures, and elevated confirmation gates.
- Source/distribution parity and Plugin MCP integration checks.

## Proof Boundaries

These gates prove local contract/lifecycle correctness. They do not by themselves create resources in a tenant, prove MCP write acceptance, demonstrate persisted tenant state, prove Designer editability, or prove runtime behavior. An authorized isolated-workspace smoke is required before final promotion.
