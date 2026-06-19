#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "yeeflow-html-first-ui-surface-"));
const contractsValidator = path.join(ROOT, "scripts/validate-ui-surface-contracts.mjs");
const htmlValidator = path.join(ROOT, "scripts/validate-html-preview-layout.mjs");
const blueprintComparator = path.join(ROOT, "scripts/compare-blueprint-to-ui-surface-contract.mjs");

const designSystemPath = path.join(tempRoot, "application-design-system.md");
const appPlanPath = path.join(tempRoot, "app-plan.md");
fs.writeFileSync(
  designSystemPath,
  "# Application Design System\n\napplication-design-system\n\nUses design tokens, approved UI pattern templates, typography, spacing, buttons, badges, tables, forms, mobile stack rules.\n",
);
fs.writeFileSync(appPlanPath, "# Vendor Contract Management App Plan\n\nVendors\nContracts\nContract Approval\nContract Documents\nRenewal Tasks\nDashboard\n");

runContractTests();
runHtmlPreviewTests();
runBlueprintComparisonTests();

console.log("HTML-first high-fidelity UI Surface Contract workflow gate tests passed");

function runContractTests() {
  const complete = surfaceSet();
  const completePath = writeJson("contracts-complete.json", { contracts: complete });
  expectPass(
    [contractsValidator, "--contracts", completePath, "--app-plan", appPlanPath, "--design-system", designSystemPath],
    "Vendor Contract style complete 13-surface contract set passes",
  );
  const requiredSurfaceAppPlan = path.join(tempRoot, "required-surfaces-app-plan.md");
  fs.writeFileSync(
    requiredSurfaceAppPlan,
    [
      "# Required UI Surfaces",
      "Dashboard page",
      "Approval Submission form",
      "Approval Task form",
      "Approval Print page",
      "Data List New/Edit form",
      "Data List View form",
      "Document Library New/Edit form",
      "Document Library View form",
      "Form Report is planned as a standalone Yeeflow resource, not a visible page.",
    ].join("\n"),
  );
  expectFailCommand(
    [contractsValidator, "--contracts", contracts([dashboard(), submission()]), "--app-plan", requiredSurfaceAppPlan, "--design-system", designSystemPath],
    "UI_SURFACE_CONTRACT_REQUIRED_SURFACE_MISSING",
    "UI Surface Contracts must cover every App Plan-required UI surface",
  );

  expectFail(
    contracts([submission({ requiredActions: ["Submit"] })]),
    "UI_SURFACE_CONTRACT_SURFACE_ACTION_MISSING",
    "Approval Submission missing Save as draft / Submit fails",
  );
  expectFail(
    contracts([submission({ forbiddenRegions: ["Approval Route Preview"], allowedRegions: ["Approval Route Preview"], surfaceResponsibility: "Shows Approval Route Preview and Audit Activity." })]),
    "UI_SURFACE_CONTRACT_FORBIDDEN_REGION_DECLARED",
    "Approval Submission includes forbidden Approval Route Preview or Audit Activity fails",
  );
  expectPass(
    [contractsValidator, "--contracts", contracts([submission()]), "--app-plan", appPlanPath, "--design-system", designSystemPath],
    "Approval Submission uses Sub List for planned Related Documents",
  );
  expectFail(
    contracts([vendorNewEdit({ requiredFields: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"], editableFields: ["Vendor Name", "Vendor Owner"] })]),
    "UI_SURFACE_CONTRACT_REQUIRED_FIELD_UNCOVERED",
    "Vendor New/Edit misses planned editable fields fails",
  );
  expectFail(
    contracts([vendorNewEdit({ forbiddenRegions: ["Collection"], allowedRegions: ["Collection"], surfaceResponsibility: "Includes Collection and Data filters." })]),
    "UI_SURFACE_CONTRACT_FORBIDDEN_REGION_DECLARED",
    "New/Edit includes Collection/Data filters/Data analytics/Audit Activity without planning fails",
  );
  expectPass(
    [contractsValidator, "--contracts", contracts([vendorNewEdit()]), "--app-plan", appPlanPath, "--design-system", designSystemPath],
    "Data List New/Edit includes all planned editable fields and Save/Cancel actions",
  );
  expectFail(
    contracts([documentNewEdit({ requiredFields: ["Document Type", "Status"], editableFields: ["Document Type", "Status"] })]),
    "UI_SURFACE_CONTRACT_SURFACE_FIELD_MISSING",
    "Document New/Edit missing file/document metadata fields fails",
  );
  expectPass(
    [contractsValidator, "--contracts", contracts([documentView()]), "--app-plan", appPlanPath, "--design-system", designSystemPath],
    "Document View includes document metadata and Open/Download behavior",
  );
  expectFail(
    contracts([vendorView({ appPlanResourceRef: "" })]),
    "UI_SURFACE_CONTRACT_REQUIRED_FIELD_MISSING",
    "UI Surface Contract lacks App Plan traceability fails",
  );
  expectFail(
    contracts([vendorView({ designSystemRef: "" })]),
    "UI_SURFACE_CONTRACT_REQUIRED_FIELD_MISSING",
    "UI Surface Contract lacks designSystemRef fails",
  );
  expectFail(
    contracts([vendorView({ uiPatternTemplateRef: "" })]),
    "UI_SURFACE_CONTRACT_REQUIRED_FIELD_MISSING",
    "UI Surface Contract lacks uiPatternTemplateRef fails",
  );
  expectPass(
    [contractsValidator, "--contracts", contracts([vendorView()]), "--app-plan", appPlanPath, "--design-system", designSystemPath],
    "UI Surface Contract references Application Design System and approved pattern template",
  );
  expectFail(
    contracts([dashboard({ applicationLayoutType: "left navigation with compact header and content shell" })]),
    "UI_SURFACE_CONTRACT_APPLICATION_LAYOUT_TYPE_UNSUPPORTED",
    "Dashboard UI Surface Contract rejects free-form layout names",
  );
  expectFail(
    contracts([dashboard({ includeHeaderNavigation: false })]),
    "UI_SURFACE_CONTRACT_DASHBOARD_HEADER_NAV_REQUIRED",
    "Dashboard UI Surface Contract requires header/navigation chrome",
  );
  expectFail(
    contracts([vendorNewEdit({ includeHeaderNavigation: true })]),
    "UI_SURFACE_CONTRACT_FORM_APP_CHROME_FORBIDDEN",
    "Form UI Surface Contract must not require app chrome",
  );
  expectFail(
    contracts([vendorView({ textOverflowStatus: "fail" })]),
    "UI_SURFACE_CONTRACT_INHERITED_GATE_NOT_PASSING",
    "readyForBlueprint is blocked when inherited design gate status fails",
  );
}

function runHtmlPreviewTests() {
  const htmlRoot = path.join(tempRoot, "html");
  const screenshotsRoot = path.join(tempRoot, "screenshots");
  fs.mkdirSync(htmlRoot, { recursive: true });
  fs.mkdirSync(screenshotsRoot, { recursive: true });
  const contract = vendorNewEdit({
    surfaceId: "vendor-new-edit",
    requiredFields: ["Vendor Name", "Vendor Owner"],
    editableFields: ["Vendor Name", "Vendor Owner"],
    requiredActions: ["Save", "Cancel"],
    screenshotEvidenceRequirements: {},
  });
  const contractPath = contracts([contract]);
  touch(path.join(screenshotsRoot, "vendor-new-edit-desktop.png"));
  touch(path.join(screenshotsRoot, "vendor-new-edit-mobile.png"));
  writeHtml(htmlRoot, "vendor-new-edit.html", validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"] }));
  expectPass(
    [htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot, "--design-system", designSystemPath],
    "HTML includes required fields/actions and excludes forbidden regions",
  );

  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name"], actions: ["Save", "Cancel"] }), "HTML_REQUIRED_FIELD_MISSING", "HTML missing required field fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save"] }), "HTML_REQUIRED_ACTION_MISSING", "HTML missing required action fails");
  expectHtmlFail(
    { ...contract, forbiddenRegions: ["Audit Activity"] },
    htmlRoot,
    screenshotsRoot,
    validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], extra: "<section>Audit Activity</section>" }),
    "HTML_FORBIDDEN_REGION_PRESENT",
    "HTML contains forbidden region fails",
  );
  expectHtmlFail(
    { ...contract, forbiddenRegions: ["Title hero card"] },
    htmlRoot,
    screenshotsRoot,
    validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], extra: "<section>Title hero card</section>" }),
    "HTML_FORBIDDEN_REGION_PRESENT",
    "HTML has duplicated internal title/hero card when contract forbids it fails",
  );
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], mobile: "desktop-multicolumn" }), "LAYOUT_MOBILE_DESKTOP_PRESSURE", "mobile HTML uses desktop multi-column layout without responsive stacking evidence fails");
  writeHtml(htmlRoot, "vendor-new-edit.html", validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"] }));
  expectPass(
    [htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot],
    "mobile HTML declares stacked/adaptive layout passes",
  );
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], overlap: "sibling" }), "LAYOUT_SIBLING_OVERLAP_DETECTED", "meaningful sibling overlap is detected");
  writeHtml(htmlRoot, "vendor-new-edit.html", validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], overlap: "parent-child" }));
  expectPass([htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot], "parent-child containment is not treated as overlap");
  fs.rmSync(path.join(screenshotsRoot, "vendor-new-edit-mobile.png"));
  {
    const result = run([htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot]);
    assert.notEqual(result.status, 0, "screenshot evidence missing fails should fail");
    assert.match(result.stdout, /HTML_SCREENSHOT_EVIDENCE_MISSING/, `screenshot evidence missing fails should report HTML_SCREENSHOT_EVIDENCE_MISSING\n${result.stdout}`);
  }
  touch(path.join(screenshotsRoot, "vendor-new-edit-mobile.png"));
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noDesignToken: true }), "HTML_DESIGN_SYSTEM_TOKEN_EVIDENCE_MISSING", "HTML lacks design-system token/class evidence fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noPattern: true }), "HTML_PATTERN_TEMPLATE_REFERENCE_MISSING", "HTML lacks approved pattern template reference fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, "<html><body>raw scaffold plain field dump generic admin table Vendor Name Vendor Owner Save Cancel</body></html>", "VISUAL_HTML_PREVIEW_LOW_FIDELITY", "raw scaffold/plain field dump/generic admin table fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noTypography: true }), "VISUAL_TYPOGRAPHY_HIERARCHY_MISSING", "typography hierarchy missing fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noSpacing: true }), "VISUAL_SPACING_DENSITY_EVIDENCE_MISSING", "spacing/density inconsistent with tokens fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noActionPlacement: true }), "VISUAL_ACTION_PLACEMENT_EVIDENCE_MISSING", "button/action placement violates surface pattern fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], longTextNoWrap: true }), "VISUAL_LONG_TEXT_WITHOUT_WRAP_STRATEGY", "long button/badge/table text without wrapping/truncation evidence fails");
  writeHtml(htmlRoot, "vendor-new-edit.html", validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], longTextWithWrap: true }));
  expectPass([htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot], "long text with explicit wrap/truncate/stacking strategy passes");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], noInheritedStatuses: true }), "HTML_LAYOUT_FIDELITY_STATUS_MISSING", "blueprint-ready HTML must carry inherited design-stage gate statuses");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], inheritedFail: true }), "HTML_READY_FOR_BLUEPRINT_BLOCKED_BY_INHERITED_GATE", "readyForBlueprint is blocked when inherited HTML gate fails");
  expectHtmlFail(contract, htmlRoot, screenshotsRoot, validHtml({ fields: ["Vendor Name", "Vendor Owner"], actions: ["Save", "Cancel"], placeholderOnlyRegion: true }), "HTML_LOWER_REGION_PLACEHOLDER_ONLY", "lower-page source notes and field lists without rendered UI examples fail");
}

