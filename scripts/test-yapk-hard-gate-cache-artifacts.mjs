#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const hardGateScripts = [
  "scripts/validate-yapk-id-provenance.mjs",
  "scripts/validate-generated-final-draft-placeholders.mjs",
  "scripts/validate-yapk-navigation-runtime-metadata.mjs",
  "scripts/validate-yapk-upgrade-id-stability.mjs",
  "scripts/validate-dashboard-grid-table-collections.mjs",
  "scripts/generate-ui-contract-from-design.mjs",
  "scripts/capture-runtime-ui-evidence.mjs",
  "scripts/validate-ui-upgrade-scope.mjs",
  "scripts/compare-design-to-runtime-structure.mjs",
  "scripts/inspect-ui-closed-loop-workflow-enforcement.mjs",
  "scripts/inspect-application-layout-design-rules.mjs",
  "scripts/inspect-dashboard-style-shapes.mjs",
  "scripts/inspect-runtime-navigation-proof.mjs",
  "scripts/inspect-supplier-runtime-design-fidelity.mjs",
  "scripts/inspect-full-page-design-artifacts.mjs",
  "scripts/inspect-page-implementation-blueprint.mjs",
  "scripts/compare-blueprint-to-decoded-resource.mjs",
  "scripts/validate-functional-specification.mjs",
  "scripts/validate-app-plan-resource-order.mjs",
  "scripts/validate-page-function-plan.mjs",
  "scripts/validate-dashboard-golden-reference-registry.mjs",
  "scripts/validate-application-design-system.mjs",
  "scripts/validate-app-plan-page-function-traceability.mjs",
  "scripts/test-functional-specification-and-app-plan-gates.mjs",
  "scripts/test-page-function-plan-gates.mjs",
  "scripts/test-dashboard-default-golden-reference-gates.mjs",
  "scripts/test-application-design-system-gates.mjs",
  "scripts/validate-business-clarification-gate.mjs",
  "scripts/validate-generation-readiness-review.mjs",
  "scripts/validate-functional-spec-to-app-plan-traceability.mjs",
  "scripts/test-clarification-readiness-traceability-gates.mjs",
  "scripts/test-app-plan-control-action-property-gates.mjs",
  "scripts/test-business-clarification-and-app-plan-precision-gates.mjs",
  "scripts/test-planning-default-approval-and-exact-type-gates.mjs",
  "scripts/inspect-ui-control-property-fidelity.mjs",
  "scripts/inspect-yeeflow-control-configurations.mjs",
  "scripts/yapk-first-generation-preflight.mjs",
  "scripts/test-generated-final-draft-placeholder-gates.mjs",
  "scripts/test-yapk-id-navigation-hard-gates.mjs",
  "scripts/test-yapk-upgrade-id-stability.mjs",
  "scripts/test-dashboard-grid-table-collections.mjs",
  "scripts/test-ui-closed-loop-phase1.mjs",
  "scripts/test-ui-closed-loop-phase2.mjs",
  "scripts/test-ui-closed-loop-phase3.mjs",
  "scripts/test-ui-closed-loop-phase3b.mjs",
  "scripts/test-application-layout-design-rules.mjs",
  "scripts/test-design-runtime-fidelity-study-hard-gates.mjs",
  "scripts/test-runtime-navigation-proof-gates.mjs",
  "scripts/test-supplier-runtime-design-fidelity-gates.mjs",
  "scripts/test-full-page-design-blueprint-generation-gates.mjs",
  "scripts/test-ui-control-property-fidelity.mjs",
  "scripts/test-yeeflow-control-property-knowledge-base.mjs",
];

for (const sourcePath of hardGateScripts) {
  const distPath = path.join("dist/yeeflow-app-builder-plugin", sourcePath);
  assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `${sourcePath} exists`);
  assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `${distPath} exists for materialized cache smoke`);
  assert.equal(
    fs.readFileSync(path.join(ROOT, distPath), "utf8"),
    fs.readFileSync(path.join(ROOT, sourcePath), "utf8"),
    `${distPath} mirrors ${sourcePath}`,
  );
}

