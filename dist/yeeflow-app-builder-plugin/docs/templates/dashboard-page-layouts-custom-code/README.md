# Custom Code Dashboard — Golden Reference

This template provides a responsive Dashboard shell for business pages whose content is primarily implemented with Custom Code controls. The native page header, containers, and Grid modules establish the page layout; each Custom Code control supplies a bounded business module inside that layout.

**Status: registered; export-backed and locally validator-backed.** The active entry is in `docs/reference/dashboard-page-layout-templates.json`. Canonical integration rules are in `docs/standards/dashboard-page-layouts-custom-code-standard.md`. This directory retains the reviewed design and normalization evidence. Runtime behavior is not yet verified.

## Identity and artifacts

| Property | Definition |
| --- | --- |
| Template ID | `dashboard-page-layouts-custom-code` |
| Display name | Custom Code Dashboard |
| Definition version | `1.0.0` |
| Reference level | Page-level layout shell |
| Surface | Dashboard, Type `103` |
| Source | User-authored `Custom Code Dashboard.ydp` |
| Resource | Parsed `LayoutView`, version `2` |
| Selection | Explicit per-page selection in App Plan or standalone Dashboard Plan; no change to the default Dashboard template |
| Intended primary content | Custom Code (`codein`) business modules |
| Supplied business behavior | None: no data sources, custom scripts, actions, or selected-record state are implemented by the empty template |

- [definition.json](definition.json): machine-readable candidate metadata, slots, exact source Grid definitions, proposed rules, proof status, and future registration requirements. This is a documentation schema, not an executable registry entry.
- [template.normalized.json](template.normalized.json): complete parsed page layout with only the authorized metadata cleanup applied. It is not a standalone `.ydp` wrapper or a generated final page.
- [normalization-report.json](normalization-report.json): source checksum, exact changes, and static checks.

The source snapshot SHA-256 is `7dd8b0457834de06969d3c542935419786e1ea19bc50fb4d733a14c82d97389d`. This revision incorporates the user's explicit mobile right-panel span of 1 and the accepted tablet left-module density. The original Downloads file remains unchanged. Outer export-instance `AppID`, `ListID`, and `LayoutID` are not part of the normalized layout. Preserve large IDs losslessly when handling future export wrappers.

## When to select this template

Use these selection priorities:

1. **Explicit Custom Code request:** prefer this template when the user expressly requests a Dashboard whose main page functionality is implemented with Custom Code. Record that request as the selection rationale; do not require an additional argument that every native alternative is insufficient. Native filters and action buttons can still support the Custom Code modules.
2. **Reference image plus complex requirements:** consider this template when the customer supplies a screenshot/mockup and the page needs a complex arrangement, specialized business presentation, or coordinated interactions. Map the image's regions and the stated business behavior to modules before choosing the layout. An image alone neither requires Custom Code nor establishes data or interaction behavior.
3. **Other custom presentation needs:** select it when a defined business purpose benefits from custom content while retaining a consistent native page shell. Examples include:

- An operations overview with custom status cards, a specialized workload visualization, and a supporting activity panel.
- A customer or project information workspace with custom summaries and independently designed primary and supporting modules.
- A visual planning or monitoring page with compact navigation or filters at the left, the principal visualization in the center, and explanatory context at the right.

These are usage scenarios, not implemented capabilities. Any filter, navigation, data refresh, record selection, or write action must have a separate supported contract and validation.

In the absence of an explicit Custom Code request, prefer existing general Dashboard layouts for standard native reporting, and prefer the registered two-/three-panel master-detail workspace templates when their native Collection selection and detail binding meet the requirement. Use an appropriate form/workflow surface for approval submission. Three visual panels alone do not imply master-detail behavior.

Native Data Filters and native Button/Form Action integration are part of this candidate's intended composition, as defined below. Their absence from the empty export does not prohibit adding them in the planned business regions. Other native component substitutions require their supported component and dependency contracts; this candidate does not override current native Collection, Summary, or Data Analytics placement rules.

## Structural definition

