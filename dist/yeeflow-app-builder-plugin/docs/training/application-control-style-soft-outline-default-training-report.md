# Application Control Style Soft Outline Default Training Report

## Training Scope

This training introduces the **Soft outline controls** Application Custom Control Style as the default control style for generated Yeeflow applications.

Inputs:

- `Soft outline controls.ycs`
- `New Vendor Onboarding - Yeeflow App Plan-v1.3.yapk`

The training intentionally ignores unrelated application content in the reference `.yapk`; only the application control style registration and default binding under `Themes[]` are used.

## Export Findings

The uploaded `.ycs` file contains the authoring control-style configuration. The exported `.yapk` stores the app-level style contract in `decoded.Themes[]`:

- Type `1` theme: `Soft outline controls (Codex)`
- Type `0` theme: `application style`
- Type `0` `Ext` JSON: `{ "controlDefaultId": "<Type 1 style ID>" }`

The reference app proves that Yeeflow package export shape stores the control style `Config` as a stringified JSON object, not as an inline object.

Generated-final package schema requires `AppThemeInfo.Description`, `AppThemeInfo.Config`, and `AppThemeInfo.Ext` to be strings. The generator therefore normalizes nullable exported-reference fields to empty strings while preserving the same Type `1` style theme, Type `0` application style theme, and `Ext.controlDefaultId` default-style linkage.

## Normalization Finding

The `.ycs` source config and the `.yapk` package-materialized config are nearly identical but not byte-identical. The exported package has small Yeeflow materialization differences in a few top-level control-style groups. For generation, the package-materialized config is authoritative because it is the exact shape proven inside an exported `.yapk`.

Tracked hashes:

- Source `.ycs` config SHA-256: `b2b21aa637c6417ccf0966fde467ff7e227bb5559327cc4d47d5eb88ef8ad2c0`
- Package-materialized config SHA-256: `e2e0edac95d43b4a2129a36539dd43b7727acded71be2f6f12cae4f0cf1fd5d0`

## Generator Changes

The full-app materializer now emits two required `Themes[]` records for generated packages:

- the Type `1` Application Custom Control Style theme
- the Type `0` application style theme that sets the Type `1` style as the default

This applies to both schema-smoke generated packages and full resource-graph generated packages.

## Validator Changes

Added `scripts/validate-application-control-style-template.mjs`.

The new validator checks:

- registry/template integrity
- required `Themes[]` presence
- Type `1` control style theme presence
- Type `0` application style theme presence
- default `Ext.controlDefaultId` linkage
- stringified `Config` shape
- exact package-materialized config match
- application style ID pattern `41_<decoded.ListSet.ListID>`

The validator is registered in `yapk-first-generation-preflight` so missing or drifted application control style blocks signing.

## Regression Coverage

Added `scripts/test-application-control-style-template-gates.mjs`.

The regression test covers:

- valid reference registry
- valid generated package theme contract
- missing theme failures
- wrong default-style linkage failures
- object-shaped config rejection
- config drift rejection
- materializer output validation

## Safety Boundary

No live Yeeflow signing, install, import, upgrade, or runtime proof is part of this training. The proof is export-backed and local package-shape validated.
