# YAPK Generation Guardrails

These rules encode the Leave Request Application lessons for future generated `.yapk` packages.

## Leave Request Lessons

- Local schema validation did not make the first package upload-ready because its `Sign` was still a placeholder.
- API install acceptance did not prove runtime UI completeness; the first installed package still lacked the planned approval form and grouped navigation.
- The approved app plan was the implementation contract. A package with `Forms: []` was incomplete because the plan required a leave request approval workflow.
- Local navigation conformance accepted `children`, but Yeeflow runtime grouped navigation required `Type: "classes"` with `list`.
- Generated reports must separate schema validation, signing proof, API install acceptance, runtime UI proof, and deferred scope.

## Signing Gate

A generated `.yapk` package must not be called upload-ready, install-ready, or handoff-ready while `Sign` is empty, placeholder-like, or an all-zero 32-byte value.

When API-key or OAuth access is available, the generation workflow must:

1. Validate decoded `AppPackageInfo` content.
2. Call `POST /utils/apppackage/setsign`.
3. Confirm the returned signature has the expected 32-byte shape.
4. Call `POST /utils/apppackage/verifysign`.
5. Report signing proof separately from schema validation and runtime proof.

Local schema validation alone is not upload/install readiness.

## Approval Form Completeness

If an approved plan includes an approval workflow or approval form, generated output must include the approval form and workflow resources or be explicitly marked incomplete/staged.

Generated packages must not silently ship with `Forms: []` when the plan requires approval forms. Required approval-form content includes:

- request page
- task page or task pages
- `workflowControlPanel`
- `workflowHistory`
- process `DefResource` in the YAPK approval-form encoding
- workflow `childshapes` with Start, task, sequence, and end nodes

If approval-form generation is deferred, state the deferred scope in the generation report and get user approval before handoff.

## Navigation Gate

Root application navigation must use export-proven Yeeflow runtime shapes:

```json
{
  "Title": "Requests",
  "Type": "classes",
  "list": [
    {
      "Title": "New Leave Request",
      "Type": 105,
      "ListID": "LEAVE_REQUEST_APPROVAL_FORM"
    }
  ]
}
```

Do not use local-only group structures such as `children` or `Childs` for runtime navigation groups.

Navigation entry targets:

- dashboard/page: `Type: 103`, target an included `Pages[].LayoutID`
- approval form: `Type: 105`, `ListID` equal to an included `Forms[].Key`
- data list: `Type: 1`, `ListID` equal to an included child list ID

Every generated page, list, or form intended for use must be reachable through visible navigation or explicitly documented as hidden/deferred.

## Environment Checklist

Before package signing or package automation, check presence without printing values:

- `YEEFLOW_API_BASE_URL`
- `YEEFLOW_API_KEY` or an authenticated OAuth session
- `YEEFLOW_TENANT_URL`
- `YEEFLOW_WORKSPACE_ID` when install/import/upgrade APIs are used

Missing environment values should block automation before request shaping. Never print or commit `.env.local`, token files, cert/key files, tenant URLs, raw API responses, decoded payloads, or generated runtime packages.

## Final Runtime Checklist

Runtime UI proof requires inspection after install/import/upgrade acceptance:

- app opens
- navigation groups render
- approval form appears
- request page opens
- task pages exist
- data lists open
- dashboards/pages render
- generated pages are reachable
