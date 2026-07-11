# Form Action Query Data v1.4 Training Report

## Focused Source

`Approval form workflow sample-v1.4.yapk` extends the prior application with four focused proofs.

## Pagination Serialization

Dashboard `My latest event` -> `All my events` exports:

```json
{
  "querydata_pagesize": 5,
  "querydata_pageindex": 2
}
```

`querydata_pageindex` is the canonical Page Number property. Approval Form, Custom Data List Form, Document Library custom form, and Dashboard Query Data share this serialization. Omission means Page Size 100 and Page Number 1. Page Size remains limited to 1..1000; Page Number must be a positive integer.

## Dashboard Multiple Results To Temp JSON

The same step saves selected fields to declared temp variable `var_QueryDataValue` with:

- `querydata_type: "multiple"`;
- `querydata_listname_parent: "__temp_"`;
- `querydata_vartype: "text"`;
- `querydata_fields[]` selecting Name, Date, Description, and Budget;
- optional count output to another declared temp variable.

The temp value is a JSON array/object payload scoped to the page. It is not a Collection/Data Table data source. For diagnostic/plain-text output, use the exact expression function `JSONStringfy`. If business requirements genuinely need a table, plan a Custom Code control and read the value using `context.getTempVar('<temp-id>')`; validate parsing, empty state, and error state. Do not add Custom Code by default when plain text or standard data-source controls satisfy the requirement.

## Document Library Custom Form

`Event Documents` is a native `Type: 16` Document Library. Its `View Document` custom form uses the same `formAction.onLoad`, `actions[]`, Query Data filter, and temp-variable mapping contracts as a Data List custom form. The host lookup field is an expression-token operand with `showCus: false`.

This proves Document Library as a Form Action host. It does not by itself prove querying a Document Library as the Query Data source; source-type evidence remains separate.

Form Report and Data Report do not provide independent custom Form Action hosts. A Form Report detail uses the underlying Approval Submission form; a Data Report is data-only.

## Approval Task Form

The Approval form adds a `pageurls[]` entry with `type: 2`. Its Task Form action wrapper is the same as Submission Form: `formdef.formAction.onLoad` points to an action in `formdef.actions[]`, and the action contains Query Data steps. Task Form targets must still be declared in that task page/workflow context.

## Proof Boundary

The export proves structure and serialization. Runtime query results, page-2 correctness, Custom Code table rendering, and task-form execution remain separate runtime proofs.
