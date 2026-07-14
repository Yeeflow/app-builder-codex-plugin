# Form Action Print and Barcode Canonical Preflight Integration Training Report

## Objective

Close the gap between focused Print/Barcode validation and a real generated-final application that passes the complete first-generation preflight and can proceed to safe runtime proof.

## Six gaps closed

1. Print Dashboards now preserve the canonical `dashboard-page-layouts-v1.1` shell while carrying `dashboard-print-multi-record-table-v1` as dedicated print provenance.
2. Printable table cells now use canonical Text/heading controls and expose Dynamic field bindings on every required runtime surface.
3. The print Collection now has a concrete source and sort, a one-column repeated layout, `table-v2` merge metadata, no-open semantics, and current-item QR binding. Print Collections are validated by their dedicated presentation contract instead of generic grid-table-only rules.
4. A shared helper inserts semantic Print/Barcode trigger controls when planned actions otherwise have no reachable control binding.
5. App Plan `Allow Scan` and print-template selections now survive normalization and appear in decoded generated-final resources.
6. A new regression generates a full package from an App Plan and API-ID manifest, inspects the decoded result, and runs the complete canonical first-generation preflight.

## Root causes

- Field normalization retained standard field properties but dropped `allowScan` before `Rules` were built.
- Fuzzy page-name matching allowed `Inventory` to consume the `Print Inventory` template row.
- The original print builder created a print-specific root instead of composing the print module inside the approved Dashboard page shell.
- Focused validators understood the print shape, while generic Dashboard validators treated the Collection as a standard grid-table and rejected its print-oriented Table internals.
- Planned actions were serialized even when the page had no bound trigger control.
- Existing tests stopped at focused validation and therefore did not expose cross-gate conflicts.

## Regression evidence

- `scripts/test-form-action-print-barcode-gates.mjs` retains the focused positive and negative cases.
- `scripts/test-form-action-print-barcode-canonical-preflight-gates.mjs` verifies plan-to-field scan rules, page-shell and print-template provenance, Table/QR structure, trigger bindings, and complete `yapk-first-generation-preflight.mjs` success.
- Source and dist copies must run the same focused and canonical tests before release or installed-cache runtime testing.

## Proof boundary

Canonical preflight proves package structure and signing eligibility only. Installation acceptance, Version Management completion, Designer rendering, browser print output, camera permission, physical barcode scans, current-item QR navigation, and page-break quality remain separate runtime claims.
