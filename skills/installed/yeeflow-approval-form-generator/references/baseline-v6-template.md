# Generated Approval Form Baseline V6

This document records the current baseline for AI-generated Yeeflow approval form `.ywf` packages, proven through the Simple PR Note Approval v6 iteration.

The baseline artifact is:

- Decoded Def: `simple-pr-note-approval-def.v6.json`
- Wrapper: `simple-pr-note-approval.v6.ywf`

## 1. What V6 Proves

V6 proves that Codex can generate a decoded Yeeflow approval form Def that:

- imports successfully as a `.ywf` wrapper
- publishes successfully
- renders a request form and an approval task form
- includes publish-ready page metadata
- includes connected workflow designer nodes and arrows
- uses a cleaner workflow layout
- defaults Applicant to the current user
- defaults Submission Date to the current date
- includes request-page Save draft / Submit actions
- includes request and approval workflow history
- writes approved data to an existing Yeeflow data list through `ContentList`
- validates structurally and against extracted `.yap` metadata

This is the minimum baseline for future generated approval forms.

## 2. Required Decoded Def Structure

A generated decoded Def must include:

- `defkey`, matching wrapper `FlowKey`
- `workflowType: 2`
- `variables.basic`
- `variables.listref`
- `variables.filter`
- `variables.tempVars`
- `pageurls`
- `childshapes`
- `graphposition`
- `graphzoom`
- `lineType`

Required page types:

- request page: `pageurls[].type === 1`
- approval page: `pageurls[].type === 2`

Required workflow node classes for a simple one-step approval:

- `StartNoneEvent`
- `SetVariableTask`
- `MultiAssignmentTask`
- `ContentList`
- `EndNoneEvent`
- `EndRejectEvent`
- `SequenceFlow`

## 3. Request Page UI Pattern

The request page should use one top-level container with three sections:

```text
Request page
└─ top-level container
   ├─ header container
   │  ├─ form title heading
   │  └─ form description heading
   ├─ fields container
   │  └─ responsive flex_grid
   │     ├─ Applicant
   │     ├─ Submission Date
   │     ├─ Request No.
   │     ├─ Estimated Amount
   │     ├─ Subject
   │     └─ Reason
   └─ action/history container
      ├─ workflowControlPanel
      └─ workflowHistory
```

Recommended page background:

```json
{
  "background": {
    "type": "classic",
    "classic": {
      "color": "var(--c--neutral-light)"
    }
  }
}
```

Use conservative neutral design tokens by default. Avoid hardcoded decorative colors unless the user asks for custom styling.

## 4. Approval Page UI Pattern

The approval page should mirror the request page structure:

```text
Approval page
└─ top-level container
   ├─ header container
   │  ├─ approval title heading
   │  └─ approval description heading
   ├─ fields container
   │  └─ responsive flex_grid
   │     ├─ Applicant readonly
   │     ├─ Submission Date readonly
   │     ├─ Request No. readonly
   │     ├─ Estimated Amount readonly
   │     ├─ Subject readonly
   │     └─ Reason readonly
   └─ action/history container
      ├─ workflowControlPanel
      └─ workflowHistory
```

Do not use request-only wording on the approval page. The approval page action panel is for task completion, not Save draft / Submit.

## 5. Applicant Current-User Pattern

Request Applicant control:

```json
{
  "type": "identity-picker",
  "label": "Applicant",
  "binding": "Applicant",
  "readonly": true,
  "value": "CurrentUser",
  "attrs": {
    "default": "currentUser"
  },
  "displayLabel": [null, true]
}
```

Generator rule:

- use this pattern for requester/applicant fields by default
- preserve the `Applicant` variable as a user/identity variable
- do not make Applicant editable unless explicitly requested

## 6. Submission Date Current-Date Pattern

Request Submission Date control:

```json
{
  "type": "datepicker",
  "label": "Submission Date",
  "binding": "SubmissionDate",
  "readonly": true,
  "attrs": {
    "default": "currentDate",
    "showtime": true,
    "dateformat": "0",
    "date_type": "0"
  },
  "displayLabel": [null, true]
}
```

Generator rule:

- prefer `attrs.default: "currentDate"` over hardcoded static dates
- avoid static timestamp values in generated drafts
- preserve readonly behavior unless explicitly requested otherwise

## 7. Workflow Graph Layout Pattern

Simple one-step approval layout:

```json
{
  "graphposition": {
    "x": 220,
    "y": 186,
    "width": 1130,
    "height": 355
  },
  "positions": {
    "Start": { "x": -85, "y": -10 },
    "SetVariableTask": { "x": 215, "y": -10 },
    "ApprovalTask": { "x": 215, "y": 135 },
    "ContentList": { "x": 550, "y": 135 },
    "EndNoneEvent": { "x": 835, "y": 135 },
    "EndRejectEvent": { "x": 215, "y": 285 }
  }
}
```

SequenceFlow rules:

- every SequenceFlow has `id === resourceid`
- every SequenceFlow has explicit `source` and `target`
- every source node lists the flow in `outgoing`
- every target node lists the flow in `incoming`
- straight paths may omit `vertices`
- direct rejection path can use `vertices: []`

