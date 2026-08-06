#!/usr/bin/env node

import { materializeDocumentLibraryLiveBundle } from "./lib/document-library-live-materializer.mjs";

const input = JSON.parse(await readStdin());
process.stdout.write(`${JSON.stringify(materializeDocumentLibraryLiveBundle(input))}\n`);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
