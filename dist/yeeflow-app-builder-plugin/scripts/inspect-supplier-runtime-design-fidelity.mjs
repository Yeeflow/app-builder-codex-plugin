#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { addFinding, isObject, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.package && !args.designManifest && !args.runtimeProof)) usage(args.help ? 0 : 1);
  const report = inspectSupplierRuntimeDesignFidelity(args);
  const output = args.format === "markdown" ? formatMarkdown(report) : JSON.stringify(report, null, 2);
  console.log(output);
  process.exit(report.status === "pass" || (!args.strict && report.status === "warning") ? 0 : 1);
}

export function inspectSupplierRuntimeDesignFidelity({
  package: packagePath,
  designManifest: designManifestPath,
  runtimeProof: runtimeProofPath,
  strict = true,
} = {}) {
  const findings = [];
  const pkg = packagePath ? readOptionalJson(packagePath, findings, "SUPPLIER_PACKAGE_READ_FAILED") : {};
  const designManifest = designManifestPath ? readOptionalJson(designManifestPath, findings, "DESIGN_MANIFEST_READ_FAILED") : pkg.designImageManifest;
  const runtimeProof = runtimeProofPath ? readOptionalJson(runtimeProofPath, findings, "RUNTIME_PROOF_READ_FAILED") : pkg.runtimeProof;
  const supplier = isObject(pkg.supplierFidelity) ? pkg.supplierFidelity : pkg;

  validateProofLayers(pkg, supplier, runtimeProof || supplier.runtimeProof, findings);
  validateRuntimeProof(runtimeProof || supplier.runtimeProof, supplier, findings);
  validateDesignImplementation(supplier.design || supplier.designContract, supplier.implementation || supplier, findings);
  validateFilters(supplier.filters || supplier.implementation?.filters, findings);
  validateFilterActionRows(supplier.filterActionRows || supplier.implementation?.filterActionRows, findings);
  validateCollections(supplier.collections || supplier.implementation?.collections, supplier.inventory || supplier.packageInventory, findings);
  validateAnalytics(supplier.analytics || supplier.implementation?.analytics, supplier.design?.charts || [], findings);
  validateProgress(supplier.progressColumns || supplier.implementation?.progressColumns, findings);
  validateSummaryKpi(supplier.summaries || supplier.implementation?.summaries, supplier.kpis || supplier.implementation?.kpis, findings);
  validateNavigationActiveStyle(supplier.navigationActiveStyle || supplier.implementation?.navigationActiveStyle || supplier.appChrome?.navigationActiveStyle, runtimeProof || supplier.runtimeProof, findings);
  validateDesignManifest(designManifest, supplier.plan || supplier.appPlan || supplier.designPlan, supplier.pixelCompare || supplier.runtimeComparison, findings, { strict });

  return {
    status: statusFromFindings(findings),
    package: safePath(packagePath),
    designManifest: safePath(designManifestPath),
    runtimeProof: safePath(runtimeProofPath),
    findings,
  };
}

function validateRuntimeProof(proof, supplier, findings) {
  if (!proof) return;
  const expectedAppId = scalar(proof.expectedAppId || proof.AppID || supplier?.expectedAppId || "41");
  const expectedListSetId = scalar(proof.expectedListSetId || proof.installedListSetId || supplier?.expectedListSetId || supplier?.ListSetID);
  const decodedListSetId = scalar(proof.decodedListSetId || proof.decodedListSetID || supplier?.decodedListSetId || supplier?.decodedListSetID);
  const finalUrl = scalar(proof.finalUrl || proof.url || proof.runtimeUrl);
  const pageTitle = scalar(proof.pageTitle || proof.runtimePageTitle || proof.title);
  const installLogIds = asArray(proof.installLogIds || proof.operationIds || proof.installOperationIds).map(scalar).filter(Boolean);
  const runtimeUrlListSetId = parseRuntimeListSetId(finalUrl);

  if (finalUrl && /#\/(?:$|designer|admin|login|app-designer|workflow-designer)/i.test(finalUrl)) {
    addFinding(findings, "error", "RUNTIME_PROOF_LANDED_IN_DESIGNER", "Runtime proof landed on root, designer, admin, or login route instead of the application runtime URL.");
  }
  if (finalUrl && !finalUrl.includes("#/list-set/")) {
    addFinding(findings, "error", "RUNTIME_URL_NOT_APPLICATION", "Runtime proof URL must use #/list-set/{AppID}/{ListSetID}.");
  }
  if (expectedAppId && expectedListSetId) {
    const expectedFragment = `#/list-set/${expectedAppId}/${expectedListSetId}`;
    if (!finalUrl.includes(expectedFragment)) {
      addFinding(findings, "error", "RUNTIME_LISTSET_ID_MISMATCH", "Runtime proof must use the installed application ListSetID, not a log, operation, or unrelated ListSetID.", {
        expected: expectedFragment,
      });
    }
  }
  if (decodedListSetId && runtimeUrlListSetId && decodedListSetId !== runtimeUrlListSetId) {
    addFinding(findings, "error", "DECODED_LISTSET_ID_NOT_RUNTIME_URL", "Runtime browser proof must use the decoded installed ListSetID URL, not an install log ID or unrelated ListSetID.", {
      decodedListSetId,
      runtimeUrlListSetId,
    });
  }
  if (installLogIds.some((id) => id && finalUrl.includes(id))) {
    addFinding(findings, "error", "INSTALL_LOG_ID_USED_AS_LISTSET_ID", "Install or upgrade operation IDs must not be used as the runtime ListSetID.");
  }
  if (!pageTitle) {
    addFinding(findings, "error", "RUNTIME_PAGE_TITLE_MISSING", "Runtime proof must record the landed application page title.");
  }
}

