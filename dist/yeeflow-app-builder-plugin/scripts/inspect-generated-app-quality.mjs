#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const REQUIRED_PLAN_SECTIONS = [
  "plan status",
  "application purpose",
  "target users and roles",
  "business process overview",
  "capability coverage plan",
  "application navigation",
  "data model and lists",
  "forms and approval forms",
  "dashboards, pages, and reports",
  "ui/ux and control mapping",
  "golden template and reference strategy",
  "actions and workflow logic",
  "permissions",
  "integrations and external services",
  "document libraries and attachments",
  "reports and analytics",
  "data validation checklist",
  "generation contract and hard gates",
  "generation validation plan",
  "proof boundary",
  "assumptions",
  "deferred or runtime-proof items",
  "recommended next prompt",
];

const REQUIRED_SPEC_SECTIONS = [
  "page list",
  "purpose",
  "layout structure",
  "yeeflow controls",
  "data list bindings",
  "fields displayed",
  "table columns",
  "actions",
  "style settings",
  "custom css",
  "validation checklist",
];

const VENDOR_ONBOARDING_EXPECTED_PAGES = [
  "Vendor Management Dashboard",
  "Vendor Detail View Page",
  "New Vendor Request Form",
  "Compliance Review Workspace",
  "Vendor Print Page",
];

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/inspect-generated-app-quality.mjs --package <app.yap|app.yapk|decoded-data.json> [--validation-mode full-app-plan-conformance|focused-runtime-repair] [--repair-scope <scope>] [--plan <plan.md>] [--spec <ui-implementation-spec.md>] [--composition-checklist <checklist.normalized.json>] [--template-library <templates.normalized.json>] [--checklist-page <page_id>] [--strict-app-quality] [--strict-visual-app-quality] [--json-out <report.json>]",
    "",
    "Combines app-plan presence checks, UI implementation spec checks, package inventory, generated UI quality checks, and strict full-application visual quality gates.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = {
    packagePath: "",
    planPath: "",
    specPath: "",
    compositionChecklistPath: "",
    templateLibraryPath: "",
    checklistPageIds: [],
    jsonOut: "",
    groupedNavigationExportProven: false,
    strictAppQuality: false,
    strictVisualAppQuality: false,
    validationMode: "full-app-plan-conformance",
    repairScope: "",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") args.packagePath = argv[++index] || "";
    else if (arg === "--plan") args.planPath = argv[++index] || "";
    else if (arg === "--spec") args.specPath = argv[++index] || "";
    else if (arg === "--composition-checklist") args.compositionChecklistPath = argv[++index] || "";
    else if (arg === "--template-library") args.templateLibraryPath = argv[++index] || "";
    else if (arg === "--checklist-page" || arg === "--page") args.checklistPageIds.push(argv[++index] || "");
    else if (arg === "--json-out") args.jsonOut = argv[++index] || "";
    else if (arg === "--validation-mode") args.validationMode = argv[++index] || "";
    else if (arg === "--repair-scope") args.repairScope = argv[++index] || "";
    else if (arg === "--grouped-navigation-export-proven") {
      const value = safeString(argv[++index]).toLowerCase();
      args.groupedNavigationExportProven = value === "true" || value === "1" || value === "yes";
    }
    else if (arg === "--strict-app-quality") args.strictAppQuality = true;
    else if (arg === "--strict-visual-app-quality") {
      args.strictVisualAppQuality = true;
      args.strictAppQuality = true;
    } else usage();
  }
  if (!args.packagePath) usage();
  if (!["full-app-plan-conformance", "focused-runtime-repair"].includes(args.validationMode)) usage();
  return args;
}

function runJsonStep(name, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch {
    parsed = {
      status: "fail",
      errors: 1,
      warnings: 0,
      findings: [{
        level: "error",
        code: `${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_OUTPUT_INVALID`,
        message: "Step did not return JSON output.",
      }],
    };
  }
  return {
    name,
    exitCode: result.status,
    status: parsed.status || (result.status ? "fail" : "pass"),
    errors: countFindings(parsed.errors),
    warnings: countFindings(parsed.warnings),
    report: parsed,
  };
}

function countFindings(value) {
  if (Array.isArray(value)) return value.length;
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function includesSection(text, section) {
  const normalized = text.toLowerCase();
  if (normalized.includes(section)) return true;
  const compact = section.replace(/\s+/g, "[- ]+");
  return new RegExp(`^#{1,4}\\s+.*${compact}`, "im").test(text);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value) {
  return value === undefined || value === null ? "" : String(value);
}

function parseMaybeJson(value) {
  if (isObject(value) || Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (/[0-9eE+\-.]/.test(jsonText[j] || "")) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else out += token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text.replace(/^\uFEFF/, ""), largeNumbers));
}

