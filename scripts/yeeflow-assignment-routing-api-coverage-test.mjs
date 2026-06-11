#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

// Read-only Yeeflow Assignment Task routing API coverage probe.
// Do not add create, update, delete, assignment, enable, disable, remove, or workflow execution calls here.
// The script prints only env presence, endpoint status, counts, and redacted shapes.
const GZIP_PREFIX = "[______gizp______]";
const PRIVATE_KEY_RE =
  /(^|_)(id|accountid|userid|tenantid|departmentid|locationid|positionid|groupid|manager|linemanager|createdby|modifiedby|email|mail|mobile|phone|telephone|name|address|account|code|employeeno|photo|jobtitle|officeaddress|remark|description|lastlogintime|servicestartdate)$/i;
const PRIVATE_VALUE_RE = /@|\+?\d[\d\s().-]{6,}/;
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node scripts/yeeflow-assignment-routing-api-coverage-test.mjs [input.yap]",
    "",
    "Runs only documented read-only Yeeflow API calls needed for Assignment Task routing coverage.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const input = argv.slice(2).find((arg) => !arg.startsWith("-")) || null;
  return { input };
}

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
      const token = jsonText.slice(start, j);
      out += LARGE_INTEGER_RE.test(token) ? `"${token}"` : token;
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

function decodeYap(inputPath) {
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error("Input is not a wrapped Yeeflow .yap with gzip Resource.");
  }
  const resource = parseJsonPreservingLargeInts(
    zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"),
  );
  return parseJsonPreservingLargeInts(resource.Data);
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function responseCount(json) {
  const explicit = json?.TotalCount ?? json?.totalCount ?? json?.Count ?? json?.count;
  if (Number.isFinite(Number(explicit))) return Number(explicit);
  return asArray(json).length;
}

function shapeType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function redactShape(value, depth = 0) {
  if (depth > 2) return shapeType(value);
  if (Array.isArray(value)) return value.length ? [redactShape(value[0], depth + 1)] : [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 24)
        .map(([key, item]) => [key, redactField(key, item, depth + 1)]),
    );
  }
  return shapeType(value);
}

function redactField(key, value, depth) {
  if (PRIVATE_KEY_RE.test(key) || (typeof value === "string" && PRIVATE_VALUE_RE.test(value))) {
    return "[redacted]";
  }
  if (value && typeof value === "object") return redactShape(value, depth);
  return shapeType(value);
}

function safeError(error) {
  if (!(error instanceof Error)) return "request failed";
  return error.name || "Error";
}

async function requestJson(baseUrl, apiKey, endpoint) {
  if (!endpoint.readOnly) throw new Error("Blocked non-read-only endpoint configuration.");
  const response = await fetch(`${baseUrl}${endpoint.path}`, {
    method: endpoint.method,
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
  });
  let json = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) json = await response.json();
  else await response.arrayBuffer();
  const records = asArray(json);
  return {
    label: endpoint.label,
    method: endpoint.method,
    path: endpoint.pathTemplate || endpoint.path,
    httpStatus: response.status,
    ok: response.ok,
    apiStatus: json?.Status ?? json?.status ?? null,
    totalCount: json ? responseCount(json) : null,
    returnedCount: records.length,
    sampleShape: records.length ? redactShape(records[0]) : json?.Data ? redactShape(json.Data) : null,
    responseKeys: json && typeof json === "object" ? Object.keys(json).slice(0, 20) : [],
  };
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractExpressionDataAttribute(decodedHtml) {
  const marker = 'data="${';
  const markerIndex = decodedHtml.indexOf(marker);
  if (markerIndex === -1) return null;
  const start = markerIndex + 'data="$'.length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < decodedHtml.length; i += 1) {
    const ch = decodedHtml[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return decodedHtml.slice(start, i + 1);
    }
  }
  return null;
}

function expressionData(value) {
  if (typeof value !== "string" || !value.includes("<input") || !value.includes("data=")) return null;
  const rawData = extractExpressionDataAttribute(decodeHtml(value));
  if (!rawData) return null;
  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
}

