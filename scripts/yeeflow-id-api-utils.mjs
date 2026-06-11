import fs from "node:fs";
import { loadDotenvFile, resolveYeeflowEnvironment } from "./yeeflow-env-utils.mjs";

const DEFAULT_BATCH_SIZE = 100;

export function loadYeeflowApiEnvironment(dotenvPath = ".env.local") {
  loadDotenvFile(fs, dotenvPath);
  const env = resolveYeeflowEnvironment(process.env);
  if (!env.apiKey) throw new Error("YEEFLOW_API_KEY is required for Yeeflow API ID generation.");
  if (!env.apiBaseUrl) throw new Error("YEEFLOW_API_BASE_URL is required for Yeeflow API ID generation.");
  return env;
}

export async function fetchYeeflowUniqueIds({ apiBaseUrl, apiKey, count, batchSize = DEFAULT_BATCH_SIZE }) {
  if (!apiKey) throw new Error("YEEFLOW_API_KEY is required for Yeeflow API ID generation.");
  if (!Number.isInteger(count) || count <= 0) throw new Error("ID count must be a positive integer.");
  const ids = [];
  while (ids.length < count) {
    const requested = Math.min(batchSize, count - ids.length);
    const url = `${apiBaseUrl.replace(/\/+$/, "")}/utils/generate/ids?count=${requested}`;
    const response = await fetch(url, { headers: { apiKey } });
    const text = await response.text();
    if (!response.ok) throw new Error(`generate ids failed with HTTP ${response.status}.`);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("generate ids response was not parseable JSON.");
    }
    const batch = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.Data) ? parsed.Data : Array.isArray(parsed?.data) ? parsed.data : [];
    if (batch.length !== requested) throw new Error(`generate ids returned ${batch.length} IDs for requested count ${requested}.`);
    for (const raw of batch) {
      const id = String(raw);
      if (!/^\d+$/.test(id)) throw new Error("generate ids returned a non-numeric ID.");
      ids.push(id);
    }
  }
  return ids;
}

export function createApiIdAllocator(ids) {
  const queue = [...ids];
  const seen = new Set();
  return {
    next(label = "id") {
      const id = queue.shift();
      if (!id) throw new Error(`No API-issued ID available for ${label}.`);
      if (seen.has(id)) throw new Error(`API-issued duplicate ID for ${label}.`);
      seen.add(id);
      return id;
    },
    usedCount() {
      return seen.size;
    },
    remainingCount() {
      return queue.length;
    },
  };
}

export function summarizeIds(ids) {
  const lengths = ids.map((id) => String(id).length);
  const safeIntegerCount = ids.filter((id) => BigInt(String(id)) <= BigInt(Number.MAX_SAFE_INTEGER)).length;
  return {
    requested: ids.length,
    received: ids.length,
    type: "string",
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    safeIntegerCount,
    unsafeIntegerCount: ids.length - safeIntegerCount,
  };
}
