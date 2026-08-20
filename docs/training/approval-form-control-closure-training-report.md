# Approval Form Control Closure Training Report

## Observed failure pattern

The SCSKAP Sales Quotation workflow feedback showed that a project-local script constructed Approval Form controls directly, used unsupported `type: "drop"`, and labelled the output as if it came from `approval_form_layout_submission_v1_1`. The Submission and Task pages were produced through separate paths, so correcting one page did not correct its mirrored Task pages. Existing validation began only after recognising a legal control type and trusted a builder marker, allowing an unrecognised hand-built field to escape review.

## Training changes

- Shared Approval Form Layouts v1.1 builder is the sole source of bound fields and Sub List row controls.
- Submission and Task pages derive from one normalised field model and are checked for field-type drift.
- `drop` and any other unknown bound control type fail closed.
- Choice controls without choices fail closed.
- The builder now writes typed business placeholders to editable Sub List row controls, and the closure validator rejects omissions.
- The new validation scans all persisted `pageurls[].formdef` controls and nested `attrs["list-fields"][].control` entries after MCP readback.

## Regression evidence

`scripts/test-approval-form-control-closure.mjs` exercises a Sales Quotation Approval fixture and negative cases for unknown `drop`, bypassed builder provenance, missing Choice options, missing editable Sub List placeholder, and Submission/Task type mismatch. It also constructs both page roles through the shared builder and verifies `Select Closing Period`, `Enter Description`, and `Select Approver` placeholders.

## Proof boundary

The gate proves static package/readback control closure. It does not establish Designer rendering, request submission, workflow routing, task action execution, or browser usability; those require their respective focused evidence.