function validateProofLayers(pkg, supplier, proof, findings) {
  const report = firstObject(supplier.validationReport, supplier.finalReport, pkg.validationReport, pkg.finalReport);
  const layers = firstObject(supplier.proofLayers, pkg.proofLayers, report?.proofLayers, report?.layers);
  const requiresLayeredProof = Boolean(
    supplier.requiresLayeredProof ||
    supplier.plan?.requiresLayeredProof ||
    supplier.appPlan?.requiresLayeredProof ||
    report?.requiresLayeredProof ||
    layers ||
    report?.overallStatus ||
    report?.genericPass,
  );
  if (!requiresLayeredProof) return;

  const requiredLayers = [
    "schemaValidation",
    "appPlanConformance",
    "designContractValidation",
    "controlBindingValidation",
    "exactMetadataShapeValidation",
    "idStabilityValidation",
    "signVerify",
    "installOrUpgrade",
    "runtimeBrowserProof",
    "pixelComparison",
  ];

  if (!isObject(layers)) {
    addFinding(findings, "error", "VALIDATION_PROOF_LAYER_COLLAPSED", "Final validation reports must separate schema, design, control-binding, metadata-shape, ID stability, signing, install/upgrade, runtime browser, and pixel-comparison proof layers.");
  } else {
    for (const layer of requiredLayers) {
      if (!(layer in layers)) {
        addFinding(findings, "error", "VALIDATION_PROOF_LAYER_COLLAPSED", "Final validation reports must not collapse required proof layers into one generic pass.", { missingLayer: layer });
      }
    }
  }

  const schemaPassed = layerPassed(layers?.schemaValidation);
  const signPassed = layerPassed(layers?.signVerify);
  const installPassed = layerPassed(layers?.installOrUpgrade);
  const designLayer = layers?.designContractValidation;
  const controlLayer = layers?.controlBindingValidation;
  const runtimeLayer = layers?.runtimeBrowserProof;
  const pixelLayer = layers?.pixelComparison;

  if ((report?.genericPass === true || report?.proofLayersCollapsed === true || report?.overallStatus === "pass") && (!isObject(layers) || requiredLayers.some((layer) => !(layer in layers)))) {
    addFinding(findings, "error", "VALIDATION_PROOF_LAYER_COLLAPSED", "A generic pass cannot stand in for separate schema/sign/runtime/pixel proof layers.");
  }
  if (schemaPassed && (!layerPassed(designLayer) || !layerPassed(controlLayer) || !layerPassed(runtimeLayer) || !layerPassed(pixelLayer))) {
    addFinding(findings, "error", "SCHEMA_PASS_USED_AS_UI_PROOF", "Package/schema validation does not prove design, control binding, runtime, or pixel correctness.");
  }
  if ((signPassed || installPassed || report?.runtimeProofSource === "api-acceptance") && !layerPassed(runtimeLayer)) {
    addFinding(findings, "error", "API_ACCEPTANCE_USED_AS_RUNTIME_PROOF", "Signing, install, or upgrade API acceptance does not prove runtime browser correctness.");
  }
  if (!layerPassed(controlLayer) || layerIncomplete(controlLayer)) {
    addFinding(findings, "error", "CONTROL_BINDING_GRAPH_INCOMPLETE", "Full E2E generation must validate the control binding graph before signing or installing.");
  }
  if (!layerPassed(designLayer) || layerIncomplete(designLayer)) {
    addFinding(findings, "error", "DESIGN_CONTROL_MAPPING_MISSING", "Design sections and controls must be mapped to implementation controls before signing or installing.");
  }

  const decodedListSetId = scalar(layers?.idStabilityValidation?.decodedListSetId || proof?.decodedListSetId || supplier.decodedListSetId);
  const runtimeUrl = scalar(layers?.runtimeBrowserProof?.runtimeUrl || layers?.runtimeBrowserProof?.finalUrl || proof?.finalUrl || proof?.runtimeUrl);
  const runtimeUrlListSetId = parseRuntimeListSetId(runtimeUrl);
  if (decodedListSetId && runtimeUrlListSetId && decodedListSetId !== runtimeUrlListSetId) {
    addFinding(findings, "error", "DECODED_LISTSET_ID_NOT_RUNTIME_URL", "Decoded ListSetID must match the browser runtime URL ListSetID.");
  }
}

