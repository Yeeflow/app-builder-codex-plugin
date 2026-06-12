# YAPK ID Provenance Hard Gate

Generated-final `.yapk` packages must use Yeeflow API-issued numeric content IDs. Shape-valid numeric strings are not enough.

## Blocking Rule

Before package assembly, allocate every generated numeric application content ID through:

```text
GET /utils/generate/ids?count=<n>
```

Generation, signing, install, upgrade-check, and handoff must stop if ID provenance validation fails.

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

## Validator

```bash
node scripts/validate-yapk-id-provenance.mjs \
  --package dist/<app>.yapk \
  --manifest dist/<app>-id-provenance-report.json
```

Signing through `setsign` / `verifysign` proves wrapper/resource signature only. Package API install acceptance proves action acceptance only. Neither proves ID provenance.
