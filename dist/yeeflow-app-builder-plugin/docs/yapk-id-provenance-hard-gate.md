# YAPK ID Provenance Hard Gate

Generated-final `.yapk` packages must use Yeeflow API-issued numeric content IDs from initial resource generation. Shape-valid numeric strings are not enough. Local IDs generated first and later replaced by API IDs are not the normal generated-final path and must fail unless the package is explicitly still a local unsigned draft. For YAPK upgrade/new-version workflows, existing IDs from the previous version must also remain stable; see [YAPK Upgrade ID Stability Hard Gate](yapk-upgrade-id-stability-hard-gate.md).

## Blocking Rule

Before resource generation and package assembly, choose Draft / Offline Mode or Final / Authorized Generation Mode according to `docs/standards/final-generation-api-issued-id-mode-standard.md`.

For Final / Authorized Generation Mode, allocate every generated numeric application content ID through:

```text
GET /utils/generate/ids?count=<n>
```

Generation, signing, install, upgrade-check, and handoff must stop if ID provenance validation fails.

For upgrade/new-version output, generation, signing, install-like writes, upgrade-check, upgrade apply, and handoff must also stop if upgrade ID stability validation fails.

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
- local-first generated IDs that are later remapped as the primary finalization path

## Required Proof Artifact

Write a redacted report beside the package:

```text
dist/<app-name>-id-provenance-report.json
```

The report must include total requested IDs, total received IDs, allocation count, unused count, duplicate check, path-to-purpose mapping, `sourceMarker: "api-generated"`, generator provenance metadata, and an empty non-API ID list.

Also write a generation mode report:

```text
dist/<app-name>-generation-mode-id-provenance.json
```

This report must record `generationMode`, explicit live API authorization metadata, target workspace, `idGeneration.strategy = "api-issued-before-generation"`, `allocationTiming = "before-resource-generation"`, `localIdsGeneratedFirst = false`, generated resources, and reference/binding provenance.

## Validator

```bash
node scripts/validate-generation-mode-id-provenance.mjs \
  --report dist/<app>-generation-mode-id-provenance.json

node scripts/validate-yapk-id-provenance.mjs \
  --package dist/<app>.yapk \
  --manifest dist/<app>-id-provenance-report.json
```

Signing through `setsign` / `verifysign` proves wrapper/resource signature only. Package API install acceptance proves action acceptance only. Neither proves ID provenance.

Signing, install acceptance, upgrade-check acceptance, and upgrade acceptance do not prove ID continuity. Existing semantic resources must keep their previous IDs, only newly added resources may use new API-issued IDs, and removed IDs must not be reused for different objects.
