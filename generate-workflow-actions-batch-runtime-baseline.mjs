import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;

const DEFAULT_SOURCE = "/Users/Renger/Downloads/Workflow Actions Runtime Baseline (6)_Signal event.yap";
const DEFAULT_OUTPUT = "workflow-actions-batch-runtime-baseline.v1.yap";

const FAMILY = "836";
const APP_TITLE = "Workflow Actions Batch Runtime Baseline";
const APPROVAL_KEY = "WABRT";
const DATA_WORKFLOW_KEY = "WABDL";
const TARGET_APPROVAL_KEY = "WABTGT";

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node generate-workflow-actions-batch-runtime-baseline.mjs [--source input.yap] [--out output.yap]",
    "",
    "Builds a focused Claim Task, Set variable, Set data list, and Signal event designer/publish runtime baseline.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { source: DEFAULT_SOURCE, out: DEFAULT_OUTPUT };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") args.source = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else usage();
  }
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers = new Set()) {
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

function parseJson(text, largeNumbers = new Set()) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readWrapped(inputPath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(inputPath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resource = parseJson(
    zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"),
    largeNumbers,
  );
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function ensureListExportArrays(data) {
  for (const item of [data?.Item, ...(Array.isArray(data?.Childs) ? data.Childs : [])].filter(Boolean)) {
    if (!Array.isArray(item.Defs)) item.Defs = [];
    if (!Array.isArray(item.Layouts)) item.Layouts = [];
  }
}

function writeWrapped(outputPath, wrapper, resource, data) {
  ensureListExportArrays(data);
  const nextResource = { ...resource, Data: JSON.stringify(data) };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(nextResource), "utf8")).toString("base64");
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...wrapper, Resource: `${GZIP_PREFIX}${compressed}` }, null, 2)}\n`);
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

function synchronizeFieldIndexNames(listItem) {
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
  return renames;
}

function stencilId(shape) {
  return shape?.stencil?.id || shape?.stencil || shape?.type || "unknown";
}

function shapeId(shape) {
  return String(shape?.resourceid || shape?.id || "");
}

function node(def, id) {
  const found = (def.childshapes || []).find((shape) => shapeId(shape) === id);
  if (!found) throw new Error(`Missing workflow shape ${id}`);
  return found;
}

function renameShape(shape, id, name, x, y, overrides = {}) {
  const next = clone(shape);
  next.id = id;
  next.resourceid = id;
  next.properties = { ...(next.properties || {}), ...overrides, name };
  next.incoming = [];
  next.outgoing = [];
  next.position = { x, y };
  next.dockers = [];
  delete next.bounds;
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

function connect(source, target, flowId, name) {
  const flow = sequenceFlow(flowId, source.id, target.id, name);
  source.outgoing.push({ id: flowId, resourceid: flowId });
  target.incoming.push({ id: flowId, resourceid: flowId });
  return flow;
}

function buildWorkflow(nodes, flowSpecs, width = 2400, height = 900) {
  const flows = flowSpecs.map(([source, target, id, name]) => connect(source, target, id, name));
  return { flows, nodes, graphposition: { x: 0, y: 0, width, height }, graphzoom: 0.72 };
}

function collectIdReplacements(resource) {
  const sourceIds = [...new Set((resource.ReplaceIds || []).map(String).filter(Boolean))].sort();
  const replacements = [];
  sourceIds.forEach((id, index) => replacements.push([id, `${FAMILY}${String(index + 1).padStart(13, "0")}`]));
  replacements.push(["Workflow Actions Runtime Baseline", APP_TITLE]);
  replacements.push(["Workflow Action Approval Test", "Workflow Action Batch Approval Test"]);
  replacements.push(["Purchase Requests Runtime Test", "Purchase Requests Batch Runtime Test"]);
  replacements.push(["Purchase Requests Runtime Workflow", "Purchase Requests Batch Runtime Workflow"]);
  replacements.push(["Products", "Products Batch Runtime Test"]);
  replacements.push(["Save Sub Items", "Save Sub Items Batch Runtime Test"]);
  replacements.push(["Another approval from", "Batch Variable Target Approval"]);
  replacements.push(["WARTB", APPROVAL_KEY]);
  replacements.push(["WADL1", DATA_WORKFLOW_KEY]);
  replacements.push(["ABC-ANO", TARGET_APPROVAL_KEY]);
  return replacements;
}

function parseDef(form) {
  return JSON.parse(form.DefResource);
}

function setDef(form, def) {
  form.DefResource = JSON.stringify(def);
}

function patchTitleFields(data) {
  const allRenames = [];
  for (const child of data.Childs || []) {
    child.ListModel.ListType = child.ListModel.ListType ?? 1;
    child.ListDatas = {};
    for (const field of child.Defs || []) {
      if (field.Type === "input_number") {
        try {
          const rules = field.Rules ? JSON.parse(field.Rules) : {};
          if (typeof rules["rounded-to"] === "string" && /^\d+$/.test(rules["rounded-to"])) {
            rules["rounded-to"] = Number(rules["rounded-to"]);
            field.Rules = JSON.stringify(rules);
          }
        } catch {
          // Keep export-backed rules if parsing fails.
        }
      }
      if (field.FieldName === "Title") {
        field.Status = 0;
        field.IsSystem = true;
        field.IsIndex = true;
        field.FieldIndex = 0;
      }
    }
    if (String(child.ListModel?.Title || "").includes("Purchase Requests")) {
      allRenames.push(...synchronizeFieldIndexNames(child));
    }
  }
  if (allRenames.length) {
    data.Forms = renameFieldReferences(data.Forms || [], allRenames);
    data.Item = renameFieldReferences(data.Item, allRenames);
    data.Childs = (data.Childs || []).map((child) => String(child.ListModel?.Title || "").includes("Purchase Requests") ? renameFieldReferences(child, allRenames) : child);
  }
}

function pruneApprovalWorkflow(form) {
  const def = parseDef(form);
  const start = renameShape(node(def, "cw_start"), "batch_start", "Start", 80, 300, {
    terminate: true,
    "terminate-conditions": null,
  });
  const claim = renameShape(node(def, "s_91456906250"), "batch_claim_approval", "Claim Task - candidate approval", 400, 300);
  const setCurrent = renameShape(node(def, "s_91462972242"), "batch_set_variable_current", "Set variable - current workflow", 760, 300);
  const setCustom = renameShape(node(def, "s_91463902022"), "batch_set_variable_custom", "Set variable - another approval workflow", 1120, 300);
  const add = renameShape(node(def, "s_91466507662"), "batch_set_data_add", "Set data list - add selected list", 1480, 300);
  const edit = renameShape(node(def, "s_91466507661"), "batch_set_data_edit", "Set data list - edit selected list", 1840, 300);
  const remove = renameShape(node(def, "s_91466507668"), "batch_set_data_remove", "Set data list - remove selected list", 2200, 300);
  const sublist = renameShape(node(def, "s_91467423279"), "batch_set_data_sublist", "Set data list - sub-list rows", 2560, 300);
  const end = renameShape(node(def, "cw_end"), "batch_end", "End", 2920, 300);
  const signal = renameShape(node(def, "s_91470730715"), "batch_signal_event", "Signal event", 80, 650);
  const cleanup = renameShape(node(def, "s_91470730716"), "batch_signal_cleanup", "Set data list - signal cleanup", 440, 650);

  const nodes = [start, claim, setCurrent, setCustom, add, edit, remove, sublist, end, signal, cleanup];
  const { flows, graphposition, graphzoom } = buildWorkflow(nodes, [
    [start, claim, "batch_flow_01", "Start to Claim"],
    [claim, setCurrent, "batch_flow_02", "Claim to current variables"],
    [setCurrent, setCustom, "batch_flow_03", "Current to custom variables"],
    [setCustom, add, "batch_flow_04", "Custom variables to add"],
    [add, edit, "batch_flow_05", "Add to edit"],
    [edit, remove, "batch_flow_06", "Edit to remove"],
    [remove, sublist, "batch_flow_07", "Remove to sub-list"],
    [sublist, end, "batch_flow_08", "Sub-list to End"],
    [signal, cleanup, "batch_signal_flow_01", "Signal to cleanup"],
    [cleanup, end, "batch_signal_flow_02", "Cleanup to End"],
  ], 3200, 920);

  def.childshapes = [...flows, ...nodes];
  def.graphposition = graphposition;
  def.graphzoom = graphzoom;
  def.defkey = APPROVAL_KEY;
  def.ext = {
    ...(def.ext || {}),
    batchRuntimeBaseline: {
      proofTarget: "designer-open-publish",
      execution: "not tested",
      actions: ["CandidateTask", "SetVariableTask", "ContentList", "SignalEvent"],
    },
  };
  setDef(form, def);
}

function pruneDataListWorkflow(form) {
  const def = parseDef(form);
  const start = renameShape(node(def, "c5626778-e233-49a0-9b78-5534dacf7a28"), "batch_dl_start", "Start", 80, 300);
  const claim = renameShape(node(def, "s_91456388509"), "batch_dl_claim", "Claim Task - data-list candidates", 420, 300);
  const setVar = renameShape(node(def, "s_91464001042"), "batch_dl_set_variable_current", "Set variable - list-field value", 760, 300);
  const current = renameShape(node(def, "s_91467617973"), "batch_dl_set_data_current", "Set data list - current list", 1100, 300);
  const select = renameShape(node(def, "s_91467617974"), "batch_dl_set_data_select", "Set data list - selected list", 1440, 300);
  const edit = renameShape(node(def, "s_91467617976"), "batch_dl_set_data_edit", "Set data list - selected edit", 1780, 300);
  const end = renameShape(node(def, "s_91381762765"), "batch_dl_end", "End", 2120, 300);
  const nodes = [start, claim, setVar, current, select, edit, end];
  const { flows, graphposition, graphzoom } = buildWorkflow(nodes, [
    [start, claim, "batch_dl_flow_01", "Start to Claim"],
    [claim, setVar, "batch_dl_flow_02", "Claim to variables"],
    [setVar, current, "batch_dl_flow_03", "Variables to current list"],
    [current, select, "batch_dl_flow_04", "Current to selected list"],
    [select, edit, "batch_dl_flow_05", "Selected add to edit"],
    [edit, end, "batch_dl_flow_06", "Edit to End"],
  ], 2400, 760);
  def.childshapes = [...flows, ...nodes];
  def.graphposition = graphposition;
  def.graphzoom = graphzoom;
  def.defkey = DATA_WORKFLOW_KEY;
  setDef(form, def);
}

function pruneTargetApproval(form) {
  const def = parseDef(form);
  def.defkey = TARGET_APPROVAL_KEY;
  setDef(form, def);
}

function normalizeNavigation(data) {
  const rootId = String(data.Item.ListModel.ListID);
  const purchase = data.Childs.find((child) => child.ListModel.Title === "Purchase Requests Batch Runtime Test");
  const products = data.Childs.find((child) => child.ListModel.Title === "Products Batch Runtime Test");
  const subItems = data.Childs.find((child) => child.ListModel.Title === "Save Sub Items Batch Runtime Test");
  const layout = {
    sortVer: 1,
    sort: [
      { AppID: 41, ListID: APPROVAL_KEY, ListSetID: rootId, Type: 105, IsHidden: false, Title: "Workflow Action Batch Approval Test" },
      { AppID: 41, ListID: purchase.ListModel.ListID, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Purchase Requests Batch Runtime Test" },
      { AppID: 41, ListID: products.ListModel.ListID, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Products Batch Runtime Test" },
      { AppID: 41, ListID: subItems.ListModel.ListID, ListSetID: rootId, Type: 1, IsHidden: false, Title: "Save Sub Items Batch Runtime Test" },
    ],
  };
  data.Item.ListModel.LayoutView = JSON.stringify(layout);
}

function removeReportAndScheduledResources(data) {
  data.Childs = (data.Childs || []).filter((child) =>
    ["Purchase Requests Batch Runtime Test", "Products Batch Runtime Test", "Save Sub Items Batch Runtime Test"].includes(child.ListModel?.Title),
  );
  data.Forms = (data.Forms || []).filter((form) =>
    ["Workflow Action Batch Approval Test", "Purchase Requests Batch Runtime Workflow", "Batch Variable Target Approval"].includes(form.Name),
  );
  data.DataReports = [];
  data.FormReports = [];
  data.FormNewReports = [];
}

function main() {
  const args = parseArgs(process.argv);
  const { wrapper, resource, data } = readWrapped(args.source);
  const replacements = collectIdReplacements(resource);
  const nextWrapper = replaceDeep(clone(wrapper), replacements);
  const nextResource = replaceDeep(clone(resource), replacements);
  const nextData = replaceDeep(clone(data), replacements);

  nextWrapper.Title = APP_TITLE;
  nextWrapper.Description = "Focused runtime baseline for Claim Task, Set variable, Set data list, and Signal event designer/open/publish proof.";
  nextData.Item.ListModel.Title = APP_TITLE;
  nextData.Item.ListModel.Description = "Designer/open/publish proof package. Workflow action execution, mutation, email, claim, recall, and terminate behavior are out of scope.";

  removeReportAndScheduledResources(nextData);
  patchTitleFields(nextData);

  const approval = nextData.Forms.find((form) => form.Name === "Workflow Action Batch Approval Test");
  const dataWorkflow = nextData.Forms.find((form) => form.Name === "Purchase Requests Batch Runtime Workflow");
  const targetApproval = nextData.Forms.find((form) => form.Name === "Batch Variable Target Approval");
  if (!approval || !dataWorkflow || !targetApproval) throw new Error("Missing expected forms after rename.");

  approval.Key = APPROVAL_KEY;
  approval.ListID = 0;
  approval.NoRule = appCreationNoRule(APPROVAL_KEY);
  approval.Description = "Approval workflow runtime baseline for Claim Task, Set variable, Set data list, and Signal event designer proof.";
  dataWorkflow.Key = DATA_WORKFLOW_KEY;
  targetApproval.Key = TARGET_APPROVAL_KEY;
  targetApproval.ListID = 0;
  targetApproval.NoRule = appCreationNoRule(TARGET_APPROVAL_KEY);
  targetApproval.Description = "Hidden target approval workflow used only for Set variable custom target designer proof.";

  pruneApprovalWorkflow(approval);
  pruneDataListWorkflow(dataWorkflow);
  pruneTargetApproval(targetApproval);
  normalizeNavigation(nextData);

  nextResource.FormKeys = [APPROVAL_KEY, DATA_WORKFLOW_KEY, TARGET_APPROVAL_KEY];
  nextResource.ReplaceIds = [...new Set(replacements.map(([, to]) => to))].filter((id) => /^\d{16,}$/.test(String(id)));

  writeWrapped(args.out, nextWrapper, nextResource, nextData);
  console.log(JSON.stringify({
    output: path.resolve(args.out),
    title: APP_TITLE,
    forms: nextData.Forms.map((form) => ({ name: form.Name, key: form.Key, workflowType: form.WorkflowType, listId: form.ListID })),
    childLists: nextData.Childs.map((child) => child.ListModel.Title),
    approvalWorkflowActions: JSON.parse(approval.DefResource).childshapes.reduce((acc, shape) => {
      const type = stencilId(shape);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    generatedPackageIgnoredByGit: true,
    runtimeExecution: "not tested",
  }, null, 2));
}

main();