function collectAssignmentReferences(inputPath) {
  const refs = {
    users: new Set(),
    groups: new Set(),
    positions: new Set(),
    departments: new Set(),
    locations: new Set(),
    positionBindings: [],
  };
  if (!inputPath) return refs;
  const data = decodeYap(inputPath);
  for (const form of asArray(data.Forms)) {
    const def = typeof form.DefResource === "string" ? JSON.parse(form.DefResource) : form.DefResource;
    for (const shape of asArray(def?.childshapes)) {
      if ((shape?.stencil?.id || shape?.stencil) !== "MultiAssignmentTask") continue;
      for (const assignment of asArray(shape.properties?.usertaskassignment)) {
        if (assignment?.type === "user" && assignment?.method === "direct" && assignment.value) {
          refs.users.add(String(assignment.value));
        }
        if (assignment?.type === "position" && assignment.position) {
          refs.positions.add(String(assignment.position));
          if (assignment.method === "positionorg" && assignment.value) {
            refs.departments.add(String(assignment.value));
            refs.positionBindings.push({
              position: String(assignment.position),
              bindingType: 2,
              target: String(assignment.value),
            });
          }
          if (assignment.method === "positionloc" && assignment.value) {
            refs.locations.add(String(assignment.value));
            refs.positionBindings.push({
              position: String(assignment.position),
              bindingType: 3,
              target: String(assignment.value),
            });
          }
        }
        const expr = expressionData(assignment?.value);
        if (expr?.type === "usergroup" && expr?.param?.id) refs.groups.add(String(expr.param.id));
        if (expr?.type === "position" && expr?.param?.id) refs.positions.add(String(expr.param.id));
      }
    }
  }
  return refs;
}

function firstItems(set, limit = 3) {
  return [...set].slice(0, limit);
}

const args = parseArgs(process.argv);
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local in current working directory.");
  process.exit(1);
}
loadDotenvFile(fs, envPath);

const resolvedEnv = resolveYeeflowEnvironment(process.env);
const envPresence = environmentPresence(resolvedEnv);
const refs = collectAssignmentReferences(args.input);

console.log(
  JSON.stringify(
    {
      environment: {
        envFile: ".env.local",
        ...envPresence,
      },
      exportReferenceSummary: {
        source: args.input ? path.basename(args.input) : null,
        staticUserReferences: refs.users.size,
        userGroupReferences: refs.groups.size,
        positionReferences: refs.positions.size,
        departmentReferences: refs.departments.size,
        locationReferences: refs.locations.size,
        positionBindingReferences: refs.positionBindings.length,
      },
    },
    null,
    2,
  ),
);

if (!resolvedEnv.apiKey || !resolvedEnv.apiBaseUrl) process.exit(2);

const baseUrl = resolvedEnv.apiBaseUrl;
const baseVariant = resolvedEnv.usedLegacyBaseUrl ? "legacy-api-base-alias" : "api-base";
const endpoints = [
  {
    label: "users-search",
    method: "POST",
    path: "/users/search",
    body: { PageIndex: 1, PageSize: 1 },
    readOnly: true,
  },
  { label: "departments-root", method: "GET", path: "/departments?parentId=0", readOnly: true },
  { label: "locations-list", method: "GET", path: "/locations", readOnly: true },
  { label: "positions-list", method: "GET", path: "/positions", readOnly: true },
  { label: "groups-list", method: "GET", path: "/groups?pageIndex=1&pageSize=1", readOnly: true },
];

for (const userId of firstItems(refs.users)) {
  endpoints.push({
    label: "user-detail-from-export",
    method: "GET",
    path: `/users/${encodeURIComponent(userId)}`,
    pathTemplate: "/users/{id}",
    readOnly: true,
  });
}
for (const groupId of firstItems(refs.groups)) {
  endpoints.push({
    label: "group-users-from-export",
    method: "GET",
    path: `/groups/${encodeURIComponent(groupId)}/users?pageIndex=1&pageSize=1`,
    pathTemplate: "/groups/{id}/users?pageIndex=1&pageSize=1",
    readOnly: true,
  });
}
for (const locationId of firstItems(refs.locations)) {
  endpoints.push({
    label: "location-detail-from-export",
    method: "GET",
    path: `/locations/${encodeURIComponent(locationId)}`,
    pathTemplate: "/locations/{id}",
    readOnly: true,
  });
}
for (const positionId of firstItems(refs.positions)) {
  endpoints.push({
    label: "position-assignments-from-export",
    method: "GET",
    path: `/positions/${encodeURIComponent(positionId)}/users`,
    pathTemplate: "/positions/{id}/users",
    readOnly: true,
  });
}
for (const binding of refs.positionBindings.slice(0, 3)) {
  endpoints.push({
    label: "position-binding-assignments-from-export",
    method: "GET",
    path: `/positions/${encodeURIComponent(binding.position)}/users?bindingType=${binding.bindingType}&targetID=${encodeURIComponent(binding.target)}`,
    pathTemplate: "/positions/{id}/users?bindingType={bindingType}&targetID={targetID}",
    readOnly: true,
  });
}

const results = [];
for (const endpoint of endpoints) {
  try {
    results.push(await requestJson(baseUrl, resolvedEnv.apiKey, endpoint));
  } catch (error) {
    results.push({
      label: endpoint.label,
      method: endpoint.method,
      path: endpoint.pathTemplate || endpoint.path,
      ok: false,
      error: safeError(error),
    });
  }
}

console.log(JSON.stringify({ baseVariant, results }, null, 2));