assert.equal(
  fs.readFileSync(path.join(ROOT, "dist/yeeflow-app-builder-plugin/validate-yapk-package.js"), "utf8"),
  fs.readFileSync(path.join(ROOT, "validate-yapk-package.js"), "utf8"),
  "dist/yeeflow-app-builder-plugin/validate-yapk-package.js mirrors validate-yapk-package.js root entrypoint",
);

const requiredDocs = [
  "docs/standards/functional-specification-standard-template.md",
  "docs/standards/app-plan-standard-template.md",
  "docs/standards/page-function-plan-standard-template.md",
  "docs/standards/dashboard-event-portfolio-golden-reference-standard.md",
  "docs/standards/dashboard-golden-reference-selection-standard.md",
  "docs/standards/application-design-system-template.md",
  "docs/standards/yeeflow-application-layout-design-rules.md",
  "docs/standards/runtime-proof-boundary-standard.md",
  "docs/standards/full-page-design-blueprint-generation-standard.md",
  "docs/standards/yeeflow-ui-control-property-fidelity.md",
  "docs/standards/yeeflow-control-property-knowledge-base.md",
  "docs/reference/yeeflow-control-configurations.normalized.json",
  "docs/reference/yeeflow-control-property-extensions.json",
  "docs/reference/dashboard-golden-reference-registry.normalized.json",
  "docs/studies/marketing-event-v045-design-runtime-fidelity-study.md",
];

for (const sourcePath of requiredDocs) {
  const distPath = path.join("dist/yeeflow-app-builder-plugin", sourcePath);
  assert.equal(fs.existsSync(path.join(ROOT, sourcePath)), true, `${sourcePath} exists`);
  assert.equal(fs.existsSync(path.join(ROOT, distPath)), true, `${distPath} exists for materialized cache smoke`);
  assert.equal(
    fs.readFileSync(path.join(ROOT, distPath), "utf8"),
    fs.readFileSync(path.join(ROOT, sourcePath), "utf8"),
    `${distPath} mirrors ${sourcePath}`,
  );
}

const extensionRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/reference/yeeflow-control-property-extensions.json"), "utf8"));
const patternIds = new Set((extensionRegistry.patterns || []).map((pattern) => pattern.id));
for (const patternId of [
  "radio-filter.dropdown.visual-fidelity.180px",
  "relative-period.dropdown.visual-fidelity.180px",
  "icon.filter.native.16px",
  "container.filter-action-row.full-width-space-between",
  "container.filter-group.inline-row",
  "container.action-group.inline-row",
  "container.filter-wrapper.inline-default-height",
  "data-filter.dropdown.owns-fixed-180px-width",
  "control.navigator-label.nv_label",
  "non-container.common.positioning.width-modes",
  "non-container.common.positioning.custom-width",
  "non-container.common.margin-padding",
  "non-container.common.border-normal-hover-shadow",
  "non-container.common.background-classic",
  "non-container.common.background-image",
  "non-container.common.background-gradient-two-color",
  "data-filter.dropdown.runtime-effective-custom-180px-width",
  "kpi-card.container.rich-card",
  "kpi-card.icon-tile.fixed-centered",
  "kpi-card.body.inline-icon-text-stack",
  "kpi-card.summary-value.hierarchy",
  "kpi-card.trend-helper-text.hierarchy",
  "summary.value.no-raw-variable",
  "summary.value.live-data-boundary",
  "summary.text-stack.title-value-trend-helper",
  "table.status.badge-treatment",
  "table.progress.bar-treatment",
  "table.owner.avatar-person-treatment",
  "table.header-row.hierarchy",
  "table.row-density.design-fidelity",
  "container.action-button.add-list-item",
  "container.action-button.fixed-size",
  "container.action-button.child-heading-label",
  "container.action-button.semantic-nv-label",
  "visible-runtime-text.no-raw-variable-names",
  "decoded-resource.visible-text.no-raw-variable-names",
  "runtime-sample-data.users-search.account-id",
  "runtime-sample-data.items-update.user-field",
  "runtime-sample-data.items-batch-create.events",
  "runtime-sample-data.query-verify-retry-backoff",
  "collection.grid-table.root-overflow-hidden",
  "collection.grid-table.header-item-align-center",
  "collection.grid-table.cell-padding-parity",
  "collection.grid-table.progress-column-control",
  "collection.grid-table.dynamic-user-column-control",
  "collection.grid-table.semantic-nv-labels",
  "kpi.value-display.format-number-expression",
  "kpi.value-display.compact-number-kmb",
  "kpi.value-display.fixed-decimal",
  "kpi.value-display.no-raw-long-decimal",
  "kpi.value-display.no-unformatted-large-number",
]) {
  assert.equal(patternIds.has(patternId), true, `${patternId} extension pattern exists`);
}

