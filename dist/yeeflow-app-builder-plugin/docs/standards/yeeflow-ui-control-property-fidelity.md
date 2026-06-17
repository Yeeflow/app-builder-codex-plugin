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
- filter/action row hierarchy must assign full-width behavior to the parent row, inline behavior to second-layer groups, and fixed filter sizing to the Data Filter controls themselves
- generated structural controls need semantic `nv_label` values so the Yeeflow designer Navigator is readable
- decoded package `Resource` attrs must be validated when decoded evidence is available; passing a normalized spec alone is not enough to claim final control-property fidelity
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

Container is a special layout control. Container width, height, direction, alignment, flex layout, and wrap use `attrs.style`. Most non-Container controls use Advanced-tab `attrs.common` properties for runtime-effective positioning, sizing, spacing, border, hover, shadow, and background. Do not apply Container `attrs.style.width` or `attrs.style.widthtype` rules to non-Container controls as runtime width proof.

For non-Container controls:

- full width uses `attrs.common.positioning.widthtype = [null, "1"]`
- inline width uses `attrs.common.positioning.widthtype = [null, "2"]`
- custom width uses `attrs.common.positioning.widthtype = [null, "3"]` plus `attrs.common.positioning.width` and `attrs.common.positioning.widthu`
- margin and padding use `attrs.common.margin` and `attrs.common.padding`
- normal border, radius, and shadow use `attrs.common.border.normal`
- hover border and shadow use `attrs.common.border.hover`
- background color, image, hover, and gradient metadata use `attrs.common.background`

Designer-backed gradient backgrounds support two colors from declared metadata. More complex gradients or custom background effects require explicit custom CSS evidence before generation.

## Filter/Action Row Golden Pattern

The Event Portfolio filter/action row should be implemented with Container controls:

- parent row container is full-width: `attrs.style.widthtype = "1"`
- parent direction is `row`
- parent `align_items` is `center`
- parent `justify_content` is `space-between`
- parent `wrap` is `nowrap`
- parent margin and padding are zero
- left filter group is an inline row: `attrs.style.widthtype = "2"`, `justify_content = "flex-start"`
- right action group is an inline row: `attrs.style.widthtype = "2"`, `justify_content = "flex-end"`
- each filter wrapper container is inline/default-height: `attrs.style.widthtype = "2"` and default height, without fixed `180px` width ownership
- each filter wrapper contains exactly one Data Filter control
- each Data Filter control owns the fixed/custom `180px` sizing through its own attrs
- Status and Event Type must not retain legacy `120px` or `140px` wrapper sizing under the high-fidelity dropdown pattern
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

The fixed `180px` width belongs to the Data Filter control, not to the wrapper Container. Wrapper Containers are hierarchy holders only: they should remain inline/default-height and must not fake the Data Filter's width or height. Data Filter is a non-Container control, so its runtime-effective fixed width must use `attrs.common.positioning.widthtype = [null, "3"]`, `attrs.common.positioning.width = [null, 180]`, and `attrs.common.positioning.widthu = [null, "px"]`; `attrs.common.sizing` can constrain the control but does not replace positioning width. When decoded package evidence is available, validate the actual decoded `Resource.attrs` shape for the row, group, wrapper, and Data Filter controls before claiming control-property fidelity.

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

The Data Filter dropdown visual patterns also require `data-filter.dropdown.runtime-effective-custom-180px-width`: the runtime-effective 180px width is the non-Container Advanced-tab custom width under `attrs.common.positioning`, not a wrapper width and not a Container-style `attrs.style.width` shortcut.

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

## Designer Navigator Label Fidelity

Generated structural controls must be traceable in the Yeeflow designer Navigator:

- `id` is the stable internal generator/patch identifier.
- `label` is a human-facing descriptive label.
- `name` is a human-facing descriptive name.
- `nv_label` controls the Navigator-visible control name in the Yeeflow designer.

