export {
  extractMarkdownSubsection,
  findMarkdownTable,
  hasTechnicalPlaceholderIdContext,
  isMarkdownTableSeparator,
  isNegativeRequirementStatement,
  markdownRowValue,
  markdownRowValues,
  parseMarkdownTables,
  positivePlanningText,
  projectPlanningLabel,
  projectWorkflowSetDataListProjection,
  splitMarkdownTableRow,
  stripMarkdownFencedBlocks,
} from "./markdown-planning-utils.js";

export { projectWorkflowQueryDataStaticPlan } from "./workflow-query-data-static-plan.js";
export { projectWorkflowStaticPlan } from "./workflow-static-plan.js";
export { projectDataListFormControlStaticSchema } from "./data-list-form-control-static-schema.js";
export { projectApplicationPlanStaticFoundation } from "./application-plan-static-foundation.js";

export type {
  WorkflowSetDataListProjection,
  WorkflowSetDataListProjectionInput,
  WorkflowSetDataListVariableProjection,
} from "./markdown-planning-utils.js";

export type { WorkflowQueryDataStaticPlanInput, WorkflowQueryDataStaticPlanKind, WorkflowQueryDataStaticPlanProjection } from "./workflow-query-data-static-plan.js";
export type { WorkflowStaticPlanInput, WorkflowStaticPlanKind, WorkflowStaticPlanProjection } from "./workflow-static-plan.js";
export type { ApplicationPlanStaticFoundationKind, ApplicationPlanStaticFoundationRequest } from "./application-plan-static-foundation.js";

export const capabilityMetadata = {
  packageName: "@yeeflow/app-builder-core-planning",
  version: "0.1.0",
  capabilities: ["Planning parser and projection capability metadata."],
} as const;