function decodePackage(packagePath) {
  const largeNumbers = new Set();
  const parsed = parseJson(fs.readFileSync(packagePath, "utf8"), largeNumbers);
  const lower = packagePath.toLowerCase();
  if (typeof parsed?.Resource === "string" && lower.endsWith(".yapk")) {
    const decoded = parseJson(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8"), largeNumbers);
    return {
      packageType: "yapk",
      wrapper: parsed,
      decoded,
      data: normalizeYapkAppPackage(decoded),
      largeNumbers: Array.from(largeNumbers),
    };
  }
  if (typeof parsed?.Resource === "string") {
    if (!parsed.Resource.startsWith(GZIP_PREFIX)) {
      return { packageType: "unknown", wrapper: parsed, decoded: null, data: null, largeNumbers: Array.from(largeNumbers) };
    }
    const decoded = parseJson(zlib.gunzipSync(Buffer.from(parsed.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
    const data = decoded && (decoded.Item || Array.isArray(decoded.Childs))
      ? decoded
      : typeof decoded?.Data === "string"
        ? parseJson(decoded.Data, largeNumbers)
        : decoded?.Data;
    return { packageType: "yap", wrapper: parsed, decoded, data, largeNumbers: Array.from(largeNumbers) };
  }
  if (typeof parsed?.Data === "string") {
    return { packageType: "decoded", wrapper: null, decoded: parsed, data: parseJson(parsed.Data, largeNumbers), largeNumbers: Array.from(largeNumbers) };
  }
  return { packageType: "decoded", wrapper: null, decoded: parsed, data: parsed, largeNumbers: Array.from(largeNumbers) };
}

function normalizeYapkAppPackage(decoded) {
  if (!isObject(decoded) || !isObject(decoded.ListSet)) return decoded;
  return {
    Item: {
      ListModel: decoded.ListSet,
      Defs: [],
      Layouts: asArray(decoded.Pages),
    },
    Childs: asArray(decoded.Childs).map((child) => ({
      ListModel: child.List,
      Defs: asArray(child.Fields),
      Layouts: asArray(child.Layouts),
    })),
  };
}

function walkControls(control, visitor, pointer = "$", depth = 0) {
  if (!isObject(control)) return;
  visitor(control, pointer, depth);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells"]) {
    asArray(control[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, depth + 1));
  }
}

function walkControlsWithAncestors(control, visitor, pointer = "$", ancestors = []) {
  if (!isObject(control)) return;
  visitor(control, pointer, ancestors);
  const nextAncestors = ancestors.concat(control);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells"]) {
    asArray(control[key]).forEach((child, index) => walkControlsWithAncestors(child, visitor, `${pointer}.${key}[${index}]`, nextAncestors));
  }
}

function inspectPlan(planPath) {
  const findings = [];
  if (!planPath) {
    findings.push({
      level: "warning",
      code: "APP_PLAN_NOT_SUPPLIED",
      message: "Provide --plan <plan.md> to validate plan-to-package coverage for generated applications.",
    });
    return { exists: false, sections: {}, findings };
  }
  if (!fs.existsSync(planPath)) {
    findings.push({
      level: "error",
      code: "APP_PLAN_FILE_MISSING",
      message: "The supplied app plan file does not exist.",
      path: planPath,
    });
    return { exists: false, sections: {}, findings };
  }
  const text = fs.readFileSync(planPath, "utf8");
  const sections = {};
  for (const section of REQUIRED_PLAN_SECTIONS) {
    sections[section] = includesSection(text, section);
    if (!sections[section]) {
      findings.push({
        level: "warning",
        code: "APP_PLAN_SECTION_MISSING",
        message: "Generated app plans should follow docs/app-plan-standard-template.md before package generation. Run scripts/validate-app-plan-template.mjs for heading and hard-gate checks.",
        section,
      });
    }
  }
  const hasExplicitScope = /full[- ]scope|complete functional|not (a )?(simple|mvp)|mvp|deferred|excluded|assumption/i.test(text);
  if (!hasExplicitScope) {
    findings.push({
      level: "warning",
      code: "APP_PLAN_SCOPE_BOUNDARY_MISSING",
      message: "The plan should state full-scope expectations, assumptions, exclusions, or deferred items.",
    });
  }
  return { exists: true, path: planPath, bytes: Buffer.byteLength(text), sections, findings };
}

function expectedPagesFromSpec(text, specPath) {
  const expected = new Set();
  if (/vendor onboarding|compliance management/i.test(text) || /vendor-onboarding/i.test(specPath)) {
    VENDOR_ONBOARDING_EXPECTED_PAGES.forEach((page) => expected.add(page));
    return Array.from(expected);
  }
  for (const match of text.matchAll(/(?:^|\n)\s*(?:[-*]|\d+\.)\s+([A-Z][^\n]{3,80}?(?:Dashboard|Workspace|View Page|Request Form|Print Page|Form|Page))/g)) {
    expected.add(match[1].trim().replace(/\s+/g, " "));
  }
  return Array.from(expected);
}

function inspectSpec(specPath) {
  const findings = [];
  if (!specPath) {
    findings.push({
      level: "warning",
      code: "UI_IMPLEMENTATION_SPEC_NOT_SUPPLIED",
      message: "Provide --spec <ui-implementation-spec.md> to validate visual-design-to-package structural fidelity.",
    });
    return { exists: false, sections: {}, expected: {}, expectedPages: [], findings };
  }
  if (!fs.existsSync(specPath)) {
    findings.push({
      level: "error",
      code: "UI_IMPLEMENTATION_SPEC_FILE_MISSING",
      message: "The supplied UI implementation spec file does not exist.",
      path: specPath,
    });
    return { exists: false, sections: {}, expected: {}, expectedPages: [], findings };
  }
  const text = fs.readFileSync(specPath, "utf8");
  const sections = {};
  for (const section of REQUIRED_SPEC_SECTIONS) {
    sections[section] = includesSection(text, section);
    if (!sections[section]) {
      findings.push({
        level: "warning",
        code: "UI_IMPLEMENTATION_SPEC_SECTION_MISSING",
        message: "UI implementation specs should include the standard design-to-control mapping sections.",
        section,
      });
    }
  }
  const lower = text.toLowerCase();
  const expected = {
    dashboards: /\bdashboard\b/.test(lower),
    customForms: /\b(new|edit|view|print) (form|page)\b|\bcustom form\b|\bapproval form\b/.test(lower),
    dataTables: /\bdata table\b|\badmin table\b|\bdata grid\b/.test(lower),
    itemTemplates: /\bcollection\b|\bkanban\b|\btimeline\b/.test(lower),
    printPage: /\bprint page\b|\bprintable\b/.test(lower),
    documentEmbed: /\bdocument embed\b/.test(lower),
    qrBarcode: /\bqr code\b|\bbarcode\b/.test(lower),
    customCss: /\bcustom css\b/.test(lower),
    customCode: /\bcustom code\b/.test(lower),
    kpiCards: /\bkpi\b|\bmetric card\b|\bcard row\b/.test(lower),
    actions: /\baction\b|\bbutton\b|\bbulk\b|\bsubmit\b|\bsave\b|\bapprove\b/i.test(text),
  };
  if (!/mockup|screenshot|image|visual design|design reference/i.test(text)) {
    findings.push({
      level: "warning",
      code: "UI_IMPLEMENTATION_SPEC_REFERENCE_CONTEXT_MISSING",
      message: "The spec should identify the mockup/image/design reference it was extracted from when applicable.",
    });
  }
  return {
    exists: true,
    path: specPath,
    bytes: Buffer.byteLength(text),
    sections,
    expected,
    expectedPages: expectedPagesFromSpec(text, specPath),
    findings,
  };
}

function inspectTemplateLibrary(libraryPath) {
  const findings = [];
  if (!libraryPath) return { exists: false, templates: [], templatesById: new Map(), findings };
  if (!fs.existsSync(libraryPath)) {
    findings.push({
      level: "error",
      code: "TEMPLATE_LIBRARY_FILE_MISSING",
      message: "The supplied template library JSON file does not exist.",
      path: libraryPath,
      source: "template-library",
    });
    return { exists: false, templates: [], templatesById: new Map(), findings };
  }
  let parsed;
  try {
    parsed = parseJson(fs.readFileSync(libraryPath, "utf8"), new Set());
  } catch (error) {
    findings.push({
      level: "error",
      code: "TEMPLATE_LIBRARY_JSON_INVALID",
      message: `Template library JSON could not be parsed: ${error.message}`,
      path: libraryPath,
      source: "template-library",
    });
    return { exists: false, templates: [], templatesById: new Map(), findings };
  }
  const templates = asArray(parsed.templates);
  const templatesById = new Map();
  if (!templates.length) {
    findings.push({
      level: "error",
      code: "TEMPLATE_LIBRARY_TEMPLATES_MISSING",
      message: "Template library must include a nonempty templates array.",
      path: libraryPath,
      source: "template-library",
    });
  }
  for (const template of templates) {
    const templateId = safeString(template.templateId);
    if (!templateId) {
      findings.push({ level: "error", code: "TEMPLATE_ID_MISSING", message: "Template library entry is missing templateId.", source: "template-library" });
      continue;
    }
    if (templatesById.has(templateId)) {
      findings.push({ level: "error", code: "TEMPLATE_ID_DUPLICATE", message: "Template library entry has a duplicate templateId.", templateId, source: "template-library" });
      continue;
    }
    templatesById.set(templateId, template);
  }
  return {
    exists: true,
    path: libraryPath,
    library: safeString(parsed.library),
    version: safeString(parsed.version),
    templates,
    templatesById,
    findings,
  };
}

function inspectCompositionChecklist(checklistPath, templateLibrary = { exists: false, templatesById: new Map() }, selectedPageIds = []) {
  const findings = [];
  if (!checklistPath) {
    return { exists: false, pages: [], findings };
  }
  if (!fs.existsSync(checklistPath)) {
    findings.push({
      level: "error",
      code: "COMPOSITION_CHECKLIST_FILE_MISSING",
      message: "The supplied composition checklist JSON file does not exist.",
      path: checklistPath,
      source: "composition-checklist",
    });
    return { exists: false, pages: [], findings };
  }
  let parsed;
  try {
    parsed = parseJson(fs.readFileSync(checklistPath, "utf8"), new Set());
  } catch (error) {
    findings.push({
      level: "error",
      code: "COMPOSITION_CHECKLIST_JSON_INVALID",
      message: `Composition checklist JSON could not be parsed: ${error.message}`,
      path: checklistPath,
      source: "composition-checklist",
    });
    return { exists: false, pages: [], findings };
  }
  const selected = new Set(asArray(selectedPageIds).map(safeString).filter(Boolean));
  const allPages = asArray(parsed.pages);
  const pages = selected.size
    ? allPages.filter((page) => selected.has(safeString(page.id)) || selected.has(safeString(page.title)))
    : allPages;
  if (!pages.length) {
    findings.push({
      level: "error",
      code: selected.size ? "COMPOSITION_CHECKLIST_PAGE_FILTER_EMPTY" : "COMPOSITION_CHECKLIST_PAGES_MISSING",
      message: selected.size ? "Composition checklist page filter did not match any pages." : "Composition checklist must include a nonempty pages array.",
      path: checklistPath,
      selectedPages: Array.from(selected),
      source: "composition-checklist",
    });
  }
  const sectionIds = new Set();
  for (const page of pages) {
    if (!safeString(page.id)) {
      findings.push({ level: "error", code: "COMPOSITION_PAGE_ID_MISSING", message: "Composition checklist page is missing a stable id.", page: page.title, source: "composition-checklist" });
    }
    if (!safeString(page.title)) {
      findings.push({ level: "error", code: "COMPOSITION_PAGE_TITLE_MISSING", message: "Composition checklist page is missing a title.", pageId: page.id, source: "composition-checklist" });
    }
    for (const section of asArray(page.sections)) {
      const sectionKey = `${safeString(page.id)}:${safeString(section.id)}`;
      if (!safeString(section.id)) {
        findings.push({ level: "error", code: "COMPOSITION_SECTION_ID_MISSING", message: "Composition checklist section is missing a stable id.", page: page.title, source: "composition-checklist" });
      } else if (sectionIds.has(sectionKey)) {
        findings.push({ level: "error", code: "COMPOSITION_SECTION_ID_DUPLICATE", message: "Composition checklist section id is duplicated within the same page.", page: page.title, section: section.id, source: "composition-checklist" });
      } else sectionIds.add(sectionKey);
      if (!["required", "optional", "deferred"].includes(safeString(section.status))) {
        findings.push({ level: "error", code: "COMPOSITION_SECTION_STATUS_INVALID", message: "Composition checklist section must use required, optional, or deferred status.", page: page.title, section: section.id, status: section.status, source: "composition-checklist" });
      }
      if (!asArray(section.controls).length) {
        findings.push({ level: "error", code: "COMPOSITION_SECTION_CONTROLS_MISSING", message: "Composition checklist section must define exact Yeeflow control types.", page: page.title, section: section.id, source: "composition-checklist" });
      }
      if (templateLibrary.exists && (section.status === "required" || section.required === true)) {
        const templateId = safeString(section.templateId);
        if (!templateId) {
          findings.push({ level: "error", code: "TEMPLATE_ID_MISSING", message: "Required composition checklist section must reference a known templateId.", page: page.title, section: section.id, source: "template-library" });
        } else if (!templateLibrary.templatesById.has(templateId)) {
          findings.push({ level: "error", code: "TEMPLATE_ID_UNKNOWN", message: "Composition checklist section references an unknown templateId.", page: page.title, section: section.id, templateId, source: "template-library" });
        }
      }
      if (section.status === "deferred" && !safeString(section.deferReason || section.fallback?.reason)) {
        findings.push({ level: "error", code: "COMPOSITION_FALLBACK_REASON_MISSING", message: "Deferred checklist sections must include a reason and fallback.", page: page.title, section: section.id, source: "composition-checklist" });
      }
    }
  }
  return {
    exists: true,
    path: checklistPath,
    application: safeString(parsed.application),
    version: safeString(parsed.version),
    pages,
    selectedPages: Array.from(selected),
    findings,
  };
}

function scopedSpecForChecklistPages(spec, compositionChecklist, selectedPageIds = []) {
  const selected = new Set(asArray(selectedPageIds).map(safeString).filter(Boolean));
  if (!selected.size) return spec;
  const pages = asArray(compositionChecklist.pages);
  const titles = pages
    .filter((page) => selected.has(safeString(page.id)) || selected.has(safeString(page.title)))
    .map((page) => safeString(page.title))
    .filter(Boolean);
  const selectedSections = pages.flatMap((page) => asArray(page.sections));
  const sectionText = JSON.stringify(selectedSections).toLowerCase();
  return {
    ...spec,
    expectedPages: titles,
    expected: {
      dashboards: pages.some((page) => safeString(page.type).toLowerCase() === "dashboard") || /dashboard/.test(sectionText),
      customForms: pages.some((page) => /form|print|view|new/i.test(safeString(page.type))),
      dataTables: /data-list|data table|table/.test(sectionText),
      itemTemplates: /kanban|collection|timeline/.test(sectionText),
      printPage: /print/.test(sectionText),
      documentEmbed: /document-embed/.test(sectionText),
      qrBarcode: /qr|barcode/.test(sectionText),
      customCss: /custom css/.test(sectionText),
      customCode: /custom code/.test(sectionText),
      kpiCards: /kpi|metric|summary/.test(sectionText),
      actions: /button|action|binding/.test(sectionText),
    },
    scopedToChecklistPages: Array.from(selected),
  };
}

function packageInventory(validationReport, decodedPackage) {
  const inventories = validationReport?.inventories || {};
  const resources = Array.isArray(inventories.resources) ? inventories.resources : [];
  const forms = Array.isArray(inventories.forms) ? inventories.forms : [];
  const fallback = decodedInventory(decodedPackage?.data);
  return {
    resources: resources.map((resource) => ({
      title: resource.title,
      resourceType: resource.resourceType,
      fields: resource.fields,
      layouts: resource.layouts,
      sampleRecords: resource.sampleRecords,
    })),
    forms: forms.map((form) => ({
      name: form.name,
      kind: form.kind,
      pages: form.pages,
      nodeTypes: form.nodeTypes,
    })),
    summary: Object.keys(validationReport?.summary || {}).length ? validationReport.summary : fallback.summary,
    decoded: fallback,
  };
}

function decodedInventory(data) {
  const rootLayouts = asArray(data?.Item?.Layouts);
  const childItems = asArray(data?.Childs);
  return {
    summary: {
      childResources: childItems.length,
      dataLists: childItems.length,
      dashboards: rootLayouts.filter((layout) => Number(layout.Type) === 103).length,
      forms: childItems.reduce((count, item) => count + asArray(item.Layouts).filter((layout) => Number(layout.Type) === 1).length, 0),
    },
    dashboards: rootLayouts.map((layout) => ({ title: safeString(layout.Title), type: Number(layout.Type), layoutId: safeString(layout.LayoutID) })),
    lists: childItems.map((item) => ({
      title: safeString(item.ListModel?.Title),
      listId: safeString(item.ListModel?.ListID),
      fieldCount: asArray(item.Defs).length,
      layouts: asArray(item.Layouts).map((layout) => ({ title: safeString(layout.Title), type: Number(layout.Type), layoutId: safeString(layout.LayoutID) })),
    })),
  };
}

function compareSpecToPackage(spec, inventory, uiQualityReport) {
  if (!spec.exists) return [];
  const findings = [];
  const expected = spec.expected || {};
  const summary = inventory.summary || {};
  const uiSummary = uiQualityReport?.summary || {};
  if (expected.dashboards && Number(summary.dashboards || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_DASHBOARD_MISSING", message: "The UI implementation spec references dashboard pages, but package inventory found none." });
  }
  if (expected.customForms && Number(uiSummary.customForms || 0) === 0 && Number(summary.forms || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_FORM_SURFACES_MISSING", message: "The UI implementation spec references form/view/print surfaces, but package inventory found no matching form surfaces." });
  }
  if (expected.dataTables && Number(uiSummary.dataTables || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_DATA_TABLE_MISSING", message: "The UI implementation spec references Data table/grid surfaces, but UI inspection found no Data table controls." });
  }
  if (expected.itemTemplates && Number(uiSummary.itemTemplateControls || 0) === 0) {
    findings.push({ level: "warning", code: "SPEC_EXPECTED_COLLECTION_KANBAN_TIMELINE_MISSING", message: "The UI implementation spec references Collection/Kanban/Timeline surfaces, but UI inspection found no item-template controls." });
  }
  if (expected.printPage) {
    findings.push({ level: "warning", code: "SPEC_PRINT_PAGE_MANUAL_REVIEW", message: "The UI implementation spec references a Print Page. Verify print layout, QR/barcode, page breaks, and read-only field formatting manually." });
  }
  if (expected.documentEmbed || expected.qrBarcode || expected.customCss || expected.customCode) {
    findings.push({ level: "warning", code: "SPEC_ADVANCED_VISUAL_ELEMENTS_MANUAL_REVIEW", message: "The UI implementation spec references advanced visual elements. Verify Document embed, QR/Barcode, custom CSS, or Custom code placement manually." });
  }
  return findings;
}

function controlText(control) {
  const attrs = control?.attrs || {};
  const candidates = [
    control.label,
    control.text,
    attrs.text,
    attrs.title,
    attrs.value,
    attrs.headc?.title?.value,
    attrs.headc?.title,
    attrs.description,
    attrs.desc,
  ];
  return candidates.map(safeString).find(Boolean) || "";
}

function hasActionBinding(control) {
  const attrs = control?.attrs || {};
  const candidates = [
    attrs.control_action,
    attrs.action,
    attrs.actionId,
    attrs.action_id,
    attrs.click,
    attrs.onClick,
    attrs["action-type"],
    attrs.op && (attrs.data?.list || attrs.data?.page || attrs.data?.form || attrs.data?.workflow),
    control.action,
    control.actionId,
  ];
  if (candidates.some((candidate) => safeString(candidate))) return true;
  return asArray(attrs.actions).length > 0 || asArray(control.actions).length > 0;
}

function countControls(root) {
  const counts = {};
  let total = 0;
  walkControls(root, (control) => {
    total += 1;
    const type = safeString(control.type) || "<root>";
    counts[type] = (counts[type] || 0) + 1;
  });
  return { total, counts };
}

function getLayoutPage(layout) {
  for (const resource of asArray(layout.LayoutInResources)) {
    const parsed = parseMaybeJson(resource?.Resource);
    if (parsed) return parsed;
  }
  return null;
}

function collectSurfaces(data) {
  const dashboards = [];
  const customForms = [];
  for (const layout of asArray(data?.Item?.Layouts)) {
    if (Number(layout.Type) === 103) dashboards.push({ layout, page: getLayoutPage(layout), title: safeString(layout.Title), kind: "dashboard" });
  }
  for (const item of asArray(data?.Childs)) {
    const listTitle = safeString(item.ListModel?.Title);
    for (const layout of asArray(item.Layouts)) {
      if (Number(layout.Type) === 1) customForms.push({ layout, page: getLayoutPage(layout), title: safeString(layout.Title), listTitle, kind: "custom_form" });
    }
  }
  return { dashboards, customForms };
}

function strictAdd(findings, code, message, detail = {}, level = "error") {
  findings.push({ level, code, message, detail, source: "strict-visual-app-quality" });
}

function compositionAdd(findings, code, message, detail = {}, level = "error") {
  findings.push({ level, code, message, detail, source: "composition-checklist" });
}

function templateAdd(findings, code, message, detail = {}, level = "error") {
  findings.push({ level, code, message, detail, source: "template-library" });
}

function hasSafePadding(page) {
  const text = JSON.stringify(page || {});
  if (/padding/i.test(text) && /(--sp--s[3-9]|\b(1[6-9]|[2-9]\d)px\b|"left"\s*:\s*"?([2-9]\d|1[6-9])|"right"\s*:\s*"?([2-9]\d|1[6-9]))/.test(text)) return true;
  return false;
}

function hasCardStructure(page) {
  let cardLike = 0;
  walkControls(page, (control) => {
    const type = safeString(control.type);
    const label = safeString(control.label).toLowerCase();
    const styleText = JSON.stringify(control.attrs || {});
    if (type === "card" || type === "summary" || label.includes("card") || /border|shadow|radius|background|padding/i.test(styleText)) cardLike += 1;
  });
  return cardLike >= 3;
}

function hasAnyCardContainer(page) {
  let cardLike = 0;
  walkControls(page, (control) => {
    const type = safeString(control.type);
    const label = safeString(control.label).toLowerCase();
    const styleText = JSON.stringify(control.attrs || {});
    if (type === "card" || type === "summary" || label.includes("card") || /border|shadow|radius|background|padding/i.test(styleText)) cardLike += 1;
  });
  return cardLike >= 1;
}

function normalizedControlType(type) {
  const normalized = safeString(type).toLowerCase().replace(/[_\s]+/g, "-");
  const aliases = {
    "data-table": "data-list",
    "data-grid": "data-list",
    "table-v2": "data-list",
    "action-button": "button",
    "heading": "text",
    "flex-grid": "grid",
    "flex_grid": "grid",
    "icon_list": "icon-list",
    "section": "container",
    "section-column": "container",
    "line": "divider",
    "line-break": "divider",
    "vertical-timeline": "timeline-v",
    "horizontal-timeline": "timeline-h",
    "steps-bar": "steps",
    "aktabs": "tabs",
    "ak-tabs": "tabs",
    "ak-tabs-tab": "tabs",
    "progress": "progress-bar",
    "picture": "dynamic-image",
    "summary": "dynamic-field",
    "dynamic-sub-list": "list",
    "sub-list": "list",
    "list-body": "list",
    "list-footer": "list",
    "list-qrcode": "qrcode",
    "qr-code": "qrcode",
    "document-embed": "document",
    "custom-css": "custom-css",
  };
  return aliases[normalized] || normalized;
}

function controlTypeSet(page) {
  const types = new Set();
  walkControls(page, (control) => types.add(normalizedControlType(control.type)));
  return types;
}

function pageText(page) {
  return JSON.stringify(page || {}).toLowerCase();
}

function hasGridStructure(page) {
  let gridLike = 0;
  walkControls(page, (control) => {
    const type = normalizedControlType(control.type);
    const attrs = JSON.stringify(control.attrs || {});
    if (["grid", "flex-grid", "row", "columns"].includes(type) || /columns|grid|flex|gap/i.test(attrs)) gridLike += 1;
  });
  return gridLike > 0;
}

function isContainerLike(control) {
  return ["container", "section", "grid", "columns", "row"].includes(normalizedControlType(control?.type));
}

function controlChildren(control) {
  return asArray(control?.children);
}

function attrValue(value) {
  if (Array.isArray(value) && value.length >= 2) return value[1];
  return value;
}

function styleAttrs(control) {
  return isObject(control?.attrs?.style) ? control.attrs.style : {};
}

function commonAttrs(control) {
  return isObject(control?.attrs?.common) ? control.attrs.common : {};
}

function styleValue(control, key) {
  const style = styleAttrs(control);
  if (style[key] !== undefined) return attrValue(style[key]);
  const common = commonAttrs(control);
  if (common[key] !== undefined) return attrValue(common[key]);
  return undefined;
}

function commonPositionValue(control, key) {
  const common = commonAttrs(control);
  if (common[key] !== undefined) return attrValue(common[key]);
  if (common.positioning?.[key] !== undefined) return attrValue(common.positioning[key]);
  return undefined;
}

function isZeroPadding(value) {
  if (value === undefined || value === null) return false;
  if (value === 0 || value === "0" || value === "0px" || value === "--sp--s0") return true;
  if (Array.isArray(value)) return value.every((item) => item === null || isZeroPadding(item));
  if (isObject(value)) return Object.values(value).every(isZeroPadding);
  return false;
}

function pagePaddingValue(page) {
  return page?.attrs?.container?.padding
    ?? page?.attrs?.style?.padding
    ?? page?.attrs?.padding
    ?? page?.padding;
}

function pageContentWidthIsFull(page) {
  const attrs = page?.attrs || {};
  const candidates = [
    attrs.contentWidth,
    attrs.content_width,
    attrs.cw,
    attrs.container?.contentWidth,
    attrs.container?.content_width,
    attrs.container?.cw,
    attrs.style?.contentWidth,
    attrs.style?.cw,
  ].map(attrValue).filter((value) => value !== undefined && value !== null && value !== "");
  if (!candidates.length) return false;
  return candidates.some((value) => /^(full|full-width|100%|fluid)$/i.test(String(value)));
}

function hasRowLayout(control) {
  const raw = JSON.stringify(control?.attrs || {});
  return styleValue(control, "direction") === "row"
    || /flex-direction\s*:\s*row|display\s*:\s*flex[^}]+row/i.test(raw)
    || (/display\s*:\s*flex/i.test(raw) && /direction.*row/i.test(raw));
}

function isFillWidthPanel(panel) {
  const widthType = styleValue(panel, "widthtype");
  const width = styleValue(panel, "width");
  return widthType === "0" || widthType === 0 || width === "auto" || width === "100%" || styleValue(panel, "flex") || /flex\s*:\s*1|flex-grow\s*:\s*1/i.test(JSON.stringify(panel.attrs || {}));
}

function isFixedWidthPanel(panel) {
  const widthType = styleValue(panel, "widthtype");
  const width = Number(styleValue(panel, "width"));
  return widthType === "3" || widthType === 3 || (Number.isFinite(width) && width >= 240);
}

function hasFullHeight(panel) {
  const height = styleValue(panel, "height");
  const customHeight = Number(styleValue(panel, "cushei"));
  const customUnit = styleValue(panel, "cusheiu");
  return height === "2" || height === 2 || height === "100%" || (customHeight === 100 && customUnit === "%");
}

function hasHiddenOverflow(panel) {
  return styleValue(panel, "overflow") === "hidden" || /overflow\s*:\s*hidden/i.test(JSON.stringify(panel.attrs || {}));
}

function hasScrollableBody(panel) {
  return controlChildren(panel).some((child) => {
    const overflow = styleValue(child, "overflow");
    return overflow === "scroll" || overflow === "auto" || /overflow\s*:\s*(scroll|auto)/i.test(JSON.stringify(child.attrs || {}));
  });
}

function hasHeaderAndBottom(panel) {
  const children = controlChildren(panel).filter(isContainerLike);
  if (children.length < 3) return false;
  const text = pageText(panel);
  return /bottom|notes|supporting|footer|activity|history|guidance/i.test(text)
    || children.some((child) => commonPositionValue(child, "pos") === "sticky")
    || children.some((child) => /border.*top|border-width.*top|borderWidth/i.test(JSON.stringify(child.attrs || {})));
}

function panelRoleText(panel) {
  return pageText(panel);
}

function findThreeColumnShell(page) {
  let best = null;
  walkControlsWithAncestors(page, (control, pointer, ancestors) => {
    if (best || !isContainerLike(control)) return;
    const panels = controlChildren(control).filter(isContainerLike);
    if (panels.length < 3) return;
    const firstThree = panels.slice(0, 3);
    const text = firstThree.map(panelRoleText);
    const hasLeft = /left|queue|navigation|context|app name|filter/i.test(text[0]);
    const hasMain = /main|work|content|list|inbox|ticket|request|record/i.test(text[1]);
    const hasRight = /right|detail|information|context|action/i.test(text[2]);
    if (hasLeft && hasMain && hasRight) best = { shell: control, panels: firstThree, pointer, ancestors };
  });
  return best;
}

function isMainContentAncestorPair(ancestors) {
  for (let index = 0; index < ancestors.length - 1; index += 1) {
    const current = ancestors[index];
    const next = ancestors[index + 1];
    if (/^Main$/i.test(controlNavigatorLabel(current)) && /^Content$/i.test(controlNavigatorLabel(next))) return true;
  }
  return false;
}

function parentHeightDefaultRisk(ancestors) {
  const parentContainers = ancestors.filter(isContainerLike);
  if (!parentContainers.length) return false;
  return parentContainers.some((parent) => {
    const label = controlNavigatorLabel(parent);
    if (!/^Main$|^Content$/i.test(label)) return false;
    const height = styleValue(parent, "height");
    const customHeight = Number(styleValue(parent, "cushei"));
    const customUnit = styleValue(parent, "cusheiu");
    const pos = commonPositionValue(parent, "pos") || styleValue(parent, "position");
    return !(height === "2" || height === 2 || height === "100%" || (customHeight === 100 && customUnit === "%") || pos);
  });
}

function iconWidthIssues(shell) {
  const issues = [];
  walkControls(shell, (control, pointer) => {
    if (normalizedControlType(control.type) !== "icon") return;
    const widthType = styleValue(control, "widthtype");
    const width = styleValue(control, "width");
    const size = Number(styleValue(control, "size") ?? control?.attrs?.icon?.size ?? control?.attrs?.size);
    if (widthType === "0" || widthType === 0 || String(width || "").includes("100%")) {
      issues.push({ code: "THREE_COLUMN_ICON_WIDTH_NOT_INLINE", message: "Icon controls inside the three-column shell must use inline width behavior.", pointer });
    }
    if (Number.isFinite(size) && size > 32) {
      issues.push({ code: "THREE_COLUMN_ICON_SIZE_LAYOUT_RISK", message: "Icon controls inside narrow workspace panels should use intentionally bounded sizes.", pointer, size });
    }
  });
  return issues;
}

function inspectThreeColumnWorkspace(page) {
  const errors = [];
  const candidate = findThreeColumnShell(page);
  if (!candidate) {
    errors.push({ code: "THREE_COLUMN_SHELL_MISSING", message: "No container with identifiable left, main, and right panel children was found." });
    return { ok: false, errors };
  }

  const { shell, panels, pointer, ancestors } = candidate;
  if (pointer !== "$.children[0]") {
    errors.push({ code: "THREE_COLUMN_SHELL_NOT_ROOT", message: "The three-column workspace shell must be the root page body layout container.", pointer });
  }
  if (isMainContentAncestorPair(ancestors)) {
    errors.push({ code: "THREE_COLUMN_SHELL_NESTED_IN_MAIN_CONTENT", message: "The three-column workspace shell must not be nested under the default Main > Content dashboard wrappers.", pointer });
  }
  if (parentHeightDefaultRisk(ancestors)) {
    errors.push({ code: "THREE_COLUMN_PARENT_HEIGHT_DEFAULT_RISK", message: "A parent Main/Content wrapper uses default height/positioning and can prevent the shell from occupying the page.", pointer });
  }
  if (!pageContentWidthIsFull(page)) {
    errors.push({ code: "THREE_COLUMN_PAGE_WIDTH_NOT_FULL", message: "Dashboard pages using three_column_workspace_shell must set content width to Full Width." });
  }
  if (!isZeroPadding(pagePaddingValue(page))) {
    errors.push({ code: "THREE_COLUMN_PAGE_PADDING_NOT_ZERO", message: "Dashboard pages using three_column_workspace_shell must set page padding to 0." });
  }
  if (!hasRowLayout(shell)) {
    errors.push({ code: "THREE_COLUMN_PANELS_STACKED_VERTICALLY", message: "The workspace shell lacks row/flex direction and can render as sequential vertical content." });
  }
  const shellPos = commonPositionValue(shell, "pos");
  if (!shellPos && styleValue(shell, "position") === undefined) {
    errors.push({ code: "THREE_COLUMN_PANEL_POSITIONING_MISSING", message: "The workspace shell lacks an explicit position/offset strategy from the golden reference." });
  }

  panels.forEach((panel, index) => {
    if (!hasHeaderAndBottom(panel)) {
      errors.push({ code: "THREE_COLUMN_PANEL_MISSING", message: "A panel lacks the expected header/body/bottom container hierarchy.", panelIndex: index });
    }
    if (index === 1 ? !isFillWidthPanel(panel) : !isFixedWidthPanel(panel)) {
      errors.push({ code: "THREE_COLUMN_PANEL_WIDTH_MISSING", message: "Panel width behavior does not match the reference fixed/fill/fixed column model.", panelIndex: index });
    }
    if (!hasFullHeight(panel)) {
      errors.push({ code: "THREE_COLUMN_RUNTIME_LAYOUT_RISK", message: "Panel lacks full-height behavior and may expand or stack at runtime.", panelIndex: index });
    }
    if (!hasHiddenOverflow(panel)) {
      errors.push({ code: "THREE_COLUMN_OVERFLOW_MISSING", message: "Panel lacks hidden outer overflow; body content may expand the shell instead of scrolling.", panelIndex: index });
    }
    if (!hasScrollableBody(panel)) {
      errors.push({ code: "THREE_COLUMN_OVERFLOW_MISSING", message: "Panel lacks a scrollable body region.", panelIndex: index });
    }
    if (/drag to add controls here/i.test(panelRoleText(panel))) {
      errors.push({ code: "THREE_COLUMN_PLACEHOLDER_PANEL", message: "Panel still contains designer drop-zone placeholder text.", panelIndex: index });
    }
  });
  errors.push(...iconWidthIssues(shell));

  return { ok: errors.length === 0, errors };
}

function hasThreeColumnWorkspace(page) {
  return inspectThreeColumnWorkspace(page).ok;
}

function findMultiColumnFormWorkspace(page) {
  let best = null;
  walkControlsWithAncestors(page, (control, pointer, ancestors) => {
    if (best || !isContainerLike(control)) return;
    const panels = controlChildren(control).filter(isContainerLike);
    if (panels.length < 3) return;
    const panelText = panels.map((panel) => pageText(panel));
    const hasNavigation = /help desk|navigation|menu|inbox|mentioned|created by you|all tickets|unassigned|flagged|teams/i.test(panelText[0] || "");
    const hasList = /all tickets|ticket list|collection|search|priority|status|queue|inbox/i.test(panelText[1] || "");
    const restText = panelText.slice(2).join(" ");
    const hasWorkspace = /description|activities|conversation|comment|selected|ticket title|tags|dynamic field|details|attributes/i.test(restText);
    const hasDetails = /details|attributes|priority|status|team|assignee|created by|ticket id/i.test(restText);
    if (hasNavigation && hasList && hasWorkspace && hasDetails) best = { shell: control, panels, pointer, ancestors };
  });
  return best;
}

function actionLikeCount(control) {
  let count = 0;
  walkControls(control, (node) => {
    if (hasActionBinding(node) || /control_action|formAction|onClick|click|actions|action_style|setvar|setdatalist/i.test(JSON.stringify(node || {}))) count += 1;
  });
  return count;
}

function hasCollectionControl(control) {
  let found = false;
  walkControls(control, (node) => {
    const type = normalizedControlType(node.type);
    if (["collection", "data-list", "list", "kanban", "timeline-v", "timeline-h"].includes(type)) found = true;
  });
  return found;
}

function hasDynamicBinding(control) {
  const raw = JSON.stringify(control || {});
  return /dynamic-field|dynamic-user|FieldName|fieldName|Current object|current item|current record|ListDataID|Selected|selected|obj-f/i.test(raw);
}

function hasFormWorkspaceFilterState(page, listPanel) {
  const raw = JSON.stringify({ pageKeys: Object.keys(page || {}), page, listPanel });
  return /filterVars|tempVars|variables|setvar|setvar_multi|filter_|filterFieldDic|Priority|Status|queue|CurrentUser|FlaggedTicketsItemID/i.test(raw);
}

function hasSelectedRecordAction(listPanel) {
  const raw = JSON.stringify(listPanel || {});
  return /ListDataID|selected|Selected|current|Current|setvar|setdatalist|actions|control_action/i.test(raw);
}

function hasIconAction(shell) {
  let found = false;
  walkControlsWithAncestors(shell, (control, _pointer, ancestors) => {
    if (normalizedControlType(control.type) !== "icon") return;
    if (hasActionBinding(control) || ancestors.some((ancestor) => hasActionBinding(ancestor) || /control_action|actions|click|action_style/i.test(JSON.stringify(ancestor?.attrs || ancestor || {})))) {
      found = true;
    }
  });
  return found;
}

function hasGapSetting(control) {
  return styleValue(control, "gap") !== undefined || /"gap"\s*:|element[_-]?gap/i.test(JSON.stringify(control?.attrs || {}));
}

function hasAlignItems(control) {
  return styleValue(control, "align_items") !== undefined || styleValue(control, "alignItems") !== undefined || /align-items|align_items/i.test(JSON.stringify(control?.attrs || {}));
}

function hasJustifyContent(control) {
  return styleValue(control, "justify_content") !== undefined || styleValue(control, "justifyContent") !== undefined || /justify-content|justify_content/i.test(JSON.stringify(control?.attrs || {}));
}

function descendantSome(control, predicate) {
  let found = false;
  walkControls(control, (node) => {
    if (!found && predicate(node)) found = true;
  });
  return found;
}

function hasGrowSizing(control) {
  const raw = JSON.stringify(control?.attrs || {});
  return isFillWidthPanel(control)
    || attrValue(control?.attrs?.common?.container?.size) === "grow"
    || /flex\s*:\s*1|flex-grow\s*:\s*1|flex:\s*1 1 0|size"\s*:\s*\[\s*null\s*,\s*"grow"/i.test(raw);
}

function hasAnyScrollBehavior(control) {
  if (["hidden", "scroll", "auto"].includes(safeString(styleValue(control, "overflow")))) return true;
  let found = false;
  walkControls(control, (node) => {
    const overflow = safeString(styleValue(node, "overflow"));
    if (["hidden", "scroll", "auto"].includes(overflow) || /overflow\s*:\s*(hidden|scroll|auto)/i.test(JSON.stringify(node?.attrs || {}))) found = true;
  });
  return found;
}

function findRightAttributesPanel(workspacePanels) {
  for (const panel of workspacePanels) {
    let match = null;
    walkControls(panel, (node) => {
      if (match || !isContainerLike(node)) return;
      const text = pageText(node);
      if (/details|attributes|ticket id|priority|status|team|assignee|request type|service category/i.test(text) && (isFixedWidthPanel(node) || styleValue(node, "width"))) {
        match = node;
      }
    });
    if (match) return match;
  }
  return null;
}

function actionRowContainers(root) {
  const rows = [];
  walkControls(root, (node) => {
    if (!isContainerLike(node) || !hasActionBinding(node)) return;
    const children = controlChildren(node);
    const hasIcon = children.some((child) => normalizedControlType(child.type) === "icon" || normalizedControlType(child.type) === "dynamic-user");
    const hasText = children.some((child) => ["text", "heading"].includes(normalizedControlType(child.type)));
    if (hasIcon && hasText) rows.push(node);
  });
  return rows;
}

function menuItemLayoutIssues(navPanel) {
  const rows = actionRowContainers(navPanel);
  const issues = [];
  if (rows.length < 3) {
    issues.push({ code: "FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID", message: "Navigation menu items should be horizontal icon/text containers with click actions." });
    return issues;
  }
  rows.forEach((row, index) => {
    if (!hasRowLayout(row) || !hasAlignItems(row) || !hasGapSetting(row)) {
      issues.push({ code: "FORM_WORKSPACE_MENU_ITEM_LAYOUT_INVALID", message: "A navigation menu item lacks row direction, align-items, or gap settings.", rowIndex: index });
    }
  });
  return issues;
}

function ticketItemLayoutIssues(listPanel) {
  const issues = [];
  let collection = null;
  walkControls(listPanel, (node) => {
    if (!collection && normalizedControlType(node.type) === "collection") collection = node;
  });
  if (!collection) return issues;
  const item = controlChildren(collection).find(isContainerLike);
  if (!item || !hasActionBinding(item)) {
    issues.push({ code: "FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID", message: "The collection item template must be an action-bearing container for selected-ticket state." });
    return issues;
  }
  if (!hasRowLayout(item)) {
    issues.push({ code: "FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID", message: "The ticket collection item template lacks stable row/card layout mechanics." });
  }
  if (!/padding|radius|background|border/i.test(JSON.stringify(item.attrs || {}))) {
    issues.push({ code: "FORM_WORKSPACE_TICKET_ITEM_LAYOUT_INVALID", message: "The ticket collection item template lacks card/list spacing and selected-state styling." });
  }
  return issues;
}

function formIconLayoutIssues(shell) {
  const issues = [];
  walkControls(shell, (control, pointer) => {
    if (normalizedControlType(control.type) !== "icon") return;
    const widthType = commonPositionValue(control, "widthtype") ?? styleValue(control, "widthtype");
    const width = commonPositionValue(control, "width") ?? styleValue(control, "width");
    const size = Number(attrValue(control?.attrs?.icon?.size) ?? styleValue(control, "size") ?? control?.attrs?.size);
    if (widthType === "0" || widthType === 0 || widthType === "3" || widthType === 3 || String(width || "").includes("100%")) {
      issues.push({ code: "FORM_WORKSPACE_ICON_WIDTH_NOT_INLINE", message: "Icon controls inside the form workspace must use inline width behavior, not block/full-width sizing.", pointer });
    }
    if (Number.isFinite(size) && size > 24) {
      issues.push({ code: "FORM_WORKSPACE_ICON_SIZE_LAYOUT_RISK", message: "Icon controls inside the form workspace should use bounded sizes comparable to the Service Desk reference.", pointer, size });
    }
  });
  return issues;
}

function hasVerticalTextRisk(control) {
  let risky = false;
  walkControls(control, (node) => {
    const type = normalizedControlType(node.type);
    if (!["text", "heading", "dynamic-field"].includes(type)) return;
    const widthType = commonPositionValue(node, "widthtype") ?? styleValue(node, "widthtype");
    const width = Number(commonPositionValue(node, "width") ?? styleValue(node, "width"));
    const raw = JSON.stringify(node.attrs || {});
    if ((Number.isFinite(width) && width > 0 && width < 48) || widthType === "3" && width < 48 || /word-break\s*:\s*break-all|writing-mode|vertical-rl/i.test(raw)) {
      risky = true;
    }
  });
  return risky;
}

function isDefaultContainerOnly(shell) {
  let containers = 0;
  let styledContainers = 0;
  walkControls(shell, (node) => {
    if (!isContainerLike(node)) return;
    containers += 1;
    if (Object.keys(node.attrs?.style || {}).length || Object.keys(node.attrs?.common || {}).length || hasActionBinding(node)) styledContainers += 1;
  });
  return containers >= 4 && styledContainers <= 1;
}

function hasFakeSubmitButton(page) {
  return buttonIndex(page).some((button) => /submit request|send request|submit new request|create request/i.test(button.label));
}

function inspectMultiColumnFormWorkspace(page) {
  const errors = [];
  const candidate = findMultiColumnFormWorkspace(page);
  if (!candidate) {
    errors.push({ code: "FORM_WORKSPACE_SURFACE_MISSING", message: "No multi-column form workspace shell with navigation, ticket list, selected workspace, and details regions was found." });
    return { ok: false, errors };
  }
  const { shell, panels } = candidate;
  const [navPanel, listPanel, ...workspacePanels] = panels;
  const rightPanel = findRightAttributesPanel(workspacePanels);
  const shellText = pageText(shell);
  if (isDefaultContainerOnly(shell)) {
    errors.push({ code: "FORM_WORKSPACE_DEFAULT_CONTAINER_ONLY", message: "The form workspace uses generic default containers instead of the Service Desk runtime layout property map." });
  }
  if (commonPositionValue(shell, "pos") === undefined && styleValue(shell, "position") === undefined) {
    errors.push({ code: "FORM_WORKSPACE_SHELL_LAYOUT_PROPERTIES_MISSING", message: "The form workspace shell lacks explicit position/full-form placement settings." });
  }
  if (!hasGapSetting(shell)) {
    errors.push({ code: "FORM_WORKSPACE_ELEMENT_GAP_MISSING", message: "The form workspace shell lacks an explicit element gap setting." });
  }
  if (!hasRowLayout(shell)) {
    errors.push({ code: "FORM_WORKSPACE_DIRECTION_INVALID", message: "The form workspace shell lacks side-by-side row direction and may stack vertically." });
    errors.push({ code: "FORM_WORKSPACE_PANEL_LAYOUT_INVALID", message: "The form workspace shell lacks side-by-side row mechanics and may stack vertically." });
  }
  if (!hasFullHeight(navPanel) || !hasFullHeight(listPanel) || !workspacePanels.some(hasFullHeight)) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_HEIGHT_MISSING", message: "One or more form workspace columns lack full-height behavior." });
  }
  if (!(isFixedWidthPanel(navPanel) || styleValue(navPanel, "width"))) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_WIDTH_MISSING", message: "The navigation panel lacks fixed-width behavior." });
    errors.push({ code: "FORM_WORKSPACE_PANEL_LAYOUT_INVALID", message: "The navigation panel lacks fixed-width behavior." });
  }
  if (!(isFixedWidthPanel(listPanel) || styleValue(listPanel, "width"))) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_WIDTH_MISSING", message: "The ticket collection panel lacks fixed-width behavior." });
    errors.push({ code: "FORM_WORKSPACE_PANEL_LAYOUT_INVALID", message: "The ticket collection panel lacks fixed-width behavior." });
  }
  if (!workspacePanels.some(hasGrowSizing)) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_WIDTH_MISSING", message: "The selected-record workspace area lacks fill/grow width behavior." });
  }
  if (rightPanel && !(isFixedWidthPanel(rightPanel) || styleValue(rightPanel, "width"))) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_WIDTH_MISSING", message: "The right attributes/details panel lacks fixed-width behavior." });
  }
  if (![navPanel, listPanel, ...workspacePanels].every(hasAnyScrollBehavior)) {
    errors.push({ code: "FORM_WORKSPACE_COLUMN_OVERFLOW_MISSING", message: "Columns or their body regions lack explicit overflow/scroll behavior." });
  }
  if (!hasAlignItems(navPanel) && !descendantSome(navPanel, hasAlignItems)) {
    errors.push({ code: "FORM_WORKSPACE_ALIGN_ITEMS_MISSING", message: "Navigation/menu layout lacks align-items settings and can squeeze icon/text controls." });
  }
  if (!hasJustifyContent(listPanel) && !descendantSome(listPanel, hasJustifyContent)) {
    errors.push({ code: "FORM_WORKSPACE_JUSTIFY_CONTENT_MISSING", message: "Ticket list/header layout lacks justify-content settings for stable row composition." });
  }
  if (hasVerticalTextRisk(shell)) {
    errors.push({ code: "FORM_WORKSPACE_VERTICAL_TEXT_RISK", message: "One or more text/field controls have narrow or vertical text risk." });
  }
  if ([navPanel, listPanel, ...workspacePanels].some((panel) => {
    const width = Number(styleValue(panel, "width"));
    return Number.isFinite(width) && width > 0 && width < 180;
  })) {
    errors.push({ code: "FORM_WORKSPACE_CONTROL_WIDTH_RISK", message: "A workspace column has an unsafe narrow width that can squeeze text vertically." });
  }
  errors.push(...menuItemLayoutIssues(navPanel));
  errors.push(...ticketItemLayoutIssues(listPanel));
  errors.push(...formIconLayoutIssues(shell));
  if (hasFakeSubmitButton(shell)) {
    errors.push({ code: "FORM_WORKSPACE_FAKE_SUBMIT_BUTTON", message: "A no-submit form workspace must not add a fake request-submit button." });
  }
  if (/Start\s*[-→>]+\s*End/i.test(JSON.stringify(page || "")) && /approve|reject|manager|review task/i.test(shellText)) {
    errors.push({ code: "FORM_WORKSPACE_FAKE_WORKFLOW", message: "A form workspace with only Start-to-End workflow should not claim real approval routing." });
  }
  if (actionLikeCount(navPanel) < 2) {
    errors.push({ code: "FORM_WORKSPACE_NAV_ACTION_MISSING", message: "Navigation menu containers should have click/form actions for workspace filters." });
  }
  if (!hasFormWorkspaceFilterState(page, listPanel)) {
    errors.push({ code: "FORM_WORKSPACE_FILTER_VARIABLE_MISSING", message: "The workspace lacks detectable form variables or set-variable actions for filter state." });
  }
  if (!hasCollectionControl(listPanel) || !/filter|query|condition|Priority|Status|CurrentUser|Flagged/i.test(JSON.stringify(listPanel || {}))) {
    errors.push({ code: "FORM_WORKSPACE_COLLECTION_FILTER_MISSING", message: "The ticket collection panel lacks detectable collection filtering or query state." });
  }
  if (!hasSelectedRecordAction(listPanel)) {
    errors.push({ code: "FORM_WORKSPACE_SELECTED_RECORD_ACTION_MISSING", message: "Ticket collection items should set selected/current record state." });
  }
  if (!workspacePanels.some(hasDynamicBinding)) {
    errors.push({ code: "FORM_WORKSPACE_DETAIL_BINDING_MISSING", message: "Selected workspace/details panels lack dynamic selected-record field bindings." });
  }
  if (!hasIconAction(shell)) {
    errors.push({ code: "FORM_WORKSPACE_ICON_ACTION_MISSING", message: "Icon/action containers should have explicit action bindings when used for panel controls." });
  }
  if (/drag to add controls here|placeholder-only|lorem ipsum/i.test(shellText)) {
    errors.push({ code: "FORM_WORKSPACE_PLACEHOLDER_PANEL", message: "The form workspace contains placeholder-only panel content." });
  }
  return { ok: errors.length === 0, errors };
}

