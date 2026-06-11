# Timeline Controls And Dynamic Controls Study

## Feature Overview

This study covers the Yeeflow Vertical Timeline and Horizontal Timeline controls from `Company Overview (1).yap`, focused on dashboard usage with Dynamic controls inside timeline item templates.

Reference product docs:

- [Vertical timeline](https://<yourdomain>.yeeflow.com/<redacted-path>
- [Horizontal timeline](https://<yourdomain>.yeeflow.com/<redacted-path>

The product docs describe both controls as Advanced controls that can be used on dashboards, approval forms, and data-list list forms. They are data-source-backed, support filtering and ordering, let designers place controls into repeated timeline item blocks, and offer timeline/card/point/line styling. The export studied here proves the dashboard control schema only.

## Export Source

- Export: `/Users/Renger/Downloads/Company Overview (1).yap`
- App title: `Company Overview`
- Target dashboard: `Timeline with controls`
- Comparison dashboards from the prior study: `Company overview`, `Collection of activity`
- Target data source: Data List `Company Overview`

The export contains one Data List named `Company Overview`, three dashboard pages, and two Data List custom forms (`View page`, `Edit item`). The updated dashboard adds one Vertical Timeline, one Horizontal Timeline, and one Collection control on the same page.

## Data Source

Both timeline controls and the same-page Collection bind to the Data List `Company Overview` through `attrs.data.list`.

Relevant fields observed:

| Field | Display Name | Control Type | Field Type | Usage |
| --- | --- | --- | --- | --- |
| `Title` | Name | `input` | Text | Vertical title expression and Dynamic field |
| `Datetime1` | Start date | `datepicker` | Datetime | Sort/date field and Horizontal title expression |
| `Datetime2` | Due date | `datepicker` | Datetime | Available timeline/date field, not observed as timeline binding |
| `Text3` | Stakeholders | `checkbox` | Text | Dynamic field |
| `Text4` | RAG status | `radio` | Text | Dynamic field |
| `Text8` | Reference | `file-upload-merge` | Text | Dynamic file, multiple files |
| `Text10` | Assignee | `identity-picker` | Text | Dynamic user, multiple users |
| `Text11` | Cover image | `icon-upload` | Text | Dynamic image |

The wrapper has no committed sample record payload in this study. Field shapes are safe schema evidence only.

## Vertical Timeline

Observed control type: `timeline-v`

Observed configuration:

- Data source: `attrs.data.list` resolves to Data List `Company Overview`
- Timeline title/content label: `attrs.data.title.variable[]` uses `exprType = "variable_ctx"`, `ctx = "__ctx_coll"`, `id = "Title"`
- Sorting/date order: `attrs.data.sort[]` includes `SortName = "Datetime1"` with descending order
- Point/icon setting: `attrs.data.icon`
- Item click target: `attrs.data.link` references a custom list form layout
- Open sizing: `attrs.data.modalsize = 0`
- Animation: `attrs.data.animate = true`
- Horizontal/vertical alignment: `attrs.data.align`, `attrs.data.va`
- Style: `attrs.title.ty`
- Item template: child `container` holding Dynamic image, Dynamic field, Dynamic user, and Dynamic file controls

The export uses `__ctx_coll` as the repeated item context even inside the timeline. Do not invent a separate context unless a future export proves it.

## Horizontal Timeline

Observed control type: `timeline-h`

Observed configuration:

- Data source: `attrs.data.list` resolves to Data List `Company Overview`
- Timeline title/date label: `attrs.data.title.variable[]` uses `exprType = "variable_ctx"`, `ctx = "__ctx_coll"`, `id = "Datetime1"`
- Sorting/date order: `attrs.data.sort[]` includes `SortName = "Datetime1"` with descending order
- Point/icon settings: `attrs.data.icon`, `attrs.data.ptype`, `attrs.point.size`
- Columns: `attrs.data.col = [null, 4]`
- Item click target/opening: `attrs.data.link`, `attrs.data.op = "modal"`, `attrs.data.modalsize = 0`
- Sliding cards: `attrs.data.cardarr = true`, `attrs.data.slides = "4"`, `attrs.arrow`, `attrs.card.arrow`
- Alignment: `attrs.data.align`, `attrs.data.va`, `attrs.card["align-i"]`
- Item template: child `container` holding the same Dynamic controls used by the Vertical Timeline

Horizontal Timeline uses the same source list and Dynamic control item-template schema as Vertical Timeline, but adds horizontal/card-specific options such as columns, card arrows, slides-to-scroll, and arrow styling.

## Dynamic Controls In Timeline Templates

Timeline item templates use the same current-item binding pattern previously observed in Collection and Kanban:

```json
{
  "type": "dynamic-field",
  "attrs": {
    "source": "3",
    "obj-f": "Title"
  }
}
```

Observed Dynamic controls inside both Vertical and Horizontal Timeline templates:

- Dynamic image: `type = "dynamic-image"`, `attrs.source = "3"`, `attrs["obj-f"] = "Text11"` (`Cover image`, `icon-upload`)
- Dynamic field: `type = "dynamic-field"`, bound to `Title`, `Text3`, and `Text4`
- Dynamic user: `type = "dynamic-user"`, bound to `Text10` (`Assignee`, `identity-picker`, multiple users)
- Dynamic file: `type = "dynamic-file"`, bound to `Text8` (`Reference`, `file-upload-merge`, multiple files)

Observed user settings include avatar/name style, `i-len`, and `addition_fields = ["Email"]`. Observed image settings include preview/fit/image-height styling. Observed file settings include item limit, content sizing, icon size, padding, border/background, and optional `type_icon_show`.

## Same-Page Collection Comparison

The `Timeline with controls` dashboard also includes a Collection control named `Active survey program collection`, bound to the same `Company Overview` list. It uses the same item-template Dynamic control family and `attrs.source = "3"` / `attrs["obj-f"]` field binding pattern.

Comparison:

| Host | Main Structure | Current Item Binding | Main Use |
| --- | --- | --- | --- |
| Vertical Timeline | `timeline-v` with timeline title/date/order settings and item template children | `attrs.source = "3"` and `__ctx_coll` expressions | Chronological feeds, histories, lifecycle logs, milestones |
| Horizontal Timeline | `timeline-h` with title/date/order plus columns/arrows/slides settings | `attrs.source = "3"` and `__ctx_coll` expressions | Roadmaps, schedules, phases, campaign plans |
| Collection | `collection` with data source and layout settings | `attrs.source = "3"` | Flexible card/list display when time axis is secondary |
| Kanban | `kanban` with data source and `attrs.data.cateField` grouping | `attrs.source = "3"` | Status/stage/category work management |

## Business Use Guidance

Product-doc-backed:

- Use Vertical Timeline for key information in chronological order, such as milestones, project phases, event sequences, and product-development history.
- Use Horizontal Timeline for time-series progression, such as project progress, event planning, product stages, roadmaps, and schedules.
- Both controls support dashboards, approval forms, and data-list list forms according to product docs. This export proves dashboard usage only.

Export-proven:

- Dashboard Vertical Timeline and Horizontal Timeline controls can bind to a Data List source.
- Timeline item templates can use Dynamic field, Dynamic user, Dynamic image, and Dynamic file controls.
- Timeline Dynamic controls use the same `attrs.source = "3"` current-item context pattern as Collection/Kanban in this export.

Inferred generation guidance:

- Prefer Vertical Timeline when users scan events from top to bottom, such as audit trails, lifecycle history, approval history, or activity feeds.
- Prefer Horizontal Timeline when the page needs a left-to-right schedule or phase progression, such as release plans, project roadmaps, marketing campaigns, or lifecycle stages.
- Prefer Collection when chronological order is not the dominant structure.
- Prefer Kanban when users manage work by status/stage/category.

## Validation Guidance

Generated packages should validate:

- `timeline-v` and `timeline-h` controls resolve `attrs.data.list.ListID` to an included list-like source.
- Timeline date/order/title fields resolve to source list fields.
- Dynamic controls inside timeline item templates use `attrs.source = "3"` and bind through `attrs["obj-f"]`.
- Dynamic user binds to identity/person fields.
- Dynamic image binds to image/icon-upload fields.
- Dynamic file binds to attachment/file fields.
- Dynamic field binds to general fields.
- Historical exports should receive warnings for uncertain variants; generated-final packages can hard-error clear missing data sources, unresolved fields, and type mismatches.

## Proof Boundary

- Vertical Timeline usage on `Timeline with controls` is export-proven.
- Horizontal Timeline usage on `Timeline with controls` is export-proven.
- Dynamic controls inside timeline templates are export-proven where observed.
- Reference docs provide product guidance for when/how to use vertical and horizontal timelines.
- Runtime timeline rendering, scrolling, click behavior, dynamic file/image preview behavior, and drag/drop/reordering if any are not proven unless later tested.
- Kanban/Collection learning remains export-proven from the previous branch.
- Data List form runtime behavior is not proven by this branch.

## Follow-Up

Recommended next step: generate a focused runtime proof package with one Data List, one dashboard Vertical Timeline, one dashboard Horizontal Timeline, representative Dynamic controls, and safe sample rows, then manually verify rendering, click behavior, image/file display, and timeline navigation.
