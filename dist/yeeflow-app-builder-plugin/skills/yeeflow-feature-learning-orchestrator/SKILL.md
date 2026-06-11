---
name: yeeflow-feature-learning-orchestrator
description: orchestrate end-to-end Yeeflow feature learning from real exports before generation, including .yap/.ydl/.ywf study, pattern docs, validator updates, minimal test packages, runtime import testing, export-back comparison, baselines, and creation or update of feature-specific generator skills for dashboards, document libraries, reports, AI Agents, Copilots, workflow actions, and other application resources.
---

# Yeeflow Feature Learning Orchestrator

Business Travel runtime-practice lesson: preserve separate proof gates for schema validation, import, workflow publish, and workflow execution. The Business Travel package import became user-proven only after `ListModel.Flags = 1`; later approval workflow publish errors were fixed through validator-backed variable and assignee repairs. Do not promote publish fixes to workflow execution/routing proof without a focused runtime test.

YAPK-from-scratch hardening lesson: when studying generated `.yapk` output, split content correctness from signing correctness. Promote only reusable rules that are safe and redacted: root/child `Flags = 1`, declared workflow variables for sequence flows / Set Variable / task assignments / form bindings, no stale renamed variables, no tenant-specific assignment placeholders, content validators before signing, and narrow proof-boundary wording. Do not commit generated packages, decoded payloads, raw `Resource`, raw `Sign`, API responses, screenshots, tenant IDs, or private data.

Use this skill when the user asks to study a new Yeeflow feature, learn dashboard or document-library structure from exported files, analyze an exported `.yap` and build a test package, create a generator skill for a feature area, run the full learning cycle, or use the Yeeflow feature learning process.

This is a learning orchestration skill. It does not replace:

- `yeeflow-approval-form-generator`
- `yeeflow-data-list-generator`
- `yeeflow-application-generator`
- `yeeflow-application-builder`

Use generator and builder skills for proven generation work. Use this skill when a feature area is not yet proven or when a new resource pattern must be learned from real exports.

When reviewing black-box generated-app self-tests, treat the generated apps as evidence only. Do not merge self-test packages as product baselines and do not promote raw `.yap`, `.ydl`, `.ywf`, or `.yapk` artifacts into reusable skills. Classify each finding as a reusable skill/generator rule, validator rule, application-specific design choice, acceptable limitation, or focused runtime-proof need before updating docs, validators, or installed skills.

## Skill Boundary

Use `yeeflow-feature-learning-orchestrator` for training Codex on new Yeeflow platform capabilities:

- studying new Yeeflow exports
- learning new controls
- learning workflow/action patterns
- learning dashboard patterns
- learning form action patterns
- learning expression patterns
- comparing generated output with manual fixes
- updating docs, validators, and skills
- creating focused runtime proof apps for unknown platform behavior
- promoting proven learning into generator skills
- consolidating black-box self-test findings into reusable generator, validator, checklist, and skill guidance without adopting the self-test app as a baseline

Use `yeeflow-application-builder` when the user provides business requirements and asks Codex to build, implement, create, generate, test, or output a real Yeeflow application/package/`.yap`. The builder skill owns the Requirement-to-YAP lifecycle and business solution design process.

## Core Principle

Do not start by generating.

For any new Yeeflow feature:

1. Study real exports first.
2. Extract structure.
3. Document patterns.
4. Update validators.
5. Generate the smallest possible test.
6. Validate.
7. Build wrapper.
8. Import/test in Yeeflow only when explicitly asked.
9. Debug failures with evidence.
10. Document the successful baseline.
11. Update or create the relevant feature-specific skill.

A feature is not runtime-learned until real export study, validation, focused runtime proof, baseline documentation, and skill updates are complete. Export-backed schema learning can still be useful, but it must be labeled as export-proven, validator-backed, planning-guidance, import-proven, or partial rather than runtime-proven.

## Runtime Gate For New Capability Learning

Use `docs/studies/new-capability-runtime-gate-process.md` when present. New function/schema/skill learning should follow an explicit two-step proof model:

1. Export-backed learning branch.
2. Focused runtime baseline branch or isolated runtime continuation.
3. Merge only after the proof boundary is clear.

Learning branch purpose:

- decode and study exports read-only
- document schemas, relationships, `ReplaceIds`, dependencies, and unknowns
- create normalized redacted references
- update validators carefully, using hard errors only for proven invalid generated shapes
- update skills with export-proven knowledge only
- avoid claiming import/runtime behavior

Runtime decision before merge:

- recommend a focused runtime test before merge when generated package behavior, imported rendering, workflow execution, app settings rendering, AI/email/external execution, custom code execution, document upload/persistence, user/group membership, permissions, or row mutation is involved
- continue runtime work on the same branch only if generated artifacts stay isolated, ignored, and safe
- otherwise create a separate focused runtime branch
- defer runtime proof only when the user explicitly approves merging as export-proven, validator-backed, planning-guidance, import-proven, or partial

Focused runtime baseline rules:

- build the smallest app that tests only the learned capability
- avoid unrelated app complexity
- validate locally before building, and build before runtime testing
- import only into `https://<yourdomain>.yeeflow.com` after local validation passes and runtime testing is requested
- avoid live AI calls, real email, external APIs, destructive updates, private users, private images, private documents, and credentials unless the safe scope is explicit
- document exact proof labels: passed, partial, blocked, or not tested

Merge rule:

- do not merge a new capability branch as runtime-proven unless focused runtime testing passed and the tested host/scope is documented
- if merged before runtime, the final report must name the proof boundary and preserved gaps
- do not promote broad generation rules from export study alone; either keep them export-proven/validator-warning/planning guidance or require focused runtime proof
- never treat import/open, configuration visibility, render-only proof, and executed runtime behavior as the same evidence level

For generated-app UI/UX standards, first study a focused export such as `UI and UX design (1).yap`, document dashboard/list/approval form shells, add validator warnings where exact checks are safe, and only then propose a minimal generated test package. Do not make UI/UX standard warnings into hard generator errors until a generated package has runtime import/open and export-back proof.

For generated application quality hardening, promote only safe reusable rules from observed failures into skills, docs, and validators. Current generated-final standards include: dashboards and Data List custom forms need safe outer padding and section/card/container grouping; dashboard Data table controls must have a source and meaningful display columns; data-bound controls must resolve fields/actions before handoff; and empty dynamic item templates should warn or fail depending on the proven host. Use `docs/studies/application-generation-quality-hardening.md` and `scripts/inspect-generated-ui-quality.mjs` when consolidating these findings. Runtime proof is still required before claiming every future generated app will be visually perfect.

For plan-first/full-scope generation hardening, promote reusable rules that prevent broad underbuilt apps: require a Markdown app plan before package generation unless explicitly skipped, ask focused clarification questions for blocking unknowns, default to the complete planned application rather than a simple/MVP package, and validate the generated package against the plan. Use `docs/studies/application-planning-full-scope-hardening.md` and `scripts/inspect-generated-app-quality.mjs` when consolidating these findings. Keep the proof boundary clear: this hardens guidance and validation, but focused generated-app runtime proof is still required before releasing a new plugin version.

For Yeeflow Document Library learning and generation, use `docs/studies/document-library-resource-structure.md`, `docs/studies/document-library-fields-views-forms.md`, `docs/studies/document-library-generation-rules.md`, `docs/studies/document-library-runtime-test-plan.md`, and `document-library-resource-reference.normalized.json`. `Projects Center.yap` proved document libraries are app child resources with `ListModel.Type = 16`, normal child-resource envelopes, root navigation entries with `Type = 16`, document-specific default fields, Type `0` views, and Type `1` custom forms. `Document Library Sample.yap` proved document-library-only apps may export with no root pages, root `LayoutView = {"sortVer":1}`, empty view `LayoutView`, an unassigned `New file` upload form, and top-level `Resource.SimplePortal = null`. The user-runtime-tested `document-library-sample-new-library-only.v1.yap` imported and ran successfully; treat the `New Document Library` resource shape, with default Type `0` view `LayoutView = ""`, as the canonical minimal base definition. Do not use the earlier generated `Baseline Documents` experiment as the base definition. The v2 `Enterprise Document Center` runtime pass imported/opened three generated Type `16` libraries with simple custom fields and configured views. The v2 folder pass proved generated root-level folder rows using the export-backed `ListDatas` shape with `Bigint1 = "0"` and `Text1 = "folder"`; nested folders and upload persistence remain runtime-sensitive. `Enterprise Document Center Folders Runtime.yap` proves dashboard Doc library controls with `type = "document-library"`, `attrs.data.list`, optional `attrs.data.folder.path = "0/<folder ListDataID>"`, optional expression-token `attrs.data.customPath`, `attrs.listarr`, and caption/search/add-true settings. The form-host study proved document-library custom-form hosting for root-bound controls with disabled search/add; approval-form controls rendered in Builder preview, but live request proof is blocked by workflow assignment-task assignee and task form setting generation rather than the Doc library control schema; data-list custom-form hosting remains validation-only until focused runtime tests.

