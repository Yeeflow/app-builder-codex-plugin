import fs from "node:fs";
import zlib from "node:zlib";
import { asArray, isObject, parseJsonMaybe, quoteLargeJsonIntegers } from "./yapk-decode-utils.mjs";

export { asArray, isObject };

export function readJsonFile(file) {
  return JSON.parse(quoteLargeJsonIntegers(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
}

export function readPackageLike(file) {
  const parsed = readJsonFile(file);
  if (isObject(parsed) && typeof parsed.Resource === "string" && !parsed.Resource.startsWith("[______gizp______]")) {
    const decoded = JSON.parse(quoteLargeJsonIntegers(zlib.brotliDecompressSync(Buffer.from(parsed.Resource, "base64")).toString("utf8")));
    return { wrapper: parsed, decoded };
  }
  if (isObject(parsed) && typeof parsed.Resource === "string" && parsed.Resource.startsWith("[______gizp______]")) {
    const resource = JSON.parse(quoteLargeJsonIntegers(zlib.gunzipSync(Buffer.from(parsed.Resource.slice("[______gizp______]".length), "base64")).toString("utf8")));
    const decoded = typeof resource.Data === "string" ? JSON.parse(quoteLargeJsonIntegers(resource.Data)) : resource.Data || resource;
    return { wrapper: parsed, decoded };
  }
  if (isObject(parsed) && typeof parsed.Data === "string") return { wrapper: null, decoded: JSON.parse(quoteLargeJsonIntegers(parsed.Data)) };
  return { wrapper: null, decoded: parsed };
}

export function addFinding(findings, level, code, message, detail = {}) {
  findings.push({ level, code, message, ...redactDetail(detail) });
}

export function statusFromFindings(findings) {
  return findings.some((finding) => finding.level === "error") ? "fail" : "pass";
}

export function safePath(file) {
  return file ? file.split("/").slice(-3).join("/") : null;
}

export function scalar(value) {
  return value === undefined || value === null ? "" : String(value);
}

export function normalizePackage(decoded) {
  if (isObject(decoded) && isObject(decoded.ListSet)) {
    return {
      root: decoded.ListSet,
      pages: asArray(decoded.Pages),
      children: asArray(decoded.Childs).map((child) => ({
        list: child.List || child.ListModel || {},
        fields: asArray(child.Fields || child.Defs),
        layouts: asArray(child.Layouts),
        raw: child,
      })),
      raw: decoded,
    };
  }
  return {
    root: decoded?.Item?.ListModel || decoded?.ListSet || {},
    pages: asArray(decoded?.Item?.Layouts || decoded?.Pages),
    children: asArray(decoded?.Childs).map((child) => ({
      list: child.List || child.ListModel || {},
      fields: asArray(child.Fields || child.Defs),
      layouts: asArray(child.Layouts),
      raw: child,
    })),
    raw: decoded,
  };
}

export function collectFieldMaps(pkg) {
  const byListId = new Map();
  for (const child of pkg.children) {
    const listId = scalar(child.list.ListID);
    if (!listId) continue;
    const fields = new Map();
    for (const field of child.fields) {
      for (const key of [field.FieldName, field.InternalName, field.DisplayName, field.FieldID, field.Name]) {
        const value = scalar(key);
        if (value) fields.set(value, field);
      }
    }
    if (!fields.has("ListDataID")) {
      const listDataIdField = {
        FieldID: "ListDataID",
        ListID: listId,
        FieldName: "ListDataID",
        InternalName: "ListDataID",
        DisplayName: "Record ID",
        FieldType: "Text",
        Type: "text",
        Status: 0,
        IsSystem: true,
        IsIndex: true,
      };
      fields.set("ListDataID", listDataIdField);
      fields.set("Record ID", listDataIdField);
    }
    byListId.set(listId, { list: child.list, fields });
  }
  return byListId;
}

export function collectPages(pkg) {
  return pkg.pages.map((page, index) => ({
    index,
    title: scalar(page.Title || page.Name || page.title || `Page ${index + 1}`),
    layoutId: scalar(page.LayoutID || page.ID || page.id),
    reportIds: asArray(page.ReportIds || page.ReportIDs || page.reportIds).map(scalar),
    page,
    roots: extractLayoutResources(page),
  }));
}

export function extractLayoutResources(layout) {
  const resources = asArray(layout?.LayoutInResources);
  if (!resources.length && isObject(layout?.LayoutView)) return [layout.LayoutView];
  if (!resources.length && typeof layout?.LayoutView === "string" && layout.LayoutView.trim().startsWith("{")) {
    const parsed = parseJsonMaybe(layout.LayoutView);
    return isObject(parsed) ? [parsed] : [];
  }
  return resources
    .map((resource) => {
      const value = resource?.Resource ?? resource?.resource ?? resource;
      if (isObject(value)) return value;
      if (typeof value === "string") {
        const parsed = parseJsonMaybe(value);
        return isObject(parsed) ? parsed : null;
      }
      return null;
    })
    .filter(Boolean);
}

export function walkControls(control, visitor, pointer = "$", ancestors = []) {
  if (!isObject(control)) return;
  visitor(control, pointer, ancestors);
  for (const key of ["children", "columns", "controls", "items", "rows", "cells", "list", "content"]) {
    asArray(control[key]).forEach((child, index) => walkControls(child, visitor, `${pointer}.${key}[${index}]`, [...ancestors, control]));
  }
}

export function allControlsFromPages(pages) {
  const controls = [];
  for (const page of pages) {
    for (const root of page.roots) {
      walkControls(root, (control, pointer, ancestors) => controls.push({ page, control, pointer, ancestors }));
    }
  }
  return controls;
}

export function getControlText(control) {
  const attrs = control?.attrs || {};
  const candidates = [
    control.text,
    control.label,
    control.title,
    attrs.text,
    attrs.title,
    attrs.value,
    attrs.headc?.title?.value,
    attrs.heads?.text,
    attrs.heads?.title,
    attrs.caption?.title,
    attrs.content,
  ];
  return candidates.map(scalar).filter(Boolean).join(" ");
}

export function isSummaryControl(control) {
  const type = scalar(control?.type || control?.Type).toLowerCase();
  return type === "summary" || type === "summary-card" || type === "summary_control" || type === "report-summary";
}

export function looksNumericField(field) {
  const combined = [field?.FieldType, field?.Type, field?.Category, field?.DataType].map(scalar).join(" ").toLowerCase();
  return /(decimal|number|currency|percent|integer|int|double|float|money|amount|rate)/.test(combined);
}

function redactDetail(detail) {
  const safe = {};
  for (const [key, value] of Object.entries(detail || {})) {
    if (/payload|resource|sign|token|secret|raw/i.test(key)) continue;
    if (typeof value === "string" && value.length > 120) safe[key] = `${value.slice(0, 117)}...`;
    else safe[key] = value;
  }
  return safe;
}