function hasMeaningfulThreeColumnWorkspaceContent(page) {
  const text = pageText(page);
  const placeholderHits = (text.match(/drag to add controls here|placeholder|lorem ipsum|sample only|todo/g) || []).length;
  const businessTerms = (text.match(/ticket|queue|case|request|customer|account|renewal|review|sla|priority|owner|status|assignee|action|notes|activity|detail|history/g) || []).length;
  let dataBoundControls = 0;
  walkControls(page, (control) => {
    const type = normalizedControlType(control.type);
    const raw = JSON.stringify(control || {});
    if (["data-list", "collection", "kanban", "dynamic-field", "list", "timeline-v", "timeline-h"].includes(type)) dataBoundControls += 1;
    else if (/attrs?\.data|ListID|FieldName|Dynamic field|current item|current record/i.test(raw)) dataBoundControls += 1;
  });
  return placeholderHits === 0 && (businessTerms >= 3 || dataBoundControls >= 2);
}

function hasSectionSpacing(page) {
  const text = JSON.stringify(page || {});
  if (/margin|gap|spacer|divider|--sp--s[3-9]|\b(16|20|24|32)px\b/i.test(text)) return true;
  let rhythmControls = 0;
  walkControls(page, (control) => {
    if (["divider", "spacer", "section"].includes(normalizedControlType(control.type))) rhythmControls += 1;
  });
  return rhythmControls > 0;
}

