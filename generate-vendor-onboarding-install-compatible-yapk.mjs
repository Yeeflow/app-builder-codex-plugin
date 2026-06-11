import fs from "node:fs";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./scripts/yeeflow-env-utils.mjs";

const APP_PACKAGE = ".tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.app-package-info.json";
const VERSION = process.env.VENDOR_ONBOARDING_YAPK_VERSION || "1.4-category-fixed";
const OUT = `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v${VERSION}.yapk`;
const REPORT = `.tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.v${VERSION}.report.json`;
const TITLE = "Vendor Onboarding & Compliance Management";
const DESCRIPTION = "Full-scope generated YAPK candidate for vendor onboarding, compliance review, document tracking, task management, dashboards, and print summary.";
const ICON_URL = "{\"b\":\"#E6F7FF\",\"i\":\"fa-regular fa-building-shield\",\"c\":\"#008DA6\"}";

function ensureBaseAppPackage() {
  const result = spawnSync(process.execPath, ["generate-vendor-onboarding-compliance-yapk.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      VENDOR_ONBOARDING_YAPK_OUTPUT: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-signed.yapk",
      VENDOR_ONBOARDING_YAPK_VERSION: "1.1",
    },
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Base generator failed: ${result.stderr || result.stdout}`);
}

async function apiText(url, apiKey, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      apiKey,
      ...(options.body ? { "Content-Type": "application/json-patch+json" } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${url} failed ${response.status}`);
  return text;
}

function brotliFlushLikeDotNet(input) {
  return new Promise((resolve, reject) => {
    const stream = zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.write(Buffer.from(input, "utf8"));
    stream.flush(zlib.constants.BROTLI_OPERATION_FLUSH, (error) => {
      if (error) reject(error);
      else resolve(Buffer.concat(chunks));
      stream.destroy();
    });
  });
}

function convertIdPropertyStringsToNumbers(jsonText) {
  const numericKeys = [
    "ListID",
    "ListSetID",
    "FieldID",
    "LayoutID",
    "RefId",
    "ID",
    "AppListSetID",
    "DefResourceID",
    "DeployedDefID",
    "FormID",
    "ProcModelID",
  ];
  let out = jsonText;
  for (const key of numericKeys) {
    out = out.replace(new RegExp(`"${key}":"(\\d{16,})"`, "g"), `"${key}":$1`);
  }
  return out;
}

function omitInstallRiskyGeneratedKeys(jsonText) {
  return jsonText
    .replace(/,"Created":"2026-05-29 09:30:00"/g, "")
    .replace(/,"Modified":"2026-05-29 09:30:00"/g, "")
    .replace(/,"CreatedBy":"0"/g, "")
    .replace(/,"ModifiedBy":"0"/g, "")
    .replace(/,"WorkspaceID":"0"/g, "")
    .replace(/,"ListType":(1|1024)/g, "")
    .replace(/,"Name":"([^"]*)"/g, "")
    .replace(/,"DisplayName_EN":null/g, "")
    .replace(/,"IsIndex":(true|false)/g, "")
    .replace(/,"IsFilter":(true|false)/g, "")
    .replace(/,"IsIndexCreated":false/g, "")
    .replace(/,"AppID":41/g, "");
}

function normalizeListModel(list, { root = false } = {}) {
  if (!list) return list;
  return {
    ListID: list.ListID,
    Title: list.Title,
    Description: list.Description || "",
    Status: list.Status ?? 1,
    IsItemPerm: true,
    IsVerRecord: false,
    HasComment: false,
    IconUrl: list.IconUrl || ICON_URL,
    TableCode: "flowcraft",
    Ext1: null,
    Ext2: null,
    Ext3: null,
    Type: list.Type,
    Flags: list.Flags ?? 1,
    LayoutView: list.LayoutView,
    Perms: root ? [] : null,
    AdvancePerms: root ? null : [],
    Items: list.Items ?? null,
  };
}

function normalizeField(field) {
  return {
    ListID: field.ListID,
    FieldID: field.FieldID,
    FieldName: field.FieldName,
    FieldType: field.FieldType,
    FieldIndex: field.FieldIndex,
    DisplayName: field.DisplayName,
    InternalName: field.InternalName,
    Type: field.Type,
    Status: field.Status ?? 1,
    Category: normalizeFieldCategory(field.Category),
    DefaultValue: field.DefaultValue ?? "",
    Rules: field.Rules ?? null,
    IsSort: field.IsSort ?? false,
    IsSystem: field.IsSystem ?? false,
    IsUnique: field.IsUnique ?? false,
    Ext1: field.Ext1 ?? null,
    Ext2: field.Ext2 ?? null,
    Ext3: field.Ext3 ?? null,
  };
}

