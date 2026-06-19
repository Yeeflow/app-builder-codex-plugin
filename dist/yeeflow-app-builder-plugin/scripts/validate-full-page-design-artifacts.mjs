#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addFinding, asArray, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const FORM_REPORT_RE = /\bform\s*report\b/i;
const DASHBOARD_RE = /\bdashboard\b|\boperational\s+home\b|\bworkbench\b|\bworkspace\b|\bqueue\b/i;
const APPROVAL_RE = /\bapproval\b/i;
const SUBMISSION_RE = /\bsubmission\b/i;
const TASK_RE = /\btask\b/i;
const PRINT_RE = /\bprint\b/i;
const DATA_LIST_FORM_RE = /\bdata\s+list\b.*\bform\b|\badd\/edit\b|\bview\s+form\b|\bdetail\s+form\b|\bcustom\s+form\b/i;
const LAYOUT_RULE_SOURCE_PATH = "docs/standards/yeeflow-application-layout-design-rules.md";
const FORM_SURFACE_NO_CHROME = "form-surface-no-app-chrome";
const OFFICIAL_LAYOUTS = new Map([
  ["application-layout-1-vertical-nav", "Application layout 1: vertical navigation menu panel"],
  ["application-layout-2-horizontal-nav", "Application layout 2: horizontal navigation menu bar"],
  ["application-layout-3-header-nav", "Application layout 3: navigation menu on the header"],
  ["application-layout-4-no-nav", "Application layout 4: no navigation menu / hidden navigation"],
]);
const FREE_FORM_LAYOUT_RE = /\b(left navigation with compact header and content shell|custom sidebar|saas shell|compact header|arbitrary layout|generic saas|product sidebar)\b/i;
const LAYOUT_1_FORBIDDEN_CHROME = [
  ["hamburger", "header hamburger icon"],
  ["collapse", "bottom Collapse control"],
  ["detached-left-rail", "detached left rail"],
  ["custom-sidebar", "custom sidebar"],
  ["arbitrary-saas-shell", "arbitrary SaaS shell"],
  ["extra-top-nav", "extra top navigation"],
  ["mixed-nav-panel", "mixed dark/light nav panels"],
  ["product-sidebar", "arbitrary product sidebar"],
];
const LAYOUT_FORBIDDEN_CHROME = new Map([
  [
    "application-layout-2-horizontal-nav",
    [
      ["persistent-left-sidebar", "persistent left sidebar"],
      ["left-sidebar", "left sidebar"],
      ["custom-sidebar", "custom sidebar"],
      ["arbitrary-saas-shell", "arbitrary SaaS shell"],
    ],
  ],
  [
    "application-layout-3-header-nav",
    [
      ["second-nav-bar", "second navigation bar"],
      ["second-horizontal-nav", "second horizontal nav"],
      ["left-nav", "left nav"],
      ["persistent-left-sidebar", "persistent left sidebar"],
      ["custom-sidebar", "custom sidebar"],
      ["arbitrary-saas-shell", "arbitrary SaaS shell"],
    ],
  ],
  [
    "application-layout-4-no-nav",
    [
      ["sidebar", "sidebar"],
      ["nav-tabs", "nav tabs"],
      ["replacement-app-shell-navigation", "replacement app shell navigation"],
      ["horizontal-nav", "horizontal nav"],
      ["header-nav", "header nav"],
      ["custom-sidebar", "custom sidebar"],
      ["arbitrary-saas-shell", "arbitrary SaaS shell"],
    ],
  ],
]);
const FORM_DETAIL_SURFACE_RE =
  /\bapproval\b.*\b(submission|task|print)\b|\bdata\s+list\b.*\b(add\/edit|view|detail|custom)\b|\b(add\/edit|view|detail)\s+form\b|\bcustom\s+form\b/i;
const GENERIC_QUALITY_RE =
  /\b(strong visual hierarchy|professional spacing|professional spacing and density|polished cards|polished sections|polished cards, sections, tables, and forms|meaningful business examples|modern design|good layout|readable layout|responsive layout|clean ui|visual quality)\b/i;
const BUSINESS_NOUN_RE =
  /\b(contract|vendor|renewal|document|approval|payment|owner|task|reminder|workflow|reviewer|comment|history|status|field|terms|effective|expiration|expiry|audit|activity|signature|checklist|record|evidence)\b/i;
const MEANINGFUL_LOWER_REGION_RE =
  /\b(workflow|approval|decision|history|reviewer|comment|document|checklist|renewal|task|contract|vendor|reminder|activity|audit|validation|service|status|linked\s+record|evidence|signature|footer|payment|owner)\b/i;
const GENERIC_LOWER_REGION_RE =
  /\b(page\s*end|end\s*marker|generic\s+notes?|notes?\s+only|blank|white\s+space|empty\s+space|lower\s+content|placeholder|design[- ]stage explanation|helper\s+text)\b/i;
const SUPPORTED_LOWER_REGION_PATTERNS = [
  "data table",
  "collection",
  "kanban",
  "vertical timeline",
  "horizontal timeline",
  "dynamic sub list",
  "checklist rows",
  "related-record cards",
  "related record cards",
  "document table",
  "document cards",
  "document evidence cards",
  "activity feed",
  "audit feed",
  "workflow timeline",
  "approval timeline",
  "signature block",
  "read-only field group",
  "read only field group",
];
const SUPPORTED_LOWER_REGION_PATTERN_RE = new RegExp(`\\b(${SUPPORTED_LOWER_REGION_PATTERNS.map(escapeRegex).join("|")})\\b`, "i");
const PLACEHOLDER_REGION_TEXT_RE =
  /^(source\s*:|show\b|page\s*end\b|generic\s+notes?\b|design[- ]stage explanation\b|document name,\s*type,\s*status|field names?\b|fields?\s*:)/i;
const FIELD_LIST_ONLY_RE =
  /^\s*(?:[A-Za-z][A-Za-z /-]+)(?:\s*,\s*[A-Za-z][A-Za-z /-]+){2,}\s*$/;
