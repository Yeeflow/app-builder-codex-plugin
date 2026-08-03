# Yeeflow App Builder v1.1.0

## Summary

This release adds a formal standalone Dashboard Page `.ydp` generation and
validation toolchain. The Plugin now exposes wrapper scripts parallel to the
existing standalone Approval Form and Data List resource workflows while keeping
the shared Core Dashboard builder as the only body-generation authority.

## Changed Bundled Skills

- `yeeflow-dashboard-generator`
- `yeeflow-application-generator`

## Main Improvements

- Add canonical `build-ydp-wrapper.js` and `validate-ydp.js` entrypoints at the
  Plugin root, scripts directory, Dashboard Generator, and Application Generator.
- Accept only the shared Core standalone Dashboard build-result contract; reject
  bare bodies, incomplete readiness metadata, mismatched source plans, blockers,
  and local-only identity modes.
- Require externally issued application, page layout, source list, field,
  temporary-variable, and action identities; reject copied or deterministic
  export IDs and references outside the issued dependency closure.
- Validate the export-proven outer envelope, UTF-8, long numeric `ListID` and
  `LayoutID`, `AppID = 41`, `Type = 103`, parseable `LayoutView`, and exact
  encode/decode round trips.
- Run the existing Dashboard Page Layout, Collection binding, generation hard
  gates, and page-scope dependency validators before writing and after rereading.
- Write the `.ydp` and validation report transactionally so report-write failure
  cannot leave a partially accepted artifact.

## Validation

- Source and packaged Plugin YDP wrapper suites pass.
- Dashboard v1.1 validator alignment fixtures pass after adopting the required
  Dynamic User zero-padding and grid-table title typography contracts.
- Root/dist script syntax, JSON parsing, mirror parity, archive integrity, release
  safety, and clean-room install checks are release blockers and must pass before
  the RC tag is created.

## Known Limitations

- The wrapper proves static generation, dependency closure, serialization, and
  round-trip validity only.
- Yeeflow platform import, Designer rendering, runtime data binding, actions, and
  tenant execution remain unproven until separately exercised and documented.
- The private Marketplace install smoke test was explicitly deferred by the
  release owner until after stable publication. Static release gates passed, but
  installed Plugin discovery and runtime behavior remain pending verification.

## Rollback

Plugin `1.0.8` and its immutable final tag remain the rollback baseline.
