# Yeeflow App Builder v1.5.1

## Summary

Yeeflow App Builder v1.5.1 makes MCP incremental construction the default for a normal request to build a live application from business requirements. The user does not need to explicitly request the MCP mode.

The build still starts with a reviewed Functional Specification and Yeeflow App Plan. It then uses live MCP contract discovery, an explicit workspace/application target, user-confirmed dependency-ordered write batches, Application bootstrap, persisted readback, and the non-secret build ledger before creating dependent resources.

## Delivery Selection

- **Default:** confirmation-gated MCP incremental construction for a live application.
- **Explicit package path:** YAPK/YAP package delivery, import/install, existing-app upgrade, migration, export, offline handoff, or a documented fallback/debug request.
- **Planning-only request:** creates no MCP writes.

Package-specific validation, signing, and install/upgrade confirmations remain unchanged. This release changes the default route; it does not claim tenant creation, persistence, Designer behavior, or runtime proof.

## Coverage and Safety

The default incremental path covers Application, all 11 supported MCP component types, all seven shared-resource types, Portal, Navigation, and Permissions. Credential, Connection, permission broadening, group membership, Portal publication, and deletes retain their elevated or exact-target confirmation requirements.

The hosted MCP remains contract-authoritative. The Plugin never guesses server operation names or payload fields and never embeds OAuth credentials or tenant data.

## Validation

- Application Builder source/distribution parity.
- A machine-checkable `DEFAULT_DELIVERY_MODE: MCP_INCREMENTAL` contract and regression against the former YAPK-first wording.
- Existing MCP capability registry, build ledger, operation planner, package safety, and source/distribution gates.

## Private Marketplace Install Smoke

- Accepted RC tag: `yeeflow-app-builder-plugin-v1.5.1-rc1`
- RC commit: `b2d3b664781171a86e6a817e34441d74587300a5`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Install result: version `1.5.1` installed and enabled in an isolated temporary Codex home.
- Provenance result: the Marketplace checkout matched the RC commit and the installed versioned cache was byte-identical to the RC Plugin payload.
- Installed tests: plugin MCP integration (including the Application Builder default-delivery policy), capability registry, bootstrap ledger, and operation planner passed from the installed cache.
- Tenant behavior: no authenticated tenant read or write was performed by this smoke.

## Release Status

RC1 passed the full local release gates and the isolated exact-tag Marketplace installation, cache parity, and installed-cache tests. It is accepted for the final `yeeflow-app-builder-plugin-v1.5.1` tag and stable promotion. This acceptance proves packaging and the tested static MCP default-delivery contract, not application creation, resource persistence, Designer behavior, permissions enforcement, Portal publication, or runtime behavior in a tenant.
