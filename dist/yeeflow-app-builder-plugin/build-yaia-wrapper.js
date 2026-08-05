#!/usr/bin/env node
const { run } = require("./build-ai-resource-wrapper.js");
try { run("agent"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIA_BUILD_FAILED", message: error.message, report: error.report || null }, null, 2)); process.exit(1); }