For root style/token learning, study `root_styles.txt` read-only, preserve token names exactly, document token groups, and update generator guidance to prefer Yeeflow-native tokens over arbitrary colors. Do not inject the full root stylesheet into generated apps.

For Yeeflow Application Design System learning, consolidate the focused UI/UX export, root tokens, design-system alignment guidance, and proven generated-app baselines into `docs/yeeflow-application-design-system.md` plus layout/style/dashboard/list/form/control-naming standards. Keep validator checks warning-first until a generated design-system package has runtime import/open/export-back proof.

For Yeeflow Form Report learning, use `docs/studies/form-report-resource.md`, `docs/studies/normalized/form-report/`, and `scripts/inspect-form-reports.mjs`. `AI Training-2 (1).yap` export-proves Form Report as `Data.FormNewReports[]` plus matching `Data.Childs[]` resources with `ListModel.Type = 32`, `DefKey` approval-form dependency, `Settings.Fields[]`, optional one `Settings.SubListID`, `Settings.Filters`, `Attr.isViewDetail`, `Attr.isExport`, Type `0` views, and `LayoutView.Attr_IsViewDetail`. Keep row multiplication, direct row-click behavior, Excel export execution, custom permission audiences, and dashboard/lookup/data-table data-source usage out of runtime claims until a focused baseline proves them.

For shared Yeeflow data-view learning, use `docs/studies/data-view-resource-settings.md`, `docs/studies/normalized/data-views/`, and `scripts/inspect-data-views.mjs`. `Data Lists (1).yap` export-proves data views as `Data.Childs[].Layouts[]` entries on data-list resources, with metadata on `Title`, `Type`, `Ext1.Url`, `IsDefault`, and `IsItemPerm`; list-style settings in `LayoutView.layout`, `query`, `sort`, `filter`, and `rowColor`; gallery Type `999`, kanban Type `104`, calendar Type `100`, and list Type `0`. Treat the finding as export-proven for data lists, product-documented for Form Report and document-library view concepts unless a Type `32` or Type `16` export proves the exact advanced view settings. Do not claim runtime switching, permission enforcement, calendar rendering, kanban drag/drop, or detail-page behavior without focused runtime proof.

For Data List `ListModel.LayoutView` add-form learning, use `docs/studies/data-list-layoutview-add-form-runtime-fix.md`. Keep display settings separate from Type `0` view layout JSON: `ListModel.LayoutView.add/edit/view` choose custom form layouts, while `Layouts[].LayoutView.sort` configures grid sorting. Product feedback and the focused package failure show that `opentype.add` plus `modalsize.add` without a concrete `add` layout can make the Add modal load forever. The user-confirmed fixed package proves the default `+ New item` Add modal renders for the focused generated Container/Button action package when `add/edit/view` resolve to concrete Type `1` layouts and object-shaped display-settings `sort` is omitted. Promote missing `add` layout references and object-shaped display-settings sort entries to generated-final hard errors, but do not claim Add form save/data mutation, other open modes, Public Forms, Document Libraries, Form Reports, or unrelated app patterns from this proof.

For Yeeflow Data Filter control learning, use `docs/studies/data-filter-controls.md`, `docs/studies/normalized/data-filter-controls/`, and `scripts/inspect-data-filter-controls.mjs`. `Sales_Management_AD.yap` export-proves dashboard Checkbox (`check-filter`), Select (`select-filter`), Range (`range-filter`), Check range (`check-range`), Date (`date-filter`), Relative period (`relative-period`), Apply button (`apply-button`), and Remove filters as the observed `remove-filers` type. `CRM - Customer relationship management.yap` export-proves dashboard Search (`search-filter`), Radio (`radio-filter`), Hierarchy (`hierarchy-filter`), and Sorting as the observed `sorting-filters` type. Filter variables live in embedded dashboard page `filterVars[]`; value-producing filters bind with `binding = "__filter_" + filterVarId`; downstream data-bound controls consume them in `attrs.data.filter[]`, `attrs.data.fulltext[]`, `attrs.data.sortingfilter[]`, or `exts[].attr.settings.Conditions[]` expression-token arrays. Apply Button and Remove filters are special controls and do not behave like normal value-producing filters. `docs/studies/data-filter-controls-runtime-proof.md` adds focused generated-dashboard runtime proof for import/open/render, Search click-apply, and Radio value-change stability only. Approval-form and data-list-form applicability remains product-documented until export/runtime proof exists; Remove filters reset behavior, Hierarchy interaction, and exhaustive semantics remain unproven at runtime.

For Yeeflow Pivot Table control learning, use `docs/studies/pivot-table-control.md`, `docs/studies/pivot-table-control-runtime-proof.md`, `docs/studies/normalized/pivot-table-control/`, and `scripts/inspect-pivot-table-controls.mjs`. `CRM - Customer relationship management (1).yap` export-proves Pivot Table controls on a Type `103` dashboard page, with visible `type = "pivot-table"` controls linked to embedded page `exts[]` entries using `category = "___Pivot___"`, `key = "PivotTable"`, and `i = <control id>`. Rows, columns, and values are configured under `exts[].attr.settings`, sources resolve through `ListID` / `ListSetID`, date groupings observed include `DAY`, `MONTH`, `QUARTER`, and `YEAR`, and observed aggregations include `COUNT`, `COUNT_DISTINCT`, `SUM`, `AVG`, `MAX`, and `MIN`. The focused v2 generated package adds user-confirmed Dashboard package/runtime smoke proof with 20 safe synthetic rows and successful manual new-item add in its data list; keep this narrower than exhaustive aggregation correctness. The v1/v2 diff strongly indicates the missing-row/Add failed issue was crossed data-list field storage metadata, so promote `FIELD_NAME_FIELDTYPE_MISMATCH` as a generated-final hard gate for future seed/add-ready apps. Pivot Table availability on Data List forms and non-availability on Approval Forms / Data List Public Forms is product-understanding-backed unless a focused export proves those host schemas. Do not claim filtering execution, alternate data sources, Data List form hosting, or exhaustive rendered aggregation correctness until focused runtime baselines prove them.

For Collection/Kanban action learning, use `docs/studies/collection-kanban-actions.md`, `docs/studies/normalized/collection-kanban-actions/`, and `scripts/inspect-collection-kanban-actions.mjs`. `Company Overview (2).yap` export-proves dashboard Kanban local actions for Edit item and Delete item, dashboard Collection local actions for Select Items, Edit item, Delete item, and Mark current item as Completed, item-template `attrs.control_action` bindings, current item expressions with `ctx = "__ctx_coll"` and `ListDataID`, selected IDs/count temp variables, checked/unchecked dynamic display rules, and page-level bulk update/delete actions. The screenshot adds UI-reference-backed Collection item step labels including View item, Edit item, Delete item, Update fields, and Trigger list workflow. Runtime execution of edit/delete/update/select/bulk operations is proven only for the focused correct-project v2 generated package; retest before applying the claim to broader generated apps.

`docs/studies/collection-kanban-actions-runtime-proof.md` now records the correct-project v2 generated runtime pass for Collection/Kanban local actions, current item context, item selection, selected count, and bulk update/delete. Preserve the proof boundary: the user-confirmed pass applies only to `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` from the clean project and the tested generated package/actions, not all Collection action step types or cross-host behavior.