function validateDesignImplementation(design = {}, impl = {}, findings) {
  const designSections = asArray(design.sections).map(normalizeName).filter(Boolean);
  const implSections = new Set(asArray(impl.sections).map(normalizeName).filter(Boolean));
  for (const section of designSections) {
    if (!implSections.has(section)) {
      addFinding(findings, "error", "DESIGN_SECTION_MISSING", "Every design section must map to implementation controls.", { section });
      addFinding(findings, "error", "DESIGN_CONTROL_MAPPING_MISSING", "Design sections and controls must be mapped to implementation controls before signing or installing.", { section });
    }
  }

  const designKpis = asArray(design.kpis).map(normalizeName).filter(Boolean);
  const implKpis = asArray(impl.kpis).map((kpi) => normalizeName(kpi.label || kpi.title || kpi.name || kpi)).filter(Boolean);
  if (designKpis.length && (designKpis.length !== implKpis.length || designKpis.some((label) => !implKpis.includes(label)))) {
    addFinding(findings, "error", "KPI_CARD_COUNT_MISMATCH", "KPI card count and core labels must match the page design/spec.", {
      expectedCount: designKpis.length,
      actualCount: implKpis.length,
    });
  }

  if (design.background && impl.background && normalizeName(design.background) !== normalizeName(impl.background)) {
    addFinding(findings, "error", "PAGE_BACKGROUND_MISMATCH", "Implemented page background must match the design background when specified.");
  }

  const implCharts = asArray(impl.analytics || impl.charts);
  for (const chart of asArray(design.charts)) {
    const title = normalizeName(chart.title || chart.name);
    const expectedType = normalizeControlType(chart.type || chart.controlType);
    const actual = implCharts.find((candidate) => normalizeName(candidate.title || candidate.name) === title);
    if (!actual) {
      addFinding(findings, "error", "DESIGN_CHART_SECTION_NOT_IMPLEMENTED", "Required chart/table/filter sections from the design must not be dropped.", { chart: title });
      addFinding(findings, "error", "DESIGN_CONTROL_MAPPING_MISSING", "Design sections and controls must be mapped to implementation controls before signing or installing.", { chart: title });
    } else if (expectedType && normalizeControlType(actual.controlType || actual.type) !== expectedType) {
      addFinding(findings, "error", "ANALYTICS_CONTROL_TYPE_MISMATCH", "Analytics control type must match the design/spec.", { chart: title });
    }
  }

  const chromeStyles = new Set(asArray(impl.pages).map((page) => scalar(page.chromeStyle || page.applicationChromeStyleId || page.layoutChrome)).filter(Boolean));
  if (chromeStyles.size > 1) {
    addFinding(findings, "error", "APP_CHROME_STYLE_MIXED", "Selected Yeeflow application chrome/layout style must remain consistent across pages.");
  }
}

function validateFilters(filters = [], findings) {
  for (const filter of asArray(filters)) {
    const type = normalizeControlType(filter.controlType || filter.type);
    if (["text", "heading", "label"].includes(type)) {
      addFinding(findings, "error", "DATA_FILTER_CONTROL_STATIC_TEXT", "Static Text/Heading controls cannot satisfy filter requirements.", { filter: safeLabel(filter) });
    }
    const meta = filter.data || filter.binding || filter.attrs?.data || {};
    if (!filter.filterVariable && !filter.variable && !filter.bindingVariable) {
      addFinding(findings, "error", "DATA_FILTER_BINDING_MISSING", "Data filters must include page filter variable or equivalent runtime binding metadata.", { filter: safeLabel(filter) });
    }
    if (!hasAll(meta, ["AppID", "ListSetID", "ListID"]) || !hasFieldMetadata(filter.field || meta.field || filter.attrs?.field)) {
      addFinding(findings, "error", "DATA_FILTER_FIELD_METADATA_INVALID", "Data filters must reference valid AppID, ListSetID, ListID, and field metadata.", { filter: safeLabel(filter) });
    }
    if (filter.requiresDisplayValueFields && !(filter.displayField || filter.display_f) || filter.requiresDisplayValueFields && !(filter.valueField || filter.value_f)) {
      addFinding(findings, "error", "DATA_FILTER_FIELD_METADATA_INVALID", "List-backed filters must include display/value field metadata when applicable.", { filter: safeLabel(filter) });
    }
    if (filter.targetCollection && !asArray(filter.targetCollection.consumedFilterVariables).includes(filter.filterVariable || filter.variable)) {
      addFinding(findings, "error", "DATA_FILTER_VARIABLE_NOT_USED_BY_TARGET_COLLECTION", "Target collections/tables must consume intended filter variables.", { filter: safeLabel(filter) });
    }
    if (filter.runtimeRendered === false) {
      addFinding(findings, "error", "DATA_FILTER_RUNTIME_CONTROL_NOT_RENDERED", "Runtime evidence must show expected filter controls rendered.", { filter: safeLabel(filter) });
    }
  }
}

