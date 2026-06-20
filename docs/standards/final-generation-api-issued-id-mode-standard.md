# Final / Authorized Generation Mode And API-Issued ID Standard

This standard defines the generation mode decision that must happen before Yeeflow resource generation.

## Mode Decision

Every application generation run must choose one mode before creating Yeeflow resources:

1. Draft / Offline Mode
2. Final / Authorized Generation Mode

The chosen mode must be documented in the App Plan generation contract, generation readiness report, package generation report, and ID provenance evidence.

## Draft / Offline Mode

Draft / Offline Mode is the default safe mode.

Rules:

- do not call live Yeeflow APIs
- do not allocate IDs through Yeeflow ID APIs
- use local draft IDs only for local structural generation
- produce local unsigned draft packages only
- do not sign, install, import, upgrade, or claim generated-final readiness
- stop before generated-final signing/install readiness because API-issued ID provenance is absent

Draft packages may be useful for local schema, structure, blueprint, and App Plan conformance work. They are not upload-ready, install-ready, or generated-final handoff artifacts.

## Final / Authorized Generation Mode

Final / Authorized Generation Mode is allowed only after explicit user authorization for:

- live Yeeflow API usage
- target tenant or workspace
- resource generation using API-issued IDs
- the proof boundary for signing, install/import/upgrade, and runtime testing

Rules:

- call the Yeeflow ID API before resource generation
- allocate IDs through `GET /utils/generate/ids?count=<n>`
- use API-issued IDs directly during initial resource generation
- do not generate local IDs first and remap them later as the main path
- preserve API-issued ID provenance in every generated resource
- preserve the same API-issued IDs across references, lookups, workflows, navigation, dashboards, forms, and resource bindings
- emit a generation mode report and ID provenance manifest before generated-final validation
- run generated-final validation before signing readiness

Final mode may proceed to signing readiness, signing, install/import/upgrade, and runtime proof only inside the user's explicit authorization boundary.

## Required Final Mode Evidence

The generation mode evidence must include:

- `generationMode: "final-authorized"`
- `readyForGeneratedFinal: true` only after all final-mode gates pass
- authorization metadata with live API approval and target workspace
- ID generation strategy `api-issued-before-generation`
- allocation timing `before-resource-generation`
- Yeeflow ID API endpoint used
- `localIdsGeneratedFirst: false`
- resource inventory with `idSource: "api-generated"`
- resource IDs assigned at `initial-generation`
- references/bindings resolving to API-issued resource IDs
- explicit external markers for tenant/user/external dependency IDs that are not generated application resources

## Forbidden Final Mode Patterns

Generated-final readiness is blocked when any of these appear:

- local draft IDs in generated resources
- local IDs generated first and later remapped as the primary path
- API-issued IDs assigned only after local resource generation
- hardcoded generated IDs
- copied sample/export IDs used as newly generated resource IDs
- random, timestamp, UUID, or deterministic local-only ID sources
- references, lookups, workflows, navigation, dashboards, forms, or resource bindings pointing at local or unresolved IDs
- missing authorization or target workspace metadata

## Validator

Run the focused mode validator before generated-final claims:

```bash
node scripts/validate-generation-mode-id-provenance.mjs --report dist/<app-name>-generation-mode-id-provenance.json
```

For generated-final `.yapk` output, also run:

```bash
node scripts/validate-yapk-id-provenance.mjs --package dist/<app>.yapk --manifest dist/<app>-id-provenance-report.json
node scripts/validate-yapk-navigation-runtime-metadata.mjs --package dist/<app>.yapk --id-provenance dist/<app>-id-provenance-report.json
```

The generation mode validator proves only mode and ID provenance readiness. It does not prove schema validity, package validity, signing success, install/import/upgrade acceptance, or runtime behavior.