function sectionMatchText(section) {
  const explicit = asArray(section.matchText).map(safeString).filter(Boolean);
  if (explicit.length) return explicit;
  return [safeString(section.title), safeString(section.id).replace(/[_-]+/g, " ")].filter(Boolean);
}

function surfaceMatchesType(surface, pageType) {
  const type = safeString(pageType).toLowerCase();
  if (!type) return true;
  if (type === "dashboard") return surface.kind === "dashboard";
  if (type.includes("form") || type.includes("print") || type.includes("view") || type.includes("new")) return surface.kind === "custom_form";
  return true;
}

function findSurfaceForChecklistPage(checklistPage, surfaces) {
  const allSurfaces = [...surfaces.dashboards, ...surfaces.customForms];
  const title = safeString(checklistPage.title).toLowerCase();
  const idTitle = safeString(checklistPage.id).replace(/[_-]+/g, " ").toLowerCase();
  const byTitle = title
    ? allSurfaces.find((surface) => surfaceMatchesType(surface, checklistPage.type) && safeString(surface.title).toLowerCase() === title)
      || allSurfaces.find((surface) => surfaceMatchesType(surface, checklistPage.type) && safeString(surface.title).toLowerCase().includes(title))
    : null;
  if (byTitle || title) return byTitle;
  return allSurfaces.find((surface) => surfaceMatchesType(surface, checklistPage.type) && safeString(surface.title).toLowerCase().includes(idTitle));
}

