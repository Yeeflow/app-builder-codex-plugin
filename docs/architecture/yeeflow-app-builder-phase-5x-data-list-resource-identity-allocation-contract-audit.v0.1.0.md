# Phase 5X Data List Resource Identity and Allocation Contract Audit

## Decision

`DATA_LIST_RESOURCE_IDENTITY_CONTRACT_VALID`

All API-issued and large numeric identities are lossless strings. Core may create deterministic identity requests and immutable resource-definition intent only. It cannot allocate, coerce, round, truncate, fabricate, or resolve identities.

## Host Boundary

The host validates readonly allocation and lookup maps, rejects missing, invalid, colliding, wrong-scope, broken-relationship, unresolved-lookup, and lossy identities, then lowers immutable fragments into mutable generated records.

## Next Shadow

Phase 5Y may shadow only a scalar Data List resource-definition intent before `buildFieldRecord` lowering. It excludes allocation, lookup and sublist lowering, template mutation, package writing, and cross-resource resource mutation.

# Phase 5AA Follow-Up

The Phase 5AA TypeScript AST audit accepted only the scalar record routing-readiness boundary. It confirms that the host already supplies lossless ListID and FieldID strings to the single `buildFieldRecord` call site. Any future route remains subject to its own source, archive, installed, identity-error, and rollback proof.
