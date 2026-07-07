# Yeeflow Workflow Generation Rules

Use these rules when generating Yeeflow approval workflow nodes, sequence flows, branch conditions, and process routing.

## Transition Condition Operand Modes

`Implant Application Request (4).ywf` proved the latest workflow arrow condition UI stores left and right operands as independent mode-aware values.

Observed `conditioninfo[]` operand wrappers:

- `type: 0`: direct/static value mode. Use for static text, selected option values, and date-picker values.
- `type: 1`: direct field/workflow-variable selector. Observed on the left operand for `Workflow Variables:Application Type`.
- `type: 2`: expression editor mode. Use for variables, functions, calculations, and dynamic comparisons on either side.

Legacy generated conditions may store operands as frontend `<input type="button" ...>` expression-button HTML strings. Existing exports can contain this, but new generated conditions should prefer the wrapper object shape when possible.

## Pattern Selection

Use direct variable left + static/option/date right when routing depends on a single variable value.

Example: `ApplicationType == Family`

```json
{
  "pre": "and",
  "left": {
    "type": 1,
    "value": {
      "exprType": "variable",
      "valueType": "text",
      "id": "ApplicationType",
      "type": "expr"
    }
  },
  "op": "s.=",
  "right": { "type": 0, "value": "Family" },
  "group": "string"
}
```

Use direct variable left + expression right when a selected variable is compared to a dynamic value, such as an approval threshold or calculated cycle.

Use expression left + static/option/date right when the left side must be calculated before comparison, such as `dateDiff(BoardingDate, now(), "year", []) > 0`.

Use expression left + expression right when both sides are dynamic, such as `TotalApplicationAmount > RemainingQuota` or `year(RequestDate) >= year(BoardingDate)`.

## Direct Workflow Variable Conditions

For direct-value conditions where the left side is a Workflow variable selector and the right side is a fixed value, use the current Condition editor wrapper shape:

- `left.type = 1`
- `left.value.exprType = "variable"`
- `left.value.type = "expr"`
- `left.value.id` resolves to `DefResource.variables`
- `right.type = 0`
- `group` matches the Condition editor group for the selected variable type

Condition editor group mapping:

| Workflow variable type | Condition editor group | Operator prefix |
|---|---|---|
| `file`, `img`, `image`, `signature`, `signer` | `general` | null checks only |
| `text`, `list`, `richtext`, `metadata`, `mutiple-metadata`, `dict`, `lookup`, `user`, `groupselect`, `department`, `organization`, `location`, `costcenter` | `string` | `s.` |
| `number`, `decimal`, `currency`, `percent`, `rate` | `number` | `n.` |
| `boolean`, `bit`, `switch` | `boolean` | `b.` |
| `date`, `datetime`, `datepicker`, `time` | `datetime` | `dt.`, plus `isNull` / `isNotNull` |

Object-like workflow variables such as User, Department, Location, Cost Center, Lookup, Metadata, and Dictionary values compare as String because the Condition editor stores their selected IDs as string values. File, Image, and Signature variables should use General `isNull` / `isNotNull` checks in this variable-condition pattern.

Date Time workflow variables such as `EffectiveDate` support `dt.=`, `dt.!=`, `dt.>=`, `dt.<=`, `dt.>`, `dt.<`, `isNull`, and `isNotNull`. Direct date/time right operands use `right.type = 0` with a date/time string, preferably the export-observed `YYYY-MM-DD HH:mm:ss` shape when time is present; null checks use `right: null`.

Use `right.type = 0` for fixed known values. Use `right.type = 2` only when the comparison value needs the Expression editor: concatenated strings, numeric calculations, Boolean functions such as `iif`, current-user/applicant-derived values such as `getUserAttr(Instance:Applicant, DepartmentID, [])`, cross-variable comparisons, or date functions such as `dateAdd(now(), "month", 1)`. A `right.type = 2` value must be a non-empty expression-token array, not a raw string or primitive.

When a connector needs grouped logic, use the current Condition editor's two-layer condition shape. Top-level `conditioninfo[]` rows may include a group wrapper row with `left: null`, `op: "isNull"`, `right: null`, and a non-empty child `conditions[]` array. The wrapper row's `pre` joins the group to previous top-level rows; every child condition row carries its own `pre` (`and` or `or`). Use child `and` rows for ranges and all-required clauses; use child `or` rows for alternatives. Do not generate nested child groups beyond this one child layer.

Assignment task output branches are not normal workflow-variable comparisons. For `Approved`, `Rejected`, and `Completed` outgoing lines, generate an export-style task Outcome expression-button on the left side with `data.type = "task"`, `param.defid = <source task id>`, and `prop = "Outcome"`, `op = "s.="`, and an export-style right expression-button with `Task outcome:Approved`, `Task outcome:Rejected`, or `Task outcome:Completed`. Do not generate simplified `left.value.id = "Outcome"` variable tokens for task outcome branches.

See `docs/studies/workflow-condition-editor-direct-value.md` for the export-backed reference and validation rules.

## Branch Coverage

For every multi-branch node:

- cover all meaningful task outcomes and routing values
- make routing variables required, auto-derived, or covered by fallback routes
- include a fallback for empty/null/unexpected values when the variable can be blank
- avoid dead-end workflow branches
- prefer expression operands for computed routing instead of creating temporary intermediate variables unless the value must be persisted or debugged

Examples:

- HR Review standard route: Approved + `HasCustomPackageProduct == No`
- HR Review Finance/fallback route: Approved + `HasCustomPackageProduct != No`, covering Yes, empty, and unexpected values
- Family quota occupation route: `ApplicationType == Family`
- Date eligibility route: `dateDiff(ApplicantBoardingDate, now(), "year", []) > 0`
- Amount threshold route: `TotalApplicationAmount >= ApprovalThreshold`

## Validation

Validators should warn when:

- generated transitions use legacy HTML-button operands where wrapper operands are available
- operand wrapper objects have unknown `type`
- `type: 2` expression operands do not contain expression-token arrays
- `type: 1` direct selector operands do not contain a selected variable/field token object
- generated multi-branch nodes cover Yes/No but not empty/unexpected values where the routing variable can be blank
- a condition row duplicates or contradicts another row on the same transition
