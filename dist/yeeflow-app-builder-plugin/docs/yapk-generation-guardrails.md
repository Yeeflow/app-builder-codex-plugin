# YAPK Generation Guardrails

These rules encode the Leave Request Application lessons for future generated `.yapk` packages.

## Leave Request Lessons

- Local schema validation did not make the first package upload-ready because its `Sign` was still a placeholder.
- API install acceptance did not prove runtime UI completeness; the first installed package still lacked the planned approval form and grouped navigation.
- The approved app plan was the implementation contract. A package with `Forms: []` was incomplete because the plan required a leave request approval workflow.
- Local navigation conformance accepted `children`, but Yeeflow runtime grouped navigation required `Type: "classes"` with `list`.
- Generated reports must separate schema validation, signing proof, API install acceptance, runtime UI proof, and deferred scope.
- Generated-final packages must separate ID provenance validation and navigation runtime metadata validation from signing and install acceptance.

## API-Issued Content ID Provenance Gate

Every numeric generated application content ID must be allocated by Yeeflow ID API before package assembly:

```text
GET /utils/generate/ids?count=<n>
```

The generator must emit `dist/<app-name>-id-provenance-report.json` with `sourceMarker: "api-generated"`, path-to-purpose mappings, duplicate checks, unused-ID accounting, generator provenance metadata, and no non-API IDs.

Run:

```bash
node scripts/validate-yapk-id-provenance.mjs --package <app.yapk> --manifest <app-id-provenance-report.json>
```

Local `id()` helpers, hardcoded generated IDs, copied sample/export IDs, local counters, random values, timestamps, UUID fallback, and deterministic local-only seeds are generated-final blockers.

Wrapper `TenantID` is tenant metadata, not generated application content. Validate that it is a safe numeric tenant metadata value, but do not require it to appear in content ID allocations and do not count its absence from the ID provenance manifest as a generated-content failure. Continue requiring API-issued provenance for actual generated app resources such as root, list, page, form, report, and navigation IDs.

## Generated-Final Export-Shape Materialization Gate

Generated-final `.yapk` packages must be export-shaped enough for signing, install/materialization, designer opening, navigation, and browser runtime proof. Count-based resources, shell-only dashboards, and structurally approximate placeholders are not acceptable. Run:

```bash
node scripts/validate-generated-yapk-export-shape.mjs --package <app.yapk>
```

This gate runs inside `scripts/yapk-first-generation-preflight.mjs` before signing readiness. It validates generated package content only; do not move these requirements into the Functional Specification or Yeeflow App Plan.

Approval form `DefResource` must use the canonical approval package encoding: base64 bytes whose decoded payload begins with `::brotli::`, followed by Brotli-compressed JSON. The decoded definition must preserve export-style process metadata, request/task page registrations, embedded `formdef.children`, unique designer control IDs, workflow graph IDs, incoming/outgoing links, task URL references, graph positions, variables, and form key/defkey consistency. Minimal approval placeholders fail, and a package cannot pass by deleting required approval forms.

`FormNewReports` and `DataReports`, when emitted, must be export-shaped resources with source/report identity and selected fields in settings. Count-only placeholders fail. If a report is intentionally not produced for first install, the App Plan and generation report must explicitly mark it deferred with reason, user impact, fallback, and follow-up proof.

Dashboard pages must materialize visible business sections and controls bound to included package resources. Hidden Summary hosts, navigator labels, wrapper Containers, or synthetic-only controls do not count as visible dashboard proof. Summary/chart controls must fail unless the complete runtime-proven model contract is present. When Summary/chart proof is unavailable, generate visual-safe filters, tables, and Collections instead of risky chart approximations.

Native Title fields must preserve export-aligned metadata including `FieldName: "Title"`, `InternalName: "Title"`, `Status: 0`, `IsSystem: true`, and `IsIndex: true`.

## Signing Gate

A generated `.yapk` package must not be called upload-ready, install-ready, or handoff-ready while `Sign` is empty, placeholder-like, or an all-zero 32-byte value.

When API-key or OAuth access is available, the generation workflow must:

1. Validate decoded `AppPackageInfo` content.
2. Run `node scripts/yeeflow-yapk-sign.mjs --package <unsigned.yapk> --output <signed.yapk> --execute`; do not replace this entrypoint with task-local signing code.
3. Let the helper call `POST /utils/apppackage/setsign`, accept the documented JSON-object, top-level JSON-string, or plain base64 response shapes, and require an exact 32-byte base64 signature.
4. Let the helper call `POST /utils/apppackage/verifysign`; a successful empty response body is accepted when the HTTP status is successful.
5. Report signing proof separately from schema validation and runtime proof.

The helper preserves the unsigned source package and unchanged `Resource`, writes a separate signed output only after both operations succeed, and emits redacted diagnostics only. A helper failure leaves installation blocked. Never print or persist raw signing responses, signatures, `Resource`, decoded content, OAuth tokens, or tenant identifiers.

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

Root application navigation must use export-proven Yeeflow runtime shapes with full runtime metadata:

```json
{
  "ID": "<api-issued-id>",
  "AppID": 41,
  "ListSetID": "<current-root-listset-id>",
  "Title": "Requests",
  "Icon": "folder",
  "Type": "classes",
  "list": [
    {
      "AppID": 41,
      "Title": "New Leave Request",
      "Type": 105,
      "ListID": "LEAVE_REQUEST_APPROVAL_FORM",
      "ListSetID": "<current-root-listset-id>"
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

Run:

```bash
node scripts/validate-yapk-navigation-runtime-metadata.mjs --package <app.yapk> --id-provenance <app-id-provenance-report.json>
```

Generation, signing, install, upgrade-check, and handoff must stop if ID provenance or navigation runtime metadata validation fails.

## Environment Checklist

Before package signing or package automation, check presence without printing values:

- authenticated OAuth session
- explicit package target workspace from API-discovered `flowcraft` workspace selection passed with `--selected-workspace-id` or documented user-selected `--workspace-id`; local `YEEFLOW_WORKSPACE_ID` is ignored for package writes

Missing OAuth or target workspace selection should block automation before request shaping. `.env.local` may be absent or empty for normal OAuth plus workspace discovery. Never print or commit `.env.local`, token files, cert/key files, tenant URLs, workspace IDs, raw API responses, decoded payloads, or generated runtime packages.

After successful live install/import, final reports must include selected workspace name/category/redacted ID preview, result status, safe `ListSetID` if resolved, and application access link only when the OAuth/session tenant URL and ListSetID are both safe. Use `<tenant-url>/#/list-set/41/<listset-id>`. If the link cannot be safely built, report `Application link: unavailable; ListSetID or tenant URL was not safely resolved.` Signing/signature verification and API install/import acceptance are not browser runtime proof.

Canonical runtime URLs must be derived from decoded package root `$.ListSet.ListID` unless the install API response is proven to return the true app root. If the install API response reports a different ListSetID, report it separately as install operation evidence and treat the mismatch as a runtime-proof blocker. Preserve sanitized install error details for `540017` without raw secrets, tokens, tenant-private payloads, raw `Resource`, or raw `Sign`.

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
