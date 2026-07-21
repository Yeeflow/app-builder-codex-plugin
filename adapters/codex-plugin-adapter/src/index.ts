import {
  EXECUTION_PROTOCOL_VERSION,
  type CapabilityDescriptor,
  type ExecutionContext,
  type ExecutionResult,
  type JsonValue,
  type ModelInvocationPort,
  type ModelInvocationResult,
  type StructuredApplicationIntent,
} from "@yeeflow/app-builder-execution-contracts";
import {
  createInProcessExecutionKernel,
  type InProcessExecutionKernel,
} from "@yeeflow/app-builder-execution-service";

export const capabilityMetadata = {
  packageName: "@yeeflow/codex-plugin-adapter",
  version: "0.1.0",
  capabilities: ["Host-controlled structured-intent model wiring into the in-process execution service."],
} as const;

export interface CodexHostExecutionInput {
  readonly requestId: string;
  readonly invocationId: string;
  readonly context: ExecutionContext;
  readonly requiredCapabilities: readonly CapabilityDescriptor[];
  readonly modelInput: JsonValue;
}

export async function executeWithCodexHost(
  input: CodexHostExecutionInput,
  modelPort: ModelInvocationPort,
  kernel: InProcessExecutionKernel = createInProcessExecutionKernel(),
): Promise<ExecutionResult> {
  const negotiation = kernel.negotiate(input.context, input.requiredCapabilities);
  if (!negotiation.accepted) return kernel.execute(request(input, rejectedIntent));
  let modelResult: ModelInvocationResult;
  try {
    modelResult = await modelPort.invoke({
      invocationId: input.invocationId,
      modelProfileRef: String(input.context.modelProfileRef || ""),
      input: input.modelInput,
    });
  } catch {
    return modelFailure(input);
  }
  if (!validModelResult(modelResult)) return modelFailure(input);
  return kernel.execute(request(input, modelResult.intent));
}

function request(input: CodexHostExecutionInput, intent: StructuredApplicationIntent) {
  return {
    protocolVersion: EXECUTION_PROTOCOL_VERSION,
    requestId: input.requestId,
    context: input.context,
    requiredCapabilities: input.requiredCapabilities,
    intent,
  } as const;
}

function validModelResult(value: unknown): value is ModelInvocationResult {
  return hasOnlyKeys(value, ["protocolVersion", "intent"])
    && value.protocolVersion === EXECUTION_PROTOCOL_VERSION;
}

function hasOnlyKeys(value: unknown, allowed: readonly string[]): value is Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function modelFailure(input: CodexHostExecutionInput): ExecutionResult {
  return Object.freeze({
    protocolVersion: EXECUTION_PROTOCOL_VERSION,
    requestId: input.requestId,
    status: "rejected",
    output: null,
    diagnostics: Object.freeze([Object.freeze({ code: "EXECUTION_MODEL_RESULT_REJECTED", stage: "model" as const })]),
    observability: Object.freeze({
      ...(input.context.origin ? { origin: input.context.origin } : {}),
      ...(input.context.correlationId ? { correlationId: input.context.correlationId } : {}),
    }),
  });
}

const rejectedIntent: StructuredApplicationIntent = Object.freeze({
  schemaVersion: "",
  operation: "",
  application: Object.freeze({ name: "", resources: Object.freeze([]) }),
});
