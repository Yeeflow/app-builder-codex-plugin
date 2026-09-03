# Yeeflow App Builder Plugin v1.13.0

Previous version: `1.12.10`

Changed bundled skill: `yeeflow-custom-code-generator`

## Attachment Upload and AI Recognition

- Add a Golden Reference for Yeeflow Attachment metadata and direct SDK upload/content retrieval.
- Add an SCSK-style attachment uploader pattern with explicit upload state, validation, metadata normalization, removal, and retry behavior.
- Add a quotation AI-recognition pattern for Approval Form Action orchestration and writable variable targets.
- Add focused compilation and mutation-based regression gates for both source and distributed plugin assets.
- Restore the two source fixtures already required by the deterministic release rebuild so a clean tag checkout can regenerate the distribution.

## Validation

- Attachment pattern structure, TypeScript compilation, and negative mutation gates: passed for source and distribution.
- Full repository, archive, safety, and private Marketplace installation checks: pending until the release build completes.

## Install Smoke

Pending private Marketplace installation from the exact release-branch commit. The final tag will be created only after this passes.

## Proof Boundary

This release validates the documented patterns, compile-time contracts, negative mutations, and source/distribution parity. It does not claim tenant-specific upload, AI service, Designer, persisted-definition, submission, workflow, or browser-runtime proof beyond the previously recorded read-only component evidence.
