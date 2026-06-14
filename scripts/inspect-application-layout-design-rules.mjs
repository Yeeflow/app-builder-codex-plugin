#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const LAYOUTS = {
  "application-layout-1-vertical-nav": {
    name: "Application layout 1: vertical navigation menu panel",
    runtimePosition: "left",
    requiresHeader: true,
    requiresNav: true,
    navKeywords: [/vertical/i, /left/i, /side\s*nav/i, /navigation panel/i],
  },
  "application-layout-2-horizontal-nav": {
    name: "Application layout 2: horizontal navigation menu bar",
    runtimePosition: "default",
    requiresHeader: true,
    requiresNav: true,
    navKeywords: [/horizontal/i, /menu bar/i, /below .*header/i, /dropdown/i],
  },
  "application-layout-3-header-nav": {
    name: "Application layout 3: navigation menu on the header",
    runtimePosition: "onheader",
    requiresHeader: true,
    requiresNav: true,
    navKeywords: [/header/i, /on[- ]?header/i, /same header/i, /dropdown/i],
  },
  "application-layout-4-no-nav": {
    name: "Application layout 4: no navigation menu / hidden navigation",
    runtimePosition: "none",
    requiresHeader: true,
    requiresNav: false,
    navKeywords: [/no nav/i, /hidden navigation/i, /navigation.*hidden/i, /none/i],
  },
};

const UNSUPPORTED_CHROME_PATTERNS = [
  { code: "ARBITRARY_APP_SHELL_DETECTED", pattern: /custom\s+saas\s+shell|invented\s+app\s+shell|arbitrary\s+app\s+shell/i },
  { code: "UNSUPPORTED_NAVIGATION_CHROME", pattern: /floating\s+navigation|floating\s+nav|bottom\s+navigation|right\s+sidebar\s+navigation|secondary\s+app\s+sidebar|custom\s+top\s+bar|arbitrary\s+top\s+bar|unsupported\s+sidebar/i },
];

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.contract) usage(args.help ? 0 : 1);
  const report = inspectApplicationLayoutDesignRules(args);
  const output = args.format === "markdown" ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) fs.writeFileSync(args.out, output);
  else process.stdout.write(output);
  process.exit(report.status === "fail" || (args.strict && report.status === "warning") ? 1 : 0);
}

export function inspectApplicationLayoutDesignRules({
  contract,
  multiPageSet,
  screenshot,
  strict = false,
  out,
  format = "json",
} = {}) {
  const findings = [];
  let primary = {};
  let pages = [];
  let rawText = "";

  if (!contract) {
    addFinding(findings, "error", "APPLICATION_LAYOUT_CONTRACT_MISSING", "Contract path is required.");
  } else {
    try {
      const parsed = readContract(contract);
      primary = normalizeContract(parsed.data);
      rawText = parsed.raw;
      pages.push({ source: safePath(contract), ...primary });
    } catch (error) {
      addFinding(findings, "error", error.code || "APPLICATION_LAYOUT_CONTRACT_READ_FAILED", error.message);
    }
  }

  if (multiPageSet) {
    try {
      pages = pages.concat(readPageSet(multiPageSet));
    } catch (error) {
      addFinding(findings, "error", "APPLICATION_LAYOUT_PAGE_SET_READ_FAILED", error.message);
    }
  }

  if (!findings.some((finding) => finding.severity === "error")) {
    validatePages(pages, findings);
    validateChrome(primary, rawText, findings);
    validateScreenshotBoundary({ screenshot, primary }, findings);
  }

  const status = statusFromFindings(findings);
  return {
    status,
    summary: summarize(status, findings, strict),
    contractPath: safePath(contract),
    multiPageSetPath: safePath(multiPageSet),
    screenshotPath: screenshot ? safePath(screenshot) : null,
    strict,
    supportedLayouts: Object.entries(LAYOUTS).map(([applicationLayoutType, layout]) => ({
      applicationLayoutType,
      applicationLayoutName: layout.name,
      runtimeMenuPosition: layout.runtimePosition,
    })),
    layoutResults: pages.map((page) => ({
      source: page.source || null,
      pageName: page.pageName || page.targetPageName || null,
      applicationLayoutType: page.applicationLayoutType || null,
      applicationLayoutName: page.applicationLayoutName || null,
      declaredCompliance: Boolean(page.layoutVerification.declaredCompliance || page.applicationLayoutType),
      humanReviewedDerivedRules: Boolean(page.layoutVerification.humanReviewedDerivedRules || page.humanReviewedDerivedRules),
      automaticallyVerified: Boolean(page.layoutVerification.automaticallyVerified),
      humanReviewRequired: Boolean(page.humanReviewRequired),
    })),
    findings,
    proofBoundary: [
      "This validator checks declared Yeeflow application layout compliance in design-image specs or UI contracts.",
      "It does not parse screenshot pixels, design-image structure, raw YAPK payloads, raw Resource, or raw Sign.",
      "Screenshot-sourced observations must remain human-reviewed or review-required unless a reliable parser is implemented.",
      "Application layout compliance does not prove runtime rendering, design fidelity, or dynamic KPI behavior.",
    ],
    nextActions: nextActions(findings),
    output: out ? safePath(out) : null,
    format,
  };
}

