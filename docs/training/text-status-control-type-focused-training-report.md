# Text Status Control Type Focused Training Report

## Incident

An Approval Form variable planned as `Workflow Proof Status | Text | input` was generated as a `radio` control with unrelated fixed status choices. The workflow Set Variable action wrote a valid text value, but the control could not display it.

## Root cause

The former control mapper concatenated control type, schema type, and display name, then matched words such as `status`, `category`, `type`, and `priority`. The display label therefore overrode the explicit App Plan and variable schema.

## Generator correction

- Added the shared schema-authoritative resolver in `scripts/lib/form-control-type-authority.mjs`.
- Updated the shared Approval Form layout builder and generated-final materializer to use it.
- Removed display-name fallback from Approval field control inference.
- Preserved explicit control aliases such as `radio dropdown` without consulting the field label.
- Added planned field/control metadata to generated controls so validation can compare plan, schema, and output.

## Hard gates

`validate-approval-form-fields-template.mjs` now rejects:

- Text variables emitted as Radio/Select;
- generated choice controls without real choices;
- generated controls that disagree with the explicit planned control and schema.

## Regression coverage

- `Workflow Proof Status | Text | input` remains `input` in the shared builder.
- `Approval Status | Choice | radio` remains `radio` and preserves choices.
- full-app materialization includes a Text field ending in `Status` and verifies every emitted instance is `input`.
- negative fixtures cover all three new blocker codes.

## Proof boundary

Focused source tests prove generator and validator behavior. They do not by themselves prove a signed install, workflow execution, or browser runtime rendering. Those remain separate proof stages.

## Local verification

- source focused field-template gates: pass, 29 cases;
- dist focused field-template gates: pass, 29 cases;
- source/dist byte parity for every changed mirrored artifact: pass;
- YAPK hard-gate cache artifact inventory: pass;
- `git diff --check`: pass.

The broad full-app materialization test now passes all 38 cases. Its former Dashboard Collection baseline blocker was folded into the same training round and resolved through the schema/dependency closure work documented in `dashboard-collection-schema-dependency-closure-focused-training-report.md`.
