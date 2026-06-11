# Vendor Onboarding & Compliance Management UI Implementation Spec

## Design Reference

- Source: five thread-generated UI mockups for Vendor Onboarding & Compliance Management.
- Mockup pages:
  - Vendor Management Dashboard
  - Vendor Detail View Page
  - New Vendor Request Form
  - Compliance Review Workspace
  - Vendor Print Page
- Scope: convert the visual design intent into a Yeeflow-native implementation plan. Do not generate the `.yap` or `.yapk` package from this spec until the spec is reviewed and approved.
- Privacy note: the mockup image files are not committed. This spec uses only tenant-neutral placeholders and does not include API keys, tenant IDs, private URLs, raw package payloads, screenshots, decoded `Resource` or `Sign` values, or generated runtime packages.

## Application Overview

### Business Goal

Vendor Onboarding & Compliance Management helps procurement, legal, finance, and compliance teams manage the full vendor lifecycle from request intake through document collection, risk review, approval, contract setup, activation, renewal tracking, and ongoing compliance monitoring.

### Target Users

- Requester / Business Owner: submits new vendor requests and tracks onboarding progress.
- Procurement Manager: reviews vendor details, owns onboarding coordination, and manages operational follow-up.
- Compliance Officer: reviews risk level, certifications, insurance, sanctions results, and required compliance actions.
- Legal Reviewer: reviews contract documents, legal terms, and contract status.
- Finance Reviewer: reviews tax details, bank/payment information, payment terms, budget category, and spend estimate.
- Vendor Management Admin: configures and monitors vendor records, documents, task queues, renewals, and status dashboards.

### Core Process

1. A requester submits a new vendor onboarding request.
2. Procurement reviews vendor profile details and document completeness.
3. Compliance reviews risk level, insurance, certifications, sanctions screening, and required actions.
4. Legal reviews contract documents and terms.
5. Finance reviews payment terms, tax documents, bank information, budget category, and annual spend estimate.
6. Once all required reviews pass, the vendor becomes active.
7. The application tracks renewal dates, expiring documents, open tasks, recent activity, and compliance risk.

### Implementation Scope

Build a full Yeeflow application from this spec, not a simple MVP, unless the user explicitly requests a smaller proof package. The first generated package should include the planned data lists, dashboard, detail view, request form, compliance workspace, print page, actions, workflows, and validation gates described below.

No live API call is required to generate the package. If runtime proof is requested later, use tenant-neutral configuration guidance and local `.env.local` values without committing credentials.

## Data Model

### Vendors

Purpose: master vendor record and primary source for dashboard, detail view, status board, and print page.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Vendor Name | Text | Required primary display field. |
| Vendor Type | Choice | Supplier, Contractor, Consultant, Technology, Professional Services, Logistics, Other. |
| Country / Region | Choice or Text | Used for compliance and sanctions context. |
| Primary Contact | Text | Contact person name. |
| Email | Email/Text | Contact email. |
| Phone | Phone/Text | Contact phone. |
| Risk Level | Choice | Low, Medium, High, Critical. Drives badges, Kanban grouping, and alerts. |
| Onboarding Status | Choice | Request Submitted, Procurement Review, Compliance Review, Legal Review, Finance Review, Approved, Active, Rejected, On Hold. |
| Compliance Status | Choice | Not Started, In Review, Action Required, Approved, Expired, Blocked. |
| Contract Status | Choice | Not Started, Drafting, Legal Review, Signed, Expiring, Renewed, Not Required. |
| Payment Terms | Choice/Text | Net 15, Net 30, Net 45, Net 60, Prepaid, Milestone, Other. |
| Annual Spend Estimate | Currency/Decimal | Used for risk review and dashboard summary. |
| Renewal Date | Date | Used for renewal and expiring-document monitoring. |
| Owner | User | Vendor owner or procurement manager. |
| Created Date | Datetime/System | Used for sorting and timelines. |
| Last Review Date | Date | Used for compliance freshness. |
| Onboarding Completion % | Number/Calculated | Used for progress bar/circle. May be calculated or maintained by workflow. |
| Budget Category | Choice/Text | Needed by finance review. |
| Tax Review Status | Choice | Pending, Complete, Missing Info, Not Required. |
| Bank Info Status | Choice | Pending, Verified, Rejected, Not Required. |
| Vendor Code | Text | Optional printable barcode value. |

Relationships:

- One Vendor has many Vendor Documents.
- One Vendor has many Compliance Reviews.
- One Vendor has many Vendor Tasks.
- One Vendor has many Vendor Activity / History rows.

Status fields:

- Onboarding Status is the main workflow stage.
- Risk Level and Compliance Status drive urgent alerts and compliance work queues.
- Contract Status drives legal follow-up and renewal tracking.

Summary fields:

