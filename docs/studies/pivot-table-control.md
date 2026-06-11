# Pivot Table Data Analytics Control

## Source

- Source export: `/Users/Renger/Downloads/CRM - Customer relationship management (1).yap`
- Target page: root dashboard page `Dashboard`
- Inspector: `scripts/inspect-pivot-table-controls.mjs`
- Decode policy: export decoded read-only; raw `.yap` and raw decoded payloads are not committed.

## Proof Boundary

- Pivot Table Dashboard usage in this CRM export: export-proven.
- Data List form availability: product/user-understanding-backed in this pass.
- Approval Form and Data List Public Form non-availability: product/user-understanding-backed in this pass.
- Data List source usage, field references, aggregations, date grouping, static filters, and style sections described below: export-proven from the CRM Dashboard.
- Document Library, Form Report, and Data Report as supported Pivot Table source classes: product/user-understanding-backed unless a later export proves exact source bindings.
- Pivot Table filter-variable support: product/user-understanding-backed; this export contains Data Filter variables on the page but no Pivot Table condition that consumes them.
- Runtime import/open/render/interaction behavior: not runtime-proven in this pass.

## What Pivot Table Is

Pivot Table is a Data Analytics control for multi-dimensional data summaries. Unlike simpler chart controls that usually bind one group axis and one value measure, Pivot Table defines rows, columns, and values together, can create nested row/column headers, and can show totals across grouped data.

Product context says Pivot Table is available on Dashboard pages and Data List forms. It is not available on Approval Forms or Data List Public Forms. It belongs to the same Data Analytics family as Pie chart, Column chart, Line chart, and Summary.

## Export Schema Summary

The visible dashboard control is stored in the embedded Type `103` page JSON:

- `children[]...type = "pivot-table"`
- `children[]...id = <control id>`
- `children[]...attrs.rows`, `attrs.columns`, and `attrs.values` hold layout sizing/visibility metadata keyed like `pt_c_0`.
- `children[]...attrs.header`, `attrs.body`, `attrs.subtotal`, and `attrs.grandtotal` hold table style sections.
- Some controls include `attrs.showsorter = false` and `attrs.values.showtotal = false`.

The data analytics binding is stored separately in the page `exts[]` array:

- `category = "___Pivot___"`
- `key = "PivotTable"`
- `i = <matching pivot-table control id>`
- `attr.ListID = <source resource id>`
- `attr.ListSetID = <app/listset id>`
- `attr.settings.rows[]`
- `attr.settings.columns[]`
- `attr.settings.values[]`
- optional `attr.settings.Conditions[]`

Generation rule: a generated Pivot Table must create both the visible `pivot-table` control and a matching `page.exts[]` item whose `i` equals the control id.

## Inventory

The CRM Dashboard contains 14 Pivot Table controls.