const STATUS_VALUE_RE = /\b(active|inactive|approved|pending|rejected|overdue|task overdue|in review|expired|draft|renewal due|complete|completed|blocked|open|closed)\b/i;
const DOCUMENT_FILENAME_RE = /\b[\w .-]+\.(pdf|docx?|xlsx?|pptx?|png|jpe?g|gif|zip)\b/i;
const REVIEW_COMMENT_RE = /\b(review comment|looks good|please review|needs changes|approved by|reject because|comment:|reviewer note)\b/i;
const PERSON_OR_VENDOR_VALUE_RE = /\b([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][A-Za-z0-9&.,' -]+ (Inc|LLC|Ltd|Corp|Company|Vendor|Co\.?))\b/;
const VISUAL_USABILITY_STATUS_RE = /^(pass|pass-with-reviewed-risk|human_review_required|human[-_ ]review[-_ ]required|fail|deferred)$/i;
const VISUAL_USABILITY_PASS_RE = /^(pass|passed|validated|verified)$/i;
const VISUAL_USABILITY_REVIEWED_RISK_RE = /^pass-with-reviewed-risk$/i;
const VISUAL_USABILITY_BLOCKING_RE = /^(fail|failed|human_review_required|human[-_ ]review[-_ ]required)$/i;
const LONG_LABEL_RE = /\b[A-Za-z][A-Za-z0-9 -]{42,}\b/;
const WRAP_TRUNCATE_RE = /\b(wrap|wrapped|truncate|truncation|ellipsis|line[- ]break|responsive|stack|stacking|horizontal scroll|scroll|wider|adaptive)\b/i;
const DESKTOP_MULTI_COLUMN_RE = /\b(3[- ]column|4[- ]column|multi[- ]column|desktop columns?|side[- ]by[- ]side)\b/i;
const MOBILE_STACK_RE = /\b(single[- ]column|stack|stacked|vertical|card[- ]list|horizontal scroll|mobile fallback|reduced column)\b/i;
const REGION_SEMANTIC_PROFILES = {
  contract: {
    required: /\b(contract|owner|renewal|lifecycle|status|payment|vendor|effective|expiry|expiration)\b/i,
    forbidden: /\b(task|due date|priority|open task detail|mark complete|reassign task|renewal tasks filtered by current contract)\b/i,
    allowedActions: /\b(open contract|review renewal|start approval|archive contract|read-only|read only|open detail)\b/i,
  },
  renewalTask: {
    required: /\b(task|owner|due date|status|priority|reminder|assignee)\b/i,
    forbidden: /\b(archive contract|start approval|contract lifecycle|payment terms)\b/i,
    allowedActions: /\b(open task detail|mark complete|reassign task|create reminder schedule|open related contract|read-only|read only)\b/i,
  },
  document: {
    required: /\b(document|file|evidence|attachment|uploaded|received|required|document type|current file)\b/i,
    forbidden: /\b(task|due date|priority|open task detail|mark complete|contract lifecycle|review renewal)\b/i,
    allowedActions: /\b(open document|request missing file|upload replacement|open file|download|read-only|read only)\b/i,
  },
  approval: {
    required: /\b(reviewer|decision|timestamp|date|status|step|comment|approval|route)\b/i,
    forbidden: /\b(document name|document type|task card|task detail|priority|uploaded date|current file)\b/i,
    allowedActions: /\b(view approval|open task|review evidence|read-only|read only|open approval)\b/i,
  },
  audit: {
    required: /\b(activity|actor|timestamp|record|audit|change|event)\b/i,
    forbidden: /\b(document type|priority|mark complete|signature block)\b/i,
    allowedActions: /\b(open related record|read-only|read only|open record)\b/i,
  },
  signature: {
    required: /\b(signer|reviewer|role|decision|signature|date|signed)\b/i,
    forbidden: /\b(task|priority|document type|kanban|mark complete)\b/i,
    allowedActions: /\b(print|export pdf|capture signature|read-only|read only)\b/i,
  },
  checklist: {
    required: /\b(checklist|item|status|owner|evidence|required document|required|received|current file)\b/i,
    forbidden: /\b(open task detail|mark complete|contract lifecycle)\b/i,
    allowedActions: /\b(open document|request missing file|upload replacement|check item|read-only|read only)\b/i,
  },
};

export function validateFullPageDesignArtifacts(manifest, options = {}) {
  const findings = [];
  const manifestFile = options.manifestFile || null;
  const designSystemPath = firstText(manifest.designSystemPath, manifest.applicationDesignSystemPath, manifest.applicationDesignSystem?.path);
  const designSystem = manifest.applicationDesignSystem || {};
  const selectedApplicationLayoutType = firstText(
    manifest.applicationLayoutType,
    manifest.selectedApplicationLayoutType,
    manifest.selectedApplicationLayout,
    manifest.applicationLayout,
    designSystem.applicationLayoutType,
  );
  const artifacts = asArray(manifest.artifacts || manifest.designArtifacts || manifest.manifestRows || manifest.rows);
  const plannedSurfaces = asArray(manifest.plannedSurfaces || manifest.requiredSurfaces || manifest.sourceSurfaces);
  const deferredSurfaces = asArray(manifest.deferredSurfaces || manifest.deferrals || artifacts.filter((artifact) => isDeferred(artifact)));

  requireText(findings, manifest, ["applicationName", "appName"], "DESIGN_MANIFEST_APPLICATION_NAME_MISSING", "Design Image Manifest must name the application.");
  requireText(findings, manifest, ["pluginVersion"], "DESIGN_MANIFEST_PLUGIN_VERSION_MISSING", "Design Image Manifest must include the plugin version.");
  requireText(findings, manifest, ["sourceFunctionalSpecificationPath", "functionalSpecificationPath", "sourceFunctionalSpecification"], "DESIGN_MANIFEST_SOURCE_SPEC_MISSING", "Design Image Manifest must reference the source Functional Specification.");
  requireText(findings, manifest, ["sourceAppPlanPath", "appPlanPath", "sourceAppPlan"], "DESIGN_MANIFEST_SOURCE_APP_PLAN_MISSING", "Design Image Manifest must reference the source Yeeflow App Plan.");
  if (!selectedApplicationLayoutType) {
    addFinding(findings, "error", "DESIGN_MANIFEST_APPLICATION_LAYOUT_MISSING", "Design Image Manifest must declare the selected official Yeeflow Application Layout type.", {
      manifest: safePath(manifestFile),
    });
  }
  validateOfficialLayout(findings, selectedApplicationLayoutType, {
    code: "DESIGN_MANIFEST_APPLICATION_LAYOUT_INVALID",
    message: "Design Image Manifest must use one of the four official Yeeflow applicationLayoutType IDs.",
    context: { manifest: safePath(manifestFile) },
  });

  if (!designSystemPath) {
    addFinding(findings, "error", "DESIGN_SYSTEM_MISSING", "Application Design System document is required before full-page canonical design images.", {
      manifest: safePath(manifestFile),
    });
  }

  const designSystemStatus = lower(firstText(manifest.applicationDesignSystem?.status, manifest.designSystemStatus));
  if (designSystemStatus && !/(complete|approved|ready|pass)/i.test(designSystemStatus)) {
    addFinding(findings, "error", "DESIGN_SYSTEM_INCOMPLETE", "Application Design System status must be complete/approved/ready before canonical images proceed.", {
      status: designSystemStatus,
    });
  }
  validateApplicationDesignSystem(findings, designSystem, selectedApplicationLayoutType);

  if (!artifacts.length && !deferredSurfaces.length) {
    addFinding(findings, "error", "DESIGN_MANIFEST_NO_ARTIFACTS", "Design Image Manifest must include canonical design artifacts or explicit deferrals.", {
      manifest: safePath(manifestFile),
    });
  }

  const manifestDesignSystemPath = normalizePathToken(designSystemPath);
  const designSystemGeneratedAt = parseTime(firstText(manifest.applicationDesignSystem?.generatedAt, manifest.designSystemGeneratedAt));
  const artifactCoverage = new Set();
  const deferredCoverage = new Set();
  const formDetailArtifacts = [];

  for (const deferred of deferredSurfaces) {
    const key = surfaceKey(deferred);
    if (key) deferredCoverage.add(key);
    validateDeferredSurface(findings, deferred);
  }

  for (const [index, artifact] of artifacts.entries()) {
    const surfaceType = firstText(artifact.surfaceType, artifact.yeeflowSurfaceType, artifact.type);
    const surfaceName = firstText(artifact.surfaceName, artifact.name, artifact.pageName, artifact.formName);
    const key = surfaceKey(artifact);
    if (key && !isFormReportSurface(artifact)) artifactCoverage.add(key);

    if (isFormReportSurface(artifact)) {
      addFinding(findings, "warning", "FORM_REPORT_DESIGN_ARTIFACT_NOT_REQUIRED", "Form Reports are standalone resources and are not required full-page canonical design image surfaces.", {
        surfaceName,
        surfaceType,
      });
      continue;
    }

    if (!surfaceName) addFinding(findings, "error", "DESIGN_ARTIFACT_SURFACE_NAME_MISSING", "Every design artifact row must name the page/form surface.", { row: index + 1 });
    if (!surfaceType) addFinding(findings, "error", "DESIGN_ARTIFACT_SURFACE_TYPE_MISSING", "Every design artifact row must declare the Yeeflow surface type.", { row: index + 1, surfaceName });

    const artifactDesignSystemPath = firstText(artifact.designSystemPath, artifact.applicationDesignSystemPath);
    if (!artifactDesignSystemPath) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_DESIGN_SYSTEM_REFERENCE_MISSING", "Every canonical design artifact row must reference the selected Application Design System.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    } else if (manifestDesignSystemPath && normalizePathToken(artifactDesignSystemPath) !== manifestDesignSystemPath) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_DESIGN_SYSTEM_REFERENCE_MISMATCH", "Canonical design artifact references a different design system than the manifest.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    requireText(findings, artifact, ["sourceAppPlanSection", "appPlanSection"], "DESIGN_ARTIFACT_APP_PLAN_SECTION_MISSING", "Every design artifact must map to an App Plan section.", { row: index + 1, surfaceName, surfaceType });
    requireText(findings, artifact, ["sourceResourceName", "resourceName"], "DESIGN_ARTIFACT_SOURCE_RESOURCE_MISSING", "Every design artifact must map to an App Plan resource name.", { row: index + 1, surfaceName, surfaceType });
    requireText(findings, artifact, ["canonicalDesktopImagePath", "desktopImagePath", "imagePath"], "DESIGN_ARTIFACT_DESKTOP_IMAGE_MISSING", "Every canonical design artifact must include a desktop image path.", { row: index + 1, surfaceName, surfaceType });

    if (!firstText(artifact.mobileImagePath, artifact.mobileCanonicalImagePath) && !firstText(artifact.responsivePlanReference, artifact.responsivePlan)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_RESPONSIVE_PLAN_MISSING", "Every design artifact must include either a mobile image path or a responsive plan reference.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    const fullPageStatus = lower(firstText(artifact.fullPageCoverageStatus, artifact.fullPageStatus, artifact.coverageStatus));
    if (!/(full[- ]page|complete[- ]design[- ]board|complete|deferred)/.test(fullPageStatus)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_FULL_PAGE_STATUS_MISSING", "Every canonical design artifact must declare full-page coverage status.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (!truthy(artifact.pageEndIncluded) && !isDeferred(artifact)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_PAGE_END_MISSING", "Full-page canonical design artifacts must declare that the page end/lower-page region is included.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (!truthy(artifact.readyForBlueprint) && !isDeferred(artifact)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_BLUEPRINT_READINESS_MISSING", "Every design artifact must declare readiness for the Page Implementation Blueprint stage.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (!asArray(artifact.includedSections).length) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_INCLUDED_SECTIONS_MISSING", "Every design artifact must list the planned sections included in the full-page image.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (!asArray(artifact.majorPlannedControlsShown || artifact.controlsShown).length) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_CONTROLS_SHOWN_MISSING", "Every design artifact must list the major planned controls shown.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (!asArray(artifact.businessDataExamplesShown || artifact.businessExamples).length) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_BUSINESS_EXAMPLES_MISSING", "Every design artifact must show realistic business rows, cards, field values, statuses, or action examples.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if (DASHBOARD_RE.test(surfaceType)) {
      const artifactLayoutType = firstText(artifact.applicationLayoutType, artifact.selectedApplicationLayout, artifact.applicationLayout);
      const artifactChromeStyleId = firstText(artifact.applicationChromeStyleId, artifact.chromeStyleId);
      if (!artifactLayoutType) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_APPLICATION_LAYOUT_MISSING", "Dashboard/page design artifact rows must include applicationLayoutType.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      } else {
        validateOfficialLayout(findings, artifactLayoutType, {
          code: "DASHBOARD_DESIGN_APPLICATION_LAYOUT_INVALID",
          message: "Dashboard/page design artifact rows must use an official Yeeflow applicationLayoutType ID.",
          context: { row: index + 1, surfaceName, surfaceType },
        });
        if (selectedApplicationLayoutType && artifactLayoutType !== selectedApplicationLayoutType) {
          addFinding(findings, "error", "DASHBOARD_DESIGN_APPLICATION_LAYOUT_MISMATCH", "Dashboard/page design artifact layout type must match the Application Design System layout.", {
            row: index + 1,
            surfaceName,
            surfaceType,
            applicationLayoutType: artifactLayoutType,
            selectedApplicationLayoutType,
          });
        }
      }
      if (!artifactChromeStyleId) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_CHROME_STYLE_MISSING", "Dashboard/page design artifact rows must include applicationChromeStyleId.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      }
      if (!truthy(artifact.includeHeaderNavigation) && !truthy(artifact.headerNavigationIncluded)) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_HEADER_NAVIGATION_MISSING", "Dashboard/page design artifacts must include the selected application layout shell with header/navigation where applicable.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      }
      requirePassingStatus(findings, artifact, ["layoutFidelityStatus", "layoutFidelity"], "DESIGN_ARTIFACT_LAYOUT_FIDELITY_STATUS_MISSING", "Dashboard/page design artifact rows must declare layoutFidelityStatus.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
      if (!firstText(artifact.layoutChromeCompliance, artifact.selectedLayoutChromeCompliance, artifact.chromeComplianceDeclaration, artifact.layoutComplianceDeclaration)) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_CHROME_COMPLIANCE_MISSING", "Dashboard/page design artifact rows must declare compliance with the selected layout chrome.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      }
      validateForbiddenChrome(findings, artifact, artifactLayoutType || selectedApplicationLayoutType, {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    if ((APPROVAL_RE.test(surfaceType) || DATA_LIST_FORM_RE.test(surfaceType)) && truthy(artifact.includeHeaderNavigation || artifact.headerNavigationIncluded)) {
      addFinding(findings, "error", "FORM_DESIGN_HEADER_NAVIGATION_NOT_REQUIRED", "Approval and Data List form design artifacts are complete form pages and must not require application header/navigation chrome.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }

    validateVisualUsability(findings, artifact, { row: index + 1, surfaceName, surfaceType, manifestFile });

    if (isFormDetailSurface(artifact)) {
      formDetailArtifacts.push({ artifact, index, surfaceName, surfaceType });
      validateFormDetailSemanticQuality(findings, artifact, { row: index + 1, surfaceName, surfaceType });
    }

    validateVisualQuality(findings, artifact, { row: index + 1, surfaceName, surfaceType });
    validateBlueprintReadiness(findings, artifact, { row: index + 1, surfaceName, surfaceType });

    const artifactGeneratedAt = parseTime(firstText(artifact.generatedAt, artifact.imageGeneratedAt, artifact.createdAt));
    if (designSystemGeneratedAt && artifactGeneratedAt && designSystemGeneratedAt > artifactGeneratedAt) {
      addFinding(findings, "error", "DESIGN_SYSTEM_GENERATED_AFTER_IMAGE", "Application Design System must be generated before canonical design images.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }
  }

  validateTemplateReuseRisk(findings, formDetailArtifacts);

  const plannedNonReportSurfaces = plannedSurfaces.filter((surface) => !isFormReportSurface(surface));
  for (const planned of plannedNonReportSurfaces) {
    const key = surfaceKey(planned);
    if (!key) continue;
    if (!artifactCoverage.has(key) && !deferredCoverage.has(key)) {
      addFinding(findings, "error", "DESIGN_SURFACE_COVERAGE_MISSING", "Every planned UI surface must have a canonical design artifact or an explicit deferral.", {
        surfaceName: firstText(planned.surfaceName, planned.name, planned.pageName, planned.formName),
        surfaceType: firstText(planned.surfaceType, planned.yeeflowSurfaceType, planned.type),
        sourceResourceName: firstText(planned.sourceResourceName, planned.resourceName),
      });
    }
  }

  for (const approvalResourceName of approvalResourcesWithAnySurface(plannedNonReportSurfaces)) {
    const hasSubmission = plannedNonReportSurfaces.some(
      (surface) =>
        sameText(firstText(surface.sourceResourceName, surface.resourceName), approvalResourceName) &&
        APPROVAL_RE.test(firstText(surface.surfaceType, surface.type)) &&
        SUBMISSION_RE.test(firstText(surface.surfaceType, surface.type)),
    );
    if (!hasSubmission) {
      addFinding(findings, "error", "APPROVAL_SUBMISSION_DESIGN_SURFACE_MISSING", "Every planned Approval form design set must include one Submission form surface.", {
        sourceResourceName: approvalResourceName,
      });
    }
  }

  return {
    status: statusFromFindings(findings),
    manifest: safePath(manifestFile),
    counts: {
      plannedSurfaces: plannedSurfaces.length,
      designArtifacts: artifacts.length,
      deferredSurfaces: deferredSurfaces.length,
      requiredDesignSurfaces: plannedNonReportSurfaces.length,
    },
    proofBoundary:
      "This validator checks design-stage artifact readiness for Page Implementation Blueprints. It does not prove package validity, signing/API acceptance, install/upgrade success, or runtime behavior.",
    findings,
  };
}

function validateApplicationDesignSystem(findings, designSystem, selectedApplicationLayoutType) {
  const layoutType = firstText(designSystem.applicationLayoutType, selectedApplicationLayoutType);
  const layoutName = firstText(designSystem.applicationLayoutName);
  const layoutRuleSource = firstText(designSystem.layoutRuleSource, designSystem.sourceLayoutRules);
  for (const [keys, code, message] of [
    [["applicationLayoutType"], "DESIGN_SYSTEM_APPLICATION_LAYOUT_TYPE_MISSING", "Application Design System must include applicationLayoutType."],
    [["applicationLayoutName"], "DESIGN_SYSTEM_APPLICATION_LAYOUT_NAME_MISSING", "Application Design System must include applicationLayoutName."],
    [["applicationChromeStyleId"], "DESIGN_SYSTEM_CHROME_STYLE_ID_MISSING", "Application Design System must include applicationChromeStyleId."],
    [["headerMode"], "DESIGN_SYSTEM_HEADER_MODE_MISSING", "Application Design System must include headerMode."],
    [["navMode"], "DESIGN_SYSTEM_NAV_MODE_MISSING", "Application Design System must include navMode."],
    [["navBackgroundMode"], "DESIGN_SYSTEM_NAV_BACKGROUND_MODE_MISSING", "Application Design System must include navBackgroundMode."],
    [["contentSafeArea"], "DESIGN_SYSTEM_CONTENT_SAFE_AREA_MISSING", "Application Design System must include contentSafeArea."],
    [["layoutRuleSource", "sourceLayoutRules"], "DESIGN_SYSTEM_LAYOUT_RULE_SOURCE_MISSING", `Application Design System must reference ${LAYOUT_RULE_SOURCE_PATH}.`],
  ]) {
    requireText(findings, designSystem, keys, code, message);
  }
  validateOfficialLayout(findings, layoutType, {
    code: "DESIGN_SYSTEM_APPLICATION_LAYOUT_INVALID",
    message: "Application Design System must use one of the four official Yeeflow applicationLayoutType IDs.",
  });
  if (layoutType && layoutName && OFFICIAL_LAYOUTS.get(layoutType) && normalizeKey(layoutName) !== normalizeKey(OFFICIAL_LAYOUTS.get(layoutType))) {
    addFinding(findings, "error", "DESIGN_SYSTEM_APPLICATION_LAYOUT_NAME_MISMATCH", "Application Design System applicationLayoutName must match the selected official layout name.", {
      applicationLayoutType: layoutType,
      applicationLayoutName: layoutName,
    });
  }
  if (layoutRuleSource && normalizePathToken(layoutRuleSource) !== LAYOUT_RULE_SOURCE_PATH) {
    addFinding(findings, "error", "DESIGN_SYSTEM_LAYOUT_RULE_SOURCE_INVALID", `Application Design System layoutRuleSource must be ${LAYOUT_RULE_SOURCE_PATH}.`, {
      layoutRuleSource,
    });
  }
  validateNoFreeFormLayout(findings, [
    ["applicationLayoutType", layoutType],
    ["applicationLayoutName", layoutName],
    ["applicationChromeStyleId", firstText(designSystem.applicationChromeStyleId)],
    ["headerMode", firstText(designSystem.headerMode)],
    ["navMode", firstText(designSystem.navMode)],
    ["navBackgroundMode", firstText(designSystem.navBackgroundMode)],
  ]);
  if (!firstText(designSystem.modernVisualQualityStandard, designSystem.modernVisualQualityStandardPath, designSystem.visualQualityStandard)) {
    addFinding(findings, "error", "DESIGN_SYSTEM_MODERN_VISUAL_QUALITY_STANDARD_MISSING", "Application Design System must include a Modern Visual Quality Standard section or reference.");
  }
}

function validateOfficialLayout(findings, value, { code, message, context = {} }) {
  if (!value) return;
  if (!OFFICIAL_LAYOUTS.has(value)) addFinding(findings, "error", code, message, { ...context, applicationLayoutType: value });
}

function validateNoFreeFormLayout(findings, pairs, context = {}) {
  for (const [field, value] of pairs) {
    if (!value) continue;
    if (FREE_FORM_LAYOUT_RE.test(value)) {
      addFinding(findings, "error", "DESIGN_LAYOUT_FREE_FORM_VALUE", "Design-stage layout fields must not use free-form/custom SaaS shell wording.", {
        ...context,
        field,
        value,
      });
    }
  }
}

function validateForbiddenChrome(findings, artifact, layoutType, context = {}) {
  const forbiddenText = [
    artifact.forbiddenChromeMarkers,
    artifact.forbiddenChromePatterns,
    artifact.chromeAntiPatterns,
    artifact.layoutFidelityNotes,
  ]
    .flatMap((value) => asArray(value).length ? asArray(value) : [value])
    .map(scalar)
    .join(" ")
    .toLowerCase();
  const rules = layoutType === "application-layout-1-vertical-nav" ? LAYOUT_1_FORBIDDEN_CHROME : LAYOUT_FORBIDDEN_CHROME.get(layoutType) || [];
  for (const [token, label] of rules) {
    const tokenRe = new RegExp(`\\b${escapeRegex(token).replace(/\\-/g, "[- ]")}\\b`, "i");
    const labelRe = new RegExp(`\\b${escapeRegex(label).replace(/\\ /g, "[- ]")}\\b`, "i");
    if (tokenRe.test(forbiddenText) || labelRe.test(forbiddenText)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_FORBIDDEN_CHROME_DECLARED", "Design artifact declares forbidden chrome for the selected official Yeeflow layout.", {
        ...context,
        applicationLayoutType: layoutType,
        forbiddenChrome: label,
      });
    }
  }
}

function validateVisualQuality(findings, artifact, context = {}) {
  requirePassingStatus(findings, artifact, ["layoutFidelityStatus", "layoutFidelity"], "DESIGN_ARTIFACT_LAYOUT_FIDELITY_STATUS_MISSING", "Every design artifact must declare layoutFidelityStatus.", context);
  requirePassingStatus(findings, artifact, ["visualQualityStatus", "modernVisualQualityStatus"], "DESIGN_ARTIFACT_VISUAL_QUALITY_STATUS_MISSING", "Every design artifact must declare visualQualityStatus.", context);
  const checklist = asArray(artifact.modernVisualQualityChecklist || artifact.visualQualityChecklist || artifact.qualityChecklist);
  if (!checklist.length) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_VISUAL_QUALITY_CHECKLIST_MISSING", "Every design artifact must include a modern visual quality checklist.", context);
  }
  const antiPatternStatus = lower(firstText(artifact.antiPatternCheck, artifact.antiPatternStatus));
  if (!antiPatternStatus) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_ANTI_PATTERN_CHECK_MISSING", "Every design artifact must include an anti-pattern check.", context);
  } else if (!/(pass|none|no anti-patterns|clear)/i.test(antiPatternStatus) && !isDeferredWithProof(artifact)) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_ANTI_PATTERN_CHECK_FAILED", "Design artifact anti-pattern check must pass or be explicitly deferred with reason, fallback, and proof impact.", {
      ...context,
      antiPatternCheck: antiPatternStatus,
    });
  }
}

function validateVisualUsability(findings, artifact, context = {}) {
  if (!truthy(artifact.readyForBlueprint)) return;
  const statuses = [
    ["visualUsabilityStatus", firstText(artifact.visualUsabilityStatus, artifact.visualUsabilityReviewStatus), "DESIGN_ARTIFACT_VISUAL_USABILITY_STATUS_MISSING"],
    ["textOverflowStatus", firstText(artifact.textOverflowStatus), "DESIGN_ARTIFACT_TEXT_OVERFLOW_STATUS_MISSING"],
    ["overlapStatus", firstText(artifact.overlapStatus, artifact.elementOverlapStatus), "DESIGN_ARTIFACT_OVERLAP_STATUS_MISSING"],
    ["spacingStatus", firstText(artifact.spacingStatus), "DESIGN_ARTIFACT_SPACING_STATUS_MISSING"],
    ["mobileUsabilityStatus", firstText(artifact.mobileUsabilityStatus, artifact.responsiveUsabilityStatus), "DESIGN_ARTIFACT_MOBILE_USABILITY_STATUS_MISSING"],
  ];
  let blocking = false;
  for (const [field, status, missingCode] of statuses) {
    const normalized = scalar(status).trim();
    if (!normalized) {
      addFinding(findings, "error", missingCode, "Blueprint-ready design artifacts must include visual usability status evidence.", {
        ...context,
        field,
      });
      blocking = true;
      continue;
    }
    if (!VISUAL_USABILITY_STATUS_RE.test(normalized) && !isPassingReviewStatus(normalized)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_VISUAL_USABILITY_STATUS_INVALID", "Visual usability statuses must be pass, pass-with-reviewed-risk, human_review_required, fail, or deferred.", {
        ...context,
        field,
        status: normalized,
      });
      blocking = true;
    }
    if (VISUAL_USABILITY_BLOCKING_RE.test(normalized) && !isDeferredWithProof(artifact)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_BLOCKER", "readyForBlueprint cannot be true when text overflow, overlap, spacing, mobile usability, or visual usability is failing or requires human review without explicit deferral.", {
        ...context,
        field,
        status: normalized,
      });
      blocking = true;
    }
    if (VISUAL_USABILITY_REVIEWED_RISK_RE.test(normalized) && !hasReviewedRiskEvidence(artifact)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_REVIEWED_RISK_INCOMPLETE", "pass-with-reviewed-risk requires documented risk, mitigation, and proof impact.", {
        ...context,
        field,
        status: normalized,
      });
      blocking = true;
    }
  }

  for (const [keys, code, message] of [
    [["responsiveLayoutEvidence", "mobileResponsiveEvidence"], "DESIGN_ARTIFACT_RESPONSIVE_EVIDENCE_MISSING", "Blueprint-ready artifacts must include responsiveLayoutEvidence."],
    [["textWrappingStrategy", "textOverflowStrategy"], "DESIGN_ARTIFACT_TEXT_WRAPPING_STRATEGY_MISSING", "Blueprint-ready artifacts must include textWrappingStrategy."],
    [["containerBoundaryEvidence", "boundaryEvidence"], "DESIGN_ARTIFACT_CONTAINER_BOUNDARY_EVIDENCE_MISSING", "Blueprint-ready artifacts must include containerBoundaryEvidence."],
    [["visualUsabilityFindings", "visualUsabilityNotes"], "DESIGN_ARTIFACT_VISUAL_USABILITY_FINDINGS_MISSING", "Blueprint-ready artifacts must include visualUsabilityFindings or equivalent review notes."],
  ]) {
    requireText(findings, artifact, keys, code, message, context);
  }

  const usabilityText = [
    artifact.visualUsabilityFindings,
    artifact.visualUsabilityNotes,
    artifact.textWrappingStrategy,
    artifact.containerBoundaryEvidence,
    artifact.responsiveLayoutEvidence,
    artifact.businessDataExamplesShown,
    artifact.modernVisualQualityChecklist,
  ]
    .flatMap((value) => asArray(value).length ? asArray(value) : [value])
    .map(scalar)
    .join(" ");
  if (LONG_LABEL_RE.test(usabilityText) && !WRAP_TRUNCATE_RE.test(usabilityText)) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_LONG_TEXT_WITHOUT_WRAP_STRATEGY", "Long button, badge, table, card, or field text requires wrapping, truncation, ellipsis, stacking, or responsive layout evidence.", context);
    blocking = true;
  }
  const mobileText = [artifact.mobileLayoutDescription, artifact.responsiveLayoutEvidence, artifact.responsivePlanReference, artifact.responsivePlan].map(scalar).join(" ");
  if (DESKTOP_MULTI_COLUMN_RE.test(mobileText) && !MOBILE_STACK_RE.test(mobileText)) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_MOBILE_LAYOUT_PRESSURE", "Mobile design evidence must stack, reduce columns, or provide a scroll/card-list fallback instead of carrying desktop multi-column pressure into mobile.", context);
    blocking = true;
  }

  validateSvgUsabilityHints(findings, artifact, context);
  if (blocking) blockReadyForBlueprint(findings, artifact, "DESIGN_ARTIFACT_READY_WITH_VISUAL_USABILITY_FAILURE", "Design artifact cannot be ready for blueprint when visual usability evidence fails or is incomplete.", context);
}

