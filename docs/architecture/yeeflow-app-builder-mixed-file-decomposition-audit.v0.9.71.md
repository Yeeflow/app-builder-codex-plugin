# Mixed File Decomposition Audit v0.9.71

## Totals

- Audited files: 535
- Classification counts: {"compatibility-shim":4,"core":182,"mixed":349}
- Mixed files: 349
- Files with detected side effects: 337
- Side-effect counts: {"module-loading":42,"network":15,"filesystem-or-process":302}
- Proposed package counts: {"@yeeflow/codex-plugin-adapter":4,"@yeeflow/app-builder-core-templates":93,"@yeeflow/app-builder-core":350,"@yeeflow/app-builder-core-builder":3,"@yeeflow/app-builder-core-canonical-model":7,"@yeeflow/app-builder-core-contracts":7,"@yeeflow/app-builder-core-identity":3,"@yeeflow/app-builder-core-materializer":36,"@yeeflow/app-builder-core-package-engine":4,"@yeeflow/app-builder-core-planning":9,"@yeeflow/app-builder-core-repair-engine":3,"@yeeflow/app-builder-core-runtime-client":3,"@yeeflow/app-builder-core-runtime-verification":3,"@yeeflow/app-builder-core-schemas":3,"@yeeflow/app-builder-core-test-fixtures":3,"@yeeflow/app-builder-core-validators":4}
- Migration batches: {"compatibility-closure":4,"core-foundations":182,"mixed-file-decomposition":337,"deferred-materializer":11,"batch-first-planning-vertical-slice":1}
- Unresolved findings: 11

## Highest-Risk Files

- scripts/generate-package-api-smoke-test-yapk.mjs
- scripts/materialize-full-app-generated-final.mjs
- scripts/materialize-yapk-focused-upgrade-scope.mjs
- scripts/validate-generated-final-resource-completeness.mjs
- tools/generators/generate-sub-list-dynamic-purchase-request-yapk.mjs
- tools/generators/generate-sub-list-dynamic-row-menu-actions-yapk.mjs
- tools/generators/generate-vendor-onboarding-compliance-yapk.mjs
- tools/generators/generate-vendor-onboarding-install-compatible-yapk.mjs
- tools/generators/generate-vendor-onboarding-v41-dashboard-control-diagnostics-yapk.mjs
- tools/generators/generate-vendor-onboarding-v43-combined-dashboard-yapk.mjs

## Recommended First Vertical Slice

- Source: `scripts/lib/markdown-planning-utils.mjs`
- Rationale: deterministic Markdown planning parsing, stable exported functions, existing Generation Readiness consumers, no host side effects, and no materializer dependency.

## Unresolved Findings

- Materializer records remain explicitly deferred until Phase 4.
