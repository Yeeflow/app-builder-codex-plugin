# Data List Print Page Dynamic Sub List

## Source

Export studied: `/Users/Renger/Downloads/Sales Quotation.yap`

Target Data List: `Quotation`

The package also contains a `Templates` Document Library. This study only uses it as package context; the learned feature is from the `Quotation` Data List custom forms.

## Quotation Data Model

`Quotation` is a Data List with header fields for customer and quote details:

- `Title`: Customer name, text primary field
- `Text1` to `Text4`: address fields
- `Text7`: Country
- `Datetime1`: Expire Date
- `Text6`: Quote Number, autonumber
- `Text8`: Currency
- `Decimal1`: Discount
- `Decimal2`: Tax Rate
- `Decimal3`: Total Amount
- `Decimal4`: Total Price, calculated-column
- `Decimal5`: Tax
- `Text10`: Sign

The quotation line items are stored in Sub List field `Text5`, display name `Products & Services`. Its row schema is:

- `NAME`: text
- `Description`: text
- `UNITPRICE`: number
- `QTY`: number
- `SUBTOTAL`: number/calculated

## Custom Forms

The `Quotation` list contains three custom forms:

| Form | Inferred purpose | Sub List usage | Actions |
| --- | --- | --- | --- |
| `New Quotation` | new/edit item form | default Sub List for editing `Products & Services` | `Cal_Tax value` set-variable action |
| `View Quotation` | view item form | default Sub List display | `Print Quotation` action |
| `Print Page` | print target form | read-only-looking Dynamic Sub List display | no form actions |

The export uses Type `1` custom list form layouts. The `Print Page` form is referenced by the `View Quotation` print action.

## Print Page Action

`View Quotation` contains a form action named `Print Quotation`. It is triggered by an `action_button` labelled `Print this quotation`.

Normalized schema:

```json
{
  "name": "Print Quotation",
  "steps": [
    {
      "type": "print",
      "attrs": {
        "printtype": "select",
        "data": {
          "Type": "layout",
          "SourceID": "<quotation-list-id>",
          "AppID": "<app-id>",
          "ListSetID": "<listset-id>"
        },
        "layout": "<print-page-layout-id>",
        "listdataid": [
          {
            "exprType": "list_field",
            "prop": "ListDataID",
            "id": "ListDataID"
          }
        ]
      }
    }
  ]
}
```

The target is the `Print Page` custom form layout. The current record context is passed through `attrs.listdataid` as a list-field expression for `ListDataID`.

The screenshot/user context shows this opens Yeeflow print preview with paper size, layout, scale, margins, select-printer, and close controls. The export proves the action schema and target reference, not runtime print execution.

## Print Page Dynamic Sub List

The `Print Page` form contains a Sub List control:

- label: `Products & Services`
- binding: `Text5`
- layout: `dynamic`
- caption: hidden with `displayLabel = [null,false]`
- actions: none
- footer: present, but no Add/Import action buttons
- field bindings inside template: `NAME`, `Description`, `UNITPRICE`, `QTY`, `SUBTOTAL`

The Dynamic content template is print-friendly:

- a sibling/nearby header `flex_grid` labelled `Pricing Table Header`
- a Dynamic Sub List body with a `list-body`
- body `flex_grid` labelled `Pricing table content`
- each column uses containers/controls
- row controls use `attrs.list_field = true`
- row controls keep `attrs.list_field_binding = "Text5"`
- display captions are hidden on row field controls
- no row operation menu or edit buttons are present

This is export proof that Data List custom forms can host Dynamic content Sub List fields.

## Comparison With Approval Form Dynamic Sub List

Shared schema:

- Sub List control type is `list`.
- Dynamic layout uses `attrs["list-display-preference"] = "dynamic"`.
- Dynamic item template lives under `list-body`.
- Field controls bind to row fields and set `attrs.list_field = true`.
- Field controls keep `attrs.list_field_binding` equal to the parent Sub List binding.
- Table-style layouts use a header `flex_grid` plus a body `flex_grid`.

Differences in this export:

- The host is a Data List custom form layout, not an Approval Form `pageurls[]` page.
- The Sub List binds directly to a Data List field (`Text5`) whose field `Rules` contain `list-variables`.
- The Print Page Dynamic Sub List is read-only/display-oriented: no local `attrs.actions[]`, no Add/Import footer buttons, and no row menu.
- Summary/totals are displayed through surrounding print form controls and dynamic fields rather than list action controls.

## Generation Guidance

- For Data List print pages, use a dedicated Type `1` custom form as the print target.
- Link a view form button to the print page with a form action step `type = "print"`.
- Set `attrs.printtype = "select"` and `attrs.layout` to the print page layout ID.
- Pass current record context through `attrs.listdataid` using `ListDataID`.
- For read-only print line items, use Dynamic Sub List with captions off, no Add/Import buttons, no row operation actions, and field controls bound to the Sub List row fields.
- Use print-friendly layout controls such as containers, heading/text controls, flex grids, picture, and text-editor.

## Validation Guidance

- Print page action targets should resolve to an existing custom form layout on the same list.
- Print page actions should pass current record context through `attrs.listdataid`.
- Dynamic Sub Lists in Data List custom forms should bind to an existing Sub List field.
- Dynamic Sub List item-template bindings should resolve to the Sub List field row schema.
- Print Page read-only Sub Lists should warn if Add/Import/Edit row actions are exposed unless intentionally configured.

## Proof Boundary

Data List custom form Dynamic Sub List usage in `Quotation` Print Page is export-proven.

The `Print Quotation` form action step with `type = "print"` in `View Quotation` is export-proven.

Runtime print execution is not proven by this study unless later tested.

Approval Form Dynamic Sub List row action runtime proof remains limited to the generated V1.5 YAPK package and tested actions.

Dashboard and Approval Form Print page action availability is product/user-understanding-backed unless separately export-proven.
