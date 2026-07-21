import { type CanonicalApplicationIntent, type CoreApplicationBuildResult } from "@yeeflow/app-builder-core-contracts";
import { type CapabilityDescriptor, type ExecutionContext, type ExecutionDiagnostic, type ExecutionRequest, type ExecutionResult } from "@yeeflow/app-builder-execution-contracts";
export declare const capabilityMetadata: {
    readonly packageName: "@yeeflow/app-builder-execution-service";
    readonly version: "0.1.0";
    readonly capabilities: readonly ["In-process protocol negotiation and no-write deterministic application execution."];
};
export declare const supportedExecutionCapabilities: readonly (Readonly<{
    id: "application.plan";
    version: "1.0.0";
}> | Readonly<{
    id: "application.validate";
    version: "1.0.0";
}> | Readonly<{
    id: "application.materialize";
    version: "1.0.0";
}> | Readonly<{
    id: "application.verify";
    version: "1.0.0";
}> | Readonly<{
    id: "application.repair";
    version: "1.0.0";
}>)[];
export interface ExecutionNegotiation {
    readonly accepted: boolean;
    readonly diagnostics: readonly ExecutionDiagnostic[];
}
export interface ApplicationCorePort {
    build(intent: CanonicalApplicationIntent): CoreApplicationBuildResult;
}
export interface InProcessExecutionKernel {
    negotiate(context: ExecutionContext, requiredCapabilities: readonly CapabilityDescriptor[]): ExecutionNegotiation;
    execute(request: ExecutionRequest): ExecutionResult;
}
export declare function negotiateExecutionContext(context: ExecutionContext, requiredCapabilities: readonly CapabilityDescriptor[]): ExecutionNegotiation;
export declare function createInProcessExecutionKernel(corePort?: ApplicationCorePort): InProcessExecutionKernel;
export declare function executeInProcess(request: ExecutionRequest): ExecutionResult;
//# sourceMappingURL=index.d.ts.map