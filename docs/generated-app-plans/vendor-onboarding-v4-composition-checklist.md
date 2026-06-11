# Vendor Onboarding v4 Implementation Composition Checklist

## Purpose

This checklist is a pre-generation contract for the next Vendor Onboarding & Compliance Management package. Do not generate a YAP or YAPK package until this checklist is reviewed and approved.

The v4 package must implement the approved UI implementation spec and the five approved mockup pages as a complete, usable Yeeflow application, not as an importable scaffold. Every item below must be either implemented or explicitly deferred with a reason, fallback, and validation impact.

Approved spec: `docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`

Approved mockup pages:

1. Vendor Management Dashboard
2. Vendor Detail View Page
3. New Vendor Request Form
4. Compliance Review Workspace
5. Vendor Print Page

Machine-readable validator input: `docs/generated-app-plans/vendor-onboarding-v4-composition-checklist.normalized.json`

Template library contract: `docs/templates/yeeflow-ui-section-template-library.normalized.json`. Every required section must reference a known `templateId`; package generation must satisfy the referenced template, not just the section title.

## Global Pre-Generation Gates

- [ ] The composition checklist is reviewed and approved before package generation starts.
- [ ] No YAP/YAPK package is generated during checklist preparation.
- [ ] The generator has a page-by-page control map before emitting package JSON.
- [ ] Every planned page has a section-by-section validation rule.
- [ ] Every data-bound control lists its source list and displayed fields.
- [ ] Every Data table column includes `Field` as the source internal field name and `FieldName` as the visible label.
- [ ] Every dashboard uses the current Type 103 dashboard shell with `Ext2` containing `{"src":true}`.
- [ ] No legacy dashboard shell is allowed.
- [ ] No no-portal YAP uses `SimplePortal: {}` or `SimplePortal: []`; no-portal YAP must use `SimplePortal: null`.
- [ ] No no-portal YAPK uses `PortalInfo: {}` or `PortalInfo: []`; no-portal YAPK must use `PortalInfo: null`.
- [ ] All generated IDs except `AppID` come from the Yeeflow generate-unique-ids API and preserve 19-digit IDs without JavaScript rounding.
- [ ] `AppID` remains fixed at `41`.
- [ ] Buttons are only active when they have a valid action binding, navigation target, or form action.
- [ ] Placeholder or deferred actions are rendered as text/status notes, not active buttons.
- [ ] Alerts use business-specific content and never use default text such as `Alert` or `Here is the description`.
- [ ] Kanban and Collection item templates include dynamic business fields and valid item actions or an explicit no-action reason.
- [ ] Custom forms and print pages are designed, padded, sectioned, and non-blank.
- [ ] The generated package must pass strict visual app quality after generation; import success alone is not success.

## Data Source Contract

Required lists:

- [ ] Vendors
- [ ] Vendor Documents
- [ ] Compliance Reviews
- [ ] Vendor Tasks
- [ ] Vendor Activity / History

Required relationship fields:

- [ ] Vendor Documents -> Vendors
- [ ] Compliance Reviews -> Vendors
- [ ] Vendor Tasks -> Vendors
- [ ] Vendor Activity / History -> Vendors

Required shared visual fields:

- [ ] `Vendor Name`
- [ ] `Vendor Type`
- [ ] `Country / Region`
- [ ] `Primary Contact`
- [ ] `Email`
- [ ] `Phone`
- [ ] `Risk Level`
- [ ] `Onboarding Status`
- [ ] `Compliance Status`
- [ ] `Contract Status`
- [ ] `Payment Terms`
- [ ] `Annual Spend Estimate`
- [ ] `Renewal Date`
- [ ] `Owner`
- [ ] `Last Review Date`
- [ ] `Onboarding Completion %`
- [ ] `Vendor Code`

## Enforceable Section Registry

Every required section below has a stable section ID, required status, explicit Yeeflow controls, data source, fields, layout rules, action bindings or action deferrals, fallback rule, validator rule, and pass/fail condition in the normalized JSON checklist.

