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
- `container.filter-action-row.full-width-space-between`: the outer filter/action row owns full-width `space-between` layout behavior.
- `container.filter-group.inline-row`: the left filter group is an inline row.
- `container.action-group.inline-row`: the right action group is an inline row.
- `container.filter-wrapper.inline-default-height`: filter wrapper Containers are inline/default-height hierarchy holders and do not own fixed filter width.
- `data-filter.dropdown.owns-fixed-180px-width`: the Data Filter control owns fixed/custom 180px dropdown sizing.
- `control.navigator-label.nv_label`: `nv_label` controls Yeeflow designer Navigator-visible naming for generated structural controls.
- `non-container.common.positioning.width-modes`: non-Container controls use `attrs.common.positioning.widthtype` for full, inline, and custom runtime width modes.
- `non-container.common.positioning.custom-width`: non-Container custom runtime width uses `attrs.common.positioning.widthtype = [null, "3"]`, `width`, and `widthu`.
- `non-container.common.margin-padding`: non-Container Advanced-tab spacing uses `attrs.common.margin` and `attrs.common.padding`.
- `non-container.common.border-normal-hover-shadow`: non-Container normal/hover border, radius, and shadow use `attrs.common.border`.
- `non-container.common.background-classic`: non-Container classic background color uses `attrs.common.background.normal`.
- `non-container.common.background-image`: non-Container background images use `attrs.common.background.normal.classic.image`.
- `non-container.common.background-gradient-two-color`: designer-backed non-Container gradients use two color stops unless custom CSS evidence exists.
- `data-filter.dropdown.runtime-effective-custom-180px-width`: Data Filter dropdown runtime-effective 180px width uses `attrs.common.positioning` custom width metadata.

Container is a special layout control. Container width, height, direction, alignment, flex layout, and wrap are represented by `attrs.style.widthtype`, `attrs.style.width`, `attrs.style.widthu`, `attrs.style.height`, `attrs.style.cushei`, `attrs.style.cusheiu`, `attrs.style.direction`, `attrs.style.align_items`, `attrs.style.justify_content`, and `attrs.style.wrap`.

Most non-Container controls use Advanced-tab `attrs.common` metadata for runtime-effective positioning and visual styling. For non-Container controls, do not treat `attrs.style.width` as runtime-effective width proof unless the required `attrs.common.positioning` shape is also present. The non-Container width mode mapping is:

- `attrs.common.positioning.widthtype = [null, "1"]`: full width
- `attrs.common.positioning.widthtype = [null, "2"]`: inline width
- `attrs.common.positioning.widthtype = [null, "3"]`: custom width, with `attrs.common.positioning.width` and `attrs.common.positioning.widthu`

Data Filter dropdown fixed `180px` runtime width must use `attrs.common.positioning.widthtype = [null, "3"]`, `attrs.common.positioning.width = [null, 180]`, and `attrs.common.positioning.widthu = [null, "px"]`. `attrs.common.sizing` can provide constraints, but it does not replace `attrs.common.positioning` for runtime-effective width.

For non-Container controls, Advanced-tab margin, padding, border, hover, shadow, and background should be checked under `attrs.common.margin`, `attrs.common.padding`, `attrs.common.border.normal`, `attrs.common.border.hover`, `attrs.common.background.normal`, and `attrs.common.background.hover`. Classic background images use `attrs.common.background.normal.classic.image`. Designer-backed gradient background evidence currently supports two colors; more complex gradient or background styling requires explicit custom CSS evidence.

Data Filter dropdown visual fidelity has three layers:

1. wrapper layer: `attrs.style` and `attrs.common` sizing, margin, padding, border, and layout.
2. input layer: `attrs.edit` placeholder, text, border, radius, padding, and foreground color.
3. dropdown panel layer: `attrs.dropdown.body` panel radius and shadow.

Native filter icon fidelity requires a real `icon` control, not a heading/text glyph, with `attrs.icon.icon = "fa-regular fa-filter"` and 16px sizing.

Filter/action row hierarchy fidelity has distinct ownership layers:

- parent row: full-width `container` with `justify_content = "space-between"`
- second-layer filter/action groups: inline `container` rows
- filter wrappers: inline/default-height `container` controls only
- Data Filter controls: fixed/custom `180px` sizing and dropdown visual-fidelity attrs

Do not assign the fixed filter width to wrapper containers. Legacy Status/Event Type wrapper widths such as 120px or 140px are not valid under the current high-fidelity 180px dropdown pattern.

Designer Navigator label fidelity is also an extension-layer rule. Manual designer evidence shows `nv_label` controls the Navigator-visible name; `id`, `name`, and `label` are useful but not sufficient substitutes. Important generated structural controls should use semantic `nv_label` values and must not remain generic values such as `Container`, `Text`, or `Grid`.

## Generation Rules

- Generated UI controls must use legal product-catalog property paths or explicit extension-registry paths.
- Unknown generated property paths are not acceptable for high-quality UI claims.
- Control-specific paths must be checked before package generation. A property valid for `summary` is not automatically valid for `container`.
- Do not invent camelCase aliases when the product catalog uses snake_case paths such as `attrs.style.align_items`.
- Do not apply Container `attrs.style` width/height rules to non-Container controls. Non-Container Advanced-tab runtime width must be represented under `attrs.common.positioning`.
- Validate decoded package `Resource.attrs` when decoded evidence is available. Passing a normalized generated spec alone is not enough when decoded package attrs contradict the intended hierarchy or width ownership.
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
