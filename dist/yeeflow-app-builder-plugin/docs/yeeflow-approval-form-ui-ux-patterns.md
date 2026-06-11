# Yeeflow Approval Form UI/UX Patterns

This document defines the approval-form UI/UX standard extracted from `UI and UX design (1).yap`.

Use `docs/yeeflow-application-design-system.md`, `docs/yeeflow-approval-form-design-standards.md`, and `docs/yeeflow-root-style-token-reference.md` for the current reusable approval-form standard. Generated approval forms should use native tokens for form surfaces, status/decision styling, spacing, and typography where schema-supported.

## Studied Approval Form

The mini app contains one approval form:

- Name: `Approval form`
- Key: `UI-AF`
- `Data.Forms[].ListID`: `0`
- `workflowType`: `2`
- Pages: one submission page in this minimal export
- Workflow nodes: `StartNoneEvent`, `SequenceFlow`, `EndNoneEvent`

The export is intentionally small. It proves the submission-page shell and the default placement of Action Panel and Flow History. It does not prove a full reviewer task page, but the same structure should be applied to generated task forms by default.

## Page Settings

The approval page form definition uses:

```json
{
  "attrs": {
    "container": {
      "cw": "2",
      "padding": [
        null,
        {
          "top": "--sp--s0",
          "right": "--sp--s0",
          "bottom": "--sp--s0",
          "left": "--sp--s0"
        }
      ]
    }
  }
}
```

Generator rule:

- Submission pages and task pages should use `attrs.container.cw = "2"`.
- Submission pages and task pages should use zero padding with `--sp--s0` on all sides.

## Container Tree

Studied submission-page tree:

```text
Approval form page
└─ container nv_label="Main"
   └─ container nv_label="Content"
      ├─ container nv_label="Form body"
      └─ container nv_label="Form bottom"
         ├─ workflowControlPanel
         └─ workflowHistory
```

`Main` style:

```json
{
  "gap": [null, "--sp--s0"],
  "direction": [null, "column"],
  "justify_content": [null, "flex-start"],
  "align_items": [null, "center"]
}
```

`Content`, `Form body`, and `Form bottom` use column layout with zero gap and `justify_content = flex-start`.

## Form Body

`Form body` is the container for business fields.

Generator rule:

- Put all normal requester or reviewer fields inside `Form body`.
- Use additional child section containers inside `Form body` for grouped fields when the form is not trivial.
- Do not place Action Panel or Flow History in `Form body`.
- Use `--c--background` for form cards/sections.
- Use `--c--neutral-light-active` for section borders and separators.
- Use `--fs--base` for normal labels and field text.
- Use `--fs--l` or `--fs--h6` for section headings.
- Use `--sp--s150` and `--sp--s200` for field grouping.

## Form Bottom

`Form bottom` is the container for workflow controls at the end of the `Content` container.

The studied export places these controls in order:

1. `workflowControlPanel`
2. `workflowHistory`

Action Panel control:

```json
{
  "type": "workflowControlPanel",
  "attrs": {
    "show-task-panel": true,
    "rejectValidation": true,
    "align": "center"
  }
}
```

Flow History control:

```json
{
  "type": "workflowHistory",
  "attrs": {
    "show-history": true
  }
}
```

Generator rule:

- Include both Action Panel and Flow History by default.
- Place both controls inside `Form bottom`.
- Place `Form bottom` after `Form body`.
- Omit either control only when the user explicitly requests it or a real export proves the form type should omit it.
- Let Yeeflow's native task panel styles control approve/reject/save buttons unless a real export proves a style override.
- Use semantic status tokens for generated decision badges: `--c--primary`, `--c--success`, `--c--warning`, `--c--danger`, and neutral tokens.

## Task Form Pattern

The mini app has only a submission page, but future generated task pages should follow the same shell:

```text
Task form page
└─ Main
   └─ Content
      ├─ Form body
      │  ├─ readonly submitted fields
      │  └─ reviewer decision fields
      └─ Form bottom
         ├─ workflowControlPanel
         └─ workflowHistory
```

Approval/task pages should mirror submitted request fields as readonly unless the field is irrelevant to the reviewer.

## Naming Rules

Use `nv_label` names:

- `Main`
- `Content`
- `Form body`
- `Form bottom`

Recommended section names inside `Form body`:

- `Request summary`
- `Applicant details`
- `Request details`
- `Approval decision`
- `Reviewer notes`

## Generator Rules

Approval-form generators should:

- Keep `Data.Forms[].ListID = 0` for app-level approval forms.
- Keep generated FlowKey/form key fresh for every package.
- Use full-width and zero-padding page settings.
- Wrap content in `Main` and `Content`.
- Put business fields inside `Form body`.
- Put Action Panel and Flow History inside `Form bottom`.
- Place `Form bottom` at the end of `Content`.
- Use native controls before custom code.
- Preserve workflow action validation against the normalized action reference.

## Validator Recommendations

Safe warnings:

- Missing full-width `cw = "2"`.
- Missing zero padding.
- Missing `Main`.
- Missing `Content`.
- Missing `Form body`.
- Missing `Form bottom`.
- `workflowControlPanel` outside `Form bottom`.
- `workflowHistory` outside `Form bottom`.
- Excessive arbitrary hard-coded decision/status colors where Yeeflow semantic root tokens are available.

Current caution:

- Do not make `Form body` and `Form bottom` mandatory errors yet, because existing generated baselines predate this standard.
- Promote to final-mode generator errors only after the first generated UI/UX standard test package passes local validation, runtime import/open, and export-back comparison.

## Future Approval-Form Test

The first generated approval-form UI/UX test should include:

- one submission page
- one reviewer task page
- request fields inside `Form body`
- readonly mirrored fields on the task page
- reviewer decision controls inside task-page `Form body`
- Action Panel and Flow History inside task-page `Form bottom`
- simple workflow graph only