function runBlueprintComparisonTests() {
  const contract = vendorView({
    surfaceId: "vendor-view",
    requiredFields: ["Vendor Name", "Vendor Owner"],
    readOnlyFields: ["Vendor Name", "Vendor Owner"],
    requiredActions: ["Edit", "Open related record"],
    forbiddenRegions: ["Audit Activity"],
    controlMapping: ["Read-only field group", "Related Contracts Data table"],
  });
  const contractPath = contracts([contract]);
  const goodBlueprint = blueprint({
    surfaceId: "vendor-view",
    fields: ["Vendor Name", "Vendor Owner"],
    actions: ["Edit", "Open related record"],
    regions: ["Related Contracts"],
    controls: ["Read-only field group", "Related Contracts Data table"],
  });
  expectPass([blueprintComparator, "--contracts", contractPath, "--blueprints", blueprints([goodBlueprint]), "--design-system", designSystemPath], "Blueprint preserves contract fields/actions/regions/control mappings and style intent");
  expectBlueprintFail(contract, { ...goodBlueprint, fields: ["Vendor Name"] }, "BLUEPRINT_REQUIRED_FIELD_MISSING", "Blueprint omits required field fails");
  expectBlueprintFail(contract, { ...goodBlueprint, actions: ["Edit"] }, "BLUEPRINT_REQUIRED_ACTION_MISSING", "Blueprint omits required actions fails");
  expectBlueprintFail(contract, { ...goodBlueprint, regions: ["Audit Activity"] }, "BLUEPRINT_FORBIDDEN_REGION_REINTRODUCED", "Blueprint reintroduces forbidden regions fails");
  expectBlueprintFail(
    contract,
    {
      ...goodBlueprint,
      designSystemStyleIntent: "action placement badge mobile responsive card form",
      typographyHierarchy: "",
      spacingScale: "",
      sectionPattern: "",
      actionPlacement: "Primary action placement in action bar.",
      statusBadgeSemantics: "Status badge/chip semantics preserved.",
      mobileResponsiveIntent: "Mobile responsive stack and card list fallback.",
    },
    "BLUEPRINT_STYLE_TYPOGRAPHY_INTENT_MISSING",
    "Blueprint loses design-system style intent fails",
  );
  expectBlueprintFail(contract, { ...goodBlueprint, designSystemStyleIntent: "Typography hierarchy, spacing scale, card section table form surface pattern, status badge chip semantics, mobile responsive stack intent.", actionPlacement: "" }, "BLUEPRINT_ACTION_PLACEMENT_INTENT_MISSING", "Blueprint loses action placement intent fails");
  expectBlueprintFail(contract, { ...goodBlueprint, designSystemStyleIntent: "Typography hierarchy, spacing scale, card section table form surface pattern, action placement, mobile responsive stack intent.", statusBadgeSemantics: "" }, "BLUEPRINT_BADGE_STATUS_INTENT_MISSING", "Blueprint loses status badge intent fails");
  expectPass(
    [
      blueprintComparator,
      "--contracts",
      contractPath,
      "--blueprints",
      blueprints([{ ...goodBlueprint, fields: ["Vendor Name"], deferrals: [{ item: "Vendor Owner", reason: "Unsupported in this surface.", fallback: "Show in detail panel.", proofImpact: "Blueprint follow-up required." }] }]),
    ],
    "explicit deferral with reason, fallback, and proof impact is accepted",
  );
}

