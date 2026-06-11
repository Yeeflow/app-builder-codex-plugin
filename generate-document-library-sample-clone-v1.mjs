import fs from "node:fs";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const args = process.argv.slice(2);
const ONLY_NEW_LIBRARY = args.includes("--only-new-document-library");
const SOURCE_EXPORT = args.find((arg) => !arg.startsWith("--")) || "/Users/Renger/Downloads/Document Library Sample.yap";
const OUT_PREFIX = ONLY_NEW_LIBRARY ? "document-library-sample-new-library-only.v1" : "document-library-sample-clone.v1";
const OUT_RESOURCE = `${OUT_PREFIX}.resource.json`;
const OUT_APP_DEF = `${OUT_PREFIX}.app-def.json`;
const OUT_YAP = `${OUT_PREFIX}.yap`;
const OUT_REPORT = `${OUT_PREFIX}.generation-report.json`;
const TITLE = ONLY_NEW_LIBRARY ? "Document Library Sample - New Library Only - Codex v1" : "Document Library Sample Clone - Codex v1";
const DESCRIPTION = ONLY_NEW_LIBRARY
  ? "Fresh-ID clone of the New Document Library resource from the Document Library Sample export, with uploaded/list data removed."
  : "Fresh-ID clone of the two-library Document Library Sample export, with uploaded/list data removed.";
const GENERATED_AT = "2026-05-18 19:20:00";
const ID_BASE = ONLY_NEW_LIBRARY ? 2062000000001000000n : 2061000000001000000n;

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

function collectLocalIds(data) {
  const ids = new Set();
  const add = (value) => {
    if (typeof value === "string" && LARGE_INTEGER_RE.test(value)) ids.add(value);
  };

  add(data.Item?.ListModel?.ListID);
  for (const layout of data.Item?.Layouts || []) add(layout.LayoutID);
  for (const child of data.Childs || []) {
    add(child.ListModel?.ListID);
    for (const layout of child.Layouts || []) add(layout.LayoutID);
    for (const field of child.Defs || []) add(field.FieldID);
    for (const rowId of Object.keys(child.ListDatas || {})) add(rowId);
  }
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
  for (const [childKey, child] of Object.entries(value)) out[childKey] = remapValue(child, idMap, childKey);
  return out;
}

function nextGeneratedId(offset) {
  return String(ID_BASE + BigInt(offset));
}

const decoded = decodeYap(SOURCE_EXPORT);
const sourceData = decoded.data;
const sourceDocumentLibraries = (sourceData.Childs || []).filter((child) => Number(child.ListModel?.Type) === 16);
if (sourceDocumentLibraries.length !== 2) {
  throw new Error(`Expected exactly two document libraries in sample export, found ${sourceDocumentLibraries.length}`);
}
const documentLibraries = ONLY_NEW_LIBRARY
  ? sourceDocumentLibraries.filter((child) => child.ListModel?.Title === "New Document Library")
  : sourceDocumentLibraries;
if (ONLY_NEW_LIBRARY && documentLibraries.length !== 1) {
  throw new Error("Expected exactly one New Document Library resource in sample export");
}

const data = {
  Item: clone(sourceData.Item),
  Childs: documentLibraries.map((child) => clone(child)),
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

for (const child of data.Childs) child.ListDatas = {};

const idMap = new Map();
const localIds = [...collectLocalIds(data)].sort();
localIds.forEach((oldId, index) => idMap.set(oldId, nextGeneratedId(index)));
const remappedData = remapValue(data, idMap);

const rootId = idMap.get(String(sourceData.Item.ListModel.ListID));
const rootModel = remappedData.Item.ListModel;
rootModel.ListID = rootId;
rootModel.Title = TITLE;
rootModel.Description = DESCRIPTION;
rootModel.Created = GENERATED_AT;
rootModel.Modified = GENERATED_AT;
rootModel.IconUrl = "{\"b\":\"#2d7ff9\",\"i\":\"*text*\",\"c\":\"#fff\"}";
rootModel.LayoutView = JSON.stringify({ sortVer: 1 });
remappedData.Item.Layouts = [];

for (const child of remappedData.Childs) {
  child.ListModel.CustomType = `ListSite_${rootId}`;
  child.ListModel.Created = GENERATED_AT;
  child.ListModel.Modified = GENERATED_AT;
  for (const field of child.Defs || []) {
    field.ListID = child.ListModel.ListID;
    field.Created = GENERATED_AT;
    field.Modified = GENERATED_AT;
  }
  for (const layout of child.Layouts || []) {
    layout.ListID = child.ListModel.ListID;
    layout.Created = GENERATED_AT;
    layout.Modified = GENERATED_AT;
  }
}

const resource = {
  ...clone(decoded.resource),
  MainListType: 1024,
  AppID: 41,
  ReportIds: [],
  FormKeys: [],
  SimplePortal: null,
  ReplaceIds: [...idMap.values()].sort(),
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
  "--validation-mode",
  "compatibility",
], { encoding: "utf8" });

const report = {
  status: "pass",
  source: SOURCE_EXPORT,
  strategy: ONLY_NEW_LIBRARY
    ? "fresh-id-new-document-library-only-sample-clone-with-list-data-removed"
    : "fresh-id-two-library-sample-clone-with-list-data-removed",
  outputs: { resource: OUT_RESOURCE, appDef: OUT_APP_DEF, yap: OUT_YAP },
  rootId,
  generatedIdFamily: String(ID_BASE).slice(0, 4),
  localIdsRemapped: idMap.size,
  externalLargeIdsPreserved: [...new Set(
    JSON.stringify(remappedData).match(/\d{16,}/g) || [],
  )].filter((id) => ![...idMap.values()].includes(id)).sort(),
  documentLibraries: remappedData.Childs.map((child) => ({
    title: child.ListModel.Title,
    listId: child.ListModel.ListID,
    type: child.ListModel.Type,
    layoutView: child.ListModel.LayoutView,
    fieldNames: child.Defs.map((field) => field.FieldName),
    layouts: child.Layouts.map((layout) => ({
      title: layout.Title || null,
      type: layout.Type,
      layoutId: layout.LayoutID,
      layoutView: layout.LayoutView,
    })),
    containsUploadedRows: Object.keys(child.ListDatas || {}).length > 0,
  })),
  build: JSON.parse(buildOutput),
};

fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
