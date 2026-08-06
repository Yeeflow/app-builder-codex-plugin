#!/usr/bin/env node

import {
  mergeDataListWorkflowLiveComponent,
  validateDataListWorkflowLiveReadback,
} from "./lib/data-list-workflow-live-merge.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const input = JSON.parse(await readStdin());
let output;
if (input.operation === "merge") {
  output = mergeDataListWorkflowLiveComponent(input);
} else if (input.operation === "validate-readback") {
  output = validateDataListWorkflowLiveReadback(input);
} else {
  const error = new Error("DATA_LIST_WORKFLOW_LIVE_OPERATION_INVALID: operation must be merge or validate-readback.");
  error.code = "DATA_LIST_WORKFLOW_LIVE_OPERATION_INVALID";
  throw error;
}
process.stdout.write(`${JSON.stringify(output)}\n`);
