# Form Actions Phase 3 Step Condition Flow Study

Source export: `/Users/Renger/Downloads/Implant Application Request (2).ywf`

Scope:

- approval form: `Implant Application Request`
- form action: `Check and Submit the form`
- step: `Warn when family quota is exceeded`
- step-level execution conditions and the designer checkbox `Continue next step when condition is not met`

The uploaded export was decoded read-only. Large numeric IDs are preserved as strings in the inspection artifact.

## Export-Backed Property

The designer checkbox `Continue next step when condition is not met` is stored on the action step as:

```json
"continue": true
```

Observed path:

```text
pageurls[0].formdef.actions[].steps[].continue
```

The checked export-backed warning step:

```json
{
  "type": "confirm",
  "name": "Warn when family quota is exceeded",
  "condition": [
    { "exprType": "variable", "valueType": "text", "id": "ApplicationType", "type": "expr", "name": "Workflow Variables:Application Type" },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "Family" },
    { "type": "op", "op": "and" },
    { "exprType": "variable", "valueType": "text", "id": "QuotaExceeded", "type": "expr", "name": "Workflow Variables:Quota Exceeded" },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "Yes" }
  ],
  "attrs": {
    "confirm_qs": [
      {
        "type": "str",
        "value": "Family quota appears to be exceeded. Submission is blocked for v1; please adjust product rows or ask HR to verify quota/profile data."
      }
    ],
    "confirm_rs": {
      "exprType": "variable",
      "valueType": "text",
      "id": "__temp_var_SubmitGuardResult",
      "type": "expr",
      "name": "var_SubmitGuardResult"
    }
  },
  "continue": true
}
```

Unchecked/default is represented by a missing `continue` property or a falsy value. The same action's final conditional submit step has a `condition` but no `continue` property because it is the final step.

## Condition Flow Behavior

Default behavior:

- If a step has an execution condition and the condition is met, the step executes.
- If the condition is not met and `continue` is missing or false, the step is skipped and the remaining action flow stops.
- This default can accidentally block the valid path when a conditional warning step appears before a required submit step.

Continue behavior:

- If a step has an execution condition and the condition is not met while `continue: true`, the step is skipped and the action continues to the next step.
- This is the required shape for conditional guard/warning steps before submit.

## Submit Guard Pattern

Use this shape for submit guards:

1. Run the reusable validation/check action.
2. Run a conditional warning/confirm step for the invalid or warning case.
   - `condition`: the blocking/warning case, such as `ApplicationType == Family and QuotaExceeded == Yes`
   - `continue: true`
3. Run a submit step after the warning.
   - `condition`: the valid path, such as `ApplicationType != Family or QuotaExceeded != Yes`

For the Employee Family Implant v1 form, the export-backed action sequence is:

```text
Check and Submit the form
1. Run family quota check before submit
2. Warn when family quota is exceeded
   - condition: ApplicationType == Family and QuotaExceeded == Yes
   - continue: true
   - result variable: __temp_var_SubmitGuardResult
3. Submit when quota is valid or not a family request
   - condition: ApplicationType != Family or QuotaExceeded != Yes
```

The warning/confirm result is stored in `__temp_var_SubmitGuardResult`. In the current v1 block design, the submit step does not proceed when quota is exceeded because its own condition requires quota not exceeded or a non-family request. If a future design allows override, the submit step condition must explicitly reference the confirm result and must not submit when the user cancels.

## Generator Rules

- Conditional warning/confirm/check/guard steps before a submit step usually need `continue: true`.
- Without `continue: true`, a valid request can skip the warning but never reach the submit step.
- Submit guard actions must prove both paths:
  - invalid or warning path executes the warning behavior
  - valid path skips the warning and reaches submit
- Do not add `continue: true` blindly to final steps where no following step should run.
- If a confirm result should permit an override, store it in a temp variable and put the override logic in the following submit step condition.

## Validator Rules

Warning-level validation is appropriate when:

- a conditional warning/confirm/check/guard step is followed by a submit step and lacks `continue: true`
- a form action wired to `formAction.onSubmit` has a conditional guard before submit that would stop the valid path on false
- a conditional warning step appears before submit and the following submit condition does not make a valid path obvious

This should be warning-level by default because some actions intentionally stop when a condition is false.
