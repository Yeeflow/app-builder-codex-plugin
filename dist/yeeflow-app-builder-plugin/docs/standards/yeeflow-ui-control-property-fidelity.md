# Yeeflow UI Control Property Fidelity

This standard captures derived/redacted control-property lessons from the Marketing Event Management v0.6.46 design-to-runtime fidelity study. It uses the manual golden YAPK and runtime screenshots as human-reviewed references only. Raw YAPK payloads, screenshots, `Resource`, `Sign`, tenant URLs, workspace IDs, tokens, and private values must not be committed or copied into plugin training material.

The goal is control-property fidelity: generated Yeeflow UI must match the intended control types and attrs, not only page layout, application chrome, navigation, or section presence.

## Control Property Knowledge Base

Use the Yeeflow control property knowledge base before generating controls:

- normalized product-catalog registry: `docs/reference/yeeflow-control-configurations.normalized.json`
- extension registry for study-backed gaps: `docs/reference/yeeflow-control-property-extensions.json`
- helper: `scripts/inspect-yeeflow-control-configurations.mjs`

Do not invent property paths. Product catalog paths are the baseline legal paths. The extension registry can add export-proven, runtime-proven, human-reviewed, or needs-study paths over time, but extension confidence must remain visible. Export/runtime proof is still required for visual fidelity claims: catalog-backed paths prove configurability, not final rendered quality.

## Study Summary

The v0.6.46 test showed that application layout, chrome, and primary navigation fidelity are materially better. Remaining gaps are concentrated in content/control implementation:

- filter/action rows need exact Container attrs, not generic visual similarity
- Data Filters must be real Data Filter controls, not static Text controls that look like filters
- filter variables must be bound and consumed by target Summary, Collection, or List controls
- KPI cards must share a consistent golden card pattern across peers
- live KPI values can differ from mock design values only when reported as a visual-target boundary
- signing, verifysign, upgrade-check, upgrade-apply, and install success are not visual proof
- runtime screenshot proof must include explicit browser refresh metadata and screenshot path/status
- many package versions in `dist` require a latest-artifact manifest or explicit selected-artifact proof before future signing/upgrade work

This branch adds metadata validators and synthetic fixtures only. It does not parse screenshots, decode private package payloads, operate Chrome, call Yeeflow APIs, sign packages, install packages, import packages, or upgrade apps.

## Container Attrs Schema

Generated Container controls for visual composition must use Yeeflow-style attrs internals. Do not put `id`, `type`, or `label` inside the `attrs` object when documenting control-property contracts.

Expected Container style attrs include:

- `attrs.style.widthtype`
- `attrs.style.width`
- `attrs.style.widthu`
- `attrs.style.height`
- `attrs.style.cushei`
- `attrs.style.cusheiu`
- `attrs.style.direction`
- `attrs.style.align_items`
- `attrs.style.justify_content`
- `attrs.style.gap`
- `attrs.style.wrap`
- `attrs.common.padding` or equivalent padding metadata
- `attrs.common.margin` or equivalent margin metadata
- `attrs.common.border` or equivalent border metadata
- `attrs.content.htmltag` when semantic HTML treatment is required

Use snake_case Yeeflow attrs such as `align_items` and `justify_content`. Do not substitute camelCase aliases such as `alignItems` or `justifyContent` in generated control metadata.

Use Container controls for visual composition rows/cards. Use Grid only for a real data grid, not for card composition, filter/action toolbars, or KPI card internals.

## Filter/Action Row Golden Pattern

The Event Portfolio filter/action row should be implemented with Container controls:

- parent container is full-width
- parent direction is `row`
- parent `align_items` is `center`
- parent `justify_content` is `space-between`
- parent `wrap` is `nowrap`
- parent margin and padding are zero
- left filter group is inline
- right action group is inline
- Region wrapper is fixed `180px`
- Period wrapper is fixed `180px`
- Status wrapper is fixed `120px`
- Event Type wrapper is fixed `140px`
- New Event Request and Export action containers/buttons have fixed sizes

The row must not be a Grid/Flex-like visual wrapper that introduces unwanted hierarchy or spacing.

## Data Filter Control Requirements

Filters must be real Yeeflow Data Filter controls:

- Region uses a radio-style filter
- Period uses a relative-period filter
- filter controls use dropdown/select display style where required by the compact toolbar
- display title is hidden
- margin is zero
- padding is zero
- border is none
- placeholder style is compact/muted and visually consistent
- each visible filter has a filter variable
- target Summary, Collection, or List controls consume the relevant filter variables

Do not simulate filter controls with static Text or decorative containers. Visible filters without target consumption are not functional UI proof.

### Data Filter Dropdown Visual Fidelity

Real Data Filter controls are required, but they are not sufficient for high-fidelity generated design/runtime alignment. High-fidelity dropdown filters must use approved extension-backed patterns from `docs/reference/yeeflow-control-property-extensions.json`.

