# Design Image Manifest Template

Use this template during the Full-page Canonical Design Artifacts stage. The manifest maps every required Dashboard page, Approval form surface, and Data List custom form surface back to the approved Functional Specification and Yeeflow App Plan.

Form Reports are standalone Yeeflow resources and are not required canonical design image surfaces. Do not mix Form Report design coverage into Dashboard page design coverage.

## Manifest Header

| Field | Value |
| --- | --- |
| Application name |  |
| Plugin version |  |
| Source Functional Specification path |  |
| Source Yeeflow App Plan path |  |
| `applicationLayoutType` |  |
| `applicationLayoutName` |  |
| `applicationChromeStyleId` |  |
| Layout rule source | `docs/standards/yeeflow-application-layout-design-rules.md` |
| Application Design System path |  |
| UI Surface Contract directory/path |  |
| HTML preview directory/path |  |
| Desktop/mobile screenshot evidence directory/path |  |
| HTML preview validation report path |  |
| Blueprint-to-UI Surface Contract comparison report path |  |
| Application Design System status |  |
| Design System generated before images | yes/no |
| Manifest status | draft / reviewed / ready for blueprint |

`applicationLayoutType` must be one of:

- `application-layout-1-vertical-nav`
- `application-layout-2-horizontal-nav`
- `application-layout-3-header-nav`
- `application-layout-4-no-nav`

Do not use arbitrary layout descriptions such as `left navigation with compact header and content shell`, `custom sidebar`, `SaaS shell`, or `compact header`.

## Planned UI Surfaces

List every UI surface from the approved App Plan that requires page/form design.

| Surface Name | Yeeflow Surface Type | Source App Plan Section | Source Resource Name | Required Design Surface | Notes |
| --- | --- | --- | --- | --- | --- |
|  | Dashboard page | Dashboard Pages Plan |  | yes/no |  |
|  | Approval Submission form | Approval Forms Plan |  | yes/no |  |
|  | Approval Task form | Approval Forms Plan |  | yes/no |  |
|  | Approval Print page | Approval Forms Plan |  | yes/no |  |
|  | Data List Add/Edit form | Custom Data List Forms Plan |  | yes/no |  |
|  | Data List View form | Custom Data List Forms Plan |  | yes/no |  |
|  | Data List Detail form | Custom Data List Forms Plan |  | yes/no |  |
|  | Other Data List custom form | Custom Data List Forms Plan |  | yes/no |  |
|  | Form Report | Form Reports Plan |  | no | Standalone resource; excluded from canonical design image coverage. |

## Canonical Design Artifact Rows

Every row must reference the Application Design System and the approved App Plan. Dashboard rows must include the selected official layout/chrome and `includeHeaderNavigation: true`. Approval and Data List form rows do not require application header/navigation and may use `form-surface-no-app-chrome` as the explicit non-dashboard surface marker.

For complex business applications, every blueprint-ready row should also reference its UI Surface Contract, high-fidelity HTML preview, desktop/mobile screenshots generated from HTML, HTML validation report, and blueprint-to-contract comparison report. PNG canonical images remain useful evidence, but they are not the sole implementation contract when the HTML-first workflow is used.

The HTML-first workflow inherits all Full-page Canonical Design Artifact gates. Manifest rows must not mark a surface ready for blueprint when the UI Surface Contract or HTML preview bypasses layout fidelity, modern visual quality, surface responsibility, field/action coverage, forbidden-region checks, semantic consistency, lower-page visual concreteness, visual usability, template reuse risk, full-page completeness, page-end evidence, or mobile/responsive evidence.

Additional HTML-first row fields:

- UI Surface Contract path
- HTML Preview path
- Desktop Screenshot path
- Mobile Screenshot path
- HTML Validation Report path
- Blueprint-to-Contract Report path
- inherited Full-page Design gate summary
- official dashboard application layout/header/navigation evidence
- form-surface no-app-chrome evidence
- full-page/page-end evidence
- App Plan field/action coverage evidence
- visual usability/text overflow/overlap/spacing/mobile pressure evidence

Every row must also declare surface responsibility and App Plan coverage evidence before `readyForBlueprint: true`. Required fields are `surfaceType`, `appPlanResourceRef`, `sourceResourceType`, `sourceResourceName`, `sourceListOrFormName`, `surfaceResponsibility`, `plannedFieldCoverage`, `requiredFieldsShown`, `optionalFieldsShown`, `missingPlannedFields`, `fieldCoverageStatus`, `plannedActions`, `actionsShown`, `missingRequiredActions`, `actionCoverageStatus`, `forbiddenRegionsPresent`, `forbiddenRegionStatus`, `surfaceResponsibilityStatus`, and `appPlanTraceabilityStatus`.

