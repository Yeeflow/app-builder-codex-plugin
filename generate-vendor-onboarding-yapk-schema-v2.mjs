#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { runYapkFirstGenerationPreflight } from "./scripts/yapk-first-generation-preflight.mjs";
import { fetchYeeflowUniqueIds, loadYeeflowApiEnvironment, summarizeIds } from "./scripts/yeeflow-id-api-utils.mjs";

const GZIP_PREFIX = "[______gizp______]";
const SOURCE_YAP = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.12-current-dashboard-data-table-fields-fixed.yap";
const OUTPUT_YAPK = "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.15-yapk-portalinfo-null.yapk";
const REPORT = ".tmp/vendor-onboarding-compliance-management/vendor-onboarding-yapk-v1.15-portalinfo-null-report.json";
const TITLE = "Vendor Onboarding & Compliance Management";
const DESCRIPTION = "Generated Yeeflow application package from the approved Vendor Onboarding UI implementation spec.";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";
const VERSION = "1.15-yapk-portalinfo-null";
const APP_ID = 41;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function quoteLargeIntegers(jsonText) {
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
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text) {
  return JSON.parse(quoteLargeIntegers(text));
}

function stringifyWithRawIntegerIds(value) {
  const integerKeys = ["ListID", "FieldID", "ID", "RefId"];
  let text = JSON.stringify(value);
  for (const key of integerKeys) {
    text = text.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  }
  return text;
}

function readProvenYapApp() {
  const wrapper = JSON.parse(fs.readFileSync(SOURCE_YAP, "utf8").replace(/^\uFEFF/, ""));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error("Source YAP Resource is not a gzip-prefixed YAP Resource.");
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const listExportResult = parseJsonPreservingLargeInts(resourceText);
  if (listExportResult.AppID !== APP_ID) throw new Error(`Source YAP AppID must be fixed at ${APP_ID}.`);
  const dataText = typeof listExportResult.Data === "string" ? listExportResult.Data : JSON.stringify(listExportResult.Data);
  const listExportInfo = parseJsonPreservingLargeInts(dataText);
  return { wrapper, listExportResult, listExportInfo };
}

function stringOrEmpty(value) {
  return value === undefined || value === null ? "" : String(value);
}

function intOrDefault(value, fallback = 0) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value) && !LARGE_INTEGER_RE.test(value)) return Number.parseInt(value, 10);
  return fallback;
}

function normalizeListInfo(model, { root = false } = {}) {
  if (!model) throw new Error("Missing list model.");
  return {
    ListID: stringOrEmpty(model.ListID),
    Title: stringOrEmpty(model.Title || TITLE),
    Description: stringOrEmpty(model.Description),
    Status: intOrDefault(model.Status, 1),
    IsItemPerm: Boolean(model.IsItemPerm),
    IsVerRecord: Boolean(model.IsVerRecord),
    HasComment: Boolean(model.HasComment),
    IconUrl: stringOrEmpty(model.IconUrl || ICON_URL),
    TableCode: stringOrEmpty(model.TableCode || "flowcraft"),
    Ext1: stringOrEmpty(model.Ext1),
    Ext2: stringOrEmpty(model.Ext2),
    Ext3: stringOrEmpty(model.Ext3),
    Type: intOrDefault(model.Type, root ? 1024 : 1),
    Flags: intOrDefault(model.Flags, 1),
    LayoutView: stringOrEmpty(model.LayoutView),
    Perms: Array.isArray(model.Perms) ? model.Perms : [],
    AdvancePerms: Array.isArray(model.AdvancePerms) ? model.AdvancePerms : [],
    Items: model.Items && typeof model.Items === "object" && !Array.isArray(model.Items) ? model.Items : {},
  };
}