Correct-project v2 result: `/Users/Renger/Downloads/collection-kanban-actions-runtime-proof.v2.yap` was generated from `formreport-clean`, validated locally, and user-tested successfully for the focused Collection/Kanban action checklist. Do not carry over wrong-project artifacts, screenshots, decoded payloads, or broader runtime claims.

For Data List / Document Library permissions and notifications learning, use `docs/studies/data-list-document-library-permissions-notifications.md`, `docs/studies/normalized/data-list-permissions/`, `docs/studies/normalized/data-list-notifications/`, `scripts/inspect-data-list-permissions.mjs`, and `scripts/inspect-data-list-notifications.mjs`. `Data Lists (1).yap` export-proves Data List permission flags at `ListModel.Perm`, `IsBreakInherit`, `IsItemPerm`, and view-level `Layouts[].IsItemPerm`, but not the detailed administrator/basic/advanced audience matrix shown in UI screenshots. It export-proves Data List notification `RemindRules[]` with Type `1` item-added, Type `2` regular reminder, Type `3` date-field reminder, Type `4` item-changed, stringified `Rules`/`Receiver`, user/department/user-group/list-field recipients, templates, and condition data. Document Library applicability is product-documented only in this pass because no Type `16` resource is present. Form Report does not support these Data List / Document Library manage-permission or custom-notification features.

For manual form-design correction learning, study the exported-back `.yap` read-only, compare the improved form Def against the generated baseline, extract exact property paths, update `docs/yeeflow-form-design-quality-rules.md`, add warning-first validators, and update approval/application/data-list generator skills. Do not regenerate the app in the same pass unless the user explicitly requests it.

For focused Text control learning, treat a small `.ywf` sample as authoritative. Decode it read-only, extract every native Text control, document `attrs.headc`, `attrs.heads`, and `attrs.common` shapes, update `docs/yeeflow-text-control-generation-standards.md`, add warning-first validators, sync approval/application/data-list/dashboard skills, and only then regenerate affected apps with fresh IDs.

For focused approval-form control learning from a `.yap` export, scope the study to the named approval form. Decode the wrapper read-only, extract the selected `Data.Forms[].DefResource`, inventory controls, variables, bindings, layout containers, lookup/list dependencies, runtime-sensitive controls, and validator gaps, then promote only documented rules into approval/application/data-list skills. Do not generate or import unless the user explicitly asks. Use `docs/ai-training-approval-form-control-study.md` as the current broad control-anatomy example.

For approval-form control runtime coverage, keep a consolidated matrix after each staged package. After Approval Form Controls Test v1/v2/v3/v4/v6, use `approval-form-control-runtime-coverage.json` and `docs/approval-form-control-runtime-coverage-matrix.md` to distinguish runtime-proven controls, partially proven controls, skipped/deferred controls, environment-dependent controls, and persistence-safe mappings. Stage 5 metadata/tag controls may be intentionally skipped; document that status rather than treating it as proof. Stage 6 proved internal packaged lookup and list/listref workflow-form usage, and also proved the raw lookup persistence rule: raw lookup variables mapped into plain text fields store internal local row IDs, so readable persistence should use lookup `attrs.addition[]` autofill variables or explicit summaries unless row IDs are intentional.

For global page-background learning, apply the rule across all generated Yeeflow visual surfaces: dashboard pages, data-list custom forms, approval submission pages, and approval/task pages should set full-page background color on the page/form background property, not on the top-level `Main` container. Keep `Main` structural and reserve container backgrounds for specific sections, cards, headers, summary panels, and content surfaces.

After a generated application reaches a runtime baseline, sync the relevant project skill mirrors and active `~/.codex/skills` installs. The CAPEX Runtime V2/V3/V4 learning promoted manual form corrections into generator standards: page-level backgrounds, Form header/request summary/metric row, inline Text/Icon controls, icon badge wrappers, two-column field grids, runtime-sensitive control fallback rules, calculated fields, workflow-action schema validation, and control/field schema mapping. Use `docs/generated-it-hardware-capex-request-text-standard-baseline.md` as the latest CAPEX runtime evidence.

For Yeeflow expression-editor learning, treat uploaded training references and screenshots as read-only schema/UI evidence. Extract the exact token model, variable shape, allowed operators, allowed function names, function parameter counts, enriched function metadata, and editor entry points into normalized JSON references and docs. Add helper validation before generation. Expressions are used across calculated controls, dynamic display rules, custom validation rules, lookup/data filters, workflow transition/action conditions, default values, request numbers, and subtotal/total/date/string formulas. Preserve exact runtime function names; if a function is only visible in a screenshot and lacks parameter metadata, document it as observed but not generation-safe. Create or update a dedicated expression skill when the expression layer becomes a reusable cross-feature capability. Do not generate an app during the foundation pass.

For expression export-back enrichment, compare user notes against decoded runtime names before promoting functions. `Expression Runtime Test v1 Patch.yap` proved that department/organization attribute expressions use `getOrgAttr`; the noted `getDeptAttr` name was not present in the export. After learning user/profile expression patterns, generate the smallest focused runtime package, validate with expression utilities and app/form/list validators, import-test only when requested, then update docs and skills with actual runtime evidence and tenant-data caveats.

For sub list/listref summary expression learning, study the updated export first and extract three layers separately: row-level current-object expressions (`exprType: "variable_ctx"`), parent list summary configuration (`attrs["list-fields-summary"]`), and workflow transition wrappers (`conditioninfo[]` with numeric `n.*` operators). Then generate the smallest focused runtime app to prove row calculations, summary display, summary-to-variable binding, and both high/normal workflow branches before promoting the pattern as generator-safe. Document runtime entry behavior such as summaries recalculating after row input blur/commit.

For FlowKey/import-replacement learning, compare generated and manually fixed exports for corrupted JSON property names as well as values. `Implant Application Request (1).ywf` proved that generated FlowKey `EFI` was replaced inside the reserved property name `prefix`, corrupting a sublist summary binding to `pr<runtimeFlowKey>x` and breaking `TotalApplicationAmount` binding. Promote safe FlowKey rules into validators and generator skills: generated FlowKeys must not be lowercase substrings of reserved JSON property names, and wrapper/export inspections should warn on corrupted keys like `pr[0-9]+x`.

For approval workflow task-form learning, study task pages separately from the submission page. `Workflow Actions Runtime Baseline (2)_Task forms.yap` proves approval form task pages live in `Data.Forms[].DefResource.pageurls[]`, use `type = 2`, and are associated to Assignment Task nodes by `MultiAssignmentTask.properties.taskurl`. AP Approval demo runtime practice adds the publish-critical rule: Assignment Task and Claim Task nodes should carry `properties.pagetype = 1`, mirror task page references across `taskurl`, `taskUrl`, and `TaskUrl`, and resolve to task pages with outer `pagetype = 1`. Extract standard Action Panel task forms, custom `action_button` + `formdef.actions[]` forms, Submit form step operation markers, copied-readonly controls, editable task-owner controls, comments, and user-picker variables. `Workflow Action Approval Test.ywf` corrects the earlier Add others/Add assignee button binding and proves the intended `action_button.attrs.control_action` -> Add assignee action -> `submitType = "5"` path. Keep this export-proven until focused runtime tests execute approve/reject/reassign/add-assignee/complete operations safely.

For Yeeflow Form Actions Phase 1 learning, study the manually updated export before generating. Extract action buttons, button style codes, `action_button.attrs.control_action`, `page.formdef.formAction.onLoad`, `page.formdef.actions[]`, `variables.tempVars[]`, temp variable expression prefixes, and Phase 1 step types (`setvar`, `confirm`). Keep terminology clear: form actions are front-end form logic; workflow actions are process/backend graph logic; temp variables are form-runtime state. Treat new step types such as `listitem` as observed/deferred until a focused generated runtime test proves them.

The first generated Form Actions Phase 1 runtime app proved button styles, button-click actions, page-load actions, temp variable display, `setvar`, `confirm`, submit, reviewer task open, and approval completion after correcting an invalid generated direct-user assignee. The root cause was a hardcoded `method: "users"` assignment with a tenant-local user id/title. Promote this as a generator rule: do not hardcode direct users unless the mapping is export-backed and valid for the target tenant; use requester/current-user expression assignment by default. ContentList persistence remained pending in that first package, so keep it separate from the form-action proof until a regenerated package proves it.

