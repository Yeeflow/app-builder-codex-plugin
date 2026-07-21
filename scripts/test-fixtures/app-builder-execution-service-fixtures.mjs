export const executionProtocolVersion = "app-builder.execution/1.0.0";
export const structuredIntentVersion = "app-builder.intent/1.0.0";

export const requiredExecutionCapabilities = deepFreeze([
  { id: "application.plan", version: "1.0.0" },
  { id: "application.validate", version: "1.0.0" },
  { id: "application.materialize", version: "1.0.0" },
  { id: "application.verify", version: "1.0.0" },
  { id: "application.repair", version: "1.0.0" },
]);

export const canonicalStructuredIntent = deepFreeze({
  schemaVersion: structuredIntentVersion,
  operation: "materialize-application",
  application: {
    name: "Equipment Register",
    resources: [
      {
        kind: "data-list",
        name: "Equipment",
        fields: [
          { name: "Equipment Name", fieldName: "EquipmentName", fieldType: "Text", controlType: "input" },
          { name: "Lifecycle Status", fieldName: "LifecycleStatus", fieldType: "Choice", controlType: "select", choiceValues: ["Active", "Retired"] },
        ],
      },
    ],
  },
});

export function executionContext(origin, modelProfileRef = "opaque-profile-alpha") {
  return deepFreeze({
    protocolVersion: executionProtocolVersion,
    capabilities: {
      protocolVersion: executionProtocolVersion,
      descriptors: clone(requiredExecutionCapabilities),
    },
    authority: { allowedEffects: [] },
    origin,
    correlationId: `correlation-${origin}`,
    modelProfileRef,
  });
}

export function executionInput(origin, modelProfileRef) {
  return deepFreeze({
    requestId: `request-${origin}`,
    invocationId: `invocation-${origin}`,
    context: executionContext(origin, modelProfileRef),
    requiredCapabilities: clone(requiredExecutionCapabilities),
    modelInput: { businessRequest: "Create a generic equipment register." },
  });
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
