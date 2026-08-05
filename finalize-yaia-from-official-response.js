#!/usr/bin/env node
const { run } = require("./finalize-ai-resource-from-official-response.js");
try { run("agent"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIA_FINALIZATION_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
