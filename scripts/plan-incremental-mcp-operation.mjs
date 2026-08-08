#!/usr/bin/env node

/**
 * Produce a no-side-effect plan for exactly one operation in an Incremental MCP
 * Build Ledger.  This command deliberately does not contact MCP, Yeeflow, or a
 * workspace and never writes the ledger.  It is the boundary between a reviewed
 * App Plan and a later, explicitly-authorized materialization run.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateIncrementalBuildLedger } from "./lib/yeeflow-incremental-build-ledger.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_REGISTRY = "schemas/mcp-incremental-capability-registry.v1.json";

export class IncrementalOperationPlanError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "IncrementalOperationPlanError";
    this.code = code;
  }
}

export function planIncrementalMcpOperation({ ledger, registry, operationId }) {
  validateIncrementalBuildLedger(ledger);
  if (typeof operationId !== "string" || !operationId.trim()) fail("OPERATION_ARGUMENT_INVALID", "operation must be a non-empty operationId.");
  const operation = ledger.operations.find((candidate) => candidate.operationId === operationId);
  if (!operation) fail("OPERATION_UNKNOWN", `No ledger operation exists for ${operationId}.`);
  if (operation.status === "blocked") fail("OPERATION_BLOCKED", `Operation ${operationId} is blocked and cannot be planned for execution.`);
  if (operation.status === "readback-verified") fail("OPERATION_ALREADY_VERIFIED", `Operation ${operationId} is already readback-verified.`);
  if (operation.status !== "planned") fail("OPERATION_NOT_READY", `Operation ${operationId} must be planned before an execution plan can be emitted.`);

  const unresolvedDependencies = operation.dependsOn.filter((dependencyId) => ledger.operations.find((candidate) => candidate.operationId === dependencyId)?.status !== "readback-verified");
  if (unresolvedDependencies.length) fail("OPERATION_DEPENDENCIES_UNRESOLVED", `Operation ${operationId} requires readback-verified dependencies: ${unresolvedDependencies.join(", ")}.`);

  const capability = resolveCapability(registry, operation);
  validateCapabilityDependencies(operation, capability, ledger);
  const confirmation = confirmationRequirement(operation, capability);
  const lifecycle = lifecycleFor(operation, capability, confirmation, ledger.application);
  return {
    result: "INCREMENTAL_MCP_OPERATION_PLAN_READY",
    executionMode: "plan-only-no-network-no-mcp-call",
    ledger: {
      schemaVersion: ledger.schemaVersion,
      applicationName: ledger.application.name,
      planRevision: ledger.plan.revision,
      planHash: ledger.plan.hash,
    },
    operation: {
      operationId: operation.operationId,
      category: operation.category,
      resourceType: operation.resourceType,
      action: operation.action,
      resourceName: operation.resourceName,
      dependencyOperationIds: [...operation.dependsOn],
      status: operation.status,
    },
    capability: {
      kind: capability.kind,
      semanticOperations: capability.semanticOperations,
      supportedActions: capability.supportedActions,
      requiredLifecycle: capability.requiredLifecycle,
      materialization: capability.materialization,
      ...(capability.constraints ? { constraints: capability.constraints } : {}),
    },
    confirmation,
    lifecycle,
    ...(isBootstrapApplicationCreate(operation, ledger.application) ? {
      applicationBootstrap: {
        identityStrategy: ledger.application.bootstrap.identityStrategy,
        themeStrategy: ledger.application.bootstrap.themeStrategy,
        requiresValidatedFontAwesomeIcon: true,
        updateCorrectionPolicy: "require-live-update-contract-before-correction",
      },
    } : {}),
    ...(isApplicationUpsert(operation, ledger.application) ? {
      applicationUpsert: {
        mode: operation.applicationUpsert.mode,
        intendedFields: [...operation.applicationUpsert.intendedFields],
        preserveStableFields: [...operation.applicationUpsert.preserveStableFields],
        readbackOperation: "appbuilder_application_get",
      },
    } : {}),
    safety: {
      doesNotCallMcp: true,
      doesNotAccessNetwork: true,
      doesNotWriteLedger: true,
      requiresPersistedReadbackBeforeLedgerAdvance: true,
      doesNotTreatApiAcceptanceAsDesignerOrRuntimeProof: true,
    },
  };
}

function lifecycleFor(operation, capability, confirmation, application) {
  const persistenceVerb = operation.action === "delete" ? "delete" : "save";
  const bootstrapApplicationCreate = isBootstrapApplicationCreate(operation, application);
  const applicationUpsert = isApplicationUpsert(operation, application);
  const formNewReport = isFormNewReport(operation);
  const bootstrapContract = bootstrapApplicationCreate ? application.bootstrap : null;
  return [
    step("runtime-contract-discovery", "Read the current MCP runtime contract and compare it with the pinned capability snapshot before materialization.", { required: true, source: "live MCP at execution time" }),
    step("list-get-current-state", "List and get the current resource state to prevent blind create, update, or delete operations.", { required: true, source: "live MCP at execution time" }),
    step("mcp-id-allocation", bootstrapContract?.identityStrategy === "mcp-generated-before-create"
      ? "Use the exactly one numeric ID issued by live mcp.utils_generate_ids immediately before Application/create. Never generate, guess, or substitute an Application ID locally."
      : bootstrapApplicationCreate
        ? "Use no caller-supplied Application ID only after live contract discovery explicitly proves the server allocates one on create."
        : applicationUpsert
          ? "Reuse the exact existing Application ID from persisted readback; do not allocate, generate, copy, or substitute a new ID for an upsert."
        : "Use only MCP-issued IDs already bound in the ledger; never generate resource identities locally.", { required: true, issuedIdCount: operation.issuedIds.length, ...(bootstrapApplicationCreate ? { applicationIdentityStrategy: bootstrapContract.identityStrategy, applicationIdentityExpectedFrom: bootstrapContract.identityStrategy === "mcp-generated-before-create" ? "mcp-issued-before-create" : "save-and-readback" } : {}) }),
    step("local-validation", bootstrapApplicationCreate
      ? "Validate the exact workspace/title, the required FontAwesome IconUrl JSON, and theme handling. Omit Themes unless the live Application contract and a non-destructive correction path are verified."
      : applicationUpsert
        ? "Read the exact current Application, preserve its stable fields, and materialize only the declared application-level change. Reject replace/delete-missing semantics and validate IconUrl when it is the intended field."
        : formNewReport
          ? "Require the readback-verified source Approval Form, non-empty Model.Settings.Fields, and one MCP-issued physical Type 32 Fields[] entry for every mapping. Use live-contract-valid native storage names with positive indexes (observed TextN, DecimalN, and DatetimeN); never use a v_<variable> mapping key as a physical FieldName. Bind the default view only to each physical FieldID and native FieldName."
        : "Materialize only the declared resource shape and run the type-specific local validator before persistence.", { required: true, materialization: capability.materialization, ...(bootstrapApplicationCreate ? { themeStrategy: bootstrapContract.themeStrategy } : {}) }),
    step("explicit-confirmation", "Obtain a confirmation receipt bound to this exact operation immediately before the mutating MCP call.", confirmation),
    step(persistenceVerb, operation.action === "delete" ? "Perform the explicitly confirmed delete through the mapped MCP operation." : applicationUpsert ? "Use the discovered workspace Application upsert endpoint with the existing ID, required identity fields, and only the declared application-level change." : "Persist the validated resource through the mapped MCP save operation.", { required: true, action: operation.action }),
    step("get-readback", bootstrapApplicationCreate
      ? "Get the exact saved Application and verify returned ID, workspace, title, IconUrl, and theme state. If any required field differs, block dependent writes; do not attempt correction until a live update contract is discovered and explicitly confirmed."
      : applicationUpsert
        ? "Call appbuilder_application_get for the exact existing Application. Verify the intended field changed while ID, workspace, title when not intended, and other declared stable fields remain preserved. Report API acceptance separately from persisted readback verification."
        : formNewReport
          ? "Get the exact saved FormNewReport and verify its DefKey, matching Type 32 child, every persisted physical field, and the default view bindings. API acceptance without all four readback checks is not persisted report proof."
        : "Get the persisted resource, validate its returned identity and type-specific fields, and record API acceptance separately from Designer/runtime proof.", { required: true }),
    step("ledger-update", "Only after persisted readback passes, append the safe status transition and evidence to the ledger in a separate authorized operation.", { required: true, allowedAfter: "readback-verified" }),
  ];
}

function isBootstrapApplicationCreate(operation, application) {
  return application?.status === "bootstrap" && operation.category === "application" && operation.resourceType === "Application" && operation.action === "create";
}

function isApplicationUpsert(operation, application) {
  return application?.status !== "bootstrap" && operation.category === "application" && operation.resourceType === "Application" && operation.action === "update";
}

function isFormNewReport(operation) {
  return operation.category === "component" && operation.resourceType === "FormNewReport" && operation.action !== "delete";
}

function step(name, purpose, details) { return { name, purpose, ...details }; }

function confirmationRequirement(operation, capability) {
  const reasons = [];
  if (operation.action === "delete") reasons.push("delete");
  if (["Credential", "Connection"].includes(operation.resourceType)) reasons.push(operation.resourceType.toLowerCase());
  if (flag(operation, "permissionBroadening") || flag(capability.risk, "permissionBroadening")) reasons.push("permission-broadening");
  if (operation.resourceType === "Portal" && (flag(operation, "publish") || flag(operation, "portalPublish") || flag(capability.risk, "portalPublish"))) reasons.push("portal-publish");
  return {
    required: true,
    level: reasons.length ? "elevated" : "explicit",
    reasons,
    receiptMustBindOperationId: true,
    receiptMustNameResource: true,
    deleteReceiptAlreadyRequiredByLedger: operation.action === "delete",
  };
}

function flag(value, key) {
  return Boolean(value?.[key] || value?.risk?.[key] || value?.flags?.[key]);
}

function resolveCapability(registry, operation) {
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) fail("CAPABILITY_REGISTRY_INVALID", "Capability registry must be a JSON object.");
  const resources = registry.resources;
  if (!resources || typeof resources !== "object" || Array.isArray(resources)) fail("CAPABILITY_REGISTRY_INVALID", "Capability registry must contain a resources object.");
  const capability = resources[operation.resourceType];
  if (!capability || typeof capability !== "object" || Array.isArray(capability)) fail("CAPABILITY_UNSUPPORTED", `${operation.category}/${operation.resourceType} is not in the capability registry.`);
  const expectedKind = kindForCategory(operation.category);
  if (capability.kind !== expectedKind) fail("CAPABILITY_CATEGORY_MISMATCH", `${operation.resourceType} registry kind must be ${expectedKind}.`);
  const semanticOperations = normalizeSemanticOperations(capability.semanticOperations);
  const supportedActions = supportedActionsFor(semanticOperations);
  if (!supportedActions.includes(operation.action)) fail("CAPABILITY_ACTION_UNSUPPORTED", `${operation.action} is not supported for ${operation.category}/${operation.resourceType}.`);
  const requiredLifecycle = normalizeLifecycle(registry, capability.requiredLifecycle);
  if (!capability.materialization || typeof capability.materialization !== "object" || Array.isArray(capability.materialization)) fail("CAPABILITY_MATERIALIZATION_INVALID", `${operation.resourceType} must declare materialization.`);
  return { ...capability, semanticOperations, supportedActions, requiredLifecycle, kind: expectedKind };
}

function normalizeSemanticOperations(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (value && typeof value === "object" && !Array.isArray(value)) return Object.entries(value).filter(([, supported]) => supported === true || (supported && typeof supported === "object")).map(([name]) => name);
  return [];
}

function supportedActionsFor(semanticOperations) {
  const supported = new Set(semanticOperations.filter((item) => ["create", "update", "delete"].includes(item)));
  if (semanticOperations.includes("resource.save")) { supported.add("create"); supported.add("update"); }
  if (semanticOperations.includes("resource.delete")) supported.add("delete");
  return [...supported].sort();
}

function normalizeLifecycle(registry, lifecycle) {
  const resolved = typeof lifecycle === "string" ? registry.lifecycle?.[lifecycle] : lifecycle;
  if (!Array.isArray(resolved) || !resolved.every((item) => typeof item === "string" && item.trim())) fail("CAPABILITY_LIFECYCLE_INVALID", "Capability must declare a valid requiredLifecycle.");
  return [...resolved];
}

function validateCapabilityDependencies(operation, capability, ledger) {
  const declaredDependencies = new Set(operation.dependsOn);
  for (const requiredResourceType of capability.dependencies ?? []) {
    const matchingOperations = ledger.operations.filter((candidate) => candidate.resourceType === requiredResourceType);
    if (!matchingOperations.length) {
      fail("OPERATION_CAPABILITY_DEPENDENCY_MISSING", `${operation.operationId} requires a ledger operation for ${requiredResourceType}.`);
    }
    const boundAndVerified = matchingOperations.some((candidate) => declaredDependencies.has(candidate.operationId) && candidate.status === "readback-verified");
    if (!boundAndVerified) {
      fail("OPERATION_CAPABILITY_DEPENDENCY_UNVERIFIED", `${operation.operationId} requires a readback-verified ${requiredResourceType} operation in dependsOn.`);
    }
  }
}

function kindForCategory(category) {
  return category === "shared-resource" ? "shared-resource" : category;
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) fail("OPERATION_ARGUMENT_INVALID", "Arguments must use --name value.");
    const name = key.slice(2);
    if (!["ledger", "operation", "registry"].includes(name) || name in result) fail("OPERATION_ARGUMENT_INVALID", "Usage: node scripts/plan-incremental-mcp-operation.mjs --ledger <path> --operation <id> [--registry <path>]");
    result[name] = value;
  }
  if (!result.ledger || !result.operation) fail("OPERATION_ARGUMENT_INVALID", "Usage: node scripts/plan-incremental-mcp-operation.mjs --ledger <path> --operation <id> [--registry <path>]");
  return result;
}

function readJson(path, code, label) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch { fail(code, `${label} could not be parsed or read.`); }
}

function fail(code, message) { throw new IncrementalOperationPlanError(code, message); }

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const ledger = readJson(resolve(ROOT, options.ledger), "LEDGER_INVALID_JSON", "Ledger");
    const registry = readJson(resolve(ROOT, options.registry || DEFAULT_REGISTRY), "CAPABILITY_REGISTRY_INVALID_JSON", "Capability registry");
    console.log(JSON.stringify(planIncrementalMcpOperation({ ledger, registry, operationId: options.operation })));
  } catch (error) {
    const code = error?.code || "OPERATION_PLAN_FAILED";
    const message = String(error?.message || "Operation plan could not be generated.").replace(/^[A-Z_]+: /, "");
    console.error(`${code}: ${message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
