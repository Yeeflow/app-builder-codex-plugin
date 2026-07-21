import { CORE_APPLICATION_INTENT_VERSION } from "./app-builder-core-domain-contracts.v0.1.0.mjs";
import { projectDataListScalarField } from "../core/yeeflow-app-builder-core-materializer.v0.1.0.mjs";
import { projectPlanningLabel } from "../core/yeeflow-app-builder-core-planning.v0.1.0.mjs";
export const capabilityMetadata = {
    packageName: "@yeeflow/app-builder-core",
    version: "0.1.0",
    capabilities: ["Deterministic application planning, validation, materialization, verification, and repair facade."],
};
const SUPPORTED_OPERATION = "materialize-application";
const SUPPORTED_RESOURCE_KIND = "data-list";
export function buildApplicationFromCanonicalIntent(intent) {
    const findings = [];
    const plan = projectPlan(intent, findings);
    if (!plan || findings.some((item) => item.severity === "error")) {
        return freeze({
            status: "invalid",
            plan,
            validation: { valid: false, findings },
            materialization: null,
            verification: {
                passed: false,
                checks: [
                    { id: "plan.accepted", passed: Boolean(plan) },
                    { id: "validation.accepted", passed: false },
                    { id: "materialization.available", passed: false },
                ],
            },
            repair: buildRepair(findings),
        });
    }
    const materialization = materializePlan(plan, findings);
    const valid = !findings.some((item) => item.severity === "error");
    return freeze({
        status: valid && materialization ? "succeeded" : "invalid",
        plan,
        validation: { valid, findings },
        materialization: valid ? materialization : null,
        verification: {
            passed: Boolean(valid && materialization),
            checks: [
                { id: "plan.accepted", passed: true },
                { id: "validation.accepted", passed: valid },
                { id: "materialization.available", passed: Boolean(valid && materialization) },
            ],
        },
        repair: buildRepair(findings),
    });
}
function projectPlan(intent, findings) {
    if (!record(intent) || intent.schemaVersion !== CORE_APPLICATION_INTENT_VERSION) {
        findings.push(finding("CORE_APPLICATION_INTENT_VERSION_UNSUPPORTED", "schemaVersion", "The application intent version is unsupported."));
        return null;
    }
    if (intent.operation !== SUPPORTED_OPERATION) {
        findings.push(finding("CORE_APPLICATION_OPERATION_UNSUPPORTED", "operation", "The application operation is unsupported."));
        return null;
    }
    const application = record(intent.application) ? intent.application : null;
    const applicationLabel = projectPlanningLabel(application?.name);
    if (!application || !applicationLabel.cleanLabel || applicationLabel.isPlaceholder) {
        findings.push(finding("CORE_APPLICATION_NAME_REQUIRED", "application.name", "A concrete application name is required."));
        return null;
    }
    if (!Array.isArray(application.resources) || application.resources.length === 0) {
        findings.push(finding("CORE_APPLICATION_RESOURCE_REQUIRED", "application.resources", "At least one resource is required."));
        return null;
    }
    const resourceKeys = new Set();
    const resources = [];
    application.resources.forEach((resource, resourceIndex) => {
        const path = `application.resources[${resourceIndex}]`;
        if (!record(resource)) {
            findings.push(finding("CORE_APPLICATION_RESOURCE_INVALID", path, "The resource declaration is invalid."));
            return;
        }
        const resourceLabel = projectPlanningLabel(resource.name);
        if (!resourceLabel.cleanLabel || resourceLabel.isPlaceholder)
            findings.push(finding("CORE_APPLICATION_RESOURCE_NAME_REQUIRED", `${path}.name`, "A concrete resource name is required."));
        if (resource.kind !== SUPPORTED_RESOURCE_KIND)
            findings.push(finding("CORE_APPLICATION_RESOURCE_KIND_UNSUPPORTED", `${path}.kind`, "The resource kind is unsupported."));
        const resourceKey = resourceLabel.normalizedLabel;
        if (resourceKey && resourceKeys.has(resourceKey))
            findings.push(finding("CORE_APPLICATION_RESOURCE_NAME_DUPLICATE", `${path}.name`, "Resource names must be unique."));
        if (resourceKey)
            resourceKeys.add(resourceKey);
        if (!Array.isArray(resource.fields) || resource.fields.length === 0)
            findings.push(finding("CORE_APPLICATION_FIELD_REQUIRED", `${path}.fields`, "At least one field is required."));
        const fieldKeys = new Set();
        const fields = [];
        if (Array.isArray(resource.fields))
            resource.fields.forEach((field, fieldIndex) => {
                const fieldPath = `${path}.fields[${fieldIndex}]`;
                if (!record(field)) {
                    findings.push(finding("CORE_APPLICATION_FIELD_INVALID", fieldPath, "The field declaration is invalid."));
                    return;
                }
                const fieldLabel = projectPlanningLabel(field.name);
                const fieldKey = fieldLabel.normalizedLabel;
                if (!fieldLabel.cleanLabel || fieldLabel.isPlaceholder)
                    findings.push(finding("CORE_APPLICATION_FIELD_NAME_REQUIRED", `${fieldPath}.name`, "A concrete field name is required."));
                if (!String(field.fieldType || "").trim())
                    findings.push(finding("CORE_APPLICATION_FIELD_TYPE_REQUIRED", `${fieldPath}.fieldType`, "A field type is required."));
                if (!String(field.controlType || "").trim())
                    findings.push(finding("CORE_APPLICATION_CONTROL_TYPE_REQUIRED", `${fieldPath}.controlType`, "A control type is required."));
                if (fieldKey && fieldKeys.has(fieldKey))
                    findings.push(finding("CORE_APPLICATION_FIELD_NAME_DUPLICATE", `${fieldPath}.name`, "Field names must be unique within a resource."));
                if (fieldKey)
                    fieldKeys.add(fieldKey);
                fields.push(freeze({
                    name: fieldLabel.cleanLabel,
                    ...(String(field.fieldName || "").trim() ? { fieldName: String(field.fieldName).trim() } : {}),
                    fieldType: String(field.fieldType || "").trim(),
                    controlType: String(field.controlType || "").trim(),
                    ...(Array.isArray(field.choiceValues) ? { choiceValues: field.choiceValues.map((value) => String(value)) } : {}),
                }));
            });
        resources.push(freeze({ kind: String(resource.kind || ""), name: resourceLabel.cleanLabel, fields }));
    });
    return freeze({
        schemaVersion: CORE_APPLICATION_INTENT_VERSION,
        application: { name: applicationLabel.cleanLabel, resources },
    });
}
function materializePlan(plan, findings) {
    const resources = plan.application.resources.map((resource, resourceIndex) => {
        const fields = [];
        resource.fields.forEach((field, fieldIndex) => {
            const result = projectDataListScalarField({
                displayName: field.name,
                fieldName: field.fieldName || "",
                fieldType: field.fieldType,
                controlType: field.controlType,
                choiceValues: field.choiceValues ? [...field.choiceValues] : [],
                fieldIndex,
            });
            for (const projectedFinding of result.findings) {
                findings.push(finding(projectedFinding.code, `application.resources[${resourceIndex}].fields[${fieldIndex}].${projectedFinding.path}`, projectedFinding.message, projectedFinding.severity));
            }
            if (!result.projection) {
                findings.push(finding("CORE_APPLICATION_FIELD_MATERIALIZATION_UNSUPPORTED", `application.resources[${resourceIndex}].fields[${fieldIndex}]`, "The field cannot be materialized by the application contract."));
                return;
            }
            fields.push(result.projection);
        });
        return freeze({ kind: resource.kind, name: resource.name, fields });
    });
    if (findings.some((item) => item.severity === "error"))
        return null;
    return freeze({ schemaVersion: CORE_APPLICATION_INTENT_VERSION, application: { name: plan.application.name, resources } });
}
function buildRepair(findings) {
    const actions = findings.filter((item) => item.severity === "error").map((item) => freeze({
        code: `REPAIR_${item.code}`,
        path: item.path,
        action: item.code.includes("DUPLICATE") ? "rename-declaration" : item.code.includes("UNSUPPORTED") ? "select-supported-value" : "supply-required-value",
    }));
    return freeze({ required: actions.length > 0, actions });
}
function finding(code, path, message, severity = "error") {
    return freeze({ code, severity, path, message });
}
function record(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
        return value;
    for (const child of Object.values(value))
        freeze(child);
    return Object.freeze(value);
}