function surfaceSet() {
  return [
    dashboard(),
    submission(),
    task(),
    printPage(),
    vendorNewEdit(),
    vendorView(),
    contractNewEdit(),
    contractView(),
    documentNewEdit(),
    documentView(),
    renewalTaskNewEdit(),
    renewalTaskView(),
    customDetail(),
  ];
}

function baseContract(overrides = {}) {
  return {
    applicationName: "Vendor Contract Management",
    surfaceId: "vendor-view",
    surfaceName: "Vendor View",
    surfaceType: "Data List View form",
    appPlanResourceRef: "Custom Data List Forms Plan > Vendors > Vendor View",
    sourceResourceType: "Data List",
    sourceResourceName: "Vendors",
    sourceListOrFormName: "Vendors",
    surfaceResponsibility: "Show current Vendor read-only record fields and explicitly planned related records.",
    businessPurpose: "Help operations review vendor contract exposure.",
    primaryUserRole: "Operations manager",
    dataSource: "Vendors",
    fieldGroups: [{ name: "Vendor details", fields: ["Vendor Name", "Vendor Owner"] }],
    requiredFields: ["Vendor Name", "Vendor Owner"],
    optionalFields: ["Notes"],
    readOnlyFields: ["Vendor Name", "Vendor Owner"],
    editableFields: [],
    fieldTypeMapping: { "Vendor Name": "Text", "Vendor Owner": "User" },
    requiredActions: ["Edit", "Open related record"],
    optionalActions: ["Archive vendor"],
    forbiddenRegions: ["Audit Activity"],
    allowedRegions: ["Linked Contracts"],
    relatedRegions: [{ name: "Linked Contracts", sourceList: "Contracts" }],
    subListRequirements: [],
    controlMapping: ["Read-only field group", "Related Contracts Data table", "Edit"],
    responsiveRules: "Desktop two-column sections stack to single-column on mobile.",
    htmlPreviewRequirements: "High-fidelity HTML preview must use design tokens, approved pattern template, required fields and actions.",
    screenshotEvidenceRequirements: { desktop: true, mobile: true },
    blueprintRequirements: "Blueprint must preserve fields, actions, allowed regions, controls, style intent, and responsive behavior.",
    designSystemRef: "application-design-system",
    uiPatternTemplateRef: "data-list-view-detail",
    visualQualityRequirements: ["high-fidelity business form", "polished card/table/button/badge patterns"],
    applicationLayoutType: "form-surface-no-app-chrome",
    includeHeaderNavigation: false,
    readyForBlueprint: true,
    layoutFidelityStatus: "pass",
    modernVisualQualityStatus: "pass",
    surfaceResponsibilityStatus: "pass",
    fieldCoverageStatus: "pass",
    actionCoverageStatus: "pass",
    forbiddenRegionStatus: "pass",
    semanticConsistencyStatus: "pass",
    lowerPageVisualConcretenessStatus: "pass",
    visualUsabilityStatus: "pass",
    textOverflowStatus: "pass",
    overlapStatus: "pass",
    spacingStatus: "pass",
    mobileUsabilityStatus: "pass",
    templateReuseRiskStatus: "pass",
    fullPageCoverageStatus: "pass",
    pageEndStatus: "pass",
    appPlanTraceabilityStatus: "pass",
    proofBoundary: "Design contract only; not package/runtime proof.",
    ...overrides,
  };
}

