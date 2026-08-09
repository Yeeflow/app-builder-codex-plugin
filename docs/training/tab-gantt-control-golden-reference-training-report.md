# Tab and Gantt Golden Reference Training Report

## Scope

Added `tab_control_workspace` and `gantt_control_linked_activity` as formal plugin reference templates based on a read-only live configuration study.

## Training outputs

- `docs/reference/tab-control-workspace.template.json`
- `docs/reference/gantt-control-linked-activity.template.json`
- `docs/reference/tab-gantt-control-golden-references.json`
- `docs/standards/tab-gantt-control-golden-reference-standard.md`
- `scripts/validate-tab-gantt-golden-references.mjs`
- `scripts/test-tab-gantt-golden-references.mjs`

## Required regression coverage

The regression suite must pass the complete fixture and reject at least: no default Tab, invalid start date storage, Dependency that is not a multi-value self Lookup, Percent completion with the wrong control type, and Parent that is not a single-value self Lookup.

## Evidence classification

- Tab structure: configuration-readback-proven; focused Dashboard Tab switching was previously runtime-proven.
- Gantt structure and field compatibility: configuration-readback-proven and validator-backed.
- Generated Data List form Gantt rendering, scheduling, add/default propagation, detail opening, dependency behavior, and hierarchy behavior: runtime-test required.

No live application write, export, import, package installation, or browser runtime operation was performed for this training round.
