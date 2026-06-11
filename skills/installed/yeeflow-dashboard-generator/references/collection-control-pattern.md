# Dashboard Collection Control Pattern

Use this reference after the data-bound and Service Desk Pro Stage M/N patterns when generating or validating dashboard Collection controls.

Source studied: `/Users/Renger/Downloads/Service Desk Pro Dashboard Stage M.yap`

Dashboard studied: `Tickets with Collection`

## Proven From Export Study

- A dashboard Collection control uses `type: "collection"`.
- The Collection data source is stored at `attrs.data.list`.
- The repeated item template is the first child of the Collection.
- Dynamic fields inside Collection items use `attrs.source: "3"` and `attrs["obj-f"]`.
- Collection item expressions use `exprType: "variable_ctx"` with `ctx: "__ctx_coll"`.
- Conditional per-item style rules can be stored in `attrs.control_display`.
- Designer navigator names are stored in `nv_label`.

## Proven From Runtime Generation

- `generated-dashboard-collection-card-v1.yap` imported and rendered card/grid Collection rows from a local Support Tickets list.
- `generated-dashboard-collection-table-v3.yap` imported and rendered table-style Collection rows from the same list pattern.
- `generated-dashboard-collection-table-v2.yap` is a failed learning artifact: it imported but rendered vertically because it used the wrong `flex_grid` schema.
- `generated-dashboard-collection-search-v5.yap` imported and rendered table-style Collection rows with hidden table-grid captions and working full-text search binding.
- `generated-dashboard-collection-search-button-v6.yap` imported and proved a local `New Ticket` action button bound to the local Support Tickets list.
- `generated-dashboard-collection-grid-v7.yap` imported and proved the card/grid Collection renders as a three-column grid and can include the local `New Ticket` action button.
- `generated-dashboard-collection-grid-display-v8.yap` imported and proved an inline/grow header action layout plus a per-item dynamic show rule inside the Collection item template.

## Collection Data Source

Minimum observed data shape:

```json
{
  "attrs": {
    "data": {
      "list": {
        "AppID": 41,
        "ListID": "<local-list-id>",
        "Type": 1,
        "Title": "Support Tickets",
        "ListSetID": "<root-listset-id>"
      },
      "link": "default"
    }
  }
}
```

For generated packages, `ListID` must resolve to a local child list included in the package.

## Dynamic Field Pattern

```json
{
  "type": "dynamic-field",
  "attrs": {
    "source": "3",
    "obj-f": "Title"
  }
}
```

Rules:

- only use `source: "3"` inside a Collection item template
- `obj-f` must resolve to the Collection source list field
- use `item_style` for display styling
- `prefix` is supported by the studied export

## Text Expression Pattern

Collection item expression:

```json
{
  "exprType": "variable_ctx",
  "valueType": "datepicker",
  "id": "Datetime1",
  "ctx": "__ctx_coll",
  "type": "expr",
  "name": "Collection item:Created Time"
}
```

## Search Filter Binding Pattern

Observed shape:

```json
{
  "type": "search-filter",
  "binding": "__filter_filter_Tickets",
  "attrs": {
    "placeholder": "Search contacts"
  }
}
```

Page-level filter variable:

```json
{
  "filterVars": [
    { "idx": "<guid>", "id": "filter_Tickets" }
  ]
}
```

Collection full-text binding:

```json
{
  "attrs": {
    "data": {
      "fulltext": [
        {
          "fields": ["Title", "Text1", "Text4"],
          "value": [
            {
              "exprType": "variable",
              "valueType": "string",
              "id": "__filter_filter_Tickets",
              "type": "expr",
              "name": "filter_Tickets"
            }
          ]
        }
      ]
    }
  }
}
```

Generate this only as an isolated package until runtime search narrowing is confirmed.

Observed function wrapper:

```json
{
  "type": "func",
  "func": "dateFormat",
  "params": [
    [{ "exprType": "variable_ctx", "id": "Datetime1", "ctx": "__ctx_coll" }],
    [{ "type": "str", "value": "MMM DD, YYYY HH:MM" }]
  ]
}
```

## Conditional Style Pattern

Per-item conditional style rules are stored in `attrs.control_display`.

```json
{
  "formulas": [
    { "exprType": "variable_ctx", "id": "Text2", "ctx": "__ctx_coll", "type": "expr" },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "High" }
  ],
  "actions": {
    "type": 1,
    "attrs": {
      "style_regulation_action": "style_class",
      "action_style": "{\"normal\":{\"bgcolor\":\"rgba(245, 166, 35, 0.15)\",\"color\":\"#f5a623\"}}"
    }
  }
}
```

Do not generate visibility behavior from this pattern. Conditional style and dynamic display actions use the same `attrs.control_display` array but different `style_regulation_action` values.

## Dynamic Show Rule Pattern

The updated v7 export proves a non-style dynamic show action on a dynamic field inside a Collection item template.

```json
{
  "controlId": "<target-dynamic-field-id>",
  "formulas": [
    { "exprType": "variable_ctx", "valueType": "radio", "id": "Text2", "ctx": "__ctx_coll", "type": "expr" },
    { "type": "op", "op": "!=" },
    { "type": "str", "value": "Medium" },
    { "type": "op", "op": "and" },
    {
      "type": "func",
      "func": "isNullOrEmpty",
      "params": [[
        { "exprType": "variable_ctx", "valueType": "datepicker", "id": "Datetime1", "ctx": "__ctx_coll", "type": "expr" }
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

- v8 showed Assigned Team for non-Medium records with Created Time present.
- v8 hid Assigned Team for Medium records.
- The rule is evaluated per Collection item through `ctx: "__ctx_coll"`.

Generator rules:

- use this only inside a Collection item template
- ensure every `variable_ctx` field resolves to the Collection source list
- keep `actions.type: 1`
- keep `action_style: null`
- do not infer dynamic hide action shape from this show action

## Local New Ticket Action Button Pattern

Use this only for local lists included in the same generated `.yap`.

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
        "ListID": "<local-list-id>"
      }
    }
  },
  "parentCol": 1
}
```

