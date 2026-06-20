# <Application Name> - Application Design System

Use this template as Stage 4 / Step 4 for every Yeeflow application build, after the Functional Specification, Yeeflow App Plan, and Page Function Plan are reviewed and before page/resource generation.

The Application Design System defines the visual and interaction rules that guide later page design, page implementation blueprints, Yeeflow resource generation, decoded resource-vs-blueprint parity, package generation, signing, install/import/upgrade, and runtime proof. It should guide supported Yeeflow page design without inventing unsupported properties. It does not replace the Page Function Plan: the Page Function Plan remains the business/page-function contract for Dashboard pages, Approval submission/task/print forms, Data list forms, and Document library forms. Concrete control, layout, binding, style, and resource JSON decisions belong to the Dashboard Pattern Library / Golden Reference, implementation blueprints, verified Yeeflow standards, and resource generator.

## 1. Design System Status

- Application name:
- Functional Specification path:
- Yeeflow App Plan path:
- Page Function Plan path:
- Selected Yeeflow Application Layout:
- selectedApplicationLayout:
- applicationLayoutType:
- applicationChromeStyleId:
- Planning plugin:
- Plugin version:
- Current status: draft / pending review / approved
- Known blockers:

## 2. Overall Application Visual Style

- Visual style:
- Brand/color intent:
- Tone:
- Accessibility/readability requirements:
- Density intent:
- Unsupported or runtime-proof-required style items:

## 3. Selected Yeeflow Application Layout

Every Application Design System must select exactly one Yeeflow Application Layout for the current app.

Supported layout values:

- `application-layout-1-vertical-nav`
- `application-layout-2-horizontal-nav`
- `application-layout-3-header-nav`
- `application-layout-4-no-nav`

Structured fields:

| Field | Required Value / Intent |
| --- | --- |
| selectedApplicationLayout | <One selected supported layout ID or object containing the selected layout ID> |
| applicationLayoutType | `application-layout-1-vertical-nav` / `application-layout-2-horizontal-nav` / `application-layout-3-header-nav` / `application-layout-4-no-nav` |
| applicationChromeStyleId | <One app-level chrome style ID for the selected layout> |
| headerMode | <Selected layout header behavior> |
| navigationMode | vertical-nav / horizontal-nav / header-nav / no-nav |
| navigationPanelMode | left-panel / horizontal-menu / header-menu / none |
| contentSafeArea | <Where Dashboard/application page content must sit relative to header/navigation chrome> |
| dashboardChromeRules | <Header/navigation/content-safe-area expectations for Dashboard and application pages> |
| formSurfaceChromeRules | <Approval forms and Data list / Document library forms are full form surfaces and do not include application header/navigation unless explicitly supported> |
| applicationChrome | <Structured app-wide Yeeflow shell color, typography, navigator, content-area, design-intent, generated-property, learning-boundary, runtime-proof, and deferred-property settings> |

| Area | Decision | Guidance | App Plan / Page Function Plan Trace |
| --- | --- | --- | --- |
| Application layout | <applicationLayoutType> | <Reason and use> | <Trace> |
| Header | <headerMode> | <Consistency rule> | <Trace> |
| Navigation mode | <navigationMode> | <Consistency rule> | <Trace> |
| Navigation panel | <navigationPanelMode> | <Consistency rule> | <Trace> |
| Content safe area | <contentSafeArea> | <Content region rule> | <Trace> |
| Dashboard chrome | <dashboardChromeRules> | Dashboard/application pages follow selected app header/navigation expectations | <Dashboard Page Function Plan IDs> |
| Form surfaces | <formSurfaceChromeRules> | Approval/data-list/document-library forms are full form surfaces unless plugin standards explicitly support app chrome | <Form Page Function Plan IDs> |

Rules:

- Select exactly one `applicationLayoutType`.
- The selected value must be one of the four supported Yeeflow layouts above.
- Do not invent arbitrary sidebars, custom nav bars, floating nav, custom top bars, unsupported app shells, or page-specific application chrome outside the selected Yeeflow layout.
- Dashboard/application pages must follow the selected layout and include header/navigation/content-safe-area expectations.
- Approval forms and Data list / Document library forms are form surfaces and should not include app header/navigation unless explicitly supported by plugin standards.
- Page Function Plan Dashboard entries must reference or inherit the selected Application Design System layout. They must not select a different application layout per Dashboard page unless the exception is explicitly marked unsupported/deferred with proof boundary.

### 3A. Application Chrome Settings

Use structured `applicationChrome` settings to define the official Yeeflow app-wide header and navigator menu styling for Dashboard/application pages.

