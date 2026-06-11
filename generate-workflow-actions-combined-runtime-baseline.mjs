import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

const DEFAULT_APPROVAL_SOURCE = "/Users/Renger/Downloads/Test ABC (3).yap";
const DEFAULT_LIST_SOURCE = "/Users/Renger/Downloads/Purchase Requests.ydl";
const DEFAULT_OUTPUT = "workflow-actions-combined-runtime-baseline.v1.yap";

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node generate-workflow-actions-combined-runtime-baseline.mjs [--out output.yap]",
    "",
    "Builds a combined approval-form + data-list workflow action runtime baseline.",
    "The generated .yap can contain tenant-local assignee references cloned from exports and must stay ignored.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = {
    approvalSource: DEFAULT_APPROVAL_SOURCE,
    listSource: DEFAULT_LIST_SOURCE,
    out: DEFAULT_OUTPUT,
    family: "746",
    approvalKey: "WARTB",
    dataWorkflowKey: "WADL1",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--approval-source") args.approvalSource = argv[++i];
    else if (arg === "--list-source") args.listSource = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--family") args.family = argv[++i];
    else if (arg === "--approval-key") args.approvalKey = argv[++i];
    else if (arg === "--data-workflow-key") args.dataWorkflowKey = argv[++i];
    else usage();
  }
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let i = 0;
  let inString = false;
  let escaped = false;
  while (i < jsonText.length) {
    const ch = jsonText[i];
    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const start = i;
      let j = i;
      if (jsonText[j] === "-") j += 1;
      while (j < jsonText.length && jsonText[j] >= "0" && jsonText[j] <= "9") j += 1;
      if (jsonText[j] === "." || jsonText[j] === "e" || jsonText[j] === "E") {
        while (j < jsonText.length && /[0-9eE+\-.]/.test(jsonText[j])) j += 1;
        out += jsonText.slice(start, j);
      } else {
        const token = jsonText.slice(start, j);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      i = j;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function parseJsonPreservingLargeInts(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readWrapped(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJsonPreservingLargeInts(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resource = parseJsonPreservingLargeInts(
    zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"),
    largeNumbers,
  );
  const data = parseJsonPreservingLargeInts(resource.Data, largeNumbers);
  return { wrapper, resource, data, largeNumbers };
}

function ensureListExportArrays(data) {
  for (const item of [data?.Item, ...(Array.isArray(data?.Childs) ? data.Childs : [])].filter(Boolean)) {
    if (!Array.isArray(item.Defs)) item.Defs = [];
    if (!Array.isArray(item.Layouts)) item.Layouts = [];
  }
}

function writeWrappedYap(wrapper, resource, data, outputPath) {
  ensureListExportArrays(data);
  const nextResource = { ...resource, Data: JSON.stringify(data) };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(nextResource), "utf8")).toString("base64");
  const nextWrapper = { ...wrapper, Resource: `${GZIP_PREFIX}${compressed}` };
  fs.writeFileSync(outputPath, `${JSON.stringify(nextWrapper, null, 2)}\n`, "utf8");
}

function replaceDeep(value, replacements) {
  if (typeof value === "string") {
    let out = value;
    for (const [from, to] of replacements) out = out.split(from).join(to);
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceDeep(child, replacements)]));
  }
  return value;
}

function appCreationNoRule(prefix) {
  return {
    Prefix: `${prefix}_{date}_{index}`,
    StartIndex: 1,
    CustomLength: 8,
    AutoIncrement: 1,
  };
}