function validateBlueprintReadiness(findings, artifact, context = {}) {
  if (!truthy(artifact.readyForBlueprint)) return;
  const layoutStatus = lower(firstText(artifact.layoutFidelityStatus, artifact.layoutFidelity));
  const qualityStatus = lower(firstText(artifact.visualQualityStatus, artifact.modernVisualQualityStatus));
  const layoutPass = isPassingReviewStatus(layoutStatus);
  const qualityPass = isPassingReviewStatus(qualityStatus);
  if (!layoutPass) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_READY_WITHOUT_LAYOUT_FIDELITY", "Design artifact cannot be ready for blueprint until layout fidelity status is pass.", {
      ...context,
      layoutFidelityStatus: layoutStatus,
    });
  }
  if (!qualityPass) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_READY_WITHOUT_VISUAL_QUALITY", "Design artifact cannot be ready for blueprint until modern visual quality status is pass.", {
      ...context,
      visualQualityStatus: qualityStatus,
    });
  }
}

function validateFormDetailSemanticQuality(findings, artifact, context = {}) {
  requireText(findings, artifact, ["primaryBusinessObject"], "FORM_DETAIL_PRIMARY_BUSINESS_OBJECT_MISSING", "Form/detail design artifacts must declare primaryBusinessObject.", context);

  const semanticExamples = normalizeFieldExamples(artifact.semanticFieldExamples || artifact.fieldValueExamples || artifact.businessFieldExamples);
  if (!semanticExamples.length) {
    addFinding(findings, "error", "FORM_DETAIL_SEMANTIC_FIELD_EXAMPLES_MISSING", "Form/detail design artifacts must include semanticFieldExamples with realistic field/value pairs.", context);
  }
  for (const example of semanticExamples) validateSemanticFieldExample(findings, example, context);

  requirePassingStatus(findings, artifact, ["fieldValueSemanticsStatus", "semanticQualityStatus"], "FORM_DETAIL_FIELD_VALUE_SEMANTICS_STATUS_MISSING", "Form/detail artifacts must declare fieldValueSemanticsStatus.", context);
  if (truthy(artifact.readyForBlueprint) && !isPassingReviewStatus(firstText(artifact.fieldValueSemanticsStatus, artifact.semanticQualityStatus))) {
    addFinding(findings, "error", "FORM_DETAIL_READY_WITHOUT_SEMANTIC_QUALITY", "Form/detail artifact cannot be ready for blueprint until field/value semantic quality passes.", {
      ...context,
      fieldValueSemanticsStatus: firstText(artifact.fieldValueSemanticsStatus, artifact.semanticQualityStatus),
    });
  }

  validateLowerPageBusinessRegions(findings, artifact, context);
  validatePageSpecificQualityEvidence(findings, artifact, context);
  validateTemplateReuseStatus(findings, artifact, context);
}

