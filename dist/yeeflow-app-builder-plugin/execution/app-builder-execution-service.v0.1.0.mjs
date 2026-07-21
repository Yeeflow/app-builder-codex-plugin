import { buildApplicationFromCanonicalIntent } from "./app-builder-core-application-facade.v0.1.0.mjs";
import { CORE_APPLICATION_INTENT_VERSION, } from "./app-builder-core-domain-contracts.v0.1.0.mjs";
import { EXECUTION_PROTOCOL_VERSION, STRUCTURED_INTENT_VERSION, } from "./app-builder-execution-contracts.v0.1.0.mjs";
export const capabilityMetadata = {
    packageName: "@yeeflow/app-builder-execution-service",
    version: "0.1.0",
    capabilities: ["In-process protocol negotiation and no-write deterministic application execution."],
};
export const supportedExecutionCapabilities = Object.freeze([
    Object.freeze({ id: "application.plan", version: "1.0.0" }),
    Object.freeze({ id: "application.validate", version: "1.0.0" }),
    Object.freeze({ id: "application.materialize", version: "1.0.0" }),
    Object.freeze({ id: "application.verify", version: "1.0.0" }),
    Object.freeze({ id: "application.repair", version: "1.0.0" }),
]);
export function negotiateExecutionContext(context, requiredCapabilities) {
    const diagnostics = [];
    if (!hasOnlyKeys(context, ["protocolVersion", "capabilities", "authority", "origin", "correlationId", "modelProfileRef"]))
        diagnostics.push(diagnostic("EXECUTION_CONTEXT_FIELD_FORBIDDEN", "negotiation"));
    if (!hasOnlyKeys(context?.capabilities, ["protocolVersion", "descriptors"]))
        diagnostics.push(diagnostic("EXECUTION_CAPABILITY_PROFILE_FIELD_FORBIDDEN", "negotiation"));
    if (!hasOnlyKeys(context?.authority, ["allowedEffects"]))
        diagnostics.push(diagnostic("EXECUTION_AUTHORITY_FIELD_FORBIDDEN", "negotiation"));
    if (context?.protocolVersion !== EXECUTION_PROTOCOL_VERSION || context?.capabilities?.protocolVersion !== EXECUTION_PROTOCOL_VERSION)
        diagnostics.push(diagnostic("EXECUTION_PROTOCOL_VERSION_MISMATCH", "negotiation"));
    if (!Array.isArray(context?.authority?.allowedEffects) || context.authority.allowedEffects.length !== 0)
        diagnostics.push(diagnostic("EXECUTION_WRITE_AUTHORITY_FORBIDDEN", "negotiation"));
    if (!Array.isArray(context?.capabilities?.descriptors) || !context.capabilities.descriptors.every(validDescriptor))
        diagnostics.push(diagnostic("EXECUTION_CAPABILITY_PROFILE_INVALID", "negotiation"));
    if (!Array.isArray(requiredCapabilities) || !requiredCapabilities.every(validDescriptor))
        diagnostics.push(diagnostic("EXECUTION_REQUIRED_CAPABILITY_INVALID", "negotiation"));
    if (Array.isArray(requiredCapabilities) && Array.isArray(context?.capabilities?.descriptors)) {
        for (const required of requiredCapabilities) {
            if (!containsCapability(supportedExecutionCapabilities, required) || !containsCapability(context.capabilities.descriptors, required)) {
                diagnostics.push(diagnostic("EXECUTION_CAPABILITY_UNSUPPORTED", "negotiation"));
                break;
            }
        }
    }
    return freeze({ accepted: diagnostics.length === 0, diagnostics });
}
export function createInProcessExecutionKernel(corePort = defaultCorePort) {
    return Object.freeze({
        negotiate: negotiateExecutionContext,
        execute(request) {
            const envelopeDiagnostic = validateRequestEnvelope(request);
            const negotiation = envelopeDiagnostic
                ? freeze({ accepted: false, diagnostics: [envelopeDiagnostic] })
                : negotiateExecutionContext(request.context, request.requiredCapabilities);
            if (!negotiation.accepted)
                return rejected(request, negotiation.diagnostics);
            const intentDiagnostic = validateStructuredIntent(request.intent);
            if (intentDiagnostic)
                return rejected(request, [intentDiagnostic]);
            try {
                const canonicalIntent = toCanonicalIntent(request.intent);
                const output = corePort.build(canonicalIntent);
                return freeze({
                    protocolVersion: EXECUTION_PROTOCOL_VERSION,
                    requestId: request.requestId,
                    status: output.status === "succeeded" ? "succeeded" : "rejected",
                    output: toExecutionOutput(output),
                    diagnostics: output.status === "succeeded" ? [] : [diagnostic("EXECUTION_CORE_VALIDATION_REJECTED", "core")],
                    observability: observability(request.context),
                });
            }
            catch {
                return rejected(request, [diagnostic("EXECUTION_CORE_FAILURE", "core")]);
            }
        },
    });
}
export function executeInProcess(request) {
    return createInProcessExecutionKernel().execute(request);
}
const defaultCorePort = Object.freeze({ build: buildApplicationFromCanonicalIntent });
function validateRequestEnvelope(request) {
    if (!hasOnlyKeys(request, ["protocolVersion", "requestId", "context", "requiredCapabilities", "intent"]))
        return diagnostic("EXECUTION_REQUEST_FIELD_FORBIDDEN", "negotiation");
    if (request?.protocolVersion !== EXECUTION_PROTOCOL_VERSION || !String(request?.requestId || "").trim())
        return diagnostic("EXECUTION_REQUEST_INVALID", "negotiation");
    return null;
}
function validateStructuredIntent(intent) {
    if (!hasOnlyKeys(intent, ["schemaVersion", "operation", "application"]))
        return diagnostic("EXECUTION_INTENT_FIELD_FORBIDDEN", "intent");
    if (intent?.schemaVersion !== STRUCTURED_INTENT_VERSION || intent?.operation !== "materialize-application")
        return diagnostic("EXECUTION_INTENT_UNSUPPORTED", "intent");
    if (!hasOnlyKeys(intent.application, ["name", "resources"]) || typeof intent.application?.name !== "string" || !Array.isArray(intent.application?.resources))
        return diagnostic("EXECUTION_INTENT_INVALID", "intent");
    for (const resource of intent.application.resources) {
        if (!hasOnlyKeys(resource, ["kind", "name", "fields"]) || typeof resource?.kind !== "string" || typeof resource?.name !== "string" || !Array.isArray(resource?.fields))
            return diagnostic("EXECUTION_INTENT_RESOURCE_INVALID", "intent");
        for (const field of resource.fields) {
            if (!hasOnlyKeys(field, ["name", "fieldName", "fieldType", "controlType", "choiceValues"]))
                return diagnostic("EXECUTION_INTENT_FIELD_INVALID", "intent");
            if (typeof field?.name !== "string" || typeof field?.fieldType !== "string" || typeof field?.controlType !== "string")
                return diagnostic("EXECUTION_INTENT_FIELD_INVALID", "intent");
            if (field.fieldName !== undefined && typeof field.fieldName !== "string")
                return diagnostic("EXECUTION_INTENT_FIELD_INVALID", "intent");
            if (field.choiceValues !== undefined && (!Array.isArray(field.choiceValues) || !field.choiceValues.every((value) => typeof value === "string")))
                return diagnostic("EXECUTION_INTENT_FIELD_INVALID", "intent");
        }
    }
    return null;
}
function toCanonicalIntent(intent) {
    return freeze({
        schemaVersion: CORE_APPLICATION_INTENT_VERSION,
        operation: intent.operation,
        application: {
            name: intent.application.name,
            resources: intent.application.resources.map((resource) => ({
                kind: resource.kind,
                name: resource.name,
                fields: resource.fields.map((field) => ({
                    name: field.name,
                    ...(field.fieldName === undefined ? {} : { fieldName: field.fieldName }),
                    fieldType: field.fieldType,
                    controlType: field.controlType,
                    ...(field.choiceValues === undefined ? {} : { choiceValues: [...field.choiceValues] }),
                })),
            })),
        },
    });
}
function toExecutionOutput(output) {
    return cloneFreeze(output);
}
function validDescriptor(value) {
    if (!hasOnlyKeys(value, ["id", "version"]))
        return false;
    return Boolean(String(value.id || "").trim()) && Boolean(String(value.version || "").trim());
}
function containsCapability(profile, required) {
    return profile.some((item) => item.id === required.id && item.version === required.version);
}
function hasOnlyKeys(value, allowed) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    const allowedKeys = new Set(allowed);
    return Object.keys(value).every((key) => allowedKeys.has(key));
}
function rejected(request, diagnostics) {
    const context = request?.context;
    return freeze({
        protocolVersion: EXECUTION_PROTOCOL_VERSION,
        requestId: String(request?.requestId || ""),
        status: "rejected",
        output: null,
        diagnostics,
        observability: observability(context),
    });
}
function observability(context) {
    return freeze({
        ...(typeof context?.origin === "string" ? { origin: context.origin } : {}),
        ...(typeof context?.correlationId === "string" ? { correlationId: context.correlationId } : {}),
    });
}
function diagnostic(code, stage) {
    return Object.freeze({ code, stage });
}
function cloneFreeze(value) {
    return freeze(JSON.parse(JSON.stringify(value)));
}
function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value))
        return value;
    for (const child of Object.values(value))
        freeze(child);
    return Object.freeze(value);
}