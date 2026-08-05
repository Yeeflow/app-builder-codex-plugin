#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [path.resolve(here, "../../../../scripts/generate-scheduled-ywf-from-plan.mjs"), path.resolve(here, "../../../scripts/generate-scheduled-ywf-from-plan.mjs"), path.resolve(here, "../../scripts/generate-scheduled-ywf-from-plan.mjs")];
const target = candidates.find((candidate) => fs.existsSync(candidate));
if (!target) throw new Error("generate-scheduled-ywf-from-plan.mjs is missing from the plugin payload");
try { (await import(pathToFileURL(target).href)).main(); }
catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "SCHEDULED_YWF_GENERATION_FAILED", message: error.message, details: error.details || null, report: error.report || null }, null, 2)); process.exit(1); }
