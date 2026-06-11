#!/usr/bin/env node

import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";

const GZIP_PREFIX = "[______gizp______]";
const LARGE_INTEGER_RE = /^-?\d{16,}$/;
const DEFAULT_TITLE = "Scheduled Workflow Safe Runtime Baseline";
const DEFAULT_DESCRIPTION = "Safe generated Scheduled Workflow baseline for import/open/designer runtime testing without real email or AI execution.";
const DEFAULT_ICON = JSON.stringify({ b: "#E6F0FF", i: "fa-regular fa-calendar-clock", c: "#0065FF" });

function usage() {
  console.error([
    "Usage:",
    "  node generate-scheduled-workflow-safe-runtime-baseline.mjs --source <source.yap> --out <output.yap>",
    "",
    "The source export is decoded read-only. The generated output is a sanitized package with fresh local IDs,",
    "a far-future non-deployed Scheduled Workflow, a fake test recipient, and no external connections.",
  ].join("\n"));
  process.exit(1);
}

function parseArgs(argv) {
  const args = { source: null, out: "scheduled-workflow-safe-runtime-baseline.v1.yap" };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") args.source = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else usage();
  }
  if (!args.source || !args.out) usage();
  return args;
}

function quoteLargeIntegers(jsonText, largeNumbers) {
  let out = "";
  let index = 0;
  let inString = false;
  let escaped = false;
  while (index < jsonText.length) {
    const char = jsonText[index];
    if (inString) {
      out += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      index += 1;
      continue;
    }
    if (char === "\"") {
      inString = true;
      out += char;
      index += 1;
      continue;
    }
    if (char === "-" || (char >= "0" && char <= "9")) {
      const start = index;
      let end = index;
      if (jsonText[end] === "-") end += 1;
      while (end < jsonText.length && jsonText[end] >= "0" && jsonText[end] <= "9") end += 1;
      if (jsonText[end] === "." || jsonText[end] === "e" || jsonText[end] === "E") {
        while (end < jsonText.length && /[0-9eE+\-.]/.test(jsonText[end])) end += 1;
        out += jsonText.slice(start, end);
      } else {
        const token = jsonText.slice(start, end);
        if (LARGE_INTEGER_RE.test(token)) {
          largeNumbers.add(token);
          out += `"${token}"`;
        } else {
          out += token;
        }
      }
      index = end;
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

function parseJson(text, largeNumbers) {
  return JSON.parse(quoteLargeIntegers(text, largeNumbers));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function decodeYap(sourcePath) {
  const largeNumbers = new Set();
  const wrapper = parseJson(fs.readFileSync(sourcePath, "utf8"), largeNumbers);
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error("Source must be a Yeeflow .yap wrapper with gzip Resource payload.");
  }
  const resourceText = zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8");
  const resource = parseJson(resourceText, largeNumbers);
  const data = parseJson(resource.Data, largeNumbers);
  return { wrapper, resource, data };
}

function makeIdFactory() {
  const prefix = BigInt("2062000000000000000") + BigInt(crypto.randomInt(100000, 999999));
  let next = 1n;
  return () => String(prefix + next++);
}

function mapIds(resource, extraIds = []) {
  const nextId = makeIdFactory();
  const mapping = new Map();
  for (const id of [...asArray(resource.ReplaceIds), ...extraIds]) {
    const key = String(id);
    if (!mapping.has(key)) mapping.set(key, nextId());
  }
  return mapping;
}

function replaceAllIds(value, mapping) {
  let text = JSON.stringify(value);
  for (const [oldId, newId] of mapping.entries()) {
    text = text.split(oldId).join(newId);
  }
  return JSON.parse(text);
}

function parseObjectJson(value) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function stringifyStable(value) {
  return JSON.stringify(value);
}

function collectWorkflowStringIds(def) {
  const ids = new Set();
  for (const shape of asArray(def.childshapes)) {
    for (const key of ["id", "resourceid"]) if (shape[key]) ids.add(String(shape[key]));
    for (const ref of [...asArray(shape.incoming), ...asArray(shape.outgoing)]) {
      if (ref?.id) ids.add(String(ref.id));
      if (ref?.resourceid) ids.add(String(ref.resourceid));
    }
    for (const ref of [shape.source, shape.target]) {
      if (ref?.id) ids.add(String(ref.id));
      if (ref?.resourceid) ids.add(String(ref.resourceid));
    }
  }
  for (const page of asArray(def.pageurls)) if (page.id) ids.add(String(page.id));
  return [...ids];
}

function freshWorkflowId(oldId, index) {
  if (/^[0-9a-f-]{36}$/i.test(oldId)) return crypto.randomUUID();
  if (/^s_\d+$/.test(oldId)) return `s_${Date.now().toString().slice(-5)}${crypto.randomInt(100000, 999999)}${index}`;
  return `swrt_${crypto.randomUUID()}`;
}

function replaceWorkflowStringIds(def) {
  const ids = collectWorkflowStringIds(def);
  const mapping = new Map(ids.map((id, index) => [id, freshWorkflowId(id, index)]));
  let text = JSON.stringify(def);
  for (const [oldId, newId] of mapping.entries()) text = text.split(oldId).join(newId);
  return JSON.parse(text);
}

function expressionButton(variableId, label) {
  return `<input type="button" data="\${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;${variableId}&quot;}}" expr="__" tabindex="-1" value="Workflow Variables:${label}">`;
}

function buildSafePackage(sourcePath) {
  const { wrapper, resource, data } = decodeYap(sourcePath);
  const daily = asArray(data.Forms).find((form) => form.Name === "Daily information update" || form.Key === "AS-DIU");
  if (!daily) throw new Error("Source export does not contain Daily information update Scheduled Workflow.");
  const emailAgent = asArray(asArray(data.OtherModules).find((module) => module.Type === "Agents")?.Data)
    .find((item) => item.Name === "Email generation");
  if (!emailAgent) throw new Error("Source export does not contain Email generation AI Agent.");

  const extraIds = [daily.ProcModelID, emailAgent.ID].filter(Boolean);
  const idMap = mapIds(resource, extraIds);
  const generated = replaceAllIds(structuredClone(data), idMap);
  const mappedResource = replaceAllIds(structuredClone(resource), idMap);

  const root = generated.Item.ListModel;
  root.Title = DEFAULT_TITLE;
  root.Description = DEFAULT_DESCRIPTION;
  root.IconUrl = DEFAULT_ICON;
  root.Created = "2026-05-19 00:00:00";
  root.Modified = "2026-05-19 00:00:00";

  const rootLayoutView = parseObjectJson(root.LayoutView);
  rootLayoutView.sort = asArray(rootLayoutView.sort).map((item) => {
    if (Number(item.Type) === 103) return { ...item, Title: "Runtime Baseline", DisplayName: "Overview" };
    if (Number(item.Type) === 1) return { ...item, Title: "Runtime Ideas", DisplayName: "Runtime Ideas" };
    return item;
  });
  root.LayoutView = stringifyStable(rootLayoutView);

  const rootLayout = generated.Item.Layouts?.[0];
  if (rootLayout) {
    rootLayout.Title = "Runtime Baseline";
    rootLayout.Description = "Safe Scheduled Workflow runtime baseline overview.";
    const pageResource = parseObjectJson(rootLayout.LayoutInResources?.[0]?.Resource);
    if (pageResource) {
      pageResource.title = "Runtime Baseline";
      replacePageText(pageResource, "AI Agent and Copilot Local Resource Baseline", DEFAULT_TITLE);
      replacePageText(pageResource, "Credential-free baseline for local list access by one AI Agent and one Copilot.", DEFAULT_DESCRIPTION);
      rootLayout.LayoutInResources[0].Resource = stringifyStable(pageResource);
    }
  }

  const list = generated.Childs?.[0];
  if (list) {
    list.ListModel.Title = "Runtime Ideas";
    list.ListModel.Description = "Harmless local records for Scheduled Workflow designer validation.";
    list.ListModel.ListType = list.ListModel.ListType ?? list.ListModel.Type ?? 1;
    const rows = Object.values(list.ListDatas || {});
    if (rows[0]) {
      rows[0].Title = "Improve onboarding checklist";
      rows[0].Text1 = "Process";
      rows[0].Text2 = "Create a simple checklist for new idea review.";
      rows[0].Text3 = "Cleaner handoff for reviewers";
      rows[0].Text4 = "Draft";
      rows[0].Bit1 = "1";
    }
    if (rows[1]) {
      rows[1].Title = "Summarize safe weekly themes";
      rows[1].Text1 = "Automation";
      rows[1].Text2 = "Prepare a non-sensitive weekly theme summary from local sample records.";
      rows[1].Text3 = "Faster review preparation";
      rows[1].Text4 = "Review";
      rows[1].Bit1 = "0";
    }
  }

  generated.Forms = [replaceAllIds(structuredClone(daily), idMap)];
  const workflow = generated.Forms[0];
  workflow.Name = "Safe scheduled idea summary";
  workflow.Key = "SWRT";
  workflow.Description = "Safe non-executed Scheduled Workflow baseline for designer rendering checks.";
  workflow.Deployed = false;
  workflow.WorkflowType = 3;
  workflow.ListID = 0;
  workflow.Settings = stringifyStable({
    TimeZone: "Singapore Standard Time",
    Times: ["11:59PM"],
    StartDate: "2099-01-01",
    EndDate: "2099-01-31",
    Frequency: "1",
    Interval: 1,
    Values: ["1", "3"],
  });

  let def = parseObjectJson(workflow.DefResource);
  def = replaceWorkflowStringIds(def);
  def.defkey = "SWRT";
  def.workflowType = 3;
  def.name = "Safe scheduled idea summary";
  def.title = "Safe scheduled idea summary";
  def.variables = {
    basic: [
      { idx: crypto.randomUUID(), id: "QueryItems", name: "Query Items", type: "text", editable: true },
      { idx: crypto.randomUUID(), id: "QueryAmount", name: "Query Amount", type: "number", editable: true, value: null },
      { idx: crypto.randomUUID(), id: "EmailBody", name: "Body Content", type: "text", editable: true },
      { idx: crypto.randomUUID(), id: "EmailSubject", name: "Subject", type: "text", editable: true },
    ],
    listref: [],
    filter: [],
  };
  for (const page of asArray(def.pageurls)) page.title = "Safe scheduled idea summary";
  for (const shape of asArray(def.childshapes)) {
    const type = shape.stencil?.id;
    const props = shape.properties || {};
    if (type === "QueryData") {
      props.name = "Query Runtime Ideas";
      props.filters = [];
      props.sorts = [];
      props.result = {
        ...props.result,
        type: "multiple",
        pageIndex: 1,
        pageSize: 25,
        listName: "QueryItems",
        vartype: "text",
        listParent: "__variables_",
        totalCount: "QueryAmount",
        querycount_prefix: "__variables_",
      };
    }
    if (type === "AI") {
      props.name = "AI Draft safe email content";
      props.type = "agent";
      props.user = null;
      props.data = {
        AppID: 41,
        ListSetID: generated.Item.ListModel.ListID,
        AgentID: idMap.get(String(emailAgent.ID)),
      };
      props.inputVariables = [
        {
          id: "QueryItems",
          type: "text",
          description: "Safe local Runtime Ideas query result JSON.",
          value: { type: 1, value: { exprType: "variable", valueType: "text", id: "QueryItems", type: "expr" } },
        },
      ];
      props.outputVariables = [
        { id: "Subject", type: "text", description: "Generated subject for safe test email draft.", value: { prefix: "__variables_", value: "EmailSubject" } },
        { id: "Body", type: "richtext", description: "Generated body for safe test email draft.", value: { prefix: "__variables_", value: "EmailBody" } },
      ];
      props.context = { enabled: true, selected: { application: true, workflowInstance: true, workflowVariables: true, workflowTasks: true } };
    }
    if (type === "MailTask") {
      props.name = "Review Draft Email Configuration";
      props.to = "workflow.safe.test@example.com";
      props.cc = "";
      props.subject = expressionButton("EmailSubject", "Subject");
      props.html = `<p>${expressionButton("EmailBody", "Body Content")}</p>`;
    }
    shape.properties = props;
  }
  workflow.DefResource = stringifyStable(def);

  const agentsModule = asArray(generated.OtherModules).find((module) => module.Type === "Agents");
  if (agentsModule) {
    agentsModule.Data = [replaceAllIds(structuredClone(emailAgent), idMap)];
    const agent = agentsModule.Data[0];
    agent.Name = "Email generation";
    agent.Description = "Safe local Agent for Scheduled Workflow designer rendering. Do not execute during import/open testing.";
    agent.Components = [];
    const settings = parseObjectJson(agent.Settings);
    settings.Prompt = [
      "Role: Safe Email Draft Generator",
      "",
      "Use only the provided QueryItems JSON from local sample records.",
      "Draft a short email subject and an HTML body for review.",
      "Do not send email, call external systems, or use private data.",
    ].join("\n");
    settings.InputVariables = [{ id: "QueryItems", type: "text", description: "Safe local Runtime Ideas query result JSON." }];
    settings.OutputVariables = [
      { id: "Subject", type: "text", description: "Generated subject for the draft email." },
      { id: "Body", type: "richtext", description: "Generated inline-HTML body for the draft email." },
    ];
    agent.Settings = stringifyStable(settings);
    agent.Draft = agent.Settings;
  }

  mappedResource.FormKeys = ["SWRT"];
  mappedResource.Data = stringifyStable(generated);
  mappedResource.ReplaceIds = [
    generated.Item.ListModel.ListID,
    rootLayout?.LayoutID,
    ...asArray(generated.Childs).flatMap((child) => [
      child.ListModel?.ListID,
      ...asArray(child.Defs).map((field) => field.FieldID),
      ...asArray(child.Layouts).map((layout) => layout.LayoutID),
      ...Object.keys(child.ListDatas || {}),
    ]),
    workflow.ProcModelID,
    ...asArray(agentsModule?.Data).flatMap((agent) => [agent.ID, ...asArray(agent.Components).map((component) => component.ID)]),
  ].filter(Boolean).map(String);

  const finalResourceText = stringifyStable(mappedResource);
  const finalWrapper = {
    Title: DEFAULT_TITLE,
    Description: DEFAULT_DESCRIPTION,
    IconUrl: DEFAULT_ICON,
    IsListSet: wrapper.IsListSet !== undefined ? wrapper.IsListSet : true,
    Resource: `${GZIP_PREFIX}${zlib.gzipSync(finalResourceText).toString("base64")}`,
  };
  return { wrapper: finalWrapper, data: generated, resource: mappedResource };
}

function replacePageText(node, from, to) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item) => replacePageText(item, from, to));
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (value === from) node[key] = to;
    else replacePageText(value, from, to);
  }
}

const args = parseArgs(process.argv);
const result = buildSafePackage(args.source);
fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
fs.writeFileSync(args.out, `${JSON.stringify(result.wrapper)}\n`, "utf8");
console.log(JSON.stringify({
  status: "pass",
  output: path.resolve(args.out),
  title: DEFAULT_TITLE,
  scheduledWorkflows: result.data.Forms.length,
  dataLists: result.data.Childs.length,
  aiResources: asArray(asArray(result.data.OtherModules).find((module) => module.Type === "Agents")?.Data).length,
  replaceIds: result.resource.ReplaceIds.length,
}, null, 2));
