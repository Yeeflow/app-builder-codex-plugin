# Agent Access Application Resources Tool

Source export: `<downloads>/Spark & AI (1).yap`

Classification: export-proven tool structure only.

## Tool Identity

The `Dental Aligner Label Info` Agent includes one component:

- `Components[].Type = 2`
- `Components[].SubType = 10`
- name: `Application resource access`

This is the currently proven shape for the Agent-side app-resource tool in this export.

## Tool Scope

The tool `Settings.Data.Value` points to the current application/listset, not to a single list:

- `Settings.Data.AppID = <local app id>`
- `Settings.Data.ListSetID = <local app/listset id>`
- `Settings.Data.Value = <same local app/listset id>`

Selectable resources are then constrained inside `Settings.resources`.

## Resource Configuration

Observed `Settings.resources` shape:

```json
{
  "dataLists": {
    "items": [
      { "id": "<stock-box-list-id>", "permissions": 11 },
      { "id": "<category-list-id>", "permissions": 8 }
    ]
  }
}
```

This export proves the app-resource tool can be scoped to multiple local data lists through a nested `resources.dataLists.items[]` object, not only through a flat array.

## Proven Intended Behavior

The tool description instructs the Agent to:

1. update the `Stock Box` item whose ID comes from input variable `stock_box_item_id`
2. write extracted values into target fields on that item
3. check the `Category` list
4. map the extracted category code to a `Category` row
5. use that row ID as the lookup value for `Stock Box.Category Code`
6. return mapped category details through Agent output variables

That means the update logic is described in the tool contract and prompt, not in a separate workflow-side `Update item` node.

## What Is Proven vs Inferred

Export-proven:

- tool lives in Agent `Components[]`
- component type/subtype
- current-app/listset scope in `Settings.Data.Value`
- nested `resources.dataLists.items[]`
- local data-list permissions integers
- description-driven update intent

Inferred but not execution-proven:

- exact runtime request payload sent by the tool
- exact field-by-field update call shape
- exact meaning of permission values `11` and `8`
- whether the tool performs lookup resolution internally or through model reasoning plus tool calls

## Validation Guidance

- Accept app-resource tools where `Settings.Data.Value` equals the current app/listset ID.
- Accept `Settings.resources` as an object.
- Validate `resources.dataLists.items[]` entries resolve to included lists.
- Treat unresolved list IDs as blockers in generator final mode.
- Treat live tool execution as runtime-sensitive whenever updates are possible.
