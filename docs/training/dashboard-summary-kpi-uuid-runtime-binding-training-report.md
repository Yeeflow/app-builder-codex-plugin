# Dashboard Summary/KPI UUID Runtime Binding Training Report

## Source

Training input:

- `/Users/rengerhu/Documents/Plugin Test2/hospital-doctor-info-management-20260704-212357-plugin-0.9.2-lookup-e2e/validation/dashboard-summary-kpi-runtime-binding-issue-analysis-report.md`

The report proved that a generated Dashboard can contain visible KPI cards, hidden Summary controls, `Resource.ReportIds[]`, `Resource.exts[]`, `Resource.tempVars[]`, and matching visible bindings, yet still fail runtime KPI writeback when Summary control IDs are semantic/layout-derived instead of UUID-shaped.

## Failure Pattern

Affected page:

- `Doctor Operations Dashboard`

Broken generated Summary IDs:

- `2073398669033300040_summary`
- `2073398669033300040_summary_pending_reviews`
- `2073398669033300040_summary_expiring_credentials`
- `2073398669033300040_summary_confirmed_shifts_this_week`

These IDs were marked with `runtimeModelProven: true`, but runtime did not reliably write the calculated values into dashboard temp variables. The package validator previously accepted this shape because it treated matching `ReportIds`, `exts`, and `tempVars` as an export-proven alternative ID shape. That fallback is no longer valid for generated Summary controls.

## Correct Shape

Generated Summary/KPI controls must follow the proven UUID runtime binding shape:

1. Every Summary control ID is a UUID.
2. Every Summary UUID appears in layout-resource `Resource.ReportIds[]`.
3. Every matching `Resource.exts[]` entry sets both `i` and `id` to the same Summary UUID.
4. `Resource.exts[].category = "___Pivot___"` and `Resource.exts[].key = "summary"`.
5. `Resource.exts[].attr` includes `AppID`, `ListSetID`, `ListID`, `list`, `source`, and export-shaped `settings.values[]` metadata.
6. Summary `attrs.save_var` is a designer-shaped expression object.
7. Layout-resource `Resource.tempVars[]` declares the same temp variable.
8. Visible KPI Heading/Text controls bind through `attrs.headc.title.variable[]` to the saved temp variable.
9. `runtimeModelProven: true` is allowed only when the UUID Summary shape and runtime metadata are present.

## Hard-Gate Rules

- Semantic/layout-derived Summary IDs such as `<LayoutID>_summary` are signing-readiness failures.
- `runtimeModelProven: true` must not bypass UUID and runtime metadata requirements.
- A Summary `Resource.exts[]` entry is incomplete if it lacks `id`, current app/list source metadata, or export-shaped `settings.values[]`.
- Data Analytics identity validation must treat Summary as UUID-only. Non-Summary analytics may still accept future export-proven non-UUID shapes for that exact control type, but Summary cannot.
- Dashboard control UUID re-instantiation must not split Summary runtime registration identity. After cloning/re-instantiating template UUIDs, Summary `Resource.exts[].id` and `Resource.exts[].ID` must be normalized back to `Resource.exts[].i`.

## Regression Evidence

The old generated-final package must fail:

```sh
node scripts/inspect-dashboard-summary-control-contract.mjs \
  --package "/Users/rengerhu/Documents/Plugin Test2/hospital-doctor-info-management-20260704-212357-plugin-0.9.2-lookup-e2e/dist/hospital-doctor-information-management-092-lookup-e2e-20260704-212357.generated-final.yapk"
```

Expected failures include:

- `SUMMARY_CONTROL_ID_NOT_RUNTIME_SAFE`
- `SUMMARY_RUNTIME_MODEL_PROVEN_UNSUPPORTED_SHAPE`
- `SUMMARY_EXTS_SOURCE_METADATA_INCOMPLETE`

The focused fixed package must pass:

```sh
node scripts/inspect-dashboard-summary-control-contract.mjs \
  --package "/Users/rengerhu/Documents/Plugin Test2/hospital-doctor-info-management-20260704-212357-plugin-0.9.2-lookup-e2e/dist/dashboard-summary-kpi-fix/hospital-doctor-information-management-092-lookup-e2e-20260704-212357.dashboard-summary-kpi-fix.decoded-resource.json"
```

Synthetic regression coverage lives in:

```sh
node scripts/test-ui-summary-kpi-runtime-hard-gates.mjs
```

The full-app materializer regeneration check must also pass:

```sh
node scripts/materialize-full-app-generated-final.mjs \
  --functional-spec "<run>/functional-specification.md" \
  --app-plan "<run>/yeeflow-app-plan.md" \
  --out-dir "<run>/validation/summary-kpi-uuid-regeneration" \
  --allow-fixture-api-ids-for-tests \
  --tenant-id 41 \
  --json

node scripts/inspect-dashboard-summary-control-contract.mjs \
  --package "<run>/validation/summary-kpi-uuid-regeneration/<generated-final>.yapk"
```

## Generator Requirement

The full-app materializer must generate UUID Summary IDs for every planned KPI metric and must emit complete Summary runtime `exts` metadata. Do not derive Summary IDs from page `LayoutID`, metric slug, source golden-reference slot names, or other semantic strings.

When the dashboard page template is cloned and UUIDs are re-instantiated, Summary runtime `exts[]` entries are not ordinary visual controls. Their identity must remain tied to the Summary control UUID through `i`, `id`, and `ID`; otherwise visible KPI bindings can look structurally correct while runtime calculation writes to a different model identity.
