import { type CapabilityDescriptor, type ExecutionContext, type ExecutionResult, type JsonValue, type ModelInvocationPort, type StructuredApplicationIntent } from "@yeeflow/app-builder-execution-contracts";
import { type InProcessExecutionKernel } from "@yeeflow/app-builder-execution-service";
export declare const capabilityMetadata: {
    readonly packageName: "@yeeflow/host-extension-fixture-adapter";
    readonly version: "0.1.0";
    readonly capabilities: readonly ["Open host-extension fixture for execution-service compatibility proof."];
};
export interface HostExtensionExecutionInput {
    readonly requestId: string;
    readonly invocationId: string;
    readonly context: ExecutionContext;
    readonly requiredCapabilities: readonly CapabilityDescriptor[];
    readonly modelInput: JsonValue;
}
export declare function createHostExtensionFixtureModelPort(intent: StructuredApplicationIntent): ModelInvocationPort;
export declare function executeWithHostExtensionFixture(input: HostExtensionExecutionInput, modelPort: ModelInvocationPort, kernel?: InProcessExecutionKernel): Promise<ExecutionResult>;
//# sourceMappingURL=index.d.ts.map