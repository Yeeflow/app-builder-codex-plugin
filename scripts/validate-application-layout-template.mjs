#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, "docs/reference/application-layout-golden-references.json");
const DEFAULT_TEMPLATE_PATH = path.join(ROOT, "docs/reference/application-layout-sidebar-workspace-1.template.json");

if (isMainModule()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.registry && !args.template && !args.package && !args.decoded)) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }
  const report = validateApplicationLayoutTemplate(args);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "pass" ? 0 : 1);
}

export function validateApplicationLayoutTemplate(options = {}) {
  const findings = [];
  const registryPath = path.resolve(options.registry && options.registry !== true ? options.registry : REGISTRY_PATH);
  const templatePath = path.resolve(options.template && options.template !== true ? options.template : DEFAULT_TEMPLATE_PATH);
  const registry = readJson(registryPath, findings, "APPLICATION_LAYOUT_REGISTRY_MISSING");
  const template = readJson(templatePath, findings, "APPLICATION_LAYOUT_TEMPLATE_MISSING");
  validateRegistry(registry, templatePath, findings);
  validateTemplate(template, findings);

  let decoded = null;
  let packagePath = null;
  if (options.package) {
    packagePath = path.resolve(options.package);
    decoded = readDecodedPackage(packagePath, findings);
  } else if (options.decoded) {
    packagePath = path.resolve(options.decoded);
    decoded = readJson(packagePath, findings, "APPLICATION_LAYOUT_DECODED_MISSING");
  }
  if (decoded) validateDecodedPackage(decoded, template, findings);

  return {
    status: findings.some((finding) => finding.level === "error") ? "fail" : "pass",
    registry: registryPath,
    template: templatePath,
    package: options.package ? packagePath : null,
    decoded: options.decoded ? packagePath : null,
    findings,
  };
}

function validateRegistry(registry, templatePath, findings) {
  if (!registry) return;
  const approved = asArray(registry.approvedTemplateIds).map(String);
  if (!approved.includes("application-layout-sidebar-workspace-1")) {
    findings.push(error("APPLICATION_LAYOUT_REGISTRY_DEFAULT_MISSING", "Application layout registry must approve application-layout-sidebar-workspace-1."));
  }
  if (String(registry.defaultTemplateId || "") !== "application-layout-sidebar-workspace-1") {
    findings.push(error("APPLICATION_LAYOUT_REGISTRY_DEFAULT_INVALID", "Application layout registry must set application-layout-sidebar-workspace-1 as the default template.", { actual: registry.defaultTemplateId || null }));
  }
  const ref = asArray(registry.references).find((entry) => String(entry?.templateId || "") === "application-layout-sidebar-workspace-1");
  if (!ref) {
    findings.push(error("APPLICATION_LAYOUT_REGISTRY_REFERENCE_MISSING", "Application layout registry must include the sidebar workspace reference."));
    return;
  }
  const resolved = path.resolve(path.dirname(templatePath), "..", "..", String(ref.sourceTemplate || ""));
  if (path.resolve(templatePath) !== resolved) {
    findings.push(error("APPLICATION_LAYOUT_REGISTRY_TEMPLATE_PATH_MISMATCH", "Application layout registry sourceTemplate must point at the sidebar workspace template.", { sourceTemplate: ref.sourceTemplate || null }));
  }
  for (const key of ["summary", "whenToUse", "whenNotToUse", "businessUse", "generationProof", "proofBoundary"]) {
    if (!String(ref[key] || "").trim()) {
      findings.push(error("APPLICATION_LAYOUT_REGISTRY_GUIDANCE_INCOMPLETE", "Application layout registry reference is missing required planning guidance.", { missing: key }));
    }
  }
}