function normalizeField(field) {
  const category = field.Category;
  let normalizedCategory = 0;
  if (Number.isInteger(category)) normalizedCategory = category;
  else if (typeof category === "string" && /^-?\d+$/.test(category.trim())) normalizedCategory = Number.parseInt(category, 10);
  else if (category !== undefined && category !== null && category !== "") throw new Error(`Field.Category must be integer-compatible for ${field.DisplayName || field.FieldName}.`);
  return {
    FieldID: stringOrEmpty(field.FieldID),
    ListID: stringOrEmpty(field.ListID),
    FieldName: stringOrEmpty(field.FieldName),
    FieldType: stringOrEmpty(field.FieldType || "Text"),
    FieldIndex: intOrDefault(field.FieldIndex, 0),
    DisplayName: stringOrEmpty(field.DisplayName || field.FieldName),
    InternalName: stringOrEmpty(field.InternalName || field.FieldName).replace(/[^A-Za-z0-9_]/g, "") || stringOrEmpty(field.FieldName),
    Type: stringOrEmpty(field.Type || "input"),
    Status: intOrDefault(field.Status, 1),
    Category: normalizedCategory,
    DefaultValue: field.DefaultValue === undefined || field.DefaultValue === null ? "" : field.DefaultValue,
    Rules: field.Rules === undefined || field.Rules === null ? "{}" : stringOrEmpty(field.Rules),
    IsSort: Boolean(field.IsSort),
    IsSystem: Boolean(field.IsSystem),
    IsUnique: Boolean(field.IsUnique),
    Ext1: field.Ext1 === undefined || field.Ext1 === null ? "" : stringOrEmpty(field.Ext1),
    Ext2: field.Ext2 === undefined || field.Ext2 === null ? "" : stringOrEmpty(field.Ext2),
    Ext3: field.Ext3 === undefined || field.Ext3 === null ? "" : stringOrEmpty(field.Ext3),
  };
}

function normalizeLayout(layout, fallbackTitle) {
  if (!layout) throw new Error(`Missing layout for ${fallbackTitle}.`);
  return {
    ListID: stringOrEmpty(layout.ListID),
    LayoutID: stringOrEmpty(layout.LayoutID),
    Type: intOrDefault(layout.Type, 0),
    Title: stringOrEmpty(layout.Title || fallbackTitle),
    LayoutView: stringOrEmpty(layout.LayoutView),
    Ext1: stringOrEmpty(layout.Ext1),
    Ext2: stringOrEmpty(layout.Ext2),
    Ext3: stringOrEmpty(layout.Ext3),
    IsDefault: Boolean(layout.IsDefault),
    IsItemPerm: Boolean(layout.IsItemPerm),
    Perms: Array.isArray(layout.Perms) ? layout.Perms : [],
    LayoutInResources: (Array.isArray(layout.LayoutInResources) ? layout.LayoutInResources : []).map((resource) => ({
      ID: stringOrEmpty(resource.ID),
      RefId: stringOrEmpty(resource.RefId),
      Resource: stringOrEmpty(resource.Resource),
    })),
  };
}

function buildAppPackageInfo(listExportInfo) {
  const root = listExportInfo.Item;
  const pages = (root.Layouts || []).map((layout, index) => normalizeLayout(layout, index === 0 ? "Home" : `Page ${index + 1}`));
  const childs = (listExportInfo.Childs || []).map((child) => ({
    List: normalizeListInfo(child.ListModel),
    Fields: (child.Defs || []).map(normalizeField),
    Layouts: (child.Layouts || []).map((layout, index) => normalizeLayout(layout, `${child.ListModel?.Title || "List"} Layout ${index + 1}`)),
    RemindRules: Array.isArray(child.RemindRules) ? child.RemindRules : [],
    PublicForms: Array.isArray(child.PublicForms) ? child.PublicForms : [],
    FlowMappings: Array.isArray(child.FlowMappings) ? child.FlowMappings : [],
  }));
  return {
    ListSet: normalizeListInfo(root.ListModel, { root: true }),
    Pages: pages,
    Forms: [],
    FormReports: [],
    FormNewReports: [],
    DataReports: [],
    Groups: [],
    Tags: [],
    Metadatas: [],
    Agents: [],
    Connections: [],
    Knowledges: [],
    Themes: [],
    Components: [],
    PortalInfo: null,
    Childs: childs,
  };
}

function safeParseSignResponse(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return parsed?.Data ?? parsed?.data ?? parsed?.Sign ?? parsed?.sign ?? (typeof parsed === "string" ? parsed.trim() : "");
}