| Page ID | Section ID | Template ID | Status | Validator Scope |
| --- | --- | --- | --- | --- |
| `vendor_management_dashboard` | `header_action_area` | `dashboard_header_action_bar` | required | Header title, subtitle, and both actions are present; active buttons have valid bindings. |
| `vendor_management_dashboard` | `kpi_card_row` | `kpi_card_row` | required | Four styled KPI cards exist with labels, values, secondary context, and source-field coverage. |
| `vendor_management_dashboard` | `onboarding_progress_section` | `progress_summary_card` | required | Progress control is in a styled card and bound to completion/status context. |
| `vendor_management_dashboard` | `urgent_compliance_alert` | `business_alert_card` | required | Alert has business-specific title/description and references risk or document expiry. |
| `vendor_management_dashboard` | `onboarding_status_board` | `kanban_status_board` | required | Kanban/Collection is bound to Vendors and item template includes required dynamic fields and action. |
| `vendor_management_dashboard` | `vendors_data_table` | `data_table_section` | required | Data table is bound to Vendors and every display column has Field and FieldName. |
| `vendor_management_dashboard` | `quick_links` | `quick_links_icon_list` | required | Quick links are visible and any active buttons have valid navigation actions. |
| `vendor_management_dashboard` | `recent_activity_timeline` | `recent_activity_timeline` | required | Timeline or Collection shows activity date, title, type, actor, and description. |
| `vendor_detail_view_page` | `detail_header_summary_card` | `detail_view_header_summary` | required | Header card shows key vendor fields and only safe active actions. |
| `vendor_detail_view_page` | `onboarding_steps_bar` | `progress_summary_card` | required | All six stages are visible in order. |
| `vendor_detail_view_page` | `detail_tabs_or_sections` | `tabbed_detail_page` | required | Five detail areas are present as tabs or titled sections. |
| `vendor_detail_view_page` | `overview_details` | `sectioned_new_edit_form` | required | Profile and contract/payment fields are grouped into styled sections. |
| `vendor_detail_view_page` | `documents_section` | `related_records_section` | required | Document table/cards exist with required columns and embed fallback is explicit when needed. |
| `vendor_detail_view_page` | `compliance_section` | `related_records_section` | required | Compliance section includes review context, risk score, status, and required actions. |
| `vendor_detail_view_page` | `tasks_section` | `related_records_section` | required | Task section shows task fields and only safe active actions. |
| `vendor_detail_view_page` | `history_timeline` | `recent_activity_timeline` | required | History section shows activity date, title, type, actor, and description. |
| `new_vendor_request_form` | `request_intro_alert` | `business_alert_card` | required | Intro and business-specific required document alert are present. |
| `new_vendor_request_form` | `vendor_information` | `sectioned_new_edit_form` | required | Vendor identity fields are present in a styled section. |
| `new_vendor_request_form` | `contact_information` | `sectioned_new_edit_form` | required | Contact fields are present and grouped. |
| `new_vendor_request_form` | `business_justification` | `sectioned_new_edit_form` | required | Justification and budget context are present. |
| `new_vendor_request_form` | `payment_contract_information` | `sectioned_new_edit_form` | required | Payment, contract, tax, bank, and renewal fields are present. |
| `new_vendor_request_form` | `required_documents_checklist` | `required_documents_checklist` | required | Document checklist/sub-list/fallback exists with required document fields. |
| `new_vendor_request_form` | `footer_actions` | `dashboard_header_action_bar` | required | Footer actions are valid or explicitly deferred without fake active buttons. |
| `compliance_review_workspace` | `workspace_header_filters` | `dashboard_header_action_bar` | required | Header, subtitle, queue controls, and safe actions are present. |
| `compliance_review_workspace` | `risk_status_board` | `kanban_status_board` | required | Risk/status board has meaningful cards and an open-detail action. |
| `compliance_review_workspace` | `selected_vendor_summary` | `detail_view_header_summary` | required | Summary card shows real vendor/review fields or approved fallback. |
| `compliance_review_workspace` | `risk_progress_indicator` | `progress_summary_card` | required | Risk indicator is present and bound to Risk Score or approved proxy. |
| `compliance_review_workspace` | `high_risk_alert` | `business_alert_card` | required | Alert contains business-specific high-risk or missing-document copy. |
| `compliance_review_workspace` | `missing_documents_table` | `data_table_section` | required | Vendor Documents table is configured with required columns and source fields. |
| `compliance_review_workspace` | `review_action_area` | `dashboard_header_action_bar` | required | Action area exposes only valid actions or documented inactive deferrals. |
| `vendor_print_page` | `print_header` | `print_page_summary` | required | Print header shows vendor identity and status fields with print-safe styling. |
| `vendor_print_page` | `vendor_summary` | `print_page_summary` | required | Key vendor, contact, payment, and renewal fields are grouped. |
| `vendor_print_page` | `compliance_summary` | `print_page_summary` | required | Risk, compliance, latest review, and required-action fields are present. |
| `vendor_print_page` | `document_checklist` | `print_page_document_checklist` | required | Document checklist has configured fields and print-readable rows. |
| `vendor_print_page` | `approval_review_timeline` | `recent_activity_timeline` | required | Timeline/table shows date, title, type, and actor. |
| `vendor_print_page` | `qr_barcode_vendor_code` | `print_page_qr_barcode_section` | required | QR/barcode or safe Vendor Code fallback is configured. |
| `vendor_print_page` | `print_styling` | `print_page_summary` | required | Print layout includes print-safe spacing/CSS notes and no mutating controls. |

