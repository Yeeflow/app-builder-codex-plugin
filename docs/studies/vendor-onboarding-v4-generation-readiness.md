# Vendor Onboarding v4 Generation Readiness

## Context

Vendor Onboarding full UI v2 and v3 proved that import/install success is not enough. The v3 package passed the strict visual quality gate available at the time, but runtime review showed that the generated application still looked close to v2 and far below the approved mockups.

Approved spec: `docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`

New pre-generation checklist: `docs/generated-app-plans/vendor-onboarding-v4-composition-checklist.md`

## Why v3 Failed

v3 satisfied too many structural checks without proving actual composition quality:

- The Vendor Management Dashboard had recognizable controls, but the page still looked plain and underdesigned.
- The Compliance Review Workspace had sections, but weak spacing, weak cards, generic alert content, and shallow queue/card composition.
- The generated app exposed controls that existed in package JSON but did not match the visual hierarchy or design richness of the approved mockups.
- The validator treated section presence as enough, even when sections were not composed as card/grid layouts with meaningful visual grouping.
- Button labels improved, but actions and runtime behavior were still too weak to count as a usable application surface.
- Form and print composition remained underbuilt relative to the Vendor Detail View Page, New Vendor Request Form, and Vendor Print Page mockups.

The failure is therefore not only a validator issue. It is also a composition-planning issue: the generator started from a high-level spec and emitted package structure before locking down exact page-by-page section composition.

## Why A Composition Checklist Is Required

The next generated package must not rely on broad instructions such as "make a full UI" or "match the mockups." Before package generation, Codex must create and follow a concrete composition checklist that defines:

- the purpose of every page;
- required visual sections from the approved mockups;
- exact Yeeflow controls to use;
- source lists and fields for every data-bound control;
- layout, card, grid, and padding rules;
- required buttons and action bindings;
- Kanban and Collection item template fields and actions;
- custom form and print page sections;
- safe fallback rules for unsupported controls;
- section-level validation rules;
- pass/fail checkboxes.

This converts the approved spec into a package-generation contract. The package generator must implement this contract or explicitly defer an item with reason, fallback, and validation impact.

## Readiness Rule

Package generation must not start until `docs/generated-app-plans/vendor-onboarding-v4-composition-checklist.md` is reviewed and approved.

After approval, v4 generation must:

1. implement every approved checklist item or record an approved deferral;
2. preserve the proven v0.6.2 import rules for YAP/YAPK generation;
3. use current dashboards only, including the `src` marker for Type 103 dashboards;
4. use `SimplePortal: null` for no-portal YAP packages;
5. use `PortalInfo: null` for no-portal YAPK packages;
6. use API-issued IDs for generated Yeeflow IDs, preserving 19-digit values exactly;
7. configure every dashboard Data table column with `Field` and `FieldName`;
8. pass package/import validators;
9. pass strict visual app quality against the approved spec and checklist;
10. pass manual runtime review before being called a successful full UI proof.

## Proof Boundary

This readiness document and the v4 composition checklist are planning artifacts. They do not prove that a generated package imports, installs, renders, or behaves correctly at runtime.

The next proof step is not package generation by default. The next proof step is review and approval of the v4 composition checklist. Only after approval should a v4 package be generated and validated.

## Manual Review Recommendation

Review the v4 composition checklist page by page. Confirm that every required mockup section is represented with a specific Yeeflow control, data source, fields, layout rule, action rule, fallback, and validation checkbox. Then generate v4 only if the checklist is acceptable.
