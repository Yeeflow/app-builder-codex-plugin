# Yeeflow App Builder 1.15.2

Patch release on stable 1.15.1. The product baseline remains pinned at commit `41bdac08a55204bb033acea54cf3af8d7ca2f740`.

## Fixes

Approval generation preserves structured JSON sublist field definitions and explicit Required metadata. Implicit current-row expressions bind to their owning final Loop ID, including nested function arguments. Loop children use native global canvas coordinates. Validation requires LoopBody entry connections to target children within that body and retain reciprocal references.

Generated layout checks remain strict. The explicit `--input-origin designer-readback` mode downgrades only content-span differences to warnings; invalid geometry and origin values still fail. List-valued workflow variables are accepted for list functions such as arrayCount, while unsupported types remain rejected. The Set Variable integration fixture now declares mandatory approval layouts.

## Verification boundary

Prior bounded live tests on a dedicated synthetic application verified UI and server rejection of empty detail lists, one/three-row loop writes, server-calculated totals before approval, and matching ledger totals/counts after approval. Those workflows used focused native definitions; this is not proof of full automatic procurement application generation.

Discount and tax, real project/supplier and platform-instance linkage, idempotent failure retries, partial/full receipt, and multi-account permissions are not certified by this release. Test master-data creation alone is not business association proof. No raw product source, tenant payloads or private acceptance evidence is included.

## Release validation

Direct stable release without an RC tag. Package checks and private Marketplace installation must pass before final promotion; the installation result is recorded separately from tenant-runtime evidence.
