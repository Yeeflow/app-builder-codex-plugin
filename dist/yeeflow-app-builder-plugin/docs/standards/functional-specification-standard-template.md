# <Application Name> - Functional Specification

Use this template as Stage 1 / Step 1 for every Yeeflow application build. The purpose of this document is to convert the user's request, documents, screenshots, examples, and clarifications into a complete business requirement specification before creating the Yeeflow App Plan.

This document focuses on business requirements and expected application behavior. It should not be a package-generation blueprint. Yeeflow resource selection, generation order, field internal names, control implementation shapes, package validation, signing, and runtime proof belong in the App Plan and later steps.

## 1. Specification Status

- Application name:
- Request source:
- Source materials:
- Requirement detail level: brief / moderate / detailed / document-backed / screenshot-backed
- Prepared by:
- Prepared with plugin:
- Current status: draft / pending clarification / ready for review / approved
- Review status:
- Known blockers:

## 2. Source Input Summary

Summarize what the user provided.

- Direct user request:
- Business documents:
- Screenshots or mockups:
- Existing app/package/export references:
- Sample data:
- User corrections or constraints:
- Explicit exclusions:

## 3. Requirement Interpretation Method

State how the requirements were interpreted.

- If the user request is brief, list the inferred business scope and assumptions.
- If the user provided detailed requirements, reorganize them into this standard format without losing details.
- If the user provided documents or screenshots, treat them as reference sources and restate the understood requirements here.
- If anything is unclear, list it in Business Clarification Questions.

## 4. Business Purpose

- Business problem:
- Business goal:
- What the application manages:
- Primary business value:
- Success criteria:
- Out of scope:

## 5. Target Users and Business Roles

| Role | Business Purpose | Main Responsibilities | Expected Access | Notes |
| --- | --- | --- | --- | --- |
| <Role> | <Purpose> | <Responsibilities> | <Read/create/edit/approve/admin> | <Notes> |

Rules:

- Describe business roles, not tenant-specific user IDs.
- Do not assume real users, user groups, departments, positions, or emails unless provided and approved.
- Mark unknown role ownership as a clarification question when it affects workflow routing or permissions.

## 6. Business Objects and Data Concepts

List all business objects that the application needs to manage, track, approve, report on, or reference.

| Business Object | Description | Master/Transaction/Reference | Key Fields From Requirement | Related Objects | Notes |
| --- | --- | --- | --- | --- | --- |
| <Object> | <Description> | <Master/Transaction/Reference> | <Fields> | <Relationships> | <Notes> |

Examples:

- Project and Task
- Employee and Travel Request
- Asset, Asset Request, Assignment, Maintenance Ticket
- Vendor, Onboarding Request, Risk Review

## 7. Business Relationships and Dependency Rules

Describe how business objects relate to each other.

| Parent Object | Child/Related Object | Relationship Type | Business Rule | Required for Creation? | Notes |
| --- | --- | --- | --- | --- | --- |
| <Parent> | <Child> | one-to-many / lookup / reference / line items | <Rule> | Yes/No | <Notes> |

Rules:

- Identify parent objects before child objects.
- Identify lookup-like relationships early.
- Identify line-item/sublist needs early.
- Identify whether relationship data must persist as child rows, form sublist data, or separate transaction records.

## 8. Business Process Overview

Describe the main business process from start to finish.

1. <Step 1>
2. <Step 2>
3. <Step 3>

For each process, include:

- Trigger:
- Actor:
- Data created or updated:
- Decision points:
- Status changes:
- Notifications or handoffs:
- Completion outcome:

## 9. Status Lifecycles

| Lifecycle Name | Applies To | Status Values | Initial Status | Final Statuses | Transition Rules |
| --- | --- | --- | --- | --- | --- |
| <Lifecycle> | <Business object/process> | <Statuses> | <Status> | <Statuses> | <Rules> |

Rules:

- Status, priority, condition, approval state, fulfillment state, and lifecycle state should be explicit.
- If status values affect routing, reporting, or permissions, mark them as business-critical.

## 10. Approval and Review Requirements

| Approval/Review Process | Trigger | Submitter | Reviewers/Approvers | Decisions | Required Task Work | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Process> | <Trigger> | <Role> | <Roles> | approve/reject/rework/etc. | <Tasks> | <Notes> |

Include:

- Whether formal approval is required.
- Who approves or reviews.
- Whether assignment/task work is needed.
- Whether multiple task forms are needed.
- Whether approval routing depends on amount, category, department, location, priority, requester, or other fields.
- What happens on approval, rejection, cancellation, return, resubmission, or exception.

## 11. Data Entry and Form Requirements

Describe each user-facing form from a business perspective.

| Form Purpose | Used By | When Used | Information Captured | Read-only Context | Validation Needs | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Form> | <Role> | <Process step> | <Fields/concepts> | <Context> | <Rules> | <Notes> |

For each form, consider:

- Required fields.
- Read-only fields.
- Default values.
- Dynamic display rules.
- Lookup/reference data.
- Repeating line items.
- Attachments.
- Calculations or summaries.
- Business validation.
- Submission guards.

## 12. Workflow, Automation, and Action Requirements

| Requirement | Trigger | Actor/System | Expected Action | Data Read | Data Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Requirement> | <Trigger> | <Actor/System> | <Action> | <Data> | <Data> | <Notes> |

Include:

- Page load behavior.
- Form submission behavior.
- Field change behavior.
- Approval workflow behavior.
- Data-list workflow behavior.
- Scheduled workflow behavior.
- Notifications.
- AI-assisted behavior.
- External integration behavior.

## 13. Reporting, Dashboard, and Analytics Requirements

| Report/Page/KPI | Business Question | Users | Data Needed | Filters | Actions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Report/Page/KPI> | <Question> | <Roles> | <Data> | <Filters> | <Actions> | <Notes> |

Include:

- KPIs.
- Queues.
- Workbenches.
- Operational tables.
- Status boards.
- Audit/history views.
- Print or export requirements.
- Chart requirements.

## 14. Document and Attachment Requirements

| Document/Attachment | Used By | Required When | Storage Need | Preview/Print Need | Notes |
| --- | --- | --- | --- | --- | --- |
| <Document> | <Role> | <Condition> | <Need> | <Need> | <Notes> |

Include:

- Attachments on forms.
- Document libraries.
- Generated documents.
- Print pages.
- QR/barcode output.
- File retention or audit expectations.

## 15. AI, Copilot, and Intelligent Assistance Requirements

| Capability | Purpose | Users | Inputs | Outputs | Human Review | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <AI Agent/Copilot/AI action> | <Purpose> | <Roles> | <Inputs> | <Outputs> | Required/Not required | <Notes> |

If no AI is required, state: No AI Agent or Copilot requirement identified.

## 16. Integration Requirements

| Integration | Purpose | Direction | Data Exchanged | Credential Sensitivity | Required Now? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Integration> | <Purpose> | inbound/outbound/both | <Data> | low/medium/high | Yes/No | <Notes> |

Rules:

- Never include secrets in this document.
- Tenant URLs, API keys, webhook URLs, and private endpoints must be treated as post-import configuration unless explicitly approved for a safe test tenant.

## 17. Permissions and Access Requirements

| Role | Resource/Process | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Role> | <Resource> | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | <Notes> |

## 18. UI and Experience Requirements

Describe the expected user experience without selecting exact Yeeflow controls yet.

- Navigation style:
- Main pages:
- Workbench or dashboard needs:
- Form layout expectations:
- Mobile/tablet expectations:
- Visual style requirements:
- Provided mockups/design references:
- Accessibility/readability concerns:

### Business Page Requirements

Capture user-facing page needs from the business point of view. This section prepares the Page Function Plan, but must not select Yeeflow controls, dashboard template IDs, Dashboard golden reference IDs, internal property paths, package structures, or implementation-only details.

| Page / Surface | Needed By Roles | Business Task Solved | Information Users Need To See | Operations / Actions Users Need | Filtering / Grouping / Sorting / Priority Needs | Mobile Required | Visibility / Access Requirements | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Dashboard, approval submission form, task form, print page, list form, document-library form, or workbench> | <Roles> | <Business task> | <Information> | <Actions> | <Filtering/grouping/sorting/priority> | Yes/No/Unknown | <Role-specific access> | <Notes> |

Rules:

- Describe which pages each user role needs and what business task each page solves.
- Describe what information the user needs to see and which operations the user needs to perform.
- Identify data that must be filtered, grouped, sorted, prioritized, searched, or summarized.
- State whether mobile support is required and which content/actions are highest priority on mobile.
- State role-specific visibility or access needs when a page should be hidden, read-only, or limited.
- Keep this section business-oriented. Do not over-specify exact Yeeflow controls, Dashboard template or golden-reference IDs, layout JSON, package metadata, IDs, or property paths here.
- Dashboard pattern, golden-reference, section-template, control-by-region, property, and runtime-proof-boundary decisions do not belong in the Functional Specification.
- Approval submission/task/print form implementation detail, Data list/Document library form controls, related regions, field editability matrices, and generated action metadata do not belong in the Functional Specification.
- The Functional Specification describes which roles need which pages, what business task each page solves, what information/actions/filtering/grouping/sorting/mobile/access needs exist, and which page needs must later trace into App Plan resources and business/page-function Page Function Plan entries.
- The Page Function Plan refines these business page needs into page-level business questions, data source and field usage, filters, metrics, regions, action intent, and mobile behavior. It must not prescribe low-level Yeeflow controls, property paths, arbitrary custom controls, CSS, or generated resource JSON.

## 19. Business Decision Gates

List decisions that materially affect workflow, data persistence, validation, dashboards, routing, approvals, or permissions.

| Key | Question | Options | Recommended Default | Required Before App Plan? | Status | Why This Matters |
| --- | --- | --- | --- | --- | --- | --- |
| <key> | <Question> | <Options> | <Default> | Yes/No | unanswered/answered/default-applied-for-planning/user-default-approved-for-generation/deferred/not applicable | <Reason, fallback, and proof/generation impact when deferred> |

If unresolved business-critical decisions exist, stop before final App Plan unless the user approves defaults.

Executable gate:

```bash
node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md>
```

The Business Clarification Gate has two modes. Planning mode allows `default-applied-for-planning` so the Functional Specification and App Plan can be created from explicit assumptions. Generation mode blocks `default-applied-for-planning` and requires `answered`, `not applicable`, `user-default-approved-for-generation`, or `deferred` with reason, fallback, and proof/generation impact. It fails when decision gates remain unanswered, pending, TBD, open, require clarification, or when generation is paused until answers are provided. It proves clarification-gate document readiness only, not that the business answer is correct.

Final planning-output rule:

- When any business decision gate remains unresolved, the assistant's final planning response must list every unresolved gate by `Key` and `Question`.
- The response must include the recommended default for each unresolved gate.
- If the response offers an "approve all recommended defaults" option, it must name every gate covered by that option, for example: `Approve all recommended defaults for: approvalRoute, financeThreshold, reminderOffsets, requiredDocuments, permissionModel`.
- The response must include: `No package generation will proceed until the business gates are answered or explicitly user-default-approved-for-generation.`
- Do not shorten the visible clarification list in a way that hides unresolved gates.

## 20. Assumptions

- Business assumptions:
- Data assumptions:
- Role assumptions:
- Workflow assumptions:
- Reporting assumptions:
- UI assumptions:
- Integration assumptions:

## 21. Risks, Constraints, and Unknowns

| Area | Risk/Unknown | Impact | Proposed Handling | Requires User Confirmation |
| --- | --- | --- | --- | --- |
| <Area> | <Risk> | <Impact> | <Handling> | Yes/No |

## 22. Functional Specification Completeness Review

| Review Item | Status | Notes |
| --- | --- | --- |
| Business purpose is clear | pass/fail | |
| Target roles are identified | pass/fail | |
| Business objects are identified | pass/fail | |
| Relationships are identified | pass/fail | |
| Main process is documented | pass/fail | |
| Status lifecycles are documented | pass/fail | |
| Approval/review needs are documented or explicitly not required | pass/fail | |
| Form/data-entry needs are documented | pass/fail | |
| Workflow/action needs are documented | pass/fail | |
| Dashboard/reporting needs are documented | pass/fail | |
| Document/attachment needs are documented or explicitly not required | pass/fail | |
| AI/integration needs are documented or explicitly not required | pass/fail | |
| Permissions are documented | pass/fail | |
| Business decision gates are resolved or listed | pass/fail | |
| Assumptions are explicit | pass/fail | |

## 23. Readiness for App Plan

- Ready for App Plan: Yes/No
- Blocking clarification questions:
- Defaults approved by user:
- Requirement document path:
- App Plan should be created after:

Before moving to the Yeeflow App Plan, `validate-functional-specification.mjs` and `validate-business-clarification-gate.mjs` should pass or the unresolved business decisions must be explicitly treated as blockers.