For Yeeflow Form Actions Phase 2 query/submit learning, study the manually updated runtime export before generating. Extract `querydata` steps, query multiple vs single modes, source list metadata, selected fields, field maps, result count variables, temp collection variables, mapping to form list variables, Query data filters, `arraySum` over query collections, `JSONStringfy` collection display, submit steps, and Save changes mode. The generated `Form Actions Phase 2 Query Submit Test v1` runtime proved query multiple/single mapping, count output, `arraySum`, `JSONStringfy`, default Submit form, Save changes, approval completion, and ContentList persistence. The corrected filter retest proved Query data filter conditions use `attrs.querydata_filters` plural with Bit ON as `right: "true"`, returning 2 active rows and `arraySum` 2000; the singular `querydata_filter` helper path is ignored by runtime. `Implant Application Request (5).ywf` proved the Query data filter value-mode trap: variable/calculated right operands must be expression-token arrays with `showCus: false`, not frontend `<input ...>` expression-button HTML in direct-value mode. Treat `vLookup` as deferred when it appears only in labels. Do not document or generate `arraySub`; the learned aggregate is `arraySum`.

For Yeeflow Form Actions Phase 3 condition-flow learning, study corrected `.ywf` exports before promoting submit guard behavior. `Implant Application Request (2).ywf` proved that designer checkbox `Continue next step when condition is not met` serializes as step-level `continue: true`. Conditional warning/confirm/check steps before a Submit form step usually require this property so the valid path can skip the warning and continue to submit.

For expression export-back fixes discovered during manual runtime testing, compare the generated and manually corrected token shapes exactly before promoting. `Implant Application Request (3).ywf` proved that `dateDiff` date-unit params use a raw lowercase string such as `"year"`; the generated token-array shape `[{ "type": "str", "value": "Year" }]` rendered as `formcraft.formula.datetype.[object Object]` and broke Applicant Boarding Years calculation. Promote this kind of finding into expression docs, validators, generator skills, and focused smoke tests.

For workflow transition condition learning, study corrected `.ywf` exports before promoting branch condition generation. `Implant Application Request (4).ywf` proved latest SequenceFlow condition rows support independent left/right operand modes: `type: 1` direct selector, `type: 0` direct/static/option/date value, and `type: 2` expression editor. Compare old legacy HTML-button conditions with wrapper-object manual examples, document when each pattern should be generated, and update validators warning-first.

For Yeeflow application version-management package learning, treat `.yapk` as distinct from `.yap` and use `yeeflow-yapk-package-generator` for package-specific inspection/validation. Study wrappers first and preserve originals. Product schema defines `.yapk` as `AppExportPackageInfo` and describes `Resource` as Brotli-compressed `AppPackageInfo`, but readable historical artifacts did not verify the Brotli decode path in the current study. Wrapper signing/verification is evidence-backed only for already-valid Resource payloads, and wrapper-only signing does not change app content when `Resource` is unchanged. Until Resource decode/edit/encode/sign/verify/runtime-upgrade is proven, do not mutate `.yapk` wrappers or app internals for content-upgrade claims; use `.yapk` as read/inspect-only and ask product to confirm the exact Resource encoding and signing path.

## What To Load

- For the full lifecycle, read `references/feature-learning-workflow.md`.
- Before any Yeeflow import/runtime test, read `references/runtime-testing.md`.
- Before generation or validation, read `references/hard-rules.md`.
- Before updating or creating a feature skill, read `references/feature-skill-map.md`.

Also read the relevant installed feature skills when the task touches their area:

- `.yap` app shell, navigation, app-level resources: `yeeflow-application-generator`
- data lists and `.ydl`: `yeeflow-data-list-generator`
- approval forms and `.ywf`: `yeeflow-approval-form-generator`

## Standard Operating Workflow

1. Ask for real exported files that contain the feature: a working `.yap`, a smaller focused example if available, an exported-back version after manual UI changes if available, and screenshots or notes that explain the Yeeflow UI configuration.
2. Decode and inspect exports read-only. Preserve originals. Redact token, credential, secret, tenant, connection, and API-key-like values.
3. Inventory feature resources and dependencies. Identify where the feature lives in `Data.Item`, `Data.Childs`, `Data.Forms`, `DataReports`, `FormReports`, dashboards, document libraries, agents, knowledges, connections, or `OtherModules`.
4. Compare with known baselines from the app, list, and approval-form skills. Mark what is known, new, similar, risky, or externally dependent.
5. Extract a reusable feature pattern: location, required fields, IDs, `ReplaceIds`, navigation/menu links, related child resources, data sources, runtime dependencies, and export-back behavior.
6. Update or design validator rules before generating. For workflow actions, first normalize the official action configuration reference into `workflow-action-configurations.normalized.json` and document it in `docs/workflow-action-configuration-reference.md` plus `docs/workflow-action-generation-rules.md`. For control/field schema references, first normalize `control-configurations.json` and `field-configurations.json`, document approval control rules, data-list field rules, and control-to-field mappings, then update validators and generator skills before app generation.
   For generated `.yap` materialization learning, promote app-resource ID rules into validators before retesting: do not remap `TenantID`, `CreatedBy`, or `ModifiedBy`; keep `FieldID` globally unique across the application; keep every `field.ListID` equal to its parent list; and verify root Type `103` dashboard/navigation linkage with materialization inspection.
7. Write a dedicated study doc such as `docs/dashboard-feature-pattern-study.md`, `docs/document-library-feature-pattern-study.md`, `docs/report-feature-pattern-study.md`, or `docs/ai-agent-feature-pattern-study.md`.
8. Generate only the smallest possible test package, using fresh local ID families and minimal dependencies.
9. Run component and package validators. Build wrappers only after validators pass.
10. If the user explicitly asks for runtime testing, import into `https://<yourdomain>.yeeflow.com` and capture runtime evidence.
11. If runtime fails, isolate with smaller packages instead of guessing. If app materialization fails or imports as an empty shell, stop before testing custom controls and focus on app shell/resource linkage, global field IDs, field ownership, duplicate field names, `ReplaceIds`, and dashboard/navigation references.
12. If possible, export the imported app back and compare generated source, wrapper, and exported-back `.yap`.
13. Patch minimally with fresh IDs, retest, and preserve known-good baselines.
14. Document the successful baseline.
15. Update or create the relevant feature-specific skill, including proven patterns, hard rules, validators/scripts, stop conditions, summarized examples, and remaining gaps.

## Workflow Action Learning Rules

When learning workflow actions from `node-configurations.json`, treat the uploaded JSON as read-only source evidence. Extract control types, required/optional properties, value types, enums, nested schemas, and conditional applicability. Update validators before generating new workflow packages.

Validation should cover missing required node properties, invalid enum values, invalid value types, invalid `ContentList` mappings, invalid `QueryData` filters, invalid `SequenceFlow` conditions, invalid `Loop`/`Delay` condition shapes, and unsafe external or credential-related actions. Do not bundle sensitive values.

## Control And Field Schema Learning Rules

When learning Yeeflow approval control or data-list field schemas from `control-configurations.json` and `field-configurations.json`, treat them as read-only schema evidence rather than runtime proof. Preserve large IDs as strings, redact sensitive values, produce normalized references and docs, make validator checks warning-first for runtime-unproven shapes, and update approval-form, data-list, and application generator skills. Do not create a standalone schema skill unless it adds a clearly distinct workflow beyond those existing generators.

## Validation Commands To Prefer

Use existing project validators and builders rather than copying scripts into this skill:

```bash
node validate-yap-package.js <decoded-app.json> --mode generator --stage final
node validate-yap-graph.js <decoded-app.json> --mode generator --stage final
node validate-ywf-def.js <approval-form-def.json> --mode final
node validate-ydl-list.js <list-def.json> --mode generator --stage final
node build-yap-wrapper.js decoded-app.json output.yap
node --check <script.js>
```

Adapt paths to the active workspace or installed skill script location. Report if a validator is missing and create/update it before generation when the feature requires new checks.