## 1. Vendor Management Dashboard

### A. Page Purpose

Manager-facing command center for onboarding workload, compliance risk, expiring documents, vendor records, quick actions, and recent activity.

### B. Required Visual Sections From Approved Mockup

- [ ] Header/action area with title, subtitle, and primary/secondary actions.
- [ ] KPI card row with four real card containers.
- [ ] Onboarding completion progress section.
- [ ] Urgent compliance alert section with business-specific content.
- [ ] Onboarding status Kanban or Collection board.
- [ ] Vendors Data table.
- [ ] Quick links section.
- [ ] Recent activity/timeline section.

### C. Exact Yeeflow Controls To Use

- Header/action area: Container, Grid, Text, Button.
- KPI row: Grid, Container cards, Text, Dynamic field or Summary-style value controls where supported.
- Progress section: Container card, Progress circle or Progress bar, Text.
- Alert section: Alert, Text, optional Container for supporting context.
- Status board: Kanban bound to Vendors grouped by Onboarding Status, or Collection fallback grouped/filtered by status.
- Vendors table: Data table bound to Vendors.
- Quick links: Icon list, or Container/Grid cards with Button only when navigation actions are valid.
- Recent activity: Vertical Timeline bound to Vendor Activity / History, or Collection fallback with timeline-style item template.
- Layout polish: Divider, Spacer, scoped custom CSS for card/grid spacing and status badges.

### D. Required Data Source/List

- Header: static page text plus navigation targets.
- KPI row: Vendors, Vendor Documents, Compliance Reviews.
- Progress: Vendors.Onboarding Completion % or safe aggregate proxy.
- Alert: Vendors, Vendor Documents, Compliance Reviews.
- Status board: Vendors.
- Vendors table: Vendors.
- Quick links: page/form navigation targets.
- Recent activity: Vendor Activity / History.

### E. Required Fields Displayed

- KPI cards:
  - Total Vendors
  - Pending Onboarding
  - High Risk Vendors
  - Expiring Documents
- Progress:
  - Onboarding Completion %
- Alert:
  - Vendor Name
  - Risk Level
  - Compliance Status
  - Required action or document expiry context
- Vendor table:
  - Vendor Name
  - Vendor Type
  - Country / Region
  - Primary Contact
  - Email
  - Phone
  - Risk Level
  - Onboarding Status
  - Renewal Date
- Recent activity:
  - Activity Date
  - Activity Title
  - Activity Type
  - Actor
  - Description

### F. Required Layout/Card/Grid/Padding Rules

- [ ] Outer page Container has 32px desktop, 24px tablet, and 16px mobile safe padding where supported.
- [ ] Header is a horizontal Grid on desktop and stacks on mobile.
- [ ] KPI row is a 4-column desktop grid, 2-column tablet grid, 1-column mobile stack.
- [ ] Each KPI is a real card-like Container with border/shadow/background, 20px to 24px internal padding, label, value, secondary text, and optional status accent.
- [ ] Progress and alert sections use two card containers in a responsive grid.
- [ ] Status board and quick links use a 2-column operational row where supported.
- [ ] Data table and activity sections are separated by visible section spacing.
- [ ] Use 16px to 24px grid gaps and section spacing.

### G. Required Buttons And Action Bindings

- [ ] `New Vendor Request`: opens Vendors New form or New Vendor Request form.
- [ ] `View Compliance Queue`: navigates to Compliance Review Workspace.
- [ ] `View Vendor`: item/card action opens Vendor Detail View Page.
- [ ] `Assign Task`: opens Vendor Task creation with current Vendor context, or is omitted if binding is not safe.
- [ ] `Mark Review Started`: updates review/status only if target fields and action flow are proven; otherwise defer with reason and do not render active button.

### H. Required Kanban/Collection Item Template Fields And Actions

Status board item template must show:

- [ ] Vendor Name as card title.
- [ ] Risk Level badge.
- [ ] Compliance Status badge.
- [ ] Owner.
- [ ] Renewal Date or Last Review Date.
- [ ] Required action or open task summary.
- [ ] Valid item action: View Vendor.
- [ ] Optional item actions: Assign Task, Mark Review Started, Move Status only when action binding is valid.

### I. Required Form Sections And Fields

Not hosted as a form. The dashboard must link to:

- [ ] Vendors New/Edit form for New Vendor Request.
- [ ] Vendors View form for View Vendor.

### J. Required Fallback If A Control Is Not Safely Supported

- If Kanban grouping is not safely supported: use a Collection board with status-grouped columns or clearly separated status sections, each with the same dynamic item fields.
- If Timeline is not safely supported: use a Collection with timeline-style template showing date, title, type, actor, and description.
- If KPI aggregate controls are not safely supported: use labeled summary cards with clearly documented safe aggregate placeholders and a validation warning; do not use unlabeled static numbers as proof of working KPIs.
- If dashboard actions cannot be safely bound: replace active buttons with static quick-link notes and document deferred action bindings.

