# Dashboard Collection Control Pattern Study

Source exports studied read-only:

- `/Users/Renger/Downloads/Service Desk Pro Dashboard Stage M.yap`
- `/Users/Renger/Downloads/Generated Dashboard Collection Grid v7 (1).yap`
- `/Users/Renger/Downloads/Generated Dashboard Collection Grid v7 (2).yap`

Focus dashboard: `Tickets with Collection`

## Example Studied

The export is based on the Codex-generated Service Desk Pro Dashboard Stage M app. The user manually added one Type `103` dashboard page named `Tickets with Collection`.

The page adds two Collection controls over the local `Support Tickets` data list:

- a card/grid Collection showing ticket cards
- a table-style Collection using a header grid plus one repeated item row per ticket

The export decoded successfully. No credentials, connections, AI modules, document libraries, or external data dependencies were found in the studied dashboard.

The two supplied updated v7 exports are byte-for-byte identical:

- SHA-256: `89d71e06c5467f26905cbac635a1fb6afada44b6a7da53387e43b3d5e7435161`
- result: use either export as the same source of truth

## Dashboard Resource Location

- root app title: `Service Desk Pro Dashboard Stage M`
- root ListSetID: `2054393184421425152`
- dashboard layout title: `Tickets with Collection`
- dashboard LayoutID: `2054411786709123073`
- layout type: `103`
- `LayoutInResources[0].ID`: `2054411786709123073`
- `LayoutInResources[0].RefId`: `2054411786709123073`
- root navigation includes a Type `103` entry targeting `2054411786709123073`
- `ReplaceIds` count: `31`

The new dashboard page lives in `Data.Item.Layouts[]` as a root app page. Its embedded page JSON is stored in `LayoutInResources[0].Resource`.

## Source List

Both Collections bind to local list `Support Tickets`, ListID `2054393193964646406`.

Fields referenced by the Collection page:

| FieldName | DisplayName | FieldType | Control Type | Use |
| --- | --- | --- | --- | --- |
| `Title` | Ticket Title | Text | input | card/table title |
| `Text1` | Ticket ID | Text | input | table subtitle/id |
| `Text2` | Priority | Text | radio | priority badge and conditional style |
| `Text3` | Status | Text | radio | card/table status |
| `Text4` | Assigned Team | Text | input | card/table team |
| `Datetime1` | Created Time | Datetime | datepicker | formatted date expression |

## Collection Control Anatomy

Observed Collection control shape:

```json
{
  "id": "<control-guid>",
  "type": "collection",
  "label": "Collection",
  "attrs": {
    "data": {
      "list": {
        "AppID": 41,
        "ListID": "<source-list-id>",
        "Type": 1,
        "Title": "Support Tickets",
        "ListSetID": "<root-listset-id>"
      },
      "link": "default"
    },
    "layout": {}
  },
  "children": [
    {
      "type": "container",
      "children": []
    }
  ]
}
```

The repeated item template is the first child of the Collection. Child controls inside that template can use `source: "3"` dynamic fields and `variable_ctx` expressions with `ctx: "__ctx_coll"` to reference the current collection item.

## Card/Grid Collection Pattern

Observed control:

- control ID: `3ea86163-4350-42a4-9f5a-1050783c814c`
- type: `collection`
- source list: `Support Tickets`
- source ListID: `2054393193964646406`
- layout attributes:
  - `cg: [null, 24]`
  - `rg: [null, 24]`
  - `cp` set to `--sp--s300` on all sides
  - normal border enabled with neutral border and `--sp--s300` radius
  - hover shadow and neutral-light background
- item template: one container with vertical gap

The observed export does not store an explicit `layout.col` value for this card Collection. The UI note says this renders as three cards per row, so treat three-per-row as observed behavior, but the first generated test should verify whether the missing `col` means default 3 columns or whether the designer stores that setting elsewhere.

Card item child pattern:

- `dynamic-field` for `Title`
- row container with:
  - priority badge container
  - `dynamic-field` for `Text2`
  - `dynamic-field` for `Text3` with prefix `Status:`
- `dynamic-field` for `Text4`

## Table-style Collection Pattern

Observed control:

- control ID: `8bf1171c-fd7e-4093-adad-ce901e5cc352`
- type: `collection`
- source list: `Support Tickets`
- source ListID: `2054393193964646406`
- layout attributes:
  - `col: [null, 1]`
  - `cg: [null, 0]`
  - `rg: [null, 0]`
