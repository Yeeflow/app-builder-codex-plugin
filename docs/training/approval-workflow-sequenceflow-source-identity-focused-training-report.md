# Approval Workflow SequenceFlow Source Identity Focused Training

## Incident

A generated standalone Approval Form opened with a broken Workflow Designer: only part of the
graph rendered, connectors were absent, nodes could not be reliably selected or edited, and the
workflow could not be published.

Offline validators had reported pass because every malformed `SequenceFlow.source` still carried
`resourceid` and camel-case `resourceId`. All ten source references omitted the required `id`.

## Root cause

The old reference reader used:

```text
resourceid || resourceId || id
```

That was acceptable for exploratory inspection but too tolerant for generated-final validation.
It proved that a target node could be inferred, not that the serialized graph matched the
Designer export contract.

## Training changes

- Added a shared canonical graph-reference helper.
- Full-app Approval workflow materialization now normalizes shape identities and all
  source/target/incoming/outgoing references before encoding.
- Standalone `build-ywf-wrapper.js` uses the same normalizer before Base64 encoding.
- Canonical references contain exactly matching `id` and lowercase `resourceid`.
- Legacy `resourceId` aliases are removed from generated output.
- Final-mode YWF validation rejects missing/mismatched SequenceFlow endpoint references and
  mismatched flow incoming/outgoing endpoints.
- Publish-readiness exposes focused `APPROVAL_WORKFLOW_SEQUENCEFLOW_*` hard errors.
- Added a sanitized real-incident fixture that preserves the exact malformed source shape without
  retaining tenant IDs or business payloads.

## Regression contract

The negative fixture must fail with
`APPROVAL_WORKFLOW_SEQUENCEFLOW_SOURCE_ID_MISSING`. Materialized Approval workflows must prove
that every SequenceFlow reference has only `id` and `resourceid`, those values match, and all
endpoint relationships are bidirectionally consistent.

## Validation result

- The decoded real incident now fails with ten focused
  `APPROVAL_WORKFLOW_SEQUENCEFLOW_SOURCE_ID_MISSING` findings.
- The same decoded graph passed publish-readiness after applying only the shared graph-reference
  normalizer; graph-reference findings were zero.
- Source and dist publish-readiness regression suites passed.
- Approval YWF form structure, task URL/page URL, workflow condition editor, workflow layout,
  full-app generation entrypoint, cache artifact, source/dist parity, and diff checks passed.
- The broader full-app materialization entrypoint suite still stops on a pre-existing Dashboard
  Collection `Text1` source-template residue fixture. The unchanged `0.9.52` release worktree
  reproduces the same finding, so it is not a regression from this focused workflow change.

## Proof boundary

These gates prove serialized Designer graph-reference readiness. Live import, node selection,
add-node, save, and publish remain separate runtime proof steps.
