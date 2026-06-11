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
