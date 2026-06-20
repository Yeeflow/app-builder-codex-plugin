# Strict App Plan Conformance Over-Parse Fix Training Report

## Summary

This training fixes a strict App Plan conformance false positive where Markdown prose, field/control/action detail rows, task-form rows, template headings, assumptions, validation notes, and deferred/runtime-proof sections could be interpreted as planned resources.

The motivating Facility Maintenance Request Management evidence showed focused app-plan-to-resource contract coverage and decoded resource contract coverage passing. The remaining strict App Plan conformance failure was classified as validator over-parsing, not as a generated-resource mismatch.

## Validator Change

`scripts/validate-app-plan-conformance.mjs` now treats only explicit canonical App Plan resource declarations as planned resources when parsing Markdown:

- requirement-to-resource mapping table rows with resource type and planned resource name
- Resource Generation Order table rows with resource type and resource name
- recognized top-level resource tables such as Form Reports, Schedule Workflows, AI Agents, Copilots, tools, knowledge resources, integrations, connections, permissions, admin resources, teams, dashboard pages, and pages
- numbered Data List / Document Library and Approval Form subsections

The parser no longer treats the following as standalone resources:

- field rows
- control rows
- action detail rows
- task-form rows
- implementation notes
- assumptions
- validation notes
- deferred or runtime-proof sections
- template placeholder headings
- explanatory prose

## Strict Mode Boundary

Strict mode still fails real resource drift:

- declared resources missing from the package
- generated resources not declared by the approved plan
- partially matched resource names that indicate a mismatch
- explicit generation-contract or navigation contract failures

Low-level workflow node markers such as `MultiAssignmentTask` remain implementation details and are not treated as extra top-level workflow resources.

## Regression Coverage

`scripts/test-app-plan-conformance-guardrails.mjs` adds a Facility-style Markdown fixture with canonical resource declarations plus false-positive prose/table examples. The test verifies:

- canonical Markdown plan and matching decoded package pass strict conformance
- field/control/action/task-form/prose/default/deferred notes are ignored as resources
- a real missing canonical resource still fails
- a real extra generated resource fails in strict mode
- a partial resource-name mismatch fails in strict mode

## Proof Boundary

This training changes local validator parsing and reporting only. It does not prove package schema validity, signing, API acceptance, package install/import/upgrade success, runtime behavior, or visual fidelity.