Recommended simple flow:

```text
Start -> Set Request No.
Set Request No. -> Approval
Approval -> Approved path -> ContentList -> End
Approval -> Rejected path -> EndRejectEvent
```

## 8. Page Registration / Publish Metadata Pattern

Each `pageurls[]` entry must include:

```json
{
  "id": "<uuid>",
  "type": 1,
  "name": "",
  "title": "Request page title",
  "pagetype": 1,
  "formdef": {
    "pagetype": 1,
    "ver": 2,
    "title": "Request page title",
    "exts": [],
    "actions": [],
    "name": ""
  }
}
```

Approval page:

```json
{
  "id": "<uuid>",
  "type": 2,
  "title": "Approval page title",
  "pagetype": 1,
  "formdef": {
    "pagetype": 2,
    "ver": 2,
    "title": "Approval page title",
    "exts": [],
    "actions": [],
    "name": ""
  }
}
```

Task URL rules:

- `StartNoneEvent.properties.taskurl` points to the request page `id`
- `MultiAssignmentTask.properties.taskurl` points to the approval page `id`
- use UUID-shaped page IDs
- do not use `FlowKey + "1"` or `FlowKey + "2"` as page IDs

## 9. ContentList Mapping Pattern

Approved persistence uses a `ContentList` node.

Required properties:

- `type: "add"` for create
- `appid`
- `listsetid`
- `listid`
- `listtype`
- `listdatas`
- `wheres: []`

Workflow variable expression format:

```html
<input type="button" data="${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;RequestNo&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:Request No.">
```

Generator rules:

- target `Columns` values must be real internal field names
- source variable IDs must exist in `variables.basic`
- list IDs and field names must come from metadata or explicit user mapping
- never guess app/list/field identifiers

## 10. Validation Pipeline

Before wrapping:

```bash
node validate-ywf-def.js ./simple-pr-note-approval-def.v6.json --mode final
node validate-ywf-def-against-yap.js ./simple-pr-note-approval-def.v6.json ./procurement-metadata.json --mode final --profile generator
```

Before handoff:

```bash
node build-ywf-wrapper.js \
  ./simple-pr-note-approval-def.v6.json \
  ./simple-pr-note-approval.v6.ywf \
  --flow-name "Simple PR Note Approval" \
  --flow-key SPRNA \
  --workflow-type 2 \
  --description "Sandbox generated simple PR note approval - v6 structured responsive form UI"
```

Expected validator result:

- structural validation: `pass`
- app-context validation: `pass`
- wrapper round-trip: `pass`
- placeholders remaining: `0`

## 11. Known Constraints

- V6 is proven for a simple one-step approval workflow.
- Data-list lookup controls with additional field auto-fill are now proven separately by the Simple PR Line Item Approval lookup study, not by the original v6 baseline.
- Full app-level `.yap` generation is not proven.
- Complex line-item table persistence needs additional import/export round-trip testing.
- Document generation nodes need separate sandbox validation.
- AI action nodes need separate sandbox validation.
- Yeeflow may suffix flow keys on repeated imports, such as `SPRNA2`, `SPRNA3`, or `SPRNA4`.
- Static export-time date values should not be copied into generated templates.
- Style settings should stay conservative until a formal Yeeflow design system mapping is defined.

## 12. Rules For Future Generated Approval Forms

- Generate a normalized approval spec before generating Yeeflow Def JSON.
- Generate decoded Def JSON first; do not generate `.ywf` directly from business text.
- Use placeholders only in draft mode.
- Final mode must contain no unresolved placeholders.
- Use UUID-shaped page IDs and generated node IDs.
- Keep `FlowKey` and `defkey` equal.
- Always include request and approval pages for approval forms.
- Always include request `workflowControlPanel`.
- Include request `workflowHistory` by default.
- Always include approval `workflowControlPanel` and `workflowHistory`.
- Use current-user Applicant and current-date Submission Date by default.
- Use structured container/header/grid UI for both request and approval pages.
- Use two-column desktop/tablet grid and one-column mobile grid.
- Use full-width spans for long text fields.
- Use lookup controls for existing app records only when source metadata is confirmed.
- Use readonly target controls for lookup-derived additional fields by default.
- Preserve workflow graph visual metadata.
- Validate structurally and against app metadata before wrapping.
- Never guess Yeeflow app/list/field/approver/template IDs.

## 13. What To Test After Import

After manual sandbox import:

- form imports without JSON/package errors
- request page opens
- Applicant defaults to current user and is readonly
- Submission Date defaults to current date and is readonly
- Request No. is readonly and populated after workflow number assignment
- Save as draft and Submit actions appear on request page
- request page workflow history appears
- approval task page opens from assigned task
- approval page fields are readonly
- approval page action panel works
- approval page workflow history appears
- workflow designer nodes and arrows are connected
- workflow designer layout is readable
- publish succeeds
- submit creates an approval instance
- approval path creates the expected PR Records item
- rejection path ends rejected
- no unexpected unmapped placeholders or missing resource errors appear
