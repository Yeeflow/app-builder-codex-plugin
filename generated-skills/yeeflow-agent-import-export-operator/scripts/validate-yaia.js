#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const candidates = [path.resolve(__dirname, "../../../../validate-ai-resource-wrapper.js"), path.resolve(__dirname, "../../../validate-ai-resource-wrapper.js"), path.resolve(__dirname, "../../validate-ai-resource-wrapper.js")];
const target = candidates.find((candidate) => candidate !== __filename && fs.existsSync(candidate));
if (!target) throw new Error("validate-ai-resource-wrapper.js is missing from the plugin payload");
try { require(target).parseCli("agent"); } catch (error) { console.log(JSON.stringify({ status: "fail", code: error.code || "YAIA_VALIDATE_FAILED", message: error.message }, null, 2)); process.exit(1); }
