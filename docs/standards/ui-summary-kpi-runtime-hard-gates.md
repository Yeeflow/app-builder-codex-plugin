# UI, Summary/KPI, And Runtime Evidence Hard Gates

## Purpose

Generated Yeeflow UI quality must be treated as a product contract, not decoration after app structure. A package can pass schema validation, signing, install, or upgrade acceptance and still be visually wrong, scaffold-like, or dynamically unproven.

## Page-By-Page UI Contract

Before modifying dashboards or UI-heavy pages, create a page-by-page UI implementation contract. The contract must name each target page, page purpose, design/mockup reference when requested, visual sections, Yeeflow control mapping, data/list bindings, KPI/Summary plan, filter/action plan, grid/table plan, status/badge plan, runtime evidence requirement, and proof boundary.

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

Every Summary must save to a unique temp variable with the designer-exported expression-object `save_var` shape, not a plain string. Page `ReportIds` must include the Summary control IDs.

Run:

```sh
node scripts/inspect-dashboard-summary-control-contract.mjs --package <decoded.json-or-package.yapk>
```

## Visible KPI Runtime Boundary

Visible Text/Heading controls must not show raw temp variable names and must not render blank. Dynamic visible KPI binding is not solved unless runtime evidence proves nonblank visible dynamic values without raw variable names.

If dynamic visible binding is not runtime-proven, generation must stop or use an explicitly labeled fallback and record the gap. Fallback values are visual fallback only; they are not proof of dynamic KPI rendering.

Run:

```sh
node scripts/inspect-visible-kpi-runtime-bindings.mjs --evidence <redacted-runtime-evidence.json>
```

## Runtime Screenshot Evidence

Do not claim high-quality UI from schema validation, signing, install, upgrade-check, or API acceptance. Runtime screenshot/evidence must confirm KPI values are visible, hidden Summary controls are not visible, dashboard cards are card-like, filters/actions are visible, tables/grids are not empty scaffolds, badges/chips are distinct, and the page does not look like a plain scaffold.

Run:

```sh
node scripts/inspect-runtime-evidence.mjs --evidence <redacted-runtime-evidence.json> --claim-high-quality-ui
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

## Tolerant Decode Helper

Official designer exports can use Brotli/base64 variants that strict helpers may reject. Use `decode-yapk-tolerant-brotli.mjs` only for safe structural diagnostics. It must fail safely and never print raw package payloads, raw `Resource`, raw `Sign`, tenant URLs, tokens, or private values.

```sh
node scripts/decode-yapk-tolerant-brotli.mjs --package <official-export.yapk>
```
