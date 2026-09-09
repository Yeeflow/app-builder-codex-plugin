# Yeeflow App Builder 1.14.0

Adds `dashboard-page-layouts-custom-code` as a first-class Dashboard golden reference for explicitly requested Custom Code pages and complex screenshot-driven business dashboards. Existing default template selection is preserved.

Functional Specification to App Plan and standalone Dashboard plans now carry template selection, optional sections, responsive panels, functional modules, filters, temporary-variable exchanges and native Button/Form Action dependencies into generation. Two-column desktop ratios are 1fr / 2.5fr or 2.5fr / 1fr. Unused sections and module grids can be removed; empty placeholder-only output is rejected.

The normalized export removes stale business labels and unused filter records while retaining the supplied responsive structure. Source, distribution and installed-package checks cover plan routing, full-app generation, standalone wrapping, module cloning, native filter layouts and negative cases.

Release baseline: stable 1.13.1 (`b747163f`); the older main branch is not the baseline. Released Core and execution-service payloads are retained through the tracked-only archive build.

Proof boundary: export-backed structure and offline generation validation. Tenant import, Designer rendering and interactive business/data round trips have not been verified by this release.