Important generated structural controls, including filter/action rows, filter groups, action groups, filter wrappers, and generated action containers, must include semantic `nv_label` values. Do not leave `nv_label` as generic values such as `Container`, `Text`, or `Grid`.

Example:

```json
{
  "id": "event_portfolio_filter_group",
  "type": "container",
  "label": "Event Portfolio filter controls",
  "name": "Event Portfolio filter controls",
  "nv_label": "event_portfolio_filter_group"
}
```

Decoded package `Resource` attrs and `nv_label` values are stronger evidence than normalized planner specs. If decoded evidence exists, normalized spec validation must not hide decoded package mismatches.

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

## KPI, Table, And Action Content Fidelity

Content fidelity requires the generated controls to carry the intended Yeeflow structure and behavior, not only a similar visual silhouette.

KPI/card fidelity requires a Container-based rich card structure:

- outer card container, not Grid, for the visual card
- fixed icon tile with the icon centered inside it
- inline icon/text body layout
- text stack with title, Summary/value, trend text, and helper text roles
- consistent structure across peer KPI cards

Summary values must not render raw variable names such as temp variables, internal binding tokens, or generated placeholder IDs as visible runtime text. Live KPI values may differ from design mock values, but the report must mark that as a live-data boundary rather than forcing static mock values or claiming mock values as runtime proof.

Rich table fidelity requires badge, progress, avatar/person, header hierarchy, row density, spacing, and visual hierarchy treatment when the design calls for those fields. A table that renders status, progress, or owner/person fields as plain text must not pass a design-fidelity claim when the approved design requires badge, progress-bar, or avatar/person treatment.

Runtime sample-data proof for User/person controls requires real User field values, not only correct Dynamic user control binding. Redacted runtime evidence may record that `/users/search` supplied usable user identifier provenance through `AccountID`, but it must store only redacted provenance and never raw user IDs, item IDs, tenant URLs, raw API responses, or private fields. When existing live rows have blank User/person values, runtime proof must include scoped item PATCH proof metadata. When additional sample rows are batch-created for runtime proof, verification must include retry/backoff or delayed verification metadata because immediate list queries can lag.

Collection grid-table fidelity for Event Pipeline-style tables requires the root grid-table container to use overflow hidden, header and item grids to align items center, and header/body cells to use matching padding such as 12px horizontal and 8px vertical. Progress-like columns must use a real `progress` control derived from numeric/number-like source fields, not Dynamic text or visible raw formula text. Owner/person columns must use Dynamic user/person controls bound to User/identity fields, not plain text or single-line text fields. Generated grid-table subtree controls must include semantic `nv_label` values for designer Navigator traceability.

KPI visible value controls must use `formatNumber(...)` or an equivalent proven formatting expression when presentation-quality numeric display is claimed. Large money/count metrics should use compact K/M/B display when appropriate. Rate and percentage metrics should use fixed decimal formatting, for example `formatNumber(value, 2, true)`. Long raw decimals such as `217.16666666666666` and unformatted large values such as `225000` are hard-gate issues unless an explicit waiver is documented. Runtime values remain live; mock design values are visual targets only.

A styled action Container is not enough for behavior fidelity. Action-looking Containers must include real Yeeflow action metadata. Add-list action Containers require `action-type = "5"`, target list metadata with `AppID`, `ListSetID`, and `ListID`, a visible child Heading/Text label, fixed-size styling when declared by the design, and semantic `nv_label` for designer Navigator traceability. Non-action decorative Containers do not need action metadata when they are not marked or styled as actions.

## Summary, Filter, Collection Link, And Full-App Page Fidelity

Full-app page generation must generalize the proven Event Portfolio patterns to every generated page, not only the first or best-tested page. Planning Workbench, Registration and Leads, Budget Review, Post-event Reporting, Admin, and future pages must run the same Summary, filter, action, Collection, progress, Dynamic user, and KPI formatting checks before high-quality UI or content-fidelity claims.

