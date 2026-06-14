#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const PRIVATE_URL_RE = /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|\[::1\]\b|example\.invalid\b)[^\s"']+/gi;
const PRIVATE_ID_RE = /\b\d{15,}\b/g;
const SECRET_RE = /\b(Bearer\s+[A-Za-z0-9._-]+|sk-[A-Za-z0-9_-]+|(?:access|refresh|id)_token)\b/gi;
const FILLER_RE = /\b(lorem ipsum|here is the title|here is the description|placeholder|todo|coming soon|sample dashboard|scaffold)\b/i;

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.urls.length && !args.pagesJson)) usage(args.help ? 0 : 1);
  const evidence = await captureRuntimeUiEvidence(args);
  const rendered = `${JSON.stringify(evidence, null, 2)}\n`;
  if (args.output) fs.writeFileSync(args.output, rendered);
  else process.stdout.write(rendered);
}

export async function captureRuntimeUiEvidence({ urls = [], pagesJson, output } = {}) {
  const pages = pagesJson ? readPagesJson(pagesJson) : urls.map((url) => ({ url }));
  const capturedPages = [];
  const captureNotes = [];

  for (const page of pages) {
    const capture = await capturePage(page);
    capturedPages.push(capture);
    captureNotes.push(...capture.captureNotes);
  }

  const merged = mergePageEvidence(capturedPages);
  return {
    schema: "yeeflow-redacted-runtime-ui-evidence/v1",
    generatedAt: new Date().toISOString(),
    pageOpened: capturedPages.some((page) => page.pageOpened === true),
    pages: capturedPages,
    visibleTitle: merged.visibleTitle,
    kpis: merged.kpis,
    kpiValuesVisible: merged.kpis.length > 0 && merged.kpis.every((kpi) => String(kpi.renderedText || kpi.value || "").trim()),
    filtersActionsVisible: merged.filtersActionsVisible,
    filters: merged.filters,
    actions: merged.actions,
    gridTableHeaders: merged.gridTableHeaders,
    gridTableRows: merged.gridTableRows,
    tablesGridsNonScaffold: merged.gridTableHeaders.length > 0 && merged.gridTableRows.length > 0,
    badgeLikeCells: merged.badgeLikeCells,
    badgesDistinct: merged.badgeLikeCells.length > 0,
    cardLikeSectionSignals: merged.cardLikeSectionSignals,
    dashboardCardsCardLike: merged.cardLikeSectionSignals.length > 0,
    hiddenSummaryVisible: merged.hiddenSummaryVisible,
    hiddenSummaryVisibilityCheck: merged.hiddenSummaryVisible ? "visible-summary-like-content-found" : "no-visible-hidden-summary-signal-found",
    placeholderFillerTextScan: {
      found: merged.placeholderMatches.length > 0,
      matches: merged.placeholderMatches,
    },
    pageLooksPlainScaffold: merged.placeholderMatches.length > 0 || (merged.kpis.length === 0 && merged.gridTableHeaders.length === 0),
    screenshot: merged.screenshot.path,
    screenshotPath: merged.screenshot.path,
    screenshotEvidence: merged.screenshot,
    runtimeScreenshotCaptured: merged.screenshot.status === "captured-redacted",
    installOrSigningOnly: false,
    dynamicVisibleKpiRuntimeProven: false,
    proofBoundary: "This redacted evidence records visible runtime signals only. It does not expose private tenant URLs, raw responses, full workspace IDs, secrets, raw Resource, raw Sign, private screenshots, package payloads, signing, install, import, upgrade, or live API proof.",
    captureNotes: [...new Set(captureNotes)],
    output: output ? safePath(output) : null,
  };
}

async function capturePage(page) {
  const fromJson = extractFromPageObject(page);
  if (fromJson.html || page.title || page.visibleTitle || page.screenshotCaptured) return fromJson;

  const url = String(page.url || "");
  if (!isSafeFetchUrl(url)) {
    return {
      ...emptyPage(url),
      captureNotes: ["URL was recorded in redacted form only; no browser/fetch capture was attempted for a non-local tenant URL."],
    };
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    return extractFromHtml({ url, html, pageOpened: response.ok, captureNotes: ["Captured local/example page HTML through safe fetch; no raw response body is stored."] });
  } catch (error) {
    return {
      ...emptyPage(url),
      captureNotes: [`Safe local/example fetch unavailable: ${redactText(error.message)}`],
    };
  }
}