const uiFidelityInspector = fs.readFileSync(path.join(ROOT, "scripts/inspect-ui-control-property-fidelity.mjs"), "utf8");
for (const findingCode of [
  "SUMMARY_CONTROL_WRAPPER_OBJECT_INVALID",
  "SUMMARY_PIVOT_EXT_MISSING",
  "SUMMARY_PIVOT_SETTINGS_VALUES_MISSING",
  "SUMMARY_COUNT_FIELD_MUST_BE_LISTDATAID",
  "SUMMARY_SAVE_VAR_TOP_LEVEL_MISSING",
  "SUMMARY_SAVE_VAR_ATTRS_MISSING",
  "SUMMARY_HIDDEN_HOST_MISSING",
  "SUMMARY_HIDDEN_HOST_NOT_HIDDEN_ALL_DEVICES",
  "VISIBLE_KPI_VALUE_NOT_BOUND_TO_SUMMARY_TEMP_VAR",
  "DATA_FILTER_EXPECTED_STATIC_TEXT_FOUND",
  "ACTION_CONTAINER_ACTION_TYPE_MISSING",
  "GRID_TABLE_COLUMN_GAP_MISMATCH",
  "COLLECTION_LINK_FORM_UNRESOLVED",
  "PROGRESS_COLUMN_RAW_FORMULA_RENDERED",
  "DYNAMIC_USER_BOUND_TO_NON_USER_FIELD",
  "CONTROL_FIELD_TYPE_INCOMPATIBLE",
]) {
  assert.match(uiFidelityInspector, new RegExp(findingCode), `${findingCode} is enforced by inspect-ui-control-property-fidelity`);
}

const dashboardStyleInspector = fs.readFileSync(path.join(ROOT, "scripts/inspect-dashboard-style-shapes.mjs"), "utf8");
for (const phrase of [
  "DASHBOARD_ROOT_CONTENT_PADDING_INVALID",
  "DATA_LIST_CUSTOM_FORM_ROOT_CONTENT_PADDING_INVALID",
  "attrs.container.cw = \\\"2\\\"",
  "--sp--s0",
  "normalizeDashboardRootContentPadding",
  "normalizeDataListCustomFormRootContentPadding",
]) {
  assert.match(dashboardStyleInspector, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `dashboard style inspector includes root padding gate phrase: ${phrase}`);
}