- Onboarding Completion % should reflect completed stages or completed required tasks.
- Document Completeness % may be derived from required document rows.
- Open Task Count may be computed or displayed through related task filters.

### Vendor Documents

Purpose: store required and optional vendor onboarding documents, review state, and expiry tracking.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Vendor | Lookup to Vendors | Required relationship. |
| Document Type | Choice | W-9/Tax Form, Insurance Certificate, Business Registration, Contract, NDA, Compliance Certificate, Bank Letter, Other. |
| File Attachment | File/Attachment | Required when document row is submitted. |
| Expiry Date | Date | Used for Expiring Documents KPI and alerts. |
| Review Status | Choice | Missing, Submitted, In Review, Approved, Rejected, Expired. |
| Reviewer | User | Reviewer responsible for the document. |
| Notes | Multiline Text | Review comments. |
| Required | Yes/No | Drives document checklist. |
| Uploaded Date | Datetime/System | Timeline and sorting. |

Relationships:

- Vendor Documents lookup Vendor.
- Detail View Documents tab and Vendor Print Page display document rows.

Status fields:

- Review Status drives missing/expired document alerts.
- Expiry Date drives renewal and compliance reminders.

### Compliance Reviews

Purpose: capture compliance checks, risk score, findings, required actions, and review decision.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Vendor | Lookup to Vendors | Required relationship. |
| Review Type | Choice | Sanctions, Insurance, Certification, Data Privacy, Financial Risk, ESG, Security, General. |
| Risk Score | Number | 0-100 score for Progress circle. |
| Findings | Multiline Text | Review findings. |
| Required Actions | Multiline Text | Actions needed before approval. |
| Review Status | Choice | Not Started, In Review, Action Required, Approved, Rejected, Waived. |
| Reviewer | User | Compliance reviewer. |
| Review Date | Date | Review completion or latest update. |
| Severity | Choice | Info, Low, Medium, High, Critical. |

Relationships:

- Compliance Reviews lookup Vendor.
- Compliance Workspace and Vendor Detail Compliance tab display these records.

Status fields:

- Review Status and Severity drive alerts and work queues.

### Vendor Tasks

Purpose: operational work items across procurement, compliance, legal, finance, and vendor management.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Vendor | Lookup to Vendors | Required relationship. |
| Task Name | Text | Required primary display field. |
| Task Type | Choice | Procurement, Compliance, Legal, Finance, Document, Renewal, Follow-up. |
| Assigned To | User | Task owner. |
| Due Date | Date | Used for overdue alerts and sorting. |
| Status | Choice | Not Started, In Progress, Blocked, Complete, Cancelled. |
| Priority | Choice | Low, Medium, High, Urgent. |
| Notes | Multiline Text | Task detail and handoff notes. |
| Completed Date | Date | Optional completion timestamp. |

Relationships:

- Vendor Tasks lookup Vendor.
- Tasks appear in Detail View, Dashboard activity, and Compliance Workspace queue.

Status fields:

- Status and Priority drive task card badges and bulk actions.

### Vendor Activity / History

Purpose: timeline feed for status changes, reviews, document events, approvals, and system notes.

Fields:

| Field | Type | Notes |
| --- | --- | --- |
| Vendor | Lookup to Vendors | Required relationship. |
| Activity Title | Text | Timeline title. |
| Activity Type | Choice | Request, Status Change, Document, Compliance Review, Legal Review, Finance Review, Approval, Renewal, Note. |
| Activity Date | Datetime | Timeline ordering. |
| Actor | User/Text | User or system actor. |
| Description | Multiline Text | Timeline body. |
| Related Record Type | Text | Optional reference label. |
| Related Record ID | Text | Optional reference only; avoid tenant/private IDs in generated seed data. |

Relationships:

- Vendor Activity / History lookup Vendor.
- Timeline controls on dashboard, detail page, and print page read from this list.

Status fields:

- Activity Type supports timeline icons and grouping.

## Page List

- Vendor Management Dashboard: manager-facing overview and operational command center.
- Vendor Detail View Page: Data List custom View form for a complete 360-degree vendor record.
- New Vendor Request Form: Data List custom New/Edit form for request intake and document checklist.
- Compliance Review Workspace: dashboard for compliance officers to review risk, missing documents, and bulk work queues.
- Vendor Print Page: Data List custom Print Page for audit, internal review, and printable vendor summary.

## Page-by-Page UI Implementation

### 1. Vendor Management Dashboard

Purpose: give managers a high-level and operational view of all onboarding and compliance work.

User goal: quickly see workload, risks, expiring documents, vendor status distribution, recent activity, and records needing action.

Layout structure:

- Dashboard page with an outer Container using safe page padding: 32px desktop, 24px tablet, 16px mobile where responsive settings are available.
- Header row:
  - left: page title, subtitle, optional date/filter summary.
  - right: primary quick action button "New Vendor Request" and secondary action "View Compliance Queue".