function extractFromPageObject(page) {
  const html = String(page.html || "");
  const extracted = html ? extractFromHtml({ url: page.url, html, pageOpened: page.pageOpened !== false, captureNotes: ["Captured from provided redacted pages JSON fixture."] }) : emptyPage(page.url);
  extracted.pageOpened = page.pageOpened !== undefined ? Boolean(page.pageOpened) : extracted.pageOpened;
  extracted.visibleTitle = redactText(page.visibleTitle || page.title || extracted.visibleTitle);
  extracted.kpis = normalizeKpis(page.kpis || extracted.kpis);
  extracted.filters = arrayText(page.filters || extracted.filters).map(redactText);
  extracted.actions = arrayText(page.actions || extracted.actions).map(redactText);
  extracted.gridTableHeaders = arrayText(page.gridTableHeaders || extracted.gridTableHeaders).map(redactText);
  extracted.gridTableRows = Array.isArray(page.gridTableRows) ? page.gridTableRows.map((row) => arrayText(row).map(redactText)) : extracted.gridTableRows;
  extracted.badgeLikeCells = arrayText(page.badgeLikeCells || extracted.badgeLikeCells).map(redactText);
  extracted.cardLikeSectionSignals = arrayText(page.cardLikeSectionSignals || extracted.cardLikeSectionSignals).map(redactText);
  extracted.hiddenSummaryVisible = page.hiddenSummaryVisible !== undefined ? Boolean(page.hiddenSummaryVisible) : extracted.hiddenSummaryVisible;
  extracted.placeholderMatches = arrayText(page.placeholderMatches || extracted.placeholderMatches).map(redactText);
  extracted.screenshot = screenshotStatus(page);
  return extracted;
}

