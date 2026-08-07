import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(root, "schemas/mcp-incremental-capability-registry.v1.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));

const requiredLifecycle = [
  "discover_contract",
  "list_or_get_existing",
  "resolve_dependencies",
  "allocate_ids",
  "materialize",
  "validate_local",
  "confirm_write",
  "save",
  "get_readback",
  "validate_persisted",
  "update_ledger"
];
const expectedByCategory = {
  application: ["Application"],
  component: ["ApprovalForm", "ScheduleForm", "Dashboard", "DataList", "Document", "DataReport", "FormNewReport", "Knowledge", "AIAgent", "Copilot", "CustomService"],
  shared_resource: ["Theme", "Component", "Group", "Credential", "Tag", "Metadata", "Connection"],
  application_configuration: ["Portal", "Navigation", "Permissions"]
};
const expectedOperationKeys = ["discoverContract", "listOrGetExisting", "allocateIds", "save", "getReadback", "delete"];
const forbiddenToolBindingPatterns = [/yeeflow_app_builder_mcp/iu, /mcp__/iu, /component_save/iu, /component_get/iu];
const forbiddenSensitiveFieldPatterns = [/(?:api[_-]?key|access[_-]?token|refresh[_-]?token|bearer|authorization|client[_-]?secret|password|cookie|private[_-]?key|secret[_-]?(?:value|material))/iu];

function walk(value, visit, path = "$") {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, visit, `${path}[${index}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, entry]) => {
    visit(key, `${path}.[key]`);
    walk(entry, visit, `${path}.${key}`);
  });
}

assert.equal(registry.registry, "mcp-incremental-capability-registry", "Registry identity changed.");
assert.equal(registry.schemaVersion, "1.0.0", "Registry schema version changed.");
assert.equal(registry.contractSource, "runtime_discovered", "Concrete runtime bindings must be discovered, not embedded.");
assert.deepEqual(registry.lifecycle["incremental-write-v1"], requiredLifecycle, "Incremental lifecycle is incomplete or reordered.");

const semanticAliases = registry.semanticRuntimeAliases;
assert.deepEqual(Object.keys(semanticAliases).sort(), ["contract.discover", "identity.allocate", "resource.delete", "resource.read", "resource.save"], "Semantic runtime alias coverage changed.");
for (const [alias, descriptor] of Object.entries(semanticAliases)) {
  assert.match(alias, /^(?:contract|identity|resource)\.(?:discover|allocate|read|save|delete)$/u, `Alias ${alias} is not semantic.`);
  assert.equal(descriptor.resolution, "required_before_use", `Alias ${alias} must resolve at runtime before use.`);
  assert.match(descriptor.placeholder, /^runtime\.discovered\.[a-z.]+$/u, `Alias ${alias} uses a non-semantic placeholder.`);
}

const byId = new Map(registry.capabilities.map((entry) => [entry.id, entry]));
const expectedIds = Object.values(expectedByCategory).flat();
assert.equal(expectedIds.length, 22, "The explicit Application + 11 component + 7 shared-resource + 3 configuration scope must contain 22 entries.");
assert.equal(byId.size, expectedIds.length, "Capability IDs must be unique and complete.");
assert.deepEqual([...byId.keys()].sort(), [...expectedIds].sort(), "Capability coverage does not exactly match the approved MCP scope.");
assert.deepEqual(Object.keys(registry.resources).sort(), [...expectedIds].sort(), "Planner resource projection does not exactly match the approved MCP scope.");

for (const [category, expectedIdsForCategory] of Object.entries(expectedByCategory)) {
  assert.deepEqual(
    registry.capabilities.filter((entry) => entry.category === category).map((entry) => entry.id).sort(),
    [...expectedIdsForCategory].sort(),
    `Category ${category} coverage changed.`
  );
}

const expectedKinds = {
  Application: "application",
  Portal: "portal",
  Navigation: "navigation",
  Permissions: "permissions"
};
for (const capability of registry.capabilities) {
  const resource = registry.resources[capability.id];
  const expectedKind = expectedKinds[capability.id] ?? (capability.category === "shared_resource" ? "shared-resource" : "component");
  assert.equal(resource.kind, expectedKind, `${capability.id} planner resource kind is invalid.`);
  assert.deepEqual(resource.semanticOperations, ["contract.discover", "resource.read", "identity.allocate", "resource.save", "resource.delete"], `${capability.id} planner semantic operation coverage changed.`);
  assert.equal(resource.requiredLifecycle, "incremental-write-v1", `${capability.id} planner lifecycle is invalid.`);
  assert.deepEqual(resource.dependencies, capability.dependencies, `${capability.id} planner dependencies diverged from canonical dependencies.`);
  assert.equal(resource.risk.writeClass, capability.risk.writeClass, `${capability.id} planner risk diverged from canonical risk.`);
  assert.ok(resource.materialization?.status && resource.materialization?.validatorStatus, `${capability.id} planner materialization status is incomplete.`);
}

for (const capability of registry.capabilities) {
  assert.equal(capability.lifecycle, "incremental-write-v1", `${capability.id} does not use the complete incremental lifecycle.`);
  assert.deepEqual(Object.keys(capability.operations).sort(), [...expectedOperationKeys].sort(), `${capability.id} operation set is incomplete.`);
  for (const alias of Object.values(capability.operations)) assert.ok(semanticAliases[alias], `${capability.id} uses unknown semantic alias ${alias}.`);
  assert.ok(Array.isArray(capability.dependencies), `${capability.id} dependencies must be an array.`);
  assert.ok(Array.isArray(capability.optionalDependencies), `${capability.id} optional dependencies must be an array.`);
  for (const dependency of [...capability.dependencies, ...capability.optionalDependencies]) assert.ok(byId.has(dependency), `${capability.id} has an unknown dependency ${dependency}.`);
  assert.ok(capability.risk?.writeClass && capability.risk?.confirmation && capability.risk?.deleteConfirmation, `${capability.id} lacks write/delete risk controls.`);
  assert.ok(capability.materializer?.mode && capability.materializer?.liveStatus, `${capability.id} lacks materializer status.`);
  assert.ok(capability.validator?.mode && capability.validator?.liveStatus, `${capability.id} lacks validator status.`);
}

for (const componentId of expectedByCategory.component) assert.ok(byId.get(componentId).dependencies.includes("Application"), `${componentId} must be scoped to Application.`);
for (const sharedId of expectedByCategory.shared_resource) assert.ok(byId.get(sharedId).dependencies.includes("Application"), `${sharedId} must be scoped to Application.`);

const documentCapability = byId.get("Document");
assert.equal(documentCapability.materializer.liveStatus, "available_document_library_only", "Document is the only explicitly available specialist component materializer.");
assert.equal(documentCapability.validator.liveStatus, "available_document_library_only", "Document requires its specialist persisted readback validator.");
const dataListCapability = byId.get("DataList");
assert.equal(dataListCapability.materializer.liveStatus, "no_generic_specialist_live_materializer_claimed", "DataList must not claim a generic specialist live materializer.");
assert.deepEqual(dataListCapability.materializer.specializedSubcapabilities, [{
  id: "DataListWorkflow",
  scope: "WorkflowType1 only; not a generic DataList materializer",
  materializerStatus: "available_specialist_live",
  validatorStatus: "available_specialist_persisted_readback"
}], "DataList Workflow is the only approved DataList specialist subcapability.");
const applicationCapability = byId.get("Application");
assert.equal(applicationCapability.upsert.readbackOperation, "appbuilder_application_get", "Application upsert must require exact persisted readback.");
assert.match(applicationCapability.upsert.description, /non-destructively updates/u, "Application endpoint must be described as an upsert.");
assert.equal(registry.resources.Application.upsert.replaceMissing, false, "Application upsert must reject replacement semantics.");
for (const capability of registry.capabilities.filter((entry) => !["Document", "DataList"].includes(entry.id))) {
  assert.match(capability.materializer.liveStatus, /^no_specialist_live_materializer_claimed$/u, `${capability.id} must not claim an unavailable specialist live materializer.`);
  assert.match(capability.validator.liveStatus, /^no_specialist_live_validator_claimed$/u, `${capability.id} must not claim an unavailable specialist live validator.`);
}

for (const elevatedId of ["Credential", "Connection"]) {
  const capability = byId.get(elevatedId);
  assert.equal(capability.risk.writeClass, "elevated", `${elevatedId} must be elevated-risk.`);
  assert.equal(capability.risk.confirmation, "separate_exact_target", `${elevatedId} requires separate confirmation.`);
  assert.equal(capability.risk.sensitiveValueHandling, "excluded_from_registry_and_ledger", `${elevatedId} must exclude sensitive values.`);
}

const portal = byId.get("Portal");
assert.ok(portal.dependencies.includes("Application"), "Portal must depend on Application.");
assert.equal(portal.constraints.planRequired, true, "Portal must be plan-gated.");
assert.equal(portal.constraints.targetReadbackRequired, true, "Portal targets must be persisted before exposure.");
assert.deepEqual(portal.constraints.allowedExposedTargetTypes, ["DataList", "Document", "Dashboard"], "Portal may expose only DataList, Document, and Dashboard.");
assert.deepEqual(portal.constraints.forbiddenExposedTargetTypes, ["ApprovalForm", "FormNewReport"], "Portal must reject ApprovalForm and FormNewReport exposure.");
assert.equal(registry.resources.Portal.risk.portalPublish, "separate_exact_target", "Portal publication requires separate confirmation.");

const navigation = byId.get("Navigation");
assert.ok(navigation.dependencies.includes("Application"), "Navigation must depend on Application.");
assert.equal(navigation.constraints.targetReadbackRequired, true, "Navigation targets must pass persisted readback.");
assert.equal(navigation.constraints.preventDanglingTargets, true, "Navigation must reject dangling targets.");
assert.deepEqual(navigation.constraints.allowedTargetTypes, expectedByCategory.component, "Navigation must cover every component type exactly once.");

const permissions = byId.get("Permissions");
assert.deepEqual(permissions.dependencies, ["Application", "Group"], "Permissions must depend on Application and Group.");
assert.equal(permissions.constraints.targetReadbackRequired, true, "Permission targets must pass persisted readback.");
assert.equal(permissions.constraints.groupReadbackRequired, true, "Permission groups must pass persisted readback.");
assert.equal(permissions.risk.accessRemovalConfirmation, "stronger_separate_exact_target", "Access removal requires stronger confirmation.");
assert.equal(registry.resources.Permissions.risk.permissionBroadening, "separate_exact_target", "Permission broadening requires separate confirmation.");

const serialized = JSON.stringify(registry);
for (const pattern of forbiddenToolBindingPatterns) assert.doesNotMatch(serialized, pattern, `Registry embeds a concrete runtime tool binding: ${pattern}.`);
walk(registry, (value, path) => {
  if (typeof value !== "string") return;
  for (const pattern of forbiddenSensitiveFieldPatterns) assert.doesNotMatch(value, pattern, `Registry contains a sensitive field or value at ${path}.`);
});

console.log(`MCP_INCREMENTAL_CAPABILITY_REGISTRY_V1_PASSED capabilities=${byId.size} lifecycle=${requiredLifecycle.length} aliases=${Object.keys(semanticAliases).length}`);