- KPI grid with four cards in a 4-column desktop grid, 2-column tablet grid, 1-column mobile stack.
- Mid-level summary row:
  - left card: Progress circle for onboarding completion.
  - right card: Alert for urgent compliance risks and expiring documents.
- Main operational row:
  - Kanban board grouped by Onboarding Status.
  - Quick links Icon list in a narrow side column or below Kanban on smaller screens.
- Records row:
  - Data table with meaningful vendor columns.
- Activity row:
  - Vertical Timeline or Collection for recent vendor activity.

Yeeflow controls per section:

- Outer layout: Container, Grid, Divider.
- Header: Text, Button controls.
- KPI cards: Container/Grid, Text, Dynamic field or calculated summary display where supported.
- Onboarding completion: Progress circle bound to aggregated or representative completion value.
- Urgent risks: Alert control.
- Status board: Kanban bound to Vendors grouped by Onboarding Status.
- Vendor list: Data table bound to Vendors.
- Quick links: Icon list.
- Recent activity: Vertical Timeline bound to Vendor Activity / History, or Collection if timeline binding is not available in the target host.

Control rationale:

- KPI cards give the executive summary first.
- Progress circle makes completion visible without scanning rows.
- Alert keeps urgent risk above the fold.
- Kanban supports operational stage management.
- Data table gives an administrative record view with sortable columns.
- Icon list gives fast navigation to common workflows.
- Timeline gives recent context without opening each vendor.

Data bindings:

- Vendors for KPI cards, Kanban, and Data table.
- Vendor Documents for Expiring Documents KPI and alert logic.
- Compliance Reviews for High Risk Vendors and urgent compliance alert logic.
- Vendor Activity / History for timeline.

Fields displayed:

- KPI cards:
  - Total Vendors: count of Vendors.
  - Pending Onboarding: count where Onboarding Status is not Approved or Active.
  - High Risk Vendors: count where Risk Level is High or Critical.
  - Expiring Documents: count where Vendor Documents Expiry Date is within the configured threshold or Review Status is Expired.
- Progress circle:
  - Overall onboarding completion average or a percentage calculated from vendors by approved/active statuses.
- Alert:
  - Vendor Name, Risk Level, Compliance Status, next required action, due/expiry date when available.

Data table columns:

- Vendor Name
- Vendor Type
- Country / Region
- Risk Level
- Onboarding Status
- Compliance Status
- Contract Status
- Owner
- Renewal Date
- Annual Spend Estimate

Kanban item template fields:

- Vendor Name as card title.
- Risk Level badge.
- Compliance Status badge.
- Owner with Dynamic user.
- Renewal Date or Last Review Date.
- Open task or required action summary if available.
- Action buttons: View, Assign Task, Mark Review Started, Move Status where safe.

Timeline item template fields:

- Activity Date.
- Activity Title.
- Activity Type.
- Actor.
- Description.
- Related Vendor.

Actions and buttons:

- New Vendor Request: opens Vendors New form.
- View Compliance Queue: navigates to Compliance Review Workspace.
- View Vendor: opens Vendor Detail View Page.
- Assign Task: opens task creation form or collection action.
- Mark Review Started: updates status only when action binding can be safely resolved.

Workflow needs:

- Optional data-list workflow on new vendor request to create required Vendor Document rows and default Vendor Tasks.
- Optional scheduled workflow for expiring documents and renewal reminders.
- Optional status-change workflow to write Vendor Activity / History rows.

Style settings:

- Use white/neutral dashboard background.
- Cards use 8px border radius, subtle border/shadow, 20px to 24px internal padding.
- Use blue/teal accents for primary actions and active progress.
- Use status colors:
  - Low/Approved: green.
  - Medium/In Review: blue or amber.
  - High/Action Required: orange.
  - Critical/Blocked/Expired: red.
- Keep grid gutters at 16px to 24px.

Custom CSS needs:

- Scoped dashboard CSS may be used for KPI card polish, responsive grid gaps, Kanban card spacing, status badges, and timeline spacing.
- Do not use CSS to hide unconfigured controls.

Custom code needs:

- None required for the default dashboard. Use Custom code only if later requirements need advanced cross-list rollups that standard Yeeflow summary controls cannot express.

Validation checks:

- Dashboard has an outer padded Container.
- All KPI cards display meaningful values or safe placeholder text.
- Kanban is bound to Vendors and grouped by Onboarding Status.
- Kanban template includes Vendor Name plus at least Risk Level, Compliance Status, Owner, and date/status context.
- Data table has the configured columns listed above; zero-column table is a generated-final error.
- Timeline template includes title/date/actor/type fields.
- Quick action buttons resolve to valid pages/forms/actions.