### K. Validation Rule For Each Section

| Section | Validation Rule | Pass/Fail |
| --- | --- | --- |
| Header/action area | Title, subtitle, and two meaningful actions exist; active buttons have valid navigation/action targets. | [ ] |
| KPI row | Four card-like Containers exist with label, value, secondary context, and visual card styling. | [ ] |
| Progress section | Progress control exists in a styled card and is bound to a valid field or documented aggregate proxy. | [ ] |
| Alert section | Alert has business-specific title/description and references risk/document context. | [ ] |
| Status board | Kanban/Collection is bound to Vendors and template includes at least five dynamic fields. | [ ] |
| Vendors table | Data table is bound to Vendors and all configured columns include `Field` and `FieldName`. | [ ] |
| Quick links | Quick links use Icon list or styled cards and do not expose fake active actions. | [ ] |
| Recent activity | Timeline/Collection is bound to Vendor Activity / History with date/title/type/actor/description. | [ ] |

### L. Page Pass/Fail

- [ ] PASS: Vendor Management Dashboard satisfies every required section or documents approved deferrals.
- [ ] FAIL: Any required section is blank, plain/unstructured, unbound, or represented by placeholder-only content.

## 2. Vendor Detail View Page

### A. Page Purpose

Vendors custom View form that gives a complete 360-degree view of a selected vendor: status, profile, documents, compliance, tasks, and history.

### B. Required Visual Sections From Approved Mockup

- [ ] Header summary card.
- [ ] Steps bar.
- [ ] Tabs or clearly sectioned layout.
- [ ] Overview details.
- [ ] Documents section.
- [ ] Compliance section.
- [ ] Tasks section.
- [ ] History/timeline section.
- [ ] Action area for safe record actions.

### C. Exact Yeeflow Controls To Use

- Host: Vendors Data List custom View form.
- Layout: Container, Grid, Tabs or Toggle, Divider, Spacer.
- Header: Text, Dynamic field, Dynamic user, status badge styling, Button.
- Progress/status: Steps bar, Progress bar or Progress circle.
- Overview: Dynamic field, Dynamic user, Grid, Container section cards.
- Documents: Data table or Collection, Dynamic file, Document embed where supported.
- Compliance: Collection cards, Progress circle, Alert.
- Tasks: Collection or Data table.
- History: Vertical Timeline or Collection fallback.
- Styling: scoped custom CSS for section cards, badges, spacing, and responsive grids.

### D. Required Data Source/List

- Current Vendors record.
- Vendor Documents filtered by current Vendor.
- Compliance Reviews filtered by current Vendor.
- Vendor Tasks filtered by current Vendor.
- Vendor Activity / History filtered by current Vendor.

### E. Required Fields Displayed

- Header:
  - Vendor Name
  - Risk Level
  - Onboarding Status
  - Compliance Status
  - Owner
- Overview:
  - Vendor Type
  - Country / Region
  - Primary Contact
  - Email
  - Phone
  - Created Date
  - Last Review Date
  - Payment Terms
  - Annual Spend Estimate
  - Budget Category
  - Tax Review Status
  - Bank Info Status
  - Renewal Date
- Documents:
  - Document Type
  - Review Status
  - Expiry Date
  - Reviewer
  - Uploaded Date
  - Notes
- Compliance:
  - Review Type
  - Risk Score
  - Severity
  - Review Status
  - Findings
  - Required Actions
  - Reviewer
  - Review Date
- Tasks:
  - Task Name
  - Task Type
  - Assigned To
  - Due Date
  - Status
  - Priority
  - Notes
- History:
  - Activity Title
  - Activity Type
  - Activity Date
  - Actor
  - Description

### F. Required Layout/Card/Grid/Padding Rules

- [ ] View form outer Container has safe page padding.
- [ ] Header is a card-like Container with clear title, status badge row, owner, and actions.
- [ ] Steps bar is directly below the header with all six stages visible.
- [ ] Tabs or sectioned layout prevent a flat wall of fields.
- [ ] Overview uses two-column field grids on desktop and one-column stack on mobile.
- [ ] Related-list sections use cards/tables with 16px to 24px spacing.
- [ ] Document embed area has stable height and visible frame when used.
- [ ] Each related section has a section title and business-specific empty state.

### G. Required Buttons And Action Bindings

- [ ] `Edit Vendor`: opens Vendors Edit form for current record.
- [ ] `Add Document`: opens Vendor Documents New form with current Vendor prefilled, or is deferred with reason.
- [ ] `Add Task`: opens Vendor Tasks New form with current Vendor prefilled, or is deferred with reason.
- [ ] `Start Review`: opens Compliance Reviews New form with current Vendor prefilled, or is deferred with reason.
- [ ] `Print Summary`: opens Vendor Print Page for current Vendor.
- [ ] Mutating actions must write to valid target fields and create activity rows only when workflow binding is proven.