function dashboard(overrides = {}) {
  return baseContract({
    surfaceId: "dashboard",
    surfaceName: "Operations Dashboard",
    surfaceType: "Dashboard page",
    appPlanResourceRef: "Dashboard Pages Plan > Operations Dashboard",
    sourceResourceType: "Dashboard page",
    sourceResourceName: "Dashboard",
    sourceListOrFormName: "Dashboard",
    surfaceResponsibility: "Dashboard shows KPI Summary cards, analytics, filters, Collection/Data table work queues, and actions.",
    requiredFields: ["Vendor KPI", "Renewal KPI"],
    readOnlyFields: ["Vendor KPI", "Renewal KPI"],
    requiredActions: ["Open contract"],
    controlMapping: ["KPI Summary", "Data Analytics", "Data table", "Collection", "Open contract"],
    forbiddenRegions: [],
    applicationLayoutType: "application-layout-2-horizontal-nav",
    includeHeaderNavigation: true,
    ...overrides,
  });
}

function submission(overrides = {}) {
  return baseContract({
    surfaceId: "contract-approval-submission",
    surfaceName: "Contract Approval Submission",
    surfaceType: "Approval Submission form",
    appPlanResourceRef: "Approval Forms Plan > Contract Approval > Submission",
    sourceResourceType: "Approval form",
    sourceResourceName: "Contract Approval",
    sourceListOrFormName: "Contract Approval",
    surfaceResponsibility: "Capture editable submission fields and planned Related Documents Sub List.",
    dataSource: "Contract Approval",
    requiredFields: ["Contract title", "Vendor", "Contract owner", "Related Documents Sub List"],
    editableFields: ["Contract title", "Vendor", "Contract owner", "Related Documents Sub List"],
    readOnlyFields: [],
    fieldGroups: [{ name: "Submission details", fields: ["Contract title", "Vendor", "Contract owner", "Related Documents Sub List"] }],
    fieldTypeMapping: { "Contract title": "Text", Vendor: "Lookup", "Related Documents Sub List": "Dynamic Sub List" },
    requiredActions: ["Save as draft", "Submit"],
    forbiddenRegions: ["Approval Route Preview", "Audit Activity", "logic-only Required Document Checklist"],
    allowedRegions: ["Related Documents Sub List"],
    subListRequirements: ["Related Documents Sub List"],
    controlMapping: ["Input controls", "Dynamic Sub List", "Save as draft", "Submit"],
    uiPatternTemplateRef: "approval-submission-form",
    ...overrides,
  });
}

