export type WorkflowStaticPlanKind =
  | "is-default-action-name" | "truncate-action-name" | "normalize-node-type"
  | "business-action-name" | "layout-rows" | "rejected-vertices"
  | "content-list-operation" | "variable-id" | "variable-type"
  | "query-result-field" | "summarize-condition" | "connector-description"
  | "infer-variable-assignee-name";

export interface WorkflowStaticPlanInput { readonly kind: WorkflowStaticPlanKind; readonly value?: unknown; readonly options?: unknown; }
export interface WorkflowStaticPlanProjection { readonly kind: WorkflowStaticPlanKind; readonly value: unknown; }

/**
 * Pure static Workflow planning projection. It deliberately excludes execution,
 * assignee resolution, graph/resource mutation, runtime expressions, Host IDs,
 * and every product-runtime concern.
 */
export function projectWorkflowStaticPlan(input: WorkflowStaticPlanInput): Readonly<WorkflowStaticPlanProjection> {
  const kind = input?.kind; const value = input?.value; const options = wfStaticRecord(input?.options);
  let projected: unknown;
  switch (kind) {
    case "is-default-action-name": projected = wfStaticDefaultActionName(value); break;
    case "truncate-action-name": projected = wfStaticTruncate(value, wfStaticNumber(options.maxLength, 48)); break;
    case "normalize-node-type": projected = wfStaticNormalizeNodeType(value); break;
    case "business-action-name": projected = wfStaticBusinessAction(wfStaticRecord(value), wfStaticNumber(options.index, 0)); break;
    case "layout-rows": projected = wfStaticLayoutRows(Array.isArray(value) ? value : [], wfStaticNumber(options.tolerance, 60)); break;
    case "rejected-vertices": projected = wfStaticRejectedVertices(wfStaticRecord(value), wfStaticRecord(options.rejectPosition)); break;
    case "content-list-operation": projected = wfStaticContentListOperation(wfStaticRecord(value)); break;
    case "variable-id": projected = wfStaticVariableId(value); break;
    case "variable-type": projected = wfStaticVariableType(value); break;
    case "query-result-field": projected = wfStaticQueryResultField(wfStaticRecord(value)); break;
    case "summarize-condition": projected = wfStaticSummarizeCondition(value); break;
    case "connector-description": projected = wfStaticConnectorDescription(wfStaticRecord(value)); break;
    case "infer-variable-assignee-name": projected = wfStaticInferVariableAssigneeName(wfStaticRecord(value)); break;
    default: throw new Error(`Unsupported Workflow static-plan projection kind: ${String(kind || "")}`);
  }
  return wfStaticFreeze({ kind, value: projected });
}