function validateSemanticFieldExample(findings, example, context = {}) {
  const field = firstText(example.field, example.fieldName, example.label, example.name);
  const value = firstText(example.value, example.exampleValue, example.displayValue);
  if (!field || !value) {
    addFinding(findings, "error", "FORM_DETAIL_SEMANTIC_FIELD_EXAMPLE_INCOMPLETE", "Each semantic field example must include a field/label and realistic value.", context);
    return;
  }
  const fieldText = lower(field);
  const valueText = scalar(value).trim();
  let code = "";
  let reason = "";
  if (/\b(title|name)\b/.test(fieldText) && STATUS_VALUE_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Title/name fields must not use lifecycle status values.";
  } else if (/\b(owner|person|user|assignee|contact)\b/.test(fieldText) && STATUS_VALUE_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Owner/person fields must not use task or status values.";
  } else if (/\b(date|renewal|effective|expiry|expiration|deadline)\b/.test(fieldText) && DOCUMENT_FILENAME_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Date fields must not use document filenames.";
  } else if (/\b(status|state|stage)\b/.test(fieldText) && PERSON_OR_VENDOR_VALUE_RE.test(valueText) && !STATUS_VALUE_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Status fields must not use person or vendor names.";
  } else if (/\b(document|evidence|file|attachment)\b/.test(fieldText) && REVIEW_COMMENT_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Document/evidence fields must not use review comment text.";
  } else if (/\b(related|linked|record|reference)\b/.test(fieldText) && STATUS_VALUE_RE.test(valueText)) {
    code = "FORM_DETAIL_FIELD_VALUE_SEMANTIC_MISMATCH";
    reason = "Related-record fields must not use validation/status labels.";
  }
  if (code) {
    addFinding(findings, "error", code, "Form/detail semantic field examples contain an obvious field/value mismatch.", {
      ...context,
      field,
      value,
      reason,
    });
  }
}

