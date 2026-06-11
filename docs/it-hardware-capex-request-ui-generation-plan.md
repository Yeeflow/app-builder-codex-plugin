# IT Hardware CAPEX Request UI Generation Plan

## Source Priority

1. `IT Hardware CAPEX Request.md` for function, fields, sections, workflow, and persistence intent.
2. `it_hardware_capex_request_page.jsx` for visual hierarchy and layout.
3. Yeeflow Application Design System docs for native shell and control naming.
4. Control/field normalized references for control support and fallback rules.

## V1 Scope

- One app package.
- One `IT Hardware CAPEX Requests` data list.
- One app-level approval form with submission and task pages.
- One simple Overview dashboard.
- Native Yeeflow controls only.
- No custom code.
- No external integrations.
- No document libraries, reports, AI, or Copilot resources.

## V2 Runtime Patch

V1 imported and rendered enough to inspect, but Yeeflow workflow publishing failed because the runtime expected `TaskUrl` on the `Request Submission` workflow node. V2 keeps the same scope with a fresh ID family and FlowKey, adds both `taskurl` and `TaskUrl` to task/start workflow nodes, and includes an explicit `Request Submission` task that uses standard Approved/Rejected routing.

## Layout Strategy

- Root app shell with dashboard, list, and approval-form navigation.
- Approval pages use `Main` -> `Content` -> `Form body` and `Form bottom`.
- `Form body` contains the request summary panel, workflow route panel, routing controls panel, and ten section cards.
- `Form bottom` contains Action Panel and Flow History.
- Data list custom forms use the design-system `Main` -> `Content` shell.

## Persistence Strategy

Persist core request fields through a workflow `ContentList` node into Text, Decimal, Bit, and Datetime list fields.

Fallbacks:

- identity/location/cost-center values persist to Text fields
- file upload/icon upload/signer are approval-form controls only in v1
- rich text persists only when mapped to Text fallback fields in future phases

## Workflow Strategy

V1 uses a linear workflow with rejection paths. Conditional InclusiveGateway routing is deferred until the current package has runtime import/open proof.

## Runtime Checklist

1. Import app into `https://<yourdomain>.yeeflow.com`.
2. Confirm import popup shows name/icon/description.
3. Open app.
4. Confirm Overview dashboard renders.
5. Confirm `CAPEX Requests` list opens without `datas/query` 400.
6. Confirm Edit/View custom forms open.
7. Publish/open approval form if Yeeflow requires manual publish after import.
8. Confirm submission page renders native sections/cards.
9. Test dynamic display rules for the six conditional fields.
10. Submit a basic request.
11. Open task page and approve/reject where practical.
12. Confirm `ContentList` creates a record if the full workflow path is completed.

## Runtime Result

V2 passed the import/open/publish baseline:

- app imported as `IT Hardware CAPEX Request Runtime V2`
- Overview dashboard rendered
- sample CAPEX records rendered in the dashboard Collection
- `IT Hardware CAPEX Requests` list opened without `datas/query` 400
- approval form rendered using native Yeeflow controls and card sections
- workflow designer opened
- publish succeeded

Full downstream approval-chain completion remains a v2-plus verification item because picker, upload, and signer controls are environment-dependent.
