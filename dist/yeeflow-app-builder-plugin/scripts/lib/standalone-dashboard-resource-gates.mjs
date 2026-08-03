import { validateDashboardGenerationHardGates } from "../validate-dashboard-generation-hard-gates.mjs";
import { validateDashboardGridTableCollections } from "../validate-dashboard-grid-table-collections.mjs";
import { validateDashboardPageLayoutTemplate } from "../validate-dashboard-page-layout-template.mjs";
import { validatePageScopeTemplateDependencies } from "../validate-page-scope-template-dependencies.mjs";

const LONG_ID_RE = /^[1-9]\d{15,}$/u;

export function validateStandaloneDashboardResource({ outer, body, dependencyMap, identityProvenance, plan = null } = {}) {
  const decoded = {
    Title: outer?.Title || "Standalone Dashboard",
    ListSet: { ListID: outer?.ListID || "" },
    Pages: [{
      Type: 103,
      Title: outer?.Title || "Standalone Dashboard",
      LayoutID: outer?.LayoutID || "",
      Ext2: JSON.stringify({ src: true }),
      LayoutView: null,
      LayoutInResources: [{ ID: outer?.LayoutID || "", RefId: outer?.LayoutID || "", Resource: JSON.stringify(body || {}) }],
    }],
    Childs: dependencyChildren(dependencyMap),
    Forms: [],
  };
  const findings = [];
  const gates = [];
  append("page-scope-template-dependencies", validatePageScopeTemplateDependencies({ decoded }), findings, gates);
  append("dashboard-page-layout-template", validateDashboardPageLayoutTemplate({ decoded, appPlan: plan || undefined }), findings, gates);
  append("dashboard-generation-hard-gates", validateDashboardGenerationHardGates({ decoded, plan: plan || undefined }), findings, gates);
  append("dashboard-grid-table-collections", validateDashboardGridTableCollections({ decoded }), findings, gates);
  validateDependencyClosure(body, outer, dependencyMap, identityProvenance, findings);
  validateActionClosure(body, findings);
  return { status: findings.some((item) => item.level === "error") ? "fail" : "pass", gates, findings };
}

function append(name, report, findings, gates) {
  const entries = Array.isArray(report?.findings) ? report.findings : [];
  const status = report?.status || (report?.ok === true ? "pass" : "fail");
  gates.push({ name, status, findingCount: entries.length });
  for (const finding of entries) findings.push({ ...finding, level: finding.level || finding.severity || "error", gate: name });
}

function dependencyChildren(map) {
  const dependencies = Array.isArray(map?.dependencies) ? map.dependencies : [];
  return dependencies.filter((entry) => entry?.resourceCategory === "data-list").map((entry) => ({
    List: { ListID: entry.canonicalId, Title: entry.logicalId || entry.sourcePlanId || "Source List" },
    ListModel: { ListID: entry.canonicalId, Title: entry.logicalId || entry.sourcePlanId || "Source List" },
    Defs: dependencies.filter((field) => field?.resourceCategory === "field" && (!field.parentLogicalId || field.parentLogicalId === entry.logicalId)).map((field) => ({ FieldID: field.canonicalId, InternalName: field.logicalId || field.sourcePlanId })),
    Layouts: [],
  }));
}

function validateDependencyClosure(body, outer, dependencyMap, identityProvenance, findings) {
  const dependencies = Array.isArray(dependencyMap?.dependencies) ? dependencyMap.dependencies : [];
  const provenance = Array.isArray(identityProvenance) ? identityProvenance : [];
  const issued = new Set(provenance.filter((entry) => entry?.status === "issued").map((entry) => String(entry.canonicalId || "")));
  const declared = new Set(dependencies.filter((entry) => entry?.status === "issued").map((entry) => String(entry.canonicalId || "")));
  for (const id of [outer?.ListID, outer?.LayoutID]) {
    if (!issued.has(String(id || "")) || !declared.has(String(id || ""))) findings.push(error("YDP_OUTER_ID_NOT_IN_ISSUED_CLOSURE", "YDP ListID and LayoutID must both resolve in the issued identity provenance and dependency map.", { id: id || null }));
  }
  walk(body, (node, pointer) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const [key, value] of Object.entries(node)) {
      if (!/(?:List|Field|Layout|Report|Form)(?:Set)?ID$/u.test(key) || typeof value !== "string" || !LONG_ID_RE.test(value)) continue;
      if (!issued.has(value) || !declared.has(value)) findings.push(error("YDP_RESOURCE_REFERENCE_NOT_IN_ISSUED_CLOSURE", "Dashboard source list, field, form, layout, and report identities must resolve in the issued dependency closure.", { pointer: `${pointer}.${key}`, id: value }));
    }
  });
}

function validateActionClosure(body, findings) {
  const declared = new Set();
  for (const item of Array.isArray(body?.actions) ? body.actions : []) if (item?.id || item?.name) declared.add(String(item.id || item.name));
  if (body?.formAction && typeof body.formAction === "object" && !Array.isArray(body.formAction)) for (const key of Object.keys(body.formAction)) declared.add(key);
  if (Array.isArray(body?.formAction)) for (const item of body.formAction) if (item?.id || item?.name) declared.add(String(item.id || item.name));
  walk(body, (node, pointer) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const key of ["control_action", "actionId"]) {
      const value = node[key];
      if (typeof value === "string" && value && !declared.has(value)) findings.push(error("YDP_ACTION_REFERENCE_UNDECLARED", "Every Dashboard action reference must resolve in the page action namespace.", { pointer: `${pointer}.${key}`, action: value }));
    }
  });
}

function walk(value, visitor, pointer = "$") {
  visitor(value, pointer);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visitor, `${pointer}[${index}]`));
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) walk(child, visitor, `${pointer}.${key}`);
}

function error(code, message, detail = null) { return { level: "error", code, message, detail }; }