function validateLowerPageBusinessRegions(findings, artifact, context = {}) {
  const regions = asArray(artifact.lowerPageBusinessRegions || artifact.businessRegionEvidence || artifact.lowerPageRegions);
  if (!regions.length) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_PAGE_BUSINESS_REGION_MISSING", "Form/detail artifacts must include at least one meaningful lower-page business region.", context);
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_LOWER_PAGE_BUSINESS_REGION", "Form/detail artifact cannot be ready for blueprint without a meaningful lower-page business region.", context);
    return;
  }

  let meaningful = 0;
  for (const region of regions) {
    const text = scalarRegion(region);
    if (!text || GENERIC_LOWER_REGION_RE.test(text) || !MEANINGFUL_LOWER_REGION_RE.test(text)) {
      addFinding(findings, "error", "FORM_DETAIL_LOWER_PAGE_BUSINESS_REGION_GENERIC", "Lower-page business regions must contain planned business data, records, history, evidence, or actions, not only page-end markers, generic notes, blank space, or design explanation text.", {
        ...context,
        region: text,
      });
      if (typeof region === "object" && region !== null) validateLowerPageRegionVisualConcreteness(findings, region, artifact, context);
      continue;
    }
    meaningful += 1;
    if (typeof region === "object" && region !== null) {
      for (const [keys, code, message] of [
        [["name", "regionName"], "FORM_DETAIL_LOWER_REGION_NAME_MISSING", "Lower-page business region must include a region name."],
        [["purpose", "regionPurpose"], "FORM_DETAIL_LOWER_REGION_PURPOSE_MISSING", "Lower-page business region must include a purpose."],
        [["sourceList", "dataSource", "source"], "FORM_DETAIL_LOWER_REGION_SOURCE_MISSING", "Lower-page business region must include source list or data source."],
        [["displayedFields", "displayedItems", "fields"], "FORM_DETAIL_LOWER_REGION_FIELDS_MISSING", "Lower-page business region must include displayed fields/items."],
        [["behavior", "actionOrReadOnlyBehavior", "actionBehavior"], "FORM_DETAIL_LOWER_REGION_BEHAVIOR_MISSING", "Lower-page business region must include action or read-only behavior."],
        [["proofImpact", "validationImpact"], "FORM_DETAIL_LOWER_REGION_PROOF_IMPACT_MISSING", "Lower-page business region must include proof impact."],
      ]) {
        requireText(findings, region, keys, code, message, context);
      }
      validateLowerPageRegionVisualConcreteness(findings, region, artifact, context);
      validateLowerPageRegionSemanticConsistency(findings, region, artifact, context);
    } else {
      addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_VISUAL_EVIDENCE_MISSING", "Lower-page business regions must be structured manifest objects with visual concreteness evidence, not plain descriptive text.", {
        ...context,
        region: text,
      });
      blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_LOWER_REGION_VISUAL_CONCRETENESS", "Form/detail artifact cannot be ready for blueprint when lower-page region visual evidence is missing.", context);
    }
  }
  if (!meaningful) blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_LOWER_PAGE_BUSINESS_REGION", "Form/detail artifact cannot be ready for blueprint when lower-page regions are generic or page-end-only.", context);
}

function validateLowerPageRegionVisualConcreteness(findings, region, artifact, context = {}) {
  const regionName = firstText(region.regionName, region.name);
  const visualPattern = firstText(region.visualPattern, region.pattern);
  const plannedControl = firstText(region.plannedYeeflowControl, region.yeeflowControl, region.control, region.controlPattern);
  const renderedExampleSummary = firstText(region.renderedExampleSummary, region.exampleSummary, region.renderedExamples);
  const displayedBusinessFields = asArray(region.displayedBusinessFields || region.displayedFields || region.displayedItems || region.fields);
  const visualConcretenessStatus = firstText(region.visualConcretenessStatus, region.visualEvidenceStatus);
  const antiPlaceholderStatus = firstText(region.antiPlaceholderStatus, region.placeholderStatus);
  const emptyState = truthy(region.emptyState) || (region.emptyState && typeof region.emptyState === "object" && !("enabled" in region.emptyState)) || truthy(region.emptyState?.enabled);
  const renderedExampleCount = Number(firstText(region.renderedExampleCount, region.exampleCount, region.renderedRows, region.renderedItems));
  const regionContext = { ...context, regionName: regionName || scalarRegion(region) };

  if (!visualPattern) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_VISUAL_PATTERN_MISSING", "Lower-page business region must declare visualPattern.", regionContext);
  } else if (!SUPPORTED_LOWER_REGION_PATTERN_RE.test(visualPattern)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_VISUAL_PATTERN_UNSUPPORTED", "Lower-page business region visualPattern must be a concrete Yeeflow-control-shaped pattern, not notes or generic description.", {
      ...regionContext,
      visualPattern,
    });
  }

  if (!plannedControl) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_CONTROL_MISSING", "Lower-page business region must declare plannedYeeflowControl.", regionContext);
  } else if (!SUPPORTED_LOWER_REGION_PATTERN_RE.test(plannedControl)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_CONTROL_UNSUPPORTED", "plannedYeeflowControl must be a supported visual/control pattern for the lower-page region.", {
      ...regionContext,
      plannedYeeflowControl: plannedControl,
    });
  }

  if (!displayedBusinessFields.length) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_BUSINESS_FIELDS_MISSING", "Lower-page business region must declare displayedBusinessFields or equivalent displayed fields/items.", regionContext);
  }
  requireText(findings, region, ["actionsShown", "actions", "actionOrReadOnlyBehavior", "behavior"], "FORM_DETAIL_LOWER_REGION_ACTIONS_SHOWN_MISSING", "Lower-page business region must declare actionsShown or read-only behavior.", regionContext);
  requireText(findings, region, ["blueprintMappingHint", "blueprintHint", "controlMappingHint"], "FORM_DETAIL_LOWER_REGION_BLUEPRINT_HINT_MISSING", "Lower-page business region must include a blueprintMappingHint.", regionContext);

  if (!isPassingReviewStatus(visualConcretenessStatus)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_VISUAL_CONCRETENESS_NOT_PASSING", "Lower-page business region visualConcretenessStatus must be pass before blueprint readiness.", {
      ...regionContext,
      visualConcretenessStatus,
    });
  }
  if (!isPassingReviewStatus(antiPlaceholderStatus)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_ANTI_PLACEHOLDER_NOT_PASSING", "Lower-page business region antiPlaceholderStatus must be pass before blueprint readiness.", {
      ...regionContext,
      antiPlaceholderStatus,
    });
  }

  if (!emptyState && (!Number.isFinite(renderedExampleCount) || renderedExampleCount <= 0)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_RENDERED_EXAMPLE_COUNT_MISSING", "Lower-page business region must include renderedExampleCount greater than 0 unless it declares an intentional empty-state component.", {
      ...regionContext,
      renderedExampleCount: Number.isFinite(renderedExampleCount) ? renderedExampleCount : firstText(region.renderedExampleCount, region.exampleCount),
    });
  }
  if (emptyState) validateLowerPageEmptyState(findings, region, regionContext);

  if (!renderedExampleSummary) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_RENDERED_EXAMPLE_SUMMARY_MISSING", "Lower-page business region must include renderedExampleSummary with actual sample rows/cards/items.", regionContext);
  } else if (isPlaceholderOnlyRenderedSummary(renderedExampleSummary, displayedBusinessFields)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_RENDERED_EXAMPLE_PLACEHOLDER_ONLY", "renderedExampleSummary must describe actual rendered rows/cards/items, not only source notes, field lists, or Show-style explanatory text.", {
      ...regionContext,
      renderedExampleSummary,
    });
  }

  if (/generic notes?|notes/i.test(visualPattern) || /generic notes?|notes/i.test(plannedControl)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_GENERIC_VISUAL_PATTERN", "Lower-page business region cannot use generic notes as its visual pattern or planned control.", {
      ...regionContext,
      visualPattern,
      plannedYeeflowControl: plannedControl,
    });
  }

  const hasBlocking =
    !visualPattern ||
    !plannedControl ||
    !SUPPORTED_LOWER_REGION_PATTERN_RE.test(visualPattern) ||
    !SUPPORTED_LOWER_REGION_PATTERN_RE.test(plannedControl) ||
    !isPassingReviewStatus(visualConcretenessStatus) ||
    !isPassingReviewStatus(antiPlaceholderStatus) ||
    (!emptyState && (!Number.isFinite(renderedExampleCount) || renderedExampleCount <= 0)) ||
    !renderedExampleSummary ||
    isPlaceholderOnlyRenderedSummary(renderedExampleSummary, displayedBusinessFields);
  if (hasBlocking) {
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_LOWER_REGION_VISUAL_CONCRETENESS", "Form/detail artifact cannot be ready for blueprint when lower-page regions are not visually concrete.", context);
  }
}

