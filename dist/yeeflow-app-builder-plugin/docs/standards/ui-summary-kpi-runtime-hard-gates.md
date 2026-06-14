# UI, Summary/KPI, And Runtime Evidence Hard Gates

## Purpose

Generated Yeeflow UI quality must be treated as a product contract, not decoration after app structure. A package can pass schema validation, signing, install, or upgrade acceptance and still be visually wrong, scaffold-like, or dynamically unproven.

## Page-By-Page UI Contract

Before modifying dashboards or UI-heavy pages, create a page-by-page UI implementation contract. The contract must name each target page, page purpose, design/mockup reference when requested, visual sections, Yeeflow control mapping, data/list bindings, KPI/Summary plan, filter/action plan, grid/table plan, status/badge plan, runtime evidence requirement, and proof boundary.

Phase 1 closed-loop helper:

```sh
node scripts/generate-ui-contract-from-design.mjs --design <design-image> --plan <app-plan.md-or-json> --output <ui-contract.md>
```

If no local vision parser is available, this helper emits a review-required draft from the app plan and design image reference. It must not be treated as complete visual understanding until a human reviewer resolves the visual extraction items.

Phase 2 closed-loop helper:

```sh
node scripts/compare-design-to-runtime-structure.mjs --contract <ui-contract.md-or-json> --runtime-evidence <redacted-runtime-evidence.json> [--design-image <design-image>] [--strict]
```

Phase 2 adds structural design-to-runtime comparison. It is not pixel-perfect visual diffing and does not claim full automatic image understanding. It compares UI contract expectations against redacted runtime evidence, including Phase 1 evidence from `capture-runtime-ui-evidence.mjs`. When a design image is supplied without a reliable parser, the comparison must stay in contract-runtime mode, mark human review required, and emit a review warning. Runtime evidence is required before UI quality claims. Screenshots are helpful but not always mandatory unless high-quality visual proof is claimed. Dynamic KPI proof remains governed by before/after mutation evidence and the existing runtime/KPI validators.

Phase 1 and Phase 2 are now stable closed-loop capabilities. Phase 3A makes the workflow stricter in hard-gate guidance and regression tests: design/mockup work must start with a generated and validated UI implementation contract; UI upgrades must define and validate a page/scope manifest; runtime evidence plus structural comparison is required before design fidelity claims; and agents must iterate the exact failing controls reported by the hard gates. Package validation/signing/install/upgrade success is not visual proof, and neither upgrade-check nor upgrade-apply success can be used as a substitute for redacted runtime evidence. Dynamic KPI proof remains separate and requires before/after mutation evidence. Real Marketing Event private artifacts are not committed; regression fixtures are synthetic/inspired.

Phase 3B is the workflow enforcement layer. Phase 3B closes the planned UI-quality track; after Phase 3B, future work is normal incremental improvement unless a new runtime issue class appears. The workflow enforcement helper purpose is to validate workflow/report metadata and final artifact paths before high-quality UI, runtime UI quality, design fidelity, or dynamic KPI proof is claimed:

```sh
node scripts/inspect-ui-closed-loop-workflow-enforcement.mjs --workflow <workflow-report.json-or-md> [--strict]
```

High-quality UI claims require evidence chain, not just install success. Final reports must include the UI contract, contract validation result, scope manifest and scope validation result for upgrade work, runtime evidence, design/runtime structure findings, workflow enforcement findings, unresolved findings or warning waivers, and before/after KPI mutation evidence when dynamic KPI proof is claimed. Package validation/signing/install/upgrade success is not visual proof. Dynamic KPI proof remains separate. Structure comparison alone is not dynamic KPI proof. The workflow enforcement helper is required before high-quality UI/design-fidelity claim.

Default closed-loop artifact/report paths are:

- UI contract Markdown: `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.md`
- UI contract JSON: `docs/generated-ui-contracts/<app-or-package>/<page>.ui-contract.json`
- UI upgrade scope manifest: `docs/ui-upgrade-scopes/<app-or-package>/<page>.scope.json`
- Runtime evidence: `dist/runtime-evidence/<app-or-package>/<page>.runtime-evidence.redacted.json`
- Design/runtime structure findings: `dist/runtime-evidence/<app-or-package>/<page>.design-runtime-structure.findings.json`
- Workflow enforcement findings: `dist/runtime-evidence/<app-or-package>/<page>.closed-loop-workflow.findings.json`

