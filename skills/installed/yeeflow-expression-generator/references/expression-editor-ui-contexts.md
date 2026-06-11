# Yeeflow Expression Editor UI Contexts

This reference is based on the supplied screenshots from the Yeeflow designer. It documents where expressions are configured and what generators should assume before export-backed wrapper shapes are available.

## Calculation Control Expression

Entry point:

- select a Calculation control
- open the Content tab
- use the `Expression` field and `Edit` button

Expected expression:

- a value-producing expression token array
- usually numeric for subtotal/total formulas, but can return text/date/boolean depending on the bound variable

Typical variables:

- workflow variables such as Quantity, Unit Price, Amount, Date, Status
- list/sublist variables when the calculation summarizes line items

Generator guidance:

- use calculated controls for fields named like Subtotal, Total, Balance, Duration, Difference, or Amount when a formula is implied
- represent `Quantity * Unit Price` as variable tokens with the `*` operator
- use `arraySum` for list/sublist totals only when the list variable and column names are resolved

Validator guidance:

- require a non-empty expression on generated Calculation controls unless explicitly deferred
- validate nested function params and variable tokens
- warn on primitive function params unless export-backed for the function

## Expression Editor Toolbar

Observed toolbar entries:

- number literal: `123`
- text literal
- expression/context variable selector
- function selector
- concatenation: `&`
- arithmetic: `+`, `-`, `*`, `/`, `%`
- grouping: `(`, `)`
- logical: `and`, `or`
- comparison: `==`, `!=`, `>`, `>=`, `<`, `<=`
- boolean literals: `true`, `false`
- empty literal: `[empty]`
- copy/paste controls

Generator guidance:

- generate the normalized token arrays directly; do not generate raw JavaScript formulas
- use only operators present in the normalized operator reference
- treat `%` as UI-observed but do not generate it until it is present in the normalized operators or export-backed

## Function Tab

Entry point:

- open Expression Editor
- choose the Function tab/icon

Observed categories:

- All
- String
- Logical
- Date
- Mathematical
- Other

Observed function list included:

- `abs`
- `addWorkDays`
- `addWorkHours`
- `arrayAverage`
- `arrayConcat`

Generator guidance:

- use `yeeflow-expression-functions.normalized.json` and `yeeflow-expression-function-knowledge-base.normalized.json` for generation-safe functions
- `addWorkDays` and `addWorkHours` are observed in the UI but metadata-pending; do not generate them yet
- choose functions by business intent using category, keywords, and businessScenarios metadata

## Expression / Context Variable Selector

Entry point:

- open Expression Editor
- click the expression/context selector

Observed variable groups:

- Context
- Workflow Variables
- Static Variables
- Temp variables
- Filter variables

Expected token:

```json
{
  "exprType": "variable",
  "valueType": "text",
  "id": "field_1",
  "type": "expr",
  "name": "Workflow Variables:field1"
}
```

Generator guidance:

- use exact variable token shape with all five required properties
- use `valueType` only as `number`, `text`, `date`, or `boolean`
- set `name` to the correct group-qualified label when known
- do not reference unresolved filter/temp variables outside the context where they exist

Export-backed current-user context tokens use a different application-token shape:

```json
{
  "id": "CurrentUser",
  "exprType": "application",
  "valueType": "string",
  "type": "expr",
  "name": "Context:Current User"
}
```

Use this context token with `getUserAttr` only after the target page is an approval-form expression context. Attribute selector parameters are descriptor objects such as `{ "key": "Email", "label": "Email" }`.

## Dynamic Display Rules

Entry point:

- select a control
- open Content or Appearance settings
- click `Dynamic display rules`

Expected expression:

- boolean/comparison expression nested inside the control display rule wrapper

Common use cases:

- show justification when amount is greater than a threshold
- show details when a switch is true
- show vendor fields when procurement type equals single source

Generator guidance:

- preserve the export-backed `attrs.control_display` wrapper shape for the target control
- validate the nested expression token array independently
- use simple comparison expressions before complex function expressions

## Custom Validation Rules

Entry point:

- select a field control
- open the Validation section
- click `Custom validation`

Expected expression:

- boolean validation condition, normally true when the field value is valid

Common use cases:

- required-if validation using `isNullOrEmpty`
- required date must be greater than or equal to today
- amount must be positive or below an allowed threshold

Generator guidance:

- use native required flags for simple required fields
- use custom validation only when a business rule cannot be expressed by built-in validation
- keep validation messages and wrappers export-backed before generation

## Lookup / Data Filter Conditions

Entry point:

- select a Lookup control or data-bound control
- open the data source/filter settings
- click `Data filters` / `Condition`

Expected expression:

- condition-builder object with nested expression tokens for the chosen side of a condition

Common use cases:

- filter lookup records where Active equals true
- filter records by category, current user, or context variable
- constrain lookup source data before user selection

Generator guidance:

