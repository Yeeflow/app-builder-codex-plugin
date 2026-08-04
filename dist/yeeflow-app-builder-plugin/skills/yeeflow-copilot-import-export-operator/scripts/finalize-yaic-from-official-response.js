#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../finalize-ai-resource-from-official-response.js"), path.resolve(__dirname, "../../../finalize-ai-resource-from-official-response.js"), path.resolve(__dirname, "../../finalize-ai-resource-from-official-response.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("finalize-ai-resource-from-official-response.js is missing from the plugin payload");
try { require(target).run("copilot"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIC_FINALIZATION_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
