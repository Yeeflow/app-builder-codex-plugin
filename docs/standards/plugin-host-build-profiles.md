# Plugin host build profiles

The archive builder is the single packaging entrypoint for both hosts. Both profiles preserve all 27 skills and the complete shared runtime/template payload. Version comes from the released distribution manifest; this command does not publish, move stable, or reinstall a local plugin.

## Codex

```sh
node scripts/build-plugin-archive.mjs --profile codex --output /tmp/yeeflow-codex.zip
```

The default remains `codex`, with the existing archive layout and direct `.mcp.json` configuration. Existing release consumers need no new arguments.

## ChatGPT Web

Obtain actual registered App IDs from the target workspace or publishing organization. Supply a reviewed JSON file with exactly `apps` and four mappings, each containing only `id`: `app-builder`, `admin`, `operations`, `service-portal`. IDs must begin with `asdk_app_`, `connector_`, or `templated_apps_`, followed by an alphanumeric character and then alphanumeric, underscore or hyphen characters. IDs must be distinct. Directory IDs beginning `plugin_asdk_app_` are not accepted by the uploader. ID syntax checks do not establish existence, authorization or connectivity.

```sh
node scripts/build-plugin-archive.mjs --profile chatgpt-web \
  --apps /absolute/path/to/reviewed-apps.json \
  --output /tmp/yeeflow-chatgpt-web.zip
```

This generates `.app.json`, removes direct MCP manifest configuration **and** `.mcp.json`/`mcp.json` discovery files, and uses the manifest name as the top-level archive folder. All four services remain available through their registered Apps. No review organization IDs are built in or silently used in production.

For side-by-side review, explicitly choose a distinct identity:

```sh
node scripts/build-plugin-archive.mjs --profile chatgpt-web \
  --apps /absolute/path/to/reviewed-apps.json \
  --name yeeflow-app-builder-web-review \
  --display-name 'Yeeflow App Builder — Web Review' \
  --output /tmp/yeeflow-web-review.zip
```

ChatGPT's Add plugin upload creates an identity and rejects an existing name. Do not treat uploading a version change as an update or delete the existing plugin to make room. Use the supported update mechanism when available, or keep a separately named review candidate. Do not change the public identity merely to bypass a collision.

## Shared repairs and build gates

- At archive staging, the application-generator validator delegates to the canonical root validator; its shared dependencies resolve from the package regardless of the caller's working directory. This avoids future regeneration restoring a stale standalone validator copy.
- Every staged skill receives the centrally maintained `plugin-resource-access.md` instructions. Read skill-local references through the skill API; resolve shared root references through the current host's mounted filesystem. Do not hardcode a local checkout, host path or cache version.
- The staged package includes `scripts/test-skill-entrypoint-compat.mjs`. It exercises positive and negative field/schema/workflow fixtures and launches the validator from a temporary cwd.
- `npm run test:plugin-host-profiles` builds and extracts both profiles, checks 27 skills, shared payload byte parity, transport metadata, invalid/missing/duplicate IDs, and executes both archived regression entrypoints from a temporary cwd.
- CI runs this gate on PRs to main/stable and manual dispatch. `--tracked-only` packages tracked dist plus existing explicit reviewed manifests; the host repair overlay is applied even in this mode. Full builds additionally run the existing core/execution build steps.

## Hosted proof boundary

The 2026-09-14 Web Review test installed successfully, recognized 27 skills and four connected Apps, read an application skill and root reference, ran the validator and synthetic regression, and completed `workspace_list` (Status 0, isError false, 8 results). Each service separately passed a minimal ChatGPT read test. This supports the host-specific transport split, not exhaustive skill/tool validation or public marketplace approval.

After any new package is uploaded, verify ingestion, user installation, skill/resource access, script execution and minimal reads on the host. A local build gate alone does not establish these hosted results. Tenant writes and public release require their own authorized scope and acceptance evidence.
