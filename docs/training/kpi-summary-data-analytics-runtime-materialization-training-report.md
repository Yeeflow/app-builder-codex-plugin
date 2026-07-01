# KPI Summary And Data Analytics Runtime Materialization Training Report

## Source Evidence

This training round is based on the Office Asset Loan Management dashboard-only upgrade report:

`asset-loan-operations-dashboard-kpi-chart-runtime-fix-report.md`

The report documents a focused repair of `Asset Loan Operations Dashboard` where several structurally valid package candidates were installed as upgrades, reached Version Management `Succeed`, and still needed delayed browser refresh/runtime materialization before visible KPI values and Data Analytics charts appeared.

The final confirmed working candidate was v1.0.11. The immediate runtime proof was too early and incorrectly treated KPI values as still blank. Follow-up verification on 2026-07-01 showed the KPI Summary values and Data Analytics chart output became visible after product-side asynchronous or cached materialization.

## Training Decisions

1. Dashboard-only upgrades must remain full upgrade packages.

   A dashboard-only change must preserve non-Dashboard resources unchanged. A sparse Dashboard-only package is not a safe upgrade artifact because it can drop Data Lists, Forms, reports, themes, components, or metadata.

2. KPI Summary cards must preserve the confirmed v1.0.11 runtime shape.

   Generated KPI Summary cards must include:

   - per-card hidden Summary host;
   - UUID Summary control IDs;
   - matching layout-resource `ReportIds[]`;
   - matching layout-resource `exts[]`;
   - layout-resource `tempVars[]`;
   - Summary `attrs.save_var` expression object;
   - visible KPI Heading/Text binding through the saved temp variable.

3. Data Analytics controls require both visible binding and runtime model binding.

   Visual chart template provenance is not enough. Generated chart and pivot controls must include visible control metadata plus matching `Resource.exts[]`, `Resource.ReportIds[]`, source list identity, row/value field resolution, and aligned visible chart surfaces such as `attrs.data`, `attrs.model`, `attrs.series`, and `attrs.values`.

4. Runtime materialization proof is asynchronous.

   Dashboard KPI Summary values and chart data can appear only after a refresh/wait window. Runtime proof must record delayed or refreshed evidence before declaring success or failure.

5. Proof layers must stay separate.

   The following are not final Dashboard runtime proof by themselves:

   - package structural validation pass;
   - signing/verifysign pass;
   - upgrade API acceptance;
   - Version Management `Succeed`;
   - chart canvas existence;
   - absence of raw `__temp_*` text.

   Final proof must show visible KPI numbers and visible rendered chart output after the delayed/refresh runtime window.

6. Do not expand before the target page passes.

   A dashboard-only fix must not be expanded to additional Dashboard pages until one target Dashboard page passes the complete chain: package gates, signing/verifysign, Version Management `Succeed`, delayed/refresh runtime proof, and saved screenshot evidence.

## Validator And Evidence-Gate Updates

- `inspect-runtime-evidence.mjs` now supports a stricter Summary/chart runtime materialization proof mode.
- Runtime evidence that declares Summary/chart proof requirements must include delayed refresh evidence.
- KPI proof must include visible numeric KPI values.
- Data Analytics proof must show visible rendered chart output, not only canvas existence.
- `inspect-dashboard-upgrade-runtime-proof.mjs` now rejects dashboard-only fixes expanded to additional pages before target-page runtime proof passes.
- Focused regression coverage verifies:
  - missing delayed refresh window fails;
  - canvas-only chart proof fails;
  - delayed proof with non-numeric KPI text fails;
  - delayed proof with visible KPI numbers and chart output passes;
  - premature dashboard-only expansion fails.

## Proof Boundary

This training updates local standards, validators, and regression tests. It does not perform a new live Yeeflow installation or browser runtime proof. The source report supplies the live Office Asset v1.0.11 evidence, and these plugin changes enforce that future runtime reports preserve the same proof boundary.