function renameFieldReferences(value, renames) {
  if (typeof value === "string") {
    let out = value;
    for (const [from, to] of renames) {
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(`(^|[^A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), `$1${to}`);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map((item) => renameFieldReferences(item, renames));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renameFieldReferences(child, renames)]));
  }
  return value;
}

function synchronizeFieldIndexNames(listItem, linkedObjects = []) {
  const fields = Array.isArray(listItem?.Defs) ? listItem.Defs : [];
  const names = new Set(fields.map((field) => String(field.FieldName || "")).filter(Boolean));
  const renames = [];
  for (const field of fields) {
    const fieldName = String(field.FieldName || "");
    const fieldIndex = Number(field.FieldIndex);
    if (!fieldName || fieldName === "Title" || !Number.isInteger(fieldIndex) || fieldIndex <= 0) continue;
    const suffix = fieldName.match(/(\d+)$/);
    if (suffix && Number(suffix[1]) === fieldIndex) continue;
    const prefix = fieldName.replace(/\d+$/, "") || String(field.FieldType || "Text");
    const nextName = `${prefix}${fieldIndex}`;
    if (names.has(nextName) && nextName !== fieldName) {
      throw new Error(`Cannot synchronize ${fieldName} to ${nextName}; target field name already exists.`);
    }
    names.delete(fieldName);
    names.add(nextName);
    renames.push([fieldName, nextName]);
    field.FieldName = nextName;
  }
  return {
    renames,
    linkedObjects: renames.length ? linkedObjects.map((entry) => renameFieldReferences(entry, renames)) : linkedObjects,
  };
}

function shapeType(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function renameShape(shape, id, name, x, y) {
  const next = clone(shape);
  next.id = id;
  next.resourceid = id;
  next.properties = { ...(next.properties || {}), name };
  next.incoming = [];
  next.outgoing = [];
  next.position = { x, y };
  delete next.bounds;
  next.dockers = [];
  return next;
}

function sequenceFlow(id, sourceId, targetId, name) {
  return {
    resourceid: id,
    id,
    stencil: { id: "SequenceFlow" },
    properties: { linetype: "rounded", name },
    dockers: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
    source: { id: sourceId, resourceid: sourceId },
    target: { id: targetId, resourceid: targetId },
  };
}

function relinkLinearWorkflow(def, orderedNodes) {
  const nodes = orderedNodes.map((node) => {
    const next = clone(node);
    next.incoming = [];
    next.outgoing = [];
    return next;
  });
  const flows = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const source = nodes[i];
    const target = nodes[i + 1];
    const flowId = `cw_flow_${String(i + 1).padStart(2, "0")}`;
    flows.push(sequenceFlow(flowId, source.id, target.id, `Sequence flow ${i + 1}`));
    source.outgoing.push({ id: flowId, resourceid: flowId });
    target.incoming.push({ id: flowId, resourceid: flowId });
  }
  return {
    ...def,
    childshapes: [...flows, ...nodes],
    graphposition: { x: 0, y: 0, width: Math.max(1200, 420 + nodes.length * 300), height: 760 },
    graphzoom: 0.7,
  };
}

function buildBaseApproval(args, tempDir) {
  const tempApprovalPath = path.join(tempDir, "combined-approval-base.yap");
  execFileSync(process.execPath, [
    "generate-assignment-task-assignee-runtime-baseline.mjs",
    "--source",
    "/Users/Renger/Downloads/Test ABC (1).yap",
    "--out",
    tempApprovalPath,
    "--family",
    args.family,
    "--form-key",
    args.approvalKey,
  ], { stdio: "pipe" });
  return readWrapped(tempApprovalPath);
}

function sourceApprovalReplacements(sourceData, sourceResource, args) {
  const oldRootId = String(sourceData.Item?.ListModel?.ListID);
  const oldProcModelId = String(sourceData.Forms?.[0]?.ProcModelID);
  const newRootId = `${args.family}0010000000000000`;
  const newProcModelId = `${args.family}0040000000000001`;
  const replacements = [[oldRootId, newRootId], [oldProcModelId, newProcModelId], ["ABC", args.approvalKey]];
  for (const oldId of sourceResource.ReplaceIds || []) {
    if (String(oldId) !== oldRootId && String(oldId) !== oldProcModelId) replacements.push([String(oldId), newProcModelId]);
  }
  return replacements;
}

function appendApprovalCoverage(baseData, args) {
  const source = readWrapped(args.approvalSource);
  const replacements = sourceApprovalReplacements(source.data, source.resource, args);
  const sourceDef = JSON.parse(replaceDeep(source.data.Forms[0].DefResource, replacements));
  const sourceTasks = sourceDef.childshapes.filter((shape) => shapeType(shape) === "MultiAssignmentTask");
  const sourceStart = sourceDef.childshapes.find((shape) => shapeType(shape) === "StartNoneEvent");
  const def = JSON.parse(baseData.Forms[0].DefResource);
  const start = def.childshapes.find((shape) => shapeType(shape) === "StartNoneEvent");
  const end = def.childshapes.find((shape) => shapeType(shape) === "EndNoneEvent");
  const existingTasks = def.childshapes.filter((shape) => shapeType(shape) === "MultiAssignmentTask");
  if (!start || !end || existingTasks.length < 10 || sourceTasks.length < 10 || !sourceStart) {
    throw new Error("Missing expected approval workflow baseline or source shapes.");
  }

  start.properties = {
    ...(start.properties || {}),
    ...clone(sourceStart.properties || {}),
    name: "Start",
  };

  const extraSpecs = [
    { sourceIndex: 1, id: "cw_assignment_complete", name: "Complete Task", x: 400 + existingTasks.length * 300, y: 260 },
    { sourceIndex: 5, id: "cw_assignment_due_hour", name: "Due Date Hours", x: 0, y: 260 },
    { sourceIndex: 8, id: "cw_assignment_due_days", name: "Due Date Days", x: 0, y: 260 },
    { sourceIndex: 7, id: "cw_assignment_due_minutes", name: "Due Date Minutes", x: 0, y: 260, overrides: { duedatetype: "minute", duedatedefinition: 30 } },
    { sourceIndex: 6, id: "cw_assignment_due_reminders", name: "Due Date Reminder Rules", x: 0, y: 260 },
  ];
  const extraTasks = extraSpecs.map((spec, index) => {
    const task = renameShape(sourceTasks[spec.sourceIndex], spec.id, spec.name, 400 + (existingTasks.length + index) * 300, 260);
    task.properties = {
      ...(task.properties || {}),
      ...(spec.overrides || {}),
      name: spec.name,
    };
    return task;
  });
  const ordered = [
    renameShape(start, "cw_start", "Start", 80, 260),
    ...existingTasks.map((task, index) => renameShape(task, task.id, task.properties?.name || `Assignment ${index + 1}`, 400 + index * 300, 260)),
    ...extraTasks,
    renameShape(end, "cw_end", "End", 400 + (existingTasks.length + extraTasks.length) * 300, 260),
  ];
  const nextDef = relinkLinearWorkflow(def, ordered);
  nextDef.defkey = args.approvalKey;
  nextDef.ext = {
    ...(nextDef.ext || {}),
    combinedRuntimeBaseline: {
      approvalStartSettings: "from Test ABC (3).yap",
      appendedDesignerTasks: extraSpecs.map((spec) => spec.name),
      emailDelivery: "not tested",
    },
  };
  baseData.Forms[0].Name = "Workflow Action Approval Test";
  baseData.Forms[0].Description = "Combined workflow action runtime baseline approval form.";
  baseData.Forms[0].NoRule = appCreationNoRule(args.approvalKey);
  baseData.Forms[0].DefResource = JSON.stringify(nextDef);
}

function buildListReplacements(listData, listResource, args) {
  const oldIds = new Set((listResource.ReplaceIds || []).map(String));
  oldIds.add(String(listData.Item?.ListModel?.ListID));
  oldIds.add(String(listData.Forms?.[0]?.ProcModelID));
  const oldSorted = [...oldIds].filter(Boolean).sort();
  const newListId = `${args.family}0020000000000000`;
  const newWorkflowId = `${args.family}0050000000000001`;
  const replacements = [];
  const newIds = new Set([newListId, newWorkflowId]);
  let counter = 10;
  for (const oldId of oldSorted) {
    let nextId = `${args.family}006${String(counter).padStart(10, "0")}`;
    if (oldId === String(listData.Item?.ListModel?.ListID)) nextId = newListId;
    if (oldId === String(listData.Forms?.[0]?.ProcModelID)) nextId = newWorkflowId;
    replacements.push([oldId, nextId]);
    newIds.add(nextId);
    counter += 1;
  }
  replacements.push(["PSabc", args.dataWorkflowKey]);
  replacements.push(["PS abc", "Purchase Requests Runtime Workflow"]);
  replacements.push(["Purchase Requests", "Purchase Requests Runtime Test"]);
  return { replacements, newListId, newWorkflowId, newIds: [...newIds].sort() };
}

function appendDataListWorkflow(baseResource, baseData, args) {
  const listSource = readWrapped(args.listSource);
  const { replacements, newListId, newWorkflowId, newIds } = buildListReplacements(listSource.data, listSource.resource, args);
  const rootId = `${args.family}0010000000000000`;
  const child = replaceDeep(clone(listSource.data.Item), replacements);
  const workflow = replaceDeep(clone(listSource.data.Forms[0]), replacements);

  child.ListModel.Title = "Purchase Requests Runtime Test";
  child.ListModel.Description = "Data-list workflow action runtime baseline list.";
  child.ListModel.CustomType = `ListSite_${rootId}`;
  child.ListModel.Type = 1;
  child.ListModel.ListType = child.ListModel.ListType ?? 1;
  child.FlowMappings = (child.FlowMappings || []).map((mapping) => ({
    ...mapping,
    Title: "Purchase Requests Runtime Workflow",
    DefKey: args.dataWorkflowKey,
    FieldName: null,
    Setting: JSON.stringify({ NewTrigger: true }),
  }));
  child.ListDatas = {};

  workflow.Name = "Purchase Requests Runtime Workflow";
  workflow.Key = args.dataWorkflowKey;
  workflow.ListID = newListId;
  workflow.ProcModelID = newWorkflowId;
  workflow.Description = "Data-list workflow action runtime baseline.";
  workflow.Settings = null;
  workflow.Deployed = false;
  const listDef = JSON.parse(workflow.DefResource);
  listDef.defkey = args.dataWorkflowKey;
  listDef.ProcModelListID = newWorkflowId;
  listDef.AppListSetID = rootId;
  listDef.ProcModelListSetID = rootId;
  listDef.graphzoom = 0.85;
  workflow.DefResource = JSON.stringify(listDef);

  const sync = synchronizeFieldIndexNames(child, [workflow]);
  const syncedChild = sync.renames.length ? renameFieldReferences(child, sync.renames) : child;
  const [syncedWorkflow] = sync.linkedObjects;

  baseData.Childs = [...(baseData.Childs || []), syncedChild];
  baseData.Forms = [...(baseData.Forms || []), syncedWorkflow];
  baseResource.ReplaceIds = [...new Set([...(baseResource.ReplaceIds || []).map(String), ...newIds])];
  baseResource.FormKeys = [...new Set([...(baseResource.FormKeys || []), args.approvalKey, args.dataWorkflowKey])];

  const layout = JSON.parse(baseData.Item.ListModel.LayoutView || "{\"sortVer\":1,\"sort\":[]}");
  layout.sort = Array.isArray(layout.sort) ? layout.sort : [];
  layout.sort.push({
    AppID: 41,
    ListID: newListId,
    ListSetID: rootId,
    Type: 1,
    IsHidden: false,
    Title: "Purchase Requests Runtime Test",
  });
  baseData.Item.ListModel.LayoutView = JSON.stringify(layout);
}

function ensureRootAppPage(baseResource, baseData, args) {
  const rootId = `${args.family}0010000000000000`;
  const layoutId = `${args.family}0030000000000001`;
  const title = "Workflow Actions Overview";
  if (!Array.isArray(baseData.Item.Layouts)) baseData.Item.Layouts = [];
  if (baseData.Item.Layouts.some((layout) => layout.Type === 103)) return;
  const pageResource = {
    children: [
      {
        id: "workflow-actions-runtime-main",
        type: "container",
        label: "Container",
        displayLabel: true,
        attrs: {
          style: { direction: [null, "column"], gap: [null, "--sp--s4"] },
          common: { padding: { t: [null, "--sp--s4"], r: [null, "--sp--s4"], b: [null, "--sp--s4"], l: [null, "--sp--s4"] } },
        },
        children: [
          {
            id: "workflow-actions-runtime-title",
            type: "heading",
            label: "Text",
            displayLabel: true,
            attrs: { headc: { title: { value: title, variable: null } }, heads: { ty: [null, "xl-semibold"] } },
            children: [],
            nv_label: "Page title",
          },
          {
            id: "workflow-actions-runtime-note",
            type: "heading",
            label: "Text",
            displayLabel: true,
            attrs: {
              headc: {
                title: {
                  value: "Open the approval form and data list from navigation to inspect workflow action configuration. Email delivery and task routing are intentionally out of scope until safe assignees are selected.",
                  variable: null,
                },
              },
              heads: { ty: [null, "s-regular"] },
            },
            children: [],
            nv_label: "Runtime note",
          },
        ],
        nv_label: "Main",
      },
    ],
    attrs: { hideHeaderAll: true },
    title,
    ver: 1,
    exts: [],
    filterVars: [],
    tempVars: [],
  };
  baseData.Item.Layouts.push({
    LayoutID: layoutId,
    ListID: rootId,
    Type: 103,
    Title: title,
    LayoutView: null,
    AppID: 41,
    TenantID: baseData.Item.ListModel.TenantID,
    Created: baseData.Item.ListModel.Created,
    Modified: baseData.Item.ListModel.Modified,
    CreatedBy: baseData.Item.ListModel.CreatedBy,
    ModifiedBy: baseData.Item.ListModel.ModifiedBy,
    Ext1: null,
    Ext2: "{\"src\":true}",
    Ext3: null,
    IsDefault: false,
    IsItemPerm: false,
    LayoutInResources: [
      {
        ID: layoutId,
        RefId: layoutId,
        Resource: JSON.stringify(pageResource),
      },
    ],
  });
  baseResource.ReplaceIds = [...new Set([...(baseResource.ReplaceIds || []).map(String), layoutId])];
}

function main() {
  const args = parseArgs(process.argv);
  const tempDir = path.resolve("tmp/workflow-actions-combined-baseline");
  fs.mkdirSync(tempDir, { recursive: true });

  const { wrapper, resource, data } = buildBaseApproval(args, tempDir);
  const title = "Workflow Actions Runtime Baseline";
  wrapper.Title = title;
  wrapper.Description = "Combined focused workflow-action runtime baseline.";
  data.Item.ListModel.Title = title;
  data.Item.ListModel.Description = "Approval form and data-list workflow action runtime baseline.";

  appendApprovalCoverage(data, args);
  appendDataListWorkflow(resource, data, args);
  ensureRootAppPage(resource, data, args);

  writeWrappedYap(wrapper, resource, data, args.out);
  console.log(JSON.stringify({
    output: path.resolve(args.out),
    title,
    approvalFormKey: args.approvalKey,
    dataListWorkflowKey: args.dataWorkflowKey,
    approvalAssignmentTasks: JSON.parse(data.Forms[0].DefResource).childshapes.filter((shape) => shapeType(shape) === "MultiAssignmentTask").length,
    dataListWorkflows: data.Forms.filter((form) => form.WorkflowType === 1).length,
    childLists: data.Childs.length,
    generatedPackageIgnoredByGit: true,
    emailDelivery: "not tested",
  }, null, 2));
}

main();