| Control | Source | Rows | Columns | Values | Aggregation | Date grouping | Filters | Style sections | Proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<pivot:1>` | Data list `<source:12>` | Deal type, owner | Close date | Amount | COUNT | DAY | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:2>` | Data list `<source:12>` | Deal type, owner | Close date | Amount | COUNT | MONTH | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:3>` | Data list `<source:12>` | Deal type, owner | Close date | Amount | COUNT | QUARTER | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:4>` | Data list `<source:12>` | Deal type, owner | Close date | Amount | COUNT | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:5>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | COUNT | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:6>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | COUNT_DISTINCT | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:7>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | SUM | YEAR | static conditions | header/body/subtotal/grandtotal | export-proven |
| `<pivot:8>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | AVG | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:9>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | MAX | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:10>` | Data list `<source:12>` | Deal type, owner | Source, close year | Amount | MIN | YEAR | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:11>` | Data list `<source:3>` | Country/region | Industry | record id | COUNT | none | none | header/body/subtotal/grandtotal | export-proven |
| `<pivot:12>` | Data list `<source:3>` | Country/region | Industry | record id | COUNT | none | none | header/body/subtotal/grandtotal, sorter/total disabled | export-proven |
| `<pivot:13>` | Data list `<source:3>` | Country/region | none | record id | COUNT | none | none | header/body/subtotal/grandtotal, sorter/total disabled | export-proven |
| `<pivot:14>` | Data list `<source:3>` | none | Industry | record id | COUNT | none | none | header/body/subtotal/grandtotal, sorter/total disabled | export-proven |

## Data Sources

The sample export proves Data List sources. Each Pivot Table `attr.ListID` resolves to an included child resource whose fields are used by `settings.rows[]`, `settings.columns[]`, `settings.values[]`, and optional `settings.Conditions[]`.

Validation rules:

- `attr.ListID` must resolve to an included data source.
- Supported source classes are Data List, Document Library, Form Report, and Data Report.
- Unknown source types should warn first unless an export or runtime proof shows the shape is invalid.
- Row, column, value, and condition fields must resolve to fields on the selected source or known system fields such as `ListDataID`, `Created`, and `Modified`.

## Rows, Columns, And Values

Rows and columns use field descriptor objects:

- `fieldName`
- `label`
- `fieldType`
- `type`
- `func`
- `id`
- optional `attr`

Rows in the sample use normal grouping fields with empty `func`. Columns use both normal grouping fields and date/time grouping functions. Values use a field plus aggregation in `func`, with `id` commonly shaped as `<fieldName>_<AGGREGATION>`.

Generation rules:

- Choose row fields for categorical grouping.
- Choose column fields for time, category, or second-dimension grouping.
- Choose value fields for record counts or numeric measures.
- Use `ListDataID` or another stable field with `COUNT` when counting records.
- Use numeric/currency fields for `SUM`, `AVG`, `MIN`, and `MAX`.

## Aggregations

Export-proven value aggregations:

- `COUNT`
- `COUNT_DISTINCT`
- `SUM`
- `AVG`
- `MAX`
- `MIN`

Validation rules:

- Value entries should declare an aggregation.
- Unknown value aggregation should warn first.
- `SUM`, `AVG`, `MIN`, and `MAX` should target numeric/currency fields where detectable.
- `COUNT` and `COUNT_DISTINCT` can count records or count values.

## Date/Time Grouping

Export-proven date grouping functions:

- `DAY`
- `MONTH`
- `QUARTER`
- `YEAR`

The sample uses a date field as a column dimension and serializes grouping in the axis field descriptor `func`. The field descriptor id follows `<fieldName>_<GROUPING>`.

Validation rules:

- Date grouping should only be applied to date/time fields where detectable.
- Unknown row/column grouping should warn first.
- Generated apps should prefer month/quarter/year for dashboard readability unless daily detail is explicitly useful.

## Filters And Data Filter Variables

One Pivot Table uses static `attr.settings.Conditions[]` entries with:

- `key`
- `pre`
- `left`
- `op`
- `right`
- `showCus`

The Dashboard also has `filterVars[]` and multiple Data Filter controls. Other analytics controls consume those variables, but the inspected Pivot Table conditions do not. Product context says Pivot Tables can use Data Filter variables; generation should use the same expression-token shape as other Data Analytics controls when a Pivot Table is meant to react to dashboard filters.

Validation rules:

- Condition `left` fields must resolve to the selected source fields.
- Filter variable expression tokens such as `__filter_<filterVar>` must resolve to `page.filterVars[]`.
- Filter variable operator compatibility should warn first until more exports prove operator/value semantics.

## Styling

Export-proven style sections:

- `attrs.header`
- `attrs.body`
- `attrs.subtotal`
- `attrs.grandtotal`
- optional `attrs.showsorter`
- optional `attrs.values.showtotal`

The sample styles headers with a dark neutral background and white text, body cells with padding and borders, and grand totals with stronger font weight plus a subtle tinted background.

Generation guidance:

- Style Pivot Tables for readability by default.
- Use clear table headers.
- Use subtle header and grand-total backgrounds.
- Align numeric values consistently.
- Avoid overly narrow columns.
- Avoid excessive nested groups unless they answer a real business question.
- Use nearby title or description context when the Pivot Table's row/column meaning is not obvious.

## Generator Rules

- Use Pivot Table for multi-dimensional summaries where users need row/column analysis.
- Generate Pivot Tables only on Dashboard pages or Data List forms.
- Do not generate Pivot Tables on Approval Forms or Data List Public Forms.
- Create the visible `pivot-table` control and matching `page.exts[]` data analytics entry.
- Resolve the source resource before handoff.
- Resolve every row, column, value, and filter condition field before handoff.
- Use count aggregation for record counts.
- Use sum/average/min/max for numeric or currency metrics.
- Use date grouping only on date/time fields.
- Wire Data Filter variables into `Conditions[]` only when the variables exist on the page.
- Include readable header/body/grand-total styling by default.

## Validator Rules Added

- Dashboard Pivot Table controls require matching `page.exts[]` entries.
- `page.exts[]` Pivot Table source ListID must resolve.
- Row, column, value, and condition fields must resolve.
- Value aggregation must be known or warning-first.
- Numeric aggregations must target numeric/currency fields where detectable.
- Date grouping must target date/time fields where detectable.
- Filter variable references must resolve to `page.filterVars[]`.
- Pivot Table is blocked on Approval Forms and Data List Public Forms for generated final packages.
- Import-readiness inspection includes the Pivot Table inspector.
