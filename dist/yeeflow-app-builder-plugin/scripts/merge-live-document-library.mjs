#!/usr/bin/env node

import {
  mergeDocumentLibraryLiveCustomizations,
  prepareDocumentLibraryLiveBaseline,
  validateDocumentLibraryLiveReadback,
} from "./lib/document-library-live-merge.mjs";

const input = JSON.parse(await readStdin());
let output;
if (input.operation === "prepare-baseline") output = prepareDocumentLibraryLiveBaseline(input);
else if (input.operation === "merge-customizations") output = mergeDocumentLibraryLiveCustomizations(input);
else if (input.operation === "validate-readback") output = validateDocumentLibraryLiveReadback(input);
else throw Object.assign(new Error("DOCUMENT_LIBRARY_LIVE_OPERATION_INVALID: operation must be prepare-baseline, merge-customizations, or validate-readback."), { code: "DOCUMENT_LIBRARY_LIVE_OPERATION_INVALID" });
process.stdout.write(`${JSON.stringify(output)}\n`);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
