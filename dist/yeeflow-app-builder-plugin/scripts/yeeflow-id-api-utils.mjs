import { mergeAuthHeaders, requireYeeflowApiAuth } from "./lib/yeeflow-api-auth.mjs";

const DEFAULT_BATCH_SIZE = 100;

export async function loadYeeflowApiEnvironment(dotenvPath = ".env.local") {
  const auth = await requireYeeflowApiAuth({ dotenv: dotenvPath });
  return {
    ...auth.env,
    authMode: auth.mode,
    authHeaders: auth.headers,
  };
}

export async function fetchYeeflowUniqueIds({ apiBaseUrl, apiKey, authHeaders, count, batchSize = DEFAULT_BATCH_SIZE }) {
  const headers = authHeaders || (apiKey ? { apiKey } : null);
  if (!headers) throw new Error("Yeeflow API authentication is required for API-issued ID generation. Run OAuth login first.");
  if (!Number.isInteger(count) || count <= 0) throw new Error("ID count must be a positive integer.");
  const ids = [];
  while (ids.length < count) {
    const requested = Math.min(batchSize, count - ids.length);
    const url = `${apiBaseUrl.replace(/\/+$/, "")}/utils/generate/ids?count=${requested}`;
    const response = await fetch(url, { headers: mergeAuthHeaders({ headers }, { Accept: "application/json" }) });
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
  const allocations = [];
  return {
    next(label = "id", path = null) {
      const id = queue.shift();
      if (!id) throw new Error(`No API-issued ID available for ${label}.`);
      if (seen.has(id)) throw new Error(`API-issued duplicate ID for ${label}.`);
      seen.add(id);
      allocations.push({ id, purpose: label, path, source: "api-generated" });
      return id;
    },
    allocations() {
      return [...allocations];
    },
    usedCount() {
      return seen.size;
    },
    remainingCount() {
      return queue.length;
    },
  };
}

export function createIdProvenanceReport({ requestedIds, receivedIds = requestedIds, allocations = [], generator = {}, unused = [] }) {
  const allocatedIds = allocations.map((allocation) => String(allocation.id));
  const duplicateIds = [...new Set(allocatedIds.filter((id, index) => allocatedIds.indexOf(id) !== index))];
  const pathToPurpose = {};
  for (const allocation of allocations) {
    if (!allocation.path) continue;
    pathToPurpose[allocation.path] = {
      id: String(allocation.id),
      purpose: allocation.purpose || allocation.label || "generated content ID",
      source: "api-generated",
    };
  }
  return {
    sourceMarker: "api-generated",
    totalRequestedIds: requestedIds.length,
    totalReceivedIds: receivedIds.length,
    allocationCount: allocations.length,
    unusedCount: unused.length,
    duplicateCheck: { passed: duplicateIds.length === 0, duplicateIds },
    generatorProvenance: {
      mode: "generated-final-yapk",
      localIdFallbackAllowed: false,
      ...generator,
    },
    pathToPurpose,
    allocations: allocations.map((allocation) => ({
      id: String(allocation.id),
      path: allocation.path || null,
      purpose: allocation.purpose || allocation.label || "generated content ID",
      source: "api-generated",
    })),
    unused,
    nonApiIds: [],
  };
}

export function writeIdProvenanceReport(filePath, report) {
  fs.writeFileSync(filePath, `${JSON.stringify(redactIdProvenanceReport(report), null, 2)}\n`);
}

export function redactIdProvenanceReport(report) {
  return {
    ...report,
    apiBaseUrl: undefined,
    apiKey: undefined,
    tenantUrl: undefined,
    workspaceId: undefined,
    rawApiResponse: undefined,
  };
}

export function createNavigationGroup({ id, appId, listSetId, title, list, icon = "folder" }) {
  if (!id) throw new Error("Navigation group ID is required and must be API-issued.");
  return {
    ID: String(id),
    AppID: appId,
    ListSetID: String(listSetId),
    Type: "classes",
    Title: title,
    Icon: icon,
    list: list.map((item) => createNavigationItem({ appId, listSetId, ...item })),
  };
}

export function createNavigationItem({ appId, listSetId, title, listId, type, layoutId }) {
  const item = {
    AppID: appId,
    Title: title,
    ListID: String(listId),
    ListSetID: String(listSetId),
    Type: type,
  };
  if (layoutId !== undefined && layoutId !== null) item.LayoutID = String(layoutId);
  return item;
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
