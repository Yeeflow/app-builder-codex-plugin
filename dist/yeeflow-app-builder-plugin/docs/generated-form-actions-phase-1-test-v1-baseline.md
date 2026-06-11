# Generated Form Actions Phase 1 Test v1 Baseline

## Package

- Generator: `generate-form-actions-phase-1-test-v1.mjs`
- Decoded app: `form-actions-phase-1-test-v1-app-def.json`
- Approval form: `form-actions-phase-1-test-v1-approval-form-def.json`
- Data list: `form-actions-phase-1-test-v1-request-list-def.json`
- Wrapper: `Form Actions Phase 1 Test v1.generated.yap`
- Runtime import copy: `<downloads>/Form Actions Phase 1 Test v1.generated.yap`

The regenerated local package uses fresh ID family `473` and form key `FAP1S`.

## Local Validation

Passed:

- `node --check generate-form-actions-phase-1-test-v1.mjs`
- `node generate-form-actions-phase-1-test-v1.mjs`
- `node validate-yap-package.js form-actions-phase-1-test-v1-app-def.json --mode generator --stage final`
- `node validate-yap-graph.js form-actions-phase-1-test-v1-app-def.json --mode generator --stage final`
- `node validate-ywf-def.js form-actions-phase-1-test-v1-approval-form-def.json --mode final`
- `node validate-ydl-list.js form-actions-phase-1-test-v1-request-list-def.json --mode generator --stage final`
- `node scripts/smoke-expression-validation.mjs`
- `node build-yap-wrapper.js form-actions-phase-1-test-v1-app-def.json "Form Actions Phase 1 Test v1.generated.yap"`
- wrapper package/graph validation

Remaining warnings are expected for this stage: `action_button` and `flex_grid` are still warning-first schema-supported controls, and the requester identity-picker is environment-dependent.

## Runtime Result

Status: partial pass.

Runtime app tested: `Form Actions Phase 1 Test v1 Runtime`.

Passed:

- App imported.
- Workflow published after user manually corrected the reviewer assignee.
- Approval form opened.
- Button style gallery rendered.
- Page-load form action initialized visible form state.
- Button-click Set Variable action updated Request Title.
- Toggle Temp Status action updated visible temp status.
- Confirm dialog opened and returned `true` into the temp display.
- Reset Temp Status action updated visible temp status.
- Submit worked.
- Reviewer task opened.
- Approval completed.

Not yet passed:

- ContentList persistence did not create a new target list row in the imported runtime app. The target list still showed only the seed record after approval and refresh.

## Assignee Root Cause

The first generated package used a tenant-specific direct-user assignment:

```json
{
  "type": "user",
  "method": "users",
  "value": ["1697103066163843073"],
  "title": "User:Renger"
}
```

In the imported designer this appeared as `User:Renger`, which was not a valid selectable user. Publish failed until the assignee was removed and manually re-added as the existing user `User: Renger from Yeeflow`.

Generator rule promoted from this runtime finding:

- Do not hardcode direct user IDs or display titles in generated workflow assignment tasks.
- Prefer an export-backed requester/current-user expression assignment.
- Use direct-user assignment only when the package is intentionally tenant-specific and the user object is proven valid in the target tenant.

The local generator was updated to use requester-expression assignment and variable-button ContentList mappings for the next import test package.

## Runtime Classification

- Button styles: runtime-proven.
- Button click trigger: runtime-proven.
- Page load trigger: runtime-proven.
- Temp variables: runtime-proven for UI state/display.
- `setvar` step: runtime-proven for temp variables and workflow text variable updates.
- `confirm` step: runtime-proven for opening the dialog and storing a boolean-like result in a temp variable.
- Submit/approval task flow: runtime-proven after valid assignee correction.
- ContentList persistence: pending for this Form Actions Phase 1 package.

## Next Step

Import-test the regenerated `473`/`FAP1S` package. It removes the direct-user assignee and uses proven workflow-variable button mappings for ContentList persistence.
