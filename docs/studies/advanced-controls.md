# Advanced Controls Export Study

Proof boundary: the schema study is export-backed learning from `/Users/Renger/Downloads/Company Overview (3).yap`. The focused generated runtime package `/Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap` was later user-confirmed for import/open/render and basic interaction checks for the included controls. Raw `.yap`, screenshots, decoded full payloads, `Resource`, `Sign`, API responses, private IDs, private URLs, sample records, generated packages, and secrets are not committed.

## Source And Scope

Repository branch: `codex/advanced-controls-learning`

Export source: `/Users/Renger/Downloads/Company Overview (3).yap`

Studied Dashboard pages: `Tab controls`, `Toggle controls`, and `Additional controls`.

Studied Data List custom form: `Company Overview` / `View page`.

Inspector added: `scripts/inspect-advanced-controls.mjs`. It inventories advanced controls, redacts IDs and URLs, summarizes attrs/style/binding modes, and emits compatibility warnings for ambiguous historical exports.

## Export Inventory

| Surface | Export-proven controls |
| --- | --- |
| Dashboard / Tab controls | 10 Tab containers and 30 Tab items |
| Dashboard / Toggle controls | 5 Toggle containers and 15 Toggle panels |
| Dashboard / Additional controls | Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, QR Code |
| Data List / Company Overview / View page | Steps bar, QR Code, Barcode, Embed, Document embed |

Observed internal types: `aktabs`, `ak-tabs-tab`, `toggle`, `toggle-panel`, `timer`, `icon_list`, `line`, `alert`, `progress`, `gap`, `progress-circle`, `steps-bar`, `list-qrcode`, `barcode`, `embed`, and `document-embed`.

## Control Findings

### Tab

Tab usage is export-proven on the Dashboard page `Tab controls`. A Tab container uses `type = "aktabs"` and contains `ak-tabs-tab` children. Tab item titles are stored on the child `label`; active/default behavior is represented with `attrs.isDefault`, while designer-selected state appears as `attrs.isDesignDefault`. Observed container style variants include `attrs.tabs-tabposition` values for top, left, right, and bottom placement, plus `attrs.item` and `attrs.tabs` settings for icon size, typography, icon placement, justification, and alignment. Nested content can be normal containers or data-bound controls such as Collection.

Generation guidance: use Tab when a dashboard or form needs peer content groups without leaving the page, such as overview/details/history, metrics by department/region, or setup/status/activity.

Validation guidance: generated Tab controls must include stable child Tab items, each item should have a title, and each item should contain a content container or intentional nested controls.

### Toggle

Toggle usage is export-proven on the Dashboard page `Toggle controls`. A Toggle container uses `type = "toggle"` and contains `toggle-panel` children. Section titles are stored under `attrs.title.value` on each panel. Container styling is held under `attrs.caption` and `attrs.general`, including background, border radius, spacing, hover shadow, and typography. Nested content can be containers or data-bound Collection controls. No reliable expanded/collapsed runtime behavior was proven in this branch.

Generation guidance: use Toggle for collapsible detail blocks, FAQ-style sections, optional guidance, and grouped panels that should not dominate the initial viewport.

Validation guidance: generated Toggle controls must include panel children with stable ids, titles, and nested content. Default expanded/collapsed settings should be emitted only when the schema is explicit or runtime-proven.

### Timer

Timer dashboard usage is export-proven from `Additional controls`. Timer controls use `type = "timer"`; the observed configuration stores date/countdown settings under `attrs.set`, with one variant also including `attrs.gen` and `attrs.items`. Dynamic date-field behavior was not observed.

Use cases: SLA countdown, due date, deadline, campaign countdown, and task timer. Generated Timer controls need a static date setting or dynamic date binding that resolves to a date/time value.

### Icon List

Icon list dashboard usage is export-proven from `Additional controls`. Icon list controls use `type = "icon_list"` with observed keys `data`, `gen`, `icon`, and `title`. Icon style includes size and color settings under `attrs.icon`. Item internals are partly opaque in the studied export, so generation should keep icon/text/link item shape warning-first until a focused export captures all item variants.

Use cases: quick links, resource navigation, and compact shortcuts.

### Divider

Divider dashboard usage is export-proven from `Additional controls`. Divider controls use `type = "line"`. Observed settings include `line-width`, `width`, `space`, `sketchpicker`, optional `eletype`, `line-text`, and text styling. Use Divider to separate content blocks or add labeled separators.

### Alert

Alert dashboard usage is export-proven from `Additional controls`. Alert controls use `type = "alert"`. Observed variants include basic alerts plus examples whose labels/types correspond to success, warning, and error states. Settings live mainly under `attrs.alert`, with one variant also using `attrs.title` and `attrs.description`.

Use cases: guidance, warnings, validation messages, risk/status communication, and success confirmations.

### Progress Bar

Progress bar dashboard usage is export-proven from `Additional controls`. Progress bar controls use `type = "progress"` with settings such as `attrs.per`, `attrs.bar`, and `attrs.title`. This export proves static progress configuration. Variable-bound and field-bound progress values remain planning guidance unless a later export/runtime test proves the exact binding shape.

### Spacer

Spacer dashboard usage is export-proven from `Additional controls`. Spacer controls use `type = "gap"` with `attrs.space`, and one variant also uses `attrs.common`. Use Spacer for intentional layout rhythm between sections.

### Progress Circle

