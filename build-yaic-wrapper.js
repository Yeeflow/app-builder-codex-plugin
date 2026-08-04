#!/usr/bin/env node
const { run } = require("./build-ai-resource-wrapper.js");
try { run("copilot"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIC_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
