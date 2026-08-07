const COMPONENT_TYPES = [
  "ApprovalForm", "ScheduleForm", "Dashboard", "DataList", "Document",
  "DataReport", "FormNewReport", "Knowledge", "AIAgent", "Copilot", "CustomService",
];
const SHARED_RESOURCE_TYPES = ["Theme", "Component", "Group", "Credential", "Tag", "Metadata", "Connection"];
const CATEGORY_TYPES = Object.freeze({
  application: ["Application"],
  component: COMPONENT_TYPES,
  "shared-resource": SHARED_RESOURCE_TYPES,
  portal: ["Portal"],
  navigation: ["Navigation"],
  permissions: ["Permissions"],
});
const STATUS_TRANSITIONS = Object.freeze({
  planned: new Set(["materialized", "blocked"]),
  materialized: new Set(["saved", "blocked"]),
  saved: new Set(["readback-verified", "blocked"]),
  "readback-verified": new Set(),
  blocked: new Set(),
});

export const SUPPORTED_COMPONENT_TYPES = Object.freeze([...COMPONENT_TYPES]);
export const SUPPORTED_SHARED_RESOURCE_TYPES = Object.freeze([...SHARED_RESOURCE_TYPES]);
export const SUPPORTED_OPERATION_CATEGORIES = Object.freeze(Object.keys(CATEGORY_TYPES));
export const OPERATION_STATUSES = Object.freeze(Object.keys(STATUS_TRANSITIONS));

export class IncrementalBuildLedgerValidationError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "IncrementalBuildLedgerValidationError";
    this.code = code;
  }
}

export function validateIncrementalBuildLedger(ledger) {
  assertPlainObject(ledger, "LEDGER_INVALID", "Ledger must be a JSON object.");
  rejectSecrets(ledger);
  assertExactString(ledger.schemaVersion, "LEDGER_SCHEMA_VERSION_INVALID", "schemaVersion");
  if (ledger.schemaVersion !== "1.0") fail("LEDGER_SCHEMA_VERSION_UNSUPPORTED", "Only schemaVersion 1.0 is supported.");
  const applicationState = validateApplication(ledger.application);
  validatePlan(ledger.plan);
  if (!Array.isArray(ledger.operations) || !ledger.operations.length) fail("LEDGER_OPERATIONS_MISSING", "operations must be a non-empty array.");

  const operationById = new Map();
  const issuedValues = new Set();
  for (const operation of ledger.operations) {
    validateOperationShape(operation, applicationState.bootstrap);
    if (operationById.has(operation.operationId)) fail("LEDGER_OPERATION_DUPLICATE", `Duplicate operationId: ${operation.operationId}`);
    operationById.set(operation.operationId, operation);
    for (const issued of operation.issuedIds || []) {
      validateIssuedId(issued, operation.operationId);
      const key = `${issued.kind}:${issued.value}`;
      if (issuedValues.has(key)) fail("LEDGER_ISSUED_ID_DUPLICATE", `Issued ${issued.kind} is reused by operation ${operation.operationId}.`);
      issuedValues.add(key);
    }
  }
  if (applicationState.bootstrap) validateBootstrapState(ledger.operations);
  for (const operation of ledger.operations) validateOperationRelations(operation, operationById);
  return summarizeIncrementalBuildLedger(ledger);
}

export function summarizeIncrementalBuildLedger(ledger) {
  const operationsByStatus = Object.fromEntries(OPERATION_STATUSES.map((status) => [status, 0]));
  for (const operation of ledger.operations || []) operationsByStatus[operation.status] = (operationsByStatus[operation.status] || 0) + 1;
  return {
    schemaVersion: ledger.schemaVersion,
    applicationName: ledger.application?.name,
    planRevision: ledger.plan?.revision,
    operationCount: ledger.operations?.length || 0,
    operationsByStatus,
  };
}

