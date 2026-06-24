# Full-App Materializer Minimal Resource Graph Training Report

## Summary

This training follows the `0.8.34` clean-room revalidation of the Office Asset Loan Management App Plan. The plugin correctly parsed the planned resource demand and kept the signing/install boundary closed, but the standalone materializer still stopped with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED` for a nontrivial App Plan.

The materializer now supports a minimal generated-final resource graph for first-generation App Plans that declare the supported resource categories:

- data lists and document libraries as `Childs[]`;
- approval forms as `Forms[]`;
- form reports as `FormNewReports[]`;
- custom data list forms as generated list layouts;
- dashboards as Type `103` pages with non-empty materialized content;
- application navigation groups as grouped `ListSet.LayoutView` metadata.

The generated package remains `signingEligible: false`. Signing, install/import, upgrade, seed-data writes, Version Management proof, and browser/runtime proof are still separate gated stages.

## Source Finding

The `0.8.34` revalidation showed:

- active plugin and cache were `0.8.34`;
- OAuth and workspace discovery passed;
- API-issued ID allocation passed;
- full-app entrypoint inspection passed;
- generated-final resource-completeness self-tests passed;
- the real App Plan still stopped at `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`;
- no package was emitted, so signing/install/runtime proof correctly did not run.

That was safe, but it meant the standalone clean-room generation path could not continue from planning into generated-final package validation.

## Changes

- Updated `scripts/materialize-full-app-generated-final.mjs`.
- Nontrivial App Plans now use `minimal-resource-graph` mode instead of the previous unconditional fail-closed path.
- Added schema-shaped output for:
  - canonical wrapper metadata;
  - `ListSet` and grouped navigation;
  - list packages with native Title fields, layouts, reminders, public forms, and flow mappings;
  - approval process forms with required process-form metadata and Brotli `DefResource`;
  - form reports with required `ProcNewReportInfo` fields;
  - dashboard pages with non-empty `Main > Content`, Summary, filter, Collection, and dynamic field controls.
- Preserved the proof boundary:
  - `Sign` remains blank;
  - `signingEligible` remains `false`;
  - generation reports require generated-final preflight before signing.
- Updated the full-app generation entrypoint standard and registry to describe the new minimal resource-graph behavior.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now verifies that a rich Office Asset style App Plan:

- materializes a generated-final package instead of emitting a placeholder or fail-closed report;
- includes four planned data lists;
- includes two planned approval forms;
- includes one planned FormNewReport;
- includes two planned dashboard pages;
- includes custom form layout names;
- preserves planned navigation groups and their target items;
- passes canonical schema validation;
- passes generated-final App Plan resource-completeness validation;
- remains `signingEligible: false`.

Existing generated-final resource-completeness tests continue to prove that missing planned forms, reports, dashboards, and navigation groups fail.

## Safety Boundary

This training does not claim runtime readiness. The standalone materializer now creates a minimal generated-final resource graph for supported first-generation resource categories, but it does not perform signing, install/import, upgrade, Version Management checks, seed-data writes, or browser/runtime proof. Any run must still stop before signing unless generated-final preflight and all required hard gates pass.
