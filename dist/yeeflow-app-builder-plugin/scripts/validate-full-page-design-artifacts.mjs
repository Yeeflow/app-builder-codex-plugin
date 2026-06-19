#!/usr/bin/env node

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
