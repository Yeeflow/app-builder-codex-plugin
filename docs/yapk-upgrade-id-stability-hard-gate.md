# YAPK Upgrade ID Stability Hard Gate

YAPK upgrade and new-version workflows must preserve IDs for existing generated resources. Fresh generation still requires API-issued IDs for every generated numeric content ID; upgrades additionally require lineage continuity against the previous version.

## Blocking Rule

Before signing, `verifysign`, upgrade-check, upgrade apply, install-like package writes, or handoff, validate the new package against the previous package and ID lineage manifests:

```bash
node scripts/validate-yapk-upgrade-id-stability.mjs \
  --previous-package dist/<app>-previous.yapk \
  --previous-manifest dist/<app>-previous-id-lineage.json \
  --new-package dist/<app>.yapk \
  --new-manifest dist/<app>-id-lineage.json
```

If the previous package or previous manifest is missing, the workflow must fail closed and must not claim upgrade-safe output.

## Lineage Model

The lineage manifest should record each generated object with:

- `semanticKey`
- `objectType`
- `path`
- `id`
- `status`
- `idSource`

Use `idSource: "previous-version-preserved"` for existing objects and `idSource: "api-issued-new"` for newly added objects. The manifest must not include secrets, tokens, tenant URLs, raw API responses, workspace IDs, raw `Resource`, raw `Sign`, or private payloads.

## Upgrade Rules

- Existing application, list set, data list, field, dashboard, page, layout, form, approval process, workflow, user group, AI Agent, Copilot, navigation, tool/action, seed-record, relationship, and package-reference IDs must remain stable.
- Renamed or reconfigured objects keep the same ID when they are the same semantic object.
- Only newly added resources may consume newly generated API-issued IDs.
- Removed object IDs must not be reused for different semantic keys.
- Replacing all IDs in an upgrade is a hard failure.
- Ambiguous semantic matching fails closed and requires human review.

## Validator Behavior

The validator fails on:

- missing previous/new package or lineage manifest
- duplicate or missing semantic keys
- existing semantic object ID changes
- removed ID reuse
- new object ID not recorded as API-issued
- manifest paths that do not resolve to declared IDs
- cross-reference mismatches when references are declared
- all existing IDs being reallocated

## Generator Requirements

Upgrade/new-version generation must load the previous package and lineage manifest first, match existing resources by stable semantic key, preserve their IDs exactly, request API-issued IDs only for new resources, and stop for human review when semantic matching is ambiguous.

## YAP Boundary

For YAP workflows, apply the same stable-ID principle to persisted schema IDs where the YAP format preserves them. If the YAP import path relies on platform `ReplaceIds` remapping, document that boundary explicitly and do not claim YAPK-style ID continuity. Local, hardcoded, random, timestamp, UUID, or fallback generated IDs remain forbidden.

## Proof Boundary

Signing, signature verification, install acceptance, upgrade-check acceptance, and upgrade acceptance do not prove ID continuity. Runtime browser proof is also separate: after upgrade, verify the installed app opens and the intended dashboards, lists, forms, workflows, AI Agents, Copilots, and navigation still resolve correctly.
