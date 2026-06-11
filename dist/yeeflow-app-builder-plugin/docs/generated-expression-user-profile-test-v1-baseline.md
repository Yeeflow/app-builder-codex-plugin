# Generated Expression User Profile Test v1 Baseline

`Expression User Profile Test v1` is the first generated Yeeflow app focused on user/profile expression functions.

## Generated Package

- Source app definition: `expression-user-profile-test-v1-app-def.json`
- Approval form definition: `expression-user-profile-test-v1-approval-form-def.json`
- Target list definition: `expression-user-profile-test-v1-request-list-def.json`
- Wrapper package: `Expression User Profile Test v1.generated.yap`
- User-test copy: `<downloads>/Expression User Profile Test v1.generated.yap`
- Generator: `generate-expression-user-profile-test-v1.mjs`

## Learned Functions

- `getUserAttr`
- `getOrgAttr`
- `getLocAttr`
- `dateFormat`
- `dateAdd`

Important naming rule: the user note mentioned `getDeptAttr`, but the decoded export-backed function for department/organization values is `getOrgAttr`. Generated packages must preserve `getOrgAttr` until another export proves `getDeptAttr`.

## Token Pattern

The current-user token is an application expression token:

```json
{
  "id": "CurrentUser",
  "exprType": "application",
  "valueType": "string",
  "type": "expr",
  "name": "Context:Current User"
}
```

Attribute parameters are descriptor objects:

```json
{ "key": "Email", "label": "Email" }
```

Fallback values are expression arrays:

```json
[{ "type": "str", "value": "N/A" }]
```

## Boarding Anniversary Expression

The generated test used:

```text
dateFormat(dateAdd(getUserAttr(Context:Current User, Boarding Date, N/A), "year", 1), "MMM DD, YYYY")
```

In token form, `Boarding Date` maps to the export-backed `LatestHireDate` key. In the tested tenant, `Boarding Date` was blank, while the nested anniversary expression rendered `Dec 31, 2099`; treat populated boarding-date arithmetic as data-dependent until tested with a user profile containing that date.

## Runtime Result

Runtime-tested on `https://<yourdomain>.yeeflow.com/`.

Passed:

- app imported
- app opened
- Overview dashboard rendered
- `Expression User Profile Requests` list opened without `datas/query` 400
- submission form opened
- user/profile expressions rendered on the submission page
- request submitted successfully
- Finance Review task opened
- same user/profile expressions rendered on the task page
- task approved
- workflow reached completed status
- ContentList created a readable target list record

Observed rendered values included:

- User Name: `Renger from Yeeflow`
- Login Account: `Renger@yeeflow.com`
- Email: `Renger@yeeflow.com`
- Department Name: `Default`
- Parent Department Name: `Codex in Yeeflow`
- Line Manager Name: `Renger from Yeeflow`
- Employee No.: `001`
- Job Title: `Admin`
- Job Grade: `0`
- Created Time: `May 12, 2026`
- Optional phone/address/location values safely rendered as blank or `N/A`

ContentList created a row with the generated request number, user name, login/email, and `Created From Workflow = ON`.

## Validation Result

Passed local validation:

- `node --check generate-expression-user-profile-test-v1.mjs`
- `node --check yeeflow-expression-utils.js`
- `node scripts/smoke-expression-validation.mjs`
- JSON parse checks for normalized references and generated definitions
- `validate-yap-package.js` with warnings only
- `validate-yap-graph.js`
- `validate-ywf-def.js` with warnings only for export-backed/unclassified controls
- `validate-ydl-list.js` with warnings only
- `workflow-action-config-validator.js`
- `build-yap-wrapper.js` round-trip validation, including decoded-equals-source

## Text Control Compliance

The generated package keeps the learned Text control standard:

- no generated Text/heading control uses `attrs.heads.color` as an array
- generated heading controls use inline width by default through `attrs.common.positioning.widthtype = [null, "2"]`
- visible expression display uses calculated controls for persistence-oriented values rather than the old broken Text control shape

## Remaining Gaps

- `getLocAttr` is structurally valid but tenant-data dependent because the tested current user had no visible location value.
- Boarding Date was blank in the tested tenant, so the one-year anniversary expression needs a populated profile for final date-arithmetic verification.
- Profile image expression display is learned from the patch export but deferred from generated runtime testing.
