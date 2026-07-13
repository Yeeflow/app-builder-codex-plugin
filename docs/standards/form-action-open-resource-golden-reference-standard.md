# Form Action Open Resource Golden Reference Standard

Source: normalized export evidence from `Leave Management-v1.7.yapk`, plus safe render-only proof on an existing installed reference baseline for Add Item, New Approval Submission, and Dashboard targets. Record creation, form submission, selected Edit/View, and Submitted Form loading remain outside that proof.

## Exact step types

| Business step | Exact `type` | Operations |
| --- | --- | --- |
| Open item form | `listitem` | add (omit `op_type`), `edit`, `view` |
| Open approval form | `openform` | `new`, `submitted` |
| Open dashboard | `opendashboard` | open Type 103 page |

`listitem` targets only a Data List or Document Library. Selected Edit/View requires a parseable non-empty Yeeflow expression-token array in `listdataid`. Optional `layout` must resolve to a Type 1 custom form on that exact target and its declared purpose must match the operation: Add uses New/New-Edit, Edit uses Edit/New-Edit, and View uses View. Current item mode is allowed only from a Data List or Document Library custom form; Approval Forms and Dashboards must select a data item.

`openform/new` may carry `setVars` and `queryParams`. `setVars.defKey` must equal the target `ProcKey`; every rule requires a target variable ID, the declared target type, and expression tokens; and the target/type/value must be compatible with the target Approval variable schema. `openform/submitted` requires a parseable non-empty expression-token array in `formid` and must not carry `setVars` or `queryParams`.

`opendashboard` requires a `PageID` resolving to a Type 103 Dashboard and may carry `queryParams`. Dashboard-host expressions may reference only declared page temp variables.

Every generated Query Parameter requires a non-empty unique name and either a direct non-null value or a parseable expression-token value. Generated artifacts use the strict contract; compatibility validation may accept older export omissions only where runtime evidence supports them.

## Presentation

| UI choice | `attrs.op` |
| --- | --- |
| Slide in | `slide` |
| Pop-up window | `modal` |
| Full page | `target` |
| New window | `new` |

Slide/Pop-up sizes use `modalsize`: `0`, `1`, `2`, `3`, or custom `9`. Custom requires positive `cusize.w`. Full page and New window must not carry modal sizing.

## Host rules

- Approval Submission and Task Forms use Approval workflow variables and may only select a target item.
- Data List and Document Library custom forms may use current item or a selected item. Current item omits `data.list`, `source_type`, and selected-record `listdataid`.
- Dashboard uses declared temp variables only and may only select a target item.
- Public Forms cannot contain any of these three step types.
- Trigger bindings use `formAction.onLoad`, `attrs.control_event_rule`, or `attrs.control_action` through the shared Form Action trigger binder.

## Required gates

- Target resource and optional custom layout resolve locally.
- Selected custom form purpose matches Add/Edit/View.
- Operation and target mode are host-compatible.
- Selected Edit/View or Submitted Form has a parseable non-empty ID expression-token array.
- Approval Set Variables resolve to the target schema and preserve compatible target and expression value types.
- Query Parameter names are present and unique, and each value is direct or expression-backed.
- Submitted Form contains no defaults or query parameters.
- Open mode and size are structurally compatible.
- Planned steps materialize exactly once before signing.