function task(overrides = {}) {
  return baseContract({
    surfaceId: "contract-approval-task",
    surfaceName: "Contract Approval Task",
    surfaceType: "Approval Task form",
    appPlanResourceRef: "Approval Forms Plan > Contract Approval > Task",
    sourceResourceType: "Approval form",
    sourceResourceName: "Contract Approval",
    sourceListOrFormName: "Contract Approval",
    surfaceResponsibility: "Show read-only request context plus reviewer decision controls.",
    requiredFields: ["Contract title", "Vendor", "Reviewer comments", "Decision"],
    readOnlyFields: ["Contract title", "Vendor"],
    editableFields: ["Reviewer comments", "Decision"],
    fieldGroups: [{ name: "Task decision", fields: ["Contract title", "Vendor", "Reviewer comments", "Decision"] }],
    requiredActions: ["Approve", "Reject"],
    forbiddenRegions: ["Submit only", "Data List New/Edit"],
    controlMapping: ["Read-only request context", "Reviewer comments", "Approve", "Reject"],
    uiPatternTemplateRef: "approval-task-form",
    ...overrides,
  });
}

function printPage(overrides = {}) {
  return baseContract({
    surfaceId: "contract-approval-print",
    surfaceName: "Contract Approval Print",
    surfaceType: "Approval Print page",
    appPlanResourceRef: "Approval Forms Plan > Contract Approval > Print",
    sourceResourceType: "Approval form",
    sourceResourceName: "Contract Approval",
    surfaceResponsibility: "Read-only print-oriented approval evidence page.",
    requiredFields: ["Contract title", "Vendor", "Decision", "Signature date"],
    readOnlyFields: ["Contract title", "Vendor", "Decision", "Signature date"],
    fieldGroups: [{ name: "Printable approval evidence", fields: ["Contract title", "Vendor", "Decision", "Signature date"] }],
    requiredActions: ["Print", "Export PDF"],
    forbiddenRegions: ["Editable inputs", "Approve", "Reject"],
    controlMapping: ["Read-only field group", "Signature block", "Print", "Export PDF"],
    uiPatternTemplateRef: "approval-print-page",
    ...overrides,
  });
}