const supplierFidelityInspector = fs.readFileSync(path.join(ROOT, "scripts/inspect-supplier-runtime-design-fidelity.mjs"), "utf8");
const fullPageDesignInspector = fs.readFileSync(path.join(ROOT, "scripts/inspect-full-page-design-artifacts.mjs"), "utf8");
const pageBlueprintInspector = fs.readFileSync(path.join(ROOT, "scripts/inspect-page-implementation-blueprint.mjs"), "utf8");
const blueprintParityInspector = fs.readFileSync(path.join(ROOT, "scripts/compare-blueprint-to-decoded-resource.mjs"), "utf8");
for (const findingCode of [
  "RUNTIME_LISTSET_ID_MISMATCH",
  "INSTALL_LOG_ID_USED_AS_LISTSET_ID",
  "RUNTIME_URL_NOT_APPLICATION",
  "RUNTIME_PROOF_LANDED_IN_DESIGNER",
  "RUNTIME_PAGE_TITLE_MISSING",
  "DESIGN_SECTION_MISSING",
  "KPI_CARD_COUNT_MISMATCH",
  "PAGE_BACKGROUND_MISMATCH",
  "DESIGN_CHART_SECTION_NOT_IMPLEMENTED",
  "APP_CHROME_STYLE_MIXED",
  "DATA_FILTER_CONTROL_STATIC_TEXT",
  "DATA_FILTER_BINDING_MISSING",
  "DATA_FILTER_FIELD_METADATA_INVALID",
  "DATA_FILTER_VARIABLE_NOT_USED_BY_TARGET_COLLECTION",
  "DATA_FILTER_RUNTIME_CONTROL_NOT_RENDERED",
  "FILTER_ACTION_CONTAINER_WIDTH_NOT_INLINE",
  "FILTER_ACTION_CONTAINER_NV_LABEL_MISSING",
  "FILTER_ACTION_ROW_NOT_CONTAINER_BASED",
  "COLLECTION_DATA_SOURCE_MISMATCH",
  "COLLECTION_LISTSETID_MISSING",
  "COLLECTION_DETAIL_LINK_INVALID",
  "COLLECTION_FILTER_TARGET_MISMATCH",
  "ANALYTICS_CONTROL_APPROXIMATION_USED",
  "ANALYTICS_CONTROL_TYPE_MISMATCH",
  "ANALYTICS_DATA_BINDING_INCOMPLETE",
  "PROGRESS_CONTROL_MISSING",
  "PROGRESS_RENDERED_AS_RAW_TEXT",
  "PROGRESS_STYLE_METADATA_MISSING",
  "SUMMARY_CONTROL_TYPE_INVALID",
  "SUMMARY_PIVOT_METADATA_INCOMPLETE",
  "SUMMARY_COUNT_FIELD_NOT_LISTDATAID",
  "SUMMARY_SOURCE_CONTAINER_VISIBLE",
  "KPI_RAW_VARIABLE_VISIBLE",
  "KPI_VALUE_FORMAT_INVALID",
  "DESIGN_CANONICAL_PNG_MISSING",
  "DESIGN_USES_SVG_AS_CANONICAL",
  "DESIGN_BOARD_USED_AS_PAGE_ARTIFACT",
  "PIXEL_COMPARE_INPUT_NOT_CANONICAL_PNG",
  "APP_GENERATION_STARTED_WITHOUT_PAGE_DESIGN_PNGS",
  "VALIDATION_PROOF_LAYER_COLLAPSED",
  "SCHEMA_PASS_USED_AS_UI_PROOF",
  "API_ACCEPTANCE_USED_AS_RUNTIME_PROOF",
  "CONTROL_BINDING_GRAPH_INCOMPLETE",
  "DECODED_LISTSET_ID_NOT_RUNTIME_URL",
  "DESIGN_CONTROL_MAPPING_MISSING",
  "NAV_ACTIVE_STYLE_METADATA_UNPROVEN",
  "NAV_ACTIVE_STYLE_RUNTIME_PROOF_MISSING",
  "NAV_ACTIVE_BACKGROUND_MISMATCH",
  "NAV_ACTIVE_TEXT_COLOR_MISMATCH",
  "NAV_ACTIVE_BOTTOM_BORDER_MISMATCH",
  "LAYOUTVIEW_CUSTOMCSS_NOT_RUNTIME_INJECTED",
  "CUSTOM_CSS_STYLE_TAG_MISSING",
  "CUSTOM_CSS_SELECTOR_NO_EFFECT",
  "CODEIN_ROOT_CHILD_EXECUTION_RISK",
  "CODEIN_EXPECTED_TO_EXECUTE_NOT_IN_RENDERED_CONTAINER",
  "CODEIN_RUNTIME_NODE_MISSING",
  "STYLE_INJECTOR_TAG_MISSING",
  "STYLE_INJECTOR_SELECTOR_MISSING",
  "STYLE_INJECTOR_SELECTOR_NO_EFFECT",
  "RUNTIME_LAYOUT_CACHE_STALE",
  "FRESH_LOAD_RUNTIME_PROOF_REQUIRED",
  "APP_CHROME_RUNTIME_COMPUTED_STYLE_REQUIRED",
  "PACKAGE_VALID_BUT_RUNTIME_STYLE_FAILED",
  "RUNTIME_DOM_SELECTOR_PROOF_MISSING",
]) {
  assert.match(supplierFidelityInspector, new RegExp(findingCode), `${findingCode} is enforced by inspect-supplier-runtime-design-fidelity`);
}