Summary controls used as KPI/source metrics must remain normal page child controls with `type: "summary"`. Do not insert Designer clipboard wrapper objects such as `{ "_ak_c": ..., "_ak_c_opt": ... }` into page resource `children`; those wrappers can materialize as undefined controls in Designer. Summary pivot metadata belongs in page resource `exts`, not as nested clipboard options.

Each Summary source control must have a matching page resource `exts[]` entry where `category = "___Pivot___"`, `key = "summary"`, `i` equals the Summary control id, `attr.AppID`, `attr.ListID`, and `attr.ListSetID` are present, and `attr.settings.values[]` is nonempty. COUNT Summary settings must use `{ "fieldName": "ListDataID", "func": "COUNT", "id": "ListDataID" }`. SUM and AVG Summary settings must use the selected numeric field for `fieldName` and `id`.

Summary controls must include both top-level and attrs-level temp variable metadata: `save_var`, `saveVar`, `attrs.save_var`, and `attrs.saveVar`. Visible KPI value controls must bind to those Summary temp variables and must not render raw temp variable names, formulas, or generated binding tokens as visible text.

Summary source controls must live inside a hidden metric data source Container. The host must use `attrs.common.hide = [null, true, true, true]` and `attrs.style.display = "none"`. The hidden host name, label, and `nv_label` must avoid the word `Summary` so validators and Designer heuristics do not misclassify the host as a Summary control.

Page-wide filter/action/table fidelity is required on every generated page. Expected filters must be real Data Filter controls, not static Text. Filter variables must be consumed by target Summary, Collection, or List controls. Visual Add/New action Containers must include real add-list behavior with `action-type = "5"`, target list metadata, a child Heading/Text label, and semantic `nv_label`.

Collection grid-table headers and item grids must use column gap `0`, align items center, and preserve header/body cell padding parity. Collection row links must resolve to valid form options; raw unresolved IDs are not enough and can open blank slide-in pages. Progress-like columns must use progress controls driven by numeric fields and must not render raw formula text. Dynamic user/person columns must bind to User/identity fields. If a generated page needs a field-type change, the report must identify the minimal data-list schema change required.