### H. Required Kanban/Collection Item Template Fields And Actions

- Documents Collection fallback:
  - [ ] Document Type
  - [ ] Review Status
  - [ ] Expiry Date
  - [ ] Reviewer
  - [ ] Open Attachment action only if binding is valid.
- Compliance cards:
  - [ ] Review Type
  - [ ] Risk Score
  - [ ] Severity
  - [ ] Review Status
  - [ ] Required Actions
  - [ ] View/Open Review action.
- Task cards:
  - [ ] Task Name
  - [ ] Priority
  - [ ] Status
  - [ ] Assigned To
  - [ ] Due Date
  - [ ] Mark Complete action only if binding is valid.

### I. Required Form Sections And Fields

This page is the Vendors View form and must include:

- [ ] Header summary section.
- [ ] Overview profile section.
- [ ] Contract/payment section.
- [ ] Documents section.
- [ ] Compliance section.
- [ ] Tasks section.
- [ ] History section.

### J. Required Fallback If A Control Is Not Safely Supported

- If Tabs are not safely supported: use stacked titled sections with anchors and Divider controls.
- If Document embed binding is not proven: use a Data table/Collection with attachment field and a documented `Document embed deferred` reason.
- If related-list filtering by current Vendor is not safely supported: use related-list section placeholders with explicit blocker notes; do not claim runtime-related data proof.
- If form actions cannot prefill current Vendor lookup: render read-only guidance instead of an active misleading button.

### K. Validation Rule For Each Section

| Section | Validation Rule | Pass/Fail |
| --- | --- | --- |
| Header summary | Header card contains Vendor Name, Risk Level, statuses, Owner, and safe actions. | [ ] |
| Steps bar | Six onboarding stages are present in order. | [ ] |
| Overview | Overview and contract/payment fields are grouped into styled sections. | [ ] |
| Documents | Related document section has configured columns or cards and document fallback is documented. | [ ] |
| Compliance | Review cards/table, risk score, and alert are present with dynamic fields. | [ ] |
| Tasks | Task cards/table show task name, owner, due date, status, priority, and valid actions/deferred reasons. | [ ] |
| History | Timeline/Collection shows date, title, type, actor, and description. | [ ] |

### L. Page Pass/Fail

- [ ] PASS: Vendor Detail View Page is a designed, non-blank Vendors custom View form.
- [ ] FAIL: The View form is blank, generic, a default modal, or missing related sections.

## 3. New Vendor Request Form

### A. Page Purpose

Vendors custom New/Edit form for complete vendor intake: vendor information, contact details, justification, payment/contract data, and required documents.

### B. Required Visual Sections From Approved Mockup

- [ ] Intro/header section.
- [ ] Required compliance document alert.
- [ ] Vendor Information section card.
- [ ] Contact Information section card.
- [ ] Business Justification section card.
- [ ] Payment & Contract Information section card.
- [ ] Required Documents checklist.
- [ ] File attachment fields.
- [ ] Footer action bar.

### C. Exact Yeeflow Controls To Use

- Host: Vendors custom New/Edit form, or Approval Form only if workflow routing is explicitly selected.
- Layout: Container, Grid, Toggle where useful, Divider, Spacer.
- Inputs: text, date, choice, currency/decimal, user, file/attachment fields.
- Required document checklist: Dynamic Sub List where safely supported; otherwise related Vendor Documents table/section fallback.
- Alert: Alert with business-specific document requirements.
- Actions: Form action buttons for Save Draft and Submit Request where safely supported.
- Styling: scoped custom CSS for card spacing, sticky footer if supported, sub-list readability.

### D. Required Data Source/List

- Primary form: Vendors.
- Required documents checklist: Vendor Documents or Dynamic Sub List row schema.
- Submission workflow target lists: Vendor Tasks and Vendor Activity / History if workflow generation is included.

### E. Required Fields Displayed

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
  - Business need/justification
  - Budget Category
  - Requesting department or business owner if available
- Payment & Contract Information:
  - Payment Terms
  - Contract Status
  - Renewal Date
  - Tax Review Status
  - Bank Info Status
- Required Documents:
  - Document Type
  - Required
  - File Attachment
  - Expiry Date
  - Review Status
  - Notes

### F. Required Layout/Card/Grid/Padding Rules

- [ ] New/Edit form outer Container has safe page padding.
- [ ] Each form group is a card-like Container with section title and 20px to 24px internal padding.
- [ ] Use two-column field grids on desktop and one-column mobile stack.
- [ ] Required document checklist has clear row/card layout and does not collapse into an unstyled raw table.
- [ ] Footer action bar is visually separated and aligned consistently.
- [ ] Required field indicators are visible where supported.

