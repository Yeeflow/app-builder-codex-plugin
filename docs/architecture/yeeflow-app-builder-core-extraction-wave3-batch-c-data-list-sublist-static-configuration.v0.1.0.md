# Core Extraction Wave 3 Batch C: Data List Sublist Static Configuration

`CORE_EXTRACTION_WAVE3_BATCH_C_DATA_LIST_SUBLIST_STATIC_CONFIGURATION_EXECUTION_PASSED`

## Decision

Three envelopes are accepted: planning-only row-field parsing, summary parsing, and row/control/predicate normalization now use the single frozen Materializer Core facade `projectDataListSublistStaticConfiguration`. The Data List collector is the only parser route. Approval Form collectors keep the Legacy parser, so Batch C does not alter Approval Form behavior.

Five envelopes are reclassified as Host orchestration or existing specialist routes. They own summary IDs and Phase 10/11 selection, Phase 9 descriptor consumer lowering, host context, control IDs, mutable control-title normalization, and Phase 12-16 dispatch. Re-extracting those seams would duplicate or weaken sealed contracts.

## Proof

The 13-case Legacy/Core corpus passed compiled source, Plugin dist, temporary official ZIP extraction, simulated installed Plugin, actual scalar embedded-Sublist materializer parity, deterministic double run, deep immutability, JSON serialization, leakage gates, and a temporary-copy rollback that restores only the Legacy Batch C bridge.

## Progress

Wave 3 accepted-envelope progress is `5/89`; provisional weighted Core completion is `32.9888`.

## Checksums

- Materializer Core artifact: `dbc4d9d80dc13413e2d735ef608c079103aacfd801775a47cc99c7bb32d66f82`
- Materializer source before/after: `21c0a0d364cbd75688dc4037086cb8181e8faaf118de4e1bff7ca087c9060c6e` / `ee1d77b66528d54bcc022d8e1dbfd6ce92a92fa57b48abeae3e3aeb635a260ee`
- Historical ZIP (unchanged): `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`