export function expectedDeleteConfirmation(operation) {
  return `DELETE ${operation.category}/${operation.resourceType}: ${operation.resourceName}`;
}

function validateApplication(application) {
  assertPlainObject(application, "LEDGER_APPLICATION_INVALID", "application must be an object.");
  assertExactString(application.workspaceId, "LEDGER_APPLICATION_WORKSPACE_ID_MISSING", "application.workspaceId");
  assertExactString(application.name, "LEDGER_APPLICATION_NAME_MISSING", "application.name");
  if (application.status === "bootstrap") {
    if ("applicationId" in application || "identityProvenance" in application) fail("LEDGER_BOOTSTRAP_APPLICATION_ID_UNEXPECTED", "Bootstrap application must not declare applicationId or identityProvenance before MCP readback.");
    return { bootstrap: true };
  }
  if ("status" in application && application.status !== "readback-verified") fail("LEDGER_APPLICATION_STATUS_INVALID", "application.status may only be bootstrap or readback-verified.");
  assertExactString(application.applicationId, "LEDGER_APPLICATION_ID_MISSING", "application.applicationId");
  validateProvenance(application.identityProvenance, "application identity");
  if (application.identityProvenance.value !== application.applicationId) fail("LEDGER_APPLICATION_PROVENANCE_MISMATCH", "application identity provenance value must match applicationId.");
  return { bootstrap: false };
}

function validatePlan(plan) {
  assertPlainObject(plan, "LEDGER_PLAN_INVALID", "plan must be an object.");
  assertExactString(plan.revision, "LEDGER_PLAN_REVISION_MISSING", "plan.revision");
  assertExactString(plan.hash, "LEDGER_PLAN_HASH_MISSING", "plan.hash");
  if (!/^sha256:[a-f0-9]{64}$/i.test(plan.hash)) fail("LEDGER_PLAN_HASH_INVALID", "plan.hash must be sha256:<64 hexadecimal characters>.");
}

function validateOperationShape(operation, bootstrap) {
  assertPlainObject(operation, "LEDGER_OPERATION_INVALID", "Each operation must be an object.");
  assertExactString(operation.operationId, "LEDGER_OPERATION_ID_MISSING", "operationId");
  assertExactString(operation.category, "LEDGER_OPERATION_CATEGORY_MISSING", "category");
  assertExactString(operation.resourceType, "LEDGER_RESOURCE_TYPE_MISSING", "resourceType");
  if (!CATEGORY_TYPES[operation.category]) fail("LEDGER_OPERATION_CATEGORY_UNSUPPORTED", `Unsupported category: ${operation.category}`);
  if (!CATEGORY_TYPES[operation.category].includes(operation.resourceType)) fail("LEDGER_RESOURCE_TYPE_UNSUPPORTED", `${operation.resourceType} is not supported for ${operation.category}.`);
  if (!["create", "update", "delete"].includes(operation.action)) fail("LEDGER_OPERATION_ACTION_UNSUPPORTED", "action must be create, update, or delete.");
  assertExactString(operation.resourceName, "LEDGER_RESOURCE_NAME_MISSING", "resourceName");
  if (!Array.isArray(operation.dependsOn)) fail("LEDGER_DEPENDENCIES_INVALID", "dependsOn must be an array.");
  if (!OPERATION_STATUSES.includes(operation.status)) fail("LEDGER_STATUS_UNSUPPORTED", `Unsupported status: ${operation.status}`);
  const bootstrapApplicationCreate = bootstrap && isApplicationCreate(operation) && operation.status === "planned";
  if ((!Array.isArray(operation.issuedIds) || !operation.issuedIds.length) && !bootstrapApplicationCreate) fail("LEDGER_ISSUED_IDS_MISSING", "issuedIds must be a non-empty array from MCP issuance.");
  if (bootstrapApplicationCreate && operation.issuedIds !== undefined && (!Array.isArray(operation.issuedIds) || operation.issuedIds.length)) fail("LEDGER_BOOTSTRAP_APPLICATION_ISSUED_IDS_INVALID", "A bootstrap Application create operation must not declare issued IDs before application readback.");
  validateStatusHistory(operation);
  if (operation.action === "delete") validateDeleteReceipt(operation);
  else if ("confirmationReceipt" in operation) fail("LEDGER_CONFIRMATION_RECEIPT_UNEXPECTED", "confirmationReceipt is only allowed for delete operations.");
}