function vendorNewEdit(overrides = {}) {
  return baseContract({
    surfaceId: "vendor-new-edit",
    surfaceName: "Vendor New/Edit",
    surfaceType: "Data List New/Edit form",
    appPlanResourceRef: "Custom Data List Forms Plan > Vendors > New/Edit",
    requiredFields: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"],
    editableFields: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"],
    readOnlyFields: [],
    fieldGroups: [{ name: "Vendor fields", fields: ["Vendor Name", "Vendor Owner", "Payment Terms", "Vendor Status", "Primary Contact", "Notes"] }],
    requiredActions: ["Save", "Cancel"],
    forbiddenRegions: ["Collection", "Data filters", "Data analytics", "Audit Activity"],
    controlMapping: ["Input controls", "Save", "Cancel"],
    uiPatternTemplateRef: "data-list-new-edit-form",
    ...overrides,
  });
}

function vendorView(overrides = {}) {
  return baseContract(overrides);
}

function contractNewEdit(overrides = {}) {
  return baseContract({
    surfaceId: "contract-new-edit",
    surfaceName: "Contract New/Edit",
    surfaceType: "Data List New/Edit form",
    sourceResourceName: "Contracts",
    sourceListOrFormName: "Contracts",
    appPlanResourceRef: "Custom Data List Forms Plan > Contracts > New/Edit",
    requiredFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms"],
    editableFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms"],
    readOnlyFields: [],
    fieldGroups: [{ name: "Contract fields", fields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status", "Payment Terms"] }],
    requiredActions: ["Save", "Cancel"],
    forbiddenRegions: ["Collection", "Data filters", "Data analytics", "Audit Activity"],
    controlMapping: ["Input controls", "Save", "Cancel"],
    uiPatternTemplateRef: "data-list-new-edit-form",
    ...overrides,
  });
}

function contractView(overrides = {}) {
  return baseContract({
    surfaceId: "contract-view",
    surfaceName: "Contract View",
    surfaceType: "Data List View form",
    sourceResourceName: "Contracts",
    sourceListOrFormName: "Contracts",
    appPlanResourceRef: "Custom Data List Forms Plan > Contracts > View",
    requiredFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status"],
    readOnlyFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status"],
    fieldGroups: [{ name: "Contract summary", fields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date", "Approval Status"] }],
    requiredActions: ["Edit", "Open related record"],
    controlMapping: ["Read-only field group", "Related Documents Data table", "Edit"],
    uiPatternTemplateRef: "data-list-view-detail",
    ...overrides,
  });
}

function documentNewEdit(overrides = {}) {
  return baseContract({
    surfaceId: "document-new-edit",
    surfaceName: "Document New/Edit",
    surfaceType: "Document Library New/Edit form",
    sourceResourceType: "Document Library",
    sourceResourceName: "Contract Documents",
    sourceListOrFormName: "Contract Documents",
    appPlanResourceRef: "Document Libraries Plan > Contract Documents > New/Edit",
    requiredFields: ["File upload", "Document name", "Document type", "Status", "Linked contract", "Notes"],
    editableFields: ["File upload", "Document name", "Document type", "Status", "Linked contract", "Notes"],
    readOnlyFields: [],
    fieldGroups: [{ name: "Document metadata", fields: ["File upload", "Document name", "Document type", "Status", "Linked contract", "Notes"] }],
    requiredActions: ["Upload", "Save", "Cancel"],
    forbiddenRegions: ["Approval Route Preview", "Dashboard analytics"],
    controlMapping: ["File upload", "Document metadata inputs", "Upload", "Save", "Cancel"],
    uiPatternTemplateRef: "document-library-new-edit",
    ...overrides,
  });
}

function documentView(overrides = {}) {
  return baseContract({
    surfaceId: "document-view",
    surfaceName: "Document View",
    surfaceType: "Document Library View form",
    sourceResourceType: "Document Library",
    sourceResourceName: "Contract Documents",
    sourceListOrFormName: "Contract Documents",
    appPlanResourceRef: "Document Libraries Plan > Contract Documents > View",
    requiredFields: ["Document file", "Document type", "Status", "Uploaded date", "Linked contract"],
    readOnlyFields: ["Document file", "Document type", "Status", "Uploaded date", "Linked contract"],
    fieldGroups: [{ name: "Document metadata", fields: ["Document file", "Document type", "Status", "Uploaded date", "Linked contract"] }],
    requiredActions: ["Open document", "Download"],
    forbiddenRegions: ["Dashboard analytics"],
    controlMapping: ["File preview", "Document metadata", "Open document", "Download"],
    uiPatternTemplateRef: "document-library-view",
    ...overrides,
  });
}

function renewalTaskNewEdit(overrides = {}) {
  return baseContract({
    surfaceId: "renewal-task-new-edit",
    surfaceName: "Renewal Task New/Edit",
    surfaceType: "Data List New/Edit form",
    sourceResourceName: "Renewal Tasks",
    sourceListOrFormName: "Renewal Tasks",
    appPlanResourceRef: "Custom Data List Forms Plan > Renewal Tasks > New/Edit",
    requiredFields: ["Task", "Owner", "Due date", "Status", "Priority"],
    editableFields: ["Task", "Owner", "Due date", "Status", "Priority"],
    fieldGroups: [{ name: "Task fields", fields: ["Task", "Owner", "Due date", "Status", "Priority"] }],
    requiredActions: ["Save", "Cancel"],
    controlMapping: ["Input controls", "Save", "Cancel"],
    uiPatternTemplateRef: "data-list-new-edit-form",
    ...overrides,
  });
}

function renewalTaskView(overrides = {}) {
  return baseContract({
    surfaceId: "renewal-task-view",
    surfaceName: "Renewal Task View",
    surfaceType: "Data List View form",
    sourceResourceName: "Renewal Tasks",
    sourceListOrFormName: "Renewal Tasks",
    appPlanResourceRef: "Custom Data List Forms Plan > Renewal Tasks > View",
    requiredFields: ["Task", "Owner", "Due date", "Status", "Priority"],
    readOnlyFields: ["Task", "Owner", "Due date", "Status", "Priority"],
    fieldGroups: [{ name: "Task summary", fields: ["Task", "Owner", "Due date", "Status", "Priority"] }],
    requiredActions: ["Edit", "Mark complete"],
    controlMapping: ["Read-only field group", "Edit", "Mark complete"],
    uiPatternTemplateRef: "data-list-view-detail",
    ...overrides,
  });
}

function customDetail(overrides = {}) {
  return baseContract({
    surfaceId: "contract-workspace-detail",
    surfaceName: "Contract Workspace Detail",
    surfaceType: "Data List Detail form",
    sourceResourceName: "Contracts",
    sourceListOrFormName: "Contracts",
    appPlanResourceRef: "Dashboard Pages Plan > Contract Workspace Detail",
    requiredFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date"],
    readOnlyFields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date"],
    fieldGroups: [{ name: "Workspace context", fields: ["Contract Title", "Vendor", "Contract Owner", "Renewal Date"] }],
    requiredActions: ["Edit", "Open related record"],
    controlMapping: ["Read-only field group", "Related tasks Collection", "Edit"],
    uiPatternTemplateRef: "data-list-detail-workspace",
    ...overrides,
  });
}

function validHtml(options = {}) {
  const fields = options.fields || [];
  const actions = options.actions || [];
  const mobile = options.mobile || "stacked";
  const wrapStyle = options.longTextNoWrap ? "" : " overflow-wrap:anywhere;";
  const designAttrs = options.noDesignToken ? "" : `data-design-system="application-design-system" class="ds-card form-section status-badge polished-card" style="--yf-spacing-md:16px;${wrapStyle}"`;
  const pattern = options.noPattern ? "" : 'data-ui-pattern-template="data-list-new-edit-form"';
  const title = options.noTypography ? "" : '<h1 class="page-title text-xl">Vendor New/Edit</h1><h2 class="section-title">Vendor fields</h2>';
  const spacing = options.noSpacing ? "" : '<div class="section-gap padding-md density-comfortable"></div>';
  const actionClass = options.noActionPlacement ? "" : 'class="action-bar primary-action button-row form-actions"';
  const overlap = options.overlap ? `data-overlap="${options.overlap}"` : "";
  const inheritedStatuses = options.noInheritedStatuses
    ? 'data-ready-for-blueprint="true"'
    : 'data-modern-visual-quality="pass" data-layout-fidelity="pass" data-surface-responsibility="pass" data-field-coverage="pass" data-action-coverage="pass" data-forbidden-region-status="pass" data-semantic-consistency="pass" data-lower-region-visual-concreteness="pass" data-visual-usability="pass" overlap-status="pass" spacing-status="pass" data-template-reuse-risk="pass" data-ready-for-blueprint="true"';
  const concreteLowerRegion = options.placeholderOnlyRegion
    ? '<section>Source: Contract Documents. Document name, type, status.</section>'
    : '<section class="document-card lower-region-concrete" rendered-example-count="2">Vendor contract row ACME MSA with owner Jordan Lee and renewal date 2027-04-30.</section>';
  const longText = options.longTextNoWrap
    ? "<button>Extremely Long Vendor Contract Approval Submission Button Label Without Strategy</button>"
    : options.longTextWithWrap
      ? '<button class="primary-action" style="text-overflow:ellipsis;overflow-wrap:anywhere;">Extremely Long Vendor Contract Approval Submission Button Label With Strategy</button>'
      : "";
  return `<!doctype html>
<html>
<head><style>.high-fidelity{--yf-spacing-sm:8px}.mobile-stack{@media(max-width:700px){display:block}}</style></head>
<body ${designAttrs} ${pattern} data-visual-quality="pass" ${inheritedStatuses} data-full-page="true" data-page-end="true" data-mobile-layout="${mobile}" ${overlap}>
${title}
${spacing}
<main class="high-fidelity business-card data-table collection-card form-section form-surface-no-app-chrome complete-surface full-page page-end">
${fields.map((field) => `<label data-field="${field}">${field}<input value="${field} value"></label>`).join("\n")}
<div ${actionClass}>${actions.map((action) => `<button>${action}</button>`).join("\n")}${longText}</div>
<span class="status-badge">Active</span>
${concreteLowerRegion}
${options.extra || ""}
${options.inheritedFail ? '<span text-overflow="fail"></span>' : ""}
</main>
</body>
</html>`;
}

function blueprint(overrides = {}) {
  return {
    surfaceId: "vendor-view",
    fields: ["Vendor Name", "Vendor Owner"],
    actions: ["Edit", "Open related record"],
    regions: ["Linked Contracts"],
    controls: ["Read-only field group", "Related Contracts Data table"],
    designSystemStyleIntent:
      "Typography hierarchy, spacing scale, card section table form surface pattern, action placement, status badge chip semantics, mobile responsive stack intent.",
    typographyHierarchy: "Page title and section title typography hierarchy.",
    spacingScale: "Design token spacing gap padding density.",
    sectionPattern: "Card, section, table, and form patterns.",
    actionPlacement: "Primary action placement in action bar.",
    statusBadgeSemantics: "Status badge/chip semantics preserved.",
    mobileResponsiveIntent: "Mobile responsive stack and card list fallback.",
    ...overrides,
  };
}

function contracts(items) {
  return writeJson(`contracts-${Math.random().toString(16).slice(2)}.json`, { contracts: items });
}

function blueprints(items) {
  return writeJson(`blueprints-${Math.random().toString(16).slice(2)}.json`, { blueprints: items });
}

function writeJson(name, value) {
  const file = path.join(tempRoot, name);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
  return file;
}

function writeHtml(root, name, html) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, name), html);
}

function touch(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "placeholder screenshot evidence");
}