Progress circle dashboard usage is export-proven from `Additional controls`. Progress circle controls use `type = "progress-circle"`, with percentage/value settings under `attrs.per` and style variants under `attrs.sty` plus `attrs.common`. Absolute value/max and dynamic bindings remain planning guidance until separately proven.

### Steps Bar

Steps bar dashboard usage is export-proven from `Additional controls`; data-list custom-form usage is export-proven from `Company Overview / View page`. Steps bar controls use `type = "steps-bar"`. Static step labels live in `attrs.steps-options[]` as key/value pairs. Current/past icons use `attrs.current-icon` and `attrs.past-icon`. Layout variants use `attrs.layout`, `attrs.text-posi`, `attrs.indicator`, and `attrs.stepstyle`.

Dashboard examples include variable-bound current step patterns. Data List View page examples include current item/list field bindings via `attrs.current-step.variable[]` with `exprType = "list_field"`, plus `attrs.obj-f` pointing to the bound field. Observed field-bound examples use radio/status-like fields.

Use cases: workflow stage, project phase, approval progress, onboarding progress, implementation stage, or lifecycle status.

### QR Code

QR Code dashboard usage is export-proven from `Additional controls`; Data List View page usage is export-proven from `Company Overview / View page`. QR Code controls use `type = "list-qrcode"`. Observed style settings include `attrs.common`, `attrs.qr-code-size`, and `attrs.qr-code-link`. Some exports omit an explicit value/source, which likely represents host-current URL behavior, but current page/current item/current form URL runtime behavior is not proven here.

Use cases: mobile access, record sharing, public page links, form links, and dashboard/page sharing.

### Barcode

Barcode Data List View page usage is export-proven from `Company Overview / View page`. Barcode controls use `type = "barcode"`. Observed settings include `attrs.value`, `attrs.type`, `attrs.textPosition`, `attrs.displayValue`, `attrs.fallback`, and `attrs.barcode` style. The export includes CODE128A variants and dynamic value binding to a temp variable.

Use cases: asset tags, inventory, ticketing, record references, and scan workflows.

### Embed

Embed Data List View page usage is export-proven from `Company Overview / View page`. Embed controls use `type = "embed"` with iframe/code configuration under `attrs.code`. The normalized refs redact the URL and keep only the configuration shape. Static URL mode is export-proven; dynamic URL mode is not observed in this branch.

Use cases: external reports, maps, external dashboards, docs, and videos when iframe loading is acceptable for the target tenant/security context.

### Document Embed

Document embed Data List View page usage is export-proven from `Company Overview / View page`. Document embed controls use `type = "document-embed"`. The document source is bound through `attrs["doc-source"]` with an expression token using `exprType = "list_field"` and a file-upload-compatible value type. Appearance settings include height and unit values under `attrs.appearance`.

Use cases: contract preview, invoice review, project documents, images, presentations, PDFs, Word files, and PowerPoint files when the record has an attachment/file field.

## Host Comparison

Dashboard-observed in this export: Tab, Toggle, Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, and QR Code.

Data List custom form-observed in this export: Steps bar, QR Code, Barcode, Embed, and Document embed.

Approval Form and Public Form support is product-understanding-backed unless separately export-proven in this branch. Do not generate host-specific runtime claims for Approval Forms or Public Forms from this export alone.

Binding patterns observed: static settings, dashboard temp variables, current item/list field bindings, implicit host URL behavior for QR Code, and iframe/static URL settings for Embed.

## Yeeflow App Builder Guidance

During application planning, consider these controls when they improve navigation, status visibility, record sharing, document review, or dashboard usability. Prefer native controls over custom code for common UI structure: Tabs for peer sections, Toggles for collapsible sections, Divider/Spacer for layout, Alert for communication, Progress controls and Steps bar for status, QR/Barcode for sharing/scanning, Embed for external content, and Document embed for attachment previews.

For generated-final packages, unresolved required bindings, invalid URLs, nonnumeric progress values, unsupported barcode types, unresolved field references, and unsupported host placements should block handoff. Historical exports should warn when the schema is ambiguous or host behavior is implicit.

## Reusable Assets Added

- Inspector: `scripts/inspect-advanced-controls.mjs`
- Normalized refs: `docs/studies/normalized/advanced-controls/*.normalized.json`
- Validator/import-readiness updates: `validate-yap-package.js` and `scripts/inspect-yap-import-readiness.mjs`
- Skill guidance: installed repo skills, active `~/.codex/skills`, and plugin mirror skill docs are updated without rebuilding or tagging the plugin.

## Proof Boundary

- Tab control usage is export-proven from dashboard Tab controls.
- Toggle control usage is export-proven from dashboard Toggle controls.
- Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, and QR Code dashboard usage are export-proven from dashboard Additional controls where observed.
- Steps bar, QR Code, Barcode, Embed, and Document embed data list form usage are export-proven from Company Overview / View page where observed.
- The focused generated package `/Users/Renger/Downloads/advanced-controls-runtime-proof.v1.yap` is user-confirmed runtime-proven for package import, dashboard open, rendering/basic interactions for Tab and Toggle, rendering for Timer, Icon list, Divider, Alert, Progress bar, Spacer, Progress circle, Steps bar, QR Code, Barcode, Embed safe render, Document embed empty state, and absence of missing binding/render/action errors.
- Approval Form/Public Form support is product-understanding-backed unless separately export-proven in this branch.
- QR scan behavior, Barcode scan behavior, external iframe content loading beyond safe render, non-empty document preview, dynamic value changes, and Approval Form/Public Form host behavior are not proven by the runtime package.
