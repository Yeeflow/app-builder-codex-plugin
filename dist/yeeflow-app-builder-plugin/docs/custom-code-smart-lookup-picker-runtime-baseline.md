# Smart Lookup Picker Runtime Baseline

Runtime date: 2026-05-18

Runtime app: `Custom Code Smart Lookup Picker Test`

Generated package: `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/custom-code-smart-lookup-picker-test.v1.yap`

Sandbox: `https://<yourdomain>.yeeflow.com/`

## Validation Summary

Local validation passed before runtime import:

| Check | Result |
|---|---|
| TSX static check | Passed with `esbuild` against `smart-lookup-picker.tsx` |
| Generator syntax | Passed with `node --check generate-custom-code-smart-lookup-picker-test.mjs` |
| Package validation | Passed with warnings |
| Graph validation | Passed |
| YWF validation | Passed with warnings |
| YDL validation | Passed with warnings |
| Custom-code control inspection | Passed with no warnings |
| Wrapper round trip | Passed |

The warnings are schema/profile warnings from the local validators, not observed runtime blockers in this test.

## Runtime Results

| Context | Result | Evidence |
|---|---|---|
| Dashboard | Passed | Opened `Smart Lookup Dashboard`; picker rendered; searching `Acme` returned `Acme Clinical Partner`; selection updated dashboard output text from empty arrays to combined JSON, selected ID array, and manual array. |
| Approval form | Passed | Opened `Smart Lookup Approval Test`; picker rendered; searching `Beacon` returned `Beacon Research Vendor`; selection updated `Picker Combined JSON`, `Picker Selected Values`, and `Picker Manual Values`; submitted successfully as `SLPTEST2026051700001`; request detail persisted selected values. |
| Data-list custom form | Passed | Opened `Smart Lookup Test Records`; New item custom form rendered; searching `Acme` returned `Acme Clinical Partner`; selection updated list-bound outputs; saving created `List picker runtime Acme` with persisted combined JSON visible in the grid. |
| Public form | Not tested | No public form was included in the focused package. Do not claim public-form support from this baseline. |

## Runtime Pattern Confirmed

The focused app confirms these export-backed control patterns work at runtime:

| Context | Script storage | Parameter storage | Output prefix |
|---|---|---|---|
| Dashboard | `attrs["codein-script"]` | `attrs["codein-script-param"]` | `__temp_` |
| Approval form | `attrs["codein-script"]` | `attrs["codein-script-param"]` | `__variables_` |
| Data-list custom form | `attrs["codein-script"]` | `attrs["codein-script-param"]` | `__list_` |

## Boundaries

- This proves the positive baseline for the generated test package, not every possible Smart Lookup Picker configuration.
- Manual entry, negative missing-configuration behavior, no-result behavior, and public-form behavior were not executed in this runtime pass.
- Public-form support remains unclaimed until a public form is generated or exported and tested directly.