function validateFilterActionRows(rows = [], findings) {
  for (const row of asArray(rows)) {
    if (normalizeControlType(row.controlType || row.type) !== "container") {
      addFinding(findings, "error", "FILTER_ACTION_ROW_NOT_CONTAINER_BASED", "Filter/action rows must be Container-based, not loose static controls.", { row: safeLabel(row) });
    }
    for (const container of [row, ...asArray(row.groups)]) {
      if (!scalar(container.nv_label || container.nvLabel)) {
        addFinding(findings, "error", "FILTER_ACTION_CONTAINER_NV_LABEL_MISSING", "Important filter/action containers need semantic nv_label.", { row: safeLabel(container) });
      }
      const role = scalar(container.role || container.groupRole).toLowerCase();
      const widthMode = scalar(container.widthMode || container.attrs?.style?.widthtype || container.attrs?.common?.positioning?.widthtype?.[1] || container.attrs?.common?.positioning?.widthtype);
      if (role.includes("group") && !["2", "inline"].includes(widthMode)) {
        addFinding(findings, "error", "FILTER_ACTION_CONTAINER_WIDTH_NOT_INLINE", "Filter/action group containers should use proven inline behavior.", { row: safeLabel(container) });
      }
    }
  }
}

function validateCollections(collections = [], inventory = {}, findings) {
  const lists = new Map(asArray(inventory.lists || inventory.Lists || inventory.children).map((list) => [scalar(list.ListID || list.id), list]));
  for (const collection of asArray(collections)) {
    const list = collection.data?.list || collection.attrs?.data?.list || collection.list || {};
    const inventoryList = lists.get(scalar(list.ListID));
    if (!scalar(list.ListSetID)) {
      addFinding(findings, "error", "COLLECTION_LISTSETID_MISSING", "Collection attrs.data.list must include ListSetID.");
    }
    if (!inventoryList || !listMatchesInventory(list, inventoryList)) {
      addFinding(findings, "error", "COLLECTION_DATA_SOURCE_MISMATCH", "Collection attrs.data.list must match package inventory by AppID, ListSetID, ListID, Type, and Title.", { collection: safeLabel(collection) });
    }
    if (!collection.detailLinkResolved || collection.detailLinkRawIdOnly || !scalar(collection.detailLink || collection.data?.link || collection.attrs?.data?.link)) {
      addFinding(findings, "error", "COLLECTION_DETAIL_LINK_INVALID", "Collection row detail links must resolve to a valid form/layout choice.", { collection: safeLabel(collection) });
    }
    if (collection.filterTargetListID && scalar(collection.filterTargetListID) !== scalar(list.ListID)) {
      addFinding(findings, "error", "COLLECTION_FILTER_TARGET_MISMATCH", "Collection filter expressions must target the correct list.", { collection: safeLabel(collection) });
    }
  }
}

function validateAnalytics(analytics = [], designCharts = [], findings) {
  const expected = asArray(designCharts);
  for (const chart of expected) {
    const title = normalizeName(chart.title || chart.name);
    const actual = asArray(analytics).find((candidate) => normalizeName(candidate.title || candidate.name) === title);
    if (actual?.approximation === true || actual?.staticApproximation === true) {
      addFinding(findings, "error", "ANALYTICS_CONTROL_APPROXIMATION_USED", "Required analytics visualizations must use real Yeeflow analytics controls unless explicitly waived.", { chart: title });
    }
  }
  for (const control of asArray(analytics)) {
    const type = normalizeControlType(control.controlType || control.type);
    if (control.expectedType && type !== normalizeControlType(control.expectedType)) {
      addFinding(findings, "error", "ANALYTICS_CONTROL_TYPE_MISMATCH", "Analytics control type must match the required chart type.", { control: safeLabel(control) });
    }
    const meta = control.data || control.attrs?.data || control.binding || {};
    if (!hasAll(meta, ["AppID", "ListID", "ListSetID"]) || !hasFieldMetadata(control.field || meta.field) || !scalar(control.aggregate || control.func || meta.func || meta.aggregate)) {
      addFinding(findings, "error", "ANALYTICS_DATA_BINDING_INCOMPLETE", "Analytics controls must include valid list, field, aggregate/function, AppID, ListID, and ListSetID metadata.", { control: safeLabel(control) });
    }
  }
}

