# Yeeflow App Builder v1.0.4

## Summary

This narrow patch closes a planning-contract orchestration gap by running the official Data List form-layout, Data List form-fields, and Approval form-fields validators before any API-issued ID request.

## Scope

- Add one aggregate, fail-closed pre-ID allocation readiness gate.
- Block ID allocation and every downstream mutation boundary when any official App Plan validator reports an error.
- Require exact Data List form layout and field-grid selection subsections and approved v1.1 templates.
- Require explicit Approval Choice values in both Submission and Task form field tables.
- Preserve existing ID allocation semantics, materializer behavior, Core projections, OAuth, workflow graphs, and tenant behavior.

## Validation

- Malformed three-defect plan blocks before the injected ID allocator is invoked.
- Valid generic Data List plus Approval Form plan passes and invokes the allocator exactly once.
- Source, official dist, archive, and simulated-installed parity.
- Existing planning/readiness compatibility, TypeScript, workspace, package/dependency boundaries, Core distribution, OAuth parity, English-only, archive hygiene, release safety, and Git diff gates.

## Proof Boundary

This release does not modify an active Plugin installation/cache, Plugin Test2, a tenant/workspace, any real application, protected duplicate files, or the historical 0.9.71 rollback archive.
