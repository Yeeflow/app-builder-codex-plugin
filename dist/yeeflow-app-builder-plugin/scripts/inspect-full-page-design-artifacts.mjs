#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { addFinding, asArray, isObject, readJsonFile, safePath, scalar, statusFromFindings } from "./lib/yeeflow-ui-hard-gate-utils.mjs";

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.manifest) usage(args.help ? 0 : 1);
  const report = inspectFullPageDesignArtifacts(args);
  console.log(args.format === "markdown" ? formatMarkdown(report) : JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function inspectFullPageDesignArtifacts({ manifest: manifestPath, format = "json" } = {}) {
  const findings = [];
  const manifest = readJsonFile(manifestPath);
  const appPlan = manifest.appPlan || manifest.plan || {};
  const pages = asArray(manifest.pages);
  const plannedPages = asArray(appPlan.pages || manifest.plannedPages || pages);
  const plannedBySlug = new Map(plannedPages.map((page) => [pageSlug(page), page]));

  if (!pages.length) {
    addFinding(findings, "error", "FULL_PAGE_DESIGN_ARTIFACT_MISSING", "Every planned page requires a canonical full-page PNG design artifact before blueprinting or generation.");
  }

  for (const planned of plannedPages) {
    const slug = pageSlug(planned);
    const page = pages.find((candidate) => pageSlug(candidate) === slug);
    if (!page) {
      addFinding(findings, "error", "FULL_PAGE_DESIGN_ARTIFACT_MISSING", "Missing canonical design artifact for planned page.", { page: slug });
    }
  }

  for (const page of pages) {
    const slug = pageSlug(page);
    const planned = plannedBySlug.get(slug) || {};
    const png = scalar(page.canonicalPngPath || page.canonicalPng || page.path);
    if (!png || !/\.design\.png$/i.test(png)) {
      addFinding(findings, "error", "FULL_PAGE_DESIGN_ARTIFACT_MISSING", "Canonical page design must be a per-page .design.png artifact.", { page: slug });
    }
    if (/\.svg$/i.test(png) || page.canonicalFormat === "svg" || page.svgAsCanonical === true) {
      addFinding(findings, "error", "DESIGN_USES_SVG_AS_CANONICAL", "SVG may be optional source only and cannot replace the canonical per-page PNG.");
    }
    if (/00-design-board\.png$/i.test(png) || page.designBoardOnly === true) {
      addFinding(findings, "error", "DESIGN_BOARD_USED_AS_PAGE_ARTIFACT", "A combined design board cannot replace per-page canonical PNGs.");
    }
    if (page.viewportOnly === true || page.cropOnly === true) {
      addFinding(findings, "error", "DESIGN_IMAGE_VIEWPORT_CROP_ONLY", "Viewport-only or cropped top-page mockups are not implementation-ready full-page design artifacts.");
    }
    if (page.fullPage !== true && page.completeDesignBoard !== true && page.noBelowFoldContent !== true) {
      addFinding(findings, "error", "CANONICAL_PAGE_DESIGN_NOT_FULL_PAGE", "Canonical design image must show the full scrollable page content or a complete design board.");
    }
    if (page.pageEndVisible !== true && page.noBelowFoldContent !== true) {
      addFinding(findings, "error", "DESIGN_IMAGE_MISSING_PAGE_END", "Canonical full-page design must show the lower-page regions and page end.");
    }

    const designSections = new Set(asArray(page.sections).map(normalizeName).filter(Boolean));
    const requiredSections = asArray(planned.sections || page.plannedSections).map(normalizeName).filter(Boolean);
    for (const section of requiredSections) {
      if (!designSections.has(section)) {
        addFinding(findings, "error", "DESIGN_IMAGE_MISSING_PLANNED_SECTION", "Canonical page design is missing a planned app section.", { page: slug, section });
      }
    }

    for (const table of asArray(page.tables || page.tableSections)) {
      if (table.detailComplete === false || table.columnsComplete === false || table.rowTreatmentComplete === false) {
        addFinding(findings, "error", "DESIGN_IMAGE_MISSING_TABLE_DETAIL", "Canonical page design must include table columns, row treatment, and detail-link cues when a table is planned.", { page: slug, table: safeLabel(table) });
      }
    }
    for (const form of asArray(page.forms || page.formSections)) {
      if (form.detailComplete === false || form.fieldsComplete === false || form.actionsComplete === false) {
        addFinding(findings, "error", "DESIGN_IMAGE_MISSING_FORM_DETAIL", "Canonical page design must include form fields, sections, actions, and page end when a form is planned.", { page: slug, form: safeLabel(form) });
      }
    }
    for (const region of asArray(page.unresolvedPlaceholders || page.placeholderRegions)) {
      addFinding(findings, "error", "DESIGN_IMAGE_PLACEHOLDER_REGION_UNRESOLVED", "Canonical page design must resolve placeholder regions before implementation.", { page: slug, region: safeLabel(region) });
    }
  }

  validateStepEvidence(manifest.workflow || manifest.stepEvidence, findings);

  return {
    status: statusFromFindings(findings),
    manifest: safePath(manifestPath),
    findings,
  };
}

function validateStepEvidence(workflow, findings) {
  if (!workflow) return;
  const required = [
    "functionalSpec",
    "appPlan",
    "fullPageDesignImages",
    "pageImplementationBlueprint",
    "controlPropertyContract",
    "resourceGeneration",
    "decodedResourceParityValidation",
    "localHardGates",
  ];
  for (const step of required) {
    const evidence = workflow[step];
    if (!isComplete(evidence)) {
      addFinding(findings, "error", "STEP_COMPLETION_EVIDENCE_MISSING", "Each generation stage requires explicit completion evidence before the next stage starts.", { step });
    }
  }
  const order = [
    ["appPlan", "functionalSpec"],
    ["fullPageDesignImages", "appPlan"],
    ["pageImplementationBlueprint", "fullPageDesignImages"],
    ["resourceGeneration", "pageImplementationBlueprint"],
    ["packageSignUpgrade", "decodedResourceParityValidation"],
    ["runtimeProof", "packageSignUpgrade"],
  ];
  for (const [next, prior] of order) {
    if (started(workflow[next]) && !isComplete(workflow[prior])) {
      addFinding(findings, "error", "NEXT_STEP_STARTED_WITH_INCOMPLETE_PRIOR_STEP", "Do not start the next generation stage until the prior stage has complete evidence.", { nextStep: next, priorStep: prior });
    }
  }
}

function isComplete(step) {
  return isObject(step) && (step.status === "complete" || step.status === "pass") && Boolean(step.evidence || step.artifact || step.path || step.completedAt);
}

function started(step) {
  return isObject(step) && step.status && step.status !== "not-started";
}

function pageSlug(page) {
  return scalar(page.pageSlug || page.slug || page.id || page.title || page.name).trim();
}

function normalizeName(value) {
  return scalar(value?.id || value?.slug || value?.title || value?.name || value).trim().toLowerCase();
}

function safeLabel(value) {
  return scalar(value?.id || value?.slug || value?.title || value?.name || value);
}

function parseArgs(argv) {
  const args = { format: "json" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--manifest") args.manifest = argv[++index];
    else if (arg === "--format") args.format = argv[++index];
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage: node scripts/inspect-full-page-design-artifacts.mjs --manifest <design-image-manifest.json> [--format json|markdown]");
  process.exit(exitCode);
}

function formatMarkdown(report) {
  const lines = [`# Full-Page Design Artifact Fidelity: ${report.status}`];
  for (const finding of report.findings) lines.push(`- ${finding.level}: ${finding.code} - ${finding.message}`);
  return lines.join("\n");
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
