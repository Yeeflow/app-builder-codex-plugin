#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { addFinding, asArray, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

const FORM_REPORT_RE = /\bform\s*report\b/i;
const DASHBOARD_RE = /\bdashboard\b|\boperational\s+home\b|\bworkbench\b|\bworkspace\b|\bqueue\b/i;
const APPROVAL_RE = /\bapproval\b/i;
const SUBMISSION_RE = /\bsubmission\b/i;
const TASK_RE = /\btask\b/i;
const PRINT_RE = /\bprint\b/i;

export function validateFullPageDesignArtifacts(manifest, options = {}) {
  const findings = [];
  const manifestFile = options.manifestFile || null;
  const designSystemPath = firstText(manifest.designSystemPath, manifest.applicationDesignSystemPath, manifest.applicationDesignSystem?.path);
  const artifacts = asArray(manifest.artifacts || manifest.designArtifacts || manifest.manifestRows || manifest.rows);
  const plannedSurfaces = asArray(manifest.plannedSurfaces || manifest.requiredSurfaces || manifest.sourceSurfaces);
  const deferredSurfaces = asArray(manifest.deferredSurfaces || manifest.deferrals || artifacts.filter((artifact) => isDeferred(artifact)));

  requireText(findings, manifest, ["applicationName", "appName"], "DESIGN_MANIFEST_APPLICATION_NAME_MISSING", "Design Image Manifest must name the application.");
  requireText(findings, manifest, ["pluginVersion"], "DESIGN_MANIFEST_PLUGIN_VERSION_MISSING", "Design Image Manifest must include the plugin version.");
  requireText(findings, manifest, ["sourceFunctionalSpecificationPath", "functionalSpecificationPath", "sourceFunctionalSpecification"], "DESIGN_MANIFEST_SOURCE_SPEC_MISSING", "Design Image Manifest must reference the source Functional Specification.");
  requireText(findings, manifest, ["sourceAppPlanPath", "appPlanPath", "sourceAppPlan"], "DESIGN_MANIFEST_SOURCE_APP_PLAN_MISSING", "Design Image Manifest must reference the source Yeeflow App Plan.");
  requireText(findings, manifest, ["selectedApplicationLayout", "applicationLayout"], "DESIGN_MANIFEST_APPLICATION_LAYOUT_MISSING", "Design Image Manifest must declare the selected Yeeflow Application Layout.");

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
      if (!truthy(artifact.includeHeaderNavigation) && !truthy(artifact.headerNavigationIncluded)) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_HEADER_NAVIGATION_MISSING", "Dashboard/page design artifacts must include the selected application layout shell with header/navigation where applicable.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      }
      if (!firstText(artifact.selectedApplicationLayout, artifact.applicationLayout, manifest.selectedApplicationLayout)) {
        addFinding(findings, "error", "DASHBOARD_DESIGN_APPLICATION_LAYOUT_MISSING", "Dashboard/page design artifacts must reference the selected Yeeflow Application Layout.", {
          row: index + 1,
          surfaceName,
          surfaceType,
        });
      }
    }

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

function parseTime(value) {
  const text = scalar(value).trim();
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? time : null;
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
