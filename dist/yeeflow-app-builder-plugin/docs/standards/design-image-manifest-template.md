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

| Page/Form Surface Name | Yeeflow Surface Type | Source App Plan Section | Source Resource Name | Application Design System Path | `applicationLayoutType` | `applicationChromeStyleId` | `includeHeaderNavigation` | Layout Chrome Compliance Declaration | `layoutFidelityStatus` | `visualQualityStatus` | Modern Visual Quality Checklist | Anti-pattern Check | Primary Business Object | Semantic Field Examples | `fieldValueSemanticsStatus` | Business Region Evidence | Lower-page Business Regions | Form Purpose Differentiators | `templateReuseRiskStatus` | Page-specific Quality Evidence | Canonical Desktop Image Path | Mobile Image Path | Responsive Plan Reference | Image Dimensions | Full-page Coverage Status | Included Sections | Major Planned Controls Shown | Business Data Examples Shown | Page End Included | Deferred/Gap Notes | Ready For Blueprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Dashboard page |  |  |  | application-layout-1-vertical-nav / application-layout-2-horizontal-nav / application-layout-3-header-nav / application-layout-4-no-nav |  | true |  | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail | n/a | n/a | n/a | n/a | n/a | n/a | n/a |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Submission form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Task form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Print page |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Add/Edit form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List View form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Detail form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Other Data List custom form |  |  |  | form-surface-no-app-chrome |  | false | form surface uses Application Design System without app chrome | pass / human_review_required / deferred | pass / human_review_required / deferred |  | pass / fail |  |  | pass / human_review_required / fail / deferred |  |  |  | pass / warning / fail / human_review_required |  |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |

`readyForBlueprint: true` is allowed only when `layoutFidelityStatus` and `visualQualityStatus` are both passing, the anti-pattern check passes, and form/detail semantic quality gates pass where applicable. Human-review-required, unknown, deferred, or failed layout/quality/semantic states must block blueprint readiness unless the surface is explicitly deferred with reason, fallback, and proof impact.

For Approval and Data List form/detail rows:

- `semanticFieldExamples` must include realistic field/value pairs, such as `Contract Title = MSA-2026 Acme Supplies`, `Contract Owner = Mira Chen`, and `Renewal Date = 2026-08-15`.
- Field labels and values must match business semantics. Do not put lifecycle statuses in title/name fields, task/status labels in owner/person fields, document filenames in date fields, person/vendor names in status fields, review comments in document/evidence fields, or status labels in related-record fields.
- `lowerPageBusinessRegions` must include at least one meaningful business region with name, purpose, source list/data source, displayed fields/items, action or read-only behavior, and proof impact.
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
      "designSystemPath": "",
      "applicationLayoutType": "form-surface-no-app-chrome",
      "includeHeaderNavigation": false,
      "layoutFidelityStatus": "pass",
      "visualQualityStatus": "pass",
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
          "displayedFields": ["Step", "Reviewer", "Decision", "Comment", "Decision date"],
          "behavior": "read-only timeline",
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
- Anti-pattern checks passed: yes/no
- Ready for Page Implementation Blueprint stage: yes/no

## Proof Boundary

This manifest proves design-stage coverage and readiness for Page Implementation Blueprint work only. It does not prove Yeeflow resource generation, package/schema validity, signing/API acceptance, install/upgrade success, or runtime behavior.