function validateProgress(progressColumns = [], findings) {
  for (const column of asArray(progressColumns)) {
    if (column.renderedAsRawFormula || /\{\{|__temp_|formula|progress\s*\(/i.test(scalar(column.visibleText))) {
      addFinding(findings, "error", "PROGRESS_RENDERED_AS_RAW_TEXT", "Progress columns must not render raw formula text.", { column: safeLabel(column) });
    }
    if (!column.controlType || ["text", "heading", "dynamic-text"].includes(normalizeControlType(column.controlType))) {
      addFinding(findings, "error", "PROGRESS_CONTROL_MISSING", "Progress columns must use real progress controls or proven visual progress components.", { column: safeLabel(column) });
    }
    if (!isObject(column.style) || !isObject(column.valueBinding) || !isObject(column.range)) {
      addFinding(findings, "error", "PROGRESS_STYLE_METADATA_MISSING", "Progress controls need value, range, and style metadata.", { column: safeLabel(column) });
    }
  }
}

function validateSummaryKpi(summaries = [], kpis = [], findings) {
  for (const summary of asArray(summaries)) {
    if (normalizeControlType(summary.controlType || summary.type) !== "summary") {
      addFinding(findings, "error", "SUMMARY_CONTROL_TYPE_INVALID", "Summary controls must be normal type summary controls.", { summary: safeLabel(summary) });
    }
    const pivot = summary.pivot || summary.exts || summary.attrs?.exts || {};
    if (!hasAll(pivot, ["AppID", "ListID", "ListSetID"]) || !asArray(pivot.settings?.values || pivot.values).length) {
      addFinding(findings, "error", "SUMMARY_PIVOT_METADATA_INCOMPLETE", "Summary pivot metadata must include AppID, ListID, ListSetID, and settings.values[].", { summary: safeLabel(summary) });
    }
    const countValue = asArray(pivot.settings?.values || pivot.values).find((value) => scalar(value.func).toUpperCase() === "COUNT");
    if (countValue && (scalar(countValue.fieldName || countValue.id) !== "ListDataID" || scalar(countValue.id || countValue.fieldName) !== "ListDataID")) {
      addFinding(findings, "error", "SUMMARY_COUNT_FIELD_NOT_LISTDATAID", "COUNT summaries must use ListDataID.", { summary: safeLabel(summary) });
    }
    if (summary.sourceContainerVisible === true || summary.hiddenHost?.hiddenAllDevices === false || summary.hiddenHost?.displayNone === false) {
      addFinding(findings, "error", "SUMMARY_SOURCE_CONTAINER_VISIBLE", "Hidden Summary source containers must be hidden on all devices and display:none.", { summary: safeLabel(summary) });
    }
  }
  for (const kpi of asArray(kpis)) {
    if (rawVariableVisible(kpi.visibleText || kpi.value || kpi.renderedText)) {
      addFinding(findings, "error", "KPI_RAW_VARIABLE_VISIBLE", "Visible KPI values must not render raw variable names.", { kpi: safeLabel(kpi) });
    }
    if (kpi.requiresFormatting && !kpi.formatNumber && !kpi.compact && !kpi.fixedDecimal) {
      addFinding(findings, "error", "KPI_VALUE_FORMAT_INVALID", "KPI values must use suitable formatNumber, compact, or fixed-decimal formatting when expected.", { kpi: safeLabel(kpi) });
    }
  }
}

function validateNavigationActiveStyle(nav = {}, runtimeProof = {}, findings) {
  if (!isObject(nav) || !nav.required) return;
  const runtime = firstObject(nav.runtimeProof, runtimeProof?.navigationActiveStyle, runtimeProof?.appChromeActiveStyle, runtimeProof?.computedStyleProof);
  const metadata = firstObject(nav.navigatorMenuMetadata, nav.layoutView?.attrs?.["navigator-menu"], nav.layoutView?.attrs?.navigatorMenu);
  const customCss = scalar(nav.layoutView?.customcss || nav.customcss || nav.customCss);
  const cssInjector = firstObject(nav.cssInjector, nav.codeinInjector, nav.styleInjector);

  if (metadata && !nav.navigatorMenuActiveRuntimeProven) {
    addFinding(findings, "error", "NAV_ACTIVE_STYLE_METADATA_UNPROVEN", "ListSet.LayoutView.attrs[\"navigator-menu\"] active-state metadata is not runtime proof for app chrome active styling.");
  }
  if (customCss && !nav.layoutViewCustomCssRuntimeInjected) {
    addFinding(findings, "error", "LAYOUTVIEW_CUSTOMCSS_NOT_RUNTIME_INJECTED", "LayoutView.customcss is not accepted as runtime app-chrome CSS unless DOM proof shows it is injected and affects the target selector.");
  }
  if (customCss && (!runtime?.styleTagExists || !runtime?.selectorHasEffect)) {
    addFinding(findings, "error", "CUSTOM_CSS_STYLE_TAG_MISSING", "Package metadata containing custom CSS is not enough; runtime proof must show a matching style tag.");
    addFinding(findings, "error", "CUSTOM_CSS_SELECTOR_NO_EFFECT", "Runtime proof must show custom CSS affects the target active navigation selector.");
  }

  if (cssInjector || nav.cssInjectorRequired) {
    const placement = scalar(cssInjector?.placement || cssInjector?.parentRole || cssInjector?.parentName);
    const type = normalizeControlType(cssInjector?.type || cssInjector?.controlType || "codein");
    if (type === "codein" && (cssInjector?.rootChild === true || placement === "root" || placement === "resource-root")) {
      addFinding(findings, "error", "CODEIN_ROOT_CHILD_EXECUTION_RISK", "Execution-critical codein controls must not be direct children of the visual Resource root.");
    }
    if (type === "codein" && cssInjector?.expectedToExecute !== false && !isRenderedContainerPlacement(placement)) {
      addFinding(findings, "error", "CODEIN_EXPECTED_TO_EXECUTE_NOT_IN_RENDERED_CONTAINER", "Execution-critical codein controls must be placed inside a rendered page container such as Content.");
    }
    if (type === "codein" && cssInjector?.runtimeNodeExists === false) {
      addFinding(findings, "error", "CODEIN_RUNTIME_NODE_MISSING", "Runtime proof must show the expected codein injector node mounted.");
    }
    if (cssInjector?.hidden === false || cssInjector?.nonvisual === false) {
      addFinding(findings, "error", "CODEIN_EXPECTED_TO_EXECUTE_NOT_IN_RENDERED_CONTAINER", "CSS injector codein controls must be hidden/nonvisual while mounted in a rendered container.");
    }
  }

  if (nav.changedAppChromeOrPageResources && !runtime?.freshTopLevelLoad) {
    addFinding(findings, "error", "FRESH_LOAD_RUNTIME_PROOF_REQUIRED", "After sign/upgrade with app chrome or page-resource changes, runtime verification must use a fresh top-level URL load.");
  }
  if (nav.changedAppChromeOrPageResources && !runtime?.cacheBustBeforeHash) {
    addFinding(findings, "error", "RUNTIME_LAYOUT_CACHE_STALE", "Reports must distinguish stale browser/runtime resource cache from failed package generation by using safe cache-busting before the hash route.");
  }

  if (!runtime) {
    addFinding(findings, "error", "NAV_ACTIVE_STYLE_RUNTIME_PROOF_MISSING", "Active navigation styling requires Chrome DOM/computed-style proof.");
    addFinding(findings, "error", "APP_CHROME_RUNTIME_COMPUTED_STYLE_REQUIRED", "Package schema, signing, upgrade acceptance, decoded CSS, or decoded controls are not app chrome style proof.");
    return;
  }

  if (!runtime.activeSelectorExists && !runtime.activeElementExists) {
    addFinding(findings, "error", "RUNTIME_DOM_SELECTOR_PROOF_MISSING", "Runtime proof must show .ak-listset-new-navigation-item.active exists.");
  }
  if (!runtime.styleTagExists) {
    addFinding(findings, "error", "STYLE_INJECTOR_TAG_MISSING", "Runtime proof must show the uniquely identified style injector tag exists.");
  }
  const expectedSelector = scalar(nav.selector || runtime.selector || ".ak-listset-new-navigation-item.active");
  const styleText = scalar(runtime.styleText || runtime.injectedStyleText);
  if (!styleText.includes(expectedSelector)) {
    addFinding(findings, "error", "STYLE_INJECTOR_SELECTOR_MISSING", "Runtime style tag text must include the intended active navigation selector.");
  }
  if (runtime.selectorHasEffect === false) {
    addFinding(findings, "error", "STYLE_INJECTOR_SELECTOR_NO_EFFECT", "Runtime proof must show the active navigation selector is affected by the injected CSS.");
  }

  const computed = firstObject(runtime.computedStyle, runtime.computed, runtime.activeComputedStyle) || {};
  const background = scalar(computed.backgroundColor || runtime.activeBackground || runtime.backgroundColor);
  const color = scalar(computed.color || runtime.activeTextColor || runtime.color);
  const borderWidth = scalar(computed.borderBottomWidth || runtime.borderBottomWidth);
  const borderStyle = scalar(computed.borderBottomStyle || runtime.borderBottomStyle);
  const borderColor = scalar(computed.borderBottomColor || runtime.borderBottomColor);
  const border = scalar(computed.borderBottom || runtime.borderBottom);

  if (background && !isTransparent(background)) {
    addFinding(findings, "error", "NAV_ACTIVE_BACKGROUND_MISMATCH", "Active navigation background must be transparent at runtime.", { actual: background });
  }
  if (color && !isBlue(color)) {
    addFinding(findings, "error", "NAV_ACTIVE_TEXT_COLOR_MISMATCH", "Active navigation text must be the expected blue at runtime.", { actual: color });
  }
  if (!hasBlueSolidNonzeroBorder({ border, borderWidth, borderStyle, borderColor })) {
    addFinding(findings, "error", "NAV_ACTIVE_BOTTOM_BORDER_MISMATCH", "Active navigation bottom border must be blue, solid, and nonzero at runtime.", {
      border,
      borderWidth,
      borderStyle,
      borderColor,
    });
  }
  if (runtime.packageValidButRuntimeStyleFailed) {
    addFinding(findings, "error", "PACKAGE_VALID_BUT_RUNTIME_STYLE_FAILED", "Package validation, signing, upgrade API acceptance, ID stability, decoded CSS, and decoded control presence are insufficient when runtime computed styles fail.");
  }
}

function validateDesignManifest(manifest, plan = {}, pixelCompare = {}, findings, { strict }) {
  if (!manifest && !plan?.requiresCanonicalDesignPngs) return;
  if (!manifest) {
    addFinding(findings, "error", "APP_GENERATION_STARTED_WITHOUT_PAGE_DESIGN_PNGS", "Do not begin app generation if planned pages lack canonical per-page PNG design artifacts.");
    return;
  }

  const plannedPages = asArray(plan.pages || manifest.plannedPages);
  const pages = asArray(manifest.pages);
  if (plannedPages.length && plannedPages.length !== pages.length) {
    addFinding(findings, "error", "DESIGN_PAGE_COUNT_MISMATCH", "Canonical PNG page count must match the app plan page count.", { expectedCount: plannedPages.length, actualCount: pages.length });
  }
  if (scalar(manifest.canonicalFormat).toLowerCase() && scalar(manifest.canonicalFormat).toLowerCase() !== "png") {
    addFinding(findings, "error", "DESIGN_USES_SVG_AS_CANONICAL", "SVG may be optional source only, not the canonical comparison artifact.");
  }

  const layoutSet = new Set();
  pages.forEach((page, index) => {
    const png = scalar(page.canonicalPng || page.canonicalPNG || page.path);
    const expectedOrder = index + 1;
    const planned = plannedPages[index];
    if (!png) {
      addFinding(findings, "error", "DESIGN_CANONICAL_PNG_MISSING", "One standalone canonical PNG per planned page is mandatory.", { page: safeLabel(page) });
    } else {
      if (!/\.design\.png$/i.test(png)) addFinding(findings, "error", "DESIGN_CANONICAL_PNG_MISSING", "Canonical page design artifact must be a .design.png file.", { page: safeLabel(page) });
      if (/\.svg$/i.test(png)) addFinding(findings, "error", "DESIGN_USES_SVG_AS_CANONICAL", "SVG cannot be used as the canonical design artifact.", { page: safeLabel(page) });
      if (/00-design-board\.png$/i.test(png)) addFinding(findings, "error", "DESIGN_BOARD_USED_AS_PAGE_ARTIFACT", "A combined design board cannot replace per-page PNGs.", { page: safeLabel(page) });
      if (!new RegExp(`(^|/)${String(expectedOrder).padStart(2, "0")}-`).test(png)) {
        addFinding(findings, "error", "DESIGN_PAGE_ORDER_MISMATCH", "Canonical PNG filenames must preserve page order.", { page: safeLabel(page) });
      }
    }
    if (page.onePage === false || page.pageCount > 1) addFinding(findings, "error", "DESIGN_CANONICAL_PNG_NOT_ONE_PAGE", "Each canonical PNG must contain exactly one app page.", { page: safeLabel(page) });
    if (page.includesChrome === false) addFinding(findings, "error", "DESIGN_LAYOUT_CHROME_MISMATCH", "Each canonical PNG must include the selected Yeeflow app chrome.", { page: safeLabel(page) });
    if (planned && normalizeName(page.pageTitle || page.title) !== normalizeName(planned.pageTitle || planned.title || planned.name)) {
      addFinding(findings, "error", "DESIGN_PAGE_FILENAME_UNMAPPED", "Canonical PNG page mapping must match app plan page names.", { page: safeLabel(page) });
    }
    const layout = scalar(page.layout || page.selectedLayout || manifest.layout);
    if (layout) layoutSet.add(layout);
  });
  if (layoutSet.size > 1) addFinding(findings, "error", "DESIGN_LAYOUT_CHROME_MISMATCH", "Design PNGs must use the same selected app layout/chrome style.");

  for (const mapping of asArray(pixelCompare.pages || pixelCompare.pageMap)) {
    const designInput = scalar(mapping.designInput || mapping.designPng || mapping.canonicalPng);
    if (!designInput.endsWith(".design.png")) addFinding(findings, "error", "PIXEL_COMPARE_INPUT_NOT_CANONICAL_PNG", "Runtime pixel comparison must use canonical PNGs, not raw SVGs or board images.");
    if (!scalar(mapping.runtimeScreenshot)) addFinding(findings, "error", "PIXEL_COMPARE_PAGE_SCREENSHOT_MISSING", "Runtime pixel comparison requires a runtime screenshot per page.");
    if (!scalar(mapping.pageSlug || mapping.pageTitle)) addFinding(findings, "error", "PIXEL_COMPARE_PAGE_MAP_MISSING", "Runtime pixel comparison must map each screenshot to a planned page.");
    if (mapping.renderedFromSvg === true) addFinding(findings, strict ? "error" : "warning", "PIXEL_COMPARE_RENDERED_FROM_SVG_WARNING", "Rendered-from-SVG comparison is fallback evidence, not the canonical path.");
  }

  for (const page of pages) {
    const planned = plannedPages.find((candidate) => normalizeName(candidate.pageTitle || candidate.title || candidate.name) === normalizeName(page.pageTitle || page.title));
    if (plannedPages.length && !planned) addFinding(findings, "error", "UI_IMPLEMENTATION_PAGE_DESIGN_UNMAPPED", "Every implementation page must map to a canonical page PNG.", { page: safeLabel(page) });
  }
}

function readOptionalJson(file, findings, code) {
  try {
    return readJsonFile(file);
  } catch (error) {
    addFinding(findings, "error", code, `Could not read JSON input: ${error.message}`, { file: safePath(file) });
    return {};
  }
}

function formatMarkdown(report) {
  const lines = [`# Supplier Runtime Design Fidelity`, "", `Status: ${report.status}`, ""];
  for (const finding of report.findings) {
    lines.push(`- ${finding.level}: ${finding.code} - ${finding.message}`);
  }
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { format: "json", strict: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--package") args.package = argv[++index];
    else if (arg === "--design-manifest") args.designManifest = argv[++index];
    else if (arg === "--runtime-proof") args.runtimeProof = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
    else if (arg === "--no-strict") args.strict = false;
    else if (arg === "--strict") args.strict = true;
    else usage(1, `Unknown argument: ${arg}`);
  }
  return args;
}

function usage(exitCode, message) {
  if (message) console.error(message);
  console.error("Usage: node scripts/inspect-supplier-runtime-design-fidelity.mjs --package <redacted-package-or-fixture.json> [--design-manifest <manifest.json>] [--runtime-proof <proof.json>] [--format json|markdown] [--strict|--no-strict]");
  process.exit(exitCode);
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}

function hasAll(object, keys) {
  return isObject(object) && keys.every((key) => scalar(object[key]));
}

function hasFieldMetadata(field) {
  return isObject(field) && Boolean(scalar(field.FieldName || field.fieldName || field.Name || field.id));
}

function firstObject(...values) {
  return values.find((value) => isObject(value));
}

function layerPassed(layer) {
  if (typeof layer === "string") return normalizeName(layer) === "pass";
  if (!isObject(layer)) return false;
  return normalizeName(layer.status || layer.result || layer.verdict) === "pass";
}

function layerIncomplete(layer) {
  return isObject(layer) && (layer.incomplete === true || layer.valid === false || layer.complete === false || layer.missing === true);
}

function isRenderedContainerPlacement(value) {
  const placement = normalizeName(value);
  return ["content", "content container", "rendered container", "section", "section container", "card", "panel", "first meaningful content"].includes(placement);
}

function isTransparent(value) {
  const normalized = scalar(value).replace(/\s+/g, " ").toLowerCase();
  return normalized === "transparent" || normalized === "rgba(0, 0, 0, 0)" || normalized === "rgba(0,0,0,0)";
}

function isBlue(value) {
  const normalized = scalar(value).replace(/\s+/g, " ").toLowerCase();
  return normalized === "rgb(37, 99, 235)" || normalized === "rgb(37,99,235)" || normalized === "#2563eb";
}

function hasBlueSolidNonzeroBorder({ border, borderWidth, borderStyle, borderColor }) {
  const borderText = scalar(border).replace(/\s+/g, " ").toLowerCase();
  if (borderText) return /(?:^| )(?:[1-9]\d*px|3px) solid /.test(borderText) && (borderText.includes("rgb(37, 99, 235)") || borderText.includes("rgb(37,99,235)") || borderText.includes("#2563eb"));
  const widthText = scalar(borderWidth).toLowerCase();
  const styleText = scalar(borderStyle).toLowerCase();
  return styleText === "solid" && !["", "0", "0px", "none"].includes(widthText) && isBlue(borderColor);
}

function parseRuntimeListSetId(url) {
  const match = scalar(url).match(/#\/list-set\/[^/]+\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function safeLabel(value) {
  return scalar(value?.label || value?.title || value?.name || value?.id || value?.pageTitle || value?.pageSlug || "unnamed");
}

function normalizeName(value) {
  return scalar(value).trim().toLowerCase().replace(/[_\s-]+/g, " ");
}

function normalizeControlType(value) {
  return scalar(value).trim().toLowerCase().replace(/_/g, "-");
}

function listMatchesInventory(list, inventoryList) {
  for (const key of ["AppID", "ListSetID", "ListID", "Type", "Title"]) {
    const actual = scalar(list[key]);
    const expected = scalar(inventoryList[key]);
    if (expected && actual !== expected) return false;
  }
  return true;
}

function rawVariableVisible(value) {
  return /__temp_|temp_[a-z0-9_]+|\{\{|\$\{|formula/i.test(scalar(value));
}