### 2. Vendor Detail View Page

Purpose: show a complete 360-degree view of one vendor from a Data List custom View form.

User goal: review vendor profile, status, documents, compliance findings, tasks, and history without jumping between unrelated screens.

Layout structure:

- Data List custom View form for Vendors.
- Outer Container with safe horizontal padding: 32px desktop, 24px tablet, 16px mobile.
- Top header card:
  - Vendor Name.
  - Risk Level badge.
  - Onboarding Status.
  - Compliance Status.
  - Owner.
  - Action buttons: Edit Vendor, Add Document, Add Task, Start Review, Print Summary.
- Steps bar under header:
  - Request Submitted -> Procurement Review -> Compliance Review -> Legal Review -> Finance Review -> Approved.
- Tabs:
  - Overview
  - Documents
  - Compliance
  - Tasks
  - History
- Each tab uses card/section containers with clear spacing.

Yeeflow controls per section:

- Host: Data List custom View form.
- Layout: Container, Grid, Tabs, Divider.
- Header: Text, Dynamic field, Dynamic user, Button controls, status badge styling.
- Progress: Steps bar, Progress bar, Progress circle.
- Alerts: Alert.
- Data display: Dynamic field, Dynamic user, Dynamic file.
- Related rows: Data table or Collection bound to related lists.
- Document preview: Document embed.
- Timeline: Vertical Timeline.

Control rationale:

- Detail header gives the key decision context immediately.
- Steps bar makes process stage visible across roles.
- Tabs reduce clutter while keeping all vendor context in one page.
- Document embed supports review without downloading or leaving the page.
- Collection cards make tasks actionable.
- Timeline preserves audit context.

Data bindings:

- Current Vendors record.
- Vendor Documents filtered by current Vendor.
- Compliance Reviews filtered by current Vendor.
- Vendor Tasks filtered by current Vendor.
- Vendor Activity / History filtered by current Vendor.

Overview tab:

- Vendor profile fields:
  - Vendor Name
  - Vendor Type
  - Country / Region
  - Primary Contact
  - Email
  - Phone
  - Owner
  - Created Date
  - Last Review Date
- Contract/payment summary:
  - Contract Status
  - Payment Terms
  - Annual Spend Estimate
  - Budget Category
  - Tax Review Status
  - Bank Info Status
  - Renewal Date
- Progress:
  - Progress bar bound to Onboarding Completion %.

Documents tab:

- Data table or Collection bound to Vendor Documents.
- Recommended columns:
  - Document Type
  - Review Status
  - Expiry Date
  - Reviewer
  - Uploaded Date
  - Notes
- Document embed area for selected or primary attachment.
- Actions:
  - Upload/Add Document
  - Mark Reviewed
  - Reject/Request Update
  - Open Attachment

Compliance tab:

- Compliance review cards using Collection.
- Risk score Progress circle.
- Alert for missing/expired documents or critical findings.
- Fields:
  - Review Type
  - Risk Score
  - Severity
  - Review Status
  - Findings
  - Required Actions
  - Reviewer
  - Review Date

Tasks tab:

- Collection cards bound to Vendor Tasks filtered by current Vendor and open statuses.
- Card fields:
  - Task Name
  - Task Type
  - Assigned To
  - Due Date
  - Status
  - Priority
  - Notes
- Actions:
  - Mark Complete
  - Edit
  - Delete or Cancel
  - Add Task

History tab:

- Vertical Timeline bound to Vendor Activity / History.
- Timeline fields:
  - Activity Title
  - Activity Type
  - Activity Date
  - Actor
  - Description

Workflow needs:

- Actions that change status should write Vendor Activity / History rows.
- Add Document/Add Task actions should preserve current Vendor lookup binding.
- Mark Complete should update task status and optionally activity.
- Start Review should create or open Compliance Review rows.

Style settings:

- Header card with high contrast title and small status chips.
- Tabs should be visually dense but clear.
- Use 16px to 24px section spacing.
- Keep two-column grids for profile/summary on desktop and one-column stack on mobile.
- Document embed should have stable height and border.

Custom CSS needs:

- Scoped card and status badge CSS for header, compliance cards, and task cards.
- Optional CSS for sticky tab header only if Yeeflow host supports it safely.

Custom code needs:

- None required for the default detail page. Use Custom code only if the selected-document preview requires behavior that standard Document embed plus table/collection selection cannot provide.

Validation checks:

- View form has safe outer padding.
- Header card contains Vendor Name, Risk Level, status, Owner, and actions.
- Steps bar has all six planned stages.
- Tabs exist and each planned tab has content.
- Documents tab uses configured columns and Document embed.
- Compliance tab includes risk score, review cards, and missing/expired alert.
- Tasks tab Collection template has meaningful fields and valid actions.
- History timeline has date/title/actor/type fields.
- All related-list filters resolve to current Vendor.