function validateBootstrapState(operations) {
  const applicationOperations = operations.filter((operation) => operation.category === "application");
  if (applicationOperations.length !== 1 || !isApplicationCreate(applicationOperations[0]) || applicationOperations[0].status !== "planned" || applicationOperations[0].statusHistory.length !== 1) {
    fail("LEDGER_BOOTSTRAP_APPLICATION_OPERATION_INVALID", "Bootstrap ledger must contain exactly one Application create operation at planned status.");
  }
  for (const operation of operations) {
    if (operation.category !== "application" && !["planned", "blocked"].includes(operation.status)) fail("LEDGER_BOOTSTRAP_NON_APPLICATION_STATUS_INVALID", `Bootstrap ledger cannot advance ${operation.operationId} beyond planned or blocked.`);
  }
}

function isApplicationCreate(operation) {
  return operation.category === "application" && operation.resourceType === "Application" && operation.action === "create";
}

function validateStatusHistory(operation) {
  if (!Array.isArray(operation.statusHistory) || !operation.statusHistory.length) fail("LEDGER_STATUS_HISTORY_MISSING", `Operation ${operation.operationId} needs a statusHistory starting at planned.`);
  if (operation.statusHistory[0] !== "planned") fail("LEDGER_STATUS_TRANSITION_INVALID", `Operation ${operation.operationId} must start at planned.`);
  for (const status of operation.statusHistory) if (!OPERATION_STATUSES.includes(status)) fail("LEDGER_STATUS_UNSUPPORTED", `Unsupported status in ${operation.operationId}: ${status}`);
  for (let index = 1; index < operation.statusHistory.length; index += 1) {
    const before = operation.statusHistory[index - 1];
    const after = operation.statusHistory[index];
    if (!STATUS_TRANSITIONS[before].has(after)) fail("LEDGER_STATUS_TRANSITION_INVALID", `Unsafe transition for ${operation.operationId}: ${before} -> ${after}.`);
  }
  if (operation.statusHistory.at(-1) !== operation.status) fail("LEDGER_STATUS_HISTORY_MISMATCH", `Operation ${operation.operationId} status must equal the final statusHistory value.`);
}

function validateIssuedId(issued, operationId) {
  assertPlainObject(issued, "LEDGER_ISSUED_ID_INVALID", `issuedIds entry for ${operationId} must be an object.`);
  if (!["id", "guid"].includes(issued.kind)) fail("LEDGER_ISSUED_ID_KIND_INVALID", `issuedIds entry for ${operationId} must have kind id or guid.`);
  assertExactString(issued.value, "LEDGER_ISSUED_ID_VALUE_MISSING", `issuedIds value for ${operationId}`);
  validateProvenance(issued, `issued ID for ${operationId}`);
  if (!/^mcp\./.test(issued.issuedBy)) fail("LEDGER_ISSUED_ID_PROVENANCE_INVALID", `issued ID for ${operationId} must be issued by an MCP operation.`);
}

function validateProvenance(provenance, label) {
  assertPlainObject(provenance, "LEDGER_PROVENANCE_INVALID", `${label} provenance must be an object.`);
  assertExactString(provenance.value, "LEDGER_PROVENANCE_VALUE_MISSING", `${label} provenance value`);
  assertExactString(provenance.issuedBy, "LEDGER_PROVENANCE_ISSUER_MISSING", `${label} provenance issuedBy`);
  assertExactString(provenance.issuedAt, "LEDGER_PROVENANCE_TIME_MISSING", `${label} provenance issuedAt`);
  if (Number.isNaN(Date.parse(provenance.issuedAt))) fail("LEDGER_PROVENANCE_TIME_INVALID", `${label} provenance issuedAt must be ISO-8601.`);
}