function validatePages(pages, findings) {
  if (!pages.length) return;
  const declared = pages.map((page) => page.applicationLayoutType).filter(Boolean);
  if (!declared.length) {
    addFinding(findings, "error", "APPLICATION_LAYOUT_MISSING", "No applicationLayoutType is declared.");
  }

  for (const page of pages) {
    validateLayout(page, findings);
  }

  const unique = new Set(declared);
  if (unique.size > 1) {
    addFinding(findings, "error", "APPLICATION_LAYOUT_INCONSISTENT", "All page images in one application must use the same applicationLayoutType.", {
      layouts: [...unique],
    });
  }
}

function validateLayout(page, findings) {
  const type = page.applicationLayoutType;
  if (!type) {
    addFinding(findings, "error", "APPLICATION_LAYOUT_MISSING", "applicationLayoutType is required.", { source: page.source });
    return;
  }
  const layout = LAYOUTS[type];
  if (!layout) {
    addFinding(findings, "error", "APPLICATION_LAYOUT_UNSUPPORTED", `Unsupported applicationLayoutType: ${type}.`, { source: page.source });
    return;
  }

  if (!hasValue(page.applicationChrome)) {
    addFinding(findings, "error", "APPLICATION_CHROME_MISSING", "applicationChrome must describe the selected Yeeflow header/navigation chrome.", { source: page.source });
  }
  if (layout.requiresHeader && !hasValue(page.headerRegion)) {
    addFinding(findings, "error", "HEADER_REGION_MISSING", "headerRegion or equivalent header rules must describe the app header region.", { source: page.source });
  }
  if (!hasValue(page.navigationRegion)) {
    addFinding(findings, "error", "NAV_REGION_MISSING", "navigationRegion or equivalent navigation rules must describe the selected navigation region, including no-nav layouts.", { source: page.source });
  } else if (layout.requiresNav && !matchesAny(textOf(page.navigationRegion), layout.navKeywords)) {
    addFinding(findings, "error", "NAV_REGION_MISSING", "navigationRegion does not describe the selected Yeeflow navigation placement.", { source: page.source });
  }
  if (!layout.requiresNav && textOf(page.navigationRegion).match(/sidebar|horizontal menu|header nav|floating nav|custom nav/i)) {
    addFinding(findings, "error", "UNSUPPORTED_NAVIGATION_CHROME", "No-nav layout must not replace hidden navigation with custom navigation chrome.", { source: page.source });
  }
  if (!hasValue(page.contentSafeArea)) {
    addFinding(findings, "error", "CONTENT_SAFE_AREA_VIOLATION", "contentSafeArea or equivalent safe-area rules must state that page content stays outside header/navigation chrome.", { source: page.source });
  }
  if (/(may|can|should|will|allowed to)\s+(overlap|sit under|replace)|\boverlap\s+(the\s+)?(header|nav)|\bunder\s+(the\s+)?(header|nav)|\breplace\s+(the\s+)?(header|nav)|\binside\s+(the\s+)?(header|nav)/i.test(textOf(page.contentSafeArea))) {
    addFinding(findings, "error", "CONTENT_SAFE_AREA_VIOLATION", "Content safe area indicates overlap or replacement of app chrome.", { source: page.source });
  }
  if (!hasValue(page.pageTitleActionArea)) {
    addFinding(findings, "error", "APPLICATION_CHROME_MISSING", "pageTitleActionArea or equivalent wording must describe where page title/actions belong inside the content area.", { source: page.source });
  }
  if (!hasValue(page.dropdownOrExpandedMenuBehavior)) {
    addFinding(findings, "error", "APPLICATION_CHROME_MISSING", "dropdownOrExpandedMenuBehavior or equivalent wording must describe dropdown, expanded menu, or no-nav behavior for the selected layout.", { source: page.source });
  }
  if (!hasValue(page.forbiddenChromePatterns)) {
    addFinding(findings, "error", "APPLICATION_CHROME_MISSING", "forbiddenChromePatterns must explicitly block unsupported app shells/navigation chrome.", { source: page.source });
  }
  if (page.humanReviewRequired) {
    addFinding(findings, "warning", "LAYOUT_REVIEW_REQUIRED", "Layout compliance requires human review.", { source: page.source });
  }
  if (!page.layoutVerification.automaticallyVerified) {
    addFinding(findings, "warning", "IMAGE_LAYOUT_VERIFICATION_UNPROVEN", "Declared application layout compliance is not automatically verified from screenshot/image pixels.", { source: page.source });
  }
}

