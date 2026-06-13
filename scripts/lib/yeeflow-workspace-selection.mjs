export const PACKAGE_WORKSPACE_OPERATIONS = new Set([
  "import-yap",
  "install-yapk",
  "upgrade-check-yapk",
  "upgrade-apply-yapk",
  "upgrade-yapk",
]);

export const DOCUMENTED_WORKSPACE_CATEGORIES = Object.freeze(["settings", "flowcraft"]);
export const APP_PACKAGE_WORKSPACE_CATEGORY = "flowcraft";
export const WORKSPACE_STATUS_MEANINGS = Object.freeze({
  0: "normal user-created/editable workspace",
  1: "tenant default/shared workspace, editable but not deletable",
});

export function resolveTargetWorkspaceId({ cliWorkspaceId = "", envWorkspaceId = "", selectedWorkspaceId = "" } = {}) {
  const cli = cleanWorkspaceId(cliWorkspaceId);
  if (cli) return { workspaceId: cli, source: "cli-argument" };
  const env = cleanWorkspaceId(envWorkspaceId);
  if (env) return { workspaceId: env, source: "environment-default" };
  const selected = cleanWorkspaceId(selectedWorkspaceId);
  if (selected) return { workspaceId: selected, source: "user-selection" };
  return { workspaceId: "", source: "missing" };
}

export function requireTargetWorkspaceId(resolution, operation = "package operation") {
  if (resolution?.workspaceId) return resolution.workspaceId;
  throw new Error(
    `Target workspace is required for ${operation}. Run node scripts/yeeflow-workspace-list.mjs --all, choose a flowcraft workspace, pass --workspace-id <id>, or set optional YEEFLOW_WORKSPACE_ID as a manual default/override.`,
  );
}

export function redactWorkspaceId(value) {
  const text = cleanWorkspaceId(value);
  if (!text) return "";
  if (text.length <= 6) return "[redacted]";
  return `${text.slice(0, 3)}...${text.slice(-3)}`;
}

export function extractWorkspaceRecords(payload) {
  const data = payload?.Data ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Records)) return data.Records;
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

export function summarizeWorkspaceRecord(record, index = 0) {
  const id = record?.ID ?? record?.Id ?? record?.id ?? "";
  const status = record?.Status ?? record?.status ?? null;
  const title = safeWorkspaceText(record?.Title ?? record?.Name ?? record?.title ?? record?.name ?? "");
  return {
    index,
    title,
    displayName: workspaceDisplayName({ title, status }),
    category: safeWorkspaceText(record?.Category ?? record?.category ?? ""),
    status,
    statusMeaning: WORKSPACE_STATUS_MEANINGS[status] || "undocumented workspace status",
    statusMeaningProvenance: status === 0 || status === 1 ? "product-knowledge" : "undocumented",
    idPreview: redactWorkspaceId(id),
  };
}

export function summarizeWorkspaceList(payload) {
  const records = extractWorkspaceRecords(payload);
  return {
    workspaceCount: records.length,
    workspaces: records.map((record, index) => summarizeWorkspaceRecord(record, index + 1)),
  };
}

export function combineWorkspaceSummaries(categorySummaries) {
  const categories = categorySummaries.map((summary) => summary.category);
  const workspaces = categorySummaries.flatMap((summary) => summary.workspaces || []);
  return {
    categories,
    workspaceCount: workspaces.length,
    workspaces: workspaces.map((workspace, index) => ({ ...workspace, index: index + 1 })),
  };
}

export function workspaceDisplayName({ title = "", status = null } = {}) {
  const safeTitle = safeWorkspaceText(title);
  if (safeTitle) return safeTitle;
  if (status === 1) return "Shared Workspace";
  return "";
}

export function isDocumentedWorkspaceCategory(category) {
  return DOCUMENTED_WORKSPACE_CATEGORIES.includes(String(category || "").trim());
}

function cleanWorkspaceId(value) {
  return String(value ?? "").trim();
}

function safeWorkspaceText(value) {
  return String(value ?? "").trim();
}
