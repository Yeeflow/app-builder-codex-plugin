import type { JsonValue } from "../index.js";

export type DashboardStaticConfigurationRequest = Readonly<{
  kind: "normalize-dashboard-filters" | "is-date-like-analytics-field";
  filters?: readonly JsonValue[];
  field?: Readonly<{
    fieldName?: JsonValue;
    FieldName?: JsonValue;
    displayName?: JsonValue;
    DisplayName?: JsonValue;
    fieldType?: JsonValue;
    FieldType?: JsonValue;
    controlType?: JsonValue;
    Type?: JsonValue;
  }>;
}>;

export type DashboardStaticConfigurationProjection = Readonly<{
  filters: readonly JsonValue[];
  isDateLike: boolean;
}>;

/** Projects only immutable Dashboard static configuration. It never receives templates, resources, IDs, or runtime state. */
export function projectDashboardStaticConfiguration(request: DashboardStaticConfigurationRequest): DashboardStaticConfigurationProjection {
  if (request?.kind === "normalize-dashboard-filters") return Object.freeze({ filters: Object.freeze([]), isDateLike: false });
  const field = request?.field;
  const text = `${field?.fieldName ?? field?.FieldName ?? ""} ${field?.displayName ?? field?.DisplayName ?? ""} ${field?.fieldType ?? field?.FieldType ?? ""} ${field?.controlType ?? field?.Type ?? ""}`;
  return Object.freeze({ filters: Object.freeze([]), isDateLike: /date|datetime|time|created|modified|period|month|week|year/i.test(text) });
}
