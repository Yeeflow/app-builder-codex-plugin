# Yeeflow Control Property Knowledge Base

This standard defines the plugin knowledge layer for Yeeflow control property paths. It is derived from the product-provided control configuration catalog and is intentionally metadata-only: it does not replace package validation, runtime evidence, or visual proof.

## Registry Layers

Use the knowledge base in this order:

1. `product_catalog`: properties normalized from the product control configuration catalog.
2. `export_proven`: extension properties observed in redacted exports and reviewed as safe.
3. `runtime_proven`: extension properties observed in redacted runtime evidence and reviewed as safe.
4. `human_reviewed`: study-backed properties that require care before strong claims.
5. `needs_study`: possible properties that must not be used for high-quality UI claims without more evidence.
6. `unknown`: unsupported or unclassified properties.

The normalized product catalog is stored at:

- `docs/reference/yeeflow-control-configurations.normalized.json`

The extension registry is stored at:

- `docs/reference/yeeflow-control-property-extensions.json`

The raw product catalog is not committed in this branch. The normalized registry keeps product control IDs, control types, property paths, value types, device-shape flags, descriptions, enum metadata, and source confidence.

## Evidence-Backed Extension Patterns

The normalized registry remains the product-catalog source of truth. Extension entries are layered on top of it; they do not replace product-catalog semantics and must not be promoted to official catalog status unless a future product catalog includes them.

The extension registry can contain two kinds of study-backed knowledge:

- `extensions[]`: individual property paths that are missing from the product catalog but have explicit evidence.
- `patterns[]`: named visual-fidelity patterns that combine product-catalog paths with export/runtime-study observations.

Agents must consult the base registry first, then apply approved extension patterns only when visual fidelity requires known combinations. Unknown properties remain review-required unless supported by either the product catalog or an evidence-backed extension.

Current evidence-backed visual patterns include:

- `radio-filter.dropdown.visual-fidelity.180px`: a fixed-width radio-filter dropdown pattern for compact Region-style filters.
- `relative-period.dropdown.visual-fidelity.180px`: a fixed-width relative-period dropdown pattern with required field and nonempty choice-options.
- `icon.filter.native.16px`: a native filter icon pattern using the real Yeeflow icon control with 16px icon sizing.

Data Filter dropdown visual fidelity has three layers:

1. wrapper layer: `attrs.style` and `attrs.common` sizing, margin, padding, border, and layout.
2. input layer: `attrs.edit` placeholder, text, border, radius, padding, and foreground color.
3. dropdown panel layer: `attrs.dropdown.body` panel radius and shadow.

Native filter icon fidelity requires a real `icon` control, not a heading/text glyph, with `attrs.icon.icon = "fa-regular fa-filter"` and 16px sizing.

## Generation Rules

- Generated UI controls must use legal product-catalog property paths or explicit extension-registry paths.
- Unknown generated property paths are not acceptable for high-quality UI claims.
- Control-specific paths must be checked before package generation. A property valid for `summary` is not automatically valid for `container`.
- Do not invent camelCase aliases when the product catalog uses snake_case paths such as `attrs.style.align_items`.
- `allowDevice` controls whether a property can use device-specific responsive values.
- Extension-only paths require evidence and must keep their confidence/status visible in reports.
- The registry proves known configurable paths. Export/runtime evidence proves safe combinations and visual behavior.
- The registry does not parse screenshots, inspect Chrome, call Yeeflow APIs, generate packages, sign, install, import, or upgrade apps.

## Helper

Use the helper to normalize, inspect, and validate declared control metadata:

```bash
node scripts/inspect-yeeflow-control-configurations.mjs \
  --normalized docs/reference/yeeflow-control-configurations.normalized.json \
  --extensions docs/reference/yeeflow-control-property-extensions.json \
  --list-controls
```

Inspect one control:

```bash
node scripts/inspect-yeeflow-control-configurations.mjs \
  --normalized docs/reference/yeeflow-control-configurations.normalized.json \
  --control container
```

Validate a synthetic or redacted control spec:

```bash
node scripts/inspect-yeeflow-control-configurations.mjs \
  --normalized docs/reference/yeeflow-control-configurations.normalized.json \
  --extensions docs/reference/yeeflow-control-property-extensions.json \
  --validate-control-spec <control-spec.json>
```

## Finding Codes

- `CONTROL_TYPE_UNKNOWN`
- `CONTROL_CONFIG_MISSING`
- `CONTROL_PROPERTY_UNKNOWN`
- `CONTROL_PROPERTY_EXTENSION_ONLY`
- `CONTROL_PROPERTY_NEEDS_STUDY`
- `CONTROL_PROPERTY_PATH_ALIAS`
- `CONTROL_PROPERTY_WRONG_CONTROL`
- `CONTROL_PROPERTY_VALUE_TYPE_MISMATCH`
- `CONTROL_PROPERTY_DEVICE_SHAPE_MISMATCH`
- `CONTROL_PROPERTY_REGISTRY_PASS`

## Relationship To UI Control-Property Fidelity

The UI control-property fidelity gates must align with this knowledge base:

- Container rows/cards should use product-catalog Container attrs.
- Data Filter controls should use product-catalog filter paths and real filter controls, not static Text.
- Filter variables and target Summary, Collection, or List consumption remain fidelity checks beyond path validity.
- KPI card structure requires declared metadata and runtime proof; valid property paths alone do not prove visual quality.
- Mock-vs-runtime KPI boundaries and dynamic KPI proof remain governed by the UI closed-loop/runtime evidence gates.

## Future Extension Process

When a future study discovers a safe property missing from the product catalog:

1. Add a minimal entry to `docs/reference/yeeflow-control-property-extensions.json`.
2. Include `controlType`, `propertyPath`, `valueType`, `allowDevice`, `source`, `confidence`, `evidence`, `status`, and `notes`.
3. Use only redacted evidence references.
4. Mark uncertain entries as `needs_study`.
5. Promote confidence only after export/runtime proof supports the property and visual behavior.