function validateTemplate(template, findings) {
  if (!isObject(template)) return;
  if (String(template.templateId || "") !== "application-layout-sidebar-workspace-1") {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_ID_INVALID", "Application layout template ID is invalid.", { actual: template.templateId || null }));
  }
  if (String(template.baseApplicationLayoutType || "") !== "application-layout-1-vertical-nav") {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_BASE_TYPE_INVALID", "Application layout template must map to application-layout-1-vertical-nav.", { actual: template.baseApplicationLayoutType || null }));
  }
  const required = template.requiredLayoutView;
  if (!isObject(required)) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_REQUIRED_LAYOUTVIEW_MISSING", "Application layout template must define requiredLayoutView."));
    return;
  }
  if (Number(required.sortVer) !== 1) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_SORTVER_INVALID", "Application layout template must require sortVer 1.", { actual: required.sortVer ?? null }));
  }
  const attrs = required.attrs;
  if (!isObject(attrs?.appearance) || !isObject(attrs?.["navigator-menu"])) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_ATTRS_MISSING", "Application layout template must define appearance and navigator-menu attrs."));
    return;
  }
  const expectedAppearance = {
    bgc: "var(--c--primary-dark-hover)",
    color: "var(--c--background)",
    height: 46,
    ty: [null, "h6-semi-bold"],
  };
  const expectedNavigator = {
    bgc: "var(--c--primary-dark)",
    color: "var(--c--background)",
    position: "left",
    active: {},
  };
  if (!deepEqual(attrs.appearance, expectedAppearance)) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_APPEARANCE_INVALID", "Application layout template appearance attrs do not match the reference contract."));
  }
  if (!deepEqual(attrs["navigator-menu"], expectedNavigator)) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_NAVIGATOR_INVALID", "Application layout template navigator-menu attrs do not match the reference contract."));
  }
  if (!Array.isArray(attrs.CustomColors) || attrs.CustomColors.length !== 2) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_CUSTOM_COLORS_INVALID", "Application layout template must preserve the two reference CustomColors entries."));
  }
  if (!Array.isArray(attrs.CustomFonts) || attrs.CustomFonts.length !== 2) {
    findings.push(error("APPLICATION_LAYOUT_TEMPLATE_CUSTOM_FONTS_INVALID", "Application layout template must preserve the two reference CustomFonts entries."));
  }
}

function validateDecodedPackage(decoded, template, findings) {
  if (!isObject(template)) return;
  const layoutView = parseLayoutView(decoded?.ListSet?.LayoutView, findings);
  if (!layoutView) return;
  const expected = template.requiredLayoutView || {};
  if (Number(layoutView.sortVer) !== Number(expected.sortVer)) {
    findings.push(error("APPLICATION_LAYOUT_SORTVER_INVALID", "Generated ListSet.LayoutView.sortVer must match the application layout template.", { expected: expected.sortVer ?? null, actual: layoutView.sortVer ?? null }));
  }
  const expectedAttrs = expected.attrs || {};
  const actualAttrs = layoutView.attrs || {};
  if (!deepEqual(actualAttrs.appearance, expectedAttrs.appearance)) {
    findings.push(error("APPLICATION_LAYOUT_APPEARANCE_MISMATCH", "Generated ListSet.LayoutView.attrs.appearance must match the application layout template.", { expected: expectedAttrs.appearance || null, actual: actualAttrs.appearance || null }));
  }
  if (!deepEqual(actualAttrs["navigator-menu"], expectedAttrs["navigator-menu"])) {
    findings.push(error("APPLICATION_LAYOUT_NAVIGATOR_MENU_MISMATCH", "Generated ListSet.LayoutView.attrs.navigator-menu must match the application layout template.", { expected: expectedAttrs["navigator-menu"] || null, actual: actualAttrs["navigator-menu"] || null }));
  }
  if (!deepEqual(actualAttrs.CustomColors, expectedAttrs.CustomColors)) {
    findings.push(error("APPLICATION_LAYOUT_CUSTOM_COLORS_MISMATCH", "Generated ListSet.LayoutView.attrs.CustomColors must match the application layout template."));
  }
  if (!deepEqual(actualAttrs.CustomFonts, expectedAttrs.CustomFonts)) {
    findings.push(error("APPLICATION_LAYOUT_CUSTOM_FONTS_MISMATCH", "Generated ListSet.LayoutView.attrs.CustomFonts must match the application layout template."));
  }
  const sort = asArray(layoutView.sort);
  if (!sort.length) {
    findings.push(error("APPLICATION_LAYOUT_NAVIGATION_SORT_MISSING", "Generated ListSet.LayoutView.sort must include visible navigation groups/items."));
    return;
  }
  validateNavigationIcons(sort, template, findings);
}