### 3. New Vendor Request Form

Purpose: allow a requester to submit a complete vendor onboarding request.

User goal: enter vendor details, business justification, payment/contract information, and required document checklist in one polished form.

Layout structure:

- Data List custom New/Edit form for Vendors, or Approval Form if the future workflow requires formal approval task routing.
- Outer Container with safe horizontal padding: 32px desktop, 24px tablet, 16px mobile.
- Intro/header section:
  - form title
  - short instruction text
  - Alert for required compliance documents.
- Section cards:
  - Vendor Information
  - Contact Information
  - Business Justification
  - Payment & Contract Information
  - Required Documents
- Optional details grouped with Toggle controls.
- Footer action bar with Save Draft and Submit.

Yeeflow controls per section:

- Host: Data List custom New/Edit form or Approval Form.
- Layout: Container, Grid, Toggle, Divider.
- Inputs: text/date/choice/currency/user/file fields.
- Required document checklist: Dynamic Sub List or related Vendor Documents entry pattern.
- Alert: Alert.
- Actions: Button controls and form submit actions.

Control rationale:

- Section cards make a long onboarding form easier to complete.
- Toggle controls keep optional details available without crowding the first view.
- Dynamic Sub List supports required-document line items and attachment status.
- Alert prevents missing compliance documents from being buried.

Form fields:

- Vendor Information:
  - Vendor Name
  - Vendor Type
  - Country / Region
  - Annual Spend Estimate
  - Owner
- Contact Information:
  - Primary Contact
  - Email
  - Phone
- Business Justification:
  - Business need / justification
  - Budget Category
  - Requesting department or business owner if available.
- Payment & Contract Information:
  - Payment Terms
  - Contract Status
  - Renewal Date
  - Tax Review Status
  - Bank Info Status
- Required Documents:
  - Dynamic Sub List rows for document type, required flag, file attachment, expiry date, notes, review status.

Dynamic Sub List fields:

- Document Type
- Required
- File Attachment
- Expiry Date
- Review Status
- Notes

Actions and buttons:

- Save Draft: saves current record with Onboarding Status = Request Submitted or Draft if supported.
- Submit: validates required fields, creates/updates Vendor record, sets Onboarding Status = Procurement Review, and triggers workflow tasks.
- Add Document Row: sub-list row action.
- Remove Document Row: sub-list row action, only for optional rows where safe.

Workflow needs:

- On submit, create default Vendor Tasks for Procurement, Compliance, Legal, and Finance when appropriate.
- On submit, create Vendor Activity / History row.
- Optional workflow creates required Vendor Documents rows if Dynamic Sub List is not persisted directly.

Style settings:

- Form background neutral, section cards white.
- 24px card padding, 16px control spacing, clear labels.
- Required fields should be visually marked.
- Footer buttons align right on desktop and stack on mobile if needed.

Custom CSS needs:

- Scoped CSS for form section card spacing, sticky footer action bar if supported, and sub-list table readability.

Custom code needs:

- None required. If a future document checklist needs complex conditional required rows by Vendor Type/Country, evaluate standard rules/expressions first, then custom code only if the native controls cannot support it.

Validation checks:

- New/Edit form has safe outer padding.
- All required form sections exist.
- Required document area uses Dynamic Sub List or a clear related-list creation pattern.
- Submit and Save Draft buttons resolve to valid form actions.
- Required document alert exists.
- No form controls touch page edges.
- File attachment fields are placeholders only; no document payloads are committed in generated package.

### 4. Compliance Review Workspace

Purpose: help compliance officers prioritize, review, and act on vendors needing compliance attention.

User goal: triage high-risk vendors, inspect document gaps, and apply review actions efficiently.

Layout structure:

- Dashboard page with outer Container and safe horizontal padding.
- Header row:
  - page title and subtitle.
  - queue filters or quick action buttons.
- Work queue layout:
  - left/main area: Kanban grouped by Risk Level or Review Status.
  - middle or lower area: Collection cards for vendors needing review.
  - right-side detail panel or selected vendor summary card.
- Review indicators:
  - Progress circle for risk score.
  - Alert for high-risk issues.
  - Data table for missing/expired documents.
- Bulk action toolbar:
  - selected count
  - assign reviewer
  - mark in review
  - request documents

Yeeflow controls per section:

- Outer layout: Dashboard page, Container, Grid.
- Queue board: Kanban bound to Vendors, grouped by Risk Level or Compliance Status.
- Work queue cards: Collection bound to Vendors or Compliance Reviews.
- Selected vendor summary: Container, Dynamic fields, Dynamic user.
- Risk score: Progress circle.
- Issues: Alert.
- Missing documents: Data table bound to Vendor Documents.
- Bulk actions: Collection/Kanban actions plus dashboard variables for selected IDs/count.

