#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { environmentPresence, loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

// Read-only Yeeflow directory API smoke test.
// Do not add create, update, delete, assignment, enable, disable, or remove endpoints here.
// The helper intentionally prints only env-var presence, endpoint status, counts, response keys,
// and redacted sample shapes. It never writes raw API responses to disk.
const PRIVATE_KEY_RE =
  /(^|_)(id|accountid|userid|tenantid|departmentid|locationid|manager|linemanager|createdby|modifiedby|email|mail|mobile|phone|telephone|name|address|account|code|employeeno|photo|jobtitle|officeaddress|remark|lastlogintime|servicestartdate)$/i;
const PRIVATE_VALUE_RE = /@|\+?\d[\d\s().-]{6,}/;

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

function redactShape(value, depth = 0) {
  if (depth > 2) return shapeType(value);
  if (Array.isArray(value)) {
    return value.length ? [redactShape(value[0], depth + 1)] : [];
  }
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

function shapeType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

function safeError(error) {
  if (!(error instanceof Error)) return "request failed";
  return error.name || "Error";
}

async function requestJson(baseUrl, apiKey, endpoint, baseVariant) {
  if (!endpoint.readOnly) {
    throw new Error("Blocked non-read-only endpoint configuration.");
  }
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
  if (contentType.includes("application/json")) {
    json = await response.json();
  } else {
    await response.arrayBuffer();
  }

  const records = asArray(json);
  return {
    label: endpoint.label,
    method: endpoint.method,
    path: endpoint.path,
    baseVariant,
    httpStatus: response.status,
    ok: response.ok,
    apiStatus: json?.Status ?? json?.status ?? null,
    totalCount: json ? responseCount(json) : null,
    returnedCount: records.length,
    sampleShape: records.length ? redactShape(records[0]) : null,
    responseKeys: json && typeof json === "object" ? Object.keys(json).slice(0, 20) : [],
  };
}

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local in current working directory.");
  process.exit(1);
}

loadDotenvFile(fs, envPath);

const resolvedEnv = resolveYeeflowEnvironment(process.env);
const envPresence = environmentPresence(resolvedEnv);

console.log(
  JSON.stringify(
    {
      environment: {
        envFile: ".env.local",
        ...envPresence,
      },
    },
    null,
    2,
  ),
);

if (!resolvedEnv.apiKey || !resolvedEnv.apiBaseUrl) {
  process.exit(2);
}

const baseUrl = resolvedEnv.apiBaseUrl;
const baseVariant = resolvedEnv.usedLegacyBaseUrl ? "legacy-api-base-alias" : "api-base";
const endpoints = [
  {
    label: "users",
    method: "POST",
    path: "/users/search",
    body: { PageIndex: 1, PageSize: 1 },
    readOnly: true,
  },
  { label: "departments", method: "GET", path: "/departments?parentId=0", readOnly: true },
  { label: "locations", method: "GET", path: "/locations", readOnly: true },
  { label: "positions", method: "GET", path: "/positions", readOnly: true },
];

const results = [];

for (const endpoint of endpoints) {
  try {
    results.push(
      await requestJson(
        baseUrl,
        resolvedEnv.apiKey,
        endpoint,
        baseVariant,
      ),
    );
  } catch (error) {
    results.push({
      label: endpoint.label,
      method: endpoint.method,
      path: endpoint.path,
      baseVariant,
      ok: false,
      error: safeError(error),
    });
  }
}

console.log(
  JSON.stringify(
    {
      baseSelection: { selectedVariant: baseVariant },
      results,
    },
    null,
    2,
  ),
);
