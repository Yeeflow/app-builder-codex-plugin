# Strict App Plan Conformance Residual Noise Fix Training Report

## Summary

This training update tightens the strict App Plan conformance Markdown parser after the `0.6.75` broad over-parsing fix. Facility Maintenance Request Management revalidation showed residual false positives where table cell values, placeholders, section metadata, status/applicability values, navigation table headers, navigation group labels, and values such as `Group` or `Not applicable` were still treated as planned Yeeflow resources.

The parser now treats only canonical App Plan resource declarations as resources. It preserves strict failures for real missing resources, extra generated resources, navigation group/item mismatches, and partial resource-name mismatches.

## Motivation Evidence

Facility Maintenance revalidation evidence:

- `outputs/20260620-facility-maintenance-request-management-generation-local/validation/revalidation-20260620-strict-app-plan-validator-finding-report.md`
- `outputs/20260620-facility-maintenance-request-management-generation-local/validation/revalidation-20260620-strict-app-plan-validator-finding-report.json`

The evidence classified the remaining strict validator failure as residual parser noise plus real contract findings. The false-positive examples included:

- `Group`
- `Not applicable`
- `Edit Item and View Item forms for all lists`
- `Request and follow-up lifecycle workflows`
- `Operational views`
- `Operations and workload dashboards`
- `Placeholder app groups and permission intent`
- `Role-specific request and follow-up views`

## Parser Changes

Updated `scripts/validate-app-plan-conformance.mjs`:

- Navigation Markdown parsing now reads header-indexed navigation table columns such as `Group` and `Item`.
- Navigation table headers and group labels are no longer backfilled into resource buckets.
- Resource extraction now rejects placeholder/status/applicability values such as `Not applicable`, `Group`, `Visible`, `Yes`, `No`, and related non-resource values.
- Aggregate planning metadata such as custom form summaries, view summaries, dashboard category summaries, lifecycle automation summaries, grouped navigation summaries, and permission-intent summaries are ignored as resource names.
- Plural resource type labels such as `Form reports`, `Dashboard pages`, `Approval forms`, `Data lists`, and `Workflows` map to the correct bucket.
- Comma-separated concrete resource cells are split into individual planned resources, while names containing `and`, such as `Rooms and Areas`, remain intact.

## Regression Coverage

Added `scripts/test-app-plan-conformance-residual-noise-gates.mjs`:

- Pass: Facility-style residual parser noise is ignored.
- Fail: a real missing canonical Data list still fails.
- Fail: a real extra generated Data list still fails.
- Fail: a real partial page-name mismatch still fails.

Updated `scripts/test-app-plan-conformance-guardrails.mjs` so the existing Markdown false-positive fixture uses matching grouped navigation evidence.

Updated `scripts/test-yapk-hard-gate-cache-artifacts.mjs` so the new residual-noise regression test is included in source/dist cache artifact mirror checks.

## Proof Boundary

This training proves App Plan Markdown parsing and conformance classification behavior only. It does not prove package validity, signing, API acceptance, install/import/upgrade success, workflow execution, UI fidelity, or runtime behavior.

## Safety

No plugin version bump, stable movement, tags, GitHub releases, plugin archives, live Yeeflow writes, package signing, install, import, or upgrade are part of this training PR.
