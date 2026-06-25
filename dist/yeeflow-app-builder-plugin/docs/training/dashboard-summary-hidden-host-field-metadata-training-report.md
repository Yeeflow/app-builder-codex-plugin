# Dashboard Summary Hidden Host and Field Metadata Training Report

## Scope

This training closes the Dashboard KPI/Summary gap found during the `0.8.41` Office Asset Loan Management generated-final verification. The previous iteration correctly removed Event Portfolio source-template KPI variables and rebound visible KPI values to page-local temp variables, but the generated package still failed the official Dashboard Summary contract inspector.

## Source Findings

The verification package failed `scripts/inspect-dashboard-summary-control-contract.mjs` with:

- `SUMMARY_HIDDEN_HOST_MISSING`
- `SUMMARY_FIELD_METADATA_MISSING`

The generated Dashboard resources placed Summary controls directly in the content area instead of a dedicated hidden host container. Summary count controls also used `ListDataID` without designer-shaped field metadata, so the validator could not resolve the runtime field contract even though the target list existed.

OAuth was unauthenticated with an `invalid_grant` refresh error during the verification run. This training does not touch OAuth, signing, install/import, Version Management, or browser runtime proof.

## Training Changes

- The full-app materializer now wraps generated Dashboard KPI Summary controls in a dedicated hidden host container.
- The hidden host serializes `attrs.common.hide = [null, true, true, true]`, `attrs.style.direction = [null, "row"]`, and `attrs.display.rule = "1 == 0"`.
- Generated Summary count controls now carry designer-shaped `ListDataID` metadata on `attrs.data.field`, `attrs.data.fieldObject`, `attrs.data.fieldInfo`, `attrs.field`, `attrs.fieldObject`, and `attrs.fieldInfo`.
- Shared Dashboard field-map utilities now recognize `ListDataID` as a generated data-list system field for Summary count contracts.
- First-generation YAPK preflight now includes the Dashboard Summary control contract inspector.
- Full-app materialization regression coverage now requires nontrivial generated packages to pass the Summary hidden-host/field-metadata contract and the full first-generation preflight.

## Expected Behavior

A generated Dashboard is not signing-ready when KPI Summary controls are visible-region children, when the hidden host is missing, or when a `ListDataID` Summary lacks field metadata. Page-local KPI temp vars, `ReportIds`, `Resource.exts`, and Summary `save_var` metadata remain required, but they are not sufficient without the hidden host and field metadata contract.

## Safety Boundary

This training is local plugin behavior only. It does not perform Yeeflow application signing, install/import, upgrade, seed-data writes, Version Management checks, browser runtime proof, plugin archive generation, Git tags, or stable branch movement.
