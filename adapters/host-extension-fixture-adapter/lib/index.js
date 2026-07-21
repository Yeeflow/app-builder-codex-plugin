import { EXECUTION_PROTOCOL_VERSION, } from "@yeeflow/app-builder-execution-contracts";
import { createInProcessExecutionKernel } from "@yeeflow/app-builder-execution-service";
export const capabilityMetadata = {
    packageName: "@yeeflow/host-extension-fixture-adapter",
    version: "0.1.0",
    capabilities: ["Open host-extension fixture for execution-service compatibility proof."],
};
export function createHostExtensionFixtureModelPort(intent) {
    const output = cloneFreeze(intent);
    return Object.freeze({
        async invoke() {
            return Object.freeze({ protocolVersion: EXECUTION_PROTOCOL_VERSION, intent: output });
        },
    });
}
export async function executeWithHostExtensionFixture(input, modelPort, kernel = createInProcessExecutionKernel()) {
    const negotiation = kernel.negotiate(input.context, input.requiredCapabilities);
    if (!negotiation.accepted)
        return kernel.execute(rejectedRequest(input));
    try {
        const result = await modelPort.invoke({
            invocationId: input.invocationId,
            modelProfileRef: String(input.context.modelProfileRef || ""),
            input: input.modelInput,
        });
        if (!validModelResult(result))
            return modelFailure(input);
        return kernel.execute({
            protocolVersion: EXECUTION_PROTOCOL_VERSION,
            requestId: input.requestId,
            context: input.context,
            requiredCapabilities: input.requiredCapabilities,
            intent: result.intent,
        });
    }
    catch {
        return modelFailure(input);
    }
}
function rejectedRequest(input) {
    return { protocolVersion: EXECUTION_PROTOCOL_VERSION, requestId: input.requestId, context: input.context, requiredCapabilities: input.requiredCapabilities, intent: rejectedIntent };
}
function validModelResult(value) {
    return hasOnlyKeys(value, ["protocolVersion", "intent"])
        && value.protocolVersion === EXECUTION_PROTOCOL_VERSION;
}
function hasOnlyKeys(value, allowed) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    const allowedKeys = new Set(allowed);
    return Object.keys(value).every((key) => allowedKeys.has(key));
}
function modelFailure(input) {
    return Object.freeze({
        protocolVersion: EXECUTION_PROTOCOL_VERSION,
        requestId: input.requestId,
        status: "rejected",
        output: null,
        diagnostics: Object.freeze([Object.freeze({ code: "EXECUTION_MODEL_RESULT_REJECTED", stage: "model" })]),
        observability: Object.freeze({
            ...(input.context.origin ? { origin: input.context.origin } : {}),
            ...(input.context.correlationId ? { correlationId: input.context.correlationId } : {}),
        }),
    });
}
const rejectedIntent = Object.freeze({ schemaVersion: "", operation: "", application: Object.freeze({ name: "", resources: Object.freeze([]) }) });
function cloneFreeze(value) { return freeze(JSON.parse(JSON.stringify(value))); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value; for (const child of Object.values(value))
    freeze(child); return Object.freeze(value); }
//# sourceMappingURL=index.js.map