# YAPK ID Provenance Hard Gate

Generated-final `.yapk` packages must use Yeeflow API-issued numeric content IDs. Shape-valid numeric strings are not enough. For YAPK upgrade/new-version workflows, existing IDs from the previous version must also remain stable; see [YAPK Upgrade ID Stability Hard Gate](yapk-upgrade-id-stability-hard-gate.md).

## Blocking Rule

Before package assembly, allocate every generated numeric application content ID through:

```text
GET /utils/generate/ids?count=<n>
```

Generation, signing, install, upgrade-check, and handoff must stop if ID provenance validation fails.

For upgrade/new-version output, generation, signing, install-like writes, upgrade-check, upgrade apply, and handoff must also stop if upgrade ID stability validation fails.

Wrapper tenant/user metadata is not generated application content. `wrapper.TenantID`, `wrapper.CreatedBy`, and `wrapper.ModifiedBy` must not be treated as API-issued app content IDs and must not be required in the generated content ID manifest. `TenantID` has its own signing-readiness validation against OAuth/tenant context.

## Forbidden Sources

Generated-final `.yapk` content IDs must not come from:

- hardcoded constants
- local sequential counters
- local `id()` helpers
- copied sample/export IDs
- random values
- timestamps
- UUID fallback
- deterministic local-only seeds

## Required Proof Artifact

Write a redacted report beside the package:

```text
dist/<app-name>-id-provenance-report.json
```

The report must include total requested IDs, total received IDs, allocation count, unused count, duplicate check, path-to-purpose mapping, `sourceMarker: "api-generated"`, generator provenance metadata, and an empty non-API ID list.

Do not include wrapper tenant/user metadata paths such as `wrapper.TenantID`, `wrapper.CreatedBy`, or `wrapper.ModifiedBy` as generated content allocations.

## Validator

```bash
node scripts/validate-yapk-id-provenance.mjs \
  --package dist/<app>.yapk \
  --manifest dist/<app>-id-provenance-report.json
```

Signing through `setsign` / `verifysign` proves wrapper/resource signature only. Package API install acceptance proves action acceptance only. Neither proves ID provenance.

Signing, install acceptance, upgrade-check acceptance, and upgrade acceptance do not prove ID continuity. Existing semantic resources must keep their previous IDs, only newly added resources may use new API-issued IDs, and removed IDs must not be reused for different objects.