Final UI reports must separate generator/spec gaps, runtime rendering gaps, data-value gaps, and action behavior gaps. Passing layout, navigation, or control-property checks does not automatically prove content fidelity.

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
- `FILTER_ACTION_ROW_NOT_FULL_WIDTH`
- `FILTER_GROUP_NOT_INLINE`
- `ACTION_GROUP_NOT_INLINE`
- `FILTER_WRAPPER_SHOULD_BE_INLINE`
- `FILTER_WRAPPER_SHOULD_NOT_OWN_FIXED_FILTER_WIDTH`
- `FILTER_CONTROL_FIXED_WIDTH_MISSING`
- `FILTER_CONTROL_WIDTH_OWNER_MISMATCH`
- `LEGACY_FILTER_WRAPPER_WIDTH_DETECTED`
- `DECODED_RESOURCE_ATTR_SHAPE_NOT_VALIDATED`
- `NAVIGATOR_LABEL_MISSING`
- `NAVIGATOR_LABEL_GENERIC`
- `NAVIGATOR_LABEL_MISMATCH`
- `NON_CONTAINER_WIDTH_MODEL_MISMATCH`
- `NON_CONTAINER_CUSTOM_WIDTH_MISSING`
- `DATA_FILTER_RUNTIME_WIDTH_NOT_CUSTOM_POSITIONING`
- `CONTAINER_WIDTH_MODEL_REQUIRED`
- `CONTAINER_HEIGHT_MODEL_REQUIRED`
- `COMMON_MARGIN_PADDING_MISSING`
- `COMMON_BORDER_STYLE_MISSING`
- `COMMON_BORDER_HOVER_SHADOW_MISSING`
- `COMMON_BACKGROUND_STYLE_MISSING`
- `COMMON_BACKGROUND_IMAGE_SHAPE_INVALID`
- `COMMON_BACKGROUND_GRADIENT_TOO_COMPLEX`
- `CONTAINER_RULE_APPLIED_TO_NON_CONTAINER`
- `KPI_CARD_STRUCTURE_MISSING`
- `KPI_CARD_ICON_TILE_MISSING`
- `KPI_CARD_ICON_TILE_SIZE_MISMATCH`
- `KPI_CARD_ICON_NOT_CENTERED`
- `KPI_CARD_BODY_LAYOUT_MISMATCH`
- `KPI_CARD_TEXT_STACK_MISSING`
- `KPI_CARD_SUMMARY_VALUE_MISSING`
- `KPI_CARD_SUMMARY_HIERARCHY_MISMATCH`
- `KPI_CARD_TREND_TEXT_MISSING`
- `KPI_CARD_HELPER_TEXT_MISSING`
- `KPI_CARD_GRID_USED_WHERE_CONTAINER_REQUIRED`
- `SUMMARY_VALUE_RAW_VARIABLE_VISIBLE`
- `RAW_VARIABLE_TEXT_VISIBLE`
- `MOCK_VALUE_FORCED_AS_RUNTIME_PROOF`
- `LIVE_KPI_VALUE_BOUNDARY_MISSING`
- `TABLE_RICH_CELL_TREATMENT_MISSING`
- `TABLE_STATUS_BADGE_MISSING`
- `TABLE_PROGRESS_BAR_MISSING`
- `TABLE_OWNER_AVATAR_MISSING`
- `TABLE_HEADER_HIERARCHY_MISMATCH`
- `TABLE_ROW_DENSITY_MISMATCH`
- `TABLE_PLAIN_SCAFFOLD_RENDERING`
- `ACTION_CONTAINER_ACTION_TYPE_MISSING`
- `ACTION_CONTAINER_ACTION_TYPE_MISMATCH`
- `ACTION_CONTAINER_TARGET_LIST_MISSING`
- `ACTION_CONTAINER_TARGET_LIST_INCOMPLETE`
- `ACTION_CONTAINER_CHILD_LABEL_MISSING`
- `ACTION_CONTAINER_CHILD_LABEL_MISMATCH`
- `ACTION_CONTAINER_STYLED_BUT_NOT_ACTIONABLE`
- `ACTION_CONTAINER_NAVIGATOR_LABEL_MISSING`
- `ACTION_CONTAINER_FIXED_SIZE_MISMATCH`
- `RUNTIME_SAMPLE_USER_ID_PROVENANCE_MISSING`
- `RUNTIME_SAMPLE_USER_ID_NOT_REDACTED`
- `RUNTIME_SAMPLE_USER_FIELD_PATCH_PROOF_MISSING`
- `RUNTIME_SAMPLE_BATCH_CREATE_PROOF_MISSING`
- `RUNTIME_SAMPLE_VERIFY_RETRY_MISSING`
- `COLLECTION_GRID_TABLE_OVERFLOW_HIDDEN_MISSING`
- `COLLECTION_GRID_TABLE_ALIGN_CENTER_MISSING`
- `COLLECTION_GRID_TABLE_CELL_PADDING_MISMATCH`
- `COLLECTION_PROGRESS_CONTROL_MISSING`
- `COLLECTION_PROGRESS_SOURCE_NOT_NUMERIC`
- `COLLECTION_PROGRESS_RAW_FORMULA_VISIBLE`
- `COLLECTION_DYNAMIC_USER_CONTROL_MISSING`
- `COLLECTION_DYNAMIC_USER_FIELD_NOT_USER_TYPE`
- `COLLECTION_NV_LABEL_MISSING`
- `KPI_VALUE_FORMAT_MISSING`
- `KPI_COMPACT_NUMBER_FORMAT_MISSING`
- `KPI_FIXED_DECIMAL_FORMAT_MISSING`
- `KPI_RAW_LONG_DECIMAL_VISIBLE`
- `KPI_UNFORMATTED_LARGE_NUMBER_VISIBLE`