function validateLowerPageRegionSemanticConsistency(findings, region, artifact, context = {}) {
  const regionName = firstText(region.regionName, region.name);
  const regionContext = { ...context, regionName: regionName || scalarRegion(region) };
  const source = firstText(region.sourceList, region.sourceListOrDataSource, region.dataSource, region.source);
  const purpose = firstText(region.regionPurpose, region.purpose);
  const fields = asArray(region.displayedFields || region.displayedItems || region.fields).map(scalar).filter(Boolean);
  const businessFields = asArray(region.displayedBusinessFields || region.businessFields).map(scalar).filter(Boolean);
  const actions = asArray(region.actionsShown || region.actions || region.actionOrReadOnlyBehavior || region.behavior).map(scalar).filter(Boolean);
  const blueprintMappingHint = firstText(region.blueprintMappingHint, region.blueprintHint, region.controlMappingHint);
  const behavior = firstText(region.behavior, region.actionOrReadOnlyBehavior);
  const proofImpact = firstText(region.proofImpact, region.validationImpact);
  const category = inferLowerRegionCategory(region);
  const combined = [source, regionName, purpose, fields, businessFields, actions, blueprintMappingHint, behavior, proofImpact].flatMap((value) => asArray(value).length ? asArray(value) : [value]).map(scalar).join(" ");

  if (businessFields.length && fields.length && !sameFieldList(businessFields, fields) && !hasSemanticMappingExplanation(region)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_FIELD_SEMANTIC_MISMATCH", "displayedBusinessFields and displayedFields must match or include fieldAliasMap, semanticFieldMapping, runtime-proof-required, export-learning-required, or deferred explanation.", {
      ...regionContext,
      displayedBusinessFields: businessFields,
      displayedFields: fields,
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_LOWER_REGION_SEMANTIC_MISMATCH", "Form/detail artifact cannot be ready for blueprint when lower-page region field semantics are inconsistent.", context);
  }

  if (!category) return;
  const profile = REGION_SEMANTIC_PROFILES[category];
  if (profile?.required && !profile.required.test(combined)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_REQUIRED_SEMANTICS_MISSING", "Lower-page business region fields/actions/mapping must include semantics matching its source list and purpose.", {
      ...regionContext,
      sourceListOrDataSource: source,
      inferredCategory: category,
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_LOWER_REGION_SEMANTIC_MISMATCH", "Form/detail artifact cannot be ready for blueprint when lower-page region source/purpose/fields/actions are semantically inconsistent.", context);
  }
  if (profile?.forbidden && profile.forbidden.test(combined) && !hasAllowedCrossObjectExplanation(region, category)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_CROSS_OBJECT_SEMANTIC_MISMATCH", "Lower-page business region mixes source-list semantics, displayed fields, actions, or mapping hints from a different business object.", {
      ...regionContext,
      sourceListOrDataSource: source,
      inferredCategory: category,
      fields,
      actions,
      blueprintMappingHint,
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_LOWER_REGION_SEMANTIC_MISMATCH", "Form/detail artifact cannot be ready for blueprint when lower-page region source/purpose/fields/actions are semantically inconsistent.", context);
  }
  if (actions.length && profile?.allowedActions && !actions.every((action) => profile.allowedActions.test(action) || /read[- ]only|none|required|not applicable|n\/a/i.test(action) || hasAllowedCrossObjectExplanation(region, category))) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_ACTION_SEMANTIC_MISMATCH", "actionsShown must match the lower-page region business object or document an explicit related-record explanation.", {
      ...regionContext,
      inferredCategory: category,
      actions,
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_LOWER_REGION_SEMANTIC_MISMATCH", "Form/detail artifact cannot be ready for blueprint when lower-page region actions belong to another business object.", context);
  }
  if (blueprintMappingHint && isWrongBlueprintMappingForCategory(blueprintMappingHint, category) && !hasAllowedCrossObjectExplanation(region, category)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_BLUEPRINT_MAPPING_SEMANTIC_MISMATCH", "blueprintMappingHint must reference the same source list/business object or explain a valid related-record relationship.", {
      ...regionContext,
      sourceListOrDataSource: source,
      inferredCategory: category,
      blueprintMappingHint,
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_LOWER_REGION_SEMANTIC_MISMATCH", "Form/detail artifact cannot be ready for blueprint when lower-page region blueprint mapping points to the wrong business object.", context);
  }
}

function validateLowerPageEmptyState(findings, region, context = {}) {
  const emptyState = region.emptyState && typeof region.emptyState === "object" ? region.emptyState : region;
  if (!firstText(emptyState.emptyStateComponent, emptyState.component, emptyState.visualComponent)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_EMPTY_STATE_COMPONENT_MISSING", "Intentional empty lower-page regions must show an empty-state component, not blank space or explanation text.", context);
  }
  if (!firstText(emptyState.emptyStateReason, emptyState.reason)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_EMPTY_STATE_REASON_MISSING", "Intentional empty lower-page regions must include an empty-state reason.", context);
  }
  if (!firstText(emptyState.emptyStateNextAction, emptyState.nextAction)) {
    addFinding(findings, "error", "FORM_DETAIL_LOWER_REGION_EMPTY_STATE_NEXT_ACTION_MISSING", "Intentional empty lower-page regions must include a next action.", context);
  }
}

function isPlaceholderOnlyRenderedSummary(summary, displayedFields = []) {
  const text = scalar(summary).trim();
  if (!text) return true;
  if (PLACEHOLDER_REGION_TEXT_RE.test(text)) return true;
  if (FIELD_LIST_ONLY_RE.test(text) && !/[=:]\s*[^,;|]+/.test(text)) return true;
  const normalized = normalizeKey(text);
  const fieldLabels = displayedFields.map(scalar).filter(Boolean);
  if (fieldLabels.length >= 2) {
    const fieldOnlyText = normalizeKey(fieldLabels.join(", "));
    if (normalized === fieldOnlyText) return true;
  }
  const hasConcreteValueMarker = /[=:]\s*[^,;|]+|\b(row|card|item|task|document|decision|timeline|checklist|signed|received|owner|due|approved|pending|msa-|acme|mira|legal|finance|net\s+\d+)\b/i.test(text);
  return !hasConcreteValueMarker;
}

function validatePageSpecificQualityEvidence(findings, artifact, context = {}) {
  const entries = asArray(artifact.pageSpecificQualityEvidence || artifact.businessQualityEvidence);
  if (entries.length < 2) {
    addFinding(findings, "error", "FORM_DETAIL_PAGE_SPECIFIC_QUALITY_EVIDENCE_MISSING", "Form/detail artifacts must include at least two pageSpecificQualityEvidence entries.", context);
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_PAGE_SPECIFIC_QUALITY_EVIDENCE", "Form/detail artifact cannot be ready for blueprint without page-specific quality evidence.", context);
    return;
  }
  const meaningfulEntries = entries.filter((entry) => {
    const text = scalar(entry);
    return BUSINESS_NOUN_RE.test(text) && !isGenericQualityOnly(text);
  });
  if (meaningfulEntries.length < 2) {
    addFinding(findings, "error", "FORM_DETAIL_PAGE_SPECIFIC_QUALITY_EVIDENCE_GENERIC", "Page-specific quality evidence must name business objects, planned resources, fields, records, history, or actions; generic checklist text is not enough.", {
      ...context,
      evidence: entries.map(scalar).join(" | "),
    });
    blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITHOUT_PAGE_SPECIFIC_QUALITY_EVIDENCE", "Form/detail artifact cannot be ready for blueprint when page-specific quality evidence is generic-only.", context);
  }
}

