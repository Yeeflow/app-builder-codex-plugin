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
| Selected Yeeflow Application Layout |  |
| Application Design System path |  |
| Application Design System status |  |
| Design System generated before images | yes/no |
| Manifest status | draft / reviewed / ready for blueprint |

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

Every row must reference the Application Design System and the approved App Plan.

| Page/Form Surface Name | Yeeflow Surface Type | Source App Plan Section | Source Resource Name | Application Design System Path | Header/Navigation Included | Canonical Desktop Image Path | Mobile Image Path | Responsive Plan Reference | Image Dimensions | Full-page Coverage Status | Included Sections | Major Planned Controls Shown | Business Data Examples Shown | Page End Included | Deferred/Gap Notes | Ready For Blueprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Dashboard page |  |  |  | yes |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Submission form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Task form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Approval Print page |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Add/Edit form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List View form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Data List Detail form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |
|  | Other Data List custom form |  |  |  | no |  |  |  |  | full-page / complete-design-board / deferred |  |  |  | yes/no |  | yes/no |

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
  "pluginVersion": "0.6.64",
  "sourceFunctionalSpecificationPath": "",
  "sourceAppPlanPath": "",
  "selectedApplicationLayout": "",
  "designSystemPath": "",
  "applicationDesignSystem": {
    "path": "",
    "status": "complete",
    "generatedAt": "",
    "responsivePlan": "",
    "designProofBoundary": ""
  },
  "plannedSurfaces": [],
  "artifacts": [],
  "deferredSurfaces": []
}
```

## Review Summary

- Application Design System exists and is complete: yes/no
- Every row references the Application Design System: yes/no
- All planned design surfaces covered or deferred: yes/no
- Mobile image or responsive plan reference present for every artifact: yes/no
- Full-page coverage and page end declared for every artifact: yes/no
- Ready for Page Implementation Blueprint stage: yes/no

## Proof Boundary

This manifest proves design-stage coverage and readiness for Page Implementation Blueprint work only. It does not prove Yeeflow resource generation, package/schema validity, signing/API acceptance, install/upgrade success, or runtime behavior.
