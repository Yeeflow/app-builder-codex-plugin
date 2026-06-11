# Approval Form Generator Operating Playbook

This is the master operating playbook for Codex-generated Yeeflow approval forms. It consolidates the proven v6 baseline, requirement decomposition, custom-code decision rules, `.yap` metadata study, validators, metadata application, and wrapper build workflow.

Reference docs:

- `docs/generated-approval-form-baseline-v6.md`
- `docs/approval-form-requirement-decomposition-template.md`
- `docs/custom-code-control-decision-guide.md`
- `docs/generated-line-item-custom-code-row-label-pattern.md`
- `docs/approval-form-and-yap-field-type-pattern-study.md`
- `docs/procurement-management-yap-study.md`
- `procurement-metadata.json`
- `docs/validate-ywf-def.md`
- `docs/validate-ywf-def-against-yap.md`
- `docs/apply-ywf-metadata.md`
- `docs/build-ywf-wrapper.md`

## 1. Purpose

Codex can generate Yeeflow approval forms, but only through a staged, validated, native-first process.

The goal is not to generate a `.ywf` directly from a business prompt. The safe path is:

1. decompose the business requirement
2. identify native Yeeflow capabilities
3. resolve app/list/field metadata
4. generate a decoded Def JSON draft
5. validate structure and app-context dependencies
6. build a wrapper only after validation passes
7. test in a Yeeflow sandbox
8. compare the exported-back package before treating the pattern as proven

## 2. Proven Capabilities

The current generator work has proven these capabilities:

| Capability | Status |
| --- | --- |
| One-step approval | Proven with Simple PR Note Approval. |
| Two-step approval | Proven with Simple PR Amount Approval and Simple PR Line Item Approval. |
| Structured request/approval pages | Proven with v6 baseline. |
| Responsive grid UI | Proven with v6 baseline using section containers and `flex_grid`. |
| Current user default | Proven for Applicant fields. |
| Current date default | Proven for Submission Date fields. |
| Workflow action panel/history | Proven on request and approval pages. |
| Clean workflow designer layout | Proven after export/import layout correction. |
| Page registration/publish metadata | Proven after fixing request page key/url pattern. |
| ContentList parent persistence | Proven against PR Records. |
| Line-item table | Proven with `PurchaseDetailsList`. |
| Parent/child persistence | Proven with PR Records and PR Details List. |
| Custom code control when justified | Proven for sub-list row labels. |
| App metadata extraction from `.yap` | Proven with Procurement Management export. |
| App-context validation | Proven with `procurement-metadata.json`. |
| `.ywf` wrapper generation | Proven with round-trip validation. |

## 3. Standard Generation Pipeline

```text
Business requirement
  -> requirement decomposition
  -> metadata selection/extraction
  -> decoded Def JSON draft
  -> structural validation
  -> app-context validation
  -> wrapper build
  -> sandbox import
  -> runtime test
  -> export-back comparison
```

Codex should not skip stages. In particular, it should not create a final `.ywf` while placeholders remain or while validators fail.

## 4. Native-First Decision Rule

Codex must prefer native Yeeflow features before adding custom code.

Decision hierarchy:

1. Standard form controls
2. Control attrs, readonly, defaults, validation
3. Calculated fields and list summaries
4. Lookup configuration and filters
5. Form actions
6. Workflow actions
7. AI actions
8. Custom code control

Use custom code only for client-side interaction behavior that cannot be modeled safely with the native layers above.

### Lookup Control Rule

Approval forms can use native lookup controls when the requester should select an existing app record, such as Department, Supplier, Project, Product, or Cost Center.

Confirmed source type:

- data list

Confirmed data-list lookup metadata:

- `attrs.appid`
- `attrs.listsetid`
- `attrs.listid`
- `attrs.listfield`
- optional `attrs["sort-first"]`
- optional `attrs.addition[]`

Use choices/radio/dropdown instead when values are static, small, and do not need a maintained source list.

Use lookup additional fields to auto-fill related values into form variables. Derived target controls should usually be readonly. For example, a Department lookup can map source field `Text1` / FieldID `2053735610866089989` into target variable `DepartmentCode`.

Do not guess lookup source IDs, display fields, sort fields, or additional source field IDs. Require confirmed app/list/field metadata or a staged dependency-resolution process.

Ask whether lookup selections and derived fields should be persisted. Context-only derived fields may not need `ContentList` persistence. If persisted, validate the lookup runtime value shape and target field compatibility before final wrapper build.

## 5. Required Artifacts