function validateTemplateReuseStatus(findings, artifact, context = {}) {
  const status = lower(firstText(artifact.templateReuseRiskStatus));
  if (!status) {
    addFinding(findings, "error", "FORM_DETAIL_TEMPLATE_REUSE_RISK_STATUS_MISSING", "Form/detail artifacts must declare templateReuseRiskStatus.", context);
    return;
  }
  if (!/^(pass|warning|fail|human_review_required|human[-_ ]review[-_ ]required)$/i.test(status)) {
    addFinding(findings, "error", "FORM_DETAIL_TEMPLATE_REUSE_RISK_STATUS_INVALID", "templateReuseRiskStatus must be pass, warning, fail, or human_review_required.", {
      ...context,
      templateReuseRiskStatus: status,
    });
  }
  if (/(fail|human[-_ ]review[-_ ]required)/i.test(status) && !isDeferredWithProof(artifact)) {
    addFinding(findings, "error", "FORM_DETAIL_TEMPLATE_REUSE_RISK_BLOCKS_BLUEPRINT", "templateReuseRiskStatus fail or human_review_required blocks blueprint readiness unless deferred with reason, fallback, and proof impact.", {
      ...context,
      templateReuseRiskStatus: status,
    });
  }
}

function validateTemplateReuseRisk(findings, entries) {
  const groups = new Map();
  for (const entry of entries) {
    const artifact = entry.artifact;
    if (isDeferredWithProof(artifact)) continue;
    const signature = [
      normalizeSignatureValue(artifact.includedSections),
      normalizeSignatureValue(artifact.semanticFieldExamples || artifact.fieldValueExamples || artifact.businessFieldExamples),
      normalizeSignatureValue(artifact.lowerPageBusinessRegions || artifact.businessRegionEvidence || artifact.lowerPageRegions),
    ].join("||");
    if (!signature || signature === "||||") continue;
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(entry);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const justified = group.every(({ artifact }) => hasPurposefulFormDifference(artifact));
    if (justified) continue;
    for (const { artifact, index, surfaceName, surfaceType } of group) {
      addFinding(findings, "error", "FORM_DETAIL_TEMPLATE_REUSE_RISK", "Multiple form/detail artifacts reuse identical sections, semantic fields, and lower-page regions without declared purposeful functional differences.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
      blockReadyForBlueprint(findings, artifact, "FORM_DETAIL_READY_WITH_TEMPLATE_REUSE_RISK", "Form/detail artifact cannot be ready for blueprint when template reuse risk is unresolved.", {
        row: index + 1,
        surfaceName,
        surfaceType,
      });
    }
  }
}

function normalizeFieldExamples(value) {
  const items = asArray(value);
  if (!items.length && typeof value === "string") return parseFieldExamplesText(value);
  return items.flatMap((item) => {
    if (item && typeof item === "object") return [item];
    return parseFieldExamplesText(item);
  });
}

function parseFieldExamplesText(value) {
  return scalar(value)
    .split(/[;\n|]+/)
    .map((part) => {
      const match = part.match(/^\s*([^:=]+?)\s*(?:=|:)\s*(.+?)\s*$/);
      return match ? { field: match[1].trim(), value: match[2].trim() } : null;
    })
    .filter(Boolean);
}

function scalarRegion(region) {
  if (region && typeof region === "object") {
    return [
      region.name,
      region.regionName,
      region.purpose,
      region.regionPurpose,
      region.sourceList,
      region.dataSource,
      region.sourceListOrDataSource,
      region.visualPattern,
      region.plannedYeeflowControl,
      region.renderedExampleSummary,
      region.displayedBusinessFields,
      region.displayedFields,
      region.displayedItems,
      region.actionsShown,
      region.behavior,
      region.actionOrReadOnlyBehavior,
      region.visualConcretenessStatus,
      region.antiPlaceholderStatus,
      region.blueprintMappingHint,
      region.proofImpact,
    ]
      .flatMap((value) => asArray(value).length ? asArray(value) : [value])
      .map(scalar)
      .join(" ");
  }
  return scalar(region);
}

function isGenericQualityOnly(value) {
  const text = scalar(value).trim();
  if (!text) return true;
  const stripped = text.replace(GENERIC_QUALITY_RE, "").replace(/[,\s.;:-]+/g, "");
  return !stripped || !BUSINESS_NOUN_RE.test(text);
}

function normalizeSignatureValue(value) {
  return JSON.stringify(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasPurposefulFormDifference(artifact) {
  const text = [
    artifact.formPurposeDifferentiators,
    artifact.purposefulDifferences,
    artifact.functionalDifferences,
    artifact.templateReuseJustification,
  ]
    .flatMap((value) => asArray(value).length ? asArray(value) : [value])
    .map(scalar)
    .join(" ");
  return /\b(action|read[- ]only|decision|comment|workflow|approval|task|submission|print|field|section|history|document|checklist|timeline|purposeful|different)\b/i.test(text);
}

function hasReviewedRiskEvidence(artifact) {
  return (
    firstText(artifact.visualUsabilityRisk, artifact.reviewedRisk, artifact.risk) &&
    firstText(artifact.visualUsabilityMitigation, artifact.riskMitigation, artifact.mitigation) &&
    firstText(artifact.visualUsabilityProofImpact, artifact.proofImpact, artifact.validationImpact)
  );
}

function validateSvgUsabilityHints(findings, artifact, context = {}) {
  const svgPath = firstText(artifact.sourceSvgPath, artifact.svgSourcePath, artifact.canonicalSvgPath, artifact.sourceDesignPath);
  if (!svgPath || !/\.svg$/i.test(svgPath)) return;
  const resolved = path.resolve(context.manifestFile ? path.dirname(context.manifestFile) : process.cwd(), svgPath);
  if (!fs.existsSync(resolved)) {
    if (!firstText(artifact.visualUsabilityReviewStatus, artifact.visualUsabilityStatus)) {
      addFinding(findings, "error", "DESIGN_ARTIFACT_SVG_SOURCE_UNAVAILABLE_WITHOUT_USABILITY_REVIEW", "When an SVG/source artifact cannot be inspected, blueprint-ready rows must include explicit visual usability review metadata.", {
        ...context,
        sourceSvgPath: safePath(svgPath),
      });
    }
    return;
  }
  const svg = fs.readFileSync(resolved, "utf8");
  const textNodes = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map((match) => stripTags(match[1]).trim()).filter(Boolean);
  const wrappingText = firstText(artifact.textWrappingStrategy, artifact.containerBoundaryEvidence, artifact.visualUsabilityFindings);
  if (textNodes.some((text) => text.length > 36) && !WRAP_TRUNCATE_RE.test(wrappingText)) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_SVG_LONG_TEXT_WITHOUT_WRAP_STRATEGY", "SVG source contains long text labels but the manifest does not declare wrapping, truncation, ellipsis, or responsive layout strategy.", context);
  }
  const positions = [...svg.matchAll(/<text\b[^>]*\bx=["']?([0-9.]+)["']?[^>]*\by=["']?([0-9.]+)["']?[^>]*>/gi)].map((match) => `${match[1]}:${match[2]}`);
  const duplicatePositions = positions.filter((position, index) => positions.indexOf(position) !== index);
  if (duplicatePositions.length && !/pass|reviewed|intentional|no overlap/i.test(firstText(artifact.overlapStatus, artifact.containerBoundaryEvidence, artifact.visualUsabilityFindings))) {
    addFinding(findings, "error", "DESIGN_ARTIFACT_SVG_TEXT_OVERLAP_RISK", "SVG source has repeated fixed text coordinates that may indicate overlapping labels; overlap evidence must explicitly review this risk.", {
      ...context,
      repeatedTextPositions: [...new Set(duplicatePositions)].slice(0, 5),
    });
  }
}

function inferLowerRegionCategory(region) {
  const source = lower(firstText(region.sourceList, region.sourceListOrDataSource, region.dataSource, region.source));
  const namePurpose = lower([region.regionName, region.name, region.regionPurpose, region.purpose].map(scalar).join(" "));
  if (/\b(signature|signer|signed|print signature)\b/.test(namePurpose)) return "signature";
  if (/\b(checklist|required document policy|required document checklist)\b/.test(namePurpose)) return "checklist";
  if (/\b(renewal task|renewal tasks|tasks?|reminders?)\b/.test(source)) return "renewalTask";
  if (/\b(contract documents?|documents?|files?|attachments?|evidence)\b/.test(source)) return "document";
  if (/\b(contract approval|approval|approval history|approval route)\b/.test(source)) return "approval";
  if (/\b(audit|activity)\b/.test(source)) return "audit";
  if (/\b(signature|signer)\b/.test(source)) return "signature";
  if (/\b(checklist|required documents?)\b/.test(source)) return "checklist";
  if (/\b(contracts?)\b/.test(source)) return "contract";
  const combined = `${source} ${namePurpose}`;
  if (/\b(signature|signer|signed|print signature)\b/.test(combined)) return "signature";
  if (/\b(checklist|required document policy|required document checklist)\b/.test(combined)) return "checklist";
  if (/\b(approval history|approval route|approval|reviewer|decision)\b/.test(combined)) return "approval";
  if (/\b(audit|activity|activity feed|actor)\b/.test(combined)) return "audit";
  if (/\b(document|documents|file|attachment|evidence)\b/.test(combined)) return "document";
  if (/\b(renewal task|renewal tasks|task|tasks|reminder|reminders)\b/.test(combined)) return "renewalTask";
  if (/\b(linked contracts|contracts|contract)\b/.test(combined)) return "contract";
  return "";
}

function sameFieldList(left, right) {
  const normalize = (values) => values.map((value) => normalizeKey(value)).filter(Boolean);
  const a = normalize(left);
  const b = normalize(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function hasSemanticMappingExplanation(region) {
  if (region.fieldAliasMap || region.semanticFieldMapping) return true;
  const text = [
    region.fieldAliasMap,
    region.semanticFieldMapping,
    region.relatedRecordRelationship,
    region.relationshipExplanation,
    region.proofLabel,
    region.visualConcretenessStatus,
    region.proofImpact,
    region.validationImpact,
  ]
    .flatMap((value) => asArray(value).length ? asArray(value) : [value])
    .map(scalar)
    .join(" ");
  return /\b(field alias|semantic field mapping|runtime-proof-required|export-learning-required|deferred|fallback|proof impact)\b/i.test(text) || isDeferredWithProof(region);
}

function hasAllowedCrossObjectExplanation(region, category) {
  const text = [
    region.relatedRecordRelationship,
    region.relationshipExplanation,
    region.semanticFieldMapping,
    region.blueprintMappingHint,
    region.proofImpact,
    region.proofLabel,
  ]
    .flatMap((value) => asArray(value).length ? asArray(value) : [value])
    .map(scalar)
    .join(" ");
  if (/\b(runtime-proof-required|export-learning-required|deferred)\b/i.test(text) && firstText(region.proofImpact, region.validationImpact, region.fallback, region.fallbackPlan)) return true;
  if (category === "renewalTask" && /\b(related contract|contract context|filtered by current contract)\b/i.test(text)) return true;
  if (category === "contract" && /\b(filtered by current vendor|attached to current vendor|current vendor relationship|vendor contracts)\b/i.test(text) && !/\b(task|tasks|renewal tasks)\b/i.test(text)) return true;
  return false;
}

function isWrongBlueprintMappingForCategory(hint, category) {
  const text = lower(hint);
  if (!text) return false;
  if (category === "contract") return /\b(renewal tasks?|task detail|mark complete|task cards?)\b/.test(text);
  if (category === "renewalTask") return /\b(contract documents?|approval history|signature block)\b/.test(text) && !/\b(tasks?|renewal tasks?)\b/.test(text);
  if (category === "document") return /\b(renewal tasks?|task detail|mark complete|contract lifecycle|approval route)\b/.test(text) && !/\b(documents?|files?|evidence|attachments?)\b/.test(text);
  if (category === "approval") return /\b(contract documents?|document cards?|renewal tasks?|task cards?)\b/.test(text) && !/\b(approval|review|decision|route|history)\b/.test(text);
  if (category === "audit") return /\b(documents?|tasks?|signature)\b/.test(text) && !/\b(audit|activity|actor|record)\b/.test(text);
  if (category === "signature") return /\b(tasks?|documents?|kanban|collection)\b/.test(text) && !/\b(signature|signer|print|pdf)\b/.test(text);
  if (category === "checklist") return /\b(renewal tasks?|task cards?|contract lifecycle)\b/.test(text) && !/\b(checklist|required|received|evidence|document)\b/.test(text);
  return false;
}

function stripTags(value) {
  return scalar(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
}

function blockReadyForBlueprint(findings, artifact, code, message, context = {}) {
  if (!truthy(artifact.readyForBlueprint)) return;
  addFinding(findings, "error", code, message, context);
}

function requirePassingStatus(findings, object, keys, code, message, context = {}) {
  const status = lower(firstText(...keys.map((key) => object?.[key])));
  if (!status) {
    addFinding(findings, "error", code, message, context);
    return;
  }
  if (/human[-_ ]review[-_ ]required|review[-_ ]required|unknown|pending|not[-_ ]validated|fail/i.test(status) && !isDeferredWithProof(object)) {
    addFinding(findings, "error", code.replace(/_MISSING$/, "_NOT_PASSING"), `${message} Human-review-required, unknown, pending, or failing statuses block blueprint readiness unless deferred with reason, fallback, and proof impact.`, {
      ...context,
      status,
    });
  }
}

function isPassingReviewStatus(status) {
  return /^(pass|passed|validated|verified|compliant|layout[-_ ]fidelity[-_ ]pass|visual[-_ ]quality[-_ ]pass)$/i.test(scalar(status).trim());
}

function validateDeferredSurface(findings, deferred) {
  const surfaceName = firstText(deferred.surfaceName, deferred.name, deferred.pageName, deferred.formName);
  const surfaceType = firstText(deferred.surfaceType, deferred.yeeflowSurfaceType, deferred.type);
  if (!firstText(deferred.reason, deferred.deferredReason) || !firstText(deferred.fallback, deferred.fallbackPlan) || !firstText(deferred.proofImpact, deferred.validationImpact)) {
    addFinding(findings, "error", "DEFERRED_DESIGN_SURFACE_INCOMPLETE", "Deferred design surfaces must include reason, fallback, and proof impact.", {
      surfaceName,
      surfaceType,
    });
  }
}

function approvalResourcesWithAnySurface(surfaces) {
  const resourceNames = new Set();
  for (const surface of surfaces) {
    const type = firstText(surface.surfaceType, surface.yeeflowSurfaceType, surface.type);
    const name = firstText(surface.sourceResourceName, surface.resourceName);
    if (APPROVAL_RE.test(type) && (SUBMISSION_RE.test(type) || TASK_RE.test(type) || PRINT_RE.test(type)) && name) resourceNames.add(name);
  }
  return [...resourceNames];
}

function requireText(findings, object, keys, code, message, detail = {}) {
  if (!firstText(...keys.map((key) => object?.[key]))) addFinding(findings, "error", code, message, detail);
}

function isFormReportSurface(surface) {
  const combined = [surface?.surfaceType, surface?.yeeflowSurfaceType, surface?.type, surface?.sourceAppPlanSection].map(scalar).join(" ");
  return FORM_REPORT_RE.test(combined);
}

function isFormDetailSurface(surface) {
  const combined = [surface?.surfaceType, surface?.yeeflowSurfaceType, surface?.type].map(scalar).join(" ");
  return FORM_DETAIL_SURFACE_RE.test(combined) && !FORM_REPORT_RE.test(combined);
}

function surfaceKey(surface) {
  const name = normalizeKey(firstText(surface.surfaceName, surface.name, surface.pageName, surface.formName));
  const type = normalizeKey(firstText(surface.surfaceType, surface.yeeflowSurfaceType, surface.type));
  const resource = normalizeKey(firstText(surface.sourceResourceName, surface.resourceName));
  if (!name || !type) return "";
  return `${type}::${resource}::${name}`;
}

function firstText(...values) {
  for (const value of values) {
    const text = scalar(value).trim();
    if (text) return text;
  }
  return "";
}

function lower(value) {
  return scalar(value).trim().toLowerCase();
}

function normalizeKey(value) {
  return scalar(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePathToken(value) {
  return scalar(value).trim().replace(/\\/g, "/").replace(/\/+$/, "");
}

function sameText(a, b) {
  return normalizeKey(a) === normalizeKey(b);
}

function truthy(value) {
  if (value === true) return true;
  if (typeof value === "number") return value > 0;
  return /^(true|yes|y|included|complete|ready|pass)$/i.test(scalar(value).trim());
}

function isDeferred(value) {
  const text = [value?.status, value?.fullPageCoverageStatus, value?.readyForBlueprint, value?.proofLabel].map(scalar).join(" ");
  return /\bdeferred\b/i.test(text);
}

function isDeferredWithProof(value) {
  return isDeferred(value) && firstText(value?.reason, value?.deferredReason) && firstText(value?.fallback, value?.fallbackPlan) && firstText(value?.proofImpact, value?.validationImpact);
}

function parseTime(value) {
  const text = scalar(value).trim();
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? time : null;
}

function escapeRegex(value) {
  return scalar(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseArgs(argv) {
  const args = { manifest: "", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--manifest") args.manifest = argv[++index] || "";
    else if (arg === "--json" || arg === "--format=json") args.json = true;
    else if (arg === "--format") args.json = (argv[++index] || "").toLowerCase() === "json";
    else if (!arg.startsWith("-") && !args.manifest) args.manifest = arg;
  }
  return args;
}

function renderMarkdown(result) {
  const lines = [
    `Full-page design artifacts validation: ${result.status}`,
    `Manifest: ${result.manifest || "unknown"}`,
    `Required design surfaces: ${result.counts.requiredDesignSurfaces}`,
    `Design artifacts: ${result.counts.designArtifacts}`,
    `Deferred surfaces: ${result.counts.deferredSurfaces}`,
    "",
    result.proofBoundary,
  ];
  if (result.findings.length) {
    lines.push("", "Findings:");
    for (const finding of result.findings) lines.push(`- ${finding.level}: ${finding.code} - ${finding.message}`);
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifest) {
    console.error("Usage: node scripts/validate-full-page-design-artifacts.mjs --manifest <design-image-manifest.json> [--json]");
    process.exit(2);
  }
  const manifest = readJsonFile(args.manifest);
  const result = validateFullPageDesignArtifacts(manifest, { manifestFile: args.manifest });
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else process.stdout.write(renderMarkdown(result));
  process.exit(result.status === "pass" ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