async function postJson(url, apiKey, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apiKey,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${new URL(url).pathname} failed with HTTP ${response.status}.`);
  return { status: response.status, text };
}

function utcNowNoMillis() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function main() {
  fs.mkdirSync(".tmp/vendor-onboarding-compliance-management", { recursive: true });
  const env = loadYeeflowApiEnvironment(".env.local");
  if (env.apiBaseUrl !== "https://api.yeeflow.com/v1") throw new Error(`Unexpected API base URL: ${env.apiBaseUrl}`);

  const { listExportInfo } = readProvenYapApp();
  const appPackageInfo = buildAppPackageInfo(listExportInfo);
  const appPackageText = stringifyWithRawIntegerIds(appPackageInfo);
  const resource = zlib.brotliCompressSync(Buffer.from(appPackageText, "utf8")).toString("base64");
  const packageIds = await fetchYeeflowUniqueIds({ apiBaseUrl: env.apiBaseUrl, apiKey: env.apiKey, count: 1 });
  const rootListId = String(appPackageInfo.ListSet.ListID);
  const unsigned = {
    PackageId: packageIds[0],
    TenantID: env.tenantId || "0",
    AppID: APP_ID,
    ListID: rootListId,
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    Resource: resource,
    Notes: "Server-signed YAPK schema v2 candidate generated from the v1.12 import-proven Vendor Onboarding YAP content, with no-portal PortalInfo emitted as null. Manual runtime import proof is required.",
    Author: "Yeeflow App Builder",
    Date: utcNowNoMillis(),
    Version: VERSION,
  };

  const preflightPackage = {
    ...unsigned,
    Sign: Buffer.alloc(32).toString("base64"),
  };
  const preflightDir = fs.mkdtempSync(path.join(os.tmpdir(), "yapk-first-generation-preflight-"));
  const preflightPath = path.join(preflightDir, "pre-sign-preflight.yapk");
  try {
    fs.writeFileSync(preflightPath, `${JSON.stringify(preflightPackage)}\n`);
    const preflight = runYapkFirstGenerationPreflight(preflightPath);
    if (!preflight.ok) {
      throw new Error(`YAPK first-generation preflight failed at ${preflight.failedGate}: ${JSON.stringify(preflight.gates)}`);
    }
  } finally {
    fs.rmSync(preflightDir, { recursive: true, force: true });
  }

  const signResponse = await postJson(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.apiKey, unsigned);
  const sign = safeParseSignResponse(signResponse.text);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign did not return a 32-byte signature.");
  const signed = { ...unsigned, Sign: sign };
  const verifyResponse = await postJson(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.apiKey, signed);
  fs.writeFileSync(OUTPUT_YAPK, `\uFEFF${JSON.stringify(signed)}`, "utf8");

  const report = {
    status: "generated",
    output: OUTPUT_YAPK,
    sourceYap: SOURCE_YAP,
    version: VERSION,
    schema: "schemas/yapk-schema.json",
    apiIds: summarizeIds(packageIds),
    wrapper: {
      appId: signed.AppID,
      packageIdSource: "generate-unique-ids API",
      rootListId,
      tenantIdPresent: Boolean(env.tenantId),
      signBytes: Buffer.from(sign, "base64").length,
      verifysignStatus: verifyResponse.status,
    },
    resource: {
      encoding: "base64(Brotli(JSON.stringify(AppPackageInfo)))",
      decodedShape: "AppPackageInfo",
      portalInfoShape: "null",
      decodedTextBytes: Buffer.byteLength(appPackageText),
      brotliBytes: Buffer.from(resource, "base64").length,
    },
    counts: {
      pages: appPackageInfo.Pages.length,
      childs: appPackageInfo.Childs.length,
      fields: appPackageInfo.Childs.reduce((sum, child) => sum + child.Fields.length, 0),
      layouts: appPackageInfo.Pages.length + appPackageInfo.Childs.reduce((sum, child) => sum + child.Layouts.length, 0),
    },
  };
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    output: OUTPUT_YAPK,
    report: REPORT,
    schema: report.schema,
    version: VERSION,
    apiIds: report.apiIds,
    signBytes: report.wrapper.signBytes,
    verifysignStatus: report.wrapper.verifysignStatus,
    counts: report.counts,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