Control rationale:

- Kanban supports triage by risk/status.
- Collection cards show richer context for review work than a table alone.
- Detail summary supports fast decisions without opening the full detail page.
- Missing-document table makes compliance blockers concrete.
- Bulk toolbar supports operational review batches.

Data bindings:

- Vendors filtered by Compliance Status not Approved or Risk Level High/Critical.
- Compliance Reviews filtered by Review Status in Not Started, In Review, Action Required, or Rejected.
- Vendor Documents filtered by Review Status Missing/Rejected/Expired or Expiry Date threshold.
- Vendor Tasks filtered by compliance task type and open statuses.

Kanban item template fields:

- Vendor Name
- Risk Level
- Compliance Status
- Country / Region
- Owner
- Last Review Date
- Annual Spend Estimate
- Primary required action or open compliance task

Collection card template fields:

- Vendor Name
- Review Type
- Risk Score
- Severity
- Review Status
- Reviewer
- Review Date
- Required Actions

Data table columns for missing/expired documents:

- Vendor
- Document Type
- Review Status
- Expiry Date
- Reviewer
- Notes

Actions and buttons:

- Open Vendor Detail.
- Start Compliance Review.
- Request Missing Documents.
- Mark Action Required.
- Approve Compliance.
- Assign Reviewer.
- Bulk Mark In Review.
- Bulk Request Documents.

Workflow needs:

- Collection/Kanban item actions should update Vendors, Compliance Reviews, Vendor Tasks, and Vendor Activity / History where applicable.
- Bulk actions must use selected IDs/count variables and validate all action bindings.
- High-risk or expired-document actions may create Vendor Tasks for follow-up.

Style settings:

- Operational layout, not decorative: dense but readable.
- Main Kanban has consistent lane widths and card spacing.
- Detail panel uses white card with badge row.
- Alert uses red/orange only for true risk.
- Bulk toolbar appears only when selected count is greater than zero if dynamic display rules are supported.

Custom CSS needs:

- Scoped CSS for fixed or scrollable Kanban/table layout, selected-card state, bulk toolbar spacing, and risk badges.

Custom code needs:

- None required for default workspace. Use Custom code only if a complex split-pane selected-record interaction cannot be represented with standard dashboard variables/actions and Collection/Kanban controls.

Validation checks:

- Dashboard has safe outer padding.
- Kanban group field resolves to Risk Level or Compliance Status.
- Kanban and Collection templates include meaningful dynamic fields.
- Missing/expired document Data table has configured columns listed above.
- Bulk toolbar variables and selected IDs/count resolve.
- Item and bulk actions resolve to valid fields and target lists.
- No action references private user IDs or tenant-specific IDs.

### 5. Vendor Print Page

Purpose: provide a clean printable vendor summary for audit, internal review, and offline approval packets.

User goal: print or export a readable vendor summary with core profile, compliance status, document checklist, approval timeline, QR link, and vendor code.

Layout structure:

- Data List custom Print Page for Vendors.
- Printable single-record layout with constrained page width.
- Sections:
  - Vendor header
  - Key vendor information
  - Compliance summary
  - Document checklist
  - Approval/review timeline
  - QR code and barcode area
  - Signature/internal notes area if needed

Yeeflow controls per section:

- Host: Data List custom Print Page.
- Layout: Container, Grid, Divider.
- Read-only fields: Dynamic field, Dynamic user.
- Progress/status: Steps bar, Progress bar or Progress circle where useful.
- Document checklist: Data table or Dynamic Sub List.
- Timeline: Vertical Timeline.
- QR: QR Code.
- Barcode: Barcode.
- Optional attachment preview: Document embed only if useful and print-safe.

Control rationale:

- Print Page gives stable audit output separate from interactive view.
- Read-only fields prevent accidental edits in the print context.
- Document checklist and timeline show compliance proof trail.
- QR Code and Barcode support scanning back to the vendor record or vendor code.

Data bindings:

- Current Vendors record.
- Vendor Documents filtered by current Vendor.
- Compliance Reviews filtered by current Vendor.
- Vendor Activity / History filtered by current Vendor.

Fields displayed:

- Header:
  - Vendor Name
  - Vendor Code
  - Risk Level
  - Onboarding Status
  - Compliance Status
  - Owner
- Key information:
  - Vendor Type
  - Country / Region
  - Primary Contact
  - Email
  - Phone
  - Payment Terms
  - Annual Spend Estimate
  - Renewal Date
  - Last Review Date
- Compliance summary:
  - Risk Level
  - Compliance Status
  - Latest Risk Score
  - Latest Review Status
  - Required Actions
- Document checklist:
  - Document Type
  - Review Status
  - Expiry Date
  - Reviewer
  - Notes
- Approval timeline:
  - Activity Date
  - Activity Title
  - Activity Type
  - Actor

