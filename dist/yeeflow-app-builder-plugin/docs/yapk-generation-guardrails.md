# YAPK Generation Guardrails

These rules encode the Leave Request Application lessons for future generated `.yapk` packages.

## Generation Modes

The plugin must keep local preview and generated-final output as separate modes.

- `local-preview` / `local-draft` mode: no live API calls, local-only structure validation and preview only, may contain local draft markers, and is never eligible for signing, install/import, upgrade, or user handoff as a generated-final artifact.
- `generated-final` mode: ID-first generation. Planning and Blueprint stages may use stable logical references, but before generated-final resource creation the generator must allocate all required Yeeflow API-issued IDs, build a complete `logicalRef -> apiIssuedId` map, and write generated-final package JSON directly from that map.

A generated-final package must not be produced by mutating, patching, or ID-replacing a local draft package. Runtime-bearing references must be written with API-issued IDs at generation time, including resource IDs, Data list IDs, Approval form IDs / ProcKeys, Dashboard page IDs, Layout IDs, Form IDs, FormAction IDs, `ListID`, `PageID`, `ProcKey`, `LayoutID`, table links, Collection/Kanban/Timeline bindings, Data Filter bindings, Button/Container action targets, Sub list bindings, workflow/notification/navigation targets, and page resource version fields where required.

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

## Generated-Final Draft Placeholder Gate

After API ID allocation and final ID replacement, generated-final `.yapk` packages must contain no unresolved local draft sentinels anywhere in runtime-bearing package JSON.

Run:

```bash
node scripts/validate-generated-final-draft-placeholders.mjs --package <app.yapk> --mode generated-final
```

The gate recursively scans the wrapper metadata and decoded `AppPackageInfo`, including parsed `LayoutInResources[].Resource` page JSON, form `Ext` and encoded `DefResource` payloads, control bindings, table/action links, open-dashboard/open-form targets, workflow/navigation metadata, theme payloads, version fields, arrays, and nested string fields.

Generated-final mode forbids `local-draft`, `localDraft`, `local-draft-*`, `sourceMarker: local-draft-no-api`, and equivalent unresolved generator draft sentinels. Local draft packages may contain these markers only when clearly local-only and validated with `--mode local-draft`.

Signing, signature verification, package upload, install/import, upgrade-check, or user handoff must not start until this recursive placeholder gate passes. API-issued ID provenance proves numeric ID source; it does not prove every nested runtime placeholder was replaced.

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