function buttonIndex(page) {
  const buttons = [];
  walkControls(page, (control, pointer) => {
    if (normalizedControlType(control.type) === "button") buttons.push({ control, pointer, label: controlText(control), hasAction: hasActionBinding(control) });
  });
  return buttons;
}

function pageHasPlaceholderContent(page) {
  let found = false;
  walkControls(page, (control) => {
    const type = normalizedControlType(control.type);
    const label = controlText(control).trim();
    const raw = JSON.stringify(control || "");
    if (type === "alert" && isDefaultAlert(control)) found = true;
    if (type === "button" && (!label || /^button$/i.test(label))) found = true;
    if (/Here is the description|safeGeneratedAction|placeholder-only|lorem ipsum/i.test(raw)) found = true;
  });
  return found;
}

function validateLayoutRule(rule, page) {
  const normalized = safeString(rule).toLowerCase().replace(/[_\s]+/g, "-");
  if (normalized === "safe-padding") return hasSafePadding(page);
  if (["card-container", "styled-card", "section-card"].includes(normalized)) return hasAnyCardContainer(page);
  if (["card-structure", "card-structure-present"].includes(normalized)) return hasCardStructure(page);
  if (["kpi-card-row", "metric-card-row", "summary-card-row"].includes(normalized)) return hasCardStructure(page) && /summary|aggregate|metric|total|open|resolved|submitted|kpi/i.test(JSON.stringify(page || {}));
  if (["grid-row", "multi-column-grid", "grid-structure", "responsive-grid"].includes(normalized)) return hasGridStructure(page);
  if (["three-column-workspace", "three-column-workspace-shell", "three-column-reference-mechanics", "three-panel-business-workspace", "left-context-main-detail-layout"].includes(normalized)) return hasThreeColumnWorkspace(page);
  if (["multi-column-form-workspace-shell", "multi-column-form-workspace", "four-column-service-desk-workspace", "service-desk-inbox-workspace", "action-driven-ticket-workspace"].includes(normalized)) return inspectMultiColumnFormWorkspace(page).ok;
  if (["meaningful-panel-content", "no-empty-workspace-panels"].includes(normalized)) return hasMeaningfulThreeColumnWorkspaceContent(page);
  if (["section-spacing", "visual-rhythm", "safe-spacing"].includes(normalized)) return hasSectionSpacing(page);
  if (["print-layout", "print-css"].includes(normalized)) return /print|page-break|quotation|inventory|barcode|qrcode|vendor code/i.test(JSON.stringify(page || {}));
  if (["print-header", "print-summary"].includes(normalized)) return /print|quotation|inventory|summary|customer|vendor|logo|picture/i.test(JSON.stringify(page || {}));
  if (["print-item-table", "print-checklist", "line-item-table"].includes(normalized)) return /table-v2|list-body|list-footer|dynamic-field|products|services|inventory|document|checklist/i.test(JSON.stringify(page || {}));
  if (["qr-barcode-section", "print-qr-barcode"].includes(normalized)) return /qrcode|qr-code|list-qrcode|barcode|vendor code/i.test(JSON.stringify(page || {}));
  if (["print-context"].includes(normalized)) return hasPrintContext(page);
  if (["current-record-or-item-binding"].includes(normalized)) return hasCurrentRecordOrItemQrBinding(page);
  if (["no-static-placeholder-qr"].includes(normalized)) return !hasStaticPlaceholderQr(page);
  if (["no-mutating-actions", "read-only-print"].includes(normalized)) return !/\b(Submit|Approve|Mark|Delete|Save Draft|Request Missing Documents)\b/i.test(JSON.stringify(page || {}));
  return true;
}

function hasPrintContext(page) {
  return /print|quotation|inventory|invoice|summary|terms|page-break/i.test(JSON.stringify(page || {}));
}

function qrControls(page) {
  const controls = [];
  walkControls(page, (control, pointer) => {
    const type = normalizedControlType(control.type);
    const raw = JSON.stringify(control || {});
    if (["qrcode", "barcode"].includes(type) || /list-qrcode|qr-code|qrcode|barcode/i.test(raw)) {
      controls.push({ control, pointer, raw });
    }
  });
  return controls;
}

function hasStaticPlaceholderQr(page) {
  return qrControls(page).some(({ raw }) => /example\.com|placeholder|yourdomain|todo|sample-qr|static-placeholder/i.test(raw));
}

function hasFieldBoundQrFallback(page) {
  return /\b(vendor code|quote number|quotation number|inventory code|serial number|document code|barcode value|qr fallback)\b/i.test(JSON.stringify(page || {}));
}

function hasCurrentRecordOrItemQrBinding(page) {
  const controls = qrControls(page);
  if (!controls.length) return hasFieldBoundQrFallback(page);
  return controls.some(({ raw, pointer }) => (
    /list-qrcode|list_field|List Fields:|Current object|current item|current record|fieldName|fieldID|InternalName|ListDataID|Autonumber|Serial|Quote|Code|Title/i.test(raw)
    || /collection|list|table|children/i.test(pointer)
  ));
}

function hasRepeatedQrScope(page) {
  const raw = JSON.stringify(page || {});
  return /list-qrcode/i.test(raw) && /collection|table-v2|list-body|list-footer|repeat|current item/i.test(raw);
}

function templateControlGroups(template) {
  const controls = new Set(asArray(template.requiredControls).map(normalizedControlType).filter(Boolean));
  const groups = [];
  const consumeGroup = (alts) => {
    const present = alts.filter((type) => controls.has(type));
    if (present.length > 1) {
      groups.push(present);
      present.forEach((type) => controls.delete(type));
      return true;
    }
    return false;
  };
  consumeGroup(["progress-circle", "progress-bar"]);
  consumeGroup(["kanban", "collection"]);
  consumeGroup(["timeline-v", "timeline-h", "collection"]);
  consumeGroup(["qrcode", "barcode"]);
  const recordDisplayControls = ["data-list", "collection", "timeline-v", "timeline-h", "document", "list"].filter((type) => controls.has(type));
  if (recordDisplayControls.length > 1) {
    groups.push(recordDisplayControls);
    recordDisplayControls.forEach((type) => controls.delete(type));
  }
  for (const type of controls) groups.push([type]);
  return groups;
}

function sectionExpectedFields(section, template) {
  return Array.from(new Set([
    ...asArray(template.requiredFields).map(safeString),
    ...asArray(section.requiredFields).map(safeString),
  ].filter(Boolean)));
}