## Supplier Runtime And Design Fidelity Gates

The Supplier Onboarding & Risk Review runtime/design study adds a focused hard-gate layer for future full-application generation. Design images are implementation contracts, not inspiration. Runtime proof must use the exact installed application ListSetID, and local semantic JSON is not enough when export/runtime-proven Yeeflow metadata shapes are available.

Before app generation starts for a designed Yeeflow application, create one canonical PNG per planned page and a `design-image-manifest.json`. The canonical page artifact is `assets/generated-ui/<app-slug>/01-<page-slug>.design.png`, `02-<page-slug>.design.png`, and so on. Each PNG must contain exactly one app page, include the selected Yeeflow app chrome, preserve page order, and map directly to the app plan. SVG files may be generated as optional editable source files such as `01-<page-slug>.source.svg`, but SVG is not the canonical comparison artifact. A combined `00-design-board.png` is useful for review but cannot replace per-page PNGs.

Runtime proof must record the final URL and page title. The final URL must start with `#/list-set/{AppID}/{ListSetID}` for the installed application. Install logs, upgrade operation IDs, root routes, designer/admin/login routes, or unrelated ListSetIDs do not prove runtime app fidelity.

Supplier validation-gap analysis adds a required proof-layer model for full end-to-end app generation. A final report must not collapse package/schema acceptance, signing, install/upgrade, runtime browser evidence, and pixel/design comparison into one generic pass. Report and validate these layers separately: `schemaValidation`, `appPlanConformance`, `designContractValidation`, `controlBindingValidation`, `exactMetadataShapeValidation`, `idStabilityValidation`, `signVerify`, `installOrUpgrade`, `runtimeBrowserProof`, and `pixelComparison`. Schema validation does not prove UI correctness. Signing, install, or upgrade API acceptance does not prove runtime correctness. Runtime browser proof must use the decoded installed ListSetID URL, and canonical PNG pixel comparison must remain a separate layer.

Horizontal app chrome active-state styling is runtime-sensitive. Do not treat `ListSet.LayoutView.attrs["navigator-menu"]` active-state metadata or `LayoutView.customcss` as runtime-proven active text/background/border styling unless export/runtime proof shows the mechanism works. If active navigation styling is required, final acceptance requires Chrome DOM and computed-style proof for `.ak-listset-new-navigation-item.active`: a unique injected style tag exists, the style text includes the intended selector, the active navigation item exists, the computed background is transparent such as `rgba(0, 0, 0, 0)`, the computed text color is blue such as `rgb(37, 99, 235)`, and the computed bottom border is blue, solid, and nonzero such as `3px solid rgb(37, 99, 235)`. If a CSS injector is needed, place a hidden nonvisual `codein` control inside a rendered page container such as the first meaningful `Content` container; execution-critical `codein` controls directly under the visual resource root are an execution risk. After signing or upgrading page resources or app chrome styling, runtime verification must use a fresh top-level URL load with a safe cache-busting query before the hash route. Reports must distinguish stale browser/runtime resource cache from failed package generation.

Supplier-derived full-page fidelity requires real Yeeflow controls and bindings:

- all required design sections must map to implementation controls
- KPI card count and core KPI labels must match the page design/spec
- required chart/table/filter sections must not be dropped
- selected Yeeflow application chrome/layout style must remain consistent across all pages
- filter-looking UI must use real Data Filter controls with AppID, ListSetID, ListID, field metadata, display/value fields where applicable, and filter variables consumed by target collections/tables
- filter/action rows must be Container-based and important containers must use semantic `nv_label`
- Collection/grid-table controls must bind to the intended list by AppID, ListSetID, ListID, Type, and Title, and row detail links must resolve to valid form/layout choices
- line, pie, bar, and other required analytics sections must use real Yeeflow analytics controls unless the user explicitly allows approximation
- progress columns must use real progress controls or proven visual progress components with value, range, and style metadata
- Summary/KPI controls must keep normal Summary controls, complete pivot metadata, hidden source containers, Summary temp-variable binding, and formatted visible KPI values