function validateChrome(primary, rawText, findings) {
  const haystack = [
    textOf(primary.applicationChrome),
    textOf(primary.navigationRegion),
    textOf(primary.headerRegion),
  ].join("\n");
  for (const { code, pattern } of UNSUPPORTED_CHROME_PATTERNS) {
    if (pattern.test(haystack)) {
      addFinding(findings, "error", code, "Unsupported arbitrary app shell/navigation chrome is present in the design contract.");
    }
  }
}

function validateScreenshotBoundary({ screenshot, primary }, findings) {
  if (!screenshot) return;
  addFinding(findings, "warning", "SCREENSHOT_REVIEW_REQUIRED", "Screenshot was supplied, but this validator has no reliable screenshot parser.");
  addFinding(findings, "warning", "IMAGE_LAYOUT_VERIFICATION_UNPROVEN", "Screenshot layout verification is unproven without a dedicated parser.");
  if (!primary.humanReviewRequired && !primary.layoutVerification.humanReviewedDerivedRules && !primary.layoutVerification.automaticallyVerified) {
    addFinding(findings, "warning", "LAYOUT_REVIEW_REQUIRED", "Mark humanReviewRequired when screenshot-derived layout details are used without automated parsing.");
  }
}

function readContract(contractPath) {
  const raw = fs.readFileSync(contractPath, "utf8");
  if (/\.md$/i.test(contractPath)) return { raw, data: parseMarkdownContract(raw) };
  if (/\.json$/i.test(contractPath)) return { raw, data: JSON.parse(raw) };
  const error = new Error(`Unsupported contract format for ${safePath(contractPath)}. Use .json or .md.`);
  error.code = "MARKDOWN_CONTRACT_UNSUPPORTED";
  throw error;
}

