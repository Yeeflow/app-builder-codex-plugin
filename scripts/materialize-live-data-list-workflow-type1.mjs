#!/usr/bin/env node

import { materializeDataListWorkflowLiveBundle } from "./lib/data-list-workflow-live-bundle.mjs";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const spec = JSON.parse(await readStdin());
process.stdout.write(`${JSON.stringify(materializeDataListWorkflowLiveBundle(spec))}\n`);
