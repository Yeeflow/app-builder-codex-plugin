# Workflow Condition Editor Variable Conditions

Date studied: 2026-07-07

Source exports studied read-only:

- `Approval form condition sample 01.ywf`
- `workflow_condition_editor_sample.JSON`

## Scope

This study covers Yeeflow Workflow `SequenceFlow.properties.conditioninfo[]` rows where:

- the left operand is a Workflow variable selected from the Condition editor (`left.type = 1`);
- the right operand is either a direct/static value (`right.type = 0`) or an Expression editor value (`right.type = 2`).

The same rule applies to Approval form workflows, Data list workflows, and Scheduled workflows because they share the Workflow designer condition editor contract.

## Canonical Row Shape

```json
{
  "key": "774263d9-9944-410d-9fca-65d0225bf2f9",
  "pre": "and",
  "left": {
    "type": 1,
    "value": {
      "exprType": "variable",
      "valueType": "text",
      "id": "ProjectDetails",
      "type": "expr"
    }
  },
  "op": "s.=",
  "right": {
    "type": 0,
    "value": "abc"
  },
  "group": "string"
}
```

Required fields:

- `key`: stable condition row UUID for generated rows.
- `pre`: `and` or `or`.
- `left.type`: `1`.
- `left.value.exprType`: `variable`.
- `left.value.valueType`: the Workflow variable type.
- `left.value.id`: the Workflow variable id from `DefResource.variables`.
- `left.value.type`: `expr`.
- `op`: operator with the correct Condition editor type prefix.
- `right.type`: `0` for direct/static values, unless the operator is a null check.
- `right.type`: `2` for Expression editor values. `right.value` is an expression-token array.
- `group`: one of `general`, `string`, `number`, `boolean`, `datetime`.

## Condition Editor Type Mapping

The Workflow variable type is not always the same as the Condition editor group. The editor only exposes these groups:

| Condition editor group | Operator examples | Workflow variable types |
|---|---|---|
| `general` | `isNull`, `isNotNull` | `file`, `img`, `image`, `signature`, `signer` |
| `string` | `s.=`, `s.!=` | `text`, `list`, `richtext`, `metadata`, `mutiple-metadata`, `dict`, `lookup`, `user`, `groupselect`, `department`, `organization`, `location`, `costcenter` |
| `number` | `n.=`, `n.>=`, `n.>` | `number`, `decimal`, `currency`, `percent`, `rate` |
| `boolean` | `b.=`, `b.!=` | `boolean`, `bit`, `switch` |
| `datetime` | `dt.=`, `dt.!=`, `dt.>=`, `dt.<=`, `dt.>`, `dt.<`, `isNull`, `isNotNull` | `date`, `datetime`, `datepicker`, `time` |

IDs from selectable objects such as User, Department, Location, Cost Center, Metadata, Lookup, and Dictionary values are compared as `string` conditions. They are not `general` conditions merely because the UI value is an object in product terms.

## Direct Right Value Rules

- String conditions store literal values as strings, numbers, booleans, or arrays of strings for multi-select metadata.
- Number conditions store numeric literals as numbers or numeric strings.
- Boolean conditions may store `true`/`false` as booleans or strings. The export sample used `"true"`.
- Date Time conditions store direct date/time values as non-empty strings. Prefer the export-observed `YYYY-MM-DD HH:mm:ss` shape when the right value includes time, for example `"2026-07-07 04:45:58"`.
- General conditions are null checks only in this direct-value training round.
- `isNull`, `isNotNull`, `b.isTrue`, and `b.isFalse` do not include a right operand.

## Expression Editor Right Value Rules

Use `right.type = 2` only when the comparison value must be dynamic, calculated, function-derived, or assembled from multiple tokens. If the comparison value is fixed and known, prefer `right.type = 0` for a direct value.

Canonical expression right shape:

```json
{
  "right": {
    "type": 2,
    "value": [
      { "type": "str", "value": "ABC" },
      { "type": "op", "op": "&" },
      { "type": "str", "value": "D" }
    ]
  }
}
```

Export-observed golden reference patterns:

- String concatenation: `Name s.= "ABC" & "D"`.
- Numeric calculation: `Amount n.>= 1204 + 3`.
- Boolean dynamic result: `SensitiveData b.= iif(EquipmentType == "abc", true, false)`.
- Current user comparison: `ProjectManager s.= currentUser()`.
- Applicant Department: `ProjectDepartment s.= getUserAttr(Instance:Applicant, DepartmentID, [])`.
- Applicant Location: `ProjectLocation s.= getUserAttr(Instance:Applicant, LocationID, [])`.
- Cross-variable comparison: `EquipmentType s.= Workflow Variables:Select Project`.
- Relative Date Time: `EffectiveDate dt.>= dateAdd(now(), "month", 1)`.

`right.type = 2` values must be non-empty expression-token arrays. Do not serialize the expression as a raw string, legacy expression-button HTML, or a primitive value.

## Two-Layer Condition Groups

The Workflow Condition editor supports condition grouping with at most two layers:

1. top-level rows in `SequenceFlow.properties.conditioninfo[]`;
2. one child condition group layer in a top-level row's `conditions[]`.

There is no third nested condition group layer in the approved generation contract.

Export-proven top-level group wrapper shape:

```json
{
  "key": "5a50a125-3d96-46ad-990f-3f6b56ff3f3c",
  "pre": "and",
  "left": null,
  "op": "isNull",
  "right": null,
  "conditions": [
    {
      "key": "c82e2492-5826-401f-a0d4-3a84a7072966",
      "pre": "and",
      "left": {
        "type": 1,
        "value": {
          "exprType": "variable",
          "valueType": "date",
          "id": "EffectiveDate",
          "type": "expr"
        }
      },
      "op": "dt.>=",
      "right": {
        "type": 0,
        "value": "2026-07-07 05:21:53"
      },
      "group": "datetime"
    }
  ]
}
```

