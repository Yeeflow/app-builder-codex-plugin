export type Type1IdentityPlacementIntent = Readonly<{
  templateId: string;
  templateScope: string;
  fieldsGridNodeRef: string;
  controlSlotRef: string;
  ordinal: number;
  descriptor: Readonly<Record<string, unknown>>;
}>;

export type Type1TemplateSnapshot = Readonly<{
  templateId: string;
  templateScope: string;
  nodes: readonly Readonly<{ reference: string; scope: string; parentReference?: string }>[];
  slots: readonly Readonly<{ reference: string; scope: string; parentReference: string }>[];
}>;

export type Type1IdentityPlacementHostContext = Readonly<{ controlId: string }>;

export function lowerDataListType1IdentityControlPlacementAtHost(intent: Type1IdentityPlacementIntent, snapshot: Type1TemplateSnapshot, context: Type1IdentityPlacementHostContext): Readonly<Record<string, unknown>> {
  if (!intent || !snapshot || !context) throw new Error("TEMPLATE_GRAPH_REFERENCE_MISSING");
  if (!valid(intent.templateId) || !valid(intent.templateScope) || !valid(intent.fieldsGridNodeRef) || !valid(intent.controlSlotRef) || !valid(context.controlId)) throw new Error("TEMPLATE_GRAPH_REFERENCE_INVALID");
  if (snapshot.templateId !== intent.templateId || snapshot.templateScope !== intent.templateScope) throw new Error("TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
  const nodes = snapshot.nodes || [];
  const slots = snapshot.slots || [];
  if (duplicates(nodes.map((node) => node.reference)) || duplicates(slots.map((slot) => slot.reference))) throw new Error("TEMPLATE_GRAPH_REFERENCE_DUPLICATE");
  const grid = nodes.find((node) => node.reference === intent.fieldsGridNodeRef);
  const slot = slots.find((item) => item.reference === intent.controlSlotRef);
  if (!grid || !slot) throw new Error("TEMPLATE_GRAPH_REFERENCE_MISSING");
  if (grid.scope !== intent.templateScope || slot.scope !== intent.templateScope) throw new Error("TEMPLATE_GRAPH_REFERENCE_SCOPE_MISMATCH");
  if (slot.parentReference !== grid.reference) throw new Error("TEMPLATE_GRAPH_REFERENCE_RELATIONSHIP_BROKEN");
  const descriptor = clone(intent.descriptor) as Record<string, unknown>;
  const { type, ...rest } = descriptor;
  return freeze({ type, id: context.controlId, ...rest });
}

function valid(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function duplicates(values: readonly string[]): boolean { return new Set(values).size !== values.length; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function freeze<T>(value: T): T { if (value && typeof value === "object") { for (const item of Object.values(value as Record<string, unknown>)) freeze(item); Object.freeze(value); } return value; }