function validateTemplateConformance(section, page, checklistPage, template, findings) {
  if (!template) return { checked: false, passed: false };
  let passed = true;
  const types = controlTypeSet(page);
  for (const group of templateControlGroups(template)) {
    if (!group.some((type) => types.has(type))) {
      if (group.includes("grid") && hasGridStructure(page)) continue;
      passed = false;
      templateAdd(findings, "TEMPLATE_REQUIRED_CONTROL_MISSING", "Generated section does not satisfy the referenced template's required controls.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
        requiredControl: group.length === 1 ? group[0] : group,
      });
    }
  }
  const text = pageText(page);
  const missingFields = sectionExpectedFields(section, template).filter((field) => !text.includes(field.toLowerCase()));
  if (missingFields.length) {
    passed = false;
    templateAdd(findings, "TEMPLATE_REQUIRED_FIELD_MISSING", "Generated section does not include fields required by the referenced template.", {
      page: checklistPage.title,
      section: section.id,
      templateId: template.templateId,
      missingFields,
    });
  }
  const layoutRules = Array.from(new Set([...asArray(template.layoutRules), ...asArray(section.layoutRules)].map(safeString).filter(Boolean)));
  for (const layoutRule of layoutRules) {
    const normalizedLayoutRule = safeString(layoutRule).toLowerCase().replace(/[_\s]+/g, "-");
    if (["three-column-workspace", "three-column-workspace-shell", "three-column-reference-mechanics", "three-panel-business-workspace", "left-context-main-detail-layout"].includes(normalizedLayoutRule)) {
      const threeColumn = inspectThreeColumnWorkspace(page);
      if (!threeColumn.ok) {
        passed = false;
        for (const error of threeColumn.errors) {
          templateAdd(findings, error.code, error.message, {
            page: checklistPage.title,
            section: section.id,
            templateId: template.templateId,
            layoutRule,
            panelIndex: error.panelIndex,
          });
        }
        templateAdd(findings, "TEMPLATE_LAYOUT_RULE_MISSING", "Generated section does not satisfy the referenced template's layout rule.", {
          page: checklistPage.title,
          section: section.id,
          templateId: template.templateId,
          layoutRule,
        });
      }
      continue;
    }
    if (["multi-column-form-workspace-shell", "multi-column-form-workspace", "four-column-service-desk-workspace", "service-desk-inbox-workspace", "action-driven-ticket-workspace"].includes(normalizedLayoutRule)) {
      const formWorkspace = inspectMultiColumnFormWorkspace(page);
      if (!formWorkspace.ok) {
        passed = false;
        for (const error of formWorkspace.errors) {
          templateAdd(findings, error.code, error.message, {
            page: checklistPage.title,
            section: section.id,
            templateId: template.templateId,
            layoutRule,
          });
        }
        templateAdd(findings, "TEMPLATE_LAYOUT_RULE_MISSING", "Generated section does not satisfy the referenced template's layout rule.", {
          page: checklistPage.title,
          section: section.id,
          templateId: template.templateId,
          layoutRule,
        });
      }
      continue;
    }
    if (!validateLayoutRule(layoutRule, page)) {
      passed = false;
      templateAdd(findings, "TEMPLATE_LAYOUT_RULE_MISSING", "Generated section does not satisfy the referenced template's layout rule.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
        layoutRule,
      });
    }
  }
  if (pageHasPlaceholderContent(page)) {
    passed = false;
    templateAdd(findings, "TEMPLATE_PLACEHOLDER_IMPLEMENTATION", "Generated section uses placeholder/default content to satisfy a template.", {
      page: checklistPage.title,
      section: section.id,
      templateId: template.templateId,
    });
  }
  const templateActions = asArray(template.actionRules).map(safeString).filter(Boolean);
  const requiredActions = asArray(section.actionBindings).map((action) => safeString(isObject(action) ? action.label : action)).filter(Boolean);
  if (templateActions.some((rule) => /require|binding|resolve/i.test(rule)) && requiredActions.length) {
    const buttons = buttonIndex(page);
    for (const label of requiredActions) {
      const matchingButtons = buttons.filter((button) => button.label.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(button.label.toLowerCase()));
      if (!matchingButtons.length || !matchingButtons.some((button) => button.hasAction)) {
        passed = false;
        templateAdd(findings, "TEMPLATE_ACTION_RULE_MISSING", "Generated section does not satisfy the referenced template's action binding rule.", {
          page: checklistPage.title,
          section: section.id,
          templateId: template.templateId,
          action: label,
        });
      }
    }
  }
  if (template.templateId === "print_page_qr_barcode_section") {
    const expectedMultiItemQr = /multi|repeated|collection|checklist|table/i.test(JSON.stringify(section));
    if (!qrControls(page).length && !hasFieldBoundQrFallback(page)) {
      passed = false;
      templateAdd(findings, "PRINT_QR_SECTION_MISSING", "Print page QR/barcode section is missing a QR/barcode control or field-bound code fallback.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
      });
    }
    if (hasStaticPlaceholderQr(page)) {
      passed = false;
      templateAdd(findings, "PRINT_QR_VALUE_PLACEHOLDER", "Print page QR/barcode section uses a static placeholder QR value.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
      });
    }
    if (!hasCurrentRecordOrItemQrBinding(page)) {
      passed = false;
      templateAdd(findings, "PRINT_QR_BINDING_UNRESOLVED", "Print page QR/barcode section is not bound to current item/current record context or a business code field.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
      });
    }
    if (expectedMultiItemQr && !hasRepeatedQrScope(page)) {
      passed = false;
      templateAdd(findings, "PRINT_QR_SCOPE_INVALID", "Multi-item print QR section must scope QR controls to the repeated item/list context.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
      });
    }
    if (!qrControls(page).length && !hasFieldBoundQrFallback(page)) {
      passed = false;
      templateAdd(findings, "PRINT_QR_FALLBACK_MISSING", "Print page QR fallback must be business-specific and field-bound when QR generation is deferred.", {
        page: checklistPage.title,
        section: section.id,
        templateId: template.templateId,
      });
    }
  }
  const before = findings.length;
  validateItemTemplate({ ...section, itemTemplate: section.itemTemplate || template.itemTemplate }, page, checklistPage, findings);
  if (findings.length > before) passed = false;
  if (!passed) {
    templateAdd(findings, "TEMPLATE_CONFORMANCE_FAILED", "Generated section failed template conformance.", {
      page: checklistPage.title,
      section: section.id,
      templateId: template.templateId,
    });
  }
  return { checked: true, passed };
}

function itemTemplateDynamicFieldCount(control) {
  let count = 0;
  walkControls(control, (node) => {
    const type = normalizedControlType(node.type);
    if (type.startsWith("dynamic") || type === "field") count += 1;
  });
  return count;
}

function validateItemTemplate(section, page, checklistPage, findings) {
  const itemTemplate = section.itemTemplate || {};
  if (!isObject(itemTemplate)) return;
  const expectedTypes = asArray(itemTemplate.controls || section.controls)
    .map(normalizedControlType)
    .filter((type) => ["kanban", "collection", "timeline-v", "timeline-h", "list"].includes(type));
  if (!expectedTypes.length) return;
  const candidates = [];
  walkControls(page, (control, pointer) => {
    if (expectedTypes.includes(normalizedControlType(control.type))) candidates.push({ control, pointer });
  });
  if (!candidates.length) {
    compositionAdd(findings, "COMPOSITION_ITEM_TEMPLATE_CONTROL_MISSING", "Required Kanban/Collection/Timeline/Sub List control is missing for checklist section.", { page: checklistPage.title, section: section.id, controls: expectedTypes });
    return;
  }
  const minDynamicFields = Number(itemTemplate.minDynamicFields || 0);
  if (minDynamicFields > 0 && !candidates.some((candidate) => itemTemplateDynamicFieldCount(candidate.control) >= minDynamicFields)) {
    compositionAdd(findings, "COMPOSITION_ITEM_TEMPLATE_TOO_MINIMAL", "Required item template does not include enough dynamic fields.", { page: checklistPage.title, section: section.id, minDynamicFields });
  }
  const requiredFields = asArray(itemTemplate.requiredFields).map(safeString).filter(Boolean);
  const text = pageText(page);
  const missingFields = requiredFields.filter((field) => !text.includes(field.toLowerCase()));
  if (missingFields.length) {
    compositionAdd(findings, "COMPOSITION_ITEM_TEMPLATE_FIELD_MISSING", "Required item-template fields are missing.", { page: checklistPage.title, section: section.id, missingFields });
  }
  if (itemTemplate.requiresActions === true) {
    const hasItemActions = candidates.some((candidate) => asArray(candidate.control?.attrs?.actions).length > 0 || asArray(candidate.control?.actions).length > 0);
    if (!hasItemActions) compositionAdd(findings, "COMPOSITION_ITEM_TEMPLATE_ACTIONS_MISSING", "Required item template lacks configured actions.", { page: checklistPage.title, section: section.id });
  }
}

function inspectCompositionQuality(decodedPackage, checklist, templateLibrary = { exists: false, templatesById: new Map() }) {
  const findings = [];
  const summary = { pages: [], sectionCount: 0, templateConformance: { checked: 0, passed: 0, failed: 0 } };
  if (!checklist.exists) return { summary, findings };
  const data = decodedPackage?.data;
  if (!data) {
    compositionAdd(findings, "COMPOSITION_PACKAGE_DATA_MISSING", "Package could not be decoded into an app model for composition checklist validation.");
    return { summary, findings };
  }
  const surfaces = collectSurfaces(data);
  for (const checklistPage of checklist.pages) {
    const requiredPage = checklistPage.required !== false;
    const surface = findSurfaceForChecklistPage(checklistPage, surfaces);
    const pageSummary = { id: safeString(checklistPage.id), title: safeString(checklistPage.title), type: safeString(checklistPage.type), required: requiredPage, implemented: Boolean(surface), sections: [] };
    summary.pages.push(pageSummary);
    if (!surface) {
      if (requiredPage) compositionAdd(findings, "COMPOSITION_REQUIRED_PAGE_MISSING", "Required composition-checklist page is missing from the package.", { page: checklistPage.title, pageId: checklistPage.id });
      continue;
    }
    const page = surface.page;
    const types = controlTypeSet(page);
    const text = pageText(page);
    const buttons = buttonIndex(page);
    const { total } = countControls(page);
    if ((safeString(checklistPage.type).includes("form") || safeString(checklistPage.type).includes("print")) && (!page || total < 6)) {
      compositionAdd(findings, "COMPOSITION_CUSTOM_FORM_BLANK", "Required data list custom form/print layout is blank or too small for the approved checklist.", { page: checklistPage.title, totalControls: total });
    }
    for (const section of asArray(checklistPage.sections)) {
      const status = safeString(section.status || (section.required === false ? "optional" : "required"));
      const requiredSection = status === "required" || section.required === true;
      const sectionTexts = sectionMatchText(section);
      const sectionTextFound = sectionTexts.some((needle) => text.includes(needle.toLowerCase()));
      const sectionTypes = asArray(section.controls).map(normalizedControlType).filter(Boolean);
      const controlFound = sectionTypes.length === 0 || sectionTypes.some((type) => types.has(type));
      const templateId = safeString(section.templateId);
      const template = templateId && templateLibrary.exists ? templateLibrary.templatesById.get(templateId) : null;
      pageSummary.sections.push({ id: section.id, title: section.title, status, templateId, textFound: sectionTextFound, controlFound });
      summary.sectionCount += 1;
      if (status === "deferred" && !safeString(section.deferReason || section.fallback?.reason)) {
        compositionAdd(findings, "COMPOSITION_FALLBACK_REASON_MISSING", "Checklist section is deferred without a reason.", { page: checklistPage.title, section: section.id });
      }
      if (!requiredSection) continue;
      if (!sectionTextFound) compositionAdd(findings, "COMPOSITION_REQUIRED_SECTION_MISSING", "Required composition-checklist section is missing visible/matchable content.", { page: checklistPage.title, section: section.id, matchText: sectionTexts });
      if (!controlFound) compositionAdd(findings, "COMPOSITION_SECTION_CONTROL_MISSING", "Required section does not include a matching Yeeflow control type.", { page: checklistPage.title, section: section.id, controls: sectionTypes });
      const dataSources = asArray(section.dataSources || (section.dataSource ? [section.dataSource] : [])).map(safeString).filter(Boolean);
      const missingDataSources = dataSources.filter((source) => !text.includes(source.toLowerCase()));
      if (dataSources.length && missingDataSources.length === dataSources.length) {
        compositionAdd(findings, "COMPOSITION_SECTION_DATA_BINDING_MISSING", "Required section has no detectable binding to its required data source.", { page: checklistPage.title, section: section.id, dataSources });
      }
      const requiredFields = asArray(section.requiredFields).map(safeString).filter(Boolean);
      const missingFields = requiredFields.filter((field) => !text.includes(field.toLowerCase()));
      if (requiredFields.length && missingFields.length) compositionAdd(findings, "COMPOSITION_REQUIRED_FIELD_MISSING", "Required section fields are missing from the generated page/form.", { page: checklistPage.title, section: section.id, missingFields });
      if (pageHasPlaceholderContent(page) && asArray(section.validationRules).includes("no_placeholder_content")) {
        compositionAdd(findings, "COMPOSITION_PLACEHOLDER_CONTENT", "Required section/page contains placeholder or default generated content.", { page: checklistPage.title, section: section.id });
      }
      for (const layoutRule of asArray(section.layoutRules)) {
        if (!validateLayoutRule(layoutRule, page)) compositionAdd(findings, "COMPOSITION_LAYOUT_RULE_MISSING", "Required section layout/card/padding rule is not satisfied.", { page: checklistPage.title, section: section.id, layoutRule });
      }
      for (const action of asArray(section.actionBindings)) {
        const label = safeString(isObject(action) ? action.label : action);
        if (!label) continue;
        const matchingButtons = buttons.filter((button) => button.label.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(button.label.toLowerCase()));
        if (!matchingButtons.length || !matchingButtons.some((button) => button.hasAction)) {
          compositionAdd(findings, "COMPOSITION_REQUIRED_ACTION_BINDING_MISSING", "Required section action binding is missing or unresolved.", { page: checklistPage.title, section: section.id, action: label });
        }
      }
      validateItemTemplate(section, page, checklistPage, findings);
      if (templateLibrary.exists) {
        if (!templateId) {
          templateAdd(findings, "TEMPLATE_ID_MISSING", "Required generated section cannot be validated against a template because templateId is missing.", { page: checklistPage.title, section: section.id });
        } else if (!template) {
          templateAdd(findings, "TEMPLATE_ID_UNKNOWN", "Required generated section references an unknown templateId.", { page: checklistPage.title, section: section.id, templateId });
        } else {
          const result = validateTemplateConformance(section, page, checklistPage, template, findings);
          if (result.checked) {
            summary.templateConformance.checked += 1;
            if (result.passed) summary.templateConformance.passed += 1;
            else summary.templateConformance.failed += 1;
          }
        }
      }
    }
  }
  return { summary, findings };
}

