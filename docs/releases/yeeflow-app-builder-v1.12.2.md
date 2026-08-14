# Yeeflow App Builder v1.12.2

## Version decision

- Previous stable version: `1.12.1`
- New version: `1.12.2` (patch)
- Scope: Workbench Dashboard Header generation and validation hardening; no new resource type or user-facing capability.

## Included changes

- Require Workbench `page_title_content` to retain the export-proven inline-width shape.
- Require every configured Workbench Header action to remain in a direct `Operations` slot and preserve a `btn_operation_primary` or `btn_operation_normal` module.
- Add positive and negative regression cases for the previously observed malformed Header/action placement.
- Restore the source/distribution mirror for the Workflow hard-gate regression test so complete release validation is reproducible.

## Verification boundary

- Local regression, source/distribution parity, archive validation, and plugin validation are release checks.
- Marketplace install/discovery smoke is recorded separately from Dashboard Designer-open and browser action runtime evidence.
