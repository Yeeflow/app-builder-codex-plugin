# <Application Name> - Functional Specification

Use this template as Stage 1 / Step 1 for every Yeeflow application build. The purpose of this document is to convert the user's request, documents, screenshots, examples, and clarifications into a complete business requirement specification before creating the Yeeflow App Plan.

This document focuses on business requirements and expected application behavior. It should read like a business-analysis document that explains the process, rules, data lifecycle, user roles, decision points, exception cases, dashboard information needs, and operational reporting needs before the Yeeflow App Plan exists. It should not be a package-generation blueprint. Yeeflow resource selection, generation order, field internal names, control implementation shapes, package validation, signing, and runtime proof belong in the App Plan and later steps.

Do not include low-level Yeeflow implementation details in the Functional Specification. Exclude Yeeflow control types, exact resource IDs, ListID/PageID/FormID/LayoutID/ProcKey values, actionTypeCode values, JSON property paths, package JSON fragments, and exact generated IDs. When those details are needed, defer them to the App Plan, Page Function Plan, Blueprint, or resource generation stage.

Primary artifact rule: generate this document as the primary human-readable Markdown file named `functional-specification.md`. Machine-readable JSON may exist only as a companion/projection artifact for validation, traceability, or tests, such as `functional-specification.trace.json`; JSON must not replace this Markdown document. The Markdown file must contain the full rich business logic and dashboard business requirements, not just a link to JSON.

## 1. Specification Status

Document metadata:

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

## 4. Business Context

Goals and non-goals:

- Business problem:
- Target users:
- Operational scope:
- Expected outcome:
- Business goal:
- Business goals:
- Non-goals:
- What the application manages:
- Primary business value:
- Success criteria:
- Out of scope:

## 5. User Roles and Responsibilities

| Role | What They Need To Do | Records They Can See | Actions They Can Perform | Decisions They Own | Dashboards/Pages They Need | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Role> | <Responsibilities> | <Record scope> | <Read/create/edit/approve/assign/close/admin> | <Decisions> | <Dashboard/page needs> | <Notes> |

Rules:

- Describe business roles, not tenant-specific user IDs.
- Do not assume real users, user groups, departments, positions, or emails unless provided and approved.
- Mark unknown role ownership as a clarification question when it affects workflow routing or permissions.

## 6. Business Objects and Data Requirements

List all business objects that the application needs to manage, track, approve, report on, or reference.

| Business Object | Business Purpose | Required Fields | Field Meaning | Field Type Expectation | Lookup/Reference Relationships | Lifecycle/Status Fields | Audit Fields | Reporting/Dashboard Fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Object> | <Purpose> | <Fields> | <Meaning> | <Business-level type expectation> | <Relationships> | <Status/lifecycle fields> | <Created/updated/approved/history fields> | <Metrics/filter/display fields> |

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

## 8. Core Business Process

Describe the main business process from start to finish.

1. <Step 1>
2. <Step 2>
3. <Step 3>

For each process, include:

- Start trigger:
- Submission/intake:
- Review/approval:
- Assignment/fulfillment:
- Status tracking:
- Completion/closure:
- Exception handling:
- Audit/history needs:
- Actor:
- Data created or updated:
- Decision points:
- Status changes:
- Notifications or handoffs:
- Completion outcome:

## 9. Business Rules and Status Lifecycles

| Lifecycle Name | Applies To | Status Values | Initial Status | Final Statuses | Transition Rules |
| --- | --- | --- | --- | --- | --- |
| <Lifecycle> | <Business object/process> | <Statuses> | <Status> | <Statuses> | <Rules> |

| Rule Area | Business Rule | Applies To | Condition | Required Data/Fields | Responsible Role | Exception/Rework Behavior | Reporting Impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| status lifecycle / approval / assignment / SLA / validation / document / notification / escalation / completion / cancellation / permission | <Rule> | <Object/process> | <Condition> | <Fields> | <Role> | <Exception behavior> | <Dashboard/reporting impact> |

Rules:

- Status, priority, condition, approval state, fulfillment state, and lifecycle state should be explicit.
- If status values affect routing, reporting, or permissions, mark them as business-critical.
- Include approval rules, assignment rules, SLA/overdue rules, validation rules, required document/rich data rules, notification rules, escalation rules, completion rules, cancellation/rejection/rework rules, and permission rules when applicable.

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
- Required attachments/documents for submission, review, or completion.
- Completion rules, including what data or evidence is required before closure.

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

## 12. Workflow and Notification Requirements

| Workflow/Notification | Trigger Condition | Business Condition | Actor/Recipient | Action/Result | Timing/SLA | Notification Content Intent | Data Read | Data Updated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Requirement> | <Trigger> | <Condition> | <Actor/recipient> | <Action/result> | <Timing/SLA> | <Intent> | <Data> | <Data> | <Notes> |

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

## 13. Dashboard Page Requirements

Functional Specification must define dashboard requirements at the business level before the App Plan. Do not select Yeeflow control types, IDs, actionTypeCode values, ListID/PageID/FormID values, JSON property paths, layout JSON, or exact generated resources here.

For each Dashboard page:

| Dashboard Name | Primary Users | Business Purpose | Business Questions It Must Answer | Source Business Objects/Data Lists | Mobile Support Requirement | Business Exceptions/Alerts To Highlight |
| --- | --- | --- | --- | --- | --- | --- |
| <Dashboard> | <Roles> | <Purpose> | <Questions> | <Objects/lists by business name> | <Requirement> | <Alerts/exceptions> |