function isDefaultAlert(control) {
  const attrs = control?.attrs || {};
  const title = safeString(attrs.title || control.title || control.label).trim();
  const description = safeString(attrs.description || attrs.desc || control.description).trim();
  return /^alert$/i.test(title) || /Here is the description/i.test(description) || /Alert Here is the description/i.test(`${title} ${description}`);
}

function isFalseSetting(value) {
  if (value === false) return true;
  if (Array.isArray(value)) return value.some((item) => item === false);
  return false;
}

function controlNavigatorLabel(control) {
  return safeString(control?.nv_label || control?.label || control?.title).trim();
}

function hasDefaultNavigatorLabel(control) {
  if (!safeString(control?.type)) return false;
  const label = controlNavigatorLabel(control);
  return /^(Container|Grid|Text|Dynamic field|Dynamic user|Kanban|Collection|Button|Summary|Icon|Text Editor)(\s*\d+)?$/i.test(label);
}

function hasMissingNavigatorLabel(control) {
  return !!safeString(control?.type) && !controlNavigatorLabel(control);
}

function isLayoutGrid(control) {
  const type = safeString(control?.type);
  return type === "flex_grid" || normalizedControlType(type) === "grid";
}

function headingValue(control) {
  const title = control?.attrs?.headc?.title || control?.attrs?.heads?.title || {};
  if (title && typeof title === "object") return title.value;
  return undefined;
}

function isStaticKpiNumber(control) {
  if (normalizedControlType(control?.type) !== "text") return false;
  const value = headingValue(control);
  if (value == null) return false;
  const label = controlNavigatorLabel(control);
  return /^-?\d+(\.\d+)?%?$/.test(String(value).trim()) && /kpi|total|pending|risk|expiring|submitted|resolved|open|count|value/i.test(label);
}

function hasMainContentStructure(page) {
  const main = asArray(page?.children)[0];
  if (!main || normalizedControlType(main.type) !== "container") return false;
  if (!/main/i.test(controlNavigatorLabel(main))) return false;
  const content = asArray(main.children)[0];
  return !!content && normalizedControlType(content.type) === "container" && /content/i.test(controlNavigatorLabel(content));
}

function dashboardStructureStatus(page) {
  const children = asArray(page?.children);
  const main = children[0];
  const mainOk = !!main && normalizedControlType(main.type) === "container" && /^Main$/i.test(controlNavigatorLabel(main));
  const mainChildren = asArray(main?.children);
  const content = mainChildren[0];
  const contentOk = !!content && normalizedControlType(content.type) === "container" && /^Content$/i.test(controlNavigatorLabel(content));
  return {
    mainOk,
    contentOk,
    invalidStructure: !mainOk || !contentOk || children.length > 1 || mainChildren.length > 1,
  };
}

