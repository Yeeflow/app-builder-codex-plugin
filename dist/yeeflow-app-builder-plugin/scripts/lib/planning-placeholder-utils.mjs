import { projectPlanningLabel } from "./markdown-planning-core-adapter.mjs";

export function cleanPlanningLabel(value) { return projectPlanningLabel(value).cleanLabel; }

export function normalizePlanningLabel(value) { return projectPlanningLabel(value).normalizedLabel; }

export function isPlanningPlaceholder(value) { return projectPlanningLabel(value).isPlaceholder; }
