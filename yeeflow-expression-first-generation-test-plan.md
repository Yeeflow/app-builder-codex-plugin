# Yeeflow Expression First Generation Test Plan

## Purpose

Prove the expression generation standards in a small Yeeflow app after this foundation pass. This plan is intentionally not executed during the expression-reference study.

## Scope

- one app
- one data list
- one approval form
- simple workflow
- ContentList persistence
- no AI
- no external connections
- no document libraries

## Test Scenarios

1. Calculated subtotal: `Quantity * Unit Price`.
2. Dynamic display: show Reason when Amount > 10000.
3. Custom validation: Required Date >= Today.
4. Lookup filter: only products where Active == true.
5. Workflow transition: route to Finance Review when Total Amount >= 5000.
6. Request number generation: `dateFormat(now(), "YYYYMMDD") + UniqueID()`.

Second-pass enrichment keeps this first runtime test focused on proven functions. Do not include screenshot-observed `addWorkDays` or `addWorkHours` until their parameter metadata is export-backed.

Expression-editor UI contexts to prove:

- Calculation control expression field.
- Dynamic display rule on a control.
- Custom validation rule on a field.
- Lookup/data filter condition.
- Workflow transition condition.

## Validation

- `node --check` generator.
- `node scripts/smoke-expression-validation.mjs`.
- `node validate-ywf-def.js <form-def> --mode final`.
- `node validate-yap-package.js <app-def> --mode generator --stage final`.
- `node validate-yap-graph.js <app-def> --mode generator --stage final`.
- `node workflow-action-config-validator.js <workflow-shapes-or-app>`.
- wrapper round-trip validation.

## Runtime Checks

When explicitly requested, import into `https://<yourdomain>.yeeflow.com` and verify:

- app imports and opens
- form opens
- calculated subtotal updates
- dynamic reason field toggles
- validation blocks invalid dates
- lookup filter limits source rows
- conditional workflow route works
- ContentList creates the expected record