function extractFromHtml({ url, html, pageOpened = true, captureNotes = [] }) {
  const text = stripTags(html);
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const headers = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => cleanText(match[1]));
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match) => [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanText(cell[1])).filter(Boolean))
    .filter((row) => row.length && row.join("|") !== headers.join("|"));
  const kpis = [...html.matchAll(/<(?:section|div|article|li)[^>]*(?:data-kpi|class=["'][^"']*(?:kpi|metric|stat|summary-card)[^"']*)[^>]*>([\s\S]*?)<\/(?:section|div|article|li)>/gi)]
    .map((match, index) => {
      const content = cleanText(match[1]);
      const value = firstMatch(content, /([-+]?\d[\d,]*(?:\.\d+)?%?)/) || content;
      return { label: content.replace(value, "").trim() || `KPI ${index + 1}`, renderedText: value, value, runtimeProven: false, fallback: false, fallbackLabeled: false };
    })
    .filter((kpi) => kpi.value);
  const actions = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>|<a[^>]*(?:role=["']button["'])?[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => cleanText(match[1] || match[2]))
    .filter(Boolean);
  const filters = [
    ...[...html.matchAll(/<(?:input|select)[^>]*(?:aria-label|placeholder|name)=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]),
    ...[...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi)].map((match) => cleanText(match[1])),
  ].filter(Boolean);
  const badges = [...html.matchAll(/<(?:span|div|td)[^>]*class=["'][^"']*(?:badge|chip|status|pill)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|td)>/gi)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
  const cards = [...html.matchAll(/<(?:section|div|article)[^>]*class=["'][^"']*(?:card|panel|tile|summary-card|kpi)[^"']*["'][^>]*>/gi)]
    .map((match) => cleanText(match[0]).slice(0, 80) || "card-like-section")
    .filter(Boolean);
  const placeholderMatches = [...new Set((text.match(new RegExp(FILLER_RE.source, "gi")) || []).map(redactText))];

  return {
    url: redactUrl(url),
    pageOpened,
    visibleTitle: redactText(cleanText(title)),
    kpis: normalizeKpis(kpis),
    filters: filters.map(redactText),
    actions: actions.map(redactText),
    gridTableHeaders: headers.map(redactText),
    gridTableRows: rows.map((row) => row.map(redactText)),
    badgeLikeCells: badges.map(redactText),
    cardLikeSectionSignals: cards.map(redactText),
    hiddenSummaryVisible: /\bhidden-summary\b/i.test(html) && !/(display\s*:\s*none|visibility\s*:\s*hidden|aria-hidden=["']true["'])/i.test(html),
    placeholderMatches,
    screenshot: { status: "not-captured", path: "redacted", note: "Screenshot capture was not requested or browser automation was unavailable." },
    captureNotes,
  };
}

function mergePageEvidence(pages) {
  const firstTitle = pages.find((page) => page.visibleTitle)?.visibleTitle || "";
  return {
    visibleTitle: firstTitle,
    kpis: pages.flatMap((page) => page.kpis),
    filters: pages.flatMap((page) => page.filters),
    actions: pages.flatMap((page) => page.actions),
    filtersActionsVisible: pages.some((page) => page.filters.length || page.actions.length),
    gridTableHeaders: pages.flatMap((page) => page.gridTableHeaders),
    gridTableRows: pages.flatMap((page) => page.gridTableRows),
    badgeLikeCells: pages.flatMap((page) => page.badgeLikeCells),
    cardLikeSectionSignals: pages.flatMap((page) => page.cardLikeSectionSignals),
    hiddenSummaryVisible: pages.some((page) => page.hiddenSummaryVisible),
    placeholderMatches: [...new Set(pages.flatMap((page) => page.placeholderMatches))],
    screenshot: pages.find((page) => page.screenshot.status === "captured-redacted")?.screenshot || { status: "not-captured", path: "redacted", note: "No private screenshot was stored." },
  };
}

function screenshotStatus(page) {
  if (page.screenshotCaptured === true) {
    return {
      status: "captured-redacted",
      path: page.redactedScreenshotPath ? safePath(page.redactedScreenshotPath) : "redacted",
      note: "Screenshot path is redacted; do not store private tenant screenshots in fixtures.",
    };
  }
  return {
    status: page.screenshotStatus || "not-captured",
    path: "redacted",
    note: page.screenshotNote || "Screenshot not captured.",
  };
}

function emptyPage(url) {
  return {
    url: redactUrl(url),
    pageOpened: false,
    visibleTitle: "",
    kpis: [],
    filters: [],
    actions: [],
    gridTableHeaders: [],
    gridTableRows: [],
    badgeLikeCells: [],
    cardLikeSectionSignals: [],
    hiddenSummaryVisible: false,
    placeholderMatches: [],
    screenshot: { status: "not-captured", path: "redacted" },
    captureNotes: [],
  };
}

function readPagesJson(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.pages)) return parsed.pages;
  throw new Error("--pages-json must contain an array or a { pages: [] } object");
}

function parseArgs(argv) {
  const args = { urls: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--url") args.urls.push(argv[++i]);
    else if (arg === "--urls") args.urls.push(...argv[++i].split(",").map((url) => url.trim()).filter(Boolean));
    else if (arg === "--pages-json") args.pagesJson = argv[++i];
    else if (arg === "--output" || arg === "-o") args.output = argv[++i];
    else usage(1);
  }
  return args;
}

function usage(exitCode) {
  const out = [
    "Usage:",
    "  node scripts/capture-runtime-ui-evidence.mjs --url <runtime-page-url> [--url <runtime-page-url>] --output <evidence.json>",
    "  node scripts/capture-runtime-ui-evidence.mjs --pages-json <redacted-pages.json> --output <evidence.json>",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(out);
  process.exit(exitCode);
}

function isSafeFetchUrl(url) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1", "example.invalid"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeKpis(kpis) {
  return array(kpis).map((kpi, index) => {
    if (typeof kpi === "string" || typeof kpi === "number") {
      return { label: `KPI ${index + 1}`, renderedText: redactText(kpi), value: redactText(kpi), runtimeProven: false, fallback: false, fallbackLabeled: false };
    }
    const value = redactText(kpi.renderedText ?? kpi.text ?? kpi.value ?? "");
    return {
      label: redactText(kpi.label || kpi.name || `KPI ${index + 1}`),
      renderedText: value,
      value,
      runtimeProven: kpi.runtimeProven === true,
      dynamicBindingClaimed: kpi.dynamicBindingClaimed === true,
      fallback: kpi.fallback === true,
      fallbackLabeled: kpi.fallbackLabeled === true,
    };
  });
}

function array(value) {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}

function arrayText(value) {
  return array(value).map((item) => Array.isArray(item) ? item.map(String) : String(item)).filter(Boolean);
}

function stripTags(html) {
  return cleanText(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function cleanText(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstMatch(value, pattern) {
  const match = String(value || "").match(pattern);
  return match ? cleanText(match[1]) : "";
}

function redactUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (isSafeFetchUrl(url)) return `${parsed.origin}${parsed.pathname}`;
    return `${parsed.protocol}//redacted-host/redacted-path`;
  } catch {
    return redactText(url);
  }
}

function redactText(value) {
  return String(value || "")
    .replace(PRIVATE_URL_RE, "https://redacted-host/redacted-path")
    .replace(PRIVATE_ID_RE, "[redacted-id]")
    .replace(SECRET_RE, "[redacted-secret]")
    .trim();
}

function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
