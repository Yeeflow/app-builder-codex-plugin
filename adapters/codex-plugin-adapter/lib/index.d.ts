import { type CapabilityDescriptor, type ExecutionContext, type ExecutionResult, type JsonValue, type ModelInvocationPort } from "@yeeflow/app-builder-execution-contracts";
import { type InProcessExecutionKernel } from "@yeeflow/app-builder-execution-service";
export declare const capabilityMetadata: {
    readonly packageName: "@yeeflow/codex-plugin-adapter";
    readonly version: "0.1.0";
    readonly capabilities: readonly ["Host-controlled structured-intent model wiring into the in-process execution service."];
};
export interface CodexHostExecutionInput {
    readonly requestId: string;
    readonly invocationId: string;
    readonly context: ExecutionContext;
    readonly requiredCapabilities: readonly CapabilityDescriptor[];
    readonly modelInput: JsonValue;
}
export declare function executeWithCodexHost(input: CodexHostExecutionInput, modelPort: ModelInvocationPort, kernel?: InProcessExecutionKernel): Promise<ExecutionResult>;
//# sourceMappingURL=index.d.ts.map