### G. Required Buttons And Action Bindings

- [ ] `Save Draft`: saves current record with safe draft/requested status only if supported.
- [ ] `Submit Request`: validates required fields, saves Vendor, and sets Onboarding Status to Procurement Review or documented safe equivalent.
- [ ] `Add Document Row`: adds a checklist row when Dynamic Sub List is used.
- [ ] `Remove Document Row`: only for optional rows when safe.
- [ ] Buttons are omitted or rendered as non-active notes if bindings cannot be proven.

### H. Required Kanban/Collection Item Template Fields And Actions

Not required on this form unless Dynamic Sub List is implemented as a card-like list. If used:

- [ ] Document Type.
- [ ] Required flag.
- [ ] File Attachment field.
- [ ] Expiry Date.
- [ ] Review Status.
- [ ] Row action: Add/Remove only when valid.

### I. Required Form Sections And Fields

- [ ] Vendor Information.
- [ ] Contact Information.
- [ ] Business Justification.
- [ ] Payment & Contract Information.
- [ ] Required Documents.
- [ ] Footer actions.

### J. Required Fallback If A Control Is Not Safely Supported

- If Dynamic Sub List is not safely supported in the package shape: use a Required Documents section with Vendor Documents Data table/related-list creation notes and explicit deferred Dynamic Sub List reason.
- If file attachment fields cannot be safely generated: include documented File Attachment field placeholder and defer runtime upload proof.
- If submit workflow cannot be safely generated: use a safe Save action and document workflow deferral; do not render a fake Submit.

### K. Validation Rule For Each Section

| Section | Validation Rule | Pass/Fail |
| --- | --- | --- |
| Intro/header | Title, instructions, and required-doc alert are present with business-specific content. | [ ] |
| Vendor Information | All required vendor identity fields are present in a styled section. | [ ] |
| Contact Information | Contact fields are present and grouped. | [ ] |
| Business Justification | Justification and budget fields are present. | [ ] |
| Payment & Contract | Payment, contract, tax, bank, and renewal fields are present. | [ ] |
| Required Documents | Checklist/sub-list/fallback exists with document type, required, attachment, expiry, status, notes. | [ ] |
| Footer actions | Save/Submit actions are valid or explicitly deferred and not faked. | [ ] |

### L. Page Pass/Fail

- [ ] PASS: New Vendor Request Form is a designed, non-blank intake form with meaningful sections and safe actions.
- [ ] FAIL: The New/Edit form opens as a blank/default modal, has ungrouped raw fields only, or exposes fake actions.

## 4. Compliance Review Workspace

### A. Page Purpose

Compliance-officer workspace for triaging high-risk vendors, review queues, missing documents, and compliance actions.

### B. Required Visual Sections From Approved Mockup

- [ ] Header/action area.
- [ ] Filters/queue controls.
- [ ] Risk/status board.
- [ ] Selected vendor/review summary.
- [ ] Risk progress indicator.
- [ ] High-risk alert section.
- [ ] Missing/expired document Data table.
- [ ] Review action area.
- [ ] Meaningful Kanban/Collection cards.

### C. Exact Yeeflow Controls To Use

- Layout: Dashboard page, Container, Grid, Divider, Spacer.
- Filters/queue controls: Button, Choice/filter controls where supported, Text labels for safe fallback.
- Risk/status board: Kanban bound to Vendors or Compliance Reviews.
- Review queue cards: Collection bound to Vendors or Compliance Reviews.
- Selected summary: Container, Dynamic fields, Dynamic user, badges.
- Risk indicator: Progress circle.
- High-risk alert: Alert with business-specific content.
- Missing/expired documents: Data table bound to Vendor Documents.
- Review actions: Button only with valid navigation/update action; otherwise static action notes.
- Styling: scoped custom CSS for operational grid, queue card spacing, badges, and toolbar.

### D. Required Data Source/List

- Vendors filtered by high/critical risk, not approved compliance, or active onboarding.
- Compliance Reviews filtered by Not Started, In Review, Action Required, Rejected.
- Vendor Documents filtered by Missing, Rejected, Expired, or expiry threshold.
- Vendor Tasks filtered by compliance task type and open status.

### E. Required Fields Displayed

- Risk/status board:
  - Vendor Name
  - Risk Level
  - Compliance Status
  - Country / Region
  - Owner
  - Last Review Date
  - Annual Spend Estimate
  - Required action/open task summary
- Review queue Collection:
  - Vendor Name
  - Review Type
  - Risk Score
  - Severity
  - Review Status
  - Reviewer
  - Review Date
  - Required Actions