function parseMarkdownContract(raw) {
  const data = {};
  const aliases = {
    applicationlayouttype: "applicationLayoutType",
    applicationlayoutname: "applicationLayoutName",
    applicationchrome: "applicationChrome",
    headerrules: "headerRules",
    headerregion: "headerRegion",
    navigationrules: "navigationRules",
    navigationregion: "navigationRegion",
    contentsafearearules: "contentSafeAreaRules",
    contentsafearea: "contentSafeArea",
    pagetitleactionarea: "pageTitleActionArea",
    dropdownorexpandedmenubehavior: "dropdownOrExpandedMenuBehavior",
    dropdownmenubehavior: "dropdownOrExpandedMenuBehavior",
    expandedmenubehavior: "dropdownOrExpandedMenuBehavior",
    sourcepriority: "sourcePriority",
    allowedcustomization: "allowedCustomization",
    forbiddenchromepatterns: "forbiddenChromePatterns",
    humanreviewrequired: "humanReviewRequired",
    humanreviewedderivedrules: "humanReviewedDerivedRules",
    automaticallyverified: "automaticallyVerified",
    pagetitle: "pageName",
    targetpagename: "targetPageName",
  };
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([A-Za-z][A-Za-z0-9 _-]+)(?:\*\*)?\s*:\s*(.+?)\s*$/);
    if (!match) continue;
    const key = aliases[normalizeKey(match[1])];
    if (!key) continue;
    data[key] = parseScalar(match[2]);
  }
  if (!Object.keys(data).length) {
    const error = new Error("Markdown contract did not expose parseable application layout fields.");
    error.code = "MARKDOWN_CONTRACT_UNSUPPORTED";
    throw error;
  }
  return data;
}

function readPageSet(pageSetPath) {
  const raw = fs.readFileSync(pageSetPath, "utf8");
  const parsed = JSON.parse(raw);
  const pages = Array.isArray(parsed) ? parsed : Array.isArray(parsed.pages) ? parsed.pages : [];
  return pages.map((page, index) => ({
    source: `${safePath(pageSetPath)}#page-${index + 1}`,
    ...normalizeContract(page),
  }));
}

function normalizeContract(contract = {}) {
  const source = contract.designImageSpec || contract.uiContract || contract.contract || contract;
  const layoutVerification = source.layoutVerification || source.applicationLayoutVerification || {};
  const matrix = source.visualLayoutMatrix || source.layoutRegionRules || source.layoutRegions || {};
  const headerRegion = firstValue(source.headerRegion, source.headerRules, matrix.headerRegion, matrix.headerRules, source.header);
  const navigationRegion = firstValue(source.navigationRegion, source.navigationRules, source.navRules, matrix.navigationRegion, matrix.navigationRules, source.navigation);
  const contentSafeArea = firstValue(source.contentSafeArea, source.contentSafeAreaRules, matrix.contentSafeArea, matrix.contentSafeAreaRules, source.safeArea);
  const pageTitleActionArea = firstValue(source.pageTitleActionArea, source.pageTitleRules, matrix.pageTitleActionArea, matrix.pageTitleRules);
  const dropdownOrExpandedMenuBehavior = firstValue(
    source.dropdownOrExpandedMenuBehavior,
    source.dropdownMenuBehavior,
    source.expandedMenuBehavior,
    source.navigationExpansionBehavior,
    matrix.dropdownOrExpandedMenuBehavior,
    matrix.dropdownMenuBehavior,
    matrix.expandedMenuBehavior,
  );
  return {
    ...source,
    applicationLayoutType: source.applicationLayoutType || source.layoutType || source.appLayoutType || null,
    applicationLayoutName: source.applicationLayoutName || source.layoutName || null,
    applicationChrome: source.applicationChrome || source.chrome || source.appChrome || null,
    sourcePriority: source.sourcePriority || source.source_priority || null,
    visualLayoutMatrix: source.visualLayoutMatrix || null,
    headerRegion,
    headerRules: headerRegion,
    navigationRegion,
    navigationRules: navigationRegion,
    contentSafeArea,
    contentSafeAreaRules: contentSafeArea,
    pageTitleActionArea,
    dropdownOrExpandedMenuBehavior,
    allowedCustomization: source.allowedCustomization || source.customization || null,
    forbiddenChromePatterns: source.forbiddenChromePatterns || source.forbiddenPatterns || null,
    humanReviewRequired: Boolean(source.humanReviewRequired || source.human_review_required),
    humanReviewedDerivedRules: Boolean(source.humanReviewedDerivedRules || source.human_reviewed_derived_rules || layoutVerification.humanReviewedDerivedRules),
    layoutVerification: {
      declaredCompliance: Boolean(layoutVerification.declaredCompliance || layoutVerification.declared_compliance),
      humanReviewedDerivedRules: Boolean(layoutVerification.humanReviewedDerivedRules || layoutVerification.human_reviewed_derived_rules || source.humanReviewedDerivedRules || source.human_reviewed_derived_rules),
      automaticallyVerified: Boolean(layoutVerification.automaticallyVerified || layoutVerification.automatically_verified || source.automaticallyVerified),
    },
  };
}