function expectPass(command, label) {
  const result = run(command);
  assert.equal(result.status, 0, `${label}\n${result.stdout}\n${result.stderr}`);
}

function expectFail(contractPath, code, label) {
  const result = run([contractsValidator, "--contracts", contractPath, "--app-plan", appPlanPath, "--design-system", designSystemPath]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectFailCommand(command, code, label) {
  const result = run(command);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectHtmlFail(contract, htmlRoot, screenshotsRoot, html, code, label) {
  const contractPath = contracts([contract]);
  writeHtml(htmlRoot, `${contract.surfaceId}.html`, html);
  touch(path.join(screenshotsRoot, `${contract.surfaceId}-desktop.png`));
  touch(path.join(screenshotsRoot, `${contract.surfaceId}-mobile.png`));
  const result = run([htmlValidator, "--contracts", contractPath, "--html", htmlRoot, "--screenshots", screenshotsRoot]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function expectBlueprintFail(contract, blueprintObject, code, label) {
  const result = run([blueprintComparator, "--contracts", contracts([contract]), "--blueprints", blueprints([blueprintObject])]);
  assert.notEqual(result.status, 0, `${label} should fail`);
  assert.match(result.stdout, new RegExp(code), `${label} should report ${code}\n${result.stdout}`);
}

function run(command) {
  const [script, ...args] = command;
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: "utf8" });
}
