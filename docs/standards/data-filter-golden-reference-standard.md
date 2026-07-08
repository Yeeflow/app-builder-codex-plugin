# Data Filter Golden Reference Standard

## Purpose

`dashboard_standard_filter_group` is the standard golden reference wrapper for generated pages that contain two or more page-level Data Filter controls.

The template is based on the current exported `flex_grid` standard filter group visual contract. It preserves the approved responsive Grid shell for page-level filters and the approved child filter label, width, dropdown, placeholder, and radius settings. Generators may map child filter labels, placeholders, data sources, source fields, bindings, and downstream consumer linkage to the target application, but must not rebuild the wrapper or child filter visual contract from scratch.

## Registry

The canonical registry is:

`docs/reference/data-filter-golden-references.json`

The template source is:

`docs/reference/data-filter-standard-filter-group.template.json`

The approved template id is:

`dashboard_standard_filter_group`

## Applicable Surfaces

Use this template on any generated page or form surface when two or more page-level Data Filter controls are present:

- Dashboard pages
- Custom Data List forms
- Approval form submission pages
- Approval form task pages
- Data list workflow task forms
- Schedule workflow task forms

The rule applies to Approval task pages regardless of whether they belong to an Approval form, a Data list workflow, or a Schedule workflow.

## Data Filter Controls Covered

The grouping rule applies to page-level filters such as:

- `select-filter`
- `radio-filter`
- `checkbox-filter`
- `relative-period`
- `hierarchy-filter`
- `sorting-filters`

Local Collection toolbar search controls are not part of this grouping rule. For example, a search box inside a Collection template operation bar follows that Collection template's own contract.

## Required Grouping Rule

If a generated page or form contains two or more page-level Data Filter controls, every one of those controls must be inside a `dashboard_standard_filter_group` Grid.

Loose sibling filters, ad hoc filter wrappers, invented filter rows, simplified Grid shapes, and copied root shells are invalid.

## Locked Wrapper Contract

The `dashboard_standard_filter_group` wrapper must preserve:

- root identity `dashboard_standard_filter_group`
- control type `flex_grid`
- label `Standard filter group`
- `displayLabel = [null, false]`
- `attrs.ver = 1`
- desktop/laptop 4-column Grid: `attrs.columns["1"].list` has four `1fr` tracks
- tablet 2-column Grid: `attrs.columns["2"].list` has two `1fr` tracks
- mobile 1-column Grid: `attrs.columns["3"].list` has one `1fr` track
- `attrs.rows["1"]` with one `auto` row
- column gap 16px via `attrs.cgap` / `attrs.cgapU`
- row gap 16px via `attrs.rgap` / `attrs.rgapU`
- exported child filter visual contract

Do not replace the wrapper with a newly invented container or a simplified Grid that only looks similar. In particular, `attrs.columns = { "count": ..., "type": "repeat", "minmax": [...] }` is not Designer-safe and must fail validation.

## Editable Child Filter Mapping

The generator may update these child filter values according to the App Plan:

- visible label text
- placeholder text
- source list metadata
- source field
- display field
- value field
- binding/filter variable
- downstream consumer linkage
- relative-period field and allowed choices when the business field changes

The generator must preserve:

- `attrs.lab.ty = [null, "xs-light"]`
- `attrs.lablay = [null, "top"]`
- placeholder color
- filter radius
- fixed-width positioning with custom width 200
- child filter margin and padding contract
- dropdown body shadow and radius

## App Plan Requirements

When a Dashboard, custom Data List form, Approval form submission page, Approval task page, Data list workflow task form, or Schedule workflow task form plans two or more page-level Data Filter controls, the App Plan must state that the filters use `dashboard_standard_filter_group`.

The App Plan may describe business labels and data sources, but must not include generated `ListID`, `ListSetID`, runtime field storage IDs, or raw copied control JSON.

## Generated-Final Validation

Generated-final validation must fail when:

- two or more page-level Data Filter controls exist outside `dashboard_standard_filter_group`
- the wrapper identity is missing
- the wrapper layout contract is mutated
- the wrapper is not a `flex_grid`
- the wrapper uses simplified `count/type/minmax` Grid properties instead of the export-proven 4/2/1 responsive `columns` object
- child filter label typography, label layout, placeholder color, radius, or fixed-width positioning is missing
- the generated package uses a simplified or invented filter wrapper

Passing this gate proves export-shape and placement conformance only. Runtime filter linkage still requires separate runtime proof.