function pageContentPaddingIsNonZero(page) {
  const text = JSON.stringify(page?.attrs || page?.settings || {});
  const matches = text.match(/"padding(?:Top|Right|Bottom|Left)?"\s*:\s*("?)(-?\d+(?:\.\d+)?)\1/gi) || [];
  return matches.some((match) => {
    const value = Number(match.match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
    return Number.isFinite(value) && value !== 0;
  });
}

function hasSummaryTempVarKpiPattern(page) {
  const tempVars = asArray(page?.tempVars).map((item) => safeString(item?.id)).filter(Boolean);
  const exts = asArray(page?.exts).filter((item) => safeString(item?.key) === "summary" || safeString(item?.category) === "___Pivot___");
  let summarySaveVars = 0;
  let visibleTempText = 0;
  walkControls(page, (control) => {
    if (safeString(control.type) === "summary" && control?.attrs?.save_var) summarySaveVars += 1;
    if (normalizedControlType(control.type) === "text" && JSON.stringify(control?.attrs || {}).includes("__temp_")) visibleTempText += 1;
  });
  return tempVars.length >= 4 && exts.length >= 4 && summarySaveVars >= 4 && visibleTempText >= 4;
}

function inspectDashboardStrict(surface, spec, findings, summary) {
  const { title, page, layout } = surface;
  const ext2 = parseMaybeJson(layout.Ext2);
  if (Number(layout.Type) === 103 && !(ext2 && ext2.src === true)) {
    strictAdd(findings, "DASHBOARD_TYPE_103_SRC_REQUIRED", "Generated Type 103 dashboards must include Ext2 src=true so Yeeflow uses the current dashboard renderer.", { title });
  }
  if (layout.Ext2 === "" || layout.Ext2 === undefined || layout.Ext2 === null || !(ext2 && ext2.src === true)) {
    strictAdd(findings, "DASHBOARD_LEGACY_RENDERER_FORBIDDEN", "Generated dashboards must not use the retired legacy renderer shell.", { title });
  }
  if (!Array.isArray(layout.LayoutInResources)) {
    strictAdd(findings, "DASHBOARD_LAYOUTINRESOURCES_INVALID", "Generated current dashboards must provide LayoutInResources as an array.", { title });
  }
  if (!page) {
    strictAdd(findings, "SPEC_PAGE_UNDERBUILT", "Full application generation cannot return a blank dashboard for a planned app page.", { title });
    return;
  }
  const { counts, total } = countControls(page);
  const dataTables = counts["data-list"] || 0;
  const buttons = counts.button || 0;
  const alerts = counts.alert || 0;
  const itemTemplates = (counts.kanban || 0) + (counts.collection || 0) + (counts["timeline-v"] || 0) + (counts["timeline-h"] || 0);
  summary.dashboards.push({ title, totalControls: total, counts, dataTables, buttons, alerts, itemTemplates });
  if (!hasSafePadding(page)) {
    strictAdd(findings, "DASHBOARD_PADDING_MISSING", "Dashboard lacks clearly detectable safe outer padding; full UI pages must not place major content against the window edge.", { title });
  }
  const structure = dashboardStructureStatus(page);
  if (!structure.mainOk) {
    strictAdd(findings, "DASHBOARD_MAIN_CONTAINER_MISSING", "Dashboard must use the standard top-level Main container.", { title });
  }
  if (!structure.contentOk) {
    strictAdd(findings, "DASHBOARD_CONTENT_CONTAINER_MISSING", "Dashboard must place all visible page content inside Main > Content.", { title });
  }
  if (structure.invalidStructure) {
    strictAdd(findings, "DASHBOARD_CONTENT_STRUCTURE_INVALID", "Dashboard content must follow Main > Content with no sibling page sections outside the Content container.", { title });
  }
  if (pageContentPaddingIsNonZero(page)) {
    strictAdd(findings, "DASHBOARD_PAGE_PADDING_NOT_ZERO", "Dashboard page content-area padding should be zero; spacing belongs in the Main > Content containers.", { title });
  }
  if (!hasCardStructure(page)) {
    strictAdd(findings, "DASHBOARD_CARD_STRUCTURE_MISSING", "Dashboard lacks enough card/section styling for the approved modern SaaS layout.", { title });
  }
  if (total < 18 || dataTables === 1 && total < 30) {
    strictAdd(findings, "DASHBOARD_LAYOUT_TOO_PLAIN", "Dashboard is too plain for a full application proof and appears closer to an importable scaffold than a designed page.", { title, totalControls: total, dataTables });
  }
  if (/Vendor Management Dashboard/i.test(title) && spec.expected?.kpiCards && (counts.container || 0) < 8) {
    strictAdd(findings, "DASHBOARD_EXPECTED_KPI_CARDS_MISSING", "Vendor Management Dashboard should include a clear KPI card row matching the approved spec.", { title });
  }
  walkControls(page, (control, pointer) => {
    const type = safeString(control.type);
    const label = controlText(control);
    const normalized = normalizedControlType(type);
    if (hasMissingNavigatorLabel(control)) {
      strictAdd(findings, "CONTROL_NAVIGATOR_LABEL_MISSING", "Generated controls must have explicit meaningful Navigator labels.", { title, pointer, controlType: type });
    }
    if (hasDefaultNavigatorLabel(control)) {
      strictAdd(findings, "CONTROL_NAVIGATOR_LABEL_DEFAULT", "Generated controls must have meaningful Navigator labels instead of default names.", { title, pointer, controlType: type, label: controlNavigatorLabel(control) });
    }
    if (isLayoutGrid(control) && !isFalseSetting(control.displayLabel) && !isFalseSetting(control.attrs?.displayLabel)) {
      strictAdd(findings, "GRID_DISPLAY_LABEL_NOT_DISABLED", "Layout-only Grid controls must have display caption/display label turned off.", { title, pointer, label: controlNavigatorLabel(control) });
      strictAdd(findings, "GRID_DEFAULT_CAPTION_VISIBLE", "Grid captions such as the visible row label must not render on production dashboards.", { title, pointer, label: controlNavigatorLabel(control) });
    }
    if (isStaticKpiNumber(control)) {
      strictAdd(findings, "KPI_STATIC_NUMBER_TEXT", "KPI card numeric values must be data-bound summary/temp-variable values, not static Text.", { title, pointer, label: controlNavigatorLabel(control), value: headingValue(control) });
    }
    if (type === "alert" && isDefaultAlert(control)) {
      strictAdd(findings, "DASHBOARD_DEFAULT_ALERT_CONTENT", "Dashboard alert uses default placeholder content instead of meaningful compliance-risk copy.", { title, pointer, label });
      strictAdd(findings, "SPEC_CONTROL_PLACEHOLDER_ONLY", "A planned alert/control exists only as placeholder/default text.", { title, pointer, controlType: type });
    }
    if (normalized === "button") {
      if (!label || /^button$/i.test(label.trim())) strictAdd(findings, "DEFAULT_BUTTON_LABEL", "Generated dashboard button has a generic/default label.", { title, pointer, label });
      if (!hasActionBinding(control)) {
        strictAdd(findings, "BUTTON_ACTION_MISSING", "Generated dashboard button has no configured action binding.", { title, pointer, label });
        strictAdd(findings, "ACTION_BUTTON_FORMAT_INVALID", "Generated active button must use the export-proven action_button/Button format with a real action binding.", { title, pointer, label });
        strictAdd(findings, "DASHBOARD_BUTTON_ACTION_MISSING", "Dashboard contains buttons that do not expose configured actions.", { title, pointer, label });
      }
    }
    if (normalized === "kanban" || normalized === "collection") {
      const dynamicFields = [];
      walkControls(control, (node) => {
        if (safeString(node.type).startsWith("dynamic")) dynamicFields.push(node);
      });
      if (dynamicFields.length === 0) {
        strictAdd(findings, normalized === "kanban" ? "KANBAN_ITEM_TEMPLATE_EMPTY" : "COLLECTION_ITEM_TEMPLATE_EMPTY", "Kanban/Collection item template has no meaningful dynamic fields.", { title, pointer, controlType: type });
      } else if (dynamicFields.length < 3) {
        strictAdd(findings, "ITEM_TEMPLATE_TOO_MINIMAL", "Kanban/Collection item template is too minimal for a full application proof.", { title, pointer, controlType: type, dynamicFieldCount: dynamicFields.length });
      }
      const actionCount = asArray(control.attrs?.actions).length;
      if (actionCount === 0) strictAdd(findings, "ITEM_TEMPLATE_ACTIONS_MISSING", "Kanban/Collection item template has no configured item actions where the spec expects actionable cards.", { title, pointer, controlType: type });
    }
  });
  walkControlsWithAncestors(page, (control, pointer, ancestors) => {
    const rawType = safeString(control.type).toLowerCase();
    if (!rawType.startsWith("dynamic")) return;
    const scoped = ancestors.some((ancestor) => ["kanban", "collection", "timeline-v", "timeline-h"].includes(normalizedControlType(ancestor.type)));
    if (!scoped) {
      strictAdd(findings, "DYNAMIC_CONTROL_OUTSIDE_ITEM_TEMPLATE", "Dashboard Dynamic controls must stay inside Kanban, Collection, or Timeline item templates where row context exists.", { title, pointer, controlType: control.type });
    }
  });
  if (/Vendor Management Dashboard/i.test(title)) {
    const actionButtons = [];
    walkControls(page, (control, pointer) => {
      if (normalizedControlType(control.type) === "button") {
        actionButtons.push({ pointer, label: controlText(control), hasAction: hasActionBinding(control), raw: JSON.stringify(control || {}) });
      }
    });
    const newVendor = actionButtons.find((button) => /new vendor request/i.test(button.label));
    if (newVendor && !newVendor.hasAction) {
      strictAdd(findings, "NEW_VENDOR_ACTION_MISSING", "New Vendor Request must open the Vendors new-item form or be explicitly deferred.", { title, pointer: newVendor.pointer, label: newVendor.label });
    }
    const queue = actionButtons.find((button) => /view compliance queue/i.test(button.label));
    if (queue && !queue.hasAction) {
      strictAdd(findings, "COMPLIANCE_QUEUE_NAV_ACTION_MISSING", "View Compliance Queue must navigate to the compliance operations dashboard or be explicitly deferred.", { title, pointer: queue.pointer, label: queue.label });
    }
  }
  if (itemTemplates === 0 && /Compliance Review Workspace|Vendor Management Dashboard/i.test(title)) {
    strictAdd(findings, "EXPECTED_ACTION_MISSING", "Expected dashboard operations board/card actions are missing or not detectable.", { title });
  }
  if (/Vendor Management Dashboard|Executive Dashboard|Overview/i.test(title) && /kpi|metric|summary|total|pending|risk|expiring/i.test(JSON.stringify(page || {})) && !hasSummaryTempVarKpiPattern(page)) {
    strictAdd(findings, "KPI_SUMMARY_TEMP_VAR_PATTERN_MISSING", "Dashboard KPI cards should follow the golden Summary-control to temp-variable display pattern when showing aggregate values.", { title });
    strictAdd(findings, "SUMMARY_CONTROL_HIDDEN_VAR_PATTERN_MISSING", "Aggregate KPI dashboards must include hidden Summary controls saving values into dashboard temp variables.", { title });
    strictAdd(findings, "KPI_TEXT_NOT_BOUND_TO_TEMP_VAR", "Visible KPI Text controls must display formatted dashboard temp-variable values rather than static numbers.", { title });
  }
}

function inspectCustomFormStrict(surface, findings, summary) {
  const { title, listTitle, page } = surface;
  if (!page) {
    strictAdd(findings, "CUSTOM_FORM_BLANK", "Custom form layout has no parseable designed content.", { list: listTitle, title });
    return;
  }
  const { counts, total } = countControls(page);
  const fieldControls = (counts.field || 0) + (counts["dynamic-field"] || 0) + (counts["dynamic-user"] || 0) + (counts["dynamic-file"] || 0);
  summary.customForms.push({ list: listTitle, title, totalControls: total, counts, fieldControls });
  if (total < 10 || fieldControls < 4) {
    strictAdd(findings, "FORM_LAYOUT_TOO_MINIMAL", "Custom form exists but is too minimal to count as a designed full-application form.", { list: listTitle, title, totalControls: total, fieldControls });
  }
  if (/Safe padded generated form/i.test(JSON.stringify(page))) {
    strictAdd(findings, "SPEC_CONTROL_PLACEHOLDER_ONLY", "Custom form uses generated scaffold copy rather than the approved form design.", { list: listTitle, title });
    strictAdd(findings, "FORM_LAYOUT_TOO_MINIMAL", "Custom form is a generic generated maintenance form rather than a designed full-application form.", { list: listTitle, title });
  }
  walkControls(page, (control, pointer) => {
    const type = safeString(control.type);
    const label = controlText(control);
    if (type === "button") {
      if (!label || /^button$/i.test(label.trim())) strictAdd(findings, "DEFAULT_BUTTON_LABEL", "Generated custom-form button has a generic/default label.", { list: listTitle, title, pointer, label });
      if (!hasActionBinding(control)) strictAdd(findings, "BUTTON_ACTION_MISSING", "Generated custom-form button has no configured action binding.", { list: listTitle, title, pointer, label });
    }
  });
}

function inspectStrictVisualQuality(decodedPackage, spec) {
  const findings = [];
  const summary = { dashboards: [], customForms: [], expectedPages: spec.expectedPages || [] };
  const data = decodedPackage?.data;
  if (!data) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Package could not be decoded into an app model for strict visual quality validation.");
    return { summary, findings };
  }
  const surfaces = collectSurfaces(data);
  const implementedTitles = new Set([
    ...surfaces.dashboards.map((surface) => surface.title),
    ...surfaces.customForms.map((surface) => surface.title),
  ].filter(Boolean));
  for (const page of spec.expectedPages || []) {
    if (!implementedTitles.has(page)) {
      const code = /Detail View/i.test(page) ? "CUSTOM_VIEW_FORM_MISSING"
        : /Request Form|New Vendor/i.test(page) ? "CUSTOM_NEW_FORM_MISSING"
          : /Print Page/i.test(page) ? "CUSTOM_PRINT_PAGE_MISSING"
            : "SPEC_PAGE_UNDERBUILT";
      strictAdd(findings, code, "Approved UI mockup/spec page is missing from the generated app package.", { page });
    }
  }
  if (!spec.scopedToChecklistPages?.length && surfaces.dashboards.length < 2 && spec.expected?.dashboards) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Full app spec expects multiple dashboard/workspace surfaces, but package has too few dashboards.", { dashboardCount: surfaces.dashboards.length });
  }
  if (surfaces.customForms.length === 0 && spec.expected?.customForms) {
    strictAdd(findings, "CUSTOM_FORM_BLANK", "Full app spec expects designed forms, but no custom form layouts were detected.");
  }
  surfaces.dashboards.forEach((surface) => inspectDashboardStrict(surface, spec, findings, summary));
  surfaces.customForms.forEach((surface) => inspectCustomFormStrict(surface, findings, summary));
  const titleSet = new Set(surfaces.customForms.map((surface) => surface.title));
  if (spec.expectedPages?.some((page) => /Vendor Detail View Page/i.test(page)) && !titleSet.has("Vendor Detail View Page")) {
    strictAdd(findings, "CUSTOM_VIEW_FORM_MISSING", "Vendor Detail View Page is not present as a designed custom view form.");
  }
  if (spec.expectedPages?.some((page) => /New Vendor Request Form/i.test(page)) && !titleSet.has("New Vendor Request Form")) {
    strictAdd(findings, "CUSTOM_NEW_FORM_MISSING", "New Vendor Request Form is not present as a designed custom new/edit form.");
  }
  if (spec.expectedPages?.some((page) => /Vendor Print Page/i.test(page)) && !titleSet.has("Vendor Print Page")) {
    strictAdd(findings, "CUSTOM_PRINT_PAGE_MISSING", "Vendor Print Page is not present as a designed print layout.");
  }
  if (findings.some((finding) => finding.level === "error")) {
    strictAdd(findings, "FULL_APP_SCOPE_NOT_MET", "Generated package is importable but does not meet the approved full-application UI scope.");
  }
  return { summary, findings };
}

function packageValidatorArgs(repoRoot, packagePath) {
  return packagePath.toLowerCase().endsWith(".yapk")
    ? [path.join(repoRoot, "validate-yapk-package.js"), packagePath]
    : [path.join(repoRoot, "validate-yap-package.js"), packagePath, "--mode", "compatibility"];
}

function planConformanceArgs(repoRoot, planPath, packagePath, args) {
  return [
    path.join(repoRoot, "scripts/validate-app-plan-conformance.mjs"),
    "--plan",
    planPath,
    "--package",
    packagePath,
    "--mode",
    args.strictAppQuality ? "strict" : "default",
    "--grouped-navigation-export-proven",
    args.groupedNavigationExportProven ? "true" : "false",
  ];
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const packagePath = path.resolve(args.packagePath);
  const planPath = args.planPath ? path.resolve(args.planPath) : "";
  const specPath = args.specPath ? path.resolve(args.specPath) : "";
  const compositionChecklistPath = args.compositionChecklistPath ? path.resolve(args.compositionChecklistPath) : "";
  const templateLibraryPath = args.templateLibraryPath ? path.resolve(args.templateLibraryPath) : "";
  const decodedPackage = decodePackage(packagePath);
  const plan = inspectPlan(planPath);
  const rawSpec = inspectSpec(specPath);
  const templateLibrary = inspectTemplateLibrary(templateLibraryPath);
  const compositionChecklist = inspectCompositionChecklist(compositionChecklistPath, templateLibrary, args.checklistPageIds);
  const spec = scopedSpecForChecklistPages(rawSpec, compositionChecklist, args.checklistPageIds);
  const validation = runJsonStep("package-validation", process.execPath, packageValidatorArgs(repoRoot, packagePath));
  const uiQuality = runJsonStep("generated-ui-quality", process.execPath, [path.join(repoRoot, "scripts/inspect-generated-ui-quality.mjs"), packagePath]);
  const planConformance = plan.exists
    ? runJsonStep("plan-conformance", process.execPath, planConformanceArgs(repoRoot, planPath, packagePath, args))
    : {
        name: "plan-conformance",
        exitCode: 0,
        status: "skipped",
        errors: 0,
        warnings: 0,
        report: {
          status: "skipped",
          findings: [{ level: "warning", code: "PLAN_CONFORMANCE_SKIPPED", message: "Plan conformance was skipped because --plan was not supplied.", source: "plan-conformance" }],
        },
      };
  const inventory = packageInventory(validation.report, decodedPackage);
  const specPackageFindings = compareSpecToPackage(spec, inventory, uiQuality.report);
  const strictVisual = args.strictVisualAppQuality ? inspectStrictVisualQuality(decodedPackage, spec) : { summary: {}, findings: [] };
  const compositionQuality = compositionChecklist.exists ? inspectCompositionQuality(decodedPackage, compositionChecklist, templateLibrary) : { summary: {}, findings: [] };
  const strictEscalatedFindings = args.strictAppQuality
    ? specPackageFindings.map((finding) => ({ ...finding, level: finding.level === "warning" ? "error" : finding.level, source: "strict-app-quality" }))
    : specPackageFindings;
  const findings = [
    ...plan.findings,
    ...spec.findings,
    ...templateLibrary.findings,
    ...compositionChecklist.findings,
    ...strictEscalatedFindings,
    ...((validation.report.findings || []).map((finding) => ({ ...finding, source: "package-validation" }))),
    ...((uiQuality.report.findings || []).map((finding) => ({ ...finding, source: "generated-ui-quality" }))),
    ...((planConformance.report.findings || []).map((finding) => ({ ...finding, source: finding.source || "plan-conformance" }))),
    ...strictVisual.findings,
    ...compositionQuality.findings,
  ];
  if (args.validationMode === "full-app-plan-conformance") {
    if (!plan.exists) findings.push({ level: "error", code: "FULL_APP_PLAN_REQUIRED", message: "full-app-plan-conformance requires --plan coverage.", source: "validation-mode" });
    if (!spec.exists) findings.push({ level: "error", code: "FULL_APP_SPEC_REQUIRED", message: "full-app-plan-conformance requires --spec coverage.", source: "validation-mode" });
    if (!templateLibrary.exists) findings.push({ level: "error", code: "FULL_APP_TEMPLATE_COVERAGE_REQUIRED", message: "full-app-plan-conformance requires --template-library coverage.", source: "validation-mode" });
  } else if (!args.repairScope.trim()) {
    findings.push({ level: "error", code: "FOCUSED_REPAIR_SCOPE_REQUIRED", message: "focused-runtime-repair requires --repair-scope so missing full plan/spec can be intentionally scoped.", source: "validation-mode" });
  }
  const errors = findings.filter((finding) => finding.level === "error").length
    + (validation.exitCode && validation.errors === 0 ? 1 : 0)
    + (uiQuality.exitCode && uiQuality.errors === 0 ? 1 : 0);
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  const report = {
    status: errors ? "fail" : warnings ? "pass_with_warnings" : "pass",
    package: packagePath,
    packageType: decodedPackage.packageType,
    plan,
    spec,
    templateLibrary: {
      exists: templateLibrary.exists,
      path: templateLibrary.path,
      library: templateLibrary.library,
      version: templateLibrary.version,
      templates: templateLibrary.templates?.map((template) => ({
        templateId: template.templateId,
        category: template.category,
        proofStatus: template.proofStatus,
      })) || [],
    },
    compositionChecklist: {
      exists: compositionChecklist.exists,
      path: compositionChecklist.path,
      application: compositionChecklist.application,
      version: compositionChecklist.version,
      selectedPages: compositionChecklist.selectedPages || [],
      pages: compositionChecklist.pages?.map((page) => ({
        id: page.id,
        title: page.title,
        type: page.type,
        required: page.required,
        sections: asArray(page.sections).map((section) => ({ id: section.id, title: section.title, status: section.status || (section.required === false ? "optional" : "required") })),
      })) || [],
      summary: compositionQuality.summary,
    },
    inventory,
    planConformance: {
      status: planConformance.report.status || planConformance.status,
      mode: planConformance.report.mode || (args.strictAppQuality ? "strict" : "default"),
      proofBoundary: planConformance.report.proofBoundary || null,
      counts: planConformance.report.counts || {},
      navigation: planConformance.report.navigation || {},
      recommendations: planConformance.report.recommendations || [],
    },
    strict: {
      strictAppQuality: args.strictAppQuality,
      strictVisualAppQuality: args.strictVisualAppQuality,
      visualSummary: strictVisual.summary,
    },
    validationMode: {
      mode: args.validationMode,
      repairScope: args.repairScope || null,
    },
    steps: [
      { name: validation.name, status: validation.status, errors: validation.errors, warnings: validation.warnings },
      { name: uiQuality.name, status: uiQuality.status, errors: uiQuality.errors, warnings: uiQuality.warnings },
      { name: planConformance.name, status: planConformance.status, errors: planConformance.errors, warnings: planConformance.warnings },
    ],
    errors,
    warnings,
    findings,
  };
  const output = JSON.stringify(report, null, 2);
  if (args.jsonOut) fs.writeFileSync(args.jsonOut, `${output}\n`);
  console.log(output);
  if (errors) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.log(JSON.stringify({ status: "fail", errors: 1, warnings: 0, findings: [{ level: "error", code: "GENERATED_APP_QUALITY_INSPECTION_FAILED", message: error.message }] }, null, 2));
  process.exit(1);
}