Surface responsibility rules:

- Approval Submission forms must show all App Plan editable submission fields, planned Sub List controls as Sub List controls, Save as draft when draft behavior is planned/default-supported, and Submit. They must not show duplicated hero/title cards, route previews, audit activity, workflow history, reviewer-only decisions, generic analytics, unrelated tables/collections, or validation-only checklists unless explicitly planned as visible UI.
- Approval Task forms must show read-only request context, task-specific fields when planned, and task decision/completion actions such as Approve/Reject or Complete. Submit is not enough for an approval task unless the App Plan explicitly defines a submission-like task.
- Approval Print pages must be read-only and print-oriented. Editable inputs, Save/Submit/Approve/Reject buttons, filters, analytics, and dashboard controls are forbidden.
- Data List New/Edit forms must prioritize all App Plan add/edit fields for the current list plus Save/Cancel or Save/Submit actions. They must not include Collection, Data table, Data filters, Data analytics, Kanban, Timeline, audit activity, route preview, unrelated document/task/approval regions, or approval-only status cards unless explicitly planned for that form.
- Data List View/Detail forms must show the current record's read-only/display fields and only explicitly planned related regions/actions.
- Document Library New/Edit forms must show file upload/file fields and document metadata such as name/title, type, linked contract/vendor/request, status, uploaded by/date, notes, and planned required-document flags plus Save/Cancel or Upload/Save actions.
- Document Library View forms must show document/file preview or open/download behavior, metadata, linked record context when planned, and allowed document actions.

`readyForBlueprint: true` is blocked when field coverage fails, required actions are missing, forbidden regions are present, surface responsibility fails, App Plan traceability is unresolved, or the artifact is visually complete but not faithful to the App Plan. `fieldCoverageStatus: pass` with non-empty `missingPlannedFields`, or `actionCoverageStatus: pass` with non-empty `missingRequiredActions`, is invalid.

| Page/Form Surface Name | Yeeflow Surface Type | Source App Plan Section | Source Resource Name | Application Design System Path | `applicationLayoutType` | `applicationChromeStyleId` | `includeHeaderNavigation` | Layout Chrome Compliance Declaration | `layoutFidelityStatus` | `visualQualityStatus` | `visualUsabilityStatus` | `textOverflowStatus` | `overlapStatus` | `spacingStatus` | `mobileUsabilityStatus` | Responsive Layout Evidence | Text Wrapping Strategy | Container Boundary Evidence | Visual Usability Findings | Modern Visual Quality Checklist | Anti-pattern Check | Primary Business Object | Semantic Field Examples | `fieldValueSemanticsStatus` | Business Region Evidence | Lower-page Business Regions | Form Purpose Differentiators | `templateReuseRiskStatus` | Page-specific Quality Evidence | Canonical Desktop Image Path | Mobile Image Path | Responsive Plan Reference | Image Dimensions | Full-page Coverage Status | Included Sections | Major Planned Controls Shown | Business Data Examples Shown | Page End Included | Deferred/Gap Notes | Ready For Blueprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Dashboard page |  |  |  | application-layout-1-vertical-nav / application-layout-2-horizontal-nav / application-layout-3-header-nav / application-layout-4-no-nav |  | true |  | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Submission form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Task form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Print page |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Add/Edit form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List View form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Detail form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Other Data List custom form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred | pass / pass-with-reviewed-risk / human_review_required / fail / deferred | pass / fail | pass / fail | pass / fail | pass / fail |  |  |  |  |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |

`readyForBlueprint: true` is allowed only when `layoutFidelityStatus`, `visualQualityStatus`, `visualUsabilityStatus`, `textOverflowStatus`, `overlapStatus`, `spacingStatus`, and `mobileUsabilityStatus` are passing or explicitly reviewed, the anti-pattern check passes, and form/detail semantic quality gates pass where applicable. Human-review-required, unknown, deferred, or failed layout/quality/semantic/visual-usability states must block blueprint readiness unless the surface is explicitly deferred with reason, fallback, and proof impact. `pass-with-reviewed-risk` is allowed only when the row documents the risk, mitigation, and proof impact.

For Approval and Data List form/detail rows:

- `semanticFieldExamples` must include realistic field/value pairs, such as `Contract Title = MSA-2026 Acme Supplies`, `Contract Owner = Mira Chen`, and `Renewal Date = 2026-08-15`.
- Field labels and values must match business semantics. Do not put lifecycle statuses in title/name fields, task/status labels in owner/person fields, document filenames in date fields, person/vendor names in status fields, review comments in document/evidence fields, or status labels in related-record fields.
- `lowerPageBusinessRegions` must include at least one meaningful business region with name, purpose, source list/data source, displayed fields/items, action or read-only behavior, and proof impact.
- Each lower-page business region must also declare visual concreteness evidence: `regionName`, `regionPurpose`, `sourceListOrDataSource`, `visualPattern`, `plannedYeeflowControl`, `renderedExampleCount`, `renderedExampleSummary`, `displayedBusinessFields`, `actionsShown`, `visualConcretenessStatus`, `antiPlaceholderStatus`, and `blueprintMappingHint`.
- The canonical PNG/design contract must show the intended runtime-like visual representation for every lower-page business region: realistic rendered rows, cards, timeline entries, checklist rows, document evidence cards/table, activity feed rows, signature rows, or read-only field groups. Source-list notes and field-name lists may appear as supporting metadata, but they must not be the only visual content in the region.
- Supported lower-page visual patterns include Data table, Collection, Kanban, Vertical Timeline, Horizontal Timeline, Dynamic Sub List, checklist rows, related-record cards, document table/cards, activity feed, workflow/approval timeline, signature block, and read-only field group.
- `renderedExampleCount` must be greater than `0` unless the region intentionally shows an empty-state component with reason and next action. `renderedExampleSummary` must describe concrete sample rows/cards/items, not only `Source: ...`, `Show ...`, or plain field names.
- Lower-page visual concreteness is not enough by itself. The region's `sourceListOrDataSource`, `regionPurpose`, `displayedBusinessFields`, `displayedFields`, `actionsShown`, `behavior`, `proofImpact`, and `blueprintMappingHint` must describe the same business object or a clearly documented related-record relationship. A Linked Contracts region sourced from Contracts must not inherit Renewal Task fields/actions such as `Task`, `Due date`, `Priority`, `Open task detail`, `Mark complete`, or `Renewal Tasks filtered by current Contract`.
- When both `displayedBusinessFields` and `displayedFields` are present, they must match exactly unless the region includes `fieldAliasMap`, `semanticFieldMapping`, `runtime-proof-required`, `export-learning-required`, or explicit `deferred` proof details.
- Lower-page regions must not be only `Page end`, generic notes, blank space, or design-stage explanation text.
- `pageSpecificQualityEvidence` must include at least two page-specific entries that name business objects, fields, records, histories, actions, or planned resources. Generic checklist wording is not enough.
- `templateReuseRiskStatus: fail` or `human_review_required` blocks blueprint readiness unless the surface is explicitly deferred with reason, fallback, and proof impact.
- Similar forms may share visual style only when `formPurposeDifferentiators` explains purposeful functional differences such as editable versus read-only fields, decision controls, reviewer comments, workflow/history regions, print footer/signature blocks, or related-record sections.

## Deferred Design Surfaces

Deferred surfaces are allowed only with reason, fallback, and proof impact.

| Surface Name | Yeeflow Surface Type | Source App Plan Section | Source Resource Name | Reason | Fallback | Proof Impact | Required Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

## JSON Shape For Executable Validation

When using `scripts/validate-full-page-design-artifacts.mjs`, store the manifest as JSON with these top-level fields:

```json
{
  "applicationName": "",
  "pluginVersion": "0.6.65",
  "sourceFunctionalSpecificationPath": "",
  "sourceAppPlanPath": "",
  "applicationLayoutType": "application-layout-1-vertical-nav",
  "selectedApplicationLayout": "application-layout-1-vertical-nav",
  "designSystemPath": "",
  "applicationDesignSystem": {
    "path": "",
    "status": "complete",
    "generatedAt": "",
    "applicationLayoutType": "application-layout-1-vertical-nav",
    "applicationLayoutName": "Application layout 1: vertical navigation menu panel",
    "applicationChromeStyleId": "layout-1-dark-header-dark-vertical-nav",
    "headerMode": "dark-header",
    "navMode": "vertical-nav",
    "navBackgroundMode": "dark",
    "contentSafeArea": "content starts to the right of the left nav and below the header",
    "layoutRuleSource": "docs/standards/yeeflow-application-layout-design-rules.md",
    "modernVisualQualityStandard": "",
    "responsivePlan": "",
    "designProofBoundary": ""
  },
  "plannedSurfaces": [],
  "artifacts": [
    {
      "surfaceName": "",
      "surfaceType": "Data List View form",
      "sourceAppPlanSection": "Custom Data List Forms Plan",
      "sourceResourceName": "",
      "appPlanResourceRef": "Custom Data List Forms Plan > Contracts > Contract View",
      "sourceResourceType": "Data List",
      "sourceListOrFormName": "Contracts",
      "surfaceResponsibility": "Display the current Contract record and explicitly planned related regions.",
      "plannedFieldCoverage": ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms"],
      "requiredFieldsShown": ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms"],
      "optionalFieldsShown": [],
      "missingPlannedFields": [],
      "fieldCoverageStatus": "pass",
      "plannedActions": ["Edit", "Open related record"],
      "actionsShown": ["Edit", "Open related record"],
      "missingRequiredActions": [],
      "actionCoverageStatus": "pass",
      "forbiddenRegionsPresent": [],
      "forbiddenRegionStatus": "pass",
      "surfaceResponsibilityStatus": "pass",
      "appPlanTraceabilityStatus": "pass",
      "designSystemPath": "",
      "applicationLayoutType": "form-surface-no-app-chrome",
      "includeHeaderNavigation": false,
      "layoutFidelityStatus": "pass",
      "visualQualityStatus": "pass",
      "visualUsabilityStatus": "pass",
      "textOverflowStatus": "pass",
      "overlapStatus": "pass",
      "spacingStatus": "pass",
      "mobileUsabilityStatus": "pass",
      "responsiveLayoutEvidence": "Mobile form stacks fields and lower-page regions into single-column sections.",
      "textWrappingStrategy": "Long labels wrap or truncate with ellipsis inside rows/cards/buttons.",
      "containerBoundaryEvidence": "Field labels, table cells, cards, badges, and action chips stay inside reviewed bounds.",
      "visualUsabilityFindings": ["No text overflow, element overlap, clipped content, spacing failure, or mobile layout pressure."],
      "modernVisualQualityChecklist": [],
      "antiPatternCheck": "pass",
      "primaryBusinessObject": "",
      "semanticFieldExamples": [
        { "field": "Contract Title", "value": "MSA-2026 Acme Supplies" },
        { "field": "Contract Owner", "value": "Mira Chen" },
        { "field": "Renewal Date", "value": "2026-08-15" }
      ],
      "fieldValueSemanticsStatus": "pass",
      "businessRegionEvidence": "",
      "lowerPageBusinessRegions": [
        {
          "name": "Approval History",
          "purpose": "Show prior review decisions and comments.",
          "sourceList": "Contract Approval",
          "visualPattern": "Vertical Timeline",
          "plannedYeeflowControl": "Vertical Timeline",
          "renderedExampleCount": 2,
          "renderedExampleSummary": "Timeline event 1: Legal Review, reviewer Nia Patel, decision Approved, comment Terms acceptable, date 2026-06-03. Timeline event 2: Finance Review, reviewer Omar Chen, decision Pending, date 2026-06-05.",
          "displayedBusinessFields": ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
          "displayedFields": ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
          "actionsShown": ["Read-only timeline"],
          "visualConcretenessStatus": "pass",
          "antiPlaceholderStatus": "pass",
          "behavior": "read-only timeline",
          "blueprintMappingHint": "Map to Vertical Timeline events bound to Contract Approval history.",
          "proofImpact": "Blueprint must preserve the approval history section."
        }
      ],
      "formPurposeDifferentiators": [],
      "templateReuseRiskStatus": "pass",
      "pageSpecificQualityEvidence": [],
      "readyForBlueprint": true
    }
  ],
  "deferredSurfaces": []
}
```

## Review Summary

- Application Design System exists and is complete: yes/no
- Every row references the Application Design System: yes/no
- All planned design surfaces covered or deferred: yes/no
- Mobile image or responsive plan reference present for every artifact: yes/no
- Full-page coverage and page end declared for every artifact: yes/no
- Layout fidelity passed for every blueprint-ready artifact: yes/no
- Modern visual quality passed for every blueprint-ready artifact: yes/no
- Visual usability, text overflow, overlap, spacing, and mobile usability passed for every blueprint-ready artifact: yes/no
- Anti-pattern checks passed: yes/no
- Ready for Page Implementation Blueprint stage: yes/no

## Proof Boundary

This manifest proves design-stage coverage and readiness for Page Implementation Blueprint work only. It does not prove Yeeflow resource generation, package/schema validity, signing/API acceptance, install/upgrade success, or runtime behavior.
