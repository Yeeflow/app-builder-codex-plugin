# YAPK Export-Shape Runtime Materialization Gates Training Report

Branch: `codex/yapk-export-shape-runtime-materialization-gates`

Baseline: current stable `yeeflow-app-builder@yeeflow 0.8.2`

Release target after merge: to be decided separately

## Scope

This focused training cycle adds generated-final YAPK legality and runtime-materialization gates based on:

- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260621-223735-clean-id-reinstall/validation/office-asset-generation-failure-to-resolution-analysis.md`

The changes are package-generation and generated-final validation rules only. They are not Functional Specification requirements and are not App Plan requirements for business users. This training branch does not bump the plugin version.

## Gates Added

- Generated approval form `DefResource` must use canonical base64 `::brotli::` plus Brotli-compressed JSON encoding.
- Approval `DefResource` must include export-style process metadata, request/task page registrations, embedded `formdef.children`, unique designer control IDs, workflow graph IDs, incoming/outgoing links, task URLs, graph positions, variables, and key/defkey consistency.
- Minimal placeholder approval definitions fail, and packages cannot pass by deleting planned approval forms.
- `FormNewReports` and `DataReports` fail when emitted as count-only placeholders.
- Dashboard pages must include visible business controls bound to included resources; hidden Summary hosts, navigator labels, shells, or synthetic-only controls are not visible content proof.
- Summary/chart controls fail unless the full runtime-proven model contract is present; visual-safe filters/tables/Collections can pass when unsafe Summary/chart controls are omitted.
- `PortalInfo:null` is accepted for no-portal YAPK packages, while `{}` and `[]` remain invalid.
- `attrs.nav_label` / `attrs.nv_label` no longer satisfy generic rendered Text-control validation.
- Native Title fields must preserve `Status: 0`, `IsSystem: true`, and `IsIndex: true`.
- Wrapper `TenantID` is treated as tenant metadata, not a generated content ID allocation.
- Install API reported ListSetID/runtime URL mismatch is reported separately from decoded package root canonical URL proof.

## Report Findings Covered

- Approval designer/runtime failure from minimal `DefResource`: covered by `validate-generated-yapk-export-shape.mjs`.
- Missing graph `positions`: covered by `APPROVAL_WORKFLOW_GRAPH_POSITION_MISSING`.
- Summary/chart runtime model load failure: covered by `DASHBOARD_SUMMARY_RUNTIME_MODEL_INCOMPLETE` and `DASHBOARD_CHART_RUNTIME_MODEL_INCOMPLETE`.
- Dashboard shell/synthetic placeholder risk: covered by visible resource-bound dashboard content checks.
- Skeletal `FormNewReports` / `DataReports`: covered by report placeholder and settings/fields checks.
- `PortalInfo:null` schema inconsistency: covered by canonical schema and regression tests.
- `nav_label` / `nv_label` false text proof: covered by validator changes and focused regression tests.
- Native `Title` metadata drift: covered by data-list system schema and export-shape checks.
- TenantID provenance boundary: covered by ID provenance validator and regression tests.
- API-reported URL versus decoded root ListSetID mismatch: covered by dashboard report identity validation.

## Finding Classification

Newly introduced or exposed by recent `0.8.x` generated-final training:

- Generated-final resource completeness allowed packages to progress to stricter conformance while some generated resources were still structurally approximate.
- Dashboard generation hard gates could pass present controls without proving runtime-safe Summary/chart materialization.
- Canonical runtime reporting needed the stricter decoded-root ListSetID versus install-response identity split.

Pre-existing generator/export-shape gaps:

- Minimal approval `DefResource` generation was not export-shaped enough for approval designer/runtime.
- Report resources could be emitted as count-only placeholders.
- Native Title metadata and tenant metadata boundaries were not fully aligned with export behavior.
- `PortalInfo:null` support existed in some validators but not the canonical schema path.
- Navigation labels were sometimes treated as rendered control proof.

## Validator Updates

- Added `scripts/validate-generated-yapk-export-shape.mjs`.
- Added `scripts/test-generated-yapk-export-shape-materialization-gates.mjs`.
- Registered the new export-shape gate in `scripts/yapk-first-generation-preflight.mjs`.
- Updated `scripts/validate-dashboard-generation-hard-gates.mjs` for install API ListSetID mismatch reporting.
- Updated `scripts/validate-yapk-id-provenance.mjs` to exclude wrapper `TenantID` from generated content ID allocation requirements while still reporting tenant metadata.
- Updated `scripts/validate-data-list-system-schema.mjs` for native Title `Status` and `IsIndex`.
- Updated `validate-yapk-package.js` so `nav_label` / `nv_label` metadata does not drive generic control-name or rendered Text-control validation.

## Documentation Updates

- Updated YAPK generation guardrails.
- Updated export-shaped application generation standard.
- Updated application-builder skill and lifecycle guidance.
- Updated package-validator skill guidance.
- Mirrored source changes into the packaged `dist/yeeflow-app-builder-plugin` tree.

## Safety

- No version bump in this training branch.
- No stable movement.
- No tags/releases/plugin archives.
- No live Yeeflow writes.
- No package signing, install, import, or upgrade.
- Dashboard and export-shape materialization requirements remain generator/package validation rules and are not added to Functional Specification or App Plan content requirements.
