import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const GZIP_PREFIX = "[______gizp______]";
const DEFAULT_SOURCE = "/Users/Renger/Downloads/Test ABC (1).yap";
const DEFAULT_OUTPUT = "assignment-task-assignee-runtime-baseline.v2.yap";

function usage(exitCode = 1) {
  const message = [
    "Usage:",
    "  node generate-assignment-task-assignee-runtime-baseline.mjs [--source source.yap] [--out output.yap]",
    "",
    "Builds a focused runtime baseline from the export-proven Assignment Task assignee shapes.",
    "The generated .yap may contain tenant-local org references from the source export and must stay ignored.",
  ].join("\n");
  (exitCode === 0 ? console.log : console.error)(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) usage(0);
  const args = { source: DEFAULT_SOURCE, out: DEFAULT_OUTPUT, family: "734", formKey: "ATAR2" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") args.source = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
    else if (arg === "--family") args.family = argv[++i];
    else if (arg === "--form-key") args.formKey = argv[++i];
    else usage();
  }
  return args;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readWrappedYap(inputPath) {
  const wrapper = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (typeof wrapper.Resource !== "string" || !wrapper.Resource.startsWith(GZIP_PREFIX)) {
    throw new Error(`Input Resource must start with ${GZIP_PREFIX}`);
  }
  const resource = JSON.parse(
    zlib.gunzipSync(Buffer.from(wrapper.Resource.slice(GZIP_PREFIX.length), "base64")).toString("utf8"),
  );
  const data = JSON.parse(resource.Data);
  return { wrapper, resource, data };
}

function writeWrappedYap(wrapper, resource, data, outputPath) {
  const nextResource = {
    ...resource,
    Data: JSON.stringify(data),
  };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(nextResource), "utf8")).toString("base64");
  const nextWrapper = {
    ...wrapper,
    Resource: `${GZIP_PREFIX}${compressed}`,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(nextWrapper, null, 2)}\n`);
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

function sequenceFlow(id, sourceId, targetId, name, x1, y1, x2, y2) {
  return {
    resourceid: id,
    id,
    stencil: { id: "SequenceFlow" },
    properties: {
      linetype: "rounded",
      name,
    },
    dockers: [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ],
    source: { id: sourceId, resourceid: sourceId },
    target: { id: targetId, resourceid: targetId },
  };
}

function assignmentBy(task, predicate) {
  return (task.properties?.usertaskassignment || []).filter(predicate).map(clone);
}

function firstAssignmentBy(task, predicate) {
  const found = assignmentBy(task, predicate)[0];
  if (!found) throw new Error(`Missing expected assignment entry on ${task.id}`);
  return found;
}

function taskWithAssignments(template, id, name, assignments, extraProps = {}) {
  const next = renameShape(template, id, name, 420, 120);
  next.properties = {
    ...next.properties,
    ...extraProps,
    name,
    usertaskassignment: assignments.map(clone),
  };
  return next;
}

function buildBaseline(def) {
  const start = clone(def.childshapes.find((shape) => shapeType(shape) === "StartNoneEvent"));
  const end = clone(def.childshapes.find((shape) => shapeType(shape) === "EndNoneEvent"));
  const sourceTasks = def.childshapes.filter((shape) => shapeType(shape) === "MultiAssignmentTask");
  if (!start || !end || sourceTasks.length < 9) throw new Error("Expected start, end, and nine source Assignment Task nodes.");

  const task3 = sourceTasks[2];
  const task4 = sourceTasks[3];
  const task5 = sourceTasks[4];
  const task7 = sourceTasks[6];
  const task8 = sourceTasks[7];
  const task1 = sourceTasks[0];
  const task2 = sourceTasks[1];

  const directUsers = assignmentBy(task3, (item) => item.type === "user" && item.method === "direct");
  if (directUsers.length < 2) throw new Error("Expected at least two direct-user assignments in source task.");

  const taskSpecs = [
    {
      label: "Static User Assignment",
      id: "rt_assignment_static_user",
      task: taskWithAssignments(task3, "rt_assignment_static_user", "Static User Assignment", [directUsers[0]], {
        approveway: "allapprove",
        approvepercentage: 100,
        isenabledemail: false,
      }),
      proofTarget: "runtime-submit-safe-first-task",
    },
    {
      label: "Multiple Static Users Assignment",
      id: "rt_assignment_multiple_users",
      task: taskWithAssignments(task3, "rt_assignment_multiple_users", "Multiple Static Users Assignment", directUsers.slice(0, 2), {
        approveway: "allapprove",
        approvepercentage: 100,
        isenabledemail: false,
      }),
      proofTarget: "designer-open",
    },
    {
      label: "Direct Position Assignment",
      id: "rt_assignment_direct_position",
      task: taskWithAssignments(
        task3,
        "rt_assignment_direct_position",
        "Direct Position Assignment",
        [firstAssignmentBy(task3, (item) => item.type === "position" && item.method === "position")],
        { approveway: "anyapprove", approvepercentage: 100, isenabledemail: false },
      ),
      proofTarget: "designer-open",
    },
    {
      label: "Position By Department Assignment",
      id: "rt_assignment_position_department",
      task: taskWithAssignments(
        task5,
        "rt_assignment_position_department",
        "Position By Department Assignment",
        [firstAssignmentBy(task5, (item) => item.type === "position" && item.method === "positionorg")],
        { approveway: "custompercentage", approvepercentage: 60, isenabledemail: false },
      ),
      proofTarget: "designer-open",
    },
    {
      label: "Position By Location Assignment",
      id: "rt_assignment_position_location",
      task: taskWithAssignments(
        task7,
        "rt_assignment_position_location",
        "Position By Location Assignment",
        [firstAssignmentBy(task7, (item) => item.type === "position" && item.method === "positionloc")],
        { approveway: "allapprove", approvepercentage: 100, isenabledemail: false },
      ),
      proofTarget: "designer-open",
    },
    {
      label: "User Group Assignment",
      id: "rt_assignment_user_group",
      task: taskWithAssignments(
        task1,
        "rt_assignment_user_group",
        "User Group Assignment",
        [firstAssignmentBy(task1, (item) => item.type === "user" && item.method === "expression" && String(item.value).includes("usergroup"))],
        { approveway: "allapprove", approvepercentage: 100, isenabledemail: false },
      ),
      proofTarget: "designer-open",
    },
    {
      label: "Sequential Multiple Assignees",
      id: "rt_assignment_sequential",
      task: taskWithAssignments(task1, "rt_assignment_sequential", "Sequential Multiple Assignees", task1.properties.usertaskassignment || [], {
        approveway: "allapprove",
        approvepercentage: 100,
        issequential: true,
        isenabledemail: false,
      }),
      proofTarget: "designer-open",
    },
    {
      label: "Parallel Multiple Assignees",
      id: "rt_assignment_parallel",
      task: taskWithAssignments(task3, "rt_assignment_parallel", "Parallel Multiple Assignees", task3.properties.usertaskassignment || [], {
        approveway: "anyapprove",
        approvepercentage: 100,
        isenabledemail: false,
      }),
      proofTarget: "designer-open",
    },
    {
      label: "Any Process Approval Mode",
      id: "rt_assignment_anyprocess",
      task: taskWithAssignments(task2, "rt_assignment_anyprocess", "Any Process Approval Mode", task2.properties.usertaskassignment || [], {
        approveway: "anyprocess",
        approvepercentage: 100,
        isenabledemail: false,
      }),
      proofTarget: "designer-open",
    },
    {
      label: "Any Reject Approval Mode",
      id: "rt_assignment_anyreject",
      task: taskWithAssignments(task4, "rt_assignment_anyreject", "Any Reject Approval Mode", task4.properties.usertaskassignment || [], {
        approveway: "anyreject",
        approvepercentage: 100,
        isenabledemail: false,
      }),
      proofTarget: "designer-open",
    },
    {
      label: "Email Notification Config",
      id: "rt_assignment_email_config",
      task: taskWithAssignments(task8, "rt_assignment_email_config", "Email Notification Config", task8.properties.usertaskassignment || [], {
        approveway: "allapprove",
        approvepercentage: 100,
        isenabledemail: true,
      }),
      proofTarget: "designer-open-only-no-delivery",
    },
  ];

  start.id = "rt_start";
  start.resourceid = "rt_start";
  start.properties = { ...(start.properties || {}), name: "Start" };
  start.position = { x: 80, y: 260 };
  start.incoming = [];
  start.outgoing = [];

  end.id = "rt_end";
  end.resourceid = "rt_end";
  end.properties = { ...(end.properties || {}), name: "End" };
  end.position = { x: 80 + (taskSpecs.length + 1) * 320, y: 260 };
  end.incoming = [];
  end.outgoing = [];

  const tasks = taskSpecs.map((spec, index) => renameShape(spec.task, spec.id, spec.label, 400 + index * 320, 260));
  const nodes = [start, ...tasks, end];
  const flows = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const source = nodes[i];
    const target = nodes[i + 1];
    const flowId = `rt_flow_${String(i + 1).padStart(2, "0")}`;
    flows.push(sequenceFlow(flowId, source.id, target.id, `Sequence flow ${i + 1}`, 0, 0, 0, 0));
    source.outgoing = [...(source.outgoing || []), { id: flowId, resourceid: flowId }];
    target.incoming = [...(target.incoming || []), { id: flowId, resourceid: flowId }];
  }

  return {
    ...def,
    childshapes: [...flows, ...nodes],
    graphposition: {
      x: 0,
      y: 0,
      width: 80 + (taskSpecs.length + 2) * 320,
      height: 700,
    },
    graphzoom: 0.75,
    ext: {
      ...(def.ext || {}),
      runtimeBaseline: {
        purpose: "Assignment Task assignee routing focused baseline",
        generatedFrom: "Test ABC (1).yap",
        proofTargets: Object.fromEntries(taskSpecs.map((spec) => [spec.label, spec.proofTarget])),
      },
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const { wrapper, resource, data } = readWrappedYap(args.source);
  const oldRootId = data.Item?.ListModel?.ListID;
  const oldProcModelId = data.Forms?.[0]?.ProcModelID;
  if (!oldRootId || !oldProcModelId) throw new Error("Source export is missing expected app/form IDs.");

  const family = args.family;
  const formKey = args.formKey;
  const newRootId = `${family}0010000000000000`;
  const newProcModelId = `${family}0040000000000001`;
  const title = "Assignment Task Assignee Runtime Baseline V2";
  const generatedAt = "2026-05-23 00:00:00";
  const sourceReplaceIds = (resource.ReplaceIds || []).map(String);
  const replacements = [[String(oldRootId), newRootId]];
  for (const oldId of sourceReplaceIds) {
    if (oldId !== String(oldRootId)) replacements.push([oldId, newProcModelId]);
  }
  if (!replacements.some(([oldId]) => oldId === String(oldProcModelId))) {
    replacements.push([String(oldProcModelId), newProcModelId]);
  }
  replacements.push(["ABC", formKey]);

  const nextWrapper = {
    ...wrapper,
    Title: title,
    Description: "Focused Assignment Task assignee runtime baseline generated from export-proven shapes.",
  };
  const nextResource = replaceDeep(resource, replacements);
  nextResource.ReplaceIds = [newRootId, newProcModelId];
  nextResource.FormKeys = [formKey];

  let nextData = replaceDeep(data, replacements);
  nextData.Item.ListModel.Title = title;
  nextData.Item.ListModel.Description = "Focused Assignment Task assignee runtime baseline.";
  nextData.Item.ListModel.Created = generatedAt;
  nextData.Item.ListModel.Modified = generatedAt;
  nextData.Forms[0].Name = "Assignee Runtime Baseline";
  nextData.Forms[0].Key = formKey;
  nextData.Forms[0].ProcModelID = newProcModelId;
  nextData.Forms[0].Description = "Focused Assignment Task assignee runtime baseline.";

  const def = JSON.parse(nextData.Forms[0].DefResource);
  const baselineDef = buildBaseline(def);
  baselineDef.defkey = formKey;
  baselineDef.ProcModelListID = newProcModelId;
  baselineDef.AppListSetID = newRootId;
  baselineDef.ProcModelListSetID = newRootId;
  nextData.Forms[0].DefResource = JSON.stringify(baselineDef);

  writeWrappedYap(nextWrapper, nextResource, nextData, args.out);
  console.log(JSON.stringify({
    output: path.resolve(args.out),
    source: args.source,
    title,
    formKey,
    generatedPackageIgnoredByGit: true,
    assignmentTaskCount: baselineDef.childshapes.filter((shape) => shapeType(shape) === "MultiAssignmentTask").length,
    connectedWorkflow: "linear",
    firstRuntimeTask: "Static User Assignment",
    emailTask: "designer/open only unless explicit safe delivery is approved",
  }, null, 2));
}

main();
