#!/usr/bin/env node
const { parseCli } = require("./validate-ai-resource-wrapper.js");
try { parseCli("copilot"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIC_VALIDATE_FAILED", message: error.message }, null, 2)); process.exit(1); }
