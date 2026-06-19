# UI Surface Contract Template

Use this template after the approved Functional Specification, Yeeflow App Plan, Business Clarification Gate for generation, Generation Readiness final check, and Application Design System are complete.

The UI Surface Contract is the primary implementation contract for complex business application UI. It sits between the App Plan/Application Design System and high-fidelity HTML previews. PNG screenshots are evidence generated from validated HTML previews; they are not the source of truth.

The HTML-first workflow inherits every existing Full-page Canonical Design Artifact gate. It must not replace or bypass the canonical design-stage requirements. All requirements previously applied to generated design images now apply to UI Surface Contracts and HTML previews before screenshots and Page Implementation Blueprints.

This stage must not generate `.yap` or `.yapk` packages, sign packages, install/import/upgrade apps, or run live Yeeflow writes.

## Contract Header

| Field | Value |
| --- | --- |
| `applicationName` |  |
| `surfaceId` |  |
| `surfaceName` |  |
| `surfaceType` | Dashboard page / Approval Submission form / Approval Task form / Approval Print page / Data List New/Edit form / Data List View form / Data List Detail form / Document Library New/Edit form / Document Library View form |
| `appPlanResourceRef` |  |
| `sourceResourceType` |  |
| `sourceResourceName` |  |
| `sourceListOrFormName` |  |
| `surfaceResponsibility` |  |
| `businessPurpose` |  |
| `primaryUserRole` |  |
| `dataSource` |  |
| `designSystemRef` |  |
| `uiPatternTemplateRef` |  |
| `applicationLayoutType` | Official dashboard layout ID or `form-surface-no-app-chrome` for form surfaces |
| `includeHeaderNavigation` | `true` for Dashboard pages; `false` for Approval/Data List/Document form surfaces |
| `readyForBlueprint` | `true` only when all inherited design-stage gates pass |
| `proofBoundary` | UI Surface Contract validation proves design-contract readiness only; it does not prove package validity, signing/API acceptance, install/upgrade success, or runtime rendering. |

## Field Contract

| Field Group | Required Fields | Optional Fields | Read-only Fields | Editable Fields | Exact Yeeflow Type/Control Mapping | Notes |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

Required JSON fields:

- `fieldGroups`
- `requiredFields`
- `optionalFields`
- `readOnlyFields`
- `editableFields`
- `fieldTypeMapping`

## Action Contract

| Action Name | Required/Optional | Surface Responsibility | Trigger Location | Current Item/Row Context | Proof/Deferral |
| --- | --- | --- | --- | --- | --- |
|  | required |  |  |  |  |

Required JSON fields:

- `requiredActions`
- `optionalActions`

## Region Contract

| Region Name | Allowed/Forbidden/Related | Source List/Data Source | Control Pattern | Required Fields | Actions | App Plan Traceability |
| --- | --- | --- | --- | --- | --- | --- |
|  | allowed |  |  |  |  |  |

Required JSON fields:

- `forbiddenRegions`
- `allowedRegions`
- `relatedRegions`
- `subListRequirements`
- `controlMapping`

Approval Submission forms must represent planned line-item/document rows as Sub List requirements when the App Plan requires submission-time rows. Do not substitute generic lower-page tables for planned Sub List controls.

## Responsive And HTML Preview Contract

| Field | Value |
| --- | --- |
| `responsiveRules` |  |
| `htmlPreviewRequirements` |  |
| `screenshotEvidenceRequirements` |  |
| `blueprintRequirements` |  |
| `visualQualityRequirements` |  |

The HTML preview must be generated from this contract and the Application Design System. It must use approved UI pattern templates and design-system tokens/classes. It must render desktop and mobile variants and provide screenshot evidence generated from the HTML preview.

## Inherited Full-page Design Gates

Every UI Surface Contract and HTML preview must preserve these existing Full-page Canonical Design Artifact gates:

- Application Design System must be generated before UI surfaces.
- One official Yeeflow application layout must be selected for Dashboard pages.
- Dashboard HTML previews must include official header/navigation chrome.
- Approval, Data List, and Document form previews must be complete form surfaces without application chrome.
- Every required surface from the approved App Plan must be covered, including Dashboard pages, Approval Submission/Task/Print pages, Data List New/Edit/View/Detail/custom forms, and Document Library New/Edit/View/detail forms.
- Form Reports remain standalone Yeeflow resources and are not required as UI design surfaces unless explicitly planned as visible pages.
- Every surface must have desktop and mobile HTML/screenshot evidence or an allowed responsive reference.
- Every surface must be full-page/complete, not viewport-only, and must show page-end/completeness evidence.
- Modern visual quality, surface responsibility, App Plan field/action coverage, forbidden-region checks, semantic consistency, lower-page visual concreteness, visual usability, text overflow, overlap, spacing, mobile pressure, clipping, and template reuse risk must pass.
- `readyForBlueprint: true` is blocked unless every inherited gate passes or is explicitly deferred with reason, fallback, and proof impact.

Required inherited status JSON fields when `readyForBlueprint` is true:

- `layoutFidelityStatus`
- `modernVisualQualityStatus`
- `surfaceResponsibilityStatus`
- `fieldCoverageStatus`
- `actionCoverageStatus`
- `forbiddenRegionStatus`
- `semanticConsistencyStatus`
- `lowerPageVisualConcretenessStatus`
- `visualUsabilityStatus`
- `textOverflowStatus`
- `overlapStatus`
- `spacingStatus`
- `mobileUsabilityStatus`
- `templateReuseRiskStatus`
- `fullPageCoverageStatus`
- `pageEndStatus`
- `appPlanTraceabilityStatus`

## Surface Responsibility Rules