```text
main [Container]
└─ content [Container]
   ├─ page_title_header [Container, optional]
   │  ├─ page_title_content [Container, optional]
   │  │  ├─ page_title_text [Text, optional]
   │  │  └─ page_title_description [Text, optional]
   │  └─ Operations [Container, optional]
   │     ├─ btn_operation_normal > btn_operation_normal_text
   │     ├─ btn_operation_normal > btn_operation_normal_text
   │     └─ btn_operation_primary > btn_operation_primary_text
   ├─ top_content_area [Container, optional]
   │  └─ custom_code_placeholder
   ├─ main_content_area [Container]
   │  └─ main_content_wrapper [Grid]
   │     ├─ left_side_panel [Container, optional]
   │     │  ├─ custom_code_placeholder
   │     │  ├─ left_side_2_columns_grid > 2 placeholders
   │     │  └─ left_side_3_columns_grid > 3 placeholders
   │     ├─ primary_content_area [Container, required]
   │     │  ├─ custom_code_placeholder
   │     │  ├─ primary_content_2_columns_grid > 2 placeholders
   │     │  ├─ primary_content_3_columns_grid > 3 placeholders
   │     │  └─ primary_content_4_columns_grid > 4 placeholders
   │     └─ right_side_panel [Container, optional]
   │        ├─ custom_code_placeholder
   │        ├─ right_side_2_columns_grid > 2 placeholders
   │        └─ right_side_3_columns_grid > 3 placeholders
   └─ bottom_content_area [Container, optional]
      └─ custom_code_placeholder
```

The reference has 51 controls: 14 Containers, 8 Grids, 5 Text controls, and 24 empty Custom Code controls. The full source is a library of placement options, not a prescription to fill all 24 slots.

Preserve the `main > content` shell, `main_content_area > main_content_wrapper`, and the non-empty `primary_content_area`. Preserve the header hierarchy only for the header parts that the page actually needs; a headerless page is valid. Preserve the exported background `#f4f7fb`, hidden built-in header, zero root padding, and responsive content padding. Content padding must not be reset to zero. Retained Grids use the exported `flex_grid` type, `columns`/`rows` shapes, spacing, and `displayLabel: [null, false]`, with tracks/spans adjusted for selected modules and panels as described below.

## Slot purpose and allowed changes

| Slot | Purpose | Source placeholders | Generated-page rule |
| --- | --- | ---: | --- |
| `page_title_header` | Optional visible page header | — | Remove the complete section when no header content/actions are needed |
| `page_title_content` | Title/description grouping | — | Remove when both text elements are unused |
| `page_title_text` | Business page title | — | Rewrite or omit; preserve typography when retained |
| `page_title_description` | Purpose or short usage guidance | — | Rewrite or omit when unnecessary |
| `Operations` | Page-level actions | — | Clone the existing operation variants; bind real actions or remove unused operations |
| `top_content_area` | Page-wide context, filters, or summary | 1 | Optional; remove if unused |
| `left_side_panel` | Compact navigation, filters, or supporting context | 6 | Optional; avoid wide/dense modules |
| `primary_content_area` | Main business content and principal task | 10 | Required and non-empty |
| `right_side_panel` | Secondary summaries, activity, explanations, or contextual actions | 6 | Optional; becomes a full-row region on tablet |
| `bottom_content_area` | Page-wide supplementary content | 1 | Optional; remove if unused |

The direct Custom Code slot in each panel is its full-row pattern. The named internal Grids provide alternative multi-column patterns. Select, duplicate, reorder, or remove these modules within their owning region according to the page plan. Adding more Custom Code controls to a selected Grid may create additional rows. Remove an unused Grid as a whole, and choose a suitable column pattern for the remaining modules rather than retaining meaningless empty cells.

### Decide what to retain before materialization

The complete reference is a menu of structures. Evaluate every visible element, control, and optional wrapper against the actual page; do not retain any of them solely because the source contains them.

- The three source operation controls are examples, not a required action count. Remove an unused operation Container and its Text together. If none is needed, remove `Operations`.
- Title and description are independently optional. If both are absent, remove `page_title_content`. If title, description, and header operations are all absent, remove `page_title_header` entirely. An operations-only header may retain just `Operations`. A page still has its Dashboard metadata title even when it has no visible title/header.
- Remove `top_content_area` and/or `bottom_content_area` when those full-width regions are not needed. A page consisting only of its main panel layout is valid.
- Remove unused side panels and the corresponding outer Grid tracks. Keep the desktop `1fr / 2.5fr` proportions for left + primary, or `2.5fr / 1fr` for primary + right; the exact supported variants are below.
- Within **any** panel, one full-width Custom Code module needs only the direct slot. Two or more vertically stacked full-width modules are formed by duplicating that direct slot as sibling controls. They do not require a two-/three-/four-column Grid.
- Keep an internal multi-column Grid only when actual modules need to sit side by side. Delete the unused Grid and all of its placeholders otherwise. These rules apply equally to left, primary, and right regions.
- Remove empty layout wrappers recursively after selection, while retaining wrappers that contain required native filters or action triggers. A programmatically invoked action button is a real dependency even if it is not a visible header action.