```json
{
  "applicationChrome": {
    "designIntent": {
      "header": "Official Yeeflow header visual intent, including desired title/icon treatment. Title typography remains design intent unless an export-proven shell property path exists.",
      "navigatorMenu": "Official Yeeflow navigator visual intent, including default, hover, active, selected, group-label, and icon treatment. Unproven hover/active/selected/title/icon paths stay out of generated properties.",
      "contentArea": "Dashboard/application content background and safe-area intent."
    },
    "header": {
      "backgroundColor": "var(--c--primary-light)",
      "textColor": "var(--c--primary)",
      "iconColor": "var(--c--primary)",
      "titleTypography": "h5-medium",
      "titleFontSize": "var(--fs--h5)",
      "titleFontWeight": "var(--fw--semi-bold)",
      "titleStyle": "medium"
    },
    "navigatorMenu": {
      "backgroundColor": "var(--c--primary)",
      "textColor": "var(--c--primary-light)",
      "iconColor": "var(--c--primary-light)",
      "hoverBackgroundColor": "export-learning-required",
      "hoverTextColor": "export-learning-required",
      "activeBackgroundColor": "runtime-proof-required",
      "activeTextColor": "runtime-proof-required",
      "selectedItemStyle": "runtime-proof-required until exact active-state property path is export-proven",
      "groupLabelStyle": "var(--c--text-normal)"
    },
    "contentArea": {
      "backgroundColor": "var(--c--background)"
    },
    "supportedGeneratedProperties": [
      {
        "path": "LayoutView.attrs.appearance.bgc",
        "value": "var(--c--primary-light)",
        "proofStatus": "plugin-known"
      },
      {
        "path": "LayoutView.attrs.appearance.color",
        "value": "var(--c--primary)",
        "proofStatus": "plugin-known"
      },
      {
        "path": "LayoutView.attrs[\"navigator-menu\"].bgc",
        "value": "var(--c--primary)",
        "proofStatus": "plugin-known"
      },
      {
        "path": "LayoutView.attrs[\"navigator-menu\"].color",
        "value": "var(--c--primary-light)",
        "proofStatus": "plugin-known"
      },
      {
        "path": "LayoutView.attrs[\"navigator-menu\"].position",
        "value": "left",
        "proofStatus": "plugin-known"
      }
    ],
    "exportLearningRequired": [
      {
        "designIntent": "navigatorMenu.hoverBackgroundColor",
        "reason": "Exact hover property path is not export-proven."
      },
      {
        "designIntent": "header.titleTypography",
        "reason": "Exact shell title typography property path is not export-proven."
      }
    ],
    "runtimeProofRequired": [
      {
        "designIntent": "navigatorMenu.activeTextColor",
        "reason": "Computed active-state styling requires runtime proof before generated-resource claims."
      }
    ],
    "deferredProperties": [],
    "propertyMappings": [
      "LayoutView.attrs.appearance.bgc",
      "LayoutView.attrs.appearance.color",
      "LayoutView.attrs[\"navigator-menu\"].bgc",
      "LayoutView.attrs[\"navigator-menu\"].color",
      "LayoutView.attrs[\"navigator-menu\"].position"
    ]
  }
}
```

Required `applicationChrome.header` fields:

- `header.backgroundColor`
- `header.textColor`
- `header.iconColor`
- `header.titleTypography`
- `header.titleFontSize`
- `header.titleFontWeight`
- `header.titleStyle`

Required `applicationChrome.navigatorMenu` fields:

- `navigatorMenu.backgroundColor`
- `navigatorMenu.textColor`
- `navigatorMenu.iconColor`
- `navigatorMenu.hoverBackgroundColor`
- `navigatorMenu.hoverTextColor`
- `navigatorMenu.activeBackgroundColor`
- `navigatorMenu.activeTextColor`
- `navigatorMenu.selectedItemStyle`
- `navigatorMenu.groupLabelStyle`

Required `applicationChrome.contentArea` fields:

- `contentArea.backgroundColor`

Required chrome boundary fields:

- `designIntent`: desired app chrome appearance for header, navigator menu, and content area.
- `supportedGeneratedProperties`: only plugin-known/export-proven Yeeflow shell property paths that resource generation may write.
- `exportLearningRequired`: desired chrome styling whose exact export property path is not proven.
- `runtimeProofRequired`: desired chrome styling that needs runtime/browser proof before generation claims.
- `deferredProperties`: desired chrome styling intentionally deferred from resource generation.

Mapping intent:

- Header background maps to known Yeeflow shell property `LayoutView.attrs.appearance.bgc`.
- Header text/icon color maps to known Yeeflow shell property `LayoutView.attrs.appearance.color`.
- Navigator menu background maps to known Yeeflow shell property `LayoutView.attrs["navigator-menu"].bgc`.
- Navigator menu text/icon color maps to known Yeeflow shell property `LayoutView.attrs["navigator-menu"].color`.
- Navigator menu position maps to known Yeeflow shell property `LayoutView.attrs["navigator-menu"].position`.
- Exact hover and active navigator state property paths are runtime-sensitive. If export-proven property paths are not available, mark hover/active fields as `export-learning-required` or `runtime-proof-required`; do not invent unsupported property paths.

Generated-property boundary:

- Resource generation may only write app shell/chrome property paths listed in `supportedGeneratedProperties`.
- The currently allowed generated chrome paths are `LayoutView.attrs.appearance.bgc`, `LayoutView.attrs.appearance.color`, `LayoutView.attrs["navigator-menu"].bgc`, `LayoutView.attrs["navigator-menu"].color`, and `LayoutView.attrs["navigator-menu"].position`.
- Do not generate arbitrary Header, Navigator, hover, active, selected, title typography, icon, menu style, or custom chrome property paths unless they are present in plugin-contained standards, normalized references, or export-proven property registries.
- Design intent fields such as `header.titleTypography`, `navigatorMenu.hoverBackgroundColor`, `navigatorMenu.activeTextColor`, `navigatorMenu.selectedItemStyle`, and `navigatorMenu.groupLabelStyle` are not generated property proof.
- Unproven hover/active/title/icon/menu styling must stay in `designIntent`, `exportLearningRequired`, `runtimeProofRequired`, or `deferredProperties` and must not be emitted into generated Yeeflow resources.

Token rules:

- Prefer Yeeflow theme tokens and plugin-known style values such as `var(--c--primary-light)`, `var(--c--primary)`, `var(--c--background)`, `var(--c--text)`, and `var(--c--text-normal)`.
- Use supported typography/token values such as `var(--fs--h5)`, `var(--fw--semi-bold)`, or documented heading style values.
- Raw hex values should not be used for app chrome settings unless explicitly justified with a proof boundary.
- For the standard generated shell, use the documented inverse pairing: header background `var(--c--primary-light)`, header text/icon `var(--c--primary)`, navigator background `var(--c--primary)`, and navigator text/icon `var(--c--primary-light)`.

Chrome rules:

- Dashboard/application pages inherit app-wide `applicationChrome` settings.
- Page Function Plan Dashboard entries must not override `applicationChrome` per page unless explicitly marked as an unsupported/deferred exception with proof boundary.
- Approval forms and Data list / Document library forms remain form surfaces and do not include app header/navigation chrome unless explicitly plugin-supported.

## 4. Page Density and Spacing Principles

- Dashboard page density:
- Form page density:
- Card/section spacing:
- Table/list row density:
- Mobile spacing:
- Root padding and inner spacing rules:

## 5. Typography Hierarchy

| Use | Intent | Size / Hierarchy Guidance | Notes |
| --- | --- | --- | --- |
| Page title | <Intent> | <Hierarchy> | <Notes> |
| Section title | <Intent> | <Hierarchy> | <Notes> |
| Field label | <Intent> | <Hierarchy> | <Notes> |
| Table/list content | <Intent> | <Hierarchy> | <Notes> |
| Helper/error text | <Intent> | <Hierarchy> | <Notes> |

## 6. Button and Action Styling Intent

| Action Type | Visual Priority | Placement | State / Feedback | Notes |
| --- | --- | --- | --- | --- |
| Primary submit/action | high | <Placement> | <State> | <Notes> |
| Secondary action | medium | <Placement> | <State> | <Notes> |
| Destructive/reject action | high/caution | <Placement> | <State> | <Notes> |
| Row/item action | contextual | <Placement> | <State> | <Notes> |

## 7. Form Layout Conventions

- Submission form layout:
- Task form layout:
- New/Edit form layout:
- View/detail form layout:
- Print page layout:
- Required/read-only/default/validation display conventions:
- Sub list conventions:
- Document upload/metadata conventions:

## 8. Dashboard, Card, Table, and List Conventions

- KPI/Summary card conventions:
- Filter/action row conventions:
- Data table conventions:
- Collection/Kanban/timeline conventions:
- Related-region conventions:
- Empty/loading/error state conventions:

## 9. Mobile Layout Principles

- Container stacking:
- Grid-to-column behavior:
- Priority content:
- Hidden/shown mobile elements:
- Mobile action placement:
- Table/list mobile handling:
- Print/mobile boundary:

## 10. Cross-Page Consistency Rules

| Rule | Applies To | Rationale | Exceptions |
| --- | --- | --- | --- |
| <Rule> | <Pages/forms> | <Rationale> | <Allowed exceptions> |

## 11. Design-to-Generation Guidance

- How this design system guides page design:
- How this design system guides Page Function Plan implementation:
- How this design system guides page/resource generation:
- How unsupported style requirements are labeled:
- Validation/proof boundary:

Rules:

- Use this design system to keep all generated pages consistent while preserving each page's distinct business purpose.
- Consume the Page Function Plan as the canonical source for page surfaces, Dashboard template/golden-reference selections, form fields, related regions, actions, bindings, desktop/mobile behavior, and App Plan traceability.
- Do not infer Dashboard sections, form fields, related regions, or page actions from the App Plan alone when a Page Function Plan exists.
- Do not introduce later rollback-excluded systems unless already present in the active baseline.
- Do not invent unsupported Yeeflow properties. Unknown style or layout behavior must be marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