## Runtime Boundary

Never import into Yeeflow or operate Chrome for Yeeflow testing unless the user explicitly asks. When the user does ask, use the Codex Yeeflow environment:

`https://<yourdomain>.yeeflow.com`

Use Chrome console/network evidence when import or runtime behavior fails. Do not expose secrets or tenant credentials in logs, summaries, docs, or skills.

<!-- agent-copilot-application-resource-learning:start -->
## AI Agent/Copilot Resource Learning Route

For AI Agents, Copilots, application connections, OpenAPI/REST tools, and application-resource access, use learning mode first: decode exports read-only, map OtherModules, normalize redacted references, update validators, and only then decide whether a generated baseline is safe. Do not mix this with requirement-to-app delivery until the resource graph and validation rules are clear.

Hard stop if Agent/Copilot resources cannot be located, tool references cannot be mapped, connection values cannot be redacted, or runtime testing would call real external systems.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Scheduled Workflow / AI Assistant Action Learning Route

For Scheduled Workflow resources, Send email workflow actions, Query data workflow actions, and AI Assistant workflow actions, use learning mode first. Decode `.yap` exports read-only, preserve large numeric IDs as strings, and document `Data.Forms[]` entries with `WorkflowType = 3` before generation.

`AI Agent and Copilot Local Resource Baseline8.yap` proves app-level Scheduled Workflow resources are stored in `Data.Forms[]` with `ListID = 0`, `WorkflowType = 3`, a JSON-string `Settings` schedule, and a JSON-string `DefResource` workflow graph. It proves daily `Frequency = "0"`, weekly `Frequency = "1"`, weekly weekday `Values[]`, Windows-style `TimeZone`, `Times[]`, and `IsWorkday: true` for every-X-working-days recurrence.

The same export proves workflow `QueryData` -> `AI` -> `MailTask` orchestration where `QueryData` writes local list JSON to a workflow variable, `AI` with `properties.type = "agent"` calls an app-contained AI Agent through `properties.data.AgentID`, maps Agent outputs back to workflow variables, and `MailTask` can use those workflow variables for subject/body.

`Workflow Actions Runtime Baseline (1).yap` proves a Scheduled Workflow action baseline with `WorkflowType = 3`, `ListID = 0`, a `StartNoneEvent` that has email-notification fields but no terminate/recall fields, and one `MultiAssignmentTask` using `properties.usertaskassignment[]` with an Applicant Line Manager expression. Treat this as export-proven only; do not execute scheduled workflows, send email, or claim scheduled assignment routing without a focused runtime baseline.

`Spark & AI (1).yap` extends the workflow AI proof to data-list workflows. The proven path is host-list `FlowMappings[].Setting.NewTrigger = true` -> `Data.Forms[]` workflow with `WorkflowType = 1` -> workflow graph `AI` node -> app-contained Agent with image input `type = "img"` bound from a list-field expression (`valueType = "icon-upload"`) plus native `ListDataID` bound into a text input. The called Agent can use an application-resource access tool (`Components[].Type = 2`, `SubType = 10`) scoped through `Settings.resources.dataLists.items[]` to update the triggering row. Study and document this path before generating any list workflow that can invoke live AI or mutate app data.

Hard stop if scheduled-workflow recurrence cannot be mapped, fixed recipients cannot be made safe/redacted, AI Agent references do not resolve, Query data list references do not resolve, or runtime testing might send real email or call live AI unexpectedly.
<!-- scheduled-workflow-ai-assistant-learning:end -->

<!-- workflow-assignment-task-assignee-learning:start -->
## Workflow Assignment Task Assignee Learning Route

For workflow assignment task learning, decode `.yap` and `.ydl` exports read-only, preserve large numeric IDs as strings, and inspect `MultiAssignmentTask.properties.usertaskassignment[]` plus task-type, due-date, reminder, notification, and task-form fields. `Test ABC.yap` export-proves direct user, applicant line manager, applicant department manager, direct job position, job position by selected department, job position by applicant department, job position by selected location, and job position by applicant location shapes. `Test ABC (1).yap` extends this with multiple assignee entries in one task, mixed users/positions/expressions, user-group expression, position all-users expression, `issequential=true`, `approveway` variants, custom percentage, and email notification fields. `Test ABC (2).yap` export-proves absent `tasktype` as approval/default, `tasktype="complete"` for Complete tasks, due-date types `hour`, `day`, and `express`, working-calendar day flag, and reminder `notifyrules[]` before/on/after due date. `Test ABC (3).yap` export-proves approval-form Start action settings for `terminate`, `terminate-conditions`, `revoke-conditions`, and Start email notification. `Purchase Requests.ydl` export-proves a data-list workflow Start action with email settings but without terminate/recall fields, plus a data-list Assignment Task whose assignee expression can reference list-item context such as Created By -> LineManager. `Workflow Actions Runtime Baseline (1).yap` export-proves a scheduled workflow Start action with email fields and no terminate/recall fields, plus scheduled `MultiAssignmentTask.properties.usertaskassignment[]` with Applicant Line Manager expression and no data-list field context. Use `docs/studies/workflow-assignment-task-assignee-settings.md`, `docs/studies/workflow-assignment-task-complete-task-and-due-date.md`, `docs/studies/workflow-start-action-settings.md`, `docs/studies/workflow-approval-vs-data-list-actions.md`, `docs/studies/workflow-scheduled-vs-approval-data-list-actions.md`, `docs/studies/workflow-assignment-task-generation-rules.md`, `docs/studies/workflow-assignment-task-runtime-test-plan.md`, `docs/studies/normalized/workflow-assignment-task-assignees/`, `docs/studies/normalized/workflow-assignment-task/`, `docs/studies/normalized/workflow-start-action/`, `docs/studies/normalized/workflow-expressions/`, and `docs/studies/normalized/workflow-task-forms/`.

Keep this capability export-proven/validator-backed until a focused runtime baseline proves routing. Multiple users, mixed assignee lists, user groups, Sequential/Parallel appointed order, completion modes, and email notification configuration are export-proven where documented, but routing, group/position expansion, appointed-order behavior, and notification delivery remain runtime-unproven. Do not promote workflow-variable assignees, selected department-manager static entries, department+location position entries, or quick-completion behavior unless a focused export proves their exact package shape.

When learning workflow actions, keep product Help Center behavior separate from export schema proof. Minutes as a due-date unit, Automatic Treatment due-date actions, reminder recipients beyond task owner/current assignee, enabled Start terminate examples, Start recall execution, data-list Created By/list-field assignee routing, data-list task-form save/edit behavior, and email delivery remain unproven until export/runtime evidence exists. Generated workflow nodes should be laid out without overlap and `SequenceFlow` source/target plus node incoming/outgoing references must stay consistent.

For API coverage audits that support Assignment Task learning, use only official read-only Yeeflow API endpoints and document gaps in `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md`. Documented read-only support now covers users, user detail, departments, locations, location detail, positions, position assignments, groups, and group members; it still does not prove workflow routing.

For Claim Task workflow-action learning, use `docs/studies/workflow-claim-task-action.md` and normalized refs under `docs/studies/normalized/workflow-claim-task/`. `Workflow Actions Runtime Baseline (3)_Claim task.yap` export-proves Claim Task as `CandidateTask` in approval-form and data-list workflows, with receivers/candidates in `properties.usertaskassignment[]`, task form association in `properties.taskurl`, explicit `tasktype` values `approve` and `complete`, due-date/email fields, and data-list Created By/list-item receiver expressions. `node-configurations.json` is config-reference-backed only; it helps map `CandidateTask`, `MultiAssignmentTask`, `SetVariableTask`, and `ContentList`, but exports remain authoritative. Do not claim claim pool visibility, claim locking, pending-task ownership after claim, quick completion, or email delivery until a focused runtime baseline proves them.