function parseLayoutView(value, findings) {
  if (typeof value !== "string" || !value.trim()) {
    findings.push(error("APPLICATION_LAYOUT_ROOT_LAYOUTVIEW_MISSING", "Generated package must include decoded.ListSet.LayoutView as a stringified JSON object."));
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    findings.push(error("APPLICATION_LAYOUT_ROOT_LAYOUTVIEW_JSON_INVALID", `decoded.ListSet.LayoutView must parse as JSON: ${err.message}`));
    return null;
  }
}

function validateNavigationIcons(sort, template, findings) {
  const pattern = new RegExp(String(template.navigationIconRules?.fontAwesomeClassPattern || "^fa-(solid|regular|light|duotone|brands)\\s+fa-[a-z0-9-]+$"), "i");
  const visit = (item, pathParts) => {
    if (!isObject(item)) return;
    if (item.IsHidden === true) return;
    const type = String(item.Type || "");
    const isVisibleBusinessGroup = type === "classes";
    const isVisibleBusinessItem = ["1", "103", "105", "106"].includes(type);
    if (isVisibleBusinessGroup || isVisibleBusinessItem) {
      const icon = String(item.Icon || "").trim();
      if (!icon) {
        findings.push(error("APPLICATION_LAYOUT_NAV_ICON_MISSING", "Visible business navigation groups/items must include FontAwesome icons.", { path: pathParts.join("."), title: item.Title || null, type }));
      } else if (!pattern.test(icon)) {
        findings.push(error("APPLICATION_LAYOUT_NAV_ICON_NOT_FONTAWESOME", "Visible business navigation groups/items must use FontAwesome icon classes.", { path: pathParts.join("."), title: item.Title || null, type, icon }));
      }
    }
    asArray(item.list).forEach((child, index) => visit(child, pathParts.concat(["list", String(index)])));
  };
  sort.forEach((item, index) => visit(item, ["sort", String(index)]));
}

function readDecodedPackage(packagePath, findings) {
  if (!fs.existsSync(packagePath)) {
    findings.push(error("APPLICATION_LAYOUT_PACKAGE_MISSING", "Package file is missing.", { package: packagePath }));
    return null;
  }
  try {
    const raw = fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "");
    const wrapper = JSON.parse(raw);
    if (!wrapper?.Resource) {
      findings.push(error("APPLICATION_LAYOUT_PACKAGE_RESOURCE_MISSING", "YAPK wrapper must include Resource."));
      return null;
    }
    return JSON.parse(tolerantBrotliDecode(Buffer.from(String(wrapper.Resource), "base64")));
  } catch (err) {
    findings.push(error("APPLICATION_LAYOUT_PACKAGE_DECODE_FAILED", `Could not decode package Resource: ${err.message}`, { package: packagePath }));
    return null;
  }
}

function tolerantBrotliDecode(bytes) {
  const script = [
    "const zlib=require('zlib');",
    "const chunks=[];",
    "const s=zlib.createBrotliDecompress();",
    "s.on('data',c=>chunks.push(c));",
    "s.on('error',()=>process.stdout.write(Buffer.concat(chunks).toString('base64')));",
    "s.on('end',()=>process.stdout.write(Buffer.concat(chunks).toString('base64')));",
    "s.end(Buffer.from(process.argv[1],'base64'));",
  ].join("");
  const result = spawnSync(process.execPath, ["-e", script, bytes.toString("base64")], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0 && !result.stdout) throw new Error(result.stderr || `Brotli helper exited ${result.status}`);
  const decoded = Buffer.from(result.stdout, "base64").toString("utf8");
  if (!decoded.trim()) throw new Error("decoded Resource was empty");
  return decoded;
}

function readJson(filePath, findings, code) {
  if (!fs.existsSync(filePath)) {
    findings.push(error(code, "JSON file is missing.", { path: filePath }));
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    findings.push(error(code, `JSON file could not be parsed: ${err.message}`, { path: filePath }));
    return null;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function error(code, message, details = {}) {
  return { level: "error", code, message, ...details };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") args.help = true;
    else if (value.startsWith("--")) {
      const key = value.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) args[key] = true;
      else {
        args[key] = next;
        index += 1;
      }
    }
  }
  return args;
}

function printUsage() {
  console.log([
    "Usage: node scripts/validate-application-layout-template.mjs [--registry] [--template <path>] [--package <file.yapk>] [--decoded <decoded.json>]",
    "",
    "Validates the application-layout-sidebar-workspace-1 golden reference and generated package LayoutView fidelity.",
  ].join("\n"));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
