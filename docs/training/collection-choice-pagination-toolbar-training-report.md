# Collection choice, pagination and toolbar training

Date: 2026-09-13. Baseline: installed plugin 1.15.6. Training-stage status: local source/distribution training complete. The subsequent 1.15.7 release validation is recorded in `../releases/yeeflow-app-builder-v1.15.7.md`.

## Delivered

- Consolidated the prior toolbar repair rules: owner-scoped CSS, class reuse versus unique CSS IDs, complete Select box-model alignment, row-menu autoposition and dark-menu foreground cascade. Integrated the known row-menu helpers into new Collection materialization; Add/Select custom height remains an explicit per-control choice.
- Added `dashboard-collection-choice-pagination-standard.md`: actual-schema single/multiple choice detection; separate dynamic border/background/text styles; current-item condition targets; neutral unknown fallback; explicit multi-choice storage and conflict handling. Exact membership uses the catalog's arrayIndex token shape. Multi-choice runtime badge composition remains pending.
- Added `dashboard-collection-presentation.mjs` helpers and actual Dashboard materializer regressions. New ordinary record Collections now get data.ps=10 after cloning, overriding source-template defaults. Optional plan Records per page/Page size values win. Existing repair mode, semantic limits and selected detail 1 are preserved. Master-detail left datasets respect the explicit setting.
- Updated Dashboard Generator, Feature Learning Orchestrator and native-rich documentation. New tests run through the existing native-rich suite; source/distribution assets are synchronized for this change without overwriting unrelated materializer differences.

## Validation

Source and distribution passed toolbar and native-rich tests, new materialized presentation tests, Collection generation, responsive routing, grid-table gates and Dashboard page-layout conformance (6 cases each). New materialization assertions inspect actual default 10 / override 25, left-pane override 15 / selected-detail 1, menu autoposition and known dark-menu foreground CSS. Whitespace checks passed for touched tracked files.

During distribution synchronization an existing source/distribution import difference prevented the initial patch. The new distribution pagination regression failed at 20 versus 10, correctly detecting that the generation path had not changed. The distribution changes were then applied narrowly; a misplaced inserted menu line was found by inspection and relocated before final tests. Final source and distribution tests passed. These were local implementation defects, not product capability failures.

## Proof boundaries

Previous live desktop toolbar repair provides saved/readback/render evidence for that page only. This round does not modify live dashboards or the installed cache. Multi-choice per-option rendering, unknown-value rendering, concurrent rule precedence, mobile wrapping, page-size UI navigation and hover/active visuals require focused runtime acceptance. Existing Edit-to-View routing, Owner accessible title and exhaustive filter candidates remain tracked open items. No full release-readiness claim is made.

## Release integration follow-up

The clean stable-baseline full-app suite exposed a stale generated-menu validator that required exact template-array equality and rejected the new desktop placement. The source template check remains unchanged. The generated-artifact gate now permits the scoped desktop bottomRight variant only with autoposition=true and preserved mobile bottomRight. Actual package regression covers valid generation plus mobile drift, disabled auto and invalid desktop placement.