For Set variable workflow-action learning, use `docs/studies/workflow-set-variable-action.md` and normalized refs under `docs/studies/normalized/workflow-set-variable/`. `Workflow Actions Runtime Baseline (4)_Set variable.yap` export-proves Set variable as `SetVariableTask` in approval-form and data-list workflows, with `properties.formtype`, `properties.variablesetting[]`, `formtype="current"` for current workflow variables, and `formtype="custom"` for another approval form workflow instance using `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, and `properties.formids`. Data-list workflows may use `exprType="list_field"` tokens as right-side expression values, but Set variable still targets workflow variables. Use Set data list / `ContentList` for data-list field mutation. Do not claim runtime variable mutation or another-workflow update behavior until focused runtime proof exists.

For Set data list workflow-action learning, use `docs/studies/workflow-set-data-list-action.md` and normalized refs under `docs/studies/normalized/workflow-set-data-list/`. `Workflow Actions Runtime Baseline (5)_Set data list.yap` export-proves Set data list as `ContentList` in approval-form and data-list workflows, with `properties.listtype`, selected-target metadata, `properties.type` values `add`/`edit`/`remove`, `properties.listdatas[]`, and `properties.wheres[]`. Data-list workflows can use `listtype="current"` for current-list context and `exprType="list_field"` values on the right side. Preserve numeric operation codes `Per="0".."4"` and sub-list/detail-row mappings, but do not claim add/update/delete execution, current-list mutation, document-library mutation, or sub-list row iteration without focused runtime proof on disposable data.

For Signal event workflow-action learning, use `docs/studies/workflow-signal-event-action.md` and normalized refs under `docs/studies/normalized/workflow-signal-event/`. `Workflow Actions Runtime Baseline (6)_Signal event.yap` export-proves Signal event as `SignalEvent` in an approval-form workflow, with no incoming flow, one outgoing flow, and `properties.eventdefinitions[]` containing `RevokeEventDefinition` and `CancelEventDefinition`. Treat Signal event as a special approval-workflow event source for recall/terminate compensation branches. It can connect to Set data list / `ContentList` cleanup actions, but recall/terminate firing, downstream mutation, and email behavior remain runtime-unproven. Do not execute recall/terminate in learning passes unless explicitly scoped with disposable requests and safe cleanup targets.
<!-- workflow-assignment-task-assignee-learning:end -->

<!-- application-settings-navigation-user-groups-learning:start -->
## Application Settings, Navigation, Header, And User Groups

For application settings learning, decode `.yap` exports read-only and inspect the root app shell first. The export-proven location is `Data.Item.ListModel.LayoutView` as a JSON string. Parsed `sort[]` stores navigation menu items, `attrs["navigator-menu"].position` stores menu layout, and `attrs.appearance` stores header appearance.

Navigation menu exports prove resource items and custom groups. Groups use `Type = "classes"`, `ID`, `Title`, optional `Icon`, and child resources in `list[]`; groups require display text and cannot contain nested groups. Resource items may include `DisplayName` for custom menu text or omit it to fall back to `Title`. No-icon is export-proven as `Icon: ""`. Keep menu depth to two layers.

Navigation layout values are `default` for horizontal/default, `left` for vertical, `onheader` for on-header, and `none` for no menu. Header title hidden is `attrs.appearance.hideTitle = true`; default visible title is omission. Default 56px height is represented by omission, and v6 proves small height as `attrs.appearance.height = 46`; larger heights remain product-known but not export-proven.

Application user groups are export-proven in `Data.AppGroups[]` with `{ ID, Name, Description }`; v6 proves group IDs belong in `Resource.ReplaceIds[]`. Member storage was not present in the studied export, so do not generate group members or real users until a safe member-bearing export proves the schema.
<!-- application-settings-navigation-user-groups-learning:end -->

<!-- app-creation-rules-learning:start -->
## App Creation Rule Learning

When a product-team rules document identifies generation-breaking shapes, record the rule separately from runtime proof and harden validators before broad generation. For Yeeflow app creation, preserve the FieldIndex/FieldName suffix rule, list identifier uniqueness, `InternalName`/process-key character restrictions, and approval-form `NoRule` object shape from `docs/studies/yeeflow-app-creation-rules.md`.

Mark these rules `product-rule-backed` and `validator-backed`. Do not upgrade to runtime-import-proven until a focused regenerated package imports and opens successfully.
<!-- app-creation-rules-learning:end -->

<!-- data-list-document-library-fields-learning:start -->
## Data List And Document Library Field Type Learning

Use `docs/studies/data-list-document-library-field-types.md`, `docs/studies/normalized/data-list-fields/`, and `scripts/inspect-data-list-fields.mjs` before generating or validating broad Data List custom fields. `Data Lists (2).yap` export-proves the target Type `1` data lists `Data list with fields part A` and `Data list with fields part B` with 90 custom fields across `input`, `textarea`, `richtext`, `hyperlink`, `input_number`, `currency`, `percent`, `calculated-column`, `rate`, `switch`, `checkbox`, `radio`, `tag`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `cost-center-picker`, `signer`, `file-upload`, `icon-upload`, `lookup`, `metadata`, `mutiple-metadata`, `location-picker`, `autonumber`, and `list`. `select` and `flowstatus` remain product-rule-backed/unproven in this export.

Field generation must still pass the v0.5.12 app-creation gates: unique `DisplayName`, `FieldName`, and `InternalName`; `InternalName` matching `[A-Za-z0-9_]`; identifier length <= 255; generated non-system `FieldName` suffix matching `FieldIndex`; and `FieldName` storage prefix matching `FieldType` for generated seed/add-ready lists. Accept export-proven single metadata fields as `Type = "metadata"` with Bigint storage, even though the earlier product-team 28-type list only named `mutiple-metadata`.

Use export-proven settings where relevant: choice `Rules.choices` and `color_choices`; numeric/currency/percent `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `currencyCode`, `displayFormat`; picker `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`; upload `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, `controlmultiple`; lookup `appid`, `listsetid`, `listid`, `listfield`, additions, filters, sorting, search, display style, and multiple; calculated columns `calculated_result` plus `calculated`; metadata `source` plus `categoryId`; tag `source`, `category`, `customTags`; autonumber `minDigits`, `startNum`, `prefix`, `suffix`; sub-list `list-variables[]`.

Document Library custom-field applicability is product/user-understanding-backed only in this pass because no Type `16` document library was present. Keep Type `16` default fields and document upload rules from existing document-library studies, and do not claim runtime data-entry behavior for these field settings until focused import/open/field-creation tests pass.
<!-- data-list-document-library-fields-learning:end -->

<!-- data-list-custom-form-fields-learning:start -->
## Data List Custom List Form Learning

For Data List custom list form export learning, use `docs/studies/data-list-custom-form-fields.md`, `docs/studies/normalized/data-list-custom-forms/`, and `scripts/inspect-data-list-custom-forms.mjs`. `Data Lists (3).yap` export-proves four custom list forms across `Data list with fields part A`, `Data list with fields part B`, and `Data list with fields part C`, including Type `1` layout storage, embedded form resources, `ListModel.LayoutView` add/edit/view assignment, `flex_grid` field placement, top-level list-field controls, sub-list nested controls, temp variables, `setvar` form actions, `formAction.onLoad`, and action button bindings.

Keep the proof boundary explicit: this is Data List export proof and validator-backed guidance only. Document Library custom-form applicability remains product/user-understanding-backed unless Type `16` custom-form exports prove it. Do not claim runtime rendering, save behavior, submit/save action execution, sub-list row behavior, uploads, lookup resolution, or Document Library custom form behavior without a focused runtime baseline.
<!-- data-list-custom-form-fields-learning:end -->

<!-- data-list-public-form-learning:start -->
## Data List Public Form Learning

For Data List Public Form export learning, use `docs/studies/data-list-public-forms.md`, `docs/studies/normalized/data-list-public-forms/`, and `scripts/inspect-data-list-public-forms.mjs`. `Data Lists (4).yap` export-proves two Type `1` target data lists with `PublicForms[]` entries, JSON-string public form resources, `pagetype = 3`, `container`/`flex_grid` layout, list-bound public controls, and `submit-button` controls.

Keep Public Forms distinct from Custom List Forms. Public Forms are anonymous/no-login collection forms and therefore have a restricted field/control palette. Screenshots are UI-reference-backed only; they support the default-field and unavailable-field caveats but are not runtime proof and must not be committed.

Preserve the proof boundary: Data List Public Form structure is export-proven and validator-backed after implementation; anonymous submit behavior, public URL access, save/data mutation, upload execution, sub-list row entry, Document Library applicability, and Form Report behavior are not runtime-proven.
<!-- data-list-public-form-learning:end -->

<!-- yap-schema-standard-learning:start -->
## YAP Schema Standard Learning

Use `docs/studies/yap-schema-standard.md`, `docs/studies/normalized/yap-schema-standard/`, and `scripts/inspect-yap-schema-standard.mjs` when product-team schema or package-wrapper failures are in scope. Treat `yap-schema.json` plus the current app creation rules as the standard reference, but keep global `additionalProperties: false` warning-level because known exports may contain product fields not fully covered by the schema.

Hard-stop generated packages when wrapper `Resource` is missing the `[______gizp______]` prefix, decoded `Resource.Data` is malformed, `ListExportInfo.Item` is missing, or any root/child `ListExportItem.Defs` or `Layouts` is missing, null, or not an array. Empty `[]` is valid. Preserve existing app-creation hard gates for FieldIndex/FieldName suffix sync, unique field identifiers, valid `InternalName`, valid process keys, valid `NoRule`, and required `{index}` in `NoRule.Prefix`.

For AI Agent/Copilot Access app resources tools, validate schema-backed bitwise permission masks for approval forms, data lists, document libraries, and AI agents. `formReports` and `dataReports` currently conflict between schema (`Read=8`) and the updated rules document (`Submit=1`), so warn and request product clarification rather than hard-failing either value. Do not claim runtime import proof from this schema-learning pass.
<!-- yap-schema-standard-learning:end -->
<!-- projects-center-import-failure-hardening:start -->
## Projects Center Import-Failure Learning

The Projects Center import failure is user-confirmed only for one generated package and one repaired package: the initial `projects-center-2.v1.yap` failed import, and the fixed package imported successfully after strict repair. Do not broaden this into runtime use, data-entry, document-library behavior, report execution, or workflow proof.

When a generated package passes only compatibility validation, classify that as insufficient for handoff. New `.yap` generation must use strict generator/import-readiness gates before delivery: strict package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rule inspection, data-view/dashboard/page reference checks, wrapper round trip, placeholder scan, and safety scan. Use `scripts/inspect-yap-import-readiness.mjs` when available.

Record and promote these import-blocking rules when seen: Type `1` child data lists need `ListModel.ListType = 1`; native `Title` metadata must be generator-safe; views must not reference unresolved pseudo/system/missing fields; `LayoutInResources` IDs must match owning layout IDs; dashboard dynamic-display/filter references must resolve; `ReplaceIds` must exclude tenant/user metadata IDs.
<!-- projects-center-import-failure-hardening:end -->

<!-- container-button-action-settings-learning:start -->
## Container/Button Action Settings Learning

For Container/Button action learning, study dashboard exports read-only before generation. `AP Approval Demo v3.yap` export-proves dashboard Container and Button action settings for Link, Add list item, Open dashboard, and Open approval form, plus open modes and modal-size settings. The screenshot only backs the Builder UI menu and is not runtime proof.

`docs/studies/container-button-action-runtime-proof.md` adds user-confirmed focused generated-package runtime proof for representative current-app action navigation. It also records the approval form target repair for `process request pageUrl is null key:CBAR`: request pages opened by dashboard actions need a complete request-page shape with outer `pagetype = 1`, embedded `formdef.id`/`formdef.pagetype`, and mirrored Start node page URL aliases.

Promote findings with clear labels: export-proven for decoded dashboard schema, UI-reference-backed for the Execute type menu, validator-backed after checks are implemented, and runtime-proven only for the representative generated-package actions that were manually tested. Keep cross-application targets, literal external links, form-action binding on dashboards, save/submit/workflow behavior, and exhaustive open/navigation variants unproven until separately tested.
<!-- container-button-action-settings-learning:end -->

<!-- sub-list-dynamic-content-learning:start -->
## Sub List Dynamic Content Learning

For Sub List Dynamic content layout and list actions, use `docs/studies/sub-list-dynamic-content.md`, `docs/studies/normalized/sub-list-dynamic-content/`, and `scripts/inspect-sub-list-dynamic-controls.mjs`. `Sub list Dynamic.yap` export-proves Approval Form Sub List controls with `attrs["list-display-preference"] = "dynamic"`, `list-body` item templates, `list-footer` buttons/summaries, list-scoped `attrs.actions[]`, and the sibling header Grid pattern for table-style Dynamic Sub Lists.

Keep the proof boundary explicit. Approval Form schema and the observed list action steps are export-proven. Data List custom form support is product/user-understanding-backed unless a custom form export is studied. Runtime add/duplicate/delete/import/move/update execution, scrollbar behavior, and current-object expression evaluation need a focused runtime baseline before promotion.

Runtime follow-up candidate: `docs/studies/sub-list-dynamic-actions-runtime-proof.md` and `generate-sub-list-dynamic-actions-runtime-proof.mjs` produce a validator-backed, manual-test-pending Approval Form package with one Dynamic Sub List, a sibling header grid, and `list_new`, `list_dup`, `list_del`, and `list_import` actions. Promote only the exact actions and host surface that pass manual import/open/click testing; keep Insert before/after, Move item, Update fields, current-object expressions, scrollbar behavior, workflow execution, and Data List custom form behavior unproven.

Data List print-page learning: use `docs/studies/data-list-print-page-dynamic-sub-list.md` and normalized refs under `docs/studies/normalized/data-list-print-page-dynamic-sub-list/` when studying or generating Data List custom form Dynamic Sub Lists. `Sales Quotation.yap` export-proves the `Quotation` Data List, `Print Page` custom form, read-only Dynamic Sub List line-item display, and View form action step `type = "print"` targeting that print layout with current `ListDataID` context. Runtime print execution remains pending until a focused test.

V1 runtime feedback found a table-layout defect: the generated header Grid collapsed to one column and Designer Appearance could not expand. The user-corrected V1.1 YAPK is the layout source of truth. V1.2 YAPK was generated, signed, and verified after removing the stale standalone V1 header grid and wrapping body-grid field controls in containers. Promote only after the V1.2 manual upgrade/open/action test passes.

`Sub list Dynamic (1).yap` confirms that Sub List row operation menus can use a `dropbar` inside the dynamic item template with menu buttons bound to local `attrs.actions[]`: Duplicate uses `list_dup`, Insert before/after use positioned `list_new`, Move up uses `list_move`, and Move down uses `list_move` with `attrs.moveMode = "2"`. Keep Delete as a visible last-column action when present rather than duplicating it in the row menu. V1.4 generation/signing/validation is local proof only until runtime testing confirms the row-order actions.
<!-- sub-list-dynamic-content-learning:end -->

<!-- kanban-collection-dynamic-controls-learning:start -->
## Kanban/Collection/Dynamic Controls Learning

For Kanban, Collection, and Dynamic control learning, use `docs/studies/kanban-collection-dynamic-controls.md`, normalized refs under `docs/studies/normalized/kanban-collection-dynamic-controls/`, and `scripts/inspect-kanban-collection-dynamic-controls.mjs`. `Company Overview.yap` export-proves Dashboard Kanban usage, Dashboard Collection usage, Dynamic controls inside their item templates, and Dynamic field controls on a Data List `View page`.

Preserve the proof boundary: Kanban/Collection/Dynamic schema is export-proven where observed. The focused generated package `kanban-collection-timeline-runtime-proof.v1.yap` proves import/open/render stability for Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field values, and proves Dynamic user/image/file controls do not crash with empty values. Drag/drop, click behavior, non-empty dynamic user/image/file display, file/image preview/download, and Data List form runtime behavior remain unproven until focused tests cover them.

## Timeline Dynamic Controls Learning

For Vertical Timeline and Horizontal Timeline learning, use `docs/studies/timeline-controls-dynamic-controls.md`, normalized refs under `docs/studies/normalized/timeline-controls-dynamic-controls/`, and `scripts/inspect-timeline-dynamic-controls.mjs`. `Company Overview (1).yap` export-proves dashboard `timeline-v` and `timeline-h` controls on `Timeline with controls`, both bound to the `Company Overview` Data List and using Dynamic field/user/image/file controls inside item templates.

Timeline controls use `attrs.data.list` for the data source, `attrs.data.title.variable[]` for timeline title/date labels, `attrs.data.sort[]` for ordered display, and `children[]` for the repeated item template. The export uses the same current item binding pattern as Collection/Kanban: Dynamic controls use `attrs.source = "3"` and `attrs["obj-f"]`, while expression tokens use `exprType = "variable_ctx"` with `ctx = "__ctx_coll"`.

Preserve the proof boundary: Vertical/Horizontal Timeline schema and observed Dynamic control bindings are export-proven, and the focused generated runtime package proves import/open/render stability for Vertical and Horizontal Timeline controls with Dynamic field values. Scrolling semantics, horizontal arrow behavior, click/open behavior, non-empty user/image/file display, dynamic file/image preview/download, and any drag/drop/reordering behavior remain unproven until focused runtime tests. Product docs support general usage guidance for vertical chronological feeds/history and horizontal schedules/roadmaps.

Runtime proof: `generate-kanban-collection-timeline-runtime-proof.mjs` creates `/Users/Renger/Downloads/kanban-collection-timeline-runtime-proof.v1.yap` with one synthetic Data List, one dashboard, Kanban, Collection, Vertical Timeline, Horizontal Timeline, and Dynamic field/user/image/file controls using source `3`. The user confirmed the package imports, the dashboard opens, all four controls render, Dynamic field values render, Dynamic user/image/file controls are stable with empty values, and no missing binding/render error appears. Keep non-empty user/image/file preview/download and all interaction behavior unproven until separately exercised.
<!-- kanban-collection-dynamic-controls-learning:end -->

<!-- advanced-controls-learning:start -->
## Advanced Yeeflow Controls Learning

Company Overview (3).yap export-proves advanced Dashboard and Data List custom-form control patterns documented in docs/studies/advanced-controls.md and normalized under docs/studies/normalized/advanced-controls/. Treat this as export-proven and validator-backed only unless a later focused runtime pass proves rendering and interactions.

Planning guidance:

- Use Tab (aktabs / ak-tabs-tab) for multi-tab content grouping when users need related peer views without leaving the page.
- Use Toggle (toggle / toggle-panel) for collapsible multi-section content, FAQ blocks, grouped detail panels, and optional guidance.
- Use Timer for static or dynamic date countdown/deadline indicators such as SLA, due date, campaign, and task timers.
- Use Icon list for quick links, resource shortcuts, and compact navigation lists.
- Use Divider and Spacer for layout structure and visual rhythm between control groups.
- Use Alert for info, success, warning, and error messages where guidance or status communication matters.
- Use Progress bar and Progress circle for numeric progress, completion percentages, KPI capacity, score, and utilization.
- Use Steps bar for phase/status/workflow/approval/onboarding progress; prefer static steps or field-bound single-select/status sources where supported.
- Use QR Code for record/page/form/link sharing and mobile access.
- Use Barcode for encoded record, inventory, ticket, asset, static, or dynamic values.
- Use Embed for iframe/external content such as reports, maps, dashboards, docs, and videos when tenant/security context allows it.
- Use Document embed for attachment/file previews such as contracts, invoices, images, PDFs, Word documents, and PowerPoint decks.

Validation guidance:

- Tab items need valid ids/titles and child control containers.
- Toggle sections need valid ids/titles and child control containers.
- Timer needs a valid static date or dynamic date binding.
- Icon list items should define icon/text/link settings where required.
- Progress bar/circle values must be numeric or resolve to numeric fields/variables.
- Steps bar static steps need valid items; bound sources should resolve to single-select/status fields where applicable.
- QR Code value/URL should be static, dynamic, current-item, current-page, or current-form source; implicit host-current URL behavior remains runtime-sensitive.
- Barcode value must be static or dynamic and barcode type should be supported (CODE128/CODE128A observed).
- Embed code/src/url must be configured and generated-final packages must not contain unsafe placeholder URLs.
- Document embed must bind to attachment/file fields and respect single/multiple settings when configured.
- Generated-final packages should hard-error unresolved required bindings, invalid URLs, incompatible numeric/file/status fields, unsupported barcode types, and unsupported host placement. Historical exports should warn when uncertain.

Proof boundary: Tab and Toggle dashboard usage, Additional-controls dashboard usage, and Company Overview / View page Data List form usage are export-proven only. Approval Form/Public Form support is product-understanding-backed unless separately export-proven. Runtime rendering, link navigation, QR/barcode scan behavior, iframe loading, document preview behavior, and dynamic value changes are not proven in this branch.
<!-- advanced-controls-learning:end -->

<!-- advanced-controls-runtime-proof:start -->
## Advanced Controls Runtime Proof Pattern

Use docs/studies/advanced-controls-runtime-proof.md and generate-advanced-controls-runtime-proof.mjs as the focused generated package pattern for advanced Yeeflow controls. The generated manual-test package is /Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap and is intentionally uncommitted. The user-confirmed runtime result passed for package import, dashboard open, rendering and basic interactions for the included controls, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.

Safe minimal generation pattern:

- Generate one compact dashboard named Advanced Controls Runtime Dashboard for Dashboard-host controls.
- Generate one Data List named Advanced Control Runtime Items when current-item bindings are needed.
- Use a View page for Data List form-host controls that are export-proven only on list forms, especially field-bound Steps bar and Document embed.
- Keep sample data synthetic and leave file-upload fields empty when testing Document embed safe empty state.
- Use static public Yeeflow URLs for QR Code and Embed tests; never use private tenant URLs.
- Use static safe Barcode values such as ACR-PROOF-001 and observed-supported barcode types such as CODE128/CODE128A.

Control-specific safe patterns:

- Tab: aktabs with ak-tabs-tab children, titles, one default tab, and nested content controls.
- Toggle: toggle with toggle-panel children, attrs.title.value, and nested controls.
- Timer: timer with attrs.set.date.value using a safe static future date.
- Icon list: icon_list with attrs.data.links[], safe icons, titles, and public links.
- Divider: line with explicit width, line-width, color token, and spacing.
- Alert: alert with attrs.alert.title and attrs.alert.desc; include info/success/warning/error variants when useful.
- Progress bar: progress with attrs.bar.per.value as a static numeric percentage for the runtime baseline.
- Spacer: gap with explicit attrs.space.
- Progress circle: progress-circle with static attrs.per values and common positioning.
- Steps bar: steps-bar with static steps-options on dashboards; on Data List View pages, bind current-step to a current item radio/status field only when the field resolves.
- QR Code: list-qrcode with attrs.qr-code-link.customUrl.url for static URL proof; implicit current URL modes remain host-sensitive.
- Barcode: barcode with attrs.value.value and attrs.type; prefer CODE128 for generated runtime smoke tests.
- Embed: embed with attrs.code containing a safe iframe to a public URL; iframe load success is not guaranteed until runtime-tested.
- Document embed: document-embed with attrs.doc-source bound to a file-upload field; empty-field rendering is a separate proof from non-empty document preview.

User-confirmed runtime result for the focused package:

- The package imported successfully and Advanced Controls Runtime Dashboard opened.
- Tab switching and Toggle expand/collapse worked.
- Timer, Icon list, Divider, Alert variants, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed, and Document embed rendered in the tested scope.
- Embed rendered safely without breaking the page.
- Document embed rendered a safe empty state.
- No missing binding, render, or action error appeared.

Validation and proof boundaries:

- The local gate should include validate-yap-package, validate-yap-graph, inspect-advanced-controls, inspect-yap-schema-standard, inspect-yap-materialization, inspect-app-creation-rules, inspect-yap-import-readiness, wrapper build/round-trip, git diff --check, and safety scan.
- Zero local validation errors only proves local readiness, not import/open/render behavior.
- Do not claim QR scan behavior, Barcode scan behavior, external iframe content loading, non-empty document preview, dynamic value changes, or Approval Form/Public Form host behavior unless those exact behaviors are tested.
- Keep generated .yap files, decoded payloads, screenshots, and private data out of commits.
<!-- advanced-controls-runtime-proof:end -->