function firstValue(...values) {
  return values.find((value) => hasValue(value)) ?? null;
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "fail";
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  return "pass";
}

function summarize(status, findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  if (status === "pass") return "Application layout design rules are declared and supported.";
  if (status === "warning" && strict) return `Application layout design rules have ${warnings} warning(s); --strict treats warnings as blocking.`;
  if (status === "warning") return `Application layout design rules have ${warnings} warning(s).`;
  return `Application layout design rules failed with ${errors} error(s) and ${warnings} warning(s).`;
}

function nextActions(findings) {
  if (!findings.length) return [];
  const actions = [];
  if (hasCode(findings, "APPLICATION_LAYOUT_MISSING")) actions.push("Declare exactly one supported applicationLayoutType.");
  if (hasCode(findings, "APPLICATION_LAYOUT_INCONSISTENT")) actions.push("Use one consistent Yeeflow application layout across every page image in the app.");
  if (hasCode(findings, "UNSUPPORTED_NAVIGATION_CHROME") || hasCode(findings, "ARBITRARY_APP_SHELL_DETECTED")) actions.push("Remove invented app shells, arbitrary sidebars, custom top bars, or unsupported navigation chrome.");
  if (hasCode(findings, "CONTENT_SAFE_AREA_VIOLATION")) actions.push("Keep page-specific content inside the selected layout's content safe area.");
  if (hasCode(findings, "IMAGE_LAYOUT_VERIFICATION_UNPROVEN") || hasCode(findings, "SCREENSHOT_REVIEW_REQUIRED")) actions.push("Mark screenshot-derived layout details as human-reviewed or review-required unless a reliable parser is used.");
  return actions;
}

function addFinding(findings, severity, code, message, detail = {}) {
  findings.push({ severity, code, message, ...detail });
}

function hasCode(findings, code) {
  return findings.some((finding) => finding.code === code);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function safePath(value) {
  if (!value) return null;
  return path.basename(value);
}

function normalizeKey(value) {
  return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function parseScalar(value) {
  const trimmed = value.trim().replace(/^`|`$/g, "");
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  if (/^\[.*\]$/.test(trimmed)) {
    return trimmed.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim()).filter(Boolean);
  }
  return trimmed;
}

function renderMarkdown(report) {
  const lines = [
    `# Application Layout Design Rule Findings`,
    "",
    `Status: ${report.status}`,
    `Summary: ${report.summary}`,
    "",
    "## Findings",
  ];
  if (!report.findings.length) lines.push("- None");
  for (const finding of report.findings) {
    lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
  }
  lines.push("", "## Proof Boundary");
  for (const item of report.proofBoundary) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--contract") args.contract = argv[++i];
    else if (arg === "--multi-page-set") args.multiPageSet = argv[++i];
    else if (arg === "--screenshot") args.screenshot = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--format") args.format = argv[++i];
    else if (arg === "--strict") args.strict = true;
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  console.error("Usage:\n  node scripts/inspect-application-layout-design-rules.mjs --contract <ui-contract.md|json> [--multi-page-set <pages.json>] [--screenshot <mockup.png>] [--out <findings.json>] [--format json|markdown] [--strict]");
  process.exit(exitCode);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
