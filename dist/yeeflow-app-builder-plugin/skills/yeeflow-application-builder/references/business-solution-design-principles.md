# Business Solution Design Principles

Use these principles before turning requirements into Yeeflow resources.

## Start With The Business Operation

Identify:

- business goal and expected outcome
- actors, roles, reviewers, approvers, and administrators
- trigger event that starts the process
- lifecycle/status model from draft to completion
- approval/review points
- exceptions, rework, rejection, escalation, cancellation, and closure paths
- master/reference data used repeatedly
- line items, sublists, child records, and transactional details
- reporting, dashboards, and operational visibility needs
- automation opportunities that reduce manual work

Design around business operations, not only form fields.

## Decide What Belongs Where

Use data lists for persistent business records, master data, reference tables, and reporting sources.

Use approval forms for request submission, review decisions, task-specific comments, controlled workflow steps, and workflow-visible data.

Use sublists/list controls for line items that belong to a parent request. Use summary binding when totals or counts drive workflow, validation, or persistence.

Use dashboards only when the requirement needs operational overview, queues, status counts, or management insight. Avoid dashboards in v1 when they are not needed for the core process.

Use temp variables for frontend/runtime UI state only. Do not rely on temp variables for backend persistence unless values are copied into workflow/form variables before submit.

Use ContentList to persist readable business values. Avoid persisting raw lookup IDs when users expect display text.

## Scope V1 Carefully

Default v1 should prove:

- core record structure
- main request/approval flow
- required fields and essential validations
- essential calculations
- ContentList persistence
- runtime import/open/submit/approve path

Defer:

- complex dashboards
- reports
- document generation
- integrations
- external APIs
- complex automation
- advanced runtime-sensitive controls
- optional features that do not affect the first working process

Prefer a smaller, high-quality, runtime-proven v1 over a broad package that is hard to validate.

## Consultant-Style Questions To Answer In The Plan

- What business problem does this app solve?
- Who submits, reviews, approves, processes, and audits the work?
- What data must be captured at request time?
- What data is added during review, fulfillment, or closure?
- What must be persisted for reporting and audit?
- What should stay as temporary UI state?
- Which statuses are meaningful to the business?
- Which decisions change the workflow route?
- Which calculations should be automatic and readonly?
- Which reference data should be a packaged list, lookup, or deferred integration?
- What does success look like in the runtime test?

## Key Design Decisions To Make Explicit

Requester/applicant identity:

- Is the requester always the current login user, or can a user submit for another employee?
- If proxy submission is allowed, the applicant picker can remain editable, but changing it must rerun applicant profile snapshot and dependent quota/policy logic.
- Current User may default the applicant on a new request. Applicant business logic after that should use the applicant variable or snapshot values.

Profile snapshots:

- Identify profile fields that must be snapshotted, displayed readonly, and persisted.
- Missing profile data should route to HR verification or another business fallback, not silently use the current task viewer.

Quota and eligibility:

- Decide whether quota cycles are calendar year, employee anniversary year, or custom.
- Decide when quota is occupied and when it is released.
- Use numeric cycle fields when usage records must be matched by employee-anniversary or tenure cycle.
- Query usage by applicant identity, cycle, and active/occupied status.

Multiple product/item selection:

- If the business allows multiple products/items, use a sublist/listref.
- Use lookup/autofill for product data, row subtotal calculation, summary-bound total, and readable summary persistence.

Form actions:

- Use page load, field change, and submit actions for dependent logic.
- Combine independent Set variable assignments with multi-value Set variables.
- Keep dependent calculations in ordered steps.

## Clarification Questions Before Generation

During planning, separate questions into two categories:

Business-critical clarification questions:

- change workflow routes
- change approval responsibility
- change quota/policy calculations
- change status lifecycle
- change data ownership
- change pricing or amount calculations
- change required attachments/documents
- change persistence timing
- change compliance/audit handling
- change dashboard inclusion in v1 scope
- change integration responsibility
- change role permissions
- change what happens on approval, rejection, or resubmission

These must be asked directly in the Codex chat and must pause generation until answered or until the user explicitly approves default assumptions.

Technical assumptions:

- token shape availability
- tenant data completeness
- exact widget binding shape
- form action runtime behavior
- validator/runtime compatibility

These can be documented, tested, and handled with fallback during generation/runtime validation unless they affect business correctness.
