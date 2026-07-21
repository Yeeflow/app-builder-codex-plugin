export const capabilityMetadata = {
  packageName: "@yeeflow/app-builder-execution-contracts",
  version: "0.1.0",
  capabilities: ["Versioned open execution protocol and host-owned invocation ports."],
} as const;

export const EXECUTION_PROTOCOL_VERSION = "app-builder.execution/1.0.0" as const;
export const STRUCTURED_INTENT_VERSION = "app-builder.intent/1.0.0" as const;

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface CapabilityDescriptor {
  readonly id: string;
  readonly version: string;
}

export interface CapabilityProfile {
  readonly protocolVersion: string;
  readonly descriptors: readonly CapabilityDescriptor[];
}

export interface ExecutionAuthority {
  readonly allowedEffects: readonly string[];
}

export interface ExecutionContext {
  readonly protocolVersion: string;
  readonly capabilities: CapabilityProfile;
  readonly authority: ExecutionAuthority;
  readonly origin?: string;
  readonly correlationId?: string;
  readonly modelProfileRef?: string;
}

export interface StructuredFieldIntent {
  readonly name: string;
  readonly fieldName?: string;
  readonly fieldType: string;
  readonly controlType: string;
  readonly choiceValues?: readonly string[];
}

export interface StructuredResourceIntent {
  readonly kind: string;
  readonly name: string;
  readonly fields: readonly StructuredFieldIntent[];
}

export interface StructuredApplicationIntent {
  readonly schemaVersion: string;
  readonly operation: string;
  readonly application: Readonly<{
    name: string;
    resources: readonly StructuredResourceIntent[];
  }>;
}

export interface ExecutionRequest {
  readonly protocolVersion: string;
  readonly requestId: string;
  readonly context: ExecutionContext;
  readonly requiredCapabilities: readonly CapabilityDescriptor[];
  readonly intent: StructuredApplicationIntent;
}

export interface ModelInvocationRequest {
  readonly invocationId: string;
  readonly modelProfileRef: string;
  readonly input: JsonValue;
}

export interface ModelInvocationResult {
  readonly protocolVersion: string;
  readonly intent: StructuredApplicationIntent;
}

export interface ModelInvocationPort {
  invoke(request: ModelInvocationRequest): Promise<ModelInvocationResult>;
}

export interface ApplicationBuildOutput {
  readonly status: "succeeded" | "invalid";
  readonly plan: JsonValue | null;
  readonly validation: JsonValue;
  readonly materialization: JsonValue | null;
  readonly verification: JsonValue;
  readonly repair: JsonValue;
}

export interface ExecutionDiagnostic {
  readonly code: string;
  readonly stage: "negotiation" | "intent" | "core" | "model";
}

export interface ExecutionResult {
  readonly protocolVersion: string;
  readonly requestId: string;
  readonly status: "succeeded" | "rejected";
  readonly output: ApplicationBuildOutput | null;
  readonly diagnostics: readonly ExecutionDiagnostic[];
  readonly observability: Readonly<{
    origin?: string;
    correlationId?: string;
  }>;
}
