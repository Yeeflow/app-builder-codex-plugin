# Yeeflow App Builder 1.15.3

Patch release based on stable 1.15.2.

## Changes

- Publish-readiness requires Completed for native Complete tasks; approval tasks continue to require Approved and Rejected. Missing outcomes remain errors.
- Approval generation guidance requires explicit business completion criteria, persisted receipt checks before completion, and pending paths for incomplete receipts.
- Cross-field date validation guidance assigns a single error owner and requires correction/clearance checks. Currency guidance requires explicit currency and consistent zero-value formatting.

## Evidence boundary

The validator regression covers positive and negative task-specific outcomes. Prior bounded synthetic runtime acceptance demonstrated receipt waiting and completion, and corrected duplicate date errors. Those application fixes are guidance evidence, not proof of automatic generation or platform engine changes. Currency rendering, idempotent retries, return/revise and multi-account permissions are not certified by this patch. No tenant payloads or upstream product source are included.

## Release gates

Source regression, typecheck, distribution/archive validation and private Marketplace installation must pass before final tag and stable promotion. Installation evidence is recorded separately.