The Supplier validator is `scripts/inspect-supplier-runtime-design-fidelity.mjs`; regression coverage is in `scripts/test-supplier-runtime-design-fidelity-gates.mjs`.

## Full-Page Design Blueprint Workflow

Customer Support Case Triage training adds a staged full-application generation gate. A canonical page design must be a full-page implementation artifact, not only a first-viewport mockup. Each per-page `.design.png` must show every planned section, lower-page region, table/form/card/filter/action/detail area, and page end unless the page truly has no below-fold content. SVG source files and `00-design-board.png` may support review but cannot replace canonical per-page PNGs.

Before Yeeflow resource generation, every page must have a page implementation blueprint with page purpose, selected layout/chrome, full section list, design-to-control mapping, control hierarchy, control type, `id`, semantic `nv_label`, parent/child relationships, exact Yeeflow property paths, style rules, bindings, Summary/KPI aggregation, Data Filter variables and target consumption, Collection/detail links, Dynamic user/person bindings, progress/status/badge bindings, action metadata, and a runtime proof plan. Every property path must validate against the normalized control-property registry or the evidence-backed extension registry.

After resource generation, decoded resource parity validation must prove that every blueprint section/control/type/property/binding/action/link exists and that no design element was replaced with static placeholder text or raw variable output. Package/sign/upgrade cannot start until functional spec, app plan, full-page design images, blueprint validation, control-property contract validation, decoded resource parity, and local hard gates are complete. Runtime proof cannot claim success until Chrome/runtime evidence exists.

Use:

- `scripts/inspect-full-page-design-artifacts.mjs`
- `scripts/inspect-page-implementation-blueprint.mjs`
- `scripts/compare-blueprint-to-decoded-resource.mjs`

Regression coverage is in `scripts/test-full-page-design-blueprint-generation-gates.mjs`.

Supplier runtime/design finding codes include:

- `RUNTIME_LISTSET_ID_MISMATCH`
- `INSTALL_LOG_ID_USED_AS_LISTSET_ID`
- `RUNTIME_URL_NOT_APPLICATION`
- `RUNTIME_PROOF_LANDED_IN_DESIGNER`
- `RUNTIME_PAGE_TITLE_MISSING`
- `VALIDATION_PROOF_LAYER_COLLAPSED`
- `SCHEMA_PASS_USED_AS_UI_PROOF`
- `API_ACCEPTANCE_USED_AS_RUNTIME_PROOF`
- `CONTROL_BINDING_GRAPH_INCOMPLETE`
- `DECODED_LISTSET_ID_NOT_RUNTIME_URL`
- `DESIGN_CONTROL_MAPPING_MISSING`
- `NAV_ACTIVE_STYLE_METADATA_UNPROVEN`
- `NAV_ACTIVE_STYLE_RUNTIME_PROOF_MISSING`
- `NAV_ACTIVE_BACKGROUND_MISMATCH`
- `NAV_ACTIVE_TEXT_COLOR_MISMATCH`
- `NAV_ACTIVE_BOTTOM_BORDER_MISMATCH`
- `LAYOUTVIEW_CUSTOMCSS_NOT_RUNTIME_INJECTED`
- `CUSTOM_CSS_STYLE_TAG_MISSING`
- `CUSTOM_CSS_SELECTOR_NO_EFFECT`
- `CODEIN_ROOT_CHILD_EXECUTION_RISK`
- `CODEIN_EXPECTED_TO_EXECUTE_NOT_IN_RENDERED_CONTAINER`
- `CODEIN_RUNTIME_NODE_MISSING`
- `STYLE_INJECTOR_TAG_MISSING`
- `STYLE_INJECTOR_SELECTOR_MISSING`
- `STYLE_INJECTOR_SELECTOR_NO_EFFECT`
- `RUNTIME_LAYOUT_CACHE_STALE`
- `FRESH_LOAD_RUNTIME_PROOF_REQUIRED`
- `APP_CHROME_RUNTIME_COMPUTED_STYLE_REQUIRED`
- `PACKAGE_VALID_BUT_RUNTIME_STYLE_FAILED`
- `RUNTIME_DOM_SELECTOR_PROOF_MISSING`
- `DESIGN_SECTION_MISSING`
- `KPI_CARD_COUNT_MISMATCH`
- `PAGE_BACKGROUND_MISMATCH`
- `DESIGN_CHART_SECTION_NOT_IMPLEMENTED`
- `APP_CHROME_STYLE_MIXED`
- `DATA_FILTER_CONTROL_STATIC_TEXT`
- `DATA_FILTER_BINDING_MISSING`
- `DATA_FILTER_FIELD_METADATA_INVALID`
- `DATA_FILTER_VARIABLE_NOT_USED_BY_TARGET_COLLECTION`
- `DATA_FILTER_RUNTIME_CONTROL_NOT_RENDERED`
- `FILTER_ACTION_CONTAINER_WIDTH_NOT_INLINE`
- `FILTER_ACTION_CONTAINER_NV_LABEL_MISSING`
- `FILTER_ACTION_ROW_NOT_CONTAINER_BASED`
- `COLLECTION_DATA_SOURCE_MISMATCH`
- `COLLECTION_LISTSETID_MISSING`
- `COLLECTION_DETAIL_LINK_INVALID`
- `COLLECTION_FILTER_TARGET_MISMATCH`
- `ANALYTICS_CONTROL_APPROXIMATION_USED`
- `ANALYTICS_CONTROL_TYPE_MISMATCH`
- `ANALYTICS_DATA_BINDING_INCOMPLETE`
- `PROGRESS_CONTROL_MISSING`
- `PROGRESS_RENDERED_AS_RAW_TEXT`
- `PROGRESS_STYLE_METADATA_MISSING`
- `SUMMARY_CONTROL_TYPE_INVALID`
- `SUMMARY_PIVOT_METADATA_INCOMPLETE`
- `SUMMARY_COUNT_FIELD_NOT_LISTDATAID`
- `SUMMARY_SOURCE_CONTAINER_VISIBLE`
- `KPI_RAW_VARIABLE_VISIBLE`
- `KPI_VALUE_FORMAT_INVALID`
- `DESIGN_CANONICAL_PNG_MISSING`
- `DESIGN_CANONICAL_PNG_NOT_ONE_PAGE`
- `DESIGN_PAGE_COUNT_MISMATCH`
- `DESIGN_PAGE_FILENAME_UNMAPPED`
- `DESIGN_PAGE_ORDER_MISMATCH`
- `DESIGN_LAYOUT_CHROME_MISMATCH`
- `DESIGN_USES_SVG_AS_CANONICAL`
- `DESIGN_BOARD_USED_AS_PAGE_ARTIFACT`
- `PIXEL_COMPARE_INPUT_NOT_CANONICAL_PNG`
- `PIXEL_COMPARE_PAGE_SCREENSHOT_MISSING`
- `PIXEL_COMPARE_PAGE_MAP_MISSING`
- `PIXEL_COMPARE_RENDERED_FROM_SVG_WARNING`
- `APP_GENERATION_STARTED_WITHOUT_PAGE_DESIGN_PNGS`
- `UI_IMPLEMENTATION_PAGE_DESIGN_UNMAPPED`

## Future Work

Future implementation can add a latest-artifact manifest guard, runtime proof freshness validator, and richer content-fidelity report schema. Those are not implemented by this standard unless an executable validator exists and is included in aggregate hard gates.
