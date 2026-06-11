import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const SOURCE_EXPORT = process.argv[2] || "/Users/Renger/Downloads/Document Library Sample.yap";
const OUT_RESOURCE = "document-library-runtime-baseline.v4.resource.json";
const OUT_APP_DEF = "document-library-runtime-baseline.v4.app-def.json";
const OUT_YAP = "document-library-runtime-baseline.v4.yap";
const OUT_REPORT = "document-library-runtime-baseline.v4.generation-report.json";
const TITLE = "Document Library Runtime Baseline - Codex v4";
const DESCRIPTION = "Minimal generated Yeeflow app based on the runtime-proven New Document Library sample shape. Contains no uploaded document rows.";
const GENERATED_AT = "2026-05-18 18:05:00";
const ID_BASE = 2063000000001000000n;

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
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeYap(filePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(filePath, "utf8"), largeNumbers);
  if (!wrapper.Resource || !wrapper.Resource.startsWith(GZIP_PREFIX)) throw new Error("Unsupported .yap Resource wrapper");
  const resource = parseJson(zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"), largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function parseMaybeJson(value, fallback) {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function collectIds(value, ids = new Set(), key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return ids;
  if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) ids.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectIds(item, ids));
  else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, child]) => collectIds(child, ids, childKey));
  return ids;
}

function remapValue(value, idMap, key = "") {
  if (["TenantID", "CreatedBy", "ModifiedBy"].includes(key)) return value;
  if (typeof value === "string") {
    let out = value;
    for (const [oldId, newId] of idMap.entries()) out = out.split(oldId).join(newId);
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => remapValue(item, idMap));
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [childKey, child] of Object.entries(value)) out[remapValue(childKey, idMap)] = remapValue(child, idMap, childKey);
  return out;
}

function nextGeneratedId(offset) {
  return String(ID_BASE + BigInt(offset));
}

const decoded = decodeYap(SOURCE_EXPORT);
const sourceData = decoded.data;
const sourceRoot = sourceData.Item;
const sourceLibrary = sourceData.Childs.find((child) => {
  const title = String(child.ListModel && child.ListModel.Title || "").toLowerCase();
  return Number(child.ListModel && child.ListModel.Type) === 16 && title.includes("new document");
}) || sourceData.Childs.find((child) => Number(child.ListModel && child.ListModel.Type) === 16);
if (!sourceLibrary) throw new Error("Document library resource was not found in source export");

const data = {
  Item: clone(sourceRoot),
  Childs: [clone(sourceLibrary)],
  Forms: [],
  OtherModules: [],
  FormReports: [],
  DataReports: [],
  FormNewReports: [],
  AppGroups: [],
  AppThemes: [],
  AppTags: [],
  AppMetadatas: [],
  AppComponents: [],
  PortalInfo: null,
};

const idMap = new Map();
const sourceIds = [...collectIds(data)].sort();
sourceIds.forEach((oldId, index) => idMap.set(oldId, nextGeneratedId(index)));
const remappedData = remapValue(data, idMap);

const rootId = idMap.get(String(sourceRoot.ListModel.ListID));
const libraryId = idMap.get(String(sourceLibrary.ListModel.ListID));

const rootModel = remappedData.Item.ListModel;
rootModel.ListID = rootId;
rootModel.Title = TITLE;
rootModel.Description = DESCRIPTION;
rootModel.CustomType = "";
rootModel.IconUrl = "{\"b\":\"#2d7ff9\",\"i\":\"*text*\",\"c\":\"#fff\"}";
rootModel.Created = GENERATED_AT;
rootModel.Modified = GENERATED_AT;
rootModel.LayoutView = JSON.stringify({ sortVer: 1 });
remappedData.Item.Layouts = [];

const library = remappedData.Childs[0];
library.ListModel.ListID = libraryId;
library.ListModel.Title = "New Document Library";
library.ListModel.Description = null;
library.ListModel.CustomType = `ListSite_${rootId}`;
library.ListModel.Created = GENERATED_AT;
library.ListModel.Modified = GENERATED_AT;
library.ListModel.LayoutView = null;
library.Defs.forEach((field) => {
  field.ListID = libraryId;
  field.Created = GENERATED_AT;
  field.Modified = GENERATED_AT;
});
library.Layouts.forEach((layout) => {
  layout.ListID = libraryId;
  layout.Created = GENERATED_AT;
  layout.Modified = GENERATED_AT;
  if (Number(layout.Type) === 0) {
    layout.Title = "";
  }
  if (Number(layout.Type) === 1) {
    layout.Title = "New file";
  }
});
library.ListDatas = {};

const resource = {
  ...clone(decoded.resource),
  MainListType: 1024,
  AppID: 41,
  ReportIds: [],
  FormKeys: [],
  SimplePortal: null,
  ReplaceIds: [...collectIds(remappedData)].filter((id) => id.startsWith(String(ID_BASE).slice(0, 4))).sort(),
  Data: JSON.stringify(remappedData),
};

fs.writeFileSync(OUT_APP_DEF, `${JSON.stringify(remappedData, null, 2)}\n`);
fs.writeFileSync(OUT_RESOURCE, `${JSON.stringify(resource, null, 2)}\n`);

const buildOutput = execFileSync("node", [
  "build-yap-wrapper.js",
  OUT_RESOURCE,
  OUT_YAP,
  "--title",
  TITLE,
  "--description",
  DESCRIPTION,
], { encoding: "utf8" });

const report = {
  status: "pass",
  source: SOURCE_EXPORT,
  strategy: "clone-minimal-document-library-sample-shape",
  outputs: { resource: OUT_RESOURCE, appDef: OUT_APP_DEF, yap: OUT_YAP },
  rootId,
  libraryId,
  generatedIdFamily: String(ID_BASE).slice(0, 4),
  documentLibrary: {
    title: library.ListModel.Title,
    type: library.ListModel.Type,
    fieldNames: library.Defs.map((field) => field.FieldName),
    layouts: library.Layouts.map((layout) => ({ title: layout.Title || null, type: layout.Type, layoutId: layout.LayoutID, layoutView: layout.LayoutView })),
    containsUploadedRows: Object.keys(library.ListDatas || {}).length > 0,
  },
  build: JSON.parse(buildOutput),
};
fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
