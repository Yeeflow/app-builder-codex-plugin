export const PACKAGE_WORKSPACE_OPERATIONS = new Set([
  "import-yap",
  "install-yapk",
  "upgrade-check-yapk",
  "upgrade-apply-yapk",
  "upgrade-yapk",
]);

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
    `Target workspace is required for ${operation}. Run node scripts/yeeflow-workspace-list.mjs --category <category>, pass --workspace-id <id>, or set optional YEEFLOW_WORKSPACE_ID in .env.local.`,
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
  return {
    index,
    title: safeWorkspaceText(record?.Title ?? record?.Name ?? record?.title ?? record?.name ?? ""),
    category: safeWorkspaceText(record?.Category ?? record?.category ?? ""),
    status: record?.Status ?? record?.status ?? null,
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

function cleanWorkspaceId(value) {
  return String(value ?? "").trim();
}

function safeWorkspaceText(value) {
  return String(value ?? "").trim();
}