- full-text search:
  - fields: `Title`, `Text1`, `Text4`
  - value expression: `__filter_filter_Tickets`
- page filterVars includes `filter_Tickets`

The table effect is not a native table control. It is composed from:

- a header `flex_grid` outside the Collection
- a Collection with one item per row
- a repeated item container
- a nested `flex_grid` labelled `Table row`
- dynamic fields in grid cells
- conditional style rules for the priority badge
- a formatted date heading expression

The table row grid uses responsive columns:

- desktop: `1.5fr 1fr 1fr 1fr 1fr`
- tablet: `2.5fr 1fr 1fr 1fr`
- mobile: `1fr 1fr`

Runtime generation result:

- `generated-dashboard-collection-table-v2` imported, but the header and row cells stacked vertically.
- Root cause: the generator wrote grid columns to `attrs.layout.cols`, which validates as generic JSON but is not the Yeeflow dashboard `flex_grid` schema.
- `generated-dashboard-collection-table-v3` fixed the schema by writing `attrs.columns`, `attrs.rows`, `attrs.cgap`, `attrs.cgapU`, and `attrs.content` directly on the `flex_grid` control, matching the Stage M export.
- v3 imported and rendered a horizontal table-style Collection with one repeated row per Support Ticket, dynamic fields, dateFormat expression output, and conditional priority badge styles.
- Runtime polish correction from user review: the table header and repeated row grids must turn off Display caption. The Stage M export stores this as `displayLabel: [null, false]` on both `flex_grid` controls while keeping meaningful `nv_label` values for designer readability.

Do not use `attrs.layout.cols` for dashboard `flex_grid`; it is not honored by runtime.
Do not leave Display caption visible on generated table-style Collection header or row grids; visible labels such as `Table header` and `Table row` become runtime clutter.

## Dynamic Field Control Pattern

Observed dynamic field shape inside Collection item templates:

```json
{
  "type": "dynamic-field",
  "label": "Dynamic field",
  "attrs": {
    "source": "3",
    "obj-f": "Title"
  }
}
```

Rules learned:

- `source: "3"` means current Collection item.
- `obj-f` stores the source field name.
- The field must exist on the Collection source list.
- Styling can be placed under `attrs.item_style`.
- Prefix text can be placed in `attrs.prefix`; one observed example uses `prefix: "Status:"`.

Observed value types:

- text/input fields: `Title`, `Text1`, `Text4`
- radio text fields: `Text2`, `Text3`

## Text Expression Pattern

Observed formatted date heading:

```json
{
  "type": "heading",
  "attrs": {
    "headc": {
      "title": {
        "value": null,
        "variable": [
          {
            "type": "func",
            "func": "dateFormat",
            "params": [
              [
                {
                  "exprType": "variable_ctx",
                  "valueType": "datepicker",
                  "id": "Datetime1",
                  "ctx": "__ctx_coll",
                  "type": "expr",
                  "name": "Collection item:Created Time"
                }
              ],
              [
                {
                  "type": "str",
                  "value": "MMM DD, YYYY HH:MM"
                }
              ]
            ]
          }
        ]
      }
    }
  }
}
```

Rules learned:

- collection item expressions use `exprType: "variable_ctx"` and `ctx: "__ctx_coll"`
- `id` stores the source field name
- `name` is a designer-readable label such as `Collection item:Created Time`
- functions can wrap collection item expressions; the observed function is `dateFormat`
- static text controls and dynamic field controls are different: dynamic fields use `source: "3"`/`obj-f`, while expression headings use `headc.title.variable`

## Dynamic Display and Style Rules

The observed dynamic rules are stored in `attrs.control_display` on badge containers. They act as conditional style rules based on the current collection item priority.

Rule shape:

```json
{
  "id": "<rule-guid>",
  "controlId": "<target-control-guid>",
  "formulas": [
    {
      "exprType": "variable_ctx",
      "valueType": "radio",
      "id": "Text2",
      "ctx": "__ctx_coll",
      "type": "expr",
      "name": "Collection item:Priority"
    },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "High" }
  ],
  "actions": {
    "type": 1,
    "attrs": {
      "style_regulation_action": "style_class",
      "style_regulation_action_color": null,
      "action_style": "{\"normal\":{\"bgcolor\":\"rgba(245, 166, 35, 0.15)\",\"color\":\"#f5a623\"}}",
      "icon_type": null
    }
  }
}
```

