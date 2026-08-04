#!/usr/bin/env node
const { parseCli } = require("./validate-ai-resource-wrapper.js");
try { parseCli("agent"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIA_VALIDATE_FAILED", message: error.message }, null, 2)); process.exit(1); }