- Selected summary:
  - Vendor Name
  - Risk Level
  - Compliance Status
  - Owner
  - Latest Review Status
  - Required Actions
- Missing/expired documents table:
  - Vendor
  - Document Type
  - Review Status
  - Expiry Date
  - Reviewer
  - Notes

### F. Required Layout/Card/Grid/Padding Rules

- [ ] Outer dashboard Container has safe page padding.
- [ ] Header and queue controls are visually separated from work area.
- [ ] Main area uses a multi-column operational grid: queue board plus summary/detail card.
- [ ] Kanban lanes/cards or Collection cards have consistent spacing and badges.
- [ ] Selected summary is a real card, not explanatory placeholder text.
- [ ] Risk progress and alert are in designed cards with business-specific copy.
- [ ] Missing documents table has enough width, configured columns, and section title.
- [ ] Review action area uses a toolbar/card with valid actions or documented deferrals.

### G. Required Buttons And Action Bindings

- [ ] `Open Vendor Detail`: navigates to Vendor Detail View Page.
- [ ] `Start Compliance Review`: opens or creates Compliance Review with Vendor context.
- [ ] `Request Missing Documents`: creates task/request only if action binding is valid.
- [ ] `Mark Action Required`: updates Compliance Review/Vendor status only if safe.
- [ ] `Approve Compliance`: updates Compliance Status only if safe.
- [ ] `Assign Reviewer`: updates Reviewer only if safe.
- [ ] `Bulk Mark In Review`: uses selected IDs/count variables only if selection binding is proven.
- [ ] `Bulk Request Documents`: uses selected IDs/count variables only if selection binding is proven.

### H. Required Kanban/Collection Item Template Fields And Actions

Risk/status board item template:

- [ ] Vendor Name.
- [ ] Risk Level badge.
- [ ] Compliance Status badge.
- [ ] Country / Region.
- [ ] Owner.
- [ ] Last Review Date.
- [ ] Annual Spend Estimate or required action.
- [ ] Open Vendor Detail action.

Review queue card template:

- [ ] Vendor Name.
- [ ] Review Type.
- [ ] Risk Score.
- [ ] Severity.
- [ ] Review Status.
- [ ] Reviewer.
- [ ] Review Date.
- [ ] Required Actions.
- [ ] Start Review/Open Review action when safe.

### I. Required Form Sections And Fields

Not hosted as a form. It must link safely to:

- [ ] Vendor Detail View Page.
- [ ] Compliance Reviews New/Edit form or safe review creation workflow.
- [ ] Vendor Tasks creation when request-document action is supported.

### J. Required Fallback If A Control Is Not Safely Supported

- If Kanban is not safely supported: use a Collection board with grouped review cards and preserve all item template fields.
- If selected vendor dashboard variables are not safely supported: replace selected summary with a review queue summary card and documented variable-binding deferral.
- If bulk actions are not safely supported: render selected-count guidance as static text and do not expose active bulk buttons.
- If compliance update actions are not safely supported: expose navigation-only actions and document workflow/action deferral.

### K. Validation Rule For Each Section

| Section | Validation Rule | Pass/Fail |
| --- | --- | --- |
| Header/action area | Page title, subtitle, and queue controls/actions are present and meaningful. | [ ] |
| Risk/status board | Kanban/Collection is bound and shows at least seven dynamic fields. | [ ] |
| Selected summary | Summary card shows real vendor/review fields or an approved fallback. | [ ] |
| Risk progress | Progress control is present and bound to Risk Score or documented safe proxy. | [ ] |
| High-risk alert | Alert uses business-specific risk/document copy. | [ ] |
| Missing documents table | Data table is bound to Vendor Documents and all columns include `Field` and `FieldName`. | [ ] |
| Review action area | Active buttons have valid action bindings; unsupported actions are documented and inactive. | [ ] |

### L. Page Pass/Fail

- [ ] PASS: Compliance Review Workspace is an operational, designed dashboard with queue, summary, risk, table, and valid/deferred actions.
- [ ] FAIL: The workspace is mostly plain text, generic buttons, empty queue sections, or default alert content.

## 5. Vendor Print Page

### A. Page Purpose

Vendors custom Print Page for audit-ready printable vendor summary, compliance status, document checklist, and review timeline.

### B. Required Visual Sections From Approved Mockup

- [ ] Print-oriented header.
- [ ] Vendor summary.
- [ ] Compliance summary.
- [ ] Document checklist.
- [ ] Approval/review timeline.
- [ ] QR/barcode or safe Vendor Code fallback.
- [ ] Signature/internal notes area if needed.
- [ ] Print CSS/layout notes where supported.

### C. Exact Yeeflow Controls To Use

