# Full-App Materializer Fail-Closed Resource Graph Training Report

## Summary

This training addresses the `0.8.31` clean-room generated-final hard stop where the standalone materializer existed but produced a placeholder package for a nontrivial Office Asset Loan Management App Plan.

The materializer must now fail closed when the approved App Plan declares business resources that the standalone CLI cannot fully materialize. It must not emit a placeholder `.yapk`, return `status: pass`, or set `signingEligible: true` for a package that omits planned data lists, approval forms, form reports, custom forms, dashboards, navigation groups, or selected dashboard dataset templates.

## Source Finding

The resumed `0.8.31` validation proved:

- OAuth and workspace discovery passed.
- API-issued ID allocation passed.
- `scripts/materialize-full-app-generated-final.mjs` was callable from the installed cache.
- The materializer returned `status: pass` and `signingEligible: true`.
- The generated package contained only one placeholder `Getting Started Dashboard`.
- Generated-final completeness, dashboard hard gates, ID provenance, default YAPK validation, and application icon validation failed.

## Fix

- Add App Plan resource-demand inspection to `scripts/materialize-full-app-generated-final.mjs`.
- Fail nontrivial App Plans with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED` until full resource-graph generation is implemented.
- Keep fixture/schema-smoke materialization explicitly not signing/install eligible.
- Emit ID provenance metadata using the validator-aligned `api-generated` allocation source for smoke output.
- Use a domain-safe default FontAwesome application icon.
- Update the full-app entrypoint registry and standard so the materializer is treated as a fail-closed handoff, not a placeholder package generator.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now covers:

- missing API-issued ID source fails;
- fixture mode emits package artifacts but is not signing/install eligible;
- API ID manifest smoke output is not signing/install eligible;
- provenance smoke output includes `allocationSource: "api-generated"`;
- nontrivial App Plans fail closed with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`.
- nontrivial App Plans report exact missing resource graph details without over-counting field rows, dashboard section rows, metric rows, filter rows, or other non-resource table rows.

## Follow-up Precision Update

The `0.8.32` clean-room revalidation confirmed that fail-closed behavior worked, but the materializer's resource-demand counts were inflated for rich App Plans. This update tightens the parser and failure report:

- resource headings are authoritative when present;
- canonical table fallback is scoped to resource-name headers only;
- dashboard business-section, filter, metric, and item-template rows are not counted as dashboard pages;
- data-list field rows are not counted as data lists;
- the fail-closed finding includes `plannedResources` and `missingResourceGraph[]`;
- no output directory or placeholder package is emitted for nontrivial App Plans that the standalone materializer cannot fully generate.

## Safety Boundary

This training does not implement full App Plan resource generation. It prevents false readiness and unsafe signing eligibility. Real full-generation success still requires materializing all planned resources and passing generated-final preflight before signing.
