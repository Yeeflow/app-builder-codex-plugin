# Phase 5S Data List Additional Type 0 LayoutView Internal Shadow

## Boundary

This internal-only Materializer Core shadow projects one non-default Data List Type 0 LayoutView fragment. It is not publicly exported, distributed, adapted, or production-routed. The retained Legacy additional-view call remains explicitly `routeDefaultViewThroughCore: false`.

## Immutable Contract

`DataListAdditionalViewLayoutProjectionInput` requires explicit fields with supplied FieldIDs, an immutable template snapshot, a non-default `viewScope`, and a `viewIntent.isDefault: false` intent. It accepts no LayoutID, ListID, URL, slug, route key, or host-selected layout index. The scope cannot end in `/default`, so an additional view cannot silently reuse the default key-request scope.

## Responsibility Split

Materializer Core returns only frozen layout/query/sort/row-color data plus fixed-filter intents, deterministic key requests, and immutable findings. Local Runtime alone validates supplied allocated keys, lowers Legacy-shaped filters, and optionally appends findings to a host-owned target. Host code retains resource identity, URL, layout index, and final integration.

## Parity Corpus

The versioned corpus contains 7 Legacy/Core parity cases across 7 non-default scopes, 3 explicit intent-boundary cases, and 1 caller-supplied template-snapshot immutability case. Legacy UUID values are controlled in VM condition order and passed unchanged into Local Runtime allocation maps.

## Follow-Up

Phase 5T status: `public_api_readiness_accepted_not_promoted`. The public API readiness record is `compatibility/capability-manifests/data-list-additional-view-layout-public-api-readiness.v0.1.0.json`; it does not promote an export or authorize routing.

## Non-Goals

No public export, Plugin dist artifact, adapter, production routing, active installation, historical ZIP, or release state changed. Any future route requires separate API, distribution, source/archive/installed, and temporary-copy Legacy rollback proof.