For compact Event Portfolio-style filter rows:

- Region-like filters use the `radio-filter.dropdown.visual-fidelity.180px` pattern.
- Period-like filters use the `relative-period.dropdown.visual-fidelity.180px` pattern.
- Both patterns are fixed `180px` wide and keep display titles hidden.
- Relative Period filters must include a valid `attrs.field` and nonempty `attrs.choice-options`.

Dropdown visual fidelity must be checked across three layers:

1. wrapper layer: `attrs.style` and `attrs.common` define fixed width/height, alignment, zero margin, zero padding, and border handling.
2. input layer: `attrs.edit` defines placeholder color, text color, border type/color/radius, padding, and foreground color.
3. dropdown panel layer: `attrs.dropdown.body` defines panel radius and shadow.

Unknown Data Filter property paths remain review-required unless they are product-catalog-backed or extension-backed by redacted export/runtime evidence.

### Native Filter Icon Fidelity

Filter affordances should use native Yeeflow `icon` controls, not heading/text glyphs or static characters. The approved extension-backed pattern is `icon.filter.native.16px`:

- `type` is `icon`.
- `attrs.icon.icon` is `fa-regular fa-filter`.
- `attrs.icon.view` is `default`.
- `attrs.icon.shape` is `2`.
- `attrs.icon.align` centers the icon.
- `attrs.icon.size` is `16px`.
- wrapper margin and padding are zero when the icon is used inside a compact filter chip.

This is still metadata validation only. It does not claim pixel-perfect visual diffing or automatic screenshot understanding.

## KPI Card Golden Pattern

KPI cards should follow the manual first-card golden pattern:

- card container with consistent padding, radius, border, and shadow treatment
- top row container, not Grid
- fixed icon tile container
- centered icon inside the tile
- inline text stack next to the icon
- value placed consistently below or near the label according to the card pattern
- trend/helper text placed consistently below the value
- all peer KPI cards follow the same pattern, not only the first card

Runtime live KPI values may differ from design mock values when the report marks the design values as visual-target-only. Dynamic KPI proof still requires before/after mutation evidence.

## Runtime Proof And Artifact Boundaries

Runtime proof must include:

- selected candidate artifact path
- screenshot path
- screenshot capture status
- explicit browser refresh before screenshot capture
- proof boundary separating package validation, signing, upgrade, runtime screenshot, design fidelity, and dynamic KPI proof

Signing, verifysign, upgrade-check, upgrade-apply, and install success are not visual proof. When many package versions exist in `dist`, future workflows should use a latest-test-artifact manifest or explicit selected-package confirmation before signing or upgrade work.

## Validator

Use:

```bash
node scripts/inspect-ui-control-property-fidelity.mjs --candidate <control-spec.json> --format json
```

Optional:

```bash
node scripts/inspect-ui-control-property-fidelity.mjs \
  --candidate <control-spec.json> \
  --reference <redacted-golden-control-spec.json> \
  --page "Event Portfolio" \
  --out <findings.json> \
  --strict
```

The validator accepts declared/redacted control specs or safe decoded metadata only. It must not read raw private YAPK payloads, parse screenshots, inspect Chrome, call Yeeflow APIs, sign packages, install packages, import packages, or upgrade apps.

Finding codes include:

- `CONTROL_TYPE_MISMATCH`
- `CONTAINER_ATTR_MISSING`
- `CONTAINER_ATTR_SCHEMA_ALIAS_MISMATCH`
- `CONTAINER_WIDTHTYPE_MISMATCH`
- `CONTAINER_FIXED_SIZE_MISMATCH`
- `CONTAINER_ALIGNMENT_MISMATCH`
- `CONTAINER_GAP_MISMATCH`
- `CONTROL_MARGIN_PADDING_MISMATCH`
- `CONTROL_BORDER_STYLE_MISMATCH`
- `DATA_FILTER_CONTROL_TYPE_MISMATCH`
- `DATA_FILTER_DISPLAY_STYLE_MISMATCH`
- `DATA_FILTER_TITLE_NOT_HIDDEN`
- `DATA_FILTER_PLACEHOLDER_STYLE_MISMATCH`
- `DATA_FILTER_VISIBLE_BUT_NOT_BOUND`
- `FILTER_VARIABLE_NOT_CONSUMED_BY_TARGET_CONTROL`
- `ACTION_CONTAINER_SIZE_MISMATCH`
- `KPI_ICON_TILE_STYLE_MISMATCH`
- `KPI_TEXT_STACK_LAYOUT_MISMATCH`
- `GRID_USED_WHERE_CONTAINER_REQUIRED`
- `DYNAMIC_KPI_PROOF_MISSING`

## Future Work

Future implementation can add a latest-artifact manifest guard, runtime proof freshness validator, and richer content-fidelity report schema. Those are not implemented by this standard unless an executable validator exists and is included in aggregate hard gates.