For generated approval forms, Codex should produce these artifacts as appropriate:

| Artifact | Purpose |
| --- | --- |
| Requirement decomposition | Shows how the business request maps to data, UI, workflow, persistence, AI, and custom-code decisions. |
| Decoded Def JSON | The generated Yeeflow form/workflow definition before base64 wrapping. |
| Dependency mapping | Lists app/list/field/user/position/template dependencies and placeholders. |
| Metadata mapping | Filled mapping file used by `apply-ywf-metadata.js` when placeholders are resolved separately. |
| Validation reports | Structural and app-context validation results. |
| `.ywf` wrapper | Created only after validation passes and unresolved placeholders are gone. |

## 6. Approval Form Template Rules

### Request Page

Use the v6 structured UI baseline:

- top-level container
- header container
- title text
- description text
- fields container
- responsive `flex_grid`
- line-item section when needed
- bottom action/history container
- request-page `workflowControlPanel`
- request-page `workflowHistory`

System field defaults:

- Applicant: readonly, default current user
- Submission Date: readonly, default current date
- Request No.: readonly, generated from FlowNo

### Approval Page

Use a parallel review-focused layout:

- top-level container
- header title and review description
- readonly business fields
- readonly line-item table when present
- approval-page `workflowControlPanel`
- approval-page `workflowHistory`

Do not use request-only wording such as "Save draft" on the approval page.

### Page Registration Metadata

Generated approval forms must include publish-ready page metadata:

- request page key/id pattern expected by Yeeflow
- approval page key/id pattern expected by Yeeflow
- `StartNoneEvent.properties.taskurl` pointing to the request page reference
- `MultiAssignmentTask.properties.taskurl` pointing to the approval page reference

Missing page registration can cause publish-time errors such as request `pageUrl is null`.

### Layout Rules

Use conservative UI defaults:

- neutral page background
- section containers
- responsive two-column grid on desktop/tablet
- one-column grid on mobile
- full-width spans for long text, descriptions, and tables
- no experimental decorative colors unless requested

## 7. Workflow Design Rules

### One-Step Approval

Recommended flow:

```text
Start
  -> Set Request No.
  -> Approval Task
  -> Create Record
  -> End

Approval Task rejected
  -> EndRejectEvent
```

### Two-Step Approval

Recommended flow:

```text
Start
  -> Set Request No.
  -> Line Manager Approval
  -> Finance Approval
  -> Create Record
  -> End

Line Manager rejected
  -> EndRejectEvent

Finance rejected
  -> EndRejectEvent
```

### Conditional Approval

Use native workflow gateways and SequenceFlow conditions. Do not implement conditional approval routing in custom code.

Example:

```text
Manager Approval
  -> Gateway
      -> Finance Approval when amount > threshold
      -> Create Record when amount <= threshold
```

### Persistence Nodes

Use `ContentList` workflow nodes for persistence:

- parent record creation
- child/detail row creation
- record updates
- record removal when explicitly required

Persistence should occur after final approval unless the business requirement says otherwise.

### Rejection Paths

Every approval task should have:

- approved SequenceFlow
- rejected SequenceFlow
- rejected path to `EndRejectEvent`

### Graph Layout Spacing

Workflow graph metadata matters for Yeeflow designer usability.

Layout rules:

- avoid placing all nodes in one horizontal line
- use clear vertical separation for approval tasks
- route approved paths horizontally to persistence/end nodes
- route rejected paths downward to `EndRejectEvent`
- include SequenceFlow visual metadata/dockers/vertices as learned from real exports
- keep `graphposition` large enough for all nodes and connectors

## 8. Line-Item Table Rules

Line-item tables require:

- a `variables.basic` list variable
- a matching `variables.listref`
- request page list control
- approval page readonly list control
- `attrs["list-fields"]`
- `attrs["list-variables"]`
- consistent row field metadata across listref and page controls

### Row Calculations

Use native row formulas for:

- quantity * unit price
- subtotal
- row-level calculated values

### Total Summaries

Use native list summary/calculated total patterns for:

- estimated total amount
- subtotal sum
- count/amount summary when supported

### Child Persistence

Use `ContentList` nodes for detail-row creation. Map each row field using list-row variable expressions.

Do not persist detail rows with custom code.

### Optional Custom Row Labels

Auto row labels are optional and customer-specific.

Numeric labels:

- `No.` may be number
- row control may be `input_number`
- generated row control should be readonly

Alphabetic labels:

- `No.` must be text
- row control should be `input`
- generated row control should be readonly
- target persistence field must be text-compatible if persisted

