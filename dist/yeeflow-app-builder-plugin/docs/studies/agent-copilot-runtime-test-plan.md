# Agent/Copilot Runtime Test Plan

Source export: `<downloads>/DEMO Innovation Ecosystem Platform.yap`

Current milestone: learning-only. No generated baseline package was created because app-owned AI Agent/Copilot/Connection import behavior is not runtime-proven and several tools depend on live external connections.

Materialization note: the existing materialization inspector is tuned for packaged approval forms with `Data.Forms[].ListID = 0`. This export contains list/process workflows bound to data lists, so the materialization command reports `FORM_LIST_ID_NOT_ZERO` and missing Type 105 form navigation. Treat that as validator-scope mismatch for this study, not evidence that the source export failed to decode.

## Local Gates

Before any runtime import:

1. Decode/read the export with large numeric IDs preserved as strings.
2. Generate sanitized normalized references.
3. Run package validation in compatibility mode.
4. Run AI resource reference validation.
5. Run connection redaction/safety scan.
6. Confirm no raw `.yap`, decoded payload, credential, token, or connection secret is staged.
7. Decide whether all tool references resolve locally.

## Runtime-Safe Checks

Safe checks after a future generated package passes local validation:

- package imports
- app opens
- AI Agent resources appear
- Copilot resources appear
- Agent/Copilot configuration pages open
- local list-backed tools appear configured
- connected-Agent bindings are visible but not executed
- no Outlook, SharePoint, OAuth, or HTTP calls are triggered

## Blocked Checks

Blocked without explicit safe test credentials:

- Outlook mail/calendar calls
- SharePoint list or document operations
- OAuth authorization flows
- HTTP API calls
- deletion/update/create tools against production-like data
- broad current-application resource access execution

## Result Classification

Use these labels:

| Label | Meaning |
| --- | --- |
| validation-only | Local decode/inspect/validation passed; no Yeeflow runtime import. |
| partial | Import/open works, but some AI or external connection checks are skipped. |
| runtime-proven | Import/open/resource/tool checks pass in a safe sandbox without private data leakage. |
| blocked | Import or test would require secrets, ambiguous mappings, or live external calls. |

This branch is `validation-only`.
