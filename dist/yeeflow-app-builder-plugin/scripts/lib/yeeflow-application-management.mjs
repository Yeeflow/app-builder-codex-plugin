export const DEFAULT_APPLICATION_APP_ID = 41;
export const SUPPORTED_APPLICATION_APP_IDS = Object.freeze([30, 41]);

export function normalizeApplicationAppId(value = DEFAULT_APPLICATION_APP_ID) {
  const normalized = value === undefined || value === null || value === ""
    ? DEFAULT_APPLICATION_APP_ID
    : Number(value);
  if (!Number.isInteger(normalized) || !SUPPORTED_APPLICATION_APP_IDS.includes(normalized)) {
    throw new Error(`appID must be one of: ${SUPPORTED_APPLICATION_APP_IDS.join(", ")}.`);
  }
  return normalized;
}

export function extractApplicationRecords(payload) {
  const data = payload?.Data ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  for (const key of ["Items", "items", "Applications", "applications", "Rows", "rows"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export function applicationRecordId(record) {
  return firstValue(record, ["ListID", "ListId", "listID", "listId", "ListSetID", "ListSetId", "ApplicationID", "ApplicationId", "ID", "Id", "id"]);
}

export function applicationRecordTitle(record) {
  return firstValue(record, ["Title", "title", "Name", "name", "DisplayName", "displayName"]);
}

export function redactApplicationId(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length <= 6) return `${text.slice(0, 1)}***${text.slice(-1)}`;
  return `${text.slice(0, 3)}...${text.slice(-3)}`;
}

export function summarizeApplicationRecord(record, index = 1) {
  return {
    index,
    title: String(applicationRecordTitle(record) || `Application ${index}`),
    appID: numericOrNull(firstValue(record, ["AppID", "AppId", "appID", "appId"])),
    type: firstValue(record, ["Type", "type", "ApplicationType", "applicationType"]) ?? null,
    status: firstValue(record, ["Status", "status", "State", "state"]) ?? null,
    applicationIdPreview: redactApplicationId(applicationRecordId(record)),
  };
}

export function summarizeApplicationList(payload) {
  const records = extractApplicationRecords(payload);
  const reportedCount = numericOrNull(payload?.TotalCount ?? payload?.totalCount ?? payload?.Count ?? payload?.count);
  return {
    applicationCount: reportedCount ?? records.length,
    applications: records.map((record, index) => summarizeApplicationRecord(record, index + 1)),
  };
}

export function findVerifiedApplication(records, { applicationId, expectedTitle }) {
  const id = requiredText(applicationId, "applicationId");
  const title = requiredText(expectedTitle, "expectedTitle");
  const idMatches = records.filter((record) => String(applicationRecordId(record) ?? "") === id);
  if (idMatches.length === 0) throw new Error("Application preflight failed: the requested application ID was not found in the selected workspace.");
  if (idMatches.length > 1) throw new Error("Application preflight failed: the requested application ID is not unique in the selected workspace response.");
  const record = idMatches[0];
  if (String(applicationRecordTitle(record) ?? "").trim() !== title) {
    throw new Error("Application preflight failed: the expected title does not exactly match the application returned for that ID.");
  }
  return record;
}

export function expectedApplicationDeleteConfirmation(expectedTitle) {
  return `DELETE APPLICATION: ${requiredText(expectedTitle, "expectedTitle")}`;
}

export function assertApplicationDeleteConfirmation({ expectedTitle, confirmation }) {
  const expected = expectedApplicationDeleteConfirmation(expectedTitle);
  if (String(confirmation || "") !== expected) {
    throw new Error(`Strong confirmation is required. Re-run with --confirm-delete ${JSON.stringify(expected)}.`);
  }
  return expected;
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (record && Object.prototype.hasOwnProperty.call(record, key) && record[key] !== "" && record[key] !== null && record[key] !== undefined) {
      return record[key];
    }
  }
  return null;
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function requiredText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} is required.`);
  return text;
}