function wfStaticClean(value: unknown): string { return String(value || "").trim().replace(/^`|`$/g, ""); }
function wfStaticNorm(value: unknown): string { return wfStaticClean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function wfStaticRecord(value: unknown): Readonly<Record<string, unknown>> { return value && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {}; }
function wfStaticNumber(value: unknown, fallback: number): number { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function wfStaticFreeze<T>(value: T): T { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; for (const child of Object.values(value as Record<string, unknown>)) wfStaticFreeze(child); return Object.freeze(value); }
function wfStaticDefaultActionName(value: unknown): boolean { const text=wfStaticClean(value); return !text || /^(assignment\s*task|candidate\s*task|claim\s*task|content\s*list|inclusive\s*gateway|gateway|task|workflow\s*task|sequence\s*flow(?:[_\s-]*\d+)?)$/i.test(text); }
function wfStaticTruncate(value: unknown, maximum=48): string { const text=wfStaticClean(value).replace(/\s+/g," "); return text.length<=maximum ? text : (text.slice(0,maximum).replace(/\s+\S*$/,"").trim() || text.slice(0,maximum).trim()); }
function wfStaticNormalizeNodeType(value: unknown): string { const text=wfStaticClean(value), key=wfStaticNorm(text); if(!key)return ""; if(/^start/.test(key))return "StartNoneEvent"; if(/end\s*reject|reject\s*end/.test(key))return "EndRejectEvent"; if(/^end/.test(key))return "EndNoneEvent"; if(/sequence|flow|transition/.test(key))return "SequenceFlow"; if(/exclusive\s*gateway|exclusivegateway/.test(key))return "ExclusiveGateway"; if(/inclusive\s*gateway|inclusivegateway/.test(key))return "InclusiveGateway"; if(/query\s*data|querydata/.test(key))return "QueryData"; if(/set\s*variable|setvariable|setvariabletask/.test(key))return "SetVariableTask"; if(/gateway|condition|branch|decision/.test(key))return "InclusiveGateway"; if(/content\s*list|service\s*action|serviceaction|action\s*node|create|update|archive|persist|master/.test(key)||text==="ContentList")return "ContentList"; if(/candidate/.test(key))return "CandidateTask"; if(/assignment|approval|review|task|multi/.test(key)||text==="MultiAssignmentTask"||text==="AssignmentTask")return "MultiAssignmentTask"; return text.replace(/[^A-Za-z0-9_]/g,"")||"MultiAssignmentTask"; }
function wfStaticBusinessAction(node: Readonly<Record<string,unknown>>, index: number): string { const raw=wfStaticClean(node.nodeName||node.name||node.title); if(raw&&!wfStaticDefaultActionName(raw))return wfStaticTruncate(raw); const type=wfStaticNormalizeNodeType(node.nodeType); const text=[node.requiredJobPositionName,node.assigneeRole,node.assignmentStrategy,node.description,node.conditionBranch,node.dataReadWrite].map(wfStaticClean).join(" "), key=wfStaticNorm(text); if(/\bcash(?:i|e)er\b/.test(key))return "Cashier confirm"; if(/\bfinance\b/.test(key)&&/\bmanager\b/.test(key))return "Finance manager approval"; if(/\bgeneral\b/.test(key)&&/\bmanager\b/.test(key))return "General manager approval"; if(/\bdepartment\b/.test(key)&&/\b(head|manager)\b/.test(key))return "Department head approval"; if(/\bline\b/.test(key)&&/\bmanager\b/.test(key))return "Line manager approval"; if(/\bowner\b/.test(key)&&/\bmanager\b/.test(key))return "Owner's manager approval"; if(/\bowner\b/.test(key))return "Owner approval"; if(/\bit\b/.test(key)&&/\bsecurity\b/.test(key))return "IT security check"; if(/\bsoftware\b/.test(key)&&/\blicen[sc]e\b/.test(key))return "Software license check"; if(/\bprocurement\b/.test(key)&&/\bavailability\b/.test(key))return "Procurement availability"; if(/\bvendor\b/.test(key)&&/\bquotation\b/.test(key))return "Vendor quotation"; if(/\basset\b/.test(key)&&/\bregistration\b/.test(key))return "Asset registration"; if(/\bpickup\b/.test(key))return "Employee pickup"; if(/\bclarification\b/.test(key))return "Request clarification"; if(type==="InclusiveGateway"){if(/\bamount\b|\bbudget\b|\bcost\b|\bprice\b/.test(key))return "Amount check"; if(/\bequipment\b/.test(key))return "Equipment type check"; if(/\bavailability\b/.test(key))return "Availability check"; return `Business condition ${index+1}`;} if(type==="ContentList"){if(/\bcreate\b|\badd\b/.test(key))return "Create record";if(/\bupdate\b|\bset\b|\bsave\b/.test(key))return "Update record";return `Save request data ${index+1}`;} if(type==="CandidateTask")return `Claim task ${index+1}`; return `Review request ${index+1}`; }
function wfStaticLayoutRows(entries: unknown[], tolerance: number): unknown[] {
  const rows: Array<{ y: number; entries: unknown[] }> = [];
  for (const entry of [...entries].sort((a, b) => wfStaticNumber(wfStaticRecord(wfStaticRecord(a).position).y, 0) - wfStaticNumber(wfStaticRecord(wfStaticRecord(b).position).y, 0))) {
    const y = wfStaticNumber(wfStaticRecord(wfStaticRecord(entry).position).y, 0);
    const existing = rows.find((row) => Math.abs(row.y - y) <= tolerance);
    if (existing) {
      existing.entries.push(structuredClone(entry));
      existing.y = existing.entries.reduce<number>((sum, item) => sum + wfStaticNumber(wfStaticRecord(wfStaticRecord(item).position).y, 0), 0) / existing.entries.length;
    } else rows.push({ y, entries: [structuredClone(entry)] });
  }
  return rows;
}
function wfStaticRejectedVertices(source: Readonly<Record<string,unknown>>, target: Readonly<Record<string,unknown>>): unknown[] { const sx=wfStaticNumber(source.x,NaN),sy=wfStaticNumber(source.y,NaN),tx=wfStaticNumber(target.x,NaN),ty=wfStaticNumber(target.y,NaN); if(!Number.isFinite(sx)||!Number.isFinite(sy)||!Number.isFinite(tx)||!Number.isFinite(ty))return []; const dx=Math.abs(tx-sx),dy=Math.abs(ty-sy); if(dx<520&&dy<220)return []; const x=sx+Math.max(120,Math.round(dx/2)); return [{x,y:sy},{x,y:ty},{x:tx-120,y:ty}]; }
function wfStaticContentListOperation(step: Readonly<Record<string,unknown>>): string { const text=[step.nodeName,step.description,step.dataReadWrite].map(wfStaticClean).join(" "); if(/\b(remove|delete)\b/i.test(text))return "remove"; if(/\b(update|edit)\b/i.test(text))return "edit"; return "add"; }
function wfStaticVariableId(value: unknown): string { const slug=wfStaticClean(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").replace(/-/g,"_"); return slug||"workflow_variable"; }
function wfStaticVariableType(value: unknown): string { const key=wfStaticNorm(value); if(/user|identity/.test(key))return "user";if(/date|time/.test(key))return "date";if(/decimal|number|currency|percent|bigint/.test(key))return "number";if(/bit|boolean/.test(key))return "boolean";if(/file|image|upload/.test(key))return "file";return "text"; }
function wfStaticQueryResultField(field: Readonly<Record<string,unknown>>): Record<string,string> { return {FieldID:String(field.FieldID||field.fieldId||field.id||field.fieldName||field.FieldName||""),FieldName:wfStaticClean(field.FieldName||field.fieldName||field.field||"Title"),DisplayName:wfStaticClean(field.DisplayName||field.displayName||field.name||field.FieldName||"Title"),Type:wfStaticClean(field.Type||field.type||field.FieldType||field.fieldType||"Text")}; }
function wfStaticSummarizeCondition(value: unknown): string { for(const row of Array.isArray(value)?value:[]){const r=wfStaticRecord(row),op=wfStaticClean(r.op),leftRecord=wfStaticRecord(r.left),leftValue=wfStaticRecord(leftRecord.value),rightRecord=wfStaticRecord(r.right),rightValue=wfStaticRecord(rightRecord.value),left=wfStaticClean(leftValue.name||leftValue.id),right=rightRecord.type===0?wfStaticClean(rightRecord.value):wfStaticClean(rightValue.name||rightValue.id);if(!left||!op)continue;if(op==="isNull")return `${left} is empty`;if(op==="isNotNull")return `${left} is not empty`;const symbol=op.replace(/^[a-z]+\./i,"").replace("!=","!=").replace("=","=");if(right)return wfStaticTruncate(`${left} ${symbol} ${right}`,42);}return ""; }
function wfStaticConnectorDescription(input: Readonly<Record<string,unknown>>): string { const label=wfStaticClean(input.name).replace(/\s+/g," ");if(/^complete$/i.test(label))return "Completed";if(label&&!/^sequence\s*flow(?:[_\s-]*\d+)?$/i.test(label))return wfStaticTruncate(label,42);return wfStaticSummarizeCondition(input.conditioninfo)||"Next"; }
function wfStaticInferVariableAssigneeName(step: Readonly<Record<string,unknown>>): string { const text=[step.nodeName,step.assigneeRole,step.assignmentStrategy,step.description].map(wfStaticClean).join(" "); const explicit=text.match(/\b(?:workflow\s+variables?|variable)\s*[:=]?\s*([A-Za-z][A-Za-z0-9_]*)\b/i); if(explicit&&!/^line|department|manager|user$/i.test(explicit[1]))return explicit[1];if(/\bowner\b/i.test(text))return "Owner";return ""; }