for (const findingCode of [
  "FULL_PAGE_DESIGN_ARTIFACT_MISSING",
  "CANONICAL_PAGE_DESIGN_NOT_FULL_PAGE",
  "DESIGN_IMAGE_VIEWPORT_CROP_ONLY",
  "DESIGN_IMAGE_MISSING_PLANNED_SECTION",
  "DESIGN_IMAGE_MISSING_TABLE_DETAIL",
  "DESIGN_IMAGE_MISSING_FORM_DETAIL",
  "DESIGN_IMAGE_MISSING_PAGE_END",
  "DESIGN_IMAGE_PLACEHOLDER_REGION_UNRESOLVED",
  "STEP_COMPLETION_EVIDENCE_MISSING",
  "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP",
]) {
  assert.match(fullPageDesignInspector, new RegExp(findingCode), `${findingCode} is enforced by inspect-full-page-design-artifacts`);
}

for (const findingCode of [
  "PAGE_IMPLEMENTATION_BLUEPRINT_MISSING",
  "PAGE_BLUEPRINT_INCOMPLETE",
  "DESIGN_ELEMENT_UNMAPPED_TO_CONTROL",
  "CONTROL_PROPERTY_CONTRACT_INCOMPLETE",
  "CONTROL_PROPERTY_PATH_UNVERIFIED",
  "CONTROL_BINDING_CONTRACT_INCOMPLETE",
  "CONTROL_INTERACTION_CONTRACT_INCOMPLETE",
  "BLUEPRINT_VALIDATION_NOT_RUN",
]) {
  assert.match(pageBlueprintInspector, new RegExp(findingCode), `${findingCode} is enforced by inspect-page-implementation-blueprint`);
}

for (const findingCode of [
  "RESOURCE_BLUEPRINT_PARITY_MISSING",
  "RESOURCE_SECTION_MISSING_FROM_BLUEPRINT",
  "RESOURCE_CONTROL_MISSING_FROM_BLUEPRINT",
  "RESOURCE_CONTROL_TYPE_MISMATCH",
  "RESOURCE_CONTROL_PROPERTY_MISSING",
  "RESOURCE_BINDING_MISSING",
  "RESOURCE_ACTION_MISSING",
  "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP",
]) {
  assert.match(blueprintParityInspector, new RegExp(findingCode), `${findingCode} is enforced by compare-blueprint-to-decoded-resource`);
}

const skillText = fs.readFileSync(path.join(ROOT, "skills/installed/yeeflow-ui-generation-hard-gates/SKILL.md"), "utf8");
for (const phrase of [
  /type: "summary"/,
  /_ak_c/,
  /category = "___Pivot___"/,
  /COUNT (Summary settings|summaries) must use `?ListDataID`?/i,
  /attrs\.common\.hide = \[null, true, true, true\]/,
  /column gap `?0`?/i,
  /resolved collection form links|Collection links must resolve/i,
  /Dynamic user\/person controls (must bind|bound) to User/i,
  /formatNumber/i,
  /Dashboard\/app page root content-area padding is a hard gate/i,
  /attrs\.container\.cw = "2"/,
  /--sp--s0/,
  /Horizontal navigation active-state styling is runtime-sensitive/,
  /ListSet\.LayoutView\.attrs\["navigator-menu"\]/,
  /LayoutView\.customcss/,
  /ak-listset-new-navigation-item\.active/,
  /fresh top-level cache-busted load/,
  /hidden nonvisual `codein` inside a rendered page container/,
  /Full-application generation must follow the full-page design blueprint workflow/,
  /inspect-full-page-design-artifacts\.mjs/,
  /inspect-page-implementation-blueprint\.mjs/,
  /compare-blueprint-to-decoded-resource\.mjs/,
  /viewport mockup/i,
  /product-catalog-backed or extension-backed/i,
]) {
  assert.match(skillText, phrase, `hard-gate skill includes Summary/full-page wording: ${phrase}`);
}

console.log("YAPK hard-gate cache artifact checks passed");
