# Custom Code Dashboard Golden Reference

`dashboard-page-layouts-custom-code` is a registered alternate page-level Dashboard template. It does not replace the default `dashboard-page-layouts-v1.1`.

The canonical exported page resource is `docs/reference/dashboard-page-layout-custom-code.template.json`; registry entry: `docs/reference/dashboard-page-layout-templates.json`. The detailed design and normalization provenance are in `docs/templates/dashboard-page-layouts-custom-code/`. Proof is export-backed and locally validator-backed; rendered Custom Code, reactive variables, native filter consumers and CSS-ID action invocation require runtime evidence on the actual generated page.

## Selection and requirement traceability

Prefer this template for an explicit user request to implement the Dashboard primarily through Custom Code. Consider it for a customer image/mockup combined with complex business presentation or interactions. A screenshot alone is not proof of behavior. Capture the request, reference image, business functions, interactions and device expectations in Functional Specification source/requirements sections with stable requirement markers. Do not put control JSON, variable IDs or CSS selectors into the Functional Specification.

App Plan section 14 must explicitly select this template in the existing Dashboard Page Layout Template Selection table and preserve the originating requirement markers. Include the three planning sections below, even when a particular integration is not needed; write an explicit `None — <reason>` row for unused integrations. Standalone Dashboard plans use the same tables and rules. No generic dataset or KPI should be synthesized merely because the page selects this template.

## Required planning tables

### Custom Code Dashboard Composition

| Dashboard Page | Requirement Marker | Header Title | Header Description | Header Operations | Retained Panels | Top Content | Bottom Content | Selection Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Page> | <REQ-...> | <Text or None> | <Text or None> | <Real actions or None> | <left_side_panel + primary_content_area + right_side_panel, or a subset retaining primary> | <Purpose or None> | <Purpose or None> | <Explicit request / image-backed complex page / custom business presentation> |

### Custom Code Module Plan

| Dashboard Page | Region | Module Key | Layout Pattern | Business Function | Input Values | Writable Outputs | Implementation Artifact | Change / Refresh Behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Page> | <retained region> | <business module name> | stack / <registered region Grid label> | <bounded function> | <values or None> | <temp-variable purpose or None> | <planned Custom Code artifact> | <input-change reaction or static> |

### Custom Code Communication and Native Integration

| Dashboard Page | Kind | Producer / Trigger | Shared Value / Action Purpose | Consumers / Target | Initial / Reset Behavior | Timing / Refresh Rule |
| --- | --- | --- | --- | --- | --- | --- |
| <Page> | Temp variable / Native Data Filter / Native Button + Form Action / None | <module, filter or interaction> | <business state or action> | <consumers or actual target> | <behavior> | <change reaction and action ordering> |

A module plan is not executable Custom Code. Before materialization, produce the concrete control artifacts through the Custom Code generator and bind their parameters to declared page dependencies. Keep code/control payloads in a separate reviewed build context, not embedded in the business planning tables.

## Shared materialization contract

`scripts/lib/dashboard-custom-code-template.mjs` exports `buildCustomCodeDashboard({ name, composition })`. The full-app materializer dispatches to this helper for this exact template, taking a page-name keyed build-context object via `customCodeDashboards` or CLI `--custom-code-dashboards <file.json>`. A missing concrete composition fails; it never falls back to a generic Collection or empty placeholders.

The build-context `composition` contains:

- `panels`: retained canonical panel names, including `primary_content_area`.
- `header`: optional `title`, `description`, and concrete action-bound `operations` controls. Empty header parts are removed.
- `modules`: ordered entries `{ region, layout, controls }`; `layout` is `stack` for one or more vertically stacked full-width concrete controls, or a region-owned internal Grid's `nv_label`. Each entry's controls must be export-shaped, populated artifacts. Native filters and native action-host controls may coexist with Custom Code in a region.
- `dependencies`: declared `tempVars`, `filterVars`, `actions`, `formAction`, `exts`, and `ReportIds` as required by the concrete controls. Namespace them per page and module; do not supply source-tenant identities as generated identities.

The same helper is the page-body entry point for standalone preparation. Existing standalone Core build-result, source binding, issued identity, dependency closure and wrapper validation requirements still apply; this helper does not fabricate them or return a wrapper-ready Core artifact. Use the supported Core materialization context to carry the prepared body. Unsupported Core preparation is an explicit failure, not permission to handcraft its provenance. `build-ydp-wrapper.js` and `validate-ydp.js` continue to enforce that contract.

## Composition rules

- Title, description, individual operation controls, `Operations`, and the entire visible header are optional. Remove unused wrappers. Page metadata title remains required.
- Top/bottom regions and side panels are optional. Preserve `main > content > main_content_area > main_content_wrapper` and non-empty primary content. Keep meaningful native filter/action hosts during cleanup.
- Desktop tracks: all panels `1fr 2.5fr 1.5fr`; left + primary `1fr 2.5fr`; primary + right `2.5fr 1fr`; primary only `1fr`. Delete the actual unused tracks, not just the controls.
- Tablet tracks retain `1fr 3fr` when left + primary remain; right spans the next full row if also retained. Without left, stack retained panels in one column. Mobile is one column with explicit right span 1. These reduced-layout tablet variants require populated runtime verification.
- Internal Grid patterns are optional. Duplicate direct slots for vertically stacked modules. Preserve exported responsive attributes for retained internal Grids. The user accepted two tablet columns inside `left_side_3_columns_grid`.
- Recognize placeholders by `type=codein` AND `nv_label=custom_code_placeholder`; enumerate, do not treat the label as unique. Fill/rename or remove every placeholder. Generate new control IDs for clones while preserving existing IDs on in-place updates.
- Split code by business function. Share values through declared temporary variables bound to output targets and consumer inputs. Verify consumers update or re-query on changes and avoid stale-response races.
- Prefer native Data Filters for supported search/select/radio criteria; pass their own filter variables into consuming Custom Code parameters. Implement custom filtering only when native behavior does not meet the requirement.
- Prefer native Button + Form Action for record opening and page actions. Configure unique CSS IDs distinct from UUIDs and Navigator labels. Write intended context before invoking the action. Programmatic triggers survive header cleanup; visually hidden triggers must remain rendered/invocable.

## Validation and evidence

The page-layout validator dispatches to `validateCustomCodeDashboard` for this registry entry. It checks the native shell, panel ordering, exact outer tracks, right spans, internal Grid shapes, unique control IDs and generated-final placeholder/script/empty-region rules. Common action-resolution and page background/padding checks continue to run. The source reference is allowed to contain empty placeholders; generated output is not.

Planning gates require all three sections for a selected Custom Code page. The standalone trace must select the same template and contain planned sections. Match the concrete modules and dependency wiring to the plan before delivery. Runtime tests must independently cover data, temp-variable reactions, filter propagation and native action invocation; local layout validation does not prove these behaviors.
