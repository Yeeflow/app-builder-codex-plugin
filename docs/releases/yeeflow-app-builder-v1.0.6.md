# Yeeflow App Builder v1.0.6

## Summary

This narrow patch adds an official reusable YAPK signing operation so valid Yeeflow `setsign` and `verifysign` response shapes no longer require task-local parsing.

## Scope

- Add `scripts/yeeflow-yapk-sign.mjs` and its reusable signing library.
- Accept JSON-object, top-level JSON-string, and plain unquoted base64 `setsign` responses only when they contain an exact 32-byte base64 signature.
- Accept successful empty-body `verifysign` responses as HTTP acceptance proof.
- Preserve the unsigned package and unchanged `Resource`; write a separate signed output only after verification succeeds.
- Limit diagnostics to HTTP status, content type, raw length, response classification, signature-byte count, and sanitized API error category.
- Update API, package, YAPK, and application skills to require the official entrypoint instead of task-local signing code.

## Validation

- Supported response shapes and empty verification bodies pass.
- Invalid signatures, non-success `setsign`, and non-success `verifysign` fail closed without writing output.
- Redaction tests prove tokens, tenant identifiers, raw signatures, raw responses, `Resource`, and decoded content do not enter diagnostics.
- Source, official dist, archive, and simulated-installed surfaces have parity.
- Existing typecheck, workspace/package/dependency boundaries, Core distribution, OAuth parity, English-only, archive hygiene, release safety, and Git diff gates pass.

## Proof Boundary

This release does not modify Core contracts, materializer behavior, planning, OAuth protocol, API ID allocation, workflow generation, Plugin Test2 artifacts, active Plugin cache, tenant/workspace resources, protected duplicates, or historical rollback archives. Signing and verification prove wrapper/resource integrity only; they do not prove installation or runtime behavior.
