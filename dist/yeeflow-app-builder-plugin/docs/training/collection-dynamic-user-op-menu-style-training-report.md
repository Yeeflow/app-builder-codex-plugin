# Collection Collection-Item Style and Caption Typography Training

## Scope

This focused training hardens the five approved Dashboard Collection golden reference templates:

- `collection_control_responsive_card_grid`
- `collection_control_card_with_multiselect_toolbar`
- `collection_control_grid_table`
- `collection_control_grid_table_with_multiselect`
- `Event Pipeline Grid-Table`

## Required Rules

1. Every `dynamic-user` control inside a Collection item template must set:

```json
{
  "attrs": {
    "item_style": {
      "pd": [
        null,
        {
          "top": "--sp--s0",
          "right": "--sp--s0",
          "bottom": "--sp--s0",
          "left": "--sp--s0"
        }
      ]
    }
  }
}
```

2. Whenever a Collection template includes `grid_table_col_item_op_menu`, every `button` or `action_button` inside that Drop bar must set its normal background to transparent:

```json
{
  "attrs": {
    "button": {
      "normal": {
        "bg": "rgba(255, 255, 255, 0)"
      }
    }
  }
}
```

The transparent background rule applies to existing Edit/Delete buttons and any newly generated business operation buttons.

3. Whenever a Collection template includes `grid_table_col_caption > grid_table_col_title`, the `grid_table_col_title` Text/heading control must use Large medium typography:

```json
{
  "attrs": {
    "heads": {
      "ty": [
        null,
        "l-medium"
      ]
    }
  }
}
```

The title value may be replaced with a business-specific Collection title, but the typography token must stay `l-medium`.

## Generator Requirements

- Clone approved Collection template artifacts instead of rebuilding lookalikes.
- Preserve or reapply zero item padding when remapping `dynamic-user` controls to the target data source.
- Preserve or reapply transparent normal background for buttons under `grid_table_col_item_op_menu`.
- Preserve or reapply `grid_table_col_caption > grid_table_col_title` typography as `[null, "l-medium"]`.
- Run the style normalizer after template cloning, dependency remapping, and source-ID rewriting so late-added controls cannot escape the contract.

## Validator Requirements

Generated-final packages must hard fail before signing when:

- a Collection `dynamic-user` is missing `attrs.item_style.pd`;
- any side of `attrs.item_style.pd[1]` is not `--sp--s0`;
- a `grid_table_col_item_op_menu` contains a Button/action_button whose `attrs.button.normal.bg` is missing or not `rgba(255, 255, 255, 0)`.
- a `grid_table_col_caption > grid_table_col_title` control exists but `attrs.heads.ty` is missing or not `[null, "l-medium"]`.

The same checks apply to source template artifacts so accidental reference drift is caught even before a package is generated.