Observed priority styles:

| Priority | Background | Color |
| --- | --- | --- |
| Low | `#f0f0f0` | `#474747` |
| Medium | `#ddffeb` | `#31cc71` |
| High | `rgba(245, 166, 35, 0.15)` | `#f5a623` |
| Critical | `rgba(208, 2, 27, 0.15)` | `#d0021b` |

The Stage M export does not show a separate hide/show action in the Collection page. The updated v7 export adds a dynamic display rule on `Collection assigned team value` and proves a show action shape.

Focused dynamic display learning status:

- Stage M proves conditional per-item style rules in `attrs.control_display`.
- Updated v7 proves a non-style dynamic show action with `style_regulation_action: "style_regulation_action_show"`.
- Hide action remains unproven; do not infer it from the show action.
- Do not infer hide/show from `style_regulation_action: "style_class"`.

Observed show rule shape:

```json
{
  "controlId": "<target-dynamic-field-id>",
  "formulas": [
    {
      "exprType": "variable_ctx",
      "valueType": "radio",
      "id": "Text2",
      "ctx": "__ctx_coll",
      "type": "expr",
      "name": "Collection item:Priority"
    },
    { "type": "op", "op": "!=" },
    { "type": "str", "value": "Medium" },
    { "type": "op", "op": "and" },
    {
      "type": "func",
      "func": "isNullOrEmpty",
      "params": [[
        {
          "exprType": "variable_ctx",
          "valueType": "datepicker",
          "id": "Datetime1",
          "ctx": "__ctx_coll",
          "type": "expr",
          "name": "Collection item:Created Time"
        }
      ]]
    },
    { "type": "op", "op": "==" },
    { "type": "bool", "value": false }
  ],
  "actions": {
    "type": 1,
    "attrs": {
      "style_regulation_action": "style_regulation_action_show",
      "style_regulation_action_color": null,
      "action_style": null,
      "icon_type": null
    }
  }
}
```

Runtime proof:

- `generated-dashboard-collection-grid-display-v8.yap` imported successfully.
- The dashboard rendered six Collection cards in two rows of three.
- Assigned Team appeared for non-Medium records with Created Time present.
- Assigned Team was hidden for Medium records.
- The rule is evaluated per Collection item through `ctx: "__ctx_coll"`.

## Action Button Pattern

The Stage M dashboard includes a local list create button labelled `New Ticket`.

Observed and generated action shape:

```json
{
  "type": "action_button",
  "label": "New Ticket",
  "attrs": {
    "icon-type": "3",
    "icon": "fa-solid fa-plus",
    "align": [null, "right", null, "justify"],
    "action-type": "5",
    "common": {
      "container": {
        "size": [null, "grow"]
      }
    },
    "data": {
      "list": {
        "AppID": 41,
        "ListSetID": "<root-listset-id>",
        "ListID": "<local-support-tickets-list-id>"
      }
    }
  },
  "parentCol": 1
}
```

Runtime result:

- `generated-dashboard-collection-search-button-v6.yap` imported successfully.
- `generated-dashboard-collection-grid-display-v8.yap` imported successfully.
- The dashboard rendered the table-style Collection, hidden table captions, and a visible `New Ticket` button.
- Clicking `New Ticket` opened the local `Support Tickets` add panel with generated list fields.
- The panel was cancelled without saving a record.
- In the updated grid header pattern, the button is inline/right aligned and uses container size `grow` to avoid awkward wrapping.

Generator rule:

- Use this action only for local lists included in the same `.yap`.
- Validate that `attrs.data.list.ListID` resolves to a local child list.
- Runtime-test the button and cancel the add panel; do not create sample records through UI during proof.

## Navigator Naming Pattern

Designer navigator names are stored in `nv_label`. Runtime labels remain in `label` and control type remains in `type`.

Observed `nv_label` examples:

| Control Type | Runtime Label | `nv_label` |
| --- | --- | --- |
| container | Container | First collection section |
| container | Container | Second collection section |
| container | Container | Second collection container |
| container | Container | Caption section of the collection table |
| flex_grid | Table header | Table header of the collection wrapper |
| container | Container | Row of item of the collection |
| flex_grid | Table row | Table item of the collection each item |

Generator guidance:

- add `nv_label` to major containers, sections, headers, collection item rows, and wrapper grids
- keep `label` aligned with actual control type or visible designer label
- do not rely on `nv_label` for runtime behavior
- avoid generic navigator names in generated dashboards because the designer tree becomes difficult to debug

