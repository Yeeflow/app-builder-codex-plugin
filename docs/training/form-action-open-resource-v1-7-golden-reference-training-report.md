# Form Action Open Resource V1.7 Training Report

This focused training converts the `Leave Management-v1.7.yapk` export evidence into shared generation and validation contracts for Open Item Form, Open Approval Form, and Open Dashboard.

Covered hosts: Approval Submission Form, Approval Task Form, Data List View custom form, and Dashboard. Data List/Document Library New/Edit use the same custom-form contract. Public Form is explicitly forbidden.

Covered variants: Add/Edit/View item, New/Submitted approval, Dashboard, current versus selected item, default values, Approval variable defaults, query parameters, optional custom forms, returned item ID, Slide/Pop-up/Full page/New window, and Small/Medium/Large/Full screen/Custom sizing.

Implemented proof layers:

- normalized template JSON without tenant IDs;
- App Plan table and planning gate;
- shared builder used by generated-final materialization;
- package validator in first-generation preflight;
- cross-host positive and negative regression tests;
- P0 hardening for selected custom-form operation purpose, ID-expression shape, Query Parameter shape, and Approval Set Variables target/type compatibility;
- source/dist parity.

Safe runtime proof against an existing installed reference baseline established the following render-only behavior without saving, submitting, publishing, installing, or upgrading:

- Open Item Form / Add resolves and renders the target custom-form modal.
- Open Dashboard resolves and renders the target Dashboard from the Approval Submission host.
- Open Approval Form / New submission resolves and renders the target Submission page.

Not executed: selected Edit/View Item and Submitted Approval Form. Those variants require a known safe existing Item ID or submitted Form ID; the proof pass did not create records merely to obtain test IDs.

Not claimed: record creation or modification, Approval submission, Submitted Form loading, Query Parameter consumption, Set Variables value consumption, exact custom-width measurement, or end-to-end business completion.