Rules:

- The group wrapper row uses `left: null`, `op: "isNull"`, and `right: null`.
- The group wrapper's `pre` connects the entire group to the previous top-level condition row.
- Each child condition row has its own `pre` value, either `and` or `or`.
- Use a child group with `pre: "and"` rows for grouped ranges, for example `EffectiveDate >= X AND EffectiveDate < Y`.
- Use a child group with `pre: "or"` rows for grouped alternatives, for example `Name == Food OR Name == Drink`.
- Every child condition row follows the same variable, group, operator, and right operand rules as a top-level row.
- A group must include at least one child condition.
- Do not put `conditions[]` inside another child condition group.

## Assignment Task Outcome Conditions

Assignment task outgoing branches such as `Approved`, `Rejected`, and `Completed` are not normal workflow-variable comparisons. They must compare the current task's `Outcome` property against a task outcome button value.

Export-proven shape:

```json
{
  "key": "5b2e9de3-fb38-43c5-abf6-fe57b49c243c",
  "pre": "and",
  "left": "<input type=\"button\" data=\"${&quot;type&quot;:&quot;task&quot;,&quot;param&quot;:{&quot;defid&quot;:&quot;<source task id>&quot;}, &quot;prop&quot;:&quot;Outcome&quot;}\" expr=\"__\" tabindex=\"-1\" value=\"Line manager approval:Outcome\">",
  "op": "s.=",
  "right": "<input type=\"button\" data=\"Approved\" expr=\"__\" tabindex=\"-1\" value=\"Task outcome:Approved\">"
}
```

Rules:

- `left` must be an export-style expression-button HTML string.
- `left.data` must contain `type = "task"`, `param.defid = <source Assignment task id>`, and `prop = "Outcome"`.
- `right` must be an export-style Task outcome expression-button string.
- `right.value` must match the outgoing branch: `Task outcome:Approved`, `Task outcome:Rejected`, or `Task outcome:Completed`.
- Do not generate a simplified workflow variable token such as `left.value.id = "Outcome"` for Assignment task output branches.

## Generation Rules

Generated direct-value workflow conditions must:

1. Resolve `left.value.id` to an existing Workflow variable before packaging.
2. Set `group` from the Workflow variable type using the mapping above.
3. Select an operator compatible with that group.
4. Use `right.type = 0` for fixed direct/static values.
5. Use `right.type = 2` only for dynamic, calculated, function-derived, or value-processed comparison operands.
6. Use `pre = "and"` by default; use `or` only when the business rule requires it.
7. Use top-level condition group wrappers when a business rule needs a nested set of child `and` or `or` rows. Keep condition nesting to two layers only.
8. Keep visible connector labels concise. Store the full logic in `conditioninfo`.
9. For Date Time workflow variables such as `EffectiveDate`, use `group: "datetime"` and the `dt.` operator family for equality and ordering comparisons. Use `right: null` for `isNull` / `isNotNull`.
10. For Assignment task outcome branches, use the task Outcome expression-button shape, not the workflow-variable left wrapper.
11. For business fan-out branches from the same workflow node, generate explicit coverage for all possible cases. Yeeflow workflow does not have an implicit `else` or `default` branch; an unconditioned outgoing SequenceFlow is not a valid fallback. If a variable such as `TravelType` has options `type1`, `type2`, `type3`, and `type4`, and the planned branches cover only `TravelType == type1` and `TravelType == type2`, generate another conditioned branch such as `TravelType != type1 AND TravelType != type2` to cover the remaining values. If all known options are individually routed, no complement branch is required.

Do not:

- use `s.=` for number variables;
- use `n.=` for text/status/string variables;
- treat User/Department/Location/Lookup values as `general`;
- leave `right` as a raw primitive when the Condition editor right wrapper is required;
- use `right.type = 2` for fixed literal values that should be direct `right.type = 0`;
- generate third-level nested `conditions[]` groups;
- generate group wrapper rows with real `left` operands or literal right operands;
- generate `left.value.id = "Outcome"` for Approval task `Approved` / `Rejected` / `Completed` branches;
- materialize a condition that references a missing Workflow variable.
- rely on a blank/unconditioned SequenceFlow as a workflow `else` / `default` branch;
- generate variable equality fan-out branches without either covering all known option values or adding an explicit `!= coveredValue` complement branch.

## Branch Coverage Rules

Workflow branch coverage is a logic-safety gate, not a visual layout rule. It applies to Approval form workflows, Data list workflows, and Scheduled workflows.

Required pattern for partial option routing:

```text
TravelType == type1 -> Branch A
TravelType == type2 -> Branch B
TravelType != type1 AND TravelType != type2 -> Branch C
```

The complement branch must contain real `conditioninfo[]` rows. Do not omit `conditioninfo` and call that line a default branch.

Validation requirements:

- For a source node with multiple business SequenceFlow branches, collect direct equality conditions by workflow variable.
- If the variable has known choices and every choice has a matching equality branch, the fan-out is covered.
- If only some choices are covered, at least one outgoing branch must contain `AND` not-equals rows for every already covered equality value.
- If choices are not known but the generator creates multiple equality branches for a variable, require the explicit not-equals complement branch.
- Skip Assignment task outcome branches because `Approved`, `Rejected`, and `Completed` are validated by the task outcome condition contract.

## Proof Boundary

This training is export-proven and validator-backed. It does not claim runtime execution proof for every operator or every expression function. Expression-editor right operands (`right.type = 2`) are learned from the provided export examples for generation and validation shape.
