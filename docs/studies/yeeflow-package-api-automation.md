# Yeeflow Package API Automation Study

## Purpose

The product team published four package automation APIs on 2026-05-29. These endpoints can help Codex move from local package generation to controlled API-backed import, install, and upgrade workflows.

This study records the safe integration plan. It does not include API keys, raw API responses, tenant URLs, private IDs, raw package `Resource`, raw `Sign`, decoded payloads, generated packages, or screenshots.

## APIs Studied

Source docs:

- `POST https://api.yeeflow.com/v1/files/upload`
- `POST https://api.yeeflow.com/v1/listset/package/import`
- `POST https://api.yeeflow.com/v1/listset/package/install`
- `POST https://api.yeeflow.com/v1/listset/package/upgrade`

The helper now uses the shared OAuth/API auth wrapper: it prefers OAuth bearer tokens, refreshes them when possible, and uses legacy/deprecated `YEEFLOW_API_KEY` only as fallback. The plugin supplies the default API base `https://api.yeeflow.com/v1`. Import, install, and upgrade also require an explicit target `WorkspaceID`; the helper resolves it from `--workspace-id`, optional `YEEFLOW_WORKSPACE_ID` or active profile workspace variable, or an explicit user-selected workspace discovered through documented `GET /workspaces/{category}`.

## Endpoint Summary

| API | Purpose | Required inputs | Response shape in docs | Automation status |
| --- | --- | --- | --- | --- |
| Upload file content | Upload a local package file for later install/upgrade | OAuth or legacy API-key auth, package file content, `isImg=false` query | Docs show `200 OK` with no body | Supported as dry-run and guarded execution. File body contract needs runtime confirmation. |
| Import list set template package | Import a `.yap` ListExportResult package | `AppID`, `WorkspaceID`, `Title`, `Description`, `IconUrl`, `Resource`, `Manage`, `Write`, `Read` | `Data.ActionLogID`, `Data.Completed`, `Status`, `Message`, `TotalCount` | Supported as guarded execution from `.yap` wrapper metadata. |
| Install package | Install a `.yapk` package | `WorkspaceID`, `PackageFile.{Id,Name,FileSize}` | `Data.ID`, `Data.Continue`, `Data.Status`, `Data.LogTxt`, `Status`, `Message`, `TotalCount` | Supported as guarded execution after upload or with explicit package-file metadata. |
| Upgrade check package | Dry-run/check an existing-app `.yapk` upgrade | `WorkspaceID`, `PackageFile.{Id,Name,FileSize}`, `UpgradeCheck:true` | `Data.ID`, `Data.Continue`, `Data.Status`, `Data.LogTxt`, `Status`, `Message`, `TotalCount` | Supported as guarded execution via `upgrade-check-yapk`; classified as `upgrade_check_passed`, not applied. |
| Upgrade apply package | Commit an existing-app `.yapk` upgrade | `WorkspaceID`, `PackageFile.{Id,Name,FileSize}`, `UpgradeCheck:false` | `Data.ID`, `Data.Continue`, `Data.Status`, `Message`, `TotalCount` | Supported as guarded execution via `upgrade-apply-yapk` only after explicit apply approval; classified as `upgrade_applied`. |

## Safe Automation Helper

The helper is:

```bash
node scripts/yeeflow-package-api-automation.mjs
```

It defaults to dry run. It never prints API keys, raw package `Resource`, raw `Sign`, raw decoded payloads, tenant IDs, private URLs, or full API responses. It reports endpoint, package file name/size, request summary, HTTP/API status, response keys, and redacted data shape.

`WorkspaceID` is required for import/install/upgrade payloads, but `.env.local` can be empty for normal OAuth and workspace discovery. Optional default:

```env
YEEFLOW_WORKSPACE_ID=<optional default workspace id>
```

`YEEFLOW_TENANT_URL` is optional and only used for tenant UI/browser links. OAuth login and refresh use Authorization Code with PKCE S256 and do not require an OAuth client secret for normal use. Do not configure `YEEFLOW_API_KEY` for normal API calls; it remains only as legacy/deprecated fallback.

Use `node scripts/yeeflow-workspace-list.mjs --category <category>` to list workspaces with OAuth. The helper reports only count, title, category, status, and redacted ID preview. It does not print raw workspace objects, tenant IDs, tenant URLs, or full workspace IDs.

Dry-run output reports `workspaceId: "present"` or `workspaceId: "missing"` plus a safe `workspaceIdSource`. It does not print the actual workspace ID. `--workspace-id <id>` remains available as a one-run override, but the value is redacted in all helper output.

Examples:

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation import-yap \
  --package ~/Downloads/app.yap
```

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation install-yapk \
  --package ~/Downloads/app.yapk
```

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation upgrade-check-yapk \
  --package ~/Downloads/upgrade.yapk
```

```bash
node scripts/yeeflow-package-api-automation.mjs \
  --operation upgrade-apply-yapk \
  --package ~/Downloads/upgrade.yapk
```

Add `--execute` only after local validation has passed and the user explicitly approves a tenant mutation. `upgrade-yapk --upgrade-check true|false` is deprecated; execution must use the split `upgrade-check-yapk` or `upgrade-apply-yapk` operation so `UpgradeCheck:true` cannot be mistaken for committed success.

## Required Preflight Before Execute

Before any import/install/upgrade API call:

1. Validate the generated `.yap` or `.yapk` locally.
2. Run package graph and materialization validators where applicable.
3. Run strict visual/composition/template checks for full app generation.
4. Confirm package type:
   - `.yap` uses the import endpoint.
   - `.yapk` uses install or upgrade endpoint.
5. Confirm an explicit target `WorkspaceID` is resolved by `--workspace-id`, optional `YEEFLOW_WORKSPACE_ID` or active profile-specific workspace variable, or explicit user-selected workspace discovery. Do not print the value.
6. Confirm OAuth/API authentication is available and any tenant/profile context is local, without printing secrets.
7. Use dry-run output first.
8. Use `--execute` only after explicit approval.

## Open Questions

The upload endpoint documentation currently shows the endpoint but does not fully document the package file request body. The helper supports `multipart/form-data` by default and a raw octet-stream fallback. Runtime confirmation is still required to know the exact upload response body and whether it reliably returns `PackageFile.Id`, `Name`, and `FileSize`.

If upload returns no package-file metadata, callers can pass:

```bash
--package-file-id "<uploaded-file-id>" \
--package-file-name "package.yapk" \
--package-file-size 12345
```

## Proof Boundary

This branch is API-contract and helper implementation work. It does not claim live runtime proof of package import, install, or upgrade. The next proof should run against a disposable workspace with safe local credentials and a disposable generated package, then record only redacted status summaries.