- preserve lookup filter wrapper shape from the target export
- validate source list fields before referencing them
- use readable lookup autofill variables for user-facing persistence rather than raw row IDs

## Workflow Transition Condition Editor

Entry point:

- open Workflow designer
- select a sequence/transition arrow
- use the right-side `Condition` button

Expected expression:

- boolean condition controlling whether the transition is taken

Common use cases:

- route to Finance when total amount is at least a threshold
- route to Security when security review is required
- route approve/reject paths based on task outcome

Generator guidance:

- generate workflow conditions only when the transition-condition wrapper is export-backed
- keep approve/reject outcome transitions in the proven simple condition pattern
- use `iif` for conditional values, but use direct boolean comparisons for routing decisions
- for numeric workflow routes from list summaries, use the export-backed `conditioninfo` wrapper with `group: "number"`, `n.>` / `n.<=` operators, and a summary-bound number variable such as `TotalAmount`

## User/Profile Expression Display

Observed in `Expression Runtime Test v1 Patch.yap`:

- text-like expression display can be stored under native heading/Text controls at `attrs.headc.title.variable`
- generated runtime proof used calculated controls bound to text variables so values could render on submission/task pages and also participate in ContentList persistence
- profile image display can use `getUserAttr(Context:Current User, Photo, ...)`, but generated image/profile controls remain runtime-sensitive unless a focused media expression test is requested

Generator guidance:

- use `getUserAttr`, `getOrgAttr`, and `getLocAttr` with export-backed descriptor parameters
- use `getOrgAttr`, not `getDeptAttr`, for department/organization attributes
- add safe fallback arrays for optional profile values
- for persistence, prefer calculated/text summary variables and map those to ContentList; do not directly persist object-shaped user, department, or location values into text fields
- document tenant-data dependency when Location, Boarding Date, Phone, or manager-related values are blank

## Sub List Current Object Expressions

Observed in updated `Approval Form Controls Test v6.yap`.

Entry point:

- select a field inside a Sub list/List control
- set `Control type` to `Calculation`
- open the calculation expression editor for that sub list field

Expected expression:

- row-level calculated value evaluated against the current sub list row

Observed variable scope:

- `Current object:<Row Field Name>` entries are available inside the expression editor
- export token shape uses `exprType: "variable_ctx"`
- `ctx` is the parent list variable id, for example `LineItems`
- `id` is the row field id, for example `LineQuantity`

Common use cases:

- `Sub Total = Current object:Quantity * Current object:Unit Price`
- row amount, score, duration, or difference calculations

Generator guidance:

- add the calculated row field to `variables.listref[].fields[]`
- render the row field as a `calculated` control inside the submit-page list control
- store the expression at `control.attrs.calculated`
- validate every `variable_ctx` token against the listref row fields

## Sub List Summary Editor

Observed in updated `Approval Form Controls Test v6.yap`.

Entry point:

- select a Sub list/List control
- open Summary settings from the control panel

Expected configuration:

- list control summary metadata, not a normal expression token array

Observed structure:

- summaries live in `attrs["list-fields-summary"]`
- summary field references use row field ids
- `type: "total"` renders as Sum
- `type: "avg"` renders as Average
- optional binding uses `{ "prefix": "__variables_", "value": "<WorkflowVariableId>" }`

Common use cases:

- quantity sum
- unit price average
- subtotal sum bound to a top-level `TotalAmount` number variable

Generator guidance:

- use summary-bound variables for totals that drive workflow routes
- display the bound variable through a readonly number control when users need to see it outside the list
- keep summary binding target types compatible with the row field and summary type

## Form Actions

Observed in manually updated `Expression Sublist Summary Workflow Test v1.yap` and `Form Actions Phase 1 Test v1 Runtime.yap`.

Entry points:

- Button control: `attrs.control_action` binds a click action to an action id in `page.formdef.actions[]`.
- Page form definition: `page.formdef.formAction.onLoad` binds a page-load action.
- Form action steps: Set variable steps use expression-token arrays for values and optional conditions.
- Confirm dialog steps use expression-token arrays for the dialog message and a variable token for the result target.
- Query data steps can write count and collection outputs into temp variables.
- Submit form steps progress or save the active form and are not expression wrappers unless an execution condition is configured.

Typical variables:

- workflow variables from `variables.basic[]`
- temp variables declared in `variables.tempVars[]` and referenced as `__temp_<id>`
- context/profile functions such as `currentUser`, `getUserAttr`, and `now` when export-backed
- query result collections stored in temp variables such as `__temp_var_CollectionofQueryItems`

Generator guidance:

- use form actions for client-side form behavior and initialization
- use workflow graph actions for backend/process behavior
- validate temp variable references separately from workflow variables
- keep generated action buttons inline and named with meaningful `nv_label`
- for query-result aggregates, use `arraySum` against an explicit selected field from the preceding query step
- preserve export-backed `JSONStringfy` spelling for query collection display/debugging
- keep `vLookup` deferred until an export provides its function token shape