For example, a headerless two-panel page with two stacked left modules can use `main > content > main_content_area > main_content_wrapper`, containing `left_side_panel > custom_module_a + custom_module_b` and `primary_content_area > custom_module_c`. It needs no title section, top/bottom region, right panel, or internal multi-column Grid.

Do not move an internal Grid into another panel without explicitly adjusting and reviewing its region name and responsive contract. Do not flatten the native shell into a single page-sized Custom Code control by default. Custom modules should size to their host cell, manage their own content density and states, and avoid page-global styles that alter other modules or the native shell.

## Functional decomposition and communication

Prefer multiple independently scoped Custom Code controls, separated by page function/content, over one large control containing the entire page. Useful boundaries include navigation/selection, a main result view, a detail summary, and an activity/history module. Separate functions even when they occupy the same panel; use vertically stacked slots where appropriate. A single control is reasonable for one cohesive function, but should not be the default merely to avoid parameter wiring. No fixed minimum or source-derived module count is required.

For business relationships between modules, use **declared Dashboard temporary variables bound to module input/output parameters**:

```text
Custom Code A output parameter
  → page temporary variable
  → Custom Code B input parameter
  → B updates its display or refreshes its data
```

Declare each exchanged variable on the page and define its value type, initial/empty value, producer, consumers, and update/refresh behavior. An output parameter identifies a writable target; an input parameter reads a value. Do not confuse the output target's variable identity with its current value. Use supported parameter binding and Dashboard variable APIs during implementation; this empty-shell definition does not specify a new setter API or parameter serialization.

Examples include a selection module writing a selected record ID consumed by a detail module, or a completed action updating a refresh token consumed by a result module. Each consumer must handle input changes, not only its first render. Specify when to re-query, when to clear stale selection/results, and how to avoid feedback loops or older asynchronous responses overwriting newer results. Variable assignment by itself is not proof that every consumer refreshed.

Use a page/module namespace for unrelated variables. Sharing a variable is intentional only for the modules participating in the same business interaction. Prefer this explicit data flow over reading another module's internal DOM or storing application state in global JavaScript variables.

## Native Button and Form Action integration

For page actions and record-open interactions initiated inside Custom Code, prefer a **real native Button on the Dashboard with a bound Form Action**. Configure a unique CSS ID on that Button and expose that ID to the Custom Code module that needs to invoke it. CSS ID, `nv_label`, and the control UUID are separate identifiers; do not locate the trigger by a translated caption or assume its UUID is its CSS ID.

```text
Custom Code row/action click
  → write the intended record/context to declared temporary variables
  → invoke the native Button identified by its configured CSS ID
  → execute that Button's bound Form Action
  → open the intended detail page or perform the configured operation
```

Bind the Form Action's inputs to the intended context. For a Data List row or a Form Report row, resolve the correct target resource, actual record/submission ID, detail form, and open mode using the supported Open Resource contract. A Form Report row's displayed value must not be guessed to be the target record ID. Ensure context updates are available to the action before triggering it, so a click does not open the previously selected record.

These native triggers may live in the retained header `Operations` region when they are visible page actions, or in a dedicated action region associated with the relevant module inside a retained business region. Adding/removing a visual header must not remove a required module action trigger. Preserve each trigger's bound action and dependencies through cleanup. If a trigger is visually concealed, verify that the chosen configuration still renders an invocable element; do not assume a control hidden by a display condition exists in the DOM.

The source's three header operation examples are Containers with Text children, not native Button controls. Their existing style examples may still serve visible page operations with valid bindings. For the CSS-ID integration described here, add a supported native Button instead of assuming that a source placeholder Container supplies that contract. Native action host(s) and their wrapper(s) are explicitly allowed additions within retained business regions; do not append loose action controls to the page root.

The CSS-ID approach is the user's intended composition pattern. The exact Dashboard-host invocation, binding timing, permissions, and action result must be verified when implemented. This candidate does not implement those behaviors.

## Prefer native Dashboard Data Filters

For search, select, or radio-style filtering, first assess the matching native Dashboard Data Filter control. When it meets the requirement, put the required controls in a dedicated filter region and pass each control's filter variable as an input parameter to every Custom Code module that consumes it:

```text
Native Search / Select / Radio Data Filter
  → its Dashboard filter variable
  → consuming Custom Code input parameter
  → module applies the filter and updates/re-queries its content
```

