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
import { createInProcessExecutionKernel, type InProcessExecutionKernel } from "@yeeflow/app-builder-execution-service";

export const capabilityMetadata = {
  packageName: "@yeeflow/web-managed-provider-fake-adapter",
  version: "0.1.0",
  capabilities: ["Deterministic managed-model fake adapter for execution-service incubation."],
} as const;

export interface ManagedFakeExecutionInput {
  readonly requestId: string;
  readonly invocationId: string;
  readonly context: ExecutionContext;
  readonly requiredCapabilities: readonly CapabilityDescriptor[];
  readonly modelInput: JsonValue;
}

export function createManagedProviderFakeModelPort(intent: StructuredApplicationIntent): ModelInvocationPort {
  const output = cloneFreeze(intent);
  return Object.freeze({
    async invoke() {
      return Object.freeze({ protocolVersion: EXECUTION_PROTOCOL_VERSION, intent: output });
    },
  });
}

export async function executeWithManagedProviderFake(
  input: ManagedFakeExecutionInput,
  modelPort: ModelInvocationPort,
  kernel: InProcessExecutionKernel = createInProcessExecutionKernel(),
): Promise<ExecutionResult> {
  const negotiation = kernel.negotiate(input.context, input.requiredCapabilities);
  if (!negotiation.accepted) return kernel.execute(rejectedRequest(input));
  try {
    const result = await modelPort.invoke({
      invocationId: input.invocationId,
      modelProfileRef: String(input.context.modelProfileRef || ""),
      input: input.modelInput,
    });
    if (!validModelResult(result)) return modelFailure(input);
    return kernel.execute({
      protocolVersion: EXECUTION_PROTOCOL_VERSION,
      requestId: input.requestId,
      context: input.context,
      requiredCapabilities: input.requiredCapabilities,
      intent: result.intent,
    });
  } catch {
    return modelFailure(input);
  }
}

function rejectedRequest(input: ManagedFakeExecutionInput) {
  return { protocolVersion: EXECUTION_PROTOCOL_VERSION, requestId: input.requestId, context: input.context, requiredCapabilities: input.requiredCapabilities, intent: rejectedIntent } as const;
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

function modelFailure(input: ManagedFakeExecutionInput): ExecutionResult {
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

const rejectedIntent: StructuredApplicationIntent = Object.freeze({ schemaVersion: "", operation: "", application: Object.freeze({ name: "", resources: Object.freeze([]) }) });
function cloneFreeze<T>(value: T): T { return freeze(JSON.parse(JSON.stringify(value)) as T); }
function freeze<T>(value: T): T { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value as Record<string, unknown>)) freeze(child); return Object.freeze(value); }