## Validator Updates

Implemented validator coverage:

- Collection control source list must resolve to a package list.
- Collection full-text fields must resolve to the source list fields.
- Collection full-text filter variables must resolve to `page.filterVars`.
- Dynamic fields with `source: "3"` must be inside a Collection item template.
- Dynamic fields with `source: "3"` must reference source-list fields via `obj-f`.
- `variable_ctx` expressions with `ctx: "__ctx_coll"` must be inside a Collection item template.
- `variable_ctx` expression ids must resolve to source-list fields.
- Conditional style `action_style` must parse as JSON.
- Dashboard page control IDs under the control tree should be unique.
- Dashboard `flex_grid` controls must not store columns under `attrs.layout.cols`; use `attrs.columns` and `attrs.rows`.
- Table-style Collection header and repeated row `flex_grid` controls must set `displayLabel: [null, false]`.
- Dashboard filter controls with `binding: "__filter_<id>"` must resolve to `page.filterVars`.
- Dynamic display rules using `style_regulation_action_show` must have `actions.type: 1`, a target `controlId`, formula fields that resolve against the Collection source, and `action_style: null`.
- Graph validation now emits `dashboardCollectionSource` edges for Collection controls.

Recommendations not yet implemented:

- validate exact Collection pagination/page-size behavior after a focused export includes those settings
- validate native hide action after a focused export proves the hide action shape
- validate Collection sort settings after a focused export includes sort configuration
- validate card-grid column count after a generated runtime test proves whether missing `layout.col` means default 3 columns

## Generator Rules

For the first generated Collection package:

- use the proven root Type `103` dashboard shell
- include one local Support Tickets-like data list
- include one dashboard page with one Collection control
- use fresh local ID family
- bind Collection with `attrs.data.list`
- keep the first test to either card/grid or table-style Collection, not both
- use `source: "3"` dynamic fields only inside the Collection item template
- use `variable_ctx` + `ctx: "__ctx_coll"` only inside the Collection item template
- validate source fields before wrapper build
- import-test after generating a `.yap`

## Proven Generated Baselines

- `generated-dashboard-collection-card-v1.yap`: imported successfully and rendered three card-style Collection rows from local Support Tickets sample data.
- `generated-dashboard-collection-table-v3.yap`: imported successfully and rendered a horizontal table-style Collection with `flex_grid` header and repeated item rows.
- `generated-dashboard-collection-search-v4.yap`: now intentionally fails final validation because it leaves the table `flex_grid` Display captions visible.
- `generated-dashboard-collection-search-v5.yap`: imported successfully, rendered the table-style Collection without `Table header` / `Table row` captions, and typing `VPN` in the search filter narrowed the Collection to the single matching ticket row.
- `generated-dashboard-collection-search-button-v6.yap`: imported successfully and proved a local `New Ticket` action button opens the local Support Tickets add panel.
- `generated-dashboard-collection-grid-v7.yap`: imported successfully and proved the card/grid Collection renders as a three-column card grid with a local `New Ticket` action button.
- `generated-dashboard-collection-grid-display-v8.yap`: imported successfully and proved the updated inline/grow header action pattern plus a per-item dynamic show rule on a Collection item field.
- `knowledge-base-phase1-full.generated.yap`: imported successfully and proved flat article/category/section Collections can render together in a Knowledge Base-style app, with the known list-page refresh caveat documented in `docs/generated-knowledge-base-phase1-baseline.md`.

## Known Gaps

- Card/grid three-per-row runtime behavior is proven without explicit `layout.col`; a future export should confirm where non-default card column counts are stored.
- Dynamic show action shape is proven for `style_regulation_action_show`; dynamic hide action remains unproven.
- Collection pagination, sorting, and empty-state behavior are not visible in this export.
- Collection full-text search/filter is proven by v5 for table-style Collection.

## First Safe Generation Tests Completed

The first safe generation tests are complete:

- Card/grid Collection: pass after validation, wrapper build, import, and runtime render; v7 additionally proves three-column grid behavior plus a local New Ticket button.
- Table-style Collection: v2 failed visual runtime layout because of wrong `flex_grid` schema; v3 passed after correction.

The next safe learning task is a focused dynamic hide action export or a Collection pagination/sort export. Do not generate hide rules until that action shape is studied.