function validateOperationRelations(operation, operationById) {
  const dependencies = new Set();
  for (const dependencyId of operation.dependsOn) {
    assertExactString(dependencyId, "LEDGER_DEPENDENCY_ID_INVALID", "dependency ID");
    if (dependencyId === operation.operationId) fail("LEDGER_DEPENDENCY_SELF_REFERENCE", `Operation ${operation.operationId} cannot depend on itself.`);
    if (dependencies.has(dependencyId)) fail("LEDGER_DEPENDENCY_DUPLICATE", `Operation ${operation.operationId} repeats dependency ${dependencyId}.`);
    dependencies.add(dependencyId);
    const dependency = operationById.get(dependencyId);
    if (!dependency) fail("LEDGER_DEPENDENCY_UNKNOWN", `Operation ${operation.operationId} depends on unknown operation ${dependencyId}.`);
    if (!["planned", "blocked"].includes(operation.status) && dependency.status !== "readback-verified") fail("LEDGER_DEPENDENCY_NOT_VERIFIED", `Operation ${operation.operationId} cannot advance until dependency ${dependencyId} is readback-verified.`);
  }
}

function validateDeleteReceipt(operation) {
  assertPlainObject(operation.confirmationReceipt, "LEDGER_DELETE_CONFIRMATION_MISSING", `Delete operation ${operation.operationId} requires an explicit confirmationReceipt.`);
  const receipt = operation.confirmationReceipt;
  if (receipt.kind !== "explicit-delete-confirmation") fail("LEDGER_DELETE_CONFIRMATION_INVALID", "Delete confirmation kind is invalid.");
  if (receipt.operationId !== operation.operationId) fail("LEDGER_DELETE_CONFIRMATION_INVALID", "Delete confirmation receipt must bind to its operationId.");
  assertExactString(receipt.confirmedBy, "LEDGER_DELETE_CONFIRMATION_INVALID", "confirmationReceipt.confirmedBy");
  assertExactString(receipt.confirmedAt, "LEDGER_DELETE_CONFIRMATION_INVALID", "confirmationReceipt.confirmedAt");
  if (Number.isNaN(Date.parse(receipt.confirmedAt))) fail("LEDGER_DELETE_CONFIRMATION_INVALID", "confirmationReceipt.confirmedAt must be ISO-8601.");
  if (receipt.confirmationText !== expectedDeleteConfirmation(operation)) fail("LEDGER_DELETE_CONFIRMATION_INVALID", "Delete confirmation text must exactly identify the target resource.");
}

function rejectSecrets(value, path = "ledger") {
  if (Array.isArray(value)) return value.forEach((item, index) => rejectSecrets(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && (/(?:^|\s)Bearer\s+\S+/i.test(value) || /(?:^|\W)(?:sk|rk|pk)_[A-Za-z0-9_-]{8,}/.test(value) || /eyJ[A-Za-z0-9_-]{10,}\./.test(value))) fail("LEDGER_SECRET_FORBIDDEN", `Raw credential-like value is forbidden at ${path}.`);
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (/(?:secret|password|access[_-]?token|refresh[_-]?token|api[_-]?key|authorization|cookie|client[_-]?secret|bearer)/i.test(key)) fail("LEDGER_SECRET_FORBIDDEN", `Secret-bearing field is forbidden at ${path}.${key}.`);
    rejectSecrets(nested, `${path}.${key}`);
  }
}

function assertPlainObject(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code, message);
}

function assertExactString(value, code, label) {
  if (typeof value !== "string" || !value.trim()) fail(code, `${label} must be a non-empty string.`);
}

function fail(code, message) { throw new IncrementalBuildLedgerValidationError(code, message); }
