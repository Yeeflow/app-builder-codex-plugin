export const capabilityMetadata = {
  packageName: "@yeeflow/app-builder-core-contracts",
  version: "0.1.0",
  capabilities: ["Canonical application DTOs and deterministic build-result contracts."],
} as const;

export const CORE_APPLICATION_INTENT_VERSION = "app-builder.core-application/1.0.0" as const;

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface CanonicalFieldIntent {
  readonly name: string;
  readonly fieldName?: string;
  readonly fieldType: string;
  readonly controlType: string;
  readonly choiceValues?: readonly string[];
}

export interface CanonicalResourceIntent {
  readonly kind: string;
  readonly name: string;
  readonly fields: readonly CanonicalFieldIntent[];
}

export interface CanonicalApplicationIntent {
  readonly schemaVersion: string;
  readonly operation: string;
  readonly application: Readonly<{
    name: string;
    resources: readonly CanonicalResourceIntent[];
  }>;
}

export interface CoreFinding {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly path: string;
  readonly message: string;
}

export interface CoreApplicationPlan {
  readonly schemaVersion: string;
  readonly application: Readonly<{
    name: string;
    resources: readonly Readonly<{
      kind: string;
      name: string;
      fields: readonly CanonicalFieldIntent[];
    }>[];
  }>;
}

export interface CoreMaterialization {
  readonly schemaVersion: string;
  readonly application: Readonly<{
    name: string;
    resources: readonly Readonly<{
      kind: string;
      name: string;
      fields: readonly Readonly<Record<string, JsonValue>>[];
    }>[];
  }>;
}

export interface CoreVerificationCheck {
  readonly id: string;
  readonly passed: boolean;
}

export interface CoreVerificationResult {
  readonly passed: boolean;
  readonly checks: readonly CoreVerificationCheck[];
}

export interface CoreRepairAction {
  readonly code: string;
  readonly path: string;
  readonly action: string;
}

export interface CoreRepairResult {
  readonly required: boolean;
  readonly actions: readonly CoreRepairAction[];
}

export interface CoreApplicationBuildResult {
  readonly status: "succeeded" | "invalid";
  readonly plan: CoreApplicationPlan | null;
  readonly validation: Readonly<{
    valid: boolean;
    findings: readonly CoreFinding[];
  }>;
  readonly materialization: CoreMaterialization | null;
  readonly verification: CoreVerificationResult;
  readonly repair: CoreRepairResult;
}
