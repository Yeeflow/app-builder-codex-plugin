# Workflow Assignee Expression Serialization Standard

## Scope

This standard applies to expression-based `usertaskassignment[]` entries on Approval, Data List, and Scheduled workflows, including Assignment Task and Claim Task receiver expressions.

## Canonical Syntax

Workflow assignee Expression Buttons use Yeeflow variable JSON syntax. They are not ordinary JSON objects wrapped in a template string.

Applicant line-manager outer expression:

```text
${ "type":"user", "param":{"id":"${\"type\":\"application\",\"prop\":\"ApplicantUserID\"}"},"prop":"LineManager"}
```

Required properties:

- The outer expression starts with `${` followed by object members. It must not start with `${{`.
- `param.id` for manager and organization-property expressions contains a nested `${...}` expression.
- `ApplicantUserID` uses nested `type=application` context.
- Workflow user variables use nested `type=variable` context when a property such as `LineManager` is selected.
- `usertaskassignment[].title` and `.value` preserve the same Expression Button data.
- Multiple assignees remain separate array entries.

## Prohibited Shapes

These are generated-final blockers:

```text
${{"type":"user",...}}
```

```json
{
  "param": {
    "id": "{\"type\":\"application\",\"prop\":\"ApplicantUserID\"}"
  }
}
```

The first shape incorrectly wraps ordinary JSON as `${{...}}`. The second stores plain JSON text where nested Yeeflow `${...}` variable JSON is required.

## Generation Contract

- Use `scripts/lib/workflow-assignee-expression-utils.cjs` for serialization.
- Do not call generic `JSON.stringify()` and interpolate the result directly as `data="${...}"`.
- Standalone `.ywf` and full-application `.yapk` generation must share this serializer.
- Approval, Data List, and Scheduled workflow materializers must not implement separate assignee Expression Button builders.

## Validation Contract

Validators must HTML-decode the Expression Button `data` attribute, parse the outer Yeeflow variable JSON, recursively parse nested `param.id` expressions, and then validate the semantic expression tree. Manager labels alone are not proof that the expression is valid.

Hard gates:

- `WORKFLOW_ASSIGNEE_EXPRESSION_OUTER_SHAPE_INVALID`
- `WORKFLOW_ASSIGNEE_EXPRESSION_PARSE_FAILED`
- `WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_MISSING`
- `WORKFLOW_ASSIGNEE_NESTED_EXPRESSION_INVALID`
- `WORKFLOW_ASSIGNEE_EXPRESSION_TITLE_VALUE_MISMATCH`
- `ASSIGNMENT_TASK_VARIABLE_UNRESOLVED`

Generator output should match the canonical golden value. Validators should tolerate insignificant whitespace while enforcing the same parsed expression tree.

## Proof Boundary

Serializer and validator success prove export-compatible package structure. They do not prove live task routing. Runtime proof still requires submission, task creation, and observed assignee ownership in the target tenant.