The dedicated filter region may occupy `top_content_area` or a suitable retained panel; removing the top region does not force all filtering into Custom Code. A filter-group wrapper containing supported native filter controls is an explicitly allowed addition in those business regions. Clone supported filter/group shapes and declare their actual filter variables and option sources. Preserve the separate filter-variable and temporary-variable contracts; do not treat a filter variable as an output/write target or a temp variable by default.

Specify each filter's owning control, input value type, empty/reset behavior, consumer parameter, and query/presentation effect. Bind one variable to multiple consumers when they intentionally share the filter. Implement and verify consumer reactions when values change; a visible filter with no effect on results is incomplete. For free-text search, define the intended debounce/refresh behavior where relevant.

When native filters do not adequately express complex business criteria, implement that filtering function in a suitable Custom Code module and use the temporary-variable input/output pattern to share its results or criteria. Do not recreate all filters in code simply because the rest of the Dashboard is custom.

## Placeholder recognition and lifecycle

Match both fields:

```json
{ "type": "codein", "nv_label": "custom_code_placeholder" }
```

`nv_label` is the actual exported property. Neither `name` nor the display/type `label` is the selector. The placeholder label is deliberately non-unique; enumerate every match and locate an instance by parent path plus control ID. The two normal operation variants also share a label and require instance-aware lookup.

1. Select the page shell and the required regions/modules in a page plan.
2. Assign each retained placeholder a business role and module contract.
3. Materialize the Custom Code implementation through the supported Custom Code contract. This document does not invent script, parameter, event, or API property names for empty `attrs`.
4. Rename a filled control to a meaningful business `nv_label`, such as `project_health_summary` or `workload_visualization`.
5. Remove unused placeholders, empty internal Grids, optional panels, and page-wide regions. Recalculate outer Grid tracks and spans when panels change.

Reference control UUIDs remain stable in this candidate for comparison. Future new-page instantiation and module duplication must allocate new IDs and consistently remap references. Updates to an existing generated page preserve its existing control IDs except for intentionally added/replaced controls.

A generated final page must contain zero `custom_code_placeholder` nodes and no retained empty `codein` controls. Removing the marker alone is not completion: each retained module needs real content and validation. The empty reference itself is intentionally exempt from generated-final cleanup requirements.

## Responsive layout

The exported breakpoint keys are `1` desktop/laptop, `2` tablet, and `3` mobile. No device pixel thresholds are defined by this file; test actual Designer breakpoints and target viewport sizes separately.

| Layout | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| `main_content_wrapper` | `1fr 2.5fr 1.5fr` | `1fr 3fr` | `1fr` |
| Right panel placement | Third column | Next row, spans 2 columns | Explicitly spans 1 column |
| `left_side_2_columns_grid` | 2 | 1 | 1 |
| `left_side_3_columns_grid` | 3 | 2, accepted by the user | 1 |
| `primary_content_2_columns_grid` | 2 | 2 | 1 |
| `primary_content_3_columns_grid` | 3 | 2 | 1 |
| `primary_content_4_columns_grid` | 4 | 2 | 1 |
| `right_side_2_columns_grid` | 2 | 2 | 1 |
| `right_side_3_columns_grid` | 3 | 3 | 1 |

Outer desktop gaps are 20px and mobile gaps are 16px; tablet has no explicit gap override. Internal Grid row/column gaps are 16px at the base breakpoint. Inheritance and rendering remain runtime-sensitive.

Desktop fractions divide available space after gaps. The tablet split is approximately 25/75, not the previously discussed 30/70. Panels use Full width inside their Grid cells; old percentage `width` values remain in the export but must not be used as a second layout contract.

### Rules when removing panels

These are candidate materialization rules; the normalized reference retains its full three-panel structure. The desktop two-panel ratios are explicitly confirmed by the user: the retained side panel uses `1fr` and primary content uses `2.5fr`, regardless of which side panel remains. This does not change the full three-panel reference ratios. Tablet/mobile pruning variants remain proposed responsive defaults to verify during implementation:

| Retained panels | Desktop tracks | Tablet tracks | Mobile tracks |
| --- | --- | --- | --- |
| Left + primary + right | `1fr 2.5fr 1.5fr` | `1fr 3fr`, right spans 2 | `1fr`, every panel spans 1 |
| Left + primary | `1fr 2.5fr` | `1fr 3fr` | `1fr` |
| Primary + right | `2.5fr 1fr` | `1fr`, stack primary then right | `1fr` |
| Primary only | `1fr` | `1fr` | `1fr` |

Remove obsolete positions/spans when tracks change. No child span may exceed its parent's column count. Retain DOM reading order left, primary, right among the panels that remain. Other ratio variants require an explicit layout revision; do not silently change the baseline during business content mapping.

