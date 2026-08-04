# Yeeflow App Builder v1.2.0

## Summary

This release candidate adds formal standalone resource tooling for Custom Service
`.ycs` and Scheduled Workflow `.ywf`, and provenance-gated finalization for
official AI Agent `.yaia` and Copilot `.yaic` payloads.

## Changed Bundled Skills

- `yeeflow-custom-service-generator`
- `yeeflow-scheduled-workflow-generator` (new)
- `yeeflow-agent-import-export-operator`
- `yeeflow-copilot-import-export-operator`

## Main Improvements

- Build and validate canonical Custom Service `.ycs` files with pre-write,
  atomic write/readback, sandbox security, SDK allowlist, and IO-contract gates.
- Build and validate standalone Scheduled Workflow `.ywf` files with recurrence,
  graph, dependency, recipient-safety, issued-ID provenance, and round-trip gates.
- Reuse the full-application workflow builder for supported Scheduled Workflow
  plans instead of maintaining a separate workflow-body implementation.
- Validate exact AI Agent and Copilot official export envelopes and finalize only
  from a complete official response plus normalized `importRead` evidence and a
  hash-bound integrity receipt.
- Add positive and negative fixtures, source/dist parity checks, and an aggregate
  standalone-resource release gate.

## Acceptance Evidence

On 2026-08-04, the release owner confirmed manual upload/import, resource
materialization, configuration-page opening, and re-export for all four resource
types in an authorized private test workspace. Re-export was user-confirmed and
was not independently compared locally. See
`yeeflow-app-builder-v1.2.0-standalone-resource-acceptance.json`.

## Proof Boundaries

- Custom Service and Scheduled Workflow were Plugin-generated test artifacts.
- The accepted Scheduled Workflow used fixture identity provenance; import was
  accepted, but post-import platform identity remapping was not independently
  compared.
- AI Agent and Copilot acceptance used official export baselines. Their opaque
  `PackageJson` payloads were not independently synthesized by the Plugin.
- Runtime execution of schedules, services, Agents, and Copilots was not tested.
- The manual resource acceptance does not replace Marketplace installation and
  skill-discovery smoke testing of this RC.

## Release Status

- Candidate version: `1.2.0`
- Previous final version: `1.1.0`
- RC1 Marketplace install: package installed, but skill discovery failed because
  the Codex process retained stale 1.1.0 routes; Custom Service also exposed an
  invalid dist-relative required-document path. RC1 is rejected.
- RC2 fixes canonical Plugin skill-reference paths and adds source, dist, and
  installed-cache relative-reference gates.
- RC2 remote-tag clean-clone verification exposed an invalid source-surface
  selection when ignored development fixtures are absent. RC2 is rejected.
- RC3 selects the canonical dist surface in clean clones while retaining dual
  source/dist verification in development checkouts.
- RC3 Marketplace install smoke: pending
- Final tag: blocked until the RC install smoke is completed and documented

## Rollback

Plugin `1.1.0` remains the rollback baseline.