- Host: Vendors custom Print Page.
- Layout: Container, Grid, Divider, Spacer.
- Read-only fields: Dynamic field, Dynamic user.
- Status/progress: Steps bar, Progress bar or Progress circle where useful.
- Document checklist: Data table or Dynamic Sub List.
- Timeline: Vertical Timeline or Collection fallback.
- QR: QR Code bound to safe record URL or Vendor Code.
- Barcode: Barcode bound to Vendor Code.
- Print styling: scoped print CSS for margins, dividers, page breaks, table borders, and grayscale-readable badges.

### D. Required Data Source/List

- Current Vendors record.
- Vendor Documents filtered by current Vendor.
- Compliance Reviews filtered by current Vendor.
- Vendor Activity / History filtered by current Vendor.

### E. Required Fields Displayed

- Header:
  - Vendor Name
  - Vendor Code
  - Risk Level
  - Onboarding Status
  - Compliance Status
  - Owner
- Vendor summary:
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
- Approval/review timeline:
  - Activity Date
  - Activity Title
  - Activity Type
  - Actor

### F. Required Layout/Card/Grid/Padding Rules

- [ ] Print Page uses a constrained readable content width.
- [ ] Page has print-safe margins and section spacing.
- [ ] Header uses clear typographic hierarchy and status badges.
- [ ] Summary sections use two-column grids on desktop/print width where readable.
- [ ] Document checklist table uses compact rows and visible dividers.
- [ ] Timeline uses print-readable rows/cards.
- [ ] QR/barcode area is clearly labeled and does not embed private tenant URLs unless explicitly approved.
- [ ] Mutating controls are hidden or absent from printable output.

### G. Required Buttons And Action Bindings

- [ ] No mutating action is exposed in the printable output.
- [ ] Optional `Back to Vendor` navigation may exist outside the printed area only if safely supported.
- [ ] Print behavior relies on Yeeflow Print Page host and scoped print CSS, not fake buttons.

### H. Required Kanban/Collection Item Template Fields And Actions

Timeline or checklist fallback Collection template must show:

- [ ] Date or document type.
- [ ] Status/type.
- [ ] Actor/reviewer.
- [ ] Notes/description.
- [ ] No mutating item actions in print output.

### I. Required Form Sections And Fields

This page is the Vendors custom Print Page and must include:

- [ ] Vendor header.
- [ ] Vendor summary.
- [ ] Compliance summary.
- [ ] Document checklist.
- [ ] Approval/review timeline.
- [ ] QR/barcode or Vendor Code fallback.

### J. Required Fallback If A Control Is Not Safely Supported

- If QR Code cannot safely bind to a tenant-neutral record URL: bind QR Code to Vendor Code or omit QR and document the post-import record URL configuration.
- If Barcode is not safely supported: render Vendor Code as a labeled text fallback and document barcode deferral.
- If Timeline is not safely supported in Print Page: use a print-readable Collection/table with activity date/title/type/actor.
- If Document checklist cannot use Dynamic Sub List: use a Data table bound to Vendor Documents.

### K. Validation Rule For Each Section

| Section | Validation Rule | Pass/Fail |
| --- | --- | --- |
| Print header | Header shows Vendor Name, Vendor Code, statuses, owner, and print-safe styling. | [ ] |
| Vendor summary | Key vendor/contact/payment fields are present and grouped. | [ ] |
| Compliance summary | Risk, status, latest score/status, and actions are present. | [ ] |
| Document checklist | Checklist/table has configured columns and no empty unbound state. | [ ] |
| Approval timeline | Timeline/table shows date, title, type, and actor. | [ ] |
| QR/barcode | QR/barcode or safe Vendor Code fallback is configured without private URLs. | [ ] |
| Print styling | Print-specific spacing/CSS notes exist and mutating actions are absent. | [ ] |

### L. Page Pass/Fail

- [ ] PASS: Vendor Print Page is a readable, print-oriented Vendors custom Print Page with all required sections.
- [ ] FAIL: Print Page is missing, blank, interactive-only, or lacks checklist/timeline/QR-barcode fallback.

## Required Deferral Format

Any unsupported control or action must be recorded before generation using this format:

| Item | Required Feature | Reason Deferred | Safe Fallback | Validation Impact | Approval |
| --- | --- | --- | --- | --- | --- |
| Example | Bulk Mark In Review | Dashboard selected-ID action shape not export-proven | Static review action note plus per-item navigation | Strict visual quality may pass only if fallback is approved and active fake button is omitted | [ ] |

## Final Pre-Generation Approval

- [ ] Vendor Management Dashboard checklist approved.
- [ ] Vendor Detail View Page checklist approved.
- [ ] New Vendor Request Form checklist approved.
- [ ] Compliance Review Workspace checklist approved.
- [ ] Vendor Print Page checklist approved.
- [ ] Deferrals reviewed and accepted.
- [ ] v4 package generation may start.