function normalizeFieldCategory(value) {
  if (Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  if (value === undefined || value === null || value === "" || value === "List") return 0;
  throw new Error(`Field.Category must be an integer; got ${Array.isArray(value) ? "array" : typeof value}.`);
}

function normalizeLayout(layout, fallbackTitle) {
  return {
    ListID: layout.ListID,
    LayoutID: layout.LayoutID,
    Title: layout.Title || fallbackTitle,
    Ext1: layout.Ext1 ?? null,
    Ext2: layout.Ext2 ?? null,
    Ext3: layout.Ext3 ?? null,
    Type: layout.Type,
    IsDefault: layout.IsDefault ?? false,
    IsItemPerm: layout.IsItemPerm ?? false,
    LayoutView: layout.LayoutView,
    LayoutInResources: layout.LayoutInResources ?? [],
    Perms: layout.Perms ?? null,
  };
}

function normalizeExportLikeAppPackage(app) {
  app.ListSet = normalizeListModel(app.ListSet, { root: true });
  app.Pages = (app.Pages || []).map((page, index) => normalizeLayout(page, `Dashboard Page ${index + 1}`));
  for (const child of app.Childs || []) {
    child.List = normalizeListModel(child.List);
    child.Fields = (child.Fields || []).map(normalizeField);
    child.Layouts = (child.Layouts || []).map((layout, index) => normalizeLayout(layout, `${child.List?.Title || "Data List"} Layout ${index + 1}`));
  }
  return app;
}

function tolerantDecodeResource(resource) {
  return new Promise((resolve) => {
    const stream = zlib.createBrotliDecompress();
    const chunks = [];
    let errorCode = "";
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (error) => {
      errorCode = error.code || error.name;
    });
    stream.on("close", () => resolve({ text: Buffer.concat(chunks).toString("utf8"), errorCode }));
    stream.end(Buffer.from(resource, "base64"));
  });
}

async function main() {
  loadDotenvFile(fs, ".env.local");
  const env = resolveYeeflowEnvironment(process.env);
  if (!env.apiKey) throw new Error("YEEFLOW_API_KEY is required.");
  if (env.apiBaseUrl !== "https://api.yeeflow.com/v1") throw new Error(`Unexpected API base URL: ${env.apiBaseUrl}`);

  ensureBaseAppPackage();

  const normalizedApp = normalizeExportLikeAppPackage(JSON.parse(fs.readFileSync(APP_PACKAGE, "utf8")));
  let appText = JSON.stringify(normalizedApp);
  const originalIds = Array.from(new Set(appText.match(/\b\d{16,}\b/g) || []));
  const generated = JSON.parse(await apiText(`${env.apiBaseUrl}/utils/generate/ids?count=${originalIds.length + 1}`, env.apiKey)).map(String);
  const idMap = new Map(originalIds.map((id, index) => [id, generated[index]]));
  appText = appText.replace(/\b\d{16,}\b/g, (id) => idMap.get(id) || id);
  appText = omitInstallRiskyGeneratedKeys(appText);
  appText = convertIdPropertyStringsToNumbers(appText);

  const rootListId = idMap.get("7601000000000000000");
  if (!rootListId) throw new Error("Root ID remap missing.");

  const resourceBytes = await brotliFlushLikeDotNet(appText);
  const resource = resourceBytes.toString("base64");
  const unsigned = {
    PackageId: generated[originalIds.length],
    TenantID: env.tenantId || "0",
    AppID: 41,
    ListID: rootListId,
    Title: TITLE,
    Description: DESCRIPTION,
    IconUrl: ICON_URL,
    Resource: resource,
    Notes: "Install-compatibility V1.3 candidate: API-issued IDs, export-like list/layout metadata, text-level remap, Yeeflow-style Brotli flush encoding, server-signed and verified. Manual runtime import proof is required.",
    Author: "Yeeflow App Builder",
    Date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Version: VERSION,
  };

  const signText = await apiText(`${env.apiBaseUrl}/utils/apppackage/setsign`, env.apiKey, { method: "POST", body: JSON.stringify(unsigned) });
  const signJson = (() => {
    try {
      return JSON.parse(signText);
    } catch {
      return signText;
    }
  })();
  const sign = signJson?.Data ?? signJson?.data ?? signJson?.Sign ?? signJson?.sign ?? (typeof signJson === "string" ? signJson.trim() : null);
  if (typeof sign !== "string" || Buffer.from(sign, "base64").length !== 32) throw new Error("setsign did not return a 32-byte signature.");

  const signed = { ...unsigned, Sign: sign };
  await apiText(`${env.apiBaseUrl}/utils/apppackage/verifysign`, env.apiKey, { method: "POST", body: JSON.stringify(signed) });
  fs.writeFileSync(OUT, `\uFEFF${JSON.stringify(signed)}`, "utf8");

  const decoded = await tolerantDecodeResource(resource);
  const parsed = JSON.parse(decoded.text);
  fs.writeFileSync(REPORT, `${JSON.stringify({
    status: "generated",
    output: OUT,
    source: "/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-signed.yapk",
    version: signed.Version,
    remappedLargeIdCount: originalIds.length,
    appIdType: typeof signed.AppID,
    hasBom: true,
    rootListIdChanged: rootListId !== "7601000000000000000",
    resource: {
      bytes: resourceBytes.length,
      encoding: "Brotli flush-before-dispose compatible",
      syncDecodeExpected: "Z_BUF_ERROR",
      tolerantDecodeError: decoded.errorCode || null,
      tolerantParsed: true,
    },
    counts: {
      pages: parsed.Pages?.length || 0,
      forms: parsed.Forms?.length || 0,
      childs: parsed.Childs?.length || 0,
      fields: (parsed.Childs || []).reduce((total, child) => total + (child.Fields?.length || 0), 0),
      layouts: (parsed.Pages?.length || 0) + (parsed.Childs || []).reduce((total, child) => total + (child.Layouts?.length || 0), 0),
    },
    verification: { setsign: "passed", verifysign: "passed", signBytes: Buffer.from(sign, "base64").length },
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    output: OUT,
    report: REPORT,
    version: signed.Version,
    remappedLargeIdCount: originalIds.length,
    appIdType: typeof signed.AppID,
    resourceBytes: resourceBytes.length,
    signBytes: Buffer.from(sign, "base64").length,
    verified: true,
    tolerantDecodeError: decoded.errorCode || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "fail", error: error.message }, null, 2));
  process.exit(1);
});