Runtime proof:

- v6 table-style Collection opened the local Support Tickets add panel.
- v7 card/grid Collection opened the local Support Tickets add panel.
- v8 proved the inline/right/grow header action layout and opened the local Support Tickets add panel.
- Testing must cancel the panel without saving a record.

Validator expectation:

- `attrs.data.list.ListID` must resolve to a local child list.

## Layout Patterns

Card/grid Collection:

- no explicit `layout.col` was present in the studied export
- `layout.cg` and `layout.rg` were `24`
- item template used a vertical container and dynamic fields for title, priority, status, and assigned team
- v7 runtime proved this renders as a three-column card grid for six generated Support Ticket records

Inline header/action layout:

- for header containers with a title block and a button, set the title block width type to inline where the export uses `style.widthtype: [null, "2"]`
- set action button `attrs.common.container.size: [null, "grow"]` when the button must not wrap awkwardly
- set action button `attrs.align: [null, "right", null, "justify"]`
- keep the button bound only to a local included list

Table-style Collection:

- Collection layout used `col: [null, 1]`, `cg: [null, 0]`, and `rg: [null, 0]`
- header was a separate `flex_grid` outside the Collection
- item template contained a nested `flex_grid` row
- row cells used dynamic fields and one formatted date heading expression

Dashboard `flex_grid` table schema:

- use `attrs.columns`, not `attrs.layout.cols`
- include `attrs.rows`
- include `attrs.cgap` and `attrs.cgapU` when matching the studied table pattern
- include `attrs.content.pd` for cell padding
- table v2 proved that `attrs.layout.cols` is ignored by runtime and causes vertical stacking
- table header and repeated row grids must set `displayLabel: [null, false]`; otherwise runtime shows designer captions such as `Table header` and `Table row`

## Navigator Naming

Use `nv_label` for generated designer readability.

Recommended labels:

- Collection section
- Collection control
- Collection item wrapper
- Collection priority badge
- Collection table header
- Collection table row
- Collection date text

## Validator Expectations

The dashboard validators should catch:

- unresolved Collection `attrs.data.list.ListID`
- unresolved full-text fields
- unresolved full-text filter variables
- `source: "3"` dynamic fields outside Collection item templates
- unresolved `obj-f` fields
- unresolved `variable_ctx` collection item fields
- invalid conditional `action_style` JSON
- duplicate dashboard page control IDs
- invalid `flex_grid` column schema using `attrs.layout.cols`
- visible Display caption on table-style Collection header or repeated row `flex_grid` controls
- unresolved filter control binding values such as `__filter_filter_Tickets`
- local action buttons with `action-type: "5"` must resolve `attrs.data.list.ListID` to a local list
- dynamic show rules with `style_regulation_action_show` must have `actions.type: 1`, `action_style: null`, a valid target `controlId`, and formula fields that resolve against the Collection source list

## Stop Conditions

Stop before generation if:

- the Collection source list is not included in the package
- a Collection item field reference cannot be resolved
- a dynamic rule uses an unstudied action shape, especially hide behavior
- non-default card-grid column behavior requires guessing
- a table-style Collection requires a `flex_grid` schema not matching `attrs.columns` / `attrs.rows`
- a table-style Collection header or repeated row grid would render its Display caption
- the package has not been validated and runtime import-tested

## Proven Search Table Baseline

`generated-dashboard-collection-search-v5.yap` is the first proven table-style Collection with search binding and hidden grid captions.

Runtime proof:

- imported successfully into `https://<yourdomain>.yeeflow.com`
- opened as `Tickets Collection Search | Generated Dashboard Collection Search v5`
- rendered horizontal table header and rows
- did not render `Table header` or `Table row` captions
- typing `VPN` in the search filter narrowed the Collection to the matching Support Ticket row

## Proven Action and Grid Baselines

`generated-dashboard-collection-search-button-v6.yap` is the first proven table-style Collection with a local New Ticket action button.

`generated-dashboard-collection-grid-v7.yap` is the first proven card/grid Collection that combines the card layout with the local New Ticket action button.

`generated-dashboard-collection-grid-display-v8.yap` is the first proven card/grid Collection with an inline/grow New Ticket header action and a per-item dynamic show rule.

Runtime proof:

- v6 and v7 imported successfully into `https://<yourdomain>.yeeflow.com`
- both opened the local Support Tickets add panel through the New Ticket button
- v7 rendered two rows of three Collection cards
- v8 rendered two rows of three Collection cards, opened the add panel, and hid Assigned Team on Medium-priority cards while showing it on non-Medium cards
- no records were saved during testing

## Hide/Show Dynamic Display Status

Dynamic show display rules are proven. Dynamic hide display rules are not proven yet.

The Stage M export proved conditional style actions in `attrs.control_display` with `style_regulation_action: "style_class"`. The updated v7 export proved show actions in `attrs.control_display` with `style_regulation_action: "style_regulation_action_show"`. Do not generate hide rules until a focused export proves the native hide action shape.
