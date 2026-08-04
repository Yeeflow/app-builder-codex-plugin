#!/usr/bin/env node
const { run } = require("./finalize-ai-resource-from-official-response.js");
try { run("copilot"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIC_FINALIZATION_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
