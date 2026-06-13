#!/usr/bin/env node

import { authPresenceSummary, buildLoginRequiredResult, mergeAuthHeaders, resolveYeeflowApiAuth, safeAuthError } from "./lib/yeeflow-api-auth.mjs";

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const endpoint = valueAfter("--endpoint", "/locations");

try {
  const auth = await resolveYeeflowApiAuth({ dotenv: valueAfter("--dotenv", ".env.local") });
  if (auth.mode !== "oauth") {
    console.log(JSON.stringify(buildLoginRequiredResult({
      auth,
      originalOperation: "Yeeflow API auth smoke",
      originalEndpoint: `GET ${endpoint}`,
    }), null, 2));
    process.exit(1);
  }
  const base = auth.env.apiBaseUrl;
  const summary = authPresenceSummary(auth);

  if (!execute) {
    console.log(JSON.stringify({
      ...summary,
      liveCall: false,
      documentedReadOnlyEndpoint: "GET /locations",
      note: "Dry run only. Add --execute to perform one documented read-only OAuth/API-authenticated call.",
    }, null, 2));
    process.exit(0);
  }

  if (endpoint !== "/locations") {
    throw new Error("Only documented safe smoke endpoint GET /locations is enabled by default. Do not guess endpoint paths.");
  }

  const response = await fetch(`${base}${endpoint}`, {
    method: "GET",
    headers: mergeAuthHeaders(auth, { Accept: "application/json" }),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  console.log(JSON.stringify({
    ...summary,
    liveCall: true,
    endpoint: `GET ${endpoint}`,
    httpStatus: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type") || "",
    responseKeys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 20) : [],
    apiStatus: parsed?.Status ?? parsed?.status ?? null,
    dataShape: summarizeShape(parsed?.Data ?? parsed?.data ?? parsed),
  }, null, 2));
} catch (error) {
  console.error(safeAuthError(error));
  process.exit(1);
}

function summarizeShape(value) {
  if (Array.isArray(value)) return { type: "array", count: value.length };
  if (value && typeof value === "object") return { type: "object", keys: Object.keys(value).slice(0, 20) };
  if (value === null || value === undefined) return null;
  return { type: typeof value };
}

function valueAfter(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
