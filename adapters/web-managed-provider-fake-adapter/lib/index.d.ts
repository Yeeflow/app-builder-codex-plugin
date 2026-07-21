import { type CapabilityDescriptor, type ExecutionContext, type ExecutionResult, type JsonValue, type ModelInvocationPort, type StructuredApplicationIntent } from "@yeeflow/app-builder-execution-contracts";
import { type InProcessExecutionKernel } from "@yeeflow/app-builder-execution-service";
export declare const capabilityMetadata: {
    readonly packageName: "@yeeflow/web-managed-provider-fake-adapter";
    readonly version: "0.1.0";
    readonly capabilities: readonly ["Deterministic managed-model fake adapter for execution-service incubation."];
};
export interface ManagedFakeExecutionInput {
    readonly requestId: string;
    readonly invocationId: string;
    readonly context: ExecutionContext;
    readonly requiredCapabilities: readonly CapabilityDescriptor[];
    readonly modelInput: JsonValue;
}
export declare function createManagedProviderFakeModelPort(intent: StructuredApplicationIntent): ModelInvocationPort;
export declare function executeWithManagedProviderFake(input: ManagedFakeExecutionInput, modelPort: ModelInvocationPort, kernel?: InProcessExecutionKernel): Promise<ExecutionResult>;
//# sourceMappingURL=index.d.ts.map