## 9. Custom Code Rules

Use `docs/custom-code-control-decision-guide.md` as the detailed policy.

Custom code is appropriate for:

- display-only helpers
- row labels
- dynamic UI hints
- non-critical client-side validation
- custom sub-list interactions not supported natively

Custom code should not be used for:

- approval routing
- record persistence
- critical financial calculations
- security/permission logic
- external API calls without explicit approval

When custom code is needed, Codex must output:

A. Requirement being solved
B. Why native Yeeflow configuration is insufficient
C. Custom code design
D. Code
E. Parameters
F. Def changes
G. Validation report
H. Test plan
I. Risks and fallback

Generated code should prefer new-style readable source:

```ts
import * as React from 'react';

export class CodeInApplication implements CodeInComp {
  description() {}
  inputParameters() {}
  requiredFields(params) {}
  render(context, fieldsValues, readonly) {}
}
```

## 10. Validation Gates

### `validate-ywf-def.js`

Use for structural validation of decoded Def JSON.

Checks include:

- required Def sections
- variable uniqueness
- listref consistency
- page/control bindings
- request/approval pages
- taskurl references
- workflow graph connectivity
- SequenceFlow target validity
- approval paths
- ContentList structure
- lookup control source metadata
- lookup additional-field target variables
- readonly warnings for derived lookup target controls
- placeholders

### `validate-ywf-def-against-yap.js`

Use for app-context validation against extracted `.yap` metadata.

Checks include:

- ContentList target app/list/listset existence
- target field internal names
- source variable/list-row references
- type compatibility
- lookup source references
- lookup display/sort/source fields against app metadata
- lookup additional-field source fields and target variables
- document/AI references when available

Use `--profile generator` for generated packages. Use `--profile compat` only when studying real exports with known compatibility quirks.

### `apply-ywf-metadata.js`

Use when a decoded Def draft contains placeholders that need environment-specific values.

Rules:

- metadata item status must be `ready`
- required values cannot be empty
- semantic locators must match expected placeholder values
- output must have no unresolved placeholders in final mode

### `build-ywf-wrapper.js`

Use only after decoded Def validation passes.

Checks include:

- decoded Def JSON validity
- no unresolved placeholders
- FlowKey equals `defkey`
- WorkflowType equals `workflowType`
- base64 wrapper generation
- round-trip decode equals source Def

## 11. Sandbox Testing Checklist

After wrapper build, test in a Yeeflow sandbox:

1. Import the `.ywf`.
2. Confirm request page opens.
3. Confirm approval page opens.
4. Publish the workflow.
5. Submit a request.
6. Confirm defaults: Applicant, Submission Date, Request No.
7. Confirm required fields and validation.
8. Confirm line-item table behavior if present.
9. Confirm approval routing.
10. Confirm rejection path.
11. Confirm ContentList parent persistence.
12. Confirm ContentList child/detail persistence.
13. Confirm custom code behavior if present.
14. Export the imported form back from Yeeflow.
15. Compare exported-back Def against generated Def and update patterns if Yeeflow normalized anything important.

## 12. Stop Conditions

Codex must stop and not build a final `.ywf` when:

- placeholders remain
- app/list/field metadata is missing
- lookup source metadata or additional source fields are unresolved
- lookup sample/value persistence shape is unknown for a persisted lookup field
- structural validation fails
- app-context validation fails
- FlowKey does not match `defkey`
- WorkflowType does not match `workflowType`
- custom code is unreviewed
- custom code contains high-risk behavior without explicit approval
- target app metadata is unavailable
- credential-like or sensitive resources are involved
- production import is requested without sandbox proof

In stop cases, Codex should report:

- the blocker
- affected file/path/node/control
- required missing metadata or decision
- whether draft-mode generation can continue

## 13. Readiness Levels

| Level | Meaning | Allowed output |
| --- | --- | --- |
| Draft-ready | Business requirement is decomposed and unresolved dependencies are identified. | Requirement decomposition, dependency map, partial decoded Def. |
| Validation-ready | Decoded Def is complete enough for validators. | Decoded Def JSON and validation report. |
| Wrapper-ready | Final-mode validators pass and placeholders are gone. | `.ywf` wrapper may be built. |
| Sandbox-import-ready | Wrapper round-trip validation passes. | User may manually import into sandbox. |
| Production-candidate | Sandbox import, publish, runtime test, persistence test, and export-back comparison pass. | Candidate for controlled production workflow planning. |

## 14. Next Roadmap

Recommended future work:

| Area | Why it matters |
| --- | --- |
| Conditional approval patterns | Needed for amount thresholds, category-specific routing, and skip logic. |
| Document generation | Needed for PO/PDF generation and template/library dependencies. |
| AI summary/recommendation patterns | Needed for approval suggestions, risk summaries, and generated request summaries. |
| Lookup-heavy forms | Needed for supplier, product, category, purchase order, and payment-term scenarios. |
| Lookup variants | Multi-select, data report, form report, document library, filtered lookup, lookup inside line-item table, and persisted lookup values still need real export examples. |
| Reusable template pack generation | Allows Codex to package proven decoded Def patterns into a maintained library. |
| Export-back comparison tool | Automatically detects Yeeflow normalization after import/publish/manual correction. |
| Validator custom-code checks | Detect row-label schema mismatch, readonly issues, high-risk APIs, and missing declared reasons. |
| App-level package generation study | Future `.yap` package generation may reduce manual app/list setup, but requires more import/export proof. |

## 15. Field Type Patterns From App-Level Export

The manual Visitor Access Management v10 export added number, radio/dropdown, switch, and conditional display controls to an approval form. See `docs/approval-form-and-yap-field-type-pattern-study.md`.

Confirmed approval-form patterns:

- Number field:
  - workflow variable `type = "number"`
  - control `type = "input_number"`
  - format/min settings in `attrs`
  - default value on control `value`
- Single-select radio:
  - workflow variable `type = "text"`
  - control `type = "radio"`
  - options in `attrs.choices[]`
- Single-select dropdown:
  - same `radio` control
  - `attrs.displayStyle = "dropdown"`
  - options in `attrs.choices[]`
  - optional `attrs.color_choices[]`
- Switch:
  - workflow variable `type = "boolean"`
  - control `type = "switch"`
  - boolean default on control `value`
- Dynamic display:
  - target control stores `attrs.control_display[]`
  - source variable formula can reference a boolean variable
  - show action uses `style_regulation_action_show`

Generator rules:

- Mirror request fields onto approval pages as readonly unless the field is intentionally request-only.
- Persist fields only when a compatible target data-list field exists.
- Validate `number -> Decimal/input_number`, `boolean -> Bit/switch`, and `text/radio -> Text/radio` compatibility before wrapper build.
- Do not assume a request-page control is persisted; `ContentList` must map it explicitly.

## 16. Generated v11 Multi-Type Confirmation

`Visitor Access Management v11` confirms that the manual field-type patterns can be generated, validated, imported, and runtime-tested inside an app-level `.yap` package.

Successful v11 approval-form settings:

- Fresh FlowKey/form key: `VBB`
- App-level form row `Data.Forms[].ListID = 0`
- Approval form validation: pass
- Package and graph validation: pass
- Request page rendered the multi-type controls
- Approval page included readonly mirrors for the persisted fields
- Workflow `ContentList` persisted the new values into the generated request list

Proven approval control patterns:

| Business field | Variable | Approval control | Target storage |
| --- | --- | --- | --- |
| Visitor Email | `VisitorEmail` text | `input` | `Text13` |
| Visitor Phone | `VisitorPhone` text | `input` | `Text14` |
| Number of Visitors | `NumberofVisitors` number | `input_number` | `Decimal1` |
| Access Type | `AccessType` text | `radio` with `displayStyle = "dropdown"` | `Text15` |
| Requires Escort | `RequiresEscort` boolean | `switch` | `Bit1` |

Proven sample/control value shapes:

- `input_number` values are numeric.
- Dropdown/radio values are selected option text.
- Switch controls use boolean `true` or `false` in the approval form.
- Data-list `Bit` sample values use `"1"` or `"0"`.

Conditional display rule:

- `EscortUser` was generated as a form-only text variable/control.
- It is shown when `RequiresEscort == true`.
- The rule is stored on the target control under `attrs.control_display[]`.
- It is intentionally not persisted in v11 because no storage target field was added.

Generator rule update:

- Multi-field approval-form expansion is allowed after field/control types are proven by export evidence and import-tested generated packages.
- Still use fresh FlowKey/form keys for every app-level import test.
- Still validate decoded approval Def, app package, and app graph before wrapper build.
- Do not persist a conditional field unless a compatible target storage field exists and the mapping is explicitly added.

## Operating Rule Summary

- Decompose first.
- Native first.
- Metadata before final mode.
- Validate decoded Def before wrapping.
- Build `.ywf` only after validation passes.
- Sandbox test before production consideration.
- Export back and compare before declaring a pattern proven.
