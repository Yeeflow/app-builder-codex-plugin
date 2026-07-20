# Yeeflow App Builder v1.0.2

## Summary

This patch release fixes Approval Form materialization when a form declares multiple Submission Form Fields. The adapter now copies the current immutable Core field projection before appending the next planned field, then writes the Core-deduplicated immutable result back as before.

## Scope

- Preserve immutable and frozen Core projection behavior.
- Preserve Submission Form Field order and deduplication semantics.
- Preserve single-field and Task Form Field materialization.
- Preserve Approval Workflow generation and validation behavior.
- Preserve OAuth, ID allocation, active installation, tenant, and workspace behavior.

## Validation

- Focused multi-field source regression.
- Official Plugin dist parity.
- Temporary official archive parity.
- Simulated-installed Plugin parity.
- Approval Workflow publish-readiness regression suite.
- TypeScript, workspace, dependency, Core distribution, OAuth distribution, English-only, migration JSON, release-safety, and archive gates.

## Proof Boundary

This release does not modify an active Plugin installation, tenant, workspace, or real application. Live application validation remains a separate post-release task using a refreshed stable Plugin.
