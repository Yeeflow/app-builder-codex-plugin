export const CAPABILITY_AUTH = "oauth-or-api-key";

export const YEEFLOW_API_CAPABILITIES = [
  cap("lists.get", "GET", "/lists/{appID}/{listID}", "Get details for a list", true, ["path:appID", "path:listID"], [], "OpenAPI", "Read-only list metadata lookup."),
  cap("lists.fields", "GET", "/lists/{appID}/{listID}/fields", "Get fields of a list", true, ["path:appID", "path:listID"], [], "OpenAPI", "Read-only list field definition lookup."),
  cap("items.create", "POST", "/lists/{appID}/{listID}/items", "Add an item to a list", false, ["path:appID", "path:listID", "body:Data"], [], "OpenAPI", "Creates a list item. Require explicit user confirmation and target list confirmation."),
  cap("items.batchCreate", "POST", "/lists/{appID}/{listID}/items/batch", "Add multiple items to a list", false, ["path:appID", "path:listID", "body:Items"], ["body:TriggerFlow"], "OpenAPI", "Creates multiple list items. Require explicit user confirmation and target list confirmation."),
  cap("items.batchUpdate", "PATCH", "/lists/{appID}/{listID}/items/batch", "Update multiple items", false, ["path:appID", "path:listID", "body:Items"], [], "OpenAPI", "Updates multiple list items. Require explicit user confirmation and a scoped item set."),
  cap("items.batchDelete", "POST", "/lists/{appID}/{listID}/items:batchDelete", "Delete items from a list", false, ["path:appID", "path:listID", "body:itemIds"], [], "OpenAPI", "Deletes multiple list items. Require explicit destructive-action confirmation."),
  cap("items.update", "PATCH", "/lists/{appID}/{listID}/items/{id}", "Update an item", false, ["path:appID", "path:listID", "path:id", "body:Data"], [], "OpenAPI", "Updates a list item. Require explicit user confirmation."),
  cap("items.delete", "DELETE", "/lists/{appID}/{listID}/items/{id}", "Delete an item", false, ["path:appID", "path:listID", "path:id"], [], "OpenAPI", "Deletes a list item. Require explicit destructive-action confirmation."),
  cap("items.get", "GET", "/lists/{appID}/{listID}/items/{id}", "Get an item by id", true, ["path:appID", "path:listID", "path:id"], ["query:fields"], "OpenAPI", "Read-only item lookup. Redact person/private fields in summaries."),
  cap("items.query", "POST", "/lists/{appID}/{listID}/items/query", "Query list items", true, ["path:appID", "path:listID", "body:query"], [], "OpenAPI", "Read-only query operation despite POST method. Keep output summarized/redacted."),
  cap("items.files.add", "POST", "/lists/{appID}/{listID}/items/{id}/files", "Add file to item", false, ["path:appID", "path:listID", "path:id", "body:file"], [], "OpenAPI", "Adds file content to an item. Require explicit user confirmation."),
  cap("libraries.files.add", "POST", "/lists/{appID}/{listID}/library", "Add file to document library", false, ["path:appID", "path:listID", "query:fileName", "body:file"], ["path:path"], "OpenAPI", "Adds file content to a document library. The OpenAPI marks directory path as an optional path parameter even though it is not present in the URL template. Require explicit user confirmation."),
  cap("libraries.files.getContent", "GET", "/lists/{appID}/{listID}/library/{id}/content", "Get file from document library", true, ["path:appID", "path:listID", "path:id"], [], "OpenAPI", "Read-only file content retrieval. Do not save raw file content unless explicitly requested outside tracked paths."),

  cap("users.create", "POST", "/users", "Add user", false, ["body:user"], [], "OpenAPI", "Creates a user. Require explicit admin-level confirmation."),
  cap("users.byAccount", "GET", "/users", "Get a user by AccountID", true, ["query:account"], [], "OpenAPI", "Read-only user lookup. Redact personal data by default."),
  cap("users.search", "POST", "/users/search", "Search users", true, ["body:search"], [], "OpenAPI", "Read-only search despite POST method. Return counts and redacted shapes by default."),
  cap("users.get", "GET", "/users/{id}", "Get a user by id", true, ["path:id"], [], "OpenAPI", "Read-only user lookup. Redact personal data by default."),
  cap("users.update", "PUT", "/users/{id}", "Update a user by id", false, ["path:id", "body:user"], [], "OpenAPI", "Updates a user. Require explicit admin-level confirmation."),
  cap("users.delete", "DELETE", "/users/{id}", "Delete a user", false, ["path:id"], [], "OpenAPI", "Deletes a user. Require explicit destructive-action confirmation."),
  cap("users.enable", "PUT", "/users/{id}/enable", "Enable a user", false, ["path:id"], [], "OpenAPI", "Changes user account state. Require explicit confirmation."),
  cap("users.disable", "PUT", "/users/{id}/disable", "Disable a user", false, ["path:id"], [], "OpenAPI", "Changes user account state. Require explicit confirmation."),

  cap("departments.list", "GET", "/departments", "Get departments", true, [], ["query:parentId"], "OpenAPI", "Read-only department lookup."),
  cap("departments.create", "POST", "/departments", "Add a department", false, ["body:department"], [], "OpenAPI", "Creates a department. Require explicit admin-level confirmation."),
  cap("departments.update", "PUT", "/departments/{id}", "Update a department", false, ["path:id", "body:department"], [], "OpenAPI", "Updates a department. Require explicit confirmation."),
  cap("departments.delete", "DELETE", "/departments/{id}", "Delete a department by id", false, ["path:id"], [], "OpenAPI", "Deletes a department. Require explicit destructive-action confirmation."),

  cap("locations.list", "GET", "/locations", "Get all locations", true, [], [], "OpenAPI", "Safe read-only OAuth smoke endpoint."),
  cap("locations.create", "POST", "/locations", "Add a location", false, ["body:location"], [], "OpenAPI", "Creates a location. Require explicit confirmation."),
  cap("locations.get", "GET", "/locations/{id}", "Get location by id", true, ["path:id"], [], "OpenAPI", "Read-only location lookup."),
  cap("locations.update", "PUT", "/locations/{id}", "Update a location", false, ["path:id", "body:location"], [], "OpenAPI", "Updates a location. Require explicit confirmation."),
  cap("locations.delete", "DELETE", "/locations/{id}", "Delete a location", false, ["path:id"], [], "OpenAPI", "Deletes a location. Require explicit destructive-action confirmation."),

  cap("groups.list", "GET", "/groups", "Get groups", true, [], ["query:keywords", "query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only group lookup."),
  cap("groups.create", "POST", "/groups", "Add a group", false, ["body:group"], [], "OpenAPI", "Creates a group. Require explicit confirmation."),
  cap("groups.update", "PUT", "/groups/{id}", "Update a group", false, ["path:id", "body:group"], [], "OpenAPI", "Updates a group. Require explicit confirmation."),
  cap("groups.delete", "DELETE", "/groups/{id}", "Delete a group", false, ["path:id"], [], "OpenAPI", "Deletes a group. Require explicit destructive-action confirmation."),
  cap("groups.users.add", "POST", "/groups/{id}/users", "Add users to a group", false, ["path:id", "body:userIds"], [], "OpenAPI", "Changes group membership. Require explicit confirmation."),
  cap("groups.users.list", "GET", "/groups/{id}/users", "Get users of a group", true, ["path:id"], ["query:keywords", "query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only group membership lookup. Redact personal data by default."),
  cap("groups.users.remove", "POST", "/groups/{id}/users/remove", "Remove users from a group", false, ["path:id", "body:userIds"], [], "OpenAPI", "Changes group membership. Require explicit confirmation."),

  cap("positions.create", "POST", "/positions", "Add a position", false, ["body:position"], [], "OpenAPI", "Creates a position. Require explicit confirmation."),
  cap("positions.list", "GET", "/positions", "Get positions", true, [], [], "OpenAPI", "Read-only position lookup."),
  cap("positions.update", "PUT", "/positions/{id}", "Update a position", false, ["path:id", "body:position"], [], "OpenAPI", "Updates a position. Require explicit confirmation."),
  cap("positions.delete", "DELETE", "/positions/{id}", "Delete a position", false, ["path:id"], [], "OpenAPI", "Deletes a position. Require explicit destructive-action confirmation."),
  cap("positions.users.assign", "POST", "/positions/{id}/users", "Assign users to a position", false, ["path:id", "body:assignment"], [], "OpenAPI", "Changes position assignments. Require explicit confirmation."),
  cap("positions.users.list", "GET", "/positions/{id}/users", "Get position assignment", true, ["path:id"], ["query:userID", "query:bindingType", "query:targetID"], "OpenAPI", "Read-only position assignment lookup. Redact personal data by default."),
  cap("positions.users.remove", "POST", "/positions/{id}/users/remove", "Remove users from a position", false, ["path:id", "body:assignment"], [], "OpenAPI", "Changes position assignments. Require explicit confirmation."),

  cap("workflows.start", "POST", "/workflow/forms/start", "Start a workflow", false, ["query:key", "body:variables"], [], "OpenAPI", "Starts a workflow. Require explicit user confirmation and target workflow confirmation."),
  cap("workflowTasks.todo", "GET", "/workflow/tasks/todo", "Get pending tasks", true, [], ["query:assigneeID", "query:start", "query:end", "query:trackingNo", "query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only pending task lookup. Redact task/person data by default."),
  cap("workflowTasks.variables", "GET", "/workflow/tasks/{id}/variables", "Get variables of task", true, ["path:id"], [], "OpenAPI", "Read-only task variable lookup. Redact private values by default."),
  cap("workflowTasks.handle", "PUT", "/workflow/tasks/{id}/handle", "Process task", false, ["path:id", "body:decision"], [], "OpenAPI", "Processes a workflow task. Require explicit confirmation from the task owner/test user."),
  cap("workflowDelegates.list", "GET", "/workflow/delegates", "Get delegations", true, [], ["query:ownerID", "query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only delegation lookup."),
  cap("workflowDelegates.create", "POST", "/workflow/delegates", "Add a delegation", false, ["body:delegation"], [], "OpenAPI", "Creates a delegation. Require explicit confirmation."),
  cap("workflowDelegates.get", "GET", "/workflow/delegates/{id}", "Get a delegation by ID", true, ["path:id"], [], "OpenAPI", "Read-only delegation lookup."),
  cap("workflowDelegates.update", "PUT", "/workflow/delegates/{id}", "Edit a delegation", false, ["path:id", "body:delegation"], [], "OpenAPI", "Updates a delegation. Require explicit confirmation."),
  cap("workflowDelegates.delete", "DELETE", "/workflow/delegates/{id}", "Delete a delegation", false, ["path:id"], [], "OpenAPI", "Deletes a delegation. Require explicit destructive-action confirmation."),
  cap("workflowDelegates.enable", "PUT", "/workflow/delegates/{id}/enable", "Enable a delegation", false, ["path:id"], [], "OpenAPI", "Changes delegation state. Require explicit confirmation."),
  cap("workflowDelegates.disable", "PUT", "/workflow/delegates/{id}/disable", "Disable a delegation", false, ["path:id"], [], "OpenAPI", "Changes delegation state. Require explicit confirmation."),
  cap("workflowForms.variables.get", "GET", "/workflow/forms/{id}/variables", "Get form variables", true, ["path:id"], [], "OpenAPI", "Read-only workflow form variable lookup. Redact private values by default."),
  cap("workflowForms.variables.update", "PUT", "/workflow/forms/{id}/variables", "Update form variables", false, ["path:id", "body:variables"], [], "OpenAPI", "Updates workflow form variables. Require explicit confirmation."),

  cap("servicePortal.users.create", "POST", "/ServicePortal/{portalid}/users", "Create a service portal user", false, ["path:portalid", "body:user"], [], "OpenAPI", "Creates a service portal user. Require explicit admin-level confirmation."),
  cap("servicePortal.users.search", "GET", "/ServicePortal/{portalid}/users/search", "Search service portal users", true, ["path:portalid"], ["query:keywords", "query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only service portal user lookup. Redact personal data by default."),
  cap("servicePortal.users.delete", "DELETE", "/ServicePortal/{portalid}/users/{id}", "Delete a service portal user", false, ["path:portalid", "path:id"], [], "OpenAPI", "Deletes a service portal user. Require explicit destructive-action confirmation."),
  cap("servicePortal.users.resetPassword", "POST", "/ServicePortal/{portalid}/users/{userid}/resetpwd", "Set password for a service portal user", false, ["path:portalid", "path:userid", "body:password"], [], "OpenAPI", "Password operation. Require explicit admin-level confirmation and never log password values."),
  cap("servicePortal.groups.list", "GET", "/ServicePortal/{portalid}/groups", "Get service portal groups", true, ["path:portalid"], [], "OpenAPI", "Read-only service portal group lookup."),
  cap("servicePortal.groups.create", "POST", "/ServicePortal/{portalid}/groups", "Create a service portal group", false, ["path:portalid", "body:group"], [], "OpenAPI", "Creates a service portal group. Require explicit confirmation."),
  cap("servicePortal.groups.update", "PUT", "/ServicePortal/{portalid}/groups/{id}", "Update service portal group", false, ["path:portalid", "path:id", "body:group"], [], "OpenAPI", "Updates a service portal group. Require explicit confirmation."),
  cap("servicePortal.groups.delete", "DELETE", "/ServicePortal/{portalid}/groups/{id}", "Delete service portal group", false, ["path:portalid", "path:id"], [], "OpenAPI", "Deletes a service portal group. Require explicit destructive-action confirmation."),
  cap("servicePortal.groups.users.count", "GET", "/ServicePortal/{portalid}/groups/{id}/users/count", "Get user count of a service portal group", true, ["path:portalid", "path:id"], [], "OpenAPI", "Read-only service portal group user count."),
  cap("servicePortal.groups.users.add", "POST", "/ServicePortal/{portalid}/groups/{id}/users", "Add users to a service portal group", false, ["path:portalid", "path:id", "body:userIds"], [], "OpenAPI", "Changes service portal group membership. Require explicit confirmation."),
  cap("servicePortal.groups.users.remove", "POST", "/ServicePortal/{portalid}/groups/{id}/users/remove", "Remove users from a service portal group", false, ["path:portalid", "path:id", "body:userIds"], [], "OpenAPI", "Changes service portal group membership. Require explicit confirmation."),

  cap("agents.listForApplication", "GET", "/applications/{listID}/agents", "Get agents of application", true, ["path:listID", "query:appID"], ["query:pageIndex", "query:pageSize"], "OpenAPI", "Read-only application agent lookup."),
  cap("agents.get", "GET", "/agents/{agentID}", "Get definition of an agent", true, ["path:agentID"], [], "OpenAPI", "Read-only agent definition lookup. Redact connection/config secrets if present."),
  cap("agents.run", "POST", "/agents/{agentID}/run", "Run an agent", false, ["path:agentID", "body:input"], [], "OpenAPI", "Runs an agent and may trigger external effects. Require explicit confirmation and safe test context."),

  cap("files.upload", "POST", "/files", "Upload file", false, ["query:FileName", "body:file"], [], "OpenAPI", "Uploads a temporary file. Require explicit confirmation; never commit uploaded content or raw responses."),
  cap("files.content", "GET", "/files/{id}/content", "Get file content by id", true, ["path:id"], [], "OpenAPI", "Read-only file content retrieval. Do not save raw file content unless explicitly requested outside tracked paths."),

  cap("webhooks.create", "POST", "/hooks", "Create a webhook", false, ["body:webhook"], [], "OpenAPI", "Creates a webhook. Require explicit confirmation and endpoint safety review."),
  cap("webhooks.get", "GET", "/hooks/{id}", "Get a webhook by id", true, ["path:id"], [], "OpenAPI", "Read-only webhook lookup. Redact callback URLs/secrets if present."),
  cap("webhooks.delete", "DELETE", "/hooks/{id}", "Delete a webhook by id", false, ["path:id"], [], "OpenAPI", "Deletes a webhook. Require explicit destructive-action confirmation."),

  cap("packages.upload", "POST", "/files/upload", "Upload package file for package automation", false, ["body:packageFile"], ["query:isImg"], "Repo package automation docs", "Package automation helper endpoint. Require explicit confirmation and keep response summarized/redacted."),
  cap("packages.importYap", "POST", "/listset/package/import", "Import YAP package", false, ["body:WorkspaceID", "body:Resource"], [], "Repo package automation docs", "High-risk package import. Require explicit user confirmation, active workspace confirmation, and local validation first. API acceptance is not runtime proof."),
  cap("packages.installYapk", "POST", "/listset/package/install", "Install YAPK package", false, ["body:WorkspaceID", "body:PackageFile"], [], "Repo package automation docs", "High-risk package install. Require explicit user confirmation, disposable/approved workspace, and local validation first. API acceptance is not runtime proof."),
  cap("packages.upgradeYapk", "POST", "/listset/package/upgrade", "Upgrade YAPK package", false, ["body:WorkspaceID", "body:PackageFile"], ["body:UpgradeCheck"], "Repo package automation docs", "High-risk package upgrade. Require explicit user confirmation, target app/package confirmation, and local validation first. API acceptance is not runtime proof."),
];

export function listCapabilities(filters = {}) {
  return YEEFLOW_API_CAPABILITIES.filter((capability) => {
    if (filters.readOnly === true && !capability.readOnly) return false;
    if (filters.write === true && capability.readOnly) return false;
    if (filters.filter) {
      const needle = String(filters.filter).toLowerCase();
      return [
        capability.name,
        capability.category,
        capability.method,
        capability.path,
        capability.summary,
      ].some((value) => String(value || "").toLowerCase().includes(needle));
    }
    return true;
  });
}

export function getCapability(name) {
  return YEEFLOW_API_CAPABILITIES.find((capability) => capability.name === name) || null;
}

export function summarizeCapability(capability) {
  return {
    name: capability.name,
    category: capability.category,
    method: capability.method,
    path: capability.path,
    summary: capability.summary,
    readOnly: capability.readOnly,
    requiresConfirmation: capability.requiresConfirmation,
    auth: capability.auth,
    requiredParams: capability.requiredParams,
    optionalParams: capability.optionalParams,
    source: capability.source,
    notes: capability.notes,
  };
}

export function pathParamsFor(capability) {
  return [...capability.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
}

export function categoryForName(name) {
  return String(name).split(".")[0];
}

function cap(name, method, path, summary, readOnly, requiredParams, optionalParams, source, notes) {
  return {
    name,
    category: categoryForName(name),
    method,
    path,
    summary,
    readOnly,
    requiresConfirmation: !readOnly,
    auth: CAPABILITY_AUTH,
    requiredParams,
    optionalParams,
    source,
    notes,
  };
}