- Approval Submission forms must include editable submission fields, planned Sub List controls, Save as draft, and Submit. Route preview, audit activity, workflow history, duplicated hero/title cards, generic analytics, reviewer-only decision regions, and logic-only required-document checklists are forbidden unless explicitly planned as visible UI.
- Approval Task forms must include task context, read-only request context, reviewer/task fields, and Approve/Reject or Complete actions according to workflow task type.
- Approval Print pages must be read-only and print-oriented. Editable inputs, Save/Submit/Approve/Reject buttons, filters, analytics, and dashboard controls are forbidden.
- Data List New/Edit forms must include the current list's App Plan add/edit fields and Save/Cancel or Save/Submit actions. Collection, Data filters, Data analytics, Kanban, Timeline, audit activity, approval route preview, and unrelated document/task/approval regions are forbidden unless explicitly planned.
- Data List View/Detail forms must show current-record display fields and only App Plan-mapped related regions/actions.
- Document Library New/Edit forms must include file upload/file fields, document metadata, linked record context, status, notes, and Save/Cancel or Upload/Save actions.
- Document Library View forms must include document/file preview or open/download behavior, document metadata, linked record context, and planned document actions.
- Dashboard pages must include planned KPI/Summary, analytics, filters, record display controls, actions, and layout/chrome responsibilities.

## JSON Shape

```json
{
  "applicationName": "",
  "surfaceId": "",
  "surfaceName": "",
  "surfaceType": "",
  "appPlanResourceRef": "",
  "sourceResourceType": "",
  "sourceResourceName": "",
  "sourceListOrFormName": "",
  "surfaceResponsibility": "",
  "businessPurpose": "",
  "primaryUserRole": "",
  "dataSource": "",
  "fieldGroups": [],
  "requiredFields": [],
  "optionalFields": [],
  "readOnlyFields": [],
  "editableFields": [],
  "fieldTypeMapping": {},
  "requiredActions": [],
  "optionalActions": [],
  "forbiddenRegions": [],
  "allowedRegions": [],
  "relatedRegions": [],
  "subListRequirements": [],
  "controlMapping": [],
  "responsiveRules": "",
  "htmlPreviewRequirements": "",
  "screenshotEvidenceRequirements": {},
  "blueprintRequirements": "",
  "designSystemRef": "",
  "uiPatternTemplateRef": "",
  "applicationLayoutType": "",
  "includeHeaderNavigation": false,
  "visualQualityRequirements": [],
  "readyForBlueprint": false,
  "layoutFidelityStatus": "",
  "modernVisualQualityStatus": "",
  "surfaceResponsibilityStatus": "",
  "fieldCoverageStatus": "",
  "actionCoverageStatus": "",
  "forbiddenRegionStatus": "",
  "semanticConsistencyStatus": "",
  "lowerPageVisualConcretenessStatus": "",
  "visualUsabilityStatus": "",
  "textOverflowStatus": "",
  "overlapStatus": "",
  "spacingStatus": "",
  "mobileUsabilityStatus": "",
  "templateReuseRiskStatus": "",
  "fullPageCoverageStatus": "",
  "pageEndStatus": "",
  "appPlanTraceabilityStatus": "",
  "proofBoundary": "UI Surface Contract validation proves design-contract readiness only."
}
```

Run:

```sh
node scripts/validate-ui-surface-contracts.mjs --contracts <dir-or-json> --app-plan <app-plan.md> --design-system <application-design-system.md>
```

## HTML-to-Yeeflow Control Mapping Requirements

Every blueprint-ready UI Surface Contract must include a `controlMapping` array that can be validated against `docs/standards/html-to-yeeflow-control-mapping-registry.md` and the control-mapped HTML preview. The mapping must be specific enough that Page Implementation Blueprints can be generated without visually guessing HTML structure.

Each `controlMapping` entry must include, when applicable:

| Field | Requirement |
| --- | --- |
| `controlId` | Stable contract control identifier. |
| `blueprintId` | Stable ID that must appear as `data-blueprint-id` in HTML and as a Blueprint control ID. |
| `htmlSelector` or `htmlDataSelector` | Selector or data selector that identifies the HTML element. Prefer `[data-blueprint-id="..."]`. |
| `yeeflowControl` | Registered mapping from the Control Mapping Registry. |
| `controlRole` | Field, action, list-region, layout, display, helper, or runtime. |
| `sourceResource` | App Plan resource source when data-backed. |
| `sourceList` | Data List, Document Library, Approval form, or parent source. |
| `fieldId` / `fieldName` / `fieldType` | Required for field-backed controls. Must match App Plan and HTML metadata. |
| `binding` | Exact current-record, field, variable, or parent binding. |
| `required` / `readonly` / `defaultValue` / `validationRules` | Field state and validation contract. |
| `actionId` / `actionType` / `actionContract` | Required for action controls. |
| `rowContext` / `parentBinding` | Required for Sub List, Collection, Kanban, Timeline, and current-item actions. |
| `styleToken` / `layoutToken` / `responsiveToken` | Design-system tokens that must be preserved by HTML and Blueprint. |
| `supportedStatus` | `validator-backed`, `plugin-known`, `export-proven`, `runtime-proof-required`, `export-learning-required`, or `deferred`. |
| `proofBoundary` | Mapping proof boundary. |

Unknown `yeeflowControl` values must fail unless marked `export-learning-required`, `runtime-proof-required`, or `deferred` with reason, fallback, and proof impact. Hidden/helper controls are allowed only when explicitly declared in the contract and marked as helper/runtime controls. Arbitrary CSS is not Yeeflow style proof; implementation style intent must use design-system tokens.
