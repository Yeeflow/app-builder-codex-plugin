# Form Action Set Data List Golden Reference Standard

## Scope

This standard covers the `setdatalist` step inside page/form actions on:

- Approval Form Submission and Task pages;
- Data List and Document Library custom forms;
- Dashboard pages.

Public Forms are excluded. Workflow `ContentList` nodes use the separate Workflow Set Data List standard.

## Export-backed baseline

`Leave Management-v1.5.yapk` export-proves ten Form Action steps:

- Approval Submission: conditional Add, conditional Update, and Delete;
- Data List View Item: update current record, Add/Update another Data List, and Delete;
- Dashboard: Add, Update, and Delete.

`Leave Management-v1.6.yapk` adds direct export evidence for:

- Approval Task Form Add/Edit/Remove using the same serialization as Submission Form;
- Document Library View Form current-record Edit;
- one-file Document Library Add from a Data List View Form, including `_Path` and Upload File.

The export is evidence only and is not committed. Normalized references under `docs/reference/form-action-set-data-list-*.template.json` contain no tenant IDs or business data.

## Canonical serialization

Every step uses `type: "setdatalist"`. Its operation is represented by `attrs.type` (`add`, `edit`, `remove`); an export may omit `attrs.type` for Add or current-record Edit, but generated output should be explicit.

- selected target: `attrs.listtype = "select"` plus `attrs.list.AppID/ListSetID/ListID`;
- current record: `attrs.listtype = "current"`, no target list;
- Add/Edit mappings: `attrs.listdatas[]` with `Columns`, `Per`, and expression-token `Data[]`;
- selected Edit/Remove scope: non-empty `attrs.wheres[]`;
- optional status result: `code` plus `codeparent`;
- optional item result: `itemid/itemidparent` or export-backed `totalcount/totalparent`;
- optional execution condition: step-level `condition[]`;
- continue after unmet condition: step-level `continue: true`.

## Operation decisions

| Need | Form Action mode |
| --- | --- |
| Create one target record | `select + add` |
| Update bounded target records | `select + edit` with filters |
| Delete bounded target records | `select + remove` with filters |
| Immediately update the viewed Data List/Document Library record | `current + edit` |
| Change values on a New/Edit form before submit | Prefer Set Variable + Submit Form |
| Expand every Sub List row into a target row | Not supported in Form Action; use Workflow Set Data List |
| Add one file to a Document Library | `select + add`, map `_Path` when needed and map Upload File `Text4` |
| Add multiple selected files | Not supported in Form Action; use Workflow Set Data List with Loop or another workflow pattern |

## Numeric mapping operations

`Per` is part of each mapped target field:

- `0`: Value;
- `1`: Increase;
- `2`: Decrease;
- `3`: Multiply;
- `4`: Divide.

Arithmetic operations require a numeric target field and numeric-compatible right-side expression.

## Host differences

Approval Form Actions can read workflow variables and page temp variables. v1.6 directly proves that Task pages use the same action wrapper and Set Data List serialization as Submission pages. Print Page Set Data List remains focused-export-proof-required in this training round.

Data List/Document Library custom forms can read current list fields. View Item uses Set Data List for persistent current-record commands because Submit Form is unavailable. New/Edit should normally use Set Variable followed by Submit Form.

Data List and Document Library New/Edit/View forms share one custom-form serializer. A selected Document Library Add must map the native Upload File field `Text4`; `_Path` is a valid Document Library pseudo-field and may contain `folder/subfolder` expression tokens. Form Action has no Loop and accepts one file value per Add step. Array, multi-file, List, and Sub List sources are invalid here.

Dashboard Form Actions can mutate selected Data Lists/Document Libraries only. Execute-result outputs must use declared Dashboard temp variables. Click actions may bind to Buttons or Containers through `attrs.control_action`.

## Hard gates

Signing must fail for:

- Public Form placement;
- unknown operation or target mode;
- selected target without a resolvable Data List/Document Library;
- selected Edit/Remove without filters;
- Add/Edit without mappings;
- unresolved target mapping/filter fields;
- undeclared execute-result temp variables;
- partially configured execute-result target pairs or an invalid item/count result attribute;
- Dashboard result targets that are not temp variables;
- Sub List bulk-row sources in a Form Action Set Data List step;
- Document Library Add without the native `Text4` Upload File mapping;
- multi-file, array, List, or Sub List sources mapped to Document Library Upload File;
- generated steps without concise business names.
- click/change/Collection triggers without an exact bound control identity in the App Plan.

Run:

```bash
node scripts/validate-form-action-set-data-list-plan.mjs --plan <app-plan.md>
node scripts/validate-form-action-set-data-list.mjs --package <app.yapk> --plan <app-plan.md> --strict-generated
node scripts/inspect-form-action-set-data-list-yapk.mjs --package <reference.yapk>
```

## Proof boundary

This training provides export-backed serialization, shared generation, and validator-backed pre-signing gates. It does not claim live mutation execution until a separate safe runtime proof creates, updates, and deletes disposable records in an authorized environment.