Required summary metrics:

| Dashboard | Metric | Source Object/List | Source Fields | Calculation Logic | Default Scope | Alert/Threshold Logic |
| --- | --- | --- | --- | --- | --- | --- |
| <Dashboard> | <Metric> | <Object/list> | <Fields> | <Business calculation> | <Scope> | <Threshold/alert> |

Required data regions:

| Dashboard | Data Region | Business Purpose | Source Object/List | Display Fields | User Actions Needed | Sorting/Grouping Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| <Dashboard> | <Region> | <Purpose> | <Object/list> | <Fields> | <Actions> | <Sort/group rules> |

Filter requirements:

| Dashboard | Filter | Source Object/List | Source Field | Default Scope | Applies To Regions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Dashboard> | <Filter> | <Object/list> | <Field> | <Default> | <Regions> | <Notes> |

## 14. Reporting and Audit Requirements

| Report/Page/KPI | Business Question | Users | Data Needed | Filters | Actions | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Report/Page/KPI> | <Question> | <Roles> | <Data> | <Filters> | <Actions> | <Notes> |

Include:

- Reports and dashboards.
- KPIs.
- Queues.
- Workbenches.
- Operational tables.
- Status boards.
- Audit/history views.
- Print or export requirements.
- Chart requirements.
- What needs to be auditable.
- What history should be visible.
- What compliance or operational evidence is needed.

## 15. Document and Attachment Requirements

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

## 16. AI, Copilot, and Intelligent Assistance Requirements

| Capability | Purpose | Users | Inputs | Outputs | Human Review | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <AI Agent/Copilot/AI action> | <Purpose> | <Roles> | <Inputs> | <Outputs> | Required/Not required | <Notes> |

If no AI is required, state: No AI Agent or Copilot requirement identified.

## 17. Integration Requirements

| Integration | Purpose | Direction | Data Exchanged | Credential Sensitivity | Required Now? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Integration> | <Purpose> | inbound/outbound/both | <Data> | low/medium/high | Yes/No | <Notes> |

Rules:

- Never include secrets in this document.
- Tenant URLs, API keys, webhook URLs, and private endpoints must be treated as post-import configuration unless explicitly approved for a safe test tenant.

## 18. Permissions and Access Requirements

Permissions and visibility rules:

| Role | Resource/Process | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Role> | <Resource> | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | <Notes> |

## 19. UI and Experience Requirements

Describe the expected user experience without selecting exact Yeeflow controls yet.

- Navigation style:
- Main pages:
- Workbench or dashboard needs:
- Form layout expectations:
- Mobile/tablet expectations:
- Visual style requirements:
- Provided mockups/design references:
- Accessibility/readability concerns:

## 20. Business Clarification Gates

List decisions that materially affect workflow, data persistence, validation, dashboards, routing, approvals, or permissions.

| Decision Key | Question | Options | Recommended Default | Why It Matters | Required Before App Plan? | Approval Status |
| --- | --- | --- | --- | --- | --- | --- |
| <key> | <Question> | <Options> | <Default> | <Business/routing/data/dashboard/generation impact> | Yes/No | unanswered/answered/default-applied-for-planning/user-default-approved-for-generation/deferred/not applicable |

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

## 21. Assumptions

Assumptions, defaults, and deferred decisions:

- Business assumptions:
- Data assumptions:
- Role assumptions:
- Workflow assumptions:
- Reporting assumptions:
- UI assumptions:
- Integration assumptions:
- Defaults applied for planning:
- Deferred business decisions:

## 22. Risks, Constraints, and Unknowns

| Area | Risk/Unknown | Impact | Proposed Handling | Requires User Confirmation |
| --- | --- | --- | --- | --- |
| <Area> | <Risk> | <Impact> | <Handling> | Yes/No |

## 23. Functional Specification Completeness Review

Functional Specification validation checklist:

| Review Item | Status | Notes |
| --- | --- | --- |
| Business context is clear | pass/fail | |
| User roles and responsibilities are identified | pass/fail | |
| Business objects and data requirements are identified | pass/fail | |
| Relationships are identified | pass/fail | |
| Main process is documented | pass/fail | |
| Business process steps, decision points, exceptions, and audit needs are documented | pass/fail | |
| Business rules and status lifecycles are documented | pass/fail | |
| Approval/review needs are documented or explicitly not required | pass/fail | |
| Form/data-entry needs are documented | pass/fail | |
| Workflow/notification needs are documented | pass/fail | |
| Dashboard page content requirements include metrics, calculations, data regions, display fields, filters, sorting/grouping, actions, mobile needs, and alerts | pass/fail | |
| Reporting and audit needs are documented | pass/fail | |
| Document/attachment needs are documented or explicitly not required | pass/fail | |
| AI/integration needs are documented or explicitly not required | pass/fail | |
| Permissions are documented | pass/fail | |
| Business clarification gates are resolved or listed | pass/fail | |
| Assumptions are explicit | pass/fail | |

## 24. Readiness for App Plan

- Ready for App Plan: Yes/No
- Blocking clarification questions:
- Defaults approved by user:
- Requirement document path:
- App Plan should be created after:

Before moving to the Yeeflow App Plan, `validate-functional-specification.mjs` and `validate-business-clarification-gate.mjs` should pass or the unresolved business decisions must be explicitly treated as blockers.