## Application Layout Design Images

Generated design images for Yeeflow apps must use one of the four official Yeeflow application layouts before they become UI implementation references: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`. PNG/JPEG layout screenshots are the primary visual references for header/navigation/content safe-area geometry and dropdown or expanded menu behavior; YAPK exports are supporting structural references. All page images in the same app must use the same selected layout and the same canonical application chrome style. Design-image prompts must preserve that Yeeflow header/nav/content safe-area structure, header mode, nav mode, nav background mode, selected state style, app icon placement, and app name placement. For Layout 1 vertical nav, do not add a header hamburger icon or bottom Collapse control, and do not mix dark and light nav panels across pages unless a separately named canonical style is explicitly reviewed and used everywhere. Header/navigation chrome must follow the selected layout, and page-specific content must stay inside the content safe area.

Run `scripts/inspect-application-layout-design-rules.mjs` for generated design image specs or UI contracts. The validator checks declared layout compliance and application chrome fidelity; blocks Layout 1 header hamburger and bottom Collapse controls; detects cross-page chrome drift such as dark/light nav background mismatches; and blocks unsupported arbitrary app shells/navigation chrome, custom sidebars, custom top bars, floating navigation, and content that overlaps header/nav safe areas. It does not claim automated screenshot understanding unless a future reliable parser exists; screenshot-derived layout rules must remain human-reviewed or review-required and are not pixel-perfect or automated screenshot proof.

Run:

```sh
node scripts/inspect-yeeflow-ui-design-contract.mjs --contract <ui-contract.md> --claim-high-quality-ui
```

Broad full-app restyling without page-level contracts is a hard stop. Placeholder wording such as `Here is the title`, `Here is the description`, `placeholder`, or `scaffold` is a generated-final failure.

## Export-Proven Style Shapes

Use export-proven Yeeflow style shapes for dashboard cards and chips:

- `attrs.common.background.normal.classic.color`
- `attrs.common.border.normal.type`
- `attrs.common.border.normal.width`
- `attrs.common.border.normal.color`
- `attrs.common.border.normal.radius`
- `attrs.common.padding`
- `attrs.style.gap`
- control-level typography style objects
- Collection grid-table patterns when grid-table layout is intended

Weak top-level style guesses can look plausible in JSON and flatten at runtime. For uncertain styling or new controls, create a sandbox page first, verify a runtime screenshot, then apply the pattern to the real page.

Run:

```sh
node scripts/inspect-dashboard-style-shapes.mjs --package <decoded.json-or-package.yapk>
```

## Summary/KPI Contract

Summary/KPI dashboard generation has three proof states that must stay separate:

1. Designer-configured Summary control
2. Validator-valid Summary contract
3. Runtime-proven visible dynamic KPI rendering

Hidden Summary controls must live in a dedicated hidden container with:

```json
{
  "attrs": {
    "common": { "hide": [null, true, true, true] },
    "style": { "direction": [null, "row"] },
    "display": { "rule": "1 == 0" }
  }
}
```

Each Summary must resolve to the current app, a real list, and real field metadata. `attrs.data.field`, `attrs.field`, `fieldObject`, and `fieldInfo` must be populated consistently. Count summaries require valid count/ListDataID shape where required. Sum and average summaries must use numeric fields. Filters must use designer-compatible condition/filter shapes, unless intentionally documented as an all-record KPI.

Every Summary must save to a unique temp variable with the designer-exported expression-object `save_var` shape, not a plain string. Summary control IDs must be registered in `Pages[].LayoutInResources[].Resource.ReportIds`. Top-level `Pages[].ReportIds` is optional compatibility metadata and must not be required unless proven by official exports.

Run:

```sh
node scripts/inspect-dashboard-summary-control-contract.mjs --package <decoded.json-or-package.yapk>
```

## Data Analytics Control Identity

Data Analytics controls must use runtime-safe control identities. This inventory is currently in scope:

- Pie chart
- Column chart
- Line chart
- Gauge
- Funnel chart
- Color block heatmap
- Summary
- Pivot table

For every generated Data Analytics control, the control ID must be UUID-based unless an export-proven Yeeflow sample proves another ID shape is valid for that exact control type. Do not assume the Summary control shape applies exactly to Pie chart, Column chart, Line chart, Gauge, Funnel chart, Color block heatmap, or Pivot table.

Every analytics control must satisfy these generated-final rules:

- Control ID shape is runtime-safe.
- Control ID is stable across upgrades.
- Control ID appears in the correct page/report registration metadata when required.
- Matching `Resource.exts[]` entries exist when required.
- `Resource.exts[].i` matches the control ID when the control uses `exts`.
- Analytics settings, data source, fields, filters, grouping, aggregation, and display metadata are designer-shaped.
- Placeholder fields and invented field IDs are forbidden.
- Runtime proof is not claimed unless runtime screenshot/evidence confirms the control renders correctly.
- Upgrade/new-version workflows preserve existing analytics control IDs.
- Only newly added analytics controls get newly generated UUID/API-issued IDs.

Summary has a proven UUID runtime shape through KPI Runtime Binding Proof v1.0.1. Pivot table has export-proven dashboard `exts[]` registration where `category = "___Pivot___"`, `key = "PivotTable"`, and `i` equals the Pivot Table control ID, with focused runtime proof for a representative dashboard package. Pie chart, Column chart, and Line chart have prior generated dashboard runtime proof for visible rendering, but their detailed generated-final identity/registration rules must still be validated from export-proven shapes before broader runtime correctness claims. Gauge, Funnel chart, and Color block heatmap remain unproven for generated-final runtime claims until sandbox/export study captures exact designer shapes.

Run:

```sh
node scripts/inspect-data-analytics-control-identity.mjs --package <decoded.json-or-package.yapk>
```

## Visible KPI Runtime Boundary

Visible Text/Heading controls must not show raw temp variable names and must not render blank. Dynamic visible KPI binding is proven only for the exact UUID Summary v1.0.1 shape documented below, and only when runtime evidence proves nonblank visible dynamic values without raw variable names.

If a package does not use that exact shape, visible KPI dynamic binding is not considered solved unless runtime-proven for its own shape. Generation must stop or use an explicitly labeled fallback and record the gap. Fallback values are visual fallback only; they are not proof of dynamic KPI rendering.

### Exact Proven UUID Summary Shape

KPI Runtime Binding Proof v1.0.1 proved dynamic visible KPI binding only for this dashboard Summary shape:

- Summary control IDs are UUIDs.
- Each Summary UUID appears in `Resource.ReportIds[]`.
- Each Summary UUID has a matching `Resource.exts[]` entry where `i` equals the Summary control ID, `category` is `___Pivot___`, and `key` is `summary`.
- Each Summary control saves to a dashboard temp variable through a designer-shaped `attrs.save_var` expression object.
- `Resource.tempVars[]` declares the same temp variable ids/names.
- Visible KPI Heading/Text controls bind through `attrs.headc.title.variable[]`.
- Proof KPI values do not use static or formatted fallback values.
- Summary field metadata includes `attrs.data.field`, `attrs.field`, `fieldObject`, and `fieldInfo`.

Runtime proof for this shape must include before/after source data mutation evidence and refreshed/recalculated page state. The v1.0.1 proof changed expected KPI values from `3 / 600 / 2 / 300` to `4 / 1000 / 3 / 700` after adding a synthetic source row with amount `400`, status `Open`, and region `APAC`.

Summary recalculation may be asynchronous or cache-delayed. Stale after-evidence that still shows the before values must not be used as the final verdict; capture final evidence only after the refreshed/recalculated runtime state is visible.

This proof does not automatically prove semantic/non-UUID Summary IDs, approval forms, public forms, unsupported surfaces, or other visible KPI binding shapes. Marketing Event dashboards may use this shape, but each generated package must still run its own before/after mutation proof before claiming runtime dynamic KPI success.

Run:

```sh
node scripts/inspect-visible-kpi-runtime-bindings.mjs --evidence <redacted-runtime-evidence.json>
```

Use `docs/examples/runtime-evidence.redacted.example.json` as the safe starting point for runtime proof reports. It is synthetic, includes the exact UUID Summary v1.0.1 proof-shape fields, preserves a fallback example for unsupported shapes, and avoids private screenshots, tenant URLs, workspace IDs, raw responses, and package payloads.

Phase 1 closed-loop helper:

```sh
node scripts/capture-runtime-ui-evidence.mjs --pages-json <redacted-pages.json> --output <redacted-runtime-evidence.json>
```

The capture output is redacted metadata shaped for `inspect-runtime-evidence.mjs` and `inspect-visible-kpi-runtime-bindings.mjs`. Do not store private tenant screenshots or raw runtime responses in fixtures.

Use Phase 2 comparison after capture to check structural fidelity:

```sh
node scripts/compare-design-to-runtime-structure.mjs --contract <ui-contract.md-or-json> --runtime-evidence <redacted-runtime-evidence.json>
```

The comparison produces structured findings for page presence, sections, KPI cards, tables/grids, filters/actions, badges/status cells, spacing hierarchy, placeholder/filler text, weak evidence, screenshot availability, and dynamic KPI proof boundaries. It must never treat install, signing, import, upgrade, API acceptance, or package validation as visual success.

## Runtime Screenshot Evidence

Do not claim high-quality UI from schema validation, package validation, signing, install, upgrade-check, upgrade-apply, or API acceptance. Runtime screenshot/evidence must confirm KPI values are visible, hidden Summary controls are not visible, dashboard cards are card-like, filters/actions are visible, tables/grids are not empty scaffolds, badges/chips are distinct, and the page does not look like a plain scaffold.

Run:

```sh
node scripts/inspect-runtime-evidence.mjs --evidence <redacted-runtime-evidence.json> --claim-high-quality-ui
node scripts/test-ui-hard-gates-all.mjs
```

When runtime evidence is unavailable, generated reports must say:

- UI runtime proof not completed
- dynamic KPI visible binding not proven
- install/signing is not visual runtime proof

## Grid/Table Quality

When a plan calls for Collection grid-table layout, generated dashboards must include Collection grid-table templates with meaningful columns, headers, item templates, empty states, and planned row/action links. Do not use dashboard `data-list` when Collection grid-table was intended.

Run:

```sh
node scripts/inspect-grid-table-quality.mjs --package <decoded.json-or-package.yapk> --require-grid-table
```

## Upgrade Lineage

UI upgrades must preserve the installed app lineage. ListSetID and existing resource IDs must not drift when the user requests an update. Package classification must remain upgrade, existing app identity must stay stable, existing pages/resources must not change outside declared scope, and `Resource.ReplaceIds` must be rebuilt from final package contents.

Run:

```sh
node scripts/inspect-yapk-upgrade-app-identity.mjs --package <package.yapk> --lineage <lineage.json>
node scripts/validate-yapk-upgrade-id-stability.mjs --previous-package <previous.yapk> --previous-manifest <previous-id-lineage.json> --new-package <package.yapk> --new-manifest <new-id-lineage.json>
```

Phase 1 closed-loop helper:

```sh
node scripts/validate-ui-upgrade-scope.mjs --previous-package <previous.json-or-yapk> --new-package <new.json-or-yapk> --scope <scope-manifest.json>
```

Use this before focused UI upgrades to fail closed on ListSetID drift, app identity drift, unrelated page/resource changes, data list/field changes, approval form changes, workflow changes, navigation drift, numeric ID lineage changes, and new generated IDs without explicit allowance.

## Tolerant Decode Helper

Official designer exports can use Brotli/base64 variants that strict helpers may reject. Use `decode-yapk-tolerant-brotli.mjs` only for safe structural diagnostics. It must fail safely and never print raw package payloads, raw `Resource`, raw `Sign`, tenant URLs, tokens, or private values.

```sh
node scripts/decode-yapk-tolerant-brotli.mjs --package <official-export.yapk>
```
