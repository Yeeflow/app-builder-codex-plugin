# Form Actions dateDiff Expression Study

Source export: `<downloads>/Implant Application Request (3).ywf`

Scope:

- Approval form: `Implant Application Request`
- Form action: `Check family quota usage`
- Step: `Refresh total amount, product summary, and boarding year number`
- Target variable: `Workflow Variables:Applicant Boarding Years`

## Finding

The generated `dateDiff` expression used the date unit parameter as an expression string-token array:

```json
[
  { "type": "str", "value": "Year" }
]
```

In the Yeeflow expression editor this rendered as:

```text
formcraft.formula.datetype.[object Object]
```

The manually corrected export-backed expression uses a raw enum string for the third parameter:

```json
"year"
```

The editor displays that working value as:

```text
Year
```

## Export-Backed Shape

Use this shape for whole-year eligibility calculations:

```json
{
  "type": "func",
  "func": "dateDiff",
  "params": [
    [
      {
        "exprType": "variable",
        "valueType": "date",
        "id": "ApplicantBoardingDate",
        "type": "expr",
        "name": "Workflow Variables:Applicant Boarding Date"
      }
    ],
    [
      {
        "type": "func",
        "func": "now",
        "params": []
      }
    ],
    "year",
    []
  ]
}
```

## Rule

For `dateDiff`, the third parameter must be a raw lowercase unit string:

- `"year"`
- `"month"`
- `"day"`
- `"hour"`
- `"minute"`
- `"second"`

Do not encode this parameter as `[{ "type": "str", "value": "Year" }]` or another expression-token object. That shape can corrupt the expression editor display and fail runtime assignment.

The fourth parameter can be a blank array `[]` when the UI value is blank.
