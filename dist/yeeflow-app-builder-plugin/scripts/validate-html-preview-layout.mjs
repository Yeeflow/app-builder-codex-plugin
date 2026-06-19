#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PROOF_BOUNDARY =
  "HTML preview validation proves high-fidelity design-preview readiness only; it does not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.";
const DESIGN_TOKEN_RE = /\b(data-design-system|data-design-token|design-token|ds-|yf-token|--yf-|--yeeflow-)\b/i;
const PATTERN_REF_RE = /\b(data-ui-pattern-template|ui-pattern-template|data-pattern-ref|pattern-template-ref)\b/i;
const RAW_SCAFFOLD_RE = /\b(raw scaffold|plain field dump|generic admin table|unstyled controls|unstyled form|todo placeholder|lorem ipsum)\b/i;
const TYPOGRAPHY_RE = /\b(h1|h2|page-title|section-title|text-(xl|lg|sm)|font-weight|typography|heading)\b/i;
const SPACING_RE = /\b(gap-|padding-|margin-|space-|--yf-spacing|density|section-gap)\b/i;
const ACTION_PLACEMENT_RE = /\b(action-bar|primary-action|secondary-action|button-row|sticky-actions|decision-actions|form-actions)\b/i;
const RESPONSIVE_STACK_RE = /\b(data-mobile-layout=["']?(stacked|single-column|adaptive)|@media|mobile-stack|responsive-stack|single-column|card-list fallback|horizontal-scroll)\b/i;
const EXPLICIT_MOBILE_FALLBACK_RE = /\b(data-mobile-layout=["']?(stacked|single-column|adaptive)|mobile-stack|responsive-stack|single-column|card-list fallback|horizontal-scroll|horizontal scroll)\b/i;
const DESKTOP_PRESSURE_RE = /\b(data-mobile-layout=["']?desktop-multicolumn|mobile.*desktop.*columns|four-column mobile|three-column mobile)\b/i;
const FORBIDDEN_HTML_RE = /\b(approval route preview|audit activity|workflow history|generic dashboard analytics|logic-only required document checklist|duplicated internal title|title hero card)\b/i;
const LONG_LABEL_RE = />[^<]{64,}</g;
const WRAP_EVIDENCE_RE = /\b(wrap|truncate|ellipsis|line-clamp|overflow-wrap|text-overflow|white-space|responsive)\b/i;
const OFFICIAL_LAYOUT_RE = /\b(application-layout-1-vertical-nav|application-layout-2-horizontal-nav|application-layout-3-header-nav|application-layout-4-no-nav)\b/i;
const APP_CHROME_RE = /\b(data-yeeflow-app-chrome|app-header|top-app-header|horizontal-nav|vertical-nav|left-navigation|application-layout-[1-4]|yf-app-shell)\b/i;
const FORM_SURFACE_RE = /\b(approval|data\s+list|document)\b/i;
const READY_TRUE_RE = /\b(data-ready-for-blueprint=["']true|ready-for-blueprint|readyForBlueprint\s*[:=]\s*true)\b/i;
const PAGE_END_RE = /\b(data-page-end|page-end|end-of-page|full-page-end|lower-page-end)\b/i;
const FULL_PAGE_RE = /\b(data-full-page=["']true|full-page|complete-surface|surface-complete|page-complete)\b/i;
const TEMPLATE_REUSE_RE = /\b(data-template-reuse-risk=["']?(pass|warning|pass-with-reviewed-risk)|template-reuse-risk-(pass|warning)|purposeful-differences)\b/i;
const SEMANTIC_CONSISTENCY_RE = /\b(data-semantic-consistency=["']?pass|semantic-consistency-pass|field-value-semantics-pass)\b/i;
const LOWER_REGION_CONCRETE_RE = /\b(data-lower-region-visual-concreteness=["']?pass|lower-region-concrete|rendered-example-count=["']?[1-9]|document-card|timeline-row|checklist-row|sub-list-row|related-record-card|activity-feed)\b/i;
const VISUAL_USABILITY_RE = /\b(data-visual-usability=["']?(pass|pass-with-reviewed-risk)|visual-usability-pass|text-overflow=["']?pass|overlap-status=["']?pass|spacing-status=["']?pass)\b/i;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.contracts || !args.html) {
    console.error("Usage: node scripts/validate-html-preview-layout.mjs --contracts <dir-or-json> --html <dir> [--screenshots <dir>] [--design-system <design-system.md|json>]");
    process.exit(2);
  }

  const contracts = loadContracts(args.contracts);
  const findings = [];
  const screenshotEvidence = [];

  for (const [index, contract] of contracts.entries()) {
    validateHtmlForContract(contract, index, args, findings, screenshotEvidence);
  }

  const failedIds = new Set(findings.filter((finding) => finding.level === "error").map((finding) => finding.surfaceId).filter(Boolean));
  const surfaceIds = contracts.map((contract, index) => text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`));
  const result = {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    surfaceCount: contracts.length,
    passedSurfaces: surfaceIds.filter((surfaceId) => !failedIds.has(surfaceId)),
    failedSurfaces: [...failedIds],
    htmlFindings: findings.filter((finding) => /^HTML_/.test(finding.code)),
    layoutFindings: findings.filter((finding) => /^LAYOUT_/.test(finding.code)),
    visualQualityFindings: findings.filter((finding) => /^VISUAL_/.test(finding.code)),
    screenshotEvidence,
    proofBoundary: PROOF_BOUNDARY,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "pass" ? 0 : 1);
}

export function validateHtmlForContract(contract, index, args, findings, screenshotEvidence) {
  const surfaceId = text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`);
  const surfaceName = text(contract.surfaceName || surfaceId);
  const htmlPath = resolveHtmlPath(args.html, contract, index);
  if (!htmlPath || !fs.existsSync(htmlPath)) {
    add(findings, "error", "HTML_PREVIEW_FILE_MISSING", "HTML preview file is missing for UI Surface Contract.", { surfaceId, surfaceName });
    return;
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const plain = stripTags(html).toLowerCase();
  const requiredFields = asTextArray(contract.requiredFields);
  const requiredActions = asTextArray(contract.requiredActions);
  const forbiddenRegions = asTextArray(contract.forbiddenRegions);

  for (const field of requiredFields) {
    if (!containsField(html, plain, field) && !hasDeferral(contract, field)) {
      add(findings, "error", "HTML_REQUIRED_FIELD_MISSING", "HTML preview does not contain a required field from the UI Surface Contract.", {
        surfaceId,
        field,
        html: safePath(htmlPath),
      });
    }
  }

  for (const action of requiredActions) {
    if (!containsText(plain, action) && !hasDeferral(contract, action)) {
      add(findings, "error", "HTML_REQUIRED_ACTION_MISSING", "HTML preview does not contain a required action from the UI Surface Contract.", {
        surfaceId,
        action,
        html: safePath(htmlPath),
      });
    }
  }

  for (const region of forbiddenRegions) {
    if (region && containsText(plain, region) && !hasExplicitPlanning(contract, region)) {
      add(findings, "error", "HTML_FORBIDDEN_REGION_PRESENT", "HTML preview contains a forbidden region from the UI Surface Contract.", {
        surfaceId,
        region,
      });
    }
  }
  if (FORBIDDEN_HTML_RE.test(plain) && !/explicitly planned visible ui/i.test(plain)) {
    add(findings, "error", "HTML_FORBIDDEN_REGION_PRESENT", "HTML preview contains forbidden logic-only or generic regions without explicit planning.", { surfaceId });
  }

  validateInheritedDesignStageHtml(contract, html, plain, findings, surfaceId);

  if (!DESIGN_TOKEN_RE.test(html)) {
    add(findings, "error", "HTML_DESIGN_SYSTEM_TOKEN_EVIDENCE_MISSING", "HTML preview must use Application Design System tokens/classes or documented equivalent mappings.", { surfaceId });
  }
  if (!PATTERN_REF_RE.test(html)) {
    add(findings, "error", "HTML_PATTERN_TEMPLATE_REFERENCE_MISSING", "HTML preview must reference an approved UI pattern template.", { surfaceId });
  }
  if (RAW_SCAFFOLD_RE.test(html) || !highFidelityEvidence(html)) {
    add(findings, "error", "VISUAL_HTML_PREVIEW_LOW_FIDELITY", "HTML preview looks like a raw scaffold, plain field dump, or generic admin table instead of a high-fidelity design-system-driven prototype.", { surfaceId });
  }
  if (!TYPOGRAPHY_RE.test(html)) {
    add(findings, "error", "VISUAL_TYPOGRAPHY_HIERARCHY_MISSING", "HTML preview must include typography hierarchy evidence.", { surfaceId });
  }
  if (!SPACING_RE.test(html)) {
    add(findings, "error", "VISUAL_SPACING_DENSITY_EVIDENCE_MISSING", "HTML preview must include spacing/density token evidence.", { surfaceId });
  }
  if (!ACTION_PLACEMENT_RE.test(html)) {
    add(findings, "error", "VISUAL_ACTION_PLACEMENT_EVIDENCE_MISSING", "HTML preview must declare action placement consistent with the surface pattern.", { surfaceId });
  }

  if (/data-mobile-layout=["']?desktop-multicolumn/i.test(html) || (DESKTOP_PRESSURE_RE.test(html) && !EXPLICIT_MOBILE_FALLBACK_RE.test(html))) {
    add(findings, "error", "LAYOUT_MOBILE_DESKTOP_PRESSURE", "Mobile HTML cannot preserve desktop multi-column pressure without responsive stacking/scroll/card-list evidence.", { surfaceId });
  }
  if (!RESPONSIVE_STACK_RE.test(html) && requiresMobileEvidence(contract)) {
    add(findings, "error", "LAYOUT_RESPONSIVE_EVIDENCE_MISSING", "HTML preview must include mobile stacked/adaptive layout evidence.", { surfaceId });
  }
  if (/\bdata-overlap=["']sibling["']/i.test(html)) {
    add(findings, "error", "LAYOUT_SIBLING_OVERLAP_DETECTED", "HTML layout evidence reports meaningful sibling collision.", { surfaceId });
  }
  if (LONG_LABEL_RE.test(html) && !WRAP_EVIDENCE_RE.test(html)) {
    add(findings, "error", "VISUAL_LONG_TEXT_WITHOUT_WRAP_STRATEGY", "Long labels/text require wrapping, truncation, ellipsis, or responsive layout evidence.", { surfaceId });
  }

  const screenshots = expectedScreenshots(contract, args.screenshots);
  for (const screenshot of screenshots) {
    const exists = fs.existsSync(screenshot.path);
    screenshotEvidence.push({ surfaceId, type: screenshot.type, path: safePath(screenshot.path), status: exists ? "present" : "missing" });
    if (!exists) {
      add(findings, "error", "HTML_SCREENSHOT_EVIDENCE_MISSING", "Desktop/mobile screenshot evidence generated from HTML preview is missing.", {
        surfaceId,
        screenshotType: screenshot.type,
        path: safePath(screenshot.path),
      });
    }
  }
}

function validateInheritedDesignStageHtml(contract, html, plain, findings, surfaceId) {
  const surfaceType = text(contract.surfaceType);
  if (/dashboard/i.test(surfaceType)) {
    if (!OFFICIAL_LAYOUT_RE.test(text(contract.applicationLayoutType)) && !OFFICIAL_LAYOUT_RE.test(html)) {
      add(findings, "error", "HTML_DASHBOARD_OFFICIAL_LAYOUT_MISSING", "Dashboard HTML previews must use an official Yeeflow application layout ID.", { surfaceId });
    }
    if (!APP_CHROME_RE.test(html)) {
      add(findings, "error", "HTML_DASHBOARD_APP_CHROME_MISSING", "Dashboard HTML previews must include official header/navigation chrome evidence.", { surfaceId });
    }
  } else if (FORM_SURFACE_RE.test(surfaceType)) {
    if (APP_CHROME_RE.test(html) && !/form-surface-no-app-chrome|no-app-chrome/i.test(html)) {
      add(findings, "error", "HTML_FORM_APP_CHROME_FORBIDDEN", "Approval, Data List, and Document form HTML previews must be complete form surfaces without application chrome.", { surfaceId });
    }
  }

  if (!FULL_PAGE_RE.test(html)) {
    add(findings, "error", "HTML_FULL_PAGE_COMPLETENESS_MISSING", "HTML preview must declare complete full-page/full-surface coverage, not viewport-only coverage.", { surfaceId });
  }
  if (!PAGE_END_RE.test(html)) {
    add(findings, "error", "HTML_PAGE_END_EVIDENCE_MISSING", "HTML preview must represent lower page/page end completeness.", { surfaceId });
  }

  if (READY_TRUE_RE.test(html) || contract.readyForBlueprint === true) {
    for (const [code, pattern, message] of [
      ["HTML_LAYOUT_FIDELITY_STATUS_MISSING", /\b(data-layout-fidelity=["']?pass|layout-fidelity-pass)\b/i, "Blueprint-ready HTML must declare passing layout fidelity."],
      ["HTML_MODERN_VISUAL_QUALITY_STATUS_MISSING", /\b(data-modern-visual-quality=["']?pass|modern-visual-quality-pass|data-visual-quality=["']?pass)\b/i, "Blueprint-ready HTML must declare passing modern visual quality."],
      ["HTML_SURFACE_RESPONSIBILITY_STATUS_MISSING", /\b(data-surface-responsibility=["']?pass|surface-responsibility-pass)\b/i, "Blueprint-ready HTML must declare passing surface responsibility."],
      ["HTML_FIELD_COVERAGE_STATUS_MISSING", /\b(data-field-coverage=["']?pass|field-coverage-pass)\b/i, "Blueprint-ready HTML must declare passing App Plan field coverage."],
      ["HTML_ACTION_COVERAGE_STATUS_MISSING", /\b(data-action-coverage=["']?pass|action-coverage-pass)\b/i, "Blueprint-ready HTML must declare passing required action coverage."],
      ["HTML_FORBIDDEN_REGION_STATUS_MISSING", /\b(data-forbidden-region-status=["']?pass|forbidden-region-pass)\b/i, "Blueprint-ready HTML must declare passing forbidden-region checks."],
      ["HTML_SEMANTIC_CONSISTENCY_STATUS_MISSING", SEMANTIC_CONSISTENCY_RE, "Blueprint-ready HTML must declare passing semantic consistency."],
      ["HTML_LOWER_REGION_CONCRETENESS_MISSING", LOWER_REGION_CONCRETE_RE, "Blueprint-ready HTML must provide visually concrete lower-page region evidence when planned."],
      ["HTML_VISUAL_USABILITY_STATUS_MISSING", VISUAL_USABILITY_RE, "Blueprint-ready HTML must declare visual usability/text overflow/overlap/spacing gates."],
      ["HTML_TEMPLATE_REUSE_RISK_STATUS_MISSING", TEMPLATE_REUSE_RE, "Blueprint-ready HTML must declare template reuse risk status or purposeful differences."],
    ]) {
      if (!pattern.test(html)) add(findings, "error", code, message, { surfaceId });
    }
    if (/\b(human_review_required|data-[a-z-]+=["']?fail|text-overflow=["']?fail|overlap-status=["']?fail|spacing-status=["']?fail|mobile-usability=["']?fail|visual-usability=["']?fail)\b/i.test(html) && !hasDeferral(contract, "visual")) {
      add(findings, "error", "HTML_READY_FOR_BLUEPRINT_BLOCKED_BY_INHERITED_GATE", "readyForBlueprint is blocked when any inherited design-stage gate fails or requires human review without deferral.", { surfaceId });
    }
  }

  if (/source:\s|show\s+|field names?:|generic notes|design-stage explanation/i.test(plain) && !/\brendered-example-count=["']?[1-9]|\bdata-rendered-example-count=["']?[1-9]/i.test(html)) {
    add(findings, "error", "HTML_LOWER_REGION_PLACEHOLDER_ONLY", "Lower-page business regions must render concrete rows/cards/items/timeline/checklist UI, not only source notes or field lists.", { surfaceId });
  }
}

function resolveHtmlPath(htmlRoot, contract, index) {
  const candidates = [
    contract.htmlPreviewPath,
    contract.htmlPath,
    contract.previewPath,
    path.join(htmlRoot, `${text(contract.surfaceId || `surface-${index + 1}`)}.html`),
    path.join(htmlRoot, `${slug(text(contract.surfaceId || contract.surfaceName || `surface-${index + 1}`))}.html`),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function expectedScreenshots(contract, screenshotsRoot) {
  const requirements = contract.screenshotEvidenceRequirements || {};
  const surfaceId = slug(text(contract.surfaceId || contract.surfaceName));
  const paths = [];
  if (requirements.desktopScreenshotPath) paths.push({ type: "desktop", path: requirements.desktopScreenshotPath });
  if (requirements.mobileScreenshotPath) paths.push({ type: "mobile", path: requirements.mobileScreenshotPath });
  if (!paths.length && screenshotsRoot) {
    paths.push({ type: "desktop", path: path.join(screenshotsRoot, `${surfaceId}-desktop.png`) });
    paths.push({ type: "mobile", path: path.join(screenshotsRoot, `${surfaceId}-mobile.png`) });
  }
  return paths;
}

function loadContracts(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(inputPath)
      .filter((name) => name.endsWith(".json"))
      .flatMap((name) => contractsFromJson(JSON.parse(fs.readFileSync(path.join(inputPath, name), "utf8"))));
  }
  return contractsFromJson(JSON.parse(fs.readFileSync(inputPath, "utf8")));
}

function contractsFromJson(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.contracts)) return value.contracts;
  if (Array.isArray(value.surfaces)) return value.surfaces;
  if (Array.isArray(value.uiSurfaceContracts)) return value.uiSurfaceContracts;
  return [value];
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) args[arg.slice(2)] = argv[index + 1];
  }
  return args;
}

function add(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...detail });
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function asTextArray(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value).flatMap(asTextArray);
  return [];
}

function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function containsField(html, plain, field) {
  const normalized = normalize(field);
  return plain.includes(normalized) || new RegExp(`data-field=["'][^"']*${escapeRegex(field)}[^"']*["']`, "i").test(html);
}

function containsText(plain, value) {
  return plain.includes(normalize(value));
}

function normalize(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeRegex(value) {
  return text(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasDeferral(contract, needle = "") {
  const combined = normalize([contract.deferredItems, contract.deferrals, contract.fallback, contract.proofImpact, contract.deferredReason]);
  return /deferred|runtime-proof-required|export-learning-required/.test(combined) && (!needle || combined.includes(normalize(needle).slice(0, 20)));
}

function hasExplicitPlanning(contract, region) {
  const combined = normalize([contract.allowedRegions, contract.explicitlyPlannedRegions, contract.appPlanTraceabilityNotes]);
  return combined.includes(normalize(region)) && /explicitly planned|app plan|allowed|mapped|visible ui/.test(combined);
}

function requiresMobileEvidence(contract) {
  return /mobile|responsive|desktop|complex|dashboard|form|view|edit/i.test(text([contract.responsiveRules, contract.htmlPreviewRequirements, contract.surfaceType]));
}

function highFidelityEvidence(html) {
  return /high-fidelity|data-visual-quality=["']pass|polished-card|business-card|status-badge|kpi-card|timeline-row|sub-list-row|document-card|data-table|collection-card|form-section/i.test(html);
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

main();
