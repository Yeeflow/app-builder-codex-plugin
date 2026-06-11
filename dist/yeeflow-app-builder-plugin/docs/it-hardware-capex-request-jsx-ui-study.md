# IT Hardware CAPEX Request JSX UI Study

Source files studied read-only:

- `<downloads>/IT Hardware CAPEX Request.md`
- `<downloads>/it_hardware_capex_request_page.jsx`

## JSX Structure

The JSX reference presents a polished enterprise workflow form with:

- sticky top header with Yeeflow identity and Save/Submit actions
- three-column desktop layout: left section navigator, central form body, right workflow/routing panels
- central hero summary card with CAPEX request label, title, explanatory copy, and four metric tiles
- ten rounded section cards with icon, heading, description, and two-column field grid
- right-side workflow route stepper and routing-control explanation panels
- neutral page background, white cards, subtle borders, light shadows, blue primary accents, and violet secondary accents

The visual hierarchy is:

1. App/header context
2. Request summary hero
3. Status/cost/owner/next-step metrics
4. Section navigation and progress
5. Business input cards
6. Workflow and routing reference panels
7. Bottom workflow actions and history in native Yeeflow

## Native Yeeflow Translation

The generated v1 package maps the JSX design into native Yeeflow structures:

| JSX pattern | Yeeflow native approximation |
| --- | --- |
| page shell | `Main` -> `Content` containers |
| central form body | `Form body` container |
| action/footer area | `Form bottom` with `workflowControlPanel` and `workflowHistory` |
| section cards | container cards with heading, description, and grouped controls |
| left navigator | meaningful `nv_label` section naming; visible section cards in form body |
| hero summary | request summary container with metric sub-containers |
| right workflow panels | workflow route and routing controls containers |
| two-column field grid | grouped field containers using native controls; exact responsive grid behavior is approximated |
| badges/chips | heading/text and token-colored metric containers |

## Reproduced Patterns

- Ten business sections in the same order as the Markdown and JSX.
- Card-based section hierarchy with icon, heading, description, and controls.
- Summary panel for status, estimated cost, current owner, and next step.
- Workflow route and routing-control context panels.
- Design-system shell: full-width, zero page padding, `Main`, `Content`, `Form body`, `Form bottom`.
- Meaningful `nv_label` names for sections, panels, metrics, workflow controls, and fields.

## Approximations

- The JSX sticky header and side navigation are not custom-coded; native app navigation and form section cards are used.
- Tailwind/framer-motion effects are not reproduced; native Yeeflow controls and containers are used.
- Exact CSS grid behavior is approximated through Yeeflow container grouping.
- Decorative icons are generated as native icon controls; validator classifies them as schema-supported/unclassified.

## Deferred

- InclusiveGateway conditional routing from the Markdown workflow is deferred to v2.
- File upload, icon upload, and signer persistence are deferred; controls are present on the approval form but not mapped to `ContentList`.
- Native persisted identity, location, and cost-center fields are deferred; v1 persists their display values to Text fields.
- Rich text and checkbox controls are schema-supported but runtime-unproven in this generated pattern.
