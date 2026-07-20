# Phase 5Z Data List Scalar Resource Identity Dual Distribution Promotion

## Decision

Phase 5Z promotes two contractually paired, immutable public APIs without routing any Legacy production behavior:

- Materializer Core: `projectDataListScalarResourceDefinitionIntent`
- Local Runtime: `lowerDataListScalarResourceIdentityAtHost`

The Materializer Core API returns a frozen scalar pre-ID field-record fragment, one deterministic FieldID request descriptor, and immutable findings. It cannot receive allocation maps, host IDs, lookup resolution, mutable templates, generated resources, or host state.

The Local Runtime API accepts only the immutable Core intent and explicit host allocation maps. It validates lossless string identities, relationships, scopes, collisions, and required lookup-resolution evidence. It returns a fresh frozen Legacy-shaped scalar record fragment and never fabricates an ID or performs lookup resolution.

## Public and Internal Boundaries

Materializer Core public runtime exports include the approved intent projector. Its implementation helpers remain internal. Local Runtime public runtime exports include the approved host lowerer. Its identity validation helpers remain internal.

Neither artifact contains a compatibility adapter, Legacy import, workspace package import, TypeScript-source path, `node_modules` reference, source map, or repository-path reference.

## Evidence

The versioned eleven-case corpus covers five supported scalar parity cases, the barcode validation error, and five deferred field-family exclusions. It passed compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin layout.

The host validation gates cover:

- `DATA_LIST_IDENTITY_ALLOCATION_MISSING`
- `DATA_LIST_IDENTITY_ALLOCATION_INVALID`
- `DATA_LIST_IDENTITY_ALLOCATION_COLLISION`
- `DATA_LIST_IDENTITY_SCOPE_MISMATCH`
- `DATA_LIST_IDENTITY_RELATIONSHIP_BROKEN`
- `DATA_LIST_LOOKUP_TARGET_UNRESOLVED`
- `DATA_LIST_IDENTITY_LOSSY_INPUT`

The official generic distribution gates also verify missing and unexpected exports, contract, checksum, version, path, source/archive/installed mismatch, and leakage failures across all artifacts.

The final artifact SHA-256 values are:

- Planning Core: `de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`
- Materializer Core: `29a14035a67b06a6a59c3384f1c78246976425427a17258226905f5fb718fb4b`
- Local Runtime: `1be4585b0323c1587ed88016c492f683c8e397ebaddc58b57bc77fed540b5432`
- Historical Plugin ZIP: `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`

The migration-owned English-only gate checked 65 P5Z paths and passed. The broader dirty-worktree scan remains intentionally outside this phase because it finds CJK text in the unchanged Legacy materializer and two older Phase 5 audit scripts.

## Result

Phase 5 remains in progress. The next decision is a routing-readiness audit only. Legacy `buildFieldRecord`, both compatibility adapters, and all production scalar resource-definition routing remain unchanged.

Phase 5AA completed that audit and accepted a future Phase 5AB routing proof. Neither adapter nor production route changed as part of the acceptance.
