# Custom Code Dashboard Golden Reference Training

## Scope

Register `dashboard-page-layouts-custom-code` as an alternate Dashboard template and carry its selection from Functional Specification intent through App Plan, standalone Dashboard Plan, shared page-body materialization and validation. The default Dashboard template remains unchanged. User-approved rules include optional complete header removal, optional top/bottom and side panels, stacked full-width Custom Code modules, functional decomposition, variable exchange, native filtering and native Button/Form Action integration.

Source: user-authored `Custom Code Dashboard.ydp`, SHA-256 `7dd8b0457834de06969d3c542935419786e1ea19bc50fb4d733a14c82d97389d`. The canonical reference retains 51 controls and 24 intentional empty slots. Its normalized body removes only eight legacy business names, four legacy Container labels and the unused source filter array. New generated pages additionally serialize root full-width and explicit vertical right-panel defaults. The source export and normalized reference are not overwritten with generated pages.

## Integration

- Registry: `docs/reference/dashboard-page-layout-templates.json` and `dashboard-page-layout-custom-code.template.json`.
- Standard and planning tables: `docs/standards/dashboard-page-layouts-custom-code-standard.md`.
- Functional Specification source constraints carry explicit custom implementation requests, image references, interactions and device expectations with requirement markers.
- App Plan and standalone plan gates require Composition, Module Plan, and Communication and Native Integration sections for this selected template.
- Shared body builder: `scripts/lib/dashboard-custom-code-template.mjs`; full-app dispatch accepts concrete page-name keyed compositions via `--custom-code-dashboards`.
- No automatic Collection/KPI fallback, no mandatory visible header, no generated-final empty placeholders. The desktop two-panel ratios are 1/2.5 and 2.5/1; three-panel remains 1/2.5/1.5. Mobile right span is explicitly 1; tablet left density is preserved.
- Dedicated page-layout checks supplement existing action-resolution, dependency and resource gates. This page shell is not labeled as an Event Portfolio clone.
- Six source skill entry points and matching distribution mirrors carry the template-specific guidance. Explicit distribution file lists include the new files without collecting unrelated untracked duplicates.

## Verification

Executed checks:

| Check | Scope |
| --- | --- |
| `node scripts/test-dashboard-custom-code-template.mjs` | Registry, plan requirements, four panel variants, headerless stacks, optional title, internal Grid fidelity, shared full-app dispatch, aggregate layout gates and negative cases |
| `node scripts/test-dashboard-page-layout-plan-conformance-gates.mjs` | Existing templates plus the new selected Custom Code page through the complete full-app materializer using synthetic test identities |
| `node scripts/test-dashboard-workbench-page-layout-template-gates.mjs` | Existing Workbench regression, 14 cases |
| `node scripts/test-ydp-wrapper-gates.mjs` | Existing wrapper cases plus a new shared Custom Code body, standalone plan selection, strict fixture wrapper/readback and missing-module-plan rejection |
| `pnpm typecheck` | Workspace TypeScript project checks |
| Explicit distribution manifest byte comparison | Source and distribution mirrors match; new reference, builder, tests, standards and skills are included |

The focused suite also permits the registered native filter-group layout and checks fresh IDs when repeating an internal Grid module. It rejects empty planning sections and does not interpret a template catalogue as a page selection. Filter-group layout acceptance alone does not prove filtering behavior.

The pre-existing standalone fixture lacked the now-required explicit page-layout selection table. Its test plan was brought into alignment; no production gate was relaxed. All wrapper identity/source-binding values in that test remain synthetic fixtures. Successful fixture round-trip is not credentialed Core execution or live Yeeflow import evidence.

## Proof boundary

This is export-backed schema and planning training with local materialization/validator proof. Custom Code scripts in tests are static fixtures, not business implementations. Module input/output parameter wiring, native filter consumers, CSS-ID Button invocation, actual data refresh, permissions and responsive visual quality require testing in the eventual application. Standalone production still requires the supported Core build result with real issued identity/dependency/source-binding evidence; no new provenance generator or bypass was added. No live application was modified and no public release, tag, or installed-cache update is claimed.