### Review items before promotion

- Resolved source setting: right panel `attrs.common.grid.position` is `[null, null, {"cSpan": 2}, {"cSpan": 1}]`. Tablet spans 2 and mobile explicitly spans 1. This is configuration evidence; populated mobile rendering still needs verification.
- Accepted design decision: keep the left three-column module's two tablet columns. Do not simplify this density automatically.
- The right panel relies on default direction/alignment. Verify vertical stacking after inserting representative modules.
- Header Operations retains a horizontal row on mobile. Verify real action labels fit and remove unnecessary actions.
- Verify long text, wide content, loading/error/empty states, and module height changes in desktop, tablet, and mobile. The empty placeholder screenshot is not populated-module runtime proof.

## Applied normalization

Normalization is separate from layout improvement. This snapshot changes only:

1. Remove eight enumerated legacy business `name` fields from header/operation controls. Do not add a `name` to the newly created `page_title_text` control; its source correctly omits it.
2. Replace four legacy business `label` values on Containers with `Container`. Preserve all `nv_label` values, visible texts, control IDs, control types, and styles. Generic `name: "Content"` is retained because it is not a stale business label.
3. Remove the top-level `filter` array containing exactly `filter_1` through `filter_4`, after verifying these names do not occur elsewhere in `LayoutView`. Preserve the empty `filterVars`, `tempVars`, and `exts` arrays.

Do not generalize this into deleting all `name`, `label`, or `filter` fields from future pages. A referenced filter must be retained or remapped. Preserve unknown attributes, default-dependent settings, `visualIntent`, and inactive width values until their semantics are established. Normalization preserves every responsive setting from the updated source; the mobile span change comes from the user's new export, not from the cleanup.

The normalization report records every removed/replaced field. Restoring those fields reproduces the original parsed `LayoutView` exactly; this verifies that the cleanup did not alter the layout tree or business-visible configuration.

## Required page/module planning information

Before future generation, record:

- Dashboard metadata title, target users, business purpose, and selection rationale (including an explicit user request or reference image where applicable).
- Whether visible title, description, header operations, or the entire header is omitted.
- Explicit template ID and reviewed version; retained panels and responsive variant.
- Each module's region, direct/stacked-slot or Grid pattern, business `nv_label`, and user-visible purpose; define functional boundaries rather than combining all content into one control.
- Data inputs, source fields, output targets, declared temporary variables, consumers, initial/reset values, and change/refresh behavior, where applicable.
- Custom Code implementation/template reference, supported dependencies, and loading/empty/error behavior.
- Header actions and module action triggers: native Button CSS IDs, bound Form Actions, target resources/record identity, invocation timing, and any read/write behavior.
- Native Data Filter choices, their filter variables, consuming module input parameters, and any rationale for complex custom filtering.
- Which source modules are removed, and how representative content will be verified at each breakpoint.

The empty reference contains no configured communication, action, or filter controls. Materialize the explicit temp-variable, native Button/Form Action, and native Data Filter contracts above for the actual page; none becomes operational merely by selecting the shell.

## Registration and verification path

1. Resolve the responsive review items and pin the reviewed source/version and normalized checksum.
2. Promote the reviewed page resource to the canonical reference location and add `dashboard-page-layouts-custom-code` to `docs/reference/dashboard-page-layout-templates.json`, using the existing registry schema. Do not change `defaultDashboardPageLayoutTemplateId`.
3. Add the selection, optional header/region rules, allowed slots/native filter/action regions, stacked and Grid modules, placeholder lifecycle, and panel/Grid cleanup rules to the shared Dashboard materialization path used by standalone `.ydp` and application generation.
4. Add focused checks for ID uniqueness, correct placeholder matching, source-domain cleanup, dependency closure, responsive spans, panel/header/module pruning, and zero placeholders in generated final pages. Include positive cases for headerless pages and stacked direct Custom Code slots; check temp-variable producers/consumers, filter-variable input wiring, native Button CSS-ID uniqueness, action context ordering, and preservation of programmatic triggers. Preserve existing template behavior.
5. Verify Designer editability and populated runtime at desktop/tablet/mobile sizes, then record exact proof scope. Data and actions require their own runtime evidence.
6. Plugin training is now authorized and implemented locally; publication and installed-cache activation are separate from source/dist validation.

Current local proof includes export parsing, metadata normalization, registry integration, shared builder routing, panel/header cleanup, App Plan and standalone plan gating, and wrapper fixture round-trip checks. See the training report for executed checks. Designer import, populated responsive rendering, Custom Code runtime, and business-data behavior remain unverified.