Actions:

- Print page should not include mutating actions.
- Optional "Back to Vendor" navigation is acceptable outside the printed area if supported.

Workflow needs:

- No direct workflow required for the print page.
- QR Code should link to a safe record URL pattern only if Yeeflow supports record links without embedding tenant-private URLs in the package. Otherwise bind QR Code to Vendor Code or a placeholder record reference and document post-import configuration.

Style settings:

- White background.
- Print-width content container.
- Minimal borders and dividers.
- Clear typographic hierarchy.
- Compact table rows.
- Avoid heavy shadows in print mode.
- Keep status badges print-readable in grayscale.

Custom CSS needs:

- Scoped print CSS for page margins, table row borders, section page-break handling, hiding non-print controls, and readable status badges.

Custom code needs:

- None required. Use Custom code only if a tenant requires specialized print rendering beyond Print Page plus scoped CSS.

Validation checks:

- Print Page exists for Vendors.
- Print layout uses safe readable spacing and print-specific CSS.
- Document checklist has configured columns.
- Timeline has meaningful date/title/actor fields.
- QR Code and Barcode are configured with safe values.
- No mutating action is exposed in the printable output.

## UI/UX and Yeeflow Control Mapping

| Visual UI Pattern | Yeeflow Implementation | Notes |
| --- | --- | --- |
| KPI cards | Container/Grid/Text/Dynamic fields | Use calculated or filtered counts where supported; otherwise display safe summary fields. |
| Progress circle | Progress circle | Use onboarding completion or risk score percentage. |
| Progress bar | Progress bar | Use onboarding completion on detail view. |
| Alert boxes | Alert | Use for urgent compliance risks, missing documents, expired documents, or required document notice. |
| Kanban boards | Kanban | Group by Onboarding Status, Risk Level, or Compliance Status. Item templates must include meaningful fields. |
| Data tables | Data table with configured columns | Every table must have data source and columns; zero-column Data table is a generated-final error. |
| Icon links | Icon list | Quick links for New Vendor, Compliance Queue, Expiring Docs, Reports, Admin. |
| Recent activity/history | Vertical Timeline | Use Vendor Activity / History; Collection fallback is acceptable if timeline host support is limited. |
| Tabs | Tabs | Use on Vendor Detail View Page for Overview, Documents, Compliance, Tasks, History. |
| Steps | Steps bar | Use onboarding process stages and print approval timeline summary. |
| Dynamic fields/users/files | Dynamic controls | Use Dynamic field, Dynamic user, Dynamic file/image where related display is needed. |
| Document preview | Document embed | Use on Documents tab; ensure attachment binding resolves. |
| Required document line items | Dynamic Sub List | Use on New Vendor Request Form for document checklist and file attachments where supported. |
| Task/review cards | Collection | Use for Compliance Reviews and Vendor Tasks with action buttons. |
| Bulk toolbar | Collection/Kanban actions plus dashboard variables | Track selected IDs/count; validate all bindings and dynamic visibility. |
| Print layout | Data List Print Page plus custom CSS | Use read-only fields, compact tables, dividers, and print-specific styles. |
| QR Code | QR Code | Bind to safe record URL or Vendor Code placeholder; avoid tenant-specific hardcoding. |
| Barcode | Barcode | Bind to Vendor Code. |
| Custom polish | Scoped custom CSS | Use for card spacing, status badges, print formatting, and responsive layout refinements. |
| Custom UI gaps | Custom code only if needed | Use only when standard controls plus CSS cannot meet a real requirement. |

## Design Quality Rules

- Every dashboard, view form, edit form, and print page must use a safe outer page container.
- Recommended padding:
  - desktop: 24px to 32px left/right.
  - tablet: 20px to 24px left/right.
  - mobile: 16px left/right.
- Do not place major controls directly against the page/window edge.
- Use section/card containers for major content groups.
- Use 16px to 24px grid gaps for dashboard and form sections.
- Use readable card internals: title, primary dynamic value, secondary context, status badge, and action area where needed.
- Use professional blue/teal accents for primary actions and progress.
- Use clear status colors consistently across all pages.
- Every Data table must define:
  - data source.
  - at least 3 to 5 meaningful display columns.
  - a primary title/name field when available.
  - status/date/owner/risk/spend fields where relevant.
- Collection, Kanban, and Timeline templates must include meaningful dynamic fields and must not be empty.
- Buttons/actions must bind to valid form, page, collection, or workflow actions.
- Dynamic fields must resolve to the selected data source or current item context.
- Print page must remain readable without interactive affordances.
- Custom CSS must be scoped, minimal, documented, and must not hide broken structure.
- Custom code is not part of the default plan and should only be added after standard controls and CSS are insufficient.

## Package Generation Checklist

### Planned Data Lists

- Vendors
- Vendor Documents
- Compliance Reviews
- Vendor Tasks
- Vendor Activity / History

### Planned Fields

- All fields listed in the Data Model section.
- Required relationship fields:
  - Vendor Documents -> Vendor
  - Compliance Reviews -> Vendor
  - Vendor Tasks -> Vendor
  - Vendor Activity / History -> Vendor
- Required status fields:
  - Vendors.Onboarding Status
  - Vendors.Risk Level
  - Vendors.Compliance Status
  - Vendors.Contract Status
  - Vendor Documents.Review Status
  - Compliance Reviews.Review Status
  - Vendor Tasks.Status

### Planned Pages, Forms, and Dashboards

- Vendor Management Dashboard
- Vendor Detail View Page as Vendors custom View form
- New Vendor Request Form as Vendors custom New/Edit form or Approval Form when workflow routing is selected
- Compliance Review Workspace dashboard
- Vendor Print Page as Vendors custom Print Page

### Planned Controls

- Container
- Grid
- Text
- Button/Form actions
- Dynamic field
- Dynamic user
- Dynamic file/image
- Progress circle
- Progress bar
- Alert
- Kanban
- Data table
- Icon list
- Vertical Timeline
- Tabs
- Toggle
- Steps bar
- Collection
- Dynamic Sub List
- Document embed
- QR Code
- Barcode
- Divider
- Scoped custom CSS

### Planned Actions

- New Vendor Request
- Save Draft
- Submit Request
- View Vendor
- Edit Vendor
- Add Document
- Add Task
- Start Compliance Review
- Request Missing Documents
- Mark Action Required
- Approve Compliance
- Assign Reviewer
- Mark Task Complete
- Print Summary
- Bulk Mark In Review
- Bulk Request Documents

### Workflow Needs

- Request submission workflow:
  - set initial Onboarding Status.
  - create required tasks.
  - create activity entry.
- Review status workflows:
  - update Compliance Status.
  - update Onboarding Status when review milestones complete.
  - create activity entries.
- Document expiry/renewal workflow:
  - detect expiring documents or upcoming renewal dates.
  - create tasks or alerts.
- Optional approval workflow:
  - route Procurement, Compliance, Legal, and Finance review tasks if the package target is an Approval Form workflow rather than a Data List workflow.

### Validation Gates

- `scripts/inspect-generated-app-quality.mjs --package <package> --spec docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`
- Package validator for generated `.yap` or `.yapk` content.
- Import-readiness inspector.
- UI quality inspector.
- Collection/Kanban action inspector when item/bulk actions are generated.
- Dashboard/data-list/form padding and table-column checks.
- Safety scan for `.env.local`, secrets, raw packages, decoded payloads, raw `Resource`, raw `Sign`, API responses, private URLs, private IDs, and screenshots/images.

### Visual Consistency Checklist

- Each mockup page has a corresponding Yeeflow page, form, dashboard, or print page.
- Each major visible section exists in the generated package.
- Every dashboard and form has safe outer padding.
- Card/grid structure is present.
- All Data tables have configured columns.
- Kanban and Collection templates have meaningful dynamic fields.
- Timeline templates have date/title/actor/type fields.
- Document embed resolves to a file/attachment binding.
- Dynamic Sub List exists for required document line items.
- Bulk toolbar uses selected IDs/count variables and valid actions.
- QR Code and Barcode are safe and configured.
- Print Page uses print-oriented layout and scoped CSS.
- No empty or unconfigured controls remain.
- No unresolved fields, data sources, layouts, actions, or workflow references remain.

## Custom CSS and Custom Code Boundary

Custom CSS is expected for visual polish:

- KPI card spacing and subtle card style.
- Status badges for risk/status fields.
- Kanban/Collection card spacing.
- Dashboard responsive grid spacing.
- Compliance workspace bulk toolbar.
- Print page margins, dividers, table borders, and page-break behavior.

Custom code is not required for the first implementation. Consider Custom code only if a later approved requirement cannot be implemented with Yeeflow standard controls, standard actions, expressions, dashboard variables, and scoped CSS.

## Proof Boundary

This spec is a design-to-implementation planning artifact. It does not prove that a generated package imports, opens, renders, or behaves correctly at runtime.

Expected proof path after review:

1. Generate the full YAPK package from this spec.
2. Validate the package locally against this spec.
3. Run package, graph, import-readiness, UI quality, action-binding, and safety validators.
4. Import into a safe Yeeflow test environment.
5. Runtime-test:
   - dashboard open/render.
   - detail view tabs.
   - new vendor form render.
   - compliance workspace render.
   - print page render.
   - table columns.
   - Kanban/Collection templates.
   - document checklist bindings.
   - non-destructive actions.
6. Only promote runtime claims for behaviors actually tested.
